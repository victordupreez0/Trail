import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

import { Avatar } from '../components/Avatar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { SectionHeader } from '../components/ui/SectionHeader';
import { groups } from '../data/groups';
import { trails } from '../data/trails';
import { useAppState } from '../state/AppState';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

export function GroupsScreen() {
  const { activeGroupId } = useAppState();
  const group = groups.find((g) => g.id === activeGroupId);
  const trail = group ? trails.find((t) => t.id === group.trailId) : undefined;

  if (!group || !trail) {
    return (
      <View style={styles.emptyContainer}>
        <EmptyState title="No active group" body="Create one or join with an invite code." />
        <View style={styles.actions}>
          <Button label="Create group" onPress={() => router.push('/group/create')} />
          <Button
            label="Join group"
            variant="secondary"
            onPress={() => router.push('/group/join')}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: trail.location.latitude,
          longitude: trail.location.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        <Polyline coordinates={trail.path} strokeColor={colors.primary} strokeWidth={4} />
        {group.members.map((m) => (
          <Marker key={m.uid} coordinate={m.position} title={m.displayName}>
            <Avatar initials={m.initials} color={m.color} size={32} />
          </Marker>
        ))}
      </MapView>

      <Card style={styles.summary}>
        <SectionHeader title={group.name} subtitle={trail.name} />
        <Text style={styles.meta}>
          {group.members.length} on the trail · code {group.inviteCode}
        </Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, marginHorizontal: -spacing.lg },
  map: { flex: 1 },
  summary: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.md,
    gap: 4,
  },
  meta: { color: colors.muted },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  actions: { gap: spacing.sm },
});
