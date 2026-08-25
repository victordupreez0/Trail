import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SwipeDeck, type SwipeDecision } from '../components/SwipeDeck';
import type { Trail } from '../data/trails';
import { trails } from '../data/trails';
import { useTabBarInset } from '../hooks/useTabBarInset';
import { useAppState } from '../state/AppState';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

export function DiscoverScreen() {
  const { savedTrailIds, toggleSaved } = useAppState();
  const tabBarInset = useTabBarInset();

  // Snapshot once per mount so the deck doesn't reshuffle underneath a swipe as
  // savedTrailIds changes.
  // ponytail: savedTrailIds now arrives from an async Firestore listener, so on a
  // cold start this can snapshot before the first snapshot resolves and include an
  // already-saved trail. Re-swiping is idempotent (toggleSaved writes the same doc
  // id), so nothing breaks; gate this on the first snapshot if it's ever confusing
  // in practice.
  const deck = useMemo(
    () => trails.filter((t) => !savedTrailIds.includes(t.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const handleDecision = (trail: Trail, decision: SwipeDecision) => {
    if (decision === 'save') toggleSaved(trail.id);
  };

  return (
    <View style={[styles.container, { paddingBottom: spacing.md + tabBarInset }]}>
      <View style={styles.header}>
        <Text style={typography.display}>Discover</Text>
        <View style={styles.hint}>
          <Ionicons name="swap-vertical-outline" size={14} color={colors.muted} />
          <Text style={styles.hintText}>Swipe up to save, down to skip, or tap to read more</Text>
        </View>
      </View>

      <SwipeDeck
        data={deck}
        onDecision={handleDecision}
        onPressCard={(trail) => router.push(`/trail/${trail.id}`)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: spacing.sm, paddingBottom: spacing.md },
  header: { gap: spacing.xs },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hintText: { ...typography.caption, color: colors.muted, flex: 1 },
});
