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

  const month = formData.get('month')?.toString(); // YYYY-MM
  const periodType = formData.get('periodType')?.toString() || 'monthly'; // 'monthly' | 'weekly' | 'custom'
  const periodStartRaw = formData.get('periodStart')?.toString(); // YYYY-MM-DD
  const periodEndRaw = formData.get('periodEnd')?.toString(); // YYYY-MM-DD
  const monthlyTotal = parseFloat(formData.get('monthlyTotal')?.toString() || '0');
  const allocationsJson = formData.get('allocations')?.toString() || '[]';
  const thresholdRaw = formData.get('budgetAlertThreshold')?.toString();

  let budgetAlertThreshold = 0.8; // default to 80%
  if (thresholdRaw) {
    const pct = parseFloat(thresholdRaw);
    if (pct >= 0.5 && pct <= 0.8) budgetAlertThreshold = pct;
  }

  // initialize dates
  let monthStart: Date;
  let periodStart: Date;
  let periodEnd: Date;

  try {
    if (periodType === 'monthly') {
      if (!month) return { error: 'Month is required for monthly budgets' };
      const [year, mon] = month.split('-');
      monthStart = new Date(Date.UTC(parseInt(year), parseInt(mon) - 1, 1, 0, 0, 0));
      periodStart = monthStart;
      periodEnd = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1, 0, 0, 0));
    } else if (periodType === 'weekly') {
      if (!periodStartRaw) return { error: 'Week start date is required for weekly budgets' };
      const [y, m, d] = periodStartRaw.split('-');
      periodStart = new Date(Date.UTC(parseInt(y), parseInt(m) - 1, parseInt(d), 0, 0, 0));
      periodEnd = new Date(periodStart);
      periodEnd.setUTCDate(periodEnd.getUTCDate() + 7);
      monthStart = new Date(Date.UTC(periodStart.getUTCFullYear(), periodStart.getUTCMonth(), 1, 0, 0, 0));
    } else if (periodType === 'custom') {
      if (!periodStartRaw || !periodEndRaw) return { error: 'Start and end dates required for custom budgets' };
      const [ys, ms, ds] = periodStartRaw.split('-');
      const [ye, me, de] = periodEndRaw.split('-');
      periodStart = new Date(Date.UTC(parseInt(ys), parseInt(ms) - 1, parseInt(ds), 0, 0, 0));
      periodEnd = new Date(Date.UTC(parseInt(ye), parseInt(me) - 1, parseInt(de), 23, 59, 59));
      monthStart = new Date(Date.UTC(periodStart.getUTCFullYear(), periodStart.getUTCMonth(), 1, 0, 0, 0));
    } else {
      return { error: 'Invalid period type' };
    }
  } catch {
    return { error: 'Invalid date format' };
  }

  // parse allocations
  let allocations: Allocation[] = [];
  try {
    allocations = JSON.parse(allocationsJson) as Allocation[];
  } catch {
    return { error: 'Invalid allocations' };
  }

  try {
    // Upsert budget for the period (match by userId + monthStart)
    const existing = await db.budget.findFirst({
      where: { userId, monthStart },
    });

    if (existing) {
      // delete old allocations and recreate
      await db.budgetAllocation.deleteMany({ where: { budgetId: existing.id } });
      const updated = await db.budget.update({
        where: { id: existing.id },
        data: {
          monthlyTotal,
          budgetAlertThreshold,
          periodType,
          periodStart,
          periodEnd,
          allocations: { create: allocations },
        },
        include: { allocations: true },
      });
      revalidatePath('/');
      return { budget: updated };
    }

    const created = await db.budget.create({
      data: {
        userId,
        monthlyTotal,
        monthStart,
        periodType,
        periodStart,
        periodEnd,
        budgetAlertThreshold,
        allocations: { create: allocations },
      },
      include: { allocations: true },
    });

    revalidatePath('/');
    return { budget: created };
  } catch (error) {
    console.error('Error setting budget:', error);
    return { error: 'Database error' };
  }
}

export default setMonthlyBudget;
