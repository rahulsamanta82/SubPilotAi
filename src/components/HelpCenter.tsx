import React, { useState } from 'react';
import { Search, HelpCircle, Shield, Calculator, CheckCircle, Lightbulb, Sparkles, BookOpen } from 'lucide-react';
import { Subscription } from '../types';
import { formatCurrency } from '../lib/currency';

interface HelpCenterProps {
  subscriptions: Subscription[];
  userProfile: any;
  baseCurrency: string;
}

interface FAQItem {
  question: string;
  answer: string;
  category: 'Billing' | 'Optimization' | 'Security' | 'General';
}

export const HelpCenter: React.FC<HelpCenterProps> = ({ subscriptions, userProfile, baseCurrency }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'billing' | 'optimization' | 'security'>('all');
  const [calcPrice, setCalcPrice] = useState('49.99');
  const [calcCycle, setCalcCycle] = useState<'monthly' | 'yearly' | 'weekly' | 'quarterly'>('monthly');

  const faqs: FAQItem[] = [
    {
      category: 'Billing',
      question: 'How does SubPilot normalize different billing cycles?',
      answer: 'To provide a uniform dashboard, SubPilot converts all subscriptions into a standardized monthly baseline. Yearly subscriptions are divided by 12, weekly plans are multiplied by 4.33, and quarterly plans are divided by 3. This ensures your aggregate spending rate remains mathematically consistent.'
    },
    {
      category: 'Optimization',
      question: 'What are "Duplicate Waste Risks" and how are they computed?',
      answer: 'SubPilot analyzes subscription names for semantic similarities (e.g. "Zoom Workspace" and "Google Meet"). If multiple tools belonging to the same workspace or category are found, we flag them as potential duplicate risks to save you from overlapping premium licenses.'
    },
    {
      category: 'Security',
      question: 'Is my financial subscription data secure?',
      answer: 'Absolutely. SubPilot utilizes enterprise-grade Firestore databases with strict security rules. No raw credentials or payment methods are ever stored. If you import statements or invoices, they are parsed locally or via secure AI endpoints that adhere to strict privacy safeguards.'
    },
    {
      category: 'Optimization',
      question: 'How do I optimize a subscription from monthly to annual?',
      answer: 'You can use the AI Spend Optimizer tab. It evaluates if your recurring subscription supports a yearly plan. Switching to an annual plan typically unlocks a 15% to 25% discount. Clicking "Switch to Yearly" automatically updates the rate and billing cycle in your database.'
    },
    {
      category: 'Billing',
      question: 'How does multi-currency conversion work?',
      answer: 'SubPilot supports a wide variety of global currencies. If you have subscriptions in EUR, JPY, or GBP, you can select a single base display currency (e.g., USD or INR) in the header. We use live, accurate conversion multipliers to calculate your global unified spending footprint.'
    },
    {
      category: 'General',
      question: 'Can I share subscriptions with my team?',
      answer: 'Yes! The "Team Shared Seats" module lets you assign licenses to specific team owners, set seat capacities (e.g., 4 out of 10 seats used), and identify unused overhead before buying additional premium subscription tiers.'
    }
  ];

  // Calculation normalizer tool inside help center
  const getNormalizedResult = () => {
    const price = parseFloat(calcPrice) || 0;
    let monthly = price;
    let annual = price * 12;

    if (calcCycle === 'yearly') {
      monthly = price / 12;
      annual = price;
    } else if (calcCycle === 'weekly') {
      monthly = price * 4.33;
      annual = price * 52;
    } else if (calcCycle === 'quarterly') {
      monthly = price / 3;
      annual = price * 4;
    }

    return { monthly, annual };
  };

  const norm = getNormalizedResult();

  // Filter FAQs
  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || faq.category.toLowerCase() === activeTab;
    return matchesSearch && matchesTab;
  });

  const activeCount = subscriptions.filter(s => s.status === 'active').length;
  const userName = userProfile?.name || 'SubPilot Member';

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn" id="help-center-tab">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-indigo-100/50 via-purple-50/30 to-surface dark:from-indigo-900/60 dark:via-purple-900/40 dark:to-surface border border-indigo-500/20 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-40 h-40 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-accent">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider">SubPilot Trust & Assistance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main font-display tracking-tight">
              Knowledge & Help Center
            </h1>
            <p className="text-xs sm:text-sm text-text-dim max-w-xl leading-relaxed">
              Hello, <strong className="text-text-main">{userName}</strong>! We are here to help you govern SaaS expenses. You currently have <strong className="text-accent">{activeCount} active subscriptions</strong> tracked. Let's make every dollar count.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-3 rounded-xl">
            <Shield className="w-5 h-5 text-accent shrink-0" />
            <div className="text-[11px]">
              <span className="font-bold text-text-main block">Enterprise SLA Grade</span>
              <span className="text-text-dim block">100% Client Data Governance</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: FAQ + Interactive Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* Left Columns: FAQs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-surface-border rounded-2xl p-6 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <BookOpen className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-white font-display">Frequently Asked Questions</h2>
                  <p className="text-[10px] text-text-dim uppercase tracking-wider font-semibold">Search and clarify SaaS metrics</p>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-dim" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-sidebar border border-surface-border rounded-xl py-1.5 pl-9 pr-4 text-xs font-semibold focus:outline-none focus:border-accent text-white"
                />
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none border-b border-surface-border/50">
              {(['all', 'billing', 'optimization', 'security'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === cat
                      ? 'bg-accent/10 text-accent border border-accent/20 shadow-sm'
                      : 'text-text-dim hover:text-text-main hover:bg-sidebar'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* FAQ List */}
            <div className="space-y-4">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq, i) => (
                  <div key={i} className="p-4 bg-sidebar/50 hover:bg-sidebar rounded-xl border border-surface-border/30 transition-all space-y-2">
                    <div className="flex items-start gap-2.5">
                      <HelpCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <h3 className="text-xs sm:text-sm font-bold text-white leading-snug">{faq.question}</h3>
                    </div>
                    <p className="text-xs text-text-dim pl-6 leading-relaxed font-medium">{faq.answer}</p>
                    <div className="pl-6 pt-1">
                      <span className="inline-block bg-accent/5 border border-accent/10 text-accent text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {faq.category}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-text-dim text-xs font-semibold">
                  No FAQs match your search queries. Try another term.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Calculator Tool & Compliance Tips */}
        <div className="space-y-6 sm:space-y-8">
          
          {/* Interactive Calculator */}
          <div className="bg-surface border border-surface-border rounded-2xl p-6 shadow-md space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-surface-border/50">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <Calculator className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-white font-display">Calculations Checker</h2>
                <p className="text-[10px] text-text-dim uppercase tracking-wider font-semibold">Test normalization values</p>
              </div>
            </div>

            <p className="text-xs text-text-dim leading-relaxed font-medium">
              Understand exactly how a subscription price is parsed and distributed across your monthly and annual budget outlines.
            </p>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[10px] font-bold text-text-dim uppercase tracking-wider mb-1.5">
                  Subscription Rate
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-accent">{baseCurrency}</span>
                  <input
                    type="number"
                    value={calcPrice}
                    onChange={(e) => setCalcPrice(e.target.value)}
                    className="w-full bg-sidebar border border-surface-border rounded-xl py-2 pl-12 pr-4 text-xs font-bold text-white focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-dim uppercase tracking-wider mb-1.5">
                  Billing Frequency
                </label>
                <select
                  value={calcCycle}
                  onChange={(e: any) => setCalcCycle(e.target.value)}
                  className="w-full bg-sidebar border border-surface-border rounded-xl py-2 px-3 text-xs font-bold text-white focus:outline-none focus:border-accent"
                >
                  <option value="weekly">Weekly Plan</option>
                  <option value="monthly">Monthly Plan</option>
                  <option value="quarterly">Quarterly Plan</option>
                  <option value="yearly">Yearly Plan</option>
                </select>
              </div>
            </div>

            {/* Normalization Results */}
            <div className="bg-sidebar rounded-xl p-4 border border-surface-border/50 space-y-3">
              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest block">Standardized Baselines</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface/50 border border-surface-border/30 rounded-lg p-2.5">
                  <span className="text-[9px] text-text-dim block mb-0.5">Monthly Cost</span>
                  <span className="text-xs font-extrabold text-white">{formatCurrency(norm.monthly, baseCurrency)}</span>
                </div>
                <div className="bg-surface/50 border border-surface-border/30 rounded-lg p-2.5">
                  <span className="text-[9px] text-text-dim block mb-0.5">Yearly Cost</span>
                  <span className="text-xs font-extrabold text-white">{formatCurrency(norm.annual, baseCurrency)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Core Trust & Best Practices */}
          <div className="bg-gradient-to-br from-indigo-950/30 to-surface border border-surface-border rounded-2xl p-6 shadow-md space-y-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-accent" />
              <span className="text-xs font-bold text-white uppercase tracking-wider font-display">Best Security Practices</span>
            </div>
            
            <ul className="space-y-3 text-xs font-medium text-text-dim">
              <li className="flex gap-2.5">
                <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span><strong>Review your owner settings</strong>: Keeping "Design Team" or "Personal" tabs sorted helps locate orphan subscriptions.</span>
              </li>
              <li className="flex gap-2.5">
                <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span><strong>Check Renewal Calendars</strong>: Keeping renewal dates up to date avoids unexpected recurring bank debits.</span>
              </li>
              <li className="flex gap-2.5">
                <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span><strong>Avoid Shared Logins</strong>: Use seat tracking on SubPilot to allocate individual corporate seats securely.</span>
              </li>
            </ul>
          </div>

        </div>
      </div>

    </div>
  );
};
