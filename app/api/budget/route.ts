import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7); 

    const startOfMonth = new Date(`${month}-01T00:00:00Z`);
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setUTCMonth(endOfMonth.getUTCMonth() + 1);

    const records = await db.records.findMany({
      where: { userId, date: { gte: startOfMonth, lt: endOfMonth } },
      orderBy: { date: 'desc' },
    });

    const totalAmount = records.reduce((sum, r) => sum + r.amount, 0);
    const dateExported = new Date().toLocaleDateString('en-PH');

    const summaryRows = [
      ["SMART JUAN PESO - BUDGET REPORT"],
      [`Month:`, month],
      [`Exported On:`, dateExported],
      [`Total Transactions:`, records.length],
      [`TOTAL SPENT:`, `PHP ${totalAmount.toFixed(2)}`],
      [], 
    ];

    const headers = ["DATE", "DESCRIPTION", "CATEGORY", "AMOUNT (PHP)"];
    
    const dataRows = records.map((r) => [
      new Date(r.date).toISOString().split('T')[0],
      `"${r.text.replace(/"/g, '""')}"`,
      r.category.toUpperCase(),
      r.amount.toFixed(2)
    ]);

    const csvContent = "sep=,\n" + [
      ...summaryRows.map(row => row.join(",")),
      headers.join(","),
      ...dataRows.map(row => row.join(",")),
      [], 
      ["", "", "GRAND TOTAL", totalAmount.toFixed(2)]
    ].join("\n");

    // Return a standard Response object with headers set specifically for CSV
    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="SmartJuanPeso-${month}.csv"`,
        "Cache-Control": "no-cache"
      },
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}