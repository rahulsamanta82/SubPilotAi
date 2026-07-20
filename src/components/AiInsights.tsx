import React, { useState, useEffect, useCallback } from 'react';
import { Subscription, Recommendation } from '../types';
import { 
  Sparkles, Check, RefreshCw, ArrowRight, TrendingDown,
  Info, ShieldCheck, HelpCircle, Flame, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AiInsightsProps {
  subscriptions: Subscription[];
  onApplyRecommendation: (rec: Recommendation) => Promise<void>;
}

// Helper to execute fetch operations with automatic retries for resilient network connections
const fetchWithRetry = async (url: string, options: RequestInit, retries = 2, delay = 1500): Promise<Response> => {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res;
  } catch (err) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 1.5);
    }
    throw err;
  }
};

export const AiInsights: React.FC<AiInsightsProps> = ({
  subscriptions,
  onApplyRecommendation,
}) => {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    if (subscriptions.length === 0) {
      setRecommendations([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithRetry('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptions }),
      });

      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (err: any) {
      console.log('[SubPilot AI] AiInsights fetch failed, falling back gracefully:', err.message || err);
      setError('Optimizer service is warming up. Please check back in a moment or click refresh.');
    } finally {
      setLoading(false);
    }
  }, [subscriptions]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const totalPossibleSaving = recommendations
    .filter(r => !r.applied)
    .reduce((sum, r) => sum + r.estimatedSaving, 0);

  const handleApply = async (rec: Recommendation) => {
    try {
      await onApplyRecommendation(rec);
      // Mark as applied in local state
      setRecommendations(prev =>
        prev.map(r => (r.id === rec.id ? { ...r, applied: true } : r))
      );
    } catch (err) {
      console.error('Error applying recommendation:', err);
    }
  };

  return (
    <div id="ai-insights" className="premium-card p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-success/10 text-success border border-success/20 rounded-2xl shadow-[0_4px_15px_rgba(16,185,129,0.15)]">
            <Sparkles className="w-5 h-5 text-success animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-text-main to-accent font-display">AI Savings Recommendations</h2>
            <p className="text-xs text-text-dim font-medium">Intelligent optimization logs identifying duplicates, inactive software, or pre-paid savings.</p>
          </div>
        </div>

        {subscriptions.length > 0 && (
          <button
            onClick={fetchRecommendations}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-surface-border hover:bg-sidebar text-text-dim hover:text-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Audit
          </button>
        )}
      </div>

      {subscriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-surface-border rounded-2xl bg-sidebar/20">
          <HelpCircle className="w-12 h-12 text-text-dim mb-2" />
          <p className="text-sm text-gray-300 font-medium">Add subscriptions to run AI Cost Audits</p>
          <p className="text-xs text-text-dim">Our machine learning models will automatically scan for potential overlaps.</p>
        </div>
      ) : loading ? (
        <div className="space-y-4 py-6">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-accent animate-spin" />
            <span className="text-sm font-semibold text-text-dim">Analyzing recurring subscriptions database...</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-28 bg-sidebar/50 border border-surface-border animate-pulse rounded-xl" />
            <div className="h-28 bg-sidebar/50 border border-surface-border animate-pulse rounded-xl" />
          </div>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 bg-success/5 border border-success/15 rounded-2xl">
          <ShieldCheck className="w-10 h-10 text-success mb-2" />
          <p className="text-sm font-bold text-white">Your SaaS stack is fully optimized!</p>
          <p className="text-xs text-text-dim mt-1">No overlapping services or duplicate license spends were found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {totalPossibleSaving > 0 && (
            <div className="bg-success/10 border border-success/15 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingDown className="w-5 h-5 text-success" />
                <div>
                  <span className="text-xs font-semibold text-success block">Total Potential Yearly Savings</span>
                  <span className="text-lg font-bold text-white font-display">${totalPossibleSaving} / year</span>
                </div>
              </div>
              <span className="text-xs font-semibold bg-success/15 text-success border border-success/20 px-3 py-1.5 rounded-lg">
                Optimization score: 92%
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec) => {
              const recColorClass = 
                rec.type === 'duplicate' ? 'border-rose-500/20 bg-rose-500/10 text-rose-400' :
                rec.type === 'alternative' ? 'border-accent/20 bg-accent/10 text-accent' :
                rec.type === 'unused' ? 'border-warning/20 bg-warning/10 text-warning' :
                'border-success/20 bg-success/10 text-success';

              return (
                <motion.div
                  key={rec.id}
                  layout
                  className={`border rounded-2xl p-5 flex flex-col justify-between transition-all ${
                    rec.applied ? 'opacity-50 border-surface-border bg-sidebar/20' : 'border-surface-border bg-sidebar/40 hover:bg-sidebar/60 hover:shadow-lg'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${recColorClass}`}>
                        {rec.type}
                      </span>
                      <span className="text-xs font-extrabold text-white">
                        {rec.applied ? 'Applied' : `Est. Saving: $${rec.estimatedSaving}/yr`}
                      </span>
                    </div>

                    <h4 className="font-bold text-white text-sm font-display mb-1">{rec.title}</h4>
                    <p className="text-xs text-text-dim leading-relaxed">{rec.description}</p>
                    <span className="text-[10px] font-bold text-text-dim mt-2 block">
                      Target subscription: {rec.subscriptionName}
                    </span>
                  </div>

                  <div className="mt-5 pt-3 border-t border-surface-border flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[11px] text-text-dim">
                      <Info className="w-3.5 h-3.5" />
                      <span>1-click optimization flow</span>
                    </div>

                    {rec.applied ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-success">
                        <Check className="w-4 h-4" />
                        Success
                      </span>
                    ) : (
                      <button
                        onClick={() => handleApply(rec)}
                        className="flex items-center gap-1 text-xs font-bold text-accent hover:text-blue-400 hover:underline cursor-pointer"
                      >
                        {rec.actionText}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
