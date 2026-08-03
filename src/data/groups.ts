import { trails } from './trails';

export type GroupMember = {
  uid: string;
  displayName: string;
  initials: string;
  color: string;
  position: { latitude: number; longitude: number };
  batteryLevel: number;
};

export type Group = {
  id: string;
  name: string;
  trailId: string;
  ownerId: string;
  inviteCode: string;
  active: boolean;
  members: GroupMember[];
};

const lionsHead = trails.find((t) => t.id === 'lions-head')!;

// Static stand-ins for what will be live positions once Firestore lands — placed
// along the trail's own path so the map looks plausible.
export const groups: Group[] = [
  {
    id: 'group-1',
    name: "Sunrise crew — Lion's Head",
    trailId: lionsHead.id,
    ownerId: 'me',
    inviteCode: 'TRAIL-42',
    active: true,
    members: [
      {
        uid: 'me',
        displayName: 'Victor',
        initials: 'V',
        color: '#2F6B4F',
        position: lionsHead.path[2],
        batteryLevel: 0.82,
      },
      {
        uid: 'sam',
        displayName: 'Sam',
        initials: 'S',
        color: '#B3432B',
        position: lionsHead.path[1],
        batteryLevel: 0.64,
      },
      {
        uid: 'nadia',
        displayName: 'Nadia',
        initials: 'N',
        color: '#5C6BC0',
        position: lionsHead.path[0],
        batteryLevel: 0.91,
      },
    ],
  },
];
