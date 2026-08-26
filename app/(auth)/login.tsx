import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button } from '../../src/components/ui/Button';
import { Field } from '../../src/components/ui/Field';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { authMessage, resetPassword } from '../../src/lib/auth';
import { useAppState } from '../../src/state/AppState';
import { colors } from '../../src/theme/colors';
import { radius, spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';

export default function Login() {
  const { signIn } = useAppState();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resetState, setResetState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [resetError, setResetError] = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim() || password.length < 6) {
      setError('Enter your email and a password of at least 6 characters.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/(app)');
    } catch (err) {
      setError(authMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const forgotPassword = async () => {
    if (!email.trim()) {
      setResetError('Enter your email above first.');
      return;
    }
    setResetError(null);
    setResetState('sending');
    try {
      await resetPassword(email.trim());
      setResetState('sent');
    } catch (err) {
      setResetState('idle');
      setResetError(authMessage(err));
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
            <Text style={typography.display}>Welcome back</Text>
            <Text style={styles.sub}>Your trails and your party are waiting.</Text>
          </View>

          <View style={styles.form}>
            <Field
              label="Email"
              icon="mail-outline"
              placeholder="you@example.com"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <Field
              label="Password"
              icon="lock-closed-outline"
              placeholder="••••••••"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send a password reset email"
              style={styles.forgot}
              hitSlop={8}
              onPress={forgotPassword}
              disabled={resetState === 'sending'}
            >
              <Text style={styles.forgotText}>
                {resetState === 'sending'
                  ? 'Sending...'
                  : resetState === 'sent'
                    ? 'Reset link sent'
                    : 'Forgot password?'}
              </Text>
            </Pressable>
            {resetError ? <Text style={styles.error}>{resetError}</Text> : null}
            {resetState === 'sent' ? (
              <Text style={styles.resetSent}>
                Check {email.trim()} for a link to reset your password.
              </Text>
            ) : null}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button label="Log in" onPress={submit} loading={submitting} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>New here?</Text>
            <Link href="/(auth)/signup">
              <Text style={styles.link}>Create an account</Text>
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
  head: { gap: 4 },
  sub: { ...typography.body, color: colors.muted },
  form: { gap: spacing.md },
  error: { ...typography.caption, color: colors.danger },
  forgot: { alignSelf: 'flex-end' },
  forgotText: { ...typography.caption, color: colors.primary },
  resetSent: { ...typography.caption, color: colors.muted, textAlign: 'right' },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 5, alignItems: 'center' },
  footerText: { ...typography.caption, color: colors.muted },
  link: { ...typography.caption, color: colors.primary, fontWeight: '700' },
});
