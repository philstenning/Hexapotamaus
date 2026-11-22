/** Physical and timing constants from docs/protocol.md. */
export const PROTOCOL_VERSION = "0.1";
export const BITRATE = 1_000_000;
/** The brain sends one joint setpoint per leg this often (50 Hz). */
export const SETPOINT_PERIOD_MS = 20;
/** Each leg sends a status frame this often (50 Hz). */
export const STATUS_PERIOD_MS = 20;
/** After this long with no accepted setpoint, a leg accepts any sequence number. */
export const SEQUENCE_RESYNC_MS = 100;
