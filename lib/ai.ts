import OpenAI from 'openai';
import Ajv from 'ajv';
/* ================= TYPES ================= */
// KEEP THIS ONE
// @ts-ignore
const ajv = new Ajv({ allErrors: true, strict: false, keywords: [] });

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

export class AIValidationError extends Error {
  public readonly errors: any;
  constructor(message: string, errors: any) {
    super(message);
    this.name = 'AIValidationError';
    this.errors = errors;
  }
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

/* ============== AJV SCHEMAS ============== */

const insightSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', enum: ['warning', 'info', 'success', 'tip'] },
    title: { type: 'string' },
    message: { type: 'string' },
    action: { type: 'string' },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
  },
  required: ['type', 'title', 'message', 'confidence'],
  additionalProperties: false,
};

const receiptSchema = {
  type: 'object',
  properties: {
    amount: { type: 'number' },
    description: { type: 'string' },
    category: { type: 'string' },
  },
  required: ['amount', 'description', 'category'],
  additionalProperties: false,
};

const validateInsight = ajv.compile(insightSchema);
const validateReceipt = ajv.compile(receiptSchema);

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

  // Strict validation using AJV
  const validated: AIInsight[] = [];
  const errors: any[] = [];

  rawInsights.forEach((insight: any, i: number) => {
    // Flexible mapping for alternate property names BEFORE validation
    const mapped = {
      type: insight.type || insight.headline || 'info',
      title: insight.title || insight.headline || 'Financial Insight',
      message: insight.message || insight.insight || insight.description || insight.text || 'Analysis complete',
      action: insight.action || insight.suggestion || insight.recommendation || 'View details',
      confidence: typeof insight.confidence === 'number' ? insight.confidence : 0.9,
    };

    const ok = validateInsight(mapped);
    if (!ok) {
      errors.push({ index: i, data: mapped, errors: validateInsight.errors });
    } else {
      validated.push({
        id: `ai-${Date.now()}-${i}`,
        type: normalizeInsightType(mapped.type),
        title: mapped.title,
        message: mapped.message,
        action: mapped.action,
        confidence: mapped.confidence,
      });
    }
  });

  if (errors.length > 0) {
    // Throw a structured validation error so callers (server actions) can respond appropriately
    throw new AIValidationError('AI returned invalid insight structure', errors);
  }

  return validated;
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
    // Validate category against known list
    const validCategories = ['Food','Transportation','Entertainment','Shopping','Bills','Healthcare','Other'];
    if (typeof category === 'string' && validCategories.includes(category)) return category;
    if (typeof category === 'string') {
      console.warn('AI returned unknown category:', category);
    }
    return localCategorize(description);
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
    const parsed = JSON.parse(cleaned);
    const ok = validateReceipt(parsed);
    if (!ok) {
      throw new AIValidationError('Invalid receipt JSON', validateReceipt.errors);
    }
    return parsed;
  } catch (error) {
    console.error("Vision Error:", error);
    throw new Error("AI services are currently congested. Please try again.");
  }
}