import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DashboardScreen } from '../../src/screens/DashboardScreen';
import { DiscoverScreen } from '../../src/screens/DiscoverScreen';
import { GroupsScreen } from '../../src/screens/GroupsScreen';
import { ProfileScreen } from '../../src/screens/ProfileScreen';
import { SavedScreen } from '../../src/screens/SavedScreen';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';

// The pitch's constraint: a pager, not a tab bar. One route hosts all five pages so
// PagerView owns the horizontal swipe directly, instead of fighting Expo Router's
// file-based nesting to get the same gesture.
const pages = [
  { key: 'dashboard', label: 'Home', render: () => <DashboardScreen /> },
  { key: 'discover', label: 'Discover', render: () => <DiscoverScreen /> },
  { key: 'saved', label: 'Saved', render: () => <SavedScreen /> },
  { key: 'groups', label: 'Groups', render: () => <GroupsScreen /> },
  { key: 'profile', label: 'Profile', render: () => <ProfileScreen /> },
];

export default function AppPager() {
  const pagerRef = useRef<PagerView>(null);
  const [page, setPage] = useState(0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <Text style={styles.pageLabel}>{pages[page].label}</Text>
      <View style={styles.tabs}>
        {pages.map((p, i) => (
          <Pressable
            key={p.key}
            style={styles.tab}
            onPress={() => pagerRef.current?.setPage(i)}
            hitSlop={8}
          >
            <View style={[styles.dot, i === page && styles.dotActive]} />
          </Pressable>
        ))}
      </View>

      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={(e) => setPage(e.nativeEvent.position)}
      >
        {pages.map((p) => (
          <View key={p.key} style={styles.page}>
            {p.render()}
          </View>
        ))}
      </PagerView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  pager: { flex: 1 },
  page: { flex: 1, paddingHorizontal: spacing.lg },
  pageLabel: { ...typography.heading, textAlign: 'center', paddingTop: spacing.xs },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  tab: { padding: spacing.xs },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary, width: 20 },
});
