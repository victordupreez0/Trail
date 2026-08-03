import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SwipeDeck, type SwipeDecision } from '../components/SwipeDeck';
import type { Trail } from '../data/trails';
import { trails } from '../data/trails';
import { useAppState } from '../state/AppState';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

export function DiscoverScreen() {
  const { savedTrailIds, toggleSaved } = useAppState();

  // Snapshot once per mount so the deck doesn't reshuffle mid-swipe as savedTrailIds
  // changes; already-saved trails don't need to be swiped on again.
  const deck = useMemo(
    () => trails.filter((t) => !savedTrailIds.includes(t.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const handleDecision = (trail: Trail, decision: SwipeDecision) => {
    if (decision === 'save') toggleSaved(trail.id);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>Swipe up to save · swipe down to skip</Text>
      <SwipeDeck
        data={deck}
        onDecision={handleDecision}
        onPressCard={(trail) => router.push(`/trail/${trail.id}`)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingBottom: spacing.lg },
  hint: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
