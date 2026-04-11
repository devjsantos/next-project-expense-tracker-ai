'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/prisma';
import { scanReceiptWithOCR } from '@/lib/localOCR';

export async function scanReceipt(base64Image: string, mimeType: string) {
  const { userId } = await auth();

  if (!base64Image || base64Image.length < 100) {
    return { success: false, data: null, error: "Invalid image data provided." };
  }

  // Use local OCR directly
  const result = await scanReceiptWithOCR(base64Image);

  if (result) {
    // Log OCR success (optional)
    if (userId) {
      await db.aIEvent.create({
        data: {
          userId,
          eventType: 'RECEIPT_SCAN_SUCCESS',
          message: 'Parsed receipt using local OCR',
        }
      });
    }

    return { success: true, data: result, error: null };
  } else {
    return { success: false, data: null, error: "OCR failed. Please enter details manually." };
  }
}