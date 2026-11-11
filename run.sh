#!/bin/sh
# Builds main.cpp against RxCpp's main (or $RXCPP_DIR) and runs each mode.
set -eu
here=$(cd "$(dirname "$0")" && pwd)
work=${WORK_DIR:-"$here/build"}
mkdir -p "$work"
if [ -z "${RXCPP_DIR:-}" ]; then
  RXCPP_DIR="$work/RxCpp"
  [ -d "$RXCPP_DIR" ] || git clone --depth 1 https://github.com/ReactiveX/RxCpp.git "$RXCPP_DIR"
fi
echo "RxCpp $(git -C "$RXCPP_DIR" rev-parse HEAD)"
${CXX:-c++} -std=c++17 -O1 -pthread -I "$RXCPP_DIR/Rx/v2/src" "$here/main.cpp" -o "$work/repro"
for mode in subscribed dropped dropped-two-threads; do
  "$work/repro" "$mode" || echo "  exit $?"
done
