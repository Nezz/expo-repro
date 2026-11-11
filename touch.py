"""Prints one `adb shell` line of sendevent calls that plays a multi-touch gesture on an Android emulator's touchscreen.

Usage: python3 touch.py '<step>; <step>; ...' [device=/dev/input/event1] [width=1080] [height=2400]
Steps, in screen pixels: `down <slot> <x> <y>`, `move <slot> <x> <y>`, `up <slot>`, `wait <seconds>`.
Each slot is one finger (multi-touch protocol B). `adb shell getevent -p` names the touchscreen's device.
"""
import sys

script = sys.argv[1]
device = sys.argv[2] if len(sys.argv) > 2 else '/dev/input/event1'
width = int(sys.argv[3]) if len(sys.argv) > 3 else 1080
height = int(sys.argv[4]) if len(sys.argv) > 4 else 2400
down = set()
out = []


def ev(kind, code, value):
    out.append(f'sendevent {device} {kind} {code} {value}')


for step in script.split(';'):
    p = step.split()
    if not p:
        continue
    if p[0] == 'wait':
        out.append(f'sleep {p[1]}')
        continue
    slot = int(p[1])
    ev(3, 47, slot)  # ABS_MT_SLOT
    if p[0] in ('down', 'move'):
        if p[0] == 'down':
            down.add(slot)
            ev(3, 57, 100 + slot)  # ABS_MT_TRACKING_ID
            ev(3, 58, 50)  # ABS_MT_PRESSURE
            ev(3, 55, 0)  # ABS_MT_TOOL_TYPE finger
        ev(3, 53, int(p[2]) * 32767 // width)  # ABS_MT_POSITION_X
        ev(3, 54, int(p[3]) * 32767 // height)  # ABS_MT_POSITION_Y
        if p[0] == 'down' and len(down) == 1:
            ev(1, 330, 1)  # BTN_TOUCH
    elif p[0] == 'up':
        ev(3, 57, -1)
        down.discard(slot)
        if not down:
            ev(1, 330, 0)
    ev(0, 0, 0)  # SYN_REPORT
print('; '.join(out))
