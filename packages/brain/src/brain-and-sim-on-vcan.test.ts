import { spawn, type ChildProcess } from "node:child_process";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { socketCanProblem, lockCanInterface } from "@hexapotamaus/socketcan";

// Slice 02's end-to-end path, with the brain and the simulated leg as separate
// processes on vcan0, as they will be with the real leg on can0.

const INTERFACE = "vcan0";
const problem = socketCanProblem(INTERFACE);
if (problem) console.warn(`Skipping the brain and simulated leg on ${INTERFACE}: ${problem}.`);

const SIM_CLI = fileURLToPath(import.meta.resolve("@hexapotamaus/sim/cli"));
const BRAIN_CLI = fileURLToPath(new URL("./cli.ts", import.meta.url));

interface StatusLine {
  t: number;
  leg: number;
  state: string;
  angles: { coxa: number; femur: number; tibia: number };
}

const JOINTS = ["coxa", "femur", "tibia"] as const;
/** The largest difference between any reported joint angle and the setpoint. */
const maxJointError = (s: StatusLine, setpoint: StatusLine["angles"]) => Math.max(...JOINTS.map((j) => Math.abs(s.angles[j] - setpoint[j])));

/** Runs the brain CLI to completion and returns the status lines it printed. */
async function runBrain(args: string[]): Promise<StatusLine[]> {
  const brain = spawn(process.execPath, [BRAIN_CLI, "--interface", INTERFACE, "--json", "--feed-port=0", ...args], {
    stdio: ["ignore", "pipe", "inherit"],
  });
  const lines: StatusLine[] = [];
  createInterface({ input: brain.stdout }).on("line", (line) => lines.push(JSON.parse(line)));
  const code = await new Promise((resolve) => brain.on("exit", resolve));
  expect(code).toBe(0);
  return lines;
}

describe.skipIf(problem)(`brain and simulated leg as separate processes on ${INTERFACE}${problem ? ` (skipped: ${problem})` : ""}`, () => {
  let release: () => void;
  let sim: ChildProcess;

  beforeAll(async () => {
    release = await lockCanInterface(INTERFACE);
    sim = spawn(process.execPath, [SIM_CLI, "--interface", INTERFACE, "--leg", "3"], { stdio: ["ignore", "pipe", "inherit"] });
    await new Promise<void>((resolve, reject) => {
      sim.on("exit", (code) => reject(new Error(`simulated leg exited with ${code}`)));
      createInterface({ input: sim.stdout! }).on("line", (line) => line === "ready" && resolve());
    });
  }, 10_000);

  afterAll(() => {
    sim?.kill();
    release?.();
  });

  it("makes the reported joint angles converge on the setpoints, and follows a restarted brain", async () => {
    const poseA = { coxa: 20, femur: -30, tibia: 45 };
    const first = await runBrain(["--leg", "3", "--pose=20,-30,45", "--duration", "1"]);
    expect(first.every((s) => s.leg === 3 && s.state === "Ready")).toBe(true);
    const early = first.filter((s) => s.t <= 100).at(-1);
    expect(early && maxJointError(early, poseA)).toBeGreaterThan(5); // still on its way: smoothed, not a jump
    expect(maxJointError(first.at(-1)!, poseA)).toBeLessThanOrEqual(0.01);

    // A new brain process starts its sequence numbers from 0 again. The leg accepts them because it has
    // heard no setpoints for over 100 ms while the new process started.
    const poseB = { coxa: -15, femur: 10, tibia: 60 };
    const second = await runBrain(["--leg", "3", "--pose=-15,10,60", "--duration", "1"]);
    expect(maxJointError(second.at(-1)!, poseB)).toBeLessThanOrEqual(0.01);
  }, 10_000);
});
