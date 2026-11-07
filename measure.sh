#!/bin/zsh
# usage: measure.sh <serial> text|path|idle  cold starts the repro in that mode, waits for its 300 remounts, sends
# RUNNING_CRITICAL (a full GC of the RN runtime) and SIGUSR1 (a full Java GC; needs a userdebug emulator for su), and
# prints the Native Heap allocated (MB) before the remounts and after.
A=$1; M=$2; P=com.repro.svgtextremount
alloc() { adb -s $A shell dumpsys meminfo $P | awk '/^ *Native Heap/ && NF>=8 {printf "%.1f", $9/1024; exit}'; }
adb -s $A shell am force-stop $P
adb -s $A logcat -c
adb -s $A shell am start -W -a android.intent.action.VIEW -d "svgrepro://$M" $P >/dev/null
sleep 3
start=$(alloc)
sleep 35
adb -s $A logcat -d | grep -o '\[repro\].*' | tail -1
adb -s $A shell am send-trim-memory $P RUNNING_CRITICAL
adb -s $A shell su 0 kill -10 $(adb -s $A shell pidof $P)
sleep 5
end=$(alloc)
echo "$M	start $start MB	after 300 remounts, trim and GC $end MB	kept $(echo "$end - $start" | bc) MB"
# Then Home: Android sends TRIM_MEMORY_UI_HIDDEN and BACKGROUND, and hwui purges Skia's caches as the app leaves.
adb -s $A shell input keyevent KEYCODE_HOME
sleep 8
echo "$M	after Home (backgrounded) $(alloc) MB"
