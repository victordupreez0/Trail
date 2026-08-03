import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '../../src/components/ui/Button';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { trails } from '../../src/data/trails';
import { useAppState } from '../../src/state/AppState';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';

export default function CreateGroup() {
  const { setActiveGroupId } = useAppState();
  const [name, setName] = useState('');
  const [trailId, setTrailId] = useState(trails[0].id);

  const create = () => {
    // No backend yet — this activates the one seeded demo group rather than
    // persisting a new one. Swaps for a real Firestore write once auth/groups land.
    setActiveGroupId('group-1');
    router.back();
  };

  return (
    <ScreenContainer style={styles.container}>
      <Text style={typography.title}>New group</Text>

      <TextInput
        style={styles.input}
        placeholder="Group name"
        placeholderTextColor={colors.muted}
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Trail</Text>
      <FlatList
        data={trails}
        keyExtractor={(t) => t.id}
        style={styles.list}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => setTrailId(item.id)}>
            <View style={[styles.radio, item.id === trailId && styles.radioActive]} />
            <Text style={typography.body}>{item.name}</Text>
          </Pressable>
        )}
      />

      <Button label="Create group" onPress={create} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: spacing.xl, gap: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  label: { ...typography.caption, color: colors.muted, marginTop: spacing.sm },
  list: { flexGrow: 0, marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.border },
  radioActive: { borderColor: colors.primary, backgroundColor: colors.primary },
});
