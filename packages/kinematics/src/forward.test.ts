import { describe, expect, it } from "vitest";
import { forwardKinematics, type LegGeometry, type Point3 } from "./index.ts";

// The new leg (spec): coxa 50, femur 90, tibia 135, tibia offset 0°.
const leg: LegGeometry = { coxa: 50, femur: 90, tibia: 135, tibiaOffset: 0 };

function expectPoint(actual: Point3, expected: Point3): void {
  expect(actual.x).toBeCloseTo(expected.x, 9);
  expect(actual.y).toBeCloseTo(expected.y, 9);
  expect(actual.z).toBeCloseTo(expected.z, 9);
}

describe("forward kinematics", () => {
  it("lays the leg straight out along +x when every joint is at 0°", () => {
    const pose = forwardKinematics(leg, { coxa: 0, femur: 0, tibia: 0 });
    expectPoint(pose.coxaJoint, { x: 0, y: 0, z: 0 });
    expectPoint(pose.femurJoint, { x: 50, y: 0, z: 0 });
    expectPoint(pose.tibiaJoint, { x: 140, y: 0, z: 0 });
    expectPoint(pose.foot, { x: 275, y: 0, z: 0 });
  });

  it("swings the whole leg anticlockwise, seen from above, for a positive coxa angle", () => {
    const pose = forwardKinematics(leg, { coxa: 90, femur: 0, tibia: 0 });
    expectPoint(pose.femurJoint, { x: 0, y: 50, z: 0 });
    expectPoint(pose.foot, { x: 0, y: 275, z: 0 });
  });

  it("raises the femur for a positive femur angle", () => {
    const pose = forwardKinematics(leg, { coxa: 0, femur: 90, tibia: 0 });
    expectPoint(pose.tibiaJoint, { x: 50, y: 0, z: 90 });
    expectPoint(pose.foot, { x: 50, y: 0, z: 225 });
  });

  it("bends the foot down from the femur's line for a positive tibia angle", () => {
    expectPoint(forwardKinematics(leg, { coxa: 0, femur: 0, tibia: 90 }).foot, { x: 140, y: 0, z: -135 });
    // Femur straight up, knee bent 90°: the tibia points straight out.
    expectPoint(forwardKinematics(leg, { coxa: 0, femur: 90, tibia: 90 }).foot, { x: 185, y: 0, z: 90 });
  });

  it("combines all three joints", () => {
    // Coxa 30°, femur 30° up, knee bent 120°: the tibia points 90° down.
    // Femur joint at 50 out, tibia joint 90·cos30 further out and 45 up, foot 135 below it.
    const out = 50 + 90 * Math.sqrt(3) / 2; // 127.942…
    const pose = forwardKinematics(leg, { coxa: 30, femur: 30, tibia: 120 });
    expectPoint(pose.tibiaJoint, { x: out * Math.cos(Math.PI / 6), y: out * Math.sin(Math.PI / 6), z: 45 });
    // x = 50·cos30 + 90·cos²30 = 43.30127 + 67.5, y = 50·sin30 + 90·cos30·sin30 = 25 + 38.97114
    expect(pose.foot.x).toBeCloseTo(110.801_270, 5);
    expect(pose.foot.y).toBeCloseTo(63.971_143, 5);
    expect(pose.foot.z).toBeCloseTo(-90, 9);
  });

  it("puts the foot where the tibia offset says: the foot sits that far below the tibia's zero line", () => {
    const offsetLeg = { ...leg, tibiaOffset: 30 };
    // Tibia at −30° cancels a 30° offset, so the leg lies straight.
    expectPoint(forwardKinematics(offsetLeg, { coxa: 0, femur: 0, tibia: -30 }).foot, { x: 275, y: 0, z: 0 });
    // At 0° the foot hangs 30° below the femur's line; the tibia joint doesn't move.
    const pose = forwardKinematics(offsetLeg, { coxa: 0, femur: 0, tibia: 0 });
    expectPoint(pose.tibiaJoint, { x: 140, y: 0, z: 0 });
    expectPoint(pose.foot, { x: 140 + 135 * Math.cos(Math.PI / 6), y: 0, z: -67.5 });
  });

  it("uses the segment lengths it is given", () => {
    const pose = forwardKinematics({ coxa: 29, femur: 76, tibia: 106, tibiaOffset: 0 }, { coxa: 0, femur: 0, tibia: 90 });
    expectPoint(pose.tibiaJoint, { x: 105, y: 0, z: 0 });
    expectPoint(pose.foot, { x: 105, y: 0, z: -106 });
  });
});
