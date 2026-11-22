import type { LegStateName } from "@hexapotamaus/protocol";

/** How each leg controller state is shown: a color for the 3D leg, and Tailwind classes for its badge. */
export const STATE_STYLES: Record<LegStateName, { color: string; badge: string; meaning: string }> = {
  Uncalibrated: { color: "#a78bfa", badge: "bg-violet-500/20 text-violet-300", meaning: "Waiting for its joint calibration" },
  Ready: { color: "#4ade80", badge: "bg-green-500/20 text-green-300", meaning: "Following setpoints" },
  Hold: { color: "#fbbf24", badge: "bg-amber-500/20 text-amber-300", meaning: "Holding position until the brain resumes it" },
  Fault: { color: "#f87171", badge: "bg-red-500/20 text-red-300", meaning: "Torque off" },
};
