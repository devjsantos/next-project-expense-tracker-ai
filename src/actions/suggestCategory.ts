'use server';

import { categorizeExpense } from '@/lib/ai';

export async function suggestCategory(
  description: string
): Promise<{ category: string; error?: string }> {
  try {
    const cleanDesc = description.trim();

    // Safety check for very common short words
    if (!cleanDesc || cleanDesc.length < 3) {
      return { category: 'Other' };
    }

    // Simple local mapping to save AI costs for obvious items
    const lowerDesc = cleanDesc.toLowerCase();
    if (lowerDesc.includes('grab') || lowerDesc.includes('taxi') || lowerDesc.includes('joyride'))
      return { category: 'Transportation' };
    if (lowerDesc.includes('food') || lowerDesc.includes('mcdo') || lowerDesc.includes('jollibee'))
      return { category: 'Food' };

    const category = await categorizeExpense(cleanDesc);
    return { category: category || 'Other' };
  } catch (error) {
    console.error('❌ AI Suggestion Error:', error);
    return {
      category: 'Other',
      error: 'AI currently unavailable',
    };
  }
}