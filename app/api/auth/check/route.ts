import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();
    return NextResponse.json({ signedIn: !!userId });
  } catch (e) {
    return NextResponse.json({ signedIn: false });
  }
}
