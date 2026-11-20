# 10 — Firmware safety parity with the simulated leg

Status: ready-for-human
Type: HITL (bench hardware, switches wired loose on the bench)

## Parent

[Single-leg milestone spec](../spec.md)

## What to build

Bring the real leg controller to full behavioural parity with the simulated leg from slice 06:

- the states, and refusing to move while uncalibrated
- calibration upload, with joint calibration held in RAM
- joint range enforcement, and writing the servos' own stored angle limits
- hold after silence, and resume
- emergency stop
- chip ID reporting, and the leg position stored on the controller

Wire three limit switches and a foot contact switch (loose microswitches on the bench for now). A limit switch trip faults the leg (torque off) at once, in an interrupt, with no round trip to the brain. The controller polls servo temperature and error flags at a few Hz, and faults on over-temperature or stall.

## Acceptance criteria

- [ ] The full conformance suite passes against the real leg controller on `can0`, using the same suite as against the simulated leg.
- [ ] Pressing a limit switch by hand during motion turns torque off. Measured latency from switch to torque off is recorded.
- [ ] The foot contact switch and limit switch states are reported and shown in the viewer.
- [ ] Servo stored angle limits are written from the joint calibration and checked by reading them back.
- [ ] The state machine and the limit logic are host-tested.

## Blocked by

- [09](09-real-can.md)
