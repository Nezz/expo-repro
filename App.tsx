/**
 * Reproducer for an Android crash, `IllegalStateException: Check failed.` in
 * ReactViewGroup.isViewClipped, with React Native alone.
 *
 * A horizontal FlatList keeps removeClippedSubviews at its Android default
 * (true). Every card has opacity 0.8, so each is a native view holding its
 * two children. Every 500 ms a card flashes: a timer sets `flash`, which
 * renders the card at opacity 1, so Fabric flattens it (Delete) and moves its
 * children into the list's clipping content container. A layout effect ends
 * the flash, so React commits again in the same JS task and the card gets its
 * view back (Create). Each card flashes twice, then the list scrolls one card
 * on with scrollToIndex. The flashing card is six cards ahead of the current
 * one, off screen.
 *
 * Android merges the two commits into one mount batch and runs its deletes
 * last, so the card's view ends up back in the container but unregistered.
 * The card's second flash logs `Unable to find viewState` and `View already
 * has a parent`, and then fails `check(parent === this)`.
 *
 * Controls: the same two commits a task apart, and collapsable={false} on the
 * cards, so they never flatten. A build with -PkeepMountOrder=true turns on
 * disableMountItemReorderingAndroid (MainApplication.kt).
 *
 * @format
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

type Mode = 'one task' | 'two tasks' | 'collapsable={false}';

const MODES: Mode[] = ['one task', 'two tasks', 'collapsable={false}'];
const CARDS = Array.from({ length: 50 }, (_, index) => index);
const CARD_WIDTH = 100;
// Off screen to the right of the current card, inside the list's render window.
const FLASH_AHEAD = 6;

export default function App() {
  const [mode, setMode] = useState<Mode | null>(null);

  return (
    <View style={styles.screen}>
      <View style={styles.buttons}>
        {MODES.map(value => (
          <Pressable
            key={value}
            accessibilityRole="button"
            onPress={() => setMode(value)}
            style={styles.button}
          >
            <Text style={styles.buttonText}>{value}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.status}>
        {mode ? `Flashing in ${mode}` : 'Tap a mode to start'}
      </Text>
      {mode && <Strip key={mode} mode={mode} />}
    </View>
  );
}

function Strip({ mode }: { mode: Mode }) {
  const [beat, setBeat] = useState(0);
  const [flash, setFlash] = useState(false);
  const listRef = useRef<FlatList<number>>(null);
  const current = Math.floor(beat / 2) % CARDS.length;
  const flashed = current + FLASH_AHEAD;

  useEffect(() => {
    const timer = setInterval(() => {
      setBeat(value => value + 1);
      setFlash(true);
    }, 500);
    return () => clearInterval(timer);
  }, []);

  // Ends the flash before this JS task ends: React commits a second time.
  useLayoutEffect(() => {
    if (flash && mode !== 'two tasks') {
      setFlash(false);
    }
  }, [flash, mode]);

  // Control: ends the flash in a later JS task.
  useEffect(() => {
    if (!flash || mode !== 'two tasks') {
      return;
    }
    const timer = setTimeout(() => setFlash(false), 0);
    return () => clearTimeout(timer);
  }, [flash, mode]);

  useEffect(() => {
    console.log(`beat=${beat} current=${current}`);
    listRef.current?.scrollToIndex({
      index: current,
      animated: true,
      viewPosition: 0,
    });
  }, [beat, current]);

  return (
    <FlatList
      ref={listRef}
      data={CARDS}
      horizontal
      extraData={`${flashed}-${flash}`}
      getItemLayout={(_, index) => ({
        length: CARD_WIDTH,
        offset: CARD_WIDTH * index,
        index,
      })}
      renderItem={({ item }) => (
        <View
          collapsable={mode === 'collapsable={false}' ? false : undefined}
          style={[styles.card, !(flash && item === flashed) && styles.dimmed]}
        >
          <Text style={styles.label}>#{item}</Text>
          <View style={styles.diagram} />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: 48,
    backgroundColor: '#111',
  },
  buttons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 8,
  },
  button: {
    backgroundColor: '#333',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  buttonText: {
    color: '#fff',
  },
  status: {
    color: '#fff',
    padding: 8,
  },
  card: {
    width: CARD_WIDTH,
    paddingRight: 8,
  },
  dimmed: {
    opacity: 0.8,
  },
  label: {
    color: '#fff',
    fontSize: 16,
  },
  diagram: {
    height: 80,
    backgroundColor: '#4af',
  },
});
