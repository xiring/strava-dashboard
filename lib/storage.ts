// LocalStorage utilities for persisting user preferences and data

const STORAGE_PREFIX = 'strava_dashboard_';

export function setStorageItem(key: string, value: any): void {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, serialized);
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

export function getStorageItem<T>(key: string, defaultValue: T | null = null): T | null {
  try {
    const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
}

export function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
}

export function clearStorage(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
}

// Specific storage helpers
export const storage = {
  preferences: {
    get: () => getStorageItem('preferences', { theme: 'auto', itemsPerPage: 12 }),
    set: (prefs: any) => setStorageItem('preferences', prefs),
  },
  recentSearches: {
    get: () => getStorageItem<string[]>('recent_searches', []),
    set: (searches: string[]) => setStorageItem('recent_searches', searches),
    add: (search: string) => {
      const searches = storage.recentSearches.get() || [];
      const filtered = searches.filter((s) => s !== search);
      const updated = [search, ...filtered].slice(0, 10); // Keep last 10
      setStorageItem('recent_searches', updated);
    },
  },
  favoriteActivities: {
    get: () => getStorageItem<number[]>('favorite_activities', []),
    set: (ids: number[]) => setStorageItem('favorite_activities', ids),
    add: (id: number) => {
      const favorites = storage.favoriteActivities.get() || [];
      if (!favorites.includes(id)) {
        setStorageItem('favorite_activities', [...favorites, id]);
      }
    },
    remove: (id: number) => {
      const favorites = storage.favoriteActivities.get() || [];
      setStorageItem('favorite_activities', favorites.filter((f) => f !== id));
    },
    has: (id: number) => {
      const favorites = storage.favoriteActivities.get() || [];
      return favorites.includes(id);
    },
  },
};

