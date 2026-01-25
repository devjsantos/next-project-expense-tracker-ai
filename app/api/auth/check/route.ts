import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();
    return NextResponse.json({ signedIn: !!userId });
  } catch {
    return NextResponse.json({ signedIn: false });
  }
}
