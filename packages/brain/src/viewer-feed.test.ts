import { afterEach, describe, expect, it } from "vitest";
import { LegState, createInProcessBus, encodeLegStatus, type LegStatus } from "@hexapotamaus/protocol";
import { startStatusMonitor, startViewerFeed, type ViewerFeed, type ViewerFeedMessage } from "./index.ts";

const geometry = { coxa: 50, femur: 90, tibia: 135, tibiaOffset: 0 };
const switches = { coxaLimit: false, femurLimit: true, tibiaLimit: false, footContact: true };

/** A browser-like viewer: Node's own WebSocket client, collecting every message it receives. */
async function connectViewer(url: string) {
  const socket = new WebSocket(url);
  const messages: ViewerFeedMessage[] = [];
  socket.addEventListener("message", (event) => messages.push(JSON.parse(String(event.data))));
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve);
    socket.addEventListener("error", reject);
  });
  const closed = new Promise<void>((resolve) => socket.addEventListener("close", () => resolve()));
  return { socket, messages, closed, waitFor: (count: number) => until(() => messages.length >= count) };
}

async function until(condition: () => boolean, timeoutMs = 2000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!condition()) {
    if (Date.now() > deadline) throw new Error("timed out");
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

function setup() {
  const bus = createInProcessBus();
  const leg = bus.connect();
  const monitor = startStatusMonitor(bus.connect());
  const report = (status: LegStatus) => leg.send(encodeLegStatus(status));
  return { monitor, report };
}

let feed: ViewerFeed | undefined;
afterEach(async () => {
  await feed?.close();
  feed = undefined;
});

describe("viewer feed", () => {
  it("greets each viewer with the leg geometry, then forwards every status frame", async () => {
    const { monitor, report } = setup();
    feed = await startViewerFeed({ statuses: monitor, geometry, port: 0 });
    const viewer = await connectViewer(feed.url);
    await viewer.waitFor(1);

    report({ leg: 3, angles: { coxa: 1.5, femur: -20, tibia: 100.25 }, state: LegState.Ready, switches });
    report({ leg: 3, angles: { coxa: 2, femur: -20, tibia: 100 }, state: LegState.Fault, switches });
    await viewer.waitFor(3);

    expect(viewer.messages).toEqual([
      { type: "hello", geometry },
      { type: "legStatus", leg: 3, angles: { coxa: 1.5, femur: -20, tibia: 100.25 }, state: "Ready", switches },
      { type: "legStatus", leg: 3, angles: { coxa: 2, femur: -20, tibia: 100 }, state: "Fault", switches },
    ]);
  });

  it("serves several viewers, and carries on when one leaves", async () => {
    const { monitor, report } = setup();
    feed = await startViewerFeed({ statuses: monitor, geometry, port: 0 });
    const first = await connectViewer(feed.url);
    const second = await connectViewer(feed.url);
    await Promise.all([first.waitFor(1), second.waitFor(1)]);

    first.socket.close();
    await first.closed;
    report({ leg: 1, angles: { coxa: 0, femur: 0, tibia: 0 }, state: LegState.Hold, switches });
    await second.waitFor(2);
    expect(second.messages[1]).toMatchObject({ type: "legStatus", leg: 1, state: "Hold" });
    expect(first.messages).toHaveLength(1);
  });

  it("disconnects its viewers and stops listening when closed", async () => {
    const { monitor } = setup();
    feed = await startViewerFeed({ statuses: monitor, geometry, port: 0 });
    const viewer = await connectViewer(feed.url);
    const url = feed.url;
    await feed.close();
    feed = undefined;
    await viewer.closed;
    await expect(connectViewer(url)).rejects.toBeDefined();
  });
});
