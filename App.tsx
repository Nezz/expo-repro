import React, {useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';

const TEXT = 'Get all premium tools';
const SPACINGS = Array.from({length: 101}, (_, index) => index / 100);
const FONT_SIZES = [16, ...Array.from({length: 13}, (_, index) => 12 + index).filter(size => size !== 16)];
const CASES = FONT_SIZES.flatMap(fontSize =>
  SPACINGS.map(spacing => ({key: `${fontSize}/${spacing}`, fontSize, spacing})),
);

export default function App() {
  const [lineCounts, setLineCounts] = useState<Record<string, number>>({});
  const wrapped = CASES.filter(({key}) => (lineCounts[key] ?? 1) > 1);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text testID="summary" style={styles.summary}>
        {`Wrapped: ${wrapped.length} of ${CASES.length} (fontSize/letterSpacing)\n` +
          wrapped.map(({key}) => key).join('  ')}
      </Text>
      {CASES.map(({key, fontSize, spacing}) => (
        <View key={key} style={styles.row}>
          <Text style={styles.label}>{key}</Text>
          <Text
            allowFontScaling={false}
            style={[
              styles.text,
              {fontSize, lineHeight: fontSize * 1.5, letterSpacing: spacing},
              (lineCounts[key] ?? 1) > 1 && styles.wrapped,
            ]}
            onTextLayout={event =>
              setLineCounts(counts => ({
                ...counts,
                [key]: event.nativeEvent.lines.length,
              }))
            }>
            {TEXT}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {padding: 16, paddingTop: 48, backgroundColor: 'white'},
  summary: {fontSize: 16, fontWeight: 'bold', marginBottom: 12, color: 'black'},
  row: {flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4},
  label: {width: 64, fontSize: 12, color: 'gray'},
  text: {fontFamily: 'sans-serif', color: 'black', backgroundColor: '#e0f0ff'},
  wrapped: {backgroundColor: '#ffb0b0'},
});
