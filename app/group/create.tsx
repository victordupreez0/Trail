import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../src/components/ui/Button';
import { Field } from '../../src/components/ui/Field';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { trails } from '../../src/data/trails';
import { useAppState } from '../../src/state/AppState';
import { colors } from '../../src/theme/colors';
import { radius, spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';

export default function CreateGroup() {
  const { createGroup } = useAppState();
  // "Start hike" on a trail's own screen arrives here with that trail preselected.
  const { trailId: preselectedTrailId } = useLocalSearchParams<{ trailId?: string }>();
  const [name, setName] = useState('');
  const [trailId, setTrailId] = useState(preselectedTrailId ?? trails[0].id);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    if (!name.trim()) {
      setError('Give your group a name.');
      return;
    }
    setError(null);
    setCreating(true);
    try {
      await createGroup(name.trim(), trailId);
      router.replace('/(app)?tab=groups');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the hike.');
      setCreating(false);
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
