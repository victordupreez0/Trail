import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardScreen } from '../../src/screens/DashboardScreen';
import { DiscoverScreen } from '../../src/screens/DiscoverScreen';
import { GroupsScreen } from '../../src/screens/GroupsScreen';
import { ProfileScreen } from '../../src/screens/ProfileScreen';
import { SavedScreen } from '../../src/screens/SavedScreen';
import { colors } from '../../src/theme/colors';
import { radius, spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';

// Swiping between pages keeps the gesture-first constraint; the tab bar gives the
// same destinations a visible, tappable affordance. Gestures are the shortcut,
// buttons are the map.
const pages = [
  { key: 'dashboard', label: 'Today', icon: 'home', render: () => <DashboardScreen /> },
  { key: 'discover', label: 'Discover', icon: 'compass', render: () => <DiscoverScreen /> },
  { key: 'saved', label: 'Saved', icon: 'bookmark', render: () => <SavedScreen /> },
  { key: 'groups', label: 'Party', icon: 'people', render: () => <GroupsScreen /> },
  { key: 'profile', label: 'You', icon: 'person', render: () => <ProfileScreen /> },
] as const;

export default function AppPager() {
  const pagerRef = useRef<PagerView>(null);
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(0);

  const goTo = (i: number) => {
    if (i !== page) Haptics.selectionAsync().catch(() => {});
    pagerRef.current?.setPage(i);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
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

      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
        {pages.map((p, i) => {
          const active = i === page;
          return (
            <Pressable
              key={p.key}
              accessibilityRole="tab"
              accessibilityLabel={p.label}
              accessibilityState={{ selected: active }}
              style={styles.tab}
              onPress={() => goTo(i)}
            >
              <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
                <Ionicons
                  name={(active ? p.icon : `${p.icon}-outline`) as keyof typeof Ionicons.glyphMap}
                  size={21}
                  color={active ? colors.primaryDark : colors.muted}
                />
              </View>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{p.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  pager: { flex: 1 },
  page: { flex: 1, paddingHorizontal: spacing.lg },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  tab: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 2 },
  iconWrap: {
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  iconWrapActive: { backgroundColor: colors.primarySoft },
  tabLabel: { ...typography.caption, fontSize: 11, color: colors.muted },
  tabLabelActive: { color: colors.primaryDark, fontWeight: '700' },
});
