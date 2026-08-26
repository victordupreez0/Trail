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
} from '../../src/lib/trailhead';
import { useAppState } from '../../src/state/AppState';
import { colors } from '../../src/theme/colors';
import { radius, spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';

export default function CreateGroup() {
  const { createGroup, trails } = useAppState();
  // "Start hike" on a trail's own screen arrives here with that trail preselected.
  const { trailId: preselectedTrailId } = useLocalSearchParams<{ trailId?: string }>();
  const [name, setName] = useState('');
  const [trailId, setTrailId] = useState(preselectedTrailId ?? trails[0].id);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGroupNow = async () => {
    setCreating(true);
    try {
      await createGroup(name.trim(), trailId);
      haptics.medium();
      router.replace('/(app)?tab=groups');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the hike.');
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
      setError('Could not open your maps app.');
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
      setError('Give your group a name.');
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

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
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
        <Text style={typography.title}>New group</Text>
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
        label="Group name"
        icon="people-outline"
        placeholder="Sunrise crew"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Pick a trail</Text>
      <FlatList
        data={trails}
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

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button label="Create group" icon="add" onPress={create} loading={creating} />
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
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  rowPressed: { backgroundColor: colors.surfaceAlt },
  rowText: { flex: 1, gap: 1 },
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
