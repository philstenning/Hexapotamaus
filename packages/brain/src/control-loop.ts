import {
  LEG_POSITIONS,
  SETPOINT_PERIOD_MS,
  encodeJointSetpoint,
  nextSequence,
  type Clock,
  type FrameTransport,
  type JointAngles,
  type LegPosition,
} from "@hexapotamaus/protocol";

export type LegSetpoints = Partial<Record<LegPosition, JointAngles>>;

export interface ControlLoopOptions {
  transport: FrameTransport;
  clock: Clock;
  /**
   * Called once per tick. Returns the joint angles each leg should be at now.
   * A leg left out gets no setpoint this tick.
   */
  setpoints: (now: number) => LegSetpoints;
  /** Default 20 ms (50 Hz), as the protocol expects. */
  periodMs?: number;
  /** The first sequence number sent to each leg. Default 0. */
  firstSequence?: number;
  /** Called when a tick fails (e.g. an angle out of range): the failing legs get no frame that tick. Default: console.error. */
  onError?: (error: unknown) => void;
}

export interface ControlLoop {
  stop(): void;
}

/** The brain's fixed-rate loop: one joint setpoint frame per leg per tick, each leg with its own sequence number. */
export function startControlLoop(options: ControlLoopOptions): ControlLoop {
  const { transport, clock } = options;
  const onError = options.onError ?? ((error) => console.error("control loop:", error));
  const sequences = new Map<LegPosition, number>(LEG_POSITIONS.map((leg) => [leg, options.firstSequence ?? 0]));

  function tick(): void {
    let setpoints: LegSetpoints;
    try {
      setpoints = options.setpoints(clock.now());
    } catch (error) {
      onError(error);
      return;
    }
    for (const leg of LEG_POSITIONS) {
      const angles = setpoints[leg];
      if (!angles) continue;
      const sequence = sequences.get(leg) ?? 0;
      try {
        transport.send(encodeJointSetpoint({ leg, angles, sequence }));
        sequences.set(leg, nextSequence(sequence));
      } catch (error) {
        onError(error);
      }
    }
  }

  tick();
  const cancel = clock.setInterval(tick, options.periodMs ?? SETPOINT_PERIOD_MS);
  return { stop: cancel };
}
