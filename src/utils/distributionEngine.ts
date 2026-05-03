import { Customer, Cow, DistributionResult, DistributionPartResult, Warning, PartKey } from '../types';
import { PARTS, PARTS_MAP } from '../constants/parts';
import { getCowPartWeights } from '../database/database';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

/**
 * Main distribution function
 * Takes customers (with their cow assignments) and cows,
 * and distributes parts based on requests.
 * "Crossover" is now the normal behavior for all parts.
 */
export async function runDistribution(
  customers: Customer[],
  cows: Cow[]
): Promise<{ results: DistributionResult[]; warnings: Warning[] }> {
  const warnings: Warning[] = [];
  const results: DistributionResult[] = [];

  // 1. Initialize capacities and weights for all cows
  // cowId -> partKey -> remainingCount
  const cowCapacities = new Map<string, Map<PartKey, number>>();
  const cowWeights = new Map<string, Record<string, number>>();

  for (const cow of cows) {
    const capacities = new Map<PartKey, number>();
    for (const part of PARTS) {
      capacities.set(part.key, part.perCow);
    }
    cowCapacities.set(cow.id, capacities);
    
    const weights = await getCowPartWeights(cow.id);
    cowWeights.set(cow.id, weights);
  }

  // 2. Group customers by their assigned cow
  const customersByCow = new Map<string, Customer[]>();
  for (const customer of customers) {
    if (!customer.cowId) continue;
    const list = customersByCow.get(customer.cowId) || [];
    list.push(customer);
    customersByCow.set(customer.cowId, list);
  }

  // 3. Process customers cow by cow
  for (const cow of cows) {
    const cowCustomers = customersByCow.get(cow.id) || [];
    
    for (const customer of cowCustomers) {
      const partResults: DistributionPartResult[] = [];

      for (const partKey of customer.requestedParts) {
        const partRule = PARTS_MAP[partKey];
        if (!partRule) continue;

        // A. Try current cow first
        const assignedCapacities = cowCapacities.get(cow.id)!;
        const remainingInAssigned = assignedCapacities.get(partKey) || 0;

        if (remainingInAssigned > 0) {
          assignedCapacities.set(partKey, remainingInAssigned - 1);
          
          // Weight division logic for shared parts (like meat/liver)
          const requestersInCow = cowCustomers.filter(c => c.requestedParts.includes(partKey)).length;
          const shareDivisor = partRule.perCow > 1 ? Math.min(partRule.perCow, requestersInCow) : 1;

          partResults.push({
            partKey,
            label: partRule.label,
            received: true,
            weight: cowWeights.get(cow.id)?.[partKey] 
              ? Number((cowWeights.get(cow.id)![partKey] / shareDivisor).toFixed(2))
              : undefined,
          });
        } else {
          // B. "Normally" look in other cows (Crossover)
          let foundInCrossover = false;
          for (const otherCow of cows) {
            if (otherCow.id === cow.id) continue;
            
            const otherCapacities = cowCapacities.get(otherCow.id)!;
            const remainingInOther = otherCapacities.get(partKey) || 0;

            if (remainingInOther > 0) {
              otherCapacities.set(partKey, remainingInOther - 1);
              foundInCrossover = true;
              
              partResults.push({
                partKey,
                label: partRule.label,
                received: true,
                weight: cowWeights.get(otherCow.id)?.[partKey],
                note: `من ${otherCow.name}`,
              });
              break;
            }
          }

          if (!foundInCrossover) {
            partResults.push({
              partKey,
              label: partRule.label,
              received: false,
              note: 'غير متاح في كل الأبقار',
            });

            warnings.push({
              type: 'shortage',
              partKey,
              message: `نقص في ${partRule.label}: غير متوفر للمشترك ${customer.name} في أي بقرة`,
              severity: 'high',
            });
          }
        }
      }

      results.push({
        id: generateId(),
        customerId: customer.id,
        customerName: customer.name,
        cowId: cow.id,
        cowName: cow.name,
        parts: partResults,
        createdAt: Date.now(),
      });
    }
  }

  // Check for unassigned customers
  const unassigned = customers.filter(c => !c.cowId);
  if (unassigned.length > 0) {
    warnings.push({
      type: 'conflict',
      message: `${unassigned.length} مشتركين بدون بقرة مخصصة`,
      severity: 'high',
    });
  }

  return { results, warnings: deduplicateWarnings(warnings) };
}

/**
 * Remove duplicate warnings
 */
function deduplicateWarnings(warnings: Warning[]): Warning[] {
  const seen = new Set<string>();
  return warnings.filter(w => {
    const key = `${w.type}-${w.partKey || ''}-${w.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Check for potential issues before running distribution
 */
export function preCheckWarnings(customers: Customer[], cows: Cow[]): Warning[] {
  const warnings: Warning[] = [];

  if (customers.length === 0) {
    warnings.push({ type: 'conflict', message: 'لا يوجد مشتركين', severity: 'high' });
  }
  if (cows.length === 0) {
    warnings.push({ type: 'conflict', message: 'لا يوجد أبقار', severity: 'high' });
  }

  const unassigned = customers.filter(c => !c.cowId);
  if (unassigned.length > 0) {
    warnings.push({ type: 'conflict', message: `${unassigned.length} مشتركين بدون بقرة مخصصة`, severity: 'high' });
  }

  // Check global herd capacity
  const globalCapacity = new Map<PartKey, number>();
  for (const part of PARTS) {
    globalCapacity.set(part.key, cows.length * part.perCow);
  }

  const globalDemand = new Map<PartKey, number>();
  for (const customer of customers) {
    for (const partKey of customer.requestedParts) {
      globalDemand.set(partKey, (globalDemand.get(partKey) || 0) + 1);
    }
  }

  globalDemand.forEach((demand, partKey) => {
    const capacity = globalCapacity.get(partKey) || 0;
    if (demand > capacity) {
      warnings.push({
        type: 'shortage',
        partKey,
        message: `عجز عالمي في ${PARTS_MAP[partKey].label}: مطلوب ${demand} والمتاح في كل الأبقار ${capacity}`,
        severity: 'high',
      });
    }
  });

  return deduplicateWarnings(warnings);
}
