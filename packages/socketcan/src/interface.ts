import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

/** Linux ARPHRD_CAN: the link type of can0, vcan0 and friends. */
const ARPHRD_CAN = 280;
const IFF_UP = 0x1;

/** Where the vcan0 setup steps are, for messages. */
export const VCAN_SETUP_DOC = "docs/vcan.md";

/**
 * Checks that {@link openSocketCan} can work on `iface`: Python is there to run
 * the bridge, and `iface` is a CAN interface that is up. Returns undefined if
 * so, or a sentence saying what's wrong, for skipping tests and for CLI errors.
 */
export function socketCanProblem(iface: string, options: { python?: string } = {}): string | undefined {
  const python = options.python ?? "python3";
  if (spawnSync(python, ["--version"], { stdio: "ignore" }).status !== 0) {
    return `the SocketCAN bridge needs ${python}, which isn't installed`;
  }
  const read = (file: string) => readFileSync(`/sys/class/net/${iface}/${file}`, "utf8").trim();
  let type: number;
  let flags: number;
  try {
    type = Number(read("type"));
    flags = Number(read("flags"));
  } catch {
    return `${iface} doesn't exist (set it up as in ${VCAN_SETUP_DOC})`;
  }
  if (type !== ARPHRD_CAN) return `${iface} isn't a CAN interface`;
  if (!(flags & IFF_UP)) return `${iface} is down (run: sudo ip link set up ${iface})`;
  return undefined;
}
