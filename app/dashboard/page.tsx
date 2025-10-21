import RecordChart from '@/components/RecordChart';
import ExpenseStats from '@/components/ExpenseStats';
import { currentUser } from '@clerk/nextjs/server';

export default async function DashboardPage(){
  const user = await currentUser();
  if (!user) return <div className='p-4'>Please sign in to view your dashboard.</div>;
  return (
    <main className='min-h-screen p-4'>
      <h1 className='text-2xl font-bold mb-4'>Dashboard</h1>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        <RecordChart />
        <ExpenseStats />
      </div>
    </main>
  );
}
