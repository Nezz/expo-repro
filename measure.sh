#!/bin/sh
# Context switches per second of the repro app in the booted iOS simulator, over 10 s with no input.
pid=$(pgrep -f 'ReanimatedIdle.app/ReanimatedIdle$') || { echo "app not running"; exit 1; }
csw() { top -l 1 -pid "$pid" -stats csw | tail -1 | tr -dc '0-9'; }
sleep 3
a=$(csw); sleep 10; b=$(csw)
echo "$(( (b - a) / 10 )) context switches/s"
