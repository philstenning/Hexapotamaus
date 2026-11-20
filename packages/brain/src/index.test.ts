import { describe, expect, it } from "vitest";
import { packageName } from "./index.ts";

describe("@hexapotamaus/brain", () => {
  it("loads", () => {
    expect(packageName).toBe("@hexapotamaus/brain");
  });
});
