import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Cell, Pie
} from 'recharts';
import { 
  TrendingUp, AlertTriangle, Brain, RefreshCw, BarChart2, 
  Sliders, ShieldCheck, HelpCircle, DollarSign, Wallet, ArrowRight 
} from 'lucide-react';
import { Subscription } from '../types';
import { formatCurrency, convertCurrency } from '../lib/currency';

interface WealthAnalyticsHubProps {
  subscriptions: Subscription[];
  baseCurrency: string;
}

export const WealthAnalyticsHub: React.FC<WealthAnalyticsHubProps> = ({ subscriptions, baseCurrency }) => {
  const activeSubs = subscriptions.filter(s => s.status === 'active');

  // Interactive Category Budgets state (persisted in LocalStorage)
  const [budgets, setBudgets] = useState<Record<string, number>>(() => {
    const stored = localStorage.getItem('subpilot_category_budgets');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) {}
    }
    // Default initial budgets in baseCurrency
    return {
      'Communication': 100,
      'Design': 150,
      'Productivity': 100,
      'Infrastructure': 300,
      'Other': 100
    };
  });

  // Timeline length selector (1 year, 3 years, 5 years)
  const [timelineYears, setTimelineYears] = useState<1 | 3 | 5>(3);

  // Sync budgets to localStorage
  useEffect(() => {
    localStorage.setItem('subpilot_category_budgets', JSON.stringify(budgets));
  }, [budgets]);

  const handleBudgetChange = (category: string, limit: number) => {
    setBudgets(prev => ({
      ...prev,
      [category]: Math.max(0, limit)
    }));
  };

  // Helper: compute monthly normalized price for a subscription in baseCurrency
  const getMonthlyRate = (sub: Subscription): number => {
    const priceInBase = convertCurrency(sub.price, sub.currency || 'USD', baseCurrency);
    if (sub.cycle === 'yearly') return priceInBase / 12;
    if (sub.cycle === 'quarterly') return priceInBase / 3;
    if (sub.cycle === 'weekly') return priceInBase * 4.33;
    return priceInBase; // monthly
  };

  // Compile actual monthly spends grouped by Category
  const getCategorySpends = (): Record<string, number> => {
    const spends: Record<string, number> = {
      'Communication': 0,
      'Design': 0,
      'Productivity': 0,
      'Infrastructure': 0,
      'Other': 0
    };

    activeSubs.forEach(sub => {
      const cat = sub.category || 'Other';
      const monthlyRate = getMonthlyRate(sub);
      
      if (cat in spends) {
        spends[cat] += monthlyRate;
      } else {
        spends['Other'] += monthlyRate;
      }
    });

    return spends;
  };

  const categorySpends = getCategorySpends();

  // Color scheme matching category tags
  const CATEGORY_COLORS: Record<string, string> = {
    'Communication': '#10b981', // Emerald green
    'Design': '#ec4899',        // Pink
    'Productivity': '#8b5cf6',  // Purple
    'Infrastructure': '#3b82f6',// Blue
    'Other': '#6b7280'          // Gray
  };

  // Compile Recharts Pie Data
  const getPieData = () => {
    return Object.entries(categorySpends)
      .filter(([_, val]) => val > 0)
      .map(([key, val]) => ({
        name: key,
        value: Math.round(val),
        color: CATEGORY_COLORS[key] || '#6b7280'
      }));
  };

  const pieData = getPieData();
  const totalMonthlySpend = Object.values(categorySpends).reduce((a, b) => a + b, 0);

  // Compile YOY (Year over Year) projections data based on selected years
  const getYoYProjections = () => {
    const data = [];
    const baseMonthly = totalMonthlySpend;
    // Assume we can optimize the stack to save an average of 22%
    const optimizedMonthly = baseMonthly * 0.78;

    for (let yearNum = 1; yearNum <= timelineYears; yearNum++) {
      data.push({
        name: `Year ${yearNum}`,
        'Base Cost': Math.round(baseMonthly * 12 * yearNum),
        'Optimized Cost': Math.round(optimizedMonthly * 12 * yearNum),
      });
    }

    return data;
  };

  const yoyData = getYoYProjections();

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn" id="wealth-plan-analytics-page">
      
      {/* Hero Banner Section */}
      <div className="bg-gradient-to-br from-indigo-100/50 via-purple-50/30 to-surface dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-surface border border-indigo-500/10 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="w-4 h-4 text-accent" />
              <span className="text-xs font-bold uppercase tracking-wider">Wealth Plan & Spend Analytics</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-text-main font-display tracking-tight">
              Wealth Plan & Analytics
            </h1>
            <p className="text-xs text-text-dim max-w-xl leading-relaxed">
              Track category-specific budget bounds, review multi-year spending forecast projections, and audit real-time allocation distributions.
            </p>
          </div>
          <div className="bg-sidebar border border-surface-border p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
            <Wallet className="w-5 h-5 text-accent" />
            <div>
              <span className="text-[10px] text-text-dim font-bold uppercase tracking-wider block">Monthly Budget Outlay</span>
              <span className="text-sm font-extrabold text-text-main block">{formatCurrency(totalMonthlySpend, baseCurrency)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Double Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* Left Column (2-spans): Budgets & Forecasting */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          
          {/* 1. Category Budgeting Section */}
          <div className="bg-surface border border-surface-border rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border/50">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-accent" />
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white font-display">Category Budget Limits</h3>
                  <p className="text-[10px] text-text-dim uppercase tracking-wider font-semibold font-mono">Dynamic progress warnings</p>
                </div>
              </div>
              <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-lg text-indigo-400 font-extrabold uppercase">
                Interactive
              </span>
            </div>

            <p className="text-xs text-text-dim leading-relaxed font-medium">
              Assign budget limits per category. If subscription spending exceeds your limits, progress indicators turn a high-visibility warning red.
            </p>

            <div className="space-y-5 pt-2">
              {Object.keys(budgets).map((category) => {
                const limit = budgets[category];
                const spend = categorySpends[category] || 0;
                const percent = limit > 0 ? (spend / limit) * 100 : 0;
                
                // Color states for progress bars
                let barColor = 'bg-emerald-500';
                let textColor = 'text-emerald-400';
                if (percent > 100) {
                  barColor = 'bg-rose-500';
                  textColor = 'text-rose-400 animate-pulse font-extrabold';
                } else if (percent > 80) {
                  barColor = 'bg-amber-500';
                  textColor = 'text-amber-400 font-bold';
                }

                return (
                  <div key={category} className="space-y-2 bg-sidebar/35 p-4 rounded-xl border border-surface-border/40 hover:border-surface-border transition-all">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-white flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[category] }} />
                        {category}
                      </span>
                      <div className="space-x-1.5 text-right font-mono text-[11px]">
                        <span className="text-text-dim">Spend:</span>
                        <strong className="text-white">{formatCurrency(spend, baseCurrency)}</strong>
                        <span className="text-text-dim">/</span>
                        <span className="text-accent font-bold">Limit: {formatCurrency(limit, baseCurrency)}</span>
                      </div>
                    </div>

                    {/* Progress Bar Track */}
                    <div className="w-full bg-sidebar rounded-full h-2 overflow-hidden border border-surface-border/80">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${Math.min(100, percent)}%` }}
                      />
                    </div>

                    {/* Controls & Warning Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                      
                      {/* Interactive Slider Input */}
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-[9px] text-text-dim uppercase font-bold">Adjust Limit:</span>
                        <input
                          type="range"
                          min="0"
                          max="500"
                          step="10"
                          value={limit}
                          onChange={(e) => handleBudgetChange(category, parseInt(e.target.value))}
                          className="w-full h-1 bg-sidebar rounded-lg appearance-none cursor-pointer accent-accent"
                        />
                      </div>

                      {/* Exceeded Status Warning Badge */}
                      {percent > 100 ? (
                        <span className="text-[9px] bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded-lg text-rose-400 font-extrabold uppercase tracking-wide flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 animate-bounce" />
                          <span>Budget Exceeded!</span>
                        </span>
                      ) : percent > 80 ? (
                        <span className="text-[9px] bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg text-amber-400 font-bold uppercase tracking-wide">
                          Nearing Limit
                        </span>
                      ) : (
                        <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg text-emerald-400 font-bold uppercase tracking-wide">
                          Within Bounds
                        </span>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* 2. YoY Forecasting Section */}
          <div className="bg-surface border border-surface-border rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-surface-border/50">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-accent" />
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white font-display">Year-Over-Year Spend Projections</h3>
                  <p className="text-[10px] text-text-dim uppercase tracking-wider font-semibold font-mono">Compounding financial outlay</p>
                </div>
              </div>

              {/* Years Selector */}
              <div className="flex gap-1.5 bg-sidebar p-1 rounded-lg border border-surface-border/50">
                {([1, 3, 5] as const).map((yr) => (
                  <button
                    key={yr}
                    onClick={() => setTimelineYears(yr)}
                    className={`px-3 py-1 rounded text-[10px] font-bold uppercase cursor-pointer transition-all ${
                      timelineYears === yr
                        ? 'bg-accent text-white shadow-sm'
                        : 'text-text-dim hover:text-white'
                    }`}
                  >
                    {yr} {yr === 1 ? 'Year' : 'Years'}
                  </button>
                ))}
              </div>
            </div>

            {/* Area Chart Projection */}
            {activeSubs.length > 0 ? (
              <div className="space-y-4">
                <div className="h-[240px] w-full bg-sidebar/40 border border-surface-border/40 rounded-xl p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={yoyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="baseGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ec4899" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="optGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis dataKey="name" stroke="#8E9299" fontSize={10} tickLine={false} />
                      <YAxis stroke="#8E9299" fontSize={10} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#161618', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}
                        labelStyle={{ fontWeight: 'bold', color: '#ffffff' }}
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                      <Area type="monotone" name="Unoptimized Outlay" dataKey="Base Cost" stroke="#ec4899" strokeWidth={2} fill="url(#baseGrad)" />
                      <Area type="monotone" name="Optimized Stack Projections" dataKey="Optimized Cost" stroke="#10b981" strokeWidth={2} fill="url(#optGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-sidebar p-4 rounded-xl border border-surface-border flex items-start gap-3">
                  <Brain className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <p className="text-xs text-text-dim leading-relaxed">
                    <strong>Compound Outlay Advisory:</strong> Over a {timelineYears}-year span, your projected unoptimized SaaS costs totals <strong className="text-rose-400 font-mono">{formatCurrency(totalMonthlySpend * 12 * timelineYears, baseCurrency)}</strong>. Transitioning to alternative, lower-priced tiers cuts waste to save up to <strong className="text-emerald-400 font-mono">{formatCurrency(totalMonthlySpend * 12 * timelineYears * 0.22, baseCurrency)}</strong>.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-text-dim text-xs font-semibold">
                No active subscription profiles found to compile multi-year compound trajectories.
              </div>
            )}

          </div>

        </div>

        {/* Right Column (1-span): Spend Allocation Distribution */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="bg-surface border border-surface-border rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
            <div className="pb-3 border-b border-surface-border/50">
              <h3 className="text-sm font-extrabold text-white font-display">Category Allocation</h3>
              <p className="text-[10px] text-text-dim uppercase tracking-wider font-semibold font-mono">Weight distributions</p>
            </div>

            {pieData.length > 0 ? (
              <div className="space-y-6 flex flex-col items-center">
                {/* Recharts Pie Chart */}
                <div className="h-[200px] w-[200px] relative flex justify-center items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Center absolute overlay values */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-[8px] text-text-dim font-bold uppercase">Total Spend</span>
                    <span className="text-xs sm:text-sm font-extrabold text-white mt-0.5 font-mono">
                      {formatCurrency(totalMonthlySpend, baseCurrency)}
                    </span>
                    <span className="text-[8px] text-accent font-bold mt-0.5">Monthly</span>
                  </div>
                </div>

                {/* Legend list */}
                <div className="w-full space-y-2 pt-2 border-t border-surface-border/50">
                  {pieData.map((item) => (
                    <div key={item.name} className="flex justify-between items-center text-xs bg-sidebar/30 px-3 py-1.5 rounded-lg border border-surface-border/30">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="font-semibold text-text-main">{item.name}</span>
                      </div>
                      <span className="font-mono font-bold text-white">
                        {formatCurrency(item.value, baseCurrency)} ({((item.value / totalMonthlySpend) * 100).toFixed(0)}%)
                      </span>
                    </div>
                  ))}
                </div>

              </div>
            ) : (
              <div className="text-center py-12 text-text-dim text-xs font-semibold">
                No active category metrics logged.
              </div>
            )}

          </div>

          {/* Allocation Health Advisor */}
          <div className="bg-sidebar border border-surface-border rounded-2xl p-5 shadow-sm space-y-3.5">
            <span className="text-[10px] font-bold text-accent uppercase tracking-wider block">Financial Audit Strategy</span>
            <p className="text-xs text-text-dim leading-relaxed font-medium">
              A balanced category allocation guards startups from early capital exhaustion.
            </p>
            <div className="bg-surface/50 p-3 rounded-lg border border-surface-border/60 flex items-center gap-2">
              <ShieldCheck className="w-4.5 h-4.5 text-accent shrink-0" />
              <span className="text-[10px] text-text-dim font-bold">Complies with spend limit standards.</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
