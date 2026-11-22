# Leg kinematics conventions

The `kinematics` package (`packages/kinematics`) is the one implementation of the leg's geometry. Today the brain and the viewer use it; the simulated leg's rig and the calibration fit will use it too. This page defines the frame and the joint angle convention it uses. The [CAN protocol](protocol.md) carries joint angles in this convention.

## Leg geometry

The geometry is configuration, not code. The nominal values for the new leg are in [config/leg-geometry.json](../config/leg-geometry.json) and match the named parameters in the SolidCraft leg model:

| Field | Value | Meaning |
|---|---|---|
| `coxa` | 50 mm | Coxa joint axis to femur joint axis |
| `femur` | 90 mm | Femur joint axis to tibia joint axis |
| `tibia` | 135 mm | Tibia joint axis to the foot tip, in a straight line |
| `tibiaOffset` | 0° | How far the straight tibia-joint-to-foot line sits below the tibia's zero line. 0 for a straight tibia |

The foot tip is where the foot is at the moment the foot contact switch trips.

## The leg frame

Each leg has its own right-handed frame, in millimetres:

- **Origin:** on the coxa joint axis, at the height of the femur joint axis.
- **z:** up.
- **x:** out along the coxa when the coxa joint is at 0°.
- **y:** completes the frame, so +y is 90° anticlockwise from +x seen from above.

## Joint angles

Degrees, with every joint at 0° laying the leg straight out along +x:

| Joint | 0° | Positive |
|---|---|---|
| Coxa | Coxa along +x | Turns the leg anticlockwise seen from above |
| Femur | Femur horizontal | Raises the femur (its angle above horizontal) |
| Tibia | Tibia straight on from the femur | Bends the foot down |

The tibia offset adds to the tibia angle: the foot's direction is the femur's angle minus (tibia angle + tibia offset) below horizontal.

For example, the spec's default stance (the foot about 80 mm out from the femur joint and 110 mm below it) is about coxa 0°, femur 16°, tibia 109°.

## Forward kinematics

`forwardKinematics(geometry, angles)` returns where the coxa, femur and tibia joints and the foot are in the leg frame. It is a pure function. Inverse kinematics arrives in slice 05.
