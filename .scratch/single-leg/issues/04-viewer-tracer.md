# 04 — Viewer tracer: three.js leg viewer fed live by the brain

Status: ready-for-agent
Type: AFK

## Parent

[Single-leg milestone spec](../spec.md)

## What to build

Build a fresh dashboard: a Vite + React app styled with Tailwind CSS (wherever possible, rather than hand-written CSS), with a three.js scene rendered through React Three Fiber. It connects to a WebSocket feed from the brain and draws the leg live from reported joint angles, starting with a simple segment model. The brain publishes joint angles and leg controller state on the feed. The leg is drawn using forward kinematics from the `kinematics` package, built here with the leg geometry as configuration (coxa 50, femur 90, tibia 135, tibia offset 0°).

## Acceptance criteria

- [x] Starting the brain plus the simulated leg and opening the dashboard shows the leg moving as setpoints change.
- [x] Forward kinematics is a pure, tested function. The leg geometry is configuration, not constants.
- [x] The viewer shows the leg controller state.
- [x] The viewer reconnects after the brain restarts.
- [x] The viewer code doesn't know whether the leg is simulated or real.

## Blocked by

- [02](02-protocol-tracer.md)

## Comments

2026-11-22: Done, on `main`. Notes for later slices:

- **Joint angle convention** is now defined in [docs/kinematics.md](../../../docs/kinematics.md): leg frame z-up, x out along the coxa at 0°; all joints 0° = leg straight out; coxa positive anticlockwise from above, femur positive up, tibia positive bends the foot down, tibia offset adds to the tibia angle. The default stance is about coxa 0°, femur 16°, tibia 109°. Slice 05's IK must use this.
- **Geometry is configuration:** `config/leg-geometry.json`, checked by `parseLegGeometry`; the brain loads it (`--geometry`) and sends it to the viewer in the feed's `hello`. Calibrated segment lengths (slice 13) can replace it per leg.
- **Feed:** `startViewerFeed` in `brain` (WebSocket via `ws`, default `127.0.0.1:8787`); message types in `@hexapotamaus/brain/viewer-feed-messages`, documented in [docs/viewer.md](../../../docs/viewer.md). It only reports for now; slice 05's foot target control will need viewer → brain messages, and the commanded setpoint isn't on the feed yet.
- **Viewer:** `packages/dashboard`, run with `pnpm dashboard`. `createFeedClient` reconnects every second and keeps the last status while the brain is away; tested against the real feed server, including a brain restart on the same port.
- **Faults:** the status frame has no fault detail yet, so the viewer shows the Fault state and the switch states only. Slice 06 should add fault reasons to the feed.
- The brain's default sweep now runs around the default stance instead of the all-zero pose.
