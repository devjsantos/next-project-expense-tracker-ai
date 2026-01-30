'use client';

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useTheme } from '@/contexts/ThemeContext';
import { useState, useEffect, useMemo } from 'react';
import { Calendar, Filter } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Record {
  date: string;
  amount: number;
  category: string;
}

type TimeRange = '7d' | '30d' | 'all';

const BarChart = ({ records }: { records: Record[] }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [range, setRange] = useState<TimeRange>('7d');
  const [windowWidth, setWindowWidth] = useState(1024);

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 640;

  // 1. FILTER & AGGREGATE LOGIC
  const processedData = useMemo(() => {
    const now = new Date();
    const dateMap = new Map<string, { total: number; categories: string[]; originalDate: Date }>();

    // Filter records based on selected range
    const filteredRecords = records.filter((r) => {
      const recordDate = new Date(r.date);
      if (range === '7d') return (now.getTime() - recordDate.getTime()) / (1000 * 3600 * 24) <= 7;
      if (range === '30d') return (now.getTime() - recordDate.getTime()) / (1000 * 3600 * 24) <= 30;
      return true;
    });

    filteredRecords.forEach((record) => {
      const dateObj = new Date(record.date);
      const dateKey = dateObj.toISOString().split('T')[0];
      const existing = dateMap.get(dateKey);

      if (existing) {
        existing.total += record.amount;
        if (!existing.categories.includes(record.category)) existing.categories.push(record.category);
      } else {
        dateMap.set(dateKey, { total: record.amount, categories: [record.category], originalDate: dateObj });
      }
    });

    const sorted = Array.from(dateMap.entries())
      .map(([date, data]) => ({ date, amount: data.total, categories: data.categories, originalDate: data.originalDate }))
      .sort((a, b) => a.originalDate.getTime() - b.originalDate.getTime());

    const totalInRange = sorted.reduce((sum, item) => sum + item.amount, 0);

    return { sorted, totalInRange };
  }, [records, range]);

  // 2. CHART CONFIG
  const data = {
    labels: processedData.sorted.map((item) => {
      const d = item.originalDate;
      return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
    }),
    datasets: [
      {
        data: processedData.sorted.map((item) => item.amount),
        backgroundColor: isDark ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.15)',
        borderColor: '#6366f1',
        borderWidth: 2,
        borderRadius: isMobile ? 6 : 10,
        hoverBackgroundColor: '#6366f1',
        barThickness: isMobile ? 12 : 24,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
        titleColor: isDark ? '#f8fafc' : '#1e293b',
        bodyColor: isDark ? '#94a3b8' : '#64748b',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
        callbacks: {
          label: (context: any) => ` ₱${context.raw.toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: isDark ? '#64748b' : '#94a3b8', font: { size: 10, weight: 'bold' as const } },
      },
      y: {
        beginAtZero: true,
        grid: { color: isDark ? '#1e293b' : '#f1f5f9', drawTicks: false },
        ticks: {
          color: isDark ? '#64748b' : '#94a3b8',
          font: { size: 10 },
          callback: (value: any) => '₱' + value.toLocaleString(),
          maxTicksLimit: 5,
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* CONTROL BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
          {(['7d', '30d', 'all'] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                range === r
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-600'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              {r === '7d' ? 'Week' : r === '30d' ? 'Month' : 'All'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-2xl border border-indigo-100/50 dark:border-indigo-500/20">
          <Calendar size={14} className="text-indigo-500" />
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-indigo-500/60 uppercase tracking-[0.2em]">Period Total</span>
            <span className="text-xs font-black text-slate-800 dark:text-white">
              ₱{processedData.totalInRange.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* CHART CANVAS */}
      <div className="relative w-full h-64 sm:h-72 md:h-80 animate-in fade-in slide-in-from-bottom-2 duration-700">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};

export default BarChart;