import { DEFAULT_VIEWER_FEED_PORT } from "@hexapotamaus/brain/viewer-feed-messages";

/**
 * Where the brain's feed is: the page's `?feed=` parameter if it has one, otherwise
 * the default feed port on the machine serving the page.
 */
export function feedUrl(location: Pick<Location, "search" | "hostname">): string {
  return new URLSearchParams(location.search).get("feed") ?? `ws://${location.hostname || "localhost"}:${DEFAULT_VIEWER_FEED_PORT}`;
}
