// The curated trail catalog. Shared by the UI (static/mock data for now) and
// backend/seed-trails.ts (writes the same data into Firestore). One dataset, two uses.
import type { ImageSourcePropType } from 'react-native';

export type Trail = {
  id: string;
  name: string;
  difficulty: 'easy' | 'moderate' | 'hard';
  distanceM: number;
  elevationGainM: number;
  region: string;
  description: string;
  // Bundled with the app, so photos render instantly and work with no network.
  // Remote URLs proved unreliable on venue wifi and are a poor demo dependency.
  photo: ImageSourcePropType;
  // The same image hosted remotely, written to Firestore by backend/seed-trails.ts
  // for when trail data is served from the backend.
  photoUrl: string;
  location: { latitude: number; longitude: number };
  // A simplified 3-4 point polyline, not a real GPX track. Swap for
  // recorded or traced routes once the app supports uploading them.
  path: { latitude: number; longitude: number }[];
};

export const trails: Trail[] = [
  {
    id: 'lions-head',
    name: "Lion's Head",
    difficulty: 'moderate',
    distanceM: 5200,
    elevationGainM: 450,
    region: 'Cape Town, South Africa',
    description:
      'Spiral summit trail with chain-and-ladder sections and 360° views over Cape Town.',
    photoUrl:
      'https://images.unsplash.com/photo-1444351274028-b348e6da5f67?w=900&q=68&auto=format&fit=crop',
    photo: require('../../assets/trails/trail-01.jpg'),
    location: { latitude: -33.9359, longitude: 18.3875 },
    path: [
      { latitude: -33.9395, longitude: 18.3838 },
      { latitude: -33.937, longitude: 18.386 },
      { latitude: -33.9359, longitude: 18.3875 },
    ],
  },
  {
    id: 'platteklip-gorge',
    name: 'Platteklip Gorge',
    difficulty: 'hard',
    distanceM: 6000,
    elevationGainM: 700,
    region: 'Cape Town, South Africa',
    description:
      'The most direct route up Table Mountain. Steep, exposed, and unforgiving on the knees.',
    photoUrl:
      'https://images.unsplash.com/photo-1459231978203-b7d0c47a2cb7?w=900&q=68&auto=format&fit=crop',
    photo: require('../../assets/trails/trail-02.jpg'),
    location: { latitude: -33.9628, longitude: 18.4055 },
    path: [
      { latitude: -33.9584, longitude: 18.4048 },
      { latitude: -33.9605, longitude: 18.4051 },
      { latitude: -33.9628, longitude: 18.4055 },
    ],
  },
  {
    id: 'devils-peak',
    name: "Devil's Peak",
    difficulty: 'hard',
    distanceM: 9500,
    elevationGainM: 900,
    region: 'Cape Town, South Africa',
    description:
      'Long climb from Tafelberg Road with sweeping views of the City Bowl and False Bay.',
    photoUrl:
      'https://images.unsplash.com/photo-1465513670158-c3ac6c8d1a87?w=900&q=68&auto=format&fit=crop',
    photo: require('../../assets/trails/trail-03.jpg'),
    location: { latitude: -33.9553, longitude: 18.4192 },
    path: [
      { latitude: -33.9498, longitude: 18.4241 },
      { latitude: -33.9525, longitude: 18.4215 },
      { latitude: -33.9553, longitude: 18.4192 },
    ],
  },
  {
    id: 'skeleton-gorge',
    name: 'Skeleton Gorge',
    difficulty: 'hard',
    distanceM: 8000,
    elevationGainM: 600,
    region: 'Cape Town, South Africa',
    description: 'Shaded ravine climb through Kirstenbosch forest onto the Table Mountain plateau.',
    photoUrl:
      'https://images.unsplash.com/photo-1501554728187-ce583db33af7?w=900&q=68&auto=format&fit=crop',
    photo: require('../../assets/trails/trail-04.jpg'),
    location: { latitude: -33.9881, longitude: 18.4322 },
    path: [
      { latitude: -33.9881, longitude: 18.4322 },
      { latitude: -33.985, longitude: 18.428 },
      { latitude: -33.981, longitude: 18.4245 },
    ],
  },
  {
    id: 'pipe-track',
    name: 'Pipe Track',
    difficulty: 'easy',
    distanceM: 7500,
    elevationGainM: 200,
    region: 'Cape Town, South Africa',
    description:
      'Gentle contour path along the Twelve Apostles with steady Atlantic seaboard views.',
    photoUrl:
      'https://images.unsplash.com/photo-1504280317859-9c6cce36bca8?w=900&q=68&auto=format&fit=crop',
    photo: require('../../assets/trails/trail-05.jpg'),
    location: { latitude: -33.9702, longitude: 18.3778 },
    path: [
      { latitude: -33.956, longitude: 18.382 },
      { latitude: -33.963, longitude: 18.38 },
      { latitude: -33.9702, longitude: 18.3778 },
    ],
  },
  {
    id: 'chapmans-peak',
    name: "Chapman's Peak Loop",
    difficulty: 'moderate',
    distanceM: 10000,
    elevationGainM: 500,
    region: 'Cape Town, South Africa',
    description: "Coastal traverse above one of the world's most scenic drives.",
    photoUrl:
      'https://images.unsplash.com/photo-1505140402502-734369f05760?w=900&q=68&auto=format&fit=crop',
    photo: require('../../assets/trails/trail-06.jpg'),
    location: { latitude: -34.087, longitude: 18.3567 },
    path: [
      { latitude: -34.079, longitude: 18.361 },
      { latitude: -34.083, longitude: 18.359 },
      { latitude: -34.087, longitude: 18.3567 },
    ],
  },
  {
    id: 'cape-point',
    name: 'Cape Point Coastal Trail',
    difficulty: 'moderate',
    distanceM: 8500,
    elevationGainM: 350,
    region: 'Cape Point, South Africa',
    description: "Fynbos and cliffside path to South Africa's dramatic southernmost tip.",
    photoUrl:
      'https://images.unsplash.com/photo-1527421214132-5f2469ca182d?w=900&q=68&auto=format&fit=crop',
    photo: require('../../assets/trails/trail-07.jpg'),
    location: { latitude: -34.3568, longitude: 18.4881 },
    path: [
      { latitude: -34.341, longitude: 18.479 },
      { latitude: -34.349, longitude: 18.4835 },
      { latitude: -34.3568, longitude: 18.4881 },
    ],
  },
  {
    id: 'silvermine',
    name: 'Silvermine Nature Reserve Loop',
    difficulty: 'easy',
    distanceM: 6200,
    elevationGainM: 220,
    region: 'Cape Town, South Africa',
    description: 'Reservoir loop through fynbos with panoramic views to both oceans.',
    photoUrl:
      'https://images.unsplash.com/photo-1558734918-dfc4fe470147?w=900&q=68&auto=format&fit=crop',
    photo: require('../../assets/trails/trail-08.jpg'),
    location: { latitude: -34.0958, longitude: 18.4114 },
    path: [
      { latitude: -34.093, longitude: 18.408 },
      { latitude: -34.0945, longitude: 18.41 },
      { latitude: -34.0958, longitude: 18.4114 },
    ],
  },
  {
    id: 'kasteelspoort',
    name: 'Kasteelspoort',
    difficulty: 'moderate',
    distanceM: 7000,
    elevationGainM: 550,
    region: 'Cape Town, South Africa',
    description: 'Steep ravine ascent to the Table Mountain plateau above Camps Bay.',
    photoUrl:
      'https://images.unsplash.com/photo-1560199738-3d933bc1e714?w=900&q=68&auto=format&fit=crop',
    photo: require('../../assets/trails/trail-09.jpg'),
    location: { latitude: -33.966, longitude: 18.3865 },
    path: [
      { latitude: -33.961, longitude: 18.383 },
      { latitude: -33.9635, longitude: 18.385 },
      { latitude: -33.966, longitude: 18.3865 },
    ],
  },
  {
    id: 'elephants-eye',
    name: "Elephant's Eye Cave",
    difficulty: 'moderate',
    distanceM: 6500,
    elevationGainM: 380,
    region: 'Tokai, South Africa',
    description: 'Forest and fynbos climb to a cave overlooking the Cape Flats.',
    photoUrl:
      'https://images.unsplash.com/photo-1562593028-1fe2d15bde36?w=900&q=68&auto=format&fit=crop',
    photo: require('../../assets/trails/trail-10.jpg'),
    location: { latitude: -34.0651, longitude: 18.4212 },
    path: [
      { latitude: -34.06, longitude: 18.418 },
      { latitude: -34.0625, longitude: 18.4195 },
      { latitude: -34.0651, longitude: 18.4212 },
    ],
  },
  {
    id: 'table-mountain-india',
    name: 'India Venster',
    difficulty: 'hard',
    distanceM: 5000,
    elevationGainM: 720,
    region: 'Cape Town, South Africa',
    description:
      "Scrambly, exposed route up Table Mountain's front face. Chains and ladders required.",
    photoUrl:
      'https://images.unsplash.com/photo-1568226292321-dd67ff8b3b2b?w=900&q=68&auto=format&fit=crop',
    photo: require('../../assets/trails/trail-11.jpg'),
    location: { latitude: -33.96, longitude: 18.402 },
    path: [
      { latitude: -33.956, longitude: 18.399 },
      { latitude: -33.958, longitude: 18.4005 },
      { latitude: -33.96, longitude: 18.402 },
    ],
  },
  {
    id: 'newlands-forest',
    name: 'Newlands Forest Contour',
    difficulty: 'easy',
    distanceM: 5500,
    elevationGainM: 180,
    region: 'Cape Town, South Africa',
    description: 'Shaded forest path popular with trail runners and families.',
    photoUrl:
      'https://images.unsplash.com/photo-1584907600887-9732fa3647ac?w=900&q=68&auto=format&fit=crop',
    photo: require('../../assets/trails/trail-12.jpg'),
    location: { latitude: -33.976, longitude: 18.447 },
    path: [
      { latitude: -33.973, longitude: 18.444 },
      { latitude: -33.9745, longitude: 18.4455 },
      { latitude: -33.976, longitude: 18.447 },
    ],
  },
  {
    id: 'drakensberg-amphitheatre',
    name: 'Amphitheatre & Tugela Falls',
    difficulty: 'hard',
    distanceM: 14000,
    elevationGainM: 900,
    region: 'Drakensberg, South Africa',
    description: "Chain ladder ascent to the top of the world's second-highest waterfall.",
    photoUrl:
      'https://images.unsplash.com/photo-1587951326187-c9baa4606bff?w=900&q=68&auto=format&fit=crop',
    photo: require('../../assets/trails/trail-13.jpg'),
    location: { latitude: -28.75, longitude: 28.9167 },
    path: [
      { latitude: -28.762, longitude: 28.905 },
      { latitude: -28.756, longitude: 28.911 },
      { latitude: -28.75, longitude: 28.9167 },
    ],
  },
  {
    id: 'sentinel-peak',
    name: 'Sentinel Peak Trail',
    difficulty: 'moderate',
    distanceM: 12000,
    elevationGainM: 550,
    region: 'Drakensberg, South Africa',
    description: 'Grassland approach into the Royal Natal amphitheatre.',
    photoUrl:
      'https://images.unsplash.com/photo-1592859600972-1b0834d83747?w=900&q=68&auto=format&fit=crop',
    photo: require('../../assets/trails/trail-14.jpg'),
    location: { latitude: -28.735, longitude: 28.935 },
    path: [
      { latitude: -28.745, longitude: 28.925 },
      { latitude: -28.74, longitude: 28.93 },
      { latitude: -28.735, longitude: 28.935 },
    ],
  },
  {
    id: 'giants-castle',
    name: "Giant's Castle Main Caves",
    difficulty: 'moderate',
    distanceM: 8000,
    elevationGainM: 400,
    region: 'Drakensberg, South Africa',
    description: 'River valley walk to San rock art in the Drakensberg foothills.',
    photoUrl:
      'https://images.unsplash.com/photo-1595202761821-57d3a4e5dc9f?w=900&q=68&auto=format&fit=crop',
    photo: require('../../assets/trails/trail-15.jpg'),
    location: { latitude: -29.2667, longitude: 29.5 },
    path: [
      { latitude: -29.272, longitude: 29.495 },
      { latitude: -29.2695, longitude: 29.4975 },
      { latitude: -29.2667, longitude: 29.5 },
    ],
  },
  {
    id: 'otter-trail-day1',
    name: 'Otter Trail: Day 1',
    difficulty: 'moderate',
    distanceM: 4800,
    elevationGainM: 300,
    region: 'Garden Route, South Africa',
    description:
      "Storms River Mouth to Ngubu huts along one of Africa's most famous coastal trails.",
    photoUrl:
      'https://images.unsplash.com/photo-1597120590849-a1d5a743d155?w=900&q=68&auto=format&fit=crop',
    photo: require('../../assets/trails/trail-16.jpg'),
    location: { latitude: -34.0333, longitude: 23.8833 },
    path: [
      { latitude: -34.028, longitude: 23.89 },
      { latitude: -34.0305, longitude: 23.8865 },
      { latitude: -34.0333, longitude: 23.8833 },
    ],
  },
  {
    id: 'wolfberg-cracks',
    name: 'Wolfberg Cracks & Arch',
    difficulty: 'moderate',
    distanceM: 8500,
    elevationGainM: 400,
    region: 'Cederberg, South Africa',
    description: 'Squeeze through sandstone cracks to a natural rock arch with valley views.',
    photoUrl:
      'https://images.unsplash.com/photo-1600006293309-fe0a623de0a3?w=900&q=68&auto=format&fit=crop',
    photo: require('../../assets/trails/trail-17.jpg'),
    location: { latitude: -32.4167, longitude: 19.25 },
    path: [
      { latitude: -32.41, longitude: 19.245 },
      { latitude: -32.4135, longitude: 19.2475 },
      { latitude: -32.4167, longitude: 19.25 },
    ],
  },
  {
    id: 'maltese-cross',
    name: 'Maltese Cross',
    difficulty: 'easy',
    distanceM: 7000,
    elevationGainM: 250,
    region: 'Cederberg, South Africa',
    description: 'Flat valley walk to a 20-metre freestanding rock pillar.',
    photoUrl:
      'https://images.unsplash.com/photo-1616494268339-f49a1c4ac8f8?w=900&q=68&auto=format&fit=crop',
    photo: require('../../assets/trails/trail-18.jpg'),
    location: { latitude: -32.45, longitude: 19.2333 },
    path: [
      { latitude: -32.445, longitude: 19.228 },
      { latitude: -32.4475, longitude: 19.2305 },
      { latitude: -32.45, longitude: 19.2333 },
    ],
  },
  {
    id: 'sani-pass-summit',
    name: 'Sani Pass Summit Walk',
    difficulty: 'hard',
    distanceM: 6000,
    elevationGainM: 500,
    region: 'Drakensberg, South Africa/Lesotho',
    description: 'High-altitude walk near the Lesotho border, starting above 2,800m.',
    photoUrl:
      'https://images.unsplash.com/photo-1616878443605-aca041c01763?w=900&q=68&auto=format&fit=crop',
    photo: require('../../assets/trails/trail-19.jpg'),
    location: { latitude: -29.5833, longitude: 29.2833 },
    path: [
      { latitude: -29.59, longitude: 29.278 },
      { latitude: -29.5865, longitude: 29.2805 },
      { latitude: -29.5833, longitude: 29.2833 },
    ],
  },
  {
    id: 'hoerikwaggo-orange-kloof',
    name: 'Orange Kloof',
    difficulty: 'moderate',
    distanceM: 9000,
    elevationGainM: 480,
    region: 'Cape Town, South Africa',
    description: 'Pristine indigenous forest section of the Hoerikwaggo Trail. Permit required.',
    photoUrl:
      'https://images.unsplash.com/photo-1621960531176-9e4894d9adf8?w=900&q=68&auto=format&fit=crop',
    photo: require('../../assets/trails/trail-20.jpg'),
    location: { latitude: -34.0, longitude: 18.3833 },
    path: [
      { latitude: -33.995, longitude: 18.379 },
      { latitude: -33.9975, longitude: 18.381 },
      { latitude: -34.0, longitude: 18.3833 },
    ],
  },
  {
    id: 'harold-porter',
    name: 'Harold Porter Waterfall Trail',
    difficulty: 'easy',
    distanceM: 3000,
    elevationGainM: 120,
    region: "Betty's Bay, South Africa",
    description: 'Short, family-friendly walk to a fynbos waterfall in a botanical garden.',
    photoUrl:
      'https://images.unsplash.com/photo-1626436808209-c5093d1a0f75?w=900&q=68&auto=format&fit=crop',
    photo: require('../../assets/trails/trail-21.jpg'),
    location: { latitude: -34.355, longitude: 18.9167 },
    path: [
      { latitude: -34.353, longitude: 18.914 },
      { latitude: -34.354, longitude: 18.9155 },
      { latitude: -34.355, longitude: 18.9167 },
    ],
  },
  {
    id: 'boosmansbos',
    name: 'Boosmansbos Wilderness Trail',
    difficulty: 'hard',
    distanceM: 16000,
    elevationGainM: 850,
    region: 'Langeberg, South Africa',
    description: 'Remote two-day wilderness route through ancient afromontane forest.',
    photoUrl:
      'https://images.unsplash.com/photo-1631635490744-229e551afade?w=900&q=68&auto=format&fit=crop',
    photo: require('../../assets/trails/trail-22.jpg'),
    location: { latitude: -33.9667, longitude: 20.6667 },
    path: [
      { latitude: -33.96, longitude: 20.66 },
      { latitude: -33.9635, longitude: 20.6635 },
      { latitude: -33.9667, longitude: 20.6667 },
    ],
  },
  {
    id: 'blyde-river-canyon',
    name: 'Blyde River Canyon Rim',
    difficulty: 'moderate',
    distanceM: 11000,
    elevationGainM: 400,
    region: 'Mpumalanga, South Africa',
    description: 'Rim-side path above one of the largest green canyons on Earth.',
    photoUrl:
      'https://images.unsplash.com/photo-1663524962870-68df7698b909?w=900&q=68&auto=format&fit=crop',
    photo: require('../../assets/trails/trail-23.jpg'),
    location: { latitude: -24.5833, longitude: 30.8 },
    path: [
      { latitude: -24.59, longitude: 30.795 },
      { latitude: -24.5865, longitude: 30.7975 },
      { latitude: -24.5833, longitude: 30.8 },
    ],
  },
  {
    id: 'mont-aux-sources',
    name: 'Mont-aux-Sources',
    difficulty: 'hard',
    distanceM: 15000,
    elevationGainM: 950,
    region: 'Drakensberg, South Africa',
    description: 'Iconic chain-ladder route to the source of five major rivers.',
    photoUrl:
      'https://images.unsplash.com/photo-1663524963924-4d84fd7204b5?w=900&q=68&auto=format&fit=crop',
    photo: require('../../assets/trails/trail-24.jpg'),
    location: { latitude: -28.6833, longitude: 28.9 },
    path: [
      { latitude: -28.692, longitude: 28.892 },
      { latitude: -28.6875, longitude: 28.896 },
      { latitude: -28.6833, longitude: 28.9 },
    ],
  },
];
