import { ProtocolError, decodeFrame, type FrameTransport, type LegPosition, type LegStatus } from "@hexapotamaus/protocol";

export interface StatusMonitor {
  /** The newest status frame from `leg`, if any has arrived. */
  latest(leg: LegPosition): LegStatus | undefined;
  /** Calls `listener` for every status frame. Returns an unsubscribe function. */
  onStatus(listener: (status: LegStatus) => void): () => void;
  stop(): void;
}

/** Watches the bus for leg status frames. Malformed frames are ignored, as the protocol requires. */
export function startStatusMonitor(transport: FrameTransport): StatusMonitor {
  const latest = new Map<LegPosition, LegStatus>();
  const listeners = new Set<(status: LegStatus) => void>();
  const unsubscribe = transport.onFrame((frame) => {
    let message;
    try {
      message = decodeFrame(frame);
    } catch (error) {
      if (error instanceof ProtocolError) return;
      throw error;
    }
    if (message?.kind !== "legStatus") return;
    const { kind: _, ...status } = message;
    latest.set(status.leg, status);
    for (const listener of [...listeners]) listener(status);
  });
  return {
    latest: (leg) => latest.get(leg),
    onStatus(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    stop() {
      unsubscribe();
      listeners.clear();
    },
  };
}
