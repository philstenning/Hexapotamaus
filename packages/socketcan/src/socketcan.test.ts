import { execFileSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import type { CanFrame, FrameTransport } from "@hexapotamaus/protocol";
import { socketCanProblem, openSocketCan } from "./index.ts";

const INTERFACE = "vcan0";
const problem = socketCanProblem(INTERFACE);
if (problem) console.warn(`Skipping the SocketCAN transport tests: ${problem}.`);

/**
 * Collects frames with IDs 0x7F0–0x7FF only, so other tests' traffic on vcan0 doesn't interfere. Those IDs are
 * function 0xFE, which docs/protocol.md leaves reserved; move these tests if a later version uses it.
 */
function collect(transport: FrameTransport): CanFrame[] {
  const frames: CanFrame[] = [];
  transport.onFrame((f) => {
    if (f.id >= 0x7f0) frames.push(f);
  });
  return frames;
}

async function until(what: string, predicate: () => boolean, timeoutMs = 1000): Promise<void> {
  const deadline = performance.now() + timeoutMs;
  while (!predicate()) {
    if (performance.now() > deadline) throw new Error(`timed out waiting for ${what}`);
    await new Promise((r) => setTimeout(r, 5));
  }
}

describe.skipIf(problem)(`SocketCAN transport on ${INTERFACE}${problem ? ` (skipped: ${problem})` : ""}`, () => {
  const open: FrameTransport[] = [];
  afterEach(() => {
    for (const t of open.splice(0)) t.close();
  });
  const connect = async () => {
    const t = await openSocketCan(INTERFACE);
    open.push(t);
    return t;
  };

  it("delivers a frame to every other node, but not back to the sender", async () => {
    const [a, b, c] = [await connect(), await connect(), await connect()];
    const [atA, atB, atC] = [collect(a), collect(b), collect(c)];
    a.send({ id: 0x7f1, data: Uint8Array.of(1, 2, 3) });
    await until("b and c to receive", () => atB.length > 0 && atC.length > 0);
    await new Promise((r) => setTimeout(r, 50));
    expect(atB).toEqual([{ id: 0x7f1, data: Uint8Array.of(1, 2, 3) }]);
    expect(atC).toEqual([{ id: 0x7f1, data: Uint8Array.of(1, 2, 3) }]);
    expect(atA).toEqual([]);
  });

  it("carries frames from 0 to 8 data bytes, in the order they were sent", async () => {
    const [a, b] = [await connect(), await connect()];
    const atB = collect(b);
    const sent = [0, 1, 7, 8].map((n, i) => ({ id: 0x7f0 + i, data: Uint8Array.from({ length: n }, (_, k) => 0xa0 + k) }));
    for (const f of sent) a.send(f);
    await until("all frames", () => atB.length === sent.length);
    expect(atB).toEqual(sent);
  });

  it("stops delivering once unsubscribed or closed, and refuses to send after closing", async () => {
    const [a, b, c] = [await connect(), await connect(), await connect()];
    const atB: number[] = [];
    const atC: number[] = [];
    const off = b.onFrame((f) => f.id >= 0x7f0 && atB.push(f.id));
    c.onFrame((f) => f.id >= 0x7f0 && atC.push(f.id));
    a.send({ id: 0x7f1, data: new Uint8Array(0) });
    await until("first frame", () => atB.length === 1 && atC.length === 1);
    off();
    c.close();
    a.send({ id: 0x7f2, data: new Uint8Array(0) });
    await new Promise((r) => setTimeout(r, 50));
    expect([atB, atC]).toEqual([[0x7f1], [0x7f1]]);
    expect(() => c.send({ id: 0x7f3, data: new Uint8Array(0) })).toThrow(/closed/);
  });

  it("refuses frames that aren't classic standard-ID CAN", async () => {
    const a = await connect();
    expect(() => a.send({ id: 0x800, data: new Uint8Array(0) })).toThrow(RangeError);
    expect(() => a.send({ id: 1, data: new Uint8Array(9) })).toThrow(RangeError);
  });

  it("ignores extended-ID and remote frames from other nodes", async () => {
    const a = await connect();
    const atA = collect(a);
    // Another program on the bus sends an extended frame, a remote frame, then a normal one.
    execFileSync("python3", [
      "-c",
      `import socket, struct
s = socket.socket(socket.AF_CAN, socket.SOCK_RAW, socket.CAN_RAW)
s.bind(("${INTERFACE}",))
for can_id, data in ((0x80000000 | 0x7f5, b"x"), (0x40000000 | 0x7f6, b""), (0x7f7, b"ok")):
    s.send(struct.pack("<IB3x8s", can_id, len(data), data))`,
    ]);
    await until("the normal frame", () => atA.length > 0);
    await new Promise((r) => setTimeout(r, 20));
    expect(atA).toEqual([{ id: 0x7f7, data: new TextEncoder().encode("ok") }]);
  });
});

describe("opening a CAN interface that doesn't exist", () => {
  it("fails with a message naming the interface", async () => {
    await expect(openSocketCan("nocan9")).rejects.toThrow(/nocan9/);
  });
});
