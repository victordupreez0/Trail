import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import MapView, { Polyline, type Region } from 'react-native-maps';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AnimatedMarker } from '../components/AnimatedMarker';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { GlassSurface } from '../components/ui/GlassSurface';
import { Skeleton } from '../components/ui/Skeleton';
import { trails } from '../data/trails';
import { useLiveLocation } from '../hooks/useLiveLocation';
import { useMotion } from '../hooks/useMotion';
import { useTabBarInset } from '../hooks/useTabBarInset';
import { haptics } from '../lib/haptics';
import {
  breadcrumbSegments,
  hexWithAlpha,
  initialsOf,
  lastSeenLabel,
  memberColor,
} from '../lib/party';
import { useAppState } from '../state/AppState';
import { colors, shadow } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type Coordinate = { latitude: number; longitude: number };

// A breadcrumb window per member, kept client-side only (not persisted). 12
// positions at the ~5-10s cadence positions actually arrive at is a couple of
// minutes of trail, which is plenty to read as "recently came from over there"
// without the map turning into a scribble.
const BREADCRUMB_LENGTH = 12;

// Re-evaluated on a slow tick rather than only on new snapshots, otherwise a member
// who stops sending updates never gets picked up as stale on an otherwise-idle screen.
const STALE_CHECK_INTERVAL_MS = 15_000;

export function GroupsScreen() {
  const { user, activeGroup, partyPositions, groupLoading, endHike } = useAppState();
  // react-native-maps renders blank when its parent sizes it via flex inside a
  // pager, so it needs concrete pixel dimensions. Those come from measuring this
  // screen rather than the window: the window includes the status bar and the
  // tab bar, so sizing off it overflows and pushes the button out of view.
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [now, setNow] = useState(() => Date.now());
  const [ending, setEnding] = useState(false);
  const [endError, setEndError] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Record<string, Coordinate[]>>({});
  const mapRef = useRef<MapView>(null);
  const { reduced } = useMotion();
  const tabBarInset = useTabBarInset();

  const status = useLiveLocation(
    activeGroup?.id ?? null,
    user?.uid ?? null,
    user?.displayName || 'Hiker',
  );

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), STALE_CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  // Firestore only ever gives us the latest position per member, so a trail behind
  // them has to be accumulated client-side; not persisted, lost on remount, which is
  // fine for a "where they've recently been" cue rather than a real track log.
  useEffect(() => {
    setBreadcrumbs((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const [uid, pos] of Object.entries(partyPositions)) {
        const list = next[uid] ?? [];
        const last = list[list.length - 1];
        if (
          !last ||
          last.latitude !== pos.position.latitude ||
          last.longitude !== pos.position.longitude
        ) {
          next[uid] = [...list, pos.position].slice(-BREADCRUMB_LENGTH);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [partyPositions]);

  if (groupLoading) {
    return (
      <View style={[styles.emptyContainer, { paddingBottom: tabBarInset }]}>
        <Skeleton style={styles.loadingSkeleton} />
      </View>
    );
  }

  const trail = activeGroup ? trails.find((t) => t.id === activeGroup.trailId) : undefined;

  if (!activeGroup || !trail) {
    return (
      <View style={[styles.emptyContainer, { paddingBottom: tabBarInset }]}>
        <EmptyState
          title="No active hike"
          body="Start a group to share your live location with your party."
          icon="people-outline"
        />
        <View style={styles.emptyActions}>
          <Button label="Create a group" icon="add" onPress={() => router.push('/group/create')} />
          <Button
            label="Join with a code"
            icon="enter-outline"
            variant="secondary"
            onPress={() => router.push('/group/join')}
          />
        </View>
      </View>
    );
  }

  const region: Region = {
    latitude: trail.location.latitude,
    longitude: trail.location.longitude,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  };

  // Half the measured space keeps the sheet below it fully on screen, button included.
  const mapHeight = Math.round(box.height * 0.5);
  const isOwner = user?.uid === activeGroup.ownerId;

  const members = activeGroup.memberIds.map((uid) => {
    const pos = partyPositions[uid];
    const name = pos?.displayName || 'Member';
    const updatedAtMs = pos?.updatedAt ? pos.updatedAt.toMillis() : null;
    const staleLabel = pos ? lastSeenLabel(updatedAtMs, now) : null;
    return {
      uid,
      name,
      color: memberColor(uid),
      initials: initialsOf(name),
      pos,
      stale: staleLabel !== null,
      meta: !pos ? 'Getting a fix…' : (staleLabel ?? `${Math.round(pos.batteryLevel * 100)}%`),
    };
  });

  const endTheHike = async () => {
    setEndError(null);
    setEnding(true);
    // Read before awaiting: subscribeToActiveGroupForUser clears activeGroup to null
    // almost as soon as endHike's write lands, so these would be gone after.
    const trailId = activeGroup.trailId;
    const startedAtMs = activeGroup.startedAt?.toMillis() ?? Date.now();
    const partySize = activeGroup.memberIds.length;
    try {
      await endHike();
      haptics.success();
      router.push(
        `/hike/summary?trailId=${trailId}&startedAtMs=${startedAtMs}&partySize=${partySize}`,
      );
    } catch (err) {
      setEndError(err instanceof Error ? err.message : 'Could not end the hike.');
    } finally {
      setEnding(false);
    }
  };

  return (
    // Reserves the floating tab bar's space here, above the measured box, instead of
    // inside it - box/onLayout/mapHeight below are deliberately untouched, so this is
    // the only place left to restore the pre-tab-bar available height exactly.
    <View style={{ flex: 1, paddingBottom: tabBarInset }}>
      <View
        style={styles.container}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setBox((prev) =>
            prev.width === width && prev.height === height ? prev : { width, height },
          );
        }}
      >
        {box.height > 0 ? (
          <View style={[styles.mapWrap, { width: box.width, height: mapHeight }]}>
            <MapView
              ref={mapRef}
              style={{ width: box.width, height: mapHeight }}
              initialRegion={region}
              showsPointsOfInterest={false}
              showsCompass={false}
              toolbarEnabled={false}
            >
              <Polyline
                coordinates={trail.path}
                strokeColor={colors.primary}
                strokeWidth={5}
                lineCap="round"
              />
              {members
                .filter((m) => m.pos)
                .flatMap((m) =>
                  breadcrumbSegments(breadcrumbs[m.uid] ?? [], 3).map((segment, i, all) => (
                    <Polyline
                      key={`${m.uid}-crumb-${i}`}
                      coordinates={segment}
                      strokeColor={hexWithAlpha(
                        m.color,
                        0.15 + (i / Math.max(1, all.length - 1)) * 0.45,
                      )}
                      strokeWidth={3}
                      lineCap="round"
                    />
                  )),
                )}
              {members
                .filter((m) => m.pos)
                .map((m) => (
                  <AnimatedMarker
                    key={m.uid}
                    coordinate={m.pos!.position}
                    title={m.name}
                    description={`Battery ${Math.round(m.pos!.batteryLevel * 100)}%`}
                  >
                    <View style={[styles.pin, m.stale && styles.pinStale]}>
                      <Avatar initials={m.initials} color={m.color} size={34} />
                    </View>
                  </AnimatedMarker>
                ))}
            </MapView>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Recentre map on the trail"
              style={styles.recentreWrap}
              onPress={() => mapRef.current?.animateToRegion(region, 500)}
            >
              <GlassSurface style={styles.recentre}>
                <Ionicons name="locate" size={20} color={colors.text} />
              </GlassSurface>
            </Pressable>
          </View>
        ) : null}

        {/* Only overlaps the map by radius.xl (the negative marginTop below), so the
          blur reads as a frosted lip along the top edge rather than the whole sheet -
          the sheet itself sits over the screen background beneath that. Swap to
          solid if this stutters against a moving map on a mid-range device; see
          BUILD-PLAN.md's S2 performance note. */}
        <GlassSurface style={styles.sheet}>
          <CompassPull mapRef={mapRef} region={region} reduced={reduced} />
          <View style={styles.sheetHeader}>
            <View style={styles.sheetTitle}>
              <Text style={typography.heading} numberOfLines={1}>
                {activeGroup.name}
              </Text>
              <Text style={styles.sub} numberOfLines={1}>
                {trail.name} · code {activeGroup.inviteCode}
              </Text>
            </View>
            {status === 'tracking' ? <LivePill reduced={reduced} /> : null}
          </View>

          {status === 'denied' ? (
            <View style={styles.permissionBanner}>
              <Ionicons name="location-outline" size={17} color={colors.accent} />
              <Text style={styles.permissionText}>
                Location access is off, so your party can&apos;t see you.
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open location settings"
                onPress={() => Linking.openSettings()}
                hitSlop={8}
              >
                <Text style={styles.permissionAction}>Settings</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.members}>
            {members.map((m) => (
              <View key={m.uid} style={[styles.member, m.stale && styles.memberStale]}>
                <Avatar initials={m.initials} color={m.color} size={38} />
                <Text style={styles.memberName} numberOfLines={1}>
                  {m.name}
                </Text>
                <Text style={styles.memberMeta} numberOfLines={1}>
                  {m.meta}
                </Text>
              </View>
            ))}
          </View>

          {endError ? <Text style={styles.error}>{endError}</Text> : null}

          {isOwner ? (
            <Button
              label="End hike"
              variant="secondary"
              icon="stop-circle-outline"
              loading={ending}
              onPress={endTheHike}
            />
          ) : null}
        </GlassSurface>
      </View>
    </View>
  );
}

const PULL_THRESHOLD = 50;
const PULL_MAX = 90;

// Positions are already live via Firestore's onSnapshot, so there's nothing to
// refetch - "pull to refresh" here is a gesture-first shortcut to the same recentre
// the button above already does, not a spinner over a network call. Lives on the
// grabber rather than the map itself: a pan gesture on the MapView would fight its
// own native pan/drag handling, and the grabber is already a "pull" affordance with
// nothing else claiming it today.
function CompassPull({
  mapRef,
  region,
  reduced,
}: {
  mapRef: RefObject<MapView | null>;
  region: Region;
  reduced: boolean;
}) {
  const pull = useSharedValue(0);

  const recentre = () => {
    haptics.medium();
    mapRef.current?.animateToRegion(region, 500);
  };

  const pan = Gesture.Pan()
    .activeOffsetY(8)
    .onUpdate((e) => {
      pull.value = Math.max(0, Math.min(PULL_MAX, e.translationY));
    })
    .onEnd(() => {
      if (pull.value >= PULL_THRESHOLD) runOnJS(recentre)();
      // "Settles north": always returns to 0, animated unless reduced motion asks
      // for an instant jump instead.
      pull.value = reduced ? 0 : withSpring(0, { damping: 14, stiffness: 140 });
    });

  const needleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pull.value, [0, PULL_THRESHOLD], [0, 1], 'clamp'),
    transform: [
      { translateY: pull.value * 0.5 },
      { rotate: `${interpolate(pull.value, [0, PULL_MAX], [0, 200], 'clamp')}deg` },
    ],
  }));

  return (
    <GestureDetector gesture={pan}>
      <View
        accessible
        accessibilityLabel="Pull down on the handle to recentre the map"
        style={styles.grabberArea}
      >
        <View style={styles.grabber} />
        <Animated.View style={[styles.compassNeedle, needleStyle]} pointerEvents="none">
          <Ionicons name="navigate" size={16} color={colors.primary} />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

// A slow breathing pulse rather than a static dot, so "Live" reads as an ongoing
// connection rather than a fixed label. Timed at a comfortable resting-breath 2s,
// not literally synced to the 30s write heartbeat (that would look broken for 28
// seconds out of every 30).
function LivePill({ reduced }: { reduced: boolean }) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (reduced) {
      pulse.value = 1;
      return;
    }
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [reduced, pulse]);

  const dotStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <View style={styles.live}>
      <Animated.View style={[styles.liveDot, dotStyle]} />
      <Text style={styles.liveText}>Live</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, marginHorizontal: -spacing.lg },
  mapWrap: { backgroundColor: colors.surfaceAlt },
  pin: { borderWidth: 3, borderColor: colors.surface, borderRadius: radius.pill, ...shadow.card },
  pinStale: { opacity: 0.45 },
  recentreWrap: { position: 'absolute', top: spacing.md, right: spacing.md },
  recentre: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  sheet: {
    flex: 1,
    marginTop: -radius.xl,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.md,
    // Pushes the button to the bottom of whatever space is left. The tab bar is
    // absolutely positioned (see app/(app)/index.tsx) so it no longer reserves flex
    // space of its own; useTabBarInset's paddingBottom above is what keeps this
    // clear of it instead.
    justifyContent: 'space-between',
  },
  // Taller than the visible 4px pill, so the pan gesture's touch target clears the
  // 44pt accessibility minimum tap targets get everywhere else in the app.
  grabberArea: { minHeight: 44, justifyContent: 'center', marginBottom: spacing.xs },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  compassNeedle: { position: 'absolute', alignSelf: 'center', top: '100%' },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sheetTitle: { flex: 1, gap: 2 },
  sub: { ...typography.caption, color: colors.muted },
  live: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary },
  liveText: { ...typography.caption, color: colors.primaryDark },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accentSoft,
    padding: spacing.sm + 2,
    borderRadius: radius.md,
  },
  permissionText: { ...typography.caption, color: colors.text, flex: 1 },
  permissionAction: { ...typography.caption, color: colors.accent, fontWeight: '700' },
  members: { flexDirection: 'row', gap: spacing.md },
  member: { alignItems: 'center', gap: 4, width: 64 },
  memberStale: { opacity: 0.45 },
  memberName: { ...typography.caption, color: colors.text },
  memberMeta: { ...typography.caption, color: colors.muted, fontSize: 11 },
  error: { ...typography.caption, color: colors.danger },
  emptyContainer: { flex: 1, justifyContent: 'center', gap: spacing.lg },
  loadingSkeleton: { height: 240, borderRadius: radius.xl },
  emptyActions: { gap: spacing.sm },
});
