package com.clippedsubviewsrepro;

import android.content.Context;
import android.view.View;
import android.widget.FrameLayout;
import com.facebook.react.bridge.BridgeReactContext;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReactSoftExceptionLogger;
import com.facebook.react.fabric.mounting.MountingManager;
import com.facebook.react.fabric.mounting.mountitems.MountItem;
import com.facebook.react.fabric.mounting.mountitems.MountItemFactory;
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests;
import com.facebook.react.uimanager.DisplayMetricsHolder;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.uimanager.ViewManagerRegistry;
import com.facebook.react.uimanager.events.BlackHoleEventDispatcher;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.uimanager.events.EventDispatcherProvider;
import com.facebook.react.views.scroll.ReactHorizontalScrollContainerViewManager;
import com.facebook.react.views.scroll.ReactHorizontalScrollView;
import com.facebook.react.views.scroll.ReactHorizontalScrollViewManager;
import com.facebook.react.views.view.ReactViewGroup;
import com.facebook.react.views.view.ReactViewManager;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.robolectric.RuntimeEnvironment;

/**
 * Drives React Native's real Android mounting layer (MountingManager, SurfaceMountingManager,
 * IntBufferBatchMountItem, ReactViewManager, ReactViewGroup, ReactHorizontalScrollView) with
 * mount batches shaped like the ones FabricMountingManager::executeMount sends for a horizontal
 * list: a ScrollView whose content container has removeClippedSubviews, holding one card per item.
 * A dimmed card (opacity 0.8) is a view of its own; the current card (opacity 1) is layout-only,
 * so Fabric flattens it and its two children sit directly in the content container.
 */
final class StripMount {
  static final int SURFACE = 11;
  static final int SCROLL = 2;
  static final int CONTENT = 4;
  static final int CARD_WIDTH = 100;
  static final int STRIP_WIDTH = 400;
  static final int HEIGHT = 100;

  // IntBufferBatchMountItem's instruction types (IntBufferBatchMountItem.kt companion object).
  private static final int CREATE = 2;
  private static final int DELETE = 4;
  private static final int INSERT = 8;
  private static final int REMOVE = 16;
  private static final int UPDATE_LAYOUT = 128;

  final MountingManager mountingManager;
  final List<Throwable> softExceptions = new ArrayList<>();
  private final ReactSoftExceptionLogger.ReactSoftExceptionListener listener;

  StripMount() {
    ReactNativeFeatureFlagsForTests.INSTANCE.setUp();
    android.app.Application app = RuntimeEnvironment.getApplication();
    DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(app);
    BridgeReactContext reactContext = new ScrollEventsContext(app);
    ThemedReactContext themed = new ThemedReactContext(reactContext, app, "Strip", SURFACE);
    Map<String, ViewManager<?, ?>> managers = new HashMap<>();
    managers.put("RCTView", new ReactViewManager());
    managers.put("AndroidHorizontalScrollView", new ReactHorizontalScrollViewManager());
    managers.put("AndroidHorizontalScrollContentView", new ReactHorizontalScrollContainerViewManager());
    mountingManager = new MountingManager(new ViewManagerRegistry(managers), items -> {});
    mountingManager.startSurface(SURFACE, themed, new FrameLayout(app));
    listener = (category, cause) -> softExceptions.add(cause);
    ReactSoftExceptionLogger.addListener(listener);
  }

  void close() {
    ReactSoftExceptionLogger.removeListener(listener);
  }

  /** Tag of card {@code index}'s own view (only mounted while the card is dimmed). */
  static int card(int index) {
    return 100 + 10 * index;
  }

  /** Tag of card {@code index}'s first (0) or second (1) child. */
  static int leaf(int index, int which) {
    return card(index) + 2 + 2 * which;
  }

  View view(int tag) {
    return mountingManager.getSurfaceManagerEnforced(SURFACE, "test").getView(tag);
  }

  ReactViewGroup content() {
    return (ReactViewGroup) view(CONTENT);
  }

  ReactHorizontalScrollView scrollView() {
    return (ReactHorizontalScrollView) view(SCROLL);
  }

  /** Whether SurfaceMountingManager still has a view registered for {@code tag}. */
  boolean registered(int tag) {
    return mountingManager.getSurfaceManagerEnforced(SURFACE, "test").getViewExists(tag);
  }

  /** The container's allChildren entry with id {@code tag}, or null. */
  View listed(int tag) {
    ReactViewManager manager = new ReactViewManager();
    for (int i = 0; i < manager.getChildCount(content()); i++) {
      View child = manager.getChildAt(content(), i);
      if (child.getId() == tag) {
        return child;
      }
    }
    return null;
  }

  /** Children ReactViewGroup's clipping bookkeeping lists (allChildren), attached or clipped. */
  int listedChildren() {
    return new ReactViewManager().getChildCount(content());
  }

  /** The strip at rest: {@code cards} cards, the one at {@code current} flattened into the container. */
  void mountStrip(int cards, int current) {
    Batch b = new Batch();
    b.create(SCROLL, JavaOnlyMap.of("removeClippedSubviews", true));
    b.create(CONTENT, JavaOnlyMap.of("removeClippedSubviews", true, "collapsable", false));
    b.insert(SCROLL, SURFACE, 0);
    b.insert(CONTENT, SCROLL, 0);
    int index = 0;
    for (int i = 0; i < cards; i++) {
      if (i == current) {
        b.create(leaf(i, 0), JavaOnlyMap.of());
        b.create(leaf(i, 1), JavaOnlyMap.of());
        b.insert(leaf(i, 0), CONTENT, index++);
        b.insert(leaf(i, 1), CONTENT, index++);
      } else {
        b.createCard(i);
        b.insert(card(i), CONTENT, index++);
      }
    }
    b.layout(SCROLL, SURFACE, 0, STRIP_WIDTH);
    b.layout(CONTENT, SCROLL, 0, cards * CARD_WIDTH);
    for (int i = 0; i < cards; i++) {
      if (i == current) {
        b.flattenedLayout(i);
      } else {
        b.cardLayout(i);
      }
    }
    b.execute(this);
    scrollView().updateClippingRect();
  }

  /**
   * The mutations Fabric's differ emits when the current card moves from {@code from} to
   * {@code from + 1}: card {@code from} gets its view back (opacity 0.8) and takes its children out
   * of the container, card {@code from + 1} loses its view and its children move into the container.
   * {@code firstIndex} is where card {@code from}'s children sit in the container.
   */
  static Batch currentMoves(int from, int firstIndex, boolean createsCard) {
    return currentMoves(new Batch(), from, firstIndex, createsCard);
  }

  /** {@link #currentMoves} appended to {@code b}, as FabricUIManagerBinding merges a transaction into a pending one. */
  static Batch currentMoves(Batch b, int from, int firstIndex, boolean createsCard) {
    int to = from + 1;
    b.remove(leaf(to, 1), card(to), 1);
    b.remove(leaf(to, 0), card(to), 0);
    b.remove(card(to), CONTENT, firstIndex + 2);
    b.remove(leaf(from, 1), CONTENT, firstIndex + 1);
    b.remove(leaf(from, 0), CONTENT, firstIndex);
    if (createsCard) {
      b.createCard(from, false);
    }
    b.insert(leaf(from, 0), card(from), 0);
    b.insert(leaf(from, 1), card(from), 1);
    b.insert(card(from), CONTENT, firstIndex);
    b.insert(leaf(to, 0), CONTENT, firstIndex + 1);
    b.insert(leaf(to, 1), CONTENT, firstIndex + 2);
    b.cardLayout(from);
    b.flattenedLayout(to);
    b.delete(card(to));
    return b;
  }

  /** The reverse of {@link #currentMoves}: card {@code from} current again, card {@code from + 1} a view again. */
  static Batch currentMovesBack(Batch b, int from, int firstIndex, boolean createsCard) {
    int to = from + 1;
    b.remove(leaf(from, 1), card(from), 1);
    b.remove(leaf(from, 0), card(from), 0);
    b.remove(leaf(to, 1), CONTENT, firstIndex + 2);
    b.remove(leaf(to, 0), CONTENT, firstIndex + 1);
    b.remove(card(from), CONTENT, firstIndex);
    if (createsCard) {
      b.createCard(to, false);
    }
    b.insert(leaf(to, 0), card(to), 0);
    b.insert(leaf(to, 1), card(to), 1);
    b.insert(leaf(from, 0), CONTENT, firstIndex);
    b.insert(leaf(from, 1), CONTENT, firstIndex + 1);
    b.insert(card(to), CONTENT, firstIndex + 2);
    b.cardLayout(to);
    b.flattenedLayout(from);
    b.delete(card(from));
    return b;
  }

  /** Lets ReactHorizontalScrollView emit its scroll events (into a black hole) after it clips. */
  private static final class ScrollEventsContext extends BridgeReactContext
      implements EventDispatcherProvider {
    ScrollEventsContext(Context base) {
      super(base);
    }

    @Override
    public EventDispatcher getEventDispatcher() {
      return BlackHoleEventDispatcher.INSTANCE;
    }
  }

  /**
   * A batch of mount instructions in IntBufferBatchMountItem's int/object buffer format, in
   * FabricMountingManager::executeMount's order: creates, removes and inserts as added, then the
   * layout updates, then the deletes.
   */
  static final class Batch {
    private final List<Integer> ints = new ArrayList<>();
    private final List<Object> objects = new ArrayList<>();
    private final List<Integer> layouts;
    private final List<Integer> deletes;

    Batch() {
      this(false);
    }

    private Batch(boolean inMutationOrder) {
      layouts = inMutationOrder ? ints : new ArrayList<>();
      deletes = inMutationOrder ? ints : new ArrayList<>();
    }

    /**
     * A batch in mutation order, as FabricMountingManager writes it with the
     * disableMountItemReorderingAndroid flag on: layouts and deletes stay where they are.
     */
    static Batch inMutationOrder() {
      return new Batch(true);
    }

    Batch create(int tag, JavaOnlyMap props) {
      ints.add(CREATE);
      ints.add(tag);
      ints.add(1);
      objects.add("RCTView");
      objects.add(props);
      objects.add(null);
      objects.add(null);
      if (tag == SCROLL) {
        objects.set(objects.size() - 4, "AndroidHorizontalScrollView");
      } else if (tag == CONTENT) {
        objects.set(objects.size() - 4, "AndroidHorizontalScrollContentView");
      }
      return this;
    }

    /** Card {@code index} as a dimmed view with both children inside it. */
    Batch createCard(int index) {
      return createCard(index, true);
    }

    Batch createCard(int index, boolean withLeaves) {
      create(card(index), JavaOnlyMap.of("opacity", 0.8));
      if (withLeaves) {
        create(leaf(index, 0), JavaOnlyMap.of());
        create(leaf(index, 1), JavaOnlyMap.of());
        insert(leaf(index, 0), card(index), 0);
        insert(leaf(index, 1), card(index), 1);
      }
      return this;
    }

    Batch insert(int tag, int parent, int index) {
      ints.add(INSERT);
      ints.add(tag);
      ints.add(parent);
      ints.add(index);
      return this;
    }

    Batch remove(int tag, int parent, int index) {
      ints.add(REMOVE);
      ints.add(tag);
      ints.add(parent);
      ints.add(index);
      return this;
    }

    Batch delete(int tag) {
      deletes.add(DELETE);
      deletes.add(tag);
      return this;
    }

    Batch layout(int tag, int parent, int x, int width) {
      layouts.add(UPDATE_LAYOUT);
      layouts.add(tag);
      layouts.add(parent);
      layouts.add(x);
      layouts.add(0);
      layouts.add(width);
      layouts.add(HEIGHT);
      layouts.add(1);
      layouts.add(0);
      return this;
    }

    /** Card {@code index} as a view at its slot, its children inside it. */
    Batch cardLayout(int index) {
      layout(card(index), CONTENT, index * CARD_WIDTH, CARD_WIDTH);
      layout(leaf(index, 0), card(index), 0, CARD_WIDTH / 2);
      layout(leaf(index, 1), card(index), CARD_WIDTH / 2, CARD_WIDTH / 2);
      return this;
    }

    /** Card {@code index} flattened: its children at its slot in the container. */
    Batch flattenedLayout(int index) {
      layout(leaf(index, 0), CONTENT, index * CARD_WIDTH, CARD_WIDTH / 2);
      layout(leaf(index, 1), CONTENT, index * CARD_WIDTH + CARD_WIDTH / 2, CARD_WIDTH / 2);
      return this;
    }

    MountItem build() {
      List<Integer> all = new ArrayList<>(ints);
      if (layouts != ints) {
        all.addAll(layouts);
        all.addAll(deletes);
      }
      int[] intBuffer = new int[all.size()];
      for (int i = 0; i < intBuffer.length; i++) {
        intBuffer[i] = all.get(i);
      }
      return MountItemFactory.createIntBufferBatchMountItem(SURFACE, intBuffer, objects.toArray(), 0);
    }

    void execute(StripMount mount) {
      build().execute(mount.mountingManager);
    }
  }
}
