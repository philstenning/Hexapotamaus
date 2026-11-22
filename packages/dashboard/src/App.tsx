import { useEffect, useState, useSyncExternalStore } from "react";
import { LEG_POSITIONS, type LegPosition } from "@hexapotamaus/protocol";
import type { FeedClient } from "./feed-client.ts";
import { LegScene } from "./LegScene.tsx";
import { StatusPanel } from "./StatusPanel.tsx";

/** A leg whose last status is older than this is shown as silent. Status comes every 20 ms. */
const STALE_AFTER_MS = 200;

export function App({ client }: { client: FeedClient }) {
  const feed = useSyncExternalStore(client.subscribe, client.getSnapshot);
  const now = useNow(100);
  const reported = LEG_POSITIONS.filter((leg) => feed.legs[leg]);
  const [chosen, setChosen] = useState<LegPosition | undefined>();
  const selected = chosen !== undefined && feed.legs[chosen] ? chosen : reported[0];
  const report = selected === undefined ? undefined : feed.legs[selected];
  const live = feed.connection === "connected" && report !== undefined && now - report.receivedAt < STALE_AFTER_MS;

  return (
    <div className="flex h-dvh flex-col md:flex-row">
      <main className="relative min-h-0 flex-1">
        {feed.geometry && report ? (
          <LegScene geometry={feed.geometry} report={report} live={live} />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">
            {feed.connection === "connected" ? "Connected. Waiting for a leg to report…" : "Waiting for the brain…"}
          </div>
        )}
      </main>
      <StatusPanel
        connection={feed.connection}
        geometry={feed.geometry}
        legs={reported}
        selected={selected}
        onSelect={setChosen}
        report={report}
        live={live}
        ageMs={report ? now - report.receivedAt : undefined}
      />
    </div>
  );
}

/** performance.now(), refreshed every `periodMs`. */
function useNow(periodMs: number): number {
  const [now, setNow] = useState(() => performance.now());
  useEffect(() => {
    const handle = setInterval(() => setNow(performance.now()), periodMs);
    return () => clearInterval(handle);
  }, [periodMs]);
  return now;
}
