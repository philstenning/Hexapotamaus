# One leg controller per leg, coordinated by a central brain

Each leg gets its own microcontroller (an ESP32 to start with, later a custom SMD board). It drives that leg's three servos, reads its limit switches and foot contact switch, and enforces joint limits and homing locally. A Raspberry Pi brain coordinates the six legs and runs gait, vision and the user interface.

We chose this over a single controller wired to all 18 servos for three reasons:
- **Safety reacts locally.** A limit switch or foot contact switch can stop a leg in microseconds, without a round trip to the brain.
- **Wiring stays manageable.** Each leg needs only power and one communication link back to the body.
- **The owner wants to design their own SMD electronics**, and a leg controller board is a well-sized first board.

The cost is a distributed system: a communication bus, firmware on seven devices, and keeping the legs' timing in sync.

## Open

- Which bus links the brain and the leg controllers.
- Whether leg controllers receive joint angles or foot positions.
