import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '../../src/components/ui/Button';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { useAppState } from '../../src/state/AppState';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';

export default function Signup() {
  const { login } = useAppState();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = () => {
    login();
    router.replace('/(app)');
  };

  return (
    <ScreenContainer style={styles.container}>
      <Text style={typography.title}>Create your account</Text>
      <Text style={styles.subtitle}>Takes a minute. No spam, just trails.</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Name"
          placeholderTextColor={colors.muted}
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.muted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <Button label="Create account" onPress={submit} />

      <Link href="/(auth)/login" style={styles.link}>
        <Text style={styles.linkText}>Already have an account? Log in</Text>
      </Link>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center', gap: spacing.sm },
  subtitle: { ...typography.body, color: colors.muted, marginBottom: spacing.lg },
  form: { gap: spacing.sm, marginBottom: spacing.lg },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  link: { alignSelf: 'center', marginTop: spacing.lg },
  linkText: { ...typography.caption, color: colors.primary },
});
