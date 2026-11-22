import { describe, expect, it } from "vitest";
import { socketCanProblem } from "./index.ts";

describe("checking SocketCAN can be used on an interface", () => {
  it("says when the interface doesn't exist", () => {
    expect(socketCanProblem("nocan9")).toMatch(/nocan9 doesn't exist/);
  });

  it("says when the interface isn't a CAN interface", () => {
    expect(socketCanProblem("lo")).toMatch(/lo isn't a CAN interface/);
  });

  it("says when there's no Python to run the bridge", () => {
    expect(socketCanProblem("lo", { python: "no-such-python3" })).toMatch(/no-such-python3/);
  });
});
