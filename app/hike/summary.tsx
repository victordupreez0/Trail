import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CountUp } from '../../src/components/CountUp';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { useMotion } from '../../src/hooks/useMotion';
import { trails } from '../../src/data/trails';
import { formatDuration, pathLength, pathToSvgD, projectPath } from '../../src/lib/hikeSummary';
import { todayKey, waterToday } from '../../src/lib/hydration';
import { hexWithAlpha } from '../../src/lib/party';
import { useAppState } from '../../src/state/AppState';
import { colors, sunrise } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';

const ROUTE_CARD_HEIGHT = 200;
const AnimatedPath = Animated.createAnimatedComponent(Path);

export default function HikeSummary() {
  const { trailId, startedAtMs, partySize } = useLocalSearchParams<{
    trailId?: string;
    startedAtMs?: string;
    partySize?: string;
  }>();
  const trail = trails.find((t) => t.id === trailId);
  const { userDoc } = useAppState();
  const { reduced } = useMotion();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // A one-time reveal, not a live clock: computed once at mount from the moment the
  // hike actually ended, not re-evaluated on every render.
  const durationMs = Date.now() - Number(startedAtMs ?? Date.now());
  const waterMl = waterToday(userDoc?.waterMl ?? 0, userDoc?.waterDate ?? null, todayKey());

  const sweep = useSharedValue(reduced ? 0 : height);
  // 1 = fully hidden (dashoffset equals the whole path length), 0 = fully drawn.
  const drawProgress = useSharedValue(reduced ? 0 : 1);

  useEffect(() => {
    if (reduced) return;
    sweep.value = withTiming(0, { duration: 1300, easing: Easing.out(Easing.cubic) });
    drawProgress.value = withTiming(0, { duration: 1200, easing: Easing.out(Easing.cubic) });
    // Only ever runs once per mount; reduced is read for its initial value above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gradientStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sweep.value }],
  }));

  // Computed unconditionally (falling back to an empty path) so the hooks below run
  // in the same order every render; the not-found branch happens only in the JSX.
  const cardWidth = width - spacing.lg * 2;
  const points = projectPath(trail?.path ?? [], cardWidth, ROUTE_CARD_HEIGHT, 16);
  const d = pathToSvgD(points);
  const totalLength = pathLength(points);

  const pathAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: drawProgress.value * totalLength,
  }));

  if (!trail) {
    return (
      <View style={styles.notFound}>
        <Text style={typography.heading}>Hike details unavailable</Text>
        <Button label="Done" variant="secondary" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Animated.View style={[StyleSheet.absoluteFill, gradientStyle]}>
        <LinearGradient colors={sunrise} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + spacing.xl, paddingBottom: spacing.xl },
        ]}
      >
        <Text style={styles.eyebrow}>Hike complete</Text>
        <Text style={[typography.display, styles.title]}>{trail.name}</Text>

        <View style={[styles.routeCard, { width: cardWidth, height: ROUTE_CARD_HEIGHT }]}>
          <Svg width={cardWidth} height={ROUTE_CARD_HEIGHT}>
            <AnimatedPath
              d={d}
              stroke={colors.surface}
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={totalLength}
              animatedProps={pathAnimatedProps}
            />
          </Svg>
        </View>

        <View style={styles.statGrid}>
          <Stat value={durationMs} format={formatDuration} label="Time out" />
          <Stat
            value={trail.distanceM / 1000}
            format={(n) => `${n.toFixed(1)} km`}
            label="Distance"
          />
          <Stat
            value={Number(partySize) || 1}
            format={(n) => `${Math.round(n)}`}
            label="In your party"
          />
          <Stat value={waterMl} format={(n) => `${Math.round(n)} ml`} label="Water logged" />
        </View>

        <Text style={styles.closing}>
          You were out for {formatDuration(durationMs)}. Everyone got home.
        </Text>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Button label="Done" onPress={() => router.back()} />
      </View>
    </View>
  );
}

function Stat({
  value,
  format,
  label,
}: {
  value: number;
  format: (n: number) => string;
  label: string;
}) {
  return (
    <Card style={styles.statCard}>
      <CountUp value={value} format={format} style={styles.statValue} />
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primaryDark },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  container: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  eyebrow: {
    ...typography.caption,
    color: hexWithAlpha(colors.surface, 0.8),
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: { color: colors.surface },
  routeCard: { alignSelf: 'center' },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statCard: {
    flexBasis: '47%',
    flexGrow: 1,
    gap: 2,
    backgroundColor: hexWithAlpha(colors.surface, 0.16),
    borderWidth: 1,
    borderColor: hexWithAlpha(colors.surface, 0.3),
    shadowOpacity: 0,
    elevation: 0,
  },
  statValue: { ...typography.title, color: colors.surface },
  statLabel: { ...typography.caption, color: hexWithAlpha(colors.surface, 0.8) },
  closing: {
    ...typography.heading,
    color: colors.surface,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
});
