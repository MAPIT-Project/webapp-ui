import { onMount, onDestroy } from 'svelte';
import { browser } from '$app/environment';

type KeyCombination = string;
type CallbackFunction = (event: KeyboardEvent) => void;
export type KeyboardShortcut = {
  key: KeyCombination;
  callback: CallbackFunction;
  description: string;
  category: string;
  global?: boolean;
};

/**
 * Keyboard shortcuts manager for the application
 */
class KeyboardShortcutsManager {
  private shortcuts: Map<KeyCombination, KeyboardShortcut> = new Map();
  private enabled: boolean = true;
  private globalListener: ((e: KeyboardEvent) => void) | null = null;
  
  /**
   * Register a new keyboard shortcut
   */
  register(shortcut: KeyboardShortcut): void {
    console.log(`Registering shortcut: ${shortcut.key} - ${shortcut.description}`);
    this.shortcuts.set(shortcut.key, shortcut);
  }
  
  /**
   * Unregister a keyboard shortcut
   */
  unregister(key: KeyCombination): void {
    this.shortcuts.delete(key);
  }
  
  /**
   * Handle keyboard event
   */
  private handleKeyboardEvent = (event: KeyboardEvent): void => {
    if (!this.enabled) return;
    
    // Skip if user is typing in an input field
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' || 
      target.tagName === 'TEXTAREA' || 
      target.isContentEditable
    ) {
      return;
    }
    
    // Create key combination string
    const key = this.getKeyCombination(event);
    console.log('Key pressed:', key); // Debug logging
    
    const shortcut = this.shortcuts.get(key);
    
    if (shortcut) {
      console.log('Executing shortcut:', shortcut.description);
      event.preventDefault();
      shortcut.callback(event);
    }
  };
  
  /**
   * Convert KeyboardEvent to a standardized key combination string
   */
  private getKeyCombination(event: KeyboardEvent): string {
    const parts: string[] = [];
    
    if (event.ctrlKey) parts.push('ctrl');
    if (event.metaKey) parts.push('meta');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');
    
    // Normalize key name
    let key = event.key.toLowerCase();
    
    // Handle the question mark key specifically
    if (key === '?') {
      if (parts.length === 0) {
        return '?'; // Just the question mark key
      }
    }
    
    // Map special keys to more readable names
    const keyMap: Record<string, string> = {
      ' ': 'space',
      'arrowup': 'up',
      'arrowdown': 'down',
      'arrowleft': 'left',
      'arrowright': 'right',
      'escape': 'esc'
    };
    
    if (keyMap[key]) {
      key = keyMap[key];
    }
    
    // For single character keys that aren't modifiers
    if (key.length === 1 || keyMap[key]) {
      parts.push(key);
    }
    
    return parts.join('+');
  }
  
  /**
   * Enable keyboard shortcuts
   */
  enable(): void {
    this.enabled = true;
  }
  
  /**
   * Disable keyboard shortcuts
   */
  disable(): void {
    this.enabled = false;
  }
  
  /**
   * Install global event listener
   */
  installGlobalListener(): void {
    if (!browser) return;
    
    if (!this.globalListener) {
      console.log('Installing global keyboard listener');
      this.globalListener = this.handleKeyboardEvent;
      window.addEventListener('keydown', this.globalListener);
    }
  }
  
  /**
   * Remove global event listener
   */
  removeGlobalListener(): void {
    if (!browser) return;
    
    if (this.globalListener) {
      window.removeEventListener('keydown', this.globalListener);
      this.globalListener = null;
    }
  }
  
  /**
   * Get all registered shortcuts
   */
  getAllShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }
  
  /**
   * Get shortcuts grouped by category
   */
  getShortcutsByCategory(): Record<string, KeyboardShortcut[]> {
    const categories: Record<string, KeyboardShortcut[]> = {};
    
    this.shortcuts.forEach(shortcut => {
      if (!categories[shortcut.category]) {
        categories[shortcut.category] = [];
      }
      categories[shortcut.category].push(shortcut);
    });
    
    return categories;
  }
}

// Create singleton instance
export const keyboardShortcuts = new KeyboardShortcutsManager();

/**
 * Svelte action to use keyboard shortcuts in a component
 */
export function useKeyboardShortcuts(
  node: HTMLElement,
  shortcuts: KeyboardShortcut[]
): { destroy: () => void } {
  const registeredShortcuts: KeyCombination[] = [];
  
  // Register all shortcuts
  shortcuts.forEach(shortcut => {
    keyboardShortcuts.register(shortcut);
    registeredShortcuts.push(shortcut.key);
  });
  
  // Ensure global listener is installed
  keyboardShortcuts.installGlobalListener();
  
  return {
    destroy() {
      // Unregister all shortcuts that were registered by this component
      registeredShortcuts.forEach(key => {
        keyboardShortcuts.unregister(key);
      });
    }
  };
}

/**
 * Common keyboard shortcuts for the application
 */
export const commonShortcuts: KeyboardShortcut[] = [
  {
    key: '?',
    callback: () => {
      // Show keyboard shortcuts help dialog
      if (browser) {
        console.log("? shortcut triggered, dispatching toggle-shortcuts-help event");
        document.dispatchEvent(new CustomEvent('toggle-shortcuts-help'));
      }
    },
    description: 'Show keyboard shortcuts help',
    category: 'General',
    global: true
  },
  {
    key: 'esc',
    callback: () => {
      // Close modals or dialogs
      if (browser) {
        document.dispatchEvent(new CustomEvent('close-active-dialog'));
      }
    },
    description: 'Close active dialog or modal',
    category: 'General',
    global: true
  },
  {
    key: 'ctrl+/',
    callback: () => {
      // Toggle sidebar
      if (browser) {
        document.dispatchEvent(new CustomEvent('toggle-sidebar'));
      }
    },
    description: 'Toggle sidebar',
    category: 'Navigation',
    global: true
  },
  {
    key: 'ctrl+f',
    callback: () => {
      // Focus search
      if (browser) {
        document.dispatchEvent(new CustomEvent('focus-search'));
      }
    },
    description: 'Focus search',
    category: 'Navigation',
    global: true
  }
];