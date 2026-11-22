# SocketCAN through a small Python bridge, not the `socketcan` npm package

Node can't open a SocketCAN socket by itself: `net` and `dgram` have no `AF_CAN`. So every brain and simulated-leg process needs native help to reach `vcan0` or `can0`. We reach it through a small Python bridge process (`packages/socketcan/src/can_bridge.py`), not through the community [`socketcan`](https://github.com/sebi2k1/node-can) package. The bridge opens a raw CAN socket and copies 16-byte `struct can_frame`s between the socket and its stdin and stdout. It uses only Python's standard library, which has supported `AF_CAN` since Python 3.3.

## What we found when evaluating `socketcan` (4.3.2, Nov 2026)

- **The package itself looks sound.** It is maintained (last release October 2026) and written against N-API. It reads frames on its own thread and supports filters, CAN FD and error frames.
- **It ships no prebuilt binaries.** Its install script runs `node-gyp rebuild`, so every machine that installs the workspace needs `make`, `g++` and Python. The owner's WSL Ubuntu 26.04 has none of the build tools, and installing them needs `sudo apt install build-essential`. The Pi would need the same.
- **pnpm refuses dependency build scripts by default.** The workspace would have to allow it explicitly. On a machine without the build tools, `pnpm install` would then fail for everyone, including people who only want the simulation and the in-process tests.
- We couldn't build it on the development machine, so we couldn't try it on `vcan0`.

The bridge needs nothing beyond `python3`, which Ubuntu and Raspberry Pi OS both install by default. On `vcan0` its transport tests and the full conformance suite pass.

## Consequences

- **Each transport is a child process.** Opening one takes about 15 ms. On `vcan0` a frame takes about 0.15 ms from one Node process to another (0.3 ms at the 99th percentile), counting both bridges. At 600 frames a second for six legs, the pipes are no bottleneck. If the bridge dies, its transport closes and reports the error. The bridge exits when its stdin closes, so it never outlives the Node process.
- **Only classic CAN 2.0A data frames get through.** CAN FD stays off on the socket. Extended-ID, remote and error frames from other nodes are ignored, as the protocol requires (docs/protocol.md).
- **A frame the kernel can't queue is dropped and reported**, at most once a second. This is the `ENOBUFS` you get on a real bus when no other node ACKs. CAN loses frames the same way.
- **Everything sits behind `FrameTransport`.** If the bridge turns out to be too slow, or a compiler becomes normal on the brain machines, replacing it with `socketcan` or our own N-API addon changes one file: `packages/socketcan/src/socketcan.ts`. Revisit this at slice 09 (real CAN on `can0`) if bus-off and error-frame handling are needed.
