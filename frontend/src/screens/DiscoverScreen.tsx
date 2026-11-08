import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { SwipeDeck, type SwipeDecision } from '../components/SwipeDeck';
import { Skeleton } from '../components/ui/Skeleton';
import type { Trail } from '../data/trails';
import { useTabBarInset } from '../hooks/useTabBarInset';
import { undecidedTrails } from '../lib/swipe';
import { useAppState } from '../state/AppState';
import { colors, shadow } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

export function DiscoverScreen() {
  const { savedTrailIds, savedTrailsLoading, setTrailSaved, trails } = useAppState();
  const tabBarInset = useTabBarInset();
  const [search, setSearch] = useState('');
  // Lives here rather than in the deck so it survives a search, and so a card leaves
  // the moment it's swiped instead of waiting for the save to come back.
  const [decided, setDecided] = useState<ReadonlySet<string>>(new Set());
  const [saveError, setSaveError] = useState<string | null>(null);

  const deck = useMemo(
    () => undecidedTrails(trails, savedTrailIds, decided),
    [trails, savedTrailIds, decided],
  );
  const hasSkipped = trails.some((t) => decided.has(t.id) && !savedTrailIds.includes(t.id));

  const handleDecision = (trail: Trail, decision: SwipeDecision) => {
    setDecided((prev) => new Set(prev).add(trail.id));
    if (decision !== 'save') return;
    setSaveError(null);
    setTrailSaved(trail.id, true).catch(() => {
      setDecided((prev) => {
        const next = new Set(prev);
        next.delete(trail.id);
        return next;
      });
      setSaveError(`Couldn't save ${trail.name}. Check your connection and try again.`);
    });
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
        {saveError ? <Text style={styles.error}>{saveError}</Text> : null}
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
      ) : savedTrailsLoading ? (
        // Waits for the saved list, otherwise trails you've already saved appear
        // briefly and then vanish from under your thumb.
        <View style={styles.loading}>
          <Skeleton style={styles.loadingCard} />
        </View>
      ) : (
        <SwipeDeck
          data={deck}
          onDecision={handleDecision}
          onPressCard={(trail) => router.push(`/trail/${trail.id}`)}
          onStartOver={hasSkipped ? () => setDecided(new Set()) : undefined}
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
  error: { ...typography.caption, color: colors.danger },
  loading: { flex: 1, justifyContent: 'center' },
  loadingCard: { height: 340, borderRadius: radius.xl },
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
