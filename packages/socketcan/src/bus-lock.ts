import { createServer } from "node:net";

/**
 * Takes a machine-wide lock on a CAN interface, so that tests in different
 * processes (Vitest runs test files in parallel) don't drive the same leg on
 * vcan0 at once. Returns the release function.
 *
 * The lock is a listening socket in Linux's abstract namespace: binding it is
 * atomic, and the kernel frees it when the holder exits, even if it crashes, so
 * there is never a stale lock to clean up.
 */
export async function lockCanInterface(iface: string, timeoutMs = 120_000): Promise<() => void> {
  const name = `\0hexapotamaus-${iface}-lock`;
  const deadline = performance.now() + timeoutMs;
  for (;;) {
    const server = createServer();
    try {
      await new Promise<void>((resolve, reject) => {
        server.once("error", reject);
        server.listen({ path: name }, resolve);
      });
      server.unref();
      return () => server.close();
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EADDRINUSE") throw error;
    }
    if (performance.now() > deadline) throw new Error(`timed out waiting for the ${iface} test lock`);
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}
