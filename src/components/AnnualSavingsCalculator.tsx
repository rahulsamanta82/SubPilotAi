import React, { useState } from 'react';
import { Subscription } from '../types';
import { convertCurrency, formatCurrency } from '../lib/currency';
import { 
  TrendingDown, Percent, Calendar, Sparkles, Check, 
  HelpCircle, ChevronRight, Zap, RefreshCw, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AnnualSavingsCalculatorProps {
  subscriptions: Subscription[];
  onUpdateSubscription: (id: string, updatedFields: Partial<Subscription>) => Promise<void>;
  baseCurrency: string;
}

export const AnnualSavingsCalculator: React.FC<AnnualSavingsCalculatorProps> = ({
  subscriptions,
  onUpdateSubscription,
  baseCurrency,
}) => {
  // Get all active/trialing/paused subscriptions that are billed weekly, monthly, or quarterly
  const eligibleSubs = subscriptions.filter(sub => 
    (sub.status === 'active' || sub.status === 'trialing' || sub.status === 'paused') &&
    (sub.cycle === 'monthly' || sub.cycle === 'weekly' || sub.cycle === 'quarterly')
  );

  // Maintain custom discount percentages per subscription ID
  // Industry-standard defaults: Monthly: 20%, Weekly: 25%, Quarterly: 15%
  const getDefaultDiscount = (cycle: string) => {
    if (cycle === 'weekly') return 25;
    if (cycle === 'quarterly') return 15;
    return 20; // monthly default
  };

  const [discounts, setDiscounts] = useState<Record<string, number>>({});
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>(() => {
    // Select all eligible by default
    const initial: Record<string, boolean> = {};
    eligibleSubs.forEach(sub => {
      if (sub.id) initial[sub.id] = true;
    });
    return initial;
  });

  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [successStates, setSuccessStates] = useState<Record<string, boolean>>({});

  // Get current discount value for a sub
  const getSubDiscount = (sub: Subscription) => {
    if (!sub.id) return 20;
    if (discounts[sub.id] !== undefined) return discounts[sub.id];
    return getDefaultDiscount(sub.cycle);
  };

  const handleDiscountChange = (subId: string, value: number) => {
    setDiscounts(prev => ({ ...prev, [subId]: value }));
  };

  const toggleSelect = (subId: string) => {
    setSelectedIds(prev => ({ ...prev, [subId]: !prev[subId] }));
  };

  const handleToggleAll = (select: boolean) => {
    const updated: Record<string, boolean> = {};
    eligibleSubs.forEach(sub => {
      if (sub.id) updated[sub.id] = select;
    });
    setSelectedIds(updated);
  };

  // Convert and calculate values
  const calculations = eligibleSubs.map(sub => {
    const subId = sub.id || '';
    const isSelected = !!selectedIds[subId];
    const discountPercent = getSubDiscount(sub);
    
    // Convert native price to base currency
    const priceInBase = convertCurrency(sub.price, sub.currency || 'USD', baseCurrency);
    
    // Calculate yearly cost based on current cycle
    let currentYearlyCost = 0;
    if (sub.cycle === 'monthly') currentYearlyCost = priceInBase * 12;
    else if (sub.cycle === 'weekly') currentYearlyCost = priceInBase * 52;
    else if (sub.cycle === 'quarterly') currentYearlyCost = priceInBase * 4;

    const projectedYearlyCost = currentYearlyCost * (1 - discountPercent / 100);
    const yearlySavings = currentYearlyCost - projectedYearlyCost;

    return {
      sub,
      subId,
      isSelected,
      discountPercent,
      priceInBase,
      currentYearlyCost,
      projectedYearlyCost,
      yearlySavings,
    };
  });

  // Aggregated summaries for selected items
  const totalCurrentYearly = calculations
    .filter(c => c.isSelected)
    .reduce((sum, c) => sum + c.currentYearlyCost, 0);

  const totalProjectedYearly = calculations
    .filter(c => c.isSelected)
    .reduce((sum, c) => sum + c.projectedYearlyCost, 0);

  const totalSavings = totalCurrentYearly - totalProjectedYearly;
  const overallSavingsPercent = totalCurrentYearly > 0 ? (totalSavings / totalCurrentYearly) * 100 : 0;

  const handleCommitSwitch = async (sub: Subscription, discountPercent: number) => {
    if (!sub.id) return;
    setLoadingStates(prev => ({ ...prev, [sub.id!]: true }));
    try {
      // Calculate new yearly rate: native price converted to annual and discounted
      let annualMultiplier = 12;
      if (sub.cycle === 'weekly') annualMultiplier = 52;
      else if (sub.cycle === 'quarterly') annualMultiplier = 4;

      const fullYearlyNative = sub.price * annualMultiplier;
      const discountedYearlyNative = fullYearlyNative * (1 - discountPercent / 100);

      await onUpdateSubscription(sub.id, {
        cycle: 'yearly',
        price: Math.round(discountedYearlyNative * 100) / 100,
        notes: `${sub.notes || ''} (Billed annually; converted from ${sub.cycle} billing at a simulated ${discountPercent}% discount)`.trim()
      });

      setSuccessStates(prev => ({ ...prev, [sub.id!]: true }));
      setTimeout(() => {
        setSuccessStates(prev => ({ ...prev, [sub.id!]: false }));
      }, 3000);
    } catch (err) {
      console.error('Failed to commit annual switch:', err);
    } finally {
      setLoadingStates(prev => ({ ...prev, [sub.id!]: false }));
    }
  };

  return (
    <div id="annual-savings-calculator" className="premium-card p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.15)] relative overflow-hidden">
      {/* Decorative gradient light */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 border-b border-surface-border/60 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-accent/10 text-accent border border-accent/20 rounded-2xl shadow-[0_4px_15px_rgba(139,92,246,0.15)]">
            <TrendingDown className="w-5 h-5 text-accent animate-bounce" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-text-main via-white to-accent font-display">
              Annual Switch Savings Planner
            </h2>
            <p className="text-xs text-text-dim font-medium">
              Calculate and simulate your savings potential by moving recurring software subscriptions to pre-paid annual agreements.
            </p>
          </div>
        </div>

        {eligibleSubs.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleToggleAll(true)}
              className="text-[10px] uppercase tracking-wider font-extrabold text-accent hover:text-white bg-accent/5 hover:bg-accent/10 border border-accent/15 px-2.5 py-1.5 rounded-lg transition-all"
            >
              Select All
            </button>
            <button
              onClick={() => handleToggleAll(false)}
              className="text-[10px] uppercase tracking-wider font-extrabold text-text-dim hover:text-white bg-sidebar/50 hover:bg-sidebar border border-surface-border px-2.5 py-1.5 rounded-lg transition-all"
            >
              Deselect All
            </button>
          </div>
        )}
      </div>

      {eligibleSubs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 border border-dashed border-surface-border/60 rounded-2xl bg-sidebar/10">
          <HelpCircle className="w-10 h-10 text-text-dim mb-3" />
          <h3 className="text-sm font-bold text-white mb-1">No eligible subscriptions found</h3>
          <p className="text-xs text-text-dim text-center max-w-md px-4">
            All your current active subscriptions are already set to annual billing! Excellent job securing pre-paid discounts.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary KPI Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Current Card */}
            <div className="bg-sidebar/40 border border-surface-border/50 p-5 rounded-2xl shadow-inner relative overflow-hidden">
              <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider block mb-1">Current Outlay (Selected)</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-extrabold text-white font-display">
                  {formatCurrency(totalCurrentYearly, baseCurrency)}
                </span>
                <span className="text-xs text-text-dim">/ year</span>
              </div>
              <p className="text-[10px] text-text-dim mt-2 leading-relaxed">
                Total annualized commitment on active monthly, quarterly, and weekly plans.
              </p>
            </div>

            {/* Total Projected Card */}
            <div className="bg-sidebar/40 border border-surface-border/50 p-5 rounded-2xl shadow-inner relative overflow-hidden">
              <span className="text-[10px] font-bold text-accent uppercase tracking-wider block mb-1">Projected Annual commitment</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-extrabold text-accent font-display">
                  {formatCurrency(totalProjectedYearly, baseCurrency)}
                </span>
                <span className="text-xs text-text-dim">/ year</span>
              </div>
              <p className="text-[10px] text-text-dim mt-2 leading-relaxed">
                Expected budget after committing to annual contracts with pre-paid rates.
              </p>
            </div>

            {/* Potential Savings Card */}
            <div className="bg-success/5 border border-success/15 p-5 rounded-2xl relative overflow-hidden shadow-[0_8px_30px_rgba(16,185,129,0.05)]">
              <div className="absolute top-2 right-2 p-1.5 bg-success/10 text-success rounded-lg">
                <Percent className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-success uppercase tracking-wider block mb-1">Total Annual Savings Potential</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-success font-display">
                  {formatCurrency(totalSavings, baseCurrency)}
                </span>
                <span className="text-xs text-success/80 font-bold">
                  ({overallSavingsPercent.toFixed(1)}% Saved)
                </span>
              </div>
              <p className="text-[10px] text-success/70 mt-2 leading-relaxed">
                Switching to pre-paid yearly agreements recovers valuable budget for growth.
              </p>
            </div>
          </div>

          {/* Interactive Simulation List */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-accent animate-pulse" />
              Interactive Simulation Ledger
            </h3>

            <div className="divide-y divide-surface-border/40 bg-sidebar/20 border border-surface-border/50 rounded-2xl overflow-hidden">
              {calculations.map(({ sub, subId, isSelected, discountPercent, currentYearlyCost, projectedYearlyCost, yearlySavings }) => {
                const isSaving = yearlySavings > 0;
                const isLoading = !!loadingStates[subId];
                const isSuccess = !!successStates[subId];

                return (
                  <div 
                    key={subId} 
                    className={`p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all ${
                      isSelected ? 'bg-accent/5' : 'opacity-60 bg-transparent'
                    }`}
                  >
                    {/* Checkbox and Left Info */}
                    <div className="flex items-start gap-3.5 min-w-[280px]">
                      <div className="flex items-center h-5 mt-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(subId)}
                          className="w-4.5 h-4.5 rounded text-accent bg-sidebar border-surface-border/80 focus:ring-accent focus:ring-2 cursor-pointer transition-all"
                          title="Select to include in calculations"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm font-display leading-none">{sub.name}</h4>
                          <span className="text-[9px] font-extrabold uppercase bg-sidebar border border-surface-border px-2 py-0.5 rounded-md text-text-dim">
                            {sub.cycle}
                          </span>
                        </div>
                        <p className="text-xs text-text-dim mt-1.5">
                          Current rate: <span className="text-white font-semibold">{formatCurrency(sub.price, sub.currency)}</span> / {sub.cycle}
                        </p>
                      </div>
                    </div>

                    {/* Interactive Slider */}
                    {isSelected && (
                      <div className="flex-1 max-w-md bg-sidebar/40 border border-surface-border/30 rounded-xl px-4 py-2.5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-text-dim font-bold flex items-center gap-1">
                            <Percent className="w-3 h-3 text-accent" /> Custom Annual Discount Rate
                          </span>
                          <span className="text-xs font-extrabold text-accent">{discountPercent}%</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="0"
                            max="50"
                            step="5"
                            value={discountPercent}
                            onChange={(e) => handleDiscountChange(subId, parseInt(e.target.value))}
                            className="w-full h-1.5 bg-sidebar rounded-lg appearance-none cursor-pointer accent-accent"
                          />
                          <span className="text-[9px] text-text-dim font-bold font-mono">50% max</span>
                        </div>
                      </div>
                    )}

                    {/* Projections & Committing Options */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4 min-w-[240px]">
                      <div className="text-right">
                        <div className="text-xs text-text-dim">
                          Annual cost: <span className="line-through">{formatCurrency(currentYearlyCost, baseCurrency)}</span>
                        </div>
                        <div className="text-sm font-bold text-white">
                          Projected: <span className="text-accent">{formatCurrency(projectedYearlyCost, baseCurrency)}</span>
                        </div>
                        {isSaving && (
                          <div className="text-xs font-bold text-success flex items-center justify-end gap-1 mt-0.5">
                            <TrendingDown className="w-3.5 h-3.5" />
                            Saves {formatCurrency(yearlySavings, baseCurrency)}/yr
                          </div>
                        )}
                      </div>

                      {isSelected && (
                        <button
                          onClick={() => handleCommitSwitch(sub, discountPercent)}
                          disabled={isLoading || isSuccess}
                          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-sm shrink-0 justify-center ${
                            isSuccess 
                              ? 'bg-success text-white border border-success'
                              : 'bg-accent text-white hover:bg-opacity-95 border border-accent hover:shadow-lg cursor-pointer'
                          }`}
                        >
                          {isLoading ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : isSuccess ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Calendar className="w-3.5 h-3.5" />
                          )}
                          {isLoading ? 'Updating...' : isSuccess ? 'Committed!' : 'Switch to Annual'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Education Context Card */}
          <div className="bg-accent/5 border border-accent/10 p-4 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-4.5 h-4.5 text-accent shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h5 className="text-xs font-bold text-white">SaaS Procurement Guidance</h5>
              <p className="text-[11px] text-text-dim leading-relaxed mt-1">
                Moving to annual pricing plans commits your enterprise or project to a tool for 12 months, in exchange for significant rate discounts. We advise switching on core, high-affinity workflows (e.g. Design Suites, Production Infrastructure) while leaving auxiliary tools on flexible monthly schedules.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
