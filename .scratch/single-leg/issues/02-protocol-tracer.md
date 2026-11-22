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

- [x] The protocol spec exists in `docs/` and defines the setpoint and status frames, the CAN ID scheme and the bitrate.
- [x] Encode/decode round-trip tests pass for both frame types, including angle limits and sequence number wraparound.
- [x] Through the in-process transport, a brain streaming setpoints at 50 Hz makes the simulated leg report joint angles that converge on the setpoints.
- [x] The conformance suite is a separate, reusable test set, parameterised by transport and leg target, and its first tests pass against the simulated leg.

## Blocked by

- [01](01-housekeeping-and-workspace.md)

## Comments

2026-11-22: Done, on branch `02-protocol-tracer`. Notes for later slices:

- **Spec:** [docs/protocol.md](../../../docs/protocol.md), version 0.1. CAN ID = `(function << 3) | node`, node 0 broadcast, 1–6 legs. Emergency stop `0x000`, fault report `0x01`, setpoint `0x02`, status `0x03`, command `0x04`, reply `0x05` (the others are reserved for slice 06). 1 Mbit/s, little-endian, angles int16 0.01° with `0x8000` reserved. Status byte 7 carries the four switch bits already, so the status frame doesn't change in slice 06.
- **Decided in the spec beyond the issue:** stale and duplicate setpoints are ignored using serial number arithmetic; after 100 ms with no accepted setpoint the leg accepts any sequence number (so a restarted brain can start at 0); the leg arrives at each setpoint about one setpoint period later, capped at its maximum joint speed; malformed frames are ignored.
- **Where things live:** `CanFrame`, the `FrameTransport` interface, the in-process bus and the `Clock` (`systemClock`, `ManualClock`) are in `protocol`, not `brain`, because the simulated leg and the conformance suite need them too and `sim` mustn't depend on `brain`. All of it is browser-safe; the SocketCAN transport (slice 03) needs native code, so it should *not* go in `protocol`.
- **Conformance suite:** a new package, `packages/conformance`. `describeLegConformance(target)` takes a `LegTarget` (how to connect: transport + clock; leg position; max joint speed; optional safe poses). It uses only `protocol`, never `brain`, so a brain bug can't hide a leg bug. It runs against two simulated legs on the in-process bus. Each test was checked by breaking the simulated leg on purpose (no stale check, naive sequence compare, no speed cap, wrong-leg ID match, no resync): each break fails the matching test.
- **Slice 06 will need to change the suite:** each test starts with 150 ms of silence (for the resync), and tests assume the leg starts in Ready. Once Hold and the Uncalibrated start exist, the suite setup must upload the calibration and resume.
