export interface Expense {
  amount: number;
  category: string;
  date: string; // ISO String
}

export interface Allocation {
  category: string;
  amount: number;
}

export interface Budget {
  monthlyTotal: number;
  monthStart: string; // ISO String
  allocations: Allocation[];
}

export interface Alert {
  type: 'warning' | 'info' | 'success';
  message: string;
}

/**
 * Normalizes a date to the first day of its month in UTC.
 * Essential for comparing expenses to the correct budget month.
 */
export function monthStartForDate(dateIso: string): string {
  const d = new Date(dateIso);
  // Using UTC to avoid timezone shifts that can move a date to the previous/next month
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0)).toISOString();
}

/**
 * Logic to calculate alerts based on spending thresholds.
 * Handles both total monthly budget and specific category allocations.
 */
export function calculateBudgetAlerts(
  expenses: Expense[], 
  budget: Budget | null, 
  newExpense: Expense
): Alert[] {
  if (!budget) return [];

  const alerts: Alert[] = [];
  const monthStart = budget.monthStart;
  const nextMonth = new Date(monthStart);
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
  const monthEndStr = nextMonth.toISOString();

  // 1. Filter expenses strictly within the budget month
  const monthExpenses = expenses.filter(
    (e) => e.date >= monthStart && e.date < monthEndStr
  );

  // 2. Monthly Total Logic
  // Using Math.round to avoid 0.30000000000000004 floating point errors
  const currentTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const newTotal = Number((currentTotal + newExpense.amount).toFixed(2));

  if (budget.monthlyTotal > 0) {
    if (newTotal > budget.monthlyTotal) {
      alerts.push({ 
        type: 'warning', 
        message: `Monthly budget exceeded: ₱${newTotal.toLocaleString()} / ₱${budget.monthlyTotal.toLocaleString()}` 
      });
    } else if (newTotal > budget.monthlyTotal * 0.8) {
      alerts.push({ 
        type: 'info', 
        message: `You've used ${( (newTotal / budget.monthlyTotal) * 100 ).toFixed(0)}% of your monthly budget.` 
      });
    }
  }

  // 3. Category Allocation Logic
  const alloc = budget.allocations?.find((a) => a.category === newExpense.category);
  
  if (alloc && alloc.amount > 0) {
    const currentCatTotal = monthExpenses
      .filter((e) => e.category === newExpense.category)
      .reduce((s, e) => s + e.amount, 0);
      
    const newCatTotal = Number((currentCatTotal + newExpense.amount).toFixed(2));

    if (newCatTotal > alloc.amount) {
      alerts.push({ 
        type: 'warning', 
        message: `Category '${newExpense.category}' exceeded: ₱${newCatTotal.toLocaleString()} / ₱${alloc.amount.toLocaleString()}` 
      });
    } else if (newCatTotal > alloc.amount * 0.9) {
      alerts.push({ 
        type: 'info', 
        message: `Used ${( (newCatTotal / alloc.amount) * 100 ).toFixed(0)}% of '${newExpense.category}' allocation.` 
      });
    }
  }

  return alerts;
}