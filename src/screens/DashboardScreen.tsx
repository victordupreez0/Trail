import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '../components/Avatar';
import { CountUp } from '../components/CountUp';
import { HydrationBottle } from '../components/HydrationBottle';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Skeleton } from '../components/ui/Skeleton';
import { trails } from '../data/trails';
import { fillRatio, todayKey, waterToday } from '../lib/hydration';
import { initialsOf, lastSeenLabel, memberColor } from '../lib/party';
import { useAppState } from '../state/AppState';
import { colors, shadow } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

// Alerts and "last seen" copy are only as fresh as the last render; on an otherwise
// idle dashboard nothing re-renders on its own, so this re-evaluates them every 30s
// (same landmine P2's GroupsScreen has, at a slower cadence since it's less urgent here).
const TICK_MS = 30_000;
const STALE_CHECKIN_MIN = 5;
const LOW_BATTERY = 0.15;
const HYDRATION_BEHIND_HOURS = 2;
const HYDRATION_BEHIND_PCT = 0.4;

type Alert = { key: string; severity: 'danger' | 'warning'; text: string };

export function DashboardScreen() {
  const {
    user,
    activeGroup,
    groupLoading,
    partyPositions,
    savedTrailIds,
    savedTrailMeta,
    userDoc,
  } = useAppState();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const activeTrail = activeGroup ? trails.find((t) => t.id === activeGroup.trailId) : undefined;
  const saved = trails.filter((t) => savedTrailIds.includes(t.id));

  const firstName = (user?.displayName || 'Hiker').split(' ')[0];
  const initials = initialsOf(firstName);
  const goalMl = userDoc?.hydrationGoalMl ?? 2000;
  const hydrationPct = fillRatio(
    waterToday(userDoc?.waterMl ?? 0, userDoc?.waterDate ?? null, todayKey()),
    goalMl,
  );

  // Trail saves and hike starts are the two event types with a real timestamp in the
  // schema. There's no per-member join time stored anywhere, so "member joined" from
  // the brief's example is left out rather than faked.
  const events: {
    key: string;
    icon: keyof typeof Ionicons.glyphMap;
    text: string;
    atMs: number;
  }[] = [];
  for (const id of savedTrailIds) {
    const savedAt = savedTrailMeta[id]?.savedAt;
    const t = trails.find((tr) => tr.id === id);
    if (savedAt && t) {
      events.push({
        key: `save-${id}`,
        icon: 'bookmark',
        text: `Saved ${t.name}`,
        atMs: savedAt.toMillis(),
      });
    }
  }
  if (activeGroup?.startedAt) {
    events.push({
      key: `start-${activeGroup.id}`,
      icon: 'flag',
      text: `Started ${activeTrail?.name ?? 'a hike'}`,
      atMs: activeGroup.startedAt.toMillis(),
    });
  }
  const recentEvents = events.sort((a, b) => b.atMs - a.atMs).slice(0, 3);

  const alerts: Alert[] = [];
  if (activeGroup && user) {
    for (const [uid, pos] of Object.entries(partyPositions)) {
      if (uid === user.uid) continue;
      const updatedAtMs = pos.updatedAt ? pos.updatedAt.toMillis() : null;
      const ageMin = updatedAtMs !== null ? (now - updatedAtMs) / 60_000 : 0;
      if (ageMin > STALE_CHECKIN_MIN) {
        alerts.push({
          key: `stale-${uid}`,
          severity: 'warning',
          text: `${pos.displayName} hasn't checked in for ${Math.round(ageMin)} minutes`,
        });
      }
      if (pos.batteryLevel < LOW_BATTERY) {
        alerts.push({
          key: `battery-${uid}`,
          severity: 'danger',
          text: `${pos.displayName}'s battery is at ${Math.round(pos.batteryLevel * 100)}%`,
        });
      }
    }
    if (activeGroup.startedAt) {
      const hoursIn = (now - activeGroup.startedAt.toMillis()) / 3_600_000;
      if (hoursIn >= HYDRATION_BEHIND_HOURS && hydrationPct < HYDRATION_BEHIND_PCT) {
        alerts.push({ key: 'hydration', severity: 'warning', text: "You're behind on water" });
      }
    }
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
      <View style={styles.greetingRow}>
        <View style={styles.greeting}>
          <Text style={styles.eyebrow}>Good morning</Text>
          <Text style={typography.display}>{firstName}</Text>
        </View>
        <Avatar initials={initials} color={colors.primary} size={46} />
      </View>

      {groupLoading ? (
        <Skeleton style={styles.hero} />
      ) : activeTrail && activeGroup ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open ${activeTrail.name}`}
          onPress={() => router.push(`/trail/${activeTrail.id}`)}
        >
          <View style={styles.hero}>
            <Image source={activeTrail.photo} style={StyleSheet.absoluteFill} resizeMode="cover" />
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
                {activeGroup.memberIds.length} in your party ·{' '}
                {(activeTrail.distanceM / 1000).toFixed(1)} km
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

      {alerts.length > 0 ? (
        <View style={styles.alerts}>
          {alerts.map((a) => (
            <View
              key={a.key}
              style={[
                styles.alert,
                a.severity === 'danger' ? styles.alertDanger : styles.alertWarning,
              ]}
            >
              <Ionicons
                name={a.severity === 'danger' ? 'battery-dead-outline' : 'time-outline'}
                size={16}
                color={a.severity === 'danger' ? colors.danger : colors.accent}
              />
              <Text
                style={[
                  styles.alertText,
                  { color: a.severity === 'danger' ? colors.danger : colors.accent },
                ]}
              >
                {a.text}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.statRow}>
        <Card style={styles.statCard}>
          <View style={styles.statHead}>
            <Ionicons name="people-outline" size={17} color={colors.primary} />
            <Text style={styles.statLabel}>Party</Text>
          </View>
          {groupLoading ? (
            <Skeleton style={styles.statSkeleton} />
          ) : (
            <CountUp value={activeGroup?.memberIds.length ?? 0} style={typography.title} />
          )}
          <Text style={styles.statFoot}>with you today</Text>
        </Card>

        <Card style={styles.statCard}>
          <View style={styles.statHead}>
            <Ionicons name="walk-outline" size={17} color={colors.primary} />
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          {groupLoading ? (
            <Skeleton style={styles.statSkeleton} />
          ) : (
            <CountUp
              value={activeTrail ? activeTrail.distanceM / 1000 : 0}
              format={(n) => n.toFixed(1)}
              style={typography.title}
            />
          )}
          <Text style={styles.statFoot}>km today</Text>
        </Card>
      </View>

      <View style={styles.bottleRow}>
        <HydrationBottle />
      </View>

      {activeGroup ? (
        <View>
          <SectionHeader title="Your party" subtitle="Live from the trail" />
          <Card style={styles.partyCard}>
            {activeGroup.memberIds.map((uid, i) => {
              const pos = partyPositions[uid];
              const name = pos?.displayName || 'Member';
              const staleLabel = pos?.updatedAt
                ? lastSeenLabel(pos.updatedAt.toMillis(), now)
                : null;
              return (
                <View key={uid}>
                  <View style={styles.partyRow}>
                    <Avatar initials={initialsOf(name)} color={memberColor(uid)} size={40} />
                    <View style={styles.partyText}>
                      <Text style={typography.label}>{name}</Text>
                      <Text style={styles.partyMeta}>
                        {!pos
                          ? 'Getting a fix...'
                          : (staleLabel ??
                            (pos.moving ? 'Moving · just now' : 'Stopped · just now'))}
                      </Text>
                    </View>
                    {pos ? (
                      <View style={styles.battery}>
                        <Ionicons
                          name={
                            pos.batteryLevel > 0.3 ? 'battery-half-outline' : 'battery-dead-outline'
                          }
                          size={15}
                          color={pos.batteryLevel > 0.3 ? colors.muted : colors.danger}
                        />
                        <Text style={styles.partyMeta}>{Math.round(pos.batteryLevel * 100)}%</Text>
                      </View>
                    ) : null}
                  </View>
                  {i < activeGroup.memberIds.length - 1 ? <View style={styles.divider} /> : null}
                </View>
              );
            })}
          </Card>
        </View>
      ) : null}

      {recentEvents.length > 0 ? (
        <View>
          <SectionHeader title="Recent activity" />
          <Card style={styles.partyCard}>
            {recentEvents.map((e, i) => (
              <View key={e.key}>
                <View style={styles.eventRow}>
                  <Ionicons name={e.icon} size={16} color={colors.primary} />
                  <Text style={styles.eventText}>{e.text}</Text>
                </View>
                {i < recentEvents.length - 1 ? <View style={styles.divider} /> : null}
              </View>
            ))}
          </Card>
        </View>
      ) : null}

      <View style={styles.statRowSecondary}>
        <Card style={styles.savedCard}>
          <Ionicons name="bookmark-outline" size={17} color={colors.primary} />
          <CountUp value={saved.length} style={typography.title} />
          <Text style={styles.statFoot}>trails waiting for you</Text>
        </Card>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Safety tips before you head out"
        style={styles.safetyLink}
        onPress={() => router.push('/safety')}
      >
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
  alerts: { gap: spacing.xs },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm + 2,
    borderRadius: radius.md,
  },
  alertDanger: { backgroundColor: colors.dangerSoft },
  alertWarning: { backgroundColor: colors.accentSoft },
  alertText: { ...typography.caption, flex: 1 },
  statRow: { flexDirection: 'row', gap: spacing.sm },
  statRowSecondary: { flexDirection: 'row', gap: spacing.md },
  statCard: { flex: 1, gap: 5 },
  savedCard: { flex: 1, alignItems: 'flex-start', gap: 3 },
  statHead: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statLabel: { ...typography.caption, color: colors.muted },
  statFoot: { ...typography.caption, color: colors.muted },
  statSkeleton: { width: 40, height: 26, marginVertical: 3 },
  bottleRow: { alignItems: 'center' },
  partyCard: { gap: spacing.sm },
  partyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  partyText: { flex: 1, gap: 1 },
  partyMeta: { ...typography.caption, color: colors.muted },
  battery: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  eventText: { ...typography.label, flex: 1 },
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
