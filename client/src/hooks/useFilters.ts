import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ActiveFilter } from '@/components/FilterBar';

interface UseFiltersOptions {
  defaultFilters?: ActiveFilter[];
  persistKey?: string; // Clé pour localStorage
  urlSync?: boolean; // Synchronisation avec URL
}

interface FilterState {
  search: string;
  filters: ActiveFilter[];
  sort: string;
  sortDirection: 'asc' | 'desc';
  page: number;
}

export const useFilters = (options: UseFiltersOptions = {}) => {
  const { defaultFilters = [], persistKey, urlSync = false } = options;
  const [searchParams, setSearchParams] = useSearchParams();

  const [state, setState] = useState<FilterState>({
    search: '',
    filters: defaultFilters,
    sort: '',
    sortDirection: 'asc',
    page: 1
  });

  // Charger l'état depuis localStorage au montage
  useEffect(() => {
    if (persistKey) {
      const saved = localStorage.getItem(`filters_${persistKey}`);
      if (saved) {
        try {
          const parsedState = JSON.parse(saved);
          setState(prev => ({ ...prev, ...parsedState }));
        } catch (error) {
          console.warn('Erreur lors du chargement des filtres sauvegardés:', error);
        }
      }
    }
  }, [persistKey]);

  // Charger l'état depuis URL au montage
  useEffect(() => {
    if (urlSync && searchParams.size > 0) {
      const search = searchParams.get('search') || '';
      const sort = searchParams.get('sort') || '';
      const sortDirection = (searchParams.get('sortDir') as 'asc' | 'desc') || 'asc';
      const page = parseInt(searchParams.get('page') || '1');
      
      // Reconstituer les filtres depuis les paramètres URL
      const filters: ActiveFilter[] = [];
      searchParams.forEach((value, key) => {
        if (!['search', 'sort', 'sortDir', 'page'].includes(key)) {
          // Tenter de parser les filtres complexes
          try {
            const parsedValue = JSON.parse(decodeURIComponent(value));
            filters.push({
              key,
              label: key, // Sera mis à jour par le composant
              value: parsedValue,
              displayValue: value
            });
          } catch {
            // Filtres simples
            filters.push({
              key,
              label: key,
              value,
              displayValue: value
            });
          }
        }
      });

      setState(prev => ({
        ...prev,
        search,
        filters,
        sort,
        sortDirection,
        page
      }));
    }
  }, [urlSync, searchParams]);

  // Sauvegarder l'état dans localStorage
  const persistState = useCallback((newState: FilterState) => {
    if (persistKey) {
      localStorage.setItem(`filters_${persistKey}`, JSON.stringify(newState));
    }
  }, [persistKey]);

  // Synchroniser avec URL
  const syncWithUrl = useCallback((newState: FilterState) => {
    if (urlSync) {
      const params = new URLSearchParams();
      
      if (newState.search) params.set('search', newState.search);
      if (newState.sort) {
        params.set('sort', newState.sort);
        params.set('sortDir', newState.sortDirection);
      }
      if (newState.page > 1) params.set('page', newState.page.toString());
      
      newState.filters.forEach(filter => {
        if (typeof filter.value === 'object') {
          params.set(filter.key, encodeURIComponent(JSON.stringify(filter.value)));
        } else {
          params.set(filter.key, filter.value.toString());
        }
      });

      setSearchParams(params);
    }
  }, [urlSync, setSearchParams]);

  // Actions
  const setSearch = useCallback((search: string) => {
    const newState = { ...state, search, page: 1 };
    setState(newState);
    persistState(newState);
    syncWithUrl(newState);
  }, [state, persistState, syncWithUrl]);

  const setFilters = useCallback((filters: ActiveFilter[]) => {
    const newState = { ...state, filters, page: 1 };
    setState(newState);
    persistState(newState);
    syncWithUrl(newState);
  }, [state, persistState, syncWithUrl]);

  const setSort = useCallback((sort: string, sortDirection: 'asc' | 'desc') => {
    const newState = { ...state, sort, sortDirection, page: 1 };
    setState(newState);
    persistState(newState);
    syncWithUrl(newState);
  }, [state, persistState, syncWithUrl]);

  const setPage = useCallback((page: number) => {
    const newState = { ...state, page };
    setState(newState);
    persistState(newState);
    syncWithUrl(newState);
  }, [state, persistState, syncWithUrl]);

  const reset = useCallback(() => {
    const newState: FilterState = {
      search: '',
      filters: defaultFilters,
      sort: '',
      sortDirection: 'asc',
      page: 1
    };
    setState(newState);
    persistState(newState);
    syncWithUrl(newState);
  }, [defaultFilters, persistState, syncWithUrl]);

  // Gestion des filtres sauvegardés
  const savedFilters = useState<{ name: string; filters: ActiveFilter[] }[]>([]);

  const saveFilters = useCallback((name: string) => {
    if (!persistKey) return;
    
    const existing = JSON.parse(localStorage.getItem(`saved_filters_${persistKey}`) || '[]');
    const newSaved = [...existing, { name, filters: state.filters }];
    localStorage.setItem(`saved_filters_${persistKey}`, JSON.stringify(newSaved));
    savedFilters[1](newSaved);
  }, [persistKey, state.filters, savedFilters]);

  const loadFilters = useCallback((filters: ActiveFilter[]) => {
    setFilters(filters);
  }, [setFilters]);

  // Charger les filtres sauvegardés
  useEffect(() => {
    if (persistKey) {
      const saved = JSON.parse(localStorage.getItem(`saved_filters_${persistKey}`) || '[]');
      savedFilters[1](saved);
    }
  }, [persistKey]);

  // Générer les paramètres de requête pour l'API
  const getQueryParams = useCallback(() => {
    const params: Record<string, any> = {};
    
    if (state.search) params.search = state.search;
    if (state.sort) {
      params.sortBy = state.sort;
      params.sortDirection = state.sortDirection;
    }
    params.page = state.page;
    
    state.filters.forEach(filter => {
      params[filter.key] = filter.value;
    });

    return params;
  }, [state]);

  return {
    // État
    search: state.search,
    filters: state.filters,
    sort: state.sort,
    sortDirection: state.sortDirection,
    page: state.page,
    
    // Actions
    setSearch,
    setFilters,
    setSort,
    setPage,
    reset,
    
    // Filtres sauvegardés
    savedFilters: savedFilters[0],
    saveFilters,
    loadFilters,
    
    // Utilitaires
    getQueryParams
  };
};