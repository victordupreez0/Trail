import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '../src/components/ui/Card';
import { SectionHeader } from '../src/components/ui/SectionHeader';
import { colors } from '../src/theme/colors';
import { spacing } from '../src/theme/spacing';
import { typography } from '../src/theme/typography';

const sections = [
  {
    title: 'Before you go',
    tips: [
      'Tell someone your route and expected return time.',
      'Check the weather — mountain conditions change fast.',
      'Carry more water than you think you need.',
    ],
  },
  {
    title: 'On the trail',
    tips: [
      'Stick to marked paths, especially near cliffs.',
      'Keep your party within sight of each other.',
      'Turn back if conditions or energy turn — the summit can wait.',
    ],
  },
  {
    title: 'Sharing your location',
    tips: [
      'Your live position is only visible to people in your group.',
      'Location sharing stops the moment you end a hike.',
      'A Watcher can follow your party without joining the hike.',
    ],
  },
];

export default function Safety() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable style={styles.back} onPress={() => router.back()} hitSlop={12}>
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </Pressable>

      <Text style={typography.title}>Safety</Text>
      <Text style={styles.subtitle}>Calm advice, only when it matters.</Text>

      {sections.map((section) => (
        <Card key={section.title} style={styles.card}>
          <SectionHeader title={section.title} />
          {section.tips.map((tip) => (
            <View key={tip} style={styles.tipRow}>
              <View style={styles.bullet} />
              <Text style={styles.tip}>{tip}</Text>
            </View>
          ))}
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingTop: spacing.xl, gap: spacing.md },
  back: { marginBottom: spacing.sm },
  subtitle: { ...typography.body, color: colors.muted, marginBottom: spacing.sm },
  card: { gap: spacing.sm },
  tipRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 8 },
  tip: { ...typography.body, flex: 1 },
});
