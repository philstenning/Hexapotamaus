# 06 — Leg controller behaviour in the simulated leg

Status: ready-for-agent
Type: AFK

## Parent

[Single-leg milestone spec](../spec.md)

## What to build

Give the simulated leg the full leg controller behaviour, and extend the protocol and conformance suite to match.

- **States:** Uncalibrated, Ready/following, Hold, Fault.
- **Calibration:** the leg refuses to move until it receives its joint calibration upload (offset, direction, scale, allowed range, servo ID per joint).
- **Joint ranges:** the leg enforces each joint's allowed range itself.
- **Hold:** after about 100 ms without setpoints the leg holds, and it continues only on an explicit resume.
- **Faults and emergency stop:** emergency stop is the lowest CAN ID and faults the leg. Simulated faults (limit switch trip, over-temperature, stall) can be triggered from tests.
- **Leg identity:** the leg reports its chip ID on connect. Its leg position is set by command and kept.
- **The brain's leg session:** on connect, the brain looks up the joint calibration by chip ID (from a JSON file), uploads it, and flags a mismatch.

## Acceptance criteria

- [ ] The protocol spec defines frames for calibration upload, resume, emergency stop, fault reporting, chip ID and setting the leg position.
- [ ] The conformance suite covers each of these, and passes against the simulated leg:
  - no motion before calibration
  - out-of-range setpoints refused or clamped and reported (chosen behaviour documented)
  - hold after silence
  - no motion after silence until resume
  - emergency stop faults the leg
  - each fault type turns torque off and is reported
- [ ] The brain uploads calibration on connect and reports a chip ID with no calibration file.
- [ ] The viewer shows the state and faults.

## Blocked by

- [02](02-protocol-tracer.md)
