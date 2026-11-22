import { describe, expect, it } from "vitest";
import {
  ManualClock,
  createInProcessBus,
  decodeLegStatus,
  encodeJointSetpoint,
  statusId,
  type LegStatus,
} from "@hexapotamaus/protocol";
import { startSimulatedLeg } from "./index.ts";

// The protocol behaviour is covered by the conformance suite (packages/conformance).
// These tests cover the simulated leg's own options.

function rig(options: { initialAngles?: { coxa: number; femur: number; tibia: number }; maxJointSpeedDegPerS?: number }) {
  const bus = createInProcessBus();
  const clock = new ManualClock();
  const brain = bus.connect();
  const statuses: LegStatus[] = [];
  brain.onFrame((frame) => {
    if (frame.id === statusId(2)) statuses.push(decodeLegStatus(frame));
  });
  const leg = startSimulatedLeg({ transport: bus.connect(), clock, leg: 2, ...options });
  return { clock, brain, statuses, leg };
}

describe("simulated leg", () => {
  it("starts at its initial joint angles", async () => {
    const { clock, statuses } = rig({ initialAngles: { coxa: 5, femur: -10, tibia: 20 } });
    await clock.sleep(20);
    expect(statuses.at(-1)?.angles).toEqual({ coxa: 5, femur: -10, tibia: 20 });
  });

  it("moves no faster than its configured maximum joint speed", async () => {
    const { clock, brain, statuses } = rig({ maxJointSpeedDegPerS: 50 });
    brain.send(encodeJointSetpoint({ leg: 2, angles: { coxa: 0, femur: 90, tibia: 0 }, sequence: 0 }));
    await clock.sleep(1000);
    expect(statuses.at(-1)?.angles.femur).toBeCloseTo(50, 1);
  });

  it("stops sending once stopped", async () => {
    const { clock, statuses, leg } = rig({});
    await clock.sleep(100);
    leg.stop();
    const count = statuses.length;
    await clock.sleep(100);
    expect(statuses.length).toBe(count);
  });
});
