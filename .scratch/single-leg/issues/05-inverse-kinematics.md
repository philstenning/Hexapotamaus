# 05 — IK: foot targets, reachability, commanded vs actual

Status: ready-for-agent
Type: AFK

## Parent

[Single-leg milestone spec](../spec.md)

## What to build

Add inverse kinematics to the `kinematics` package, and let the brain accept foot position targets. The brain converts each target to joint angles, rejecting unreachable targets with an explicit error and never substituting a "safe" angle. The viewer shows the commanded foot position against the actual one, from the reported joint angles through forward kinematics. It also lets you set a foot target.

## Acceptance criteria

- [ ] Property-based tests: across the workspace, IK followed by forward kinematics returns to the original point within 0.01 mm.
- [ ] Unreachable targets (too far, too close, outside joint ranges) return an explicit error, and the brain sends nothing.
- [ ] The tibia offset angle is handled and tested with a non-zero value.
- [ ] Angles stay full-precision until encoding; no truncation to whole degrees.
- [ ] In the viewer, a foot target moves the simulated leg there, and commanded and actual markers coincide on the error-free simulated leg.

## Blocked by

- [04](04-viewer-tracer.md)
