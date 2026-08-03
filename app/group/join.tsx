import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';

import { Button } from '../../src/components/ui/Button';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { useAppState } from '../../src/state/AppState';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';

export default function JoinGroup() {
  const { setActiveGroupId } = useAppState();
  const [code, setCode] = useState('');

  const join = () => {
    // Mock: any code joins the one seeded demo group — real invite-code lookup
    // arrives with Firestore groups.
    setActiveGroupId('group-1');
    router.back();
  };

  return (
    <ScreenContainer style={styles.container}>
      <Text style={typography.title}>Join a group</Text>
      <Text style={styles.subtitle}>Enter the invite code your hiking party shared with you.</Text>

      <TextInput
        style={styles.input}
        placeholder="e.g. TRAIL-42"
        placeholderTextColor={colors.muted}
        autoCapitalize="characters"
        value={code}
        onChangeText={setCode}
      />

      <Button label="Join group" onPress={join} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: spacing.xl, gap: spacing.sm },
  subtitle: { ...typography.body, color: colors.muted, marginBottom: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
  },
});
