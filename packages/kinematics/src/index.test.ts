import { describe, expect, it } from "vitest";
import { packageName } from "./index.ts";

describe("@hexapotamaus/kinematics", () => {
  it("loads", () => {
    expect(packageName).toBe("@hexapotamaus/kinematics");
  });
});
