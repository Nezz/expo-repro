import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

/**
 * Minimal repro: View inside Link.Trigger cannot vertically center its child.
 *
 * The "selected" highlight is always visible so the misalignment is obvious.
 * The View applies justifyContent:'center' but the Text is not vertically
 * centered within the highlighted Link area.
 */
export default function Index() {
  return (
    <View style={styles.screen}>
      <Text style={styles.heading}>Link.Trigger vertical-center bug</Text>

      {/* Bug case: View inside Link.Trigger with justifyContent:'center' */}
      <View style={styles.row}>
        <Link href="/detail" style={styles.link}>
          <Link.Trigger>
            <View style={styles.triggerView}>
              <Text style={styles.linkText}>Bug: not centered</Text>
            </View>
          </Link.Trigger>
        </Link>
      </View>

      {/* Control: same layout without Link.Trigger wrapper */}
      <View style={styles.row}>
        <View style={[styles.link, styles.controlLink]}>
          <View style={styles.triggerView}>
            <Text style={styles.linkText}>Control: centered</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#111',
    paddingTop: 100,
    paddingHorizontal: 20,
    gap: 16,
  },
  heading: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  link: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  controlLink: {
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
  },
  triggerView: {
    // Note: This wasn't even needed with Expo 54
    justifyContent: 'center',
  },
  linkText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#f8fafc',
  },
});
