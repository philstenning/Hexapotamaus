import { describe, expect, it } from "vitest";
import { ManualClock, createInProcessBus, type JointAngles, type LegStatus } from "@hexapotamaus/protocol";
import { startSimulatedLeg } from "@hexapotamaus/sim";
import { startControlLoop, startStatusMonitor } from "./index.ts";

// The first end-to-end path: brain → in-process bus → simulated leg → status back to the brain.

const JOINTS = ["coxa", "femur", "tibia"] as const;
const error = (status: LegStatus | undefined, target: JointAngles) =>
  status ? Math.max(...JOINTS.map((j) => Math.abs(status.angles[j] - target[j]))) : Infinity;

describe("brain streaming setpoints to the simulated leg", () => {
  it("makes the reported joint angles converge on the setpoints", async () => {
    const bus = createInProcessBus();
    const clock = new ManualClock();
    startSimulatedLeg({ transport: bus.connect(), clock, leg: 1 });
    const brain = bus.connect();
    const monitor = startStatusMonitor(brain);

    let target: JointAngles = { coxa: 20, femur: -30, tibia: 45 };
    startControlLoop({ transport: brain, clock, setpoints: () => ({ 1: target }) });

    await clock.sleep(100);
    expect(error(monitor.latest(1), target)).toBeGreaterThan(5); // still on its way: smoothed, not a jump
    await clock.sleep(400);
    expect(error(monitor.latest(1), target)).toBeLessThanOrEqual(0.01);

    target = { coxa: -15, femur: 10, tibia: 60 };
    await clock.sleep(500);
    expect(error(monitor.latest(1), target)).toBeLessThanOrEqual(0.01);
  });

  it("tracks a smoothly moving setpoint closely", async () => {
    const bus = createInProcessBus();
    const clock = new ManualClock();
    startSimulatedLeg({ transport: bus.connect(), clock, leg: 3 });
    const brain = bus.connect();
    const monitor = startStatusMonitor(brain);

    // A 1 Hz, ±20° sweep on every joint: at most ~126°/s, inside the leg's 180°/s.
    const sweep = (t: number): JointAngles => {
      const a = 20 * Math.sin((2 * Math.PI * t) / 1000);
      return { coxa: a, femur: -a, tibia: a / 2 };
    };
    const lag: number[] = [];
    startControlLoop({ transport: brain, clock, setpoints: (now) => ({ 3: sweep(now) }) });
    monitor.onStatus((s) => {
      if (clock.now() > 200) lag.push(error(s, sweep(clock.now() - 20)));
    });
    await clock.sleep(3000);
    // Following one setpoint period behind, the leg stays within a few tenths of a degree.
    expect(Math.max(...lag)).toBeLessThan(0.5);
  });
});
