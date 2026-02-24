import { LinearGradient } from 'expo-linear-gradient';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Generate fake messages
const MESSAGES = Array.from({ length: 20 }, (_, i) => ({
  id: String(i),
  role: i % 2 === 0 ? 'user' : 'assistant',
  text: i % 2 === 0
    ? `Message #${i + 1}`
    : `This is a longer response for message #${i + 1}. It contains multiple sentences to simulate real chat content.`,
}));

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const flatListRef = useRef<FlatList>(null);
  const [log, setLog] = useState<string[]>([]);
  const prevTop = useRef(insets.top);
  const [flatListHeight, setFlatListHeight] = useState(0);
  const [count, setCount] = useState(0);

  const fadeHeight = insets.top + 80; // safe area + top buttons area (matching main app)

  useEffect(() => {
    if (insets.top !== prevTop.current) {
      const entry = `${new Date().toLocaleTimeString()}: top ${prevTop.current} → ${insets.top}`;
      setLog((prev) => [entry, ...prev].slice(0, 30));
      prevTop.current = insets.top;
    }
  }, [insets.top]);

  const isZero = insets.top === 0;

  const renderItem = ({ item }: { item: typeof MESSAGES[0] }) => (
    <View style={[styles.messageBubble, item.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  const renderHeader = () => (
    <View style={{ paddingTop: fadeHeight }}>
      <View style={[styles.insetIndicator, isZero && styles.insetIndicatorError]}>
        <Text style={styles.insetLabel}>insets.top = </Text>
        <Text style={[styles.insetValue, isZero && styles.insetValueError]}>{insets.top}</Text>
      </View>
      {log.length > 0 && (
        <View style={styles.logContainer}>
          <Text style={styles.logTitle}>Change log:</Text>
          {log.slice(0, 10).map((entry, i) => (
            <Text key={i} style={styles.logEntry}>{entry}</Text>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Menu button using insets.top (like MenuButton.tsx) */}
      <TouchableOpacity
        style={[styles.menuButton, { top: insets.top + 16 }]}
        onPress={() => navigation.openDrawer()}
        activeOpacity={0.7}
      >
        <View style={styles.menuIcon}>
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
        </View>
      </TouchableOpacity>

      {/* MaskedView + FlatList structure matching ChatMessages.tsx */}
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          <LinearGradient colors={['transparent', 'black']} style={{ height: fadeHeight, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }} />
          <FlatList
            ref={flatListRef}
            data={MESSAGES}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            style={styles.flatList}
            contentContainerStyle={styles.flatListContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            ListHeaderComponent={renderHeader}
            removeClippedSubviews={true}
            onLayout={(event) => setFlatListHeight(event.nativeEvent.layout.height)}
          />
        </View>
      </View>

      <View style={styles.inputArea}>
        <Pressable style={styles.tapButton} onPress={() => setCount((c) => c + 1)}>
          <Text style={styles.tapButtonText}>Tap me ({count})</Text>
        </Pressable>
        <View style={{ height: insets.bottom }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1A',
  },
  menuButton: {
    position: 'absolute',
    left: 16,
    backgroundColor: 'rgba(31, 41, 55, 0.50)',
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: '#374151',
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    zIndex: 10,
  },
  menuIcon: {
    width: 16,
    height: 12,
    justifyContent: 'space-between',
  },
  menuLine: {
    width: 16,
    height: 2,
    backgroundColor: '#00D296',
    borderRadius: 1,
  },
  flatList: {
    flex: 1,
    width: '100%',
  },
  flatListContent: {
    flexGrow: 1,
    paddingBottom: 24,
    paddingHorizontal: 16,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
    maxWidth: '85%',
  },
  userBubble: {
    backgroundColor: '#1E3A5F',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#1F2937',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: '#E5E7EB',
    fontSize: 15,
    lineHeight: 22,
  },
  insetIndicator: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  insetIndicatorError: {
    backgroundColor: '#7F1D1D',
  },
  insetLabel: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  insetValue: {
    color: '#00D296',
    fontSize: 32,
    fontWeight: '700',
  },
  insetValueError: {
    color: '#EF4444',
  },
  logContainer: {
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  logTitle: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  logEntry: {
    color: '#D1D5DB',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 1,
  },
  inputArea: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  tapButton: {
    backgroundColor: '#00D296',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  tapButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
