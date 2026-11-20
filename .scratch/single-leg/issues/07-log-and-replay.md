# 07 — Message log and replay in the viewer

Status: ready-for-agent
Type: AFK

## Parent

[Single-leg milestone spec](../spec.md)

## What to build

The brain logs every frame it sends and receives, with timestamps, to a simple log file per run. The viewer can load a log and replay it with play, pause, scrub and speed controls. It shows the leg, the switch states and the faults over time, so you can see why the leg did what it did.

## Acceptance criteria

- [ ] Every brain run writes a log, in a documented format, that includes all frames in both directions.
- [ ] Replaying a log in the viewer reproduces the live view: leg pose, state, switch states and faults.
- [ ] Scrubbing to any moment shows the state at that moment.
- [ ] Logs from the simulated and real leg replay the same way.

## Blocked by

- [04](04-viewer-tracer.md)
