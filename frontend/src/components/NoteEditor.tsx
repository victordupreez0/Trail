import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { useAppState } from '../state/AppState';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

const SAVE_DELAY_MS = 600;

export function NoteEditor({
  trailId,
  trailName,
  note,
  autoFocus = false,
}: {
  trailId: string;
  trailName: string;
  note: string;
  autoFocus?: boolean;
}) {
  const { updateSavedTrailNote } = useAppState();
  const [text, setText] = useState(note);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Typed but not yet sent. null means everything on screen has been handed to Firestore.
  const unsaved = useRef<string | null>(null);
  const save = useRef(updateSavedTrailNote);

  useEffect(() => {
    save.current = updateSavedTrailNote;
  }, [updateSavedTrailNote]);

  // Only adopts the stored note when nothing is pending, so a slow save coming back
  // can't overwrite what someone has typed since.
  useEffect(() => {
    if (unsaved.current === null) setText(note);
  }, [note]);

  // Sends anything still waiting when the editor closes, so leaving the screen
  // straight after typing doesn't lose the note.
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      if (unsaved.current !== null) {
        save
          .current(trailId, unsaved.current)
          .catch((err) => console.warn('saving note on close failed', err));
      }
    },
    [trailId],
  );

  const onChangeText = (next: string) => {
    setText(next);
    setSaveState('idle');
    unsaved.current = next;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      unsaved.current = null;
      setSaveState('saving');
      save
        .current(trailId, next)
        .then(() => setSaveState('saved'))
        .catch(() => setSaveState('error'));
    }, SAVE_DELAY_MS);
  };

  return (
    <View style={styles.wrap}>
      <TextInput
        style={styles.input}
        placeholder="Add a note for this trail..."
        placeholderTextColor={colors.muted}
        value={text}
        onChangeText={onChangeText}
        multiline
        autoFocus={autoFocus}
        accessibilityLabel={`Note for ${trailName}`}
      />
      {saveState === 'saving' ? <Text style={styles.status}>Saving...</Text> : null}
      {saveState === 'saved' ? <Text style={styles.status}>Saved</Text> : null}
      {saveState === 'error' ? (
        <Text style={[styles.status, styles.error]}>
          Couldn&apos;t save. Check your connection and edit the note to try again.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.xs,
    gap: 4,
  },
  input: { ...typography.body, color: colors.text, minHeight: 44, textAlignVertical: 'top' },
  status: { ...typography.caption, color: colors.muted },
  error: { color: colors.danger },
});
