'use server';
import { checkUser } from '@/lib/checkUser';
import { getAIInsights } from './getAIInsights';
import getUserRecord from './getUserRecord';
import getBestWorstExpense from './getBestWorstExpense';
import { db } from '@/lib/prisma';
import sendEmail from '@/lib/email';

type EmailReportCreateData = {
  userId: string;
  email: string;
  subject: string;
  provider?: string | null;
  status: string;
  providerResponse?: string | null;
};

type DBWithEmailReport = {
  emailReport: {
    create: (args: { data: EmailReportCreateData }) => Promise<unknown>;
  };
} & Record<string, unknown>;

export default async function sendInsightsEmail() {
  const user = await checkUser();
  if (!user) return { error: 'User not authenticated' };

  const insights = await getAIInsights();

  // Fetch expense statistics
  const statsRes = await getUserRecord();
  const rangeRes = await getBestWorstExpense();

  const totalSpent = statsRes.record || 0;
  const daysWithRecords = statsRes.daysWithRecords || 0;
  const avgDaily = daysWithRecords > 0 ? totalSpent / daysWithRecords : 0;
  const highest = rangeRes.bestExpense ?? 0;
  const lowest = rangeRes.worstExpense ?? 0;

  // Format currency using Intl (Philippine peso symbol)
  const formatter = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    currencyDisplay: 'symbol',
    maximumFractionDigits: 2,
  });

  const formattedAvg = formatter.format(avgDaily);
  const formattedHighest = highest !== 0 ? formatter.format(highest) : 'No data';
  const formattedLowest = lowest !== 0 ? formatter.format(lowest) : 'No data';

  // Build richer HTML email containing stats and AI insights
  // Fetch top categories (sum) for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const topCats = await db.records.groupBy({
    by: ['category'],
    where: { userId: user.clerkUserId, createdAt: { gte: thirtyDaysAgo } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: 'desc' } },
    take: 5,
  });

  // Fetch recent transactions (last 5)
  const recent = await db.records.findMany({
    where: { userId: user.clerkUserId },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  type TopCatRow = { category: string; _sum: { amount: number | null } };
  type RecentRow = { text: string; amount: number; createdAt: Date };

  const html = `
    <div style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color: #0f172a; max-width:600px; margin:0 auto;">
      <div style="background:#0f172a; color:#fff; padding:20px; border-radius:10px 10px 0 0; text-align:left;">
        <h1 style="margin:0; font-size:20px;">SmartJuanPeso — Your Expense Report</h1>
        <p style="margin:4px 0 0 0; font-size:13px; opacity:0.9">Hi ${user.name || 'there'}, here are your latest stats and AI insights.</p>
      </div>

      <div style="background:#fff; padding:18px; border:1px solid #e6eef8; border-top:0;">
        <h2 style="font-size:16px; color:#0f172a; margin:0 0 10px 0">Expense Statistics</h2>

        <table width="100%" style="border-collapse:collapse; margin-bottom:14px;">
          <tr>
            <td style="padding:8px; vertical-align:top; width:50%;">
              <div style="background:#f8fafc; padding:12px; border-radius:8px;">
                <div style="font-size:11px; color:#64748b; text-transform:uppercase; letter-spacing:0.04em;">Average Daily Spending</div>
                <div style="font-size:18px; font-weight:700; color:#0f172a; margin-top:6px;">${formattedAvg}</div>
                <div style="font-size:12px; color:#475569; margin-top:6px;">Based on ${daysWithRecords} days with expenses</div>
              </div>
            </td>
            <td style="padding:8px; vertical-align:top; width:50%;">
              <div style="display:flex; gap:8px;">
                <div style="flex:1; background:#fff7f6; padding:12px; border-radius:8px; border-left:4px solid #ef4444;">
                  <div style="font-size:11px; color:#7f1d1d; text-transform:uppercase;">Highest</div>
                    <div style="font-size:16px; font-weight:700; color:#b91c1c; margin-top:6px;">${formattedHighest}</div>
                </div>
                <div style="flex:1; background:#f0f9ff; padding:12px; border-radius:8px; border-left:4px solid #3b82f6;">
                  <div style="font-size:11px; color:#1e3a8a; text-transform:uppercase;">Lowest</div>
                  <div style="font-size:16px; font-weight:700; color:#1e40af; margin-top:6px;">${formattedLowest}</div>
                </div>
              </div>
            </td>
          </tr>
        </table>

        <h2 style="font-size:16px; color:#0f172a; margin:8px 0 10px 0">AI Insights</h2>
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${insights
            .map((i) => {
              const color = i.type === 'warning' ? '#fef3c7' : i.type === 'success' ? '#eef2ff' : '#eef2ff';
              const border = i.type === 'warning' ? '#f59e0b' : i.type === 'success' ? '#3b82f6' : '#4f46e5';
              return `
                <div style="background:${color}; padding:12px; border-left:4px solid ${border}; border-radius:8px;">
                  <div style="font-weight:700; color:#0f172a; font-size:14px;">${i.title}</div>
                  <div style="color:#334155; font-size:13px; margin-top:6px;">${i.message}</div>
                </div>
              `;
            })
            .join('')}
        </div>
        <h2 style="font-size:16px; color:#0f172a; margin:18px 0 10px 0">Top Categories</h2>
        <div style="display:flex; flex-direction:column; gap:8px;">
          <table width="100%" style="border-collapse:collapse;">
            ${
              (topCats as TopCatRow[])
                .map((c) => `<tr><td style="padding:6px; font-weight:600;">${c.category}</td><td style="padding:6px; text-align:right;">${formatter.format(c._sum.amount || 0)}</td></tr>`) 
                .join('')
            }
          </table>
        </div>

        <h2 style="font-size:16px; color:#0f172a; margin:18px 0 10px 0">Recent Transactions</h2>
        <div style="display:flex; flex-direction:column; gap:8px;">
          <table width="100%" style="border-collapse:collapse;">
            ${
              (recent as RecentRow[])
                .map((r) => `<tr><td style="padding:6px;">${new Date(r.createdAt).toLocaleDateString()}</td><td style="padding:6px;">${r.text}</td><td style="padding:6px; text-align:right;">${formatter.format(r.amount)}</td></tr>`)
                .join('')
            }
          </table>
        </div>

        <p style="color:#64748b; font-size:12px; margin-top:14px;">Generated: ${new Date().toLocaleString()}</p>
        <p style="color:#94a3b8; font-size:12px; margin-top:6px;">Sent by SmartJuanPeso AI</p>
        <div style="margin-top:14px; text-align:center;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="background:#0f172a; color:#fff; padding:10px 16px; border-radius:8px; text-decoration:none; font-weight:600;">View full insights →</a>
        </div>
      </div>
    </div>
  `;

  // Build plain-text fallback
  const textLines: string[] = [];
  textLines.push(`SmartJuanPeso — Your Expense Report`);
  textLines.push(`Hi ${user.name || 'there'}, here are your latest stats and AI insights.`);
  textLines.push('');
  textLines.push('Expense Statistics:');
  textLines.push(`- Average Daily: ${formattedAvg}`);
  textLines.push(`- Highest: ${formattedHighest}`);
  textLines.push(`- Lowest: ${formattedLowest}`);
  textLines.push('');
  if ((topCats as TopCatRow[]).length > 0) {
    textLines.push('Top Categories:');
    (topCats as TopCatRow[]).forEach((c) => {
      textLines.push(`- ${c.category}: ${formatter.format(c._sum.amount || 0)}`);
    });
    textLines.push('');
  }

  if ((recent as RecentRow[]).length > 0) {
    textLines.push('Recent Transactions:');
    (recent as RecentRow[]).forEach((r) => {
      textLines.push(`- ${new Date(r.createdAt).toLocaleDateString()} | ${r.text} | ${formatter.format(r.amount)}`);
    });
    textLines.push('');
  }

  textLines.push('AI Insights:');
  insights.forEach((i) => {
    textLines.push(`- ${i.title}: ${i.message}`);
  });

  textLines.push('');
  textLines.push(`View full insights: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}`);
  const text = textLines.join('\n');

  try {
    await sendEmail({
      to: user.email,
      subject: 'Your SmartJuanPeso AI insights',
      html,
      text,
    });
    await (db as unknown as DBWithEmailReport).emailReport.create({
      data: {
        userId: user.clerkUserId,
        email: user.email,
        subject: 'Your SmartJuanPeso AI insights',
        provider: process.env.RESEND_API_KEY ? 'resend' : process.env.SENDGRID_API_KEY ? 'sendgrid' : 'unknown',
        status: 'sent',
      },
    });

    return { ok: true };
  } catch (error) {
    console.error('Error sending insights email:', error);
    // log failure
    try {
      await (db as unknown as DBWithEmailReport).emailReport.create({
        data: {
          userId: user.clerkUserId,
          email: user.email,
          subject: 'Your SmartJuanPeso AI insights',
          provider: process.env.RESEND_API_KEY ? 'resend' : process.env.SENDGRID_API_KEY ? 'sendgrid' : 'unknown',
          status: 'failed',
          providerResponse: String(error),
        },
      });
    } catch (e) {
      console.error('Failed to log email report:', e , 'Catch on SendInsightsEmail');
    }

    return { error: 'Failed to send email on SendInsightsEmail', providerResponse: String(error) };
  }
}
