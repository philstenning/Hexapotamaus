import { describe, expect, it } from "vitest";
import {
  ProtocolError,
  FunctionCode,
  canId,
  parseCanId,
  decodeFrame,
  decodeJointSetpoint,
  decodeLegStatus,
  encodeJointSetpoint,
  encodeLegStatus,
  isNewerSequence,
  nextSequence,
  LegState,
  MAX_JOINT_ANGLE_DEG,
  type CanFrame,
  type JointSetpoint,
  type LegStatus,
} from "./index.ts";

const noSwitches = { coxaLimit: false, femurLimit: false, tibiaLimit: false, footContact: false };

function hex(frame: CanFrame): string {
  return [...frame.data].map((b) => b.toString(16).padStart(2, "0").toUpperCase()).join(" ");
}

describe("CAN IDs", () => {
  it("puts the function code above the node number", () => {
    expect(canId(FunctionCode.EmergencyStop, 0)).toBe(0x000);
    expect(canId(FunctionCode.JointSetpoint, 1)).toBe(0x011);
    expect(canId(FunctionCode.JointSetpoint, 6)).toBe(0x016);
    expect(canId(FunctionCode.Status, 1)).toBe(0x019);
  });

  it("splits an ID back into function and node", () => {
    expect(parseCanId(0x01e)).toEqual({ functionCode: FunctionCode.Status, node: 6 });
  });

  it("gives emergency stop the lowest ID and setpoints priority over status", () => {
    expect(canId(FunctionCode.EmergencyStop, 0)).toBeLessThan(canId(FunctionCode.JointSetpoint, 1));
    expect(canId(FunctionCode.JointSetpoint, 6)).toBeLessThan(canId(FunctionCode.Status, 1));
  });

  it("refuses node numbers and function codes that don't fit", () => {
    expect(() => canId(FunctionCode.Status, 8)).toThrow(RangeError);
    expect(() => canId(0x100, 1)).toThrow(RangeError);
  });
});

describe("joint setpoint frame", () => {
  const setpoint: JointSetpoint = {
    leg: 1,
    angles: { coxa: 10, femur: 15, tibia: -20 },
    sequence: 1,
  };

  it("matches the example in the protocol spec", () => {
    const frame = encodeJointSetpoint(setpoint);
    expect(frame.id).toBe(0x011);
    expect(hex(frame)).toBe("E8 03 DC 05 30 F8 01 00");
  });

  it("round-trips", () => {
    const value: JointSetpoint = { leg: 4, angles: { coxa: -45.67, femur: 0.01, tibia: 123.45 }, sequence: 40_000 };
    expect(decodeJointSetpoint(encodeJointSetpoint(value))).toEqual(value);
  });

  it("round-trips the angle limits", () => {
    const value: JointSetpoint = {
      leg: 2,
      angles: { coxa: MAX_JOINT_ANGLE_DEG, femur: -MAX_JOINT_ANGLE_DEG, tibia: 0 },
      sequence: 0,
    };
    expect(MAX_JOINT_ANGLE_DEG).toBe(327.67);
    expect(decodeJointSetpoint(encodeJointSetpoint(value))).toEqual(value);
  });

  it("rounds angles to the nearest 0.01°", () => {
    const frame = encodeJointSetpoint({ ...setpoint, angles: { coxa: 1.234, femur: 1.236, tibia: -1.236 } });
    expect(decodeJointSetpoint(frame).angles).toEqual({ coxa: 1.23, femur: 1.24, tibia: -1.24 });
  });

  it("refuses angles out of range instead of clamping them", () => {
    for (const bad of [327.68, -327.68, 400, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => encodeJointSetpoint({ ...setpoint, angles: { ...setpoint.angles, femur: bad } })).toThrow(RangeError);
    }
  });

  it("refuses sequence numbers outside 0–65535 and bad leg positions", () => {
    expect(() => encodeJointSetpoint({ ...setpoint, sequence: 65_536 })).toThrow(RangeError);
    expect(() => encodeJointSetpoint({ ...setpoint, sequence: -1 })).toThrow(RangeError);
    expect(() => encodeJointSetpoint({ ...setpoint, sequence: 1.5 })).toThrow(RangeError);
    expect(() => encodeJointSetpoint({ ...setpoint, leg: 7 as never })).toThrow(RangeError);
  });

  it("round-trips sequence numbers either side of the wrap", () => {
    for (const sequence of [65_534, 65_535, 0, 1]) {
      expect(decodeJointSetpoint(encodeJointSetpoint({ ...setpoint, sequence })).sequence).toBe(sequence);
    }
  });

  it("rejects malformed frames", () => {
    const good = encodeJointSetpoint(setpoint);
    expect(() => decodeJointSetpoint({ id: good.id, data: good.data.subarray(0, 7) })).toThrow(ProtocolError);
    expect(() => decodeJointSetpoint({ id: 0x019, data: good.data })).toThrow(ProtocolError);
    const reserved = Uint8Array.from(good.data);
    reserved[2] = 0x00;
    reserved[3] = 0x80; // femur = -32768, reserved
    expect(() => decodeJointSetpoint({ id: good.id, data: reserved })).toThrow(ProtocolError);
  });
});

describe("sequence numbers", () => {
  it("wrap from 65535 to 0", () => {
    expect(nextSequence(0)).toBe(1);
    expect(nextSequence(65_535)).toBe(0);
  });

  it("compare with serial number arithmetic across the wrap", () => {
    expect(isNewerSequence(1, 0)).toBe(true);
    expect(isNewerSequence(0, 65_535)).toBe(true);
    expect(isNewerSequence(10, 65_530)).toBe(true);
    expect(isNewerSequence(5, 5)).toBe(false);
    expect(isNewerSequence(4, 5)).toBe(false);
    expect(isNewerSequence(65_535, 0)).toBe(false);
    expect(isNewerSequence(32_767, 0)).toBe(true);
    expect(isNewerSequence(32_768, 0)).toBe(false);
  });
});

describe("status frame", () => {
  const status: LegStatus = {
    leg: 1,
    angles: { coxa: 10, femur: 15, tibia: -20 },
    state: LegState.Ready,
    switches: { ...noSwitches, footContact: true },
  };

  it("matches the example in the protocol spec", () => {
    const frame = encodeLegStatus(status);
    expect(frame.id).toBe(0x019);
    expect(hex(frame)).toBe("E8 03 DC 05 30 F8 01 08");
  });

  it("round-trips every state and switch", () => {
    for (const state of [LegState.Uncalibrated, LegState.Ready, LegState.Hold, LegState.Fault]) {
      for (const sw of ["coxaLimit", "femurLimit", "tibiaLimit", "footContact"] as const) {
        const value: LegStatus = { leg: 6, angles: { coxa: -1.5, femur: 90, tibia: -135.25 }, state, switches: { ...noSwitches, [sw]: true } };
        expect(decodeLegStatus(encodeLegStatus(value))).toEqual(value);
      }
    }
  });

  it("round-trips the angle limits and refuses angles beyond them", () => {
    const value: LegStatus = { ...status, angles: { coxa: -MAX_JOINT_ANGLE_DEG, femur: MAX_JOINT_ANGLE_DEG, tibia: 0 } };
    expect(decodeLegStatus(encodeLegStatus(value))).toEqual(value);
    expect(() => encodeLegStatus({ ...status, angles: { ...status.angles, tibia: -327.68 } })).toThrow(RangeError);
  });

  it("ignores reserved switch bits", () => {
    const frame = encodeLegStatus(status);
    const data = Uint8Array.from(frame.data);
    data[7] = 0xf8;
    expect(decodeLegStatus({ id: frame.id, data }).switches).toEqual({ ...noSwitches, footContact: true });
  });

  it("rejects reserved states and wrong lengths", () => {
    const frame = encodeLegStatus(status);
    const data = Uint8Array.from(frame.data);
    data[6] = 4;
    expect(() => decodeLegStatus({ id: frame.id, data })).toThrow(ProtocolError);
    expect(() => decodeLegStatus({ id: frame.id, data: frame.data.subarray(0, 6) })).toThrow(ProtocolError);
  });
});

describe("decodeFrame", () => {
  it("decodes setpoint and status frames by ID", () => {
    const setpoint: JointSetpoint = { leg: 3, angles: { coxa: 1, femur: 2, tibia: 3 }, sequence: 9 };
    expect(decodeFrame(encodeJointSetpoint(setpoint))).toEqual({ kind: "jointSetpoint", ...setpoint });
    const status: LegStatus = { leg: 3, angles: { coxa: 1, femur: 2, tibia: 3 }, state: LegState.Hold, switches: noSwitches };
    expect(decodeFrame(encodeLegStatus(status))).toEqual({ kind: "legStatus", ...status });
  });

  it("returns undefined for IDs this version doesn't define", () => {
    expect(decodeFrame({ id: 0x000, data: new Uint8Array(0) })).toBeUndefined();
    expect(decodeFrame({ id: 0x7ff, data: new Uint8Array(8) })).toBeUndefined();
    expect(decodeFrame({ id: canId(FunctionCode.JointSetpoint, 0), data: new Uint8Array(8) })).toBeUndefined();
  });

  it("throws for malformed frames with a known ID", () => {
    expect(() => decodeFrame({ id: 0x011, data: new Uint8Array(3) })).toThrow(ProtocolError);
  });
});
