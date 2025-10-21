'use server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

interface Allocation {
  category: string;
  amount: number;
}

async function setMonthlyBudget(formData: FormData) {
  const { userId } = await auth();
  if (!userId) return { error: 'User not found' };

  const month = formData.get('month')?.toString(); // YYYY-MM
  const monthlyTotal = parseFloat(formData.get('monthlyTotal')?.toString() || '0');
  const allocationsJson = formData.get('allocations')?.toString() || '[]';

  if (!month) return { error: 'Month is required' };

  const [year, mon] = month.split('-');
  const monthStart = new Date(Date.UTC(parseInt(year), parseInt(mon) - 1, 1, 0, 0, 0));

  let allocations: Allocation[] = [];
  try {
    allocations = JSON.parse(allocationsJson) as Allocation[];
  } catch (e) {
    return { error: 'Invalid allocations' };
  }

  try {
    // Upsert budget for the month
    const existing = await db.budget.findFirst({ where: { userId, monthStart } });

    if (existing) {
      // delete old allocations and recreate
      await db.budgetAllocation.deleteMany({ where: { budgetId: existing.id } });
      const updated = await db.budget.update({
        where: { id: existing.id },
        data: { monthlyTotal, allocations: { create: allocations } },
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
