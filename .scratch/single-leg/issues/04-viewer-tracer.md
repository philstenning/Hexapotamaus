# 04 — Viewer tracer: three.js leg viewer fed live by the brain

Status: ready-for-agent
Type: AFK

## Parent

[Single-leg milestone spec](../spec.md)

## What to build

Build a fresh dashboard: a Vite + React app styled with Tailwind CSS (wherever possible, rather than hand-written CSS), with a three.js scene rendered through React Three Fiber. It connects to a WebSocket feed from the brain and draws the leg live from reported joint angles, starting with a simple segment model. The brain publishes joint angles and leg controller state on the feed. The leg is drawn using forward kinematics from the `kinematics` package, built here with the leg geometry as configuration (coxa 50, femur 90, tibia 135, tibia offset 0°).

## Acceptance criteria

- [ ] Starting the brain plus the simulated leg and opening the dashboard shows the leg moving as setpoints change.
- [ ] Forward kinematics is a pure, tested function. The leg geometry is configuration, not constants.
- [ ] The viewer shows the leg controller state.
- [ ] The viewer reconnects after the brain restarts.
- [ ] The viewer code doesn't know whether the leg is simulated or real.

## Blocked by

- [02](02-protocol-tracer.md)
