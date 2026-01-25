'use server';
import { db } from '@/lib/prisma';

export default async function createNotification(userId: string, type: string, title: string, message: string) {
  try {
    await db.notification.create({ data: { userId, type, title, message } });
  } catch (e) {
    console.error('Failed to create notification', e);
  }
}
