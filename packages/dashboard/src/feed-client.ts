import type { LegStatusMessage, ViewerFeedMessage } from "@hexapotamaus/brain/viewer-feed-messages";
import type { LegGeometry } from "@hexapotamaus/kinematics";
import type { LegPosition } from "@hexapotamaus/protocol";

export type FeedConnection = "connecting" | "connected" | "disconnected" | "closed";

/** One leg's newest status, and when it arrived (performance.now(), in ms). */
export type LegReport = Omit<LegStatusMessage, "type"> & { readonly receivedAt: number };

export interface FeedSnapshot {
  /** "disconnected" means waiting to try again; "closed" means the client was closed. */
  readonly connection: FeedConnection;
  /** The geometry the brain says to draw the legs with. Undefined until the brain says hello. */
  readonly geometry: LegGeometry | undefined;
  /** Every leg the current brain has reported. Kept while disconnected; cleared when a brain says hello. */
  readonly legs: Partial<Record<LegPosition, LegReport>>;
}

export interface FeedClient {
  /** The current snapshot. A new object whenever anything changes, so it works with useSyncExternalStore. */
  getSnapshot(): FeedSnapshot;
  /** Calls `listener` after every change. Returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;
  /** Disconnects and stops reconnecting. */
  close(): void;
}

export interface FeedClientOptions {
  /** The brain's feed, e.g. ws://localhost:8787. */
  url: string;
  /** How long to wait before trying again after the connection drops or fails. Default 1000 ms. */
  retryMs?: number;
}

/**
 * The viewer's connection to the brain's feed. It reconnects whenever the connection
 * drops, so a restarted brain is picked up without reloading the page.
 */
export function createFeedClient(options: FeedClientOptions): FeedClient {
  const retryMs = options.retryMs ?? 1000;
  const listeners = new Set<() => void>();
  let snapshot: FeedSnapshot = { connection: "connecting", geometry: undefined, legs: {} };
  let socket: WebSocket | undefined;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let closed = false;

  function update(change: Partial<FeedSnapshot>): void {
    snapshot = { ...snapshot, ...change };
    for (const listener of [...listeners]) listener();
  }

  function receive(message: ViewerFeedMessage): void {
    switch (message.type) {
      case "hello":
        update({ geometry: message.geometry, legs: {} });
        break;
      case "legStatus": {
        const { type: _, ...status } = message;
        update({ legs: { ...snapshot.legs, [status.leg]: { ...status, receivedAt: performance.now() } } });
        break;
      }
    }
  }

  function connect(): void {
    retry = undefined;
    update({ connection: "connecting" });
    const ws = new WebSocket(options.url);
    socket = ws;
    ws.addEventListener("open", () => update({ connection: "connected" }));
    ws.addEventListener("message", (event) => {
      let message: ViewerFeedMessage;
      try {
        message = JSON.parse(String(event.data));
      } catch {
        return; // not a feed message
      }
      receive(message);
    });
    // A failed connection fires "error" then "close"; a dropped one fires "close".
    ws.addEventListener("close", () => {
      if (socket !== ws || closed) return;
      socket = undefined;
      update({ connection: "disconnected" });
      retry = setTimeout(connect, retryMs);
    });
  }

  connect();
  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    close() {
      if (closed) return;
      closed = true;
      clearTimeout(retry);
      socket?.close();
      socket = undefined;
      update({ connection: "closed" });
    },
  };
}
