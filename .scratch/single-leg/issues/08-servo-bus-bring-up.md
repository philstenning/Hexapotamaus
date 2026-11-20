# 08 — Servo bus bring-up on the XIAO ESP32-C6

Status: ready-for-human
Type: HITL (bench hardware, oscilloscope)

## Parent

[Single-leg milestone spec](../spec.md)

## What to build

Create the leg-controller firmware project: PlatformIO, the official espressif32 platform, Arduino core 3.3.12, a XIAO ESP32-C6 target, plus a native host-test environment. Then:

1. **Write our own LX-16A driver**, from Hiwonder's protocol PDF: position write and read, temperature, voltage and error flags, stored angle limits, and torque on/off.
2. **Wire the XIAO to one LX-16A** through a 3.3 V ↔ 5 V level shifter on the single-wire bus.
3. **First test whether the LX-16A accepts a 3.3 V open-drain signal**, and record the result.
4. **Check the bus** with the oscilloscope: levels, timing, reply latency, and whether the bus echoes.

The servo-independent logic (the joint calibration mapping) is host-tested. The driver sits behind the servo driver interface from ADR 0001, so a PWM driver could replace it.

## Acceptance criteria

- [ ] The firmware builds for the XIAO, and the host tests run with PlatformIO's native environment.
- [ ] From the serial console, the XIAO moves one LX-16A to commanded positions and reads them back, along with temperature, voltage and error flags.
- [ ] Scope captures (or notes) of bus levels and timing are saved under `docs/hardware/`, including the 3.3 V test result and the measured reply latency.
- [ ] The wiring is documented: XIAO pins, level shifter, servo, bench supply at 7.4 V with about a 3 A limit, fuse, capacitor.
- [ ] Bench setup: the Eventek PSU at 7.4 V, current limit about 3 A, over-voltage protection about 8.5 V if available.

## Blocked by

- [01](01-housekeeping-and-workspace.md) (repo layout only, so it can start alongside 02)
