import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { NoteEditor } from '../components/NoteEditor';
import { TrailCard } from '../components/TrailCard';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import type { Trail } from '../data/trails';
import { useMotion } from '../hooks/useMotion';
import { useTabBarInset } from '../hooks/useTabBarInset';
import { haptics } from '../lib/haptics';
import { useAppState } from '../state/AppState';
import { colors, shadow } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

const UNDO_WINDOW_MS = 4000;

type PendingRemoval = { trailId: string; name: string };

export function SavedScreen() {
  const {
    savedTrailIds,
    savedTrailMeta,
    savedTrailsLoading,
    setTrailSaved,
    trails,
    syncFailed,
    retrySync,
  } = useAppState();
  const tabBarInset = useTabBarInset();
  const [pending, setPending] = useState<PendingRemoval | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const pendingRef = useRef<PendingRemoval | null>(null);
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setSaved = useRef(setTrailSaved);

  useEffect(() => {
    setSaved.current = setTrailSaved;
  }, [setTrailSaved]);

  // Carries out the removal that's waiting on its undo window. Used when the window
  // runs out, and also when a second removal arrives, because there's only one undo
  // bar and replacing it must not quietly bring the first trail back.
  const commitPending = () => {
    if (pendingTimer.current) clearTimeout(pendingTimer.current);
    const removal = pendingRef.current;
    if (!removal) return;
    pendingRef.current = null;
    setSaved.current(removal.trailId, false).catch(() => {
      setRemoveError(`Couldn't remove ${removal.name}. Check your connection and try again.`);
    });
  };
  const commitPendingRef = useRef(commitPending);
  useEffect(() => {
    commitPendingRef.current = commitPending;
  });

  useEffect(() => () => commitPendingRef.current(), []);

  const saved = trails.filter((t) => savedTrailIds.includes(t.id) && t.id !== pending?.trailId);

  const requestRemove = (trail: Trail) => {
    haptics.warning();
    commitPending();
    setRemoveError(null);
    const removal = { trailId: trail.id, name: trail.name };
    pendingRef.current = removal;
    setPending(removal);
    pendingTimer.current = setTimeout(() => {
      commitPending();
      setPending(null);
    }, UNDO_WINDOW_MS);
  };

  const undoRemove = () => {
    if (pendingTimer.current) clearTimeout(pendingTimer.current);
    pendingRef.current = null;
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
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.container, { paddingBottom: spacing.xl + tabBarInset }]}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={typography.display}>Saved</Text>
            <Text style={styles.sub}>
              {saved.length} {saved.length === 1 ? 'trail' : 'trails'} kept for later
            </Text>
            {removeError ? <Text style={styles.error}>{removeError}</Text> : null}
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.gap} />}
        ListEmptyComponent={
          syncFailed ? (
            <EmptyState
              title="Couldn't load your trails"
              body="Check your connection and try again."
              icon="cloud-offline-outline"
              action={{ label: 'Try again', onPress: retrySync }}
            />
          ) : (
            <EmptyState
              title="Nothing saved yet"
              body="Swipe up on a trail in Discover and it'll land here."
              icon="bookmark-outline"
            />
          )
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
  const { reduced } = useMotion();
  const [noteOpen, setNoteOpen] = useState(false);

  return (
    <Animated.View
      entering={reduced ? undefined : FadeIn}
      exiting={reduced ? undefined : FadeOut}
      layout={reduced ? undefined : LinearTransition}
    >
      <Swipeable
        overshootRight={false}
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
          <View style={styles.rowActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remove ${trail.name} from saved`}
              hitSlop={6}
              style={styles.rowAction}
              onPress={onRemove}
            >
              <Ionicons name="trash-outline" size={16} color={colors.text} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                noteOpen ? `Close note for ${trail.name}` : `Add a note for ${trail.name}`
              }
              hitSlop={6}
              style={styles.rowAction}
              onPress={() => setNoteOpen((v) => !v)}
            >
              <Ionicons
                name={note ? 'document-text' : 'create-outline'}
                size={16}
                color={colors.text}
              />
            </Pressable>
          </View>
        </Pressable>

        {noteOpen ? (
          <NoteEditor trailId={trail.id} trailName={trail.name} note={note} autoFocus />
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
  error: { ...typography.caption, color: colors.danger, marginTop: spacing.xs },
  gap: { height: spacing.md },
  loadingCard: { height: 180, borderRadius: radius.xl },
  pressed: { opacity: 0.9 },
  rowActions: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rowAction: {
    width: 38,
    height: 38,
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
  snackbar: {
    position: 'absolute',
    left: 0,
    right: 0,
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
