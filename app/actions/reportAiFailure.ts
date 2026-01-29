'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/prisma';
import { checkUser } from '@/lib/checkUser';

export default async function reportAiFailure(details: { message: string; errors?: any }) {
  try {
    const user = await checkUser();
    const created = await db.aIEvent.create({
      data: {
        userId: user?.clerkUserId || null,
        eventType: 'ai_failure',
        message: details.message,
        details: details.errors ? details.errors : null,
      }
    });
    // Optionally revalidate homepage to surface changes
    try { revalidatePath('/'); } catch {}
    return { ok: true, id: created.id };
  } catch (error) {
    console.error('Failed to report AI failure:', error);
    return { ok: false, error: String(error) };
  }
}
