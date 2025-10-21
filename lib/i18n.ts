export const en = {
  budgetSaved: 'Budget saved',
  failedSave: 'Failed to save budget',
  monthlyExceeded: 'Monthly budget exceeded',
  approachingMonthly: "You're approaching your monthly budget",
};

export default function t(key: keyof typeof en){
  return en[key] || key;
}
