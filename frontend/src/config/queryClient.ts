import { QueryClient } from '@tanstack/react-query';

// Configure React Query client with default options
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      
      // Cache time: Unused data stays in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      
      // Refetch on window focus
      refetchOnWindowFocus: true,
      
      // Refetch on mount if data is stale
      refetchOnMount: true,
      
      // Retry failed requests 3 times with exponential backoff
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
});

// Query keys for templates
export const templateKeys = {
  all: ['templates'] as const,
  lists: () => [...templateKeys.all, 'list'] as const,
  list: (userId?: string) => [...templateKeys.lists(), userId] as const,
  details: () => [...templateKeys.all, 'detail'] as const,
  detail: (id: string) => [...templateKeys.details(), id] as const,
};
