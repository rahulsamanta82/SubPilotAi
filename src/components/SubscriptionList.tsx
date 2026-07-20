import React, { useState } from 'react';
import { Subscription, BillingCycle, SubscriptionStatus } from '../types';
import { 
  Plus, Search, Filter, Edit2, Trash2, Calendar, 
  ExternalLink, Users, Sparkles, DollarSign, X, Check, Globe, Banknote
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SUPPORTED_CURRENCIES, formatCurrency, convertCurrency } from '../lib/currency';

interface SubscriptionListProps {
  subscriptions: Subscription[];
  onAdd: (sub: Omit<Subscription, 'id'>) => Promise<void>;
  onUpdate: (id: string, sub: Partial<Subscription>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClearAll?: () => void;
  baseCurrency?: string;
}

export const SubscriptionList: React.FC<SubscriptionListProps> = ({
  subscriptions,
  onAdd,
  onUpdate,
  onDelete,
  onClearAll,
  baseCurrency = 'USD',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [ownerFilter, setOwnerFilter] = useState('All');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [subToDelete, setSubToDelete] = useState<Subscription | null>(null);
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [category, setCategory] = useState('Productivity');
  const [startDate, setStartDate] = useState('');
  const [nextRenewalDate, setNextRenewalDate] = useState('');
  const [status, setStatus] = useState<SubscriptionStatus>('active');
  const [owner, setOwner] = useState('');
  const [seatsUsed, setSeatsUsed] = useState('');
  const [seatsTotal, setSeatsTotal] = useState('');
  const [notes, setNotes] = useState('');
  const [url, setUrl] = useState('');

  const openAddModal = () => {
    setEditingSub(null);
    setName('');
    setPrice('');
    setCurrency('USD');
    setCycle('monthly');
    setCategory('Productivity');
    setStartDate(new Date().toISOString().split('T')[0]);
    setNextRenewalDate('');
    setStatus('active');
    setOwner('');
    setSeatsUsed('');
    setSeatsTotal('');
    setNotes('');
    setUrl('');
    setIsFormOpen(true);
  };

  const openEditModal = (sub: Subscription) => {
    setEditingSub(sub);
    setName(sub.name);
    setPrice(sub.price.toString());
    setCurrency(sub.currency || 'USD');
    setCycle(sub.cycle);
    setCategory(sub.category);
    setStartDate(sub.startDate);
    setNextRenewalDate(sub.nextRenewalDate);
    setStatus(sub.status);
    setOwner(sub.owner || '');
    setSeatsUsed(sub.seatsUsed ? sub.seatsUsed.toString() : '');
    setSeatsTotal(sub.seatsTotal ? sub.seatsTotal.toString() : '');
    setNotes(sub.notes || '');
    setUrl(sub.url || '');
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;

    const subData = {
      name,
      price: parseFloat(price),
      currency,
      cycle,
      category,
      startDate,
      nextRenewalDate: nextRenewalDate || startDate,
      status,
      owner: owner || 'Personal',
      seatsUsed: seatsUsed ? parseInt(seatsUsed) : null,
      seatsTotal: seatsTotal ? parseInt(seatsTotal) : null,
      notes: notes || null,
      url: url || null,
    };

    if (editingSub && editingSub.id) {
      await onUpdate(editingSub.id, subData);
    } else {
      await onAdd(subData);
    }
    setIsFormOpen(false);
  };

  // Get unique categories and owners
  const categories = ['All', ...Array.from(new Set(subscriptions.map(s => s.category)))];
  const owners = ['All', ...Array.from(new Set(subscriptions.map(s => s.owner || 'Personal')))];

  const filteredSubs = subscriptions.filter(sub => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      sub.name.toLowerCase().includes(searchLower) || 
      (sub.category && sub.category.toLowerCase().includes(searchLower)) ||
      ((sub.owner || 'Personal').toLowerCase().includes(searchLower)) ||
      (sub.notes && sub.notes.toLowerCase().includes(searchLower));

    const matchesCategory = categoryFilter === 'All' || sub.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || sub.status === statusFilter;
    const matchesOwner = ownerFilter === 'All' || (sub.owner || 'Personal') === ownerFilter;

    return matchesSearch && matchesCategory && matchesStatus && matchesOwner;
  });

  return (
    <div id="sub-management" className="premium-card p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-text-main to-accent font-display">Active Subscriptions</h2>
          <p className="text-xs text-text-dim font-medium">Track, update, or cancel SaaS tools and services.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          {subscriptions.length > 0 && onClearAll && (
            <button
              onClick={() => setIsPurgeModalOpen(true)}
              className="flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400 border border-rose-500/20 hover:border-rose-500 font-bold px-4 py-2.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(239,68,68,0.1)] hover:shadow-[0_6px_18px_rgba(239,68,68,0.3)] hover:scale-[1.01] active:scale-[0.99] cursor-pointer text-xs sm:text-sm"
              title="Delete all active subscriptions and clear history"
            >
              <Trash2 className="w-4 h-4 shrink-0" />
              Purge All Expenses
            </button>
          )}
          <button
            id="btn-add-subscription"
            onClick={openAddModal}
            className="flex items-center gap-2 bg-gradient-to-r from-accent to-purple-600 hover:from-purple-600 hover:to-indigo-600 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-[0_4px_15px_rgba(139,92,246,0.25)] hover:shadow-[0_6px_20px_rgba(139,92,246,0.45)] hover:scale-[1.01] active:scale-[0.99] cursor-pointer text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Subscription
          </button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <div className="relative col-span-1 sm:col-span-2 lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim w-4 h-4" />
          <input
            id="search-subs"
            type="text"
            placeholder="Search by name, category, or owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-sidebar border border-surface-border rounded-xl text-text-main placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-main transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div>
          <select
            id="filter-category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-sidebar border border-surface-border rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-sm cursor-pointer"
          >
            <option value="All">All Categories</option>
            {categories.filter(c => c !== 'All').map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            id="filter-owner"
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-sidebar border border-surface-border rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-sm cursor-pointer"
          >
            <option value="All">All Owners</option>
            {owners.filter(o => o !== 'All').map(own => (
              <option key={own} value={own}>{own}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            id="filter-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-sidebar border border-surface-border rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-sm cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="trialing">Trialing</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Quick Category Filters Pills */}
      <div className="flex flex-wrap items-center gap-1.5 mb-6 bg-sidebar/25 border border-surface-border/30 p-2.5 rounded-xl">
        <span className="text-[10px] text-text-dim uppercase tracking-wider font-extrabold mr-1">Quick Filters:</span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
              categoryFilter === cat
                ? 'bg-accent/15 border-accent text-accent shadow-sm shadow-accent/5'
                : 'bg-sidebar/40 border-surface-border/40 text-text-dim hover:text-text-main hover:border-surface-border'
            }`}
          >
            {cat === 'All' ? 'All' : cat}
          </button>
        ))}
      </div>

      {/* Active Filter Tags Indicator */}
      {(searchTerm || categoryFilter !== 'All' || statusFilter !== 'All' || ownerFilter !== 'All') && (
        <div className="flex flex-wrap items-center gap-2 mb-6 text-xs text-text-dim bg-sidebar/30 p-3 rounded-xl border border-surface-border/50">
          <span className="font-semibold text-text-main/80 mr-1">Active filters:</span>
          {searchTerm && (
            <span className="flex items-center gap-1.5 bg-accent/10 border border-accent/20 text-accent px-2.5 py-1 rounded-lg">
              Search: "{searchTerm}"
              <X className="w-3.5 h-3.5 cursor-pointer hover:text-text-main transition-colors" onClick={() => setSearchTerm('')} />
            </span>
          )}
          {categoryFilter !== 'All' && (
            <span className="flex items-center gap-1.5 bg-accent/10 border border-accent/20 text-accent px-2.5 py-1 rounded-lg">
              Category: {categoryFilter}
              <X className="w-3.5 h-3.5 cursor-pointer hover:text-text-main transition-colors" onClick={() => setCategoryFilter('All')} />
            </span>
          )}
          {ownerFilter !== 'All' && (
            <span className="flex items-center gap-1.5 bg-accent/10 border border-accent/20 text-accent px-2.5 py-1 rounded-lg">
              Owner: {ownerFilter}
              <X className="w-3.5 h-3.5 cursor-pointer hover:text-text-main transition-colors" onClick={() => setOwnerFilter('All')} />
            </span>
          )}
          {statusFilter !== 'All' && (
            <span className="flex items-center gap-1.5 bg-accent/10 border border-accent/20 text-accent px-2.5 py-1 rounded-lg">
              Status: {statusFilter}
              <X className="w-3.5 h-3.5 cursor-pointer hover:text-text-main transition-colors" onClick={() => setStatusFilter('All')} />
            </span>
          )}
          <button
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('All');
              setStatusFilter('All');
              setOwnerFilter('All');
            }}
            className="ml-auto text-accent hover:text-blue-400 font-bold hover:underline cursor-pointer transition-all text-xs"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Subscription Grid/List */}
      {filteredSubs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-surface-border rounded-2xl bg-sidebar/30">
          <Sparkles className="w-10 h-10 text-text-dim mb-3" />
          <p className="text-gray-300 font-medium">No subscriptions matched your filters</p>
          <p className="text-text-dim text-sm mt-1">Try resetting search terms, categories, or add a subscription.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-border text-text-dim text-xs font-semibold uppercase tracking-wider">
                <th className="py-4 px-2">Service</th>
                <th className="py-4 px-2">Price</th>
                <th className="py-4 px-2">Category</th>
                <th className="py-4 px-2">Renewal Date</th>
                <th className="py-4 px-2">Status</th>
                <th className="py-4 px-2">Utilization</th>
                <th className="py-4 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border text-text-main/90 text-sm">
              {filteredSubs.map((sub) => {
                const isOverUtilized = sub.seatsUsed && sub.seatsTotal && (sub.seatsUsed < sub.seatsTotal * 0.5);
                return (
                  <tr key={sub.id} id={`sub-row-${sub.id}`} className="hover:bg-sidebar/50 transition-colors group">
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-sidebar border border-surface-border flex items-center justify-center text-accent font-bold font-display text-sm">
                          {sub.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-semibold text-text-main flex items-center gap-1.5">
                            {sub.name}
                            {sub.url && (
                              <a href={sub.url} target="_blank" rel="noreferrer" className="text-text-dim hover:text-accent">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </span>
                          <span className="text-xs text-text-dim font-medium block">
                            Owned by {sub.owner || 'Personal'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-2 font-mono">
                      <div className="flex flex-col">
                        <span className="font-bold text-text-main text-sm">
                          {formatCurrency(sub.price, sub.currency || 'USD')}
                        </span>
                        {(sub.currency || 'USD').toUpperCase() !== baseCurrency.toUpperCase() && (
                          <span className="text-[10px] text-accent/90 font-semibold font-sans">
                            ≈ {formatCurrency(convertCurrency(sub.price, sub.currency || 'USD', baseCurrency), baseCurrency)}
                          </span>
                        )}
                        <span className="text-[10px] text-text-dim lowercase font-sans">
                          /{sub.cycle.replace('ly', '')}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-accent/15 text-accent border border-accent/20">
                        {sub.category}
                      </span>
                    </td>
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-1.5 text-text-main/95">
                        <Calendar className="w-4 h-4 text-text-dim" />
                        <span>{sub.nextRenewalDate}</span>
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        sub.status === 'active' ? 'bg-success/15 text-success border border-success/20' :
                        sub.status === 'trialing' ? 'bg-accent/15 text-accent border border-accent/20' :
                        sub.status === 'paused' ? 'bg-warning/15 text-warning border border-warning/20' :
                        'bg-white/5 text-text-dim border border-white/10'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          sub.status === 'active' ? 'bg-success' :
                          sub.status === 'trialing' ? 'bg-accent' :
                          sub.status === 'paused' ? 'bg-warning' :
                          'bg-text-dim'
                        }`} />
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-4 px-2">
                      {sub.seatsUsed && sub.seatsTotal ? (
                        <div>
                          <div className="flex items-center justify-between text-xs font-medium text-text-dim mb-1">
                            <span>{sub.seatsUsed}/{sub.seatsTotal} seats</span>
                            {isOverUtilized && <span className="text-warning text-[10px]">Underused</span>}
                          </div>
                          <div className="w-24 bg-sidebar rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${isOverUtilized ? 'bg-warning' : 'bg-accent'}`}
                              style={{ width: `${(sub.seatsUsed / sub.seatsTotal) * 100}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-text-dim">N/A</span>
                      )}
                    </td>
                    <td className="py-4 px-2 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(sub)}
                          className="p-1.5 hover:bg-sidebar text-text-dim hover:text-white rounded-lg border border-transparent hover:border-surface-border transition-all cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSubToDelete(sub)}
                          className="p-1.5 hover:bg-rose-950/40 text-text-dim hover:text-rose-400 rounded-lg border border-transparent hover:border-rose-900/30 transition-all cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Standard Modal / Dialog */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-surface-border rounded-2xl max-w-lg w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh] text-text-main"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold font-display text-text-main">
                  {editingSub ? 'Edit Subscription Details' : 'Add New SaaS Subscription'}
                </h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1.5 hover:bg-sidebar rounded-lg text-text-dim hover:text-text-main cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-text-dim uppercase mb-1">Service Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Netflix, ChatGPT Plus, Slack Pro"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-sidebar border border-surface-border text-text-main rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-dim uppercase mb-1">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-sidebar border border-surface-border text-text-main rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm focus:outline-none cursor-pointer"
                    >
                      {SUPPORTED_CURRENCIES.map(curr => (
                        <option key={curr.code} value={curr.code}>
                          {curr.code} ({curr.symbol})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-dim uppercase mb-1">Price</label>
                    <div className="relative">
                      <span className="text-text-dim font-bold absolute left-3.5 top-1/2 -translate-y-1/2 text-sm">
                        {SUPPORTED_CURRENCIES.find(c => c.code === currency)?.symbol || '$'}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="15.00"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full pl-8 pr-3.5 py-2.5 bg-sidebar border border-surface-border text-text-main rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-dim uppercase mb-1">Billing Cycle</label>
                    <select
                      value={cycle}
                      onChange={(e) => setCycle(e.target.value as BillingCycle)}
                      className="w-full px-3.5 py-2.5 bg-sidebar border border-surface-border text-text-main rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm focus:outline-none cursor-pointer"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-dim uppercase mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-sidebar border border-surface-border text-text-main rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm focus:outline-none cursor-pointer"
                    >
                      <option value="Entertainment">Entertainment</option>
                      <option value="Productivity">Productivity</option>
                      <option value="Infrastructure">Infrastructure</option>
                      <option value="Design">Design</option>
                      <option value="Communication">Communication</option>
                      <option value="Finance">Finance</option>
                      <option value="Utilities">Utilities</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-dim uppercase mb-1">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}
                      className="w-full px-3.5 py-2.5 bg-sidebar border border-surface-border text-text-main rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm focus:outline-none cursor-pointer"
                    >
                      <option value="active">Active</option>
                      <option value="trialing">Trialing</option>
                      <option value="paused">Paused</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-dim uppercase mb-1">Start Date</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-sidebar border border-surface-border text-text-main rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-dim uppercase mb-1">Next Renewal</label>
                    <input
                      type="date"
                      value={nextRenewalDate}
                      onChange={(e) => setNextRenewalDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-sidebar border border-surface-border text-text-main rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-dim uppercase mb-1">Assignee / Owner</label>
                    <input
                      type="text"
                      placeholder="e.g. Personal, Engineering, Design Team"
                      value={owner}
                      onChange={(e) => setOwner(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-sidebar border border-surface-border text-text-main rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-text-dim uppercase mb-1">Seats Used</label>
                      <input
                        type="number"
                        placeholder="8"
                        value={seatsUsed}
                        onChange={(e) => setSeatsUsed(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-sidebar border border-surface-border text-text-main rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-text-dim uppercase mb-1">Total Seats</label>
                      <input
                        type="number"
                        placeholder="10"
                        value={seatsTotal}
                        onChange={(e) => setSeatsTotal(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-sidebar border border-surface-border text-text-main rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-text-dim uppercase mb-1">Portal URL</label>
                    <input
                      type="url"
                      placeholder="https://billing.netflix.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-sidebar border border-surface-border text-text-main rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm focus:outline-none"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-text-dim uppercase mb-1">Internal Notes</label>
                    <textarea
                      placeholder="Add any critical notes regarding cancellation, specific package, or usage guidelines."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      className="w-full px-3.5 py-2.5 bg-sidebar border border-surface-border text-text-main rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm focus:outline-none resize-none"
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-surface-border">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 border border-surface-border rounded-xl text-text-main/80 hover:bg-sidebar hover:text-text-main text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-accent hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-[0_4px_12px_rgba(59,130,246,0.25)]"
                  >
                    {editingSub ? 'Save Changes' : 'Confirm & Add'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Custom Deletion Confirmation Modal */}
        {subToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-surface-border rounded-2xl max-w-md w-full p-6 shadow-2xl text-text-main"
            >
              <div className="flex items-center gap-3 text-rose-500 mb-4">
                <Trash2 className="w-6 h-6 shrink-0" />
                <h3 className="text-lg font-bold font-display text-text-main">
                  Delete Subscription
                </h3>
              </div>
              <p className="text-sm text-text-dim mb-6 leading-relaxed">
                Are you sure you want to delete <strong className="text-text-main">{subToDelete.name}</strong>? This action is permanent and cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setSubToDelete(null)}
                  className="px-4 py-2 border border-surface-border rounded-xl text-text-main/80 hover:bg-sidebar hover:text-text-main text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (subToDelete.id) {
                      await onDelete(subToDelete.id);
                    }
                    setSubToDelete(null);
                  }}
                  className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-[0_4px_12px_rgba(239,68,68,0.25)]"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Custom Purge All Confirmation Modal */}
        {isPurgeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-surface-border rounded-2xl max-w-md w-full p-6 shadow-2xl text-text-main"
            >
              <div className="flex items-center gap-3 text-rose-500 mb-4">
                <Trash2 className="w-6 h-6 shrink-0" />
                <h3 className="text-lg font-bold font-display text-text-main">
                  Purge All Expenses
                </h3>
              </div>
              <p className="text-sm text-text-dim mb-6 leading-relaxed font-medium">
                Are you absolutely sure you want to delete <strong className="text-rose-500 font-extrabold">ALL</strong> subscriptions? This will reset all your expense metrics and analytics back to zero. This action is permanent and cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setIsPurgeModalOpen(false)}
                  className="px-4 py-2 border border-surface-border rounded-xl text-text-main/80 hover:bg-sidebar hover:text-text-main text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (onClearAll) {
                      await onClearAll();
                    }
                    setIsPurgeModalOpen(false);
                  }}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-[0_4px_12px_rgba(220,38,38,0.25)]"
                >
                  Purge All
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
