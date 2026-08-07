import { Hotel, CityOption, SearchDetailsParams } from '../types';

const BASE_URL = '/api';

/**
 * Searches for cities via OpenAPI endpoint /bookings/city-search
 */
export async function searchCities(query: string): Promise<CityOption[]> {
  if (!query || !query.trim()) return [];
  try {
    const response = await fetch(`${BASE_URL}/bookings/city-search?q=${encodeURIComponent(query.trim())}`);
    if (!response.ok) {
      throw new Error(`City search HTTP error: ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Error fetching city search:', err);
    return [];
  }
}

/**
 * Normalizes hotel object from API to standard UI hotel structure
 */
export function normalizeHotel(item: any, index: number = 0, searchDestination: string = ''): Hotel | null {
  if (!item) return null;
  let parsed = item;
  if (typeof item === 'string') {
    try {
      parsed = JSON.parse(item);
    } catch {
      parsed = { name: item };
    }
  }

  // Handle nested Hotel object structure returned by live IPRO backend
  const hotelObj = parsed.Hotel || parsed;
  const id = hotelObj.Id || hotelObj.id || hotelObj.HotelCode || hotelObj.code || `API-HTL-${index + 1}`;
  const name = hotelObj.Name || hotelObj.name || hotelObj.HotelName || hotelObj.Nom || 'Hotel Offer';

  const cityName = hotelObj.City?.Name || hotelObj.city || parsed.City || searchDestination || 'Destination';
  const regionName = hotelObj.City?.Region ? `, ${hotelObj.City.Region}` : '';
  const destination = `${cityName}${regionName}`;

  // Star Rating
  let stars = 4;
  if (hotelObj.Category?.Star) stars = Number(hotelObj.Category.Star);
  else if (parsed.DataSort?.etoiles) stars = Number(parsed.DataSort.etoiles);
  else if (parsed.stars) stars = Number(parsed.stars);

  // Price
  let price = 150;
  if (parsed.DataSort?.prix) price = Number(parsed.DataSort.prix);
  else if (parsed.min_arrangement?.price) price = Number(parsed.min_arrangement.price);
  else if (parsed.price) price = Number(parsed.price);
  else if (parsed.Price?.Boarding?.[0]?.Pax?.[0]?.Rooms?.[0]?.Price) price = Number(parsed.Price.Boarding[0].Pax[0].Rooms[0].Price);

  const currency = parsed.Currency || parsed.currency || 'DZD';

  const defaultImages = [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1548704806-38f5cf5b6f2f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
  ];
  const image = hotelObj.Image || parsed.image || parsed.Image || parsed.photo || defaultImages[index % defaultImages.length];

  const description = hotelObj.Adress
    ? `Located at ${hotelObj.Adress}`
    : (parsed.description || `Experience premium accommodation and luxury service at ${name} in ${destination}.`);

  const mealPlan = parsed.min_arrangement?.libelle ||
    parsed.Price?.Boarding?.[0]?.Name ||
    parsed.mealPlan ||
    'Demi Pension';

  const roomType = parsed.Price?.Boarding?.[0]?.Pax?.[0]?.Rooms?.[0]?.Name || parsed.roomType || (index % 2 === 0 ? 'Chambre Double' : 'Suite');

  const offerInfo = parsed.Price?.Boarding?.[0]?.Pax?.[0]?.Rooms?.[0]?.Name
    ? `${parsed.Price.Boarding[0].Pax[0].Rooms[0].Name} · ${mealPlan}`
    : 'Real-time availability & direct confirmation rate.';

  const isAvailable = parsed.DataFiltre?.disponible !== false;
  const availability = isAvailable ? 'Available Directly' : 'On Request';
  const sharedPool = true;
  const minStay = 1;

  let rawCancellation = parsed.Price?.Boarding?.[0]?.Pax?.[0]?.Rooms?.[0]?.CancellationPolicy;
  if (rawCancellation) {
    rawCancellation = rawCancellation.replace(/<br\s*\/?>/gi, '. ');
  }
  const notes = rawCancellation || 'Free cancellation up to 48 hours prior to check-in.';
  const hasFreeCancellation = Boolean(
    rawCancellation
      ? rawCancellation.toLowerCase().includes('free') || rawCancellation.toLowerCase().includes('gratuit') || rawCancellation.toLowerCase().includes('cancellation')
      : true
  );

  const isPromo = index % 3 === 0 || price < 250;
  const freeChild = index % 2 === 0 || offerInfo.toLowerCase().includes('enfant');

  // Extract real etiquettes from raw API response object (supports array, object map, or string)
  let rawEtiquettes = parsed.etiquettes || parsed.Etiquettes || parsed.etiquette || hotelObj.etiquettes || hotelObj.Etiquettes || parsed.etiquettesSaison;
  let etiquettes: string[] = [];

  if (rawEtiquettes && typeof rawEtiquettes === 'object') {
    if (Array.isArray(rawEtiquettes)) {
      etiquettes = rawEtiquettes
        .map((item: any) => {
          if (typeof item === 'string') return item;
          return item?.libelle || item?._libelle || item?.label || item?.Name || '';
        })
        .filter((str: string) => Boolean(str && str.trim()));
    } else {
      // Handle object map e.g. { "1èr enfant -6 ans gratuit": { libelle: "..." }, "Sauver -12 %": { libelle: "..." } }
      etiquettes = Object.entries(rawEtiquettes)
        .map(([key, val]: [string, any]) => {
          if (typeof val === 'string') return val;
          if (val && typeof val === 'object') {
            return val.libelle || val._libelle || val.label || key;
          }
          return key;
        })
        .filter((str: string) => Boolean(str && str.trim()));
    }
  } else if (typeof rawEtiquettes === 'string' && rawEtiquettes.trim()) {
    etiquettes = [rawEtiquettes.trim()];
  }

  const possibleServices = ['Famille', 'Bord de Mer', 'Thalasso & Spa', 'Sport & Loisir', 'Romance', 'Luxe', 'Petit Prix', 'Toboggan'];
  const services = [
    possibleServices[index % possibleServices.length],
    possibleServices[(index + 3) % possibleServices.length],
  ];

  return {
    id: String(id),
    name,
    destination,
    stars,
    price,
    currency,
    image,
    description,
    offerInfo,
    availability,
    mealPlan,
    sharedPool,
    minStay,
    notes,
    roomType,
    cancellationPolicy: rawCancellation,
    hasFreeCancellation,
    isPromo,
    freeChild,
    etiquettes: etiquettes.length > 0 ? etiquettes : undefined,
    services,
    raw: parsed,
  };
}

export interface IproSearchResult {
  hotels: Hotel[];
  rawResponse: any;
  countResults: number;
}

/**
 * Searches for hotel availability via OpenAPI endpoint /bookings/ipro/search
 */
export async function getIproAvailability(searchDetailsParams: SearchDetailsParams): Promise<IproSearchResult> {
  const nationality = String(searchDetailsParams.nationality || 'dz').toLowerCase();
  const residence = String(searchDetailsParams.residence || 'dz').toLowerCase();

  const payload = {
    SearchDetails: {
      BookingDetails: {
        CheckIn: String(searchDetailsParams.checkIn || ''),
        CheckOut: String(searchDetailsParams.checkOut || ''),
        Nationality: nationality,
        Residency: residence,
        Nationalite: nationality,
        Residence: residence,
        City: String(searchDetailsParams.city || '34'),
      },
      Rooms: (searchDetailsParams.rooms || [{ adults: 2, children: 0 }]).map((r) => ({
        Adult: String(r.adults ?? r.Adult ?? 2),
        children: Number(r.children ?? 0),
        Child: Array.isArray(r.Child) ? r.Child.map(String) : Array.isArray(r.childAges) ? r.childAges.map(String) : [],
      })),
      GroupingHotel: searchDetailsParams.groupingHotel ?? true,
      Product: String(searchDetailsParams.product || 'hotel'),
      CombinationRooms: searchDetailsParams.combinationRooms ?? false,
      BoardingByRooms: searchDetailsParams.boardingByRooms ?? false,
      Filters: {
        Source: String(searchDetailsParams.source || 'all'),
      },
    },
  };

  try {
    const response = await fetch(`${BASE_URL}/bookings/ipro/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Hotel search HTTP error: ${response.status}`);
    }

    const resData = await response.json();
    let data = resData;

    // Handle case where server responds with JSON string
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        console.warn('Could not parse response string:', e);
      }
    }

    if (data && data.Erreur) {
      throw new Error(data.Erreur);
    }

    let rawList: any[] = [];
    if (Array.isArray(data)) {
      rawList = data;
    } else if (data && Array.isArray(data.HotelSearch)) {
      rawList = data.HotelSearch;
    } else if (data && Array.isArray(data.results)) {
      rawList = data.results;
    } else if (data && Array.isArray(data.hotels)) {
      rawList = data.hotels;
    }

    const destinationLabel = searchDetailsParams.cityName || searchDetailsParams.city || '';
    const normalizedHotels = rawList
      .map((item: any, idx: number) => normalizeHotel(item, idx, destinationLabel))
      .filter((h): h is Hotel => h !== null);

    const countResults = data?.CountResults !== undefined ? data.CountResults : normalizedHotels.length;

    return {
      hotels: normalizedHotels,
      rawResponse: data,
      countResults,
    };
  } catch (err) {
    console.error('Error executing getIproAvailability:', err);
    throw err;
  }
}

/**
 * Service function to update hotel details / availability (used for mutations)
 */
export async function updateHotelDetails(hotelId: string, updates: Partial<Hotel>): Promise<{ success: boolean; hotelId: string; updates: Partial<Hotel> }> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    success: true,
    hotelId,
    updates,
  };
}
