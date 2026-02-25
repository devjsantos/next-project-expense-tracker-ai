'use server';

import { checkUser } from '@/lib/checkUser';
import { db } from '@/lib/prisma';
import { generateExpenseInsights, AIInsight, ExpenseRecord, AIValidationError } from '@/lib/ai';
import reportAiFailure from './reportAiFailure';

export async function getAIInsights(): Promise<AIInsight[]> {
  try {
    const user = await checkUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user's recent expenses (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const expenses = await db.records.findMany({
      where: {
        userId: user.clerkUserId,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to recent 50 expenses for analysis
    });

    if (expenses.length === 0) {
      // Return default insights for new users
      return [
        {
          id: 'welcome-1',
          type: 'info',
          title: 'Welcome to SmartJuanPeso AI!',
          message:
            'Start adding your expenses to get personalized AI insights about your spending patterns.',
          action: 'Add your first expense',
          confidence: 1.0,
        },
        {
          id: 'welcome-2',
          type: 'tip',
          title: 'Track Regularly',
          message:
            'For best results, try to log expenses daily. This helps our AI provide more accurate insights.',
          action: 'Set daily reminders',
          confidence: 1.0,
        },
      ];
    }

    // Convert to format expected by AI
    type DBRecord = {
      id: string;
      amount: number;
      category?: string | null;
      text?: string | null;
      createdAt: Date;
    };

    const expenseData: ExpenseRecord[] = expenses.map((expense: DBRecord) => ({
      id: expense.id,
      amount: expense.amount,
      category: expense.category || 'Other',
      description: expense.text || '',
      date: expense.createdAt.toISOString(),
    }));

    // Generate AI insights
    try {
      const insights = await generateExpenseInsights(expenseData);
      return insights;
    } catch (err: any) {
      // If AI returned invalid structure, persist details and return a fallback with detailsId
      if (err instanceof AIValidationError) {
        const r = await reportAiFailure({ message: err.message, errors: err.errors });
        return [
          {
            id: 'error-1',
            type: 'warning',
            title: 'Insights Validation Error',
            message: 'AI produced invalid insight format. Click details to view.',
            action: 'View details',
            confidence: 0.5,
            detailsId: r?.id,
          } as any,
        ];
      }
      throw err;
    }
  } catch (error) {
    console.error('Error getting AI insights:', error);

    // Return fallback insights
    return [
      {
        id: 'error-1',
        type: 'warning',
        title: 'Insights Temporarily Unavailable',
        message:
          "We're having trouble analyzing your expenses right now. Please try again in a few minutes.",
        action: 'Retry analysis',
        confidence: 0.5,
      },
    ];
  }
}