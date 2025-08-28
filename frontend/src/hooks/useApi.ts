import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = [],
  options: UseApiOptions = {}
) {
  const { immediate = true, onSuccess, onError } = options;
  
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await apiCall();
      setState(prev => ({ ...prev, data: result, loading: false }));
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      
      if (onError) {
        onError(error as Error);
      }
      
      throw error;
    }
  }, [apiCall, onSuccess, onError]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, dependencies);

  const refetch = useCallback(() => {
    return execute();
  }, [execute]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    execute,
    refetch,
    reset,
  };
}

// Specific API hooks
export const useCompanies = (options?: UseApiOptions) => {
  return useApi(() => apiClient.getCompanies(), [], options);
};

export const useAssets = (options?: UseApiOptions) => {
  return useApi(() => apiClient.getAssets(), [], options);
};

export const usePortfolios = (options?: UseApiOptions) => {
  return useApi(() => apiClient.getPortfolios(), [], options);
};

export const useDatasets = (options?: UseApiOptions) => {
  return useApi(() => apiClient.getDatasets(), [], options);
};

export const useConversations = (options?: UseApiOptions) => {
  return useApi(() => apiClient.getConversations(), [], options);
};

export const useCompany = (id: string, options?: UseApiOptions) => {
  return useApi(() => apiClient.getCompany(id), [id], options);
};

export const useConversation = (id: string, options?: UseApiOptions) => {
  return useApi(() => apiClient.getConversation(id), [id], options);
};

// Hook for mutations (POST, PUT, DELETE)
interface UseMutationOptions<T, P> {
  onSuccess?: (data: T, params: P) => void;
  onError?: (error: Error, params: P) => void;
}

export function useMutation<T, P = void>(
  mutationFn: (params: P) => Promise<T>,
  options: UseMutationOptions<T, P> = {}
) {
  const { onSuccess, onError } = options;
  
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = useCallback(async (params: P) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await mutationFn(params);
      setState(prev => ({ ...prev, data: result, loading: false }));
      
      if (onSuccess) {
        onSuccess(result, params);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      
      if (onError) {
        onError(error as Error, params);
      }
      
      throw error;
    }
  }, [mutationFn, onSuccess, onError]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
}

// Specific mutation hooks
export const useCreateConversation = (options?: UseMutationOptions<any, string>) => {
  return useMutation((title: string) => apiClient.createConversation(title), options);
};

export const useDeleteConversation = (options?: UseMutationOptions<void, string>) => {
  return useMutation((id: string) => apiClient.deleteConversation(id), options);
};

export const useUploadDataset = (options?: UseMutationOptions<any, File>) => {
  return useMutation((file: File) => apiClient.uploadDataset(file), options);
};
