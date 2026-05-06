import axios from 'axios';

const FRANKFURTER_BASE = 'https://api.frankfurter.app/latest';

interface RateCache {
  rates: Record<string, number>;
  fetchedAt: number;
}

const cache = new Map<string, RateCache>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function getExchangeRates(baseCurrency: string): Promise<Record<string, number>> {
  const key = baseCurrency.toUpperCase();
  const cached = cache.get(key);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.rates;
  }

  try {
    const { data } = await axios.get(FRANKFURTER_BASE, {
      params: { from: key },
      timeout: 8000,
    });
    const rates = (data as { rates: Record<string, number> }).rates;
    rates[key] = 1; // base currency rate is 1
    cache.set(key, { rates, fetchedAt: Date.now() });
    return rates;
  } catch {
    // Return cached even if stale, or empty
    if (cached) return cached.rates;
    return { [key]: 1 };
  }
}

export async function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
): Promise<number> {
  if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) return amount;
  const rates = await getExchangeRates(fromCurrency.toUpperCase());
  const rate = rates[toCurrency.toUpperCase()];
  if (!rate) return amount; // can't convert, return as-is
  return Math.round(amount * rate * 100) / 100;
}
