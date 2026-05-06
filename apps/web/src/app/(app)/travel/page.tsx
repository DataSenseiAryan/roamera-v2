'use client';

import { useState, useRef, useEffect } from 'react';
import { Plane, Hotel, Search, ChevronDown, ExternalLink, Loader2, Globe } from 'lucide-react';
import { useFlightSearch, useHotelSearch, useAirportSearch } from '@roamera/sdk';
import type { Airport } from '@roamera/types';
import { FlightCard } from '@/components/travel/flight-card';
import { HotelCard } from '@/components/travel/hotel-card';

function AirportInput({
  label,
  value,
  onSelect,
}: {
  label: string;
  value: string;
  onSelect: (airport: Airport) => void;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const { data: airports } = useAirportSearch(query);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="City or airport code (e.g., DEL)"
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>
      {open && airports && airports.length > 0 && (
        <div className="absolute z-20 top-full mt-1 w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          {airports.map((a) => (
            <button
              key={a.iataCode}
              onClick={() => {
                setQuery(`${a.cityName ?? a.name} (${a.iataCode})`);
                onSelect(a);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              <span className="font-medium text-slate-800 dark:text-white text-sm">{a.iataCode}</span>
              <span className="text-xs text-slate-500 ml-2">{a.cityName ?? a.name}</span>
              {a.countryCode && <span className="text-xs text-slate-400 ml-1">· {a.countryCode}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TravelLensPage() {
  const [activeTab, setActiveTab] = useState<'flights' | 'hotels'>('flights');

  // Flight state
  const [flightParams, setFlightParams] = useState({
    origin: '',
    destination: '',
    departureDate: '',
    adults: '1',
  });
  const [flightSearch, setFlightSearch] = useState<{
    origin: string;
    destination: string;
    departureDate: string;
    adults: number;
  } | null>(null);

  // Hotel state
  const [hotelParams, setHotelParams] = useState({
    city: '',
    checkinDate: '',
    checkoutDate: '',
    adults: '2',
  });
  const [hotelSearch, setHotelSearch] = useState<{
    city: string;
    checkinDate?: string;
    checkoutDate?: string;
    adults: number;
  } | null>(null);

  const { data: flightData, isLoading: flightsLoading } = useFlightSearch(
    flightSearch
      ? { origin: flightSearch.origin, destination: flightSearch.destination, departureDate: flightSearch.departureDate, adults: flightSearch.adults }
      : {},
  );

  const { data: hotelData, isLoading: hotelsLoading } = useHotelSearch(
    hotelSearch
      ? { city: hotelSearch.city, checkinDate: hotelSearch.checkinDate, checkoutDate: hotelSearch.checkoutDate, adults: hotelSearch.adults }
      : {},
  );

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center">
          <Globe className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">TravelLens</h1>
          <p className="text-sm text-slate-500">Find flights & hotels with direct booking links</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('flights')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'flights'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Plane className="h-4 w-4" />
          Flights
        </button>
        <button
          onClick={() => setActiveTab('hotels')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'hotels'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Hotel className="h-4 w-4" />
          Hotels
        </button>
      </div>

      {/* Flight Search */}
      {activeTab === 'flights' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card p-5">
            <h2 className="font-semibold text-slate-800 dark:text-white mb-4">Search Flights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AirportInput
                label="From"
                value={flightParams.origin}
                onSelect={(a) => setFlightParams((p) => ({ ...p, origin: a.iataCode }))}
              />
              <AirportInput
                label="To"
                value={flightParams.destination}
                onSelect={(a) => setFlightParams((p) => ({ ...p, destination: a.iataCode }))}
              />
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Departure Date</label>
                <input
                  type="date"
                  min={today}
                  value={flightParams.departureDate}
                  onChange={(e) => setFlightParams((p) => ({ ...p, departureDate: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Passengers</label>
                <div className="relative">
                  <select
                    value={flightParams.adults}
                    onChange={(e) => setFlightParams((p) => ({ ...p, adults: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none"
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>{n} adult{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <button
              onClick={() =>
                setFlightSearch({
                  origin: flightParams.origin,
                  destination: flightParams.destination,
                  departureDate: flightParams.departureDate || today,
                  adults: parseInt(flightParams.adults, 10),
                })
              }
              disabled={!flightParams.origin || !flightParams.destination}
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search className="h-4 w-4" />
              Search Flights
            </button>
          </div>

          {/* Flight Results */}
          {flightsLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
              <span className="ml-2 text-slate-500">Searching flights...</span>
            </div>
          )}

          {flightData && !flightsLoading && (
            <>
              {flightData.message && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                  <p className="text-sm text-amber-700 dark:text-amber-300">{flightData.message}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a href={flightData.deepLinks.googleFlights} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-medium text-sky-600 hover:underline">
                      <ExternalLink className="h-3 w-3" /> Search on Google Flights
                    </a>
                    <a href={flightData.deepLinks.skyscanner} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-medium text-sky-600 hover:underline">
                      <ExternalLink className="h-3 w-3" /> Search on Skyscanner
                    </a>
                    <a href={flightData.deepLinks.makemytrip} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-medium text-orange-600 hover:underline">
                      <ExternalLink className="h-3 w-3" /> Search on MakeMyTrip
                    </a>
                  </div>
                </div>
              )}
              {flightData.flights?.length > 0 && (
                <div className="space-y-3">
                  {flightData.flights.map((flight) => (
                    <FlightCard key={flight.id} flight={flight} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Hotel Search */}
      {activeTab === 'hotels' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card p-5">
            <h2 className="font-semibold text-slate-800 dark:text-white mb-4">Search Hotels</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Destination City</label>
                <input
                  type="text"
                  value={hotelParams.city}
                  onChange={(e) => setHotelParams((p) => ({ ...p, city: e.target.value }))}
                  placeholder="City name (e.g., Goa, Mumbai, Jaipur)"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Check-in</label>
                <input
                  type="date"
                  min={today}
                  value={hotelParams.checkinDate}
                  onChange={(e) => setHotelParams((p) => ({ ...p, checkinDate: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Check-out</label>
                <input
                  type="date"
                  min={hotelParams.checkinDate || tomorrow}
                  value={hotelParams.checkoutDate}
                  onChange={(e) => setHotelParams((p) => ({ ...p, checkoutDate: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Guests</label>
                <div className="relative">
                  <select
                    value={hotelParams.adults}
                    onChange={(e) => setHotelParams((p) => ({ ...p, adults: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none"
                  >
                    {[1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>{n} guest{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <button
              onClick={() =>
                setHotelSearch({
                  city: hotelParams.city,
                  checkinDate: hotelParams.checkinDate || today,
                  checkoutDate: hotelParams.checkoutDate || tomorrow,
                  adults: parseInt(hotelParams.adults, 10),
                })
              }
              disabled={!hotelParams.city}
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search className="h-4 w-4" />
              Search Hotels
            </button>
          </div>

          {/* Hotel Results */}
          {hotelsLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
              <span className="ml-2 text-slate-500">Searching hotels...</span>
            </div>
          )}

          {hotelData && !hotelsLoading && (
            <>
              {hotelData.message && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                  <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">{hotelData.message}</p>
                  <div className="flex flex-wrap gap-2">
                    <a href={hotelData.deepLinks.booking} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
                      <ExternalLink className="h-3 w-3" /> Search on Booking.com
                    </a>
                    <a href={hotelData.deepLinks.makemytrip} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-medium text-orange-600 hover:underline">
                      <ExternalLink className="h-3 w-3" /> Search on MakeMyTrip
                    </a>
                    <a href={hotelData.deepLinks.agoda} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:underline">
                      <ExternalLink className="h-3 w-3" /> Search on Agoda
                    </a>
                  </div>
                </div>
              )}
              {hotelData.hotels?.length > 0 && (
                <div className="space-y-3">
                  {hotelData.hotels.map((hotel) => (
                    <HotelCard key={hotel.id} hotel={hotel} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
