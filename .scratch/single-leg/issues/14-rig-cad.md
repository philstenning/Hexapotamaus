# 14 — Calibration rig CAD and print (owner track)

Status: ready-for-human
Type: HITL (owner's CAD and printing)

## Parent

[Single-leg milestone spec](../spec.md)

## What to build

Design and print the calibration rig in SolidCraft, following the modelling rules:

- a pegboard baseplate with about a 20 mm hole grid
- a hip mount copying the body's hip position for one leg
- plug-in height pads in about three heights
- 2–3 side posts with microswitches

Dimensions are named parameters. Make the real layout file match the printed rig.

## Acceptance criteria

- [ ] Rig sources and STLs are in the repo under `hardware/cad/`.
- [ ] The rig is printed. The pad heights and positions of a few probe points are measured with calipers and agree with the layout file within 0.5 mm, or the layout file is corrected.
- [ ] The side-post switches are wired to the leg controller's inputs and reported over CAN.

## Blocked by

- [11](11-leg-cad.md) (for the hip mount and the leg's reach)
