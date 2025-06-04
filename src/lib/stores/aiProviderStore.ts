import { writable, derived } from 'svelte/store';
import { useDemo } from './apiModeStore';

// Available AI providers
export type AIProvider = 'openai' | 'gemini';

// Provider information interface
export interface ProviderInfo {
  model: string;
  is_default: boolean;
}

export interface ProvidersResponse {
  available_providers: {
    [key: string]: ProviderInfo;
  };
  default_provider: string;
}

// Create a writable store for the selected provider
export const selectedProvider = writable<AIProvider | null>(null);
export const availableProviders = writable<ProvidersResponse | null>(null);
export const isLoadingProviders = writable<boolean>(false);

// Derived store that combines demo mode with provider selection
export const currentProvider = derived(
  [selectedProvider, useDemo],
  ([$selectedProvider, $useDemo]) => {
    // In demo mode, we don't need a specific provider
    if ($useDemo) return null;
    
    return $selectedProvider;
  }
);

// Function to fetch available providers
export async function fetchAvailableProviders(): Promise<void> {
  isLoadingProviders.set(true);
  
  try {
    const response = await fetch('http://localhost:8000/api/providers');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch providers: ${response.status}`);
    }
    
    const data: ProvidersResponse = await response.json();
    availableProviders.set(data);
    
    // Set the selected provider to the default if not already set
    selectedProvider.update(current => {
      if (!current) {
        return data.default_provider as AIProvider;
      }
      return current;
    });
  } catch (error) {
    console.error('Error fetching available AI providers:', error);
  } finally {
    isLoadingProviders.set(false);
  }
}
