import { Image, StyleSheet, Text, View } from 'react-native';

import type { Trail } from '../data/trails';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Card } from './ui/Card';
import { Chip } from './ui/Chip';

export function TrailCard({ trail }: { trail: Trail }) {
  return (
    <Card style={styles.card}>
      <Image source={{ uri: trail.photoUrl }} style={styles.photo} resizeMode="cover" />
      <View style={styles.body}>
        <Text style={typography.heading}>{trail.name}</Text>
        <Text style={styles.region}>{trail.region}</Text>
        <View style={styles.metaRow}>
          <Chip label={trail.difficulty} tone={trail.difficulty} />
          <Text style={styles.stat}>{(trail.distanceM / 1000).toFixed(1)} km</Text>
          <Text style={styles.stat}>{trail.elevationGainM} m gain</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 0, overflow: 'hidden' },
  photo: { width: '100%', height: 180, backgroundColor: colors.border },
  body: { padding: spacing.md, gap: 4 },
  region: { ...typography.caption, color: colors.muted },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  stat: { ...typography.caption, color: colors.muted },
});
