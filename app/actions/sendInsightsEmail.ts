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

interface DBWithEmailReport {
  emailReport: {
    create: (args: { data: EmailReportCreateData }) => Promise<unknown>;
  };
}

interface TopCatRow {
  category: string;
  _sum: { amount: number | null };
}

interface RecentRow {
  text: string;
  amount: number;
  createdAt: Date;
}

export default async function sendInsightsEmail() {
  const user = await checkUser();
  if (!user || !user.email || !user.clerkUserId) return { error: 'User not authenticated' };

  // 1. Setup Formatting & Dates
  const currentMonthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date());
  
  const formatter = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    currencyDisplay: 'symbol',
    maximumFractionDigits: 2,
  });

  // 2. Fetch Data
  const budgetRecord = await db.budget.findFirst({
    where: { userId: user.clerkUserId },
    orderBy: { monthStart: 'desc' },
    select: { monthlyTotal: true }
  });

  const insights = await getAIInsights();
  const statsRes = await getUserRecord();
  const rangeRes = await getBestWorstExpense();

  const monthlyBudget = budgetRecord?.monthlyTotal || 0;
  const totalSpent = statsRes.record || 0;
  const daysWithRecords = statsRes.daysWithRecords || 0;
  const avgDaily = daysWithRecords > 0 ? totalSpent / daysWithRecords : 0;
  const highest = rangeRes.bestExpense ?? 0;
  const lowest = rangeRes.worstExpense ?? 0;

  // Calculate Budget Progress
  const budgetPercentage = monthlyBudget > 0 ? Math.min((totalSpent / monthlyBudget) * 100, 100) : 0;
  const isOverBudget = totalSpent > monthlyBudget && monthlyBudget > 0;

  // Formatted Strings for HTML
  const formattedAvg = formatter.format(avgDaily);
  const formattedHighest = highest !== 0 ? formatter.format(highest) : 'No data';
  const formattedLowest = lowest !== 0 ? formatter.format(lowest) : 'No data';
  const formattedBudget = formatter.format(monthlyBudget);
  const formattedTotal = formatter.format(totalSpent);

  // Fetch top categories (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const topCatsResult = await db.records.groupBy({
    by: ['category'],
    where: { userId: user.clerkUserId, createdAt: { gte: thirtyDaysAgo } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: 'desc' } },
    take: 5,
  });

  const html = `
    <div style="font-family: system-ui, -apple-system, sans-serif; color: #0f172a; max-width:600px; margin:0 auto; padding: 20px; background: #f8fafc;">
      <div style="background:#0f172a; color:#fff; padding:24px; border-radius:16px 16px 0 0; text-align:left;">
        <h1 style="margin:0; font-size:22px; letter-spacing:-0.02em;">SmartJuanPeso</h1>
        <p style="margin:4px 0 0 0; font-size:14px; opacity:0.7">${currentMonthName} Financial Report</p>
      </div>

      <div style="background:#fff; padding:24px; border-radius: 0 0 16px 16px; border:1px solid #e2e8f0; border-top:0;">
        
        <div style="background:#ffffff; padding:18px; border-radius:12px; margin-bottom:24px; border: 2px solid #f1f5f9;">
          <h2 style="font-size:12px; color:#64748b; margin:0 0 12px 0; text-transform:uppercase; letter-spacing:0.1em; font-weight: 800;">${currentMonthName} Budget</h2>
          <div style="display:flex; justify-content:space-between; margin-bottom:10px; align-items: baseline;">
            <span style="font-size:20px; font-weight:800; color:#0f172a;">${formattedTotal}</span>
            <span style="font-size:13px; color:#64748b;">of ${formattedBudget} spent</span>
          </div>
          <div style="width:100%; background:#f1f5f9; height:12px; border-radius:6px; overflow:hidden;">
            <div style="width:${budgetPercentage}%; background:${isOverBudget ? '#ef4444' : '#0f172a'}; height:100%;"></div>
          </div>
          <p style="font-size:12px; margin-top:12px; color:${isOverBudget ? '#ef4444' : '#475569'}; font-weight:600; display: flex; align-items: center; gap: 4px;">
            ${isOverBudget ? '⚠️ Over budget' : `✨ ${budgetPercentage.toFixed(1)}% consumed`}
          </p>
        </div>

        <h2 style="font-size:15px; color:#0f172a; margin:0 0 12px 0; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">AI Insights</h2>
        <div style="margin-bottom:24px;">
          ${insights.map((i) => {
            const color = i.type === 'warning' ? '#fff7ed' : '#f0f9ff';
            const border = i.type === 'warning' ? '#fb923c' : '#3b82f6';
            const textColor = i.type === 'warning' ? '#9a3412' : '#1e40af';
            
            // Safety check: Replace any stray $ with ₱ in AI text
            const cleanMessage = i.message.replace(/\$/g, '₱');
            const cleanTitle = i.title.replace(/\$/g, '₱');

            return `
              <div style="background:${color}; padding:14px; border-left:4px solid ${border}; border-radius:8px; margin-bottom:12px;">
                <div style="font-weight:800; color:${textColor}; font-size:13px; text-transform: uppercase;">${cleanTitle}</div>
                <div style="color:#334155; font-size:13px; margin-top:6px; line-height: 1.6;">${cleanMessage}</div>
              </div>
            `;
          }).join('')}
        </div>

        <table width="100%" style="border-collapse:collapse; margin-bottom:24px;">
          <tr>
            <td style="padding-right:8px; width:50%;">
              <div style="background:#f8fafc; padding:12px; border-radius:10px; border: 1px solid #e2e8f0;">
                <div style="font-size:10px; color:#64748b; text-transform:uppercase; font-weight:700;">Daily Avg</div>
                <div style="font-size:15px; font-weight:800; color:#0f172a; margin-top:4px;">${formattedAvg}</div>
              </div>
            </td>
            <td style="padding-left:8px; width:50%;">
               <div style="background:#f8fafc; padding:12px; border-radius:10px; border: 1px solid #e2e8f0;">
                <div style="font-size:10px; color:#64748b; text-transform:uppercase; font-weight:700;">Peak Spend</div>
                <div style="font-size:15px; font-weight:800; color:#b91c1c; margin-top:4px;">${formattedHighest}</div>
              </div>
            </td>
          </tr>
        </table>

        <h2 style="font-size:15px; color:#0f172a; margin:0 0 12px 0; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">Top Categories</h2>
        <table width="100%" style="border-collapse:collapse; margin-bottom:24px;">
          ${(topCatsResult as TopCatRow[]).map((c) => `
            <tr>
              <td style="padding:12px 0; border-bottom:1px solid #f1f5f9; font-size:13px; color: #475569; font-weight: 500;">${c.category}</td>
              <td style="padding:12px 0; border-bottom:1px solid #f1f5f9; text-align:right; font-size:13px; font-weight:800; color: #0f172a;">${formatter.format(c._sum.amount || 0)}</td>
            </tr>
          `).join('')}
        </table>

        <div style="text-align:center; margin-top:30px; padding-top:24px; border-top:1px solid #e2e8f0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="display:inline-block; background:#0f172a; color:#fff; padding:14px 32px; border-radius:12px; text-decoration:none; font-weight:800; font-size:13px; text-transform: uppercase; letter-spacing: 0.05em;">Open SmartJuanPeso</a>
          <p style="color:#94a3b8; font-size:10px; margin-top:24px; font-weight: 500;">Sent via SmartJuanPeso AI Engine • ${new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  `;

  try {
    await sendEmail({
      to: user.email,
      subject: `SmartJuanPeso: Your ${currentMonthName} Summary`,
      html,
      text: `Your SmartJuanPeso report for ${currentMonthName} is ready. Total spent: ${formattedTotal}.`,
    });

    const reportDb = db as unknown as DBWithEmailReport;
    await reportDb.emailReport.create({
      data: {
        userId: user.clerkUserId,
        email: user.email,
        subject: `SmartJuanPeso AI Insights - ${currentMonthName}`,
        provider: process.env.RESEND_API_KEY ? 'resend' : 'nodemailer',
        status: 'sent',
      },
    });

    return { ok: true };
  } catch (error) {
    console.error('Email error:', error);
    return { error: 'Failed to send email' };
  }
}