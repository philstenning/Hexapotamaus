# Virtual CAN (`vcan0`) on WSL

`vcan0` is a CAN bus that lives entirely in the Linux kernel. The brain and the simulated leg can run as separate processes on it, exactly as they will on the real bus (`can0`), and `candump` can watch it. The SocketCAN transport tests, the brain and simulated leg process test, and the conformance suite over `vcan0` all need it, and `python3`. When either is missing, those tests are skipped with a message saying which.

The WSL2 kernel ships the `vcan` module (checked on kernel 6.18), so nothing has to be built.

## One-off setup

Needed after every WSL restart, unless you set it up to start automatically (below).

```sh
sudo modprobe vcan
sudo ip link add dev vcan0 type vcan
sudo ip link set up vcan0
```

Check it:

```sh
ip -details link show vcan0     # "vcan0: <NOARP,UP,LOWER_UP> ... link/can ... vcan"
```

## Start it automatically

WSL runs systemd when `/etc/wsl.conf` has `systemd=true` under `[boot]` (the default on Ubuntu 26.04). Add a service that creates the interface at boot:

```sh
sudo tee /etc/systemd/system/vcan0.service >/dev/null <<'EOF'
[Unit]
Description=Virtual CAN interface vcan0

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/usr/sbin/modprobe vcan
ExecStart=/usr/sbin/ip link add dev vcan0 type vcan
ExecStart=/usr/sbin/ip link set up vcan0
ExecStop=/usr/sbin/ip link delete vcan0

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload
sudo systemctl enable --now vcan0.service
```

If `vcan0` already exists from the one-off setup, run `sudo ip link delete vcan0` before `enable --now`, or the `ip link add` step fails.

## Tools

- **`python3`** runs the SocketCAN bridge (see [ADR 0006](adr/0006-socketcan-through-a-python-bridge.md)). Ubuntu has it already.
- **`can-utils`** gives `candump` and `cansend`: `sudo apt install can-utils`.

## Running the brain and the simulated leg on `vcan0`

In one terminal, start the simulated leg (leg 1 by default):

```sh
pnpm sim                      # or: pnpm sim --leg 1 --leg 2
```

In another, run the brain. It streams setpoints to leg 1 and prints the leg's status four times a second:

```sh
pnpm brain                            # every joint sweeps ±20° at 1 Hz
pnpm brain --pose=10,15,-20           # holds one pose (use "=" so negative angles aren't read as options)
pnpm brain --leg 2 --duration 5 --json   # every status frame as a JSON line, for 5 s
```

Both default to `--interface vcan0`. The same commands work on the real bus with `--interface can0`.

## Watching the bus

```sh
candump vcan0
```

With the brain holding leg 1 at coxa 10°, femur 15°, tibia −20° (`pnpm brain --pose=10,15,-20`), you see the joint setpoint frames (`011`), with the sequence number counting up in the last two bytes, and the leg's status frames (`019`), each about every 20 ms. Compare them with the examples in [the protocol spec](protocol.md):

```
  vcan0  011   [8]  E8 03 DC 05 30 F8 18 00
  vcan0  019   [8]  E8 03 DC 05 30 F8 01 00
  vcan0  011   [8]  E8 03 DC 05 30 F8 19 00
  vcan0  019   [8]  E8 03 DC 05 30 F8 01 00
```

`candump -td vcan0` adds the time between frames.

## Tests on `vcan0`

`pnpm test` runs the vcan0 tests whenever the interface is up. They take about 10 seconds, because the simulated leg runs on real time there. Test files that drive legs on `vcan0` take turns, through a lock the kernel frees when a test process exits. Stop any `pnpm sim` you have running first, or its legs will answer the tests' setpoints too.
