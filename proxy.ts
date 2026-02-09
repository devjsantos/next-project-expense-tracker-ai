import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/about(.*)',
  '/contact(.*)',
  '/',
  '/manifest.json',
  '/icons/(.*)',
  '/logo/(.*)',
  '/sounds/(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) return;
  await auth.protect();
});

export const config = {
  matcher: [
    // Mas malinis na exclusion list
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|logo|sounds|sw.js|workbox-).*)',
    '/(api|trpc)(.*)',
  ],
};