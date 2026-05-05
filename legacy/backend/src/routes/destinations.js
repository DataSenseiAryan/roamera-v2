const router = require('express').Router();
const prisma = require('../lib/prisma');

// ── Static itinerary data ──────────────────────────────────────────────────
const ITINERARIES = {
  'Maldives': {
    days: [
      { day: 1, title: 'Arrive & Settle', places: ['Malé Airport', 'Seaplane Transfer', 'Resort Welcome'], tips: 'Book seaplane in advance — seats fill up fast.' },
      { day: 2, title: 'Snorkeling & Reef', places: ['House Reef', 'Banana Reef', 'Fish Head (Mushimasmigili)'], tips: 'Dawn snorkels have the best visibility.' },
      { day: 3, title: 'Island Hopping', places: ['Maafushi Local Island', 'Hulhumalé', 'Vaadhoo (Sea of Stars)'], tips: 'Bioluminescent plankton glows best on moonless nights.' },
      { day: 4, title: 'Dive & Relax', places: ['Manta Point', 'Hammerhead Point', 'Sandbank Picnic'], tips: 'PADI certification opens most dive sites.' },
      { day: 5, title: 'Sunset & Depart', places: ['Sunset Cruise', 'Malé Fish Market', 'Malé Grand Friday Mosque'], tips: 'Grand Friday Mosque entry is free before noon.' },
    ],
    nearby: ['Sri Lanka', 'Southern India', 'Seychelles'],
  },
  'Bali': {
    days: [
      { day: 1, title: 'Arrive in Seminyak', places: ['Ngurah Rai Airport', 'Seminyak Beach', 'Ku De Ta Sunset Bar'], tips: 'Grab a local SIM at the airport.' },
      { day: 2, title: 'Ubud Culture Day', places: ['Tegallalang Rice Terraces', 'Ubud Monkey Forest', 'Ubud Palace'], tips: 'Rent a scooter — best way around Ubud.' },
      { day: 3, title: 'Temples & Volcanoes', places: ['Tanah Lot Temple', 'Mount Batur Sunrise Trek', 'Kintamani Caldera'], tips: 'Sunrise trek needs a 2am start — book a guide.' },
      { day: 4, title: 'East Bali', places: ['Tirta Gangga Water Palace', 'Amed Beach', 'Goa Lawah Bat Cave'], tips: 'Amed is the best spot for affordable diving.' },
      { day: 5, title: 'Canggu & Depart', places: ['Canggu Surf Beach', 'Tanah Lot', 'Old Man\'s Beach Club'], tips: 'Surf lessons at Canggu are great for beginners.' },
    ],
    nearby: ['Lombok', 'Gili Islands', 'Nusa Penida', 'Java'],
  },
  'Santorini': {
    days: [
      { day: 1, title: 'Arrive in Fira', places: ['Fira Town', 'Caldera Views', 'Archaeological Museum'], tips: 'Take the cable car up from the port — avoid donkeys.' },
      { day: 2, title: 'Iconic Oia', places: ['Oia Village', 'Oia Castle Sunset', 'Amoudi Bay'], tips: 'Arrive at Oia Castle 2h before sunset to get a spot.' },
      { day: 3, title: 'Volcanic Beach Day', places: ['Red Beach', 'Black Beach (Perissa)', 'Akrotiri Archaeological Site'], tips: 'Akrotiri is a Minoan city buried by the eruption — unmissable.' },
      { day: 4, title: 'Winery & Villages', places: ['Santo Wines Winery', 'Pyrgos Village', 'Megalochori'], tips: 'Assyrtiko white wine is the local specialty.' },
      { day: 5, title: 'Boat Tour & Depart', places: ['Volcano Hot Springs', 'Thirassia Island', 'Fira Sunset'], tips: 'Boat tours depart from Athinios Port at 10am.' },
    ],
    nearby: ['Mykonos', 'Crete', 'Ios', 'Naxos'],
  },
  'Phi Phi Islands': {
    days: [
      { day: 1, title: 'Ferry & Settle', places: ['Tonsai Bay', 'Phi Phi Don Village', 'Reggae Bar Beach'], tips: 'Ferry from Phuket or Krabi takes ~90 min.' },
      { day: 2, title: 'Maya Bay', places: ['Maya Bay (The Beach)', 'Loh Samah Bay', 'Pileh Lagoon'], tips: 'Maya Bay opens 8am–4pm daily — go early.' },
      { day: 3, title: 'Snorkel & Dive', places: ['Hin Daeng Dive Site', 'Shark Point', 'Bamboo Island'], tips: 'Leopard sharks rest on the sand at Shark Point.' },
      { day: 4, title: 'Viewpoints', places: ['Phi Phi Viewpoint 1', 'Viewpoint 2', 'Long Beach'], tips: 'The viewpoint hike takes 20 min — go at sunrise.' },
      { day: 5, title: 'Kayak & Depart', places: ['Viking Cave', 'Monkey Beach', 'Tonsai Pier'], tips: 'Kayaking to Monkey Beach is more peaceful than longtail boat.' },
    ],
    nearby: ['Phuket', 'Krabi', 'Koh Lanta', 'Railay Beach'],
  },
  'Amalfi Coast': {
    days: [
      { day: 1, title: 'Arrive in Positano', places: ['Positano Beach', 'Church of Santa Maria Assunta', 'Via Positanesi d\'America'], tips: 'Park in Positano early — it fills by 9am.' },
      { day: 2, title: 'Path of the Gods', places: ['Sentiero degli Dei', 'Praiano Village', 'Furore Fjord'], tips: 'The Path of the Gods hike is 8km — moderate difficulty.' },
      { day: 3, title: 'Amalfi Town', places: ['Amalfi Cathedral', 'Valle delle Ferriere', 'Grotta dello Smeraldo'], tips: 'Emerald Grotto boat tour is worth the €7 entry.' },
      { day: 4, title: 'Ravello & Views', places: ['Ravello Villa Rufolo', 'Villa Cimbrone Gardens', 'Atrani Village'], tips: 'Ravello has the best panoramic views on the coast.' },
      { day: 5, title: 'Capri Day Trip', places: ['Blue Grotto', 'Marina Grande', 'Villa Jovis'], tips: 'Ferry to Capri takes 40 min from Amalfi.' },
    ],
    nearby: ['Naples', 'Capri', 'Pompeii', 'Sorrento'],
  },
  'Swiss Alps': {
    days: [
      { day: 1, title: 'Arrive in Zürich', places: ['Zürich Old Town', 'Lake Zürich', 'Grossmünster'], tips: 'Swiss Rail Pass saves a lot on trains.' },
      { day: 2, title: 'Jungfraujoch', places: ['Interlaken', 'Grindelwald', 'Jungfraujoch (Top of Europe)'], tips: 'Book Jungfraujoch tickets online — 50% cheaper.' },
      { day: 3, title: 'Zermatt & Matterhorn', places: ['Zermatt Village', 'Matterhorn Glacier Paradise', 'Gorner Gorge'], tips: 'No cars allowed in Zermatt — take the cog railway.' },
      { day: 4, title: 'Lucerne', places: ['Chapel Bridge', 'Lion Monument', 'Lake Lucerne Cruise'], tips: 'Mt Pilatus cable car + boat combo is spectacular.' },
      { day: 5, title: 'Montreux & Depart', places: ['Château de Chillon', 'Montreux Promenade', 'Lake Geneva'], tips: 'Take the Golden Pass train for stunning scenery.' },
    ],
    nearby: ['Liechtenstein', 'Chamonix (France)', 'Lake Como (Italy)', 'Innsbruck (Austria)'],
  },
  'Patagonia': {
    days: [
      { day: 1, title: 'Arrive in Puerto Natales', places: ['Puerto Natales Town', 'Milodon Cave', 'Last Hope Sound'], tips: 'Buy trekking permits for Torres del Paine online — very limited.' },
      { day: 2, title: 'Torres del Paine', places: ['Base Torres Viewpoint', 'Valle del Francés', 'Grey Lake'], tips: 'The W Trek takes 5 days — Day 1 is the hardest climb.' },
      { day: 3, title: 'Los Glaciares', places: ['Perito Moreno Glacier', 'El Calafate', 'Minitrekking on Ice'], tips: 'Ice trekking on Perito Moreno is an unmissable experience.' },
      { day: 4, title: 'El Chaltén', places: ['Laguna de los Tres (Fitz Roy)', 'Laguna Torre', 'Chorillo del Salto'], tips: 'El Chaltén trails are free — no park fee needed.' },
      { day: 5, title: 'Tierra del Fuego', places: ['Ushuaia', 'Beagle Channel', 'Tierra del Fuego National Park'], tips: 'Ushuaia is the southernmost city in the world.' },
    ],
    nearby: ['Tierra del Fuego', 'Easter Island', 'Chilean Lake District', 'Buenos Aires'],
  },
  'Dolomites': {
    days: [
      { day: 1, title: 'Arrive in Bolzano', places: ['Bolzano Old Town', 'South Tyrol Museum (Ötzi the Iceman)', 'Castel Roncolo'], tips: 'Rent a car — public transport is limited in the valleys.' },
      { day: 2, title: 'Tre Cime di Lavaredo', places: ['Tre Cime Loop Trail', 'Rifugio Auronzo', 'Lake Misurina'], tips: '10km loop takes 3–4 hours at easy pace.' },
      { day: 3, title: 'Alpe di Siusi', places: ['Alpe di Siusi Plateau', 'Seiser Alm Cable Car', 'Schlern Mountain'], tips: 'Europe\'s largest high-altitude meadow — sunrise is magical.' },
      { day: 4, title: 'Cortina d\'Ampezzo', places: ['Cinque Torri', 'Tofana di Roses Cable Car', 'Cortina Town'], tips: 'WWI trenches at Cinque Torri are preserved in the rock.' },
      { day: 5, title: 'Lago di Braies', places: ['Pragser Wildsee (Lago di Braies)', 'Prags Valley', 'San Candido'], tips: 'Row boats on Lago di Braies — most photogenic lake in Italy.' },
    ],
    nearby: ['Venice', 'Innsbruck', 'Verona', 'Lake Garda'],
  },
  'Banff': {
    days: [
      { day: 1, title: 'Arrive in Banff', places: ['Banff Town', 'Bow River', 'Banff Avenue'], tips: 'Buy the Parks Canada Discovery Pass — pays for itself in 2 days.' },
      { day: 2, title: 'Lake Louise & Moraine', places: ['Lake Louise', 'Moraine Lake', 'Valley of the Ten Peaks'], tips: 'Arrive at Moraine Lake before 6am — shuttle is mandatory after.' },
      { day: 3, title: 'Icefields Parkway', places: ['Peyto Lake', 'Athabasca Glacier', 'Athabasca Falls'], tips: 'Peyto Lake viewpoint is a 30-min hike from the carpark.' },
      { day: 4, title: 'Johnston Canyon & Hot Springs', places: ['Johnston Canyon Lower & Upper Falls', 'Banff Upper Hot Springs', 'Sundance Canyon'], tips: 'Johnston Canyon icicles in winter are surreal.' },
      { day: 5, title: 'Wildlife & Depart', places: ['Vermilion Lakes', 'Two Jack Lake', 'Calgary'], tips: 'Elk frequently walk through Banff town at dusk.' },
    ],
    nearby: ['Jasper', 'Yoho National Park', 'Kootenay', 'Calgary'],
  },
  'Himalayas': {
    days: [
      { day: 1, title: 'Arrive in Kathmandu', places: ['Kathmandu Durbar Square', 'Swayambhunath (Monkey Temple)', 'Thamel District'], tips: 'Acclimatize for at least 2 days before trekking.' },
      { day: 2, title: 'Fly to Lukla', places: ['Lukla Airport', 'Phakding Village', 'Namche Bazaar Trail'], tips: 'Lukla flights cancel often — keep a buffer day.' },
      { day: 3, title: 'Namche Bazaar', places: ['Namche Bazaar', 'Everest View Hotel', 'Sherpa Culture Museum'], tips: 'Spend 2 nights in Namche for proper acclimatization.' },
      { day: 4, title: 'Tengboche & Everest View', places: ['Tengboche Monastery', 'Ama Dablam View', 'Dingboche'], tips: 'Tengboche Monastery morning puja at 3pm is deeply moving.' },
      { day: 5, title: 'Everest Base Camp', places: ['Everest Base Camp (5,364m)', 'Kala Patthar Sunrise', 'Gorak Shep'], tips: 'Kala Patthar at sunrise gives the best Everest views.' },
    ],
    nearby: ['Pokhara', 'Bhutan', 'Lhasa (Tibet)', 'Darjeeling'],
  },
  'Sahara Desert': {
    days: [
      { day: 1, title: 'Arrive in Marrakech', places: ['Jemaa el-Fna Square', 'Majorelle Garden', 'Medina Souks'], tips: 'Hire a local guide for the medina — easy to get lost.' },
      { day: 2, title: 'Drive to Merzouga', places: ['Aït Benhaddou Kasbah', 'Dades Gorge', 'Todra Gorge'], tips: 'Aït Benhaddou has been used in Game of Thrones.' },
      { day: 3, title: 'Erg Chebbi Dunes', places: ['Erg Chebbi Sand Dunes', 'Camel Trek at Sunset', 'Desert Camp'], tips: 'Sleep in a Berber desert camp — stars are extraordinary.' },
      { day: 4, title: 'Desert Life', places: ['Merzouga Village', 'Gnawa Music Performance', 'Dayet Srji Lake'], tips: 'Migratory flamingos visit the lake in spring.' },
      { day: 5, title: 'Return to Marrakech', places: ['Ouarzazate (Hollywood of Africa)', 'Atlas Studios', 'Tifoultoute Kasbah'], tips: 'Atlas Studios is the world\'s largest film studio.' },
    ],
    nearby: ['Fez', 'Casablanca', 'Atlas Mountains', 'Mauritania'],
  },
  'Wadi Rum': {
    days: [
      { day: 1, title: 'Arrive in Aqaba', places: ['Aqaba Corniche', 'Red Sea Snorkeling', 'Aqaba Fort'], tips: 'Jordan Pass covers entry fees + visa — great value.' },
      { day: 2, title: 'Wadi Rum Desert', places: ['Wadi Rum Visitor Centre', 'Lawrence of Arabia Spring', 'Khazali Canyon'], tips: 'Book a Bedouin jeep tour — 4WD only beyond the visitor centre.' },
      { day: 3, title: 'Desert Camping', places: ['Um Frouth Rock Bridge', 'Burdah Rock Bridge', 'Red Sand Dunes'], tips: 'Star gazing in Wadi Rum is among the best on Earth.' },
      { day: 4, title: 'Petra Day Trip', places: ['Petra Siq', 'The Treasury (Al-Khazneh)', 'Monastery (Ad Deir)'], tips: 'Allow a full day for Petra — it\'s bigger than it looks.' },
      { day: 5, title: 'Dead Sea & Amman', places: ['Dead Sea Float', 'Madaba Mosaic Map', 'Amman Citadel'], tips: 'The Dead Sea has the highest salt concentration on Earth.' },
    ],
    nearby: ['Petra', 'Dead Sea', 'Aqaba', 'Israel'],
  },
  'Atacama Desert': {
    days: [
      { day: 1, title: 'Arrive in San Pedro', places: ['San Pedro de Atacama Village', 'Iglesia San Pedro', 'Local Market'], tips: 'Altitude is 2,400m — rest on day 1.' },
      { day: 2, title: 'Valle de la Luna', places: ['Valle de la Luna', 'Valle de la Muerte', 'Atacama Salt Flat'], tips: 'Sunset at Valle de la Luna turns the rocks deep orange.' },
      { day: 3, title: 'Geysers del Tatio', places: ['Geysers del Tatio (4,320m)', 'Machuca Village', 'Puritama Hot Springs'], tips: 'Geysers are most active at sunrise — depart at 4am.' },
      { day: 4, title: 'Stargazing Capital', places: ['ALMA Observatory', 'Space Obs San Pedro', 'Laguna Cejar'], tips: 'Atacama has the clearest skies on Earth — stargazing tours are world-class.' },
      { day: 5, title: 'Altiplanic Lagoons', places: ['Laguna Miscanti', 'Laguna Miñiques', 'Paso Jama Border'], tips: 'Flamingos nest at Laguna Chaxa.' },
    ],
    nearby: ['Uyuni Salt Flats (Bolivia)', 'Easter Island', 'Mendoza', 'Patagonia'],
  },
  'Varanasi': {
    days: [
      { day: 1, title: 'Arrive & Evening Aarti', places: ['Dashashwamedh Ghat', 'Ganga Aarti Ceremony', 'Kashi Vishwanath Lane'], tips: 'Watch the Ganga Aarti from a boat for the best view.' },
      { day: 2, title: 'Dawn Boat Ride', places: ['Manikarnika Ghat (Burning Ghat)', 'Assi Ghat', 'Kedar Ghat'], tips: 'A 5am boat ride shows Varanasi waking up — deeply spiritual.' },
      { day: 3, title: 'Old City Lanes', places: ['Kashi Vishwanath Temple', 'Gyanvapi Mosque', 'Tulsi Manas Temple'], tips: 'The old lanes (galis) are too narrow for vehicles — walk or take a cycle rickshaw.' },
      { day: 4, title: 'Sarnath', places: ['Sarnath Dhamek Stupa', 'Sarnath Archaeological Museum', 'Mulagandhakuti Vihara'], tips: 'Buddha gave his first sermon here after enlightenment.' },
      { day: 5, title: 'Silk & Depart', places: ['Varanasi Silk Weaving (Banarasi)', 'Ramnagar Fort', 'Bharat Mata Temple'], tips: 'Banarasi silk sarees are the finest in India — buy from weavers directly.' },
    ],
    nearby: ['Ayodhya', 'Allahabad (Prayagraj)', 'Bodh Gaya', 'Lucknow'],
  },
  'Kyoto': {
    days: [
      { day: 1, title: 'Arrive & Gion', places: ['Gion District', 'Hanamikoji Street', 'Yasaka Shrine'], tips: 'Gion after 7pm has the best chance of spotting a geisha.' },
      { day: 2, title: 'Arashiyama', places: ['Arashiyama Bamboo Grove', 'Tenryu-ji Zen Garden', 'Monkey Park Iwatayama'], tips: 'Go to the bamboo grove at dawn — no crowds.' },
      { day: 3, title: 'Fushimi Inari', places: ['Fushimi Inari Shrine', '10,000 Torii Gates', 'Nishiki Market'], tips: 'Hike all the way to the summit (2 hours) for fewer tourists.' },
      { day: 4, title: 'Zen Temples', places: ['Kinkaku-ji (Golden Pavilion)', 'Ryoan-ji Rock Garden', 'Nijo Castle'], tips: 'Ryoan-ji\'s rock garden is best experienced in silence early morning.' },
      { day: 5, title: 'Nara Day Trip', places: ['Nara Deer Park', 'Todai-ji (Giant Buddha)', 'Kasuga Grand Shrine'], tips: 'Nara deer will bow back if you bow to them.' },
    ],
    nearby: ['Nara', 'Osaka', 'Hiroshima', 'Kobe'],
  },
  'Jerusalem': {
    days: [
      { day: 1, title: 'Old City — Jewish & Muslim Quarter', places: ['Western Wall', 'Dome of the Rock', 'Al-Aqsa Mosque'], tips: 'Modest dress required — carry a scarf.' },
      { day: 2, title: 'Christian Quarter', places: ['Church of the Holy Sepulchre', 'Via Dolorosa', 'Garden of Gethsemane'], tips: 'Early morning mass at Holy Sepulchre is very atmospheric.' },
      { day: 3, title: 'Dead Sea & Masada', places: ['Masada Fortress (UNESCO)', 'Dead Sea Float', 'Ein Gedi Nature Reserve'], tips: 'Take the cable car up Masada — sunrise hike is also spectacular.' },
      { day: 4, title: 'Tel Aviv Day Trip', places: ['Tel Aviv Beachfront', 'Jaffa Old City', 'Carmel Market'], tips: 'Tel Aviv has the best hummus in the world — try Abu Hassan.' },
      { day: 5, title: 'Mount of Olives', places: ['Mount of Olives Viewpoint', 'Yad Vashem Holocaust Museum', 'Israel Museum (Dead Sea Scrolls)'], tips: 'Yad Vashem is free and one of the most important museums in the world.' },
    ],
    nearby: ['Tel Aviv', 'Bethlehem', 'Dead Sea', 'Petra (Jordan)'],
  },
  'Angkor Wat': {
    days: [
      { day: 1, title: 'Arrive in Siem Reap', places: ['Pub Street', 'Angkor Night Market', 'Tonle Sap Lake'], tips: 'Buy a 3-day pass — worth it for the number of temples.' },
      { day: 2, title: 'Angkor Wat Sunrise', places: ['Angkor Wat', 'Angkor Thom', 'Bayon Temple (1000 Faces)'], tips: 'Arrive at Angkor Wat at 5am for the reflection pool sunrise.' },
      { day: 3, title: 'Ta Prohm & Banteay Srei', places: ['Ta Prohm (Tomb Raider Temple)', 'Banteay Srei (Pink Temple)', 'Pre Rup'], tips: 'Ta Prohm tree roots are the most photogenic in Cambodia.' },
      { day: 4, title: 'Outer Temples', places: ['Beng Mealea', 'Kbal Spean (River of a Thousand Lingas)', 'Phnom Kulen Waterfall'], tips: 'Beng Mealea is like Angkor Wat was 50 years ago — overgrown and unrestored.' },
      { day: 5, title: 'Floating Village', places: ['Kampong Phluk Floating Village', 'Tonle Sap Boat Tour', 'Artisans Angkor'], tips: 'Tonle Sap is the largest freshwater lake in SE Asia.' },
    ],
    nearby: ['Phnom Penh', 'Ho Chi Minh City', 'Bangkok', 'Luang Prabang'],
  },
  'Queenstown': {
    days: [
      { day: 1, title: 'Arrive & Lakefront', places: ['Queenstown Bay', 'Remarkables Mountain Range', 'Skyline Gondola'], tips: 'The Skyline Gondola gives the best view of the town.' },
      { day: 2, title: 'Bungee & Jet Boat', places: ['Kawarau Bridge Bungee (World\'s First)', 'Shotover Jet Boat', 'Arrowtown'], tips: 'Book adventure activities the day before — they sell out.' },
      { day: 3, title: 'Milford Sound Day Trip', places: ['Milford Sound Cruise', 'Mitre Peak', 'Stirling Falls'], tips: 'Milford Sound is better in rain — waterfalls double in number.' },
      { day: 4, title: 'Wine & Wanaka', places: ['Central Otago Wineries', 'Lake Wanaka', 'Roy\'s Peak Hike'], tips: 'Central Otago Pinot Noir is world-class.' },
      { day: 5, title: 'Skydive & Depart', places: ['Skydive Queenstown', 'Glenorchy (Lord of the Rings)', 'Departure'], tips: 'Glenorchy was Isengard and Lothlorien in LOTR.' },
    ],
    nearby: ['Milford Sound', 'Christchurch', 'Wanaka', 'Fiordland'],
  },
  'Costa Rica': {
    days: [
      { day: 1, title: 'Arrive in San José', places: ['San José Central Market', 'Gold Museum', 'La Sabana Park'], tips: 'Exchange currency at the airport bank — best rates.' },
      { day: 2, title: 'Arenal Volcano', places: ['Arenal Volcano National Park', 'La Fortuna Waterfall', 'Baldi Hot Springs'], tips: 'Evening volcano views are clearest — clouds build by midday.' },
      { day: 3, title: 'Monteverde Cloud Forest', places: ['Monteverde Cloud Forest Reserve', 'Hanging Bridges', 'Zip-line Canopy Tour'], tips: 'The canopy zip-line is the best in Central America.' },
      { day: 4, title: 'Manuel Antonio', places: ['Manuel Antonio National Park', 'Playa Manuel Antonio', 'White-faced Monkey Watching'], tips: 'Monkeys, sloths, and toucans visible at Manuel Antonio daily.' },
      { day: 5, title: 'Pacific Coast & Depart', places: ['Jacó Beach Surfing', 'Tárcoles River Crocodile Tour', 'San José'], tips: 'Tárcoles has some of the largest crocodiles on Earth.' },
    ],
    nearby: ['Panama', 'Nicaragua', 'Bocas del Toro', 'Tortuguero'],
  },
  'Iceland': {
    days: [
      { day: 1, title: 'Arrive in Reykjavík', places: ['Reykjavík Old Harbour', 'Hallgrímskirkja', 'Harpa Concert Hall'], tips: 'Rent a 4WD — essential for F-roads in the highlands.' },
      { day: 2, title: 'Golden Circle', places: ['Þingvellir National Park', 'Geysir Hot Spring', 'Gullfoss Waterfall'], tips: 'Þingvellir sits on the Mid-Atlantic Ridge — walk between continents.' },
      { day: 3, title: 'South Coast', places: ['Seljalandsfoss (Walk Behind)', 'Skógafoss', 'Black Sand Beach Reynisfjara'], tips: 'Never turn your back on the waves at Reynisfjara.' },
      { day: 4, title: 'Jökulsárlón Glacier Lagoon', places: ['Jökulsárlón Glacier Lagoon', 'Diamond Beach', 'Skaftafell National Park'], tips: 'Seal spotting is almost guaranteed at Jökulsárlón.' },
      { day: 5, title: 'Northern Lights Hunt', places: ['Aurora Hunting Tour', 'Blue Lagoon', 'Reykjavík Departure'], tips: 'Northern Lights forecast at vedur.is — plan around it.' },
    ],
    nearby: ['Greenland', 'Faroe Islands', 'Scotland', 'Norway'],
  },
  'Ha Long Bay': {
    days: [
      { day: 1, title: 'Board the Cruise', places: ['Ha Long Bay Pier', 'Ti Top Island', 'Surprising Cave'], tips: 'Book a 2-night cruise — 1 night is too rushed.' },
      { day: 2, title: 'Kayaking & Villages', places: ['Luon Cave Kayaking', 'Vung Vieng Floating Village', 'Soi Sim Island'], tips: 'Kayak through the cave arches at low tide only.' },
      { day: 3, title: 'Bai Tu Long Bay', places: ['Bai Tu Long Bay (less crowded)', 'Vân Đồn Island', 'Co To Island'], tips: 'Bai Tu Long Bay has fewer tourists than Ha Long.' },
      { day: 4, title: 'Lan Ha Bay', places: ['Lan Ha Bay', 'Dark & Bright Cave', 'Cat Ba Island'], tips: 'Cat Ba has the last golden-headed langurs on Earth.' },
      { day: 5, title: 'Return to Hanoi', places: ['Hanoi Old Quarter', 'Hoan Kiem Lake', 'Street Food Tour'], tips: 'Bun cha (Obama\'s lunch with Bourdain) is a Hanoi must.' },
    ],
    nearby: ['Hanoi', 'Ninh Binh', 'Cat Ba Island', 'Sapa'],
  },
  'Tokyo': {
    days: [
      { day: 1, title: 'Shinjuku & Shibuya', places: ['Shibuya Crossing', 'Shinjuku Golden Gai', 'Tokyo Skytree'], tips: 'Get a Suica card at the airport — works on all transit.' },
      { day: 2, title: 'Asakusa & Akihabara', places: ['Senso-ji Temple', 'Nakamise Shopping Street', 'Akihabara Electric Town'], tips: 'Senso-ji is open 24/7 — visit at dawn for no crowds.' },
      { day: 3, title: 'Harajuku & Meiji', places: ['Meiji Shrine', 'Harajuku Takeshita Street', 'Omotesando Hills'], tips: 'Meiji Shrine is a peaceful forest in the middle of Tokyo.' },
      { day: 4, title: 'Tsukiji & Odaiba', places: ['Tsukiji Outer Market', 'teamLab Borderless', 'Odaiba Palette Town'], tips: 'Arrive at Tsukiji by 7am for the freshest sushi breakfast.' },
      { day: 5, title: 'Nikko Day Trip', places: ['Tōshō-gū Shrine', 'Kegon Falls', 'Lake Chūzenji'], tips: 'Nikko is 2h by Shinkansen — a full day trip.' },
    ],
    nearby: ['Kyoto', 'Osaka', 'Nikko', 'Hakone (Mt Fuji)'],
  },
  'Lisbon': {
    days: [
      { day: 1, title: 'Alfama & Fado', places: ['Alfama District', 'São Jorge Castle', 'Fado Show at Clube de Fado'], tips: 'Walk up to the castle in the morning before the heat.' },
      { day: 2, title: 'Belém', places: ['Jerónimos Monastery', 'Tower of Belém', 'MAAT Modern Art Museum'], tips: 'Pastéis de Belém (custard tarts) from the original 1837 bakery are unmissable.' },
      { day: 3, title: 'Sintra Day Trip', places: ['Pena Palace', 'Moorish Castle', 'Cabo da Roca (Westernmost Europe)'], tips: 'Sintra is 40min by train from Rossio Station.' },
      { day: 4, title: 'LX Factory & Chiado', places: ['LX Factory Market (Sunday)', 'Chiado District', 'Time Out Market'], tips: 'Time Out Market is the best food hall in Europe.' },
      { day: 5, title: 'Cascais & Depart', places: ['Cascais Promenade', 'Boca do Inferno', 'Estoril Casino'], tips: 'The train along the coast to Cascais is one of Europe\'s most scenic.' },
    ],
    nearby: ['Sintra', 'Porto', 'Algarve', 'Seville (Spain)'],
  },
  'New York': {
    days: [
      { day: 1, title: 'Manhattan Icons', places: ['Statue of Liberty', 'Central Park', 'Times Square'], tips: 'Buy the CityPASS for major attractions — saves 40%.' },
      { day: 2, title: 'Downtown & Brooklyn', places: ['Brooklyn Bridge Walk', 'DUMBO', 'High Line Park'], tips: 'Walk across Brooklyn Bridge at sunset for Manhattan skyline views.' },
      { day: 3, title: 'Museums', places: ['Metropolitan Museum of Art', 'MoMA', 'The Guggenheim'], tips: 'MoMA is free on Friday evenings.' },
      { day: 4, title: 'Harlem & The Bronx', places: ['Apollo Theater', 'Bronx Zoo', 'Arthur Avenue Little Italy'], tips: 'Harlem Gospel Sunday service is open to visitors — deeply moving.' },
      { day: 5, title: 'Food & Shopping', places: ['Chelsea Market', 'SoHo', 'One World Trade Center'], tips: 'Get a NY bagel with lox — the correct NYC breakfast.' },
    ],
    nearby: ['Washington DC', 'Boston', 'Philadelphia', 'Niagara Falls'],
  },
  'Marrakech': {
    days: [
      { day: 1, title: 'Jemaa el-Fna', places: ['Jemaa el-Fna Square', 'Koutoubia Mosque', 'Souks (Medina)'], tips: 'The square transforms completely after dark — snake charmers and storytellers.' },
      { day: 2, title: 'Palaces & Gardens', places: ['Bahia Palace', 'El Badi Palace', 'Majorelle Garden (YSL)'], tips: 'Majorelle Garden is most beautiful at opening time (8am).' },
      { day: 3, title: 'Day Trip to Atlas', places: ['Ourika Valley', 'Setti Fatma Waterfalls', 'Berber Village'], tips: 'Atlas mountain day trips cost ~€25 with a local driver.' },
      { day: 4, title: 'Hammam & Crafts', places: ['Traditional Hammam Spa', 'Leather Tanneries (Fes-style)', 'Rue des Épices Spice Market'], tips: 'Buy saffron, argan oil, and rose water at the spice souk.' },
      { day: 5, title: 'Essaouira Day Trip', places: ['Essaouira Medina (UNESCO)', 'Atlantic Ramparts', 'Gnawa Music Festival Site'], tips: 'Essaouira is 3h drive — hire a grand taxi with other travellers.' },
    ],
    nearby: ['Essaouira', 'Fez', 'Atlas Mountains', 'Casablanca'],
  },
  'Azores': {
    days: [
      { day: 1, title: 'Arrive in Ponta Delgada', places: ['Ponta Delgada Old Town', 'Portas da Cidade', 'Vila Franca do Campo'], tips: 'Rent a car — most attractions are spread across the island.' },
      { day: 2, title: 'Sete Cidades', places: ['Sete Cidades Twin Lakes', 'Boca do Inferno Viewpoint', 'Caldeira Velha Hot Springs'], tips: 'Sete Cidades crater is stunning from the Vista do Rei viewpoint.' },
      { day: 3, title: 'Whale Watching', places: ['Whale Watching Tour (30+ species)', 'Furnas Volcano Valley', 'Furnas Hot Spring Pools'], tips: 'Azores has some of the best whale watching in the world.' },
      { day: 4, title: 'Terceira Day Trip', places: ['Angra do Heroísmo (UNESCO)', 'Algar do Carvão Lava Tube', 'Biscoitos Lava Pools'], tips: 'Algar do Carvão is the only accessible volcanic chimney in the world.' },
      { day: 5, title: 'Lagoa do Fogo & Depart', places: ['Lagoa do Fogo (Fire Lake)', 'Ribeira Grande', 'Pineapple Plantation'], tips: 'Azorean pineapples are grown in heated greenhouses — unique in Europe.' },
    ],
    nearby: ['Madeira', 'Lisbon', 'Canary Islands', 'Cape Verde'],
  },
  'Faroe Islands': {
    days: [
      { day: 1, title: 'Arrive in Tórshavn', places: ['Tórshavn Old Town (Tinganes)', 'Skansin Fort', 'Nordic House'], tips: 'Weather changes every 5 minutes — layer up.' },
      { day: 2, title: 'Sørvágsvatn Lake', places: ['Sørvágsvatn (Cliffside Lake)', 'Trælanípa Cliffs', 'Bøsdalafossur Waterfall'], tips: 'The lake appears to float above the ocean — guided hike only.' },
      { day: 3, title: 'Gásadalur & Mulafossur', places: ['Mulafossur Waterfall', 'Gásadalur Village', 'Vestmanna Bird Cliffs'], tips: 'Mulafossur falls directly into the sea — most dramatic waterfall in Faroes.' },
      { day: 4, title: 'Kallur Lighthouse', places: ['Kallur Lighthouse (Kalsoy Island)', 'Trollanes Village', 'Gjógv Village'], tips: 'Kallur is a 90-min hike on a knife-edge ridge — worth every step.' },
      { day: 5, title: 'Elijárnjørður & Depart', places: ['Saksun Village', 'Eidi Megalith Stones', 'Kirkjubøur Viking Farm'], tips: 'Kirkjubøur has a farm that has been in the same family for 400 years.' },
    ],
    nearby: ['Iceland', 'Scotland (Shetland)', 'Norway', 'Denmark'],
  },
  'Maui': {
    days: [
      { day: 1, title: 'Arrive & Kaanapali', places: ['Kaanapali Beach', 'Lahaina Town', 'Black Rock Snorkeling'], tips: 'Rent a car — Maui public transport is almost nonexistent.' },
      { day: 2, title: 'Road to Hana', places: ['Twin Falls', "Wai'anapanapa Black Sand Beach", 'Oheo Gulch (Seven Sacred Pools)'], tips: 'Road to Hana is 620 curves and 59 bridges — start early.' },
      { day: 3, title: 'Haleakalā Sunrise', places: ['Haleakalā Volcano Summit (3,055m)', 'Sliding Sands Trail', 'Upcountry Lavender Farm'], tips: 'Reserve sunrise permits at recreation.gov months in advance.' },
      { day: 4, title: 'Snorkel & Whale Watch', places: ['Molokini Crater Snorkel', 'Whale Watch Tour (Dec–May)', 'Makena Beach'], tips: 'Molokini is a half-submerged volcanic crater — visibility 30m+.' },
      { day: 5, title: 'Iao Valley & Depart', places: ['Iao Valley State Monument', 'Maui Ocean Center', 'Paia Town'], tips: 'Paia Town has the best acai bowls and smoothies on Maui.' },
    ],
    nearby: ['Oahu (Honolulu)', 'Big Island (Hawaii)', 'Kauai', 'Molokai'],
  },
  'Rub al Khali': {
    days: [
      { day: 1, title: 'Arrive in Riyadh', places: ['Diriyah (UNESCO)', 'National Museum of Saudi Arabia', 'Kingdom Centre Tower'], tips: 'Visit the new Diriyah — Saudi Arabia\'s best-preserved mud-brick city.' },
      { day: 2, title: 'Edge of the World', places: ['Jebel Fihrayn (Edge of the World)', 'Rawdah Park', 'Al-Ula Ruins'], tips: 'Edge of the World overlooks a 300m sheer cliff — one of Saudi\'s great hikes.' },
      { day: 3, title: 'Empty Quarter Camp', places: ['Rub\' al Khali Dune Sea', 'Bedouin Desert Camp', 'Sunset from the Dunes'], tips: 'Tallest sand dunes reach 250m — this is the world\'s largest sand desert.' },
      { day: 4, title: 'Al-Ula & Hegra', places: ['Hegra (Madain Saleh — Nabataean City)', 'Al-Ula Old Town', 'Elephant Rock'], tips: 'Hegra is Saudi Arabia\'s first UNESCO site — sister city to Petra.' },
      { day: 5, title: 'AlUla Stargazing', places: ['Harrat Viewpoint', 'Dadan Archaeological Site', 'Riyadh Departure'], tips: 'AlUla has almost zero light pollution — world-class stargazing.' },
    ],
    nearby: ['Dubai', 'Petra (Jordan)', 'Oman Wahiba Sands', 'Bahrain'],
  },
  'Mecca & Medina': {
    days: [
      { day: 1, title: 'Arrive in Jeddah', places: ['Jeddah Historic District Al-Balad (UNESCO)', 'King Fahd Fountain', 'Red Sea Corniche'], tips: 'Non-Muslims cannot enter Mecca or Medina — Jeddah is the gateway city.' },
      { day: 2, title: 'Perform Umrah', places: ['Masjid al-Haram', 'Kaaba (Tawaf)', 'Zamzam Well'], tips: 'Cooler months (Nov–Feb) are strongly recommended for pilgrimage.' },
      { day: 3, title: 'Sacred Sites', places: ['Mount Arafat', 'Mina', 'Muzdalifah'], tips: 'Pre-Hajj visits to Arafat require a permit during Hajj season.' },
      { day: 4, title: 'Medina', places: ['Masjid an-Nabawi (Prophet\'s Mosque)', 'Quba Mosque (1st Mosque in Islam)', 'Al-Baqi Cemetery'], tips: 'The green dome of the Prophet\'s Mosque is one of Islam\'s most sacred sights.' },
      { day: 5, title: 'Taif & Depart', places: ['Taif Rose Festival', 'Al Shafa Mountain', 'Taif Cable Car'], tips: 'Taif is 1,800m altitude and 20°C cooler than Jeddah — a welcome escape.' },
    ],
    nearby: ['Jeddah', 'Taif', 'Dubai', 'Jordan'],
  },
};

// Fallback generic itinerary
function genericItinerary(destination) {
  return {
    days: [
      { day: 1, title: `Arrive in ${destination.name}`, places: [`${destination.name} City Centre`, 'Local Market', 'Welcome Dinner'], tips: 'Check into your hotel and explore the surrounding neighbourhood on foot.' },
      { day: 2, title: 'Main Attractions', places: [`Top Viewpoint in ${destination.name}`, 'Main Museum or Monument', 'Historic Quarter'], tips: 'Book popular tickets in advance to avoid queues.' },
      { day: 3, title: 'Nature & Outdoors', places: ['Nearby Natural Park', 'Scenic Lookout', 'Local Nature Walk'], tips: 'Start early to beat the heat and crowds.' },
      { day: 4, title: 'Culture & Food', places: ['Local Food Market', 'Cultural Performance', 'Artisan Workshops'], tips: 'Try the local speciality dish — ask your hotel for their recommendation.' },
      { day: 5, title: 'Day Trip & Depart', places: [`Nearest Town to ${destination.name}`, 'Souvenir Shopping', 'Departure'], tips: `${destination.name} is also a great base for exploring ${destination.country}.` },
    ],
    nearby: [],
  };
}

// ── Routes ──────────────────────────────────────────────────────────────────

router.get('/categories', async (req, res) => {
  const rows = await prisma.destination.findMany({
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' },
  });
  res.json(rows.map((r) => r.category));
});

router.get('/', async (req, res) => {
  const { category } = req.query;
  const where = category && category !== 'All' ? { category } : {};
  const destinations = await prisma.destination.findMany({ where, orderBy: { createdAt: 'asc' } });
  res.json(destinations.map((d) => ({ ...d, tags: JSON.parse(d.tags) })));
});

router.get('/:id', async (req, res) => {
  const destination = await prisma.destination.findUnique({ where: { id: parseInt(req.params.id) } });
  if (!destination) return res.status(404).json({ error: 'Not found' });
  res.json({ ...destination, tags: JSON.parse(destination.tags) });
});

router.get('/:id/itinerary', async (req, res) => {
  const destination = await prisma.destination.findUnique({ where: { id: parseInt(req.params.id) } });
  if (!destination) return res.status(404).json({ error: 'Not found' });
  const itinerary = ITINERARIES[destination.name] || genericItinerary(destination);
  res.json({ destination: { ...destination, tags: JSON.parse(destination.tags) }, ...itinerary });
});

module.exports = router;
