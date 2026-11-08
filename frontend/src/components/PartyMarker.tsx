import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';

import { lerpCoordinate } from '../lib/party';
import { colors } from '../theme/colors';
import { radius } from '../theme/spacing';
import { Avatar } from './Avatar';

const GLIDE_MS = 900;
// Long enough for Android to capture the finished avatar as the marker's image.
const SNAPSHOT_MS = 600;

export function PartyMarker({
  coordinate,
  initials,
  color,
  stale,
  title,
  description,
  reduced,
}: {
  coordinate: { latitude: number; longitude: number };
  initials: string;
  color: string;
  stale: boolean;
  title: string;
  description: string;
  reduced: boolean;
}) {
  const { latitude, longitude } = coordinate;
  const [shown, setShown] = useState(coordinate);
  const shownRef = useRef(coordinate);
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  // Glides between fixes, because a real position only arrives every few seconds and
  // moving straight there reads as the marker teleporting. Plain state rather than a
  // native animation: a handful of markers is nothing, and it behaves the same on
  // both platforms.
  useEffect(() => {
    const target = { latitude, longitude };
    const from = shownRef.current;
    if (reduced) {
      shownRef.current = target;
      setShown(target);
      return;
    }
    if (from.latitude === latitude && from.longitude === longitude) return;

    const start = Date.now();
    let raf: ReturnType<typeof requestAnimationFrame>;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / GLIDE_MS);
      const next = lerpCoordinate(from, target, 1 - (1 - t) ** 3);
      shownRef.current = next;
      setShown(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [latitude, longitude, reduced]);

  // Maps draw a custom marker as a captured image. Capturing only while its look can
  // change keeps it cheap, and capturing at all is what lets the avatar appear and
  // the stale dimming show up.
  useEffect(() => {
    setTracksViewChanges(true);
    const id = setTimeout(() => setTracksViewChanges(false), SNAPSHOT_MS);
    return () => clearTimeout(id);
  }, [stale, initials, color]);

  return (
    <Marker
      coordinate={shown}
      title={title}
      description={description}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={tracksViewChanges}
    >
      <View style={[styles.pin, stale && styles.pinStale]}>
        <Avatar initials={initials} color={color} size={34} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  pin: { borderWidth: 3, borderColor: colors.surface, borderRadius: radius.pill },
  pinStale: { opacity: 0.45 },
});
