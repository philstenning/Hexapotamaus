# Inverse kinematics on the brain; leg controllers receive joint angles

The brain does all the leg geometry: inverse kinematics, body motion and gaits. It streams **joint angle** setpoints to each leg controller at a fixed rate (about 50 Hz). Each update is one 8-byte frame: three joint angles as int16 in 0.01° steps, plus a sequence number.

The leg controller knows nothing about leg geometry. It smooths motion between setpoints, applies joint calibration, enforces each joint's allowed range, and runs the reflexes: it stops on a tripped limit switch, or when the foot contact switch trips during a move. It reports joint angles, switch states and faults back to the brain.

We chose this so that one IK implementation, in TypeScript, serves both the simulator and the real robot. Sending foot positions to the legs would have put the geometry in two languages across seven devices.

## Consequences

- **Probing is a joint-space move.** The brain streams a slow approach, and the leg stops when the foot contact switch trips and reports the joint angles at that moment. The brain converts those angles into a foot position.
- **Changing the leg's lengths only changes brain configuration**, never firmware.
