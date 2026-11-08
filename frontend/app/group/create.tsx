import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  FlatList,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button } from '../../src/components/ui/Button';
import { Field } from '../../src/components/ui/Field';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { haptics } from '../../src/lib/haptics';
import {
  distanceToTrailhead,
  formatDistance,
  TRAILHEAD_RADIUS_METERS,
  withTimeout,
} from '../../src/lib/trailhead';
import { useAppState } from '../../src/state/AppState';
import { colors } from '../../src/theme/colors';
import { radius, spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';

const LOCATION_TIMEOUT_MS = 6000;

export default function CreateGroup() {
  const { createGroup, showPartyTab, trails } = useAppState();
  // "Start hike" on a trail's own screen arrives here with that trail preselected.
  const { trailId: preselectedTrailId } = useLocalSearchParams<{ trailId?: string }>();
  const [name, setName] = useState('');
  const [trailId, setTrailId] = useState(preselectedTrailId ?? trails[0].id);
  // The preselected trail goes first, so it's visible without scrolling the list.
  const [orderedTrails] = useState(() =>
    [...trails].sort(
      (a, b) => Number(b.id === preselectedTrailId) - Number(a.id === preselectedTrailId),
    ),
  );
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGroupNow = async () => {
    setCreating(true);
    try {
      await createGroup(name.trim(), trailId);
      haptics.medium();
      showPartyTab();
      // Back to the one running app, rather than stacking a second copy on top.
      router.dismissAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start the hike.");
      setCreating(false);
    }
  };

  const openDirections = async (latitude: number, longitude: number) => {
    const destination = `${latitude},${longitude}`;
    const url =
      Platform.OS === 'ios'
        ? `https://maps.apple.com/?daddr=${destination}&dirflg=d`
        : `https://www.google.com/maps/dir/?api=1&destination=${destination}`;

    try {
      await Linking.openURL(url);
    } catch {
      setError("Couldn't open your maps app.");
    }
  };

  const showTrailheadPrompt = (
    title: string,
    latitude: number,
    longitude: number,
    message: string,
  ) => {
    setCreating(false);
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: Platform.OS === 'ios' ? 'Apple Maps' : 'Google Maps',
        onPress: () => void openDirections(latitude, longitude),
      },
      { text: 'Start anyway', onPress: () => void createGroupNow() },
    ]);
  };

  const create = async () => {
    if (!name.trim()) {
      setError('Give your hike a name.');
      return;
    }

    const trail = trails.find((item) => item.id === trailId);
    if (!trail) {
      setError('Pick a trail first.');
      return;
    }

    setError(null);
    setCreating(true);
    const trailhead = trail.path[0] ?? trail.location;

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        showTrailheadPrompt(
          'Location check unavailable',
          trailhead.latitude,
          trailhead.longitude,
          `Trail can't confirm whether you're at ${trail.name}. Open directions or start anyway.`,
        );
        return;
      }

      const position =
        (await withTimeout(
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          LOCATION_TIMEOUT_MS,
        )) ?? (await Location.getLastKnownPositionAsync());
      if (!position) throw new Error('No location available');
      const distance = distanceToTrailhead(position.coords, trailhead);
      const accuracy = position.coords.accuracy ?? 0;

      if (distance > TRAILHEAD_RADIUS_METERS + accuracy) {
        showTrailheadPrompt(
          `You're not at ${trail.name} yet`,
          trailhead.latitude,
          trailhead.longitude,
          `You're about ${formatDistance(distance)} from the trailhead. Open directions or start anyway.`,
        );
        return;
      }

      await createGroupNow();
    } catch {
      showTrailheadPrompt(
        'Location check unavailable',
        trailhead.latitude,
        trailhead.longitude,
        `Trail couldn't confirm whether you're at ${trail.name}. Open directions or start anyway.`,
      );
    }
  };

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.header}>
        <Text style={typography.title}>New hike</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={() => router.back()}
          hitSlop={10}
        >
          <Ionicons name="close" size={24} color={colors.muted} />
        </Pressable>
      </View>

      <Field
        label="Hike name"
        icon="people-outline"
        placeholder="Sunrise crew"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Pick a trail</Text>
      <FlatList
        data={orderedTrails}
        keyExtractor={(t) => t.id}
        showsVerticalScrollIndicator={false}
        style={styles.list}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        renderItem={({ item }) => {
          const active = item.id === trailId;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => setTrailId(item.id)}
            >
              <View style={[styles.radio, active && styles.radioActive]}>
                {active ? <Ionicons name="checkmark" size={13} color={colors.surface} /> : null}
              </View>
              <View style={styles.rowText}>
                <Text style={typography.label} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {(item.distanceM / 1000).toFixed(1)} km · {item.difficulty}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />

      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}

      <Button label="Start hike" icon="play" onPress={create} loading={creating} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { ...typography.caption, color: colors.muted },
  error: { ...typography.caption, color: colors.danger },
  list: { flex: 1, marginHorizontal: -spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.ms,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  rowPressed: { backgroundColor: colors.surfaceAlt },
  rowText: { flex: 1, gap: spacing.xxs },
  rowMeta: { ...typography.caption, color: colors.muted, textTransform: 'capitalize' },
  radio: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 38 },
});
