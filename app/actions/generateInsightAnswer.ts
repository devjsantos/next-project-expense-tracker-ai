'use server';

import { checkUser } from '@/lib/checkUser';
import { db } from '@/lib/prisma';
import { generateAIAnswer, ExpenseRecord } from '@/lib/ai';

export async function generateInsightAnswer(question: string): Promise<string> {
  try {
    const user = await checkUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const expenses = await db.records.findMany({
      where: {
        userId: user.clerkUserId,
        date: { // Changed from createdAt to date to match record spending history
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: 50,
    });

    const expenseData: ExpenseRecord[] = expenses.map((expense) => ({
      id: expense.id,
      amount: expense.amount,
      category: expense.category || 'Other',
      description: expense.text || '',
      date: expense.date.toISOString(),
    }));

    const answer = await generateAIAnswer(question, expenseData);
    return answer;
  } catch (error) {
    console.error('Error generating insight answer:', error);
    return "I'm unable to provide a detailed answer at the moment. Please try again later.";
  }
}