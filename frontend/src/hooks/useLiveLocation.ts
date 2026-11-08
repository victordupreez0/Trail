import * as Battery from 'expo-battery';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { dueForWrite } from '../lib/party';
import { writePosition } from '../lib/positions';

export type LiveLocationStatus = 'idle' | 'requesting' | 'denied' | 'tracking' | 'error';

const WATCH_MIN_GAP_MS = 10_000;
const HEARTBEAT_MIN_GAP_MS = 30_000;
// Checked well under the heartbeat gap, so a stationary hiker's last known fix still
// gets re-written on schedule even though watchPositionAsync never fires for them.
const HEARTBEAT_CHECK_MS = 5_000;
// Below this, GPS jitter reads as "moving" while standing still.
const MOVING_SPEED_MS = 0.3;

type Fix = { latitude: number; longitude: number; accuracy: number; moving: boolean };

// Foreground only: Expo Go cannot run expo-task-manager background location, and
// staying on Expo Go is a deliberate project constraint, not an oversight.
export function useLiveLocation(
  groupId: string | null,
  uid: string | null,
  displayName: string,
): { status: LiveLocationStatus; retry: () => void } {
  const [status, setStatus] = useState<LiveLocationStatus>('idle');
  const [attempt, setAttempt] = useState(0);
  const lastFixRef = useRef<Fix | null>(null);
  const lastWriteMsRef = useRef<number | null>(null);
  const batteryRef = useRef(1);

  useEffect(() => {
    if (!groupId || !uid) {
      setStatus('idle');
      return;
    }

    let cancelled = false;
    let watcher: Location.LocationSubscription | null = null;
    let heartbeat: ReturnType<typeof setInterval> | null = null;
    lastFixRef.current = null;
    lastWriteMsRef.current = null;

    const refreshBattery = async () => {
      try {
        const level = await Battery.getBatteryLevelAsync();
        // -1 on platforms (mainly simulators) that don't report a battery level.
        if (level >= 0) batteryRef.current = level;
      } catch (err) {
        console.warn('getBatteryLevelAsync failed', err);
      }
    };

    const write = (fix: Fix) => {
      lastWriteMsRef.current = Date.now();
      void refreshBattery();
      writePosition(groupId, uid, {
        displayName,
        position: { latitude: fix.latitude, longitude: fix.longitude },
        accuracy: fix.accuracy,
        batteryLevel: batteryRef.current,
        moving: fix.moving,
      }).catch((err) => console.warn('writePosition failed', err));
    };

    const handleLocation = (loc: Location.LocationObject, force = false) => {
      const fix: Fix = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: loc.coords.accuracy ?? 0,
        moving: (loc.coords.speed ?? 0) > MOVING_SPEED_MS,
      };
      lastFixRef.current = fix;
      if (force || dueForWrite(lastWriteMsRef.current, Date.now(), WATCH_MIN_GAP_MS)) write(fix);
    };

    (async () => {
      setStatus('requesting');
      const { status: permission } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (permission !== 'granted') {
        setStatus('denied');
        return;
      }

      await refreshBattery();
      if (cancelled) return;

      // The last known fix is instant, so a new member appears on the map straight
      // away. A fresh fix can take many seconds indoors, so it replaces that one
      // whenever it arrives rather than holding everything else up.
      const lastKnown = await Location.getLastKnownPositionAsync().catch(() => null);
      if (cancelled) return;
      if (lastKnown) handleLocation(lastKnown);
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
        .then((loc) => {
          if (!cancelled) handleLocation(loc, true);
        })
        .catch((err) => console.warn('getCurrentPositionAsync failed', err));

      watcher = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 10, timeInterval: 5000 },
        handleLocation,
      );
      if (cancelled) {
        watcher.remove();
        return;
      }
      setStatus('tracking');

      heartbeat = setInterval(() => {
        const fix = lastFixRef.current;
        if (fix && dueForWrite(lastWriteMsRef.current, Date.now(), HEARTBEAT_MIN_GAP_MS)) {
          write(fix);
        }
      }, HEARTBEAT_CHECK_MS);
    })().catch((err) => {
      if (cancelled) return;
      console.warn('useLiveLocation failed', err);
      setStatus('error');
    });

    return () => {
      cancelled = true;
      watcher?.remove();
      if (heartbeat) clearInterval(heartbeat);
    };
  }, [groupId, uid, displayName, attempt]);

  // The denied banner sends people to the Settings app. Without this, turning
  // location on there changes nothing until the app is restarted.
  useEffect(() => {
    if (status !== 'denied' && status !== 'error') return;
    const subscription = AppState.addEventListener('change', async (next) => {
      if (next !== 'active') return;
      const { granted } = await Location.getForegroundPermissionsAsync();
      if (granted) setAttempt((n) => n + 1);
    });
    return () => subscription.remove();
  }, [status]);

  return { status, retry: () => setAttempt((n) => n + 1) };
}
