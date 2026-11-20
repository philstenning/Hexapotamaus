# 17 — Power-on limit switch check

Status: ready-for-agent
Type: AFK (real-hardware verification happens in 18)

## Parent

[Single-leg milestone spec](../spec.md)

## What to build

Add the limit switch check as an explicit leg controller mode, in both the firmware and the simulated leg, started by the brain after the calibration upload. Each joint creeps slowly toward its limit switch; the leg reports the trip angle and returns to a safe pose. The brain compares the trip angles against the joint calibration. If they're within tolerance the leg may run; otherwise the brain refuses to run it and asks for recalibration.

## Acceptance criteria

- [ ] The protocol spec and the conformance suite cover the limit switch check.
- [ ] In the simulator, a check with matching calibration passes, and a check with an injected offset change (a slipped horn) fails and blocks motion.
- [ ] The firmware implements the same mode. The check runs at creep speed, and torque stays on throughout, except on a real fault.
- [ ] The tolerance is configurable and documented.

## Blocked by

- [10](10-firmware-safety-parity.md)
- [13](13-calibration-fit-in-sim.md)
