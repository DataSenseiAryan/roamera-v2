// Maps common city names (lowercase) → primary airport IATA code
const CITY_MAP = {
  // Europe
  'london': 'LHR', 'paris': 'CDG', 'amsterdam': 'AMS', 'frankfurt': 'FRA',
  'madrid': 'MAD', 'barcelona': 'BCN', 'rome': 'FCO', 'milan': 'MXP',
  'berlin': 'BER', 'munich': 'MUC', 'vienna': 'VIE', 'zurich': 'ZRH',
  'brussels': 'BRU', 'lisbon': 'LIS', 'athens': 'ATH', 'istanbul': 'IST',
  'stockholm': 'ARN', 'oslo': 'OSL', 'copenhagen': 'CPH', 'helsinki': 'HEL',
  'warsaw': 'WAW', 'prague': 'PRG', 'budapest': 'BUD', 'dublin': 'DUB',
  'edinburgh': 'EDI', 'manchester': 'MAN', 'nice': 'NCE', 'venice': 'VCE',
  'florence': 'FLR', 'porto': 'OPO', 'geneva': 'GVA', 'lyon': 'LYS',
  'zagreb': 'ZAG', 'bucharest': 'OTP', 'sofia': 'SOF', 'riga': 'RIX',

  // Americas
  'new york': 'JFK', 'los angeles': 'LAX', 'chicago': 'ORD', 'miami': 'MIA',
  'san francisco': 'SFO', 'dallas': 'DFW', 'houston': 'IAH', 'atlanta': 'ATL',
  'boston': 'BOS', 'seattle': 'SEA', 'denver': 'DEN', 'las vegas': 'LAS',
  'orlando': 'MCO', 'phoenix': 'PHX', 'washington': 'IAD', 'dc': 'IAD',
  'philadelphia': 'PHL', 'newark': 'EWR', 'charlotte': 'CLT', 'detroit': 'DTW',
  'minneapolis': 'MSP', 'portland': 'PDX', 'san diego': 'SAN', 'austin': 'AUS',
  'nashville': 'BNA', 'new orleans': 'MSY', 'tampa': 'TPA', 'fort lauderdale': 'FLL',
  'toronto': 'YYZ', 'montreal': 'YUL', 'vancouver': 'YVR', 'calgary': 'YYC',
  'mexico city': 'MEX', 'cancun': 'CUN', 'sao paulo': 'GRU', 'rio de janeiro': 'GIG',
  'buenos aires': 'EZE', 'bogota': 'BOG', 'lima': 'LIM', 'santiago': 'SCL',

  // Middle East & Africa
  'dubai': 'DXB', 'abu dhabi': 'AUH', 'doha': 'DOH', 'riyadh': 'RUH',
  'tel aviv': 'TLV', 'cairo': 'CAI', 'casablanca': 'CMN', 'johannesburg': 'JNB',
  'cape town': 'CPT', 'nairobi': 'NBO', 'lagos': 'LOS', 'addis ababa': 'ADD',
  'muscat': 'MCT', 'kuwait': 'KWI', 'beirut': 'BEY', 'amman': 'AMM',

  // Asia Pacific
  'tokyo': 'NRT', 'osaka': 'KIX', 'singapore': 'SIN', 'hong kong': 'HKG',
  'beijing': 'PEK', 'shanghai': 'PVG', 'seoul': 'ICN', 'taipei': 'TPE',
  'bangkok': 'BKK', 'kuala lumpur': 'KUL', 'jakarta': 'CGK', 'manila': 'MNL',
  'bali': 'DPS', 'denpasar': 'DPS', 'sydney': 'SYD', 'melbourne': 'MEL',
  'mumbai': 'BOM', 'delhi': 'DEL', 'bangalore': 'BLR', 'chennai': 'MAA',
  'hyderabad': 'HYD', 'kolkata': 'CCU', 'kathmandu': 'KTM', 'colombo': 'CMB',
  'dhaka': 'DAC', 'karachi': 'KHI', 'lahore': 'LHE', 'islamabad': 'ISB',
  'auckland': 'AKL', 'christchurch': 'CHC', 'brisbane': 'BNE', 'perth': 'PER',
};

function resolveIata(input) {
  if (!input) return input;
  const trimmed = input.trim();
  // Already an IATA code (2-3 uppercase letters)
  if (/^[A-Z]{2,3}$/.test(trimmed)) return trimmed;
  const lower = trimmed.toLowerCase();
  return CITY_MAP[lower] ?? trimmed; // fallback: pass as-is and let SerpAPI handle it
}

module.exports = { resolveIata };
