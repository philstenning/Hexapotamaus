# 15 — Assemble the real leg on the rig and probe it

Status: ready-for-human
Type: HITL (assembly, bench)

## Parent

[Single-leg milestone spec](../spec.md)

## What to build

Assemble the printed leg with its three LX-16As, the limit switches and the plunger foot, mounted on the rig's hip mount and wired to the leg controller. Set an initial rough joint calibration (from slice 11's cam angles and hand measurement). Run the slice-12 probe routine against the real rig.

## Acceptance criteria

- [ ] The leg is assembled and mounted. Every switch reports correctly over CAN.
- [ ] The full conformance suite still passes with the real leg mounted.
- [ ] The probe routine measures every probe point on the real rig without a fault, and the measurements are saved.
- [ ] Any probe point the leg can't reach or touch cleanly is fixed in the layout or the rig.

## Blocked by

- [10](10-firmware-safety-parity.md)
- [11](11-leg-cad.md)
- [13](13-calibration-fit-in-sim.md)
- [14](14-rig-cad.md)
