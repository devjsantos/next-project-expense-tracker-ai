import OpenAI from 'openai';

/* ================= TYPES ================= */

export type InsightType = 'warning' | 'info' | 'success' | 'tip';

const INSIGHT_TYPES: readonly InsightType[] = [
  'warning',
  'info',
  'success',
  'tip',
];

interface RawInsight {
  type?: unknown;
  title?: string;
  message?: string;
  action?: string;
  confidence?: number;
}

export interface ExpenseRecord {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

export interface AIInsight {
  id: string;
  type: InsightType;
  title: string;
  message: string;
  action?: string;
  confidence: number;
}

/* ================= OPENAI CLIENT ================= */

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'SmartJuanPeso AI',
  },
});

/* ================= 2026 STABLE FREE MODEL CONFIG ================= */

// Using Gemini 2.0 Flash as primary because it is the most stable free vision/text model
const PRIMARY_MODEL = [
  'google/gemini-2.0-flash-001', 
  'google/gemini-2.0-flash-lite-preview-02-05:free'
];

// Fallbacks specifically labeled ":free" to avoid 402 Payment errors
const TEXT_FALLBACKS = [
  'google/gemini-2.0-flash-lite-preview-02-05:free',
  'mistralai/mistral-7b-instruct:free',
  'microsoft/phi-3-medium-128k-instruct:free'
];

const VISION_FALLBACKS = [
  'google/gemini-2.0-flash-lite-preview-02-05:free',
  'qwen/qwen-2.5-vl-7b-instruct:free'
];

/* ================= UTILITIES ================= */

function normalizeInsightType(value: unknown): InsightType {
  if (typeof value === 'string' && INSIGHT_TYPES.includes(value as InsightType)) {
    return value as InsightType;
  }
  return 'info';
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function safeOpenAIRequest(requestFn: () => Promise<any>, retries = 2) {
  for (let i = 0; i < retries; i++) {
    try {
      return await requestFn();
    } catch (error: any) {
      // Handle Rate Limits (429) or temporary outages
      if (error.status === 429 && i < retries - 1) {
        const waitTime = Math.pow(2, i) * 2000;
        await delay(waitTime);
        continue;
      }
      throw error;
    }
  }
}

/* ================= LOCAL FALLBACK ================= */

function localCategorize(description: string): string {
  const text = description.toLowerCase();
  if (/food|restaurant|snack|meal|eat|lunch|dinner|coffee|bakery/.test(text)) return 'Food';
  if (/gas|grab|jeep|bus|taxi|train|commute|transport|angkas|joyride/.test(text)) return 'Transportation';
  if (/bill|electric|water|internet|rent|meralco|pldt|globe|smart/.test(text)) return 'Bills';
  if (/movie|netflix|game|music|concert|fun|hobby/.test(text)) return 'Entertainment';
  if (/hospital|medicine|doctor|clinic|health|drugstore/.test(text)) return 'Healthcare';
  return 'Other';
}

/* ================= AI INSIGHTS ================= */

export async function generateExpenseInsights(expenses: ExpenseRecord[]): Promise<AIInsight[]> {
  try {
    const summary = expenses.slice(0, 15).map(e => ({
      amount: e.amount,
      category: e.category,
      description: e.description,
    }));

    const completion = await openai.chat.completions.create({
      model: PRIMARY_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a Filipino Financial Advisor. You MUST respond with a JSON array of objects. Each object MUST have these exact keys: "type", "title", "message", "action", "confidence". Do not include <think> tags or markdown.'
        },
        { role: 'user', content: `Analyze these 2026 expenses and give 3 insights: ${JSON.stringify(summary)}` },
      ],
      max_tokens: 600,
      temperature: 0.7,
      extra_body: {
        "models": TEXT_FALLBACKS,
        "route": "fallback"
      }
    } as any);

    const content = completion.choices[0].message.content || '[]';
    const cleaned = content.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/^```json\s*|```$/g, '').trim();

    // Parse the JSON
    const rawData = JSON.parse(cleaned);

    // ENSURE ARRAY: If AI returns a single object instead of an array
    const rawInsights = Array.isArray(rawData) ? rawData : [rawData];

    return rawInsights.map((insight: any, i: number): AIInsight => {
      // FLEXIBLE MAPPING: This catches the AI if it uses the wrong property names
      const title = insight.title || insight.headline || 'Financial Insight';
      const message = insight.message || insight.insight || insight.description || insight.text || 'Analysis complete';
      const action = insight.action || insight.suggestion || insight.recommendation || 'View details';

      return {
        id: `ai-${Date.now()}-${i}`,
        type: normalizeInsightType(insight.type),
        title: title,
        message: message,
        action: action,
        confidence: insight.confidence || 0.9,
      };
    });
  } catch (error) {
    console.error('AI Insight Error:', error);
    return [{
      id: 'err',
      type: 'info',
      title: 'AI Busy',
      message: 'Models are at capacity. Please click Sync Data again.',
      confidence: 0.5
    }];
  }
}
/* ================= CATEGORIZATION ================= */

export async function categorizeExpense(description: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: PRIMARY_MODEL,
      messages: [
        { role: 'system', content: 'Output one word category: Food, Transportation, Entertainment, Shopping, Bills, Healthcare, or Other.' },
        { role: 'user', content: description },
      ],
      max_tokens: 15,
      extra_body: { "models": TEXT_FALLBACKS, "route": "fallback" }
    } as any);

    const category = completion.choices[0].message.content?.trim();
    return category || localCategorize(description);
  } catch {
    return localCategorize(description);
  }
}

/* ================= Q&A ================= */

export async function generateAIAnswer(question: string, context: ExpenseRecord[]): Promise<string> {
  try {
    const summary = context.slice(0, 10).map(e => ({
      amount: e.amount,
      description: e.description,
      category: e.category
    }));

    const completion = await openai.chat.completions.create({
      model: PRIMARY_MODEL,
      messages: [
        { role: 'system', content: 'You are a helpful Pinoy financial assistant. Be very concise.' },
        { role: 'user', content: `Question: ${question} Data: ${JSON.stringify(summary)}` },
      ],
      max_tokens: 250,
      extra_body: { "models": TEXT_FALLBACKS, "route": "fallback" }
    } as any);

    return completion.choices[0].message.content?.replace(/<think>[\s\S]*?<\/think>/g, '').trim() || 'No response.';
  } catch {
    return 'The AI assistant is taking a break. Please try again in a minute.';
  }
}

/* ================= RECEIPT SCANNING ================= */

export async function analyzeReceiptImage(base64Image: string, mimeType: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: PRIMARY_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: "Extract receipt to JSON: {amount: number, description: string, category: string}. Return only JSON." },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } }
          ],
        },
      ],
      max_tokens: 400,
      extra_body: {
        "models": VISION_FALLBACKS,
        "route": "fallback"
      }
    } as any);

    const content = completion.choices[0].message.content || '';
    const cleaned = content.replace(/^```json\s*|```$/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Vision Error:", error);
    throw new Error("AI services are currently congested. Please try again.");
  }
}