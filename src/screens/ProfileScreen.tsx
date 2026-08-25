import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { Avatar } from '../components/Avatar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { trails } from '../data/trails';
import { useTabBarInset } from '../hooks/useTabBarInset';
import { removeAvatar, uploadAvatar } from '../lib/profile';
import { requestPermission } from '../lib/reminders';
import { useAppState } from '../state/AppState';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

const WATER_INTERVAL_OPTIONS = [20, 30, 45, 60];
const REST_INTERVAL_OPTIONS = [60, 90, 120];
// Matches ensureUserDoc's own default (src/lib/userDoc.ts); only used for the
// instant between sign-in and the user doc's first snapshot arriving.
const DEFAULT_HYDRATION_GOAL_ML = 2000;

export function ProfileScreen() {
  const { user, logout, savedTrailIds, userDoc, setReminderSettings } = useAppState();
  const tabBarInset = useTabBarInset();
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [mediaPermissionDenied, setMediaPermissionDenied] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarProgress, setAvatarProgress] = useState(0);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const saved = trails.filter((t) => savedTrailIds.includes(t.id));
  const totalKm = saved.reduce((sum, t) => sum + t.distanceM, 0) / 1000;
  const hydrationGoalMl = userDoc?.hydrationGoalMl ?? DEFAULT_HYDRATION_GOAL_ML;
  const remindersEnabled = userDoc?.remindersEnabled ?? true;
  const waterIntervalMin = userDoc?.waterIntervalMin ?? 30;
  const restIntervalMin = userDoc?.restIntervalMin ?? 90;
  const photoURL = userDoc?.photoURL ?? user?.photoURL ?? null;

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Hiker';
  const initials = displayName.slice(0, 2).toUpperCase();
  const email = user?.email ?? '';

  const handleLogout = () => {
    // No navigation here: app/index.tsx redirects once Firebase's auth state changes.
    logout();
  };

  const pickAndUploadAvatar = async () => {
    if (!user) return;
    setAvatarError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setMediaPermissionDenied(true);
      return;
    }
    setMediaPermissionDenied(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      // The compression step the brief asks for: never push a multi-megabyte
      // camera original.
      quality: 0.6,
    });
    if (result.canceled || !result.assets[0]) return;

    setAvatarUploading(true);
    setAvatarProgress(0);
    try {
      await uploadAvatar(user.uid, result.assets[0].uri, setAvatarProgress);
    } catch {
      setAvatarError("Couldn't upload that photo. Try again.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    setAvatarError(null);
    try {
      await removeAvatar(user.uid);
    } catch {
      setAvatarError("Couldn't remove the photo. Try again.");
    }
  };

  const handleAvatarPress = () => {
    const options: {
      text: string;
      style?: 'default' | 'cancel' | 'destructive';
      onPress?: () => void;
    }[] = [{ text: 'Choose photo', onPress: pickAndUploadAvatar }];
    if (photoURL)
      options.push({ text: 'Remove photo', style: 'destructive', onPress: handleRemoveAvatar });
    options.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('Profile photo', undefined, options);
  };

  const toggleReminders = async (next: boolean) => {
    if (!next) {
      setPermissionDenied(false);
      setReminderSettings({ remindersEnabled: false }).catch((err) =>
        console.warn('setReminderSettings failed', err),
      );
      return;
    }
    const granted = await requestPermission();
    if (!granted) {
      setPermissionDenied(true);
      return;
    }
    setPermissionDenied(false);
    setReminderSettings({ remindersEnabled: true }).catch((err) =>
      console.warn('setReminderSettings failed', err),
    );
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.container, { paddingBottom: spacing.xl + tabBarInset }]}
    >
      <View style={styles.head}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Change profile photo"
          onPress={handleAvatarPress}
          disabled={avatarUploading}
        >
          <Avatar initials={initials} color={colors.primary} size={78} photoURL={photoURL} />
          <View style={styles.avatarBadge}>
            <Ionicons name="camera-outline" size={14} color={colors.surface} />
          </View>
        </Pressable>
        {avatarUploading ? (
          <View style={styles.avatarProgressTrack}>
            <View style={[styles.avatarProgressFill, { width: `${avatarProgress * 100}%` }]} />
          </View>
        ) : null}
        {avatarError ? <Text style={styles.errorText}>{avatarError}</Text> : null}
        {mediaPermissionDenied ? (
          <View style={styles.permissionBanner}>
            <Text style={styles.permissionText}>
              Photo access is off, so Trail can&apos;t set a profile photo.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open photo settings"
              onPress={() => Linking.openSettings()}
              hitSlop={8}
            >
              <Text style={styles.permissionAction}>Settings</Text>
            </Pressable>
          </View>
        ) : null}
        <Text style={typography.title}>{displayName}</Text>
        <Text style={styles.email}>{email}</Text>
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
          <Text style={typography.title}>{(hydrationGoalMl / 1000).toFixed(1)}</Text>
          <Text style={styles.statLabel}>L goal</Text>
        </Card>
      </View>

      <Card style={styles.menu}>
        <Row
          icon="water-outline"
          label="Hydration goal"
          value={`${(hydrationGoalMl / 1000).toFixed(1)} L / day`}
        />
        <View style={styles.divider} />
        <Row
          icon="shield-checkmark-outline"
          label="Safety"
          value="Tips & sharing"
          onPress={() => router.push('/safety')}
        />
      </Card>

      <View>
        <SectionHeader title="Reminders" subtitle="Calm nudges while a hike is active" />
        <Card style={styles.reminders}>
          <View style={styles.reminderToggleRow}>
            <View style={styles.rowIcon}>
              <Ionicons name="notifications-outline" size={18} color={colors.primaryDark} />
            </View>
            <Text style={[styles.rowLabel, { flex: 1 }]}>Hydration and rest reminders</Text>
            <Switch
              accessibilityLabel="Toggle hike reminders"
              value={remindersEnabled}
              onValueChange={toggleReminders}
              trackColor={{ false: colors.border, true: colors.primarySoft }}
              thumbColor={remindersEnabled ? colors.primary : colors.surface}
            />
          </View>

          {permissionDenied ? (
            <View style={styles.permissionBanner}>
              <Text style={styles.permissionText}>
                Notifications are off in system settings, so Trail can&apos;t remind you.
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open notification settings"
                onPress={() => Linking.openSettings()}
                hitSlop={8}
              >
                <Text style={styles.permissionAction}>Settings</Text>
              </Pressable>
            </View>
          ) : null}

          {remindersEnabled ? (
            <>
              <View style={styles.divider} />
              <View style={styles.intervalRow}>
                <Text style={styles.intervalLabel}>Water every</Text>
                <IntervalPicker
                  value={waterIntervalMin}
                  options={WATER_INTERVAL_OPTIONS}
                  onChange={(v) =>
                    setReminderSettings({ waterIntervalMin: v }).catch((err) =>
                      console.warn('setReminderSettings failed', err),
                    )
                  }
                />
              </View>
              <View style={styles.intervalRow}>
                <Text style={styles.intervalLabel}>Rest every</Text>
                <IntervalPicker
                  value={restIntervalMin}
                  options={REST_INTERVAL_OPTIONS}
                  onChange={(v) =>
                    setReminderSettings({ restIntervalMin: v }).catch((err) =>
                      console.warn('setReminderSettings failed', err),
                    )
                  }
                />
              </View>
            </>
          ) : null}
        </Card>
      </View>

      <Button label="Log out" variant="secondary" icon="log-out-outline" onPress={handleLogout} />
    </ScrollView>
  );
}

function IntervalPicker({
  value,
  options,
  onChange,
}: {
  value: number;
  options: number[];
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.pillRow}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <Pressable
            key={opt}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${opt} minutes`}
            onPress={() => onChange(opt)}
            hitSlop={8}
            style={[styles.pill, active && styles.pillActive]}
          >
            <Text style={[styles.pillText, active && styles.pillTextActive]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
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
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarProgressTrack: {
    width: 78,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  avatarProgressFill: { height: '100%', borderRadius: 2, backgroundColor: colors.primary },
  errorText: { ...typography.caption, color: colors.danger },
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
  reminders: { gap: spacing.sm },
  reminderToggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accentSoft,
    padding: spacing.sm + 2,
    borderRadius: radius.md,
  },
  permissionText: { ...typography.caption, color: colors.text, flex: 1 },
  permissionAction: { ...typography.caption, color: colors.accent, fontWeight: '700' },
  intervalRow: { gap: 6 },
  intervalLabel: { ...typography.caption, color: colors.muted },
  pillRow: { flexDirection: 'row', gap: spacing.xs },
  pill: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 44,
    alignItems: 'center',
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { ...typography.caption, color: colors.text },
  pillTextActive: { color: colors.surface, fontWeight: '700' },
});
