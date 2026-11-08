import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '../src/components/ui/Card';
import { ScreenContainer } from '../src/components/ui/ScreenContainer';
import { colors } from '../src/theme/colors';
import { radius, spacing } from '../src/theme/spacing';
import { typography } from '../src/theme/typography';

const RESCUE_NUMBER = '086 110 6417';

const sections = [
  {
    icon: 'bag-check-outline',
    title: 'Before you go',
    tips: [
      'Tell someone your route and when you expect to be back.',
      'Check the forecast. Mountain weather turns fast.',
      'Carry more water than you think you need.',
    ],
  },
  {
    icon: 'footsteps-outline',
    title: 'On the trail',
    tips: [
      'Stick to marked paths, especially near cliffs.',
      'Keep your party within sight of each other.',
      'Turn back if conditions or energy turn. The summit will wait.',
    ],
  },
  {
    icon: 'eye-outline',
    title: 'Your location',
    tips: [
      'Your live position is only visible to people in your group.',
      'Sharing stops as soon as the hike ends.',
      'Trail only tracks you while the app is open.',
    ],
  },
] as const;

export default function Safety() {
  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.back}
          onPress={() => router.back()}
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>

        <View style={styles.head}>
          <Text style={typography.display}>Safety</Text>
          <Text style={styles.sub}>Calm advice, only where it matters.</Text>
        </View>

        {sections.map((section) => (
          <Card key={section.title} style={styles.card}>
            <View style={styles.cardHead}>
              <View style={styles.iconWrap}>
                <Ionicons name={section.icon} size={18} color={colors.primaryDark} />
              </View>
              <Text style={typography.heading}>{section.title}</Text>
            </View>
            {section.tips.map((tip) => (
              <View key={tip} style={styles.tipRow}>
                <View style={styles.bullet} />
                <Text style={styles.tip}>{tip}</Text>
              </View>
            ))}
          </Card>
        ))}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Call mountain rescue on ${RESCUE_NUMBER}`}
          onPress={() => Linking.openURL(`tel:${RESCUE_NUMBER.replace(/\s/g, '')}`)}
          style={({ pressed }) => [styles.emergency, pressed && styles.pressed]}
        >
          <Ionicons name="call-outline" size={19} color={colors.danger} />
          <View style={styles.emergencyText}>
            <Text style={styles.emergencyTitle}>Mountain rescue</Text>
            <Text style={styles.emergencyMeta}>South Africa · {RESCUE_NUMBER}</Text>
          </View>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: spacing.sm, paddingBottom: spacing.xl, gap: spacing.md },
  back: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  head: { gap: spacing.xs, marginBottom: spacing.xs },
  sub: { ...typography.body, color: colors.muted },
  card: { gap: spacing.sm },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 9,
  },
  tip: { ...typography.body, flex: 1, color: colors.text },
  emergency: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerSoft,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  pressed: { opacity: 0.7 },
  emergencyText: { flex: 1, gap: spacing.xxs },
  emergencyTitle: { ...typography.label, color: colors.dangerText },
  emergencyMeta: { ...typography.caption, color: colors.dangerText },
});
