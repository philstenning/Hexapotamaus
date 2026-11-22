// Streams joint setpoints to one leg on a Linux CAN interface and prints its status.
//
//   node packages/brain/src/cli.ts [--interface vcan0] [--leg 1]
//                                  [--pose=coxa,femur,tibia] [--duration seconds] [--json]
//
// Without --pose, every joint sweeps ±20° at 1 Hz. Without --duration, it runs
// until Ctrl-C. With --json it prints every status frame as a JSON line;
// otherwise it prints the latest status four times a second.

import { parseArgs } from "node:util";
import {
  LegState,
  assertLegPosition,
  systemClock,
  type JointAngles,
  type LegPosition,
  type FrameTransport,
  type LegStatus,
} from "@hexapotamaus/protocol";
import { socketCanProblem, openSocketCan } from "@hexapotamaus/socketcan";
import { startControlLoop, startStatusMonitor } from "./index.ts";

function usage(message: string): never {
  console.error(`${message}
usage: node packages/brain/src/cli.ts [--interface vcan0] [--leg 1]
                                      [--pose=coxa,femur,tibia] [--duration seconds] [--json]`);
  process.exit(2);
}

let parsed;
try {
  parsed = parseArgs({
    options: {
      interface: { type: "string", default: "vcan0" },
      leg: { type: "string", default: "1" },
      pose: { type: "string" },
      duration: { type: "string" },
      json: { type: "boolean", default: false },
    },
  }).values;
} catch (error) {
  usage((error as Error).message);
}

const iface = parsed.interface;
const leg = Number(parsed.leg);
try {
  assertLegPosition(leg);
} catch {
  usage(`leg must be 1–6, not "${parsed.leg}"`);
}

let pose: JointAngles | undefined;
if (parsed.pose !== undefined) {
  const values = parsed.pose.split(",").map(Number);
  if (values.length !== 3 || values.some((v) => !Number.isFinite(v))) usage(`bad pose "${parsed.pose}"`);
  const [coxa, femur, tibia] = values as [number, number, number];
  pose = { coxa, femur, tibia };
}

const durationMs = parsed.duration === undefined ? undefined : Number(parsed.duration) * 1000;
if (durationMs !== undefined && !(durationMs > 0)) usage("duration must be a positive number of seconds");

const problem = socketCanProblem(iface);
if (problem) {
  console.error(`can't run the brain: ${problem}`);
  process.exit(1);
}

/** The 1 Hz, ±20° sweep from the slice 02 tests: at most ~126°/s, inside the simulated leg's 180°/s. */
function sweep(t: number): JointAngles {
  const a = 20 * Math.sin((2 * Math.PI * t) / 1000);
  return { coxa: a, femur: -a, tibia: a / 2 };
}

const stateName = (state: LegState) => Object.entries(LegState).find(([, v]) => v === state)?.[0] ?? String(state);
const formatAngle = (deg: number) => `${deg.toFixed(2)}°`.padStart(8);

let transport: FrameTransport;
try {
  transport = await openSocketCan(iface);
} catch (error) {
  console.error(`can't run the brain: ${(error as Error).message}`);
  process.exit(1);
}

const start = systemClock.now();
/** The joint setpoint for leg `leg` at time `now`. */
const setpointAt = (now: number) => pose ?? sweep(now - start);
const monitor = startStatusMonitor(transport);
const legPosition: LegPosition = leg;
const loop = startControlLoop({ transport, clock: systemClock, setpoints: (now) => ({ [legPosition]: setpointAt(now) }) });

let stopPrinting = () => {};
if (parsed.json) {
  monitor.onStatus((status: LegStatus) => {
    if (status.leg !== legPosition) return;
    const { state, ...rest } = status;
    console.log(JSON.stringify({ t: Math.round(systemClock.now() - start), ...rest, state: stateName(state) }));
  });
} else {
  console.error(`brain streaming setpoints to leg ${leg} on ${iface}${pose ? "" : " (±20° sweep at 1 Hz)"}`);
  stopPrinting = systemClock.setInterval(() => {
    const status = monitor.latest(legPosition);
    const setpoint = setpointAt(systemClock.now());
    const line = status
      ? `${stateName(status.state).padEnd(12)} coxa ${formatAngle(status.angles.coxa)} femur ${formatAngle(status.angles.femur)} tibia ${formatAngle(status.angles.tibia)}`
      : "no status yet".padEnd(12);
    console.log(`leg ${leg}  ${line}   setpoint ${formatAngle(setpoint.coxa)} ${formatAngle(setpoint.femur)} ${formatAngle(setpoint.tibia)}`);
  }, 250);
}

let cancelDuration = () => {};
function stop(): void {
  cancelDuration();
  loop.stop();
  stopPrinting();
  monitor.stop();
  transport.close();
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
if (durationMs !== undefined) cancelDuration = systemClock.setTimeout(stop, durationMs);
