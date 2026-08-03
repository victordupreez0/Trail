import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import PagerView from 'react-native-pager-view';

import { Button } from '../src/components/ui/Button';
import { ScreenContainer } from '../src/components/ui/ScreenContainer';
import { useAppState } from '../src/state/AppState';
import { colors } from '../src/theme/colors';
import { spacing } from '../src/theme/spacing';
import { typography } from '../src/theme/typography';

const slides = [
  {
    title: 'Do less, not more',
    body: 'Trail protects the calm a hike already gives you — fewer taps, fewer alerts, more mountain.',
  },
  {
    title: 'Find a trail, keep your people close',
    body: 'Discover trails nearby and see your whole party on one shared map, in real time.',
  },
  {
    title: 'Built for your hands, not your eyes',
    body: 'Swipe, don’t tap. Big targets, high contrast, calm CTAs only where safety needs them.',
  },
];

export default function Onboarding() {
  const { completeOnboarding } = useAppState();
  const pagerRef = useRef<PagerView>(null);
  const [page, setPage] = useState(0);
  const isLast = page === slides.length - 1;

  const next = () => {
    if (isLast) {
      completeOnboarding();
      router.replace('/(auth)/login');
    } else {
      pagerRef.current?.setPage(page + 1);
    }
  };

  return (
    <ScreenContainer style={styles.container}>
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={(e) => setPage(e.nativeEvent.position)}
      >
        {slides.map((slide) => (
          <View key={slide.title} style={styles.slide}>
            <Text style={typography.title}>{slide.title}</Text>
            <Text style={styles.body}>{slide.body}</Text>
          </View>
        ))}
      </PagerView>

      <View style={styles.dots}>
        {slides.map((slide, i) => (
          <View key={slide.title} style={[styles.dot, i === page && styles.dotActive]} />
        ))}
      </View>

      <Button label={isLast ? 'Get started' : 'Next'} onPress={next} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'flex-end', paddingBottom: spacing.lg },
  pager: { flex: 1 },
  slide: { flex: 1, justifyContent: 'center', gap: spacing.md, paddingTop: spacing.xl },
  body: { ...typography.body, color: colors.muted },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary, width: 20 },
});
