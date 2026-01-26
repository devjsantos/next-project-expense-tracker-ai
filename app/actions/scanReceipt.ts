'use server';

import { analyzeReceiptImage } from '@/lib/ai';

// Helper to wait
const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function scanReceipt(base64Image: string, mimeType: string) {
  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    try {
      const result = await analyzeReceiptImage(base64Image, mimeType);
      return { success: true, data: result, error: null };
    } catch (error: any) {
      attempts++;
      
      // Check if it's a Rate Limit (429) or Provider Error
      const isRateLimit = error.message?.includes('429') || error.status === 429;
      
      if (isRateLimit && attempts < maxAttempts) {
        console.log(`⚠️ Rate limit hit. Retrying attempt ${attempts}...`);
        await wait(2000); // Wait 2 seconds before retrying
        continue;
      }

      // If we reach here, it's a real error or we ran out of retries
      console.error('Final Scan Error:', error);
      return {
        success: false,
        data: null,
        error: isRateLimit 
          ? "AI servers are crowded. Try again in a moment." 
          : (error.message || 'AI Processing Error'),
      };
    }
  }
  
  return { success: false, data: null, error: "System timeout. Please try again." };
}