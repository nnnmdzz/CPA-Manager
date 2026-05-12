import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const STORAGE_KEY = 'cli-proxy-quota-settings';

export const DEFAULT_HIGH_THRESHOLD = 70;
export const DEFAULT_LOW_THRESHOLD = 30;

interface QuotaSettingsState {
  highThreshold: number;
  lowThreshold: number;
  setThresholds: (high: number, low: number) => void;
  resetThresholds: () => void;
}

export const useQuotaSettingsStore = create<QuotaSettingsState>()(
  persist(
    (set) => ({
      highThreshold: DEFAULT_HIGH_THRESHOLD,
      lowThreshold: DEFAULT_LOW_THRESHOLD,

      setThresholds: (high, low) => set({ highThreshold: high, lowThreshold: low }),

      resetThresholds: () =>
        set({ highThreshold: DEFAULT_HIGH_THRESHOLD, lowThreshold: DEFAULT_LOW_THRESHOLD }),
    }),
    {
      name: STORAGE_KEY,
      merge: (persisted, current) => {
        const p = persisted as Partial<QuotaSettingsState>;
        const high = typeof p?.highThreshold === 'number' ? p.highThreshold : current.highThreshold;
        const low = typeof p?.lowThreshold === 'number' ? p.lowThreshold : current.lowThreshold;
        return { ...current, highThreshold: high, lowThreshold: low };
      },
    }
  )
);
