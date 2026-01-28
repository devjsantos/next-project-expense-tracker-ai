export const dynamic = "force-dynamic";

import Guest from '@/components/Guest';
import { checkUser } from '@/lib/checkUser';
import { redirect } from 'next/navigation';
import AuthRefreshOnSignIn from '@/components/AuthRefreshOnSignIn';

export default async function HomePage() {
  const user = await checkUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <>
      <Guest />
      <AuthRefreshOnSignIn />
    </>
  );
}