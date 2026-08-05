import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../src/components/ui/Button';
import { Chip } from '../../src/components/ui/Chip';
import { trails } from '../../src/data/trails';
import { useAppState } from '../../src/state/AppState';
import { colors, shadow } from '../../src/theme/colors';
import { radius, spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';

export default function TrailDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const trail = trails.find((t) => t.id === id);
  const { isSaved, toggleSaved, setActiveGroupId } = useAppState();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  if (!trail) {
    return (
      <View style={styles.notFound}>
        <Text style={typography.heading}>Trail not found</Text>
        <Button label="Go back" variant="secondary" onPress={() => router.back()} />
      </View>
    );
  }

  const saved = isSaved(trail.id);

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.heroWrap}>
          <Image source={{ uri: trail.photoUrl }} style={styles.hero} resizeMode="cover" />
          <LinearGradient
            colors={['rgba(15,26,21,0.45)', 'transparent', 'rgba(245,243,237,1)']}
            locations={[0, 0.4, 1]}
            style={StyleSheet.absoluteFill}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={[styles.back, { top: insets.top + spacing.sm }]}
            onPress={() => router.back()}
            hitSlop={10}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.body}>
          <Chip label={trail.difficulty} tone={trail.difficulty} />
          <Text style={typography.display}>{trail.name}</Text>
          <View style={styles.regionRow}>
            <Ionicons name="location-outline" size={15} color={colors.muted} />
            <Text style={styles.region}>{trail.region}</Text>
          </View>

          <View style={styles.statsRow}>
            <Stat
              icon="walk-outline"
              value={`${(trail.distanceM / 1000).toFixed(1)} km`}
              label="Distance"
            />
            <Stat
              icon="trending-up-outline"
              value={`${trail.elevationGainM} m`}
              label="Elevation"
            />
            <Stat
              icon="time-outline"
              value={`${Math.round(trail.distanceM / 3000 + trail.elevationGainM / 400)} h`}
              label="Est. time"
            />
          </View>

          <Text style={styles.description}>{trail.description}</Text>

          <Text style={styles.sectionTitle}>Route</Text>
          <View style={[styles.mapWrap, { width: width - spacing.lg * 2 }]}>
            <MapView
              style={{ width: width - spacing.lg * 2, height: 200 }}
              initialRegion={{
                latitude: trail.location.latitude,
                longitude: trail.location.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
            >
              <Polyline
                coordinates={trail.path}
                strokeColor={colors.primary}
                strokeWidth={5}
                lineCap="round"
              />
              <Marker coordinate={trail.location} title={trail.name} />
            </MapView>
          </View>
        </View>
      </ScrollView>

      {/* Safety-critical and primary actions stay as real buttons, pinned where a
          thumb reaches. The gesture-first constraint doesn't apply here. */}
      <View style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={saved ? 'Remove from saved' : 'Save trail'}
          onPress={() => toggleSaved(trail.id)}
          style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed]}
        >
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={saved ? colors.primary : colors.text}
          />
        </Pressable>
        <View style={styles.startBtn}>
          <Button
            label="Start hike"
            icon="play"
            onPress={() => {
              setActiveGroupId('group-1');
              router.replace('/(app)');
            }}
          />
        </View>
      </View>
    </View>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={17} color={colors.primary} />
      <Text style={typography.heading}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 120 },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  heroWrap: { height: 300, backgroundColor: colors.surfaceAlt },
  hero: { width: '100%', height: '100%' },
  back: {
    position: 'absolute',
    left: spacing.md,
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  body: { paddingHorizontal: spacing.lg, marginTop: -spacing.xl, gap: spacing.sm },
  regionRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  region: { ...typography.caption, color: colors.muted },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    ...shadow.card,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statLabel: { ...typography.caption, color: colors.muted },
  description: { ...typography.body, marginTop: spacing.sm },
  sectionTitle: { ...typography.heading, marginTop: spacing.md },
  mapWrap: {
    height: 200,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  actionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  saveBtn: {
    width: 54,
    height: 54,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  pressed: { opacity: 0.7 },
  startBtn: { flex: 1 },
});
