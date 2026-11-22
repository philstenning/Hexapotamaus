import { describe, expect, it } from "vitest";
import { feedUrl } from "./feed-url.ts";

describe("feed URL", () => {
  it("defaults to the brain's feed port on the machine serving the page", () => {
    expect(feedUrl({ search: "", hostname: "localhost" })).toBe("ws://localhost:8787");
    expect(feedUrl({ search: "?leg=2", hostname: "192.168.1.20" })).toBe("ws://192.168.1.20:8787");
  });

  it("uses the page's ?feed= parameter when there is one", () => {
    expect(feedUrl({ search: "?feed=ws://pi.local:9000", hostname: "localhost" })).toBe("ws://pi.local:9000");
  });
});
