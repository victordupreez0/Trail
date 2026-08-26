import * as Battery from 'expo-battery';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';

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
): LiveLocationStatus {
  const [status, setStatus] = useState<LiveLocationStatus>('idle');
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

    const write = (fix: Fix) => {
      lastWriteMsRef.current = Date.now();
      writePosition(groupId, uid, {
        displayName,
        position: { latitude: fix.latitude, longitude: fix.longitude },
        accuracy: fix.accuracy,
        batteryLevel: batteryRef.current,
        moving: fix.moving,
      }).catch((err) => console.warn('writePosition failed', err));
    };

    const refreshBattery = async () => {
      try {
        const level = await Battery.getBatteryLevelAsync();
        // -1 on platforms (mainly simulators) that don't report a battery level.
        if (level >= 0) batteryRef.current = level;
      } catch (err) {
        console.warn('getBatteryLevelAsync failed', err);
      }
    };

    const handleLocation = (loc: Location.LocationObject) => {
      const fix: Fix = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: loc.coords.accuracy ?? 0,
        moving: (loc.coords.speed ?? 0) > MOVING_SPEED_MS,
      };
      lastFixRef.current = fix;
      if (dueForWrite(lastWriteMsRef.current, Date.now(), WATCH_MIN_GAP_MS)) write(fix);
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

      // A stationary phone may not trigger the watcher promptly. Publish one fix
      // immediately so a newly joined member appears on the host's map.
      const initialLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (cancelled) return;
      handleLocation(initialLocation);

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
  }, [groupId, uid, displayName]);

  return status;
}
