import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { History, Plus, Trash2, Calendar, CreditCard, DollarSign, AlertCircle, FileText, CheckCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Subscription } from '../types';
import { convertCurrency, formatCurrency } from '../lib/currency';

interface PaymentHistoryProps {
  user: any;
  subscriptions: Subscription[];
  baseCurrency: string;
}

export interface PaymentTransaction {
  id?: string;
  userId: string;
  subscriptionId: string;
  subscriptionName: string;
  paymentDate: string;
  amountPaid: number;
  currency: string;
  paymentMethod: string;
  status: 'completed' | 'pending' | 'failed';
  referenceNumber?: string;
  notes?: string;
}

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({ user, subscriptions, baseCurrency }) => {
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSubId, setSelectedSubId] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [amountPaid, setAmountPaid] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [paymentMethod, setPaymentMethod] = useState('Visa');
  const [status, setStatus] = useState<'completed' | 'pending' | 'failed'>('completed');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [paymentToDelete, setPaymentToDelete] = useState<PaymentTransaction | null>(null);

  // Selected subscription watcher for auto-filling price
  useEffect(() => {
    if (selectedSubId) {
      const sub = subscriptions.find(s => s.id === selectedSubId);
      if (sub) {
        setAmountPaid(sub.price.toString());
        setCurrency(sub.currency || 'USD');
      }
    }
  }, [selectedSubId, subscriptions]);

  // Sync payments in real-time
  useEffect(() => {
    if (!user) {
      setPayments([]);
      setLoading(false);
      return;
    }

    if (user.uid === 'offline-guest') {
      const stored = localStorage.getItem('subpilot_offline_payments');
      if (stored) {
        try { setPayments(JSON.parse(stored)); } catch (e) { setPayments([]); }
      } else {
        setPayments([]);
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'payments'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: PaymentTransaction[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as PaymentTransaction);
      });
      // Sort payments by date descending
      list.sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));
      setPayments(list);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'payments');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedSubId) {
      setErrorMsg('Please select an active subscription.');
      return;
    }

    const price = parseFloat(amountPaid);
    if (isNaN(price) || price <= 0) {
      setErrorMsg('Please enter a valid payment amount.');
      return;
    }

    const sub = subscriptions.find(s => s.id === selectedSubId);
    if (!sub) return;

    const newPayment: Omit<PaymentTransaction, 'id'> = {
      userId: user.uid,
      subscriptionId: selectedSubId,
      subscriptionName: sub.name,
      paymentDate,
      amountPaid: price,
      currency,
      paymentMethod,
      status,
      referenceNumber: referenceNumber.trim() || undefined,
      notes: notes.trim() || undefined
    };

    if (user.uid === 'offline-guest') {
      const added: PaymentTransaction = {
        ...newPayment,
        id: `local-pay-${Date.now()}`
      };
      const updated = [added, ...payments];
      setPayments(updated);
      localStorage.setItem('subpilot_offline_payments', JSON.stringify(updated));
      resetForm();
      return;
    }

    try {
      await addDoc(collection(db, 'payments'), newPayment);
      resetForm();
    } catch (err: any) {
      console.error('Error adding payment document:', err);
      setErrorMsg('Failed to log payment transaction in Firestore.');
    }
  };

  const handleDeletePayment = async (payId: string) => {
    if (user.uid === 'offline-guest') {
      const updated = payments.filter(p => p.id !== payId);
      setPayments(updated);
      localStorage.setItem('subpilot_offline_payments', JSON.stringify(updated));
      return;
    }

    try {
      await deleteDoc(doc(db, 'payments', payId));
    } catch (err) {
      console.error('Error deleting payment transaction:', err);
    }
  };

  const resetForm = () => {
    setSelectedSubId('');
    setAmountPaid('');
    setNotes('');
    setReferenceNumber('');
    setShowAddForm(false);
    setErrorMsg('');
  };

  // Compute total accumulated spent in user base currency
  const computeTotalSpent = () => {
    let total = 0;
    payments.forEach(p => {
      if (p.status !== 'completed') return;
      const amountInBase = convertCurrency(p.amountPaid, p.currency || 'USD', baseCurrency);
      total += amountInBase;
    });
    return total;
  };

  const totalSpent = computeTotalSpent();

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn" id="payment-history-tab">
      
      {/* Top Banner section */}
      <div className="bg-gradient-to-br from-emerald-100/50 via-teal-50/30 to-surface dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-surface border border-emerald-500/10 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <History className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Payment Ledger Journal</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-text-main font-display tracking-tight">
              Historical Spending Log
            </h1>
            <p className="text-xs text-text-dim max-w-xl leading-relaxed">
              Maintain an audited history of completed payments for your actual tracked subscriptions. Log and track every billing transaction manually or audit aggregate historical spend.
            </p>
          </div>
          
          <div className="bg-sidebar border border-surface-border p-4.5 rounded-2xl text-center min-w-[160px] shadow-sm">
            <span className="text-[10px] text-text-dim font-bold uppercase tracking-wider block mb-1">Total Accumulated Spent</span>
            <span className="text-lg sm:text-xl font-extrabold text-emerald-500 dark:text-emerald-400 block font-display">
              {formatCurrency(totalSpent, baseCurrency)}
            </span>
            <span className="text-[9px] text-text-dim block mt-0.5">{payments.filter(p => p.status === 'completed').length} Cleared Invoices</span>
          </div>
        </div>
      </div>

      {/* Grid Layout: Add Form Modal/Section and Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* Left Column: Form to Log Payments */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="bg-surface border border-surface-border rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-border/50">
              <div className="flex items-center gap-2">
                <Plus className="w-4.5 h-4.5 text-accent" />
                <h3 className="text-sm font-extrabold text-white font-display">Record payment</h3>
              </div>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="text-xs font-bold text-accent hover:underline cursor-pointer"
              >
                {showAddForm ? 'Hide Form' : 'Show Form'}
              </button>
            </div>

            {showAddForm ? (
              <form onSubmit={handleAddPayment} className="space-y-4">
                
                {errorMsg && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-text-dim uppercase tracking-wider mb-1.5">
                    Select SaaS Subscription
                  </label>
                  <select
                    value={selectedSubId}
                    onChange={(e) => setSelectedSubId(e.target.value)}
                    className="w-full bg-sidebar border border-surface-border rounded-xl py-2 px-3 text-xs font-semibold text-white focus:outline-none focus:border-accent"
                    required
                  >
                    <option value="">-- Choose subscription --</option>
                    {subscriptions.map(sub => (
                      <option key={sub.id} value={sub.id} className="bg-surface">
                        {sub.name} ({formatCurrency(sub.price, sub.currency || 'USD')})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-text-dim uppercase tracking-wider mb-1.5">
                      Date Paid
                    </label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full bg-sidebar border border-surface-border rounded-xl py-2 px-3 text-xs font-semibold text-white focus:outline-none focus:border-accent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-text-dim uppercase tracking-wider mb-1.5">
                      Amount Paid
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      className="w-full bg-sidebar border border-surface-border rounded-xl py-2 px-3 text-xs font-semibold text-white focus:outline-none focus:border-accent"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-text-dim uppercase tracking-wider mb-1.5">
                      Payment Currency
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full bg-sidebar border border-surface-border rounded-xl py-2 px-3 text-xs font-semibold text-white focus:outline-none focus:border-accent"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="INR">INR (₹)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="JPY">JPY (¥)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-text-dim uppercase tracking-wider mb-1.5">
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-sidebar border border-surface-border rounded-xl py-2 px-3 text-xs font-semibold text-white focus:outline-none focus:border-accent"
                    >
                      <option value="Visa">Visa Credit Card</option>
                      <option value="MasterCard">MasterCard</option>
                      <option value="PayPal">PayPal Account</option>
                      <option value="Google Pay">Google Pay</option>
                      <option value="Apple Pay">Apple Pay</option>
                      <option value="Bank Transfer">Bank Wire Transfer</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-text-dim uppercase tracking-wider mb-1.5">
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e: any) => setStatus(e.target.value)}
                      className="w-full bg-sidebar border border-surface-border rounded-xl py-2 px-3 text-xs font-semibold text-white focus:outline-none focus:border-accent"
                    >
                      <option value="completed">Completed (Cleared)</option>
                      <option value="pending">Pending Auth</option>
                      <option value="failed">Failed/Declined</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-text-dim uppercase tracking-wider mb-1.5">
                      Reference Number
                    </label>
                    <input
                      type="text"
                      placeholder="TXN-90425"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      className="w-full bg-sidebar border border-surface-border rounded-xl py-2 px-3 text-xs font-semibold text-white focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-dim uppercase tracking-wider mb-1.5">
                    Internal Journal Notes
                  </label>
                  <textarea
                    placeholder="Invoice details, seat extensions, department splits..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-sidebar border border-surface-border rounded-xl py-2 px-3 text-xs font-semibold text-white focus:outline-none focus:border-accent resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-2.5 rounded-xl text-xs font-bold hover:opacity-90 transition-all cursor-pointer shadow-md"
                >
                  Log Transaction
                </button>

              </form>
            ) : (
              <p className="text-xs text-text-dim leading-relaxed">
                Record manual renewals or cleared SaaS debits. Selecting an active subscription automatically copies its billing metrics and native currency. Click <strong>Show Form</strong> above to write a transaction ledger card.
              </p>
            )}

          </div>

          <div className="bg-sidebar border border-surface-border rounded-2xl p-5 shadow-sm space-y-3">
            <span className="text-[10px] font-bold text-accent uppercase tracking-wider block">Local Audit Assurance</span>
            <p className="text-xs text-text-dim leading-relaxed font-medium">
              SubPilot does not link directly with external bank credentials for privacy. Keeping manual logs provides absolute data safety while granting granular control over corporate invoices.
            </p>
          </div>

        </div>

        {/* Right Column: Payments list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-surface border border-surface-border rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border/50">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-white font-display">Payment Transaction Ledger</h3>
                <p className="text-[10px] text-text-dim uppercase tracking-wider font-semibold">Audited billing history sorted by date</p>
              </div>
              <span className="text-xs text-text-dim font-bold">{payments.length} Transactions</span>
            </div>

            {loading ? (
              <div className="text-center py-10">
                <div className="w-6 h-6 border-2 border-accent border-t-transparent animate-spin rounded-full mx-auto mb-2" />
                <span className="text-xs text-text-dim font-semibold">Loading payment transactions...</span>
              </div>
            ) : payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-surface-border/40 text-text-dim font-bold uppercase tracking-wider text-[10px]">
                      <th className="pb-2.5">Date</th>
                      <th className="pb-2.5">Subscription</th>
                      <th className="pb-2.5">Amount Paid</th>
                      <th className="pb-2.5">Method</th>
                      <th className="pb-2.5">Status</th>
                      <th className="pb-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border/30 font-medium text-text-dim">
                    {payments.map((p) => {
                      let statusBadge = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                      if (p.status === 'failed') statusBadge = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
                      if (p.status === 'pending') statusBadge = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';

                      return (
                        <tr key={p.id} className="hover:bg-sidebar/30 transition-colors">
                          <td className="py-3.5 flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-text-dim" />
                            <span className="text-white font-semibold">{p.paymentDate}</span>
                          </td>
                          <td className="py-3.5">
                            <span className="text-white font-bold">{p.subscriptionName}</span>
                            {p.referenceNumber && (
                              <span className="block text-[9px] text-text-dim/80 font-mono">Ref: {p.referenceNumber}</span>
                            )}
                          </td>
                          <td className="py-3.5 font-bold text-white">
                            {formatCurrency(p.amountPaid, p.currency)}
                            {p.currency !== baseCurrency && (
                              <span className="block text-[9px] text-text-dim">
                                ~{formatCurrency(convertCurrency(p.amountPaid, p.currency, baseCurrency), baseCurrency)}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5">
                            <span className="flex items-center gap-1">
                              <CreditCard className="w-3 h-3 text-accent" />
                              {p.paymentMethod}
                            </span>
                          </td>
                          <td className="py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${statusBadge}`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3.5 text-right">
                            <button
                              onClick={() => setPaymentToDelete(p)}
                              className="text-rose-400 hover:text-rose-500 p-1 bg-rose-500/5 hover:bg-rose-500/15 rounded-lg border border-rose-500/10 hover:border-rose-500/30 transition-all cursor-pointer inline-block"
                              title="Delete Transaction Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-text-dim text-xs font-semibold space-y-2">
                <FileText className="w-8 h-8 text-indigo-400 mx-auto" />
                <p>No payment transactions logged in your ledger history.</p>
                <p className="text-[10px] font-medium text-text-dim/80">Use the record payment form to log past renewals.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Custom Payment Deletion Confirmation Modal */}
      <AnimatePresence>
        {paymentToDelete && (
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
                  Delete Payment Record
                </h3>
              </div>
              <p className="text-sm text-text-dim mb-6 leading-relaxed">
                Are you sure you want to delete this payment record of <strong className="text-text-main">{formatCurrency(paymentToDelete.amountPaid, paymentToDelete.currency)}</strong> for <strong className="text-text-main">{paymentToDelete.subscriptionName}</strong>? This action is permanent.
              </p>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setPaymentToDelete(null)}
                  className="px-4 py-2 border border-surface-border rounded-xl text-text-main/80 hover:bg-sidebar hover:text-text-main text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (paymentToDelete.id) {
                      await handleDeletePayment(paymentToDelete.id);
                    }
                    setPaymentToDelete(null);
                  }}
                  className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-[0_4px_12px_rgba(239,68,68,0.25)]"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
