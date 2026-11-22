import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import { Quaternion, Vector3 } from "three";
import { forwardKinematics, type LegGeometry, type Point3 } from "@hexapotamaus/kinematics";
import type { LegReport } from "./feed-client.ts";
import { STATE_STYLES } from "./leg-state-styles.ts";

const TRIPPED = "#ef4444";
const FOOT_CONTACT = "#22d3ee";
const SILENT = "#64748b";
const UNTRIPPED = "#e2e8f0";
/**
 * Roughly where the ground is in the spec's default stance, 110 mm below the femur joint.
 * Only a visual reference until the rig layout arrives (slice 12).
 */
const GROUND_Z = -110;

interface LegSceneProps {
  geometry: LegGeometry;
  report: LegReport;
  /** False when the feed has dropped or the leg has gone quiet: the leg is drawn grey. */
  live: boolean;
}

/**
 * The leg in 3D, drawn with forward kinematics from its reported joint angles. The
 * leg's frame is z-up; three.js is y-up, so the scene turns it to match.
 */
export function LegScene({ geometry, report, live }: LegSceneProps) {
  const pose = forwardKinematics(geometry, report.angles);
  const { switches } = report;
  const segmentColor = live ? STATE_STYLES[report.state].color : SILENT;
  const jointColor = (tripped: boolean) => (tripped ? TRIPPED : UNTRIPPED);

  return (
    <Canvas camera={{ position: [130, 120, 380], fov: 45, near: 1, far: 5000 }}>
      <color attach="background" args={["#020617"]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[200, 400, 300]} intensity={1.6} />
      <OrbitControls target={[110, -40, 0]} makeDefault />
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <axesHelper args={[40]} />
        {/* The body side of the coxa joint. */}
        <mesh position={[-25, 0, 0]}>
          <boxGeometry args={[40, 60, 30]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        <gridHelper args={[600, 30, "#334155", "#1e293b"]} position={[100, 0, GROUND_Z]} rotation={[Math.PI / 2, 0, 0]} />

        <Segment from={pose.coxaJoint} to={pose.femurJoint} radius={9} color={segmentColor} />
        <Segment from={pose.femurJoint} to={pose.tibiaJoint} radius={7} color={segmentColor} />
        <Segment from={pose.tibiaJoint} to={pose.foot} radius={5} color={segmentColor} />

        <Ball at={pose.coxaJoint} radius={12} color={jointColor(switches.coxaLimit)} />
        <Ball at={pose.femurJoint} radius={11} color={jointColor(switches.femurLimit)} />
        <Ball at={pose.tibiaJoint} radius={9} color={jointColor(switches.tibiaLimit)} />
        <Ball at={pose.foot} radius={6} color={switches.footContact ? FOOT_CONTACT : UNTRIPPED} />
      </group>
    </Canvas>
  );
}

/** A sphere marking a joint or the foot. */
function Ball({ at, radius, color }: { at: Point3; radius: number; color: string }) {
  return (
    <mesh position={[at.x, at.y, at.z]}>
      <sphereGeometry args={[radius, 24, 16]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

const UP = new Vector3(0, 1, 0);

/** A cylinder from one point to another. */
function Segment({ from, to, radius, color }: { from: Point3; to: Point3; radius: number; color: string }) {
  const { midpoint, rotation, length } = useMemo(() => {
    const a = new Vector3(from.x, from.y, from.z);
    const b = new Vector3(to.x, to.y, to.z);
    const direction = b.clone().sub(a);
    const length = direction.length();
    return {
      midpoint: a.add(b).multiplyScalar(0.5),
      rotation: new Quaternion().setFromUnitVectors(UP, length > 0 ? direction.normalize() : UP),
      length,
    };
  }, [from.x, from.y, from.z, to.x, to.y, to.z]);
  if (length === 0) return null;
  return (
    <mesh position={midpoint} quaternion={rotation}>
      <cylinderGeometry args={[radius, radius, length, 20]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
