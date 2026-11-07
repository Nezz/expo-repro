#!/bin/zsh
# usage: measure.sh <serial> nested|single|none  cold starts the repro in that case, resets the frame stats after 3 s,
# and after 10 s more prints its frame stats from gfxinfo.
A=$1; M=$2; P=com.repro.maskedviewanimated
adb -s $A shell am force-stop $P
adb -s $A shell am start -W -a android.intent.action.VIEW -d "maskrepro://$M" $P >/dev/null
sleep 3
adb -s $A shell dumpsys gfxinfo $P reset >/dev/null
sleep 10
adb -s $A shell dumpsys gfxinfo $P | grep -E 'Total frames|Janky frames|50th|90th|95th|99th' | sed "s/^/$M	/"
