import { ManualClock, createInProcessBus, type LegPosition } from "@hexapotamaus/protocol";
import { DEFAULT_MAX_JOINT_SPEED_DEG_PER_S, startSimulatedLeg } from "@hexapotamaus/sim";
import { describeLegConformance, type LegTarget } from "./index.ts";

/**
 * The simulated leg on the in-process bus, on simulated time. Another
 * simulated leg shares the bus, as it would on the robot.
 */
function simulatedLegInProcess(leg: LegPosition, neighbour: LegPosition): LegTarget {
  return {
    name: `simulated leg ${leg}, in-process bus`,
    leg,
    maxJointSpeedDegPerS: DEFAULT_MAX_JOINT_SPEED_DEG_PER_S,
    connect() {
      const bus = createInProcessBus();
      const clock = new ManualClock();
      const legs = [
        startSimulatedLeg({ transport: bus.connect(), clock, leg, initialAngles: { coxa: -3, femur: 4, tibia: 2 } }),
        startSimulatedLeg({ transport: bus.connect(), clock, leg: neighbour }),
      ];
      return {
        transport: bus.connect(),
        clock,
        close: () => legs.forEach((l) => l.stop()),
      };
    },
  };
}

describeLegConformance(simulatedLegInProcess(1, 2));
describeLegConformance(simulatedLegInProcess(6, 5));
