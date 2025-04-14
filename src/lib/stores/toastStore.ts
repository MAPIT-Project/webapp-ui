// Toast notification store for displaying notifications across the application
import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number; // in milliseconds
  dismissible?: boolean;
}

// Create a writable store for toasts
export const toasts = writable<Toast[]>([]);

// Helper functions to add toasts
export function addToast(toast: Omit<Toast, 'id'>) {
  const id = crypto.randomUUID();
  const defaults = {
    duration: 5000, // Default 5 seconds
    dismissible: true
  };
  
  const newToast = { ...defaults, ...toast, id };
  
  toasts.update((all) => [...all, newToast]);
  
  // Auto-dismiss after duration if specified
  if (newToast.duration && newToast.duration > 0) {
    setTimeout(() => {
      dismissToast(id);
    }, newToast.duration);
  }
  
  return id;
}

// Helper functions for common toast types
export function success(message: string, options: Partial<Omit<Toast, 'id' | 'type' | 'message'>> = {}) {
  return addToast({ type: 'success', message, ...options });
}

export function error(message: string, options: Partial<Omit<Toast, 'id' | 'type' | 'message'>> = {}) {
  return addToast({ type: 'error', message, ...options });
}

export function warning(message: string, options: Partial<Omit<Toast, 'id' | 'type' | 'message'>> = {}) {
  return addToast({ type: 'warning', message, ...options });
}

export function info(message: string, options: Partial<Omit<Toast, 'id' | 'type' | 'message'>> = {}) {
  return addToast({ type: 'info', message, ...options });
}

// Dismiss a toast
export function dismissToast(id: string) {
  toasts.update((all) => all.filter((t) => t.id !== id));
}

// Dismiss all toasts
export function dismissAllToasts() {
  toasts.set([]);
}