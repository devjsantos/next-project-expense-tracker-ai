import AddNewRecord from '@/components/AddNewRecord';
import AIInsights from '@/components/AiInsights';
import ExpenseStats from '@/components/ExpenseStats';
import Guest from '@/components/Guest';
import RecordChart from '@/components/RecordChart';
import RecordHistory from '@/components/RecordHistory';
import { currentUser } from '@clerk/nextjs/server';
import Image from 'next/image';

export default async function HomePage() {
  const user = await currentUser();
  if (!user) {
    return <Guest />;
  }

  return (
    <main className='bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans min-h-screen transition-colors duration-300'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8'>
        
        <div className='mb-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4'>
          <Image
            src={user.imageUrl}
            alt={`${user.firstName}'s profile`}
            width={64}
            height={64}
            className="rounded-full border-2 border-indigo-100 dark:border-indigo-900 shadow-sm"
          />
          <div className='text-center sm:text-left'>
            <h2 className='text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100'>
              Welcome Back, {user.firstName}! 👋
            </h2>
            <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
              Here's your financial overview for today.
            </p>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
          
          <div className='lg:col-span-7 space-y-6 order-1'>
            <ExpenseStats />
            <RecordChart />
          </div>

          <div className='lg:col-span-5 space-y-6 order-2'>
            <AddNewRecord />
            <AIInsights />
          </div>

        </div>

        <div className='mt-6 order-3'>
          <RecordHistory />
        </div>

      </div>
    </main>
  );
}