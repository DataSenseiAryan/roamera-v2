const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const destinations = [
  // ─── Beaches ────────────────────────────────────────────────────────────────
  {
    name: 'Maldives',
    country: 'Maldives',
    category: 'Beaches',
    description: 'Overwater bungalows, crystal lagoons, and coral reefs teeming with life.',
    coverImage: 'https://picsum.photos/seed/maldives-overwater/600/400',
    tags: JSON.stringify(['overwater villa', 'snorkeling', 'luxury', 'coral reef']),
  },
  {
    name: 'Bali',
    country: 'Indonesia',
    category: 'Beaches',
    description: 'Black-sand beaches, surf breaks, and rice-paddy-backed coves.',
    coverImage: 'https://picsum.photos/seed/bali-beach-surf/600/400',
    tags: JSON.stringify(['surf', 'tropical', 'temples', 'nightlife']),
  },
  {
    name: 'Santorini',
    country: 'Greece',
    description: 'Volcanic black-sand beaches under iconic caldera cliffs.',
    category: 'Beaches',
    coverImage: 'https://picsum.photos/seed/santorini-beach/600/400',
    tags: JSON.stringify(['sunset', 'volcanic beach', 'sailing', 'romantic']),
  },
  {
    name: 'Phi Phi Islands',
    country: 'Thailand',
    category: 'Beaches',
    description: "Emerald waters, limestone karsts, and Maya Bay's famous shores.",
    coverImage: 'https://picsum.photos/seed/phi-phi-beach/600/400',
    tags: JSON.stringify(['snorkeling', 'island hopping', 'party', 'scenic']),
  },
  {
    name: 'Amalfi Coast',
    country: 'Italy',
    category: 'Beaches',
    description: 'Pastel villages tumbling to a cobalt-blue sea on sheer cliffs.',
    coverImage: 'https://picsum.photos/seed/amalfi-coast/600/400',
    tags: JSON.stringify(['boat trip', 'cliffs', 'food', 'views']),
  },

  // ─── Mountains ──────────────────────────────────────────────────────────────
  {
    name: 'Swiss Alps',
    country: 'Switzerland',
    category: 'Mountains',
    description: 'Glacier-carved peaks, alpine meadows, and ski runs above the clouds.',
    coverImage: 'https://picsum.photos/seed/swiss-alps-peaks/600/400',
    tags: JSON.stringify(['skiing', 'hiking', 'cable car', 'snow']),
  },
  {
    name: 'Patagonia',
    country: 'Argentina & Chile',
    category: 'Mountains',
    description: 'The end of the world — Torres, glaciers, and relentless wind.',
    coverImage: 'https://picsum.photos/seed/patagonia-torres/600/400',
    tags: JSON.stringify(['trekking', 'glaciers', 'wilderness', 'epic']),
  },
  {
    name: 'Dolomites',
    country: 'Italy',
    category: 'Mountains',
    description: 'Pink limestone spires, rifugio hut-to-hut trails, and via ferratas.',
    coverImage: 'https://picsum.photos/seed/dolomites-peaks/600/400',
    tags: JSON.stringify(['hiking', 'via ferrata', 'rifugio', 'scenic drive']),
  },
  {
    name: 'Banff',
    country: 'Canada',
    category: 'Mountains',
    description: 'Turquoise glacial lakes and elk on the road through the Rockies.',
    coverImage: 'https://picsum.photos/seed/banff-lake-louise/600/400',
    tags: JSON.stringify(['lake', 'wildlife', 'skiing', 'road trip']),
  },
  {
    name: 'Himalayas',
    country: 'Nepal',
    category: 'Mountains',
    description: 'Everest Base Camp treks, Sherpa villages, and a sky full of peaks.',
    coverImage: 'https://picsum.photos/seed/himalayas-everest/600/400',
    tags: JSON.stringify(['trekking', 'base camp', 'altitude', 'culture']),
  },

  // ─── Deserts ────────────────────────────────────────────────────────────────
  {
    name: 'Sahara Desert',
    country: 'Morocco',
    category: 'Deserts',
    description: 'Endless dunes, camel caravans, and a silence only the desert knows.',
    coverImage: 'https://picsum.photos/seed/sahara-dunes-camel/600/400',
    tags: JSON.stringify(['camel trek', 'stargazing', 'camp', 'sunrise']),
  },
  {
    name: 'Wadi Rum',
    country: 'Jordan',
    category: 'Deserts',
    description: 'Mars-red sandstone canyons, Bedouin camps, and starlit skies.',
    coverImage: 'https://picsum.photos/seed/wadi-rum-jordan/600/400',
    tags: JSON.stringify(['jeep safari', 'bedouin camp', 'rock climbing', 'stargazing']),
  },
  {
    name: 'Atacama Desert',
    country: 'Chile',
    category: 'Deserts',
    description: 'The driest place on Earth — geysers, salt flats, and alien landscapes.',
    coverImage: 'https://picsum.photos/seed/atacama-salt-flat/600/400',
    tags: JSON.stringify(['geysers', 'salt flats', 'stargazing', 'unique']),
  },
  {
    name: 'Rub al Khali',
    country: 'Saudi Arabia',
    category: 'Deserts',
    description: 'The Empty Quarter — the world\'s largest sand desert, boundless and raw.',
    coverImage: 'https://picsum.photos/seed/empty-quarter-desert/600/400',
    tags: JSON.stringify(['dunes', 'remote', 'off-road', 'expedition']),
  },

  // ─── Religious ──────────────────────────────────────────────────────────────
  {
    name: 'Varanasi',
    country: 'India',
    category: 'Religious',
    description: 'The spiritual heart of India — ghats, Ganges rituals, and ancient temples.',
    coverImage: 'https://picsum.photos/seed/varanasi-ghats/600/400',
    tags: JSON.stringify(['ghats', 'Hindu', 'Ganga Aarti', 'spiritual']),
  },
  {
    name: 'Kyoto',
    country: 'Japan',
    category: 'Religious',
    description: 'Thousands of Shinto shrines and Zen temples wrapped in bamboo groves.',
    coverImage: 'https://picsum.photos/seed/kyoto-fushimi/600/400',
    tags: JSON.stringify(['shrines', 'Zen', 'temples', 'bamboo']),
  },
  {
    name: 'Jerusalem',
    country: 'Israel',
    category: 'Religious',
    description: 'The Old City where Judaism, Christianity, and Islam share sacred stones.',
    coverImage: 'https://picsum.photos/seed/jerusalem-dome/600/400',
    tags: JSON.stringify(['holy sites', 'Western Wall', 'church', 'mosque']),
  },
  {
    name: 'Angkor Wat',
    country: 'Cambodia',
    category: 'Religious',
    description: 'The largest religious monument on Earth, rising from the jungle at dawn.',
    coverImage: 'https://picsum.photos/seed/angkor-wat-sunrise/600/400',
    tags: JSON.stringify(['temples', 'Hindu', 'sunrise', 'archaeology']),
  },
  {
    name: 'Mecca & Medina',
    country: 'Saudi Arabia',
    category: 'Religious',
    description: 'The holiest cities in Islam — pilgrimage destination for millions each year.',
    coverImage: 'https://picsum.photos/seed/mecca-kaaba/600/400',
    tags: JSON.stringify(['Hajj', 'Islam', 'pilgrimage', 'sacred']),
  },

  // ─── Adventure ──────────────────────────────────────────────────────────────
  {
    name: 'Queenstown',
    country: 'New Zealand',
    category: 'Adventure',
    description: 'Bungee jumping, skydiving, and white-water rafting in the adventure capital.',
    coverImage: 'https://picsum.photos/seed/queenstown-bungee/600/400',
    tags: JSON.stringify(['bungee', 'skydive', 'rafting', 'skiing']),
  },
  {
    name: 'Costa Rica',
    country: 'Costa Rica',
    category: 'Adventure',
    description: 'Zip-lining through cloud forests, surfing at jungle coves, volcano hikes.',
    coverImage: 'https://picsum.photos/seed/costa-rica-jungle/600/400',
    tags: JSON.stringify(['zip-line', 'surf', 'wildlife', 'volcanoes']),
  },
  {
    name: 'Iceland',
    country: 'Iceland',
    category: 'Adventure',
    description: 'Ice caves, volcano hikes, glacier walks, and northern lights hunting.',
    coverImage: 'https://picsum.photos/seed/iceland-northern-lights/600/400',
    tags: JSON.stringify(['northern lights', 'ice cave', 'volcano', 'glacier walk']),
  },
  {
    name: 'Ha Long Bay',
    country: 'Vietnam',
    category: 'Adventure',
    description: 'Kayaking through limestone karsts and overnight junks on emerald water.',
    coverImage: 'https://picsum.photos/seed/halong-bay-kayak/600/400',
    tags: JSON.stringify(['kayaking', 'overnight boat', 'caves', 'climbing']),
  },

  // ─── City ───────────────────────────────────────────────────────────────────
  {
    name: 'Tokyo',
    country: 'Japan',
    category: 'City',
    description: 'Neon-lit alleyways, silent temples, and the most Michelin stars on Earth.',
    coverImage: 'https://picsum.photos/seed/tokyo-neon-city/600/400',
    tags: JSON.stringify(['food', 'nightlife', 'tech', 'culture']),
  },
  {
    name: 'Lisbon',
    country: 'Portugal',
    category: 'City',
    description: 'Seven hills, tram 28, fado bars, and pastéis de nata on every corner.',
    coverImage: 'https://picsum.photos/seed/lisbon-tram-city/600/400',
    tags: JSON.stringify(['tram', 'fado', 'affordable', 'food']),
  },
  {
    name: 'New York',
    country: 'USA',
    category: 'City',
    description: 'The city that never sleeps — skyline, Broadway, Central Park, and bagels.',
    coverImage: 'https://picsum.photos/seed/new-york-skyline/600/400',
    tags: JSON.stringify(['skyline', 'Broadway', 'food', 'museums']),
  },
  {
    name: 'Marrakech',
    country: 'Morocco',
    category: 'City',
    description: 'A sensory overload of souks, riads, spice mountains, and rooftop sunsets.',
    coverImage: 'https://picsum.photos/seed/marrakech-souk-city/600/400',
    tags: JSON.stringify(['souks', 'riad', 'food', 'history']),
  },

  // ─── Islands ────────────────────────────────────────────────────────────────
  {
    name: 'Azores',
    country: 'Portugal',
    category: 'Islands',
    description: 'Volcanic crater lakes, whale watching, and hot-spring lagoons mid-Atlantic.',
    coverImage: 'https://picsum.photos/seed/azores-crater-lake/600/400',
    tags: JSON.stringify(['whale watching', 'volcanic', 'hiking', 'off the beaten path']),
  },
  {
    name: 'Faroe Islands',
    country: 'Denmark',
    category: 'Islands',
    description: 'Dramatic cliffs, puffin colonies, and waterfalls dropping into the sea.',
    coverImage: 'https://picsum.photos/seed/faroe-cliffs-grass/600/400',
    tags: JSON.stringify(['dramatic', 'puffins', 'hiking', 'remote']),
  },
  {
    name: 'Maui',
    country: 'USA',
    category: 'Islands',
    description: 'Road to Hana, Haleakalā sunrise, black-sand beaches, and whale season.',
    coverImage: 'https://picsum.photos/seed/maui-road-hana/600/400',
    tags: JSON.stringify(['road trip', 'volcano', 'whale watching', 'snorkeling']),
  },
];

async function main() {
  await prisma.destination.deleteMany();
  await prisma.destination.createMany({ data: destinations });

  const categories = [...new Set(destinations.map((d) => d.category))];
  console.log(`Seeded ${destinations.length} destinations across ${categories.length} categories:`);
  categories.forEach((cat) => {
    const count = destinations.filter((d) => d.category === cat).length;
    console.log(`  ${cat}: ${count}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
