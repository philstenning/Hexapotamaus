import { describe, expect, it } from "vitest";
import { packageName } from "./index.ts";

describe("@hexapotamaus/protocol", () => {
  it("loads", () => {
    expect(packageName).toBe("@hexapotamaus/protocol");
  });
});
