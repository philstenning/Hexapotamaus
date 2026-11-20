# Hexapotamaus

A six-legged walking robot with three-joint legs, plus the simulation, calibration rig and tools used to develop it. Open source; servo hardware is interchangeable.

## Language

### Body and legs

**Leg**:
One of the six limbs, made of a coxa, a femur and a tibia joined by three joints.

**Coxa**:
The first leg segment, from the body to the femur joint.
_Avoid_: hip arm, motor 1 section

**Femur**:
The second leg segment, from the coxa to the tibia joint.
_Avoid_: upper leg, motor 2 section

**Tibia**:
The last leg segment, from the femur to the foot.
_Avoid_: lower leg, leg section

**Joint**:
A rotational axis of a leg, named after the segment it moves: coxa joint, femur joint, tibia joint.
_Avoid_: motor 1/2/3

**Foot**:
The tip of the tibia, the only part of a leg meant to touch the ground.
_Avoid_: toe, end effector

### Control

**Brain**:
The central computer (a Raspberry Pi) that decides what the whole robot does: gait, body motion, vision.
_Avoid_: main controller, master, host

**Leg controller**:
The microcontroller dedicated to one leg. It drives that leg's servos, reads its switches and enforces its joint limits.
_Avoid_: leg MCU, leg board, slave

### Actuation

**Servo**:
The actuator that drives one joint. It may be a serial bus servo (LX-16A today) or a PWM servo.
_Avoid_: motor

**Joint angle**:
The angle of a joint in the robot's own geometry. This is what kinematics and gaits work in.
_Avoid_: position, motor angle

**Servo position**:
A value in a specific servo's own command units, such as 0–1000 on an LX-16A or a pulse width on a PWM servo.
_Avoid_: angle

**Joint calibration**:
The per-joint mapping between joint angle and servo position: offset, direction, scale and allowed range.
_Avoid_: offsets (on their own), trim

### Sensing and calibration

**Limit switch**:
A switch that trips when a joint reaches the edge of its allowed range.
_Avoid_: end stop

**Homing**:
Finding a joint's reference angle by moving it slowly until its limit switch trips.

**Foot contact switch**:
A switch in the foot that trips when the foot is bearing on something.
_Avoid_: toe switch

**Calibration rig**:
A fixture holding switches at known positions, which a leg presses with its foot to measure where the foot really is.
_Avoid_: test grid

**Probe point**:
One switch on the calibration rig, at a known position.
