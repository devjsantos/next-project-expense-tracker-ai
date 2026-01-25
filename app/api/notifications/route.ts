 'use server';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 401 });

  const url = new URL(req.url);
  const unreadOnly = url.searchParams.get('unread') === 'true';

  try {
    const where: Prisma.NotificationWhereInput = { userId };
    if (unreadOnly) where.read = false; // ✅ Use `read` instead of `readAt`

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const mapped = notifications.map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read, // ✅ Use `read` here too
      createdAt: n.createdAt,
    }));

    return NextResponse.json({ notifications: mapped });
  } catch (e) {
    console.error('Error fetching notifications', e);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 401 });

  try {
    const body = await req.json();
    const { ids, markAll } = body as { ids?: string[]; markAll?: boolean };

    if (markAll) {
      await db.notification.updateMany({
        where: { userId, read: false }, // ✅ Use `read`
        data: { read: true },
      });
      return NextResponse.json({ success: true });
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids required' }, { status: 400 });
    }

    await db.notification.updateMany({
      where: { id: { in: ids }, userId },
      data: { read: true },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Error updating notifications', e);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
