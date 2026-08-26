import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Props = ViewProps & {
  safeAreaStyle?: StyleProp<ViewStyle>;
};

export function ScreenContainer({ style, safeAreaStyle, ...props }: Props) {
  return (
    <SafeAreaView
      style={[styles.safeArea, safeAreaStyle]}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <View style={[styles.container, style]} {...props} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingHorizontal: spacing.lg },
});
