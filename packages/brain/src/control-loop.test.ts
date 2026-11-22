import { describe, expect, it } from "vitest";
import {
  ManualClock,
  createInProcessBus,
  decodeJointSetpoint,
  encodeJointSetpoint,
  encodeLegStatus,
  LegState,
  type JointSetpoint,
} from "@hexapotamaus/protocol";
import { startControlLoop, startStatusMonitor } from "./index.ts";

function bus() {
  const b = createInProcessBus();
  const clock = new ManualClock();
  const brain = b.connect();
  const probe = b.connect();
  const setpoints: JointSetpoint[] = [];
  probe.onFrame((f) => setpoints.push(decodeJointSetpoint(f)));
  return { clock, brain, probe, setpoints };
}

const pose = { coxa: 1, femur: 2, tibia: 3 };

describe("control loop", () => {
  it("sends one setpoint per leg every 20 ms, with each leg's sequence counting up", async () => {
    const { clock, brain, setpoints } = bus();
    startControlLoop({ transport: brain, clock, setpoints: () => ({ 1: pose, 4: pose }) });
    await clock.sleep(990);
    const leg1 = setpoints.filter((s) => s.leg === 1);
    const leg4 = setpoints.filter((s) => s.leg === 4);
    expect(leg1).toHaveLength(50);
    expect(leg4).toHaveLength(50);
    expect(leg1.map((s) => s.sequence)).toEqual([...Array(50).keys()]);
    expect(leg4.every((s) => s.angles.femur === 2)).toBe(true);
  });

  it("sends whatever the setpoint source says at each tick, and skips legs it leaves out", async () => {
    const { clock, brain, setpoints } = bus();
    startControlLoop({
      transport: brain,
      clock,
      setpoints: (now) => (now < 40 ? { 2: { ...pose, coxa: now / 10 } } : { 3: pose }),
    });
    await clock.sleep(60);
    expect(setpoints.map((s) => [s.leg, s.angles.coxa])).toEqual([
      [2, 0],
      [2, 2],
      [3, 1],
      [3, 1],
    ]);
  });

  it("wraps each leg's sequence number from 65535 to 0", async () => {
    const { clock, brain, setpoints } = bus();
    startControlLoop({ transport: brain, clock, firstSequence: 65_534, setpoints: () => ({ 6: pose }) });
    await clock.sleep(60);
    expect(setpoints.map((s) => s.sequence)).toEqual([65_534, 65_535, 0, 1]);
  });

  it("reports an out-of-range angle instead of sending it, and carries on with the other legs", async () => {
    const { clock, brain, setpoints } = bus();
    const errors: unknown[] = [];
    startControlLoop({
      transport: brain,
      clock,
      onError: (e) => errors.push(e),
      setpoints: () => ({ 1: { ...pose, tibia: 400 }, 2: pose }),
    });
    await clock.sleep(20);
    expect(setpoints.map((s) => s.leg)).toEqual([2, 2]);
    expect(errors).toHaveLength(2);
    expect(errors[0]).toBeInstanceOf(RangeError);
  });

  it("stops sending when stopped", async () => {
    const { clock, brain, setpoints } = bus();
    const loop = startControlLoop({ transport: brain, clock, setpoints: () => ({ 1: pose }) });
    await clock.sleep(40);
    loop.stop();
    await clock.sleep(100);
    expect(setpoints).toHaveLength(3);
  });
});

describe("status monitor", () => {
  it("keeps the newest status per leg and ignores other and malformed frames", () => {
    const { brain, probe } = bus();
    const monitor = startStatusMonitor(brain);
    const seen: number[] = [];
    monitor.onStatus((s) => seen.push(s.leg));
    const switches = { coxaLimit: false, femurLimit: false, tibiaLimit: false, footContact: false };
    probe.send(encodeLegStatus({ leg: 1, angles: pose, state: LegState.Ready, switches }));
    probe.send(encodeLegStatus({ leg: 1, angles: { ...pose, coxa: 9 }, state: LegState.Hold, switches }));
    probe.send(encodeJointSetpoint({ leg: 1, angles: pose, sequence: 0 }));
    probe.send({ id: 0x019, data: new Uint8Array(3) });
    expect(monitor.latest(1)).toEqual({ leg: 1, angles: { ...pose, coxa: 9 }, state: LegState.Hold, switches });
    expect(monitor.latest(2)).toBeUndefined();
    expect(seen).toEqual([1, 1]);
  });
});
