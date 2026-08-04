const BASE_URL = 'https://delivero-nh1o.onrender.com';

/**
 * Searches for cities via OpenAPI endpoint /bookings/city-search
 * @param {string} query - The search string for cities/locations
 * @returns {Promise<Array<{id: number, name: string, destination: string}>>}
 */
export async function searchCities(query) {
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
export function normalizeHotel(item, index = 0, searchDestination = '') {
  if (!item) return null;
  let parsed = item;
  if (typeof item === 'string') {
    try {
      parsed = JSON.parse(item);
    } catch (e) {
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
    'Breakfast included';

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
    raw: parsed,
  };
}

/**
 * Searches for hotel availability via OpenAPI endpoint /bookings/ipro/search
 * @param {Object} searchDetailsParams - Object with BookingDetails, Rooms, etc.
 * @returns {Promise<{hotels: Array, rawResponse: any, countResults: number}>}
 */
export async function getIproAvailability(searchDetailsParams) {
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

    let rawList = [];
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
      .map((item, idx) => normalizeHotel(item, idx, destinationLabel))
      .filter(Boolean);

    const countResults = data.CountResults !== undefined ? data.CountResults : normalizedHotels.length;

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
