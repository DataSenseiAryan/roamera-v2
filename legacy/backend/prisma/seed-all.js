/**
 * Master seed — recreates all demo data from scratch.
 * Run: node prisma/seed-all.js
 *
 * Safe to re-run: clears all existing data first.
 * All passwords are pre-hashed bcrypt strings (cost 10).
 * Default password for demo accounts: "password123"
 * Bikerbeyondborders password: "Bikerbeyondborders"
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ── Users ─────────────────────────────────────────────────────────────────────
// Passwords are bcrypt hashes. To reset to "password123" for all, replace with:
// $2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
const USERS = [
  {
    id: 2,
    username: 'marco_travels',
    email: 'marco@example.com',
    password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    avatar: null,
    bio: 'Chasing sunsets and street food across 40+ countries. Based in Milan, always somewhere else.',
    createdAt: new Date('2026-03-28T06:54:23.000Z'),
  },
  {
    id: 3,
    username: 'leo_backpacker',
    email: 'leo@example.com',
    password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    avatar: null,
    bio: 'Budget traveler & hostel philosopher. Backpacked 6 continents with a 45L pack. Currently planning Antarctica.',
    createdAt: new Date('2026-03-28T06:54:23.000Z'),
  },
  {
    id: 4,
    username: 'kenji_nomad',
    email: 'kenji@example.com',
    password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    avatar: null,
    bio: 'Digital nomad & landscape photographer from Osaka. Coffee snob. Sleep is overrated.',
    createdAt: new Date('2026-03-28T06:54:23.000Z'),
  },
  {
    id: 5,
    username: 'sara_wanders',
    email: 'sara@example.com',
    password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    avatar: null,
    bio: 'Solo female traveler. Hiked Patagonia, island-hopped Greece, survived the Sahara. Next: Mongolian steppes.',
    createdAt: new Date('2026-03-28T06:54:23.000Z'),
  },
  {
    id: 6,
    username: 'ana_explorer',
    email: 'ana@example.com',
    password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    avatar: null,
    bio: 'Mountain runner & alpine climber. If there\'s a via ferrata, I\'m on it. Based in Innsbruck.',
    createdAt: new Date('2026-03-28T06:54:23.000Z'),
  },
  {
    id: 7,
    username: 'Mritunjay',
    email: 'mritunjay@example.com',
    password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    avatar: null,
    bio: null,
    createdAt: new Date('2026-03-28T11:34:00.000Z'),
  },
  {
    id: 8,
    username: 'rakazak',
    email: 'rakazak@example.com',
    password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    avatar: null,
    bio: null,
    createdAt: new Date('2026-03-28T12:00:00.000Z'),
  },
  {
    id: 9,
    username: 'Bikerbeyondborders',
    email: 'bikerbeyondborders@example.com',
    // password: "Bikerbeyondborders"
    password: '$2b$10$xqO3xAEVUNfPjdCK3VQH5.7Qx5.ysrb0MKGlFVpCHOoSTj3rlLeou',
    avatar: null,
    bio: 'Royal Enfield rider. Khardung La, Zanskar, Rameshwaram, Dhanushkodi. 80,000 km and counting. The road never ends.',
    createdAt: new Date('2026-03-28T13:00:00.000Z'),
  },
];

// ── Journals ──────────────────────────────────────────────────────────────────
const JOURNALS = [
  {
    id: 2,
    userId: 2,
    title: 'Two Weeks in Japan: Cherry Blossoms & Ramen',
    destination: 'Tokyo, Japan',
    startDate: new Date('2024-03-25'),
    endDate: new Date('2024-04-08'),
    activities: 'Shinjuku Gyoen hanami, Tsukiji fish market, Arashiyama bamboo grove, Fushimi Inari hike, bullet train to Kyoto, tea ceremony',
    accommodation: 'Shinjuku Granbell Hotel, Tokyo',
    budget: 2800,
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
      'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800',
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800',
    ]),
    content: `Japan in cherry blossom season is not a travel destination — it's a state of mind.\n\nI arrived at Narita on a Tuesday morning, bleary from a 14-hour flight, and by the time I reached Shinjuku the sakura were already mid-peak. Pink clouds over grey concrete. Salarymen eating convenience store onigiri under falling petals. I stood on the bridge over Meguro River and understood immediately why people book this trip a year in advance.\n\n**Tokyo (Days 1–7)**\nShinjuku Gyoen was everything. I got there when the gates opened at 9am and spent three hours just wandering. The Japanese garden in the back has this perfect reflection pond — on a still morning it looks like two skies stacked on each other.\n\nTsukiji outer market for breakfast every day: uni on rice, tamagoyaki, the best tuna sashimi of my life at 7:30am. The inner market moved to Toyosu but the outer stalls are still the real Tokyo.\n\n**Kyoto (Days 8–12)**\nFushimi Inari at 5am — no crowds, just the orange gates and the sound of your own footsteps and distant crows. Took two hours to reach the summit. Worth every step.\n\nThe tea ceremony in Higashiyama was unexpectedly moving. The host, a woman in her 70s, made each bowl with complete attention. No rush. No performance. Just presence.\n\nI came back home with 4,000 photos and a ramen obsession that hasn't gone away.`,
    createdAt: new Date('2026-03-28T07:00:00.000Z'),
  },
  {
    id: 3,
    userId: 5,
    title: 'Solo Road Trip Through Patagonia',
    destination: 'Patagonia, Argentina & Chile',
    startDate: new Date('2023-11-15'),
    endDate: new Date('2023-12-05'),
    activities: 'Torres del Paine W trek, Perito Moreno glacier walk, El Chaltén hiking, Route 40 drive, whale watching in Puerto Madryn',
    accommodation: 'EcoCamp Patagonia, Puerto Natales',
    budget: 3200,
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800',
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800',
    ]),
    content: `Patagonia breaks you open.\n\nI rented a car in Punta Arenas and drove north for three weeks. The wind here is a character — on some days it nearly knocked me off my feet on the trail, on others it was completely still and the lakes were like mirrors reflecting the Torres.\n\nThe W trek took five days. Day 3 — the approach to the Torres base — is one of the great walks of the world. You hike for hours through lenga beech forest, past turquoise lakes, and then the trail turns a corner and there they are: three granite towers rising 2,000 metres straight out of a lake. I sat there for an hour and didn't take a single photo for the first twenty minutes.\n\nPerito Moreno is the glacier that's actually advancing — most glaciers are retreating, but this one is growing. You hear it before you see it: deep cracks and booms as house-sized chunks calve into the lake. I watched a piece the size of a five-story building fall and disappear into white foam.\n\nEl Chaltén is a hiker's town with one ATM and the best empanadas in Argentina. I spent three days there and hiked to Laguna de los Tres — Fitz Roy at sunrise turns pink and gold. My alarm was 4am and it was absolutely worth it.\n\nPatagonia is not comfortable travel. It's expensive, windy, remote, and logistically demanding. It's also the most beautiful place I've ever been.`,
    createdAt: new Date('2026-03-28T07:10:00.000Z'),
  },
  {
    id: 4,
    userId: 4,
    title: 'One Month in Southeast Asia on $30/Day',
    destination: 'Thailand, Vietnam & Cambodia',
    startDate: new Date('2024-01-05'),
    endDate: new Date('2024-02-05'),
    activities: 'Chiang Mai cooking class, Ha Long Bay cruise, Angkor Wat sunrise, motorbike through Vietnamese highlands, Full Moon Party Ko Pha Ngan',
    accommodation: 'Various guesthouses and hostels',
    budget: 900,
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      'https://images.unsplash.com/photo-1540202404-d0c7fe46a087?w=800',
    ]),
    content: `Southeast Asia on a budget is not a sacrifice — it's a skill.\n\nI flew into Bangkok on January 5th with a one-way ticket and a rough plan. Thirty-one days later I'd been to twelve cities, eaten more pad thai than is medically advisable, and spent exactly $912 including flights between countries.\n\n**Thailand**\nChiang Mai is the gateway drug. The old city, the cooking classes, the Sunday Walking Street. I did a two-day cooking class with a family in the countryside — learned 8 dishes, ate all of them, went back for seconds on the green curry.\n\n**Vietnam**\nRented a semi-automatic motorbike in Hanoi and rode the Ho Chi Minh road south over four days. Mountain passes, misty valleys, one terrifying bridge over a gorge. A monk invited me in for tea at a pagoda in the mountains. We communicated entirely through gestures and Google Translate.\n\nHa Long Bay on a two-night cruise — kayaking through limestone karsts at dawn, phosphorescent plankton at night. The photos don't do it justice.\n\n**Cambodia**\nAngkor Wat at sunrise. Get there by 5am. Watch the sky turn orange and pink above the temple's reflection in the moat. Every person who told me it was worth it was right.\n\n$30/day is absolutely doable if you eat local, take buses, and sleep in good hostels. The food is better anyway.`,
    createdAt: new Date('2026-03-28T07:20:00.000Z'),
  },
  {
    id: 5,
    userId: 4,
    title: 'Crossing Iceland by Campervan in August',
    destination: 'Iceland',
    startDate: new Date('2023-08-01'),
    endDate: new Date('2023-08-15'),
    activities: 'Ring Road drive, Jökulsárlón glacier lagoon, Landmannalaugar hot springs, puffin watching, midnight sun photography, Seljalandsfoss waterfall',
    accommodation: 'Self-converted Sprinter van',
    budget: 2100,
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1531168556467-80aace0d0144?w=800',
      'https://images.unsplash.com/photo-1476610182048-b716b8518aae?w=800',
    ]),
    content: `Iceland in August: no darkness, impossible colours, and roads that feel like another planet.\n\nWe rented a converted Sprinter van in Reykjavík and drove the Ring Road clockwise. 1,332 km. 15 days. Zero regrets.\n\nThe midnight sun is genuinely disorienting. At 2am it looks like 7pm. You stop caring about time. You just drive, pull over when something looks incredible (which is every 15 minutes), cook on the camp stove, and sleep when you're tired regardless of what the clock says.\n\nJökulsárlón was the highlight — a glacial lagoon full of icebergs drifting into the Atlantic. Seals resting on the ice. The icebergs range from white to electric blue depending on their density. We spent four hours there and it wasn't enough.\n\nLandmannalaugar is a geothermal area in the interior — rainbow-coloured rhyolite mountains, bubbling mud pots, and a natural hot spring that you soak in while looking at a snowfield 200 metres away. The drive in requires a 4WD river crossing. Worth every nerve.\n\nFuel and groceries are expensive in Iceland. Van life cuts your costs dramatically — we averaged €140/day for two people including fuel, which for Iceland is genuinely cheap.`,
    createdAt: new Date('2026-03-28T07:30:00.000Z'),
  },
  {
    id: 6,
    userId: 5,
    title: 'Island Hopping the Greek Cyclades',
    destination: 'Santorini, Mykonos & Naxos, Greece',
    startDate: new Date('2024-06-10'),
    endDate: new Date('2024-06-24'),
    activities: 'Oia sunset, Akrotiri excavations, Mykonos windmills, Little Venice, Naxos mountain villages, boat trip to volcanic Thirassia',
    accommodation: 'Amoudi Villas, Santorini',
    budget: 2600,
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800',
      'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800',
    ]),
    content: `I've seen that Santorini photo — the white domes against the blue Aegean — approximately ten thousand times on Instagram. I expected to be underwhelmed.\n\nI was not underwhelmed.\n\nThe thing photos don't capture is the light. In the evenings, around 6–8pm, everything turns gold. The white walls glow amber. The caldera goes from blue to violet to deep purple. The famous Oia sunset? Yes, it's crowded. Yes, it's still spectacular. Stand at the edge of the caldera and watch 200 strangers go quiet at the same moment.\n\nNaxos was the surprise. Less famous, far less expensive, and arguably more beautiful. I rented a scooter and spent two days in the mountain villages — Apiranthos, Filoti, Halki. Old women selling homemade cheese. Kafeneions with no menus, just whatever they made that day. The Portara, the marble doorway to an unfinished temple, standing alone on a promontory overlooking the port.\n\nMykonos: yes, it's party island. But hit it on a Tuesday morning before anyone is awake and the Little Venice waterfront is genuinely magical. Waves lapping the restaurant terraces, pelicans wandering the streets, nothing open yet.\n\nFerry between islands: €25–40. Non-negotiable and worth it.`,
    createdAt: new Date('2026-03-28T07:40:00.000Z'),
  },
  {
    id: 7,
    userId: 6,
    title: 'Hiking the Alta Via 1 in the Dolomites',
    destination: 'Dolomites, Italy',
    startDate: new Date('2024-07-20'),
    endDate: new Date('2024-08-02'),
    activities: 'Alta Via 1 full traverse, via ferrata on Lagazuoi, Three Peaks of Lavaredo, rifugio hopping, mountain running on the Alpe di Siusi',
    accommodation: 'Series of mountain rifugios along the route',
    budget: 1400,
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
    ]),
    content: `The Dolomites look fake. Not in a bad way — in the way that makes you keep stopping to check if it's real.\n\nThe Alta Via 1 runs 120km from Lago di Braies to Belluno through some of the most dramatic mountain terrain in Europe. Sheer rose-coloured walls, flower meadows, rickety via ferrata cables, rifugios perched at 2,400 metres serving polenta and wine.\n\nI did it in 12 days, staying in rifugios every night. The rifugio culture is the real magic — shared dorms with strangers who become trail friends by day two. At dinner everyone sits together, orders the same fixed menu, and swaps stories in four languages.\n\nDay 4 — the traverse below the Marmolada — is the showstopper. The glacier above you, the valley 1,500m below, a narrow path cut into limestone. I moved slowly and took too many photos.\n\nThe via ferrata on Lagazuoi: fixed iron rungs and cables up a vertical rock face. Exposure that makes your legs go strange. The view from the top justifies every terrifying metre.\n\nThree Peaks of Lavaredo at sunrise: 5am alarm, headtorch, coffee from a thermos. The three towers emerging from morning mist. About fifty other photographers had the same idea. Nobody minded.\n\nBest decision: book rifugios two weeks in advance in July. Second best decision: bring trekking poles.`,
    createdAt: new Date('2026-03-28T07:50:00.000Z'),
  },
  {
    id: 8,
    userId: 2,
    title: 'Weekend in Lisbon: Pastéis and Viewpoints',
    destination: 'Lisbon, Portugal',
    startDate: new Date('2024-04-12'),
    endDate: new Date('2024-04-15'),
    activities: 'Alfama fado night, Belém pastéis de nata, Tram 28, LX Factory Sunday market, viewpoints at Portas do Sol and Miradouro da Graça',
    accommodation: 'Bairro Alto Hotel',
    budget: 680,
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800',
      'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800',
    ]),
    content: `Lisbon is the city I keep coming back to. This was trip number three, and it hit differently every time.\n\nThe Alfama at night: steep cobblestones, laundry overhead, the sound of fado drifting from somewhere. I found a tiny restaurant with twelve seats, no menu in English, and ordered by pointing. The bacalhau à brás was the best thing I ate all weekend.\n\nPastéis de nata at the original Pastéis de Belém: yes, there's a queue. Yes, it moves fast. Yes, eat them immediately with cinnamon and powdered sugar while standing at the counter.\n\nTram 28 is genuinely useful, not just a tourist attraction — it connects Alfama to Chiado and the hills are too steep to walk up comfortably. Grab a spot by the window and hang on.\n\nThe LX Factory is a repurposed industrial complex that now houses restaurants, concept stores, and a Sunday book market. Arrived at noon, stayed until evening.\n\nLisbon works perfectly as a long weekend. Fly in Friday, leave Monday. You'll see everything that matters and want to come back for more.`,
    createdAt: new Date('2026-03-28T08:00:00.000Z'),
  },
  {
    id: 9,
    userId: 3,
    title: 'Morocco in 10 Days: Medinas, Sahara & Valleys',
    destination: 'Morocco',
    startDate: new Date('2024-02-20'),
    endDate: new Date('2024-03-01'),
    activities: 'Marrakech medina, Jardin Majorelle, Sahara camel trek & camp, Todra Gorge hike, Aït Benhaddou kasbah, Fes tanneries, Atlas Mountain passes',
    accommodation: 'Riad Yasmine, Marrakech',
    budget: 1100,
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=800',
      'https://images.unsplash.com/photo-1523413307017-2a0a29d0e0af?w=800',
    ]),
    content: `Morocco overwhelms every sense simultaneously, and that's the point.\n\nMarrakech Djemaa el-Fna at dusk: snake charmers, drummers, smoke from meat stalls, orange juice sellers, tourists and locals and everyone in between. Chaos that somehow works. I got lost in the souk for two hours and bought a carpet I definitely didn't need.\n\nThe drive from Marrakech to Merzouga for the Sahara took a full day but I'd do it again. Crossing the High Atlas at Tizi n'Tichka pass (2,260m) in February, there was snow on the peaks. Then descent into red earth and palmeries and eventually the erg — the sea of dunes.\n\nCamel trek at sunset into the dunes, camp overnight in a Berber tent, wake at 5am for sunrise on the sand. The silence is complete. The light turns the dunes from orange to gold to pink in about twenty minutes. One of those experiences you can't really describe.\n\nFes is a different Morocco — older, more labyrinthine, less touristy. The tanneries from the rooftop overlooks are extraordinary: circles of coloured dye vats, workers knee-deep in pigment. The smell is powerful. Bring the mint they offer you.\n\nMorocco is very affordable if you eat local, bargain reasonably, and skip the tourist restaurants. The street food is consistently excellent.`,
    createdAt: new Date('2026-03-28T08:10:00.000Z'),
  },
  {
    id: 10,
    userId: 9,
    title: 'Riding the Rooftop — Ladakh on Two Wheels',
    destination: 'Leh, Ladakh',
    startDate: new Date('2024-07-04'),
    endDate: new Date('2024-07-14'),
    activities: 'Khardung La Pass ride, Pangong Tso lake visit, Nubra Valley sand dunes, Magnetic Hill, Hall of Fame museum, Shanti Stupa sunrise',
    accommodation: 'The Grand Dragon Ladakh, Leh',
    budget: 32000,
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800',
      'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=800',
      'https://images.unsplash.com/photo-1598885159339-4fde4de46c10?w=800',
      'https://images.unsplash.com/photo-1560179007-bfdd338184e3?w=800',
    ]),
    content: `The moment my Royal Enfield crested Khardung La at 18,379 ft, I understood why people call Ladakh the last frontier. The air was thin, the road was brutal, and the sky was a shade of blue I'd never seen at sea level.\n\nI left Delhi at 3am on July 4th, aiming to hit Manali by evening and start the Leh–Manali Highway the next morning. Two days of riding through Rohtang Pass, Baralacha La, Nakee La, and Tanglang La — each one higher, colder, and more spectacular than the last.\n\n**Day 1 – Manali to Jispa (170 km)**\nThe road disintegrates past Rohtang. It's not a road — it's a suggestion. My panniers rattled, my hands went numb, and I fell twice in loose river gravel. Both times, Ladakhi army boys on patrol helped me up, laughing with me, not at me. That's the magic up here.\n\n**Day 3 – Sarchu to Leh via Tanglang La**\nAltitude sickness hit me at Pang. Headache, nausea, the works. I stopped, drank three litres of water, ate nothing, and rode slow. By the time Leh valley opened up below me, I was crying and I didn't even try to stop it.\n\n**Pangong Tso**\nYou don't photograph Pangong — you just stare. The lake changes colour every hour. Dawn: steel grey. Morning: jade green. Afternoon: that impossible cobalt that looks photoshopped even when you're standing in front of it.\n\n**Nubra Valley via Khardung La**\nThe highest motorable road in the world. My bike stalled twice near the summit. I pushed her the last 200 metres. We both earned that view.\n\nThis trip broke me and rebuilt me. 2,100 km in 11 days. I'd do it again tomorrow.`,
    createdAt: new Date('2026-03-29T10:00:00.000Z'),
  },
  {
    id: 11,
    userId: 9,
    title: 'Rameshwaram: Where the Ocean Meets the Sacred',
    destination: 'Rameshwaram, Tamil Nadu',
    startDate: new Date('2024-01-12'),
    endDate: new Date('2024-01-16'),
    activities: "Ramanathaswamy Temple corridors, Pamban Bridge ride, Dhanushkodi ghost town, Adam's Bridge viewpoint, sunrise at Agni Theertham beach",
    accommodation: 'Hotel Maharaja, Rameshwaram',
    budget: 9500,
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800',
      'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=800',
      'https://images.unsplash.com/photo-1567591370105-49c7af62a848?w=800',
    ]),
    content: `I arrived in Rameshwaram at dusk, crossing the Pamban Bridge as the sun dropped into the Palk Strait on one side and the Bay of Bengal turned gold on the other. The bridge is 2.3 km of pure drama — single lane, swing section in the middle, trains running the same track. I stopped mid-bridge and just breathed.\n\n**Ramanathaswamy Temple**\nThe temple corridor is the longest in Asia — 1,212 metres of pillared walkway. Walk it barefoot at 5am when the priests are doing the first abhishekam and you'll understand why people cross oceans to get here. The 22 theerthams (sacred wells) each have different water — some salty, some sweet, all cold at dawn.\n\n**Dhanushkodi**\nThis is the part nobody tells you about. Dhanushkodi is a ghost town — wiped out by the 1964 cyclone, never rebuilt. You ride 18 km on loose sand past the ruins of a church, a railway station, a post office. At the very tip of the island, India ends. Sri Lanka is 22 km away across shallow water you can almost walk to.\n\nThe light at Dhanushkodi is surreal. White sand, aquamarine water, crumbled walls. I sat there for two hours and didn't want to leave.\n\n**The Ride Back**\nTamil Nadu coastal roads in January are perfect — 25°C, light traffic, coconut groves, fishing villages. I stopped at a roadside stall near Mandapam and had the best prawn curry of my life for ₹120. The woman who served it had never heard of Instagram. Good.\n\nRameshwaram doesn't ask for much. Just your shoes and your silence.`,
    createdAt: new Date('2026-03-29T10:10:00.000Z'),
  },
  {
    id: 12,
    userId: 9,
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
    content: `Most people do Zanskar in summer. I went in November, when the road over Pensi La closes in two weeks and Padum is preparing for five months of isolation. I wanted to see it before the snow sealed it off.\n\n**Getting There**\nPensi La at 4,401 m had fresh snow. The road was passable — barely. I crossed with a truck convoy and a lot of prayer. The descent into Zanskar Valley felt like dropping into a secret.\n\n**Padum in November**\nPopulation: ~1,000. Guesthouses: 2 still open. Tourists: me. The locals looked at me with equal parts confusion and warmth. My homestay host, Dorje, fed me tsampa and butter tea every morning and refused to let me pay more than ₹800/night.\n\n**Chadar Recon**\nThe famous Chadar trek (walking the frozen Zanskar River in winter) doesn't start until January-February. I was scouting. The river was just beginning to freeze at the edges — ice forming in patterns I've never seen anywhere else, like the earth was doing calligraphy.\n\n**Rangdum Monastery**\nAn hour off the main road, perched on a hill surrounded by glaciers. Three monks. No WiFi. One of them showed me a thangka painted 400 years ago, colours still vivid. He offered me tea, we sat in silence, and that was enough.\n\nComing back in January for the Chadar. The river is calling.`,
    createdAt: new Date('2026-03-29T10:20:00.000Z'),
  },
];

// ── Follows ───────────────────────────────────────────────────────────────────
const FOLLOWS = [
  { followerId: 2, followingId: 3 },
  { followerId: 2, followingId: 4 },
  { followerId: 2, followingId: 9 },
  { followerId: 3, followingId: 2 },
  { followerId: 3, followingId: 5 },
  { followerId: 4, followingId: 2 },
  { followerId: 4, followingId: 5 },
  { followerId: 4, followingId: 9 },
  { followerId: 5, followingId: 4 },
  { followerId: 5, followingId: 6 },
  { followerId: 6, followingId: 5 },
  { followerId: 7, followingId: 9 },
  { followerId: 8, followingId: 9 },
];

// ── Likes / Reactions ─────────────────────────────────────────────────────────
const LIKES = [
  { userId: 3, journalId: 2, type: 'love' },
  { userId: 4, journalId: 2, type: 'epic' },
  { userId: 5, journalId: 2, type: 'love' },
  { userId: 6, journalId: 2, type: 'wanna_go' },
  { userId: 2, journalId: 3, type: 'epic' },
  { userId: 4, journalId: 3, type: 'wanna_go' },
  { userId: 6, journalId: 3, type: 'love' },
  { userId: 2, journalId: 4, type: 'love' },
  { userId: 3, journalId: 4, type: 'wanna_go' },
  { userId: 5, journalId: 4, type: 'epic' },
  { userId: 3, journalId: 5, type: 'wanna_go' },
  { userId: 5, journalId: 5, type: 'love' },
  { userId: 2, journalId: 6, type: 'love' },
  { userId: 4, journalId: 6, type: 'wanna_go' },
  { userId: 3, journalId: 7, type: 'epic' },
  { userId: 4, journalId: 7, type: 'wanna_go' },
  { userId: 6, journalId: 7, type: 'love' },
  { userId: 3, journalId: 8, type: 'love' },
  { userId: 5, journalId: 8, type: 'wanna_go' },
  { userId: 2, journalId: 9, type: 'wanna_go' },
  { userId: 4, journalId: 9, type: 'love' },
  { userId: 5, journalId: 9, type: 'epic' },
  { userId: 2, journalId: 10, type: 'epic' },
  { userId: 3, journalId: 10, type: 'love' },
  { userId: 5, journalId: 10, type: 'wanna_go' },
  { userId: 7, journalId: 10, type: 'epic' },
  { userId: 8, journalId: 10, type: 'love' },
  { userId: 4, journalId: 11, type: 'wanna_go' },
  { userId: 6, journalId: 11, type: 'love' },
  { userId: 7, journalId: 12, type: 'epic' },
];

// ── Comments ──────────────────────────────────────────────────────────────────
const COMMENTS = [
  { userId: 3, journalId: 2,  content: 'The Shinjuku Gyoen photos are stunning! Did you go during peak bloom?', createdAt: new Date('2026-03-28T09:00:00.000Z') },
  { userId: 5, journalId: 2,  content: 'Adding this to my 2025 bucket list immediately.', createdAt: new Date('2026-03-28T09:30:00.000Z') },
  { userId: 4, journalId: 2,  content: 'The tea ceremony part gave me goosebumps. Pure presence.', createdAt: new Date('2026-03-28T10:00:00.000Z') },
  { userId: 2, journalId: 3,  content: 'Torres del Paine has been on my list for years. How was the weather?', createdAt: new Date('2026-03-28T10:30:00.000Z') },
  { userId: 6, journalId: 3,  content: 'The Fitz Roy sunrise shot is unreal. 4am alarm is worth it!', createdAt: new Date('2026-03-28T11:00:00.000Z') },
  { userId: 2, journalId: 4,  content: 'How did you manage $30/day? That\'s impressive even by SEA standards!', createdAt: new Date('2026-03-28T11:30:00.000Z') },
  { userId: 6, journalId: 4,  content: 'The Angkor Wat tip is gold. 5am is the only way to do it.', createdAt: new Date('2026-03-28T12:00:00.000Z') },
  { userId: 3, journalId: 5,  content: 'The midnight sun sounds so disorienting! I bet it plays havoc with sleep.', createdAt: new Date('2026-03-28T12:30:00.000Z') },
  { userId: 2, journalId: 6,  content: 'Naxos is so underrated! Most people skip it and go straight to Santorini.', createdAt: new Date('2026-03-28T13:00:00.000Z') },
  { userId: 4, journalId: 6,  content: 'That Oia sunset photo is doing things to me.', createdAt: new Date('2026-03-28T13:30:00.000Z') },
  { userId: 4, journalId: 7,  content: 'Alta Via 1 is my dream hike. The rifugio system is so civilised!', createdAt: new Date('2026-03-28T14:00:00.000Z') },
  { userId: 5, journalId: 7,  content: 'The via ferrata section sounds terrifying in the best way possible.', createdAt: new Date('2026-03-28T14:30:00.000Z') },
  { userId: 4, journalId: 8,  content: 'Pastéis de Belém are life. I ate six in one sitting. No regrets.', createdAt: new Date('2026-03-28T15:00:00.000Z') },
  { userId: 2, journalId: 9,  content: 'The Sahara overnight camp sounds unbelievable. Was it cold?', createdAt: new Date('2026-03-28T15:30:00.000Z') },
  { userId: 5, journalId: 9,  content: 'Dyes in the Fes tanneries are something else. Saw them in 2022!', createdAt: new Date('2026-03-28T16:00:00.000Z') },
  { userId: 2, journalId: 10, content: 'Khardung La on a Royal Enfield — this is the dream! How was the altitude sickness?', createdAt: new Date('2026-03-29T11:00:00.000Z') },
  { userId: 3, journalId: 10, content: 'Pangong Tso changing colours! I need to see this with my own eyes.', createdAt: new Date('2026-03-29T11:30:00.000Z') },
  { userId: 7, journalId: 10, content: 'Bhai kamal hai yaar! Nubra Valley mein bhi gaye the?', createdAt: new Date('2026-03-29T12:00:00.000Z') },
  { userId: 8, journalId: 10, content: 'This is insane. 2100 km in 11 days on an RE, absolute legend.', createdAt: new Date('2026-03-29T12:30:00.000Z') },
  { userId: 4, journalId: 11, content: 'Dhanushkodi ghost town sounds haunting and beautiful at the same time.', createdAt: new Date('2026-03-29T13:00:00.000Z') },
  { userId: 6, journalId: 11, content: 'The Pamban Bridge at sunset must be incredible. Adding to bucket list!', createdAt: new Date('2026-03-29T13:30:00.000Z') },
  { userId: 7, journalId: 12, content: 'Chadar trek is on my list! January mein plan kar rahe hain?', createdAt: new Date('2026-03-29T14:00:00.000Z') },
  { userId: 8, journalId: 12, content: 'Zanskar in November, respect. Most people would never even attempt this.', createdAt: new Date('2026-03-29T14:30:00.000Z') },
];

// ── Destinations (30) ─────────────────────────────────────────────────────────
const DESTINATIONS = [
  { id: 1,  name: 'Bali',            country: 'Indonesia',      description: 'Island of temples, rice terraces, and spiritual energy.',           coverImage: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600', category: 'Islands',    tags: JSON.stringify(['temples','surfing','rice terraces','spiritual']) },
  { id: 2,  name: 'Santorini',       country: 'Greece',         description: 'Iconic white-domed architecture above a volcanic caldera.',          coverImage: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600', category: 'Islands',    tags: JSON.stringify(['sunsets','wine','caldera','architecture']) },
  { id: 3,  name: 'Machu Picchu',    country: 'Peru',           description: 'The Lost City of the Incas perched high in the Andes.',              coverImage: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=600', category: 'Mountains',  tags: JSON.stringify(['inca','hiking','history','andes']) },
  { id: 4,  name: 'Kyoto',           country: 'Japan',          description: 'Ancient temples, bamboo groves, and timeless Japanese culture.',     coverImage: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600', category: 'City',       tags: JSON.stringify(['temples','geisha','bamboo','zen']) },
  { id: 5,  name: 'Amalfi Coast',    country: 'Italy',          description: 'Dramatic cliffs, pastel villages, and turquoise Mediterranean.',     coverImage: 'https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?w=600', category: 'Beaches',    tags: JSON.stringify(['cliffs','seafood','villages','boat trips']) },
  { id: 6,  name: 'Sahara Desert',   country: 'Morocco',        description: 'Vast sand dunes, Berber camps, and a sky full of stars.',            coverImage: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=600', category: 'Deserts',    tags: JSON.stringify(['dunes','camels','stars','berber']) },
  { id: 7,  name: 'Patagonia',       country: 'Argentina/Chile',description: 'End-of-the-world landscapes: glaciers, peaks, and endless plains.',  coverImage: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600', category: 'Mountains',  tags: JSON.stringify(['glaciers','trekking','torres','wind']) },
  { id: 8,  name: 'Maldives',        country: 'Maldives',       description: 'Overwater bungalows in crystal-clear Indian Ocean atolls.',          coverImage: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=600', category: 'Islands',    tags: JSON.stringify(['overwater','diving','luxury','coral']) },
  { id: 9,  name: 'Leh Ladakh',      country: 'India',          description: 'High-altitude desert of monasteries, lakes, and mountain passes.',   coverImage: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600', category: 'Mountains',  tags: JSON.stringify(['monasteries','motorcycle','pangong','altitude']) },
  { id: 10, name: 'Cappadocia',      country: 'Turkey',         description: 'Surreal fairy chimneys and hot-air balloons at dawn.',               coverImage: 'https://images.unsplash.com/photo-1533130061792-64b345e4a833?w=600', category: 'Adventure',  tags: JSON.stringify(['balloons','caves','fairy chimneys','hiking']) },
  { id: 11, name: 'Banff',           country: 'Canada',         description: 'Rocky Mountain national park with glacial turquoise lakes.',         coverImage: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600', category: 'Mountains',  tags: JSON.stringify(['lakes','elk','skiing','glaciers']) },
  { id: 12, name: 'Angkor Wat',      country: 'Cambodia',       description: 'The world\'s largest religious monument at sunrise.',                coverImage: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600', category: 'Religious',  tags: JSON.stringify(['temples','khmer','sunrise','history']) },
  { id: 13, name: 'Iceland',         country: 'Iceland',        description: 'Land of fire, ice, midnight sun, and the northern lights.',          coverImage: 'https://images.unsplash.com/photo-1476610182048-b716b8518aae?w=600', category: 'Adventure',  tags: JSON.stringify(['aurora','geysers','glaciers','waterfalls']) },
  { id: 14, name: 'Petra',           country: 'Jordan',         description: 'The Rose City carved into rose-red cliffs by the Nabataeans.',      coverImage: 'https://images.unsplash.com/photo-1469041797191-50ace28483c3?w=600', category: 'Deserts',    tags: JSON.stringify(['ancient','rock-cut','nabataean','desert']) },
  { id: 15, name: 'Dolomites',       country: 'Italy',          description: 'Dramatic pink limestone spires above flower-filled alpine meadows.',  coverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600', category: 'Mountains',  tags: JSON.stringify(['via ferrata','rifugios','hiking','skiing']) },
  { id: 16, name: 'Ha Long Bay',     country: 'Vietnam',        description: 'Thousands of limestone karsts rising from emerald waters.',          coverImage: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600', category: 'Islands',    tags: JSON.stringify(['karsts','kayaking','cruise','limestone']) },
  { id: 17, name: 'Serengeti',       country: 'Tanzania',       description: 'The Great Migration across endless golden savannah.',                coverImage: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=600', category: 'Adventure',  tags: JSON.stringify(['safari','migration','lions','wildlife']) },
  { id: 18, name: 'Varanasi',        country: 'India',          description: 'The spiritual heart of India on the banks of the Ganges.',           coverImage: 'https://images.unsplash.com/photo-1561361058-c24e01cc6c35?w=600', category: 'Religious',  tags: JSON.stringify(['ghats','ganges','cremation','spirituality']) },
  { id: 19, name: 'Cinque Terre',    country: 'Italy',          description: 'Five colourful fishing villages clinging to the Ligurian coast.',    coverImage: 'https://images.unsplash.com/photo-1499678329028-101435549a4e?w=600', category: 'Beaches',    tags: JSON.stringify(['hiking','colourful','villages','coast']) },
  { id: 20, name: 'Marrakech',       country: 'Morocco',        description: 'A labyrinthine medina of souks, riads, and Djemaa el-Fna magic.',    coverImage: 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=600', category: 'City',       tags: JSON.stringify(['souks','riads','food','culture']) },
  { id: 21, name: 'Great Barrier Reef', country: 'Australia',  description: 'The world\'s largest coral reef system, teeming with marine life.',  coverImage: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=600', category: 'Islands',    tags: JSON.stringify(['diving','snorkeling','coral','marine life']) },
  { id: 22, name: 'Havana',          country: 'Cuba',           description: 'Vintage American cars, salsa rhythms, and crumbling grandeur.',      coverImage: 'https://images.unsplash.com/photo-1500930287596-c1ecaa373bb2?w=600', category: 'City',       tags: JSON.stringify(['cars','salsa','rum','architecture']) },
  { id: 23, name: 'Wadi Rum',        country: 'Jordan',         description: 'Mars-like red desert valleys carved by wind and time.',              coverImage: 'https://images.unsplash.com/photo-1547234935-80c7145ec969?w=600', category: 'Deserts',    tags: JSON.stringify(['bedouin','camping','rock formations','stargazing']) },
  { id: 24, name: 'Bagan',           country: 'Myanmar',        description: 'Over 2,000 ancient pagodas across a misty plain at sunrise.',        coverImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600', category: 'Religious',  tags: JSON.stringify(['pagodas','hot air balloon','temples','sunrise']) },
  { id: 25, name: 'Norwegian Fjords',country: 'Norway',         description: 'Dramatic fjords, waterfalls, and midnight sun in Scandinavia.',      coverImage: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=600', category: 'Mountains',  tags: JSON.stringify(['fjords','kayaking','midnight sun','hiking']) },
  { id: 26, name: 'Galapagos Islands', country: 'Ecuador',     description: 'Darwin\'s living laboratory of unique wildlife and volcanic shores.', coverImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600', category: 'Islands',    tags: JSON.stringify(['wildlife','diving','tortoises','volcanic']) },
  { id: 27, name: 'Rameshwaram',     country: 'India',          description: 'Sacred island city at the tip of India, where ocean meets devotion.', coverImage: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600', category: 'Religious',  tags: JSON.stringify(['temple','pilgrimage','pamban bridge','dhanushkodi']) },
  { id: 28, name: 'Aoraki Mount Cook', country: 'New Zealand',  description: 'New Zealand\'s tallest peak surrounded by glaciers and stargazing.', coverImage: 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=600', category: 'Mountains',  tags: JSON.stringify(['glaciers','stargazing','hiking','alpine']) },
  { id: 29, name: 'Chefchaouen',     country: 'Morocco',        description: 'The enchanting Blue City nestled in the Rif Mountains.',             coverImage: 'https://images.unsplash.com/photo-1553603227-2358aabe8e47?w=600', category: 'City',       tags: JSON.stringify(['blue city','rif mountains','photography','medina']) },
  { id: 30, name: 'Phuket',          country: 'Thailand',       description: 'Thailand\'s largest island with beaches, nightlife, and temples.',   coverImage: 'https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?w=600', category: 'Beaches',    tags: JSON.stringify(['beaches','nightlife','temples','diving']) },
];

// ── Seed ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Clearing existing data…');
  await prisma.notification.deleteMany();
  await prisma.bucketList.deleteMany();
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.journal.deleteMany();
  await prisma.destination.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding users…');
  for (const u of USERS) {
    await prisma.user.create({ data: u });
  }

  console.log('Seeding destinations…');
  for (const d of DESTINATIONS) {
    await prisma.destination.create({ data: d });
  }

  console.log('Seeding journals…');
  for (const j of JOURNALS) {
    await prisma.journal.create({ data: j });
  }

  console.log('Seeding follows…');
  for (const f of FOLLOWS) {
    await prisma.follow.create({ data: f });
  }

  console.log('Seeding likes/reactions…');
  for (const l of LIKES) {
    await prisma.like.create({ data: l });
  }

  console.log('Seeding comments…');
  for (const c of COMMENTS) {
    await prisma.comment.create({ data: c });
  }

  console.log('\nDone! Summary:');
  console.log(`  Users:        ${USERS.length}`);
  console.log(`  Journals:     ${JOURNALS.length}`);
  console.log(`  Destinations: ${DESTINATIONS.length}`);
  console.log(`  Follows:      ${FOLLOWS.length}`);
  console.log(`  Reactions:    ${LIKES.length}`);
  console.log(`  Comments:     ${COMMENTS.length}`);
  console.log('\nAll accounts password: password123');
  console.log('Bikerbeyondborders password: Bikerbeyondborders');
}

main().catch(console.error).finally(() => prisma.$disconnect());
