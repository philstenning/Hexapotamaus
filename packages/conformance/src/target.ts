import type { Clock, FrameTransport, JointAngles, LegPosition } from "@hexapotamaus/protocol";

/** An open connection to the bus a leg is on, from the brain's side. */
export interface LegConnection {
  /** A node on the leg's bus. The suite sends and receives every frame through it. */
  transport: FrameTransport;
  /** The clock the leg runs on: simulated time for an in-process leg, real time for a real bus. */
  clock: Clock;
  close(): void | Promise<void>;
}

/**
 * A leg the conformance suite can test, and how to reach it. The same suite
 * runs against the simulated leg on the in-process bus, the simulated leg on
 * vcan0 and the real leg on can0: only the target changes.
 */
export interface LegTarget {
  /** Shown in the test names, e.g. "simulated leg, in-process bus". */
  name: string;
  /** The leg position (CAN node) of the leg under test. */
  leg: LegPosition;
  /** Opens a connection. Called before every test; `close` is called after it. */
  connect(): LegConnection | Promise<LegConnection>;
  /** The leg controller's maximum joint speed. */
  maxJointSpeedDegPerS: number;
  /**
   * Two poses the suite moves the leg between. They must be safe for the leg
   * and at least 15° apart on some joint. Defaults: small angles around 0°.
   */
  poses?: readonly [JointAngles, JointAngles];
}
