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
    'HTTP-Referer':
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'SmartJuanPeso AI',
  },
});

/* ================= UTILITIES ================= */

function isRateLimitError(error: unknown): error is { code: number } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'number'
  );
}

function normalizeInsightType(value: unknown): InsightType {
  if (typeof value === 'string' && INSIGHT_TYPES.includes(value as InsightType)) {
    return value as InsightType;
  }
  return 'info';
}

// Helper function to wait
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function safeOpenAIRequest(requestFn: () => Promise<any>, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await requestFn();
    } catch (error: any) {
      // If we hit a 429 error and have retries left...
      if (error.status === 429 && i < retries - 1) {
        const waitTime = Math.pow(2, i) * 1000; // Wait 1s, then 2s, then 4s
        console.warn(`⚠️ Rate limited. Retrying in ${waitTime}ms...`);
        await delay(waitTime);
        continue;
      }
      throw error; // If not a 429 or no retries left, crash normally
    }
  }
}

/* ================= LOCAL FALLBACK ================= */

function localCategorize(description: string): string {
  const text = description.toLowerCase();

  if (/food|restaurant|snack|meal|eat|lunch|dinner/.test(text)) return 'Food';
  if (/gas|grab|jeep|bus|taxi|train|commute|transport/.test(text))
    return 'Transportation';
  if (/movie|netflix|game|music|concert|fun|play/.test(text))
    return 'Entertainment';
  if (/shop|mall|clothes|shoes|gadget|buy|purchase/.test(text))
    return 'Shopping';
  if (/bill|electric|water|internet|rent|subscription/.test(text))
    return 'Bills';
  if (/hospital|medicine|doctor|clinic|health/.test(text))
    return 'Healthcare';

  return 'Other';
}

/* ================= AI INSIGHTS ================= */

export async function generateExpenseInsights(
  expenses: ExpenseRecord[]
): Promise<AIInsight[]> {
  try {
    const summary = expenses.map(e => ({
      amount: e.amount,
      category: e.category,
      description: e.description,
      date: e.date,
    }));

    const prompt = `Analyze the following expense data and provide 3-4 actionable financial insights.
Return ONLY a JSON array using:
{
  "type": "warning|info|success|tip",
  "title": "Brief title",
  "message": "Detailed insight",
  "action": "Suggestion",
  "confidence": 0.8
}

Expense Data:
${JSON.stringify(summary, null, 2)}`;

    const completion = await safeOpenAIRequest(() =>
      openai.chat.completions.create({
        model: 'deepseek/deepseek-chat-v3-0324',
        messages: [
          {
            role: 'system',
            content:
              'You are a financial advisor AI. Respond with valid JSON only.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      })
    );

    const content = completion.choices[0].message.content;
    if (!content) throw new Error('No response from AI');

    const cleaned = content.replace(/^```json\s*|```$/g, '').trim();
    const insights: RawInsight[] = JSON.parse(cleaned);

    return insights.map((insight, index): AIInsight => ({
      id: `ai-${Date.now()}-${index}`,
      type: normalizeInsightType(insight.type),
      title: typeof insight.title === 'string' ? insight.title : 'AI Insight',
      message: typeof insight.message === 'string' ? insight.message : 'Analysis complete',
      action: typeof insight.action === 'string' ? insight.action : undefined,
      confidence: typeof insight.confidence === 'number' ? insight.confidence : 0.8,
    }));
  } catch (error: unknown) {
    console.error('❌ Error generating AI insights:', error);
    return [
      {
        id: 'fallback-1',
        type: 'info',
        title: 'AI Analysis Unavailable',
        message:
          'Unable to generate personalized insights at this time. Please try again later.',
        action: 'Refresh insights',
        confidence: 0.5,
      },
    ];
  }
}

/* ================= CATEGORIZATION ================= */

export async function categorizeExpense(
  description: string
): Promise<string> {
  try {
    const completion = await safeOpenAIRequest(() =>
      openai.chat.completions.create({
        model: 'deepseek/deepseek-chat-v3-0324',
        messages: [
          {
            role: 'system',
            content:
              'Categorize into: Food, Transportation, Entertainment, Shopping, Bills, Healthcare, Other.',
          },
          { role: 'user', content: `Categorize: "${description}"` },
        ],
        temperature: 0.1,
        max_tokens: 20,
      })
    );

    const category = completion.choices[0].message.content?.trim();
    return category ? category : localCategorize(description);
  } catch (error: unknown) {
    console.error('❌ Error categorizing expense:', error);
    return localCategorize(description);
  }
}

/* ================= Q&A ================= */

export async function generateAIAnswer(
  question: string,
  context: ExpenseRecord[]
): Promise<string> {
  try {
    const summary = context.map(e => ({
      amount: e.amount,
      category: e.category,
      description: e.description,
      date: e.date,
    }));

    const prompt = `Answer the question using the expense data below.

Question:
"${question}"

Expense Data:
${JSON.stringify(summary, null, 2)}

Respond in 2–3 sentences.`;

    const completion = await safeOpenAIRequest(() =>
      openai.chat.completions.create({
        model: 'deepseek/deepseek-chat-v3-0324',
        messages: [
          { role: 'system', content: 'You are a concise financial advisor.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 200,
      })
    );

    return completion.choices[0].message.content?.trim() ?? '';
  } catch (error: unknown) {
    console.error('❌ Error generating AI answer:', error);
    return 'Unable to answer at the moment. Please try again later.';
  }
}
/* ================= RECEIPT SCANNING ================= */
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function analyzeReceiptImage(base64Image: string, mimeType: string) {
  const models = [
    'google/gemini-2.0-flash-exp:free',
    'qwen/qwen-2.5-vl-7b-instruct:free',
    'google/gemini-2.0-pro-exp-02-05:free'
  ];

  let lastError: any = null;

  for (const modelId of models) {
    // Attempt the model twice with a delay if rate limited
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const completion = await openai.chat.completions.create({
          model: modelId,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: "Extract to JSON: {amount: number, description: string, category: string}" },
                { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } }
              ],
            },
          ],
          temperature: 0.1,
          max_tokens: 500,
        });

        if (completion?.choices?.[0]?.message?.content) {
          const content = completion.choices[0].message.content;
          const cleaned = content.replace(/^```json\s*|```$/g, '').trim();
          return JSON.parse(cleaned);
        }
      } catch (error: any) {
        lastError = error;
        // If 429, sleep and try one more time for this specific model
        if (error?.status === 429 && attempt === 1) {
          await sleep(3000); // 3 seconds is safer for free tier
          continue;
        }
        break; // Move to next model if it's not a temporary 429
      }
    }
  }

  throw new Error("AI services are currently congested. Please wait 10 seconds and try again.");
}