# 02 — Protocol tracer: joint setpoints from the brain to the simulated leg

Status: ready-for-agent
Type: AFK

## Parent

[Single-leg milestone spec](../spec.md)

## What to build

This is the first end-to-end path. The brain streams joint angle setpoints at a fixed rate, and a simulated leg follows them and reports status back. Everything runs in one process through the brain's frame transport interface ("send and receive frames").

- **Write the first version of the protocol spec** in `docs/`, covering:
  - the CAN ID scheme
  - the bitrate (default 1 Mbit/s)
  - the joint setpoint frame: three int16 joint angles in 0.01° steps plus a sequence number, 8 bytes
  - the status frame: joint angles and leg controller state
- **The `protocol` package** encodes and decodes these frames.
- **The simulated leg** smooths motion between setpoints and reports status.
- **The protocol conformance suite starts here.** It drives a leg only through frames, and it is written so it can later run against the real leg.

## Acceptance criteria

- [ ] The protocol spec exists in `docs/` and defines the setpoint and status frames, the CAN ID scheme and the bitrate.
- [ ] Encode/decode round-trip tests pass for both frame types, including angle limits and sequence number wraparound.
- [ ] Through the in-process transport, a brain streaming setpoints at 50 Hz makes the simulated leg report joint angles that converge on the setpoints.
- [ ] The conformance suite is a separate, reusable test set, parameterised by transport and leg target, and its first tests pass against the simulated leg.

## Blocked by

- [01](01-housekeeping-and-workspace.md)
