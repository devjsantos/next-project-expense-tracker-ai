'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

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
    // 1. Extract and Clean Form Data
    const textValue = formData.get('text');
    const amountValue = formData.get('amount');
    const categoryValue = formData.get('category');
    const dateValue = formData.get('date');

    if (!textValue || !amountValue || !categoryValue || !dateValue) {
      return { error: 'Text, amount, category, or date is missing' };
    }

    const text = textValue.toString().trim();
    const amount = parseFloat(amountValue.toString());
    const rawCategory = categoryValue.toString().trim();

    // 2. Validate Amount
    if (!Number.isFinite(amount) || amount < 0) {
      return { error: 'Invalid amount provided' };
    }

    // 3. Standardize Category (Smart Match)
    const validCategories = ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Other'];

    const matchedCategory = validCategories.find((c) =>
      rawCategory.toLowerCase().includes(c.toLowerCase())
    );

    if (!matchedCategory) {
      return { error: `Invalid category: "${rawCategory}". Please select a valid option.` };
    }

    // 4. Parse date to ISO properly
    let isoDate: string;
    try {
      const [year, month, day] = dateValue.toString().split('-');
      // Use UTC to avoid timezone shifts on the server
      const parsedDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0));
      isoDate = parsedDate.toISOString();
    } catch {
      return { error: 'Invalid date format' };
    }

    // 5. Auth Check
    const { userId } = await auth();
    if (!userId) return { error: 'User not found. Please sign in again.' };

    // 6. Create Record in DB
    const createdRecord = await db.records.create({
      data: {
        text,
        amount,
        category: matchedCategory,
        date: isoDate,
        userId
      },
    });

    // 7. Budget Logic & Alerts
    const alerts: { type: 'warning' | 'info' | 'success'; message: string }[] = [];
    const recordDate = new Date(isoDate);
    const monthStart = new Date(Date.UTC(recordDate.getUTCFullYear(), recordDate.getUTCMonth(), 1));
    const monthEnd = new Date(Date.UTC(recordDate.getUTCFullYear(), recordDate.getUTCMonth() + 1, 1));

    const budget = await db.budget.findFirst({
      where: { userId, monthStart },
      include: { allocations: true },
    });

    if (budget) {
      const totals = await db.records.aggregate({
        where: { 
          userId, 
          date: { gte: monthStart, lt: monthEnd }, 
          NOT: { id: createdRecord.id } 
        },
        _sum: { amount: true },
      });

      const currentTotalExcluding = totals._sum.amount || 0;
      const newTotal = currentTotalExcluding + amount;

      // Monthly budget alerts (Now using p70, p90, and Limit)
      if (budget.monthlyTotal > 0) {
        const p70 = budget.monthlyTotal * 0.7;
        const p90 = budget.monthlyTotal * 0.9;

        if (newTotal > budget.monthlyTotal) {
          alerts.push({
            type: 'warning',
            message: `Monthly budget exceeded: ₱${newTotal.toFixed(2)} / ₱${budget.monthlyTotal.toFixed(2)}`,
          });
        } else if (currentTotalExcluding < p90 && newTotal >= p90) {
          alerts.push({
            type: 'warning',
            message: `Critical: You've reached 90% of your monthly budget.`,
          });
        } else if (currentTotalExcluding < p70 && newTotal >= p70) {
          // p70 is now used, resolving the ESLint warning
          alerts.push({
            type: 'info',
            message: `Heads up: You've used 70% of your monthly budget.`,
          });
        }
      }

      // Category specific alerts
      const alloc = budget.allocations.find((a) => a.category === matchedCategory);
      if (alloc && alloc.amount > 0) {
        const catTotals = await db.records.aggregate({
          where: { 
            userId, 
            category: matchedCategory, 
            date: { gte: monthStart, lt: monthEnd }, 
            NOT: { id: createdRecord.id } 
          },
          _sum: { amount: true },
        });
        const newCatTotal = (catTotals._sum.amount || 0) + amount;

        if (newCatTotal > alloc.amount) {
          alerts.push({
            type: 'warning',
            message: `Category '${matchedCategory}' budget exceeded (Limit: ₱${alloc.amount.toFixed(2)}).`,
          });
        }
      }
    }

    // 8. Handle Notifications
    if (alerts.length > 0) {
      try {
        const { default: createNotification } = await import('@/app/actions/createNotification');
        const alertMsg = alerts.map((a) => a.message).join('\n');
        const alertSeverity = alerts.some((a) => a.type === 'warning') ? 'warning' : 'info';
        await createNotification(userId, alertSeverity, 'Budget Alert', alertMsg);
      } catch (e) {
        console.error("Notification failed", e);
      }
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