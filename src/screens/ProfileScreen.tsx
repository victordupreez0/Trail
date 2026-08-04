import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '../components/Avatar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { trails } from '../data/trails';
import { currentUser } from '../data/user';
import { useAppState } from '../state/AppState';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

export function ProfileScreen() {
  const { logout, savedTrailIds } = useAppState();
  const saved = trails.filter((t) => savedTrailIds.includes(t.id));
  const totalKm = saved.reduce((sum, t) => sum + t.distanceM, 0) / 1000;

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
      <View style={styles.head}>
        <Avatar initials={currentUser.initials} color={colors.primary} size={78} />
        <Text style={typography.title}>{currentUser.displayName}</Text>
        <Text style={styles.email}>{currentUser.email}</Text>
      </View>

      <View style={styles.statRow}>
        <Card style={styles.statCard}>
          <Text style={typography.title}>{saved.length}</Text>
          <Text style={styles.statLabel}>Saved</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={typography.title}>{totalKm.toFixed(0)}</Text>
          <Text style={styles.statLabel}>km planned</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={typography.title}>{(currentUser.hydrationGoalMl / 1000).toFixed(1)}</Text>
          <Text style={styles.statLabel}>L goal</Text>
        </Card>
      </View>

      <Card style={styles.menu}>
        <Row
          icon="water-outline"
          label="Hydration goal"
          value={`${(currentUser.hydrationGoalMl / 1000).toFixed(1)} L / day`}
        />
        <View style={styles.divider} />
        <Row icon="notifications-outline" label="Rest reminders" value="Every 45 min" />
        <View style={styles.divider} />
        <Row
          icon="shield-checkmark-outline"
          label="Safety"
          value="Tips & sharing"
          onPress={() => router.push('/safety')}
        />
      </Card>

      <Button label="Log out" variant="secondary" icon="log-out-outline" onPress={handleLogout} />
    </ScrollView>
  );
}

function Row({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && onPress ? styles.rowPressed : null]}
    >
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={colors.primaryDark} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
      {onPress ? <Ionicons name="chevron-forward" size={16} color={colors.muted} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: spacing.md, paddingBottom: spacing.xl, gap: spacing.lg },
  head: { alignItems: 'center', gap: spacing.xs },
  email: { ...typography.caption, color: colors.muted },
  statRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: spacing.md },
  statLabel: { ...typography.caption, color: colors.muted },
  menu: { padding: 0, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  rowPressed: { backgroundColor: colors.surfaceAlt },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { ...typography.label, flex: 1 },
  rowValue: { ...typography.caption, color: colors.muted },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 62 },
});
