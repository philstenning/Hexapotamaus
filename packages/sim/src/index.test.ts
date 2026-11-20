import { describe, expect, it } from "vitest";
import { packageName } from "./index.ts";

describe("@hexapotamaus/sim", () => {
  it("loads", () => {
    expect(packageName).toBe("@hexapotamaus/sim");
  });
});
