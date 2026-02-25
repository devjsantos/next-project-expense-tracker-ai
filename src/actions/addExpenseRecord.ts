'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { expenseSchema } from '@/lib/validations';

interface RecordData {
  text: string;
  amount: number;
  category: string;
  date: string;
}

interface RecordResult {
  data?: RecordData;
  error?: string;
  alerts?: { type: 'warning' | 'info' | 'success'; message: string }[];
}

async function addExpenseRecord(formData: FormData): Promise<RecordResult> {
  try {
    // 1. Validation using Zod
    const rawData = {
      text: formData.get('text'),
      amount: formData.get('amount'),
      category: formData.get('category'),
      date: formData.get('date'),
    };

    const validatedFields = expenseSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        error: validatedFields.error.flatten().fieldErrors.text?.[0] ||
          validatedFields.error.flatten().fieldErrors.amount?.[0] ||
          'Invalid input data.'
      };
    }

    const { text, amount, category: rawCategory, date: dateString } = validatedFields.data;

    // 2. Auth Check
    const { userId } = await auth();
    if (!userId) return { error: 'User not found. Please sign in again.' };

    // 3. Category Normalization
    const validCategories = ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Other'];
    const matchedCategory = validCategories.find((c) =>
      rawCategory.toLowerCase().includes(c.toLowerCase())
    ) || 'Other';

    // 4. Date Parsing (UTC Midday to prevent timezone shifts)
    const [year, month, day] = dateString.split('-');
    const parsedDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0));
    const isoDate = parsedDate.toISOString();

    // 5. Database Transaction: Create Record
    const createdRecord = await db.records.create({
      data: {
        text,
        amount: Number(amount.toFixed(2)),
        category: matchedCategory,
        date: isoDate,
        userId
      },
    });

    // 6. Budget Logic & Alerts
    const alerts: { type: 'warning' | 'info' | 'success'; message: string }[] = [];
    const monthStart = new Date(Date.UTC(parsedDate.getUTCFullYear(), parsedDate.getUTCMonth(), 1));
    const monthEnd = new Date(Date.UTC(parsedDate.getUTCFullYear(), parsedDate.getUTCMonth() + 1, 1));

    const budget = await db.budget.findFirst({
      where: { userId, monthStart },
      include: { allocations: true },
    });

    if (budget) {
      const totals = await db.records.aggregate({
        where: { userId, date: { gte: monthStart, lt: monthEnd } },
        _sum: { amount: true },
      });

      const totalSpent = totals._sum.amount || 0;
      const effectiveBudget = budget.monthlyTotal + budget.rolloverAmount;

      if (effectiveBudget > 0) {
        const usageRatio = totalSpent / effectiveBudget;

        if (totalSpent > effectiveBudget) {
          alerts.push({
            type: 'warning',
            message: `Budget Exceeded: ₱${totalSpent.toLocaleString()} / ₱${effectiveBudget.toLocaleString()}`,
          });
        } else if (usageRatio >= 0.9) {
          alerts.push({ type: 'warning', message: `Critical: 90% of budget used.` });
        } else if (usageRatio >= budget.budgetAlertThreshold) {
          alerts.push({ type: 'info', message: `${Math.round(budget.budgetAlertThreshold * 100)}% of budget reached.` });
        }
      }

      // Category Specific Alert
      const alloc = budget.allocations.find((a) => a.category === matchedCategory);
      if (alloc && alloc.amount > 0) {
        const catTotals = await db.records.aggregate({
          where: { userId, category: matchedCategory, date: { gte: monthStart, lt: monthEnd } },
          _sum: { amount: true },
        });
        const currentCatTotal = catTotals._sum.amount || 0;
        if (currentCatTotal > alloc.amount) {
          alerts.push({
            type: 'warning',
            message: `Category '${matchedCategory}' limit reached!`,
          });
        }
      }
    }

    // 7. Async Notification Trigger
    if (alerts.length > 0) {
      const { default: createNotification } = await import('@/actions/createNotification');
      // Fire and forget or handle concurrently
      await Promise.all(alerts.map(alert =>
        createNotification(userId, alert.type, 'Budget Update', alert.message)
      ));
    }

    revalidatePath('/');
    return {
      data: {
        text: createdRecord.text,
        amount: createdRecord.amount,
        category: createdRecord.category,
        date: createdRecord.date.toISOString()
      },
      alerts
    };
  } catch (error) {
    console.error('Error in addExpenseRecord:', error);
    return { error: 'Database error. Please try again.' };
  }
}

export default addExpenseRecord;