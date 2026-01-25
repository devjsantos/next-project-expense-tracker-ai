import getBudgets from '@/app/actions/getBudgets';
import BudgetOverview from '@/components/BudgetOverview';
import RecurringExpenses from '@/components/RecurringExpenses';
import BudgetHistory from '@/components/BudgetHistory';

/* ================= TYPES ================= */

interface Allocation {
  category: string;
  amount: number;
}

interface BudgetEntry {
  id: string;
  monthStart: string; // usually ISO date string
  monthlyTotal: number;
  allocations: Allocation[];
}

interface InitialBudget {
  month: string;
  monthlyTotal?: number;
  allocations?: Allocation[];
}

/* ================= COMPONENT ================= */

export default async function Page() {
  const now = new Date();
  // Create a stable UTC reference for the 1st of the month
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthKey = monthStart.toISOString().slice(0, 7); // "2026-01"

  const res = await getBudgets();
  
  let initial: InitialBudget = { 
    month: monthKey 
  };

  // Fixed the 'any' by using the BudgetEntry interface
  if (res && !res.error && Array.isArray(res.budgets)) {
    const found = (res.budgets as BudgetEntry[]).find((b: BudgetEntry) => {
      // Safely compare the YYYY-MM parts
      return new Date(b.monthStart).toISOString().slice(0, 7) === monthKey;
    });

    if (found) {
      initial = {
        month: monthKey,
        monthlyTotal: found.monthlyTotal,
        allocations: found.allocations,
      };
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
        Budget Settings
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {/* We pass the clean "YYYY-MM" string to the Overview */}
          <BudgetOverview month={initial.month} />
        </div>
        <div className="space-y-4">
          <BudgetHistory budgets={res?.budgets || []} />
          <RecurringExpenses />
        </div>
      </div>
    </div>
  );
}