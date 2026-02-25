'use server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/prisma';

async function getBudgets() {
  const { userId } = await auth();
  if (!userId) return { error: 'User not found' };

  try {
    const budgets = await db.budget.findMany({
      where: { userId },
      include: { allocations: true },
      orderBy: { monthStart: 'desc' },
      take: 12,
    });

    // Types to prevent Prisma decoupling issues
    type RawAlloc = { category: string; amount: number };
    type RawBudget = { id: string; monthlyTotal: number; monthStart: Date; allocations: RawAlloc[]; budgetAlertThreshold?: number };

    const mapped = (budgets as unknown as RawBudget[]).map((b) => ({
      id: b.id,
      monthlyTotal: b.monthlyTotal,
      monthStart: b.monthStart.toISOString(),
      budgetAlertThreshold: b.budgetAlertThreshold ?? 0.8,
      allocations: b.allocations.map((a) => ({ category: a.category, amount: a.amount }))
    }));

    return { budgets: mapped };
  } catch (error) {
    console.error('Error fetching budgets:', error);
    return { error: 'Database error' };
  }
}

export default getBudgets;