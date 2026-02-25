'use server';

import { categorizeExpense as categorizeLogic } from '@/lib/ai';

export async function getAiCategory(description: string) {
  try {
    // This runs strictly on the server where process.env is available
    const category = await categorizeLogic(description);
    return { success: true, category };
  } catch (error) {
    console.error("AI Action Error:", error);
    return { success: false, error: "Failed to fetch category" };
  }
}