const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// picsum.photos/seed/<word>/800/500 — same seed = same image, always
const photoSets = {
  'Tokyo, Japan': [
    'https://picsum.photos/seed/tokyo1/800/500',
    'https://picsum.photos/seed/japan-temple/800/500',
    'https://picsum.photos/seed/cherry-blossom/800/500',
    'https://picsum.photos/seed/japan-street/800/500',
  ],
  'Patagonia, Argentina & Chile': [
    'https://picsum.photos/seed/patagonia1/800/500',
    'https://picsum.photos/seed/mountain-glacier/800/500',
    'https://picsum.photos/seed/patagonia-lake/800/500',
  ],
  'Thailand, Vietnam & Cambodia': [
    'https://picsum.photos/seed/angkor-wat/800/500',
    'https://picsum.photos/seed/vietnam-rice/800/500',
    'https://picsum.photos/seed/asia-temple/800/500',
    'https://picsum.photos/seed/thailand-coast/800/500',
  ],
  'Dolomites, Italy': [
    'https://picsum.photos/seed/dolomites1/800/500',
    'https://picsum.photos/seed/alpine-hike/800/500',
    'https://picsum.photos/seed/mountain-rifugio/800/500',
  ],
  'Morocco': [
    'https://picsum.photos/seed/morocco-desert/800/500',
    'https://picsum.photos/seed/marrakech-souk/800/500',
    'https://picsum.photos/seed/sahara-camel/800/500',
    'https://picsum.photos/seed/morocco-riad/800/500',
  ],
  'Lisbon, Portugal': [
    'https://picsum.photos/seed/lisbon-tram/800/500',
    'https://picsum.photos/seed/alfama-tiles/800/500',
    'https://picsum.photos/seed/sintra-palace/800/500',
  ],
  'Santorini, Mykonos & Naxos, Greece': [
    'https://picsum.photos/seed/santorini1/800/500',
    'https://picsum.photos/seed/cyclades-blue/800/500',
    'https://picsum.photos/seed/greek-coast/800/500',
    'https://picsum.photos/seed/naxos-beach/800/500',
  ],
  'Iceland': [
    'https://picsum.photos/seed/iceland-glacier/800/500',
    'https://picsum.photos/seed/iceland-waterfall/800/500',
    'https://picsum.photos/seed/iceland-lava/800/500',
    'https://picsum.photos/seed/iceland-van/800/500',
  ],
};

async function main() {
  const journals = await prisma.journal.findMany();

  let updated = 0;
  for (const journal of journals) {
    const photos = photoSets[journal.destination];
    if (photos) {
      await prisma.journal.update({
        where: { id: journal.id },
        data: { photos: JSON.stringify(photos) },
      });
      console.log(`✓ ${journal.destination} — ${photos.length} photos`);
      updated++;
    } else {
      console.log(`✗ No photos found for: ${journal.destination}`);
    }
  }

  console.log(`\nUpdated ${updated}/${journals.length} entries.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
