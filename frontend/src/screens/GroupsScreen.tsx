import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import MapView, { Polyline, type Region } from 'react-native-maps';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { AlertStrip } from '../components/AlertStrip';
import { Avatar } from '../components/Avatar';
import { PartyMarker } from '../components/PartyMarker';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { GlassSurface } from '../components/ui/GlassSurface';
import { Skeleton } from '../components/ui/Skeleton';
import { useLiveLocation } from '../hooks/useLiveLocation';
import { useMotion } from '../hooks/useMotion';
import { useTabBarInset } from '../hooks/useTabBarInset';
import { haptics } from '../lib/haptics';
import {
  breadcrumbSegments,
  displayNameOf,
  hexWithAlpha,
  initialsOf,
  insideFrame,
  lastSeenLabel,
  memberColor,
  PARTY_TICK_MS,
  partyAlerts,
  partyFrame,
} from '../lib/party';
import { useAppState, usePartyPositions } from '../state/AppState';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type Coordinate = { latitude: number; longitude: number };

// A breadcrumb window per member, kept client-side only (not persisted). 12
// positions at the ~5-10s cadence positions actually arrive at is a couple of
// minutes of trail, which is plenty to read as "recently came from over there"
// without the map turning into a scribble.
const BREADCRUMB_LENGTH = 12;

export function GroupsScreen() {
  const { user, activeGroup, groupLoading, endHike, trails, syncFailed, retrySync } = useAppState();
  const partyPositions = usePartyPositions();
  // react-native-maps renders blank when its parent sizes it via flex inside a
  // pager, so it needs concrete pixel dimensions. Those come from measuring this
  // screen rather than the window: the window includes the status bar and the
  // tab bar, so sizing off it overflows and pushes the button out of view.
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [now, setNow] = useState(() => Date.now());
  const [ending, setEnding] = useState(false);
  const [endError, setEndError] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Record<string, Coordinate[]>>({});
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<MapView>(null);
  const frameRef = useRef<Region | null>(null);
  // Stops as soon as someone touches the map, so it never moves out from under them.
  const followingRef = useRef(true);
  const previousGroup = useRef(activeGroup);
  const { reduced } = useMotion();
  const tabBarInset = useTabBarInset();

  const { status, retry } = useLiveLocation(
    activeGroup?.id ?? null,
    user?.uid ?? null,
    displayNameOf(user),
  );

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), PARTY_TICK_MS);
    return () => clearInterval(id);
  }, []);

  // Each hike starts clean: none of the last one's trails, framing or map state.
  const activeGroupId = activeGroup?.id ?? null;
  useEffect(() => {
    setBreadcrumbs({});
    setMapReady(false);
    frameRef.current = null;
    followingRef.current = true;
  }, [activeGroupId]);

  // Everyone gets the summary, whoever ended the hike. Signing out also clears the
  // active hike, but by then there's no user, so it doesn't count as the hike ending.
  useEffect(() => {
    const ended = previousGroup.current;
    previousGroup.current = activeGroup;
    if (!ended || activeGroup || !user) return;
    const startedAtMs = ended.startedAt?.toMillis() ?? Date.now();
    router.push(
      `/hike/summary?trailId=${ended.trailId}&startedAtMs=${startedAtMs}&partySize=${ended.memberIds.length}`,
    );
  }, [activeGroup, user]);

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

  // Waits for the map to be ready, because a move requested before then is dropped.
  // Only moves when someone is about to leave the frame, so the map stays still
  // through ordinary walking.
  useEffect(() => {
    if (!mapReady || !followingRef.current) return;
    const coordinates = Object.values(partyPositions).map((p) => p.position);
    if (!coordinates.length) return;
    const current = frameRef.current;
    if (current && coordinates.every((c) => insideFrame(c, current))) return;
    const next = partyFrame(coordinates);
    frameRef.current = next;
    mapRef.current?.animateToRegion(next, reduced ? 0 : 600);
  }, [mapReady, partyPositions, reduced]);

  if (groupLoading) {
    return (
      <View style={[styles.emptyContainer, { paddingBottom: tabBarInset }]}>
        <Skeleton style={styles.loadingSkeleton} />
      </View>
    );
  }

  const trail = activeGroup ? trails.find((t) => t.id === activeGroup.trailId) : undefined;

  if (!activeGroup) {
    return (
      <View style={[styles.emptyContainer, { paddingBottom: tabBarInset }]}>
        {syncFailed ? (
          <EmptyState
            title="Couldn't load your hike"
            body="Check your connection and try again."
            icon="cloud-offline-outline"
            action={{ label: 'Try again', onPress: retrySync }}
          />
        ) : (
          <>
            <EmptyState
              title="No active hike"
              body="Start a group to share your live location with your party."
              icon="people-outline"
            />
            <View style={styles.emptyActions}>
              <Button
                label="Create a group"
                icon="add"
                onPress={() => router.push('/group/create')}
              />
              <Button
                label="Join with a code"
                icon="enter-outline"
                variant="secondary"
                onPress={() => router.push('/group/join')}
              />
            </View>
          </>
        )}
      </View>
    );
  }

  // An admin can delete a trail while it's being hiked. The hike carries on without
  // its route, and can still be ended.
  const center = trail?.location ??
    Object.values(partyPositions)[0]?.position ?? { latitude: -33.9359, longitude: 18.3875 };
  const region: Region = {
    latitude: center.latitude,
    longitude: center.longitude,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  };

  // Half the measured space keeps the sheet below it fully on screen, button included.
  const mapHeight = Math.round(box.height * 0.5);
  const isOwner = user?.uid === activeGroup.ownerId;
  const alerts = user ? partyAlerts(partyPositions, user.uid, now) : [];

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

  const recentre = () => {
    followingRef.current = true;
    const coordinates = Object.values(partyPositions).map((p) => p.position);
    const next = coordinates.length ? partyFrame(coordinates) : region;
    frameRef.current = coordinates.length ? next : null;
    mapRef.current?.animateToRegion(next, reduced ? 0 : 500);
  };

  const shareCode = () => {
    Share.share({
      message: `Join my hike on Trail with this code: ${activeGroup.inviteCode}`,
    }).catch((err) => console.warn('sharing the invite code failed', err));
  };

  const endTheHike = async () => {
    setEndError(null);
    setEnding(true);
    try {
      await endHike();
      haptics.success();
    } catch (err) {
      setEndError(err instanceof Error ? err.message : 'Could not end the hike.');
    } finally {
      setEnding(false);
    }
  };

  const confirmEnd = () => {
    Alert.alert('End this hike?', 'Live sharing stops for everyone in your party.', [
      { text: 'Keep going', style: 'cancel' },
      { text: 'End hike', style: 'destructive', onPress: () => void endTheHike() },
    ]);
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
          <View
            style={[styles.mapWrap, { width: box.width, height: mapHeight }]}
            onTouchStart={() => {
              followingRef.current = false;
            }}
          >
            <MapView
              ref={mapRef}
              style={{ width: box.width, height: mapHeight }}
              initialRegion={region}
              onMapReady={() => setMapReady(true)}
              moveOnMarkerPress={false}
              showsPointsOfInterest={false}
              showsCompass={false}
              toolbarEnabled={false}
            >
              {trail ? (
                <Polyline
                  coordinates={trail.path}
                  strokeColor={colors.primary}
                  strokeWidth={5}
                  lineCap="round"
                />
              ) : null}
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
                  <PartyMarker
                    key={m.uid}
                    coordinate={m.pos!.position}
                    initials={m.initials}
                    color={m.color}
                    stale={m.stale}
                    title={m.name}
                    description={`Battery ${Math.round(m.pos!.batteryLevel * 100)}%`}
                    reduced={reduced}
                  />
                ))}
            </MapView>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Recentre map on your party"
              style={styles.recentreWrap}
              onPress={recentre}
            >
              <GlassSurface style={styles.recentre}>
                <Ionicons name="locate" size={20} color={colors.text} />
              </GlassSurface>
            </Pressable>
          </View>
        ) : null}

        <GlassSurface style={styles.sheet} solid>
          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitle}>
                <Text style={typography.heading} numberOfLines={1}>
                  {activeGroup.name}
                </Text>
                <Text style={styles.sub} numberOfLines={1}>
                  {trail?.name ?? 'Trail no longer listed'}
                </Text>
              </View>
              {status === 'tracking' ? <LivePill reduced={reduced} /> : null}
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Share invite code ${activeGroup.inviteCode.split('').join(' ')}`}
              onPress={shareCode}
              style={({ pressed }) => [styles.codeRow, pressed && styles.memberPressed]}
            >
              <View style={styles.codeCopy}>
                <Text style={styles.sub}>Invite code</Text>
                <Text style={styles.code} selectable>
                  {activeGroup.inviteCode}
                </Text>
              </View>
              <Ionicons name="share-outline" size={20} color={colors.primaryDark} />
              <Text style={styles.shareText}>Share</Text>
            </Pressable>

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

            {status === 'error' ? (
              <View style={styles.permissionBanner}>
                <Ionicons name="location-outline" size={17} color={colors.accent} />
                <Text style={styles.permissionText}>
                  Trail can&apos;t get your location. Check that location is on.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Try getting your location again"
                  onPress={retry}
                  hitSlop={8}
                >
                  <Text style={styles.permissionAction}>Try again</Text>
                </Pressable>
              </View>
            ) : null}

            {syncFailed ? (
              <View style={styles.permissionBanner}>
                <Ionicons name="cloud-offline-outline" size={17} color={colors.accent} />
                <Text style={styles.permissionText}>Live updates have stopped.</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Reconnect live updates"
                  onPress={retrySync}
                  hitSlop={8}
                >
                  <Text style={styles.permissionAction}>Try again</Text>
                </Pressable>
              </View>
            ) : null}

            <AlertStrip alerts={alerts} />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.members}
            >
              {members.map((m) => (
                <Pressable
                  key={m.uid}
                  accessibilityRole="button"
                  accessibilityLabel={
                    m.pos ? `Show ${m.name} on the map` : `${m.name} location unavailable`
                  }
                  disabled={!m.pos}
                  onPress={() => {
                    if (!m.pos) return;
                    followingRef.current = false;
                    mapRef.current?.animateToRegion(
                      {
                        ...m.pos.position,
                        latitudeDelta: 0.005,
                        longitudeDelta: 0.005,
                      },
                      reduced ? 0 : 500,
                    );
                  }}
                  style={({ pressed }) => [
                    styles.member,
                    m.stale && styles.memberStale,
                    pressed && styles.memberPressed,
                  ]}
                >
                  <Avatar initials={m.initials} color={m.color} size={38} />
                  <Text style={styles.memberName} numberOfLines={1}>
                    {m.name}
                  </Text>
                  <Text style={styles.memberMeta} numberOfLines={1}>
                    {m.meta}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {endError ? <Text style={styles.error}>{endError}</Text> : null}
          </ScrollView>

          {isOwner ? (
            <Button
              label="End hike"
              variant="secondary"
              icon="stop-circle-outline"
              loading={ending}
              onPress={confirmEnd}
            />
          ) : null}
        </GlassSurface>
      </View>
    </View>
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
  recentreWrap: { position: 'absolute', top: spacing.md, right: spacing.md },
  recentre: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    flex: 1,
    marginTop: -radius.xl,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  sheetScroll: { flex: 1 },
  sheetContent: { gap: spacing.md, paddingBottom: spacing.sm },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sheetTitle: { flex: 1, gap: 2 },
  sub: { ...typography.caption, color: colors.muted },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 54,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  codeCopy: { flex: 1 },
  code: { ...typography.heading, color: colors.primaryDark, letterSpacing: 2 },
  shareText: { ...typography.label, color: colors.primaryDark },
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
  memberPressed: { opacity: 0.6 },
  memberStale: { opacity: 0.45 },
  memberName: { ...typography.caption, color: colors.text },
  memberMeta: { ...typography.caption, color: colors.muted, fontSize: 11 },
  error: { ...typography.caption, color: colors.danger },
  emptyContainer: { flex: 1, justifyContent: 'center', gap: spacing.lg },
  loadingSkeleton: { height: 240, borderRadius: radius.xl },
  emptyActions: { gap: spacing.sm },
});
