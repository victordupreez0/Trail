/**
 * Makes a demo party appear to move on the live map, so live tracking can be
 * demonstrated with a single physical device. Writes directly to
 * groups/{groupId}/positions/{uid} with the Admin SDK, bypassing security rules
 * exactly like seed-trails.ts bypasses them to seed the trail catalog.
 *
 * Auth: uses Application Default Credentials, same as seed-trails.ts. Against the
 * local emulator, set FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 and no real credentials
 * are needed.
 *
 * Usage: npm run simulate -- --group=<groupId> --members=2 --trail=lions-head --speed=1
 *
 * Ctrl+C removes the simulated members from the group and deletes their position
 * docs before exiting, so a demo doesn't leave ghost hikers behind in Firestore.
 */
import './nodeAssetStub';

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

import { trails } from '../frontend/src/data/trails';
import { memberColor } from '../frontend/src/lib/party';

const WAYPOINT_COUNT = 200;
const TICK_MS = 5000;
const PAUSE_MEMBER_INDEX = 0;
const PAUSE_AFTER_TICKS = 6;
const PAUSE_TICKS = 6;

const SIM_MEMBERS = [
  { uid: 'sim-sam', name: 'Sam' },
  { uid: 'sim-nadia', name: 'Nadia' },
  { uid: 'sim-jordan', name: 'Jordan' },
  { uid: 'sim-priya', name: 'Priya' },
];

type Args = { group: string; members: number; trail: string; speed: number };

function parseArgs(): Args {
  const flags = new Map<string, string>();
  for (const arg of process.argv.slice(2)) {
    const match = /^--([\w-]+)=(.*)$/.exec(arg);
    if (match) flags.set(match[1], match[2]);
  }
  const group = flags.get('group');
  if (!group) {
    console.error(
      'Usage: npm run simulate -- --group=<groupId> [--members=2] [--trail=lions-head] [--speed=1]',
    );
    process.exit(1);
  }
  return {
    group,
    members: Math.min(SIM_MEMBERS.length, Math.max(1, Number(flags.get('members') ?? 2))),
    trail: flags.get('trail') ?? 'lions-head',
    speed: Number(flags.get('speed') ?? 1),
  };
}

type Point = { latitude: number; longitude: number };

// The trail catalog only stores 3-4 corner points, not a walkable track, so this
// interpolates evenly along each segment to get a path a member can actually
// "walk" step by step without visibly teleporting between corners.
function densify(path: Point[], count: number): Point[] {
  const segmentLengths = path.slice(1).map((p, i) => distance(path[i], p));
  const totalLength = segmentLengths.reduce((a, b) => a + b, 0);
  const out: Point[] = [];
  for (let i = 0; i < count; i++) {
    const targetDist = (totalLength * i) / (count - 1);
    let covered = 0;
    let seg = 0;
    while (seg < segmentLengths.length - 1 && covered + segmentLengths[seg] < targetDist) {
      covered += segmentLengths[seg];
      seg++;
    }
    const segLen = segmentLengths[seg] || 1;
    const t = Math.min(1, (targetDist - covered) / segLen);
    const a = path[seg];
    const b = path[seg + 1];
    out.push({
      latitude: a.latitude + (b.latitude - a.latitude) * t,
      longitude: a.longitude + (b.longitude - a.longitude) * t,
    });
  }
  return out;
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.latitude - b.latitude, a.longitude - b.longitude);
}

// A few metres of perpendicular jitter so a track reads as GPS noise rather than a
// polyline retraced exactly on every pass.
function jitterPoint(p: Point, metres: number): Point {
  // ~111,320m per degree of latitude; close enough for cosmetic jitter.
  const deg = metres / 111_320;
  const angle = Math.random() * Math.PI * 2;
  return {
    latitude: p.latitude + Math.sin(angle) * deg,
    longitude: p.longitude + Math.cos(angle) * deg,
  };
}

async function main() {
  const { group, members: memberCount, trail: trailId, speed } = parseArgs();
  const trail = trails.find((t) => t.id === trailId);
  if (!trail) {
    console.error(`Unknown trail "${trailId}". Known ids: ${trails.map((t) => t.id).join(', ')}`);
    process.exit(1);
  }

  const app = process.env.FIRESTORE_EMULATOR_HOST
    ? initializeApp({ projectId: process.env.GCLOUD_PROJECT ?? 'trail-dev' })
    : initializeApp({ credential: applicationDefault() });
  const db = getFirestore(app);

  const waypoints = densify(trail!.path, WAYPOINT_COUNT);
  const sim = SIM_MEMBERS.slice(0, memberCount).map((m, i) => ({
    ...m,
    color: memberColor(m.uid),
    // Different starting offsets and speeds so members don't move in lockstep.
    index: Math.floor((waypoints.length / memberCount) * i),
    direction: 1 as 1 | -1,
    stepEvery: Math.max(1, Math.round(2 / (speed * (0.85 + i * 0.1)))),
    tick: 0,
    battery: 0.9 - i * 0.05,
    pausedTicksLeft: 0,
  }));

  const positionsRef = (uid: string) =>
    db.collection('groups').doc(group).collection('positions').doc(uid);
  const groupRef = db.collection('groups').doc(group);

  await groupRef.update({ memberIds: FieldValue.arrayUnion(...sim.map((m) => m.uid)) });
  console.log(
    `Simulating ${sim.length} member(s) on ${trail!.name} in group ${group}. Ctrl+C to stop.`,
  );

  const interval = setInterval(async () => {
    for (const [i, m] of sim.entries()) {
      m.tick++;

      // One member pauses partway through, so a demo has something real for the
      // "hasn't checked in" alert to fire on.
      if (i === PAUSE_MEMBER_INDEX && m.pausedTicksLeft === 0 && m.tick === PAUSE_AFTER_TICKS) {
        m.pausedTicksLeft = PAUSE_TICKS;
      }
      if (m.pausedTicksLeft > 0) {
        m.pausedTicksLeft--;
      } else if (m.tick % m.stepEvery === 0) {
        m.index += m.direction;
        if (m.index >= waypoints.length - 1 || m.index <= 0) m.direction *= -1;
      }

      m.battery = Math.max(0.05, m.battery - 0.0015);
      const point = jitterPoint(waypoints[m.index], 4 + Math.random() * 8);

      await positionsRef(m.uid)
        .set(
          {
            displayName: m.name,
            position: point,
            accuracy: 4 + Math.random() * 8,
            batteryLevel: m.battery,
            moving: m.pausedTicksLeft === 0,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        )
        .catch((err) => console.warn(`write failed for ${m.uid}`, err));
    }
  }, TICK_MS);

  const cleanup = async () => {
    clearInterval(interval);
    console.log('\nRemoving simulated hikers...');
    await groupRef
      .update({ memberIds: FieldValue.arrayRemove(...sim.map((m) => m.uid)) })
      .catch(() => {});
    await Promise.all(
      sim.map((m) =>
        positionsRef(m.uid)
          .delete()
          .catch(() => {}),
      ),
    );
    process.exit(0);
  };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
