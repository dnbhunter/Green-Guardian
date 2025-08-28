import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Company, Asset, Portfolio, Dataset, DataState, DataFilters } from '../types/data';
import { apiClient } from '../services/api';

interface DataActions {
  loadCompanies: () => Promise<void>;
  loadAssets: () => Promise<void>;
  loadPortfolios: () => Promise<void>;
  loadDatasets: () => Promise<void>;
  loadAll: () => Promise<void>;
  selectCompanies: (companyIds: string[]) => void;
  selectPortfolio: (portfolioId: string | null) => void;
  updateFilters: (filters: Partial<DataFilters>) => void;
  clearFilters: () => void;
  searchAssets: (query: string) => Promise<Asset[]>;
  uploadDataset: (file: File) => Promise<void>;
  refreshDataset: (datasetId: string) => Promise<void>;
  setError: (error: string | null) => void;
  clearError: () => void;
}

type DataStore = DataState & DataActions;

export const useDataStore = create<DataStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    companies: [],
    assets: [],
    portfolios: [],
    datasets: [],
    selectedCompanies: [],
    selectedPortfolio: null,
    filters: {},
    isLoading: false,
    error: null,

    // Actions
    loadCompanies: async () => {
      set({ isLoading: true, error: null });
      
      try {
        const companies = await apiClient.getCompanies();
        set({ 
          companies, 
          isLoading: false 
        });
      } catch (error) {
        console.error('Failed to load companies:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to load companies',
          isLoading: false 
        });
      }
    },

    loadAssets: async () => {
      set({ isLoading: true, error: null });
      
      try {
        const assets = await apiClient.getAssets();
        set({ 
          assets, 
          isLoading: false 
        });
      } catch (error) {
        console.error('Failed to load assets:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to load assets',
          isLoading: false 
        });
      }
    },

    loadPortfolios: async () => {
      set({ isLoading: true, error: null });
      
      try {
        const portfolios = await apiClient.getPortfolios();
        set({ 
          portfolios, 
          isLoading: false 
        });
      } catch (error) {
        console.error('Failed to load portfolios:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to load portfolios',
          isLoading: false 
        });
      }
    },

    loadDatasets: async () => {
      set({ isLoading: true, error: null });
      
      try {
        const datasets = await apiClient.getDatasets();
        set({ 
          datasets, 
          isLoading: false 
        });
      } catch (error) {
        console.error('Failed to load datasets:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to load datasets',
          isLoading: false 
        });
      }
    },

    loadAll: async () => {
      set({ isLoading: true, error: null });
      
      try {
        const [companies, assets, portfolios, datasets] = await Promise.all([
          apiClient.getCompanies(),
          apiClient.getAssets(),
          apiClient.getPortfolios(),
          apiClient.getDatasets(),
        ]);
        
        set({ 
          companies,
          assets,
          portfolios,
          datasets,
          isLoading: false 
        });
      } catch (error) {
        console.error('Failed to load data:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to load data',
          isLoading: false 
        });
      }
    },

    selectCompanies: (companyIds: string[]) => {
      set({ selectedCompanies: companyIds });
    },

    selectPortfolio: (portfolioId: string | null) => {
      set({ selectedPortfolio: portfolioId });
    },

    updateFilters: (newFilters: Partial<DataFilters>) => {
      set(state => ({
        filters: { ...state.filters, ...newFilters }
      }));
    },

    clearFilters: () => {
      set({ filters: {} });
    },

    searchAssets: async (query: string): Promise<Asset[]> => {
      try {
        const results = await apiClient.searchAssets(query);
        return results;
      } catch (error) {
        console.error('Failed to search assets:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to search assets'
        });
        return [];
      }
    },

    uploadDataset: async (file: File) => {
      set({ isLoading: true, error: null });
      
      try {
        await apiClient.uploadDataset(file);
        
        // Reload datasets after upload
        await get().loadDatasets();
        
        set({ isLoading: false });
      } catch (error) {
        console.error('Failed to upload dataset:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to upload dataset',
          isLoading: false 
        });
        throw error;
      }
    },

    refreshDataset: async (datasetId: string) => {
      set({ isLoading: true, error: null });
      
      try {
        // Reload specific dataset or all datasets
        await get().loadDatasets();
        set({ isLoading: false });
      } catch (error) {
        console.error('Failed to refresh dataset:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to refresh dataset',
          isLoading: false 
        });
      }
    },

    setError: (error: string | null) => {
      set({ error });
    },

    clearError: () => {
      set({ error: null });
    },
  }))
);

// Computed selectors
export const useFilteredCompanies = () => {
  return useDataStore(state => {
    const { companies, filters } = state;
    
    let filtered = companies;
    
    if (filters.sectors && filters.sectors.length > 0) {
      filtered = filtered.filter(company => 
        filters.sectors!.includes(company.sector)
      );
    }
    
    if (filters.countries && filters.countries.length > 0) {
      filtered = filtered.filter(company => 
        filters.countries!.includes(company.country)
      );
    }
    
    return filtered;
  });
};

export const useFilteredAssets = () => {
  return useDataStore(state => {
    const { assets, filters } = state;
    
    let filtered = assets;
    
    if (filters.asset_types && filters.asset_types.length > 0) {
      filtered = filtered.filter(asset => 
        filters.asset_types!.includes(asset.type)
      );
    }
    
    if (filters.countries && filters.countries.length > 0) {
      filtered = filtered.filter(asset => 
        filters.countries!.includes(asset.location.country)
      );
    }
    
    if (filters.risk_threshold !== undefined) {
      filtered = filtered.filter(asset => 
        asset.risk_scores.overall >= filters.risk_threshold!
      );
    }
    
    return filtered;
  });
};
