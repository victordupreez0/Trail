import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';

import { Avatar } from '../components/Avatar';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { trails } from '../data/trails';
import { useLiveLocation } from '../hooks/useLiveLocation';
import { initialsOf, lastSeenLabel, memberColor } from '../lib/party';
import { useAppState } from '../state/AppState';
import { colors, shadow } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

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
  const mapRef = useRef<MapView>(null);

  const status = useLiveLocation(
    activeGroup?.id ?? null,
    user?.uid ?? null,
    user?.displayName || 'Hiker',
  );

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), STALE_CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  if (groupLoading) return null;

  const trail = activeGroup ? trails.find((t) => t.id === activeGroup.trailId) : undefined;

  if (!activeGroup || !trail) {
    return (
      <View style={styles.emptyContainer}>
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
    try {
      await endHike();
    } catch (err) {
      setEndError(err instanceof Error ? err.message : 'Could not end the hike.');
    } finally {
      setEnding(false);
    }
  };

  return (
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
              .map((m) => (
                <Marker
                  key={m.uid}
                  coordinate={m.pos!.position}
                  title={m.name}
                  description={`Battery ${Math.round(m.pos!.batteryLevel * 100)}%`}
                  tracksViewChanges={false}
                >
                  <View style={[styles.pin, m.stale && styles.pinStale]}>
                    <Avatar initials={m.initials} color={m.color} size={34} />
                  </View>
                </Marker>
              ))}
          </MapView>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Recentre map on the trail"
            style={styles.recentre}
            onPress={() => mapRef.current?.animateToRegion(region, 500)}
          >
            <Ionicons name="locate" size={20} color={colors.text} />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.sheet}>
        <View style={styles.grabber} />
        <View style={styles.sheetHeader}>
          <View style={styles.sheetTitle}>
            <Text style={typography.heading} numberOfLines={1}>
              {activeGroup.name}
            </Text>
            <Text style={styles.sub} numberOfLines={1}>
              {trail.name} · code {activeGroup.inviteCode}
            </Text>
          </View>
          {status === 'tracking' ? (
            <View style={styles.live}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          ) : null}
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, marginHorizontal: -spacing.lg },
  mapWrap: { backgroundColor: colors.surfaceAlt },
  pin: { borderWidth: 3, borderColor: colors.surface, borderRadius: radius.pill, ...shadow.card },
  pinStale: { opacity: 0.45 },
  recentre: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  sheet: {
    flex: 1,
    marginTop: -radius.xl,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.md,
    // Pushes the button to the bottom of whatever space is left, so it can
    // never be clipped by the tab bar.
    justifyContent: 'space-between',
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.xs,
  },
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
  emptyActions: { gap: spacing.sm },
});
