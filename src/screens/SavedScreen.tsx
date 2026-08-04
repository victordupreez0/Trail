import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { TrailCard } from '../components/TrailCard';
import { EmptyState } from '../components/ui/EmptyState';
import { trails } from '../data/trails';
import { useAppState } from '../state/AppState';
import { colors, shadow } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

export function SavedScreen() {
  const { savedTrailIds, toggleSaved } = useAppState();
  const saved = trails.filter((t) => savedTrailIds.includes(t.id));

  return (
    <FlatList
      data={saved}
      keyExtractor={(t) => t.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open ${item.name}`}
          onPress={() => router.push(`/trail/${item.id}`)}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <TrailCard trail={item} height={180} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove ${item.name} from saved`}
            hitSlop={10}
            style={styles.remove}
            onPress={() => toggleSaved(item.id)}
          >
            <Ionicons name="close" size={18} color={colors.text} />
          </Pressable>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: spacing.sm, paddingBottom: spacing.xl },
  header: { gap: 2, marginBottom: spacing.md },
  sub: { ...typography.caption, color: colors.muted },
  gap: { height: spacing.md },
  pressed: { opacity: 0.9 },
  remove: {
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
});
