import { create } from 'zustand';
import { PartRule } from '../types';
import { getDatabase } from '../database/database';
import { PARTS, updateGlobalParts } from '../constants/parts';

interface SettingsState {
  parts: PartRule[];
  loadSettings: () => Promise<void>;
  updatePartConfig: (key: string, updates: Partial<PartRule>) => Promise<void>;
}

// Deep copy of initial defaults to avoid reference issues
const DEFAULT_PARTS_COPY = JSON.parse(JSON.stringify(PARTS));

export const useSettingsStore = create<SettingsState>((set, get) => ({
  parts: [...DEFAULT_PARTS_COPY],

  loadSettings: async () => {
    try {
      const db = await getDatabase();
      const row = await db.getFirstAsync<{ value: string }>("SELECT value FROM settings WHERE key = 'parts'");
      
      let mergedParts = [...DEFAULT_PARTS_COPY];
      
      if (row && row.value) {
        const storedParts: PartRule[] = JSON.parse(row.value);
        // Merge stored settings with code defaults
        mergedParts = DEFAULT_PARTS_COPY.map((dp: PartRule) => {
          const stored = storedParts.find(sp => sp.key === dp.key);
          return stored ? { ...dp, ...stored } : dp;
        });
      }
      
      // Update global runtime constants so that non-React code stays in sync
      updateGlobalParts(mergedParts);
      
      set({ parts: mergedParts });
    } catch (e) {
      console.error('Failed to load settings', e);
    }
  },

  updatePartConfig: async (key: string, updates: Partial<PartRule>) => {
    const { parts } = get();
    const newParts = parts.map(p => p.key === key ? { ...p, ...updates } : p);
    
    // Update global runtime constants
    updateGlobalParts(newParts);
    
    set({ parts: newParts });
    
    try {
      const db = await getDatabase();
      // Save only the customizable fields to prevent overriding future app updates (like icon changes)
      const partsToSave = newParts.map(p => ({
        key: p.key,
        perCow: p.perCow,
        exclusive: p.exclusive,
      }));
      await db.runAsync("INSERT OR REPLACE INTO settings (key, value) VALUES ('parts', ?)", JSON.stringify(partsToSave));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  }
}));
