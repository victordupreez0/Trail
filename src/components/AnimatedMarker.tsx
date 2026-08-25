import { useEffect, useRef, type ReactNode } from 'react';
import { Marker } from 'react-native-maps';

import { useMotion } from '../hooks/useMotion';

type Coordinate = { latitude: number; longitude: number };

// react-native-maps' Marker isn't Reanimated-aware: its `coordinate` prop is a
// controlled native prop, not a shared value, so there's no way to drive it smoothly
// through reanimated the way SwipeDeck drives a transform. The library's own answer
// for exactly this is the imperative animateMarkerToCoordinate ref method, which lets
// the native map SDK interpolate on its own thread. The `coordinate` PROP is frozen
// at the position the marker mounted with and never updated again; if it were, every
// re-render would snap the marker to the new spot a beat before the imperative call
// animated it there, which is the teleport this component exists to fix.
export function AnimatedMarker({
  coordinate,
  title,
  description,
  children,
}: {
  coordinate: Coordinate;
  title?: string;
  description?: string;
  children: ReactNode;
}) {
  const markerRef = useRef<InstanceType<typeof Marker>>(null);
  const initialCoordinate = useRef(coordinate).current;
  const isFirstRender = useRef(true);
  const { duration } = useMotion();
  const { latitude, longitude } = coordinate;
  const glideMs = duration.slow;

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // duration.slow is already 0 under reduced motion (useMotion), which
    // animateMarkerToCoordinate treats as an instant jump. Rebuilt from the
    // primitive deps below rather than closing over the `coordinate` prop object,
    // so the effect only re-runs when the position actually changes.
    markerRef.current?.animateMarkerToCoordinate({ latitude, longitude }, glideMs);
  }, [latitude, longitude, glideMs]);

  return (
    <Marker
      ref={markerRef}
      coordinate={initialCoordinate}
      title={title}
      description={description}
      tracksViewChanges={false}
    >
      {children}
    </Marker>
  );
}
