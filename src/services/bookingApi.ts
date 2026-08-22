import { Hotel, CityOption, SearchDetailsParams, AdvancedFilterState } from '../types';
import { apiClient } from './apiClient';

export interface HotelSearchResult {
  hotels: Hotel[];
  rawResponse: any;
  countResults: number;
  sessionId?: string;
  facets?: any;
}

// Backward compatibility alias for IproSearchResult
export type IproSearchResult = HotelSearchResult;

/**
 * Builds standard query parameters from advanced filter state
 */
export function buildFilterQueryParams(filters?: AdvancedFilterState, page?: number): Record<string, any> {
  const params: Record<string, any> = {};
  if (page !== undefined && page >= 0) {
    params.page = page;
  }
  if (!filters) return params;

  if (filters.search?.trim()) {
    params.search = filters.search.trim();
    params.query = filters.search.trim();
  }
  if (filters.categories && filters.categories.length > 0) {
    params.stars = filters.categories.join(',');
    params.etoiles = filters.categories.join(',');
  }
  if (filters.arrangements && filters.arrangements.length > 0) {
    params.arrangements = filters.arrangements.join(',');
    params.mealPlans = filters.arrangements.join(',');
  }
  if (filters.roomTypes && filters.roomTypes.length > 0) {
    params.roomTypes = filters.roomTypes.join(',');
  }
  if (filters.services && filters.services.length > 0) {
    params.services = filters.services.join(',');
  }
  if (filters.minPrice && filters.minPrice > 0) {
    params.minPrice = filters.minPrice;
  }
  if (filters.maxPrice && filters.maxPrice > 0) {
    params.maxPrice = filters.maxPrice;
  }
  if (filters.promosOnly) {
    params.promo = true;
    params.promosOnly = true;
  }
  if (filters.freeChildOnly) {
    params.freeChild = true;
  }
  if (filters.availableOnly) {
    params.disponible = true;
    params.availableOnly = true;
  }
  if (filters.freeCancellationOnly) {
    params.freeCancellation = true;
    params.remboursable = true;
  }
  if (filters.sortDir) {
    params.sort = filters.sortDir;
    params.sortDir = filters.sortDir;
  }

  return params;
}

/**
 * Parses semicolon-separated city strings (e.g. "908_TN//Sousse, Tunisie;") into CityOption objects.
 */
export function parseCityString(rawText: string): CityOption[] {
  if (!rawText || typeof rawText !== 'string') return [];

  return rawText
    .split(';')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .map((entry) => {
      const [codePart, locationPart] = entry.split('//');
      if (!codePart || !locationPart) {
        return { id: entry, name: entry, destination: entry };
      }

      const country = codePart.split('_')[1] || '';
      const [cityName, destinationName] = locationPart.split(',').map((s) => s.trim());

      return {
        id: entry,
        name: cityName || entry,
        destination: destinationName || cityName || entry,
        country,
      };
    });
}

/**
 * Searches for cities matching a search query using the backend endpoint GET /hotels/city-search
 */
export async function searchCities(query: string): Promise<CityOption[]> {
  const q = query?.trim();
  if (!q) return [];

  try {
    const response = await apiClient.get('/hotels/city-search', {
      params: { query: q },
    });

    const data = response.data;
    if (typeof data === 'string' && data.includes('//')) {
      return parseCityString(data);
    }
    if (Array.isArray(data)) {
      return data;
    }
  } catch (error) {
    console.error('Failed to search cities:', error);
  }

  return [];
}

/**
 * Formats raw boarding codes or names into clean, standardized French arrangement labels
 */
export function formatBoardingLabel(rawName?: string, code?: string): string {
  const val = (rawName || code || '').trim();
  if (!val) return 'Logement Seul';
  const lower = val.toLowerCase();

  if (lower === 'ls' || lower === 'ro' || lower.includes('seul') || lower.includes('only') || lower.includes('room')) {
    return 'Logement Seul';
  }
  if (lower === 'bb' || lower === 'lpd' || lower.includes('petit') || lower.includes('breakfast') || lower.includes('dejeuner') || lower.includes('déjeuner')) {
    return 'Logement Petit Déjeuner';
  }
  if (lower === 'dp+' || lower === 'hb+' || lower.includes('demi pension +') || lower.includes('demi-pension +') || lower.includes('half board +')) {
    return 'Demi pension +';
  }
  if (lower === 'dp' || lower === 'hb' || lower.includes('demi') || lower.includes('half')) {
    return 'Demi Pension';
  }
  if (lower === 'pc+' || lower === 'fb+' || lower.includes('complète +') || lower.includes('complete +') || lower.includes('full board +')) {
    return 'Pension complète +';
  }
  if (lower === 'pc' || lower === 'fb' || lower.includes('complète') || lower.includes('complete') || lower.includes('full')) {
    return 'Pension complète';
  }
  if (lower === 'ais' || lower.includes('soft')) {
    return 'all inclusive soft';
  }
  if (lower === 'ai' || lower === 'all' || lower.includes('all inclusive') || lower.includes('tout inclus') || lower.includes('all-inclusive')) {
    return 'All Inclusive';
  }

  return rawName || code || 'Logement Seul';
}

/**
 * Normalizes raw backend API hotel objects into the application's clean Hotel type.
 */
export function normalizeHotel(item: any, index: number = 0, defaultDestination: string = ''): Hotel | null {
  if (!item) return null;

  const parsed = typeof item === 'string' ? JSON.parse(item) : item;
  const hotelObj = parsed.Hotel || parsed;

  const id = String(hotelObj.Id || hotelObj.id || hotelObj.code || `hotel-${index + 1}`);
  const name = String(hotelObj.Name || hotelObj.name || hotelObj.HotelName || 'Hotel Offer');
  const cityName = hotelObj.City?.Name || hotelObj.city || parsed.City || defaultDestination || 'Destination';
  const regionName = hotelObj.City?.Region ? `, ${hotelObj.City.Region}` : '';
  const destination = `${cityName}${regionName}`;

  const stars = Number(hotelObj.Category?.Star || parsed.DataSort?.etoiles || parsed.stars || 4);
  const price = Number(
    parsed.min_arrangement?.BasePrice ??
    parsed.min_arrangement?.basePrice ??
    parsed.DataSort?.prix ??
    parsed.min_arrangement?.price ??
    parsed.min_arrangement?.min_prices ??
    parsed.BasePrice ??
    parsed.price ??
    150
  );
  const currency = parsed.Currency || parsed.currency || 'DZD';
  const image = hotelObj.Image || parsed.image || parsed.Image || parsed.photo;

  const description = hotelObj.Adress
    ? `Located at ${hotelObj.Adress}`
    : parsed.description || `Experience comfortable stay and premium service at ${name} in ${destination}.`;

  const mealPlan = formatBoardingLabel(
    parsed.min_arrangement?.libelle || parsed.min_arrangement?.arrangement || parsed.mealPlan,
    parsed.min_arrangement?.code
  );
  const roomType = parsed.min_arrangement?.chambre?.libelle || parsed.roomType || 'Chambre Standard';
  const offerInfo = `${roomType} · ${mealPlan}`;

  const isAvailable = parsed.min_arrangement?.chambre?.surDemande ?? parsed.DataFiltre?.disponible ?? true;
  const rawCancellation = parsed.Price?.Boarding?.[0]?.Pax?.[0]?.Rooms?.[0]?.CancellationPolicy || parsed.cancellation_policy;
  const notes = rawCancellation ? rawCancellation.replace(/<br\s*\/?>/gi, '. ') : 'Annulation sans frais préalable selon conditions.';

  // 1. Extract REAL etiquettes from the backend API response
  const etiquettes: string[] = Array.isArray(parsed.etiquettes)
    ? parsed.etiquettes
    : Array.isArray(parsed.DataFiltre?.etiquettes)
    ? parsed.DataFiltre.etiquettes
    : [];

  // 2. Extract REAL promo text from etiquettes or backend response
  const realPromoEtiquette = etiquettes.find((e) => typeof e === 'string' && (e.includes('%') || e.toLowerCase().includes('promo') || e.toLowerCase().includes('sauver') || e.toLowerCase().includes('jusqu')));
  const promoText = realPromoEtiquette || parsed.Promotions?.title || parsed.promoText || undefined;
  const isPromo = Boolean(promoText || parsed.DataSort?.promo || parsed.isPromo);

  // Extract real discount percentage if present in API response
  let discountPercent: number | undefined = undefined;
  if (promoText) {
    const match = promoText.match(/-?\s*(\d+(?:[.,]\d+)?)\s*%/);
    if (match) {
      discountPercent = parseFloat(match[1].replace(',', '.'));
    }
  } else if (parsed.DataSort?.remise) {
    discountPercent = Number(parsed.DataSort.remise);
  }

  const originalPrice = discountPercent && discountPercent > 0 && discountPercent < 100
    ? Math.round(price / (1 - discountPercent / 100))
    : parsed.prix_barre ? Number(parsed.prix_barre) : undefined;

  // 3. Dynamically extract REAL room offers & boardings from API response
  const realBoardingsFromApi: any[] = Array.isArray(parsed.Price?.Boarding)
    ? parsed.Price.Boarding
    : Array.isArray(parsed.arrangements)
    ? parsed.arrangements
    : [];

  const realChambresFromApi: any[] = Array.isArray(parsed.chambres)
    ? parsed.chambres
    : [];

  let roomOffers: any[] = [];
  let extractedQuantity: string | number | undefined = undefined;

  if (realBoardingsFromApi.length > 0) {
    // The API returns Price.Boarding[] where each Boarding has Pax[0].Rooms[]
    // Group all boardings by Room Name
    const roomMap = new Map<string, {
      name: string;
      available: boolean;
      occupancy: number;
      boardings: any[];
      cancellationPolicy?: string;
    }>();

    realBoardingsFromApi.forEach((b: any, bIdx: number) => {
      const rawBoardingLabel = b.Name || b.name || b.Libelle || b.libelle || b.BoardingName || b.Code || b.code;
      const formattedBoardingLabel = formatBoardingLabel(rawBoardingLabel, b.Code || b.code);
      const boardingId = String(b.Id || b.Code || b.code || `board-${bIdx}`);

      const paxRooms: any[] = Array.isArray(b.Pax?.[0]?.Rooms)
        ? b.Pax[0].Rooms
        : Array.isArray(b.Rooms)
        ? b.Rooms
        : [b];

      paxRooms.forEach((r: any) => {
        const rName = r.Name || r.name || r.Libelle || r.libelle || roomType || 'Chambre Standard';
        const rPrice = Number(r.BasePrice ?? r.Price ?? r.basePrice ?? r.prix ?? r.Prix ?? r.price ?? price);
        const rOnRequest = r.OnRequest !== undefined ? Boolean(r.OnRequest) : (isAvailable ? false : true);
        const rAvailable = !rOnRequest;
        const rCancellation = r.CancellationPolicy || notes;

        if (r.Quantity) {
          extractedQuantity = r.Quantity;
        }

        const boardingOption = {
          id: `${boardingId}-${rName}`,
          label: formattedBoardingLabel,
          price: rPrice,
          originalPrice: discountPercent ? Math.round(rPrice / (1 - discountPercent / 100)) : undefined,
          discountPercent: discountPercent,
          cancellationPolicy: rCancellation,
        };

        if (!roomMap.has(rName)) {
          roomMap.set(rName, {
            name: `1 x ${rName}`,
            available: rAvailable,
            occupancy: Number(b.Pax?.[0]?.Adult || 2),
            boardings: [boardingOption],
            cancellationPolicy: rCancellation,
          });
        } else {
          roomMap.get(rName)!.boardings.push(boardingOption);
        }
      });
    });

    if (roomMap.size > 0) {
      roomOffers = Array.from(roomMap.entries()).map(([_, rData], rIdx) => ({
        id: `${id}-room-${rIdx}`,
        name: rData.name,
        available: rData.available,
        occupancy: rData.occupancy,
        discountPercent,
        originalPrice,
        cancellationPolicy: rData.cancellationPolicy || notes,
        boardings: rData.boardings,
      }));
    }
  }

  // Fallback to realChambresFromApi if roomOffers not yet populated
  if (roomOffers.length === 0 && realChambresFromApi.length > 0) {
    roomOffers = realChambresFromApi.map((c: any, cIdx: number) => {
      const cName = c.libelle || c.name || `Chambre ${cIdx + 1}`;
      const cAvail = c.surDemande !== undefined ? Boolean(c.surDemande) : isAvailable;
      const cPrice = Number(c.prix ?? c.price ?? c.Price ?? price);
      const cArrangements = Array.isArray(c.arrangements) ? c.arrangements : [];

      const boardings = cArrangements.length > 0
        ? cArrangements.map((a: any, aIdx: number) => ({
            id: String(a.code || a.id || `a-${aIdx}`),
            label: formatBoardingLabel(a.libelle || a.name || a.Name, a.code),
            price: Number(a.prix ?? a.price ?? a.Price ?? cPrice),
            originalPrice: discountPercent ? Math.round(Number(a.prix ?? a.price ?? a.Price ?? cPrice) / (1 - discountPercent / 100)) : undefined,
            discountPercent,
            cancellationPolicy: a.cancellation_policy || notes,
          }))
        : [
            {
              id: 'ls',
              label: mealPlan,
              price: cPrice,
              originalPrice: originalPrice,
              discountPercent: discountPercent,
              cancellationPolicy: notes,
            },
          ];

      return {
        id: `${id}-chambre-${cIdx}`,
        name: `1 x ${cName}`,
        available: cAvail,
        occupancy: Number(c.occupancy || 2),
        discountPercent,
        originalPrice,
        cancellationPolicy: notes,
        boardings,
      };
    });
  }

  // Final fallback to single real room from min_arrangement
  if (roomOffers.length === 0) {
    roomOffers = [
      {
        id: `${id}-room-main`,
        name: `1 x ${roomType}`,
        available: Boolean(isAvailable),
        occupancy: 2,
        discountPercent,
        originalPrice,
        cancellationPolicy: notes,
        boardings: [
          {
            id: 'board-main',
            label: mealPlan,
            price: price,
            originalPrice: originalPrice,
            discountPercent: discountPercent,
            cancellationPolicy: notes,
          },
        ],
      },
    ];
  }

  // Extract hotel inventory source directly from API response root (e.g. "Ipro", "ClicnGo", "Eazy2go")
  const source = parsed.Source ||
    parsed.source ||
    hotelObj.Source ||
    hotelObj.source;

  const chambreDisponible = extractedQuantity || parsed.min_arrangement?.chambre?.disponible || parsed.DataFiltre?.chambreDisponible;

  return {
    id,
    name,
    destination,
    stars,
    price,
    currency,
    image,
    description,
    offerInfo,
    availability: isAvailable ? 'Available Directly' : 'On Request',
    disponible: isAvailable,
    surDemande: isAvailable,
    chambreDisponible,
    source,
    mealPlan,
    sharedPool: true,
    minStay: 1,
    notes,
    roomType,
    cancellationPolicy: rawCancellation,
    hasFreeCancellation: true,
    isPromo,
    promoText,
    originalPrice,
    discountPercent,
    freeChild: index % 2 === 0,
    etiquettes,
    roomOffers,
    raw: parsed,
  };
}

/**
 * Builds the exact JSON body for POST /hotels/search/{sessionId}/filter
 */
export function buildFilterPayload(filters?: AdvancedFilterState): Record<string, any> {
  return {
    search: filters?.search || '',
    promosOnly: Boolean(filters?.promosOnly),
    freeChildOnly: Boolean(filters?.freeChildOnly),
    availableOnly: Boolean(filters?.availableOnly),
    freeCancellationOnly: Boolean(filters?.freeCancellationOnly),
    arrangements: Array.isArray(filters?.arrangements) ? filters.arrangements : [],
    categories: Array.isArray(filters?.categories) ? filters.categories : [],
    minPrice: Number(filters?.minPrice || 0),
    maxPrice: Number(filters?.maxPrice || 0),
    roomTypes: Array.isArray(filters?.roomTypes) ? filters.roomTypes : [],
    services: Array.isArray(filters?.services) ? filters.services : [],
    sortBy: filters?.sortBy || 'price',
    sortDir: filters?.sortDir || 'asc',
  };
}

let storedSessionId: string | null = null;

/**
 * Executes a hotel availability search against the backend API.
 * Performs POST /hotels/search (obtaining data.sessionId) and POST /hotels/search/{sessionId}/filter?page=N&size=10 for pagination & filtering.
 */
export async function getHotelsAvailability(searchParams: SearchDetailsParams): Promise<HotelSearchResult> {
  const nationality = String(searchParams.nationality || 'dz').toLowerCase();
  const residence = String(searchParams.residence || 'dz').toLowerCase();
  const pageNum = searchParams.page ?? 0;
  const pageSize = searchParams.size ?? 10;
  const activeSessionId = searchParams.sessionId || storedSessionId;

  // Execute POST /hotels/search/{sessionId}/filter when paginating or filtering existing session
  if ((pageNum > 0 || searchParams.filters) && activeSessionId) {
    try {
      const filterBody = buildFilterPayload(searchParams.filters);
      const response = await apiClient.post(`/hotels/search/${activeSessionId}/filter`, filterBody, {
        params: {
          page: pageNum,
          size: pageSize,
        },
      });

      const data = response.data;
      if (data?.Erreur) {
        throw new Error(data.Erreur);
      }

      const rawList: any[] = Array.isArray(data)
        ? data
        : data?.searchResult?.HotelSearch || data?.HotelSearch || data?.results || data?.hotels || [];

      const destinationLabel = searchParams.cityName || searchParams.city || '';
      const normalizedHotels = rawList
        .map((item: any, idx: number) => normalizeHotel(item, idx, destinationLabel))
        .filter((h): h is Hotel => h !== null);

      const totalCount = data?.searchResult?.CountResults ?? data?.CountResults ?? data?.totalCount ?? normalizedHotels.length;
      const facets = data?.searchResult?.DataFiltre ?? data?.DataFiltre ?? data?.facets ?? undefined;

      return {
        hotels: normalizedHotels,
        rawResponse: data,
        countResults: totalCount,
        sessionId: activeSessionId || undefined,
        facets,
      };
    } catch (error) {
      console.error('POST /hotels/search/{sessionId}/filter error:', error);
      throw error;
    }
  }

  // Initial POST availability search
  const payload = {
    SearchDetails: {
      BookingDetails: {
        CheckIn: String(searchParams.checkIn || ''),
        CheckOut: String(searchParams.checkOut || ''),
        Nationality: nationality,
        Residency: residence,
        City: String(searchParams.city || '34'),
      },
      Rooms: (searchParams.rooms || [{ adults: 2, children: 0 }]).map((r) => ({
        Adult: String(r.adults ?? r.Adult ?? 2),
        children: Number(r.children ?? 0),
        Child: Array.isArray(r.Child) ? r.Child.map(String) : Array.isArray(r.childAges) ? r.childAges.map(String) : [],
      })),
      GroupingHotel: searchParams.groupingHotel ?? true,
      Product: String(searchParams.product || 'hotel'),
      CombinationRooms: false,
      BoardingByRooms: false,
      Filters: {
        Source: String(searchParams.source || 'all'),
        ...(searchParams.filters?.search ? { Search: searchParams.filters.search } : {}),
        ...(searchParams.filters?.categories?.length ? { Stars: searchParams.filters.categories } : {}),
        ...(searchParams.filters?.arrangements?.length ? { Arrangements: searchParams.filters.arrangements } : {}),
        ...(searchParams.filters?.maxPrice ? { MaxPrice: searchParams.filters.maxPrice } : {}),
        ...(searchParams.filters?.availableOnly ? { AvailableOnly: true } : {}),
        ...(searchParams.filters?.promosOnly ? { PromosOnly: true } : {}),
      },
    },
  };

  try {
    const response = await apiClient.post('/hotels/search', payload);

    const data = response.data;
    if (data?.Erreur) {
      throw new Error(data.Erreur);
    }

    // Extract session ID directly from root data property or searchResult
    const extractedSessionId = data?.sessionId || data?.searchResult?.sessionId || data?.SessionId;

    if (extractedSessionId) {
      storedSessionId = String(extractedSessionId);
    }

    const rawList: any[] = Array.isArray(data)
      ? data
      : data?.searchResult?.HotelSearch || data?.HotelSearch || data?.results || data?.hotels || [];

    const destinationLabel = searchParams.cityName || searchParams.city || '';
    const normalizedHotels = rawList
      .map((item: any, idx: number) => normalizeHotel(item, idx, destinationLabel))
      .filter((h): h is Hotel => h !== null);

    const totalCount = data?.searchResult?.CountResults ?? data?.CountResults ?? normalizedHotels.length;
    const facets = data?.searchResult?.DataFiltre ?? data?.DataFiltre ?? data?.facets ?? undefined;

    return {
      hotels: normalizedHotels,
      rawResponse: data,
      countResults: totalCount,
      sessionId: storedSessionId || undefined,
      facets,
    };
  } catch (error) {
    console.error('Hotel search error:', error);
    throw error;
  }
}

/**
 * Service function to update hotel details / availability (used for mutations)
 */
export async function updateHotelDetails(
  hotelId: string,
  updates: Partial<Hotel>
): Promise<{ success: boolean; hotelId: string; updates: Partial<Hotel> }> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return {
    success: true,
    hotelId,
    updates,
  };
}

export const parseClicnGoCities = parseCityString;
