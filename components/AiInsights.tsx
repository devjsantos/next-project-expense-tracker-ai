"use client";

import { useState, useEffect } from 'react';
import { getAIInsights } from '@/app/actions/getAIInsights';
import { generateInsightAnswer } from '@/app/actions/generateInsightAnswer';
import { useToast } from '@/components/ToastProvider';
import {
  Sparkles,
  RefreshCcw,
  Mail,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Info,
  ChevronRight,
  Bot,
  Zap,
  Loader2
} from 'lucide-react';

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

  const formatPesoText = (text: string) => text.replace(/\$/g, '₱');

  const loadInsights = async () => {
    setIsLoading(true);
    try {
      const newInsights = await getAIInsights();
      setInsights(newInsights);
      setLastUpdated(new Date());
    } catch (error) {
      setInsights([{
        id: 'fallback-1',
        type: 'info',
        title: 'AI Temporarily Offline',
        message: "Patterns are tracked, but real-time insights are currently reloading.",
        action: 'Try again later',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailReport = async () => {
    setIsEmailing(true);
    try {
      const { default: sendInsightsEmail } = await import('@/app/actions/sendInsightsEmail');
      const result = await sendInsightsEmail();
      if (result?.ok) addToast('Insight report emailed!', 'success');
      else addToast(typeof result?.error === 'string' ? result.error : 'Error occurred', 'error');
    } catch (err) {
      addToast('Email service connection failed.', 'error');
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

    setAiAnswers((prev) => [...prev, { insightId: insight.id, answer: '', isLoading: true }]);

    try {
      const question = `${insight.title}: ${insight.action}`;
      const answer = await generateInsightAnswer(question);
      setAiAnswers((prev) =>
        prev.map((a) => a.insightId === insight.id ? { ...a, answer: formatPesoText(answer), isLoading: false } : a)
      );
    } catch (error) {
      addToast('AI failed to respond.', 'warning');
      setAiAnswers((prev) => prev.filter((a) => a.insightId !== insight.id));
    }
  };

  useEffect(() => { loadInsights(); }, []);

  const getInsightUI = (type: string) => {
    switch (type) {
      case 'warning': return { icon: <AlertTriangle size={18} />, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800' };
      case 'success': return { icon: <CheckCircle2 size={18} />, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800' };
      case 'tip': return { icon: <Lightbulb size={18} />, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-800' };
      default: return { icon: <Info size={18} />, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' };
    }
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return 'Syncing...';
    const diffMins = Math.floor((new Date().getTime() - lastUpdated.getTime()) / 60000);
    return diffMins < 1 ? 'Just now' : `${diffMins}m ago`;
  };

  /* --- STYLIZED LOADING STATE --- */
  if (isLoading) return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] shadow-xl min-h-[450px] w-full">
      <div className="flex flex-col items-center text-center">
        {/* Animated Icon Container */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full animate-pulse"></div>
          <div className="relative w-24 h-24 bg-indigo-600 rounded-[2.2rem] flex items-center justify-center shadow-2xl shadow-indigo-500/40">
            <Bot className="text-white animate-bounce" size={48} />
          </div>
        </div>

        {/* Text Messaging */}
        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">
          Analyzing Patterns
        </h3>
        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] animate-pulse mb-10">
          Syncing SmartJuan Ledger...
        </p>

        {/* Fixed Progress Bar */}
        <div className="w-64 space-y-4">
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
            {/* This is the moving progress indicator */}
            <div className="absolute top-0 left-0 h-full bg-indigo-500 w-1/3 rounded-full animate-[loading_1.5s_infinite_ease-in-out]"></div>
          </div>

          <div className="flex justify-between items-center px-1">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Neural Link</span>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Processing</span>
          </div>
        </div>
      </div>

      {/* Tailwind Custom Animation Style */}
      <style jsx global>{`
        @keyframes loading {
          0% { left: -40%; width: 30%; }
          50% { width: 60%; }
          100% { left: 110%; width: 30%; }
        }
      `}</style>
    </div>
  );

  return (
    <div className='bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800'>
      {/* Header */}
      <div className='flex items-center justify-between mb-8'>
        <div className='flex items-center gap-4'>
          <div className='w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20'>
            <Bot className="text-white" size={24} />
          </div>
          <div>
            <h3 className='text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter'>AI Insights</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <Zap size={10} className="text-indigo-500 fill-indigo-500" />
              <p className='text-[10px] font-black text-slate-400 uppercase tracking-widest'>SmartJuan V3.0 Engine</p>
            </div>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border border-slate-100 dark:border-slate-700">
            {formatLastUpdated()}
          </div>
          <button onClick={loadInsights} className="p-2.5 text-slate-400 hover:text-indigo-600 transition-colors">
            <RefreshCcw size={18} />
          </button>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        {insights.map((insight) => {
          const ui = getInsightUI(insight.type);
          const currentAnswer = aiAnswers.find((a) => a.insightId === insight.id);

          return (
            <div key={insight.id} className={`group relative p-5 rounded-[1.8rem] border ${ui.bg} ${ui.border} transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/5`}>
              <div className='flex items-start gap-4'>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-slate-900 shadow-sm ${ui.color}`}>
                  {ui.icon}
                </div>
                <div className='flex-1'>
                  <h4 className='font-black text-slate-900 dark:text-white text-xs uppercase tracking-wide mb-1'>
                    {formatPesoText(insight.title)}
                  </h4>
                  <p className='text-slate-600 dark:text-slate-400 text-xs leading-relaxed mb-4'>
                    {formatPesoText(insight.message)}
                  </p>

                  {insight.action && (
                    <button
                      onClick={() => handleActionClick(insight)}
                      className={`group/btn flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all bg-white dark:bg-slate-900 ${ui.color} shadow-sm border border-slate-100 dark:border-slate-700 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-black`}
                    >
                      {currentAnswer?.isLoading ? 'Calculating...' : insight.action}
                      <ChevronRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  )}

                  {currentAnswer && !currentAnswer.isLoading && (
                    <div className='mt-4 p-4 bg-indigo-600 text-white rounded-2xl animate-in slide-in-from-top-2'>
                      <div className='flex items-center gap-2 mb-2'>
                        <Sparkles size={12} className="text-indigo-200" />
                        <span className='text-[9px] font-black uppercase tracking-widest text-indigo-100'>Advice</span>
                      </div>
                      <p className='text-[11px] font-bold leading-relaxed'>
                        {currentAnswer.answer}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className='mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='flex -space-x-2'>
            {[1, 2, 3].map(i => <div key={i} className={`w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 bg-indigo-${i}00`} />)}
          </div>
          <span className='text-[10px] font-black text-slate-400 uppercase tracking-widest'>Trusted by SmartJuan AI</span>
        </div>

        <div className='flex gap-3 w-full sm:w-auto'>
          <button
            onClick={handleEmailReport}
            disabled={isEmailing}
            className='flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all active:scale-95'
          >
            <Mail size={16} />
            {isEmailing ? 'Sending...' : 'Report'}
          </button>
          <button
            onClick={loadInsights}
            className='flex-1 sm:flex-none px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-500/30 hover:bg-indigo-700 transition-all active:scale-95'
          >
            Sync Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;