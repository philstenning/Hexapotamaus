# Custom stack over CAN, not ROS 2

We build our own stack instead of adopting ROS 2 and micro-ROS: a custom CAN protocol between the brain and the leg controllers, and a TypeScript brain, simulator and dashboard, with three.js for visualisation.

We chose this for three reasons:
- **TypeScript stays first-class.** It's the owner's strongest language; ROS 2 supports it only through second-class bindings.
- **micro-ROS has no native CAN transport.** It would put middleware on every leg controller, where we want simple, predictable timing.
- **CAN, the protocol design and the web visualisation are things the owner wants to learn and build.**

## Consequences

- We build our own visualisation, recording and replay instead of getting RViz and ros2 bag for free. Every brain message is logged so the dashboard can replay runs.
- If ROS 2 packages (vision, navigation) become useful later, a ROS 2 bridge on the Pi translates between our messages and ROS topics. The leg controllers and the CAN bus don't change.
