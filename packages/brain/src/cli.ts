// Streams joint setpoints to one leg on a Linux CAN interface, prints its status and
// serves the viewer feed.
//
//   node packages/brain/src/cli.ts [--interface vcan0] [--leg 1]
//                                  [--pose=coxa,femur,tibia] [--duration seconds] [--json]
//                                  [--geometry config/leg-geometry.json]
//                                  [--feed-port 8787] [--feed-host 127.0.0.1]
//
// Without --pose, every joint sweeps ±20° at 1 Hz around the default stance. Without
// --duration, it runs until Ctrl-C. With --json it prints every status frame as a
// JSON line; otherwise it prints the latest status four times a second. The viewer
// feed sends the leg geometry from --geometry; --feed-port 0 picks a free port.

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { parseLegGeometry, type LegGeometry } from "@hexapotamaus/kinematics";
import {
  assertLegPosition,
  legStateName,
  systemClock,
  type JointAngles,
  type LegPosition,
  type FrameTransport,
  type LegStatus,
} from "@hexapotamaus/protocol";
import { socketCanProblem, openSocketCan } from "@hexapotamaus/socketcan";
import { DEFAULT_VIEWER_FEED_PORT, startControlLoop, startStatusMonitor, startViewerFeed, type ViewerFeed } from "./index.ts";

const DEFAULT_GEOMETRY_FILE = fileURLToPath(new URL("../../../config/leg-geometry.json", import.meta.url));

function usage(message: string): never {
  console.error(`${message}
usage: node packages/brain/src/cli.ts [--interface vcan0] [--leg 1]
                                      [--pose=coxa,femur,tibia] [--duration seconds] [--json]
                                      [--geometry config/leg-geometry.json]
                                      [--feed-port ${DEFAULT_VIEWER_FEED_PORT}] [--feed-host 127.0.0.1]`);
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
      geometry: { type: "string", default: DEFAULT_GEOMETRY_FILE },
      "feed-port": { type: "string", default: String(DEFAULT_VIEWER_FEED_PORT) },
      "feed-host": { type: "string", default: "127.0.0.1" },
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

const feedPort = Number(parsed["feed-port"]);
if (!Number.isInteger(feedPort) || feedPort < 0 || feedPort > 65_535) usage(`bad feed port "${parsed["feed-port"]}"`);

let geometry: LegGeometry;
try {
  geometry = parseLegGeometry(JSON.parse(await readFile(parsed.geometry, "utf8")));
} catch (error) {
  console.error(`can't read the leg geometry from ${parsed.geometry}: ${(error as Error).message}`);
  process.exit(1);
}

const problem = socketCanProblem(iface);
if (problem) {
  console.error(`can't run the brain: ${problem}`);
  process.exit(1);
}

/**
 * Roughly the spec's default stance for the new leg: the foot about 80 mm out from
 * the femur joint and 110 mm below it.
 */
const DEFAULT_STANCE: JointAngles = { coxa: 0, femur: 16, tibia: 109 };

/** The 1 Hz, ±20° sweep from the slice 02 tests, around the default stance: at most ~126°/s, inside the simulated leg's 180°/s. */
function sweep(t: number): JointAngles {
  const a = 20 * Math.sin((2 * Math.PI * t) / 1000);
  return { coxa: DEFAULT_STANCE.coxa + a, femur: DEFAULT_STANCE.femur - a, tibia: DEFAULT_STANCE.tibia + a / 2 };
}

const formatAngle = (deg: number) => `${deg.toFixed(2)}°`.padStart(8);

let transport: FrameTransport;
try {
  transport = await openSocketCan(iface);
} catch (error) {
  console.error(`can't run the brain: ${(error as Error).message}`);
  process.exit(1);
}

const monitor = startStatusMonitor(transport);
let feed: ViewerFeed;
try {
  feed = await startViewerFeed({ statuses: monitor, geometry, port: feedPort, host: parsed["feed-host"] });
} catch (error) {
  console.error(`can't start the viewer feed: ${(error as Error).message}`);
  transport.close();
  process.exit(1);
}
console.error(`viewer feed on ${feed.url}`);

const start = systemClock.now();
/** The joint setpoint for leg `leg` at time `now`. */
const setpointAt = (now: number) => pose ?? sweep(now - start);
const legPosition: LegPosition = leg;
const loop = startControlLoop({ transport, clock: systemClock, setpoints: (now) => ({ [legPosition]: setpointAt(now) }) });

let stopPrinting = () => {};
if (parsed.json) {
  monitor.onStatus((status: LegStatus) => {
    if (status.leg !== legPosition) return;
    const { state, ...rest } = status;
    console.log(JSON.stringify({ t: Math.round(systemClock.now() - start), ...rest, state: legStateName(state) }));
  });
} else {
  console.error(`brain streaming setpoints to leg ${leg} on ${iface}${pose ? "" : " (±20° sweep at 1 Hz around the default stance)"}`);
  stopPrinting = systemClock.setInterval(() => {
    const status = monitor.latest(legPosition);
    const setpoint = setpointAt(systemClock.now());
    const line = status
      ? `${legStateName(status.state).padEnd(12)} coxa ${formatAngle(status.angles.coxa)} femur ${formatAngle(status.angles.femur)} tibia ${formatAngle(status.angles.tibia)}`
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
  void feed.close();
  transport.close();
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
if (durationMs !== undefined) cancelDuration = systemClock.setTimeout(stop, durationMs);
