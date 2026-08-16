import { QueryClient, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { searchCities, getHotelsAvailability, HotelSearchResult } from '../services/bookingApi';
import { SearchDetailsParams, CityOption, Hotel } from '../types';
import { useToastStore } from '../store/useToastStore';

// Query Key Factory for clean cache management
export const hotelKeys = {
  all: ['hotels'] as const,
  cities: (query: string) => [...hotelKeys.all, 'cities', query.trim().toLowerCase()] as const,
  search: (params: SearchDetailsParams | null) => [...hotelKeys.all, 'search', params] as const,
};

/**
 * Hook to search for cities with auto-caching and debounced querying via React Query
 */
export function useCitySearch(query: string) {
  const trimmedQuery = query.trim();

  return useQuery<CityOption[]>({
    queryKey: hotelKeys.cities(trimmedQuery),
    queryFn: () => searchCities(trimmedQuery),
    enabled: trimmedQuery.length >= 1,
    staleTime: 1000 * 60 * 10, // Cache city results for 10 minutes
  });
}

/**
 * Imperative React Query helper for fetching/retrieving city suggestions from cache
 */
export function fetchCitySuggestions(queryClient: QueryClient, query: string): Promise<CityOption[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return Promise.resolve([]);
  return queryClient.fetchQuery<CityOption[]>({
    queryKey: hotelKeys.cities(trimmedQuery),
    queryFn: () => searchCities(trimmedQuery),
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Hook to fetch hotel availability via React Query
 */
export function useHotelSearch(params: SearchDetailsParams | null, enabled: boolean = true) {
  return useQuery<HotelSearchResult>({
    queryKey: hotelKeys.search(params),
    queryFn: () => getHotelsAvailability(params!),
    enabled: Boolean(params && enabled),
    staleTime: 1000 * 60 * 5, // Cache hotel availability for 5 minutes
    retry: 1,
  });
}

export interface UpdateHotelMutationPayload {
  hotelId: string;
  updates: Partial<Hotel>;
  currentSearchParams: SearchDetailsParams | null;
}

