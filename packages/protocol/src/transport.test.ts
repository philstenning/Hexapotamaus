import { describe, expect, it } from "vitest";
import { ManualClock, createInProcessBus, type CanFrame } from "./index.ts";

const frame = (id: number, ...bytes: number[]): CanFrame => ({ id, data: Uint8Array.from(bytes) });

describe("in-process bus", () => {
  it("delivers a frame to every other node, but not back to the sender", () => {
    const bus = createInProcessBus();
    const a = bus.connect();
    const b = bus.connect();
    const c = bus.connect();
    const seen: string[] = [];
    a.onFrame((f) => seen.push(`a:${f.id}`));
    b.onFrame((f) => seen.push(`b:${f.id}`));
    c.onFrame((f) => seen.push(`c:${f.id}`));
    a.send(frame(0x11, 1));
    expect(seen).toEqual(["b:17", "c:17"]);
  });

  it("delivers frames in the order they were sent, even when sent from a listener", () => {
    const bus = createInProcessBus();
    const a = bus.connect();
    const b = bus.connect();
    const c = bus.connect();
    const seen: number[] = [];
    b.onFrame((f) => {
      if (f.id === 1) b.send(frame(3));
    });
    c.onFrame((f) => seen.push(f.id));
    a.send(frame(1));
    a.send(frame(2));
    expect(seen).toEqual([1, 3, 2]);
  });

  it("copies frame data so the receiver can't see later changes by the sender", () => {
    const bus = createInProcessBus();
    const a = bus.connect();
    const b = bus.connect();
    let received: CanFrame | undefined;
    b.onFrame((f) => (received = f));
    const sent = frame(1, 5);
    a.send(sent);
    sent.data[0] = 9;
    expect(received?.data[0]).toBe(5);
  });

  it("stops delivering to a listener once unsubscribed or closed", () => {
    const bus = createInProcessBus();
    const a = bus.connect();
    const b = bus.connect();
    const c = bus.connect();
    let toB = 0;
    let toC = 0;
    const off = b.onFrame(() => toB++);
    c.onFrame(() => toC++);
    a.send(frame(1));
    off();
    c.close();
    a.send(frame(2));
    expect([toB, toC]).toEqual([1, 1]);
    expect(() => c.send(frame(3))).toThrow();
  });

  it("refuses frames that aren't classic standard-ID CAN", () => {
    const a = createInProcessBus().connect();
    expect(() => a.send(frame(0x800))).toThrow(RangeError);
    expect(() => a.send({ id: 1, data: new Uint8Array(9) })).toThrow(RangeError);
  });
});

describe("ManualClock", () => {
  it("runs timers in time order as time advances", async () => {
    const clock = new ManualClock();
    const log: string[] = [];
    clock.setInterval(() => log.push(`i${clock.now()}`), 20);
    clock.setTimeout(() => log.push(`t${clock.now()}`), 30);
    await clock.sleep(60);
    expect(log).toEqual(["i20", "t30", "i40", "i60"]);
    expect(clock.now()).toBe(60);
  });

  it("stops a cancelled timer", async () => {
    const clock = new ManualClock();
    let ticks = 0;
    const cancel = clock.setInterval(() => ticks++, 10);
    await clock.sleep(25);
    cancel();
    await clock.sleep(100);
    expect(ticks).toBe(2);
  });

  it("runs timers scheduled by timers when they fall due", async () => {
    const clock = new ManualClock(1000);
    const log: number[] = [];
    clock.setTimeout(() => clock.setTimeout(() => log.push(clock.now()), 5), 5);
    await clock.sleep(20);
    expect(log).toEqual([1010]);
  });

  it("runs timers due at the same moment in the order they were created", async () => {
    const clock = new ManualClock();
    const log: string[] = [];
    clock.setInterval(() => log.push("fast"), 5);
    clock.setInterval(() => log.push("slow"), 20);
    await clock.sleep(40);
    expect(log.slice(-2)).toEqual(["fast", "slow"]);
    expect(log.filter((x) => x === "slow")).toHaveLength(2);
  });
});
