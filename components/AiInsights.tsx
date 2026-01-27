'use client';

import { useState, useEffect } from 'react';
import { getAIInsights } from '@/app/actions/getAIInsights';
import { generateInsightAnswer } from '@/app/actions/generateInsightAnswer';
import { useToast } from '@/components/ToastProvider';

interface InsightData {
  id: string;
  type: 'warning' | 'info' | 'success' | 'tip';
  title: string;
  message: string;
  action?: string;
  confidence?: number;
}

interface AIAnswer {
  insightId: string;
  answer: string;
  isLoading: boolean;
}

const AIInsights = () => {
  const { addToast } = useToast();
  const [insights, setInsights] = useState<InsightData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmailing, setIsEmailing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [aiAnswers, setAiAnswers] = useState<AIAnswer[]>([]);

  // Helper to ensure Peso sign is used in AI text
  const formatPesoText = (text: string) => text.replace(/\$/g, '₱');

  const loadInsights = async () => {
    setIsLoading(true);
    try {
      const newInsights = await getAIInsights();
      setInsights(newInsights);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('❌ AIInsights: Failed to load AI insights:', error);
      setInsights([
        {
          id: 'fallback-1',
          type: 'info',
          title: 'AI Temporarily Offline',
          message: "Patterns are still being tracked, but real-time insights are currently reloading.",
          action: 'Try again later',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailReport = async () => {
    setIsEmailing(true);
    try {
      const { default: sendInsightsEmail } = await import('@/app/actions/sendInsightsEmail');
      const result = await sendInsightsEmail();

      if (result?.ok) {
        addToast('Insight report emailed successfully!', 'success');
      } else {
        // FIX: Don't pass 'result', pass 'result.error'
        const errorMsg = typeof result?.error === 'string'
          ? result.error
          : 'An unexpected error occurred';
        addToast(errorMsg, 'error');
      }
    } catch (err) {
      addToast('Failed to connect to email service.', 'error');
    } finally {
      setIsEmailing(false);
    }
  };

  const handleActionClick = async (insight: InsightData) => {
    if (!insight.action) return;

    const existingAnswer = aiAnswers.find((a) => a.insightId === insight.id);
    if (existingAnswer) {
      setAiAnswers((prev) => prev.filter((a) => a.insightId !== insight.id));
      return;
    }

    setAiAnswers((prev) => [
      ...prev,
      { insightId: insight.id, answer: '', isLoading: true },
    ]);

    try {
      const question = `${insight.title}: ${insight.action}`;
      const answer = await generateInsightAnswer(question);

      setAiAnswers((prev) =>
        prev.map((a) =>
          a.insightId === insight.id ? { ...a, answer: formatPesoText(answer), isLoading: false } : a
        )
      );
    } catch (error) {
      addToast('AI was unable to answer right now.', 'warning');
      setAiAnswers((prev) => prev.filter((a) => a.insightId !== insight.id));
    }
  };

  useEffect(() => {
    loadInsights();
  }, []);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'success': return '✅';
      case 'tip': return '💡';
      case 'info': return 'ℹ️';
      default: return '🤖';
    }
  };

  const getInsightColors = (type: string) => {
    switch (type) {
      case 'warning': return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'success': return 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-900/20';
      default: return 'border-l-indigo-500 bg-indigo-50 dark:bg-indigo-900/20';
    }
  };

  const getButtonColors = (type: string) => {
    switch (type) {
      case 'warning': return 'text-yellow-700 dark:text-yellow-300 hover:text-yellow-800';
      case 'success': return 'text-emerald-700 dark:text-emerald-300 hover:text-emerald-800';
      default: return 'text-indigo-700 dark:text-indigo-300 hover:text-indigo-800';
    }
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return 'Loading...';
    const diffMins = Math.floor((new Date().getTime() - lastUpdated.getTime()) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return lastUpdated.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className='bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-gray-100/50 dark:border-gray-700/50'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='w-10 h-10 bg-indigo-600 rounded-xl animate-pulse' />
          <div className='flex-1 space-y-2'>
            <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4' />
            <div className='h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2' />
          </div>
        </div>
        <div className='space-y-4'>
          {[1, 2].map((i) => (
            <div key={i} className='h-24 bg-gray-50 dark:bg-gray-800/50 rounded-xl animate-pulse' />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-xl border border-gray-100/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-300'>
      <div className='flex items-center justify-between mb-4 sm:mb-6'>
        <div className='flex items-center gap-2 sm:gap-3'>
          <div className='w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg'>
            <span className='text-white text-sm sm:text-lg'>🤖</span>
          </div>
          <div>
            <h3 className='text-lg sm:text-xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight'>AI Insights</h3>
            <p className='text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest'>SmartJuan Analysis</p>
          </div>
        </div>
        <div className='flex items-center gap-2 sm:gap-3'>
          <div className='inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest'>
            <span className='w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse'></span>
            <span>{formatLastUpdated()}</span>
          </div>
          <button
            onClick={loadInsights}
            className='w-8 h-8 bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl flex items-center justify-center shadow-sm hover:shadow-md transition-all active:scale-95'
            disabled={isLoading}
          >
            <span className='text-sm'>🔄</span>
          </button>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4'>
        {insights.map((insight) => {
          const currentAnswer = aiAnswers.find((a) => a.insightId === insight.id);

          return (
            <div
              key={insight.id}
              className={`relative overflow-hidden rounded-xl p-3 sm:p-4 border-l-4 transition-all duration-300 hover:scale-[1.01] ${getInsightColors(insight.type)}`}
            >
              <div className='flex items-start gap-3'>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${insight.type === 'warning' ? 'bg-yellow-100/80' : 'bg-white/80 dark:bg-gray-800/80'
                  }`}>
                  <span className='text-lg'>{getInsightIcon(insight.type)}</span>
                </div>
                <div className='flex-1'>
                  <h4 className='font-black text-gray-900 dark:text-gray-100 text-[11px] uppercase tracking-wider mb-1'>
                    {formatPesoText(insight.title)}
                  </h4>
                  <p className='text-gray-700 dark:text-gray-300 text-xs leading-relaxed mb-3 font-medium'>
                    {formatPesoText(insight.message)}
                  </p>

                  {insight.action && (
                    <button
                      onClick={() => handleActionClick(insight)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${getButtonColors(insight.type)} bg-white/60 dark:bg-gray-900/40 hover:bg-white dark:hover:bg-gray-900 shadow-sm border border-transparent hover:border-current`}
                    >
                      {currentAnswer?.isLoading ? 'Processing...' : insight.action}
                      <span className='text-xs'>{currentAnswer ? '↑' : '→'}</span>
                    </button>
                  )}

                  {currentAnswer && (
                    <div className='mt-3 p-3 bg-white/80 dark:bg-black/20 rounded-lg border border-indigo-100 dark:border-indigo-900/30 animate-in fade-in slide-in-from-top-2'>
                      <div className='flex items-center gap-2 mb-2'>
                        <span className='text-[10px] font-black text-indigo-600 uppercase tracking-widest'>AI Response</span>
                      </div>
                      <p className='text-gray-800 dark:text-gray-200 text-xs leading-relaxed font-semibold'>
                        {currentAnswer.isLoading ? '...' : currentAnswer.answer}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FOOTER SECTION */}
      <div className='mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between'>

        {/* VERSION TAG - Now always visible, sits on top of buttons on mobile/tablet */}
        <div className='flex items-center gap-2 text-gray-400 dark:text-gray-500'>
          <div className='w-1 h-1 rounded-full bg-indigo-400 animate-pulse' />
          <span className='text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap'>
            AI Engine v3.0
          </span>
        </div>

        {/* BUTTON GROUP - Adaptive width to prevent horizontal overflow */}
        <div className='flex flex-col sm:flex-row gap-2 w-full md:w-auto'>
          <button
            onClick={handleEmailReport}
            disabled={isEmailing}
            className='flex-1 md:flex-none px-4 py-3 bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 rounded-xl font-black uppercase text-[9px] sm:text-[10px] tracking-widest border border-indigo-100 dark:border-indigo-900/50 hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50 active:scale-95 shadow-sm whitespace-nowrap'
          >
            {isEmailing ? 'Sending...' : '📧 Email Report'}
          </button>

          <button
            onClick={loadInsights}
            className='flex-1 md:flex-none px-5 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-[9px] sm:text-[10px] tracking-widest shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all active:scale-95 text-center whitespace-nowrap'
          >
            Refresh Insights
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;