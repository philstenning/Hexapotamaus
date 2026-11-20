# 09 — Real CAN: brain drives the real servos over can0

Status: ready-for-human
Type: HITL (bench hardware)

## Parent

[Single-leg milestone spec](../spec.md)

## What to build

Put the leg controller on a real CAN bus: the XIAO's TWAI peripheral with an SN65HVD230 transceiver, and the SH-C31A adapter on the laptop as `can0` (attached to WSL with usbipd). The firmware implements the slice-02 protocol: setpoints with smoothing, and status reports. It drives three LX-16As using the slice-08 driver and a joint calibration. The brain drives the real servos with joint angles, exactly as it drives the simulated leg.

## Acceptance criteria

- [ ] `can0` comes up at the protocol's bitrate, and `candump can0` shows the setpoint and status frames.
- [ ] The brain moves three real servos with joint angle setpoints, and the viewer shows them live.
- [ ] The setpoint and status tests from the conformance suite pass against the real leg controller on `can0`.
- [ ] Termination is correct: 120 Ω at the adapter and at the transceiver only. The setup steps (usbipd attach, `ip link`) are documented.
- [ ] The CAN signals have been checked on the oscilloscope, and a capture is saved.

## Blocked by

- [03](03-virtual-can.md)
- [06](06-leg-controller-behaviour-in-sim.md)
- [08](08-servo-bus-bring-up.md)
