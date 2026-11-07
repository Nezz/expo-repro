#!/bin/zsh
# usage: run.sh <react-native>/ReactCommon/yoga [yoga-pr.diff]
# Builds model.cpp (this repro's layout) and model59741.cpp (#59741's Yoga-only case) against that Yoga, optionally
# with a Yoga PR's diff applied to a copy (e.g. https://github.com/react/yoga/pull/2020.diff), and prints the widths.
set -e
here=${0:A:h}
work=$(mktemp -d)
cp -R "$1/yoga" "$work/yoga"
if [[ -n "$2" ]]; then
	# Only the library's sources: the PR's tests/ files aren't in React Native's copy.
	python3 -I -c '
import re, sys
parts = re.split(r"(?m)^(?=diff --git )", open(sys.argv[1]).read())
sys.stdout.write("".join(p for p in parts if not p.startswith("diff --git a/tests/")))' "$2" | patch -p1 -d "$work"
fi
sources=("${(@f)$(find "$work/yoga" -name '*.cpp')}")
for model in model model59741; do
	clang++ -std=c++20 -O1 -w -I"$work" "$here/$model.cpp" "${sources[@]}" -o "$work/$model"
done
for mode in fabric setters fabric-clear fabric-width50; do
	"$work/model" "$mode" | tail -1
done
"$work/model59741"
