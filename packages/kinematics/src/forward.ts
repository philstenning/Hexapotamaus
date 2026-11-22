import type { LegGeometry, Point3 } from "./geometry.ts";

/** Joint angles in degrees. The same shape as the protocol's JointAngles. */
export interface JointAngles {
  readonly coxa: number;
  readonly femur: number;
  readonly tibia: number;
}

/** Where each joint and the foot are, in the leg's frame. */
export interface LegPose {
  readonly coxaJoint: Point3;
  readonly femurJoint: Point3;
  readonly tibiaJoint: Point3;
  readonly foot: Point3;
}

const RAD_PER_DEG = Math.PI / 180;

/**
 * Forward kinematics: where the leg's joints and foot are for the given joint angles.
 *
 * The leg's frame and the joint angle convention (see docs/kinematics.md):
 * - Origin on the coxa joint axis, at the height of the femur joint axis. z is up;
 *   x points out along the coxa when the coxa joint is at 0°; y completes a
 *   right-handed frame.
 * - Coxa: positive turns the leg anticlockwise seen from above.
 * - Femur: the femur's angle above horizontal; positive raises it.
 * - Tibia: the tibia's angle from the femur's line; 0° is straight on, positive
 *   bends the foot down. The tibia offset adds to it.
 *
 * Every joint at 0° lays the leg straight out along +x.
 */
export function forwardKinematics(geometry: LegGeometry, angles: JointAngles): LegPose {
  const yaw = angles.coxa * RAD_PER_DEG;
  const femurElevation = angles.femur * RAD_PER_DEG;
  const tibiaElevation = (angles.femur - angles.tibia - geometry.tibiaOffset) * RAD_PER_DEG;

  // Work in the vertical plane the coxa points along: r is the distance out from the coxa axis.
  const femurR = geometry.coxa;
  const tibiaR = femurR + geometry.femur * Math.cos(femurElevation);
  const tibiaZ = geometry.femur * Math.sin(femurElevation);
  const footR = tibiaR + geometry.tibia * Math.cos(tibiaElevation);
  const footZ = tibiaZ + geometry.tibia * Math.sin(tibiaElevation);

  const inPlane = (r: number, z: number): Point3 => ({ x: r * Math.cos(yaw), y: r * Math.sin(yaw), z });
  return {
    coxaJoint: { x: 0, y: 0, z: 0 },
    femurJoint: inPlane(femurR, 0),
    tibiaJoint: inPlane(tibiaR, tibiaZ),
    foot: inPlane(footR, footZ),
  };
}
