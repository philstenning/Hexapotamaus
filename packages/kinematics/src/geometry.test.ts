import { describe, expect, it } from "vitest";
import { parseLegGeometry } from "./index.ts";

describe("leg geometry configuration", () => {
  it("accepts the new leg's geometry", () => {
    const config = JSON.parse('{ "coxa": 50, "femur": 90, "tibia": 135, "tibiaOffset": 0 }');
    expect(parseLegGeometry(config)).toEqual({ coxa: 50, femur: 90, tibia: 135, tibiaOffset: 0 });
  });

  it("drops fields that aren't geometry", () => {
    expect(parseLegGeometry({ coxa: 0, femur: 90, tibia: 135, tibiaOffset: -12.5, note: "reprint" })).toEqual({
      coxa: 0,
      femur: 90,
      tibia: 135,
      tibiaOffset: -12.5,
    });
  });

  it.each([
    ["not an object", 42, /must be an object/],
    ["a missing field", { coxa: 50, femur: 90, tibia: 135 }, /tibiaOffset/],
    ["a length as a string", { coxa: 50, femur: "90", tibia: 135, tibiaOffset: 0 }, /femur/],
    ["a zero tibia", { coxa: 50, femur: 90, tibia: 0, tibiaOffset: 0 }, /tibia must be a positive length/],
    ["a negative coxa", { coxa: -1, femur: 90, tibia: 135, tibiaOffset: 0 }, /coxa/],
    ["a non-finite length", { coxa: 50, femur: Infinity, tibia: 135, tibiaOffset: 0 }, /femur/],
    ["an offset of a half turn", { coxa: 50, femur: 90, tibia: 135, tibiaOffset: 180 }, /tibiaOffset/],
  ])("rejects %s, naming the field", (_, config, message) => {
    expect(() => parseLegGeometry(config)).toThrow(message);
  });
});
