import Tesseract from 'tesseract.js';

export async function scanReceiptWithOCR(base64Image: string) {
  try {
    const { data } = await Tesseract.recognize(
      `data:image/png;base64,${base64Image}`,
      'eng', // language
      {
        logger: (m) => console.log(m), // optional: log progress
      }
    );

    // Basic parsing logic (you can enhance later)
    const text = data.text;

    // Simple amount detection: find numbers with decimal
    const amountMatch = text.match(/(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[0].replace(/,/g, '')) : null;

    return {
      description: text.split('\n')[0] || '',
      amount,
      category: '', // leave blank, auto-categorization handles it
    };
  } catch (error) {
    console.error('OCR Error:', error);
    return null;
  }
}