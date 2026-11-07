// #59741's Yoga-only case: a row shrinks 951 -> 469 while its child goes width 475 -> flex: 1, Fabric's way.
#include <yoga/Yoga.h>
#include <yoga/node/Node.h>
#include <cstdio>
using namespace facebook::yoga;
int main() {
  YGNodeRef root = YGNodeNew();
  YGNodeStyleSetFlexDirection(root, YGFlexDirectionRow);
  YGNodeStyleSetWidth(root, 951);
  YGNodeStyleSetHeight(root, 600);
  YGNodeRef list = YGNodeNew();
  YGNodeStyleSetWidth(list, 475);
  YGNodeInsertChild(root, list, 0);
  YGNodeCalculateLayout(root, YGUndefined, YGUndefined, YGDirectionLTR);
  Node* r = resolveRef(root);
  Node* l = resolveRef(list);
  Style rs = r->style();
  rs.setDimension(Dimension::Width, StyleSizeLength::points(469));
  r->setStyle(rs);
  r->setDirty(true);
  Style ls = l->style();
  ls.setDimension(Dimension::Width, StyleSizeLength::undefined());
  ls.setFlex(FloatOptional(1));
  l->setStyle(ls);
  l->setDirty(true);
  YGNodeCalculateLayout(root, YGUndefined, YGUndefined, YGDirectionLTR);
  printf("#59741 case: list width = %.0f (row = 469)\n", YGNodeLayoutGetWidth(list));
}
