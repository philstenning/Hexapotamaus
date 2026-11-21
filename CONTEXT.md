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

**Arm**:
A printed part fixed to a servo's output: it clamps the spline on one side and turns on the passive boss on the other. The horn is built into it. It is made of two flat side plates and a small base piece, bolted together (see ADR 0005).
_Avoid_: horn (Hiwonder's horn isn't used), U-bracket

**Bracket**:
A printed sleeve that grips a servo's case at its far end, so the segment can carry on outwards from it (see ADR 0005).
_Avoid_: servo holder, bottom cover (Hiwonder's metal part)

### Control

**Brain**:
The central computer (a Raspberry Pi) that decides what the whole robot does: gait, body motion, vision.
_Avoid_: main controller, master, host

**Leg controller**:
The microcontroller dedicated to one leg. It drives that leg's servos, reads its switches and enforces its joint limits.
_Avoid_: leg MCU, leg board, slave

**Hold**:
The leg controller's response to silence from the brain: stay at the last setpoint with torque on, until the brain explicitly says to resume.
_Avoid_: pause, freeze

**Fault**:
A condition that makes a leg controller turn its servos' torque off: a tripped limit switch, a servo over-temperature or stall error, a joint outside its allowed range, or an emergency stop.
_Avoid_: error (on its own)

**Emergency stop**:
The highest-priority CAN message, which faults every leg at once. A physical emergency-stop button separately cuts servo power.
_Avoid_: kill, halt

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
A switch that trips a few degrees beyond the end of a joint's allowed range, on the side where over-travel causes damage. One per joint.
_Avoid_: end stop

**Limit switch check**:
Moving a joint slowly until its limit switch trips, then comparing that angle with the joint calibration. Run at power-on to confirm the calibration still holds.
_Avoid_: homing

**Foot contact switch**:
A switch in the foot's sprung plunger that trips when the foot is bearing on something. The foot's position is defined as the tip at the moment this switch trips.
_Avoid_: toe switch

**Calibration rig**:
A fixture with probe points at known positions, which a leg touches with its foot to measure where the foot really is.
_Avoid_: test grid

**Simulated leg**:
A software stand-in for a leg and its leg controller. It speaks the same CAN protocol on a virtual bus and carries deliberately injected errors, so calibration can be tested without hardware.
_Avoid_: mock leg, fake leg, digital twin

**Probe point**:
One known position on the calibration rig that the foot touches. Height is read with the foot contact switch; sideways touches use a switch on the rig.
