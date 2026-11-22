# Leg CAN protocol

Version 0.1. This is the contract between the brain and the leg controllers. The TypeScript implementation is `packages/protocol`, and the leg controller firmware (C++) follows the same document. If the two disagree, this document is right and the code is wrong.

Version 0.1 defines the setpoint and status frames. Later slices add command frames (resume, set leg position, joint calibration upload, probe, limit switch check), the emergency stop frame and fault reports. Their CAN IDs are reserved below so the ID scheme doesn't change when they arrive.

## Physical layer

- Classic CAN 2.0A: 11-bit standard IDs, data frames only. No extended IDs, no remote frames, no CAN FD. A node ignores any frame it doesn't recognise.
- **Bitrate: 1 Mbit/s**, sample point 87.5%.
- 120 Ω termination at the two ends of the bus only.

## Encoding rules

- **Byte order:** little-endian for every multi-byte field.
- **Joint angle:** a signed 16-bit integer in steps of 0.01°, so 1234 means 12.34°. The range is −327.67° to +327.67°. The raw value −32768 (`0x8000`) is reserved: a sender never sends it, and a receiver treats a frame containing it as malformed. A sender rounds to the nearest 0.01° and refuses (doesn't clamp) an angle outside the range.
- **Joint order:** always coxa, femur, tibia.
- **Joint angle convention:** the protocol only carries joint angles. Where zero is and which way is positive is defined by the `kinematics` package (slice 05), not here.
- **Reserved bits** are sent as 0 and ignored on receipt.
- **Malformed frames** (a known ID with the wrong data length, or a reserved value) are ignored by the receiver. They never change its state.

## CAN ID scheme

An 11-bit ID is a function code and a node number:

```
  bit  10 ......... 3   2 .. 0
       function code    node
  id = (function << 3) | node
```

- **Node 0** is broadcast. **Nodes 1–6** are the six legs, by leg position. Node 7 is reserved.
- On CAN the lowest ID wins arbitration, so the function code sets the priority. Within a function, leg 1 has the highest priority.
- The brain has no node number: every frame from the brain is addressed to a leg (or broadcast), and every frame from a leg comes from that leg's node.

| Function | Name | Direction | IDs | Defined in |
|---|---|---|---|---|
| `0x00` | Emergency stop | brain → all legs | `0x000` | reserved (slice 06) |
| `0x01` | Fault report | leg → brain | `0x009`–`0x00E` | reserved (slice 06) |
| `0x02` | **Joint setpoint** | brain → leg | `0x011`–`0x016` | this version |
| `0x03` | **Status** | leg → brain | `0x019`–`0x01E` | this version |
| `0x04` | Command | brain → leg | `0x020`–`0x026` | reserved (slice 06) |
| `0x05` | Command reply | leg → brain | `0x029`–`0x02E` | reserved (slice 06) |
| `0x06`–`0xFF` | — | — | — | reserved |

Emergency stop has ID `0x000`, the lowest possible, so it wins arbitration against every other frame.

## Joint setpoint frame (function `0x02`)

Sent by the brain to one leg, once per control tick. Data length 8.

| Byte | Field | Type |
|---|---|---|
| 0–1 | Coxa joint angle | int16, 0.01° |
| 2–3 | Femur joint angle | int16, 0.01° |
| 4–5 | Tibia joint angle | int16, 0.01° |
| 6–7 | Sequence number | uint16 |

**Rate:** the brain sends one setpoint per leg every 20 ms (50 Hz).

**Sequence number:** the brain adds 1 for every setpoint it sends to a leg, wrapping from 65535 to 0. The leg accepts a setpoint only if its sequence number is newer than the last one it accepted, using serial number arithmetic: `seq` is newer than `last` when `(seq − last) mod 65536` is between 1 and 32767. It ignores anything else as a duplicate or a stale frame. After 100 ms with no accepted setpoint the leg forgets the last sequence number and accepts the next setpoint whatever its number, so a restarted brain can start again from 0.

**Following:** the leg doesn't jump to a setpoint. It moves each joint smoothly from where it is towards the newest setpoint, arriving about one setpoint period (20 ms) later, and never faster than its maximum joint speed. A large step therefore becomes a ramp at the maximum joint speed. The maximum joint speed is a property of the leg controller and its servos, not of the protocol.

Example, leg 1, coxa 10.00°, femur 15.00°, tibia −20.00°, sequence 1, as `candump` shows it:

```
011   [8]  E8 03 DC 05 30 F8 01 00
```

## Status frame (function `0x03`)

Sent by each leg to the brain every 20 ms (50 Hz), whether or not it is receiving setpoints. Data length 8.

| Byte | Field | Type |
|---|---|---|
| 0–1 | Coxa joint angle | int16, 0.01° |
| 2–3 | Femur joint angle | int16, 0.01° |
| 4–5 | Tibia joint angle | int16, 0.01° |
| 6 | Leg controller state | uint8, see below |
| 7 | Switch states | bit field, see below |

The joint angles are the leg's actual joint angles: where the joints are now, not where they were told to go.

**Leg controller state:**

| Value | State | Meaning |
|---|---|---|
| 0 | Uncalibrated | Holds still until its joint calibration arrives |
| 1 | Ready | Following setpoints |
| 2 | Hold | No setpoints for about 100 ms: torque on, waiting for an explicit resume |
| 3 | Fault | Torque off |
| 4–255 | — | Reserved. A receiver treats them as malformed |

In version 0.1 a leg starts in Ready, because joint calibration upload doesn't exist yet. Slice 06 adds the Uncalibrated start, Hold and Fault behaviour.

**Switch states** (1 = tripped):

| Bit | Switch |
|---|---|
| 0 | Coxa joint limit switch |
| 1 | Femur joint limit switch |
| 2 | Tibia joint limit switch |
| 3 | Foot contact switch |
| 4–7 | Reserved |

Example, leg 1 at coxa 10.00°, femur 15.00°, tibia −20.00°, Ready, foot contact switch tripped:

```
019   [8]  E8 03 DC 05 30 F8 01 08
```

## Bus load

A classic frame with 8 data bytes is 111 bits plus up to 24 stuff bits, about 135 bits at worst. Six legs at 50 Hz, each with one setpoint and one status frame, is 600 frames a second, about 81 kbit/s: around 8% of a 1 Mbit/s bus.

## Conformance

`packages/conformance` drives a leg purely through these frames and checks that it behaves as this document says. Every test run runs it against the simulated leg on the in-process bus, and against the simulated leg as a separate process on `vcan0` when that interface is up ([docs/vcan.md](vcan.md)). Later slices run it against the real leg. A behaviour this document requires of a leg belongs in that suite.
