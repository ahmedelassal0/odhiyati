import { create } from 'zustand';
import { Cow } from '../types';
import * as db from '../database/database';
import { DEFAULT_SHARES_PER_COW } from '../constants/parts';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

interface CowStore {
  cows: Cow[];
  loading: boolean;
  
  loadCows: () => Promise<void>;
  addCow: (name: string, totalShares?: number) => Promise<Cow>;
  updateCow: (id: string, updates: Partial<Pick<Cow, 'name' | 'totalShares' | 'takenShares' | 'status'>>) => Promise<void>;
  deleteCow: (id: string) => Promise<void>;
  getCowById: (id: string) => Cow | undefined;
  setCowPartWeight: (cowId: string, partKey: string, weight: number | null) => Promise<void>;
  getCowPartWeights: (cowId: string) => Promise<Record<string, number>>;
  recalculateTakenShares: (cowId: string) => Promise<void>;
}

export const useCowStore = create<CowStore>((set, get) => ({
  cows: [],
  loading: false,

  loadCows: async () => {
    set({ loading: true });
    try {
      const rows = await db.getAllCows();
      const cows: Cow[] = rows.map(row => ({
        id: row.id,
        name: row.name,
        totalShares: row.totalShares,
        takenShares: row.takenShares,
        status: row.status as 'available' | 'complete',
        createdAt: row.createdAt,
      }));
      set({ cows, loading: false });
    } catch (error) {
      console.error('Error loading cows:', error);
      set({ loading: false });
    }
  },

  addCow: async (name: string, totalShares = DEFAULT_SHARES_PER_COW) => {
    const cow: Cow = {
      id: generateId(),
      name,
      totalShares,
      takenShares: 0,
      status: 'available',
      createdAt: Date.now(),
    };
    await db.insertCow(cow);
    set(state => ({ cows: [cow, ...state.cows] }));
    return cow;
  },

  updateCow: async (id: string, updates) => {
    const cow = get().cows.find(c => c.id === id);
    if (!cow) return;
    
    const updated = { ...cow, ...updates };
    // Auto-set status
    if (updated.takenShares >= updated.totalShares) {
      updated.status = 'complete';
    } else {
      updated.status = 'available';
    }
    
    await db.updateCow(updated);
    set(state => ({
      cows: state.cows.map(c => c.id === id ? updated : c),
    }));
  },

  deleteCow: async (id: string) => {
    await db.deleteCow(id);
    set(state => ({
      cows: state.cows.filter(c => c.id !== id),
    }));
  },

  getCowById: (id: string) => {
    return get().cows.find(c => c.id === id);
  },

  setCowPartWeight: async (cowId: string, partKey: string, weight: number | null) => {
    await db.setCowPartWeight(cowId, partKey, weight);
  },

  getCowPartWeights: async (cowId: string) => {
    return db.getCowPartWeights(cowId);
  },

  recalculateTakenShares: async (cowId: string) => {
    const customers = await db.getCustomersByCowId(cowId);
    const takenShares = customers.reduce((sum: number, c: any) => sum + c.shares, 0);
    await get().updateCow(cowId, { takenShares });
  },
}));
