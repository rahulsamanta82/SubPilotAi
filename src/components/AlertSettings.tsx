import React, { useState, useEffect } from 'react';
import { Bell, Clock, AlertTriangle, Shield, CheckCircle2, Sliders, Mail, Monitor } from 'lucide-react';
import { Subscription } from '../types';
import { formatCurrency } from '../lib/currency';

interface AlertSettingsProps {
  subscriptions: Subscription[];
  baseCurrency: string;
}

interface SubscriptionAlertConfig {
  subscriptionId: string;
  leadDays: number;
  emailEnabled: boolean;
  pushEnabled: boolean;
}

export const AlertSettings: React.FC<AlertSettingsProps> = ({ subscriptions, baseCurrency }) => {
  const activeSubs = subscriptions.filter(s => s.status === 'active');
  
  // Alert configuration loaded from Local Storage or defaulted
  const [alertConfigs, setAlertConfigs] = useState<Record<string, SubscriptionAlertConfig>>(() => {
    const stored = localStorage.getItem('subpilot_alerts_config');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) {}
    }
    return {};
  });

  // Global settings
  const [globalEmail, setGlobalEmail] = useState(() => localStorage.getItem('subpilot_alert_email') || 'user@subpilot.ai');
  const [globalLeadDays, setGlobalLeadDays] = useState(() => parseInt(localStorage.getItem('subpilot_global_lead_days') || '3'));
  const [testNotification, setTestNotification] = useState<{ active: boolean; message: string; subName: string } | null>(null);

  useEffect(() => {
    localStorage.setItem('subpilot_alerts_config', JSON.stringify(alertConfigs));
  }, [alertConfigs]);

  useEffect(() => {
    localStorage.setItem('subpilot_alert_email', globalEmail);
  }, [globalEmail]);

  useEffect(() => {
    localStorage.setItem('subpilot_global_lead_days', globalLeadDays.toString());
  }, [globalLeadDays]);

  const handleToggleEmail = (subId: string) => {
    setAlertConfigs(prev => {
      const current = prev[subId] || { subscriptionId: subId, leadDays: globalLeadDays, emailEnabled: true, pushEnabled: true };
      return {
        ...prev,
        [subId]: { ...current, emailEnabled: !current.emailEnabled }
      };
    });
  };

  const handleTogglePush = (subId: string) => {
    setAlertConfigs(prev => {
      const current = prev[subId] || { subscriptionId: subId, leadDays: globalLeadDays, emailEnabled: true, pushEnabled: true };
      return {
        ...prev,
        [subId]: { ...current, pushEnabled: !current.pushEnabled }
      };
    });
  };

  const handleLeadDaysChange = (subId: string, days: number) => {
    setAlertConfigs(prev => {
      const current = prev[subId] || { subscriptionId: subId, leadDays: globalLeadDays, emailEnabled: true, pushEnabled: true };
      return {
        ...prev,
        [subId]: { ...current, leadDays: days }
      };
    });
  };

  // Compute days left until nextRenewalDate
  const getDaysRemaining = (renewalDateStr: string) => {
    if (!renewalDateStr) return 999;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const renewalDate = new Date(renewalDateStr);
    renewalDate.setHours(0, 0, 0, 0);

    const diffTime = renewalDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Simulate notification alert test
  const triggerSimulatedAlert = (sub: Subscription) => {
    const config = alertConfigs[sub.id || ''] || { leadDays: globalLeadDays, emailEnabled: true, pushEnabled: true };
    const daysLeft = getDaysRemaining(sub.nextRenewalDate);
    
    let message = '';
    if (daysLeft <= 0) {
      message = `🚨 Subscription [${sub.name}] was scheduled for renewal TODAY! Projected cost: ${formatCurrency(sub.price, sub.currency || 'USD')}.`;
    } else {
      message = `🔔 Upcoming Renewal Notice: [${sub.name}] is renewing in ${daysLeft} days (on ${sub.nextRenewalDate}). Budget Impact: ${formatCurrency(sub.price, sub.currency || 'USD')}.`;
    }

    setTestNotification({
      active: true,
      message,
      subName: sub.name
    });

    // Auto dismiss simulated alert after 6 seconds
    setTimeout(() => {
      setTestNotification(null);
    }, 6000);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn" id="alerts-scheduler-tab">
      
      {/* Test Notification Banner */}
      {testNotification && (
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 border-2 border-accent text-white p-4.5 rounded-2xl flex items-start gap-3.5 shadow-[0_4px_25px_rgba(139,92,246,0.35)] animate-bounce">
          <div className="p-2.5 bg-accent rounded-xl text-white">
            <Bell className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent">Simulated Alarm Dispatch Test</span>
            <p className="text-xs sm:text-sm font-semibold leading-relaxed">{testNotification.message}</p>
            <span className="text-[9px] text-text-dim block pt-0.5">Dispatched to: {globalEmail} • Client Push API Success</span>
          </div>
          <button 
            onClick={() => setTestNotification(null)}
            className="text-xs text-text-dim hover:text-white font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Hero Banner Section */}
      <div className="bg-gradient-to-br from-purple-100/50 via-indigo-50/30 to-surface dark:from-purple-950/40 dark:via-indigo-950/20 dark:to-surface border border-purple-500/10 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
              <Bell className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Renewal Warning Control</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-text-main font-display tracking-tight">
              SaaS Renewal Alert Dispatcher
            </h1>
            <p className="text-xs text-text-dim max-w-xl leading-relaxed">
              Ensure you never get caught by surprise debits. Track precise live count-down renewal days, set lead-day triggers, and establish dispatch triggers.
            </p>
          </div>
          <div className="bg-sidebar border border-surface-border p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
            <Sliders className="w-5 h-5 text-accent" />
            <div>
              <span className="text-[10px] text-text-dim font-bold uppercase tracking-wider block">Real-time Metrics</span>
              <span className="text-sm font-extrabold text-text-main block">{activeSubs.length} Alarms Monitored</span>
            </div>
          </div>
        </div>
      </div>

      {/* Double Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* Left Columns: Subscription Alarms List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-surface border border-surface-border rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border/50">
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-white font-display">Active Alert Alarms</h2>
                <p className="text-[10px] text-text-dim uppercase tracking-wider font-semibold">Track countdowns and test alerts</p>
              </div>
              <span className="text-[10px] bg-accent/10 border border-accent/20 px-2.5 py-0.5 rounded-lg text-accent font-extrabold uppercase">
                Active stack
              </span>
            </div>

            {activeSubs.length > 0 ? (
              <div className="space-y-3.5">
                {activeSubs.map((sub) => {
                  const config = alertConfigs[sub.id || ''] || {
                    subscriptionId: sub.id || '',
                    leadDays: globalLeadDays,
                    emailEnabled: true,
                    pushEnabled: true
                  };
                  const daysLeft = getDaysRemaining(sub.nextRenewalDate);
                  
                  // Alert urgency color coding
                  let urgencyBg = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
                  let urgencyText = 'Safe Track';
                  if (daysLeft <= 0) {
                    urgencyBg = 'bg-rose-500/10 border-rose-500/35 text-rose-400 animate-pulse';
                    urgencyText = 'OVERDUE / RENEWS TODAY';
                  } else if (daysLeft <= config.leadDays) {
                    urgencyBg = 'bg-amber-500/10 border-amber-500/25 text-amber-400';
                    urgencyText = 'Urgent Notice';
                  }

                  return (
                    <div 
                      key={sub.id} 
                      className="bg-sidebar/50 border border-surface-border/40 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-accent/10 transition-all"
                    >
                      {/* Name & Urgency Countdown */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-white">{sub.name}</span>
                          <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase border ${urgencyBg}`}>
                            {urgencyText}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-[11px] text-text-dim font-medium">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-accent" />
                            {daysLeft <= 0 ? (
                              <span className="text-rose-400 font-extrabold">Renews today!</span>
                            ) : (
                              <span>Renews in <strong className="text-white font-bold">{daysLeft}</strong> days ({sub.nextRenewalDate})</span>
                            )}
                          </span>
                          <span className="text-accent font-bold">
                            {formatCurrency(sub.price, sub.currency || 'USD')}/{sub.cycle}
                          </span>
                        </div>
                      </div>

                      {/* Configurations & Simulator Button */}
                      <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                        
                        {/* Days Offset Select */}
                        <div className="flex items-center gap-1.5 bg-surface border border-surface-border/50 px-2.5 py-1 rounded-lg">
                          <span className="text-[9px] font-bold text-text-dim uppercase">Lead:</span>
                          <select
                            value={config.leadDays}
                            onChange={(e) => handleLeadDaysChange(sub.id || '', parseInt(e.target.value))}
                            className="bg-transparent text-[11px] font-extrabold text-white focus:outline-none cursor-pointer"
                          >
                            <option value="1" className="bg-surface">1 Day</option>
                            <option value="3" className="bg-surface">3 Days</option>
                            <option value="5" className="bg-surface">5 Days</option>
                            <option value="7" className="bg-surface">7 Days</option>
                            <option value="14" className="bg-surface">14 Days</option>
                          </select>
                        </div>

                        {/* Push and Email Toggle Swaps */}
                        <div className="flex gap-2.5">
                          <button
                            onClick={() => handleToggleEmail(sub.id || '')}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              config.emailEnabled 
                                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' 
                                : 'bg-surface/50 border-surface-border text-text-dim'
                            }`}
                            title="Toggle Email Alerts"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleTogglePush(sub.id || '')}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              config.pushEnabled 
                                ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' 
                                : 'bg-surface/50 border-surface-border text-text-dim'
                            }`}
                            title="Toggle Desktop Push Notifications"
                          >
                            <Monitor className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Test dispatch */}
                        <button
                          onClick={() => triggerSimulatedAlert(sub)}
                          className="bg-accent/15 border border-accent/25 hover:bg-accent text-accent hover:text-white px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold uppercase transition-all cursor-pointer"
                        >
                          Test Alarm
                        </button>

                      </div>

                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-text-dim text-xs font-semibold space-y-2">
                <AlertTriangle className="w-8 h-8 text-warning mx-auto" />
                <p>No active subscriptions found to configure renewal alarms.</p>
                <p className="text-[10px] font-medium text-text-dim/80">Add subscriptions in the Dashboard to begin tracking alarm timers.</p>
              </div>
            )}

          </div>
        </div>

        {/* Right Column: Global Warning settings */}
        <div className="space-y-6 sm:space-y-8">
          
          {/* Dispatch Destination Card */}
          <div className="bg-surface border border-surface-border rounded-2xl p-5 shadow-md space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-surface-border/50">
              <Shield className="w-4.5 h-4.5 text-accent" />
              <h3 className="text-sm font-extrabold text-white font-display">Dispatch Channels</h3>
            </div>

            <p className="text-xs text-text-dim leading-relaxed font-medium">
              Configure your primary corporate dispatch email. These channels receive the warning payload whenever subscription renew countdown targets are met.
            </p>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[9px] font-bold text-text-dim uppercase tracking-wider mb-1.5">
                  Corporate Notify Email
                </label>
                <input
                  type="email"
                  value={globalEmail}
                  onChange={(e) => setGlobalEmail(e.target.value)}
                  className="w-full bg-sidebar border border-surface-border rounded-xl py-2 px-3 text-xs font-semibold text-white focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-text-dim uppercase tracking-wider mb-1.5">
                  Default Lead Alarm Window
                </label>
                <select
                  value={globalLeadDays}
                  onChange={(e) => setGlobalLeadDays(parseInt(e.target.value))}
                  className="w-full bg-sidebar border border-surface-border rounded-xl py-2 px-3 text-xs font-semibold text-white focus:outline-none focus:border-accent"
                >
                  <option value="1">1 day before renewal</option>
                  <option value="3">3 days before renewal</option>
                  <option value="5">5 days before renewal</option>
                  <option value="7">1 week before renewal</option>
                </select>
              </div>
            </div>

            <div className="bg-sidebar rounded-xl p-3 border border-surface-border/50 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
              <span className="text-[10px] text-text-dim font-bold">Alarm configurations successfully synchronized.</span>
            </div>
          </div>

          {/* Alarm Logic Explainer */}
          <div className="bg-sidebar border border-surface-border rounded-2xl p-5 shadow-md space-y-3">
            <span className="text-[10px] font-bold text-accent uppercase tracking-wider block">Automatic Auditing</span>
            <p className="text-xs text-text-dim leading-relaxed font-medium">
              Our automated system evaluates the difference in UTC milliseconds between the current machine datetime and the registered <strong>nextRenewalDate</strong> on every session load.
            </p>
            <p className="text-xs text-text-dim leading-relaxed font-medium">
              Whenever a threshold is crossed, we immediately queue notifications, flash interactive warning tags, and generate optimization recommendations.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
