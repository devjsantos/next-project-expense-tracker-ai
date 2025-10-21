export interface Expense {
  amount: number;
  category: string;
  date: string; // ISO
}

export interface Allocation {
  category: string;
  amount: number;
}

export interface Budget {
  monthlyTotal: number;
  monthStart: string; // ISO
  allocations: Allocation[];
}

export interface Alert {
  type: 'warning' | 'info' | 'success';
  message: string;
}

// Calculate month start UTC for a given date
export function monthStartForDate(dateIso: string) {
  const d = new Date(dateIso);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0)).toISOString();
}

// Given a list of expenses, a budget and a new expense, produce alerts
export function calculateBudgetAlerts(expenses: Expense[], budget: Budget | null, newExpense: Expense): Alert[] {
  if (!budget) return [];

  const monthStart = budget.monthStart;
  const monthEnd = new Date(monthStart);
  monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);

  const monthExpenses = expenses.filter((e) => e.date >= monthStart && e.date < monthEnd.toISOString());
  const currentTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const newTotal = currentTotal + newExpense.amount;

  const alerts: Alert[] = [];
  if (budget.monthlyTotal > 0 && newTotal > budget.monthlyTotal) {
    alerts.push({ type: 'warning', message: `Monthly budget exceeded: ${newTotal.toFixed(2)} / ${budget.monthlyTotal.toFixed(2)}` });
  } else if (budget.monthlyTotal > 0 && newTotal > budget.monthlyTotal * 0.8) {
    alerts.push({ type: 'info', message: `You're approaching your monthly budget: ${newTotal.toFixed(2)} / ${budget.monthlyTotal.toFixed(2)}` });
  }

  const alloc = budget.allocations.find((a) => a.category === newExpense.category);
  if (alloc && alloc.amount > 0) {
    const currentCatTotal = monthExpenses.filter((e) => e.category === newExpense.category).reduce((s, e) => s + e.amount, 0);
    const newCatTotal = currentCatTotal + newExpense.amount;
    if (newCatTotal > alloc.amount) {
      alerts.push({ type: 'warning', message: `Category '${newExpense.category}' budget exceeded: ${newCatTotal.toFixed(2)} / ${alloc.amount.toFixed(2)}` });
    } else if (newCatTotal > alloc.amount * 0.9) {
      alerts.push({ type: 'info', message: `Approaching '${newExpense.category}' allocation: ${newCatTotal.toFixed(2)} / ${alloc.amount.toFixed(2)}` });
    }
  }

  return alerts;
}
