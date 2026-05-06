import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';

import { db } from './db/client';
import { users, destinations, follows, userSettings, posts, reactions, comments } from './db/schema';

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

  // Seed demo posts (2 per user)
  if (createdUsers.length >= 5) {
    const demoPosts = [
      {
        userIdx: 0, title: '3 Days in Manali',
        content: 'Perfect winter escape to the mountains. The snow-capped peaks and cozy cafes made it unforgettable.',
        destinations: [{ name: 'Manali', country: 'India', lat: '32.2396', lng: '77.1887' }],
        activities: ['trekking', 'skiing', 'cafe-hopping'],
        budgetInr: 15000, vacationType: 'adventure' as const, transportMode: 'bus' as const,
        hashtags: ['manali', 'mountains', 'winter', 'himachal'],
      },
      {
        userIdx: 0, title: 'Sunrise at Triund',
        content: 'Hiked up at 3 AM to catch the golden sunrise above the clouds. Worth every step.',
        destinations: [{ name: 'Dharamshala', country: 'India', lat: '32.2190', lng: '76.3234' }],
        activities: ['trekking', 'photography', 'camping'],
        budgetInr: 5000, vacationType: 'adventure' as const, transportMode: 'backpack' as const,
        hashtags: ['triund', 'trek', 'sunrise', 'hiking'],
      },
      {
        userIdx: 1, title: 'Street Food Tour in Delhi',
        content: 'From Chandni Chowk parathas to Connaught Place momos — a day of pure food indulgence.',
        destinations: [{ name: 'New Delhi', country: 'India', lat: '28.6139', lng: '77.2090' }],
        activities: ['food', 'walking-tour', 'photography'],
        budgetInr: 2000, vacationType: 'cultural' as const, transportMode: 'bus' as const,
        hashtags: ['delhi', 'streetfood', 'foodie', 'india'],
      },
      {
        userIdx: 1, title: 'Backpacking Through Rajasthan',
        content: 'Two weeks across Jaipur, Udaipur, and Jaisalmer. The colors, forts, and desert sunsets were magical.',
        destinations: [{ name: 'Jaipur', country: 'India', lat: '26.9124', lng: '75.7873' }],
        activities: ['sightseeing', 'photography', 'cultural'],
        budgetInr: 25000, vacationType: 'cultural' as const, transportMode: 'train' as const,
        hashtags: ['rajasthan', 'backpacking', 'forts', 'desert'],
      },
      {
        userIdx: 2, title: 'Bali Beach Vibes',
        content: 'Surfing at Kuta, temple visits in Ubud, and the most stunning rice terraces.',
        destinations: [{ name: 'Bali', country: 'Indonesia', lat: '-8.3405', lng: '115.0920' }],
        activities: ['surfing', 'temples', 'beaches'],
        budgetInr: 45000, vacationType: 'leisure' as const, transportMode: 'flight' as const,
        hashtags: ['bali', 'beach', 'surf', 'indonesia'],
      },
      {
        userIdx: 2, title: 'Goa on a Budget',
        content: 'South Goa beaches, local shacks, and scooter rides through palm-lined roads.',
        destinations: [{ name: 'Goa', country: 'India', lat: '15.2993', lng: '74.1240' }],
        activities: ['beaches', 'nightlife', 'scooter'],
        budgetInr: 8000, vacationType: 'leisure' as const, transportMode: 'train' as const,
        hashtags: ['goa', 'beach', 'budget', 'southgoa'],
      },
      {
        userIdx: 3, title: 'Workation in Rishikesh',
        content: 'Working from a riverside cafe with views of the Ganges. Perfect blend of work and yoga.',
        destinations: [{ name: 'Rishikesh', country: 'India', lat: '30.0869', lng: '78.2676' }],
        activities: ['yoga', 'workation', 'rafting'],
        budgetInr: 12000, vacationType: 'workation' as const, transportMode: 'bus' as const,
        hashtags: ['rishikesh', 'workation', 'yoga', 'digitalnomad'],
      },
      {
        userIdx: 3, title: 'Cafe Hopping in Barcelona',
        content: 'Found the best coworking cafes while exploring Gaudí architecture and Gothic Quarter.',
        destinations: [{ name: 'Barcelona', country: 'Spain' }],
        activities: ['cafes', 'architecture', 'walking'],
        budgetInr: 60000, vacationType: 'workation' as const, transportMode: 'flight' as const,
        hashtags: ['barcelona', 'cafes', 'gaudi', 'spain'],
      },
      {
        userIdx: 4, title: 'Wildlife Safari in Ranthambore',
        content: 'Spotted a tiger on the third safari! The golden hour light made for incredible shots.',
        destinations: [{ name: 'Ranthambore', country: 'India', lat: '26.0173', lng: '76.5026' }],
        activities: ['wildlife', 'photography', 'safari'],
        budgetInr: 20000, vacationType: 'wildlife' as const, transportMode: 'train' as const,
        hashtags: ['ranthambore', 'tiger', 'wildlife', 'safari'],
      },
      {
        userIdx: 4, title: 'Cherry Blossoms in Kyoto',
        content: 'Visited 8 temples in bloom season. The Philosopher\'s Path was a dream in pink.',
        destinations: [{ name: 'Kyoto', country: 'Japan', lat: '35.0116', lng: '135.7681' }],
        activities: ['photography', 'temples', 'gardens'],
        budgetInr: 80000, vacationType: 'cultural' as const, transportMode: 'flight' as const,
        hashtags: ['kyoto', 'cherryblossoms', 'japan', 'temples'],
      },
    ];

    for (const dp of demoPosts) {
      const postId = crypto.randomUUID();
      await db.insert(posts).values({
        id: postId,
        userId: createdUsers[dp.userIdx].id,
        title: dp.title,
        content: dp.content,
        destinations: dp.destinations,
        activities: dp.activities,
        budgetInr: dp.budgetInr,
        vacationType: dp.vacationType,
        transportMode: dp.transportMode,
        hashtags: dp.hashtags,
      }).onConflictDoNothing();
    }
    console.log(`  Created ${demoPosts.length} demo posts`);

    // Add some reactions
    const allPosts = await db.select().from(posts).limit(10);
    const reactionTypes = ['love', 'epic', 'wander', 'wanna_go', 'amazing'] as const;
    for (let i = 0; i < Math.min(allPosts.length, 10); i++) {
      const reactorIdx = (i + 1) % createdUsers.length;
      await db.insert(reactions).values({
        postId: allPosts[i].id,
        userId: createdUsers[reactorIdx].id,
        type: reactionTypes[i % reactionTypes.length],
      }).onConflictDoNothing();
    }
    console.log('  Created demo reactions');

    // Add some comments
    if (allPosts.length >= 2) {
      await db.insert(comments).values({
        postId: allPosts[0].id,
        userId: createdUsers[1].id,
        content: 'This looks amazing! Adding to my bucket list.',
      }).onConflictDoNothing();
      await db.insert(comments).values({
        postId: allPosts[0].id,
        userId: createdUsers[2].id,
        content: 'How was the weather? Planning a similar trip!',
      }).onConflictDoNothing();
      await db.insert(comments).values({
        postId: allPosts[1].id,
        userId: createdUsers[3].id,
        content: 'Great photography! What camera did you use?',
      }).onConflictDoNothing();
      console.log('  Created demo comments');
    }

    // Update post counts
    for (const p of allPosts) {
      const reactionCount = await db.select().from(reactions).where(eq(reactions.postId, p.id));
      const commentCount = await db.select().from(comments).where(eq(comments.postId, p.id));
      await db.update(posts).set({
        likesCount: reactionCount.length,
        commentsCount: commentCount.length,
      }).where(eq(posts.id, p.id));
    }
    console.log('  Updated post counts');
  }

  console.log('Seed complete!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
