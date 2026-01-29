'use server';

import { db } from '@/lib/prisma';

export default async function getAiFailureDetails(id: string) {
  try {
    const row = await db.aiEvent.findUnique({ where: { id } });
    if (!row) return { ok: false, error: 'Not found' };
    return { ok: true, details: row.details, message: row.message, createdAt: row.createdAt };
  } catch (error) {
    console.error('Failed to fetch AI failure details', error);
    return { ok: false, error: String(error) };
  }
}
