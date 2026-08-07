import { useMemo, useState, useEffect, useRef, FormEvent, MouseEvent as ReactMouseEvent } from 'react';
import Layout from '../components/Layout';
import RoomSelector from '../components/RoomSelector';
import HotelCard from '../components/HotelCard';
import { HotelCardSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import { SearchInput, SortButton } from '../components/FilterControls';
import BookingFlowModal, { BookingSubmissionData } from '../components/BookingFlowModal';
import { useOrdersStore } from '../store/useOrdersStore';
import { searchCities, getIproAvailability } from '../services/bookingApi';
import { Hotel, CityOption, RoomOccupancy } from '../types';
import { Search as SearchIcon, MapPin, Building2, Globe, AlertCircle, Sparkles } from 'lucide-react';

const PAGE_SIZE = 6;

const COMMON_NATIONALITIES = [
  { code: 'dz', name: 'Algeria (dz)' },
  { code: 'tn', name: 'Tunisia (tn)' },
  { code: 'fr', name: 'France (fr)' },
  { code: 'ma', name: 'Morocco (ma)' },
  { code: 'us', name: 'United States (us)' },
  { code: 'gb', name: 'United Kingdom (gb)' },
  { code: 'de', name: 'Germany (de)' },
  { code: 'it', name: 'Italy (it)' },
  { code: 'es', name: 'Spain (es)' },
  { code: 'ae', name: 'UAE (ae)' },
];

function todayPlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function HotelSearch() {
  const createOrder = useOrdersStore((state) => state.createOrder);

  const [form, setForm] = useState<{
    destination: string;
    selectedCityId: string | number | null;
    checkIn: string;
    checkOut: string;
    nationality: string;
    residence: string;
    rooms: RoomOccupancy[];
  }>({
    destination: '',
    selectedCityId: null,
    checkIn: todayPlus(14),
    checkOut: todayPlus(17),
    nationality: 'dz',
    residence: 'dz',
    rooms: [{ adults: 2, children: 0 }],
  });

  // City autocomplete state
  const [citySuggestions, setCitySuggestions] = useState<CityOption[]>([]);
  const [isSearchingCities, setIsSearchingCities] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement | null>(null);

  // Search execution state
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchMeta, setSearchMeta] = useState<{ countResults: number; searchId?: string } | null>(null);
  const [appliedDestination, setAppliedDestination] = useState('');

  // Filters & sorting state
  const [nameFilter, setNameFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [starFilter, setStarFilter] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(e: ReactMouseEvent | Event) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch city suggestions as user types
  const handleDestinationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, destination: value, selectedCityId: null }));
    setShowSuggestions(true);

    if (value.trim().length >= 1) {
      setIsSearchingCities(true);
      searchCities(value).then((results) => {
        setCitySuggestions(results);
        setIsSearchingCities(false);
      });
    } else {
      setCitySuggestions([]);
      setIsSearchingCities(false);
    }
  };

  const handleSelectCity = (city: CityOption) => {
    setForm((f) => ({
      ...f,
      destination: `${city.name}, ${city.destination}`,
      selectedCityId: city.id,
    }));
    setShowSuggestions(false);
  };

  // Perform API hotel search via POST /bookings/ipro/search
  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearched(false);
    setErrorMsg(null);
    setAppliedDestination(form.destination);
    setPage(1);

    try {
      let cityId = form.selectedCityId;
      if (!cityId && form.destination.trim()) {
        const matches = await searchCities(form.destination);
        if (matches.length > 0) {
          cityId = matches[0].id;
        }
      }

      const result = await getIproAvailability({
        city: cityId ? String(cityId) : form.destination || '34',
        cityName: form.destination,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        nationality: form.nationality,
        residence: form.residence,
        rooms: form.rooms,
      });

      setHotels(result.hotels);
      setSearchMeta({
        countResults: result.countResults,
        searchId: result.rawResponse?.SearchId,
      });
      setSearched(true);
    } catch (err: any) {
      console.error('Failed to fetch hotels:', err);
      setErrorMsg(err.message || 'Failed to fetch hotel offers from server.');
      setHotels([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const filteredHotels = useMemo(() => {
    let list = hotels;
    if (nameFilter.trim()) {
      const q = nameFilter.trim().toLowerCase();
      list = list.filter((h) => h.name.toLowerCase().includes(q));
    }
    if (minPrice) list = list.filter((h) => h.price >= Number(minPrice));
    if (maxPrice) list = list.filter((h) => h.price <= Number(maxPrice));
    if (starFilter) list = list.filter((h) => h.stars === Number(starFilter));

    list = [...list].sort((a, b) => (sortDir === 'asc' ? a.price - b.price : b.price - a.price));
    return list;
  }, [hotels, nameFilter, minPrice, maxPrice, starFilter, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredHotels.length / PAGE_SIZE));
  const pageItems = filteredHotels.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleBookingSubmit = ({ hotel, searchParams, totalPrice, customer, travelInfo }: BookingSubmissionData) => {
    createOrder({
      hotelId: hotel.id,
      hotelName: hotel.name,
      destination: hotel.destination,
      hotelImage: hotel.image,
      availability: hotel.availability,
      mealPlan: hotel.mealPlan,
      sharedPool: hotel.sharedPool,
      minStay: hotel.minStay,
      notes: hotel.notes,
      rooms: searchParams.rooms,
      roomCount: searchParams.rooms.length,
      checkIn: searchParams.checkIn,
      checkOut: searchParams.checkOut,
      totalPrice,
      currency: hotel.currency,
      customer,
      travelInfo,
    });
    setSelectedHotel(null);
  };

  return (
    <Layout title="Hotel Search & Booking" subtitle="Live OpenAPI integration (https://delivero-nh1o.onrender.com)">
      <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-soft p-5 lg:p-6 mb-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-ink-900/5">
          <span className="text-xs font-bold text-navy-900 tracking-wider uppercase flex items-center gap-1.5">
            <Sparkles size={14} className="text-gold-400" /> Delivero IPRO API Search
          </span>
          <span className="text-xs text-ink-500 bg-navy-900/5 px-2.5 py-1 rounded-full font-mono">
            POST /bookings/ipro/search
          </span>
        </div>

        <div className="grid lg:grid-cols-4 gap-4">
          {/* Destination with Autocomplete */}
          <div className="relative lg:col-span-2" ref={suggestionsRef}>
            <label className="block">
              <span className="text-xs font-semibold text-ink-700 mb-1.5 block">
                Destination (City Search Endpoint)
              </span>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
                <input
                  value={form.destination}
                  onChange={handleDestinationChange}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Search city (e.g. Hammamet, Sousse, Djerba, Tunis...)"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-ink-900/10 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
                {isSearchingCities && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-400">
                    Loading...
                  </div>
                )}
              </div>
            </label>

            {/* City Search Suggestions Dropdown */}
            {showSuggestions && citySuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-card border border-ink-900/10 z-50 max-h-60 overflow-y-auto py-1">
                <div className="px-3 py-1 text-[11px] font-semibold text-ink-400 uppercase tracking-wider bg-navy-900/[0.02]">
                  Matching Cities (/bookings/city-search)
                </div>
                {citySuggestions.map((city) => (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => handleSelectCity(city)}
                    className="w-full text-left px-3 py-2 hover:bg-navy-900/5 transition-colors flex items-center justify-between text-sm"
                  >
                    <span className="font-medium text-navy-900">{city.name}</span>
                    <span className="text-xs text-ink-500 font-normal">{city.destination} (ID: {city.id})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <label className="block">
            <span className="text-xs font-semibold text-ink-700 mb-1.5 block">Check-in</span>
            <input
              type="date"
              value={form.checkIn}
              onChange={(e) => setForm((f) => ({ ...f, checkIn: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-ink-900/10 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-ink-700 mb-1.5 block">Check-out</span>
            <input
              type="date"
              value={form.checkOut}
              min={form.checkIn}
              onChange={(e) => setForm((f) => ({ ...f, checkOut: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-ink-900/10 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
            />
          </label>
        </div>

        {/* OpenAPI specific fields: Nationality and Residence */}
        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <label className="block">
            <span className="text-xs font-semibold text-ink-700 mb-1.5 flex items-center gap-1">
              <Globe size={13} /> Nationality (Nationalite)
            </span>
            <select
              value={form.nationality}
              onChange={(e) => setForm((f) => ({ ...f, nationality: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-ink-900/10 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
            >
              {COMMON_NATIONALITIES.map((n) => (
                <option key={n.code} value={n.code}>{n.name}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-ink-700 mb-1.5 flex items-center gap-1">
              <Globe size={13} /> Residence (Residence)
            </span>
            <select
              value={form.residence}
              onChange={(e) => setForm((f) => ({ ...f, residence: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-ink-900/10 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
            >
              {COMMON_NATIONALITIES.map((n) => (
                <option key={n.code} value={n.code}>{n.name}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5">
          <span className="text-xs font-semibold text-ink-700 mb-2 block">Rooms & guests</span>
          <RoomSelector rooms={form.rooms} onChange={(rooms) => setForm((f) => ({ ...f, rooms }))} />
        </div>

        <div className="flex justify-end mt-5">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-navy-900 text-white font-semibold px-6 py-3 rounded-lg hover:bg-navy-800 transition-colors disabled:opacity-50"
          >
            <SearchIcon size={17} /> {loading ? 'Fetching API Offers...' : 'Search Hotels via API'}
          </button>
        </div>
      </form>

      {errorMsg && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-sm">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">API Error</p>
            <p>{errorMsg}</p>
          </div>
        </div>
      )}

      {(loading || searched) && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex flex-wrap items-center gap-3">
              <SearchInput value={nameFilter} onChange={(v) => { setNameFilter(v); setPage(1); }} placeholder="Search hotel name…" />
              <input
                type="number"
                value={minPrice}
                onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                placeholder="Min price"
                className="w-28 px-3 py-2.5 rounded-lg border border-ink-900/10 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
              />
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                placeholder="Max price"
                className="w-28 px-3 py-2.5 rounded-lg border border-ink-900/10 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
              />
              <select
                value={starFilter}
                onChange={(e) => { setStarFilter(e.target.value); setPage(1); }}
                className="px-3 py-2.5 rounded-lg border border-ink-900/10 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
              >
                <option value="">All star ratings</option>
                {[3, 4, 5].map((s) => (
                  <option key={s} value={s}>{s} star</option>
                ))}
              </select>
              <SortButton
                label="Price"
                active
                direction={sortDir}
                onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
              />
            </div>

            {searchMeta && (
              <div className="text-xs text-ink-500 bg-white px-3 py-2 rounded-lg border border-ink-900/5 shadow-xs font-mono">
                Results: <span className="font-semibold text-navy-900 font-sans">{searchMeta.countResults}</span> offers
                {searchMeta.searchId && <span className="ml-2 text-[11px] text-ink-400">({searchMeta.searchId})</span>}
              </div>
            )}
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => <HotelCardSkeleton key={i} />)}
            </div>
          ) : pageItems.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-soft">
              <EmptyState
                icon={Building2}
                title="No hotel offers found"
                description={
                  appliedDestination
                    ? `No availability found for "${appliedDestination}". Try searching cities like Hammamet, Sousse, or Djerba, or adjusting your travel dates.`
                    : 'Search for a city above to fetch real hotel availability from the Delivero API.'
                }
              />
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {pageItems.map((hotel) => (
                  <HotelCard key={hotel.id} hotel={hotel} onOrder={setSelectedHotel} />
                ))}
              </div>
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                pageSize={PAGE_SIZE}
                totalItems={filteredHotels.length}
              />
            </>
          )}
        </>
      )}

      <BookingFlowModal
        hotel={selectedHotel}
        searchParams={form}
        onClose={() => setSelectedHotel(null)}
        onSubmit={handleBookingSubmit}
      />
    </Layout>
  );
}
