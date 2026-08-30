/**
 * localStorage throws in private-browsing Safari and when a quota is exceeded, and is simply
 * absent in some embedded contexts. Every call is wrapped so the rest of the app can treat
 * persistence as best-effort: everything still works, it just remembers nothing (ROADMAP §6.9).
 */
export const safeStorage = {
  get(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Unavailable or full — silently drop the write rather than breaking the app.
    }
  },
};
