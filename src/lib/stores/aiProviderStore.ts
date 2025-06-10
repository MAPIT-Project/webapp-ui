import { writable, derived } from 'svelte/store';
import { useDemo } from './apiModeStore';

// Available AI providers with version
export type AIProvider = 'openai' | 'gemini';
export type AIVersion = 'V2' | 'V3';

// Provider information interface
export interface ProviderInfo {
  model: string;
  is_default: boolean;
}

export interface ProvidersResponse {
  available_providers: {
    [version: string]: {
      [provider: string]: ProviderInfo;
    };
  };
  default_provider: string;
}

// Store for selected provider and version
export const selectedProvider = writable<AIProvider | null>(null);
export const selectedVersion = writable<AIVersion>('V3'); // Default to V3
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
