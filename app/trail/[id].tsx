import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';

import { Button } from '../../src/components/ui/Button';
import { Chip } from '../../src/components/ui/Chip';
import { trails } from '../../src/data/trails';
import { useAppState } from '../../src/state/AppState';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';

export default function TrailDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const trail = trails.find((t) => t.id === id);
  const { isSaved, toggleSaved } = useAppState();

  if (!trail) {
    return (
      <View style={styles.notFound}>
        <Text style={typography.heading}>Trail not found</Text>
      </View>
    );
  }

  const saved = isSaved(trail.id);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View>
        <Image source={{ uri: trail.photoUrl }} style={styles.photo} resizeMode="cover" />
        <Pressable style={styles.back} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <Text style={typography.title}>{trail.name}</Text>
        <Text style={styles.region}>{trail.region}</Text>

        <View style={styles.metaRow}>
          <Chip label={trail.difficulty} tone={trail.difficulty} />
          <Text style={styles.stat}>{(trail.distanceM / 1000).toFixed(1)} km</Text>
          <Text style={styles.stat}>{trail.elevationGainM} m gain</Text>
        </View>

        <Text style={styles.description}>{trail.description}</Text>

        <MapView
          style={styles.map}
          scrollEnabled={false}
          zoomEnabled={false}
          initialRegion={{
            latitude: trail.location.latitude,
            longitude: trail.location.longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          }}
        >
          <Polyline coordinates={trail.path} strokeColor={colors.primary} strokeWidth={4} />
        </MapView>

        <View style={styles.actions}>
          <Button
            label={saved ? 'Saved' : 'Save trail'}
            variant={saved ? 'secondary' : 'primary'}
            onPress={() => toggleSaved(trail.id)}
          />
          <Button label="Start hike" variant="secondary" onPress={() => router.push('/(app)')} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: spacing.xl },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  photo: { width: '100%', height: 260, backgroundColor: colors.border },
  back: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xs,
  },
  body: { padding: spacing.lg, gap: spacing.sm },
  region: { ...typography.caption, color: colors.muted },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  stat: { ...typography.caption, color: colors.muted },
  description: { ...typography.body, marginTop: spacing.sm },
  map: { height: 180, borderRadius: 16, marginTop: spacing.md, overflow: 'hidden' },
  actions: { gap: spacing.sm, marginTop: spacing.lg },
});
