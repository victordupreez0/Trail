import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../src/theme/colors';

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trail</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.text,
  },
});
