package com.clippedsubviewsrepro;

import static com.clippedsubviewsrepro.StripMount.CARD_WIDTH;
import static com.clippedsubviewsrepro.StripMount.card;
import static com.clippedsubviewsrepro.StripMount.leaf;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import android.app.Application;
import android.view.ViewGroup;
import com.clippedsubviewsrepro.StripMount.Batch;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.List;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;

/**
 * The mounting-layer half of the bug, deterministic: React Native 0.88's real Java mounting classes
 * fed the batch FabricMountingManager::executeMount builds when two transactions are merged, one
 * that flattens a card (Delete) and one that gives it its view back (Create). executeMount writes
 * the deletes last, so the card's Delete runs after its Create.
 *
 * Run: ./gradlew :app:testDebugUnitTest --tests 'com.clippedsubviewsrepro.*'
 */
@RunWith(RobolectricTestRunner.class)
@Config(sdk = 34, application = Application.class)
public class MergedTransactionMountTest {
  private static final int CARDS = 13;
  private static final int FROM = 5;

  private StripMount mount;

  @Before
  public void setUp() {
    mount = new StripMount();
    mount.mountStrip(CARDS, FROM);
    mount.scrollView().scrollTo(FROM * CARD_WIDTH, 0);
  }

  @After
  public void tearDown() {
    mount.close();
  }

  /**
   * Card 6 becomes current and stops being current in two transactions merged into one batch.
   * C++ emits the Create (the first transaction erased card 6 from allocatedViewTags), Java's
   * createView skips it (card 6's view is still registered), and the Delete at the batch's end then
   * unregisters the view the batch has just put back in the container with its children. Nothing
   * is logged. The next change logs MissingViewState and "already has a parent", and the one after
   * that fails `check(parent === this)` in ReactViewGroup.isViewClipped.
   */
  @Test
  public void mergedFlattenAndUnflattenStrandsTheViewAndFailsLater() {
    int stranded = card(FROM + 1);

    Batch merged = StripMount.currentMoves(FROM, FROM, true);
    StripMount.currentMovesBack(merged, FROM, FROM, true).execute(mount);
    assertSoftExceptions();
    assertEquals(mount.content(), mount.listed(stranded).getParent());
    assertEquals(2, ((ViewGroup) mount.listed(stranded)).getChildCount());
    assertFalse(mount.registered(stranded));

    StripMount.currentMoves(FROM, FROM, true).execute(mount);
    assertSoftExceptions(
        "Unable to find viewState for tag: [" + stranded + "] for removeViewAt",
        "Unable to find viewState for tag: [" + stranded + "] for removeViewAt",
        "addViewAt: cannot insert view [" + leaf(FROM + 1, 0) + "] into parent [4]: View already has a parent: [" + stranded + "]",
        "addViewAt: cannot insert view [" + leaf(FROM + 1, 1) + "] into parent [4]: View already has a parent: [" + stranded + "]",
        "Unable to find viewState for tag " + stranded + " for deleteView");

    mount.scrollView().scrollTo((FROM + 1) * CARD_WIDTH, 0);
    IllegalStateException crash = null;
    try {
      StripMount.currentMoves(FROM + 1, FROM + 1, true).execute(mount);
    } catch (IllegalStateException e) {
      System.out.println("== the next change threw:\n" + stackOf(e));
      crash = e;
    }
    assertNotNull("the next change didn't throw", crash);
    assertEquals("Check failed.", crash.getMessage());
    assertFrames(
        crash,
        "ReactViewGroup.isViewClipped",
        "ReactViewGroup.updateSubviewClipStatus",
        "SurfaceMountingManager.updateLayout",
        "IntBufferBatchMountItem.execute");
  }

  /** Control: the same merged batches with mount items in mutation order (disableMountItemReorderingAndroid). */
  @Test
  public void theSameBatchesInMutationOrderAreHarmless() {
    Batch merged = StripMount.currentMoves(Batch.inMutationOrder(), FROM, FROM, true);
    StripMount.currentMovesBack(merged, FROM, FROM, true).execute(mount);
    StripMount.currentMoves(Batch.inMutationOrder(), FROM, FROM, true).execute(mount);
    mount.scrollView().scrollTo((FROM + 1) * CARD_WIDTH, 0);
    StripMount.currentMoves(Batch.inMutationOrder(), FROM + 1, FROM + 1, true).execute(mount);
    for (int x = 0; x <= (CARDS - 4) * CARD_WIDTH; x += 10) {
      mount.scrollView().scrollTo(x, 0);
    }

    assertSoftExceptions();
    assertEquals(CARDS + 1, mount.listedChildren());
  }

  /** Control: the same two transactions mounted as two batches, as when they come in two JS tasks. */
  @Test
  public void theSameTransactionsInTwoBatchesAreHarmless() {
    StripMount.currentMoves(FROM, FROM, true).execute(mount);
    StripMount.currentMovesBack(new Batch(), FROM, FROM, true).execute(mount);
    StripMount.currentMoves(FROM, FROM, true).execute(mount);
    mount.scrollView().scrollTo((FROM + 1) * CARD_WIDTH, 0);
    StripMount.currentMoves(FROM + 1, FROM + 1, true).execute(mount);
    for (int x = 0; x <= (CARDS - 4) * CARD_WIDTH; x += 10) {
      mount.scrollView().scrollTo(x, 0);
    }

    assertSoftExceptions();
    assertEquals(CARDS + 1, mount.listedChildren());
  }

  private void assertSoftExceptions(String... messages) {
    List<String> actual = new ArrayList<>();
    for (Throwable t : mount.softExceptions) {
      actual.add(t.getMessage());
    }
    assertEquals("soft exceptions " + actual, messages.length, actual.size());
    for (int i = 0; i < messages.length; i++) {
      assertTrue(
          "soft exception " + i + ": expected " + messages[i] + " in " + actual,
          actual.get(i).startsWith(messages[i]));
    }
    mount.softExceptions.clear();
  }

  private static void assertFrames(Throwable t, String... frames) {
    StackTraceElement[] stack = t.getStackTrace();
    int at = 0;
    for (String frame : frames) {
      boolean found = false;
      while (at < stack.length) {
        String className = stack[at].getClassName();
        String name = className.substring(className.lastIndexOf('.') + 1) + "." + stack[at].getMethodName();
        at++;
        if (name.equals(frame) || name.startsWith(frame + "$")) {
          found = true;
          break;
        }
      }
      assertTrue("frame " + frame + " not found in order in\n" + stackOf(t), found);
    }
  }

  private static String stackOf(Throwable t) {
    StringWriter out = new StringWriter();
    t.printStackTrace(new PrintWriter(out));
    StringBuilder kept = new StringBuilder();
    for (String line : out.toString().split("\n")) {
      if (!line.contains("org.junit") && !line.contains("org.robolectric") && !line.contains("jdk.internal")
          && !line.contains("java.lang.reflect") && !line.contains("org.gradle") && !line.contains("worker.org")) {
        kept.append(line).append('\n');
      }
    }
    return kept.toString();
  }
}
