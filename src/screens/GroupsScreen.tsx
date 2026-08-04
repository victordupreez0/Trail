import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRef } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';

import { Avatar } from '../components/Avatar';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { groups } from '../data/groups';
import { trails } from '../data/trails';
import { useAppState } from '../state/AppState';
import { colors, shadow } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

export function GroupsScreen() {
  const { activeGroupId, setActiveGroupId } = useAppState();
  // react-native-maps renders blank when its parent sizes it via flex inside a
  // pager — it needs concrete pixel dimensions at mount.
  const { width, height } = useWindowDimensions();
  const mapRef = useRef<MapView>(null);

  const group = groups.find((g) => g.id === activeGroupId);
  const trail = group ? trails.find((t) => t.id === group.trailId) : undefined;

  if (!group || !trail) {
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

  const mapHeight = height * 0.62;

  return (
    <View style={styles.container}>
      <View style={[styles.mapWrap, { width, height: mapHeight }]}>
        <MapView
          ref={mapRef}
          style={{ width, height: mapHeight }}
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
          {group.members.map((m) => (
            <Marker
              key={m.uid}
              coordinate={m.position}
              title={m.displayName}
              description={`Battery ${Math.round(m.batteryLevel * 100)}%`}
              tracksViewChanges={false}
            >
              <View style={styles.pin}>
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

      <View style={styles.sheet}>
        <View style={styles.grabber} />
        <View style={styles.sheetHeader}>
          <View style={styles.sheetTitle}>
            <Text style={typography.heading} numberOfLines={1}>
              {group.name}
            </Text>
            <Text style={styles.sub} numberOfLines={1}>
              {trail.name} · code {group.inviteCode}
            </Text>
          </View>
          <View style={styles.live}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        </View>

        <View style={styles.members}>
          {group.members.map((m) => (
            <View key={m.uid} style={styles.member}>
              <Avatar initials={m.initials} color={m.color} size={38} />
              <Text style={styles.memberName} numberOfLines={1}>
                {m.displayName}
              </Text>
              <Text style={styles.memberMeta}>{Math.round(m.batteryLevel * 100)}%</Text>
            </View>
          ))}
        </View>

        <Button
          label="End hike"
          variant="secondary"
          icon="stop-circle-outline"
          onPress={() => setActiveGroupId(null)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, marginHorizontal: -spacing.lg },
  mapWrap: { backgroundColor: colors.surfaceAlt },
  pin: { borderWidth: 3, borderColor: colors.surface, borderRadius: radius.pill, ...shadow.card },
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
    gap: spacing.md,
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
  members: { flexDirection: 'row', gap: spacing.md },
  member: { alignItems: 'center', gap: 4, width: 64 },
  memberName: { ...typography.caption, color: colors.text },
  memberMeta: { ...typography.caption, color: colors.muted, fontSize: 11 },
  emptyContainer: { flex: 1, justifyContent: 'center', gap: spacing.lg },
  emptyActions: { gap: spacing.sm },
});
