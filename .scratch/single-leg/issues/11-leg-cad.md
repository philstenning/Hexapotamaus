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

## Comments

2026-11-20: Progress, and where to pick up.

Done in `hardware/cad/hexapotamaus.sc` (SolidCraft, connected from WSL with `--connect 127.0.0.1:27878`; Claude can't save to the `\\wsl.localhost` path, so the owner saves with Ctrl+S):

- `Leg` component with the four leg parameters, plus `stance_reach` 80 / `stance_drop` 110, `fit_clearance` 0.2, `grip_interference` 0.2, `m3_pilot_d` 2.8, `servo_screw_hole_d` 2.
- `LX-16A` reference part inside `Leg`: the real case shape (lips, top ridge, horn relief, bottom notch, panel, connector recess, mounting holes on the lips), all `servo_*` parameters. Sources and checks: `docs/hardware/lx-16a-dimensions.md`.
- `Leg skeleton` sketch: coxa, femur and tibia lines and the foot tip in the default stance, fully constrained.
- Old Fusion parts for reference: `hardware/cad/reference/fusion-v1/`.
- Design rules agreed: ADR 0005 (small flat-printed parts bolted together; arm = two side plates + base piece; brackets grip the servo; joiner for the 90° coxa-to-femur turn).

Next:

1. **Owner to answer:** in 2021, which way did the femur and tibia servo bodies point from their shafts (back to the body, out along the leg, up or down)? A STEP of the old leg assembly would settle it. This sets each segment's length budget.
2. Place three `LX-16A` occurrences on the skeleton (coxa shaft vertical; femur and tibia shafts horizontal along Y).
3. Design the side plate, base piece, bracket and joiner as flat sketches + extrudes, sized from the servo parameters.
