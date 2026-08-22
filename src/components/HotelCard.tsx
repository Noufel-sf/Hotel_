import { useState, useMemo } from 'react';
import {
  Star,
  MapPin,
  Tag,
  ShieldCheck,
  BedDouble,
  ChevronDown,
  ChevronUp,
  Users,
  Info,
  CheckCircle2,
  Clock,
  Layers,
  X
} from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { Hotel, RoomOffer } from '../types';

interface HotelCardProps {
  hotel: Hotel;
  onOrder: (hotel: Hotel) => void;
}

export default function HotelCard({ hotel, onOrder }: HotelCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [cancellationModalOpen, setCancellationModalOpen] = useState(false);
  const [activeCancellationPolicy, setActiveCancellationPolicy] = useState<string>('');

  // Extract real room offers from hotel
  const roomOffers: RoomOffer[] = useMemo(() => {
    if (hotel.roomOffers && hotel.roomOffers.length > 0) {
      return hotel.roomOffers;
    }
    return [
      {
        id: `${hotel.id}-room-main`,
        name: `1 x ${hotel.roomType || 'Chambre'}`,
        available: Boolean(hotel.disponible ?? true),
        occupancy: 2,
        discountPercent: hotel.discountPercent,
        originalPrice: hotel.originalPrice,
        cancellationPolicy: hotel.cancellationPolicy || hotel.notes || 'Annulation sans frais préalable selon conditions.',
        boardings: [
          {
            id: 'board-main',
            label: hotel.mealPlan || 'Logement Seul',
            price: hotel.price,
            originalPrice: hotel.originalPrice,
            discountPercent: hotel.discountPercent,
          },
        ],
      },
    ];
  }, [hotel]);

  // Selected room index (default first room)
  const [selectedRoomIndex, setSelectedRoomIndex] = useState(0);

  // Selected boarding ID for each room
  const [selectedBoardingMap, setSelectedBoardingMap] = useState<Record<string, string>>({});

  // Active room and active boarding selection
  const activeRoom = roomOffers[selectedRoomIndex] || roomOffers[0];
  const activeBoardingId = (activeRoom && selectedBoardingMap[activeRoom.id]) || activeRoom?.boardings[0]?.id;
  const activeBoarding = activeRoom?.boardings.find((b) => b.id === activeBoardingId) || activeRoom?.boardings[0];

  const currentTotalPrice = activeBoarding ? activeBoarding.price : hotel.price;
  const minPrice = useMemo(() => {
    return roomOffers.reduce((min, r) => {
      const bMin = r.boardings.reduce((bM, b) => Math.min(bM, b.price), Infinity);
      return Math.min(min, bMin);
    }, hotel.price);
  }, [roomOffers, hotel.price]);

  const isRembourssable = hotel.rembourssable ?? hotel.raw?.DataFiltre?.rembourssable;
  const roomCount = hotel.chambreDisponible ?? hotel.raw?.min_arrangement?.chambre?.disponible;

  const handleBoardingChange = (roomId: string, boardingId: string, roomIdx: number) => {
    setSelectedBoardingMap((prev) => ({
      ...prev,
      [roomId]: boardingId,
    }));
    setSelectedRoomIndex(roomIdx);
  };

  const handleOpenCancellation = (policy?: string) => {
    setActiveCancellationPolicy(
      policy || hotel.notes || "Annulation sans frais jusqu'à 48h avant la date d'arrivée. Au-delà, le montant de la première nuit sera facturé. En cas de non-présentation, la totalité du séjour sera due."
    );
    setCancellationModalOpen(true);
  };

  const handleBookNow = () => {
    if (!activeRoom || !activeBoarding) {
      onOrder(hotel);
      return;
    }

    const updatedHotel: Hotel = {
      ...hotel,
      roomType: activeRoom.name,
      mealPlan: activeBoarding.label,
      price: activeBoarding.price,
      availability: activeRoom.available ? 'Available Directly' : 'On Request',
      disponible: activeRoom.available,
      surDemande: activeRoom.available,
      cancellationPolicy: activeRoom.cancellationPolicy,
    };

    onOrder(updatedHotel);
  };

  return (
    <div className="bg-white rounded-2xl shadow-soft hover:shadow-card transition-shadow border border-ink-900/5 overflow-hidden flex flex-col">
      {/* Top Main Hotel Info Card */}
      <div className="p-5 flex flex-col md:flex-row gap-5 items-start">
        {/* Hotel Image with Badges */}
        <div className="w-full md:w-72 lg:w-80 h-48 md:h-44 rounded-xl overflow-hidden relative shrink-0">
          <img
            src={hotel.image}
            alt={hotel.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur px-2.5 py-1 rounded-full flex items-center gap-1 text-xs font-semibold text-navy-900 shadow-sm">
            <Star size={12} className="fill-gold-400 text-gold-400" />
            {hotel.stars}
          </div>

          {/* Availability badge */}
          <span
            className={`absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur shadow-sm flex items-center gap-1.5 ${
              hotel.disponible
                ? 'bg-emerald-600/90 text-white'
                : 'bg-amber-600/90 text-white'
            }`}
          >
            {hotel.disponible ? (
              <>
                <CheckCircle2 size={12} className="shrink-0" />
                <span>Disponible</span>
              </>
            ) : (
              <>
                <Clock size={12} className="shrink-0" />
                <span>Sur demande</span>
              </>
            )}
          </span>
        </div>

        {/* Hotel Details Column */}
        <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-display font-bold text-xl text-navy-900 leading-snug flex items-center gap-2 flex-wrap">
                  {hotel.name}
                  <span className="inline-flex text-gold-400 text-sm tracking-tighter">
                    {Array.from({ length: Math.min(5, Math.max(1, hotel.stars)) }).map((_, i) => (
                      <Star key={i} size={14} className="fill-gold-400 text-gold-400 inline" />
                    ))}
                  </span>
                </h3>

                <p className="flex items-center gap-1.5 text-xs text-ink-600 mt-1">
                  <MapPin size={13} className="text-ink-400 shrink-0" />
                  <span className="truncate">{hotel.destination}</span>
                </p>
              </div>
            </div>

            {/* Special Promo / Thumbs-up Line from API */}
            {hotel.promoText && (
              <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-700">
                <span className="text-sm">👍</span>
                <span>{hotel.promoText}</span>
              </div>
            )}

            {/* Badges & Tags */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              {/* Hotel Source Provider Badge */}
              {hotel.source && (
                <span className="inline-flex items-center gap-1 border text-[11px] font-bold px-2 py-0.5 rounded-md shadow-xs bg-indigo-50 text-indigo-700 border-indigo-200">
                  <Layers size={11} className="shrink-0 opacity-80" />
                  Source: {hotel.source}
                </span>
              )}

              {isRembourssable !== undefined && (
                <span
                  className={`inline-flex items-center gap-1 border text-[11px] font-bold px-2 py-0.5 rounded-md shadow-xs ${
                    isRembourssable
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  <ShieldCheck size={11} className="shrink-0 opacity-80" />
                  {isRembourssable ? 'Remboursable' : 'Non remboursable'}
                </span>
              )}

              {roomCount !== undefined && roomCount !== null && !isNaN(Number(roomCount)) && Number(roomCount) > 0 && (
                <span className="inline-flex items-center gap-1 border text-[11px] font-bold px-2 py-0.5 rounded-md shadow-xs bg-sky-50 text-sky-700 border-sky-200">
                  <BedDouble size={11} className="shrink-0 opacity-80" />
                  {roomCount} {Number(roomCount) > 1 ? 'chambres' : 'chambre'}
                </span>
              )}

              {Array.isArray(hotel.etiquettes) &&
                hotel.etiquettes.map((badge, idx) => {
                  const lower = badge.toLowerCase();
                  const isGreen = lower.includes('gratuit') || lower.includes('enfant');
                  const isRed = lower.includes('sauver') || lower.includes('%') || lower.includes('promo');

                  const badgeStyle = isGreen
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : isRed
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-sky-50 text-sky-700 border-sky-200';

                  return (
                    <span
                      key={idx}
                      className={`inline-flex items-center gap-1 border text-[11px] font-bold px-2 py-0.5 rounded-md shadow-xs ${badgeStyle}`}
                    >
                      <Tag size={10} className="shrink-0 opacity-80" />
                      {badge}
                    </span>
                  );
                })}
            </div>
          </div>

          {/* Price starting from & Toggle button */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-ink-900/5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs text-ink-600">A partir de</span>
              <span className="font-display font-bold text-2xl text-navy-900">
                {Math.round(minPrice).toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-ink-600">{hotel.currency || 'DZD'}</span>
            </div>

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="bg-[#f59e0b] hover:bg-[#d97706] text-navy-950 font-bold text-xs sm:text-sm px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <span>Chambres & Tarifs</span>
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Rooms & Rates Table */}
      {isExpanded && (
        <div className="border-t border-ink-900/10 bg-white">
          {/* Table Header Bar */}
          <div className="bg-[#0d4d54] text-white px-4 py-2.5 grid grid-cols-12 text-xs font-bold tracking-wide items-center">
            <div className="col-span-4 sm:col-span-4">Type de chambre</div>
            <div className="col-span-2 sm:col-span-2 text-center">Occupation</div>
            <div className="col-span-3 sm:col-span-3">Type de pension</div>
            <div className="col-span-3 sm:col-span-3 text-right">Total 1 nuit</div>
          </div>

          {/* Room Offers Rows */}
          <div className="divide-y divide-ink-900/10">
            {roomOffers.map((room, roomIdx) => {
              const isSelected = selectedRoomIndex === roomIdx;
              const currentBoardingId = selectedBoardingMap[room.id] || room.boardings[0]?.id;
              const currentBoarding = room.boardings.find((b) => b.id === currentBoardingId) || room.boardings[0];

              const currentPrice = currentBoarding ? currentBoarding.price : hotel.price;
              const discount = currentBoarding?.discountPercent ?? room.discountPercent;
              const oldPrice = currentBoarding?.originalPrice ?? room.originalPrice;

              return (
                <div
                  key={room.id}
                  onClick={() => setSelectedRoomIndex(roomIdx)}
                  className={`px-4 py-3.5 grid grid-cols-12 gap-2 items-center transition-colors cursor-pointer ${
                    isSelected ? 'bg-sky-50/40' : 'hover:bg-navy-900/[0.015]'
                  }`}
                >
                  {/* Column 1: Selection checkbox + Room Title + Availability */}
                  <div className="col-span-4 sm:col-span-4 flex items-center gap-2.5">
                    <input
                      type="radio"
                      name={`room-selection-${hotel.id}`}
                      checked={isSelected}
                      onChange={() => setSelectedRoomIndex(roomIdx)}
                      className="w-4 h-4 text-sky-600 focus:ring-sky-500 border-ink-300 cursor-pointer"
                    />
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-semibold text-navy-900">
                        {room.name}
                      </span>
                      {room.available ? (
                        <span className="bg-[#10b981] text-white text-[10px] font-bold px-1.5 py-0.5 rounded leading-tight">
                          Disponible
                        </span>
                      ) : (
                        <span className="bg-[#f59e0b] text-white text-[10px] font-bold px-1.5 py-0.5 rounded leading-tight">
                          Sur demande
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Column 2: Occupation Icon */}
                  <div className="col-span-2 sm:col-span-2 flex justify-center">
                    <div className="flex items-center text-ink-700">
                      <Users size={16} />
                    </div>
                  </div>

                  {/* Column 3: Type de pension Dropdown */}
                  <div className="col-span-3 sm:col-span-3" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={currentBoardingId}
                      onChange={(e) => handleBoardingChange(room.id, e.target.value, roomIdx)}
                      className="w-full text-xs font-medium text-navy-900 bg-white border border-ink-900/15 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer shadow-2xs"
                    >
                      {room.boardings.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Column 4: Price on the Right adapting to selected boarding */}
                  <div className="col-span-3 sm:col-span-3 text-right flex flex-col items-end">
                    {/* Discount Pill & Crossed-out price */}
                    {discount && oldPrice ? (
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="bg-[#dc2626] text-white text-[10px] font-bold px-1.5 py-0.2 rounded">
                          -{discount.toFixed(2)}%
                        </span>
                        <span className="text-[11px] text-ink-400 line-through">
                          {Math.round(oldPrice)} DZD
                        </span>
                      </div>
                    ) : null}

                    {/* Main Price on the right */}
                    <div className="text-sm sm:text-base font-bold text-navy-900 font-display">
                      {currentPrice.toFixed(2)}{' '}
                      <span className="text-xs font-semibold text-ink-700">DZD</span>
                    </div>

                    {/* Frais d'annulation Link */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenCancellation(room.cancellationPolicy);
                      }}
                      className="text-[#0d9488] hover:text-[#0f766e] text-[11px] font-medium underline mt-0.5 cursor-pointer transition-colors"
                    >
                      Frais d'annulation
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Card Summary Bar */}
          <div className="border-t border-ink-900/10 px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 bg-navy-900/[0.01]">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold text-navy-900">
                Montant total du séjour :
              </span>
              <span className="font-display font-bold text-xl text-navy-900">
                {Math.round(currentTotalPrice).toLocaleString()} {hotel.currency || 'DZD'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleBookNow}
              className="bg-[#f97316] hover:bg-[#ea580c] text-white font-bold text-sm px-7 py-2.5 rounded-lg shadow-sm transition-all hover:shadow-md cursor-pointer"
            >
              Réserver
            </button>
          </div>
        </div>
      )}

      {/* Cancellation Policy Modal */}
      {cancellationModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative animate-scale-in">
            <button
              type="button"
              onClick={() => setCancellationModalOpen(false)}
              className="absolute top-4 right-4 text-ink-400 hover:text-ink-700 p-1 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 mb-3 text-navy-900">
              <Info size={20} className="text-[#0d9488]" />
              <h4 className="font-display font-bold text-lg">Frais d'annulation</h4>
            </div>

            <div className="bg-navy-900/[0.03] p-4 rounded-xl text-sm text-ink-700 leading-relaxed my-4">
              <p className="font-medium text-navy-900 mb-1">{hotel.name}</p>
              <p>{activeCancellationPolicy}</p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setCancellationModalOpen(false)}
                className="bg-navy-900 hover:bg-navy-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
