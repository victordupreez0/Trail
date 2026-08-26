import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Props = TextInputProps & {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function Field({ label, icon, style, ...props }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, focused && styles.fieldFocused]}>
        {icon ? (
          <Ionicons name={icon} size={18} color={focused ? colors.primary : colors.muted} />
        ) : null}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.muted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { ...typography.caption, color: colors.muted },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 54,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  fieldFocused: { borderColor: colors.primary },
  input: {
    flex: 1,
    alignSelf: 'stretch',
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    color: colors.text,
    includeFontPadding: false,
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
});
