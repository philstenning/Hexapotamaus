# 12 — Rig layout and probing in the simulator

Status: ready-for-agent
Type: AFK

## Parent

[Single-leg milestone spec](../spec.md)

## What to build

- **Rig layout file:** define its format and write a first layout. For each probe point it records the position relative to the coxa joint axis, its kind (height pad or side post), the approach direction, and whether it's for fitting or checking.
- **Simulated switches:** the simulated leg uses the layout to trip its foot contact switch on height pads and the side-post switches on posts.
- **Probe moves:** the leg controller protocol gains a probe move, which stops when a named switch trips and reports the joint angles at that moment. Both the simulated leg and the conformance suite cover it.
- **Probe routine:** the brain approaches each probe point slowly from several directions and records measurements.
- **Viewer:** shows the rig and the probe points.

## Acceptance criteria

- [ ] The rig layout format is documented, and a sample layout with 9–12 probe points at about three heights plus 2–3 side posts exists.
- [ ] Against the error-free simulated leg, every probe point is measured, and the foot positions computed from the reported joint angles match the layout to within 0.1 mm.
- [ ] The probe-stop behaviour is in the conformance suite: the leg stops on the switch trip and reports the trip angles.
- [ ] Each point is approached from at least two directions, and the measurements are saved to a file.
- [ ] The viewer shows the rig, the probe points, and the probe in progress.

## Blocked by

- [05](05-inverse-kinematics.md)
- [06](06-leg-controller-behaviour-in-sim.md)
