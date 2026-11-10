import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../src/components/ui/Button';
import { Field } from '../../src/components/ui/Field';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { authMessage } from '../../src/lib/auth';
import { useAppState } from '../../src/state/AppState';
import { colors } from '../../src/theme/colors';
import { radius, spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';

export default function Signup() {
  const { signUp } = useAppState();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!name.trim() || !email.trim() || password.length < 6) {
      setError('Fill in your name, email, and a password of at least 6 characters.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await signUp(name, email.trim(), password);
    } catch (err) {
      setError(authMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.mark}>
            <Ionicons name="triangle" size={26} color={colors.primary} />
          </View>

          <View style={styles.head}>
            <Text style={typography.display}>Create account</Text>
            <Text style={styles.sub}>Takes a minute. No spam, just trails.</Text>
          </View>

          <View style={styles.form}>
            <Field
              label="Name"
              icon="person-outline"
              placeholder="Your name"
              autoComplete="name"
              onChangeText={setName}
            />
            <Field
              label="Email"
              icon="mail-outline"
              placeholder="you@example.com"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="username"
              keyboardType="email-address"
              onChangeText={setEmail}
            />
            <Field
              label="Password"
              icon="lock-closed-outline"
              placeholder="At least 6 characters"
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              onChangeText={setPassword}
            />
          </View>

          {error ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          ) : null}

          <Button label="Create account" onPress={submit} loading={submitting} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Link href="/(auth)/login">
              <Text style={styles.link}>Log in</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.xl,
  },
  mark: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  head: { gap: spacing.xs },
  sub: { ...typography.body, color: colors.muted },
  form: { gap: spacing.md },
  error: { ...typography.caption, color: colors.danger },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xs, alignItems: 'center' },
  footerText: { ...typography.caption, color: colors.muted },
  link: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    paddingVertical: spacing.ms,
  },
});
