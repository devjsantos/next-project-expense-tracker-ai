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
  Loader2,
  ArrowRight
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
        title: 'Neural Link Interrupted',
        message: "Your patterns are safe, but my real-time analysis is taking a quick breather.",
        action: 'Reconnect Now',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const reportFailure = async (details: { message: string; errors?: any }) => {
    try {
      const { default: report } = await import('@/app/actions/reportAiFailure');
      await report(details);
      addToast('Engine diagnostic reported', 'info');
    } catch (err) {
      addToast('System report failed', 'error');
    }
  };

  const handleEmailReport = async () => {
    setIsEmailing(true);
    try {
      const { default: sendInsightsEmail } = await import('@/app/actions/sendInsightsEmail');
      const result = await sendInsightsEmail();
      if (result?.ok) addToast('Analysis sent to your inbox!', 'success');
      else addToast(typeof result?.error === 'string' ? result.error : 'Sync failed', 'error');
    } catch (err) {
      addToast('Email service offline.', 'error');
    } finally {
      setIsEmailing(false);
    }
  };

  const handleActionClick = async (insight: InsightData) => {
    if (!insight.action) return;
    if (insight.id?.startsWith('fallback')) {
      await loadInsights();
      return;
    }
    
    const detailsId = (insight as any).detailsId;
    if (detailsId) {
      setIsLoading(true);
      try {
        const { default: getDetails } = await import('@/app/actions/getAiFailureDetails');
        const res = await getDetails(detailsId);
        if (res?.ok) addToast('Diagnostic log retrieved', 'info');
      } catch (err) {
        addToast('Log retrieval error', 'error');
      } finally {
        setIsLoading(false);
      }
      return;
    }

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
      addToast('AI link timed out.', 'warning');
      setAiAnswers((prev) => prev.filter((a) => a.insightId !== insight.id));
    }
  };

  useEffect(() => { loadInsights(); }, []);

  const getInsightUI = (type: string) => {
    switch (type) {
      case 'warning': return { icon: <AlertTriangle size={18} />, color: 'text-amber-500', bg: 'bg-amber-50/50 dark:bg-amber-900/10', border: 'border-amber-100 dark:border-amber-800/40' };
      case 'success': return { icon: <CheckCircle2 size={18} />, color: 'text-emerald-500', bg: 'bg-emerald-50/50 dark:bg-emerald-900/10', border: 'border-emerald-100 dark:border-emerald-800/40' };
      case 'tip': return { icon: <Lightbulb size={18} />, color: 'text-indigo-500', bg: 'bg-indigo-50/50 dark:bg-indigo-900/10', border: 'border-indigo-100 dark:border-indigo-800/40' };
      default: return { icon: <Info size={18} />, color: 'text-blue-500', bg: 'bg-blue-50/50 dark:bg-blue-900/10', border: 'border-blue-100 dark:border-blue-800/40' };
    }
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] shadow-xl min-h-[450px] w-full">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full animate-pulse"></div>
        <div className="relative w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-500/40">
          <Bot className="text-white animate-bounce" size={40} />
        </div>
      </div>
      <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-1">Crunching Numbers</h3>
      <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.3em] animate-pulse">Neural Sync in Progress</p>
    </div>
  );

  return (
    <div className='bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800/50'>
      
      {/* HEADER SECTION */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10'>
        <div className='flex items-center gap-4'>
          <div className='w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20'>
            <Sparkles className="text-white" size={22} />
          </div>
          <div>
            <h3 className='text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter'>Smart Analysis</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className='text-[10px] font-black text-slate-400 uppercase tracking-widest'>Core Engine V3.0</p>
            </div>
          </div>
        </div>

        <div className='flex items-center gap-2 self-end sm:self-auto'>
          <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border border-slate-100 dark:border-slate-800">
            Synced {lastUpdated ? lastUpdated.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
          </div>
          <button onClick={loadInsights} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-indigo-600 transition-all active:rotate-180 duration-500">
            <RefreshCcw size={16} />
          </button>
        </div>
      </div>

      {/* INSIGHTS GRID */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-5'>
        {insights.map((insight, index) => {
          const ui = getInsightUI(insight.type);
          const currentAnswer = aiAnswers.find((a) => a.insightId === insight.id);

          return (
            <div 
              key={insight.id} 
              style={{ animationDelay: `${index * 100}ms` }}
              className={`group animate-in fade-in slide-in-from-bottom-4 p-5 rounded-[2rem] border ${ui.bg} ${ui.border} transition-all duration-300 hover:scale-[1.01]`}
            >
              <div className='flex items-start gap-4'>
                <div className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center bg-white dark:bg-slate-950 shadow-sm ${ui.color}`}>
                  {ui.icon}
                </div>
                <div className='flex-1 min-w-0'>
                  <h4 className='font-black text-slate-900 dark:text-white text-[11px] uppercase tracking-wider mb-1 truncate'>
                    {formatPesoText(insight.title)}
                  </h4>
                  <p className='text-slate-600 dark:text-slate-400 text-xs leading-relaxed mb-5 font-medium'>
                    {formatPesoText(insight.message)}
                  </p>

                  {insight.action && (
                    <button
                      onClick={() => handleActionClick(insight)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${currentAnswer ? 'bg-slate-900 text-white dark:bg-white dark:text-black' : 'bg-white dark:bg-slate-950 ' + ui.color} border border-slate-200 dark:border-slate-800 shadow-sm active:scale-95`}
                    >
                      {currentAnswer?.isLoading ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <>
                          {currentAnswer ? 'Close Advice' : insight.action}
                          {!currentAnswer && <ArrowRight size={12} />}
                        </>
                      )}
                    </button>
                  )}

                  {currentAnswer && !currentAnswer.isLoading && (
                    <div className='mt-4 p-5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-[1.5rem] shadow-xl shadow-indigo-500/20 animate-in zoom-in-95 duration-300'>
                      <div className='flex items-center gap-2 mb-3'>
                        <Bot size={14} className="text-indigo-200" />
                        <span className='text-[9px] font-black uppercase tracking-[0.2em] text-indigo-100'>AI Strategy</span>
                      </div>
                      <p className='text-[12px] font-bold leading-relaxed italic'>
                        "{currentAnswer.answer}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FOOTER ACTIONS */}
      <div className='mt-10 pt-8 border-t border-slate-100 dark:border-slate-800/50 flex flex-col sm:flex-row gap-4 items-center justify-between'>
        <div className='flex items-center gap-3 bg-slate-50 dark:bg-slate-800/40 px-4 py-2 rounded-2xl'>
          <Zap size={14} className="text-amber-500 fill-amber-500" />
          <span className='text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest'>Intelligence Active</span>
        </div>

        <div className='flex gap-3 w-full sm:w-auto'>
          <button
            onClick={handleEmailReport}
            disabled={isEmailing}
            className='flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all'
          >
            <Mail size={16} />
            {isEmailing ? 'Sending...' : 'Mail Report'}
          </button>
          <button
            onClick={loadInsights}
            className='flex-1 sm:flex-none px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all active:translate-y-0'
          >
            Refresh Engine
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;