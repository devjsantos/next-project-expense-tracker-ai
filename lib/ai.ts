import OpenAI from 'openai';
import Ajv from 'ajv';

/* ================= TYPES ================= */
// @ts-ignore
const ajv = new Ajv({ allErrors: true, strict: false, keywords: [] });

export type InsightType = 'warning' | 'info' | 'success' | 'tip';

const INSIGHT_TYPES: readonly InsightType[] = [
  'warning',
  'info',
  'success',
  'tip',
];

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

// PALITAN ITONG PRIMARY_MODEL:
const PRIMARY_MODEL = 'google/gemini-2.0-flash-lite-preview-02-05:free';

// VISION: Stable vision-capable model for receipts
const VISION_MODEL = 'google/gemini-2.0-flash-exp:free';

const TEXT_FALLBACKS = [
  'meta-llama/llama-3.1-8b-instruct:free',
  'mistralai/mistral-7b-instruct'
];

/* ================= UTILITIES ================= */

function normalizeInsightType(value: unknown): InsightType {
  if (typeof value === 'string' && INSIGHT_TYPES.includes(value as InsightType)) {
    return value as InsightType;
  }
  return 'info';
}

/** Clean AI response of markdown and reasoning tags to prevent JSON.parse errors */
function cleanJSONResponse(content: string): string {
  return content
    .replace(/<think>[\s\S]*?<\/think>/g, '') // Remove reasoning tags
    .replace(/^```json\s*|```$/g, '')         // Remove Markdown blocks
    .trim();
}

/* ================= AJV SCHEMAS ============== */

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

const validateInsight = ajv.compile(insightSchema);

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
          content: 'You are a Filipino Financial Advisor. You MUST respond with a JSON array of objects. Use keys: "type", "title", "message", "action", "confidence".'
        },
        {
          role: 'user',
          content: `Analyze these expenses and give 3 insights: ${JSON.stringify(summary)}`
        },
      ],
      max_tokens: 200,
      temperature: 0.7,
      extra_body: { "models": TEXT_FALLBACKS, "route": "fallback" }
    } as any);

    const content = completion.choices[0].message.content || '[]';
    const cleaned = cleanJSONResponse(content);

    const rawData = JSON.parse(cleaned);
    const rawInsights = Array.isArray(rawData) ? rawData : [rawData];

    const validated: AIInsight[] = [];
    rawInsights.forEach((insight: any, i: number) => {
      const mapped = {
        type: insight.type || 'info',
        title: insight.title || 'Financial Insight',
        message: insight.message || 'Analysis complete',
        action: insight.action || 'View details',
        confidence: typeof insight.confidence === 'number' ? insight.confidence : 0.9,
      };

      if (validateInsight(mapped)) {
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

    return validated;
  } catch (error: any) {
    console.error("Insights Error:", error);
    return [];
  }
}

/* ================= CATEGORIZATION ================= */

export async function categorizeExpense(description: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: PRIMARY_MODEL,
      messages: [
        { role: 'system', content: 'Output exactly one word category: Food, Transportation, Entertainment, Shopping, Bills, Healthcare, or Other.' },
        { role: 'user', content: description },
      ],
      max_tokens: 15,
      extra_body: { "models": TEXT_FALLBACKS, "route": "fallback" }
    } as any);

    const category = completion.choices[0].message.content?.trim();
    const validCategories = ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Other'];

    if (category && validCategories.includes(category)) return category;
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
        { role: 'system', content: 'You are a helpful Pinoy financial assistant. Be very concise and speak Taglish where appropriate.' },
        { role: 'user', content: `Question: ${question} Data: ${JSON.stringify(summary)}` },
      ],
      max_tokens: 250,
      extra_body: { "models": TEXT_FALLBACKS, "route": "fallback" }
    } as any);

    return cleanJSONResponse(completion.choices[0].message.content || 'No response.');
  } catch (error: any) {
    if (error.status === 402) return "Pasensya na, over budget na ang AI (Credit limit).";
    return 'The AI assistant is taking a break. Please try again later.';
  }
}

/* ================= RECEIPT SCANNING ================= */

export async function analyzeReceiptImage(base64Image: string, mimeType: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: VISION_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: "Return ONLY JSON: {amount: number, description: string, category: string}. Category must be one of: Food, Transportation, Shopping, Bills, Healthcare, Other." },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}`, detail: "low" } }
          ],
        },
      ],
      max_tokens: 200,
      temperature: 0.1,
    } as any);

    const content = completion.choices[0].message.content || '';
    const cleaned = cleanJSONResponse(content);
    return JSON.parse(cleaned);
  } catch (error: any) {
    console.error("Vision Error:", error);
    throw new Error("Receipt processing failed. Please enter manually.");
  }
}