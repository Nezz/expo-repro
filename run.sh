#!/bin/bash
# Runs Repro.java against the stock purchases-android AAR from Maven Central (default 10.28.1, the version
# react-native-purchases 10.15.1 pulls in through purchases-hybrid-common 19.14.1). Needs a JDK 17 and curl.
set -euo pipefail
cd "$(dirname "$0")"
VERSION="${1:-10.28.1}"
M=https://repo1.maven.org/maven2
mkdir -p libs build
fetch() { [ -f "libs/$2" ] || curl -sfL "$M/$1/$2" -o "libs/$2"; }
fetch "com/revenuecat/purchases/purchases/$VERSION" "purchases-$VERSION.aar"
fetch org/jetbrains/kotlin/kotlin-stdlib/2.2.0 kotlin-stdlib-2.2.0.jar
fetch org/jetbrains/kotlinx/kotlinx-coroutines-core-jvm/1.9.0 kotlinx-coroutines-core-jvm-1.9.0.jar
fetch org/jetbrains/kotlinx/kotlinx-serialization-core-jvm/1.7.3 kotlinx-serialization-core-jvm-1.7.3.jar
(cd libs && unzip -o -q "purchases-$VERSION.aar" classes.jar && mv classes.jar "purchases-$VERSION-classes.jar")
CP="libs/purchases-$VERSION-classes.jar:libs/kotlin-stdlib-2.2.0.jar:libs/kotlinx-coroutines-core-jvm-1.9.0.jar:libs/kotlinx-serialization-core-jvm-1.7.3.jar"
javac -d build -cp "$CP" src/android/content/Context.java src/android/content/pm/PackageManager.java src/Repro.java
java -cp "build:$CP" Repro
