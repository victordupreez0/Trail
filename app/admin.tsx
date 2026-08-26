import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../src/components/ui/Button';
import { Card } from '../src/components/ui/Card';
import { Field } from '../src/components/ui/Field';
import {
  createAdminTrail,
  deleteAdminTrail,
  subscribeToAdminTrails,
  updateAdminTrail,
  type AdminTrail,
  type AdminTrailInput,
} from '../src/lib/adminTrails';
import { useAppState } from '../src/state/AppState';
import { colors } from '../src/theme/colors';
import { radius, spacing } from '../src/theme/spacing';
import { typography } from '../src/theme/typography';

type Form = {
  name: string;
  difficulty: AdminTrail['difficulty'];
  distanceKm: string;
  elevationM: string;
  region: string;
  description: string;
  photoUrl: string;
  latitude: string;
  longitude: string;
  path: string;
};

const emptyForm = (): Form => ({
  name: '',
  difficulty: 'moderate',
  distanceKm: '',
  elevationM: '',
  region: '',
  description: '',
  photoUrl: '',
  latitude: '',
  longitude: '',
  path: '',
});

function formFromTrail(trail: AdminTrail): Form {
  return {
    name: trail.name,
    difficulty: trail.difficulty,
    distanceKm: String(trail.distanceM / 1000),
    elevationM: String(trail.elevationGainM),
    region: trail.region,
    description: trail.description,
    photoUrl: trail.photoUrl,
    latitude: String(trail.location.latitude),
    longitude: String(trail.location.longitude),
    path: trail.path.map((point) => `${point.latitude},${point.longitude}`).join('; '),
  };
}

function toTrailInput(form: Form): AdminTrailInput | null {
  const distanceKm = Number(form.distanceKm);
  const elevationGainM = Number(form.elevationM);
  const latitude = Number(form.latitude);
  const longitude = Number(form.longitude);
  const path = form.path
    .split(';')
    .map((point) => point.trim().split(',').map(Number))
    .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng))
    .map(([lat, lng]) => ({ latitude: lat, longitude: lng }));

  if (
    !form.name.trim() ||
    !form.region.trim() ||
    !form.description.trim() ||
    !form.photoUrl.trim() ||
    !Number.isFinite(distanceKm) ||
    distanceKm <= 0 ||
    !Number.isFinite(elevationGainM) ||
    elevationGainM < 0 ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    path.length < 2
  ) {
    return null;
  }

  return {
    name: form.name.trim(),
    difficulty: form.difficulty,
    distanceM: Math.round(distanceKm * 1000),
    elevationGainM: Math.round(elevationGainM),
    region: form.region.trim(),
    description: form.description.trim(),
    photoUrl: form.photoUrl.trim(),
    location: { latitude, longitude },
    path,
  };
}

export default function Admin() {
  const { isAdmin } = useAppState();
  const [trails, setTrails] = useState<AdminTrail[]>([]);
  const [editing, setEditing] = useState<AdminTrail | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    return subscribeToAdminTrails(
      (next) => {
        setTrails(next);
        setLoading(false);
      },
      () => {
        setError("Couldn't load the trail catalogue.");
        setLoading(false);
      },
    );
  }, [isAdmin]);

  const change = (key: keyof Form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const beginCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setError(null);
  };

  const beginEdit = (trail: AdminTrail) => {
    setEditing(trail);
    setForm(formFromTrail(trail));
    setError(null);
  };

  const save = async () => {
    const input = toTrailInput(form);
    if (!input) {
      setError('Complete every field with valid numbers and at least two route points.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editing) await updateAdminTrail(editing.id, input);
      else await createAdminTrail(input);
      beginCreate();
    } catch {
      setError("Couldn't save this trail. Check that your account has admin access.");
    } finally {
      setSaving(false);
    }
  };

  const remove = (trail: AdminTrail) => {
    Alert.alert('Delete trail?', `${trail.name} will be removed from the catalogue.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          deleteAdminTrail(trail.id).catch(() => setError("Couldn't delete this trail.")),
      },
    ]);
  };

  if (!isAdmin) {
    return (
      <View style={styles.denied}>
        <Ionicons name="lock-closed-outline" size={28} color={colors.muted} />
        <Text style={typography.title}>Admin access required</Text>
        <Text style={styles.muted}>This account does not have permission to manage trails.</Text>
        <Button label="Back to profile" variant="secondary" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={typography.title}>Trail admin</Text>
          <Text style={styles.muted}>Create, update, and remove catalogue trails.</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close admin panel"
          onPress={() => router.back()}
          hitSlop={10}
        >
          <Ionicons name="close" size={24} color={colors.muted} />
        </Pressable>
      </View>

      <Card style={styles.form}>
        <Text style={styles.formTitle}>{editing ? `Edit ${editing.name}` : 'New trail'}</Text>
        <Field
          label="Trail name"
          value={form.name}
          onChangeText={(value) => change('name', value)}
        />
        <DifficultyPicker
          value={form.difficulty}
          onChange={(value) => change('difficulty', value)}
        />
        <Field
          label="Distance (km)"
          keyboardType="decimal-pad"
          value={form.distanceKm}
          onChangeText={(value) => change('distanceKm', value)}
        />
        <Field
          label="Elevation gain (m)"
          keyboardType="number-pad"
          value={form.elevationM}
          onChangeText={(value) => change('elevationM', value)}
        />
        <Field
          label="Region"
          value={form.region}
          onChangeText={(value) => change('region', value)}
        />
        <Field
          label="Description"
          multiline
          value={form.description}
          onChangeText={(value) => change('description', value)}
          style={styles.multiline}
        />
        <Field
          label="Photo URL"
          autoCapitalize="none"
          keyboardType="url"
          value={form.photoUrl}
          onChangeText={(value) => change('photoUrl', value)}
        />
        <Field
          label="Latitude"
          keyboardType="decimal-pad"
          value={form.latitude}
          onChangeText={(value) => change('latitude', value)}
        />
        <Field
          label="Longitude"
          keyboardType="decimal-pad"
          value={form.longitude}
          onChangeText={(value) => change('longitude', value)}
        />
        <Field
          label="Route points"
          placeholder="-33.94,18.38; -33.93,18.39"
          value={form.path}
          onChangeText={(value) => change('path', value)}
        />
        <Text style={styles.help}>
          Separate latitude/longitude points with semicolons. Use at least two.
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          label={editing ? 'Save changes' : 'Create trail'}
          icon={editing ? 'save-outline' : 'add'}
          onPress={save}
          loading={saving}
        />
        {editing ? <Button label="Cancel edit" variant="ghost" onPress={beginCreate} /> : null}
      </Card>

      <View style={styles.listHeader}>
        <Text style={typography.heading}>Catalogue</Text>
        <Text style={styles.muted}>{loading ? 'Loading…' : `${trails.length} trails`}</Text>
      </View>
      {trails.map((trail) => (
        <Card key={trail.id} style={styles.trail}>
          <View style={styles.trailCopy}>
            <Text style={typography.label}>{trail.name}</Text>
            <Text style={styles.muted} numberOfLines={1}>
              {trail.region} · {(trail.distanceM / 1000).toFixed(1)} km
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Edit ${trail.name}`}
            onPress={() => beginEdit(trail)}
            hitSlop={8}
          >
            <Ionicons name="create-outline" size={20} color={colors.primary} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Delete ${trail.name}`}
            onPress={() => remove(trail)}
            hitSlop={8}
          >
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </Pressable>
        </Card>
      ))}
    </ScrollView>
  );
}

function DifficultyPicker({
  value,
  onChange,
}: {
  value: Form['difficulty'];
  onChange: (value: Form['difficulty']) => void;
}) {
  return (
    <View style={styles.difficulty}>
      <Text style={styles.label}>Difficulty</Text>
      <View style={styles.pills}>
        {(['easy', 'moderate', 'hard'] as const).map((option) => (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityState={{ selected: value === option }}
            onPress={() => onChange(option)}
            style={[styles.pill, value === option && styles.pillActive]}
          >
            <Text style={[styles.pillText, value === option && styles.pillTextActive]}>
              {option}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  muted: { ...typography.caption, color: colors.muted },
  form: { gap: spacing.md },
  formTitle: { ...typography.heading },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  help: { ...typography.caption, color: colors.muted, marginTop: -spacing.sm },
  error: { ...typography.caption, color: colors.danger },
  difficulty: { gap: 6 },
  label: { ...typography.caption, color: colors.muted },
  pills: { flexDirection: 'row', gap: spacing.xs },
  pill: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { ...typography.caption, color: colors.text, textTransform: 'capitalize' },
  pillTextActive: { color: colors.surface, fontWeight: '700' },
  listHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  trail: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  trailCopy: { flex: 1, gap: 2 },
  denied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
});
