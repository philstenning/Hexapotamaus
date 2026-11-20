# Single-leg milestone

Status: ready-for-agent

## Problem Statement

The original Hexapotamaus walked badly because "what I expected wasn't what I got". Each leg's foot rarely ended up where the code told it to go, and nothing in the system could measure or correct that. Calibration offsets were large, never saved to the servos, and applied cumulatively. The inverse kinematics silently replaced unreachable targets with a "safe" angle. The leg geometry (a short femur and a very long curved tibia) magnified every servo error and left a dead zone near the body. Over-travel broke printed parts, and there was no way to test anything without the real robot.

The owner wants to restart the project so it is open source (MIT) and servo-agnostic. Before building six legs, they want **one leg** that works as well as these servos allow, is fully tested, and is automatically calibrated. It should be developed against a local simulation first and then the real hardware.

## Solution

Build a single new leg on a calibration rig. The leg is driven by its own leg controller (a XIAO ESP32-C6) on a CAN bus, and a TypeScript brain on the laptop controls it. A simulated leg speaks the same CAN protocol on a virtual bus, so every behaviour can be developed and tested without hardware. Deliberately injected errors in the simulated leg prove that the calibration recovers them.

The leg senses its world through a foot contact switch (a sprung plunger foot) and one limit switch per joint. The calibration rig has probe points at known positions. The brain moves the foot onto them, and the leg controller reports the exact joint angles at the moment a switch trips. From those, the brain fits the joint calibration and the leg's real segment lengths. A browser viewer built with three.js shows the leg live, commanded against actual, for both the simulated and the real leg.

The milestone is done when the rig automatically shows all of the following:

1. **Accuracy:** after calibration, the foot lands within ±3 mm of the target at every checking point.
2. **Repeatability:** returning to the same point from different directions lands within ±1.5 mm.
3. **Power-on check:** from power-on, the leg passes its limit switch check with no manual setup, 20 times in a row.
4. **Endurance and safety:**
   - 1 hour of step cycling with no faults and no servo overheating.
   - Targets out of reach are refused, never acted on.
   - A tripped limit switch stops the leg.

## User Stories

### Simulation and development without hardware

1. As the owner, I want a simulated leg that speaks the same CAN protocol as the real leg controller, so that I can develop the brain before any hardware is wired up.
2. As the owner, I want the simulated leg to run on a virtual CAN bus, so that the brain cannot tell whether it is talking to the simulated or the real leg.
3. As the owner, I want to inject errors into the simulated leg, so that I can prove the calibration recovers them. The errors are joint offsets, segment length errors, gear slack and switch trip jitter.
4. As the owner, I want the simulated leg to trip simulated limit switches and foot contact switches from the same rig layout the real rig uses, so that calibration and safety logic run identically in simulation.
5. As the owner, I want to run the whole calibration procedure against the simulated leg in an automated test, so that calibration regressions are caught without hardware.
6. As the owner, I want the simulated leg to model hold, fault and emergency stop exactly as the firmware does, so that safety behaviour is tested before it matters.

### Viewer

7. As the owner, I want a three.js viewer in the browser that shows the leg moving live, so that I can see what the robot is doing.
8. As the owner, I want the viewer to show commanded and actual foot positions side by side, so that I can see calibration error at a glance.
9. As the owner, I want the viewer to show the calibration rig and its probe points, so that I can watch probing happen.
10. As the owner, I want the viewer to work the same against the simulated and the real leg, so that I learn one tool.
11. As the owner, I want every brain message logged, so that I can replay a run in the viewer and see why the leg did something.
12. As the owner, I want switch states and faults shown in the viewer, so that I know at once why a leg stopped.

### Kinematics

13. As the owner, I want foot positions converted to joint angles by pure, tested functions, so that the geometry is trustworthy.
14. As the owner, I want unreachable targets rejected with an explicit error, so that the leg never moves somewhere I did not ask for.
15. As the owner, I want the leg geometry (segment lengths and tibia offset) to be configuration, so that a reprinted leg means a config change, not a code change.
16. As the owner, I want the same kinematics used by the brain, the simulated leg's rig and the calibration fit, so that there is one implementation of the geometry.

### Leg controller firmware

17. As the owner, I want the leg controller to drive the three LX-16A servos over their single-wire bus from the XIAO, so that the BusLinker isn't needed in the final setup.
18. As the owner, I want the leg controller to accept joint angle setpoints at a fixed rate and smooth motion between them, so that motion is smooth regardless of servo type.
19. As the owner, I want the leg controller to convert joint angles to servo positions using its joint calibration, so that everything above it is servo-agnostic.
20. As the owner, I want the leg controller to enforce each joint's allowed range itself, so that a bug in the brain cannot over-travel a joint.
21. As the owner, I want the leg controller to also write each servo's own stored angle limits, so that there is another layer of protection.
22. As the owner, I want a tripped limit switch to fault the leg (torque off) within microseconds, so that over-travel cannot break parts.
23. As the owner, I want a move to stop when the foot contact switch trips during a probe, and the joint angles at that moment reported, so that probing is precise.
24. As the owner, I want the leg to hold position after about 100 ms without messages from the brain, so that a crashed brain or a loose cable doesn't drop the robot.
25. As the owner, I want a held leg to resume only on an explicit resume from the brain, so that it never jumps to a stale or distant setpoint.
26. As the owner, I want an emergency stop message with the highest CAN priority that faults the leg, so that a stop always gets through.
27. As the owner, I want the leg controller to poll servo temperature and error flags and fault on over-temperature or stall, so that servos don't burn out.
28. As the owner, I want the leg controller to report joint angles, switch states, its state and faults, so that the brain and the viewer know what is happening.
29. As the owner, I want the leg controller to report its chip ID when it connects, so that the brain can send the right joint calibration.
30. As the owner, I want the leg controller to refuse to move until it has received its joint calibration, so that it never moves with wrong numbers.
31. As the owner, I want the leg's position (leg 1–6) stored on the leg controller and settable by command, so that each leg has fixed CAN IDs from power-on.

### CAN and the brain

32. As the owner, I want the brain to talk to the bus through a "send and receive frames" interface, so that the CAN library can be swapped and tests can run in-process.
33. As the owner, I want the brain to use real CAN from day one through the SH-C31A adapter, so that the bench setup matches the final robot.
34. As the owner, I want each joint angle update to fit in one 8-byte CAN frame per leg per tick, so that six legs at 50 Hz use a small fraction of the bus.
35. As the owner, I want a written protocol spec that both the TypeScript and C++ implementations follow, so that they cannot drift silently.
36. As the owner, I want to watch the bus with `candump`, and the wires with my oscilloscope, so that I can debug at every layer.

### Calibration

37. As the owner, I want the rig layout (probe point positions, kinds and whether each is for fitting or checking) in a data file, so that I can rearrange pads without code changes.
38. As the owner, I want the brain to probe each height pad by lowering the foot slowly until the foot contact switch trips, so that height measurement needs no switches on the rig.
39. As the owner, I want the brain to probe the side posts by moving the foot sideways until the post's switch trips, so that the coxa joint's offset is measured.
40. As the owner, I want each probe point approached from several directions, so that repeatability and gear slack are measured.
41. As the owner, I want the calibration fit to solve for joint offsets and real segment lengths from the probe measurements, so that both the leg controller and the IK use corrected values.
42. As the owner, I want checking points that the fit never sees, so that accuracy is measured honestly.
43. As the owner, I want each leg's calibration saved as a file in git, tied to its leg controller's chip ID, so that I have a history of every recalibration.
44. As the owner, I want the brain to send the matching joint calibration to the leg controller when it connects, and to flag a chip ID mismatch, so that a swapped controller is caught.

### Power-on check, endurance and acceptance

45. As the owner, I want a power-on limit switch check that creeps each joint to its limit switch and compares the trip angle with the joint calibration, so that a slipped servo horn or reprinted part is caught before walking.
46. As the owner, I want the leg to refuse to run when the power-on check fails and ask for recalibration, so that bad calibration never reaches motion.
47. As the owner, I want an endurance run that cycles a step for 1 hour while logging faults and servo temperatures, so that I know the leg is robust.
48. As the owner, I want an acceptance run that runs every done-criterion and writes a pass/fail report, so that "done" is objective.
49. As the owner, I want a supply-voltage sag test on the rig, so that I know when the LX-16As reset or lose torque before choosing a battery.

### Mechanical (owner, in SolidCraft)

50. As the owner, I want a new leg with a 50 mm coxa, 90 mm femur and 135 mm straight tibia as named parameters, so that the dead zone disappears and femur torque drops.
51. As the owner, I want a sprung plunger foot with a hard stop and a replaceable tip, so that the foot contact switch never carries the robot's weight.
52. As the owner, I want a cam on each joint that trips its limit switch a few degrees beyond the allowed range on the damaging side, so that the switch is a backstop that normal running never touches.
53. As the owner, I want a calibration rig with a pegboard baseplate, plug-in height pads, side posts with switches and a hip mount copied from the body, so that the leg is calibrated exactly as it will be mounted.
54. As the owner, I want Hiwonder's LX-16A STEP model as the servo reference, so that brackets fit the real servo.
55. As the owner, I want CAD sources and exported STLs kept in the repo, so that the hardware is open source and versioned.

### Project hygiene

56. As the owner, I want the old Python code tagged and deleted, so that the repo reflects the new design while history stays reachable.
57. As the owner, I want the placeholder debug server removed and the dashboard rebuilt from scratch, so that nothing stale misleads future work.

## Implementation Decisions

- **Architecture, per the ADRs:**
  - Code is servo-agnostic: everything above the servo driver works in joint angles (ADR 0001).
  - Each leg has its own leg controller, coordinated by a brain (ADR 0002).
  - IK runs on the brain, and joint angles are streamed to legs (ADR 0003).
  - The stack is custom over CAN, not ROS 2 (ADR 0004).
- **Leg geometry:**
  - Coxa 50 mm, femur 90 mm, tibia 135 mm straight-line with a 0° offset, measured joint axis to joint axis, foot tip defined at the moment the foot contact switch trips.
  - Default stance: foot about 80 mm out from the femur joint and about 110 mm below it.
  - All of these are configuration, matching the named parameters in SolidCraft.
- **Modules (pnpm workspace, Node LTS, TypeScript, Vitest):**
  - **protocol:** CAN message definitions and encode/decode. Shared by the brain, the simulated leg and the viewer.
  - **kinematics:** leg geometry; forward and inverse kinematics; reachability. Pure functions.
  - **brain:**
    - the frame transport interface, with SocketCAN, virtual-bus and in-process implementations
    - the fixed-rate control loop
    - leg session management: chip ID, calibration push, resume
    - probing and calibration routines, and the calibration fit
    - the power-on check, the endurance and acceptance runs
    - a message log, and a WebSocket feed for the viewer
  - **sim:** the simulated leg on a virtual CAN bus. It covers leg controller behaviour, simulated switches driven by the rig layout, and configurable injected errors.
  - **dashboard:** a fresh Vite app with a three.js viewer and controls, fed by the brain's WebSocket and able to replay logs.
  - **leg-controller firmware:** C++ with PlatformIO on the official espressif32 platform, Arduino core 3.3.12, on a XIAO ESP32-C6.
- **The protocol, defined in a spec doc during the first slice:**
  - **Joint setpoint frame:** three joint angles as int16 in 0.01° steps, plus a sequence number, in 8 bytes, one frame per leg per tick at about 50 Hz.
  - **Status frames:** joint angles, switch states, leg controller state and faults.
  - **Command frames:** resume, set leg position, joint calibration upload, probe, power-on check.
  - **Emergency stop:** the lowest CAN ID on the bus.
  - **Still to decide in the spec:** the CAN ID scheme and the bitrate. The default is 1 Mbit/s.
- **Leg controller states:**
  - **Uncalibrated:** holds still until the joint calibration arrives.
  - **Ready / following:** runs setpoints.
  - **Hold:** after about 100 ms without setpoints, keeps torque on and waits for an explicit resume.
  - **Fault:** torque off. Caused by a limit switch trip, servo over-temperature or stall, a joint out of range, or an emergency stop.
  - The power-on check and probe moves are explicit modes.
- **Joint calibration:**
  - It holds the offset, direction, scale, allowed range and servo bus ID for each joint.
  - Each leg's calibration (joint calibration plus fitted segment lengths) lives in a JSON file in git, keyed by the leg controller's chip ID.
  - The brain is the master copy and sends it on connect.
- **Calibration rig:**
  - A pegboard baseplate (about a 20 mm grid) with plug-in height pads of about three heights, 9–12 probe points, and 2–3 side posts with switches.
  - Probe points are split into fitting and checking sets.
  - The layout is a data file shared by the brain and the simulated leg.
- **Servo bus:**
  - The XIAO's single-wire UART connects through a 3.3 V ↔ 5 V bidirectional level shifter (or Hiwonder's 74HC126 circuit if needed) at 115200 baud 8N1.
  - First, check whether the LX-16A accepts a 3.3 V open-drain signal, using the oscilloscope.
- **CAN hardware:** an SN65HVD230 transceiver on the XIAO; the SH-C31A adapter (candleLight, `gs_usb`) on the laptop as `can0`; 120 Ω termination at both ends only.
- **Bench power:**
  - The Eventek KPS3010DF at 7.4 V with about a 3 A current limit, its over-voltage protection set to about 8.5 V if it has one.
  - A quick-blow fuse around 5 A, and a 1000 µF / 16 V capacitor at the leg.
  - The XIAO is powered over USB. The banana leads are the bench emergency stop.
- **WSL:** the SH-C31A and the XIAO are attached with usbipd-win. The WSL kernel already provides `can`, `can-raw`, `vcan` and `gs_usb`.
- **Risk to spike early:** the Node SocketCAN binding (the community `socketcan` package). The fallback is a small native helper; the frame transport interface isolates the choice.

## Testing Decisions

- **What a good test is:** tests check external behaviour at the highest available seam: frames in, frames out; foot positions in, joint angles out; probe measurements in, calibration out. They never check internal state or private functions, and they survive refactoring.
- **Seam 1: the CAN protocol (the main seam).**
  - One protocol conformance suite drives a leg purely through CAN frames. It covers setpoints, smoothing limits, joint limit enforcement, hold after silence, resume, faults, emergency stop, calibration upload, refusal to move while uncalibrated, and probe stop on a switch trip.
  - The same suite runs against the simulated leg (in CI, on a virtual bus or the in-process transport) and against the real leg on `can0` (hardware-in-the-loop on the bench).
- **Seam 2: kinematics.**
  - Pure-function tests: IK followed by forward kinematics returns to the original point across the workspace (property-based).
  - Unreachable targets are rejected, the joint ranges are respected, and the tibia offset is handled.
- **Seam 3: calibration end-to-end in the simulator.**
  - Inject known errors into the simulated leg, run the full probe-and-fit routine through the brain, and assert that the fitted values recover the injected errors within tolerance.
  - The checking points then meet ±3 mm accuracy and ±1.5 mm repeatability.
- **Seam 4: the brain's frame transport interface.** The brain's control-loop and session tests run in-process, without kernel CAN, so they run anywhere.
- **Seam 5: firmware host tests.**
  - The firmware's servo-independent logic is unit-tested on the host with PlatformIO's native environment: the joint calibration mapping, limit enforcement and the state machine.
  - Hardware-dependent behaviour is covered by the conformance suite on the real leg.
- **Acceptance:** the acceptance run is the final test. On the real rig it runs every done-criterion and produces a report.
- **Prior art:** none in the repo. The old Python code has no automated tests. TypeScript work is test-first (red-green-refactor).

## Out of Scope

- The other five legs, the body frame and body layout (the research suggests a hybrid rectangle with splayed corner legs), and walking gaits.
- The Raspberry Pi brain, the battery, vision AI and a ROS 2 bridge.
- The custom SMD leg controller board, including current sensing, per-leg fuses and solder-jumper leg addressing. The milestone uses a XIAO dev board on breadboard or perfboard.
- Physics simulation (MuJoCo or Rapier).
- Replacing the LX-16A servos (the design only has to allow it).
- Migrating the old Python code. It is tagged and deleted, not ported.

## Further Notes

- **Build order:**
  1. Sim skeleton
  2. Servo bus bring-up
  3. CAN bring-up
  4. New leg with switches
  5. IK and the viewer
  6. Calibration in the sim
  7. Calibration for real
  8. Power-on check and endurance

  Slices 1 and 2 can run in parallel. Leg CAD in SolidCraft starts now; rig CAD is needed by slice 7.
- **SolidCraft modelling rules apply** (every part from a fully constrained sketch, named parameters, extrudes, patterns). The Hiwonder LX-16A STEP (in the owner's OneDrive LX-16A folder) is the only imported part. Old Fusion parts, if exported, are reference only.
- **SolidCraft can export URDF**, which a three.js URDF loader could use to show the real CAD model in the viewer. Worth exploring in slice 5.
- **References:**
  - glossary: `CONTEXT.md`
  - decisions: `docs/adr/0001`–`0004`
  - leg geometry research: `docs/research/hexapod-leg-geometry.md`
  - hardware: `docs/hardware/inventory.md` and `docs/hardware/buslinker-debug-board.md`
- **Known causes of the old robot's errors**, to avoid repeating:
  - the IK silently substituted 90° for unreachable targets
  - angles were truncated to whole degrees
  - servo offsets were applied cumulatively and never saved
  - one global position offset was used for every servo
