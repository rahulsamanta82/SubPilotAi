import React, { useState, useEffect, useCallback } from 'react';
import { Subscription, ForecastData } from '../types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { TrendingUp, AlertTriangle, Brain, RefreshCw, BarChart2, CalendarDays } from 'lucide-react';
import { motion } from 'motion/react';
import { formatCurrency } from '../lib/currency';

interface ForecastChartProps {
  subscriptions: Subscription[];
  baseCurrency?: string;
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

export const ForecastChart: React.FC<ForecastChartProps> = ({ subscriptions, baseCurrency = 'USD' }) => {
  const [loading, setLoading] = useState(false);
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [analysis, setAnalysis] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fetchForecast = useCallback(async () => {
    if (subscriptions.length === 0) {
      setForecastData([]);
      setAnalysis('Please add subscriptions to see forecast analytics.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithRetry('/api/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptions, baseCurrency }),
      });

      const data = await response.json();
      setForecastData(data.forecast || []);
      setAnalysis(data.analysis || '');
    } catch (err: any) {
      console.log('[SubPilot AI] ForecastChart fetch failed, falling back gracefully:', err.message || err);
      setError('Forecasting engine is warming up. Please check back in a moment or click recalculate.');
    } finally {
      setLoading(false);
    }
  }, [subscriptions, baseCurrency]);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  const totalProjectedYear = forecastData.reduce((sum, item) => sum + item.projectedAmount, 0);
  const averageMonthly = forecastData.length > 0 ? (totalProjectedYear / forecastData.length) : 0;

  return (
    <div id="forecast-analytics" className="premium-card p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-accent/10 text-accent border border-accent/20 rounded-2xl shadow-[0_4px_15px_rgba(139,92,246,0.15)]">
            <TrendingUp className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-text-main to-accent font-display">12-Month Expense Projections</h2>
            <p className="text-xs text-text-dim font-medium">AI-predicted spend modeling based on recurring dates and renewal structures.</p>
          </div>
        </div>
        
        <button
          onClick={fetchForecast}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-surface-border hover:bg-sidebar text-text-dim hover:text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Recalculate Projections
        </button>
      </div>

      {subscriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-surface-border rounded-2xl bg-sidebar/20">
          <BarChart2 className="w-12 h-12 text-text-dim mb-2" />
          <p className="text-sm text-gray-300 font-medium">Add Active Subscriptions to Visualize Forecasting</p>
          <p className="text-xs text-text-dim">Our machine learning models need financial records to predict peaks.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Visual Chart */}
            <div className="h-[320px] w-full bg-sidebar/50 border border-surface-border rounded-2xl p-4">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-accent animate-spin mb-2" />
                  <span className="text-xs font-semibold text-text-dim">Recalculating curves...</span>
                </div>
              ) : error ? (
                <div className="h-full flex flex-col items-center justify-center text-rose-500">
                  <AlertTriangle className="w-8 h-8 mb-2" />
                  <span className="text-xs font-semibold">{error}</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="month" stroke="#8E9299" fontSize={10} tickLine={false} />
                    <YAxis stroke="#8E9299" fontSize={10} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#161618', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
                      labelStyle={{ fontWeight: 'bold', color: '#ffffff' }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#8E9299' }} />
                    <Area type="monotone" name="Expected Spend" dataKey="amount" stroke="#3B82F6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAmount)" />
                    <Area type="monotone" name="Projected Renewals" dataKey="projectedAmount" stroke="#F59E0B" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorProjected)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-sidebar border border-surface-border p-4 rounded-xl">
                <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">Average Monthly Budget</span>
                <span className="text-xl font-extrabold text-accent font-display">{formatCurrency(averageMonthly, baseCurrency)}</span>
              </div>
              <div className="bg-sidebar border border-surface-border p-4 rounded-xl">
                <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">Projected 12-Month Outlay</span>
                <span className="text-xl font-extrabold text-white font-display">{formatCurrency(totalProjectedYear, baseCurrency)}</span>
              </div>
            </div>
          </div>

          {/* AI Narrative Commentary */}
          <div className="bg-accent/5 border border-accent/15 p-5 rounded-2xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-accent" />
                <span className="text-sm font-bold text-white font-display">SubPilot AI Proactive Advice</span>
              </div>
              
              {loading ? (
                <div className="space-y-3 py-6">
                  <div className="h-3 bg-accent/10 animate-pulse rounded-full w-full" />
                  <div className="h-3 bg-accent/10 animate-pulse rounded-full w-5/6" />
                  <div className="h-3 bg-accent/10 animate-pulse rounded-full w-11/12" />
                </div>
              ) : (
                <p className="text-xs text-gray-200 leading-relaxed font-medium whitespace-pre-wrap">
                  {analysis || "Your subscription analytics database is current. Analyze monthly and cumulative indicators to review optimization vectors."}
                </p>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-accent/15 flex items-center gap-2 text-[11px] text-text-dim font-semibold">
              <CalendarDays className="w-4 h-4 text-accent" />
              <span>Renewals occur throughout the dynamic monthly cycle.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
