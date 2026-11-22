import {
  ProtocolError,
  SETPOINT_PERIOD_MS,
  STATUS_PERIOD_MS,
  decodeLegStatus,
  encodeJointSetpoint,
  nextSequence,
  statusId,
  type CanFrame,
  type JointAngles,
  type LegPosition,
  type LegStatus,
} from "@hexapotamaus/protocol";
import type { LegConnection } from "./target.ts";

export interface ReceivedStatus {
  /** Clock time when the frame arrived. */
  at: number;
  status: LegStatus;
}

export interface SetpointStream {
  /** The angles sent from the next tick on. */
  setAngles(angles: JointAngles): void;
  /** The sequence number of the last setpoint sent. */
  readonly lastSequence: number;
  stop(): void;
}

/**
 * The suite's side of the bus: streams setpoints and records status frames.
 * It deliberately uses only the protocol package, not the brain, so a brain
 * bug can't hide a leg bug.
 */
export class LegDriver {
  readonly statuses: ReceivedStatus[] = [];
  readonly malformed: { frame: CanFrame; error: ProtocolError }[] = [];
  readonly #connection: LegConnection;
  readonly #leg: LegPosition;
  readonly #streams = new Set<SetpointStream>();
  readonly #unsubscribe: () => void;

  constructor(connection: LegConnection, leg: LegPosition) {
    this.#connection = connection;
    this.#leg = leg;
    const id = statusId(leg);
    this.#unsubscribe = connection.transport.onFrame((frame) => {
      if (frame.id !== id) return;
      try {
        this.statuses.push({ at: connection.clock.now(), status: decodeLegStatus(frame) });
      } catch (error) {
        if (!(error instanceof ProtocolError)) throw error;
        this.malformed.push({ frame, error });
      }
    });
  }

  get clock() {
    return this.#connection.clock;
  }

  latest(): LegStatus | undefined {
    return this.statuses.at(-1)?.status;
  }

  statusesSince(time: number): ReceivedStatus[] {
    return this.statuses.filter((s) => s.at >= time);
  }

  send(frame: CanFrame): void {
    this.#connection.transport.send(frame);
  }

  /** Sends a setpoint now and then every 20 ms, as the brain does. */
  stream(angles: JointAngles, firstSequence = 0): SetpointStream {
    let current = angles;
    let sequence = firstSequence;
    let last = firstSequence;
    const tick = () => {
      this.send(encodeJointSetpoint({ leg: this.#leg, angles: current, sequence }));
      last = sequence;
      sequence = nextSequence(sequence);
    };
    tick();
    const cancel = this.clock.setInterval(tick, SETPOINT_PERIOD_MS);
    const stream: SetpointStream = {
      setAngles: (next) => (current = next),
      get lastSequence() {
        return last;
      },
      stop: () => {
        cancel();
        this.#streams.delete(stream);
      },
    };
    this.#streams.add(stream);
    return stream;
  }

  /** Waits, status frame by status frame, until `predicate` holds. Throws after `timeoutMs`. */
  async waitFor(what: string, predicate: (status: LegStatus) => boolean, timeoutMs: number): Promise<LegStatus> {
    const deadline = this.clock.now() + timeoutMs;
    for (;;) {
      const status = this.latest();
      if (status && predicate(status)) return status;
      if (this.clock.now() >= deadline) {
        throw new Error(`timed out after ${timeoutMs} ms waiting for ${what}; last status: ${JSON.stringify(status)}`);
      }
      await this.clock.sleep(STATUS_PERIOD_MS);
    }
  }

  async waitForStatus(timeoutMs = 500): Promise<LegStatus> {
    return this.waitFor("a status frame", () => true, timeoutMs);
  }

  close(): void {
    for (const stream of [...this.#streams]) stream.stop();
    this.#unsubscribe();
  }
}
