'use server';
import { db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export default async function createNotification(userId: string, type: string, title: string, message: string) {
  try {
    await db.notification.create({ data: { userId, type, title, message } });
    // This clears the Next.js cache for any page using this data
    revalidatePath('/'); 
  } catch {
    console.error('Failed to create notification');
  }
}