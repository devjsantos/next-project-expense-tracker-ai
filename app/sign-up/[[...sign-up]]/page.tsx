import { SignUp } from '@clerk/nextjs';

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] }>;
}) {
  const params = await searchParams;

  const raw = params?.redirect_url ?? params?.redirectUrl;
  const redirectUrl = Array.isArray(raw) ? raw[0] : raw;

  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignUp forceRedirectUrl={redirectUrl ?? '/dashboard'} />
    </div>
  );
}