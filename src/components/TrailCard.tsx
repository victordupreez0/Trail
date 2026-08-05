import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleSheet, Text, View } from 'react-native';

import type { Trail } from '../data/trails';
import { colors, shadow } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Chip } from './ui/Chip';

export function TrailCard({ trail, height = 200 }: { trail: Trail; height?: number }) {
  return (
    <View style={[styles.card, { height }]}>
      <Image source={{ uri: trail.photoUrl }} style={styles.photo} resizeMode="cover" />
      {/* Photos vary wildly in brightness, so the scrim guarantees the title stays readable. */}
      <LinearGradient
        colors={['transparent', 'rgba(15,26,21,0.25)', 'rgba(15,26,21,0.88)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        <Chip label={trail.difficulty} tone={trail.difficulty} />
        <Text style={styles.name} numberOfLines={1}>
          {trail.name}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.meta}>
            <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.85)" />
            <Text style={styles.metaText} numberOfLines={1}>
              {trail.region}
            </Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <Stat icon="walk-outline" value={`${(trail.distanceM / 1000).toFixed(1)} km`} />
          <Stat icon="trending-up-outline" value={`${trail.elevationGainM} m`} />
        </View>
      </View>
    </View>
  );
}

function Stat({ icon, value }: { icon: keyof typeof Ionicons.glyphMap; value: string }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={14} color={colors.surface} />
      <Text style={styles.statText}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    ...shadow.card,
  },
  photo: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  content: { flex: 1, justifyContent: 'flex-end', padding: spacing.md, gap: 4 },
  name: { ...typography.title, color: colors.surface },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  metaText: { ...typography.caption, color: 'rgba(255,255,255,0.85)', flex: 1 },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statText: { ...typography.label, color: colors.surface },
});
