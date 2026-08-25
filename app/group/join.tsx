import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../src/components/ui/Button';
import { Field } from '../../src/components/ui/Field';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { useAppState } from '../../src/state/AppState';
import { colors } from '../../src/theme/colors';
import { radius, spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';

export default function JoinGroup() {
  const { joinByCode } = useAppState();
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const join = async () => {
    if (!code.trim()) {
      setError('Enter an invite code.');
      return;
    }
    setError(null);
    setJoining(true);
    try {
      await joinByCode(code.trim());
      router.replace('/(app)?tab=groups');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join that hike.');
      setJoining(false);
    }
  };

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.header}>
        <Text style={typography.title}>Join a group</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={() => router.back()}
          hitSlop={10}
        >
          <Ionicons name="close" size={24} color={colors.muted} />
        </Pressable>
      </View>

      <View style={styles.iconCircle}>
        <Ionicons name="enter-outline" size={30} color={colors.primary} />
      </View>

      <Text style={styles.sub}>
        Enter the invite code your hiking party shared with you, and you&apos;ll appear on their
        map.
      </Text>

      <Field
        label="Invite code"
        icon="key-outline"
        placeholder="TRAIL-42"
        autoCapitalize="characters"
        autoCorrect={false}
        value={code}
        onChangeText={setCode}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.spacer} />
      <Button label="Join group" icon="enter-outline" onPress={join} loading={joining} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: spacing.md,
  },
  sub: { ...typography.body, color: colors.muted, textAlign: 'center' },
  error: { ...typography.caption, color: colors.danger, textAlign: 'center' },
  spacer: { flex: 1 },
});
