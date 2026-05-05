const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const users = [
  { username: 'marco_travels', email: 'marco@example.com', bio: 'Adventure seeker. 40 countries and counting. ✈️' },
  { username: 'sara_wanders', email: 'sara@example.com', bio: 'Food & travel lover. Based in Barcelona 🇪🇸' },
  { username: 'kenji_nomad', email: 'kenji@example.com', bio: 'Minimalist traveler. One bag, everywhere.' },
  { username: 'ana_explorer', email: 'ana@example.com', bio: 'Mountains > beaches. Hiking enthusiast 🏔️' },
  { username: 'leo_backpacker', email: 'leo@example.com', bio: 'Budget traveler. Hostels and local food only.' },
];

const journals = [
  {
    userIndex: 0,
    title: 'Two Weeks in Japan: Cherry Blossoms & Ramen',
    destination: 'Tokyo, Japan',
    startDate: new Date('2025-03-25'),
    endDate: new Date('2025-04-08'),
    activities: 'Visited Shinjuku Gyoen, Sensoji Temple, Akihabara, day trip to Nikko. Tried 12 different ramen spots.',
    accommodation: 'Mix of capsule hotels and a ryokan in Kyoto',
    budget: 2400,
    content: `Japan completely rewired my brain. I landed in Tokyo during peak cherry blossom season and the city was surreal — soft pink everywhere, picnickers under the trees, that quiet hum of a place that runs perfectly.\n\nSpent the first three days just walking. Got lost on purpose in Shimokitazawa, found a jazz bar the size of a closet, ate convenience store onigiri at midnight. The capsule hotel in Shinjuku was an experience — efficient, clean, oddly cozy.\n\nThe bullet train to Kyoto was one of the smoothest rides of my life. Arashiyama bamboo grove at 6am, before the crowds, is something I'll carry with me forever.`,
  },
  {
    userIndex: 1,
    title: 'Solo Road Trip Through Patagonia',
    destination: 'Patagonia, Argentina & Chile',
    startDate: new Date('2025-01-10'),
    endDate: new Date('2025-01-28'),
    activities: 'Trekking Torres del Paine W circuit, glacier boat tour, drove Ruta 40, visited Perito Moreno.',
    accommodation: 'Campsites and mountain refugios along the W circuit',
    budget: 1800,
    content: `Patagonia is not for the faint-hearted — and I mean that in the best possible way. The wind alone will test your character. I drove a rental car from Punta Arenas south, windows rattling, listening to nothing but the road.\n\nThe W circuit was 5 days of mud, wind, and views that made me cry at least twice. The Torres at sunrise on the last morning — that orange glow hitting the granite towers — felt like the world was showing off.\n\nPerito Moreno glacier is one of those things you can't photograph well. You have to hear it crack.`,
  },
  {
    userIndex: 2,
    title: 'One Month in Southeast Asia on $30/Day',
    destination: 'Thailand, Vietnam & Cambodia',
    startDate: new Date('2024-11-01'),
    endDate: new Date('2024-11-30'),
    activities: 'Motorbike through Ha Giang Loop, Angkor Wat sunrise, island hopping in Koh Lanta, street food tours.',
    accommodation: 'Hostels and guesthouses, avg $8/night',
    budget: 900,
    content: `A month, three countries, under a thousand dollars. People think budget travel means suffering. It doesn't.\n\nThe Ha Giang Loop in northern Vietnam was the highlight. Rented a semi-automatic motorbike, got a laminated map, and drove for four days through rice terraces and mountain passes with almost no tourists. Fell once in the mud. Worth it.\n\nAngkor Wat at dawn, watching the reflection appear in the water while monks chanted nearby — no amount of Instagram prep makes you ready for it. Cambodia surprised me most. The warmth of the people after everything they've been through is humbling.`,
  },
  {
    userIndex: 3,
    title: 'Hiking the Alta Via 1 in the Dolomites',
    destination: 'Dolomites, Italy',
    startDate: new Date('2025-07-14'),
    endDate: new Date('2025-07-24'),
    activities: 'Hiked Alta Via 1 (120km), via ferrata sections, mountain hut stays, wild swimming.',
    accommodation: 'Rifugios (mountain huts) along the trail',
    budget: 1100,
    content: `10 days, 120 kilometers, 8000 meters of elevation. The Dolomites are what mountains look like in dreams — jagged pink limestone, impossibly green meadows, and these little rifugios where you eat pasta and sleep in bunk beds surrounded by strangers who become friends.\n\nThe via ferrata sections made my palms sweat but the exposure is manageable with the iron cables. The view from Lagazuoi hut was worth every sweaty kilometer.\n\nI finished in Belluno absolutely destroyed and immediately started planning the Alta Via 2.`,
  },
  {
    userIndex: 4,
    title: 'Morocco in 10 Days: Medinas, Sahara & Valleys',
    destination: 'Morocco',
    startDate: new Date('2025-02-20'),
    endDate: new Date('2025-03-02'),
    activities: 'Marrakech medina, Fes tanneries, camel trek in Sahara, Dades Valley drive, Essaouira coast.',
    accommodation: 'Riads in Marrakech & Fes, desert camp in Merzouga',
    budget: 950,
    content: `Morocco assaults all five senses from the moment you land. Marrakech's medina is beautiful chaos — souks, spice mountains, snake charmers, mint tea pressed into your hands by strangers who may or may not want something in return.\n\nFes was my favorite. Older, less touristy, genuinely labyrinthine. The tanneries smell exactly as advertised. Standing on the rooftop with a sprig of mint held to my nose, watching dyers work the same way they have for centuries — time collapsed.\n\nThe Sahara desert camp was kitsch in the best way. I rode a camel, slept in a tent, and woke up to a silence so complete it felt sacred.`,
  },
  {
    userIndex: 0,
    title: 'Weekend in Lisbon: Pastéis and Viewpoints',
    destination: 'Lisbon, Portugal',
    startDate: new Date('2025-05-09'),
    endDate: new Date('2025-05-11'),
    activities: 'Tram 28, LX Factory market, Alfama fado bar, Sintra day trip, Belém tower.',
    accommodation: 'Boutique hostel in Alfama',
    budget: 380,
    content: `Lisbon is one of those cities that feels lived-in in the best way. Crumbling azulejo tiles, laundry strung between windows, the faint sound of fado drifting out of a restaurant at 10pm.\n\nI ate four pastéis de nata on the first day alone. No regrets. The LX Factory Sunday market is worth missing a flight for — vintage books, ceramics, and a rooftop bar with half the city below you.\n\nSintra in the morning, before the buses arrive, is pure fairy tale. The fog clinging to the Pena Palace turrets, the cork forests, the Atlantic in the distance.`,
  },
  {
    userIndex: 1,
    title: 'Island Hopping the Greek Cyclades',
    destination: 'Santorini, Mykonos & Naxos, Greece',
    startDate: new Date('2025-06-20'),
    endDate: new Date('2025-07-02'),
    activities: 'Caldera sunset in Oia, Mykonos old town, Naxos hiking, catamaran day trip, taverna hopping.',
    accommodation: 'Cave hotel in Oia, Airbnb in Naxos',
    budget: 2100,
    content: `June in the Cyclades hits different. The light is extraordinary — white and flat and everywhere, bouncing off every surface. Santorini is predictably stunning and predictably crowded, but stay past sunset when the day-trippers leave and it becomes something else entirely.\n\nNaxos was the real discovery. Bigger, greener, less photographed. Rented a scooter and drove to the Temple of Apollo at dawn with absolutely nobody there. Swam in a cove I found on a hiking trail. Ate grilled octopus for four days straight.\n\nMykonos was fun for exactly 36 hours, which is exactly how long it should be.`,
  },
  {
    userIndex: 2,
    title: 'Crossing Iceland by Campervan in August',
    destination: 'Iceland',
    startDate: new Date('2025-08-01'),
    endDate: new Date('2025-08-14'),
    activities: 'Ring Road drive, Landmannalaugar highlands, Jökulsárlón glacier lagoon, hot springs, whale watching.',
    accommodation: 'Campervan with rooftop tent',
    budget: 3200,
    content: `Two weeks. A campervan. The Ring Road. Iceland in summer means 22 hours of daylight, which breaks your brain in the most wonderful way. I'd cook dinner at 10pm in full sunshine, forgetting entirely that it was night.\n\nLandmannalaugar in the highlands was the most alien landscape I've ever stood in — rhyolite mountains in pink and green and yellow, hot springs bubbling up through the lava field. No phone signal. Just silence and sulfur.\n\nThe glacier lagoon at Jökulsárlón: icebergs drifting slowly to sea, seals lounging on the blue chunks, the color of the water something between teal and nothing I can name.`,
  },
];

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.follow.deleteMany();
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.journal.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash('password123', 10);

  // Create users
  const createdUsers = await Promise.all(
    users.map((u) =>
      prisma.user.create({
        data: { ...u, password },
      })
    )
  );
  console.log(`Created ${createdUsers.length} users`);

  // Create journals
  const createdJournals = await Promise.all(
    journals.map((j) => {
      const { userIndex, ...data } = j;
      return prisma.journal.create({
        data: {
          ...data,
          userId: createdUsers[userIndex].id,
          photos: '[]',
        },
      });
    })
  );
  console.log(`Created ${createdJournals.length} journal entries`);

  // Create likes (everyone likes entries they didn't write)
  const likes = [];
  for (const journal of createdJournals) {
    for (const user of createdUsers) {
      if (user.id !== journal.userId && Math.random() > 0.3) {
        likes.push({ userId: user.id, journalId: journal.id });
      }
    }
  }
  await prisma.like.createMany({ data: likes });
  console.log(`Created ${likes.length} likes`);

  // Create comments
  const commentTexts = [
    'This is incredible! Adding it to my bucket list 🔥',
    'I went here last year — you captured it perfectly.',
    'How did you manage the budget so well?!',
    'The photos must be stunning. Did you use a drone?',
    'Which month would you recommend for a visit?',
    'I can feel the wanderlust through the screen 😍',
    'That food description made me genuinely hungry.',
    'How long did it take to plan this trip?',
    'Solo or with someone? Asking for a friend (me).',
    'This is the push I needed to finally book the flights.',
  ];

  const comments = [];
  for (const journal of createdJournals) {
    const commenters = createdUsers.filter((u) => u.id !== journal.userId);
    const count = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < count; i++) {
      const user = commenters[i % commenters.length];
      comments.push({
        userId: user.id,
        journalId: journal.id,
        content: commentTexts[Math.floor(Math.random() * commentTexts.length)],
      });
    }
  }
  await prisma.comment.createMany({ data: comments });
  console.log(`Created ${comments.length} comments`);

  // Create follows
  const follows = [
    [0, 1], [0, 2], [1, 0], [1, 3], [2, 0], [2, 4],
    [3, 0], [3, 1], [3, 2], [4, 1], [4, 3],
  ];
  await prisma.follow.createMany({
    data: follows.map(([fi, gi]) => ({
      followerId: createdUsers[fi].id,
      followingId: createdUsers[gi].id,
    })),
  });
  console.log(`Created ${follows.length} follows`);

  console.log('\nDone! All users have password: password123');
  console.log('\nAccounts:');
  users.forEach((u) => console.log(`  ${u.email} / password123`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
