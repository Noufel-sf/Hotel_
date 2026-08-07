import { QueryClient, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { searchCities, getIproAvailability, updateHotelDetails, IproSearchResult } from '../services/bookingApi';
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
 * Hook to fetch hotel availability from IPRO backend via React Query
 */
export function useHotelSearch(params: SearchDetailsParams | null, enabled: boolean = true) {
  return useQuery<IproSearchResult>({
    queryKey: hotelKeys.search(params),
    queryFn: () => getIproAvailability(params!),
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

/**
 * Mutation hook for updating hotel details with Optimistic Updates, Rollback, and Invalidation
 */
export function useUpdateHotelStatus() {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);

  return useMutation({
    mutationFn: ({ hotelId, updates }: UpdateHotelMutationPayload) =>
      updateHotelDetails(hotelId, updates),

    // Optimistic Update Phase
    onMutate: async ({ hotelId, updates, currentSearchParams }: UpdateHotelMutationPayload) => {
      const queryKey = hotelKeys.search(currentSearchParams);

      // 1. Cancel any outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey });

      // 2. Snapshot the previous value
      const previousSearchResult = queryClient.getQueryData<IproSearchResult>(queryKey);

      // 3. Optimistically update to the new value in cache
      if (previousSearchResult) {
        queryClient.setQueryData<IproSearchResult>(queryKey, {
          ...previousSearchResult,
          hotels: previousSearchResult.hotels.map((h) =>
            h.id === hotelId ? { ...h, ...updates } : h
          ),
        });
      }

      showToast(`Optimistically updated hotel ${hotelId}`, 'info');

      // 4. Return context object with snapshot value
      return { previousSearchResult, queryKey };
    },

    // If mutation fails, roll back using snapshot context
    onError: (err, _variables, context) => {
      if (context?.previousSearchResult && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousSearchResult);
      }
      showToast(err.message || 'Failed to update hotel. Rolled back changes.', 'error');
    },

    // Always refetch after error or success to sync with server
    onSettled: (_data, _error, _variables, context) => {
      if (context?.queryKey) {
        queryClient.invalidateQueries({ queryKey: context.queryKey });
      }
    },
  });
}
