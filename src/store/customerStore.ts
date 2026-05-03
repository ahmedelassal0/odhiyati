import { create } from 'zustand';
import { Customer, PartKey } from '../types';
import * as db from '../database/database';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

interface CustomerStore {
  customers: Customer[];
  loading: boolean;
  
  loadCustomers: () => Promise<void>;
  addCustomer: (data: {
    name: string;
    phone: string;
    address: string;
    shares: number;
    cowId: string | null;
    requestedParts: PartKey[];
    notes: string;
  }) => Promise<Customer>;
  updateCustomer: (id: string, data: {
    name: string;
    phone: string;
    address: string;
    shares: number;
    cowId: string | null;
    requestedParts: PartKey[];
    notes: string;
  }) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  getCustomerById: (id: string) => Customer | undefined;
  getCustomersByCow: (cowId: string) => Customer[];
}

export const useCustomerStore = create<CustomerStore>((set, get) => ({
  customers: [],
  loading: false,

  loadCustomers: async () => {
    set({ loading: true });
    try {
      const rows = await db.getAllCustomers();
      const customers: Customer[] = [];
      
      for (const row of rows) {
        const parts = await db.getCustomerParts(row.id);
        customers.push({
          id: row.id,
          name: row.name,
          phone: row.phone,
          address: row.address,
          shares: row.shares,
          cowId: row.cowId,
          requestedParts: parts as PartKey[],
          notes: row.notes,
          createdAt: row.createdAt,
        });
      }
      
      set({ customers, loading: false });
    } catch (error) {
      console.error('Error loading customers:', error);
      set({ loading: false });
    }
  },

  addCustomer: async (data) => {
    const customer: Customer = {
      id: generateId(),
      name: data.name,
      phone: data.phone,
      address: data.address,
      shares: data.shares,
      cowId: data.cowId,
      requestedParts: data.requestedParts,
      notes: data.notes,
      createdAt: Date.now(),
    };
    
    await db.insertCustomer(customer);
    await db.setCustomerParts(customer.id, data.requestedParts);
    
    set(state => ({ customers: [customer, ...state.customers] }));
    return customer;
  },

  updateCustomer: async (id: string, data) => {
    const existing = get().customers.find(c => c.id === id);
    if (!existing) return;
    
    const updated: Customer = {
      ...existing,
      ...data,
    };
    
    await db.updateCustomer(updated);
    await db.setCustomerParts(id, data.requestedParts);
    
    set(state => ({
      customers: state.customers.map(c => c.id === id ? updated : c),
    }));
  },

  deleteCustomer: async (id: string) => {
    await db.deleteCustomer(id);
    set(state => ({
      customers: state.customers.filter(c => c.id !== id),
    }));
  },

  getCustomerById: (id: string) => {
    return get().customers.find(c => c.id === id);
  },

  getCustomersByCow: (cowId: string) => {
    return get().customers.filter(c => c.cowId === cowId);
  },
}));
