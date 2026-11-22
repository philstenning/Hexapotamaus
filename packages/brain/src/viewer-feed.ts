import type { AddressInfo } from "node:net";
import { WebSocket, WebSocketServer } from "ws";
import type { LegGeometry } from "@hexapotamaus/kinematics";
import { legStateName } from "@hexapotamaus/protocol";
import type { StatusMonitor } from "./status-monitor.ts";
import type { LegStatusMessage, ViewerFeedMessage } from "./viewer-feed-messages.ts";

export * from "./viewer-feed-messages.ts";

export interface ViewerFeedOptions {
  /** Where the leg status comes from. */
  statuses: Pick<StatusMonitor, "onStatus">;
  /** Sent to each viewer when it connects, to draw the legs with. */
  geometry: LegGeometry;
  /** 0 picks a free port. */
  port: number;
  /** Default 127.0.0.1: only this machine. Use 0.0.0.0 to let other machines watch. */
  host?: string;
}

export interface ViewerFeed {
  /** The feed's address, e.g. ws://127.0.0.1:8787. */
  readonly url: string;
  /** Disconnects every viewer and stops listening. */
  close(): Promise<void>;
}

/** A viewer that has fallen this far behind misses status messages until it catches up. */
const MAX_BUFFERED_BYTES = 64 * 1024;

/**
 * The brain's WebSocket feed for the viewer: a hello with the leg geometry, then every
 * leg status frame. It only reports; viewers can't send the brain anything yet.
 */
export async function startViewerFeed(options: ViewerFeedOptions): Promise<ViewerFeed> {
  const host = options.host ?? "127.0.0.1";
  const server = new WebSocketServer({ port: options.port, host });
  await new Promise<void>((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  // After startup, a socket error only affects that viewer; never let it reach the brain.
  server.on("error", (error) => console.error("viewer feed:", error));

  const send = (socket: WebSocket, message: ViewerFeedMessage) => {
    if (socket.readyState !== WebSocket.OPEN || socket.bufferedAmount > MAX_BUFFERED_BYTES) return;
    socket.send(JSON.stringify(message));
  };

  server.on("connection", (socket) => {
    socket.on("error", () => socket.terminate());
    send(socket, { type: "hello", geometry: options.geometry });
  });

  const unsubscribe = options.statuses.onStatus((status) => {
    const message: LegStatusMessage = {
      type: "legStatus",
      leg: status.leg,
      angles: status.angles,
      state: legStateName(status.state),
      switches: status.switches,
    };
    for (const socket of server.clients) send(socket, message);
  });

  const { port } = server.address() as AddressInfo;
  return {
    url: `ws://${host.includes(":") ? `[${host}]` : host}:${port}`,
    close() {
      unsubscribe();
      for (const socket of server.clients) socket.terminate();
      return new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    },
  };
}
