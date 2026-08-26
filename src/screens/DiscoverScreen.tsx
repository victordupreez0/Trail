import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { SwipeDeck, type SwipeDecision } from '../components/SwipeDeck';
import type { Trail } from '../data/trails';
import { useTabBarInset } from '../hooks/useTabBarInset';
import { useAppState } from '../state/AppState';
import { colors, shadow } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

export function DiscoverScreen() {
  const { savedTrailIds, toggleSaved, trails } = useAppState();
  const tabBarInset = useTabBarInset();
  const [search, setSearch] = useState('');

  const deck = useMemo(
    () => trails.filter((t) => !savedTrailIds.includes(t.id)),
    [savedTrailIds, trails],
  );

  const handleDecision = (trail: Trail, decision: SwipeDecision) => {
    if (decision === 'save') toggleSaved(trail.id);
  };
  const suggestions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    return trails
      .filter((trail) => `${trail.name} ${trail.region}`.toLowerCase().includes(query))
      .slice(0, 5);
  }, [search, trails]);

  return (
    <View style={[styles.container, { paddingBottom: spacing.md + tabBarInset }]}>
      <View style={styles.header}>
        <Text style={typography.display}>Discover</Text>
        <View style={styles.hint}>
          <Ionicons name="swap-vertical-outline" size={14} color={colors.muted} />
          <Text style={styles.hintText}>Swipe up to save, down to skip, or tap to read more</Text>
        </View>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={colors.muted} />
          <TextInput
            style={styles.search}
            placeholder="Search trails or regions"
            placeholderTextColor={colors.muted}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
            accessibilityLabel="Search trails"
          />
          {search ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear trail search"
              onPress={() => setSearch('')}
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {search ? (
        <View style={styles.dropdown}>
          {suggestions.length ? (
            suggestions.map((trail) => (
              <Pressable
                key={trail.id}
                accessibilityRole="button"
                accessibilityLabel={`Open ${trail.name}`}
                onPress={() => {
                  setSearch('');
                  router.push(`/trail/${trail.id}`);
                }}
                style={({ pressed }) => [styles.suggestion, pressed && styles.suggestionPressed]}
              >
                <View style={styles.suggestionCopy}>
                  <Text style={typography.label}>{trail.name}</Text>
                  <Text style={styles.suggestionMeta} numberOfLines={1}>
                    {trail.region} · {(trail.distanceM / 1000).toFixed(1)} km
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={17} color={colors.muted} />
              </Pressable>
            ))
          ) : (
            <View style={styles.noResults}>
              <Text style={styles.suggestionMeta}>No trails match “{search.trim()}”.</Text>
            </View>
          )}
        </View>
      ) : (
        <SwipeDeck
          data={deck}
          onDecision={handleDecision}
          onPressCard={(trail) => router.push(`/trail/${trail.id}`)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: spacing.sm, paddingBottom: spacing.md },
  header: { gap: spacing.xs },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hintText: { ...typography.caption, color: colors.muted, flex: 1 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
  },
  search: { flex: 1, ...typography.body, color: colors.text, paddingVertical: 0 },
  dropdown: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.card,
  },
  suggestion: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  suggestionPressed: { backgroundColor: colors.surfaceAlt },
  suggestionCopy: { flex: 1, gap: 2 },
  suggestionMeta: { ...typography.caption, color: colors.muted },
  noResults: { padding: spacing.md },
});
