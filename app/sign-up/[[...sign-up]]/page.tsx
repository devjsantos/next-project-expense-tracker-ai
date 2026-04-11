import { SignUp } from '@clerk/nextjs';

export default function Page({ searchParams }: { searchParams?: { [key: string]: string | string[] } }) {
  const raw = searchParams?.redirect_url ?? searchParams?.redirectUrl;
  const redirectUrl = Array.isArray(raw) ? raw[0] : raw;

  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignUp forceRedirectUrl={redirectUrl ?? '/dashboard'} />
    </div>
  );
}