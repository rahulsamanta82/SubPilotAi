import React, { useState } from 'react';
import { 
  Search, Scale, ArrowLeftRight, TrendingDown, Check, ExternalLink, HelpCircle, Sparkles, 
  CheckCircle2, AlertTriangle, Eye, Award, BarChart3, Trash2, ShieldAlert
} from 'lucide-react';
import { Subscription } from '../types';
import { formatCurrency, convertCurrency } from '../lib/currency';

interface SmartInsightsMarketplaceProps {
  subscriptions: Subscription[];
  onUpdateSubscription: (id: string, fields: Partial<Subscription>) => Promise<void>;
  onDeleteSubscription: (id: string) => Promise<void>;
  baseCurrency: string;
}

interface SaasCatalogItem {
  name: string;
  category: string;
  priceUSD: number;
  cycle: 'monthly' | 'yearly';
  features: string[];
  audience: string;
  website: string;
  alternatives: string[]; 
}

export const SmartInsightsMarketplace: React.FC<SmartInsightsMarketplaceProps> = ({ 
  subscriptions, 
  onUpdateSubscription, 
  onDeleteSubscription,
  baseCurrency 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Alternative finder states
  const [selectedSubId, setSelectedSubId] = useState('');
  const [recommendedAlternative, setRecommendedAlternative] = useState<SaasCatalogItem | null>(null);
  const [switchSuccessMessage, setSwitchSuccessMessage] = useState('');

  // Local storage for subscription utilization tracking
  const [utilizationStates, setUtilizationStates] = useState<Record<string, 'active' | 'idle' | 'unused'>>(() => {
    const stored = localStorage.getItem('subpilot_license_utilization');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) {}
    }
    return {};
  });

  const saveUtilization = (updated: Record<string, 'active' | 'idle' | 'unused'>) => {
    setUtilizationStates(updated);
    localStorage.setItem('subpilot_license_utilization', JSON.stringify(updated));
  };

  const handleSetUtilization = (subId: string, level: 'active' | 'idle' | 'unused') => {
    const updated = { ...utilizationStates, [subId]: level };
    saveUtilization(updated);
  };

  // Popular SaaS Catalog with price, features, alternatives
  const saasCatalog: SaasCatalogItem[] = [
    {
      name: 'Slack Pro',
      category: 'Communication',
      priceUSD: 7.25,
      cycle: 'monthly',
      features: ['Unlimited message history', '100+ app integrations', 'Huddles video shares', 'Safe guest channels'],
      audience: 'Collaborative teams and fast-paced tech groups',
      website: 'https://slack.com',
      alternatives: ['Discord Server', 'Microsoft Teams']
    },
    {
      name: 'Discord Server',
      category: 'Communication',
      priceUSD: 0.00,
      cycle: 'monthly',
      features: ['Free text & voice rooms', 'Screen-sharing in HD', 'Custom bot integrations', 'Community forums'],
      audience: 'Developers, community clusters, and casual groups',
      website: 'https://discord.com',
      alternatives: []
    },
    {
      name: 'Microsoft Teams',
      category: 'Communication',
      priceUSD: 4.00,
      cycle: 'monthly',
      features: ['Office 365 core links', 'Large meeting video streams', 'Shared documents archive', 'Enterprise SSO'],
      audience: 'Large traditional businesses and educational schools',
      website: 'https://microsoft.com',
      alternatives: ['Discord Server']
    },
    {
      name: 'Zoom Workspace',
      category: 'Communication',
      priceUSD: 14.99,
      cycle: 'monthly',
      features: ['Up to 100 participants video', 'Automated cloud transcripts', 'In-meeting whiteboards', 'Unlimited hours'],
      audience: 'Global companies and remote product squads',
      website: 'https://zoom.us',
      alternatives: ['Google Meet']
    },
    {
      name: 'Google Meet',
      category: 'Communication',
      priceUSD: 6.00,
      cycle: 'monthly',
      features: ['Google Workspace native sync', 'In-browser calendar quick joins', 'Real-time noise filtering', 'Safe cloud recording'],
      audience: 'Google ecosystem users and light operations',
      website: 'https://workspace.google.com',
      alternatives: []
    },
    {
      name: 'Adobe Creative Cloud',
      category: 'Design',
      priceUSD: 54.99,
      cycle: 'monthly',
      features: ['Photoshop, Illustrator, Premiere Pro', '100GB secure cloud storage', 'Adobe Fonts full library', 'Firefly generative AI'],
      audience: 'Professional creative directors and multimedia specialists',
      website: 'https://adobe.com',
      alternatives: ['Figma Team Seat', 'Canva Pro']
    },
    {
      name: 'Figma Team Seat',
      category: 'Design',
      priceUSD: 15.00,
      cycle: 'monthly',
      features: ['Vector collaborative canvas', 'Interactive wireframe prototypes', 'Developer spec handoffs', 'Component style sheets'],
      audience: 'UX/UI designers and product development squads',
      website: 'https://figma.com',
      alternatives: ['Canva Pro']
    },
    {
      name: 'Canva Pro',
      category: 'Design',
      priceUSD: 12.99,
      cycle: 'monthly',
      features: ['Drag and drop layouts', 'Thousands of vector assets', 'Social schedule dispatches', 'One-click background erase'],
      audience: 'Marketing coordinators, startups, and content creators',
      website: 'https://canva.com',
      alternatives: []
    },
    {
      name: 'ChatGPT Plus Pro',
      category: 'Productivity',
      priceUSD: 20.00,
      cycle: 'monthly',
      features: ['Access to latest GPT-4o model', 'Custom advanced GPT builders', 'DALL-E 3 visual generator', 'Advanced analytics'],
      audience: 'General AI users, developers, and product managers',
      website: 'https://openai.com',
      alternatives: ['Gemini Advanced', 'Claude Pro']
    },
    {
      name: 'Claude Pro',
      category: 'Productivity',
      priceUSD: 20.00,
      cycle: 'monthly',
      features: ['Sonnet 3.5 state of the art', 'Enormous token context windows', 'Custom Artifacts sandbox', 'Multi-document code review'],
      audience: 'Developers, technical writers, and systems engineers',
      website: 'https://anthropic.com',
      alternatives: ['Gemini Advanced']
    },
    {
      name: 'Gemini Advanced',
      category: 'Productivity',
      priceUSD: 19.99,
      cycle: 'monthly',
      features: ['Gemini 1.5 Pro massive context', 'Google Workspace AI sidebars', 'Google One 2TB storage included', 'Fast logical reasoning'],
      audience: 'Google power users, builders, and research specialists',
      website: 'https://gemini.google.com',
      alternatives: []
    },
    {
      name: 'AWS Cloud Hosting',
      category: 'Infrastructure',
      priceUSD: 150.00,
      cycle: 'monthly',
      features: ['Highly scalable servers', 'Global load-balancing edges', 'Infinite file S3 storage', 'Granular VPC security'],
      audience: 'Enterprise backends, DevOps teams, and high-load APIs',
      website: 'https://aws.amazon.com',
      alternatives: ['Vercel Pro', 'Render Hosting']
    },
    {
      name: 'Vercel Pro',
      category: 'Infrastructure',
      priceUSD: 20.00,
      cycle: 'monthly',
      features: ['Automated frontend deploys', 'Global serverless edge caching', 'Integrated web telemetry', 'Fast git integrations'],
      audience: 'Next.js/React frontend devs and fast startups',
      website: 'https://vercel.com',
      alternatives: ['Render Hosting']
    },
    {
      name: 'Render Hosting',
      category: 'Infrastructure',
      priceUSD: 7.00,
      cycle: 'monthly',
      features: ['Easy container builds', 'Direct git-to-app deployments', 'Free SSL network layers', 'Database servers on cloud'],
      audience: 'Fullstack node devs, small APIs, and cron runners',
      website: 'https://render.com',
      alternatives: []
    }
  ];

  const activeSubs = subscriptions.filter(s => s.status === 'active');
  const categories = ['all', 'Communication', 'Design', 'Productivity', 'Infrastructure'];

  const filteredCatalog = saasCatalog.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.features.some(f => f.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          item.audience.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Handle Switch Selection
  const handleSelectSubscriptionToSwitch = (subId: string) => {
    setSelectedSubId(subId);
    setSwitchSuccessMessage('');
    setRecommendedAlternative(null);

    const sub = subscriptions.find(s => s.id === subId);
    if (!sub) return;

    // Search catalog for a matching item
    const catalogItem = saasCatalog.find(item => 
      item.name.toLowerCase().includes(sub.name.split(' ')[0].toLowerCase())
    );

    if (catalogItem && catalogItem.alternatives.length > 0) {
      // Find the first alternative in our catalog
      const altName = catalogItem.alternatives[0];
      const altItem = saasCatalog.find(item => item.name === altName);
      if (altItem) {
        setRecommendedAlternative(altItem);
      }
    }
  };

  // Switch and Update Database
  const handleConfirmSwitch = async () => {
    if (!selectedSubId || !recommendedAlternative) return;

    const sub = subscriptions.find(s => s.id === selectedSubId);
    if (!sub) return;

    const originalCurrency = sub.currency || 'USD';
    const altPriceInNativeCurrency = convertCurrency(recommendedAlternative.priceUSD, 'USD', originalCurrency);

    try {
      await onUpdateSubscription(selectedSubId, {
        name: recommendedAlternative.name,
        price: altPriceInNativeCurrency,
        notes: `${sub.notes || ''} (Optimized & switched to cheaper alternative [${recommendedAlternative.name}] via SaaS Savings Finder)`
      });

      setSwitchSuccessMessage(`Successfully switched subscription from ${sub.name} to ${recommendedAlternative.name}! Your database has been synchronized.`);
      setSelectedSubId('');
      setRecommendedAlternative(null);
    } catch (err) {
      console.error('Failed to switch subscription:', err);
    }
  };

  // Inactivity quick cancel
  const handleQuickCancel = async (subId: string) => {
    try {
      await onDeleteSubscription(subId);
      setSwitchSuccessMessage("License purged successfully. All recurrent costs aborted.");
    } catch (err) {
      console.error("Failed to cancel subscription:", err);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn" id="smart-insights-marketplace">
      
      {/* Dynamic Success Notice */}
      {switchSuccessMessage && (
        <div className="bg-emerald-500/10 border-2 border-emerald-500 text-white p-4.5 rounded-2xl flex items-start gap-3 shadow-[0_4px_25px_rgba(16,185,129,0.25)]">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">Governance Sync Complete</span>
            <p className="text-xs sm:text-sm font-semibold leading-relaxed">{switchSuccessMessage}</p>
          </div>
          <button 
            onClick={() => setSwitchSuccessMessage('')}
            className="text-xs text-text-dim hover:text-white font-bold cursor-pointer"
          >
            Close
          </button>
        </div>
      )}

      {/* Hero Banner Section */}
      <div className="bg-gradient-to-br from-teal-100/50 via-indigo-50/30 to-surface dark:from-teal-950/40 dark:via-indigo-950/20 dark:to-surface border border-teal-500/10 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-xs font-bold uppercase tracking-wider">Smart Insights & Savings Finder</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-text-main font-display tracking-tight">
              AI Spend Optimizer
            </h1>
            <p className="text-xs text-text-dim max-w-xl leading-relaxed">
              Find cheaper software alternatives, monitor unused/idle seats, and analyze enterprise pricing benchmarks to eliminate license waste.
            </p>
          </div>
          <div className="bg-sidebar border border-surface-border p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
            <Scale className="w-5 h-5 text-accent" />
            <div>
              <span className="text-[10px] text-text-dim font-bold uppercase tracking-wider block">Logged Catalog</span>
              <span className="text-sm font-extrabold text-text-main block">{saasCatalog.length} Platforms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Layout: Controls (Left) + Catalog (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* Left Column: Switch & Save + Inactivity Analyzer */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* 1. Switch & Save Finder */}
          <div className="bg-surface border border-surface-border rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
            <div className="flex items-center gap-2.5 pb-2.5 border-b border-surface-border/50">
              <div className="p-1.5 bg-accent/15 rounded-lg">
                <ArrowLeftRight className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white font-display">SaaS Alternative Finder</h3>
                <p className="text-[10px] text-text-dim uppercase tracking-wider font-semibold font-mono">Cut licencing bills instantly</p>
              </div>
            </div>

            <p className="text-xs text-text-dim leading-relaxed font-medium">
              Swap over-priced subscriptions. Choose an active tool to locate high-fidelity cheaper replacements in our database.
            </p>

            <div className="space-y-4 pt-1">
              <div>
                <label className="block text-[9px] font-bold text-text-dim uppercase tracking-wider mb-1.5">
                  Select Tracked Subscription
                </label>
                <select
                  value={selectedSubId}
                  onChange={(e) => handleSelectSubscriptionToSwitch(e.target.value)}
                  className="w-full bg-sidebar border border-surface-border rounded-xl py-2 px-3 text-xs font-semibold text-white focus:outline-none focus:border-accent animate-pulse"
                >
                  <option value="">-- Choose active subscription --</option>
                  {activeSubs.map(sub => (
                    <option key={sub.id} value={sub.id} className="bg-surface">
                      {sub.name} ({formatCurrency(sub.price, sub.currency || 'USD')})
                    </option>
                  ))}
                </select>
              </div>

              {selectedSubId && (
                <div className="space-y-4 border-t border-surface-border/50 pt-4 animate-fadeIn">
                  
                  {recommendedAlternative ? (
                    <div className="space-y-3">
                      
                      <div className="bg-sidebar p-4 rounded-xl border border-teal-500/20 space-y-2">
                        <span className="text-[9px] font-bold text-teal-400 uppercase tracking-widest block">cheaper alternative discovered</span>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-white">{recommendedAlternative.name}</span>
                          <span className="text-xs font-extrabold text-teal-400">
                            {formatCurrency(recommendedAlternative.priceUSD, 'USD')}/mo
                          </span>
                        </div>
                        <p className="text-[10px] text-text-dim leading-relaxed font-medium">{recommendedAlternative.audience}</p>
                      </div>

                      {/* Savings calculation */}
                      {(() => {
                        const sub = subscriptions.find(s => s.id === selectedSubId)!;
                        const subPriceUSD = convertCurrency(sub.price, sub.currency || 'USD', 'USD');
                        const subMonthlyUSD = sub.cycle === 'yearly' ? subPriceUSD / 12 : sub.cycle === 'quarterly' ? subPriceUSD / 3 : subPriceUSD;
                        
                        const altMonthlyUSD = recommendedAlternative.priceUSD;
                        const savingsMonthlyUSD = Math.max(0, subMonthlyUSD - altMonthlyUSD);
                        const savingsAnnualUSD = savingsMonthlyUSD * 12;

                        const savingsMonthlyInBase = convertCurrency(savingsMonthlyUSD, 'USD', baseCurrency);
                        const savingsAnnualInBase = convertCurrency(savingsAnnualUSD, 'USD', baseCurrency);

                        return (
                          <div className="space-y-3 pt-1">
                            <div className="bg-indigo-500/5 rounded-xl p-3 border border-indigo-500/20 flex items-start gap-2.5">
                              <TrendingDown className="w-4.5 h-4.5 text-indigo-400 shrink-0 mt-0.5" />
                              <div className="text-[11px] leading-relaxed font-semibold">
                                <span className="text-white block">Projected Cost Savings</span>
                                <span className="text-text-dim block">
                                  Save <strong className="text-emerald-400">{formatCurrency(savingsMonthlyInBase, baseCurrency)}</strong> per month!
                                </span>
                                <span className="text-text-dim block">
                                  Save <strong className="text-emerald-400">{formatCurrency(savingsAnnualInBase, baseCurrency)}</strong> annually ({baseCurrency}).
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={handleConfirmSwitch}
                              className="w-full bg-gradient-to-r from-teal-500 to-indigo-600 text-white py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-all cursor-pointer shadow-md"
                            >
                              Confirm Replacement
                            </button>
                          </div>
                        );
                      })()}

                    </div>
                  ) : (
                    <div className="bg-sidebar p-3.5 rounded-xl border border-surface-border text-center text-xs font-semibold text-text-dim">
                      We couldn't locate a pre-logged cheaper alternative in our database directory for this subscription.
                    </div>
                  )}

                </div>
              )}
            </div>
          </div>

          {/* 2. Inactivity & Underutilization Analyzer */}
          <div className="bg-surface border border-surface-border rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
            <div className="flex items-center gap-2.5 pb-2.5 border-b border-surface-border/50">
              <div className="p-1.5 bg-rose-500/10 rounded-lg">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white font-display">Inactivity Analyzer</h3>
                <p className="text-[10px] text-text-dim uppercase tracking-wider font-semibold font-mono">Purge underutilized tools</p>
              </div>
            </div>

            <p className="text-xs text-text-dim leading-relaxed font-medium">
              Flag licenses with weak team activity. Set status to <strong>Idle</strong> or <strong>Unused</strong> to show dynamic cancellation prompts.
            </p>

            {activeSubs.length > 0 ? (
              <div className="space-y-3 pt-1">
                {activeSubs.map((sub) => {
                  const state = utilizationStates[sub.id || ''] || 'active';
                  
                  return (
                    <div key={sub.id} className="bg-sidebar/50 p-3 rounded-xl border border-surface-border/40 space-y-2.5 hover:border-surface-border transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate max-w-[120px]">{sub.name}</span>
                        
                        <select
                          value={state}
                          onChange={(e) => handleSetUtilization(sub.id || '', e.target.value as any)}
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded border focus:outline-none cursor-pointer uppercase ${
                            state === 'active' 
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                              : state === 'idle'
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                : 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse'
                          }`}
                        >
                          <option value="active" className="bg-surface text-emerald-400">Active</option>
                          <option value="idle" className="bg-surface text-amber-400">Idle</option>
                          <option value="unused" className="bg-surface text-rose-400">Unused</option>
                        </select>
                      </div>

                      {/* Display Alert Prompt if not Active */}
                      {state !== 'active' && (
                        <div className="p-2.5 bg-rose-500/5 rounded-lg border border-rose-500/20 space-y-2 animate-fadeIn">
                          <p className="text-[10px] text-text-dim leading-relaxed font-medium">
                            ⚠️ <strong>Advisory:</strong> Marked as <span className="text-rose-400 uppercase font-bold">{state}</span>. Why sustain overhead? Cancel to instantly trim <strong>{formatCurrency(sub.price, sub.currency || 'USD')}/{sub.cycle}</strong>.
                          </p>
                          <button
                            onClick={() => handleQuickCancel(sub.id || '')}
                            className="flex items-center justify-center gap-1.5 w-full bg-rose-600/10 border border-rose-500/30 hover:bg-rose-600 text-rose-400 hover:text-white py-1 rounded-lg text-[9px] font-extrabold uppercase transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Cancel Subscription</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <span className="text-xs text-text-dim block py-4 text-center">No active licenses to analyze.</span>
            )}
          </div>

        </div>

        {/* Right Column: Catalog Directory List + SaaS Pricing Trends */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* SaaS Pricing Trends Bento Card */}
          <div className="bg-surface border border-surface-border rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-surface-border/50">
              <BarChart3 className="w-5 h-5 text-accent" />
              <div>
                <h3 className="text-sm font-extrabold text-white font-display">SaaS Category Pricing Trends</h3>
                <p className="text-[10px] text-text-dim uppercase tracking-wider font-semibold font-mono">Market cost indexes vs your stack</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
              <div className="bg-sidebar/50 p-3.5 rounded-xl border border-surface-border">
                <span className="text-[9px] text-text-dim font-bold block uppercase">Communication</span>
                <span className="text-base font-mono font-extrabold text-white block">$6.80 <span className="text-[10px] text-emerald-400 font-bold font-sans">Avg/mo</span></span>
                <span className="text-[9px] text-text-dim leading-normal block pt-1">Highly commoditized space. Discord/Meet options enable huge cuts.</span>
              </div>
              <div className="bg-sidebar/50 p-3.5 rounded-xl border border-surface-border">
                <span className="text-[9px] text-text-dim font-bold block uppercase">Design Suites</span>
                <span className="text-base font-mono font-extrabold text-white block">$27.50 <span className="text-[10px] text-rose-400 font-bold font-sans">Avg/mo</span></span>
                <span className="text-[9px] text-text-dim leading-normal block pt-1">High price inelasticity. Premium Adobe packages are primary targets.</span>
              </div>
              <div className="bg-sidebar/50 p-3.5 rounded-xl border border-surface-border">
                <span className="text-[9px] text-text-dim font-bold block uppercase">AI Productivity</span>
                <span className="text-base font-mono font-extrabold text-white block">$19.99 <span className="text-[10px] text-indigo-400 font-bold font-sans">Avg/mo</span></span>
                <span className="text-[9px] text-text-dim leading-normal block pt-1">Strict price standard at $20/user. Consolidating to Gemini is recommended.</span>
              </div>
            </div>
          </div>

          {/* Catalog List */}
          <div className="bg-surface border border-surface-border rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
            
            {/* Header & Filter Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-surface-border/50">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-white font-display">SaaS Pricing Catalog Directory</h3>
                <p className="text-[10px] text-text-dim uppercase tracking-wider font-semibold font-mono">Market comparison benchmarks</p>
              </div>

              {/* Category selector */}
              <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-accent/15 text-accent border border-accent/25 shadow-sm'
                        : 'text-text-dim hover:text-text-main'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Directory list */}
            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
              {filteredCatalog.map((item, i) => (
                <div key={i} className="p-4 bg-sidebar/40 hover:bg-sidebar rounded-xl border border-surface-border/40 transition-all flex flex-col md:flex-row justify-between gap-4">
                  
                  {/* Name, category, description */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{item.name}</span>
                      <span className="text-[8px] font-extrabold bg-surface border border-surface-border/50 px-1.5 py-0.5 rounded uppercase tracking-wider text-text-dim">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-dim leading-relaxed font-semibold">{item.audience}</p>
                    
                    {/* Bullet features */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2">
                      {item.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-1.5 text-[10px] text-text-dim">
                          <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="truncate">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pricing info & links */}
                  <div className="flex flex-col items-start md:items-end justify-between min-w-[120px] pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-surface-border/40 md:pl-4">
                    <div className="text-left md:text-right">
                      <span className="text-xs text-text-dim block uppercase font-bold tracking-wider">Starting from</span>
                      <span className="text-sm font-extrabold text-white font-display">
                        {formatCurrency(convertCurrency(item.priceUSD, 'USD', baseCurrency), baseCurrency)}/{item.cycle === 'yearly' ? 'yr' : 'mo'}
                      </span>
                    </div>

                    <a
                      href={item.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] font-extrabold uppercase text-accent hover:underline mt-2 cursor-pointer self-start md:self-end"
                    >
                      <span>Website</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                </div>
              ))}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
