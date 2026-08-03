import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '../../src/components/ui/Button';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { useAppState } from '../../src/state/AppState';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';

export default function Login() {
  const { login } = useAppState();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = () => {
    login();
    router.replace('/(app)');
  };

  return (
    <ScreenContainer style={styles.container}>
      <Text style={typography.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Log in to see your trails and your party.</Text>

      <View style={styles.form}>
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

      <Button label="Log in" onPress={submit} />

      <Link href="/(auth)/signup" style={styles.link}>
        <Text style={styles.linkText}>New here? Create an account</Text>
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
