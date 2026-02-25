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
  ChartOptions,
  ChartData
} from 'chart.js';
import { useTheme } from '@/contexts/ThemeContext';
import { useState, useEffect, useMemo } from 'react';
import { Calendar } from 'lucide-react';

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

  const processedData = useMemo(() => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    const dateMap = new Map<string, { total: number; originalDate: Date }>();

    const filteredRecords = records.filter((r) => {
      if (range === 'all') return true;
      const recordDate = new Date(r.date);
      const diffTime = now.getTime() - recordDate.getTime();
      const diffDays = diffTime / (1000 * 3600 * 24);

      if (range === '7d') return diffDays <= 7;
      if (range === '30d') return diffDays <= 30;
      return true;
    });

    filteredRecords.forEach((record) => {
      const d = new Date(record.date);
      const dateKey = d.toLocaleDateString('en-US');
      const existing = dateMap.get(dateKey);
      if (existing) {
        existing.total += Number(record.amount);
      } else {
        dateMap.set(dateKey, { total: Number(record.amount), originalDate: d });
      }
    });

    const sorted = Array.from(dateMap.values())
      .sort((a, b) => a.originalDate.getTime() - b.originalDate.getTime());

    const totalInRange = sorted.reduce((sum, item) => sum + item.total, 0);

    return { sorted, totalInRange };
  }, [records, range]);

  // FIX 1: Explicitly type the ChartData to avoid "string | number" mismatch
  const chartData: ChartData<'bar'> = {
    labels: processedData.sorted.map((item) =>
      item.originalDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    ),
    datasets: [
      {
        data: processedData.sorted.map((item) => item.total),
        backgroundColor: isDark ? 'rgba(99, 102, 241, 0.5)' : 'rgba(79, 70, 229, 0.2)',
        borderColor: '#6366f1',
        borderWidth: 2,
        borderRadius: isMobile ? 4 : 8,
        hoverBackgroundColor: '#6366f1',
        // Use 'as const' to tell TS this is the literal "flex"
        barThickness: (isMobile ? 'flex' : 28) as number | "flex",
        maxBarThickness: 40,
      },
    ],
  };

  // FIX 2: Explicitly type Options and use "bold" instead of "700"
  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeOutQuart' as const
    },
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
          label: (context) => ` ₱${(context.raw as number).toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: isDark ? '#64748b' : '#94a3b8',
          font: { size: 10, weight: 'bold' }, // "bold" is a valid Chart.js font weight type
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: isMobile ? 5 : 10
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(241, 245, 249, 1)',
        },
        ticks: {
          color: isDark ? '#64748b' : '#94a3b8',
          font: { size: 10 },
          callback: (value) => '₱' + value.toLocaleString(),
          maxTicksLimit: 5,
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-inner">
          {(['7d', '30d', 'all'] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${range === r
                  ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-md transform scale-105'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
            >
              {r === '7d' ? 'Week' : r === '30d' ? 'Month' : 'All'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 px-5 py-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-[1.25rem] border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
          <Calendar size={16} className="text-indigo-500" />
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-indigo-500/60 uppercase tracking-[0.2em] leading-none mb-1">Total Spent</span>
            <span className="text-sm font-black text-slate-800 dark:text-white leading-none">
              ₱{processedData.totalInRange.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="relative w-full h-64 sm:h-72 md:h-80 transition-all duration-500">
        <Bar key={range} data={chartData} options={options} />
      </div>
    </div>
  );
};

export default BarChart;