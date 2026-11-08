import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AlertStrip } from '../components/AlertStrip';
import { Avatar } from '../components/Avatar';
import { CountUp } from '../components/CountUp';
import { HydrationBottle } from '../components/HydrationBottle';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Skeleton } from '../components/ui/Skeleton';
import { useTabBarInset } from '../hooks/useTabBarInset';
import { fillRatio, todayKey, waterToday } from '../lib/hydration';
import {
  displayNameOf,
  initialsOf,
  lastSeenLabel,
  memberColor,
  PARTY_TICK_MS,
  partyAlerts,
  type PartyAlert,
} from '../lib/party';
import { useAppState, usePartyPositions } from '../state/AppState';
import { colors, scrims, shadow } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

const HYDRATION_BEHIND_HOURS = 2;
const HYDRATION_BEHIND_PCT = 0.4;

function greeting(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardScreen() {
  const { user, activeGroup, groupLoading, savedTrailIds, userDoc, trails, remindersBlocked } =
    useAppState();
  const partyPositions = usePartyPositions();
  const tabBarInset = useTabBarInset();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), PARTY_TICK_MS);
    return () => clearInterval(id);
  }, []);

  const activeTrail = activeGroup ? trails.find((t) => t.id === activeGroup.trailId) : undefined;
  const saved = trails.filter((t) => savedTrailIds.includes(t.id));

  const firstName = displayNameOf(user).split(' ')[0];
  const initials = initialsOf(firstName);
  const goalMl = userDoc?.hydrationGoalMl ?? 2000;
  const todayWaterMl = waterToday(userDoc?.waterMl ?? 0, userDoc?.waterDate ?? null, todayKey());
  const hydrationPct = fillRatio(todayWaterMl, goalMl);

  const alerts: PartyAlert[] = [];
  if (activeGroup && user) {
    alerts.push(...partyAlerts(partyPositions, user.uid, now));
    if (remindersBlocked) {
      alerts.push({
        key: 'reminders-blocked',
        severity: 'warning',
        text: "Notifications are off, so water reminders won't arrive",
      });
    }
    if (activeGroup.startedAt) {
      const hoursIn = (now - activeGroup.startedAt.toMillis()) / 3_600_000;
      if (hoursIn >= HYDRATION_BEHIND_HOURS && hydrationPct < HYDRATION_BEHIND_PCT) {
        alerts.push({ key: 'hydration', severity: 'warning', text: "You're behind on water" });
      }
    }
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.container, { paddingBottom: spacing.xl + tabBarInset }]}
    >
      <View style={styles.greetingRow}>
        <View style={styles.greeting}>
          <Text style={styles.eyebrow}>{greeting(new Date(now).getHours())}</Text>
          <Text style={typography.display}>{firstName}</Text>
        </View>
        <Avatar
          initials={initials}
          color={colors.primary}
          size={46}
          photoURL={userDoc?.photoURL ?? user?.photoURL}
        />
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
            <LinearGradient colors={scrims.hero} style={StyleSheet.absoluteFill} />
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
          <Text style={typography.heading}>{activeGroup ? 'On a hike' : 'No hike today'}</Text>
          <Text style={styles.restBody}>
            {activeGroup
              ? 'Your party is on the Party tab.'
              : 'Rest is part of it. Start one when you’re ready.'}
          </Text>
        </Card>
      )}

      <AlertStrip alerts={alerts} />

      {activeGroup ? (
        <View style={styles.statRow}>
          <Card style={styles.statCard}>
            <View style={styles.statHead}>
              <Ionicons name="people-outline" size={17} color={colors.primary} />
              <Text style={styles.statLabel}>Party</Text>
            </View>
            {groupLoading ? (
              <Skeleton style={styles.statSkeleton} />
            ) : (
              <CountUp value={activeGroup.memberIds.length} style={typography.title} />
            )}
            <Text style={styles.statFoot}>with you today</Text>
          </Card>

          <Card style={styles.statCard}>
            <View style={styles.statHead}>
              <Ionicons name="walk-outline" size={17} color={colors.primary} />
              <Text style={styles.statLabel}>Trail</Text>
            </View>
            <CountUp
              value={activeTrail ? activeTrail.distanceM / 1000 : 0}
              format={(n) => n.toFixed(1)}
              style={typography.title}
            />
            <Text style={styles.statFoot}>km long</Text>
          </Card>
        </View>
      ) : (
        <View style={styles.statRow}>
          <Card style={styles.statCard}>
            <View style={styles.statHead}>
              <Ionicons name="bookmark-outline" size={17} color={colors.primary} />
              <Text style={styles.statLabel}>Saved</Text>
            </View>
            <CountUp value={saved.length} style={typography.title} />
            <Text style={styles.statFoot}>trails waiting for you</Text>
          </Card>

          <Card style={styles.statCard}>
            <View style={styles.statHead}>
              <Ionicons name="compass-outline" size={17} color={colors.primary} />
              <Text style={styles.statLabel}>Next up</Text>
            </View>
            <Text style={typography.title} numberOfLines={1}>
              {saved[0]?.name ?? 'Find a trail'}
            </Text>
            <Text style={styles.statFoot}>
              {saved[0] ? 'from your saved list' : 'to plan your next hike'}
            </Text>
          </Card>
        </View>
      )}

      {activeGroup ? (
        <View style={styles.bottleRow}>
          <HydrationBottle />
        </View>
      ) : null}

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
                          ? 'Finding location…'
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
  greeting: { flex: 1, gap: spacing.xxs },
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
  heroContent: { padding: spacing.md, gap: spacing.xs },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: colors.glassOnPhoto,
    paddingHorizontal: spacing.ms,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.liveOnPhoto },
  liveText: { ...typography.caption, color: colors.surface },
  heroTitle: { ...typography.title, color: colors.surface },
  heroMeta: { ...typography.caption, color: colors.onPhoto },
  restCard: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.lg },
  restBody: { ...typography.body, color: colors.muted, textAlign: 'center' },
  statRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: { flex: 1, gap: spacing.xs },
  statHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  statLabel: { ...typography.caption, color: colors.muted },
  statFoot: { ...typography.caption, color: colors.muted },
  statSkeleton: { width: 40, height: 26, marginVertical: spacing.xxs },
  bottleRow: { alignItems: 'center' },
  partyCard: { gap: spacing.sm },
  partyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  partyText: { flex: 1, gap: spacing.xxs },
  partyMeta: { ...typography.caption, color: colors.muted },
  battery: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
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
