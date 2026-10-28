'use client';

import { useState, useEffect, useCallback, useRef, useId } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Unique hook instance ID using standard React 19 useId hook
  const hookId = useId();

  // Keep initialValue in a ref so changes to it don't trigger state sync loops
  const initialValueRef = useRef(initialValue);
  
  useEffect(() => {
    initialValueRef.current = initialValue;
  }, [initialValue]);

  // Initialize with initialValue to prevent hydration mismatches
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Helper to safely read from localStorage
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValueRef.current;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        return initialValueRef.current;
      }
      try {
        return JSON.parse(item) as T;
      } catch {
        // Fallback for unquoted plain strings stored in localStorage (e.g. "light", "dark")
        return item as unknown as T;
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValueRef.current;
    }
  }, [key]);

  // Sync state with localStorage on mount and when key changes
  useEffect(() => {
    let isMounted = true;
    
    // Initial read on mount
    const current = readValue();
    setStoredValue(current);

    const handleStorageChange = (e: StorageEvent | CustomEvent) => {
      if (!isMounted) return;

      // If it is a standard StorageEvent (cross-tab)
      if ('key' in e && e.key !== null && e.key !== key) {
        return;
      }
      
      // If it is our custom Event
      if (e instanceof CustomEvent && e.detail) {
        if (e.detail.key !== key) return;
        // Avoid re-rendering the component instance that initiated the change
        if (e.detail.sourceId === hookId) return;
      }

      setStoredValue(readValue());
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage-update', handleStorageChange as EventListener);

    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage-update', handleStorageChange as EventListener);
    };
  }, [key, readValue, hookId]);

  // Setter function that triggers updates across components
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      setStoredValue((currentValue) => {
        const newValue = value instanceof Function ? value(currentValue) : value;
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.setItem(key, JSON.stringify(newValue));
            window.dispatchEvent(
              new CustomEvent('local-storage-update', {
                detail: { key, sourceId: hookId },
              })
            );
          } catch (err) {
            console.warn(`Error writing localStorage key "${key}":`, err);
          }
        }
        return newValue;
      });
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, hookId]);

  return [storedValue, setValue];
}

