import { assertCanFrame, type CanFrame, type FrameTransport } from "./frame.ts";

export interface InProcessBus {
  /** Attaches a new node to the bus. */
  connect(): FrameTransport;
}

/**
 * A CAN bus inside one process. Like a real bus, every frame reaches every
 * other node and frames arrive in the order they were sent. Delivery is
 * synchronous; a frame sent from inside a listener is queued behind the frame
 * being delivered.
 */
export function createInProcessBus(): InProcessBus {
  type Node = { listeners: Set<(frame: CanFrame) => void> };
  const nodes = new Set<Node>();
  const queue: { from: Node; frame: CanFrame }[] = [];
  let delivering = false;

  function deliver(): void {
    if (delivering) return;
    delivering = true;
    try {
      for (let next = queue.shift(); next; next = queue.shift()) {
        for (const node of nodes) {
          if (node === next.from) continue;
          for (const listener of [...node.listeners]) listener(next.frame);
        }
      }
    } finally {
      delivering = false;
      queue.length = 0;
    }
  }

  return {
    connect(): FrameTransport {
      const node: Node = { listeners: new Set() };
      nodes.add(node);
      let open = true;
      return {
        send(frame) {
          if (!open) throw new Error("transport is closed");
          assertCanFrame(frame);
          queue.push({ from: node, frame: { id: frame.id, data: Uint8Array.from(frame.data) } });
          deliver();
        },
        onFrame(listener) {
          node.listeners.add(listener);
          return () => node.listeners.delete(listener);
        },
        close() {
          open = false;
          node.listeners.clear();
          nodes.delete(node);
        },
      };
    },
  };
}
