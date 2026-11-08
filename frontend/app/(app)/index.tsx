import { Ionicons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassSurface } from '../../src/components/ui/GlassSurface';
import { TabBarInsetProvider } from '../../src/hooks/useTabBarInset';
import { haptics } from '../../src/lib/haptics';
import { DashboardScreen } from '../../src/screens/DashboardScreen';
import { DiscoverScreen } from '../../src/screens/DiscoverScreen';
import { GroupsScreen } from '../../src/screens/GroupsScreen';
import { ProfileScreen } from '../../src/screens/ProfileScreen';
import { SavedScreen } from '../../src/screens/SavedScreen';
import { useAppState } from '../../src/state/AppState';
import { colors } from '../../src/theme/colors';
import { radius, spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';

// Swiping between pages keeps the gesture-first constraint; the tab bar gives the
// same destinations a visible, tappable affordance. Gestures are the shortcut,
// buttons are the map. The screens are fixed elements so that changing tab doesn't
// re-render all five of them, map included.
const pages = [
  { key: 'dashboard', label: 'Today', icon: 'home', element: <DashboardScreen /> },
  { key: 'discover', label: 'Discover', icon: 'compass', element: <DiscoverScreen /> },
  { key: 'saved', label: 'Saved', icon: 'bookmark', element: <SavedScreen /> },
  { key: 'groups', label: 'Party', icon: 'people', element: <GroupsScreen /> },
  { key: 'profile', label: 'You', icon: 'person', element: <ProfileScreen /> },
] as const;

const PARTY_PAGE = pages.findIndex((p) => p.key === 'groups');

export default function AppPager() {
  const { authReady, isAuthed, activeGroup, partyTabRequest } = useAppState();
  const pagerRef = useRef<PagerView>(null);
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(0);
  // Measured, not hardcoded: the bar's height is intrinsic to its label text, so it
  // grows at the largest system font size. Published through TabBarInsetProvider so
  // each screen can leave exactly enough clearance for content to pass underneath it.
  const [tabBarHeight, setTabBarHeight] = useState(0);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const handledTabRequest = useRef(partyTabRequest);

  useEffect(() => {
    if (partyTabRequest === handledTabRequest.current) return;
    handledTabRequest.current = partyTabRequest;
    pagerRef.current?.setPage(PARTY_PAGE);
  }, [partyTabRequest]);

  // On Android the window shrinks for the keyboard, which would otherwise lift the
  // tab bar up over whatever is being typed.
  useEffect(() => {
    const shown = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hidden = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, []);

  // Sign-out lands here first; moving on from this state means nothing has to guess
  // when Firebase has finished signing out.
  if (authReady && !isAuthed) return <Redirect href="/(auth)/login" />;

  const goTo = (i: number) => {
    if (i !== page) haptics.selection();
    pagerRef.current?.setPage(i);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <TabBarInsetProvider height={tabBarHeight}>
        <PagerView
          ref={pagerRef}
          style={styles.pager}
          initialPage={0}
          // On the live map a sideways drag has to pan the map, not change tab.
          scrollEnabled={!(page === PARTY_PAGE && activeGroup)}
          onPageSelected={(e) => setPage(e.nativeEvent.position)}
        >
          {pages.map((p) => (
            <View key={p.key} style={styles.page}>
              {p.element}
            </View>
          ))}
        </PagerView>
      </TabBarInsetProvider>

      {keyboardOpen ? null : (
        <GlassSurface
          style={styles.tabBar}
          onLayout={(e) => setTabBarHeight(e.nativeEvent.layout.height)}
        >
          <View
            style={[styles.tabBarInner, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}
          >
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
                      name={
                        (active ? p.icon : `${p.icon}-outline`) as keyof typeof Ionicons.glyphMap
                      }
                      size={21}
                      color={active ? colors.primaryDark : colors.muted}
                    />
                  </View>
                  <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{p.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </GlassSurface>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  pager: { flex: 1 },
  page: { flex: 1, paddingHorizontal: spacing.lg },
  tabBar: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  tabBarInner: {
    flexDirection: 'row',
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
