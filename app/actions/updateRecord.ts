'use server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

type Result = { data?: unknown; error?: string; alerts?: { type: 'warning'|'info'|'success'; message: string }[] };

export default async function updateRecord(payload: { id: string; text: string; amount: number; category: string; date: string; }): Promise<Result> {
  const { id, text, amount, category, date } = payload;
  const { userId } = await auth();
  if (!userId) return { error: 'User not found' };

  // validation
  const validCategories = ['Food','Transportation','Entertainment','Shopping','Bills','Healthcare','Other'];
  if (!validCategories.includes(category)) return { error: 'Invalid category' };
  if (!Number.isFinite(amount) || amount < 0) return { error: 'Invalid amount' };

  try {
    // find existing record
    const existing = await db.records.findFirst({ where: { id, userId } });
    if (!existing) return { error: 'Record not found' };

    // update
    const updated = await db.records.update({ where: { id }, data: { text, amount, category, date } });

    // Recalculate budgets similar to addExpenseRecord
    const dateObj = new Date(date);
    const monthStart = new Date(Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), 1, 0, 0, 0));
    const monthEnd = new Date(Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth() + 1, 1, 0, 0, 0));

    const budget = await db.budget.findFirst({ where: { userId, monthStart }, include: { allocations: true, user: true } });

    const alerts: { type: 'warning'|'info'|'success'; message: string }[] = [];

    if (budget) {
      // compute total excluding this record
      const totals = await db.records.aggregate({
        where: { userId, date: { gte: monthStart, lt: monthEnd }, NOT: { id } },
        _sum: { amount: true },
      });
      const currentTotalExcluding = totals._sum.amount || 0;
      const newTotal = currentTotalExcluding + amount;

      // explicit thresholds: 70% warning, 90% critical, >100% over-budget
      if (budget.monthlyTotal > 0) {
        const prevTotals = await db.records.aggregate({ where: { userId, date: { gte: monthStart, lt: monthEnd }, NOT: { id } }, _sum: { amount: true } });
        const prevTotal = prevTotals._sum.amount || 0;
        const total = newTotal;
        const p70 = budget.monthlyTotal * 0.7;
        const p90 = budget.monthlyTotal * 0.9;

        if (total > budget.monthlyTotal) {
          alerts.push({ type: 'warning', message: `Monthly budget exceeded: ${total.toFixed(2)} / ${budget.monthlyTotal.toFixed(2)}` });
          try { const { default: createNotification } = await import('@/app/actions/createNotification'); await createNotification(userId, 'critical', 'Budget exceeded', `Monthly budget exceeded: ${total.toFixed(2)} / ${budget.monthlyTotal.toFixed(2)}`); } catch (e) { console.error('Failed to persist notification for updateRecord:', e); }
        } else if (prevTotal < p90 && total >= p90) {
          alerts.push({ type: 'info', message: `You've reached 90% of your monthly budget: ${total.toFixed(2)} / ${budget.monthlyTotal.toFixed(2)}` });
          try { const { default: createNotification } = await import('@/app/actions/createNotification'); await createNotification(userId, 'critical', 'Budget 90% used', `You've reached 90% of your monthly budget: ${total.toFixed(2)} / ${budget.monthlyTotal.toFixed(2)}`); } catch (e) { console.error('Failed to persist notification for updateRecord:', e); }
        } else if (prevTotal < p70 && total >= p70) {
          alerts.push({ type: 'info', message: `You've reached 70% of your monthly budget: ${total.toFixed(2)} / ${budget.monthlyTotal.toFixed(2)}` });
          try { const { default: createNotification } = await import('@/app/actions/createNotification'); await createNotification(userId, 'warning', 'Budget 70% used', `You've reached 70% of your monthly budget: ${total.toFixed(2)} / ${budget.monthlyTotal.toFixed(2)}`); } catch (e) { console.error('Failed to persist notification for updateRecord:', e); }
        }
      }

      // per-category allocation check
      const alloc = budget.allocations.find((a: any) => a.category === category);
      if (alloc && alloc.amount > 0) {
        const catTotals = await db.records.aggregate({
          where: { userId, category, date: { gte: monthStart, lt: monthEnd }, NOT: { id } },
          _sum: { amount: true },
        });
        const currentCatTotal = catTotals._sum.amount || 0;
        const newCatTotal = currentCatTotal + amount;

        if (newCatTotal > alloc.amount) {
          alerts.push({ type: 'warning', message: `Category '${category}' budget exceeded: ${newCatTotal.toFixed(2)} / ${alloc.amount.toFixed(2)}` });
        } else if (newCatTotal > alloc.amount * 0.9) {
          alerts.push({ type: 'info', message: `Approaching '${category}' allocation: ${newCatTotal.toFixed(2)} / ${alloc.amount.toFixed(2)}` });
        }
      }
    }

    // persist in-app notification(s) if alerts were generated
    if (alerts.length) {
      try {
        const { default: createNotification } = await import('@/app/actions/createNotification');
        const message = alerts.map(a => a.message).join('\n');
        await createNotification(userId, 'warning', 'Budget alert', message);
      } catch (err) {
        console.error('Failed to persist notification for updateRecord:', err);
      }
    }

    revalidatePath('/');
    return { data: updated, alerts };
  } catch (e) {
    console.error('Error updating record', e);
    return { error: 'Database error' };
  }
}
