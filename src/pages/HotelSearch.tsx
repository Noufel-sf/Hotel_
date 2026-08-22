import { useMemo, useState, useEffect, useRef, FormEvent, MouseEvent as ReactMouseEvent } from 'react';
import Layout from '../components/Layout';
import RoomSelector from '../components/RoomSelector';
import HotelCard from '../components/HotelCard';
import { HotelCardSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import FilterSidebar from '../components/FilterSidebar';
import Drawer from '../components/Drawer';
import { SearchInput, SortButton } from '../components/FilterControls';
import BookingFlowModal, { BookingSubmissionData } from '../components/BookingFlowModal';
import { useQueryClient } from '@tanstack/react-query';
import { useOrdersStore } from '../store/useOrdersStore';
import { useCitySearch, useHotelSearch, fetchCitySuggestions } from '../hooks/useHotels';
import { Hotel, CityOption, RoomOccupancy, SearchDetailsParams, AdvancedFilterState } from '../types';
import { Search as SearchIcon, MapPin, Building2, Globe, Sparkles, SlidersHorizontal } from 'lucide-react';

const PAGE_SIZE = 10;

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

const initialAdvancedFilters: AdvancedFilterState = {
  search: '',
  promosOnly: false,
  freeChildOnly: false,
  availableOnly: false,
  freeCancellationOnly: false,
  arrangements: [],
  categories: [],
  minPrice: 0,
  maxPrice: 0,
  roomTypes: [],
  services: [],
  sortBy: 'price',
  sortDir: 'asc',
};

export default function HotelSearch() {
  const queryClient = useQueryClient();
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

  // City autocomplete dropdown state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement | null>(null);

  // React Query hook for city search
  const { data: citySuggestions = [], isFetching: isSearchingCities } = useCitySearch(form.destination);

  // Active search params state to trigger React Query search
  const [activeSearchParams, setActiveSearchParams] = useState<SearchDetailsParams | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [appliedDestination, setAppliedDestination] = useState('');

  // React Query hook for hotel availability search
  const {
    data: searchResult,
    isLoading: isHotelsLoading,
    isFetching: isHotelsFetching,
  } = useHotelSearch(activeSearchParams, hasSearched);

  const hotels = searchResult?.hotels || [];
  const searchMeta = searchResult
    ? {
        countResults: searchResult.countResults,
        searchId: searchResult.rawResponse?.SearchId,
      }
    : null;

  // Advanced Filters State
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilterState>(initialAdvancedFilters);
  const [hotelSearchTerm, setHotelSearchTerm] = useState('');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [page, setPage] = useState(1);

  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Sync session ID from search results
  useEffect(() => {
    if (searchResult?.sessionId) {
      setCurrentSessionId(searchResult.sessionId);
    }
  }, [searchResult?.sessionId]);

  // Debounce hotel name input so backend GET /hotels/search/{sessionId}?query=... is triggered smoothly
  useEffect(() => {
    const timer = setTimeout(() => {
      if (hotelSearchTerm !== advancedFilters.search) {
        handleFilterChange({
          ...advancedFilters,
          search: hotelSearchTerm,
        });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [hotelSearchTerm, advancedFilters]);

  // Keep local search input term in sync when filters are reset externally
  useEffect(() => {
    if (advancedFilters.search !== hotelSearchTerm) {
      setHotelSearchTerm(advancedFilters.search);
    }
  }, [advancedFilters.search]);

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

  const handleDestinationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, destination: value, selectedCityId: null }));
    setShowSuggestions(true);
  };

  const handleSelectCity = (city: CityOption) => {
    setForm((f) => ({
      ...f,
      destination: `${city.name}, ${city.destination}`,
      selectedCityId: city.id,
    }));
    setShowSuggestions(false);
  };

  // Trigger TanStack React Query search
  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    setAppliedDestination(form.destination);
    setPage(1);
    setCurrentSessionId(null);

    let cityId = form.selectedCityId;
    if (!cityId && form.destination.trim()) {
      const matches = await fetchCitySuggestions(queryClient, form.destination);
      if (matches.length > 0) {
        cityId = matches[0].id;
      }
    }

    const newSearchParams: SearchDetailsParams = {
      city: cityId ? String(cityId) : form.destination || '34',
      cityName: form.destination,
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      nationality: form.nationality,
      residence: form.residence,
      rooms: form.rooms,
      page: 0,
      sessionId: undefined, // Omit to trigger initial POST search
      filters: advancedFilters,
    };

    setActiveSearchParams(newSearchParams);
    setHasSearched(true);
  };

  const handleFilterChange = (newFilters: AdvancedFilterState) => {
    setAdvancedFilters(newFilters);
    setPage(1);
    if (activeSearchParams) {
      setActiveSearchParams((prev) =>
        prev
          ? {
              ...prev,
              page: 0,
              filters: newFilters,
              sessionId: currentSessionId || prev.sessionId,
            }
          : null
      );
    }
  };

  const handleResetFilters = () => {
    setHotelSearchTerm('');
    setAdvancedFilters(initialAdvancedFilters);
    setPage(1);
    if (activeSearchParams) {
      setActiveSearchParams((prev) =>
        prev
          ? {
              ...prev,
              page: 0,
              filters: initialAdvancedFilters,
              sessionId: currentSessionId || prev.sessionId,
            }
          : null
      );
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    if (activeSearchParams) {
      setActiveSearchParams((prev) =>
        prev
          ? {
              ...prev,
              page: newPage - 1,
              sessionId: currentSessionId || prev.sessionId,
              filters: advancedFilters,
            }
          : null
      );
    }
  };

  // Direct backend results (no client-side duplication)
  const totalCount = searchMeta?.countResults !== undefined && searchMeta.countResults > 0
    ? searchMeta.countResults
    : hotels.length;

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const pageItems = useMemo(() => {
    if (hotels.length > PAGE_SIZE) {
      const start = (page - 1) * PAGE_SIZE;
      return hotels.slice(start, start + PAGE_SIZE);
    }
    return hotels;
  }, [hotels, page]);

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

  const loading = isHotelsLoading || isHotelsFetching;

  // Active filter badge count for mobile floating button
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (advancedFilters.search) count++;
    if (advancedFilters.promosOnly) count++;
    if (advancedFilters.freeChildOnly) count++;
    if (advancedFilters.availableOnly) count++;
    if (advancedFilters.freeCancellationOnly) count++;
    count += advancedFilters.arrangements.length;
    count += advancedFilters.categories.length;
    if (advancedFilters.maxPrice > 0) count++;
    count += advancedFilters.roomTypes.length;
    count += advancedFilters.services.length;
    return count;
  }, [advancedFilters]);

  return (
    <Layout title="Hotel Search & Booking" subtitle="Live OpenAPI integration with Advanced Filter Sidebar">
      <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-soft p-5 lg:p-6 mb-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-ink-900/5">
          <span className="text-xs font-bold text-navy-900 tracking-wider uppercase flex items-center gap-1.5">
            <Sparkles size={14} className="text-gold-400" /> hotel agency
          </span>
        
        </div>

        <div className="grid lg:grid-cols-4 gap-4">
          {/* Destination with Autocomplete */}
          <div className="relative lg:col-span-2" ref={suggestionsRef}>
            <label className="block">
              <span className="text-xs font-semibold text-ink-700 mb-1.5 block">
                Destination
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
            <SearchIcon size={17} /> {loading ? 'Searching...' : 'Search Hotels'}
          </button>
        </div>
      </form>

      {/* {isError && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-sm">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">API Error</p>
            <p>{error?.message || 'Failed to fetch hotel offers from server.'}</p>
          </div>
        </div>
      )} */}

      {(loading || hasSearched) && (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block lg:w-72 xl:w-80 shrink-0 sticky top-24">
            <FilterSidebar
              hotels={hotels}
              filters={advancedFilters}
              facets={searchResult?.facets}
              onFilterChange={handleFilterChange}
              onReset={handleResetFilters}
            />
          </div>

          {/* Main Results Column */}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* Mobile Filter Drawer Button */}
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(true)}
                  className="lg:hidden flex items-center gap-2 bg-white border border-ink-900/10 px-4 py-2.5 rounded-xl text-sm font-semibold text-sky-600 hover:bg-sky-50 transition-colors"
                >
                  <SlidersHorizontal size={16} />
                  <span>Filtrer</span>
                  {activeFilterCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-sky-500 text-white text-xs flex items-center justify-center font-bold">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                <SearchInput
                  value={hotelSearchTerm}
                  onChange={(v) => setHotelSearchTerm(v)}
                  placeholder="Search hotel name…"
                  loading={loading}
                />
              </div>

              <div className="flex items-center gap-3">
                <SortButton
                  label="Price"
                  active
                  direction={advancedFilters.sortDir}
                  onClick={() =>
                    handleFilterChange({
                      ...advancedFilters,
                      sortDir: advancedFilters.sortDir === 'asc' ? 'desc' : 'asc',
                    })
                  }
                />

                {searchMeta && (
                  <div className="text-xs text-ink-500 bg-white px-3 py-2 rounded-lg border border-ink-900/5 shadow-xs font-mono">
                    Offers: <span className="font-semibold text-navy-900 font-sans">
                      {totalCount > 0 ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min((page - 1) * PAGE_SIZE + hotels.length, totalCount)}` : 0}
                    </span> / {totalCount}
                  </div>
                )}
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col gap-6">
                {Array.from({ length: 4 }).map((_, i) => <HotelCardSkeleton key={i} />)}
              </div>
            ) : pageItems.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-soft">
                <EmptyState
                  icon={Building2}
                  title="No hotel offers match filters"
                  description={
                    appliedDestination
                      ? `No availability found for "${appliedDestination}" matching selected filters. Try resetting filters or adjusting search dates.`
                      : 'Search for a city above to fetch real hotel availability .'
                  }
                />
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-6">
                  {pageItems.map((hotel) => (
                    <HotelCard key={hotel.id} hotel={hotel} onOrder={setSelectedHotel} />
                  ))}
                </div>
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  pageSize={PAGE_SIZE}
                  totalItems={totalCount}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* Mobile Drawer for FilterSidebar */}
      <Drawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        title="Filtrer"
      >
        <FilterSidebar
          hotels={hotels}
          filters={advancedFilters}
          facets={searchResult?.facets}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />
      </Drawer>

      <BookingFlowModal
        hotel={selectedHotel}
        searchParams={form}
        onClose={() => setSelectedHotel(null)}
        onSubmit={handleBookingSubmit}
      />
    </Layout>
  );
}
