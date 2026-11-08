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
 * Usage: npm run simulate -- --code=ABC123
 * Options: --group=<groupId> instead of --code, --members=2, --trail=<id>, --speed=3,
 * --quiet-after=30 and --quiet-for=180 (seconds).
 *
 * Ctrl+C removes the simulated members from the group and deletes their position
 * docs before exiting, so a demo doesn't leave ghost hikers behind in Firestore.
 */
import './nodeAssetStub';

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

import { trails } from '../frontend/src/data/trails';
import {
  densify,
  isQuiet,
  routeForHost,
  routeLengthMetres,
  walk,
} from '../frontend/src/lib/simulation';

const TICK_MS = 5000;
const WALKING_METRES_PER_SECOND = 1.4;
// Keeps the party inside one readable map, however long the real trail is.
const MAX_ROUTE_METRES = 800;
// Small enough to read as GPS wobble without drowning out the actual walking.
const JITTER_METRES = 1.5;
const QUIET_MEMBER_INDEX = 0;

const SIM_MEMBERS = [
  { uid: 'sim-sam', name: 'Sam' },
  { uid: 'sim-nadia', name: 'Nadia' },
  { uid: 'sim-jordan', name: 'Jordan' },
  { uid: 'sim-priya', name: 'Priya' },
];

type Args = {
  group?: string;
  code?: string;
  members: number;
  trail?: string;
  speed: number;
  quietAfterMs: number;
  quietForMs: number;
};

function parseArgs(): Args {
  const flags = new Map<string, string>();
  for (const arg of process.argv.slice(2)) {
    const match = /^--([\w-]+)=(.*)$/.exec(arg);
    if (match) flags.set(match[1], match[2]);
  }
  const group = flags.get('group');
  const code = flags.get('code');
  if (!group && !code) {
    console.error(
      'Usage: npm run simulate -- --code=<invite code> [--members=2] [--trail=<id>] [--speed=3] [--quiet-after=30] [--quiet-for=180]',
    );
    process.exit(1);
  }
  return {
    group,
    code,
    members: Math.min(SIM_MEMBERS.length, Math.max(1, Number(flags.get('members') ?? 2))),
    trail: flags.get('trail'),
    // 3x walking pace: real walking barely moves a dot on a projected map.
    speed: Number(flags.get('speed') ?? 3),
    quietAfterMs: Number(flags.get('quiet-after') ?? 30) * 1000,
    // Longer than the app's 2 minute stale threshold, so the alert has time to fire
    // and be seen before the hiker comes back and it clears.
    quietForMs: Number(flags.get('quiet-for') ?? 180) * 1000,
  };
}

type Point = { latitude: number; longitude: number };

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
  const args = parseArgs();
  const app = process.env.FIRESTORE_EMULATOR_HOST
    ? initializeApp({ projectId: process.env.GCLOUD_PROJECT ?? 'trail-dev' })
    : initializeApp({ credential: applicationDefault() });
  const db = getFirestore(app);

  // The app only ever shows people the invite code, so that's what this accepts.
  let groupId = args.group;
  if (!groupId) {
    const invite = await db.collection('inviteCodes').doc(args.code!.trim().toUpperCase()).get();
    groupId = invite.data()?.groupId as string | undefined;
    if (!groupId) {
      console.error(`No hike found with invite code "${args.code}".`);
      process.exit(1);
    }
  }

  const groupRef = db.collection('groups').doc(groupId);
  const groupSnap = await groupRef.get();
  if (!groupSnap.exists) {
    console.error(`No hike found with id "${groupId}".`);
    process.exit(1);
  }
  const group = groupSnap.data() as { trailId: string; ownerId: string };

  const positionsRef = (uid: string) => groupRef.collection('positions').doc(uid);

  const trailId = args.trail ?? group.trailId;
  const bundledTrail = trails.find((t) => t.id === trailId);
  const path = (bundledTrail?.path ??
    (await db.collection('trails').doc(trailId).get()).data()?.path) as Point[] | undefined;
  if (!path) {
    console.error(`Unknown trail "${trailId}". Known ids: ${trails.map((t) => t.id).join(', ')}`);
    process.exit(1);
  }

  const hostDoc = await positionsRef(group.ownerId).get();
  const host = (hostDoc.data()?.position as Point | undefined) ?? null;
  const route = routeForHost(path, host);
  if (route !== path) console.log('Host is away from the trail, so the party will walk near them.');

  const stepMetres = WALKING_METRES_PER_SECOND * (TICK_MS / 1000) * args.speed;
  const waypoints = densify(
    route,
    Math.max(2, Math.round(routeLengthMetres(route) / stepMetres)),
  ).slice(0, Math.ceil(MAX_ROUTE_METRES / stepMetres));

  const sim = SIM_MEMBERS.slice(0, args.members).map((m, i) => ({
    ...m,
    // Different starting points and speeds so members don't move in lockstep.
    index: Math.floor((waypoints.length / args.members) * i),
    direction: 1 as 1 | -1,
    rate: 0.85 + i * 0.1,
    battery: 0.9 - i * 0.05,
  }));

  await groupRef.update({
    memberIds: FieldValue.arrayUnion(...sim.map((m) => m.uid)),
  });
  console.log(`Simulating ${sim.length} hiker(s) in hike ${groupId}. Ctrl+C to stop.`);

  const startedAt = Date.now();
  let quietAnnounced = false;

  const interval = setInterval(async () => {
    const elapsed = Date.now() - startedAt;
    for (const [i, m] of sim.entries()) {
      // Sends nothing at all while quiet: a hiker who stands still but keeps
      // reporting in is fine, and the alert correctly stays silent for them.
      if (i === QUIET_MEMBER_INDEX && isQuiet(elapsed, args.quietAfterMs, args.quietForMs)) {
        if (!quietAnnounced) {
          quietAnnounced = true;
          console.log(`${m.name} has gone quiet. The stale alert fires in about 2 minutes.`);
        }
        continue;
      }

      const step = walk(m.index, m.direction, m.rate, waypoints.length - 1);
      m.index = step.index;
      m.direction = step.direction;
      m.battery = Math.max(0.05, m.battery - 0.0015);

      await positionsRef(m.uid)
        .set(
          {
            displayName: m.name,
            position: jitterPoint(waypoints[Math.round(m.index)], JITTER_METRES),
            accuracy: 4 + Math.random() * 8,
            batteryLevel: m.battery,
            moving: true,
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
