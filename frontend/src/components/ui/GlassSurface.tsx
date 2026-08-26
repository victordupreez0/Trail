import { BlurView } from 'expo-blur';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { hexWithAlpha } from '../../lib/party';
import { colors } from '../../theme/colors';

type Props = ViewProps & {
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  // Escape hatch for a surface that measures worse blurred than solid (see
  // GroupsScreen's party sheet, over a continuously updating map).
  solid?: boolean;
};

export function GlassSurface({
  intensity = 40,
  tint = 'light',
  solid = false,
  style,
  children,
  ...props
}: Props) {
  return (
    <View style={[styles.hairline, style]} {...props}>
      {/* Always present, blur or not: dimezisBlurView is experimental and known to
          struggle over SurfaceView-backed content (react-native-maps), so a failed
          or no-op blur must not mean fully transparent chrome. */}
      <View style={[StyleSheet.absoluteFill, solid ? styles.solidFallback : styles.tint]} />
      {solid ? null : (
        <BlurView
          intensity={intensity}
          tint={tint}
          // Required for a real blur on Android; expo-blur ignores it elsewhere.
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  // A frosted surface with no edge reads as a bug, so every instance gets one
  // regardless of the solid/blurred branch above.
  hairline: {
    overflow: 'hidden',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: hexWithAlpha(colors.border, 0.6),
  },
  tint: { backgroundColor: hexWithAlpha(colors.surface, 0.35) },
  solidFallback: { backgroundColor: hexWithAlpha(colors.surface, 0.92) },
});
