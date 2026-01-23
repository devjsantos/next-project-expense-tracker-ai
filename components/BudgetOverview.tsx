"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import BudgetSettings from "./BudgetSettings";

type PerCat = { category: string; allocated: number; spent: number };

interface BudgetData {
  monthStart: string;
  budget: { monthlyTotal: number } | null;
  totalSpent: number;
  remaining: number;
  percentUsed: number;
  dailyAverage: number;
  daysLeft: number;
  perCategory: PerCat[];
}

interface BudgetOverviewProps {
  month?: string;
}

export default function BudgetOverview({ month }: BudgetOverviewProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BudgetData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);

  // useCallback ensures fetchStatus has a stable reference for useEffect dependencies
  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const q = month ? `?month=${encodeURIComponent(month)}` : "";
      const res = await fetch(`/api/budget/status${q}`);
      if (!res.ok) throw new Error("Failed to fetch budget status");
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Failed to fetch budget status", error);
    } finally {
      setLoading(false);
    }
  }, [month]);

  // Fetch budget status on mount or when month changes
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Listen for global events to refresh budget status in real-time
  useEffect(() => {
    const handler = () => fetchStatus();

    window.addEventListener("records:changed", handler);
    window.addEventListener("budget:changed", handler);

    return () => {
      window.removeEventListener("records:changed", handler);
      window.removeEventListener("budget:changed", handler);
    };
  }, [fetchStatus]);

  // Modal focus trap and Escape-to-close
  useEffect(() => {
    if (!showModal || !modalRef.current) return;
    const node = modalRef.current as HTMLElement;
    // focus first focusable element
    const focusable = node.querySelectorAll<HTMLElement>("a, button, input, select, textarea, [tabindex]:not([tabindex='-1'])");
    if (focusable.length) focusable[0].focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowModal(false);
        return;
      }
      if (e.key === 'Tab') {
        const elems = Array.from(focusable).filter(el => !el.hasAttribute('disabled')) as HTMLElement[];
        if (elems.length === 0) return;
        const first = elems[0];
        const last = elems[elems.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [showModal]);

  if (loading)
    return (
      <div className="p-4 bg-white/80 dark:bg-gray-800/80 rounded-lg">
        Loading budget...
      </div>
    );

  if (!data)
    return (
      <div className="p-4 bg-white/80 dark:bg-gray-800/80 rounded-lg">
        No data
      </div>
    );

  const budget = data.budget;
  const percent = data.percentUsed ?? 0;
  const pctText = `${Math.round(percent * 100)}%`;

  return (
    <div className="p-4 bg-white/80 dark:bg-gray-800/80 rounded-lg shadow mb-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold">Monthly Budget</h3>
          <div className="text-xs text-gray-500">
            Period: {new Date(data.monthStart).toLocaleDateString()}
          </div>
        </div>
        <div className="text-right flex items-center gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="text-xs px-3 py-1 bg-indigo-600 text-white rounded"
          >
            Manage Budget
          </button>
          <button
            onClick={async () => {
              try {
                const q = month ? `?month=${encodeURIComponent(month)}` : "";
                const res = await fetch(`/api/budget/export${q}`);
                if (!res.ok) throw new Error("Export failed");
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `budget-${month || "export"}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
              } catch (error) {
                console.error("Export failed", error);
                alert("Failed to export CSV");
              }
            }}
            className="px-3 py-1.5 bg-white text-indigo-600 rounded-lg font-medium text-xs border border-indigo-200 hover:shadow-md transition-all duration-200"
          >
            Export CSV
          </button>
          <div className="text-right">
            <div className="text-sm font-medium">
              {budget ? `₱${Number(budget.monthlyTotal).toFixed(2)}` : "No budget set"}
            </div>
            <div className="text-xs text-gray-500">
              Spent: ₱{Number(data.totalSpent).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden mb-3">
        <div
          className={`h-3 bg-gradient-to-r from-indigo-500 to-teal-400`}
          style={{ width: `${percent * 100}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
        <div>Used: {pctText}</div>
        <div>
          Remaining: {budget ? `₱${Number(data.remaining).toFixed(2)}` : "-"}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
        <div>Daily avg: ₱{data.dailyAverage.toFixed(2)}</div>
        <div>Days left: {data.daysLeft ?? "-"}</div>
      </div>

      {Array.isArray(data.perCategory) && data.perCategory.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold mb-2">By Category</h4>
          <div className="space-y-2">
            {data.perCategory.map((c) => {
              const used = c.allocated > 0 ? Math.min(1, c.spent / c.allocated) : 0;
              return (
                <div key={c.category} className="text-xs">
                  <div className="flex justify-between mb-1">
                    <div className="font-medium">{c.category}</div>
                    <div className="text-gray-500">
                      ₱{Number(c.spent).toFixed(2)} / ₱{Number(c.allocated).toFixed(2)}
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div className="h-2 bg-yellow-400" style={{ width: `${used * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal for Add/Edit Budget */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowModal(false)}
          />
          <div className="relative w-full max-w-3xl mx-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4" ref={modalRef} role="dialog" aria-modal="true">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Manage Budget</h3>
                <button
                  onClick={() => setShowModal(false)}
                  aria-label="Close budget modal"
                  className="text-gray-600 dark:text-gray-300 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <BudgetSettings
                initial={{ month: month }}
                onClose={() => setShowModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
