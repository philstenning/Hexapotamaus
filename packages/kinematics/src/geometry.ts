/**
 * A leg's geometry, measured joint axis to joint axis, in millimetres and degrees.
 * It is configuration, not code: a reprinted or calibrated leg changes these numbers.
 */
export interface LegGeometry {
  /** Coxa joint axis to femur joint axis. */
  readonly coxa: number;
  /** Femur joint axis to tibia joint axis. */
  readonly femur: number;
  /** Tibia joint axis to the foot tip, in a straight line. */
  readonly tibia: number;
  /**
   * How far the straight tibia-joint-to-foot line sits below the tibia's zero line,
   * in degrees. 0 for a straight tibia.
   */
  readonly tibiaOffset: number;
}

/** A point in a leg's frame, in millimetres. */
export interface Point3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/**
 * Checks that `value` is a usable leg geometry (for example, one read from a JSON
 * config file) and returns it. Throws a TypeError naming the first bad field.
 */
export function parseLegGeometry(value: unknown): LegGeometry {
  if (typeof value !== "object" || value === null) throw new TypeError("leg geometry must be an object");
  const record = value as Record<string, unknown>;
  const field = (name: keyof LegGeometry, check: (n: number) => boolean, rule: string): number => {
    const n = record[name];
    if (typeof n !== "number" || !Number.isFinite(n) || !check(n)) {
      throw new TypeError(`leg geometry ${name} must be ${rule}, not ${JSON.stringify(n)}`);
    }
    return n;
  };
  const positive = (n: number) => n > 0;
  return {
    coxa: field("coxa", (n) => n >= 0, "a length of 0 mm or more"),
    femur: field("femur", positive, "a positive length in mm"),
    tibia: field("tibia", positive, "a positive length in mm"),
    tibiaOffset: field("tibiaOffset", (n) => Math.abs(n) < 180, "an angle between −180° and 180°"),
  };
}
