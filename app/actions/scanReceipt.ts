'use server';

import { analyzeReceiptImage } from '@/lib/ai';

export async function scanReceipt(formData: FormData) {
  try {
    const file = formData.get('image') as File;
    if (!file) {
      console.error("No file found in FormData");
      return { success: false, error: 'No image detected.' };
    }

    // Convert to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');

    // Call your AI library
    const result = await analyzeReceiptImage(base64Image, file.type);

    return {
      success: true,
      data: result,
      error: null,
    };
  } catch (error: any) {
    // This logs to your Vercel logs/Terminal, not the browser console
    console.error('SERVER ACTION ERROR:', error); 
    return {
      success: false,
      data: null,
      error: error.message || 'AI failed to process the image.',
    };
  }
}