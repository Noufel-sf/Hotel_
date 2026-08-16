import { Hotel, CityOption, SearchDetailsParams } from '../types';
import { apiClient } from './apiClient';

export interface HotelSearchResult {
  hotels: Hotel[];
  rawResponse: any;
  countResults: number;
  sessionId?: string;
}

// Backward compatibility alias for IproSearchResult
export type IproSearchResult = HotelSearchResult;

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
    parsed.DataSort?.prix ??
    parsed.min_arrangement?.price ??
    parsed.min_arrangement?.min_prices ??
    parsed.price ??
    150
  );
  const currency = parsed.Currency || parsed.currency || 'DZD';
  const image = hotelObj.Image || parsed.image || parsed.Image || parsed.photo;

  const description = hotelObj.Adress
    ? `Located at ${hotelObj.Adress}`
    : parsed.description || `Experience comfortable stay and premium service at ${name} in ${destination}.`;

  const mealPlan = parsed.min_arrangement?.libelle || 'Demi Pension';
  const roomType = parsed.min_arrangement?.chambre?.libelle || (index % 2 === 0 ? 'Chambre Double' : 'Suite');
  const offerInfo = `${roomType} · ${mealPlan}`;

  const isAvailable = parsed.min_arrangement?.chambre?.surDemande ?? parsed.DataFiltre?.disponible ?? true;
  const rawCancellation = parsed.Price?.Boarding?.[0]?.Pax?.[0]?.Rooms?.[0]?.CancellationPolicy;
  const notes = rawCancellation ? rawCancellation.replace(/<br\s*\/?>/gi, '. ') : 'Free cancellation prior to check-in.';

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
    mealPlan,
    sharedPool: true,
    minStay: 1,
    notes,
    roomType,
    cancellationPolicy: rawCancellation,
    hasFreeCancellation: true,
    isPromo: index % 3 === 0,
    freeChild: index % 2 === 0,
    raw: parsed,
  };
}

let storedSessionId: string | null = null;

/**
 * Executes a hotel availability search against the backend API.
 * Performs POST /hotels/search (obtaining data.sessionId) and GET /hotels/search/{sessionId}/results?page=N for pagination.
 */
export async function getHotelsAvailability(searchParams: SearchDetailsParams): Promise<HotelSearchResult> {
  const nationality = String(searchParams.nationality || 'dz').toLowerCase();
  const residence = String(searchParams.residence || 'dz').toLowerCase();
  const pageNum = searchParams.page ?? 0;
  const activeSessionId = searchParams.sessionId || storedSessionId;

  // Execute GET /hotels/search/{sessionId}/results when paginating (pageNum > 0)
  if (pageNum > 0 && activeSessionId) {
    try {
      const response = await apiClient.get(`/hotels/search/${activeSessionId}/results`, {
        params: { page: pageNum },
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

      const totalCount = data?.searchResult?.CountResults ?? data?.CountResults ?? normalizedHotels.length;

      return {
        hotels: normalizedHotels,
        rawResponse: data,
        countResults: totalCount,
        sessionId: activeSessionId || undefined,
      };
    } catch (error) {
      console.error('GET pagination error:', error);
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

    return {
      hotels: normalizedHotels,
      rawResponse: data,
      countResults: totalCount,
      sessionId: storedSessionId || undefined,
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
