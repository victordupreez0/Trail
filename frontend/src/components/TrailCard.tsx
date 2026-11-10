import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleSheet, Text, View } from 'react-native';

import type { Trail } from '../data/trails';
import { colors, scrims, shadow } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Chip } from './ui/Chip';

export function TrailCard({ trail, height = 200 }: { trail: Trail; height?: number }) {
  return (
    <View style={[styles.card, { height }]}>
      <Image
        source={trail.photo}
        style={styles.photo}
        resizeMode="cover"
        resizeMethod="resize"
        fadeDuration={0}
      />
      <LinearGradient
        colors={scrims.card}
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
            <Ionicons name="location-outline" size={13} color={colors.onPhoto} />
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
  photo: StyleSheet.absoluteFill,
  content: { flex: 1, justifyContent: 'flex-end', padding: spacing.md, gap: spacing.xs },
  name: { ...typography.title, color: colors.surface },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flex: 1 },
  metaText: { ...typography.caption, color: colors.onPhoto, flex: 1 },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  stat: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  statText: { ...typography.label, color: colors.surface },
});
