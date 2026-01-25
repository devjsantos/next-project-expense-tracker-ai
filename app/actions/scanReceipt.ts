'use server';

import { analyzeReceiptImage } from '@/lib/ai';

export async function scanReceipt(formData: FormData) {
  try {
    const file = formData.get('image') as File;
    if (!file) throw new Error('No image file found');

    // Validate file size (e.g., max 4MB)
    if (file.size > 4 * 1024 * 1024) {
      throw new Error('Image is too large. Please take a smaller photo.');
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');

    const result = await analyzeReceiptImage(base64Image, file.type);

    return {
      success: true,
      data: result,
      error: null,
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: error.message || 'Failed to process receipt',
    };
  }
}