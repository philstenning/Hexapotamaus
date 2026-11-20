# Robot code is servo-agnostic: everything above the servo driver works in joint angles

The robot uses Hiwonder LX-16A serial bus servos today, but they are no longer supported and may be too weak. So all kinematics, gait, calibration and simulation code works in **joint angles**. Only a thin servo driver per servo type turns those into **servo positions**. A later swap to PWM servos, or to stronger bus servos, then changes only a driver and the joint calibration data.

## Consequences

- **The controller interpolates motion.** It sends setpoints for every joint at a fixed rate, instead of relying on the LX-16A's built-in timed move. PWM servos have no timed move, and this keeps behaviour the same on every servo type.
- **Servo position readback is optional.** The LX-16A can report its position; PWM servos cannot. Calibration and safety must therefore work from the switches alone: limit switches, foot contact switches and the calibration rig. Readback is a bonus check where the servo offers it.
- **The servo's own safety features are optional extras.** Built-in angle limits and stall protection are used where a servo offers them, but the code enforces each joint's allowed range itself.
- **The simulator is another servo driver**, so the same code drives the sim and the real robot.
