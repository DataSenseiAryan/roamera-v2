import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';

import { db } from './db/client';
import {
  users,
  destinations,
  follows,
  userSettings,
  posts,
  reactions,
  comments,
  trips,
  tripMembers,
  days,
  places,
  dayAssignments,
  dayNotes,
  packingLists,
  packingCategories,
  packingItems,
  packingBags,
  packingTemplates,
  packingTemplateCats,
  packingTemplateItems,
  budgetItems,
  budgetItemMembers,
  settlements,
  circles,
  circleMembers,
  circleMessages,
  circleMessageReactions,
  circlePolls,
  circlePollVotes,
  collabMessages,
  collabNotes,
  collabPolls,
  collabPollVotes,
  expenseGroups,
  expenseGroupMembers,
  expenses,
  expenseSplits,
  groupSettlements,
  journeys,
  journeyEntries,
  journeyContributors,
  visitedCountries,
  userBadges,
  notifications,
  systemNotices,
} from './db/schema';

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

  // ─── Sprint 4: Demo Trips ────────────────────────────────────────
  if (createdUsers.length >= 2) {
    const existingTrips = await db.select().from(trips).limit(1);
    if (existingTrips.length === 0) {
      const tripData = [
        {
          id: crypto.randomUUID(),
          ownerId: createdUsers[0].id,
          title: 'Rajasthan Heritage Tour',
          description: 'A week-long journey through the palaces and forts of Rajasthan.',
          dateFrom: new Date('2026-11-01'),
          dateTo: new Date('2026-11-07'),
          currency: 'INR',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          ownerId: createdUsers[2].id,
          title: 'Goa Beach Getaway',
          description: 'Sun, sand, and seafood — the perfect tropical escape.',
          dateFrom: new Date('2026-12-20'),
          dateTo: new Date('2026-12-25'),
          currency: 'INR',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      for (const trip of tripData) {
        await db.insert(trips).values(trip).onConflictDoNothing();
      }

      // Trip 1 — Rajasthan: add owner + one member
      await db.insert(tripMembers).values([
        { tripId: tripData[0].id, userId: createdUsers[0].id, role: 'owner', createdAt: new Date() },
        { tripId: tripData[0].id, userId: createdUsers[1].id, role: 'editor', invitedBy: createdUsers[0].id, createdAt: new Date() },
      ]).onConflictDoNothing();

      // Trip 2 — Goa
      await db.insert(tripMembers).values([
        { tripId: tripData[1].id, userId: createdUsers[2].id, role: 'owner', createdAt: new Date() },
        { tripId: tripData[1].id, userId: createdUsers[3].id, role: 'viewer', invitedBy: createdUsers[2].id, createdAt: new Date() },
      ]).onConflictDoNothing();

      // Days for Trip 1 — Rajasthan (4 days)
      const rajDays = [
        { id: crypto.randomUUID(), tripId: tripData[0].id, dayNumber: 1, title: 'Arrival in Jaipur', date: new Date('2026-11-01'), notes: 'Check in early, explore the city centre.' },
        { id: crypto.randomUUID(), tripId: tripData[0].id, dayNumber: 2, title: 'Amber Fort & City Palace', date: new Date('2026-11-02'), notes: null },
        { id: crypto.randomUUID(), tripId: tripData[0].id, dayNumber: 3, title: 'Jodhpur — Blue City', date: new Date('2026-11-03'), notes: null },
        { id: crypto.randomUUID(), tripId: tripData[0].id, dayNumber: 4, title: 'Udaipur — City of Lakes', date: new Date('2026-11-04'), notes: 'Boat ride on Lake Pichola at sunset.' },
      ];

      for (const day of rajDays) {
        await db.insert(days).values(day).onConflictDoNothing();
      }

      // Days for Trip 2 — Goa (3 days)
      const goaDays = [
        { id: crypto.randomUUID(), tripId: tripData[1].id, dayNumber: 1, title: 'Arrival & North Goa', date: new Date('2026-12-20'), notes: 'Head straight to Baga Beach.' },
        { id: crypto.randomUUID(), tripId: tripData[1].id, dayNumber: 2, title: 'Old Goa & Spice Plantation', date: new Date('2026-12-21'), notes: null },
        { id: crypto.randomUUID(), tripId: tripData[1].id, dayNumber: 3, title: 'South Goa & Relaxation', date: new Date('2026-12-22'), notes: 'Palolem Beach is a must.' },
      ];

      for (const day of goaDays) {
        await db.insert(days).values(day).onConflictDoNothing();
      }

      // Places for Trip 1 — Rajasthan (no categoryId FK — use null)
      const rajPlaces = [
        { id: crypto.randomUUID(), tripId: tripData[0].id, name: 'Amber Fort', lat: '26.9855', lng: '75.8513', address: 'Amber, Jaipur, Rajasthan', notes: 'Arrive early to avoid crowds.' },
        { id: crypto.randomUUID(), tripId: tripData[0].id, name: 'City Palace Jaipur', lat: '26.9258', lng: '75.8237', address: 'Tulsi Marg, Gangori Bazaar, Jaipur', notes: null },
        { id: crypto.randomUUID(), tripId: tripData[0].id, name: 'Mehrangarh Fort', lat: '26.2979', lng: '73.0185', address: 'Fort Rd, Jodhpur, Rajasthan', notes: 'Best views of the blue city from here.' },
        { id: crypto.randomUUID(), tripId: tripData[0].id, name: 'Lake Pichola', lat: '24.5754', lng: '73.6801', address: 'Udaipur, Rajasthan', notes: null },
        { id: crypto.randomUUID(), tripId: tripData[0].id, name: 'Chokhi Dhani Restaurant', lat: '26.8059', lng: '75.7623', address: 'Via Tonk Rd, Jaipur', notes: 'Authentic Rajasthani thali experience.' },
      ];

      for (const place of rajPlaces) {
        await db.insert(places).values({ ...place, createdAt: new Date() }).onConflictDoNothing();
      }

      // Assignments — link places to days (Trip 1)
      await db.insert(dayAssignments).values([
        { id: crypto.randomUUID(), tripId: tripData[0].id, dayId: rajDays[1].id, placeId: rajPlaces[0].id, orderIndex: 0, placeTime: '09:00', durationMinutes: 180, notes: 'Book elephant ride in advance.' },
        { id: crypto.randomUUID(), tripId: tripData[0].id, dayId: rajDays[1].id, placeId: rajPlaces[1].id, orderIndex: 1, placeTime: '13:00', durationMinutes: 120, notes: null },
        { id: crypto.randomUUID(), tripId: tripData[0].id, dayId: rajDays[1].id, placeId: rajPlaces[4].id, orderIndex: 2, placeTime: '19:00', durationMinutes: 90, notes: null },
        { id: crypto.randomUUID(), tripId: tripData[0].id, dayId: rajDays[2].id, placeId: rajPlaces[2].id, orderIndex: 0, placeTime: '10:00', durationMinutes: 120, notes: null },
        { id: crypto.randomUUID(), tripId: tripData[0].id, dayId: rajDays[3].id, placeId: rajPlaces[3].id, orderIndex: 0, placeTime: '17:00', durationMinutes: 60, notes: 'Book boat tickets ahead.' },
      ]).onConflictDoNothing();

      // Day notes
      await db.insert(dayNotes).values([
        { id: crypto.randomUUID(), dayId: rajDays[0].id, text: 'Hotel check-in at 2pm. Rickshaw from airport.', time: '14:00', icon: '🏨', sortOrder: 0 },
        { id: crypto.randomUUID(), dayId: rajDays[1].id, text: 'Carry water and wear comfortable shoes.', time: null, icon: '💧', sortOrder: 0 },
      ]).onConflictDoNothing();

      // Places for Trip 2 — Goa (no categoryId FK — use null)
      const goaPlaces = [
        { id: crypto.randomUUID(), tripId: tripData[1].id, name: 'Baga Beach', lat: '15.5573', lng: '73.7520', address: 'Baga, North Goa', notes: 'Best beach in North Goa for nightlife.' },
        { id: crypto.randomUUID(), tripId: tripData[1].id, name: 'Basilica of Bom Jesus', lat: '15.5009', lng: '73.9116', address: 'Old Goa', notes: 'UNESCO World Heritage Site.' },
        { id: crypto.randomUUID(), tripId: tripData[1].id, name: 'Palolem Beach', lat: '15.0100', lng: '74.0232', address: 'Palolem, South Goa', notes: 'One of the most beautiful beaches in India.' },
        { id: crypto.randomUUID(), tripId: tripData[1].id, name: 'Thalassa Greek Restaurant', lat: '15.5490', lng: '73.7597', address: 'Vagator, North Goa', notes: 'Sunset views + Greek-Mediterranean fusion.' },
      ];

      for (const place of goaPlaces) {
        await db.insert(places).values({ ...place, createdAt: new Date() }).onConflictDoNothing();
      }

      await db.insert(dayAssignments).values([
        { id: crypto.randomUUID(), tripId: tripData[1].id, dayId: goaDays[0].id, placeId: goaPlaces[0].id, orderIndex: 0, placeTime: '15:00', durationMinutes: 180, notes: null },
        { id: crypto.randomUUID(), tripId: tripData[1].id, dayId: goaDays[0].id, placeId: goaPlaces[3].id, orderIndex: 1, placeTime: '19:30', durationMinutes: 120, notes: 'Reservations recommended.' },
        { id: crypto.randomUUID(), tripId: tripData[1].id, dayId: goaDays[1].id, placeId: goaPlaces[1].id, orderIndex: 0, placeTime: '10:00', durationMinutes: 90, notes: null },
        { id: crypto.randomUUID(), tripId: tripData[1].id, dayId: goaDays[2].id, placeId: goaPlaces[2].id, orderIndex: 0, placeTime: '09:00', durationMinutes: 240, notes: 'Full day at the beach.' },
      ]).onConflictDoNothing();

      console.log('  Created 2 demo trips with days, places, and assignments');
    } else {
      console.log('  Trips already seeded — skipping');
    }
  }

  // ─── Sprint 5: Packing templates, trip budget, splits, settlement, packing list ─
  const rajTrip = await db.query.trips.findFirst({
    where: (t, { eq: e }) => e(t.title, 'Rajasthan Heritage Tour'),
  });

  const aryaUser = createdUsers.find((u) => u.username === 'arya_explorer');
  const marcoUser = createdUsers.find((u) => u.username === 'marco_travels');

  if (rajTrip && aryaUser && marcoUser) {
    const existingBudgetItems = await db.select().from(budgetItems).where(eq(budgetItems.tripId, rajTrip.id));

    if (existingBudgetItems.length === 0) {
      // Admin packing templates
      const beachTplId = crypto.randomUUID();
      const mountainTplId = crypto.randomUUID();

      await db.insert(packingTemplates).values([
        { id: beachTplId, name: 'Beach Vacation', description: 'Sun, sand, and swim-ready essentials.', createdBy: null },
        { id: mountainTplId, name: 'Mountain Trek', description: 'High-altitude trekking checklist.', createdBy: null },
      ]).onConflictDoNothing();

      const beachClothingCat = crypto.randomUUID();
      const beachToiletriesCat = crypto.randomUUID();
      const beachElectronicsCat = crypto.randomUUID();

      await db.insert(packingTemplateCats).values([
        { id: beachClothingCat, templateId: beachTplId, name: 'Clothing', sortOrder: 0 },
        { id: beachToiletriesCat, templateId: beachTplId, name: 'Toiletries', sortOrder: 1 },
        { id: beachElectronicsCat, templateId: beachTplId, name: 'Electronics', sortOrder: 2 },
      ]).onConflictDoNothing();

      await db.insert(packingTemplateItems).values([
        { id: crypto.randomUUID(), categoryId: beachClothingCat, name: 'Swimsuit', quantity: 1 },
        { id: crypto.randomUUID(), categoryId: beachClothingCat, name: 'Sunhat', quantity: 1 },
        { id: crypto.randomUUID(), categoryId: beachClothingCat, name: 'Sandals', quantity: 1 },
        { id: crypto.randomUUID(), categoryId: beachClothingCat, name: 'Beach wrap', quantity: 1 },
        { id: crypto.randomUUID(), categoryId: beachToiletriesCat, name: 'Sunscreen SPF 50', quantity: 1 },
        { id: crypto.randomUUID(), categoryId: beachToiletriesCat, name: 'Aloe vera gel', quantity: 1 },
        { id: crypto.randomUUID(), categoryId: beachToiletriesCat, name: 'Waterproof phone pouch', quantity: 1 },
        { id: crypto.randomUUID(), categoryId: beachElectronicsCat, name: 'Portable charger', quantity: 1 },
        { id: crypto.randomUUID(), categoryId: beachElectronicsCat, name: 'Camera', quantity: 1 },
      ]).onConflictDoNothing();

      const mountainClothingCat = crypto.randomUUID();
      const mountainGearCat = crypto.randomUUID();
      const mountainToiletriesCat = crypto.randomUUID();

      await db.insert(packingTemplateCats).values([
        { id: mountainClothingCat, templateId: mountainTplId, name: 'Clothing', sortOrder: 0 },
        { id: mountainGearCat, templateId: mountainTplId, name: 'Gear', sortOrder: 1 },
        { id: mountainToiletriesCat, templateId: mountainTplId, name: 'Toiletries', sortOrder: 2 },
      ]).onConflictDoNothing();

      await db.insert(packingTemplateItems).values([
        { id: crypto.randomUUID(), categoryId: mountainClothingCat, name: 'Hiking boots', quantity: 1 },
        { id: crypto.randomUUID(), categoryId: mountainClothingCat, name: 'Rain jacket', quantity: 1 },
        { id: crypto.randomUUID(), categoryId: mountainClothingCat, name: 'Thermal layers', quantity: 1 },
        { id: crypto.randomUUID(), categoryId: mountainClothingCat, name: 'Quick-dry pants', quantity: 1 },
        { id: crypto.randomUUID(), categoryId: mountainGearCat, name: 'Backpack 40L', quantity: 1 },
        { id: crypto.randomUUID(), categoryId: mountainGearCat, name: 'Trekking poles', quantity: 1 },
        { id: crypto.randomUUID(), categoryId: mountainGearCat, name: 'Headlamp', quantity: 1 },
        { id: crypto.randomUUID(), categoryId: mountainGearCat, name: 'First aid kit', quantity: 1 },
        { id: crypto.randomUUID(), categoryId: mountainToiletriesCat, name: 'Lip balm SPF', quantity: 1 },
        { id: crypto.randomUUID(), categoryId: mountainToiletriesCat, name: 'Sunscreen', quantity: 1 },
        { id: crypto.randomUUID(), categoryId: mountainToiletriesCat, name: 'Hand sanitizer', quantity: 1 },
      ]).onConflictDoNothing();

      // Rajasthan trip budget
      const biTrain = crypto.randomUUID();
      const biRickshaw = crypto.randomUUID();
      const biHotel = crypto.randomUUID();
      const biFood = crypto.randomUUID();
      const biActivities = crypto.randomUUID();
      const biShopping = crypto.randomUUID();

      await db.insert(budgetItems).values([
        { id: biTrain, tripId: rajTrip.id, category: 'Transport', name: 'Delhi to Jaipur train', totalPrice: '1200', currency: 'INR', persons: 2, days: 1, sortOrder: 0 },
        { id: biRickshaw, tripId: rajTrip.id, category: 'Transport', name: 'Local rickshaw rides', totalPrice: '500', currency: 'INR', persons: 2, days: 4, sortOrder: 1 },
        { id: biHotel, tripId: rajTrip.id, category: 'Accommodation', name: 'Haveli Heritage Hotel', totalPrice: '3500', currency: 'INR', persons: 2, days: 3, sortOrder: 2 },
        { id: biFood, tripId: rajTrip.id, category: 'Food', name: 'Street food & restaurants', totalPrice: '800', currency: 'INR', persons: 2, days: 4, sortOrder: 3 },
        { id: biActivities, tripId: rajTrip.id, category: 'Activities', name: 'Amber Fort entry', totalPrice: '500', currency: 'INR', persons: 2, days: 1, sortOrder: 4 },
        { id: biShopping, tripId: rajTrip.id, category: 'Shopping', name: 'Jaipur bazaar souvenirs', totalPrice: '2000', currency: 'INR', persons: 1, days: 1, sortOrder: 5 },
      ]).onConflictDoNothing();

      await db.insert(budgetItemMembers).values([
        { budgetItemId: biTrain, userId: aryaUser.id, amount: '600', isPaid: true },
        { budgetItemId: biTrain, userId: marcoUser.id, amount: '600', isPaid: false },
        { budgetItemId: biRickshaw, userId: aryaUser.id, amount: '250', isPaid: false },
        { budgetItemId: biRickshaw, userId: marcoUser.id, amount: '250', isPaid: true },
        { budgetItemId: biHotel, userId: aryaUser.id, amount: '1750', isPaid: true },
        { budgetItemId: biHotel, userId: marcoUser.id, amount: '1750', isPaid: true },
      ]).onConflictDoNothing();

      await db.insert(settlements).values({
        id: crypto.randomUUID(),
        tripId: rajTrip.id,
        fromUserId: aryaUser.id,
        toUserId: marcoUser.id,
        amount: '1500',
        currency: 'INR',
      }).onConflictDoNothing();

      // Rajasthan packing list + cabin bag
      const listId = crypto.randomUUID();
      await db.insert(packingLists).values({
        id: listId,
        tripId: rajTrip.id,
        title: 'Packing List',
      }).onConflictDoNothing();

      const catClothing = crypto.randomUUID();
      const catToiletries = crypto.randomUUID();
      const catDocuments = crypto.randomUUID();

      await db.insert(packingCategories).values([
        { id: catClothing, listId, name: 'Clothing', sortOrder: 0 },
        { id: catToiletries, listId, name: 'Toiletries', sortOrder: 1 },
        { id: catDocuments, listId, name: 'Documents', sortOrder: 2 },
      ]).onConflictDoNothing();

      await db.insert(packingItems).values([
        { id: crypto.randomUUID(), listId, categoryId: catClothing, name: 'Kurta', quantity: 1, isPacked: true, sortOrder: 0 },
        { id: crypto.randomUUID(), listId, categoryId: catClothing, name: 'Comfortable pants', quantity: 1, isPacked: true, sortOrder: 1 },
        { id: crypto.randomUUID(), listId, categoryId: catClothing, name: 'Sun hat', quantity: 1, isPacked: false, sortOrder: 2 },
        { id: crypto.randomUUID(), listId, categoryId: catClothing, name: 'Walking shoes', quantity: 1, isPacked: true, sortOrder: 3 },
        { id: crypto.randomUUID(), listId, categoryId: catToiletries, name: 'Sunscreen', quantity: 1, isPacked: false, sortOrder: 0 },
        { id: crypto.randomUUID(), listId, categoryId: catToiletries, name: 'Hand sanitizer', quantity: 1, isPacked: true, sortOrder: 1 },
        { id: crypto.randomUUID(), listId, categoryId: catToiletries, name: 'Wet wipes', quantity: 1, isPacked: false, sortOrder: 2 },
        { id: crypto.randomUUID(), listId, categoryId: catDocuments, name: 'ID proof', quantity: 1, isPacked: true, sortOrder: 0 },
        { id: crypto.randomUUID(), listId, categoryId: catDocuments, name: 'Hotel bookings printout', quantity: 1, isPacked: true, sortOrder: 1 },
        { id: crypto.randomUUID(), listId, categoryId: catDocuments, name: 'Train tickets', quantity: 1, isPacked: false, sortOrder: 2 },
      ]).onConflictDoNothing();

      await db.insert(packingBags).values({
        id: crypto.randomUUID(),
        listId,
        name: 'Cabin Bag',
        color: '#3B82F6',
        weightLimitKg: '7',
      }).onConflictDoNothing();

      console.log('  Seeded Sprint 5 demo (templates, Rajasthan budget, splits, settlement, packing)');
    } else {
      console.log('  Sprint 5 budget already present — skipping Sprint 5 seed');
    }
  }

  // ─── Sprint 6: Circles & trip collab ─────────────────────────────
  const existingCircles = await db.select().from(circles).limit(1);
  if (existingCircles.length === 0) {
    const aryaUser = createdUsers.find((u) => u.username === 'arya_explorer');
    const marcoUser = createdUsers.find((u) => u.username === 'marco_travels');
    const leoUser = createdUsers.find((u) => u.username === 'leo_backpacker');
    const anaUser = createdUsers.find((u) => u.username === 'ana_nomad');

    const rajTripRow = await db.query.trips.findFirst({
      where: (t, { eq: e }) => e(t.title, 'Rajasthan Heritage Tour'),
    });
    const goaTripRow = await db.query.trips.findFirst({
      where: (t, { eq: e }) => e(t.title, 'Goa Beach Getaway'),
    });

    if (aryaUser && marcoUser && leoUser && anaUser && rajTripRow && goaTripRow) {
      const circleRajId = crypto.randomUUID();
      const circleGoaId = crypto.randomUUID();

      await db.insert(circles).values([
        {
          id: circleRajId,
          ownerId: aryaUser.id,
          title: 'Rajasthan Road Trip Squad',
          description: 'Planning our epic Rajasthan heritage tour together',
          destination: 'Rajasthan, India',
          isPublic: true,
          linkedTripId: rajTripRow.id,
        },
        {
          id: circleGoaId,
          ownerId: marcoUser.id,
          title: 'Goa Beach Gang',
          description: 'Sun, sand and vibes - planning our Goa adventure',
          destination: 'Goa, India',
          isPublic: true,
          linkedTripId: goaTripRow.id,
        },
      ]).onConflictDoNothing();

      await db.insert(circleMembers).values([
        { circleId: circleRajId, userId: aryaUser.id, role: 'owner' },
        { circleId: circleRajId, userId: marcoUser.id, role: 'member' },
        { circleId: circleRajId, userId: leoUser.id, role: 'member' },
        { circleId: circleGoaId, userId: marcoUser.id, role: 'owner' },
        { circleId: circleGoaId, userId: aryaUser.id, role: 'member' },
        { circleId: circleGoaId, userId: anaUser.id, role: 'member' },
      ]).onConflictDoNothing();

      const rajMsg1 = crypto.randomUUID();
      const rajMsg2 = crypto.randomUUID();
      const rajMsg3 = crypto.randomUUID();
      const rajMsg4 = crypto.randomUUID();
      const rajMsg5 = crypto.randomUUID();

      await db.insert(circleMessages).values([
        { id: rajMsg1, circleId: circleRajId, userId: aryaUser.id, content: 'Hey team! Super excited for our Rajasthan trip 🎉' },
        { id: rajMsg2, circleId: circleRajId, userId: marcoUser.id, content: 'Can\'t wait! The Amber Fort is going to be amazing' },
        { id: rajMsg3, circleId: circleRajId, userId: leoUser.id, content: 'Should we hire a local guide? I heard it makes a huge difference' },
        { id: rajMsg4, circleId: circleRajId, userId: aryaUser.id, content: 'Great idea! Let me check reviews' },
        { id: rajMsg5, circleId: circleRajId, userId: marcoUser.id, content: 'Also, anyone know the best time to visit Hawa Mahal?' },
      ]).onConflictDoNothing();

      await db.insert(circleMessageReactions).values({
        messageId: rajMsg1,
        userId: marcoUser.id,
        emoji: '👍',
      }).onConflictDoNothing();

      const rajPollFortId = crypto.randomUUID();
      const rajPollTransportId = crypto.randomUUID();

      await db.insert(circlePolls).values([
        {
          id: rajPollFortId,
          circleId: circleRajId,
          userId: aryaUser.id,
          question: 'Which day should we visit Amber Fort?',
          optionsJson: ['Day 1 - Monday', 'Day 2 - Tuesday', 'Day 3 - Wednesday'],
          isMultiple: false,
          isClosed: false,
        },
        {
          id: rajPollTransportId,
          circleId: circleRajId,
          userId: aryaUser.id,
          question: 'What transport should we use?',
          optionsJson: ['Auto rickshaw', 'Private cab', 'Public bus'],
          isMultiple: false,
          isClosed: true,
        },
      ]).onConflictDoNothing();

      await db.insert(circlePollVotes).values([
        { pollId: rajPollFortId, userId: aryaUser.id, optionIndex: 0 },
        { pollId: rajPollFortId, userId: marcoUser.id, optionIndex: 1 },
        { pollId: rajPollTransportId, userId: aryaUser.id, optionIndex: 0 },
        { pollId: rajPollTransportId, userId: leoUser.id, optionIndex: 1 },
      ]).onConflictDoNothing();

      const goaMsg1 = crypto.randomUUID();
      const goaMsg2 = crypto.randomUUID();
      const goaMsg3 = crypto.randomUUID();
      const goaMsg4 = crypto.randomUUID();

      await db.insert(circleMessages).values([
        { id: goaMsg1, circleId: circleGoaId, userId: marcoUser.id, content: 'Welcome to the Goa planning group!' },
        { id: goaMsg2, circleId: circleGoaId, userId: aryaUser.id, content: 'So excited! Which beaches are on the itinerary?' },
        { id: goaMsg3, circleId: circleGoaId, userId: anaUser.id, content: 'Palolem and Agonda are must-visits for sunset vibes 🌅' },
        { id: goaMsg4, circleId: circleGoaId, userId: marcoUser.id, content: 'Perfect! Let\'s also plan a boat trip' },
      ]).onConflictDoNothing();

      const goaPollArriveId = crypto.randomUUID();

      await db.insert(circlePolls).values({
        id: goaPollArriveId,
        circleId: circleGoaId,
        userId: marcoUser.id,
        question: 'Best time to arrive in Goa?',
        optionsJson: ['Friday evening', 'Saturday morning', 'Saturday afternoon'],
        isMultiple: false,
        isClosed: false,
      }).onConflictDoNothing();

      await db.insert(circlePollVotes).values([
        { pollId: goaPollArriveId, userId: marcoUser.id, optionIndex: 0 },
        { pollId: goaPollArriveId, userId: aryaUser.id, optionIndex: 0 },
      ]).onConflictDoNothing();

      await db.insert(collabMessages).values([
        { id: crypto.randomUUID(), tripId: rajTripRow.id, userId: aryaUser.id, content: 'Let\'s use this chat to coordinate during the trip' },
        { id: crypto.randomUUID(), tripId: rajTripRow.id, userId: marcoUser.id, content: 'Good idea! I\'ll update here when I reach Jaipur' },
        { id: crypto.randomUUID(), tripId: rajTripRow.id, userId: leoUser.id, content: 'Don\'t forget to try the local street food at Johri Bazaar!' },
      ]).onConflictDoNothing();

      const nowNote = new Date();

      await db.insert(collabNotes).values([
        {
          id: crypto.randomUUID(),
          tripId: rajTripRow.id,
          userId: aryaUser.id,
          title: 'Important reminders',
          content: '- Carry cash for smaller shops\n- Avoid tap water\n- Sunscreen is a must!',
          category: 'Planning',
          color: '#fef9c3',
          isPinned: true,
          updatedAt: nowNote,
        },
        {
          id: crypto.randomUUID(),
          tripId: rajTripRow.id,
          userId: marcoUser.id,
          title: 'Hotel check-in times',
          content: 'Check-in: 2 PM\nCheck-out: 11 AM\nContact: +91-9876543210',
          category: 'Accommodation',
          color: '#dcfce7',
          isPinned: false,
          updatedAt: nowNote,
        },
      ]).onConflictDoNothing();

      const collabPollOptId = crypto.randomUUID();

      await db.insert(collabPolls).values({
        id: collabPollOptId,
        tripId: rajTripRow.id,
        userId: aryaUser.id,
        question: 'Which optional activity should we add?',
        optionsJson: ['Elephant ride at Amer', 'Cooking class', 'Camel safari'],
        isMultiple: true,
        isClosed: false,
      }).onConflictDoNothing();

      await db.insert(collabPollVotes).values([
        { pollId: collabPollOptId, userId: aryaUser.id, optionIndex: 2 },
        { pollId: collabPollOptId, userId: marcoUser.id, optionIndex: 2 },
      ]).onConflictDoNothing();

      console.log('  Seeded Sprint 6 demo (circles + Rajasthan trip collab)');
    } else {
      console.log('  Sprint 6 seed skipped (missing demo users or trips)');
    }
  } else {
    console.log('  Circles already seeded — skipping Sprint 6');
  }

  // S7: JustSplit
  const existingGroups = await db.select().from(expenseGroups).limit(1);
  if (existingGroups.length === 0) {
    const aryaUserS7 = createdUsers.find((u) => u.username === 'arya_explorer');
    const marcoUserS7 = createdUsers.find((u) => u.username === 'marco_travels');
    const anaUserS7 = createdUsers.find((u) => u.username === 'ana_nomad');
    const leoUserS7 = createdUsers.find((u) => u.username === 'leo_backpacker');
    const kenjiUserS7 = createdUsers.find((u) => u.username === 'kenji_wanders');

    const goaCircle = await db.query.circles.findFirst({
      where: (t, { like: l }) => l(t.title, '%Goa%'),
    });

    if (aryaUserS7 && marcoUserS7 && anaUserS7 && leoUserS7 && kenjiUserS7) {
      const goaGroupId = crypto.randomUUID();
      await db.insert(expenseGroups).values({
        id: goaGroupId,
        name: 'Goa Trip Expenses',
        currency: 'INR',
        ownerId: aryaUserS7.id,
        linkedCircleId: goaCircle?.id ?? null,
        createdAt: new Date(),
      });
      await db.insert(expenseGroupMembers).values([
        { groupId: goaGroupId, userId: aryaUserS7.id, joinedAt: new Date() },
        { groupId: goaGroupId, userId: marcoUserS7.id, joinedAt: new Date() },
        { groupId: goaGroupId, userId: anaUserS7.id, joinedAt: new Date() },
      ]).onConflictDoNothing();

      const memberIds = [aryaUserS7.id, marcoUserS7.id, anaUserS7.id];

      const hotelId = crypto.randomUUID();
      await db.insert(expenses).values({ id: hotelId, groupId: goaGroupId, paidBy: aryaUserS7.id, description: 'Beach Hotel (2 nights)', amount: '9000', currency: 'INR', category: 'Accommodation', splitType: 'equal', createdAt: new Date() });
      for (const uid of memberIds) {
        await db.insert(expenseSplits).values({ id: crypto.randomUUID(), expenseId: hotelId, userId: uid, amount: '3000', isSettled: false }).onConflictDoNothing();
      }

      const dinnerId = crypto.randomUUID();
      await db.insert(expenses).values({ id: dinnerId, groupId: goaGroupId, paidBy: marcoUserS7.id, description: 'Seafood dinner', amount: '4500', currency: 'INR', category: 'Food', splitType: 'exact', createdAt: new Date() });
      await db.insert(expenseSplits).values([
        { id: crypto.randomUUID(), expenseId: dinnerId, userId: aryaUserS7.id, amount: '2000', isSettled: false },
        { id: crypto.randomUUID(), expenseId: dinnerId, userId: marcoUserS7.id, amount: '1500', isSettled: false },
        { id: crypto.randomUUID(), expenseId: dinnerId, userId: anaUserS7.id, amount: '1000', isSettled: false },
      ]).onConflictDoNothing();

      const taxiId = crypto.randomUUID();
      await db.insert(expenses).values({ id: taxiId, groupId: goaGroupId, paidBy: anaUserS7.id, description: 'Airport taxi', amount: '1200', currency: 'INR', category: 'Transport', splitType: 'equal', createdAt: new Date() });
      for (const uid of memberIds) {
        await db.insert(expenseSplits).values({ id: crypto.randomUUID(), expenseId: taxiId, userId: uid, amount: '400', isSettled: false }).onConflictDoNothing();
      }

      const surfId = crypto.randomUUID();
      const surfTotal = 3000;
      await db.insert(expenses).values({ id: surfId, groupId: goaGroupId, paidBy: aryaUserS7.id, description: 'Surfing lessons', amount: String(surfTotal), currency: 'INR', category: 'Activities', splitType: 'weighted', createdAt: new Date() });
      await db.insert(expenseSplits).values([
        { id: crypto.randomUUID(), expenseId: surfId, userId: aryaUserS7.id, amount: '1500', isSettled: false },
        { id: crypto.randomUUID(), expenseId: surfId, userId: marcoUserS7.id, amount: '900', isSettled: false },
        { id: crypto.randomUUID(), expenseId: surfId, userId: anaUserS7.id, amount: '600', isSettled: false },
      ]).onConflictDoNothing();

      const grocId = crypto.randomUUID();
      await db.insert(expenses).values({ id: grocId, groupId: goaGroupId, paidBy: marcoUserS7.id, description: 'Supermarket groceries', amount: '1800', currency: 'INR', category: 'Food', splitType: 'equal', createdAt: new Date() });
      for (const uid of memberIds) {
        await db.insert(expenseSplits).values({ id: crypto.randomUUID(), expenseId: grocId, userId: uid, amount: '600', isSettled: false }).onConflictDoNothing();
      }

      await db.insert(groupSettlements).values({ id: crypto.randomUUID(), groupId: goaGroupId, fromUserId: anaUserS7.id, toUserId: aryaUserS7.id, amount: '500', currency: 'INR', settledAt: new Date() });

      const rajGroupId = crypto.randomUUID();
      await db.insert(expenseGroups).values({
        id: rajGroupId,
        name: 'Rajasthan Crew',
        currency: 'INR',
        ownerId: aryaUserS7.id,
        linkedCircleId: null,
        createdAt: new Date(),
      });
      await db.insert(expenseGroupMembers).values([
        { groupId: rajGroupId, userId: aryaUserS7.id, joinedAt: new Date() },
        { groupId: rajGroupId, userId: leoUserS7.id, joinedAt: new Date() },
        { groupId: rajGroupId, userId: kenjiUserS7.id, joinedAt: new Date() },
      ]).onConflictDoNothing();

      const rajMemberIds = [aryaUserS7.id, leoUserS7.id, kenjiUserS7.id];

      const camelId = crypto.randomUUID();
      await db.insert(expenses).values({ id: camelId, groupId: rajGroupId, paidBy: leoUserS7.id, description: 'Camel safari at Jaisalmer', amount: '3600', currency: 'INR', category: 'Activities', splitType: 'equal', createdAt: new Date() });
      for (const uid of rajMemberIds) {
        await db.insert(expenseSplits).values({ id: crypto.randomUUID(), expenseId: camelId, userId: uid, amount: '1200', isSettled: false }).onConflictDoNothing();
      }

      const rickId = crypto.randomUUID();
      await db.insert(expenses).values({ id: rickId, groupId: rajGroupId, paidBy: aryaUserS7.id, description: 'Auto rickshaws (Jaipur)', amount: '900', currency: 'INR', category: 'Transport', splitType: 'exact', createdAt: new Date() });
      await db.insert(expenseSplits).values([
        { id: crypto.randomUUID(), expenseId: rickId, userId: aryaUserS7.id, amount: '400', isSettled: false },
        { id: crypto.randomUUID(), expenseId: rickId, userId: leoUserS7.id, amount: '300', isSettled: false },
        { id: crypto.randomUUID(), expenseId: rickId, userId: kenjiUserS7.id, amount: '200', isSettled: false },
      ]).onConflictDoNothing();

      const rajHotelId = crypto.randomUUID();
      await db.insert(expenses).values({ id: rajHotelId, groupId: rajGroupId, paidBy: kenjiUserS7.id, description: 'Heritage haveli room', amount: '7500', currency: 'INR', category: 'Accommodation', splitType: 'equal', createdAt: new Date() });
      for (const uid of rajMemberIds) {
        await db.insert(expenseSplits).values({ id: crypto.randomUUID(), expenseId: rajHotelId, userId: uid, amount: '2500', isSettled: false }).onConflictDoNothing();
      }

      const rajDinnerId = crypto.randomUUID();
      await db.insert(expenses).values({ id: rajDinnerId, groupId: rajGroupId, paidBy: leoUserS7.id, description: 'Rooftop dinner Udaipur', amount: '2700', currency: 'INR', category: 'Food', splitType: 'equal', createdAt: new Date() });
      for (const uid of rajMemberIds) {
        await db.insert(expenseSplits).values({ id: crypto.randomUUID(), expenseId: rajDinnerId, userId: uid, amount: '900', isSettled: false }).onConflictDoNothing();
      }

      const fortId = crypto.randomUUID();
      await db.insert(expenses).values({ id: fortId, groupId: rajGroupId, paidBy: aryaUserS7.id, description: 'Amber Fort entry tickets', amount: '1500', currency: 'INR', category: 'Activities', splitType: 'exact', createdAt: new Date() });
      await db.insert(expenseSplits).values([
        { id: crypto.randomUUID(), expenseId: fortId, userId: aryaUserS7.id, amount: '500', isSettled: false },
        { id: crypto.randomUUID(), expenseId: fortId, userId: leoUserS7.id, amount: '500', isSettled: false },
        { id: crypto.randomUUID(), expenseId: fortId, userId: kenjiUserS7.id, amount: '500', isSettled: false },
      ]).onConflictDoNothing();

      await db.insert(groupSettlements).values({ id: crypto.randomUUID(), groupId: rajGroupId, fromUserId: kenjiUserS7.id, toUserId: aryaUserS7.id, amount: '1000', currency: 'INR', settledAt: new Date() });

      console.log('  Seeded Sprint 7 demo (JustSplit expense groups)');
    }
  } else {
    console.log('  JustSplit groups already seeded — skipping Sprint 7');
  }

  // ── Sprint 8: Journey Magazine, Atlas, Gamification ─────────────────────────
  const s8Exists = await db.query.journeys.findFirst({
    where: (t, { eq: e }) => e(t.title, 'Rajasthan Heritage Journal'),
  });

  if (!s8Exists) {
    const aryaUser = await db.query.users.findFirst({
      where: (t, { eq: e }) => e(t.username, 'arya_explorer'),
    });
    const marcoUser = await db.query.users.findFirst({
      where: (t, { eq: e }) => e(t.username, 'marco_travels'),
    });
    const leoUser = await db.query.users.findFirst({
      where: (t, { eq: e }) => e(t.username, 'leo_backpacker'),
    });

    if (aryaUser && marcoUser && leoUser) {
      // Arya's journey
      const aryaJourneyId = crypto.randomUUID();
      await db.insert(journeys).values({
        id: aryaJourneyId,
        userId: aryaUser.id,
        title: 'Rajasthan Heritage Journal',
        description: 'A fortnight through the palaces, deserts, and bazaars of Rajasthan.',
        layoutPref: 'magazine',
        isPublic: true,
        shareToken: 'demo-rajasthan-share-token',
      });
      await db.insert(journeyContributors).values({ journeyId: aryaJourneyId, userId: aryaUser.id, role: 'owner' });
      await db.insert(journeyContributors).values({ journeyId: aryaJourneyId, userId: leoUser.id, role: 'contributor' });

      const entries = [
        {
          title: 'Arrival in Jaipur',
          contentJson: [
            { type: 'heading', text: 'Day 1 — The Pink City' },
            { type: 'text', text: 'We landed at Jaipur International Airport as the sun was setting, casting a rosy hue over the city...' },
            { type: 'quote', text: 'Travel is the only thing you buy that makes you richer.' },
          ],
          orderIndex: 0,
        },
        {
          title: 'Amber Fort',
          contentJson: [
            { type: 'heading', text: 'Day 2 — Amber Fort & City Palace' },
            { type: 'text', text: 'The Amber Fort perches majestically on a hilltop, its corridors echoing centuries of Rajput history...' },
          ],
          orderIndex: 1,
        },
        {
          title: 'Desert Safari',
          contentJson: [
            { type: 'heading', text: 'Day 5 — Jaisalmer Desert Camp' },
            { type: 'text', text: 'Camel dunes, starlit skies, and folk music under a crescent moon...' },
            { type: 'divider' },
            { type: 'text', text: 'The Thar desert is unlike anything I have ever seen.' },
          ],
          orderIndex: 2,
        },
        {
          title: 'Udaipur Lakes',
          contentJson: [
            { type: 'heading', text: 'Day 9 — City of Lakes' },
            { type: 'text', text: 'Udaipur lives up to every superlative. Lake Pichola shimmers at sunset...' },
          ],
          orderIndex: 3,
        },
      ];

      for (const entry of entries) {
        await db.insert(journeyEntries).values({
          id: crypto.randomUUID(),
          journeyId: aryaJourneyId,
          title: entry.title,
          contentJson: entry.contentJson,
          orderIndex: entry.orderIndex,
        });
      }

      // Marco's journey
      const marcoJourneyId = crypto.randomUUID();
      await db.insert(journeys).values({
        id: marcoJourneyId,
        userId: marcoUser.id,
        title: 'Goa Beach Diary',
        description: 'Sun, waves, and shacks — a week in Goa.',
        layoutPref: 'magazine',
        isPublic: false,
      });
      await db.insert(journeyContributors).values({ journeyId: marcoJourneyId, userId: marcoUser.id, role: 'owner' });

      const marcoEntries = [
        { title: 'Baga Beach', contentJson: [{ type: 'heading', text: 'Day 1 — Baga at Sunrise' }, { type: 'text', text: 'The shacks were just opening and the beach was empty...' }], orderIndex: 0 },
        { title: 'Dudhsagar Falls', contentJson: [{ type: 'heading', text: 'Day 3 — Into the Jungle' }, { type: 'text', text: 'A rickety jeep, dense forests, and the roar of Dudhsagar...' }], orderIndex: 1 },
        { title: 'Old Goa', contentJson: [{ type: 'heading', text: 'Day 5 — Colonial Heritage' }, { type: 'text', text: 'The Basilica of Bom Jesus holds the relics of St. Francis Xavier...' }], orderIndex: 2 },
      ];

      for (const entry of marcoEntries) {
        await db.insert(journeyEntries).values({
          id: crypto.randomUUID(),
          journeyId: marcoJourneyId,
          title: entry.title,
          contentJson: entry.contentJson,
          orderIndex: entry.orderIndex,
        });
      }

      // Visited countries — arya (8 countries: India, Thailand, Japan, Nepal, Sri Lanka, Indonesia, Vietnam, Malaysia)
      const aryaCountries = ['IN', 'TH', 'JP', 'NP', 'LK', 'ID', 'VN', 'MY'];
      for (const code of aryaCountries) {
        await db.insert(visitedCountries).values({
          id: crypto.randomUUID(),
          userId: aryaUser.id,
          countryCode: code,
        }).onConflictDoNothing();
      }

      // Visited countries — marco (5 countries: India, Brazil, Portugal, Spain, France)
      const marcoCountries = ['IN', 'BR', 'PT', 'ES', 'FR'];
      for (const code of marcoCountries) {
        await db.insert(visitedCountries).values({
          id: crypto.randomUUID(),
          userId: marcoUser.id,
          countryCode: code,
        }).onConflictDoNothing();
      }

      // Badges — arya: first_post, first_journey, five_countries, first_trip
      const aryaBadges = ['first_post', 'first_journey', 'five_countries', 'first_trip'];
      for (const badgeType of aryaBadges) {
        await db.insert(userBadges).values({
          id: crypto.randomUUID(),
          userId: aryaUser.id,
          badgeType,
        }).onConflictDoNothing();
      }

      // Badges — marco: first_post, five_countries, first_trip, first_journey
      const marcoBadges = ['first_post', 'five_countries', 'first_trip', 'first_journey'];
      for (const badgeType of marcoBadges) {
        await db.insert(userBadges).values({
          id: crypto.randomUUID(),
          userId: marcoUser.id,
          badgeType,
        }).onConflictDoNothing();
      }

      console.log('  Seeded Sprint 8 demo (Journeys, Atlas, Gamification)');
    }
  } else {
    console.log('  Journeys already seeded — skipping Sprint 8');
  }

  // ── Sprint 9: Notifications, Admin ────────────────────────────────────────
  const s9AryaUser = createdUsers.find((u) => u.username === 'arya_explorer');
  const s9MarcoUser = createdUsers.find((u) => u.username === 'marco_travels');

  if (s9AryaUser) {
    // Make arya_explorer an admin
    await db.update(users).set({ role: 'admin' }).where(eq(users.id, s9AryaUser.id));
    console.log('  Set arya_explorer as admin');
  }

  const s9NoticesExist = await db.query.systemNotices.findFirst({
    where: (t, { like: l }) => l(t.title, '%Roamera%'),
  });
  if (!s9NoticesExist && s9AryaUser) {
    await db.insert(systemNotices).values([
      {
        id: crypto.randomUUID(),
        title: 'Welcome to Roamera V2!',
        body: 'Explore new features: Journey Magazine, Atlas, and Gamification are now live.',
        type: 'info',
        isActive: true,
        createdBy: s9AryaUser.id,
      },
      {
        id: crypto.randomUUID(),
        title: 'Scheduled maintenance on Sunday 2–4 AM IST',
        body: 'Some features may be briefly unavailable.',
        type: 'warning',
        isActive: false,
        createdBy: s9AryaUser.id,
      },
    ]);

    // Sample notifications for demo users
    const sampleNotifs = [
      ...(s9AryaUser && s9MarcoUser ? [
        {
          id: crypto.randomUUID(),
          userId: s9AryaUser.id,
          type: 'follow',
          title: 'marco_travels started following you',
          actorId: s9MarcoUser.id,
          resourceType: 'user',
          resourceId: s9MarcoUser.id,
        },
        {
          id: crypto.randomUUID(),
          userId: s9AryaUser.id,
          type: 'reaction',
          title: 'marco_travels reacted to your Moment',
          actorId: s9MarcoUser.id,
          resourceType: 'post',
        },
        {
          id: crypto.randomUUID(),
          userId: s9MarcoUser.id,
          type: 'follow',
          title: 'arya_explorer started following you',
          actorId: s9AryaUser.id,
          resourceType: 'user',
          resourceId: s9AryaUser.id,
        },
        {
          id: crypto.randomUUID(),
          userId: s9MarcoUser.id,
          type: 'comment',
          title: 'arya_explorer commented on your Moment',
          body: 'Amazing shot! What camera did you use?',
          actorId: s9AryaUser.id,
          resourceType: 'post',
        },
      ] : []),
      ...(s9AryaUser ? [{
        id: crypto.randomUUID(),
        userId: s9AryaUser.id,
        type: 'system',
        title: 'Your account has been verified',
        body: 'Welcome aboard! Start sharing your travel stories.',
      }] : []),
    ];

    for (const notif of sampleNotifs) {
      await db.insert(notifications).values(notif).onConflictDoNothing();
    }

    console.log('  Seeded Sprint 9 demo (admin, system notices, sample notifications)');
  } else {
    console.log('  S9 notices already seeded — skipping');
  }

  console.log('Seed complete!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
