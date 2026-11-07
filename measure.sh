#!/bin/zsh
# usage: measure.sh <serial> mask|view|idle  cold starts the repro in that mode and prints the Native Heap allocated
# (MB) every 2.5 s through its 40 remounts (20 s) and 10 s after them, then after Home.
A=$1; M=$2; P=com.repro.maskedviewbitmap
alloc() { adb -s $A shell dumpsys meminfo $P | awk '/^ *Native Heap/ && NF>=8 {printf "%.1f", $9/1024; exit}'; }
adb -s $A shell am force-stop $P
adb -s $A logcat -c
adb -s $A shell am start -W -a android.intent.action.VIEW -d "maskrepro://$M" $P >/dev/null
series=()
for i in {0..12}; do
	series+=("$(alloc)")
	sleep 2.5
done
adb -s $A logcat -d | grep -o '\[repro\].*' | tail -1
echo "$M	native MB every 2.5 s: ${series[*]}"
echo "$M	start ${series[1]}	max $(printf '%s\n' "${series[@]}" | sort -n | tail -1)	end ${series[-1]}"
adb -s $A shell input keyevent KEYCODE_HOME
sleep 8
echo "$M	after Home (backgrounded) $(alloc) MB"
