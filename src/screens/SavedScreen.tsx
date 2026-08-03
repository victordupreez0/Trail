import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { TrailCard } from '../components/TrailCard';
import { EmptyState } from '../components/ui/EmptyState';
import { SectionHeader } from '../components/ui/SectionHeader';
import { trails } from '../data/trails';
import { useAppState } from '../state/AppState';
import { spacing } from '../theme/spacing';

export function SavedScreen() {
  const { savedTrailIds } = useAppState();
  const saved = trails.filter((t) => savedTrailIds.includes(t.id));

  return (
    <FlatList
      data={saved}
      keyExtractor={(t) => t.id}
      contentContainerStyle={styles.container}
      ListHeaderComponent={
        <SectionHeader title="Saved trails" subtitle={`${saved.length} saved`} />
      }
      ItemSeparatorComponent={() => <View style={styles.gap} />}
      ListEmptyComponent={
        <EmptyState
          title="Nothing saved yet"
          body="Swipe up on a trail in Discover to save it here."
        />
      }
      renderItem={({ item }) => (
        <Pressable onPress={() => router.push(`/trail/${item.id}`)}>
          <TrailCard trail={item} />
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: spacing.xl },
  gap: { height: spacing.md },
});
