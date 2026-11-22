import { afterEach, describe, expect, it } from "vitest";
import { startStatusMonitor, startViewerFeed, type ViewerFeed } from "@hexapotamaus/brain";
import { LegState, createInProcessBus, encodeLegStatus, type LegStatus } from "@hexapotamaus/protocol";
import { createFeedClient, type FeedClient } from "./feed-client.ts";

// The viewer's side of the brain's WebSocket feed, against the brain's real feed server.

const geometry = { coxa: 50, femur: 90, tibia: 135, tibiaOffset: 0 };
const switches = { coxaLimit: false, femurLimit: false, tibiaLimit: false, footContact: true };
const RETRY_MS = 20;

/** A brain's feed on `port`, with a leg on an in-process bus behind it. */
async function startBrain(port = 0, legGeometry = geometry) {
  const bus = createInProcessBus();
  const leg = bus.connect();
  const feed = await startViewerFeed({ statuses: startStatusMonitor(bus.connect()), geometry: legGeometry, port });
  feeds.push(feed);
  const report = (status: LegStatus) => leg.send(encodeLegStatus(status));
  return { feed, port: Number(new URL(feed.url).port), report };
}

async function until(condition: () => boolean, timeoutMs = 2000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!condition()) {
    if (Date.now() > deadline) throw new Error("timed out");
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

let feeds: ViewerFeed[] = [];
let client: FeedClient | undefined;
afterEach(async () => {
  client?.close();
  client = undefined;
  await Promise.all(feeds.map((f) => f.close().catch(() => {})));
  feeds = [];
});

describe("feed client", () => {
  it("shows the leg geometry and each leg's latest status from the brain", async () => {
    const brain = await startBrain();
    client = createFeedClient({ url: brain.feed.url, retryMs: RETRY_MS });
    const updates: unknown[] = [];
    client.subscribe(() => updates.push(client!.getSnapshot()));
    await until(() => client!.getSnapshot().geometry !== undefined);
    expect(client.getSnapshot()).toMatchObject({ connection: "connected", geometry, legs: {} });

    brain.report({ leg: 2, angles: { coxa: 1, femur: 2, tibia: 3 }, state: LegState.Ready, switches });
    brain.report({ leg: 2, angles: { coxa: 4, femur: 5, tibia: 6 }, state: LegState.Hold, switches });
    await until(() => client!.getSnapshot().legs[2]?.state === "Hold");
    expect(client.getSnapshot().legs[2]).toMatchObject({ leg: 2, angles: { coxa: 4, femur: 5, tibia: 6 }, state: "Hold", switches });
    expect(updates.length).toBeGreaterThanOrEqual(3);
  });

  it("reconnects after the brain restarts, and starts afresh from the new brain", async () => {
    const first = await startBrain();
    client = createFeedClient({ url: first.feed.url, retryMs: RETRY_MS });
    await until(() => client!.getSnapshot().geometry !== undefined);
    first.report({ leg: 1, angles: { coxa: 10, femur: 0, tibia: 0 }, state: LegState.Ready, switches });
    await until(() => client!.getSnapshot().legs[1] !== undefined);

    await first.feed.close();
    await until(() => client!.getSnapshot().connection === "disconnected");
    // While the brain is away the last status stays, so the viewer can show it greyed out.
    expect(client.getSnapshot().legs[1]).toMatchObject({ angles: { coxa: 10 } });

    const restartedGeometry = { ...geometry, tibia: 140 };
    const second = await startBrain(first.port, restartedGeometry);
    await until(() => client!.getSnapshot().connection === "connected" && client!.getSnapshot().geometry?.tibia === 140);
    expect(client.getSnapshot().legs).toEqual({});

    second.report({ leg: 1, angles: { coxa: -5, femur: 0, tibia: 0 }, state: LegState.Fault, switches });
    await until(() => client!.getSnapshot().legs[1]?.state === "Fault");
  });

  it("keeps trying until the brain starts", async () => {
    const placeholder = await startBrain();
    const { port } = placeholder;
    await placeholder.feed.close();

    client = createFeedClient({ url: `ws://127.0.0.1:${port}`, retryMs: RETRY_MS });
    await new Promise((resolve) => setTimeout(resolve, 5 * RETRY_MS));
    expect(client.getSnapshot().connection).not.toBe("connected");

    await startBrain(port);
    await until(() => client!.getSnapshot().connection === "connected");
  });

  it("stops reconnecting once closed", async () => {
    const placeholder = await startBrain();
    const { port } = placeholder;
    await placeholder.feed.close();

    client = createFeedClient({ url: `ws://127.0.0.1:${port}`, retryMs: RETRY_MS });
    client.close();
    await startBrain(port);
    await new Promise((resolve) => setTimeout(resolve, 5 * RETRY_MS));
    expect(client.getSnapshot().connection).toBe("closed");
  });
});
