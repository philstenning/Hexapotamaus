# LX-16A dimensions

Taken from Hiwonder's drawings in the vendor archive (`3.Drawings/`: `LX16A.dwg` (drawing LX16A-A01, 1:1), `Side Cover.dwg`, `Bottom Cover.dwg`), read from SVG exports on 2026-11-20. The drawings themselves are Hiwonder's and stay out of git. All sizes in mm.

Axes used here: **length** runs from the output end (the end nearest the output shaft) to the far end, **width** across the case, **height** from the bottom face to the top face (the output shaft side).

## Servo body

| Size | Value | Notes |
|---|---|---|
| Length | 45.22 | |
| Width | 24.72 | |
| Height, case | 32 | The case alone |
| Height, case and top boss | 35 | |
| Height overall | 36.3 | Shaft top to bottom boss |
| Height, top face to bottom face | 29.2 | Where the mounting holes are; the owner's model has 28.8 |
| Output shaft axis from output end | 10.11 | On the width centreline |
| Bottom boss offset in end view | 6 | Width of the bottom boss / connector stub, to confirm |

## Mounting holes

Four screw holes on the top face and four on the bottom face, symmetric about the width centreline. Positions come from the dimension extension lines in the drawing (it is 1:1 in points, so they are exact to about 0.01 mm), measured from the output shaft axis along the length:

| Face | Holes along length (from shaft axis) | Spacing | Across width | Notes |
|---|---|---|---|---|
| Top (shaft side) | 8.30 and 29.00 | 20.7 | ±10.25 (20.5) | 18.41 and 39.11 from the output end |
| Bottom | 8.30 and 32.75 | 24.45 | ±10.25 (20.5) | 18.41 and 42.86 from the output end |

Other dimensions on the drawing locate recesses and ribs around the holes: 14 and 19.5 across, 9.36 and 0.82 along (top face); 13.5 and 18.48 across, 6.38, 17.79, 2.36, 0.74 and 5.61 along (bottom face).

## Cross-check against the owner's 2021 Fusion parts (2026-11-20)

The owner's Fusion servo model (`servo_motor.step`, sketches `motor_1.dxf` / `motor_2.dxf`) has its origin on the shaft axis at the top face. The 2021 printed `bottom-bracket-2021v1` and `Arm` use the same origin.

| Feature | Hiwonder drawing | Owner's servo model | 2021 printed bracket / arm |
|---|---|---|---|
| Length / shaft from output end | 45.22 / 10.11 | 45.2 / 10.1 | |
| Width | 24.72 | 24.2 | |
| Top face to bottom face | 29.2 | 28.8 | |
| Top-face holes along | 8.30, 29.00 | 8.9, 29.9 | 28.9 |
| Bottom-face holes along | 8.30, 32.75 | 8.1, 32.4 | 32.7 |
| Holes across | ±10.25 | ±10.0 | ±10.2 |
| Horn holes | (not drawn) | | 4 × Ø2 on a 14 mm pitch circle |
| Horn recess / spline clearance | (not drawn) | Ø19.2 / Ø6 | Ø19.2 / Ø6.2 |
| Passive boss, bottom | (not drawn) | Ø2.18 pin, 4 below the bottom face | Ø5.6 bearing, 34.1 below the horn face |

The bracket that was printed and fitted agrees with the Hiwonder drawing to 0.1 mm, while the servo model's holes are 0.2-0.9 mm off. **Use the drawing's numbers.** Calipers on a real servo gave 24.7 wide (2026-11-20), confirming the drawing's 24.72. The height (28.8 vs 29.2) is still to check.

## Hiwonder metal brackets (for reference)

These are the stock 1.5 mm sheet-metal brackets. Their hole patterns tell us what the servo's own hole patterns are.

- **Side cover (U bracket that wraps the far end):** 35.5 wide outside. Its flat face has a Ø8 hole on the bracket axis and 4 × Ø2.1 holes on a 14 mm pitch circle at 45°. The ears have hole spacings of 20.7 and 24.45, matching the servo's top and bottom faces.
- **Bottom cover (bracket on the bottom face):** 24 wide, 35.5 outside / 32.5 inside, 1.5 thick, 13.7 overall height. 8 × Ø2.1 holes on a 14 mm pitch circle. Ears 10 high with holes 20.5 apart, matching the servo's 20.5 hole spacing across the width.

The brackets and the 2021 `Arm` share the 14 mm pitch circle. The owner doesn't use Hiwonder's horn (see below).

## Still to measure on a real servo

- Output spline: Ø6 brass in the owner's model; tooth count and exact diameter to confirm
- Mounting screw size (likely M2 self-tapping; holes are Ø2.1 on the brackets)
- Cable exit position and connector clearance

## How the 2021 arm attached (worked; owner's notes, 2026-11-20)

The 2021 `Arm` had no Hiwonder horn: the horn was modelled into the printed part.

- **Drive side (brass spline):** a plain Ø6.2 bore in PLA, standard wall thickness, pulled onto the spline by an M3 × 6 countersunk machine screw into the shaft. Tightening the screw pressed the PLA into the spline teeth, so the bore formed its own spline.
- **Passive side (bottom boss):** an M3 × 8 button-head screw with a washer, into the servo's plastic boss. Tightened, then backed off a quarter turn, so the arm turns on the screw as a plain bearing. A little silicone grease stops it binding or heating up.

The new leg can reuse this. The joints carrying the most torque (the femur) are the ones to watch for the PLA creeping or the formed spline slipping.

## Fit measured on an unused 2021 bottom bracket (2026-11-20)

| | Designed | Printed (calipers) | Fitted on a servo |
|---|---|---|---|
| Inside width | 24.2 | 24.2 | Outside grew from 26.5-26.6 to 27.3: the walls stretch about 0.7 |
| Outside width | 26.6 | 26.6 | |
| Inside height, lip to lip | 32.8 | 32.7 | Snug, no stretch |
| Inside height at the ridge recesses | 35.6 | 35.8 | |

- The servo is 24.7 wide where the bracket sits too, so 24.7 holds along the whole case.
- The 0.5 mm interference held the servo well but was a bit tight. New gripping parts use `servo_width - grip_interference`, with `grip_interference` = 0.2 to start.
- Lip to lip is 32.7 (`servo_mount_height`): the printed bracket's inside fitted snugly with no clearance.
- The bracket fits either way round (turned 180°).
