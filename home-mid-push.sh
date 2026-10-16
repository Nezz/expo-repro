#!/bin/sh
P=com.adamys.exporepro
adb shell am force-stop $P
adb shell monkey -p $P -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1
sleep 4
adb shell am start -a android.intent.action.VIEW -d exporepro://details $P >/dev/null
if [ "$1" != none ]; then sleep "$1"; adb shell input keyevent KEYCODE_HOME; sleep 3; adb shell monkey -p $P -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1; fi
sleep 3
adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1
adb shell cat /sdcard/ui.xml | grep -o 'transitionEnd: [a-z]*'
