# Hiwonder BusLinker (TTL/USB debugging board): prototyping notes

The BusLinker is Hiwonder's small TTL/USB debugging board for its serial bus servos. Hexapotamaus uses it **for prototyping only**: a laptop drives the LX-16A servos directly over USB, and the serial traffic can be watched for debugging. It is not part of the final build.

Compiled 2026-11-20. Each claim is tagged with how far to trust it:

| Tag | Meaning |
|---|---|
| **[P]** | Primary source, read in full: Hiwonder's own docs (online or in `vendor-archive/`), the WCH datasheet, Linux kernel source, Microsoft or usbipd-win docs and source |
| **[S]** | Secondary: reseller listing or similar. Lower confidence |
| **[L]** | Checked locally on the owner's WSL2 install (kernel `6.18.33.2-microsoft-standard-WSL2`) |
| **[R]** | Evidence from this repo's own code |
| **[D]** | Derived: my own inference or arithmetic, not stated by a source. Check it yourself |

Sources are listed at the end and cited inline by short name, for example [P: BusLinker manual].

---

## TL;DR

1. **What it is.** It's a 40 × 25 mm board with a WCH CH340-family USB-serial chip. It turns the LX-16A's single signal wire into a normal serial port, so a PC sees it as a COM port or `/dev/ttyUSB*` [P: BusLinker manual]. Servo power comes in on a blue two-way screw terminal, which Hiwonder calls the "lithium battery connection port". It is not taken from USB [P: BusLinker manual].
2. **Linux and WSL2 support.** The in-kernel `ch341` driver handles CH340 chips (USB ID `1a86:7523`, among others) [P: ch341.c]. The owner's WSL2 kernel ships `ch341.ko` [L]. Attach the board to WSL2 with `usbipd bind` (needs admin, done once) and then `usbipd attach --wsl --busid <id>` [P: MS Learn]. It appears as `/dev/ttyUSB0`, owned by group `dialout` [L].
3. **Port settings.** Use 115200 baud, 8N1 [P: LX-16A manual]. Packets are `55 55 ID LEN CMD params… CHK`, where `CHK = ~(ID+LEN+CMD+params) & 0xFF` [P: protocol].
4. **Echo.** The board appears **not** to echo transmitted bytes back to the host. Hiwonder's own Pi demo for "the small debug board" expects exactly the 8-byte servo reply, and this repo's driver would break on an echo [P: vendor Pi demo] [R]. Confirm this with the one-minute test in [Checking for echo](#checking-for-echo).
5. **Watching the bus.** Log the traffic in software on the same port, either inside the driver or through a `socat -x` PTY relay. For a true view of the wire, attach a second USB-serial adapter as a **receive-only** listener on the signal line, sharing ground. The bus idles at 5 V, so the listener must tolerate 5 V [D].
6. **Limits.** There are no inputs for the foot microswitches. Bus time at 115200 baud caps 18 position writes at roughly 64 frames/s even with zero overhead [D]. USB, and usbipd on WSL2 even more, adds latency and jitter. Use `MOVE_TIME_WAIT_WRITE` plus a broadcast `MOVE_START` to keep the legs in step.

---

## 1. What the board is

### Identity and versions

- Hiwonder sells it as the "TTL / USB Debugging Board". The product text says it is a servo debugger that "is able to connect the servo to the PC software or other devices and use them to adjust the parameter of servos". It can also "connect TXD and RDX [sic] of single-chip to control the servo" [P: product page].
- The PCB silkscreen says **BusLinker**. The Hiwonder manual shows two revisions [P: BusLinker manual]:
  - **V2.2**: mini-USB, silkscreen `Vin=6~8.4V`
  - **V2.5**: micro-USB, silkscreen `Vin=5~14V`

  The revision of the owner's board is **unknown**; read the silkscreen. A reseller lists a **V2.4** with a CH340C [S: Sigmanortec]. Hiwonder's newer **BusLinker V3.0** is a different board for its magnetic-encoder servos [S: OpenELAB]. Don't mix up their docs.
- Size is 40 × 25 mm and weight 7 g [P: BusLinker manual].

### USB-serial chip

- Hiwonder's driver for the board is WCH's `CH341SER` package. Its installer screenshot shows the INF entry `USB-SERIAL CH340` [P: BusLinker manual §3.3]. The same `ch341ser(driver for debug board).exe` is archived in `vendor-archive/ch341-usb-serial-driver/`. So the chip is a **CH340-family** part. The exact variant (CH340G or CH340C) is not stated by Hiwonder; the reseller says CH340C [S: Sigmanortec].
- The CH340 is a full-speed USB device with a full-duplex hardware UART. It supports 50 bps to 2 Mbps, including 115200, and runs from a 5 V or 3.3 V supply [P: CH340 datasheet].

### How it makes the single-wire, half-duplex bus

- The LX-16A has three pins: GND, VIN and SIG. SIG is a "half-duplex UART asynchronous serial interface" [P: LX-16A manual].
- Hiwonder's reference circuit for driving the bus from your own controller uses two **74HC126** tri-state buffers. TX drives the bus only while `TXEN` is asserted; RX listens only while `RXEN` is asserted. The bus line has a **10 kΩ pull-up to 5 V** [P: protocol §2].
- The BusLinker has a second 14-pin SOIC beside the CH340. That is consistent with a 74HC126-style buffer doing this job [D, from the manual photos]. The reseller calls it a "74HC1240" [S: Sigmanortec]. Hiwonder does not publish a BusLinker schematic, so **how it switches direction is unknown**. In particular, it is not known whether it uses CH340 modem lines or TX activity.

### Connectors, LEDs and switches

| Feature | Detail | Source |
|---|---|---|
| Power input | Blue 2-way screw terminal, marked Vin / GND, "Lithium battery connection port" | [P: BusLinker manual] |
| Input voltage | Silkscreen says 6–8.4 V (V2.2) or 5–14 V (V2.5). **Stay within the servo's 6–8.4 V** whatever the board allows | [P: BusLinker manual] [P: LX-16A manual] |
| Servo ports | 3-pin sockets marked S / + / −. The photos show at least two; a reseller lists four [S]. **Count yours** | [P: BusLinker manual] |
| Servo connector | The LX-16A uses 5264-3P. Each servo has two sockets so servos can be daisy-chained | [P: LX-16A manual] |
| USB | Mini-USB (V2.2) or micro-USB (V2.5) | [P: BusLinker manual photos] |
| Serial header | 4-pin `5V TX RX GND`, so an MCU can drive the bus through the board | [P: BusLinker manual] |
| LED | `D1`, with a low-voltage alarm: "When the voltage is less than 5.6V, the indicator will make alarm" | [P: BusLinker manual] |
| Switches or modes | None shown or documented | [D, from photos] |

Hiwonder warns that the serial header "can only be connected to the 5v MCU system for normal communication, such as arduino. If connected to usb-ttl, it cannot communicate normally" [P: BusLinker Instructions.pdf]. So don't plan on driving the board from a 3.3 V ESP32 through that header without level shifting [D].

### Ground and power cautions

- **USB ground and servo ground are common.** The bus is single-ended TTL referenced to GND, and the board has no isolator. The laptop's USB ground is therefore tied to the servo battery's negative [D]. Treat the laptop as electrically connected to the robot's power system. In particular, avoid ground loops through a mains charger and a bench supply that is earthed separately.
- **Servo power does not come from USB.** USB powers only the logic. The servos need the screw-terminal supply [P: BusLinker manual: "only equipped with two power ports"] [D].
- **Current.** One LX-16A stalls at **2.4–3 A** [P: LX-16A manual], so 18 servos could draw tens of amps in the worst case. The board's terminal and traces have **no published current rating**. For more than a few servos, run power through your own distribution (servo-to-servo daisy chain or a separate harness), and use the board only for signal and ground [D].
- **One servo at a time while setting IDs.** The manual says "Please connect only one servo to the debugging board at a time!" [P: BusLinker manual §3.1]. This matters for ID work. Every LX-16A ships as ID 1, and the broadcast ID read (`0xFE`) only works with one servo on the bus [P: protocol, SERVO_ID_READ].
- **Low-voltage alarm.** The LED alarms below 5.6 V [P]. A 2S Li-ion or LiPo pack (8.4 V full) suits the servos' 6–8.4 V range [P: LX-16A manual] [D].

---

## 2. Using it from Linux and from WSL2

### Driver

- Linux's in-tree `drivers/usb/serial/ch341.c` ("Winchiphead CH341 USB Serial driver") matches `1a86:7523`, `1a86:7522`, `1a86:5523`, `4348:5523`, `9986:7523` and `2184:0057` [P: ch341.c]. CH340 parts normally enumerate as `1a86:7523` [D]. **Check yours with `lsusb`.**
- The port appears as `/dev/ttyUSB<n>`, usually `/dev/ttyUSB0`. The driver registers the port name `ch341-uart` [P: ch341.c].
- A detail relevant to latency: the driver sets bit 7 of the line-control register on chips newer than version 0x27. Without it, "CH341A buffers data until a full endpoint-size packet (32 bytes) has been received" [P: ch341.c]. This means short servo replies are not held back on current chips.

### WSL2 kernel: the module is there

- On this machine `modinfo ch341` resolves to `/lib/modules/6.18.33.2-microsoft-standard-WSL2/kernel/drivers/usb/serial/ch341.ko`, with the CH340 aliases above [L]. `/proc/config.gz` has `CONFIG_USB_SERIAL_CH341=m` and `CONFIG_USBIP_VHCI_HCD=m` [L].
- Microsoft's published WSL kernel config (6.6.y branch) also sets `CONFIG_USB_SERIAL=m`, `CONFIG_USB_SERIAL_CH341=m`, `CONFIG_USB_SERIAL_CP210X=m`, `CONFIG_USB_SERIAL_FTDI_SIO=m`, `CONFIG_USB_ACM=m` and `CONFIG_USBIP_VHCI_HCD=m` [P: WSL kernel config]. So a stock, up-to-date WSL2 kernel should need no custom build.

### Attaching the board to WSL2 with usbipd-win

Requirements: Windows 11, or Windows 10 with the Store version of WSL; WSL kernel 5.10.60.1 or newer; usbipd-win installed. To install: `winget install --interactive --exact dorssel.usbipd-win` [P: MS Learn].

In **Windows PowerShell**, keep a WSL terminal open so the VM stays up:

```powershell
usbipd list                            # find the BUSID for "USB-SERIAL CH340" (VID:PID 1a86:7523)
usbipd bind --busid <BUSID>            # admin prompt; once per device, persists across reboots
usbipd attach --wsl --busid <BUSID>    # no admin needed
# optional: re-attach automatically after unplug or reset
usbipd attach --wsl --busid <BUSID> --auto-attach
usbipd detach --busid <BUSID>          # hand it back to Windows
```

Then in **WSL**:

```bash
lsusb                       # expect a QinHeng/CH340 device
ls -l /dev/ttyUSB*          # expect crw-rw---- root dialout
groups                      # must include dialout
```

Points to know:

- Binding (sharing) persists across reboots. Attaching does not, so re-attach after a reboot or "when the device resets or is physically unplugged/replugged" [P: usbipd README]. `--auto-attach` is a real `attach` option [P: usbipd-win source tests].
- "As long as the USB device is attached to WSL, it cannot be used by Windows" [P: MS Learn]. You cannot run Hiwonder's Windows "Bus Servo Terminal" at the same time as WSL code.
- Permissions: on this install systemd and udev are running, and Ubuntu's `50-udev-default.rules` gives `KERNEL=="tty[A-Z]*[0-9]"` devices `GROUP="dialout"`. User `phils` is already in `dialout` [L]. On a fresh machine run `sudo usermod -aG dialout $USER`, then restart WSL with `wsl --shutdown`.
- The original code used `SERIAL_PORT = 'COM3'` [R: `packages/robot/src/setup.py`, tag `v1-python`]. Under WSL this becomes `/dev/ttyUSB0`.

### Windows-native alternative

The vendor tool is "Bus Servo Terminal V1.7", archived in `vendor-archive/…/4.Software/BusLinKer Debugging Board Software/`. Hiwonder's Windows driver is CH341SER [P: BusLinker manual]. For timing-sensitive tests, running Python natively on Windows (COM port) or on bare-metal Linux avoids the USB/IP hop [D].

---

## 3. Protocol and port settings

### Port

- **115200 baud** [P: LX-16A manual; protocol §2]. The data format is not spelled out, but the Hiwonder examples use `Serial.begin(115200)` and `serial.Serial(port, 115200)` defaults, which is **8N1** [P: LX-16A manual examples; vendor Pi demo].
- One byte takes 10 bit-times, about 86.8 µs [D].

### Packet format

Taken from [P: protocol §3–4]:

| Byte | Field | Notes |
|---|---|---|
| 0–1 | `0x55 0x55` | Header |
| 2 | ID | 0–253; **254 (`0xFE`) is broadcast**. Servos never reply to broadcast, except `SERVO_ID_READ` |
| 3 | Length | = number of params + 3 (counts Length, Cmd and Checksum). Whole packet = Length + 3 bytes |
| 4 | Cmd | e.g. 1 `MOVE_TIME_WRITE`, 7 `MOVE_TIME_WAIT_WRITE`, 11 `MOVE_START`, 28 `POS_READ` |
| 5… | Params | Little-endian 16-bit values (low byte first) |
| last | Checksum | `~(ID + Length + Cmd + params) & 0xFF` |

- Servo replies use the same frame and echo back the **same Cmd value** as the read request, with parameters added [P: protocol, Table 4].
- After sending a read command, "the PC software must immediately prepare to change itself to 'read condition'" [P: protocol §4]. The BusLinker does this switching in hardware [D].
- Example: `MOVE_TIME_WRITE` to ID 1, position 500, time 1000 ms gives `55 55 01 07 01 F4 01 E8 03 16` (10 bytes) [D, computed from the formula].

### Does the board echo what you send?

On a raw half-duplex line, a UART whose TX and RX are both tied to the wire hears its own transmission. The Hiwonder reference circuit avoids this by disabling the RX buffer while transmitting [P: protocol §2]. For the BusLinker itself:

- **Vendor evidence: no echo.** Hiwonder's Raspberry Pi read-position demo says that if you use "the small board" (the debug board) instead of their Pi expansion board, you should comment out the GPIO direction switching. The demo then calls `flushInput()`, sends a 6-byte `POS_READ`, waits 5 ms, and accepts the data only if `count == 8`, the exact length of the servo's reply. With an echo it would receive 14 bytes [P: vendor Pi demo, `Raspberry Pi Control Serial Servo/f(Read the servo angle)/`].
- **Repo evidence: the driver assumes no echo.** `packages/robot/src/lewansoul_lx16a.py` (from maximkulkin/lewansoul-lx16a) writes a packet and then scans for `55 55`. It accepts the first frame with a valid checksum whose Cmd and ID match. An echoed read request has a valid checksum with the same Cmd and ID, so `_wait_for_response` would return `[sid, cmd]` with no params, and e.g. `get_position()` would fail on `response[2]` [R] [D]. The original code called `get_position` and `get_position_offset` over `COM3` [R: `main_1.py`, `main_3.py`]. That suggests reads worked, but nothing in the repo records it.
- **Hiwonder does not state this outright for the BusLinker.** Treat "no echo" as very likely, not confirmed.

#### Checking for echo

With one servo attached and powered:

```python
import serial, time
s = serial.Serial('/dev/ttyUSB0', 115200, timeout=0.1)
s.reset_input_buffer()
s.write(bytes([0x55,0x55,0x01,0x03,0x1C,0xDF]))  # POS_READ, ID 1
time.sleep(0.02)
print(s.read(64).hex(' '))
# no echo: 55 55 01 05 1c lo hi chk         (8 bytes)
# echo:    55 55 01 03 1c df 55 55 01 05 …  (14 bytes)
```

If it does echo, discard `len(packet)` bytes after every write, or upgrade the driver to skip frames identical to the one just sent.

---

## 4. Sniffing and logging the bus

Ordered from least to most hardware:

1. **Log in the driver (no hardware).** `lewansoul_lx16a.py` already logs every outgoing packet at DEBUG level on logger `lewansoul.servos.lx16a` [R]. Received bytes are not logged. Wrapping the `serial.Serial` object in a small proxy that hex-dumps both `write()` and `read()` with timestamps gives a full transcript. Without echo, everything the host reads is a servo reply [D].
2. **PTY relay with socat (no hardware, no code change).** Put a hex-dumping relay between the program and the port:
   ```bash
   socat -d -d -x \
     pty,link=/tmp/lx16a,raw,echo=0 \
     /dev/ttyUSB0,b115200,raw,echo=0
   # point SERIAL_PORT at /tmp/lx16a; socat prints both directions to stderr
   ```
   This adds some latency, so use it for debugging rather than timing work [D]. `socat` is not installed on this WSL distro yet [L]; install it with `apt`. Alternatively, `strace -f -tt -xx -e trace=read,write -p <pid>` shows the same bytes with timestamps.
   **Don't open `/dev/ttyUSB0` in a second terminal program while the driver runs.** Two readers on one tty steal bytes from each other, and you get corrupted replies rather than a copy [D].
3. **Passive listener on the wire (second adapter).** This is the most faithful view: both directions interleaved, exactly as on the wire, including servo replies the host misses.
   - Connect a spare USB-serial adapter's **RX and GND only** to the bus SIG and GND. A servo's second 5264 socket or a Y-lead is convenient. **Leave its TX unconnected** so it can't drive the bus.
   - Settings are 115200 8N1. Frame the stream on `55 55`, then check Length and checksum. `0x55` can also appear inside params, so don't split on the header alone.
   - **Level.** The bus idles high via a pull-up to 5 V in Hiwonder's reference design [P: protocol §2], so the listener's RX must tolerate 5 V. A CH340 adapter running at 5 V is fine: CH340 VIH max is VCC + 0.5 V [P: CH340 datasheet]. For 3.3 V-only adapters, and for an **ESP32** used as a sniffer, use a resistor divider or level shifter [D].
   - The listener's USB ground joins the robot ground through the bus GND as well, so the same ground cautions apply [D].
4. **Logic analyser.** Any cheap USB logic analyser running sigrok/PulseView with the UART decoder (115200 8N1) adds exact timing. It shows the servo turnaround time, the gaps between packets and the USB burst pattern, which matters for the latency questions below. No analyser is in the inventory (owned: **unknown**).

---

## 5. Limitations for Hexapotamaus

- **Prototyping only.** It is a desk tool: a laptop, a cable, and a separate supply. It is not part of the final controller architecture, which uses a per-leg controller (see `docs/adr/0002-leg-controller-per-leg.md`).
- **No switch inputs.** The board exposes only the servo bus and a `5V TX RX GND` header [P: BusLinker manual]. The foot or limit **microswitches cannot be read through it**. Prototype them on an ESP32 or similar and merge the data in software [D]. The CH340's modem-status inputs (CTS, DSR, RI, DCD) [P: CH340 datasheet] are not broken out on the BusLinker [D, from photos].
- **Bus bandwidth (hard limit).**

  | Traffic | Bytes | Wire time at 115200 baud |
  |---|---|---|
  | One `MOVE_TIME_WRITE` | 10 | 0.87 ms |
  | 18 servos, writes only | 180 | **≈ 15.6 ms**, so at most about 64 frames/s with zero gaps |
  | One `POS_READ` (6-byte request + 8-byte reply) | 14 | ≈ 1.2 ms + servo turnaround (unknown) + USB round-trip |
  | Reading all 18 positions, one at a time | | Tens of ms. **You cannot stream setpoints and read back all positions at 50 Hz** |

  All figures are [D].
- **USB latency and jitter.** Every read is a blocking USB round trip. The repo driver serialises each `_query` under a lock [R]. Hiwonder's own demo waits 5 ms for a reply [P: vendor Pi demo]. Under WSL2, usbipd tunnels USB over a virtual network link, which adds latency and jitter of unknown size. **Measure it** with the logic analyser or timestamps before trusting any gait-timing result [D].
- **Ways to live with the jitter.**
  - Batch each control tick's packets into **one** `write()` call, not 18 separate writes [D].
  - Use the servo's own interpolation. `MOVE_TIME_WRITE`'s time parameter makes the servo move "at uniform speed within parameter time" [P: protocol]. Setting it to about one control period smooths late frames [D].
  - Keep legs in step. Send `MOVE_TIME_WAIT_WRITE` (cmd 7) to each servo, then one **broadcast `MOVE_START`** (ID `0xFE`, cmd 11), so every servo starts together regardless of when its packet arrived [P: protocol] [D].
  - Read positions sparingly, for example one leg per tick in rotation, never all 18 every tick [D].
- **Electrical.** The board puts the laptop on the robot's ground and has no published current rating. Keep the high current off the board (see §1) [D].

---

## Sources

**Primary, Hiwonder** (archived read-only in `vendor-archive/LX-16A Serial Bus Servo/LX-16A Serial Bus Servo/`):

- **BusLinker manual**: [`4.Software/BusLinKer Debugging Board Software/Bus Servo Debugging Board Tutorial/Debugging Board Manual.pdf`](<../../vendor-archive/LX-16A Serial Bus Servo/LX-16A Serial Bus Servo/4.Software/BusLinKer Debugging Board Software/Bus Servo Debugging Board Tutorial/Debugging Board Manual.pdf>). Specs, ports, V2.2 and V2.5 photos, low-voltage alarm, one-servo note, CH341SER/CH340 driver.
- **BusLinker Instructions.pdf**: [`4.Software/BusLinKer Debugging Board Software/Instructions.pdf`](<../../vendor-archive/LX-16A Serial Bus Servo/LX-16A Serial Bus Servo/4.Software/BusLinKer Debugging Board Software/Instructions.pdf>). The 5 V MCU-only note for the serial header.
- **Protocol**: [`2.Bus Servo Communication/Bus Servo Communication Protocol/Hiwonder Bus Servo Communication Protocol.pdf`](<../../vendor-archive/LX-16A Serial Bus Servo/LX-16A Serial Bus Servo/2.Bus Servo Communication/Bus Servo Communication Protocol/Hiwonder Bus Servo Communication Protocol.pdf>). 74HC126 reference circuit, 115200, packet format, command table, broadcast rules.
- **LX-16A manual**: [`1.LX-16A User Manual/1.LX-16A Bus Servo Manual/LX-16A Serial Bus Servo User Manual.pdf`](<../../vendor-archive/LX-16A Serial Bus Servo/LX-16A Serial Bus Servo/1.LX-16A User Manual/1.LX-16A Bus Servo Manual/LX-16A Serial Bus Servo User Manual.pdf>). 6–8.4 V, 2.4–3 A stall, 5264-3P, pinout, 115200.
- **Vendor Pi demo**: [`2.Bus Servo Communication/Serial Bus Servo Control Routine/Raspberry Pi Control Serial Servo/f(Read the servo angle)/`](<../../vendor-archive/LX-16A Serial Bus Servo/LX-16A Serial Bus Servo/2.Bus Servo Communication/Serial Bus Servo Control Routine/Raspberry Pi Control Serial Servo/f(Read the servo angle)/>). `Description.txt` and `demo_serialservo_read_position.py`.
- **Product page**: <https://www.hiwonder.com/products/hiwonder-ttl-usb-debugging-board>, read via the shop's product JSON. It carries feature bullets only, no specs.

**Primary, other:**

- **ch341.c**: Linux kernel, <https://github.com/torvalds/linux/blob/master/drivers/usb/serial/ch341.c>. ID table, `ch341-uart`, LCR bit 7 buffering comment.
- **WSL kernel config**: <https://github.com/microsoft/WSL2-Linux-Kernel/blob/linux-msft-wsl-6.6.y/arch/x86/configs/config-wsl>.
- **MS Learn**: "Connect USB devices", <https://learn.microsoft.com/en-us/windows/wsl/connect-usb>.
- **usbipd README**: <https://github.com/dorssel/usbipd-win> (README "How to use").
- **usbipd-win source tests**: <https://github.com/dorssel/usbipd-win/blob/master/UnitTests/Parse_attach_Tests.cs>. Confirms `attach --wsl --busid … --auto-attach`.
- **CH340 datasheet**: WCH CH340DS1 v1D, via the SparkFun mirror <https://cdn.sparkfun.com/datasheets/Dev/Arduino/Other/CH340DS1.PDF>.

**Secondary:**

- **Sigmanortec**: reseller listing "TTL/USB Module, BusLinker V2.4", <https://sigmanortec.ro/en/ttl-usb-module-buslinker-v24-for-serial-servomotors>. Says CH340C, "74HC1240", four servo connectors, 6–8.4 V.
- **OpenELAB**: BusLinker V3.0 listing, <https://openelab.io/products/buslinker-v3-servo-board>. A different board.

**Repo (tag `v1-python`):** `packages/robot/src/lewansoul_lx16a.py`, `setup.py`, `main_1.py`, `main_3.py`.
