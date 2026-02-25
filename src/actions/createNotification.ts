'use server';
import { db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Creates a system notification for a specific user.
 * @param userId - The Clerk User ID
 * @param type - 'info' | 'alert' | 'success'
 * @param title - Short header for the notification
 * @param message - Detailed body text
 */
export default async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string
) {
  if (!userId) {
    console.error('Notification failed: No userId provided');
    return;
  }

  try {
    await db.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        read: false // Explicitly set default
      }
    });

    // Revalidate the root and dashboard to ensure the Bell icon updates
    revalidatePath('/');
    revalidatePath('/dashboard');
  } catch (error) {
    console.error('Failed to create notification in Database:', error);
  }
}