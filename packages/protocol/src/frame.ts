/** A classic CAN 2.0A data frame: an 11-bit ID and 0–8 data bytes. */
export interface CanFrame {
  readonly id: number;
  readonly data: Uint8Array;
}

export const MAX_STANDARD_ID = 0x7ff;
export const MAX_DATA_LENGTH = 8;

/**
 * "Send and receive frames": the only way the brain, the simulated leg and the
 * conformance suite touch a CAN bus. Implementations: the in-process bus here,
 * SocketCAN (vcan0, can0) in later slices.
 */
export interface FrameTransport {
  /** Puts a frame on the bus. Other nodes receive it; this transport doesn't. */
  send(frame: CanFrame): void;
  /** Calls `listener` for every frame another node sends. Returns an unsubscribe function. */
  onFrame(listener: (frame: CanFrame) => void): () => void;
  /** Detaches from the bus. Later sends throw. */
  close(): void;
}

export function assertCanFrame(frame: CanFrame): void {
  if (!Number.isInteger(frame.id) || frame.id < 0 || frame.id > MAX_STANDARD_ID) {
    throw new RangeError(`CAN ID ${frame.id} is not an 11-bit standard ID`);
  }
  if (frame.data.length > MAX_DATA_LENGTH) {
    throw new RangeError(`CAN frame has ${frame.data.length} data bytes; classic CAN allows at most 8`);
  }
}
