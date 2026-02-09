'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

interface Allocation {
  category: string;
  amount: number;
}

async function setMonthlyBudget(formData: FormData) {
  const { userId } = await auth();
  if (!userId) return { error: 'User not found' };

  // 1. Extract and Parse Data
  const month = formData.get('month')?.toString(); // YYYY-MM
  const periodType = formData.get('periodType')?.toString() || 'monthly';
  const periodStartRaw = formData.get('periodStart')?.toString(); // YYYY-MM-DD
  const periodEndRaw = formData.get('periodEnd')?.toString(); // YYYY-MM-DD
  const monthlyTotal = parseFloat(formData.get('monthlyTotal')?.toString() || '0');
  const allocationsJson = formData.get('allocations')?.toString() || '[]';
  const thresholdRaw = formData.get('budgetAlertThreshold')?.toString();

  // Handle threshold range safety
  let budgetAlertThreshold = 0.8;
  if (thresholdRaw) {
    const pct = parseFloat(thresholdRaw);
    if (pct >= 0.5 && pct <= 0.8) budgetAlertThreshold = pct;
  }

  // 2. Date Logic Initialization
  let monthStart: Date;
  let periodStart: Date;
  let periodEnd: Date;

  try {
    if (periodType === 'monthly') {
      if (!month) return { error: 'Month is required for monthly budgets' };
      const [year, mon] = month.split('-');
      // Use UTC to ensure consistency across server/client
      monthStart = new Date(Date.UTC(parseInt(year), parseInt(mon) - 1, 1, 0, 0, 0));
      periodStart = monthStart;
      periodEnd = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1, 0, 0, 0));
    } else if (periodType === 'weekly') {
      if (!periodStartRaw) return { error: 'Week start date is required' };
      const [y, m, d] = periodStartRaw.split('-');
      periodStart = new Date(Date.UTC(parseInt(y), parseInt(m) - 1, parseInt(d), 0, 0, 0));
      periodEnd = new Date(periodStart);
      periodEnd.setUTCDate(periodEnd.getUTCDate() + 7);
      monthStart = new Date(Date.UTC(periodStart.getUTCFullYear(), periodStart.getUTCMonth(), 1, 0, 0, 0));
    } else if (periodType === 'custom') {
      if (!periodStartRaw || !periodEndRaw) return { error: 'Dates required for custom budgets' };
      const [ys, ms, ds] = periodStartRaw.split('-');
      const [ye, me, de] = periodEndRaw.split('-');
      periodStart = new Date(Date.UTC(parseInt(ys), parseInt(ms) - 1, parseInt(ds), 0, 0, 0));
      periodEnd = new Date(Date.UTC(parseInt(ye), parseInt(me) - 1, parseInt(de), 23, 59, 59));
      monthStart = new Date(Date.UTC(periodStart.getUTCFullYear(), periodStart.getUTCMonth(), 1, 0, 0, 0));
    } else {
      return { error: 'Invalid period type' };
    }
  } catch {
    return { error: 'Invalid date format provided' };
  }

  // 3. Parse Allocations
  let allocations: Allocation[] = [];
  try {
    allocations = JSON.parse(allocationsJson) as Allocation[];
    // Ensure all amounts are rounded to 2 decimal places for database consistency
    allocations = allocations.map(a => ({
      category: a.category,
      amount: Number(a.amount.toFixed(2))
    }));
  } catch {
    return { error: 'Invalid allocations format' };
  }

  // 4. Database Operations (using Transaction for Upsert)
  try {
    const result = await db.$transaction(async (tx) => {
      // Check for existing budget for this specific month/user
      const existing = await tx.budget.findFirst({
        where: { userId, monthStart },
      });

      if (existing) {
        // Clear previous allocations to avoid duplicates or orphaned categories
        await tx.budgetAllocation.deleteMany({
          where: { budgetId: existing.id }
        });

        // Update the main budget record
        return await tx.budget.update({
          where: { id: existing.id },
          data: {
            monthlyTotal,
            budgetAlertThreshold,
            periodType,
            periodStart,
            periodEnd,
            allocations: {
              create: allocations
            }
          },
          include: { allocations: true }
        });
      } else {
        // Create brand new budget
        return await tx.budget.create({
          data: {
            userId,
            monthlyTotal,
            monthStart,
            periodType,
            periodStart,
            periodEnd,
            budgetAlertThreshold,
            allocations: {
              create: allocations
            }
          },
          include: { allocations: true }
        });
      }
    });

    revalidatePath('/');
    revalidatePath('/dashboard');
    return { budget: result };

  } catch (error) {
    console.error('Error setting budget:', error);
    return { error: 'Failed to save budget settings to database' };
  }
}

export default setMonthlyBudget;