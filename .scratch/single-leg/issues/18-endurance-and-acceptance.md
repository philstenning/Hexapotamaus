# 18 — Endurance, voltage sag test and acceptance report

Status: ready-for-human
Type: HITL (bench, long runs)

## Parent

[Single-leg milestone spec](../spec.md)

## What to build

An acceptance run on the real leg that runs every done-criterion and writes a pass/fail report:

1. accuracy and repeatability on the checking points
2. 20 power-on cycles in a row, each passing the limit switch check
3. a 1-hour step-cycle endurance run, logging faults and servo temperatures
4. safety checks:
   - an unreachable target is refused
   - a limit switch trip stops the leg
   - silence causes hold
   - emergency stop faults the leg

Also run a supply-voltage sag test: lower the bench supply step by step and record when the LX-16As reset or lose torque.

## Acceptance criteria

- [ ] One command runs the acceptance suite (with prompts for the manual steps, such as power cycling) and writes a dated report to the repo.
- [ ] The report shows a pass on all four done-criteria. That ends the milestone.
- [ ] Voltage sag findings are recorded in `docs/hardware/`, to inform the battery choice.

## Blocked by

- [16](16-calibrate-real-leg.md)
- [17](17-power-on-check.md)
