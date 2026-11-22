import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { assertCanFrame, type CanFrame, type FrameTransport } from "@hexapotamaus/protocol";

export interface SocketCanOptions {
  /** The Python 3 interpreter that runs the bridge. Default `python3`. */
  python?: string;
  /** Called with the bridge's warnings and errors, e.g. dropped frames. Default: console.error. */
  onError?: (message: string) => void;
  /** How long to wait for the interface to open. Default 5 s. */
  openTimeoutMs?: number;
}

const BRIDGE = fileURLToPath(new URL("./can_bridge.py", import.meta.url));

/** sizeof(struct can_frame) on Linux. */
const FRAME_SIZE = 16;
const CAN_EFF_FLAG = 0x8000_0000;
const CAN_RTR_FLAG = 0x4000_0000;
const CAN_ERR_FLAG = 0x2000_0000;
/** Frames queued for a bridge that isn't keeping up, beyond which new frames are dropped, as a full CAN transmit queue drops them. */
const MAX_QUEUED_FRAMES = 64;

/** Packs a frame as a Linux `struct can_frame`: u32 ID (little-endian on x86 and ARM), u8 length, 3 padding bytes, 8 data bytes. */
function pack(frame: CanFrame): Uint8Array {
  const bytes = new Uint8Array(FRAME_SIZE);
  new DataView(bytes.buffer).setUint32(0, frame.id, true);
  bytes[4] = frame.data.length;
  bytes.set(frame.data, 8);
  return bytes;
}

/** Unpacks a `struct can_frame`. Returns undefined for anything but a classic standard-ID data frame. */
function unpack(bytes: Uint8Array): CanFrame | undefined {
  const raw = new DataView(bytes.buffer, bytes.byteOffset, FRAME_SIZE).getUint32(0, true);
  if (raw & (CAN_EFF_FLAG | CAN_RTR_FLAG | CAN_ERR_FLAG)) return undefined;
  const length = Math.min(bytes[4] ?? 0, 8);
  return { id: raw & 0x7ff, data: bytes.slice(8, 8 + length) };
}

/**
 * Opens a node on a Linux CAN interface (`vcan0`, `can0`) as a
 * {@link FrameTransport}. Like a real bus node, it doesn't receive its own
 * frames, but every other socket on the interface does, in this process or
 * another. Extended, remote and error frames are ignored.
 *
 * Node has no SocketCAN support, so each transport runs a small Python bridge
 * process (`can_bridge.py`). See docs/adr/0006-socketcan-through-a-python-bridge.md.
 */
export function openSocketCan(iface: string, options: SocketCanOptions = {}): Promise<FrameTransport> {
  const onError = options.onError ?? ((message) => console.error(`SocketCAN ${iface}: ${message}`));
  const child = spawn(options.python ?? "python3", [BRIDGE, iface], { stdio: ["pipe", "pipe", "pipe"] });
  const listeners = new Set<(frame: CanFrame) => void>();
  let open = false;
  let closed = false;
  let dropping = false;

  /** Stops delivering and sending. */
  function detach(): void {
    closed = true;
    listeners.clear();
  }

  let pending = new Uint8Array(0);
  child.stdout.on("data", (chunk: Buffer) => {
    const joined = new Uint8Array(pending.length + chunk.length);
    joined.set(pending);
    joined.set(chunk, pending.length);
    let offset = 0;
    for (; offset + FRAME_SIZE <= joined.length; offset += FRAME_SIZE) {
      const frame = unpack(joined.subarray(offset, offset + FRAME_SIZE));
      if (!frame) continue;
      for (const listener of [...listeners]) listener(frame);
    }
    pending = joined.slice(offset);
  });

  const transport: FrameTransport = {
    send(frame) {
      if (closed) throw new Error("transport is closed");
      assertCanFrame(frame);
      if (child.stdin.writableLength >= MAX_QUEUED_FRAMES * FRAME_SIZE) {
        if (!dropping) onError(`the bridge isn't keeping up; dropping frames`);
        dropping = true;
        return;
      }
      dropping = false;
      child.stdin.write(pack(frame));
    },
    onFrame(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    close() {
      if (closed) return;
      detach();
      child.stdin.end();
      child.kill();
    },
  };

  // A bridge that dies (or a pipe error) must not crash the process; it's reported instead.
  child.stdin.on("error", () => {});

  return new Promise((resolve, reject) => {
    const stderrLines: string[] = [];
    const timer = setTimeout(() => {
      fail(new Error(`timed out opening CAN interface ${iface}`));
    }, options.openTimeoutMs ?? 5000);

    function fail(error: Error): void {
      clearTimeout(timer);
      transport.close();
      reject(error);
    }

    let buffered = "";
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (text: string) => {
      buffered += text;
      const lines = buffered.split("\n");
      buffered = lines.pop() ?? "";
      for (const line of lines) {
        if (!open && line === "ready") {
          open = true;
          clearTimeout(timer);
          resolve(transport);
        } else if (open) {
          onError(line);
        } else {
          stderrLines.push(line);
        }
      }
    });

    child.on("error", (error) => {
      if (!open) fail(new Error(`can't start the SocketCAN bridge (${options.python ?? "python3"}): ${error.message}`));
      else onError(error.message);
    });
    child.on("exit", (code, signal) => {
      if (!open) {
        const reason = stderrLines.join("; ") || `bridge exited with ${signal ?? code}`;
        fail(new Error(reason.replace(/^error: /, "")));
      } else if (!closed) {
        detach();
        onError(`the bridge stopped unexpectedly (${signal ?? `exit code ${code}`}); the transport is closed`);
      }
    });
  });
}
