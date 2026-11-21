# 11 — Leg CAD in SolidCraft (owner track)

Status: ready-for-human
Type: HITL (owner's CAD work; the SolidCraft MCP can assist)

## Parent

[Single-leg milestone spec](../spec.md)

## What to build

Design the new leg in SolidCraft, following the modelling rules: every part from a fully constrained sketch, sizes as named parameters, extrudes, patterns.

- **Parameters:** `coxa_length` 50, `femur_length` 90, `tibia_length` 135 (straight line, joint to foot tip), `tibia_offset` 0°.
- **Servo reference:** Hiwonder's `LX-16A.STEP`, the only imported part.
- **Sprung plunger foot:** about 1.8 mm of travel (was 3–4; limited by the KW12 switch's 1.2 mm overtravel), the foot contact switch tripping after about 1 mm, a hard stop so load bypasses the switch, and a replaceable TPU/rubber tip.
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

2026-11-21: Progress, and where to pick up.

Built in `hardware/cad/hexapotamaus.sc` (all parts parametric, sketches at dof 0; see ADR 0005 for the design rules and the 2021 layout):

- Servos placed on the skeleton: coxa (`LX-16A:1`, case into the body), femur (`:2`) and tibia (`:3`), cases along their segments. Placements are fixed numeric transforms, not yet joints.
- `Arm` (drive plate, passive plate, base) on the coxa and femur servos; `Tibia arm` (long plates, `tibia_arm_reach` from `femur_length`, standard base) on the tibia servo.
- `Joiner` (cross shape, 90° turn, thickness from `coxa_length`).
- `Bracket` (one part, three copies) on the far end of each servo. Test print 1 did not fit: the servo has a T-shaped feature on its bottom (panel plus an end tab, one piece). Fixed in the model; owner is reprinting.
- `Hip mount` + `MakerBeam (reference)`: channel over the 10 × 10 beam, one M3 into a T-slot nut.
- `Tibia beam`, `Foot housing`, `Foot plunger`, `Foot tip` (TPU): KW12 roller switch in a pocket in the beam; 1 mm to the click, hard stop at 1.8 mm.
- Screws: arm bases always take the heads (Ø3.2); joiner, bracket end caps and beam take Ø2.8 pilots.

Next:

1. Owner: reprint the bracket and check the fit; measure the servo's bottom panel/tab height (model assumes 1 mm, bracket recess is 1.8).
2. Print and hand-test the foot (beam end, housing, plunger, TPU tip, KW12, spring).
3. Limit switch cams and KW12 mounts on each joint; a KW12 reference body and a wire route.
4. Real revolute joints, then find each joint's range.
5. Export STL/3MF of every part to `hardware/3d-parts/`.
