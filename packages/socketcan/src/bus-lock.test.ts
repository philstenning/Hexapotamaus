import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { lockCanInterface } from "./index.ts";

const INDEX = fileURLToPath(new URL("./index.ts", import.meta.url));

describe("the CAN interface test lock", () => {
  it("makes a second taker wait until the first releases it", async () => {
    const release = await lockCanInterface("locktest0");
    let second = false;
    const waiting = lockCanInterface("locktest0").then((r) => ((second = true), r));
    await new Promise((r) => setTimeout(r, 150));
    expect(second).toBe(false);
    release();
    const releaseSecond = await waiting;
    expect(second).toBe(true);
    releaseSecond();
  });

  it("gives up after its timeout", async () => {
    const release = await lockCanInterface("locktest1");
    await expect(lockCanInterface("locktest1", 100)).rejects.toThrow(/timed out/);
    release();
  });

  it("is freed when its holder dies without releasing it", async () => {
    const holder = spawn(
      process.execPath,
      ["--input-type=module", "-e", `await import(${JSON.stringify(INDEX)}).then((m) => m.lockCanInterface("locktest2")); console.log("held"); setInterval(() => {}, 1000);`],
      { stdio: ["ignore", "pipe", "inherit"] },
    );
    await new Promise<void>((resolve) => holder.stdout.on("data", (d: Buffer) => d.toString().includes("held") && resolve()));
    await expect(lockCanInterface("locktest2", 100)).rejects.toThrow(/timed out/);
    holder.kill("SIGKILL");
    const release = await lockCanInterface("locktest2", 2000);
    release();
  });
});
