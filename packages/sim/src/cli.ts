// Runs simulated legs on a Linux CAN interface, as separate nodes on the bus.
//
//   node packages/sim/src/cli.ts [--interface vcan0] [--leg 1] [--leg 2 ...]
//                                [--initial-angles=coxa,femur,tibia] [--max-speed 180]
//
// Prints "ready" on stdout once every leg is on the bus. Stops on Ctrl-C or SIGTERM.

import { parseArgs } from "node:util";
import { assertLegPosition, systemClock, type JointAngles, type LegPosition } from "@hexapotamaus/protocol";
import { socketCanProblem, openSocketCan } from "@hexapotamaus/socketcan";
import { DEFAULT_MAX_JOINT_SPEED_DEG_PER_S, startSimulatedLeg, type SimulatedLeg } from "./index.ts";

function usage(message: string): never {
  console.error(`${message}
usage: node packages/sim/src/cli.ts [--interface vcan0] [--leg 1] [--leg 2 ...]
                                    [--initial-angles=coxa,femur,tibia] [--max-speed ${DEFAULT_MAX_JOINT_SPEED_DEG_PER_S}]`);
  process.exit(2);
}

function parseAngles(text: string): JointAngles {
  const values = text.split(",").map(Number);
  if (values.length !== 3 || values.some((v) => !Number.isFinite(v))) usage(`bad joint angles "${text}"`);
  const [coxa, femur, tibia] = values as [number, number, number];
  return { coxa, femur, tibia };
}

let parsed;
try {
  parsed = parseArgs({
    options: {
      interface: { type: "string", default: "vcan0" },
      leg: { type: "string", multiple: true, default: ["1"] },
      "initial-angles": { type: "string" },
      "max-speed": { type: "string" },
    },
  }).values;
} catch (error) {
  usage((error as Error).message);
}

const iface = parsed.interface;
const legs = parsed.leg.map((text): LegPosition => {
  const leg = Number(text);
  try {
    assertLegPosition(leg);
  } catch {
    usage(`leg must be 1–6, not "${text}"`);
  }
  return leg;
});
const initialAngles = parsed["initial-angles"] === undefined ? undefined : parseAngles(parsed["initial-angles"]);
const maxJointSpeedDegPerS = parsed["max-speed"] === undefined ? undefined : Number(parsed["max-speed"]);
if (maxJointSpeedDegPerS !== undefined && !(maxJointSpeedDegPerS > 0)) usage("max speed must be a positive number");

const problem = socketCanProblem(iface);
if (problem) {
  console.error(`can't run the simulated leg: ${problem}`);
  process.exit(1);
}

const running: SimulatedLeg[] = [];
try {
  for (const leg of legs) {
    // Each leg is its own node, as each real leg controller is.
    const transport = await openSocketCan(iface);
    running.push(startSimulatedLeg({ transport, clock: systemClock, leg, initialAngles, maxJointSpeedDegPerS }));
  }
} catch (error) {
  console.error(`can't run the simulated leg: ${(error as Error).message}`);
  for (const leg of running) leg.stop();
  process.exit(1);
}

console.error(`simulated leg${legs.length > 1 ? "s" : ""} ${legs.join(", ")} on ${iface}`);
console.log("ready");

function stop(): void {
  for (const leg of running) leg.stop();
  process.exit(0);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
