// ===== Part Types =====
export type PartKey =
  | 'meat'
  | 'liver'
  | 'kidney'
  | 'heart'
  | 'spleen'
  | 'tripe'
  | 'lungs'
  | 'intestines'
  | 'frontLeg'
  | 'backLeg'
  | 'head';

export interface PartRule {
  key: PartKey;
  label: string;
  perCow: number;       // quantity available per cow
  exclusive: boolean;   // if true, only one person can get it per cow (e.g. intestines/ممبار)
  icon: string;         // emoji icon
}

// ===== Cow Types =====
export interface CowPart {
  partKey: PartKey;
  weight?: number;      // optional weight in kg
  quantity: number;     // available quantity (1 or 2 for legs)
  readiness: 'not_ready' | 'preparing' | 'ready';
}

export interface Cow {
  id: string;
  name: string;
  totalShares: number;  // default 7
  takenShares: number;  // how many shares are sold
  status: 'available' | 'complete';
  createdAt: number;
}

// ===== Customer Types =====
export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  shares: number;       // number of shares (سهم)
  cowId: string | null;  // assigned cow
  requestedParts: PartKey[];
  notes: string;
  createdAt: number;
}

// ===== Distribution Types =====
export interface DistributionResult {
  id: string;
  customerId: string;
  customerName: string;
  cowId: string;
  cowName: string;
  parts: DistributionPartResult[];
  createdAt: number;
}

export interface DistributionPartResult {
  partKey: PartKey;
  label: string;
  received: boolean;
  weight?: number;
  note?: string;        // e.g. "from cow 2" for crossover
  delivered?: boolean;  // true if physically delivered to customer
  readiness: 'not_ready' | 'preparing' | 'ready';
}

export interface Warning {
  type: 'shortage' | 'surplus' | 'conflict';
  partKey?: PartKey;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

// ===== Navigation Types =====
export type RootStackParamList = {
  Dashboard: undefined;
  Customers: undefined;
  CustomerForm: { customerId?: string };
  Cows: undefined;
  CowForm: { cowId?: string };
  Distribution: undefined;
  Results: undefined;
  CowDetail: { cowId: string };
  CustomerDetail: { customerId: string };
};
