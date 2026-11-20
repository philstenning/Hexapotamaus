# 13 — Calibration fit in the simulator, with injected errors

Status: ready-for-agent
Type: AFK

## Parent

[Single-leg milestone spec](../spec.md)

## What to build

- **Injected errors:** the simulated leg's errors are configurable: joint offsets, segment length errors, gear slack and switch trip jitter.
- **The fit:** the brain fits joint calibration offsets and the real segment lengths from the probe measurements on the fitting points, using least squares.
- **Accuracy and repeatability:** the brain evaluates them on the checking points the fit never saw.
- **Saving:** the result is saved as the leg's calibration file, keyed by chip ID, and uploaded to the leg. Kinematics uses the fitted segment lengths.

## Acceptance criteria

- [ ] An automated end-to-end test injects known errors, runs probe → fit → upload, and asserts the fit recovers them within tolerance. Tolerances are documented.
- [ ] With realistic injected slack and jitter, the checking points meet ±3 mm accuracy and ±1.5 mm repeatability.
- [ ] Calibration files include the fit date, residuals and checking results, and recalibrating updates the file in place, so git keeps the history.
- [ ] A clear failure is reported when the fit is poorly constrained, for example too few points or all at one height.

## Blocked by

- [12](12-rig-layout-and-probing-in-sim.md)
