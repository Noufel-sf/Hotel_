import { Star, MapPin, Info, Tag } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { Hotel } from '../types';

interface HotelCardProps {
  hotel: Hotel;
  onOrder: (hotel: Hotel) => void;
}

export default function HotelCard({ hotel, onOrder }: HotelCardProps) {
  return (
    <div className="bg-white rounded-2xl cursor-pointer shadow-soft hover:shadow-card transition-shadow overflow-hidden flex flex-col">
      <div className="h-44 overflow-hidden relative">
        <img
          src={hotel.image}
          alt={hotel.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur px-2.5 py-1 rounded-full flex items-center gap-1 text-xs font-semibold text-navy-900 shadow-sm">
          <Star size={12} className="fill-gold-400 text-gold-400" />
          {hotel.stars}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg text-navy-900 leading-tight">{hotel.name}</h3>
        </div>

        <p className="flex items-center gap-1 text-xs text-ink-500 mt-1.5">
          <MapPin size={12} /> {hotel.destination}
        </p>

        <p className="text-sm text-ink-700 mt-3 leading-relaxed line-clamp-2">{hotel.description}</p>

        <div className="flex items-start gap-1.5 mt-3 text-xs text-ink-500 bg-navy-900/[0.03] rounded-lg px-2.5 py-2">
          <Info size={13} className="mt-0.5 shrink-0" />
          <span>{hotel.offerInfo}</span>
        </div>

        {/* Real Etiquettes Badges from Response Object (if present) */}
        {Array.isArray(hotel.etiquettes) && hotel.etiquettes.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            {hotel.etiquettes.map((badge, idx) => {
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
                  className={`inline-flex items-center gap-1 border text-[11px] font-bold px-2.5 py-1 rounded-md shadow-xs ${badgeStyle}`}
                >
                  <Tag size={10} className="shrink-0 opacity-80" />
                  {badge}
                </span>
              );
            })}
          </div>
        )}

        <div className="mt-auto pt-4 flex items-end justify-between">
          <div>
            <p className="text-[11px] text-ink-500 uppercase tracking-wide">From</p>
            <p className="font-display text-2xl text-navy-900">
              {formatCurrency(hotel.price, hotel.currency)}
              <span className="text-xs font-body text-ink-500 font-normal"> / room</span>
            </p>
          </div>
          <button
            onClick={() => onOrder(hotel)}
            className="bg-navy-900 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-navy-800 transition-colors"
          >
            Order
          </button>
        </div>
      </div>
    </div>
  );
}
