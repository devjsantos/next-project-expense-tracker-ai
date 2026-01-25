'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

/* ================= TYPES ================= */

type AlertType = 'warning' | 'info' | 'success';

interface Alert {
  type: AlertType;
  message: string;
}

interface Result {
  data?: unknown;
  error?: string;
  alerts?: Alert[];
}

interface BudgetAllocation {
  id: string;
  category: string;
  amount: number;
  budgetId: string;
}

/* ============== ACTION ================= */

export default async function updateRecord(payload: {
  id: string;
  text: string;
  amount: number;
  category: string;
  date: string;
}): Promise<Result> {
  const { id, text, amount, category, date } = payload;

  const { userId } = await auth();
  if (!userId) return { error: 'User not found' };

  const validCategories = [
    'Food',
    'Transportation',
    'Entertainment',
    'Shopping',
    'Bills',
    'Healthcare',
    'Other',
  ];

  if (!validCategories.includes(category)) {
    return { error: 'Invalid category' };
  }

  if (!Number.isFinite(amount) || amount < 0) {
    return { error: 'Invalid amount' };
  }

  try {
    const existing = await db.records.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return { error: 'Record not found' };
    }

    const updated = await db.records.update({
      where: { id },
      data: { text, amount, category, date },
    });

    const dateObj = new Date(date);
    const monthStart = new Date(
      Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), 1)
    );
    const monthEnd = new Date(
      Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth() + 1, 1)
    );

    const budget = await db.budget.findFirst({
      where: { userId, monthStart },
      include: {
        allocations: true,
        user: true,
      },
    });

    const alerts: Alert[] = [];

    if (budget) {
      const totals = await db.records.aggregate({
        where: {
          userId,
          date: { gte: monthStart, lt: monthEnd },
          NOT: { id },
        },
        _sum: { amount: true },
      });

      const currentTotal = totals._sum.amount ?? 0;
      const newTotal = currentTotal + amount;

      if (budget.monthlyTotal > 0) {
        const prevTotals = await db.records.aggregate({
          where: {
            userId,
            date: { gte: monthStart, lt: monthEnd },
            NOT: { id },
          },
          _sum: { amount: true },
        });

        const prevTotal = prevTotals._sum.amount ?? 0;
        const p70 = budget.monthlyTotal * 0.7;
        const p90 = budget.monthlyTotal * 0.9;

        if (newTotal > budget.monthlyTotal) {
          alerts.push({
            type: 'warning',
            message: `Monthly budget exceeded: ${newTotal.toFixed(
              2
            )} / ${budget.monthlyTotal.toFixed(2)}`,
          });
        } else if (prevTotal < p90 && newTotal >= p90) {
          alerts.push({
            type: 'info',
            message: `You've reached 90% of your monthly budget: ${newTotal.toFixed(
              2
            )} / ${budget.monthlyTotal.toFixed(2)}`,
          });
        } else if (prevTotal < p70 && newTotal >= p70) {
          alerts.push({
            type: 'info',
            message: `You've reached 70% of your monthly budget: ${newTotal.toFixed(
              2
            )} / ${budget.monthlyTotal.toFixed(2)}`,
          });
        }
      }

      /* ===== CATEGORY ALLOCATION CHECK (FIXED) ===== */

      const alloc = (budget.allocations as BudgetAllocation[]).find(
        allocation => allocation.category === category
      );

      if (alloc && alloc.amount > 0) {
        const catTotals = await db.records.aggregate({
          where: {
            userId,
            category,
            date: { gte: monthStart, lt: monthEnd },
            NOT: { id },
          },
          _sum: { amount: true },
        });

        const currentCatTotal = catTotals._sum.amount ?? 0;
        const newCatTotal = currentCatTotal + amount;

        if (newCatTotal > alloc.amount) {
          alerts.push({
            type: 'warning',
            message: `Category '${category}' budget exceeded: ${newCatTotal.toFixed(
              2
            )} / ${alloc.amount.toFixed(2)}`,
          });
        } else if (newCatTotal > alloc.amount * 0.9) {
          alerts.push({
            type: 'info',
            message: `Approaching '${category}' allocation: ${newCatTotal.toFixed(
              2
            )} / ${alloc.amount.toFixed(2)}`,
          });
        }
      }
    }

    if (alerts.length) {
      try {
        const { default: createNotification } = await import(
          '@/app/actions/createNotification'
        );
        await createNotification(
          userId,
          'warning',
          'Budget alert',
          alerts.map(a => a.message).join('\n')
        );
      } catch (err) {
        console.error('Failed to persist notification:', err);
      }
    }

    revalidatePath('/');
    return { data: updated, alerts };
  } catch (err) {
    console.error('Error updating record', err);
    return { error: 'Database error' };
  }
}
