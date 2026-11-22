import type { ReactNode } from "react";
import { forwardKinematics, type LegGeometry } from "@hexapotamaus/kinematics";
import type { LegPosition, SwitchStates } from "@hexapotamaus/protocol";
import type { FeedConnection, LegReport } from "./feed-client.ts";
import { STATE_STYLES } from "./leg-state-styles.ts";

const CONNECTION_LABELS: Record<FeedConnection, { text: string; badge: string }> = {
  connecting: { text: "Connecting…", badge: "bg-slate-700 text-slate-300" },
  connected: { text: "Connected", badge: "bg-green-500/20 text-green-300" },
  disconnected: { text: "No brain: retrying", badge: "bg-red-500/20 text-red-300" },
  closed: { text: "Closed", badge: "bg-slate-700 text-slate-300" },
};

const SWITCH_LABELS: Record<keyof SwitchStates, string> = {
  coxaLimit: "Coxa limit",
  femurLimit: "Femur limit",
  tibiaLimit: "Tibia limit",
  footContact: "Foot contact",
};

interface StatusPanelProps {
  connection: FeedConnection;
  geometry: LegGeometry | undefined;
  /** The legs that have reported. */
  legs: LegPosition[];
  selected: LegPosition | undefined;
  onSelect: (leg: LegPosition) => void;
  report: LegReport | undefined;
  live: boolean;
  /** How long ago the shown status arrived. */
  ageMs: number | undefined;
}

export function StatusPanel({ connection, geometry, legs, selected, onSelect, report, live, ageMs }: StatusPanelProps) {
  const connectionLabel = CONNECTION_LABELS[connection];
  return (
    <aside className="flex w-full shrink-0 flex-col gap-5 overflow-y-auto border-t border-slate-800 bg-slate-900 p-4 text-sm md:w-80 md:border-t-0 md:border-l">
      <header className="flex items-center justify-between">
        <h1 className="text-base font-semibold">Hexapotamaus</h1>
        <span className={`rounded px-2 py-0.5 text-xs ${connectionLabel.badge}`}>{connectionLabel.text}</span>
      </header>

      {legs.length > 1 && (
        <nav className="flex flex-wrap gap-1.5" aria-label="Leg">
          {legs.map((leg) => (
            <button
              key={leg}
              type="button"
              onClick={() => onSelect(leg)}
              className={`rounded px-2.5 py-1 ${leg === selected ? "bg-slate-100 text-slate-900" : "bg-slate-800 hover:bg-slate-700"}`}
            >
              Leg {leg}
            </button>
          ))}
        </nav>
      )}

      {report ? (
        <>
          <Section title={`Leg ${report.leg}`}>
            <div className="flex items-center gap-2">
              <span className={`rounded px-2 py-0.5 font-medium ${STATE_STYLES[report.state].badge}`}>{report.state}</span>
              <span className="text-slate-400">{STATE_STYLES[report.state].meaning}</span>
            </div>
            {!live && (
              <p className="mt-2 text-amber-300">
                {connection === "connected" ? `No status for ${((ageMs ?? 0) / 1000).toFixed(1)} s` : "Last known: the brain is away"}
              </p>
            )}
          </Section>

          <Section title="Joint angles">
            <dl className="grid grid-cols-[1fr_auto] gap-y-1 font-mono tabular-nums">
              {(["coxa", "femur", "tibia"] as const).map((joint) => (
                <Row key={joint} label={joint} value={`${report.angles[joint].toFixed(2)}°`} />
              ))}
            </dl>
          </Section>

          {geometry && <FootPosition geometry={geometry} report={report} />}

          <Section title="Switches">
            <ul className="space-y-1">
              {(Object.keys(SWITCH_LABELS) as (keyof SwitchStates)[]).map((name) => (
                <li key={name} className="flex items-center justify-between">
                  <span>{SWITCH_LABELS[name]}</span>
                  <span className={report.switches[name] ? "font-medium text-red-300" : "text-slate-500"}>
                    {report.switches[name] ? "tripped" : "open"}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        </>
      ) : (
        <p className="text-slate-400">No leg has reported yet.</p>
      )}

      {geometry && (
        <Section title="Geometry">
          <dl className="grid grid-cols-[1fr_auto] gap-y-1 font-mono tabular-nums">
            <Row label="coxa" value={`${geometry.coxa} mm`} />
            <Row label="femur" value={`${geometry.femur} mm`} />
            <Row label="tibia" value={`${geometry.tibia} mm`} />
            <Row label="tibia offset" value={`${geometry.tibiaOffset}°`} />
          </dl>
        </Section>
      )}
    </aside>
  );
}

function FootPosition({ geometry, report }: { geometry: LegGeometry; report: LegReport }) {
  const { foot } = forwardKinematics(geometry, report.angles);
  return (
    <Section title="Foot (leg frame)">
      <dl className="grid grid-cols-[1fr_auto] gap-y-1 font-mono tabular-nums">
        <Row label="x" value={`${foot.x.toFixed(1)} mm`} />
        <Row label="y" value={`${foot.y.toFixed(1)} mm`} />
        <Row label="z" value={`${foot.z.toFixed(1)} mm`} />
      </dl>
    </Section>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-right">{value}</dd>
    </>
  );
}
