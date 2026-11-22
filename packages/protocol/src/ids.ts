/** Function codes: the top 8 bits of an 11-bit CAN ID. Lower is higher priority. See docs/protocol.md. */
export const FunctionCode = {
  EmergencyStop: 0x00,
  FaultReport: 0x01,
  JointSetpoint: 0x02,
  Status: 0x03,
  Command: 0x04,
  CommandReply: 0x05,
} as const;
export type FunctionCode = (typeof FunctionCode)[keyof typeof FunctionCode];

/** A leg's position on the body, 1–6. It is also the leg's CAN node number. */
export type LegPosition = 1 | 2 | 3 | 4 | 5 | 6;

export const BROADCAST_NODE = 0;
export const LEG_POSITIONS: readonly LegPosition[] = [1, 2, 3, 4, 5, 6];

export function isLegPosition(value: number): value is LegPosition {
  return Number.isInteger(value) && value >= 1 && value <= 6;
}

export function assertLegPosition(value: number): asserts value is LegPosition {
  if (!isLegPosition(value)) throw new RangeError(`leg position ${value} is not 1–6`);
}

export function canId(functionCode: number, node: number): number {
  if (!Number.isInteger(functionCode) || functionCode < 0 || functionCode > 0xff) {
    throw new RangeError(`function code ${functionCode} doesn't fit in 8 bits`);
  }
  if (!Number.isInteger(node) || node < 0 || node > 7) {
    throw new RangeError(`node ${node} doesn't fit in 3 bits`);
  }
  return (functionCode << 3) | node;
}

export function parseCanId(id: number): { functionCode: number; node: number } {
  return { functionCode: (id >> 3) & 0xff, node: id & 0x7 };
}
