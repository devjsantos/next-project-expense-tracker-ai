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
  const textValue = formData.get('text');
  const amountValue = formData.get('amount');
  const categoryValue = formData.get('category');
  const dateValue = formData.get('date'); // Extract date from formData

  // Check for input values
  if (
    !textValue ||
    textValue === '' ||
    !amountValue ||
    !categoryValue ||
    categoryValue === '' ||
    !dateValue ||
    dateValue === ''
  ) {
    return { error: 'Text, amount, category, or date is missing' };
  }

  const text: string = textValue.toString(); // Ensure text is a string
  const amount: number = parseFloat(amountValue.toString()); // Parse amount as number
  if (!Number.isFinite(amount) || isNaN(amount)) {
    return { error: 'Invalid amount provided' };
  }
  const category: string = categoryValue.toString(); // Ensure category is a string
  // Convert date to ISO-8601 format while preserving the user's input date
  let date: string;
  try {
    // Parse the date string (YYYY-MM-DD format) and create a date at noon UTC to avoid timezone issues
    const inputDate = dateValue.toString();
    const [year, month, day] = inputDate.split('-');
    const dateObj = new Date(
      Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0)
    );
    date = dateObj.toISOString();
  } catch (error) {
    console.error('Invalid date format:', error); // Log the error
    return { error: 'Invalid date format' };
  }

  // Get logged in user
  const { userId } = await auth();

  // Check for user
  if (!userId) {
    return { error: 'User not found' };
  }

  try {
    // Create a new record (allow multiple expenses per day)
    const createdRecord = await db.records.create({
      data: {
        text,
        amount,
        category,
        date, // Save the date to the database
        userId,
      },
    });

    // Budget checks: find budget for the month
    const dateObj = new Date(date);
    const monthStart = new Date(Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), 1, 0, 0, 0));
    const budget = await db.budget.findFirst({
      where: { userId, monthStart },
      include: { allocations: true },
    });

    const alerts: { type: 'warning' | 'info' | 'success'; message: string }[] = [];

    if (budget) {
        // type guard for allocations
        function isAlloc(x: unknown): x is { category: string; amount: number } {
          if (!x || typeof x !== 'object') return false;
          const rec = x as Record<string, unknown>;
          return typeof rec['category'] === 'string' && typeof rec['amount'] === 'number';
        }
      // compute total spent this month (including the newly created record)
      const monthEnd = new Date(Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth() + 1, 1, 0, 0, 0));
      const totals = await db.records.aggregate({
        where: { userId, date: { gte: monthStart, lt: monthEnd } },
        _sum: { amount: true },
      });
      const currentTotal = (totals._sum.amount || 0) ;
      const newTotal = currentTotal + amount;

      if (budget.monthlyTotal > 0 && newTotal > budget.monthlyTotal) {
        alerts.push({ type: 'warning', message: `Monthly budget exceeded: ${newTotal.toFixed(2)} / ${budget.monthlyTotal.toFixed(2)}` });
      } else if (budget.monthlyTotal > 0 && newTotal > budget.monthlyTotal * 0.8) {
        alerts.push({ type: 'info', message: `You're approaching your monthly budget: ${newTotal.toFixed(2)} / ${budget.monthlyTotal.toFixed(2)}` });
      }

      // per-category allocation check
  const alloc = budget.allocations.find((a: unknown) => isAlloc(a) && a.category === category);
      if (alloc && alloc.amount > 0) {
        const catTotals = await db.records.aggregate({
          where: { userId, category, date: { gte: monthStart, lt: monthEnd } },
          _sum: { amount: true },
        });
        const currentCatTotal = (catTotals._sum.amount || 0) ;
        const newCatTotal = currentCatTotal + amount;

        if (newCatTotal > alloc.amount) {
          alerts.push({ type: 'warning', message: `Category '${category}' budget exceeded: ${newCatTotal.toFixed(2)} / ${alloc.amount.toFixed(2)}` });
        } else if (newCatTotal > alloc.amount * 0.9) {
          alerts.push({ type: 'info', message: `Approaching '${category}' allocation: ${newCatTotal.toFixed(2)} / ${alloc.amount.toFixed(2)}` });
        }
      }
    }

    const recordData: RecordData = {
      text: createdRecord.text,
      amount: createdRecord.amount,
      category: createdRecord.category,
      date: createdRecord.date?.toISOString() || date,
    };

    revalidatePath('/');

    return { data: recordData, alerts };
  } catch (error) {
    console.error('Error adding expense record:', error); // Log the error
    return {
      error: 'An unexpected error occurred while adding the expense record.',
    };
  }
}

export default addExpenseRecord;