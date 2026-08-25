import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

export function Avatar({
  initials,
  color,
  size = 36,
  photoURL,
}: {
  initials: string;
  color: string;
  size?: number;
  photoURL?: string | null;
}) {
  // Falls back to initials on a missing URL and on a failed image load (a stale
  // download URL, offline, a deleted object), rather than showing a broken image.
  const [loadFailed, setLoadFailed] = useState(false);
  const showPhoto = !!photoURL && !loadFailed;

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
      ]}
    >
      {showPhoto ? (
        <Image
          source={{ uri: photoURL }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          onError={() => setLoadFailed(true)}
        />
      ) : (
        <Text style={[styles.label, { fontSize: size * 0.4 }]}>{initials}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  label: { color: colors.surface, fontWeight: '700' },
});
