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
  monthStart: string; 
  monthlyTotal: number;
  allocations: Allocation[];
}

interface InitialBudget {
  month: string;
  monthlyTotal?: number;
  allocations?: Allocation[];
}

// Added this to fix the "Property 'error' does not exist" error
interface GetBudgetsResponse {
  budgets?: BudgetEntry[];
  error?: string | { message: string; type?: string };
}

/* ================= COMPONENT ================= */

export default async function Page() {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthKey = monthStart.toISOString().slice(0, 7); // "2026-01"

  // Cast the response to our interface
  const res = (await getBudgets()) as GetBudgetsResponse;
  
  // 1. Handle error object safely
  if (res && res.error) {
    const errorDisplay = typeof res.error === 'object' 
      ? res.error.message 
      : res.error;

    return (
      <div className="p-6 text-center">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl">
          <p className="text-red-600 dark:text-red-400 font-bold">Failed to load budget</p>
          <p className="text-sm text-red-500 opacity-80">{errorDisplay}</p>
        </div>
      </div>
    );
  }

  const budgetsList = Array.isArray(res?.budgets) ? res.budgets : [];

  let initial: InitialBudget = { 
    month: monthKey 
  };

  const found = budgetsList.find((b: BudgetEntry) => {
    try {
      return new Date(b.monthStart).toISOString().slice(0, 7) === monthKey;
    } catch (e) {
      return false;
    }
  });

  if (found) {
    initial = {
      month: monthKey,
      monthlyTotal: found.monthlyTotal,
      allocations: found.allocations,
    };
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h2 className="text-2xl font-black mb-6 text-gray-900 dark:text-white uppercase tracking-tight">
        Budget Settings
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <BudgetOverview month={initial.month} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-1">
             <BudgetHistory budgets={budgetsList} />
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-1">
            <RecurringExpenses />
          </div>
        </div>
      </div>
    </div>
  );
}