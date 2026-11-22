import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  LegState,
  SEQUENCE_RESYNC_MS,
  SETPOINT_PERIOD_MS,
  STATUS_PERIOD_MS,
  LEG_POSITIONS,
  encodeJointSetpoint,
  jointSetpointId,
  type JointAngles,
  type LegStatus,
} from "@hexapotamaus/protocol";
import { LegDriver } from "./leg-driver.ts";
import type { LegConnection, LegTarget } from "./target.ts";

const DEFAULT_POSES: readonly [JointAngles, JointAngles] = [
  { coxa: 10, femur: 15, tibia: -20 },
  { coxa: -10, femur: -5, tibia: 10 },
];

const JOINTS = ["coxa", "femur", "tibia"] as const;

/** How close reported angles must come to a setpoint: twice the 0.01° wire resolution, plus rounding. */
const ANGLE_TOLERANCE_DEG = 0.05;
/** Extra time allowed on top of the travel time at maximum joint speed. */
const SETTLE_MS = 500;
/** How soon a leg must visibly start following a new setpoint: three setpoint periods, under the 100 ms resync. */
const RESPONSE_MS = 3 * SETPOINT_PERIOD_MS;
/** How long the suite watches a leg to show it does *not* move. */
const OBSERVE_MS = 300;
/** Real legs run on real time, so give each test room. */
const TEST_TIMEOUT_MS = 20_000;

/**
 * The protocol conformance suite (docs/protocol.md). It drives a leg only
 * through CAN frames, so it runs unchanged against any {@link LegTarget}.
 *
 * Every test starts after more than 100 ms of silence, so the leg accepts any
 * first sequence number even if an earlier test left it mid-stream.
 */
export function describeLegConformance(target: LegTarget): void {
  const [poseA, poseB] = target.poses ?? DEFAULT_POSES;
  const maxSpeed = target.maxJointSpeedDegPerS / 1000; // °/ms

  describe(`leg conformance: ${target.name}`, () => {
    let connection: LegConnection;
    let driver: LegDriver;

    beforeEach(async () => {
      connection = await target.connect();
      driver = new LegDriver(connection, target.leg);
      await driver.clock.sleep(SEQUENCE_RESYNC_MS + 50);
    });

    afterEach(async () => {
      driver.close();
      await connection.close();
    });

    const near = (pose: JointAngles) => (status: LegStatus) =>
      JOINTS.every((j) => Math.abs(status.angles[j] - pose[j]) <= ANGLE_TOLERANCE_DEG);

    /** True once some joint has moved at least 0.5° from `from` towards `to`. */
    const movedTowards = (from: JointAngles, to: JointAngles) => (status: LegStatus) =>
      JOINTS.some((j) => Math.sign(to[j] - from[j]) * (status.angles[j] - from[j]) >= 0.5);

    function travelMs(from: JointAngles, to: JointAngles): number {
      return Math.max(...JOINTS.map((j) => Math.abs(to[j] - from[j]))) / maxSpeed + SETTLE_MS;
    }

    async function moveTo(pose: JointAngles, firstSequence = 0) {
      const start = await driver.waitForStatus();
      const stream = driver.stream(pose, firstSequence);
      await driver.waitFor(`joints near ${JSON.stringify(pose)}`, near(pose), travelMs(start.angles, pose));
      return stream;
    }

    async function expectToStayAt(pose: JointAngles): Promise<void> {
      const since = driver.clock.now();
      await driver.clock.sleep(OBSERVE_MS);
      const seen = driver.statusesSince(since);
      expect(seen.length).toBeGreaterThan(0);
      for (const { status } of seen) expect(status).toSatisfy(near(pose));
    }

    it(
      "reports a well-formed status frame about every 20 ms",
      async () => {
        const since = driver.clock.now();
        await driver.clock.sleep(1000);
        const count = driver.statusesSince(since).length;
        expect(count).toBeGreaterThanOrEqual(1000 / STATUS_PERIOD_MS - 10);
        expect(count).toBeLessThanOrEqual(1000 / STATUS_PERIOD_MS + 10);
        expect(driver.malformed).toEqual([]);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      "converges on streamed setpoints, and reports Ready while following them",
      async () => {
        const stream = await moveTo(poseA);
        const atA = driver.clock.now();
        stream.setAngles(poseB);
        await driver.waitFor("joints near pose B", near(poseB), travelMs(poseA, poseB));
        for (const { status } of driver.statusesSince(atA)) expect(status.state).toBe(LegState.Ready);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      "smooths a large step into a ramp no faster than its maximum joint speed",
      async () => {
        const stream = await moveTo(poseA);
        const stepAt = driver.clock.now();
        stream.setAngles(poseB);
        await driver.waitFor("joints near pose B", near(poseB), travelMs(poseA, poseB));
        // Allow for one control period of sampling skew and the wire rounding.
        const slack = (elapsed: number) => maxSpeed * (elapsed + 10) + 0.1;
        for (const { at, status } of driver.statusesSince(stepAt)) {
          for (const j of JOINTS) {
            expect(Math.abs(status.angles[j] - poseA[j]), `${j} at +${at - stepAt} ms`).toBeLessThanOrEqual(
              slack(at - stepAt),
            );
          }
        }
        // The first status after the step must still be on its way, not already there.
        const first = driver.statusesSince(stepAt + SETPOINT_PERIOD_MS)[0];
        expect(first?.status).not.toSatisfy(near(poseB));
      },
      TEST_TIMEOUT_MS,
    );

    it(
      "keeps following when the sequence number wraps from 65535 to 0",
      async () => {
        const stream = await moveTo(poseA, 65_520);
        await driver.waitFor("the sequence number to wrap", () => stream.lastSequence < 65_520, 2000);
        stream.setAngles(poseB);
        // Respond at once: a leg that wrongly ignores post-wrap setpoints would only move after the 100 ms resync.
        await driver.waitFor("movement towards pose B after the wrap", movedTowards(poseA, poseB), RESPONSE_MS);
        await driver.waitFor("joints near pose B after the wrap", near(poseB), travelMs(poseA, poseB));
      },
      TEST_TIMEOUT_MS,
    );

    it(
      "ignores duplicate and stale setpoints",
      async () => {
        const stream = await moveTo(poseA, 1000);
        const last = stream.lastSequence;
        driver.send(encodeJointSetpoint({ leg: target.leg, angles: poseB, sequence: last }));
        driver.send(encodeJointSetpoint({ leg: target.leg, angles: poseB, sequence: (last + 65_536 - 5) % 65_536 }));
        driver.send(encodeJointSetpoint({ leg: target.leg, angles: poseB, sequence: (last + 40_000) % 65_536 }));
        await expectToStayAt(poseA);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      "ignores setpoints addressed to other legs",
      async () => {
        const stream = await moveTo(poseA);
        for (const leg of LEG_POSITIONS) {
          if (leg === target.leg) continue;
          driver.send(encodeJointSetpoint({ leg, angles: poseB, sequence: (stream.lastSequence + 1) % 65_536 }));
        }
        await expectToStayAt(poseA);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      "ignores malformed setpoint frames",
      async () => {
        const stream = await moveTo(poseA);
        const good = encodeJointSetpoint({ leg: target.leg, angles: poseB, sequence: (stream.lastSequence + 1) % 65_536 });
        const id = jointSetpointId(target.leg);
        driver.send({ id, data: good.data.subarray(0, 7) });
        driver.send({ id, data: new Uint8Array(0) });
        const reserved = Uint8Array.from(good.data);
        reserved[0] = 0x00;
        reserved[1] = 0x80; // coxa = 0x8000, the reserved angle
        driver.send({ id, data: reserved });
        await expectToStayAt(poseA);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      "accepts any sequence number after 100 ms without setpoints, so a restarted brain can start from 0",
      async () => {
        const first = await moveTo(poseA, 30_000);
        first.stop();
        await driver.clock.sleep(SEQUENCE_RESYNC_MS + 50);
        // 0 is "older" than 30 000 by serial number arithmetic; only the resync lets it through.
        driver.stream(poseB, 0);
        await driver.waitFor("joints near pose B", near(poseB), travelMs(poseA, poseB));
      },
      TEST_TIMEOUT_MS,
    );
  });
}
