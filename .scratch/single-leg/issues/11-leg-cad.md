# 11 — Leg CAD in SolidCraft (owner track)

Status: ready-for-human
Type: HITL (owner's CAD work; the SolidCraft MCP can assist)

## Parent

[Single-leg milestone spec](../spec.md)

## What to build

Design the new leg in SolidCraft, following the modelling rules: every part from a fully constrained sketch, sizes as named parameters, extrudes, patterns.

- **Parameters:** `coxa_length` 50, `femur_length` 90, `tibia_length` 135 (straight line, joint to foot tip), `tibia_offset` 0°.
- **Servo reference:** Hiwonder's `LX-16A.STEP`, the only imported part.
- **Sprung plunger foot:** about 3–4 mm of travel, the foot contact switch tripping after about 1 mm, a hard stop so load bypasses the switch, and a replaceable TPU/rubber tip.
- **Limit switches:** a cam on each joint that trips its limit switch a few degrees beyond the allowed range, on the damaging side.
- **Wiring:** a route for the switch wires along the leg.
- **Old parts:** Fusion exports, if any, go in a reference folder only.

## Acceptance criteria

- [ ] SolidCraft sources are in the repo under `hardware/cad/`, with the four leg parameters named as above.
- [ ] Printable STLs are exported next to the sources.
- [ ] The plunger foot is printed and tested by hand: the switch trips reliably, and loading the foot bottoms out the plunger without stressing the switch.
- [ ] Each joint's cam position and limit switch trip angle are recorded, to feed the allowed ranges in the joint calibration.
- [ ] Optional: export the leg as URDF from SolidCraft, for the viewer to use later.

## Blocked by

None. Can start immediately.
