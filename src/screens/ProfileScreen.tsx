import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { Avatar } from '../components/Avatar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { currentUser } from '../data/user';
import { useAppState } from '../state/AppState';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

export function ProfileScreen() {
  const { logout } = useAppState();

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Avatar initials={currentUser.initials} color={colors.primary} size={64} />
      <Text style={typography.title}>{currentUser.displayName}</Text>
      <Text style={styles.email}>{currentUser.email}</Text>

      <Card style={styles.card}>
        <SectionHeader title="Hydration goal" />
        <Text style={typography.heading}>
          {(currentUser.hydrationGoalMl / 1000).toFixed(1)} L / day
        </Text>
      </Card>

      <Card style={styles.card}>
        <SectionHeader title="Safety" subtitle="Tips, emergency contacts, sharing" />
        <Button
          label="View safety info"
          variant="secondary"
          onPress={() => router.push('/safety')}
        />
      </Card>

      <Button label="Log out" variant="secondary" onPress={handleLogout} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  email: { ...typography.caption, color: colors.muted, marginBottom: spacing.md },
  card: { width: '100%', gap: spacing.xs, marginBottom: spacing.sm },
});
