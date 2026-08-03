import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { groups } from '../data/groups';
import { trails } from '../data/trails';
import { currentUser } from '../data/user';
import { useAppState } from '../state/AppState';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

export function DashboardScreen() {
  const { activeGroupId, savedTrailIds } = useAppState();
  const activeGroup = groups.find((g) => g.id === activeGroupId);
  const activeTrail = activeGroup ? trails.find((t) => t.id === activeGroup.trailId) : undefined;
  const lastSaved = trails.find((t) => t.id === savedTrailIds[savedTrailIds.length - 1]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={typography.title}>Hi {currentUser.displayName}</Text>
      <Text style={styles.subtitle}>Here&apos;s where things stand.</Text>

      {activeGroup && activeTrail ? (
        <Card style={styles.card}>
          <SectionHeader title="On the trail" subtitle={activeGroup.name} />
          <Text style={typography.heading}>{activeTrail.name}</Text>
          <Text style={styles.meta}>
            {activeGroup.members.length} people on this hike · {activeTrail.region}
          </Text>
        </Card>
      ) : null}

      <Card style={styles.card}>
        <SectionHeader title="Party" subtitle="Everyone's checked in" />
        <View style={styles.row}>
          {(activeGroup?.members ?? []).map((m) => (
            <Text key={m.uid} style={styles.member}>
              {m.displayName} · {Math.round(m.batteryLevel * 100)}%
            </Text>
          ))}
        </View>
      </Card>

      <Card style={styles.card}>
        <SectionHeader title="Water" subtitle="Stay ahead of it, not behind it" />
        <Text style={typography.heading}>
          1.2 L / {(currentUser.hydrationGoalMl / 1000).toFixed(1)} L
        </Text>
      </Card>

      {lastSaved ? (
        <Card style={styles.card}>
          <SectionHeader title="Recently saved" subtitle={lastSaved.name} />
          <Text style={styles.meta}>{lastSaved.region}</Text>
        </Card>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: spacing.xl, gap: spacing.md },
  subtitle: { ...typography.body, color: colors.muted, marginBottom: spacing.sm },
  card: { gap: spacing.xs },
  meta: { ...typography.caption, color: colors.muted },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  member: { ...typography.body, color: colors.text },
});
