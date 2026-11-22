"""SocketCAN bridge for the Node SocketCAN transport (packages/socketcan).

Usage: python3 can_bridge.py <interface>

Opens a raw CAN socket on <interface> and copies frames between it and the
pipes, as 16-byte Linux `struct can_frame`s:

- stdin  -> the bus: each 16 bytes read is sent as one frame.
- the bus -> stdout: each frame another socket sends is written as 16 bytes.

stderr carries text: "ready" once the socket is bound, then any errors. The
bridge exits when stdin closes, so it never outlives the Node process.

Only standard library modules: Python's socket module has spoken SocketCAN
since 3.3, so this needs no compiler and nothing installed. See
docs/adr/0006-socketcan-through-a-python-bridge.md.
"""

import errno
import os
import socket
import sys
import threading
import time

FRAME_SIZE = 16  # sizeof(struct can_frame): classic CAN only, CAN FD stays off


def log(message):
    sys.stderr.write(message + "\n")
    sys.stderr.flush()


def bus_to_stdout(sock):
    try:
        while True:
            frame = sock.recv(FRAME_SIZE)
            if len(frame) == FRAME_SIZE:
                os.write(1, frame)
    except OSError as error:
        if error.errno != errno.EPIPE:
            log("error: receive failed: %s" % error)
        os._exit(1)


def stdin_to_bus(sock):
    pending = b""
    last_error = None
    last_error_at = 0.0
    while True:
        chunk = os.read(0, 4096)
        if not chunk:
            return
        pending += chunk
        while len(pending) >= FRAME_SIZE:
            frame, pending = pending[:FRAME_SIZE], pending[FRAME_SIZE:]
            try:
                sock.send(frame)
            except OSError as error:
                # A full transmit queue (ENOBUFS, e.g. no other node to ACK on
                # a real bus) loses the frame, as on CAN. Report it, at most
                # once a second per kind of error.
                now = time.monotonic()
                if error.errno != last_error or now - last_error_at >= 1.0:
                    log("warning: frame dropped: %s" % error)
                    last_error, last_error_at = error.errno, now


def main():
    if len(sys.argv) != 2:
        log("usage: can_bridge.py <interface>")
        return 2
    interface = sys.argv[1]
    try:
        sock = socket.socket(socket.AF_CAN, socket.SOCK_RAW, socket.CAN_RAW)
        sock.bind((interface,))
    except OSError as error:
        log("error: can't open CAN interface %s: %s" % (interface, error))
        return 1
    threading.Thread(target=bus_to_stdout, args=(sock,), daemon=True).start()
    log("ready")
    stdin_to_bus(sock)
    return 0


if __name__ == "__main__":
    sys.exit(main())
