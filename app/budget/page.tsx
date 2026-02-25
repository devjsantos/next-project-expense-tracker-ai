import getBudgets from '@/actions/getBudgets';
import BudgetOverview from '@/components/BudgetOverview';
import RecurringExpenses from '@/components/RecurringExpenses';
import BudgetHistory from '@/components/BudgetHistory';

/* ================= TYPES ================= */
interface Allocation { category: string; amount: number; }
interface BudgetEntry { id: string; monthStart: string; monthlyTotal: number; allocations: Allocation[]; }
interface InitialBudget { month: string; monthlyTotal?: number; allocations?: Allocation[]; }
interface GetBudgetsResponse { budgets?: BudgetEntry[]; error?: string | { message: string; type?: string }; }

/* ================= COMPONENT ================= */
export default async function Page() {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthKey = monthStart.toISOString().slice(0, 7);

  const res = (await getBudgets()) as GetBudgetsResponse;
  
  if (res && res.error) {
    const errorDisplay = typeof res.error === 'object' ? res.error.message : res.error;
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="bg-red-50/50 dark:bg-red-900/10 border-l-4 border-red-500 p-6 rounded-2xl">
          <h3 className="text-red-800 dark:text-red-400 font-black uppercase text-xs tracking-widest mb-1">System Error</h3>
          <p className="text-sm text-red-600/80 dark:text-red-400/60 font-medium">{errorDisplay}</p>
        </div>
      </div>
    );
  }

  const budgetsList = Array.isArray(res?.budgets) ? res.budgets : [];
  let initial: InitialBudget = { month: monthKey };

  const found = budgetsList.find((b: BudgetEntry) => {
    try { return new Date(b.monthStart).toISOString().slice(0, 7) === monthKey; } 
    catch (e) { return false; }
  });

  if (found) {
    initial = { month: monthKey, monthlyTotal: found.monthlyTotal, allocations: found.allocations };
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <header className="mb-10">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-2">Planning Center</p>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
            Budget Settings
          </h2>
        </header>
        
        {/* Main 12-Column Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Budget Planning (8 Columns) */}
          <div className="xl:col-span-8 space-y-8">
            <section>
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl shadow-indigo-500/5 border border-slate-100 dark:border-slate-800 overflow-hidden transition-all hover:shadow-2xl hover:shadow-indigo-500/10">
                <BudgetOverview month={initial.month} />
              </div>
            </section>

            <section>
              {/* Recurring Expenses now gets more room to show its sleek new design */}
              <RecurringExpenses />
            </section>
          </div>

          {/* RIGHT COLUMN: History & Context (4 Columns) */}
          <aside className="xl:col-span-4 space-y-8">
            <div className="sticky top-8 space-y-8">
              <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl shadow-slate-500/5 border border-slate-100 dark:border-slate-800 p-2 overflow-hidden">
                <BudgetHistory budgets={budgetsList} />
              </section>

              {/* System Note */}
              <div className="p-8 bg-gradient-to-br from-slate-800 to-slate-900 dark:from-indigo-950 dark:to-slate-900 rounded-[2rem] text-white relative overflow-hidden group">
                 <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Pro Tip</p>
                    <p className="text-xs font-bold leading-relaxed opacity-90 group-hover:opacity-100 transition-opacity">
                      Changes to your <b>Recurring Rules</b> will reflect in next month's total load automatically.
                    </p>
                 </div>
                 <div className="absolute -right-4 -bottom-4 text-7xl opacity-5 select-none">⚙️</div>
              </div>
            </div>
          </aside>
          
        </div>
      </div>
    </main>
  );
}