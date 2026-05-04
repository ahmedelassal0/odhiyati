import { create } from 'zustand';
import { DistributionResult, Warning } from '../types';
import * as db from '../database/database';

interface DistributionStore {
  results: DistributionResult[];
  warnings: Warning[];
  loading: boolean;
  
  loadResults: () => Promise<void>;
  setResults: (results: DistributionResult[]) => Promise<void>;
  setWarnings: (warnings: Warning[]) => void;
  clearResults: () => Promise<void>;
  toggleDelivery: (distributionId: string, partKey: string, delivered: boolean) => Promise<void>;
  getResultsByCustomer: (customerId: string) => DistributionResult[];
  getResultsByCow: (cowId: string) => DistributionResult[];
}

export const useDistributionStore = create<DistributionStore>((set, get) => ({
  results: [],
  warnings: [],
  loading: false,

  loadResults: async () => {
    set({ loading: true });
    try {
      const rows = await db.getAllDistributionResults();
      const results: DistributionResult[] = [];
      
      for (const row of rows) {
        const parts = await db.getDistributionParts(row.id);
        results.push({
          id: row.id,
          customerId: row.customerId,
          customerName: row.customerName,
          cowId: row.cowId,
          cowName: row.cowName,
          parts: parts.map((p: any) => ({
            partKey: p.partKey,
            label: p.label,
            received: p.received === 1,
            weight: p.weight ?? undefined,
            note: p.note ?? undefined,
            delivered: p.delivered === 1,
            readiness: p.readiness || 'ready',
          })),
          createdAt: row.createdAt,
        });
      }
      
      set({ results, loading: false });
    } catch (error) {
      console.error('Error loading distribution results:', error);
      set({ loading: false });
    }
  },

  setResults: async (results: DistributionResult[]) => {
    // Clear old results
    await db.clearAllDistributionResults();
    
    // Save new results
    for (const result of results) {
      await db.insertDistributionResult({
        id: result.id,
        customerId: result.customerId,
        customerName: result.customerName,
        cowId: result.cowId,
        cowName: result.cowName,
        createdAt: result.createdAt,
        parts: result.parts.map(p => ({
          partKey: p.partKey,
          label: p.label,
          received: p.received,
          weight: p.weight,
          note: p.note,
          delivered: p.delivered,
          readiness: p.readiness,
        })),
      });
    }
    
    set({ results });
  },

  setWarnings: (warnings: Warning[]) => {
    set({ warnings });
  },

  clearResults: async () => {
    await db.clearAllDistributionResults();
    set({ results: [], warnings: [] });
  },

  getResultsByCustomer: (customerId: string) => {
    return get().results.filter(r => r.customerId === customerId);
  },

  getResultsByCow: (cowId: string) => {
    return get().results.filter(r => r.cowId === cowId);
  },

  toggleDelivery: async (distributionId: string, partKey: string, delivered: boolean) => {
    await db.togglePartDelivery(distributionId, partKey, delivered);
    
    set(state => ({
      results: state.results.map(result => {
        if (result.id === distributionId) {
          return {
            ...result,
            parts: result.parts.map(part => {
              if (part.partKey === partKey) {
                return { ...part, delivered };
              }
              return part;
            })
          };
        }
        return result;
      })
    }));
  },
}));
