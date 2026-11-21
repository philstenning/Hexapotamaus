# Leg segments are small printed parts bolted together

Each leg segment is built from small printed parts screwed together, not printed as one piece. This follows the 2021 build:

- an **arm** fits over a servo's output: its built-in horn clamps the spline at one side, and it turns on the passive boss at the other. It is itself three parts: two flat side plates (one on the spline, one on the boss) and a small base piece bolted between them;
- a **bracket** is a sleeve that grips a servo's case at its far end;
- the arm and the bracket are bolted together with M3 screws into Ø2.8 pilot holes, which the screw threads itself (normal slicer wall settings were enough). No inserts or nuts. Where two joint axes are at 90° (coxa to femur), a joiner sits between the arm and the bracket;
- brackets fix to the servo with the factory self-tapping screws through Ø2 holes in all four corners.

The 2021 layout, from the body outwards: `[body]-[ __o]--[o__]--[o__]>` (`o` is a servo's shaft). The coxa servo's case sits in the body with its shaft outboard; the femur and tibia servos have their shafts inboard and their cases pointing out along their own segment. So:

- **coxa** = arm on the coxa servo + joiner (90° turn) + arm on the femur servo. No servo case in it, so it is light and short;
- **femur** = femur servo case + bracket on its far end + link + arm on the tibia servo;
- **tibia** = tibia servo case + bracket on its far end + the tibia beam to the foot.

Photos of a 2021 leg laid flat: `images/PXL_20261121_160544336.jpg`, `PXL_20261121_160552934.jpg`, `PXL_20261121_160601335.jpg`. They also show:

- the coxa servo is held by a bracket on its far end, and that bracket mounts the leg to the body, a frame of 10 × 10 mm MakerBeam profile (`images/PXL_20261121_170135529.jpg`, `PXL_20261121_170338000.jpg`). The version that worked best (`images/PXL_20261121_170722932.jpg`): the end cap carries a block with a 10 mm channel that sits over the beam, and one M3 machine screw through its middle into a nut in the beam's T-slot clamps it tight. The leg can be slid along the beam before tightening;
- the femur bracket bolts straight to the base of the tibia arm (two screws), with no joiner, because those two axes are parallel;
- the tibia beam has its bracket sleeve printed into it, with lightening holes and a rubber tip at the foot.

We chose this because the parts are awkward to print in one piece. Every part is designed to **print flat**:

- the load runs along the layers, so parts don't snap across the grain (a one-piece U arm breaks across the layers whichever way it is printed);
- holes and hubs lie flat on the bed, so they print round (vertical circles come out squashed);
- few or no supports, so a part prints in about 5 minutes.

Small parts can each be printed in their strongest orientation. A broken or stripped part is a short reprint, not a long print of the whole segment. Fits can be tuned (`fit_clearance`, `grip_interference`) by reprinting one small part.

Once the design has settled, with the limit switches in place to prevent breakages, a final build may merge parts or use a stronger plastic.

## Consequences

- **Parts are interchangeable where possible.** The same side plate, base piece or joiner serves several joints, so one spare covers many breakages.
- **Every part has a flat print orientation**, chosen when it is designed: no part needs a vertical circle or a load across its layers.
- **Every arm and bracket has a bolted interface** that has to stay the same across reprints and versions. The CAD defines it once, as parameters, and both parts use it.
- **Screw holes are pilot holes sized for screws to self-tap into PLA.** Re-threading a hole means reprinting that part.
- **Arm bases always take the screw head.** Their two holes (26 mm apart) are M3 clearance; the screws go from inside the arm, before the servo and side plates are fitted, into Ø2.8 pilots in the joiner or the bracket end cap. So any arm base fits any joiner or bracket.
- **The femur's length is set by a long tibia arm** (`tibia_arm_reach`, derived from `femur_length`), whose base bolts straight to the femur bracket, instead of a separate link. The base piece is the standard one; only the two side plates are longer.
- **Segment lengths come from the arm and bracket together.** Changing `femur_length` changes the arm, the bracket or a spacer between them, not one big part.
