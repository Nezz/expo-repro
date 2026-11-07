// The repro's layout, column -> row, with the style change applied the way Fabric applies it
// (setStyle + setDirty, the old LayoutResults kept) or through Yoga's own setters.
#include <yoga/Yoga.h>
#include <yoga/node/Node.h>
#include <cstdio>
#include <cstring>
using namespace facebook::yoga;

static void fabricSet(YGNodeRef ref, void (*edit)(Style&), bool clearBasis) {
  Node* n = resolveRef(ref);
  Style s = n->style();
  edit(s);
  n->setStyle(s);
  n->setDirty(true);
  if (clearBasis) n->setLayoutComputedFlexBasis(FloatOptional());
}

int main(int argc, char** argv) {
  const char* mode = argc > 1 ? argv[1] : "fabric";  // fabric | setters | fabric-clear | fabric-width50
  YGNodeRef root = YGNodeNew();
  YGNodeStyleSetWidth(root, 375);
  YGNodeStyleSetHeight(root, 667);
  YGNodeStyleSetPadding(root, YGEdgeHorizontal, 16);
  YGNodeRef container = YGNodeNew();
  YGNodeStyleSetGap(container, YGGutterAll, 8);
  YGNodeInsertChild(root, container, 0);
  YGNodeRef wrappers[2];
  const float heights[2] = {40, 120};
  for (int i = 0; i < 2; i++) {
    wrappers[i] = YGNodeNew();
    YGNodeRef box = YGNodeNew();
    YGNodeStyleSetHeight(box, heights[i]);
    YGNodeInsertChild(wrappers[i], box, 0);
    YGNodeInsertChild(container, wrappers[i], i);
  }
  YGNodeCalculateLayout(root, YGUndefined, YGUndefined, YGDirectionLTR);
  printf("stacked: wrapper widths %.1f %.1f\n", YGNodeLayoutGetWidth(wrappers[0]), YGNodeLayoutGetWidth(wrappers[1]));

  if (!strcmp(mode, "setters")) {
    YGNodeStyleSetFlexDirection(container, YGFlexDirectionRow);
    for (auto w : wrappers) YGNodeStyleSetFlex(w, 1);
  } else {
    bool clear = !strcmp(mode, "fabric-clear");
    fabricSet(container, [](Style& s) { s.setFlexDirection(FlexDirection::Row); }, clear);
    for (auto w : wrappers) {
      if (!strcmp(mode, "fabric-width50")) {
        fabricSet(w, [](Style& s) {
          s.setDimension(Dimension::Width, StyleSizeLength::percent(50));
          s.setFlexShrink(FloatOptional(1));
        }, clear);
      } else {
        fabricSet(w, [](Style& s) { s.setFlex(FloatOptional(1)); }, clear);
      }
    }
    resolveRef(root)->setDirty(true);
  }
  YGNodeCalculateLayout(root, YGUndefined, YGUndefined, YGDirectionLTR);
  printf("%s: side by side widths %.1f %.1f\n", mode, YGNodeLayoutGetWidth(wrappers[0]), YGNodeLayoutGetWidth(wrappers[1]));
}
