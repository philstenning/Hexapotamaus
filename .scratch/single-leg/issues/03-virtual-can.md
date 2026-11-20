# 03 — Virtual CAN: brain and simulated leg over vcan0

Status: ready-for-agent
Type: AFK (one owner action: `sudo modprobe vcan` and creating the `vcan0` interface)

## Parent

[Single-leg milestone spec](../spec.md)

## What to build

Run the brain and the simulated leg as separate processes, talking over a virtual CAN bus (`vcan0`) through a SocketCAN frame transport. This is also the **risk spike** for the Node SocketCAN binding: evaluate the community `socketcan` package. If it's unusable, build a small native helper. Either way it sits behind the frame transport interface.

## Acceptance criteria

- [ ] A SocketCAN implementation of the frame transport interface exists, and the choice of binding (or fallback) is recorded in the readme or an ADR.
- [ ] The brain and simulated leg, run as separate processes on `vcan0`, behave as in slice 02.
- [ ] `candump vcan0` shows the setpoint and status frames, matching the protocol spec.
- [ ] The conformance suite runs over `vcan0` when the interface exists, and is skipped with a clear message when it doesn't.
- [ ] Setup steps for `vcan0` on WSL are documented.

## Blocked by

- [02](02-protocol-tracer.md)
