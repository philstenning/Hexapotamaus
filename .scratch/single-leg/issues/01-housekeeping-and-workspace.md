# 01 — Housekeeping and workspace scaffold

Status: ready-for-agent
Type: AFK

## Parent

[Single-leg milestone spec](../spec.md)

## What to build

Clear out the old code and set up the new TypeScript workspace, so the later slices have somewhere to live.

1. Tag the current commit `v1-python`.
2. Remove the old Python robot package and the placeholder debug server.
3. Replace the 2021 dashboard template with an empty placeholder package. Slice 04 rebuilds it.
4. Create the empty workspace packages `protocol`, `kinematics`, `brain`, `sim` and `dashboard`. Each has TypeScript and a passing Vitest smoke test.
5. Add root scripts that build and test the whole workspace.
6. Update the readme with the new layout and how to run the tests.

## Acceptance criteria

- [ ] Tag `v1-python` exists and points at the last commit that has the Python code.
- [ ] The old Python package and the debug server are gone.
- [ ] One root command installs, type-checks and runs every package's tests, and they pass.
- [ ] Node LTS is pinned (engines field or `.nvmrc`), and pnpm workspaces cover `packages/*`.
- [ ] The readme describes the package layout and the test command.

## Blocked by

None. Can start immediately.
