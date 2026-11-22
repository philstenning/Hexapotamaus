// The messages the brain sends the viewer over its WebSocket feed, one JSON object
// per WebSocket message (see docs/viewer.md). Browser-safe: the dashboard imports
// this module as @hexapotamaus/brain/viewer-feed-messages.

import type { LegGeometry } from "@hexapotamaus/kinematics";
import type { JointAngles, LegPosition, LegStateName, SwitchStates } from "@hexapotamaus/protocol";

export const DEFAULT_VIEWER_FEED_PORT = 8787;

/** Sent once, as soon as a viewer connects. */
export interface HelloMessage {
  readonly type: "hello";
  /** The geometry to draw every leg with. */
  readonly geometry: LegGeometry;
}

/** One leg status frame, as the brain received it. */
export interface LegStatusMessage {
  readonly type: "legStatus";
  readonly leg: LegPosition;
  /** The leg's actual joint angles, in degrees. */
  readonly angles: JointAngles;
  readonly state: LegStateName;
  readonly switches: SwitchStates;
}

export type ViewerFeedMessage = HelloMessage | LegStatusMessage;
