import React from 'react';

interface BudgetProgressBarProps {
  label: string;
  value: number;
  max: number;
  color?: string;
  showValue?: boolean;
}

export default function BudgetProgressBar({ label, value, max, color = 'bg-indigo-500', showValue = true }: BudgetProgressBarProps) {
  const percent = Math.min(100, Math.round((value / max) * 100));
  const barColor = percent >= 100 ? 'bg-red-500' : color;
  return (
    <div className="mb-2">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{label}</span>
        {showValue && (
          <span className="text-xs text-gray-500 dark:text-gray-400">{value.toFixed(2)} / {max.toFixed(2)}</span>
        )}
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${percent}%` }}
        ></div>
      </div>
      {percent >= 100 && (
        <div className="text-xs text-red-600 mt-1">Over budget!</div>
      )}
    </div>
  );
}