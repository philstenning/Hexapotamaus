import { describe, expect, it } from "vitest";
import { packageName } from "./index.ts";

describe("@hexapotamaus/dashboard", () => {
  it("loads", () => {
    expect(packageName).toBe("@hexapotamaus/dashboard");
  });
});
