# Leg viewer

The viewer (`packages/dashboard`) is a browser app that draws the leg live in 3D from the joint angles the leg reports, and shows the leg controller's state, its switches and the foot position. It gets everything from the brain's WebSocket feed, so it works the same with the simulated leg and the real one: it never knows which it is watching.

## Running it

In three terminals (see [vcan.md](vcan.md) to set up `vcan0`):

```sh
pnpm sim          # the simulated leg on vcan0
pnpm brain        # streams setpoints and serves the viewer feed on ws://127.0.0.1:8787
pnpm dashboard    # the viewer, on http://localhost:5173
```

Open http://localhost:5173. From Windows, WSL forwards `localhost`, so the same address works there.

- The viewer reconnects by itself when the brain restarts, so you can stop and start `pnpm brain` freely.
- If the brain's feed is elsewhere, add `?feed=ws://host:port` to the viewer's address. To let other machines watch, start the brain with `--feed-host 0.0.0.0`.
- `pnpm brain --feed-port 9000` moves the feed; `--geometry file.json` draws the leg with other segment lengths.

## What it shows

- The leg, coloured by state: green Ready, amber Hold, red Fault, violet Uncalibrated. A tripped limit switch turns its joint red; foot contact turns the foot cyan.
- Grey when the brain is away or the leg has sent no status for 200 ms. The panel says which.
- With more than one leg reporting, buttons choose which to draw.

## The feed

The brain listens on a WebSocket (default port 8787, `127.0.0.1` only). Each WebSocket message is one JSON object. The types are in `packages/brain/src/viewer-feed-messages.ts`.

On connecting, the viewer receives a `hello` with the leg geometry to draw with ([kinematics.md](kinematics.md)):

```json
{ "type": "hello", "geometry": { "coxa": 50, "femur": 90, "tibia": 135, "tibiaOffset": 0 } }
```

Then one `legStatus` for every status frame the brain receives, about 50 a second per leg:

```json
{
  "type": "legStatus",
  "leg": 1,
  "angles": { "coxa": 2.56, "femur": 13.44, "tibia": 110.28 },
  "state": "Ready",
  "switches": { "coxaLimit": false, "femurLimit": false, "tibiaLimit": false, "footContact": false }
}
```

The feed only reports. The viewer can't send the brain anything yet.
