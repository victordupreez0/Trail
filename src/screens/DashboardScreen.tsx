import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '../components/Avatar';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { groups } from '../data/groups';
import { trails } from '../data/trails';
import { currentUser } from '../data/user';
import { useAppState } from '../state/AppState';
import { colors, shadow } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

const HYDRATION_ML = 1200;

export function DashboardScreen() {
  const { activeGroupId, savedTrailIds } = useAppState();
  const group = groups.find((g) => g.id === activeGroupId);
  const activeTrail = group ? trails.find((t) => t.id === group.trailId) : undefined;
  const saved = trails.filter((t) => savedTrailIds.includes(t.id));

  const hydrationPct = Math.min(1, HYDRATION_ML / currentUser.hydrationGoalMl);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
      <View style={styles.greetingRow}>
        <View style={styles.greeting}>
          <Text style={styles.eyebrow}>Good morning</Text>
          <Text style={typography.display}>{currentUser.displayName}</Text>
        </View>
        <Avatar initials={currentUser.initials} color={colors.primary} size={46} />
      </View>

      {activeTrail && group ? (
        <Pressable onPress={() => router.push(`/trail/${activeTrail.id}`)}>
          <View style={styles.hero}>
            <Image source={{ uri: activeTrail.photoUrl }} style={StyleSheet.absoluteFill} />
            <LinearGradient
              colors={['rgba(15,26,21,0.15)', 'rgba(15,26,21,0.85)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroContent}>
              <View style={styles.liveTag}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>On the trail</Text>
              </View>
              <Text style={styles.heroTitle}>{activeTrail.name}</Text>
              <Text style={styles.heroMeta}>
                {group.members.length} in your party · {(activeTrail.distanceM / 1000).toFixed(1)}{' '}
                km
              </Text>
            </View>
          </View>
        </Pressable>
      ) : (
        <Card style={styles.restCard}>
          <Ionicons name="leaf-outline" size={26} color={colors.primary} />
          <Text style={typography.heading}>No hike today</Text>
          <Text style={styles.restBody}>Rest is part of it. Start one when you&apos;re ready.</Text>
        </Card>
      )}

      <View style={styles.statRow}>
        <Card style={styles.statCard}>
          <View style={styles.statHead}>
            <Ionicons name="water-outline" size={17} color={colors.accent} />
            <Text style={styles.statLabel}>Water</Text>
          </View>
          <Text style={typography.title}>{(HYDRATION_ML / 1000).toFixed(1)} L</Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${hydrationPct * 100}%` }]} />
          </View>
          <Text style={styles.statFoot}>
            of {(currentUser.hydrationGoalMl / 1000).toFixed(1)} L goal
          </Text>
        </Card>

        <Card style={styles.statCard}>
          <View style={styles.statHead}>
            <Ionicons name="bookmark-outline" size={17} color={colors.primary} />
            <Text style={styles.statLabel}>Saved</Text>
          </View>
          <Text style={typography.title}>{saved.length}</Text>
          <Text style={styles.statFoot}>trails waiting for you</Text>
        </Card>
      </View>

      {group ? (
        <View>
          <SectionHeader title="Your party" subtitle="Everyone checked in" />
          <Card style={styles.partyCard}>
            {group.members.map((m, i) => (
              <View key={m.uid}>
                <View style={styles.partyRow}>
                  <Avatar initials={m.initials} color={m.color} size={40} />
                  <View style={styles.partyText}>
                    <Text style={typography.label}>{m.displayName}</Text>
                    <Text style={styles.partyMeta}>Moving · updated just now</Text>
                  </View>
                  <View style={styles.battery}>
                    <Ionicons
                      name={m.batteryLevel > 0.3 ? 'battery-half-outline' : 'battery-dead-outline'}
                      size={15}
                      color={m.batteryLevel > 0.3 ? colors.muted : colors.danger}
                    />
                    <Text style={styles.partyMeta}>{Math.round(m.batteryLevel * 100)}%</Text>
                  </View>
                </View>
                {i < group.members.length - 1 ? <View style={styles.divider} /> : null}
              </View>
            ))}
          </Card>
        </View>
      ) : null}

      <Pressable style={styles.safetyLink} onPress={() => router.push('/safety')}>
        <Ionicons name="shield-checkmark-outline" size={19} color={colors.primaryDark} />
        <Text style={styles.safetyText}>Safety tips before you head out</Text>
        <Ionicons name="chevron-forward" size={17} color={colors.muted} />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: spacing.sm, paddingBottom: spacing.xl, gap: spacing.lg },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  greeting: { flex: 1, gap: 2 },
  eyebrow: {
    ...typography.caption,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  hero: {
    height: 210,
    borderRadius: radius.xl,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: colors.surfaceAlt,
    ...shadow.card,
  },
  heroContent: { padding: spacing.md, gap: 5 },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#7BE0A6' },
  liveText: { ...typography.caption, color: colors.surface },
  heroTitle: { ...typography.title, color: colors.surface },
  heroMeta: { ...typography.caption, color: 'rgba(255,255,255,0.88)' },
  restCard: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.lg },
  restBody: { ...typography.body, color: colors.muted, textAlign: 'center' },
  statRow: { flexDirection: 'row', gap: spacing.md },
  statCard: { flex: 1, gap: 5 },
  statHead: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statLabel: { ...typography.caption, color: colors.muted },
  statFoot: { ...typography.caption, color: colors.muted },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
    marginTop: 2,
  },
  fill: { height: '100%', borderRadius: 3, backgroundColor: colors.accent },
  partyCard: { gap: spacing.sm },
  partyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  partyText: { flex: 1, gap: 1 },
  partyMeta: { ...typography.caption, color: colors.muted },
  battery: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  safetyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  safetyText: { ...typography.label, color: colors.primaryDark, flex: 1 },
});
