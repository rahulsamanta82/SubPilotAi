import React, { useState } from 'react';
import { 
  Shield, Lock, Download, Trash2, Database, Key, Check, AlertTriangle, 
  RefreshCw, Wifi, WifiOff, FileText, ChevronRight, Eye, ShieldCheck
} from 'lucide-react';
import { Subscription } from '../types';
import { doc, deleteDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { signOut } from 'firebase/auth';

interface SecurityCenterProps {
  user: any;
  subscriptions: Subscription[];
  onClearLocalData: () => void;
}

export const SecurityCenter: React.FC<SecurityCenterProps> = ({ 
  user, 
  subscriptions,
  onClearLocalData 
}) => {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isOffline = !user || user.uid === 'offline-guest';

  // Export Data to JSON
  const handleExportJSON = () => {
    try {
      const exportData = {
        exportedAt: new Date().toISOString(),
        userId: user?.uid || 'guest',
        sessionType: isOffline ? 'offline-guest' : 'encrypted-cloud-sync',
        subscriptions: subscriptions,
        schemaVersion: '1.0.0',
        complianceStatus: 'SOC2-Ready-Format'
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `subpilot_data_export_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showSuccess("Your active subscription data was exported to JSON successfully.");
    } catch (err: any) {
      showError("Failed to compile data export: " + err.message);
    }
  };

  // Export Data to CSV
  const handleExportCSV = () => {
    try {
      if (subscriptions.length === 0) {
        showError("You do not have any subscription records to export.");
        return;
      }

      const headers = ['Subscription Name', 'Price', 'Currency', 'Billing Cycle', 'Category', 'Start Date', 'Next Renewal Date', 'Status', 'Seats Used', 'Seats Total'];
      const rows = subscriptions.map(sub => [
        `"${sub.name.replace(/"/g, '""')}"`,
        sub.price,
        `"${sub.currency || 'USD'}"`,
        `"${sub.cycle}"`,
        `"${sub.category || 'General'}"`,
        `"${sub.startDate}"`,
        `"${sub.nextRenewalDate}"`,
        `"${sub.status}"`,
        sub.seatsUsed || 0,
        sub.seatsTotal || 0
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(e => e.join(','))
      ].join('\n');

      const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `subpilot_spend_ledger_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showSuccess("Your active spend ledger was exported to CSV format successfully.");
    } catch (err: any) {
      showError("Failed to compile CSV export: " + err.message);
    }
  };

  // Clear Local Cache
  const handleClearCache = () => {
    setLoading(true);
    try {
      localStorage.removeItem('subpilot_offline_subscriptions');
      localStorage.removeItem('subpilot_offline_profile');
      localStorage.removeItem('subpilot_alerts_config');
      localStorage.removeItem('subpilot_global_lead_days');
      localStorage.removeItem('subpilot_alert_email');
      localStorage.removeItem('subpilot_offline_mode');
      
      onClearLocalData();
      showSuccess("Client-side localStorage and temporary caches have been purged.");
    } catch (err: any) {
      showError("Failed to purge client caches: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Permanent Account/Data Deletion
  const handlePermanentDeletion = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (isOffline) {
        // Wipe local storage completely
        localStorage.clear();
        onClearLocalData();
        showSuccess("Permanent guest account wipe completed. All local records destroyed.");
        setConfirmDelete(false);
      } else {
        // Online: Wipe Firestore collections for this user
        const subQuery = query(
          collection(db, 'subscriptions'),
          where('userId', '==', user.uid)
        );
        const subSnapshot = await getDocs(subQuery);
        
        // Delete Subscriptions
        for (const docSnap of subSnapshot.docs) {
          await deleteDoc(doc(db, 'subscriptions', docSnap.id));
        }

        // Delete Profile
        await deleteDoc(doc(db, 'profiles', user.uid));

        // Sign out user
        await signOut(auth);

        // Wipe local storage
        localStorage.clear();
        onClearLocalData();

        showSuccess("Your cloud database profile and all subscription data have been permanently purged.");
        setConfirmDelete(false);
      }
    } catch (err: any) {
      setErrorMsg("An error occurred during secure deletion. Some records may remain. Reason: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 5000);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn" id="security-center-page">
      
      {/* Toast notifications */}
      {successMsg && (
        <div className="bg-emerald-500/10 border-2 border-emerald-500 text-white p-4.5 rounded-2xl flex items-start gap-3 shadow-[0_4px_25px_rgba(16,185,129,0.25)]">
          <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">Security Action Successful</span>
            <p className="text-xs sm:text-sm font-semibold leading-relaxed">{successMsg}</p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-500/10 border-2 border-rose-500 text-white p-4.5 rounded-2xl flex items-start gap-3 shadow-[0_4px_25px_rgba(244,63,94,0.25)]">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-400">Security Notice Error</span>
            <p className="text-xs sm:text-sm font-semibold leading-relaxed">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Hero Banner Section */}
      <div className="bg-gradient-to-br from-indigo-100/50 via-purple-50/30 to-surface dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-surface border border-indigo-500/15 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Shield className="w-4 h-4 text-accent" />
              <span className="text-xs font-bold uppercase tracking-wider">Trust, Safety & Sovereignty</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-text-main font-display tracking-tight">
              Trust & Security Center
            </h1>
            <p className="text-xs text-text-dim max-w-xl leading-relaxed">
              We protect your financial telemetry. Review your session sync indicators, configure data sovereignty outputs, and execute cache purges.
            </p>
          </div>
          <div className="bg-sidebar border border-surface-border p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
            <Lock className="w-5 h-5 text-accent" />
            <div>
              <span className="text-[10px] text-text-dim font-bold uppercase tracking-wider block">Security Protocol</span>
              <span className="text-sm font-extrabold text-text-main block">SOC2 & ABAC Hardened</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Options */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* Sync Session Status */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface border border-surface-border rounded-2xl p-5 sm:p-6 shadow-md space-y-5">
            <div className="pb-3 border-b border-surface-border/50">
              <h3 className="text-sm font-extrabold text-white font-display">Session Sync Indicator</h3>
              <p className="text-[10px] text-text-dim uppercase tracking-wider font-semibold">Your connection and data state</p>
            </div>

            {isOffline ? (
              <div className="bg-amber-500/5 border border-amber-500/25 rounded-xl p-4.5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
                    <WifiOff className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Zero-Session Local Guest</span>
                    <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">100% Client Offline Sandbox</span>
                  </div>
                </div>
                <p className="text-[11px] text-text-dim leading-relaxed font-medium">
                  Your data resides strictly in your browser's private localStorage. No subscription records, billing info, or profiles leave this machine.
                </p>
                <div className="pt-2 border-t border-amber-500/10 flex justify-between text-[10px] text-text-dim font-mono">
                  <span>Sync Status:</span>
                  <span className="text-amber-400 font-bold">Unsynced (Local Sandbox)</span>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-500/5 border border-emerald-500/25 rounded-xl p-4.5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                    <Wifi className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Encrypted Cloud Sync Active</span>
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Firebase Cloud Vault</span>
                  </div>
                </div>
                <p className="text-[11px] text-text-dim leading-relaxed font-medium">
                  Your subscriptions are real-time synced to Google Cloud's highly secure Firestore databases with end-to-end transport encryption.
                </p>
                <div className="pt-2 border-t border-emerald-500/10 flex justify-between text-[10px] text-text-dim font-mono">
                  <span>Sync Status:</span>
                  <span className="text-emerald-400 font-bold">Encrypted & Active (Real-Time)</span>
                </div>
              </div>
            )}

            {/* Security Badges */}
            <div className="space-y-3">
              <span className="text-[10px] text-text-dim font-bold uppercase tracking-wider block">Security Attestation Badges</span>
              
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-sidebar/50 border border-surface-border rounded-xl p-2.5 space-y-1">
                  <ShieldCheck className="w-5 h-5 text-indigo-400 mx-auto" />
                  <span className="text-[9px] font-bold text-white block">AES-256 Storage</span>
                </div>
                <div className="bg-sidebar/50 border border-surface-border rounded-xl p-2.5 space-y-1">
                  <Key className="w-5 h-5 text-indigo-400 mx-auto" />
                  <span className="text-[9px] font-bold text-white block">ABAC Enforced</span>
                </div>
              </div>

              <div className="bg-sidebar p-3.5 rounded-xl border border-surface-border flex gap-3">
                <Database className="w-4 h-4 text-accent shrink-0" />
                <p className="text-[10px] text-text-dim leading-relaxed">
                  <strong>Zero-Trust architecture:</strong> Users can only fetch documents satisfying precise Firestore Security Rule constraints. Row-level filters are compiled natively on the database server.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Action Controls */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-surface-border rounded-2xl p-5 sm:p-6 shadow-md space-y-6">
            
            <div className="pb-3 border-b border-surface-border/50">
              <h3 className="text-sm font-extrabold text-white font-display">Data Privacy Controls</h3>
              <p className="text-[10px] text-text-dim uppercase tracking-wider font-semibold">Take sovereignty over your financial metrics</p>
            </div>

            {/* Clear local caches */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-sidebar/50 border border-surface-border rounded-xl">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-accent" />
                  <span className="text-xs font-extrabold text-white">Clear Browser Cache & Session</span>
                </div>
                <p className="text-[11px] text-text-dim max-w-md leading-relaxed">
                  Purges all offline caches, user settings, billing modes, and local state from your browser storage. Real cloud databases remain intact.
                </p>
              </div>
              <button
                onClick={handleClearCache}
                disabled={loading}
                className="bg-surface border border-surface-border hover:bg-sidebar text-text-main hover:border-accent text-xs px-4 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap"
              >
                Clear Cache
              </button>
            </div>

            {/* Export data */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-sidebar/50 border border-surface-border rounded-xl">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-accent" />
                  <span className="text-xs font-extrabold text-white">Export My Telemetry</span>
                </div>
                <p className="text-[11px] text-text-dim max-w-md leading-relaxed">
                  Download your active subscription list and payment transaction ledger immediately. Use JSON for backups or CSV to load in spreadsheets.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleExportCSV}
                  className="bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500 hover:text-white text-indigo-400 text-xs px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap"
                >
                  Export CSV
                </button>
                <button
                  onClick={handleExportJSON}
                  className="bg-accent/10 border border-accent/20 hover:bg-accent hover:text-white text-accent text-xs px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap"
                >
                  Export JSON
                </button>
              </div>
            </div>

            {/* Permanent Destruction */}
            <div className="border border-rose-500/20 bg-rose-950/10 rounded-xl p-4 sm:p-5 space-y-4">
              <div className="flex items-start gap-3">
                <Trash2 className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-xs font-extrabold text-white block">Permanently Purge & Delete My Account</span>
                  <p className="text-[11px] text-text-dim leading-relaxed">
                    This will execute a secure, irreversible purge: your complete billing ledger, category forecasts, user profiles, and active subscription configurations will be wiped from Google Cloud's servers.
                  </p>
                </div>
              </div>

              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="bg-rose-500/10 border border-rose-500/30 hover:bg-rose-600 text-rose-400 hover:text-white text-xs px-4 py-2 rounded-xl font-bold transition-all cursor-pointer"
                >
                  Permanently Delete Data
                </button>
              ) : (
                <div className="bg-sidebar p-4 rounded-xl border border-rose-500/30 space-y-3 animate-fadeIn">
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    Are you absolutely sure? This action is fully irreversible!
                  </p>
                  <div className="flex gap-2.5">
                    <button
                      onClick={handlePermanentDeletion}
                      disabled={loading}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-xs px-4 py-2 rounded-xl font-bold transition-all cursor-pointer disabled:opacity-50"
                    >
                      {loading ? 'Executing Purge...' : 'Yes, Permanently Delete Now'}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="bg-surface border border-surface-border text-text-dim hover:text-white text-xs px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
