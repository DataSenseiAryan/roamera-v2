/**
 * Seed dummy itinerary data into existing journals.
 * Run with: node prisma/seed-itinerary.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const itineraries = {
  "Two Weeks in Japan: Cherry Blossoms & Ramen": [
    { day: 1, activity: "Arrive & explore Shinjuku", location: "Shinjuku, Tokyo", notes: "Try ramen at Ichiran" },
    { day: 2, activity: "Senso-ji Temple & Asakusa", location: "Asakusa, Tokyo", notes: "Early morning to avoid crowds" },
    { day: 3, activity: "Shibuya Crossing & Harajuku", location: "Shibuya, Tokyo", notes: "Visit Takeshita Street" },
    { day: 4, activity: "Day trip to Nikko", location: "Nikko, Tochigi", notes: "Book JR Pass in advance" },
    { day: 5, activity: "TeamLab Planets & Odaiba", location: "Odaiba, Tokyo", notes: "Book TeamLab tickets online" },
  ],
  "Solo Road Trip Through Patagonia": [
    { day: 1, activity: "Arrive in Puerto Natales", location: "Puerto Natales, Chile", notes: "Stock up on supplies" },
    { day: 2, activity: "Torres del Paine base trek", location: "Torres del Paine NP", notes: "Start at 5am for sunrise" },
    { day: 3, activity: "Grey Glacier hike", location: "Grey Lake", notes: "Bring crampons" },
    { day: 4, activity: "Los Glaciares NP Argentina", location: "El Chaltan, Argentina", notes: "Cerro Fitz Roy trail" },
    { day: 5, activity: "Kayaking on Serrano River", location: "Serrano River", notes: "Book through local operator" },
  ],
  "One Month in Southeast Asia on $30/Day": [
    { day: 1, activity: "Bangkok temples & street food", location: "Bangkok, Thailand", notes: "Try pad see ew at Chinatown" },
    { day: 2, activity: "Chiang Mai night market", location: "Chiang Mai, Thailand", notes: "Sunday Walking Street" },
    { day: 3, activity: "Hoi An Old Town cycling", location: "Hoi An, Vietnam", notes: "Rent bikes for $2/day" },
    { day: 4, activity: "Angkor Wat sunrise", location: "Siem Reap, Cambodia", notes: "Hire tuk-tuk the night before" },
    { day: 5, activity: "Ta Prohm & Bayon temples", location: "Angkor, Cambodia", notes: "3-day pass recommended" },
  ],
  "Crossing Iceland by Campervan in August": [
    { day: 1, activity: "Golden Circle — Geysir & Gullfoss", location: "South Iceland", notes: "Rent a car, self-drive" },
    { day: 2, activity: "Black sand beach & glacier walk", location: "Reynisfjara & Jokulsarlon", notes: "Wear waterproof boots" },
    { day: 3, activity: "Northern Lights hunt", location: "Vik, Iceland", notes: "Check forecast on vedur.is" },
    { day: 4, activity: "Snaefellsnes Peninsula drive", location: "Snaefellsnes", notes: "Kirkjufell mountain stop" },
    { day: 5, activity: "Blue Lagoon & Reykjavik", location: "Reykjavik, Iceland", notes: "Book Blue Lagoon in advance" },
  ],
  "Island Hopping the Greek Cyclades": [
    { day: 1, activity: "Arrive Santorini, explore Fira", location: "Fira, Santorini", notes: "Cable car to old port" },
    { day: 2, activity: "Oia sunset & caldera view", location: "Oia, Santorini", notes: "Arrive 2hrs before sunset" },
    { day: 3, activity: "Catamaran sailing trip", location: "Aegean Sea", notes: "Book half-day tour" },
    { day: 4, activity: "Mykonos — Little Venice & windmills", location: "Mykonos Town", notes: "Ferry from Santorini" },
    { day: 5, activity: "Naxos beach day & Portara", location: "Naxos, Greece", notes: "Agios Prokopios beach" },
  ],
  "Hiking the Alta Via 1 in the Dolomites": [
    { day: 1, activity: "Arrive Cortina d Ampezzo", location: "Cortina, Italy", notes: "Base camp for the week" },
    { day: 2, activity: "Tre Cime di Lavaredo loop", location: "Tre Cime, Dolomites", notes: "6hr hike, bring poles" },
    { day: 3, activity: "Lago di Braies sunrise shoot", location: "Lago di Braies", notes: "Arrive before 6am" },
    { day: 4, activity: "Seceda ridge via cable car", location: "Ortisei, Val Gardena", notes: "Via ferrata optional" },
    { day: 5, activity: "Alpe di Siusi plateau walk", location: "Castelrotto", notes: "Largest high-altitude meadow" },
  ],
  "Weekend in Lisbon: Pastéis and Viewpoints": [
    { day: 1, activity: "Alfama & Sao Jorge Castle", location: "Alfama, Lisbon", notes: "Watch Fado in the evening" },
    { day: 2, activity: "Belem Tower & pasteis de nata", location: "Belem, Lisbon", notes: "Pasteis de Belem is the original" },
    { day: 3, activity: "Sintra palaces day trip", location: "Sintra, Portugal", notes: "Train from Rossio station" },
    { day: 4, activity: "LX Factory Sunday market", location: "LX Factory, Lisbon", notes: "Opens at 10am Sundays" },
    { day: 5, activity: "Cascais coastal walk", location: "Cascais, Portugal", notes: "Bike rental available" },
  ],
  "Morocco in 10 Days: Medinas, Sahara & Valleys": [
    { day: 1, activity: "Marrakech medina & souks", location: "Marrakech, Morocco", notes: "Hire a local guide" },
    { day: 2, activity: "Bahia Palace & Djemaa el-Fna", location: "Marrakech", notes: "Go to square after dark" },
    { day: 3, activity: "Sahara Desert camel trek", location: "Merzouga, Erg Chebbi", notes: "Sleep under stars in camp" },
    { day: 4, activity: "Fes medina & leather tanneries", location: "Fes, Morocco", notes: "Best viewed from rooftop" },
    { day: 5, activity: "Chefchaouen blue city walk", location: "Chefchaouen", notes: "Morning light best for photos" },
  ],
  "Riding the Rooftop — Ladakh on Two Wheels": [
    { day: 1, activity: "Arrive Leh, acclimatize", location: "Leh, Ladakh", notes: "Rest all day — altitude 3500m" },
    { day: 2, activity: "Thiksey & Hemis Monastery", location: "Leh Valley", notes: "Drive along Indus River" },
    { day: 3, activity: "Pangong Lake", location: "Pangong Tso, 4350m", notes: "Start at dawn, 5hr drive" },
    { day: 4, activity: "Nubra Valley & sand dunes", location: "Hunder, Nubra", notes: "Double-hump camel ride" },
    { day: 5, activity: "Magnetic Hill & Gurudwara Pathar Sahib", location: "Leh-Srinagar Highway", notes: "En route back to Leh" },
  ],
  "Rameshwaram: Where the Ocean Meets the Sacred": [
    { day: 1, activity: "Ramanathaswamy Temple darshan", location: "Rameshwaram", notes: "Early morning queue is shorter" },
    { day: 2, activity: "Dhanushkodi ghost town drive", location: "Dhanushkodi", notes: "4WD needed, hire locally" },
    { day: 3, activity: "Pamban Bridge & sea view", location: "Pamban Island", notes: "India first sea bridge" },
    { day: 4, activity: "Agni Theertham beach ritual", location: "Rameshwaram beach", notes: "Sacred sea bath" },
    { day: 5, activity: "Adams Bridge viewpoint", location: "Talaimannar side", notes: "Limestone shoals at low tide" },
  ],
  "Back to Ladakh: Zanskar Valley Winter Recon": [
    { day: 1, activity: "Drive Leh to Padum via Pensi La", location: "Pensi La, 4400m", notes: "Full day drive, carry food" },
    { day: 2, activity: "Phuktal Monastery trek", location: "Phuktal, Zanskar", notes: "2-day trek to cliff monastery" },
    { day: 3, activity: "Zanskar River canyon rafting", location: "Zanskar River", notes: "Grade III-IV rapids" },
    { day: 4, activity: "Chadar frozen river walk", location: "Zanskar Gorge", notes: "Jan-Feb only" },
    { day: 5, activity: "Karsha Monastery & village", location: "Karsha, Zanskar", notes: "Largest gompa in Zanskar" },
  ],
};

async function main() {
  const journals = await prisma.journal.findMany({ select: { id: true, title: true } });
  let updated = 0;
  for (const journal of journals) {
    const itin = itineraries[journal.title];
    if (itin) {
      await prisma.journal.update({
        where: { id: journal.id },
        data: { itinerary: JSON.stringify(itin) },
      });
      console.log(`✓ Updated: ${journal.title}`);
      updated++;
    }
  }
  console.log(`\nDone. ${updated}/${journals.length} journals updated.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
