# 16 — Calibrate the real leg

Status: ready-for-human
Type: HITL (bench)

## Parent

[Single-leg milestone spec](../spec.md)

## What to build

Run the full calibration on the real leg (probe → fit → upload), then evaluate the checking points. Commit the resulting calibration file. If the targets aren't met, work out where the error comes from (slack, switch jitter, rig accuracy, fit model) using the logs and replay, and either fix it or record why.

## Acceptance criteria

- [ ] The real leg's calibration file is committed, keyed by its chip ID.
- [ ] Checking points: accuracy within ±3 mm, and repeatability from different directions within ±1.5 mm. If not, the findings are recorded with a plan.
- [ ] The commanded vs actual foot positions in the viewer agree with the checking results.

## Blocked by

- [15](15-assemble-leg-on-rig.md)
