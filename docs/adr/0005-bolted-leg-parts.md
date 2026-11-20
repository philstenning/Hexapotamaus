# Leg segments are small printed parts bolted together

Each leg segment is built from small printed parts screwed together, not printed as one piece. This follows the 2021 build:

- an **arm** fits over a servo's output: its built-in horn clamps the spline at one side, and it turns on the passive boss at the other. It is itself three parts: two flat side plates (one on the spline, one on the boss) and a small base piece bolted between them;
- a **bracket** is a sleeve that grips the next servo's case;
- the arm and the bracket are bolted together with M3 screws into Ø2.8 pilot holes, which the screw threads itself (normal slicer wall settings were enough). No inserts or nuts. Where two joint axes are at 90° (coxa to femur), a joiner sits between the arm and the bracket;
- brackets fix to the servo with the factory self-tapping screws through Ø2 holes in all four corners.

So a segment is "the arm on one joint's servo plus the bracket that holds the next joint's servo".

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
- **Segment lengths come from the arm and bracket together.** Changing `femur_length` changes the arm, the bracket or a spacer between them, not one big part.
