'use server';

import { db } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import createNotification from '@/actions/createNotification';

export async function syncRecurringExpenses() {
  const { userId } = await auth();
  if (!userId) return { error: 'Unauthorized' };

  try {
    // 1. Fetch all active recurring rules for the user
    const rules = await db.recurringExpense.findMany({
      where: { userId, active: true },
      include: { records: { orderBy: { date: 'desc' }, take: 1 } }
    });

    const now = new Date();
    let createdCount = 0;

    for (const rule of rules) {
      // Find the last time this rule generated a record or use the start date
      const lastRecord = rule.records[0];
      let lastProcessedDate = lastRecord ? new Date(lastRecord.date) : new Date(rule.startDate);

      // Determine the next due date based on the rule's frequency
      let nextDueDate = new Date(lastProcessedDate);
      
      const advanceDate = (date: Date) => {
        const d = new Date(date);
        if (rule.frequency === 'monthly') d.setUTCMonth(d.getUTCMonth() + 1);
        else if (rule.frequency === 'weekly') d.setUTCDate(d.getUTCDate() + 7);
        else if (rule.frequency === 'yearly') d.setUTCFullYear(d.getUTCFullYear() + 1);
        return d;
      };

      nextDueDate = advanceDate(nextDueDate);

      // Catch-up logic: Create records for all missed periods until nextDueDate is in the future
      while (now >= nextDueDate) {
        await db.records.create({
          data: {
            userId: rule.userId,
            text: `[Auto] ${rule.text}`,
            amount: rule.amount,
            category: rule.category,
            date: new Date(nextDueDate), // Backdate to the actual due date
            recurringId: rule.id,
          }
        });

        createdCount++;
        // Move to the next period
        nextDueDate = advanceDate(nextDueDate);
      }
    }

    // Notify user if new expenses were auto-generated
    if (createdCount > 0) {
      await createNotification(
        userId, 
        'info', 
        'Recurring Expenses Synced', 
        `Automatically logged ${createdCount} recurring ${createdCount === 1 ? 'expense' : 'expenses'}.`
      );
    }

    return { success: true, createdCount };
  } catch (error) {
    console.error('Sync Error:', error);
    return { error: 'Failed to sync recurring expenses' };
  }
}