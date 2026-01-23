'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

interface RecordData {
  text: string;
  amount: number;
  category: string;
  date: string; // Added date field
}

interface RecordResult {
  data?: RecordData;
  error?: string;
  alerts?: { type: 'warning' | 'info' | 'success'; message: string }[];
}

async function addExpenseRecord(formData: FormData): Promise<RecordResult> {
  try {
    // Extract form data
    const textValue = formData.get('text');
    const amountValue = formData.get('amount');
    const categoryValue = formData.get('category');
    const dateValue = formData.get('date');

    // Validate input
    if (!textValue || !amountValue || !categoryValue || !dateValue) {
      return { error: 'Text, amount, category, or date is missing' };
    }



    const text = textValue.toString();
    const amount = parseFloat(amountValue.toString());
    const category = categoryValue.toString();
    const validCategories = ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Other'];

    if (!Number.isFinite(amount) || amount < 0) {
      return { error: 'Invalid amount provided' };
    }

    if (!validCategories.includes(category)) {
      return { error: 'Invalid category' };
    }

    // Parse date to ISO
    let date: string;
    try {
      const [year, month, day] = dateValue.toString().split('-');
      const dateObj = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0));
      date = dateObj.toISOString();
    } catch (err) {
      console.error('Invalid date format:', err);
      return { error: 'Invalid date format' };
    }

    // Get logged-in user
    const { userId } = await auth();
    if (!userId) return { error: 'User not found' };

    // Create new expense record
    const createdRecord = await db.records.create({
      data: { text, amount, category, date, userId },
    });

    // Budget alerts
    const alerts: { type: 'warning' | 'info' | 'success'; message: string }[] = [];

    const dateObj = new Date(date);
    const monthStart = new Date(Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), 1));
    const monthEnd = new Date(Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth() + 1, 1));

    const budget = await db.budget.findFirst({
      where: { userId, monthStart },
      include: { allocations: true, user: true },
    });

    if (budget) {
      // Helper type guard for allocations
      const isAlloc = (x: unknown): x is { category: string; amount: number } =>
        !!x && typeof x === 'object' && 'category' in x && 'amount' in x;

      // Total spent this month excluding the new record
      const totals = await db.records.aggregate({
        where: { userId, date: { gte: monthStart, lt: monthEnd }, NOT: { id: createdRecord.id } },
        _sum: { amount: true },
      });
      const currentTotalExcluding = totals._sum.amount || 0;
      const newTotal = currentTotalExcluding + amount;

      // Monthly budget alerts
      if (budget.monthlyTotal > 0) {
        const prevTotal = currentTotalExcluding;
        const p70 = budget.monthlyTotal * 0.7;
        const p90 = budget.monthlyTotal * 0.9;

        if (newTotal > budget.monthlyTotal) {
          alerts.push({
            type: 'warning',
            message: `Monthly budget exceeded: ${newTotal.toFixed(2)} / ${budget.monthlyTotal.toFixed(2)}`,
          });
        } else if (prevTotal < p90 && newTotal >= p90) {
          alerts.push({
            type: 'warning',
            message: `You've reached 90% of your monthly budget: ${newTotal.toFixed(2)} / ${budget.monthlyTotal.toFixed(2)}`,
          });
        } else if (prevTotal < p70 && newTotal >= p70) {
          alerts.push({
            type: 'info',
            message: `You've reached 70% of your monthly budget: ${newTotal.toFixed(2)} / ${budget.monthlyTotal.toFixed(2)}`,
          });
        }
      }

      // Per-category allocation alerts
      const alloc = budget.allocations.find((a) => isAlloc(a) && a.category === category);
      if (alloc && alloc.amount > 0) {
        const catTotals = await db.records.aggregate({
          where: { userId, category, date: { gte: monthStart, lt: monthEnd }, NOT: { id: createdRecord.id } },
          _sum: { amount: true },
        });
        const newCatTotal = (catTotals._sum.amount || 0) + amount;

        if (newCatTotal > alloc.amount) {
          alerts.push({
            type: 'warning',
            message: `Category '${category}' budget exceeded: ${newCatTotal.toFixed(2)} / ${alloc.amount.toFixed(2)}`,
          });
        } else if (newCatTotal > alloc.amount * 0.9) {
          alerts.push({
            type: 'info',
            message: `Approaching '${category}' allocation: ${newCatTotal.toFixed(2)} / ${alloc.amount.toFixed(2)}`,
          });
        }
      }
    }

    // persist in-app notification(s) if alerts were generated
    if (alerts.length) {
      try {
        const { default: createNotification } = await import('@/app/actions/createNotification');
        const message = alerts.map((a) => a.message).join('\n');
        const severity = alerts.some((a) => a.type === 'warning') ? 'warning' : 'info';
        await createNotification(userId, severity, 'Budget alert', message);
      } catch (err) {
        console.error('Failed to persist notification for addExpenseRecord:', err);
      }
    }

    // Prepare response
    const recordData: RecordData = {
      text: createdRecord.text,
      amount: createdRecord.amount,
      category: createdRecord.category,
      date: createdRecord.date?.toISOString() || date,
    };

    // Revalidate cache
    revalidatePath('/');

    return { data: recordData, alerts };
  } catch (error) {
    console.error('Error adding expense record:', error);
    return { error: 'An unexpected error occurred while adding the expense record.' };
  }
}

export default addExpenseRecord;
