import React, { useMemo, useState } from 'react';
import Layout from '../components/Layout.jsx';
import RoomSelector from '../components/RoomSelector.jsx';
import HotelCard from '../components/HotelCard.jsx';
import { HotelCardSkeleton } from '../components/Skeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Pagination from '../components/Pagination.jsx';
import { SearchInput, SortButton } from '../components/FilterControls.jsx';
import BookingFlowModal from '../components/BookingFlowModal.jsx';
import { hotels } from '../data/hotels.js';
import { useOrders } from '../context/OrdersContext.jsx';
import { Search as SearchIcon, MapPin, Building2 } from 'lucide-react';

const PAGE_SIZE = 6;

function todayPlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function HotelSearch() {
  const { createOrder } = useOrders();

  const [form, setForm] = useState({
    destination: '',
    checkIn: todayPlus(14),
    checkOut: todayPlus(17),
    rooms: [{ adults: 2, children: 0 }],
  });

  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [appliedDestination, setAppliedDestination] = useState('');

  const [nameFilter, setNameFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [starFilter, setStarFilter] = useState('');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);

  const [selectedHotel, setSelectedHotel] = useState(null);

  const handleSearch = (e) => {
    e.preventDefault();
    setLoading(true);
    setSearched(false);
    setAppliedDestination(form.destination);
    setPage(1);
    setTimeout(() => {
      setLoading(false);
      setSearched(true);
    }, 650);
  };

  const filteredHotels = useMemo(() => {
    let list = hotels;
    if (appliedDestination.trim()) {
      const q = appliedDestination.trim().toLowerCase();
      list = list.filter((h) => h.destination.toLowerCase().includes(q));
    }
    if (nameFilter.trim()) {
      const q = nameFilter.trim().toLowerCase();
      list = list.filter((h) => h.name.toLowerCase().includes(q));
    }
    if (minPrice) list = list.filter((h) => h.price >= Number(minPrice));
    if (maxPrice) list = list.filter((h) => h.price <= Number(maxPrice));
    if (starFilter) list = list.filter((h) => h.stars === Number(starFilter));

    list = [...list].sort((a, b) => (sortDir === 'asc' ? a.price - b.price : b.price - a.price));
    return list;
  }, [appliedDestination, nameFilter, minPrice, maxPrice, starFilter, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredHotels.length / PAGE_SIZE));
  const pageItems = filteredHotels.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleBookingSubmit = ({ hotel, searchParams, totalPrice, customer, travelInfo }) => {
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
    <Layout title="Hotel Search & Booking" subtitle="Find and book hotel offers for your customers">
      <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-soft p-5 lg:p-6 mb-6">
        <div className="grid lg:grid-cols-3 gap-4">
          <label className="block">
            <span className="text-xs font-semibold text-ink-700 mb-1.5 block">Destination</span>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
              <input
                value={form.destination}
                onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}
                placeholder="City or country"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-ink-900/10 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
              />
            </div>
          </label>
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

        <div className="mt-5">
          <span className="text-xs font-semibold text-ink-700 mb-2 block">Rooms & guests</span>
          <RoomSelector rooms={form.rooms} onChange={(rooms) => setForm((f) => ({ ...f, rooms }))} />
        </div>

        <div className="flex justify-end mt-5">
          <button
            type="submit"
            className="flex items-center gap-2 bg-navy-900 text-white font-semibold px-6 py-3 rounded-lg hover:bg-navy-800 transition-colors"
          >
            <SearchIcon size={17} /> Search Hotels
          </button>
        </div>
      </form>

      {(loading || searched) && (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-5">
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

          {loading ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => <HotelCardSkeleton key={i} />)}
            </div>
          ) : pageItems.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-soft">
              <EmptyState
                icon={Building2}
                title="No hotels match your search"
                description="Try widening your destination, price range, or star rating filters."
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
                onPageSizeChange={null}
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
