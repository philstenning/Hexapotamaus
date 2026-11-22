# 03 — Virtual CAN: brain and simulated leg over vcan0

Status: ready-for-agent
Type: AFK (one owner action: `sudo modprobe vcan` and creating the `vcan0` interface)

## Parent

[Single-leg milestone spec](../spec.md)

## What to build

Run the brain and the simulated leg as separate processes, talking over a virtual CAN bus (`vcan0`) through a SocketCAN frame transport. This is also the **risk spike** for the Node SocketCAN binding: evaluate the community `socketcan` package. If it's unusable, build a small native helper. Either way it sits behind the frame transport interface.

## Acceptance criteria

- [x] A SocketCAN implementation of the frame transport interface exists, and the choice of binding (or fallback) is recorded in the readme or an ADR.
- [x] The brain and simulated leg, run as separate processes on `vcan0`, behave as in slice 02.
- [x] `candump vcan0` shows the setpoint and status frames, matching the protocol spec.
- [x] The conformance suite runs over `vcan0` when the interface exists, and is skipped with a clear message when it doesn't.
- [x] Setup steps for `vcan0` on WSL are documented.

## Blocked by

- [02](02-protocol-tracer.md)

## Comments

2026-11-22: Done. Notes for later slices:

- **Binding:** the community `socketcan` package (4.3.2) has no prebuilt binaries, so it needs `make` and `g++` at install time. Neither is on the WSL machine, and installing them needs sudo. So `packages/socketcan` talks to SocketCAN through a small Python bridge process (`src/can_bridge.py`, standard library only) instead. Recorded in [ADR 0006](../../../docs/adr/0006-socketcan-through-a-python-bridge.md). About 15 ms to open, about 0.15 ms per frame between processes on vcan0. It's behind `FrameTransport`, so swapping it out later changes one file.
- **New package `@hexapotamaus/socketcan`:** `openSocketCan(iface)` returns a `FrameTransport`. `socketCanProblem(iface)` says why SocketCAN can't be used there (no `python3`, interface missing, not CAN, or down), for test skips and CLI errors. `lockCanInterface(iface)` lets test files in parallel processes take turns on vcan0. It is an abstract-namespace Unix socket, so the kernel frees it if a holder crashes.
- **CLIs:** `pnpm sim [--leg N ...]` runs simulated legs as separate nodes, and `pnpm brain [--leg N] [--pose=c,f,t] [--duration s] [--json]` streams setpoints (a ±20° sweep by default) and prints status. Both default to `--interface vcan0`, so slice 09 only needs `--interface can0`.
- **Tests on vcan0** (skipped with a message when it's missing): the transport's own tests, brain and simulated leg as two processes (convergence, then a restarted brain starting again from sequence 0), and the whole conformance suite against the simulated leg as a separate process. Together they add about 9 s to `pnpm test`, because they run on real time. The restarted-brain check passes because of the 100 ms resync: a new process always takes longer than that to start.
- **candump:** with `pnpm sim` and `pnpm brain --pose=10,15,-20` running, `candump -td vcan0` shows setpoints `011 [8] E8 03 DC 05 30 F8 <seq> 00`, with the sequence number counting up, and status `019 [8] E8 03 DC 05 30 F8 01 00`, each every 20 ms. These match the examples in docs/protocol.md.
