import React from 'react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {AuthProvider} from '../core/auth';
import {BrandProvider} from '../core/brand';
import {ThemeProvider} from '../design-system/theme/ThemeContext';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    },
  },
});

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * AppProviders - Root provider component that wraps the entire app
 *
 * Provider hierarchy:
 * 1. BrandProvider - Provides brand configuration (must be outermost)
 * 2. ThemeProvider - Provides dynamic theming based on brand
 * 3. QueryClientProvider - React Query for server state
 * 4. AuthProvider - Authentication state management
 */
export const AppProviders: React.FC<AppProvidersProps> = ({children}) => {
  return (
    <BrandProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>{children}</AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </BrandProvider>
  );
};
