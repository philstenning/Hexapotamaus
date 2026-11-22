import type { CanFrame } from "./frame.ts";
import { FunctionCode, assertLegPosition, canId, isLegPosition, parseCanId, type LegPosition } from "./ids.ts";

/** A frame with a known ID that breaks the protocol spec. Receivers ignore such frames. */
export class ProtocolError extends Error {
  override name = "ProtocolError";
}

/** Joint angles in degrees, always in this order on the wire. */
export interface JointAngles {
  readonly coxa: number;
  readonly femur: number;
  readonly tibia: number;
}

export interface JointSetpoint {
  readonly leg: LegPosition;
  readonly angles: JointAngles;
  /** 0–65535, wrapping. */
  readonly sequence: number;
}

export const LegState = {
  Uncalibrated: 0,
  Ready: 1,
  Hold: 2,
  Fault: 3,
} as const;
export type LegState = (typeof LegState)[keyof typeof LegState];

export interface SwitchStates {
  readonly coxaLimit: boolean;
  readonly femurLimit: boolean;
  readonly tibiaLimit: boolean;
  readonly footContact: boolean;
}

export interface LegStatus {
  readonly leg: LegPosition;
  /** The leg's actual joint angles. */
  readonly angles: JointAngles;
  readonly state: LegState;
  readonly switches: SwitchStates;
}

export type Message = ({ kind: "jointSetpoint" } & JointSetpoint) | ({ kind: "legStatus" } & LegStatus);

const ANGLE_STEPS_PER_DEG = 100;
const MAX_RAW_ANGLE = 32_767;
const RESERVED_RAW_ANGLE = -32_768;
export const MAX_JOINT_ANGLE_DEG = MAX_RAW_ANGLE / ANGLE_STEPS_PER_DEG;
export const SEQUENCE_MODULUS = 0x1_0000;
const FRAME_LENGTH = 8;

export function jointSetpointId(leg: LegPosition): number {
  assertLegPosition(leg);
  return canId(FunctionCode.JointSetpoint, leg);
}

export function statusId(leg: LegPosition): number {
  assertLegPosition(leg);
  return canId(FunctionCode.Status, leg);
}

export function nextSequence(sequence: number): number {
  return (sequence + 1) % SEQUENCE_MODULUS;
}

/** Serial number arithmetic: true when `candidate` is 1–32767 steps after `last`, modulo 65536. */
export function isNewerSequence(candidate: number, last: number): boolean {
  const diff = (candidate - last + SEQUENCE_MODULUS) % SEQUENCE_MODULUS;
  return diff >= 1 && diff < SEQUENCE_MODULUS / 2;
}

export function encodeJointSetpoint(setpoint: JointSetpoint): CanFrame {
  const { sequence } = setpoint;
  if (!Number.isInteger(sequence) || sequence < 0 || sequence >= SEQUENCE_MODULUS) {
    throw new RangeError(`sequence number ${sequence} is not 0–65535`);
  }
  const data = new Uint8Array(FRAME_LENGTH);
  const view = new DataView(data.buffer);
  writeAngles(view, setpoint.angles);
  view.setUint16(6, sequence, true);
  return { id: jointSetpointId(setpoint.leg), data };
}

export function decodeJointSetpoint(frame: CanFrame): JointSetpoint {
  const leg = expectFrame(frame, FunctionCode.JointSetpoint, "joint setpoint");
  const view = viewOf(frame);
  return { leg, angles: readAngles(view), sequence: view.getUint16(6, true) };
}

export function encodeLegStatus(status: LegStatus): CanFrame {
  const data = new Uint8Array(FRAME_LENGTH);
  const view = new DataView(data.buffer);
  writeAngles(view, status.angles);
  if (!isLegState(status.state)) throw new RangeError(`leg state ${status.state} is not defined`);
  view.setUint8(6, status.state);
  const { coxaLimit, femurLimit, tibiaLimit, footContact } = status.switches;
  view.setUint8(7, (+coxaLimit << 0) | (+femurLimit << 1) | (+tibiaLimit << 2) | (+footContact << 3));
  return { id: statusId(status.leg), data };
}

export function decodeLegStatus(frame: CanFrame): LegStatus {
  const leg = expectFrame(frame, FunctionCode.Status, "status");
  const view = viewOf(frame);
  const state = view.getUint8(6);
  if (!isLegState(state)) throw new ProtocolError(`status frame has reserved leg state ${state}`);
  const bits = view.getUint8(7);
  return {
    leg,
    angles: readAngles(view),
    state,
    switches: {
      coxaLimit: (bits & 0b0001) !== 0,
      femurLimit: (bits & 0b0010) !== 0,
      tibiaLimit: (bits & 0b0100) !== 0,
      footContact: (bits & 0b1000) !== 0,
    },
  };
}

/**
 * Decodes any frame this protocol version defines. Returns undefined for IDs
 * it doesn't define, and throws ProtocolError for a malformed frame with a
 * known ID.
 */
export function decodeFrame(frame: CanFrame): Message | undefined {
  const { functionCode, node } = parseCanId(frame.id);
  if (!isLegPosition(node)) return undefined;
  switch (functionCode) {
    case FunctionCode.JointSetpoint:
      return { kind: "jointSetpoint", ...decodeJointSetpoint(frame) };
    case FunctionCode.Status:
      return { kind: "legStatus", ...decodeLegStatus(frame) };
    default:
      return undefined;
  }
}

function isLegState(value: number): value is LegState {
  return Number.isInteger(value) && value >= LegState.Uncalibrated && value <= LegState.Fault;
}

function expectFrame(frame: CanFrame, functionCode: number, name: string): LegPosition {
  const { functionCode: actual, node } = parseCanId(frame.id);
  if (actual !== functionCode || !isLegPosition(node)) {
    throw new ProtocolError(`ID 0x${frame.id.toString(16).padStart(3, "0")} is not a ${name} frame`);
  }
  if (frame.data.length !== FRAME_LENGTH) {
    throw new ProtocolError(`${name} frame has ${frame.data.length} data bytes, expected ${FRAME_LENGTH}`);
  }
  return node;
}

function viewOf(frame: CanFrame): DataView {
  return new DataView(frame.data.buffer, frame.data.byteOffset, frame.data.byteLength);
}

function encodeAngle(name: string, degrees: number): number {
  const raw = Math.round(degrees * ANGLE_STEPS_PER_DEG);
  if (!Number.isFinite(raw) || raw > MAX_RAW_ANGLE || raw < -MAX_RAW_ANGLE) {
    throw new RangeError(`${name} joint angle ${degrees}° is outside ±${MAX_JOINT_ANGLE_DEG}°`);
  }
  return raw;
}

function decodeAngle(name: string, raw: number): number {
  if (raw === RESERVED_RAW_ANGLE) throw new ProtocolError(`${name} joint angle uses the reserved value 0x8000`);
  return raw / ANGLE_STEPS_PER_DEG;
}

function writeAngles(view: DataView, angles: JointAngles): void {
  view.setInt16(0, encodeAngle("coxa", angles.coxa), true);
  view.setInt16(2, encodeAngle("femur", angles.femur), true);
  view.setInt16(4, encodeAngle("tibia", angles.tibia), true);
}

function readAngles(view: DataView): JointAngles {
  return {
    coxa: decodeAngle("coxa", view.getInt16(0, true)),
    femur: decodeAngle("femur", view.getInt16(2, true)),
    tibia: decodeAngle("tibia", view.getInt16(4, true)),
  };
}
