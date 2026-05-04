import * as SQLite from 'expo-sqlite';

const DB_NAME = 'eid_adha.db';

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const database = await SQLite.openDatabaseAsync(DB_NAME);
      await initializeDatabase(database);
      db = database;
      return database;
    } catch (error) {
      initPromise = null; // Reset for retry
      throw error;
    }
  })();

  return initPromise;
}

async function initializeDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync('PRAGMA journal_mode = WAL;');
  await database.execAsync('PRAGMA foreign_keys = ON;');

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS cows (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      totalShares INTEGER NOT NULL DEFAULT 7,
      takenShares INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'available',
      createdAt INTEGER NOT NULL
    );
  `);

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      shares INTEGER NOT NULL DEFAULT 1,
      cowId TEXT,
      notes TEXT NOT NULL DEFAULT '',
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (cowId) REFERENCES cows(id) ON DELETE SET NULL
    );
  `);

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS customer_parts (
      customerId TEXT NOT NULL,
      partKey TEXT NOT NULL,
      PRIMARY KEY (customerId, partKey),
      FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE
    );
  `);

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS cow_part_weights (
      cowId TEXT NOT NULL,
      partKey TEXT NOT NULL,
      weight REAL,
      readiness TEXT NOT NULL DEFAULT 'ready',
      PRIMARY KEY (cowId, partKey),
      FOREIGN KEY (cowId) REFERENCES cows(id) ON DELETE CASCADE
    );
  `);

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS distribution_results (
      id TEXT PRIMARY KEY NOT NULL,
      customerId TEXT NOT NULL,
      customerName TEXT NOT NULL,
      cowId TEXT NOT NULL,
      cowName TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (cowId) REFERENCES cows(id) ON DELETE CASCADE
    );
  `);

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS distribution_parts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      distributionId TEXT NOT NULL,
      partKey TEXT NOT NULL,
      label TEXT NOT NULL,
      received INTEGER NOT NULL DEFAULT 0,
      weight REAL,
      note TEXT,
      delivered INTEGER NOT NULL DEFAULT 0,
      readiness TEXT NOT NULL DEFAULT 'ready',
      FOREIGN KEY (distributionId) REFERENCES distribution_results(id) ON DELETE CASCADE
    );
  `);

  try {
    await database.execAsync('ALTER TABLE cow_part_weights ADD COLUMN readiness TEXT NOT NULL DEFAULT "ready";');
  } catch (e) {}

  try {
    await database.execAsync('ALTER TABLE distribution_parts ADD COLUMN readiness TEXT NOT NULL DEFAULT "ready";');
  } catch (e) {}

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);
}

// ===== COW OPERATIONS =====
export async function getAllCows(): Promise<any[]> {
  const database = await getDatabase();
  return database.getAllAsync('SELECT * FROM cows ORDER BY createdAt DESC');
}

export async function getCowById(id: string): Promise<any | null> {
  const database = await getDatabase();
  return database.getFirstAsync('SELECT * FROM cows WHERE id = ?', id);
}

export async function insertCow(cow: {
  id: string;
  name: string;
  totalShares: number;
  takenShares: number;
  status: string;
  createdAt: number;
}): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'INSERT INTO cows (id, name, totalShares, takenShares, status, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
    cow.id,
    cow.name,
    cow.totalShares,
    cow.takenShares,
    cow.status,
    cow.createdAt
  );
}

export async function updateCow(cow: {
  id: string;
  name: string;
  totalShares: number;
  takenShares: number;
  status: string;
}): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE cows SET name = ?, totalShares = ?, takenShares = ?, status = ? WHERE id = ?',
    cow.name,
    cow.totalShares,
    cow.takenShares,
    cow.status,
    cow.id
  );
}

export async function deleteCow(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM cows WHERE id = ?', id);
}

// ===== COW PART DATA (Weights & Readiness) =====
export async function setCowPartData(
  cowId: string, 
  partKey: string, 
  data: { weight: number | null; readiness: string }
): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'INSERT OR REPLACE INTO cow_part_weights (cowId, partKey, weight, readiness) VALUES (?, ?, ?, ?)',
    cowId,
    partKey,
    data.weight,
    data.readiness
  );
}

export async function getCowPartData(cowId: string): Promise<Record<string, { weight: number; readiness: 'not_ready' | 'preparing' | 'ready' }>> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{ partKey: string; weight: number; readiness: 'not_ready' | 'preparing' | 'ready' }>(
    'SELECT partKey, weight, readiness FROM cow_part_weights WHERE cowId = ?',
    cowId
  );
  const data: Record<string, { weight: number; readiness: 'not_ready' | 'preparing' | 'ready' }> = {};
  for (const row of rows) {
    data[row.partKey] = { weight: row.weight, readiness: row.readiness };
  }
  return data;
}

// ===== CUSTOMER OPERATIONS =====
export async function getAllCustomers(): Promise<any[]> {
  const database = await getDatabase();
  return database.getAllAsync('SELECT * FROM customers ORDER BY createdAt DESC');
}

export async function getCustomerById(id: string): Promise<any | null> {
  const database = await getDatabase();
  return database.getFirstAsync('SELECT * FROM customers WHERE id = ?', id);
}

export async function getCustomersByCowId(cowId: string): Promise<any[]> {
  const database = await getDatabase();
  return database.getAllAsync('SELECT * FROM customers WHERE cowId = ?', cowId);
}

export async function insertCustomer(customer: {
  id: string;
  name: string;
  phone: string;
  address: string;
  shares: number;
  cowId: string | null;
  notes: string;
  createdAt: number;
}): Promise<void> {
  const database = await getDatabase();
  await database.withTransactionAsync(async () => {
    await database.runAsync(
      'INSERT INTO customers (id, name, phone, address, shares, cowId, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      customer.id,
      customer.name,
      customer.phone,
      customer.address,
      customer.shares,
      customer.cowId,
      customer.notes,
      customer.createdAt
    );
  });
}

export async function updateCustomer(customer: {
  id: string;
  name: string;
  phone: string;
  address: string;
  shares: number;
  cowId: string | null;
  notes: string;
}): Promise<void> {
  const database = await getDatabase();
  await database.withTransactionAsync(async () => {
    await database.runAsync(
      'UPDATE customers SET name = ?, phone = ?, address = ?, shares = ?, cowId = ?, notes = ? WHERE id = ?',
      customer.name,
      customer.phone,
      customer.address,
      customer.shares,
      customer.cowId,
      customer.notes,
      customer.id
    );
  });
}

export async function deleteCustomer(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM customers WHERE id = ?', id);
}

// ===== CUSTOMER PARTS =====
export async function getCustomerParts(customerId: string): Promise<string[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{ partKey: string }>(
    'SELECT partKey FROM customer_parts WHERE customerId = ?',
    customerId
  );
  return rows.map(r => r.partKey);
}

export async function setCustomerParts(customerId: string, parts: string[]): Promise<void> {
  const database = await getDatabase();
  await database.withTransactionAsync(async () => {
    await database.runAsync('DELETE FROM customer_parts WHERE customerId = ?', customerId);
    for (const partKey of parts) {
      await database.runAsync(
        'INSERT INTO customer_parts (customerId, partKey) VALUES (?, ?)',
        customerId,
        partKey
      );
    }
  });
}

// ===== DISTRIBUTION RESULTS =====
export async function getAllDistributionResults(): Promise<any[]> {
  const database = await getDatabase();
  return database.getAllAsync('SELECT * FROM distribution_results ORDER BY createdAt DESC');
}

export async function getDistributionParts(distributionId: string): Promise<any[]> {
  const database = await getDatabase();
  return database.getAllAsync(
    'SELECT * FROM distribution_parts WHERE distributionId = ?',
    distributionId
  );
}

export async function insertDistributionResult(result: {
  id: string;
  customerId: string;
  customerName: string;
  cowId: string;
  cowName: string;
  createdAt: number;
  parts: Array<{
    partKey: string;
    label: string;
    received: boolean;
    weight?: number;
    note?: string;
    delivered?: boolean;
    readiness: string;
  }>;
}): Promise<void> {
  const database = await getDatabase();
  await database.withTransactionAsync(async () => {
    await database.runAsync(
      'INSERT INTO distribution_results (id, customerId, customerName, cowId, cowName, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      result.id,
      result.customerId,
      result.customerName,
      result.cowId,
      result.cowName,
      result.createdAt
    );
    for (const part of result.parts) {
      await database.runAsync(
        'INSERT INTO distribution_parts (distributionId, partKey, label, received, weight, note, delivered, readiness) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        result.id,
        part.partKey,
        part.label,
        part.received ? 1 : 0,
        part.weight ?? null,
        part.note ?? null,
        part.delivered ? 1 : 0,
        part.readiness
      );
    }
  });
}

export async function togglePartDelivery(distributionId: string, partKey: string, delivered: boolean): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE distribution_parts SET delivered = ? WHERE distributionId = ? AND partKey = ?',
    delivered ? 1 : 0,
    distributionId,
    partKey
  );
}

export async function updatePartReadiness(cowId: string, partKey: string, readiness: string): Promise<void> {
  const database = await getDatabase();
  // Update in cow weights/data table
  await database.runAsync(
    'UPDATE cow_part_weights SET readiness = ? WHERE cowId = ? AND partKey = ?',
    readiness,
    cowId,
    partKey
  );
  // Update in all distribution results for this cow
  await database.runAsync(
    'UPDATE distribution_parts SET readiness = ? WHERE partKey = ? AND distributionId IN (SELECT id FROM distribution_results WHERE cowId = ?)',
    readiness,
    partKey,
    cowId
  );
}

export async function clearAllDistributionResults(): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM distribution_parts');
  await database.runAsync('DELETE FROM distribution_results');
}

// ===== SETTINGS =====
export async function getSetting(key: string): Promise<string | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', key);
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    key,
    value
  );
}

// ===== EXPORT / IMPORT =====
export async function exportAllData(): Promise<string> {
  const database = await getDatabase();
  const cows = await database.getAllAsync('SELECT * FROM cows');
  const customers = await database.getAllAsync('SELECT * FROM customers');
  const customerParts = await database.getAllAsync('SELECT * FROM customer_parts');
  const cowPartWeights = await database.getAllAsync('SELECT * FROM cow_part_weights');
  const distributionResults = await database.getAllAsync('SELECT * FROM distribution_results');
  const distributionParts = await database.getAllAsync('SELECT * FROM distribution_parts');
  
  return JSON.stringify({
    version: 1,
    exportDate: new Date().toISOString(),
    data: {
      cows,
      customers,
      customerParts,
      cowPartWeights,
      distributionResults,
      distributionParts,
    },
  }, null, 2);
}

export async function importAllData(jsonString: string): Promise<void> {
  const database = await getDatabase();
  const { data } = JSON.parse(jsonString);
  
  // Clear existing data
  await database.execAsync('DELETE FROM distribution_parts;');
  await database.execAsync('DELETE FROM distribution_results;');
  await database.execAsync('DELETE FROM cow_part_weights;');
  await database.execAsync('DELETE FROM customer_parts;');
  await database.execAsync('DELETE FROM customers;');
  await database.execAsync('DELETE FROM cows;');
  
  // Import cows
  for (const cow of data.cows) {
    await database.runAsync(
      'INSERT INTO cows (id, name, totalShares, takenShares, status, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      [cow.id, cow.name, cow.totalShares, cow.takenShares, cow.status, cow.createdAt]
    );
  }
  
  // Import customers
  for (const c of data.customers) {
    await database.runAsync(
      'INSERT INTO customers (id, name, phone, address, shares, cowId, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [c.id, c.name, c.phone, c.address, c.shares, c.cowId, c.notes, c.createdAt]
    );
  }
  
  // Import customer parts
  for (const cp of data.customerParts) {
    await database.runAsync(
      'INSERT INTO customer_parts (customerId, partKey) VALUES (?, ?)',
      [cp.customerId, cp.partKey]
    );
  }
  
  // Import cow part weights
  for (const w of data.cowPartWeights) {
    await database.runAsync(
      'INSERT INTO cow_part_weights (cowId, partKey, weight) VALUES (?, ?, ?)',
      [w.cowId, w.partKey, w.weight]
    );
  }
  
  // Import distribution results
  for (const dr of data.distributionResults) {
    await database.runAsync(
      'INSERT INTO distribution_results (id, customerId, customerName, cowId, cowName, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      [dr.id, dr.customerId, dr.customerName, dr.cowId, dr.cowName, dr.createdAt]
    );
  }
  
  // Import distribution parts
  for (const dp of data.distributionParts) {
    await database.runAsync(
      'INSERT INTO distribution_parts (distributionId, partKey, label, received, weight, note) VALUES (?, ?, ?, ?, ?, ?)',
      [dp.distributionId, dp.partKey, dp.label, dp.received, dp.weight, dp.note]
    );
  }
}
