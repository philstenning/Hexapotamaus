import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, it } from "vitest";
import { systemClock, type LegPosition } from "@hexapotamaus/protocol";
import { DEFAULT_MAX_JOINT_SPEED_DEG_PER_S } from "@hexapotamaus/sim";
import { socketCanProblem, lockCanInterface, openSocketCan } from "@hexapotamaus/socketcan";
import { describeLegConformance, type LegTarget } from "./index.ts";

const INTERFACE = "vcan0";
const SIM_CLI = fileURLToPath(import.meta.resolve("@hexapotamaus/sim/cli"));

/**
 * The simulated leg as a separate process on vcan0, on real time, with a
 * neighbouring leg on the same bus: as close to the real leg on can0 as the
 * simulation gets. Each test starts a fresh simulated leg process.
 */
function simulatedLegOnVcan(leg: LegPosition, neighbour: LegPosition): LegTarget {
  return {
    name: `simulated leg ${leg}, separate process on ${INTERFACE}`,
    leg,
    maxJointSpeedDegPerS: DEFAULT_MAX_JOINT_SPEED_DEG_PER_S,
    async connect() {
      const sim = spawn(
        process.execPath,
        [SIM_CLI, "--interface", INTERFACE, "--leg", String(leg), "--leg", String(neighbour), "--initial-angles=-3,4,2"],
        { stdio: ["ignore", "pipe", "inherit"] },
      );
      const exited = new Promise((resolve) => sim.on("exit", resolve));
      await new Promise<void>((resolve, reject) => {
        exited.then((code) => reject(new Error(`simulated leg exited with ${code}`)));
        createInterface({ input: sim.stdout }).on("line", (line) => line === "ready" && resolve());
      });
      const transport = await openSocketCan(INTERFACE);
      return {
        transport,
        clock: systemClock,
        async close() {
          transport.close();
          sim.kill();
          await exited;
        },
      };
    },
  };
}

const problem = socketCanProblem(INTERFACE);
if (problem) {
  console.warn(`Skipping the conformance suite on ${INTERFACE}: ${problem}.`);
  describe.skip(`leg conformance: simulated leg on ${INTERFACE} (skipped: ${problem})`, () => {
    it("needs the vcan0 interface", () => {});
  });
} else {
  // Other test files drive legs on vcan0 too; take turns.
  let release: (() => void) | undefined;
  beforeAll(async () => {
    release = await lockCanInterface(INTERFACE);
  }, 130_000);
  afterAll(() => release?.());

  describeLegConformance(simulatedLegOnVcan(1, 2));
}
