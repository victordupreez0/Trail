import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import PagerView from 'react-native-pager-view';

import { Button } from '../src/components/ui/Button';
import { ScreenContainer } from '../src/components/ui/ScreenContainer';
import { useAppState } from '../src/state/AppState';
import { colors } from '../src/theme/colors';
import { radius, spacing } from '../src/theme/spacing';
import { typography } from '../src/theme/typography';

// One slide per inspiration card: reduce stress, geolocation, gesture-first.
const slides = [
  {
    icon: 'leaf-outline',
    title: 'Do less,\nnot more',
    body: 'Trail protects the calm a hike already gives you. Fewer taps, fewer alerts, more mountain.',
  },
  {
    icon: 'location-outline',
    title: 'Keep your\npeople close',
    body: 'See your whole party on one shared map, live, without anyone having to check in.',
  },
  {
    icon: 'hand-left-outline',
    title: 'Built for\nyour hands',
    body: 'Swipe to move through trails. Big targets, high contrast, and clear buttons where safety needs them.',
  },
] as const;

export default function Onboarding() {
  const { completeOnboarding } = useAppState();
  const pagerRef = useRef<PagerView>(null);
  const [page, setPage] = useState(0);
  const isLast = page === slides.length - 1;

  const finish = () => {
    completeOnboarding();
    router.replace('/(auth)/login');
  };

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.brand}>
          <Ionicons name="triangle" size={17} color={colors.primary} />
          <Text style={styles.brandText}>Trail</Text>
        </View>
        {!isLast ? (
          <Pressable
            onPress={finish}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
          >
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        ) : null}
      </View>

      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={(e) => setPage(e.nativeEvent.position)}
      >
        {slides.map((slide) => (
          <View key={slide.title} style={styles.slide}>
            <View style={styles.iconCircle}>
              <Ionicons name={slide.icon} size={38} color={colors.primary} />
            </View>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.body}>{slide.body}</Text>
          </View>
        ))}
      </PagerView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((slide, i) => (
            <View key={slide.title} style={[styles.dot, i === page && styles.dotActive]} />
          ))}
        </View>
        <Button
          label={isLast ? 'Get started' : 'Next'}
          icon={isLast ? 'arrow-forward' : undefined}
          onPress={() => (isLast ? finish() : pagerRef.current?.setPage(page + 1))}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: spacing.lg },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandText: { ...typography.label, color: colors.primaryDark, letterSpacing: 0.5 },
  skip: { ...typography.label, color: colors.muted },
  pager: { flex: 1 },
  slide: { flex: 1, justifyContent: 'center', gap: spacing.md },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: { ...typography.display, fontSize: 38, lineHeight: 44 },
  body: { ...typography.body, color: colors.muted, fontSize: 17, lineHeight: 26 },
  footer: { gap: spacing.lg },
  dots: { flexDirection: 'row', gap: spacing.xs },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary, width: 24 },
});
