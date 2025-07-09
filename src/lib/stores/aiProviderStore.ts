import { writable, derived } from 'svelte/store';
import { useDemo } from './apiModeStore';

// Available AI providers with version
export type AIProvider = 'openai' | 'gemini';
export type AIVersion = `V${number}`; 

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
export const selectedVersion = writable<AIVersion>('V4'); // Will be updated dynamically
export const availableProviders = writable<ProvidersResponse | null>(null);
export const isLoadingProviders = writable<boolean>(false);
export const useLocalDb = writable<boolean>(false); // Default to using CORDIS API

// Helper function to check if version is V5 or higher
export function isVersionV5OrHigher(versionString: AIVersion | string | null): boolean {
  if (!versionString || !versionString.startsWith('V')) {
    return false;
  }
  const versionNumber = parseInt(versionString.substring(1));
  return !isNaN(versionNumber) && versionNumber >= 5;
}

// Derived store that combines demo mode with provider selection
export const currentProvider = derived(
  [selectedProvider, useDemo],
  ([$selectedProvider, $useDemo]) => {
    // In demo mode, we don't need a specific provider
    if ($useDemo) return null;
    
    return $selectedProvider;
  }
);

// Function to get the highest version number
function getHighestVersion(versions: string[]): string {
  return versions
    .filter(v => v.startsWith('V'))
    .sort((a, b) => {
      const aNum = parseInt(a.substring(1));
      const bNum = parseInt(b.substring(1));
      return bNum - aNum; // Sort descending
    })[0] || 'V4'; // Fallback to V4 if no versions found
}

// Function to fetch available providers
export async function fetchAvailableProviders(): Promise<void> {
  isLoadingProviders.set(true);
  
  try {
    const response = await fetch('/api/providers'); // Changed to relative path for our backend proxy
    
    if (!response.ok) {
      throw new Error(`Failed to fetch providers: ${response.status}`);
    }
    
    const data: ProvidersResponse = await response.json();
    availableProviders.set(data);
    
    // Set the selected version to the highest available version
    const availableVersions = Object.keys(data.available_providers);
    const highestVersion = getHighestVersion(availableVersions);
    selectedVersion.set(highestVersion as AIVersion);
    
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
