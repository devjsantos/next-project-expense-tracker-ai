"use server";

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/prisma';

type UpcomingItem = {
  id: string;
  text: string;
  amount: number;
  category: string;
  date: string; // ISO
};

function addInterval(date: Date, frequency: string) {
  const d = new Date(date);
  switch (frequency) {
    case 'daily':
      d.setUTCDate(d.getUTCDate() + 1);
      break;
    case 'weekly':
      d.setUTCDate(d.getUTCDate() + 7);
      break;
    case 'monthly':
      d.setUTCMonth(d.getUTCMonth() + 1);
      break;
    case 'yearly':
      d.setUTCFullYear(d.getUTCFullYear() + 1);
      break;
    default:
      d.setUTCMonth(d.getUTCMonth() + 1);
  }
  return d;
}

export async function getForecast(month?: string) {
  const { userId } = await auth();
  if (!userId) return { error: 'User not authenticated' };

  const now = new Date();
  let monthStart: Date;
  if (!month) {
    monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  } else {
    const [y, m] = month.split('-');
    monthStart = new Date(Date.UTC(parseInt(y), parseInt(m) - 1, 1, 0, 0, 0));
  }
  const monthEnd = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1, 0, 0, 0));

  try {
    const budget = await db.budget.findFirst({ where: { userId, monthStart }, include: { allocations: true } });

    const totals = await db.records.aggregate({
      where: { userId, date: { gte: monthStart, lt: monthEnd } },
      _sum: { amount: true },
    });
    const totalSpent = totals._sum.amount || 0;
    const monthlyTotal = budget?.monthlyTotal || 0;

    // Compute upcoming recurring commitments for the rest of the month
    let recs: any[] = [];
    try {
      // prefer to filter by active when available
      recs = await db.recurringExpense.findMany({ where: { userId, active: true } });
    } catch (e) {
      // fallback for databases that haven't been migrated yet
      console.warn('Fallback: recurringExpense.active column missing or inaccessible, loading all recurrences');
      try {
        recs = await db.recurringExpense.findMany({ where: { userId } });
      } catch (err) {
        console.error('Failed loading recurring expenses fallback', err);
        recs = [];
      }
    }

    let upcomingRecurringTotal = 0;
    const upcomingList: UpcomingItem[] = [];

    const windowEnd = new Date(monthEnd);
    const windowStart = now;
    const next7 = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 7, 23, 59, 59));

    for (const r of recs) {
      // use nextDueDate if present, otherwise compute from startDate
      // some deployments may not have the new fields in the generated Prisma types yet
      const nextDueDateVal = (r as any).nextDueDate;
      let nextDate = nextDueDateVal ? new Date(nextDueDateVal) : new Date(r.startDate);
      // advance to the first occurrence >= now
      while (nextDate < now) {
        nextDate = addInterval(nextDate, r.frequency);
      }

      // Sum occurrences for the remainder of month
      let occ = new Date(nextDate);
      while (occ < windowEnd) {
        const isVariable = (r as any).isVariable;
        const lastAmount = (r as any).lastAmount;
        const amt = isVariable && lastAmount ? (lastAmount as number) : r.amount;
        // only count occurrences after now
        if (occ >= windowStart) {
          upcomingRecurringTotal += amt;
        }
        occ = addInterval(occ, r.frequency);
      }

      // If there's an occurrence in the next 7 days, add to list
      const nextOcc = new Date(nextDate);
      if (nextOcc >= windowStart && nextOcc <= next7) {
        upcomingList.push({ id: r.id, text: r.text, amount: r.amount, category: r.category || 'Other', date: nextOcc.toISOString() });
      }
    }

    const remainingBudget = monthlyTotal - totalSpent;
    const safeToSpend = remainingBudget - upcomingRecurringTotal;

    return {
      monthlyTotal,
      totalSpent,
      remainingBudget,
      upcomingRecurringTotal,
      safeToSpend,
      upcomingList,
    };
  } catch (e) {
    console.error('Error computing forecast', e);
    return { error: 'Database error' };
  }
}

export default getForecast;
