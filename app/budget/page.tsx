import getBudgets from '@/app/actions/getBudgets';
import BudgetSettings from '@/components/BudgetSettings';

export default async function Page(){
  // server-side fetch budgets and pass initial data for current month
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1,0,0,0));
  const res = await getBudgets();
  let initial = { month: monthStart.toISOString().slice(0,7) } as { month: string; monthlyTotal?: number; allocations?: { category: string; amount: number }[] };
  if (!res.error && Array.isArray(res.budgets)){
    const found = res.budgets.find((b) => new Date(b.monthStart).toISOString() === monthStart.toISOString());
    if (found) {
      initial = { month: monthStart.toISOString().slice(0,7), monthlyTotal: found.monthlyTotal, allocations: found.allocations };
    }
  }

  return (
    <div className='p-4'>
      <h2 className='text-xl font-bold mb-4'>Budget Settings</h2>
      <BudgetSettings initial={initial} />
    </div>
  );
}
