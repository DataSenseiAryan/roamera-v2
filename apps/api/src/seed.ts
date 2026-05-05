import bcrypt from 'bcryptjs';
import crypto from 'crypto';

import { db } from './db/client';
import { users, destinations, follows, userSettings } from './db/schema';

const PASSWORD = 'password123';

const demoUsers = [
  {
    username: 'arya_explorer',
    email: 'arya@demo.roamera.in',
    bio: 'Solo traveler from Delhi. Mountains are my therapy.',
    homeCity: 'New Delhi, India',
    budgetBand: 'mid_range' as const,
    interests: ['treks', 'photography', 'culture'],
  },
  {
    username: 'marco_travels',
    email: 'marco@demo.roamera.in',
    bio: 'Italian backpacker exploring Asia one country at a time.',
    homeCity: 'Rome, Italy',
    budgetBand: 'backpacker' as const,
    interests: ['food', 'adventure', 'history'],
  },
  {
    username: 'leo_backpacker',
    email: 'leo@demo.roamera.in',
    bio: 'Beach bum and sunset chaser. Currently in Southeast Asia.',
    homeCity: 'São Paulo, Brazil',
    budgetBand: 'backpacker' as const,
    interests: ['beaches', 'nightlife', 'adventure'],
  },
  {
    username: 'ana_nomad',
    email: 'ana@demo.roamera.in',
    bio: 'Digital nomad. Working from cafes around the world.',
    homeCity: 'Barcelona, Spain',
    budgetBand: 'mid_range' as const,
    interests: ['cafes', 'workation', 'wellness'],
  },
  {
    username: 'kenji_wanders',
    email: 'kenji@demo.roamera.in',
    bio: 'Wildlife photographer. On a mission to visit every national park.',
    homeCity: 'Tokyo, Japan',
    budgetBand: 'luxury' as const,
    interests: ['wildlife', 'photography', 'treks'],
  },
];

const seedDestinations = [
  { name: 'Manali', country: 'India', category: 'mountains', description: 'Gateway to the Himalayas with stunning valleys and adventure sports.', lat: '32.2396', lng: '77.1887', isFeatured: true },
  { name: 'Goa', country: 'India', category: 'beaches', description: 'Sun-kissed beaches, Portuguese architecture, and vibrant nightlife.', lat: '15.2993', lng: '74.1240', isFeatured: true },
  { name: 'Jaipur', country: 'India', category: 'culture', description: 'The Pink City — royal palaces, colorful bazaars, and rich history.', lat: '26.9124', lng: '75.7873', isFeatured: true },
  { name: 'Rishikesh', country: 'India', category: 'adventure', description: 'Yoga capital and adventure hub on the banks of the Ganges.', lat: '30.0869', lng: '78.2676', isFeatured: false },
  { name: 'Ladakh', country: 'India', category: 'mountains', description: 'High-altitude desert with dramatic landscapes and Buddhist monasteries.', lat: '34.1526', lng: '77.5771', isFeatured: true },
  { name: 'Kerala', country: 'India', category: 'nature', description: 'God\'s Own Country — backwaters, tea plantations, and Ayurveda.', lat: '10.8505', lng: '76.2711', isFeatured: false },
  { name: 'Varanasi', country: 'India', category: 'culture', description: 'One of the world\'s oldest living cities on the sacred Ganges.', lat: '25.3176', lng: '83.0064', isFeatured: false },
  { name: 'Andaman Islands', country: 'India', category: 'beaches', description: 'Pristine beaches, coral reefs, and turquoise waters.', lat: '11.7401', lng: '92.6586', isFeatured: false },
  { name: 'Bali', country: 'Indonesia', category: 'beaches', description: 'Tropical paradise with temples, rice terraces, and surf.', lat: '-8.3405', lng: '115.0920', isFeatured: true },
  { name: 'Tokyo', country: 'Japan', category: 'culture', description: 'Ultra-modern meets ancient tradition in the world\'s largest city.', lat: '35.6762', lng: '139.6503', isFeatured: true },
  { name: 'Santorini', country: 'Greece', category: 'beaches', description: 'Iconic white-washed buildings overlooking the Aegean Sea.', lat: '36.3932', lng: '25.4615', isFeatured: false },
  { name: 'Machu Picchu', country: 'Peru', category: 'adventure', description: 'Ancient Incan citadel set high in the Andes mountains.', lat: '-13.1631', lng: '-72.5450', isFeatured: true },
  { name: 'Iceland', country: 'Iceland', category: 'nature', description: 'Northern lights, glaciers, volcanoes, and geothermal springs.', lat: '64.9631', lng: '-19.0208', isFeatured: false },
  { name: 'Marrakech', country: 'Morocco', category: 'culture', description: 'Vibrant souks, riads, and the Atlas Mountains at the doorstep.', lat: '31.6295', lng: '-7.9811', isFeatured: false },
  { name: 'Kyoto', country: 'Japan', category: 'culture', description: 'Ancient capital with over 2000 temples and traditional geisha districts.', lat: '35.0116', lng: '135.7681', isFeatured: false },
];

async function seed() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const createdUsers: Array<typeof users.$inferSelect> = [];

  for (const u of demoUsers) {
    const id = crypto.randomUUID();
    const [user] = await db.insert(users).values({
      id,
      username: u.username,
      email: u.email,
      passwordHash,
      emailVerified: true,
      bio: u.bio,
      homeCity: u.homeCity,
      budgetBand: u.budgetBand,
      interests: u.interests,
      role: 'user',
    }).onConflictDoNothing().returning();

    if (user) {
      createdUsers.push(user);
      console.log(`  Created user: ${u.username}`);
    } else {
      const existing = await db.query.users.findFirst({
        where: (t, { eq }) => eq(t.username, u.username),
      });
      if (existing) createdUsers.push(existing);
      console.log(`  User already exists: ${u.username}`);
    }
  }

  // Seed destinations
  for (const d of seedDestinations) {
    await db.insert(destinations).values({
      id: crypto.randomUUID(),
      name: d.name,
      country: d.country,
      category: d.category,
      description: d.description,
      lat: d.lat,
      lng: d.lng,
      isFeatured: d.isFeatured,
    }).onConflictDoNothing();
  }
  console.log(`  Created ${seedDestinations.length} destinations`);

  // Seed follow relationships
  if (createdUsers.length >= 5) {
    const followPairs = [
      [0, 1], [0, 2], [0, 3],
      [1, 0], [1, 4],
      [2, 0], [2, 1], [2, 3],
      [3, 0], [3, 1], [3, 2], [3, 4],
      [4, 0], [4, 3],
    ];

    for (const [followerIdx, followingIdx] of followPairs) {
      await db.insert(follows).values({
        followerId: createdUsers[followerIdx].id,
        followingId: createdUsers[followingIdx].id,
      }).onConflictDoNothing();
    }
    console.log(`  Created ${followPairs.length} follow relationships`);
  }

  // Seed some user settings
  if (createdUsers.length > 0) {
    await db.insert(userSettings).values({
      userId: createdUsers[0].id,
      key: 'theme',
      value: 'dark',
    }).onConflictDoNothing();
    await db.insert(userSettings).values({
      userId: createdUsers[0].id,
      key: 'language',
      value: 'en',
    }).onConflictDoNothing();
    console.log('  Created user settings for arya_explorer');
  }

  console.log('Seed complete!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
