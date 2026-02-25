'use server';

import { analyzeReceiptImage } from '@/lib/ai';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/prisma';

// Helper to wait for retry
const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function scanReceipt(base64Image: string, mimeType: string) {
  const { userId } = await auth();
  let attempts = 0;
  const maxAttempts = 2;

  // 1. Basic Validation
  if (!base64Image || base64Image.length < 100) {
    return { success: false, data: null, error: "Invalid image data provided." };
  }

  while (attempts < maxAttempts) {
    try {
      // 2. Call the AI library
      const result = await analyzeReceiptImage(base64Image, mimeType);

      // Optional: Log success event
      if (userId) {
        await db.aIEvent.create({
          data: {
            userId,
            eventType: 'RECEIPT_SCAN_SUCCESS',
            message: 'Successfully parsed receipt using AI',
          }
        });
      }

      return { success: true, data: result, error: null };

    } catch (error: any) {
      attempts++;

      const status = error.status || error.response?.status;
      const message = error.message || "";

      // 3. Logic: Don't retry if it's a configuration error (400)
      const isConfigError = status === 400 || message.includes('invalid model');
      const isRateLimit = status === 429 || message.includes('429') || message.includes('too many requests');

      if (isConfigError) {
        console.error('AI Configuration Error:', message);
        break;
      }

      if (isRateLimit && attempts < maxAttempts) {
        console.warn(`⚠️ AI Rate limit hit. Retrying attempt ${attempts}/${maxAttempts}...`);
        await wait(2000 * attempts); // Incremental backoff (2s, then 4s)
        continue;
      }

      // 4. Log Failure to Database for debugging
      if (userId) {
        await db.aIEvent.create({
          data: {
            userId,
            eventType: 'RECEIPT_SCAN_FAILURE',
            message: message.substring(0, 255),
            details: { attempts, status, isRateLimit }
          }
        });
      }

      // 5. Final Error Return (Triggers Client-Side OCR)
      return {
        success: false,
        data: null,
        error: isRateLimit
          ? 'AI servers are currently busy. Switching to local scan...'
          : 'AI processing failed. Attempting local scan...',
        clientOCR: true, // This tells your UI to use Tesseract.js
      };
    }
  }

  return {
    success: false,
    data: null,
    error: "AI scanning unavailable. Please enter details manually or try local scan.",
    clientOCR: true
  };
}