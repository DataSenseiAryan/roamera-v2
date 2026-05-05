const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const LADAKH_PHOTOS = [
  'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800',
  'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=800',
  'https://images.unsplash.com/photo-1598885159339-4fde4de46c10?w=800',
  'https://images.unsplash.com/photo-1560179007-bfdd338184e3?w=800',
];

const RAMESHWARAM_PHOTOS = [
  'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800',
  'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=800',
  'https://images.unsplash.com/photo-1567591370105-49c7af62a848?w=800',
];

const posts = [
  {
    title: 'Riding the Rooftop — Ladakh on Two Wheels',
    destination: 'Leh, Ladakh',
    startDate: new Date('2024-07-04'),
    endDate: new Date('2024-07-14'),
    activities: 'Khardung La Pass ride, Pangong Tso lake visit, Nubra Valley sand dunes, Magnetic Hill, Hall of Fame museum, Shanti Stupa sunrise',
    accommodation: 'The Grand Dragon Ladakh, Leh',
    budget: 32000,
    photos: JSON.stringify(LADAKH_PHOTOS),
    content: `The moment my Royal Enfield crested Khardung La at 18,379 ft, I understood why people call Ladakh the last frontier. The air was thin, the road was brutal, and the sky was a shade of blue I'd never seen at sea level.

I left Delhi at 3am on July 4th, aiming to hit Manali by evening and start the Leh–Manali Highway the next morning. Two days of riding through Rohtang Pass, Baralacha La, Nakee La, and Tanglang La — each one higher, colder, and more spectacular than the last.

**Day 1 – Manali to Jispa (170 km)**
The road disintegrates past Rohtang. It's not a road — it's a suggestion. My panniers rattled, my hands went numb, and I fell twice in loose river gravel. Both times, Ladakhi army boys on patrol helped me up, laughing with me, not at me. That's the magic up here.

**Day 3 – Sarchu to Leh via Tanglang La**
Altitude sickness hit me at Pang. Headache, nausea, the works. I stopped, drank three litres of water, ate nothing, and rode slow. By the time Leh valley opened up below me, I was crying and I didn't even try to stop it.

**Pangong Tso**
You don't photograph Pangong — you just stare. The lake changes colour every hour. Dawn: steel grey. Morning: jade green. Afternoon: that impossible cobalt that looks photoshopped even when you're standing in front of it.

**Nubra Valley via Khardung La**
The highest motorable road in the world. My bike stalled twice near the summit. I pushed her the last 200 metres. We both earned that view.

This trip broke me and rebuilt me. 2,100 km in 11 days. I'd do it again tomorrow.`,
  },
  {
    title: 'Rameshwaram: Where the Ocean Meets the Sacred',
    destination: 'Rameshwaram, Tamil Nadu',
    startDate: new Date('2024-01-12'),
    endDate: new Date('2024-01-16'),
    activities: 'Ramanathaswamy Temple corridors, Pamban Bridge ride, Dhanushkodi ghost town, Adam\'s Bridge viewpoint, sunrise at Agni Theertham beach',
    accommodation: 'Hotel Maharaja, Rameshwaram',
    budget: 9500,
    photos: JSON.stringify(RAMESHWARAM_PHOTOS),
    content: `I arrived in Rameshwaram at dusk, crossing the Pamban Bridge as the sun dropped into the Palk Strait on one side and the Bay of Bengal turned gold on the other. The bridge is 2.3 km of pure drama — single lane, swing section in the middle, trains running the same track. I stopped mid-bridge and just breathed.

**Ramanathaswamy Temple**
The temple corridor is the longest in Asia — 1,212 metres of pillared walkway. Walk it barefoot at 5am when the priests are doing the first abhishekam and you'll understand why people cross oceans to get here. The 22 theerthams (sacred wells) each have different water — some salty, some sweet, all cold at dawn.

**Dhanushkodi**
This is the part nobody tells you about. Dhanushkodi is a ghost town — wiped out by the 1964 cyclone, never rebuilt. You ride 18 km on loose sand past the ruins of a church, a railway station, a post office. At the very tip of the island, India ends. Sri Lanka is 22 km away across shallow water you can almost walk to.

The light at Dhanushkodi is surreal. White sand, aquamarine water, crumbled walls. I sat there for two hours and didn't want to leave.

**The Ride Back**
Tamil Nadu coastal roads in January are perfect — 25°C, light traffic, coconut groves, fishing villages. I stopped at a roadside stall near Mandapam and had the best prawn curry of my life for ₹120. The woman who served it had never heard of Instagram. Good.

Rameshwaram doesn't ask for much. Just your shoes and your silence.`,
  },
  {
    title: 'Back to Ladakh: Zanskar Valley Winter Recon',
    destination: 'Zanskar Valley, Ladakh',
    startDate: new Date('2024-11-18'),
    endDate: new Date('2024-11-25'),
    activities: 'Chadar trek scouting, Padum village, Rangdum Monastery, Suru Valley drive, frozen river crossing attempt',
    accommodation: 'Homestay in Padum village',
    budget: 18500,
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1566438480900-0609be27a4be?w=800',
      'https://images.unsplash.com/photo-1619451334792-150fd785ee74?w=800',
    ]),
    content: `Most people do Zanskar in summer. I went in November, when the road over Pensi La closes in two weeks and Padum is preparing for five months of isolation. I wanted to see it before the snow sealed it off.

**Getting There**
Pensi La at 4,401 m had fresh snow. The road was passable — barely. I crossed with a truck convoy and a lot of prayer. The descent into Zanskar Valley felt like dropping into a secret.

**Padum in November**
Population: ~1,000. Guesthouses: 2 still open. Tourists: me. The locals looked at me with equal parts confusion and warmth. My homestay host, Dorje, fed me tsampa and butter tea every morning and refused to let me pay more than ₹800/night.

**Chadar Recon**
The famous Chadar trek (walking the frozen Zanskar River in winter) doesn't start until January-February. I was scouting. The river was just beginning to freeze at the edges — ice forming in patterns I've never seen anywhere else, like the earth was doing calligraphy.

**Rangdum Monastery**
An hour off the main road, perched on a hill surrounded by glaciers. Three monks. No WiFi. One of them showed me a thangka painted 400 years ago, colours still vivid. He offered me tea, we sat in silence, and that was enough.

Coming back in January for the Chadar. The river is calling.`,
  },
];

async function main() {
  const user = await prisma.user.findUnique({ where: { username: 'Bikerbeyondborders' } });
  if (!user) {
    console.error('User bikerbeyondborders not found');
    process.exit(1);
  }

  console.log(`Found user: ${user.username} (id: ${user.id})`);

  for (const post of posts) {
    const journal = await prisma.journal.create({
      data: { ...post, userId: user.id },
    });
    console.log(`Created: "${journal.title}" (id: ${journal.id})`);
  }

  console.log('Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
