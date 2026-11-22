import {
  ProtocolError,
  LegState,
  SEQUENCE_RESYNC_MS,
  SETPOINT_PERIOD_MS,
  STATUS_PERIOD_MS,
  decodeJointSetpoint,
  encodeLegStatus,
  isNewerSequence,
  jointSetpointId,
  type CanFrame,
  type Clock,
  type FrameTransport,
  type JointAngles,
  type LegPosition,
} from "@hexapotamaus/protocol";

export interface SimulatedLegOptions {
  /** The leg's node on the bus. */
  transport: FrameTransport;
  clock: Clock;
  leg: LegPosition;
  /** Where the joints are at power-on. Default: all 0°. */
  initialAngles?: JointAngles;
  /** The fastest any joint moves. Default 180°/s, a little under an LX-16A at 7.4 V. */
  maxJointSpeedDegPerS?: number;
  /** How often the simulated leg controller updates its joints. Default 5 ms. */
  controlPeriodMs?: number;
}

export interface SimulatedLeg {
  /** Detaches the leg from the bus and stops its timers. */
  stop(): void;
}

export const DEFAULT_MAX_JOINT_SPEED_DEG_PER_S = 180;

const JOINTS = ["coxa", "femur", "tibia"] as const;
type Joint = (typeof JOINTS)[number];
type Mutable<T> = { -readonly [K in keyof T]: T[K] };

/**
 * A software stand-in for one leg and its leg controller, speaking the CAN
 * protocol in docs/protocol.md (version 0.1): it follows joint setpoints
 * smoothly and reports status at 50 Hz.
 */
export function startSimulatedLeg(options: SimulatedLegOptions): SimulatedLeg {
  const { transport, clock, leg } = options;
  const maxSpeed = (options.maxJointSpeedDegPerS ?? DEFAULT_MAX_JOINT_SPEED_DEG_PER_S) / 1000; // °/ms
  const controlPeriodMs = options.controlPeriodMs ?? 5;
  const setpointId = jointSetpointId(leg);

  const angles: Mutable<JointAngles> = { coxa: 0, femur: 0, tibia: 0, ...options.initialAngles };
  const target: Mutable<JointAngles> = { ...angles };
  const speed: Record<Joint, number> = { coxa: 0, femur: 0, tibia: 0 };
  let lastSequence: number | undefined;
  let lastAcceptedAt = -Infinity;
  let lastControlAt = clock.now();

  function onSetpoint(frame: CanFrame): void {
    if (frame.id !== setpointId) return;
    let setpoint;
    try {
      setpoint = decodeJointSetpoint(frame);
    } catch (error) {
      if (error instanceof ProtocolError) return;
      throw error;
    }
    const now = clock.now();
    const resync = now - lastAcceptedAt > SEQUENCE_RESYNC_MS;
    if (lastSequence !== undefined && !resync && !isNewerSequence(setpoint.sequence, lastSequence)) return;
    lastSequence = setpoint.sequence;
    lastAcceptedAt = now;
    for (const joint of JOINTS) {
      target[joint] = setpoint.angles[joint];
      // Arrive about one setpoint period from now, but never faster than the joint can go.
      speed[joint] = Math.min(maxSpeed, Math.abs(target[joint] - angles[joint]) / SETPOINT_PERIOD_MS);
    }
  }

  function control(): void {
    const now = clock.now();
    const dt = now - lastControlAt;
    lastControlAt = now;
    for (const joint of JOINTS) {
      const remaining = target[joint] - angles[joint];
      const step = speed[joint] * dt;
      angles[joint] = Math.abs(remaining) <= step ? target[joint] : angles[joint] + Math.sign(remaining) * step;
    }
  }

  function reportStatus(): void {
    transport.send(
      encodeLegStatus({
        leg,
        angles,
        state: LegState.Ready,
        switches: { coxaLimit: false, femurLimit: false, tibiaLimit: false, footContact: false },
      }),
    );
  }

  const unsubscribe = transport.onFrame(onSetpoint);
  const stopControl = clock.setInterval(control, controlPeriodMs);
  const stopStatus = clock.setInterval(reportStatus, STATUS_PERIOD_MS);

  return {
    stop() {
      stopStatus();
      stopControl();
      unsubscribe();
      transport.close();
    },
  };
}
