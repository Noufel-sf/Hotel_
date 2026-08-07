import { useMemo } from 'react';
import { SlidersHorizontal, RotateCcw, Star } from 'lucide-react';
import { Hotel, AdvancedFilterState } from '../types';

interface FilterSidebarProps {
  hotels: Hotel[];
  filters: AdvancedFilterState;
  onFilterChange: (filters: AdvancedFilterState) => void;
  onReset: () => void;
}

export default function FilterSidebar({
  hotels,
  filters,
  onFilterChange,
  onReset,
}: FilterSidebarProps) {
  // Compute dynamic counts for each filter option based on current searched hotels
  const counts = useMemo(() => {
    const res = {
      promos: 0,
      freeChild: 0,
      available: 0,
      freeCancellation: 0,
      arrangements: {} as Record<string, number>,
      categories: {} as Record<number, number>,
      roomTypes: {} as Record<string, number>,
      services: {} as Record<string, number>,
    };

    hotels.forEach((h) => {
      if (h.isPromo) res.promos++;
      if (h.freeChild) res.freeChild++;
      if (h.availability === 'Available Directly') res.available++;
      if (h.hasFreeCancellation) res.freeCancellation++;

      // Arrangements (Meal plan)
      const mp = h.mealPlan || 'Demi Pension';
      res.arrangements[mp] = (res.arrangements[mp] || 0) + 1;

      // Category / Stars
      res.categories[h.stars] = (res.categories[h.stars] || 0) + 1;

      // Room Types
      const rt = h.roomType || 'Chambre Double';
      res.roomTypes[rt] = (res.roomTypes[rt] || 0) + 1;

      // Services
      if (Array.isArray(h.services)) {
        h.services.forEach((s) => {
          res.services[s] = (res.services[s] || 0) + 1;
        });
      }
    });

    return res;
  }, [hotels]);

  // Compute price bounds
  const priceBounds = useMemo(() => {
    if (hotels.length === 0) return { min: 0, max: 1000 };
    const prices = hotels.map((h) => h.price);
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
    };
  }, [hotels]);

  const toggleArrayItem = (list: string[], item: string) => {
    return list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
  };

  const toggleCategoryItem = (list: number[], item: number) => {
    return list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
  };

  const arrangementOptions = [
    'Logement Simple',
    'Logement Petit Déjeuner',
    'Demi Pension',
    'Soft All Inclusive',
    'Pension Complète',
    'DP+',
    'All Inclusive',
    'All Inclusive GOLD',
  ];

  const roomTypeOptions = [
    'Appartement S+0',
    'Appartement S+1',
    'appartement S+2',
    'Chambre Double',
    'Suite',
  ];

  const serviceOptions = [
    'Famille',
    'Thalasso & Spa',
    'Petit Prix',
    'Bord de Mer',
    'Sport & Loisir',
    'Romance',
    'Luxe',
    'Affaires',
    'Mini Club',
    'Club',
    'Toboggan',
  ];

  return (
    <aside className="w-full bg-white rounded-2xl border border-ink-900/10 shadow-soft p-5 text-ink-900 space-y-6">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between pb-3 border-b border-ink-900/5">
        <div className="flex items-center gap-2 font-bold text-lg">
          <SlidersHorizontal size={20} className="stroke-[2.5]" />
          <span className='text-sm font-bold uppercase tracking-wider text-navy-900'>Filtrer</span>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-semibold text-ink-400 hover:text-rose-600 transition-colors flex items-center gap-1"
        >
          <RotateCcw size={12} />
          Réinitialiser
        </button>
      </div>

      {/* SECTION 1: TARIFS ET DISPONIBILITÉS */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900">
          Tarifs et disponibilités
        </h3>
        <div className="space-y-2.5">
          <label className="flex items-center justify-between text-sm cursor-pointer group">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={filters.promosOnly}
                onChange={(e) => onFilterChange({ ...filters, promosOnly: e.target.checked })}
                className="w-4 h-4 rounded border-ink-300 text-sky-500 focus:ring-sky-400"
              />
              <span className="text-ink-700 group-hover:text-navy-900 transition-colors">
                Tarifs en promotion
              </span>
            </div>
            <span className="text-xs text-ink-400 font-mono">({counts.promos})</span>
          </label>

          <label className="flex items-center justify-between text-sm cursor-pointer group">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={filters.freeChildOnly}
                onChange={(e) => onFilterChange({ ...filters, freeChildOnly: e.target.checked })}
                className="w-4 h-4 rounded border-ink-300 text-sky-500 focus:ring-sky-400"
              />
              <span className="text-ink-700 group-hover:text-navy-900 transition-colors">
                Enfant gratuit
              </span>
            </div>
            <span className="text-xs text-ink-400 font-mono">({counts.freeChild})</span>
          </label>

          <label className="flex items-center justify-between text-sm cursor-pointer group">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={filters.availableOnly}
                onChange={(e) => onFilterChange({ ...filters, availableOnly: e.target.checked })}
                className="w-4 h-4 rounded border-ink-300 text-sky-500 focus:ring-sky-400"
              />
              <span className="text-ink-700 group-hover:text-navy-900 transition-colors">
                Disponible seulement
              </span>
            </div>
            <span className="text-xs text-ink-400 font-mono">({counts.available})</span>
          </label>

          <label className="flex items-center justify-between text-sm cursor-pointer group">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={filters.freeCancellationOnly}
                onChange={(e) =>
                  onFilterChange({ ...filters, freeCancellationOnly: e.target.checked })
                }
                className="w-4 h-4 rounded border-ink-300 text-sky-500 focus:ring-sky-400"
              />
              <span className="text-ink-700 group-hover:text-navy-900 transition-colors">
                Annulation gratuite
              </span>
            </div>
            <span className="text-xs text-ink-400 font-mono">({counts.freeCancellation})</span>
          </label>
        </div>
      </div>

      <hr className="border-ink-900/5" />

      {/* SECTION 2: ARRANGEMENTS */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900">Arrangements</h3>
        <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
          {arrangementOptions.map((option) => {
            const count = counts.arrangements[option] || 0;
            const checked = filters.arrangements.includes(option);
            return (
              <label key={option} className="flex items-center justify-between text-sm cursor-pointer group">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      onFilterChange({
                        ...filters,
                        arrangements: toggleArrayItem(filters.arrangements, option),
                      })
                    }
                    className="w-4 h-4 rounded border-ink-300 text-sky-500 focus:ring-sky-400"
                  />
                  <span className="text-ink-700 group-hover:text-navy-900 transition-colors">
                    {option}
                  </span>
                </div>
                <span className="text-xs text-ink-400 font-mono">({count})</span>
              </label>
            );
          })}
        </div>
      </div>

      <hr className="border-ink-900/5" />

      {/* SECTION 3: CATÉGORIE */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900">Catégorie</h3>
        <div className="space-y-2.5">
          {[5, 4, 3].map((star) => {
            const count = counts.categories[star] || 0;
            const checked = filters.categories.includes(star);
            return (
              <label key={star} className="flex items-center justify-between text-sm cursor-pointer group">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      onFilterChange({
                        ...filters,
                        categories: toggleCategoryItem(filters.categories, star),
                      })
                    }
                    className="w-4 h-4 rounded border-ink-300 text-sky-500 focus:ring-sky-400"
                  />
                  <div className="flex items-center gap-0.5 text-gold-400">
                    {Array.from({ length: star }).map((_, i) => (
                      <Star key={i} size={14} className="fill-gold-400" />
                    ))}
                  </div>
                </div>
                <span className="text-xs text-ink-400 font-mono">({count})</span>
              </label>
            );
          })}
        </div>
      </div>

      <hr className="border-ink-900/5" />

      {/* SECTION 4: BUDGET (PRICE SLIDER) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900">Budget</h3>
          <span className="text-xs font-semibold text-green-600 bg-sky-50 px-2 py-0.5 rounded">
            {filters.minPrice || priceBounds.min} DZD - {filters.maxPrice || priceBounds.max} DZD
          </span>
        </div>
        <div className="pt-2">
          <input
            type="range"
            min={priceBounds.min}
            max={priceBounds.max}
            value={filters.maxPrice || priceBounds.max}
            onChange={(e) => onFilterChange({ ...filters, maxPrice: Number(e.target.value) })}
            className="w-full h-1.5 bg-ink-100 rounded-lg appearance-none cursor-pointer accent-sky-500"
          />
          <div className="flex items-center justify-between text-[11px] text-ink-400 mt-1 font-mono">
            <span>{priceBounds.min} DZD</span>
            <span>{priceBounds.max} DZD</span>
          </div>
        </div>
      </div>

      <hr className="border-ink-900/5" />

      {/* SECTION 5: TYPE DE CHAMBRES */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900">Type de chambres</h3>
        <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
          {roomTypeOptions.map((option) => {
            const count = counts.roomTypes[option] || 0;
            const checked = filters.roomTypes.includes(option);
            return (
              <label key={option} className="flex items-center justify-between text-sm cursor-pointer group">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      onFilterChange({
                        ...filters,
                        roomTypes: toggleArrayItem(filters.roomTypes, option),
                      })
                    }
                    className="w-4 h-4 rounded border-ink-300 text-sky-500 focus:ring-sky-400"
                  />
                  <span className="text-ink-700 group-hover:text-navy-900 transition-colors">
                    {option}
                  </span>
                </div>
                <span className="text-xs text-ink-400 font-mono">({count})</span>
              </label>
            );
          })}
        </div>
      </div>

      <hr className="border-ink-900/5" />

      {/* SECTION 6: SERVICE */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900">Service</h3>
        <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
          {serviceOptions.map((option) => {
            const count = counts.services[option] || 0;
            const checked = filters.services.includes(option);
            return (
              <label key={option} className="flex items-center justify-between text-sm cursor-pointer group">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      onFilterChange({
                        ...filters,
                        services: toggleArrayItem(filters.services, option),
                      })
                    }
                    className="w-4 h-4 rounded border-ink-300 text-sky-500 focus:ring-sky-400"
                  />
                  <span className="text-ink-700 group-hover:text-navy-900 transition-colors">
                    {option}
                  </span>
                </div>
                <span className="text-xs text-ink-400 font-mono">({count})</span>
              </label>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
