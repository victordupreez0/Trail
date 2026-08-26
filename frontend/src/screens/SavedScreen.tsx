import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { TrailCard } from '../components/TrailCard';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Field } from '../components/ui/Field';
import { Skeleton } from '../components/ui/Skeleton';
import type { Trail } from '../data/trails';
import { useMotion } from '../hooks/useMotion';
import { useTabBarInset } from '../hooks/useTabBarInset';
import { haptics } from '../lib/haptics';
import { createTrailRecommendation } from '../lib/trailRecommendations';
import { useAppState } from '../state/AppState';
import { colors, shadow } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

const NOTE_DEBOUNCE_MS = 600;
const UNDO_WINDOW_MS = 4000;

export function SavedScreen() {
  const { savedTrailIds, savedTrailMeta, savedTrailsLoading, toggleSaved, trails, user } =
    useAppState();
  const tabBarInset = useTabBarInset();
  const [pending, setPending] = useState<{ trailId: string; name: string } | null>(null);
  const [recommendModalVisible, setRecommendModalVisible] = useState(false);
  const [recommendation, setRecommendation] = useState({
    name: '',
    region: '',
    description: '',
    photoUrl: '',
  });
  const [recommendationState, setRecommendationState] = useState<
    'idle' | 'sending' | 'sent' | 'error'
  >('idle');
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

  const submitRecommendation = async () => {
    if (
      !user ||
      !recommendation.name.trim() ||
      !recommendation.region.trim() ||
      !recommendation.description.trim()
    ) {
      setRecommendationState('error');
      return;
    }
    setRecommendationState('sending');
    try {
      await createTrailRecommendation(
        user.uid,
        user.displayName || user.email?.split('@')[0] || 'Hiker',
        {
          name: recommendation.name.trim(),
          region: recommendation.region.trim(),
          description: recommendation.description.trim(),
          photoUrl: recommendation.photoUrl.trim(),
        },
      );
      setRecommendationState('sent');
      setRecommendation({ name: '', region: '', description: '', photoUrl: '' });
    } catch {
      setRecommendationState('error');
    }
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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Recommend a trail"
              onPress={() => {
                setRecommendModalVisible(true);
                setRecommendationState('idle');
              }}
              hitSlop={8}
            >
              <Text style={styles.recommendLink}>Recommend a trail</Text>
            </Pressable>
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

      <Modal
        visible={recommendModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRecommendModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={typography.heading}>Recommend a trail</Text>
                <Text style={styles.sub}>Send it to the trail team for review.</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close recommendation"
                onPress={() => setRecommendModalVisible(false)}
                hitSlop={10}
              >
                <Ionicons name="close" size={24} color={colors.muted} />
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={styles.recommendationForm}>
                <Field
                  label="Trail name"
                  placeholder="Signal Hill"
                  value={recommendation.name}
                  onChangeText={(name) => setRecommendation((current) => ({ ...current, name }))}
                />
                <Field
                  label="Region"
                  placeholder="Cape Town, South Africa"
                  value={recommendation.region}
                  onChangeText={(region) =>
                    setRecommendation((current) => ({ ...current, region }))
                  }
                />
                <Field
                  label="Why recommend it?"
                  placeholder="A short sunset loop with city views"
                  multiline
                  value={recommendation.description}
                  onChangeText={(description) =>
                    setRecommendation((current) => ({ ...current, description }))
                  }
                  style={styles.recommendationDescription}
                />
                <Field
                  label="Photo URL (optional)"
                  autoCapitalize="none"
                  keyboardType="url"
                  value={recommendation.photoUrl}
                  onChangeText={(photoUrl) =>
                    setRecommendation((current) => ({ ...current, photoUrl }))
                  }
                />
                {recommendationState === 'error' ? (
                  <Text style={styles.noteError}>
                    Add a name, region, and reason, then try again.
                  </Text>
                ) : null}
                {recommendationState === 'sent' ? (
                  <Text style={styles.sent}>Recommendation sent for review.</Text>
                ) : null}
                <Button
                  label="Send recommendation"
                  icon="send-outline"
                  onPress={submitRecommendation}
                  loading={recommendationState === 'sending'}
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
  recommendLink: { ...typography.label, color: colors.primary, marginTop: spacing.xs },
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
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,26,21,0.42)' },
  modalSheet: {
    maxHeight: '88%',
    padding: spacing.lg,
    gap: spacing.md,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.background,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  recommendationForm: { gap: spacing.md, paddingBottom: spacing.lg },
  recommendationDescription: { minHeight: 72, textAlignVertical: 'top' },
  sent: { ...typography.caption, color: colors.primaryDark },
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
