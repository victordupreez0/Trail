import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View, type ViewProps } from 'react-native';

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
  // Android's blur is experimental, costs frames during swipes and struggles over
  // the map, so Android always gets the solid surface.
  const opaque = solid || Platform.OS === 'android';
  return (
    <View style={[styles.hairline, style]} {...props}>
      <View style={[StyleSheet.absoluteFill, opaque ? styles.solidFallback : styles.tint]} />
      {opaque ? null : (
        <BlurView intensity={intensity} tint={tint} style={StyleSheet.absoluteFill} />
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
