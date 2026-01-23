export const dynamic = "force-dynamic";

import AddNewRecord from '@/components/AddNewRecord';
import AIInsights from '@/components/AiInsights';
import ExpenseStats from '@/components/ExpenseStats';
import Guest from '@/components/Guest';
import RecordChart from '@/components/RecordChart';
import RecordHistory from '@/components/RecordHistory';
import { checkUser } from '@/lib/checkUser';
import Image from 'next/image';
import AuthRefreshOnSignIn from '@/components/AuthRefreshOnSignIn';

export default async function HomePage() {
  const user = await checkUser();
  console.log('checkUser:', user);

  if (!user) {
    // Render `Guest` and include a small client helper that will reload
    // the page once Clerk finishes signing in so the server will see
    // the session on the next request (avoids needing a manual click).
    return (
      <>
        <Guest />
        <AuthRefreshOnSignIn />
      </>
    );
  }

  // ✅ Safely derive first name from DB "name"
  const firstName =
    user.name?.split(' ')[0] || 'User';

  return (
    <main className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans min-h-screen transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* LEFT COLUMN */}
          <div className="space-y-4 sm:space-y-6">
            {/* WELCOME CARD */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 sm:p-6 lg:p-8 rounded-2xl shadow-xl border border-gray-100/50 dark:border-gray-700/50 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              {/* AVATAR */}
              <div className="relative flex-shrink-0">
                <Image
                  src={user.imageUrl || '/default-avatar.png'}
                  alt={`${firstName}'s profile`}
                  width={80}
                  height={80}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-white dark:border-gray-600 shadow-lg object-cover"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              </div>

              {/* USER INFO */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 via-blue-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-sm sm:text-lg">👋</span>
                  </div>
                  <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Welcome Back, {firstName}!
                  </h2>
                </div>

                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 max-w-md mx-auto sm:mx-0">
                  Here&#39;s a quick overview of your recent expense activity.
                  Track your spending, analyze patterns, and manage your budget efficiently!
                </p>

                {/* BADGES */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  {/* JOINED */}
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 border border-indigo-100 dark:border-indigo-800 px-3 py-2 rounded-xl flex items-center gap-2">
                    <span className="text-xs">📅</span>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block">
                        Joined
                      </span>
                      <span className="text-sm font-semibold">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* LAST ACTIVE (using updatedAt) */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-100 dark:border-blue-800 px-3 py-2 rounded-xl flex items-center gap-2">
                    <span className="text-xs">⚡</span>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block">
                        Last Active
                      </span>
                      <span className="text-sm font-semibold">
                        {new Date(user.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <AddNewRecord />
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-4 sm:space-y-6">
            <RecordChart />
            <ExpenseStats />
          </div>
        </div>

        <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-6">
          <AIInsights />
          <RecordHistory />
        </div>
      </div>
    </main>
  );
}
