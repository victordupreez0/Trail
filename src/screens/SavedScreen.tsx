import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { TrailCard } from '../components/TrailCard';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import type { Trail } from '../data/trails';
import { trails } from '../data/trails';
import { useMotion } from '../hooks/useMotion';
import { useTabBarInset } from '../hooks/useTabBarInset';
import { haptics } from '../lib/haptics';
import { useAppState } from '../state/AppState';
import { colors, shadow } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

const NOTE_DEBOUNCE_MS = 600;
const UNDO_WINDOW_MS = 4000;

export function SavedScreen() {
  const { savedTrailIds, savedTrailMeta, savedTrailsLoading, toggleSaved } = useAppState();
  const tabBarInset = useTabBarInset();
  const [pending, setPending] = useState<{ trailId: string; name: string } | null>(null);
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (pendingTimer.current) clearTimeout(pendingTimer.current);
    },
    [],
  );

  const saved = trails.filter((t) => savedTrailIds.includes(t.id) && t.id !== pending?.trailId);

  const requestRemove = (trail: Trail) => {
    haptics.warning();
    if (pendingTimer.current) clearTimeout(pendingTimer.current);
    setPending({ trailId: trail.id, name: trail.name });
    pendingTimer.current = setTimeout(() => {
      toggleSaved(trail.id);
      setPending(null);
    }, UNDO_WINDOW_MS);
  };

  const undoRemove = () => {
    if (pendingTimer.current) clearTimeout(pendingTimer.current);
    setPending(null);
  };

  if (savedTrailsLoading) {
    return (
      <View style={[styles.root, styles.container]}>
        <View style={styles.header}>
          <Text style={typography.display}>Saved</Text>
        </View>
        <Skeleton style={styles.loadingCard} />
        <View style={styles.gap} />
        <Skeleton style={styles.loadingCard} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <FlatList
        data={saved}
        keyExtractor={(t) => t.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.container, { paddingBottom: spacing.xl + tabBarInset }]}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={typography.display}>Saved</Text>
            <Text style={styles.sub}>
              {saved.length} {saved.length === 1 ? 'trail' : 'trails'} kept for later
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.gap} />}
        ListEmptyComponent={
          <EmptyState
            title="Nothing saved yet"
            body="Swipe up on a trail in Discover and it'll land here."
            icon="bookmark-outline"
          />
        }
        renderItem={({ item }) => (
          <SavedTrailRow
            trail={item}
            note={savedTrailMeta[item.id]?.notes ?? ''}
            onRemove={() => requestRemove(item)}
          />
        )}
      />

      {pending ? (
        <View style={[styles.snackbar, { bottom: spacing.lg + tabBarInset }]}>
          <Text style={styles.snackbarText} numberOfLines={1}>
            Removed {pending.name}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Undo remove"
            onPress={undoRemove}
            hitSlop={8}
          >
            <Text style={styles.snackbarAction}>Undo</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function SavedTrailRow({
  trail,
  note,
  onRemove,
}: {
  trail: Trail;
  note: string;
  onRemove: () => void;
}) {
  const { updateSavedTrailNote } = useAppState();
  const { reduced } = useMotion();
  const [noteOpen, setNoteOpen] = useState(false);
  const [text, setText] = useState(note);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setText(note), [note]);
  useEffect(
    () => () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    },
    [],
  );

  const onChangeText = (next: string) => {
    setText(next);
    setSaveState('idle');
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setSaveState('saving');
      updateSavedTrailNote(trail.id, next)
        .then(() => setSaveState('saved'))
        .catch(() => setSaveState('error'));
    }, NOTE_DEBOUNCE_MS);
  };

  return (
    <Animated.View
      entering={reduced ? undefined : FadeIn}
      exiting={reduced ? undefined : FadeOut}
      layout={reduced ? undefined : LinearTransition}
    >
      <Swipeable
        renderRightActions={() => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove ${trail.name} from saved`}
            onPress={onRemove}
            style={styles.swipeAction}
          >
            <Ionicons name="trash-outline" size={20} color={colors.surface} />
          </Pressable>
        )}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open ${trail.name}`}
          onPress={() => router.push(`/trail/${trail.id}`)}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <TrailCard trail={trail} height={180} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              noteOpen ? `Close note for ${trail.name}` : `Add a note for ${trail.name}`
            }
            hitSlop={10}
            style={styles.noteToggle}
            onPress={() => setNoteOpen((v) => !v)}
          >
            <Ionicons
              name={text ? 'document-text' : 'create-outline'}
              size={16}
              color={colors.text}
            />
          </Pressable>
        </Pressable>

        {noteOpen ? (
          <View style={styles.noteWrap}>
            <TextInput
              style={styles.noteInput}
              placeholder="Add a note for this trail..."
              placeholderTextColor={colors.muted}
              value={text}
              onChangeText={onChangeText}
              multiline
              accessibilityLabel={`Note for ${trail.name}`}
            />
            {saveState === 'saving' ? <Text style={styles.noteStatus}>Saving...</Text> : null}
            {saveState === 'saved' ? <Text style={styles.noteStatus}>Saved</Text> : null}
            {saveState === 'error' ? (
              <Text style={[styles.noteStatus, styles.noteError]}>
                Couldn&apos;t save. Try again.
              </Text>
            ) : null}
          </View>
        ) : null}
      </Swipeable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { paddingTop: spacing.sm, paddingBottom: spacing.xl },
  header: { gap: 2, marginBottom: spacing.md },
  sub: { ...typography.caption, color: colors.muted },
  gap: { height: spacing.md },
  loadingCard: { height: 180, borderRadius: radius.xl },
  pressed: { opacity: 0.9 },
  noteToggle: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  swipeAction: {
    width: 72,
    borderRadius: radius.xl,
    marginLeft: spacing.sm,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteWrap: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.xs,
    gap: 4,
  },
  noteInput: { ...typography.body, color: colors.text, minHeight: 40, textAlignVertical: 'top' },
  noteStatus: { ...typography.caption, color: colors.muted },
  noteError: { color: colors.danger },
  snackbar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryDark,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    ...shadow.floating,
  },
  snackbarText: { ...typography.body, color: colors.surface, flex: 1 },
  snackbarAction: { ...typography.label, color: colors.surface, textDecorationLine: 'underline' },
});
