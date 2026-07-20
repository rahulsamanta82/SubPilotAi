import React, { useState, useEffect, useRef } from 'react';
import { Subscription } from '../types';
import { AlertTriangle, Calendar, X, Eye, ExternalLink, BellRing, Sparkles, Mail, Laptop, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency } from '../lib/currency';

interface RenewalToastContainerProps {
  subscriptions: Subscription[];
  baseCurrency?: string;
}

interface ToastAlert {
  id: string;
  subscriptionId?: string;
  name: string;
  price: number;
  currency: string;
  cycle: string;
  daysRemaining: number;
  nextRenewalDate: string;
  url?: string | null;
  isDemo?: boolean;
}

// Utility to calculate local days remaining
const getDaysRemaining = (nextRenewalDateStr: string): number => {
  if (!nextRenewalDateStr) return 999;
  const [year, month, day] = nextRenewalDateStr.split('-').map(Number);
  const renewalDate = new Date(year, month - 1, day);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = renewalDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const RenewalToastContainer: React.FC<RenewalToastContainerProps> = ({ 
  subscriptions, 
  baseCurrency = 'USD' 
}) => {
  const [alerts, setAlerts] = useState<ToastAlert[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Notification Preferences State (Persisted in LocalStorage)
  const [browserPushEnabled, setBrowserPushEnabled] = useState<boolean>(() => {
    return localStorage.getItem('subpilot_notify_push') === 'true';
  });
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('subpilot_notify_email') === 'true';
  });
  const [userEmailAddress, setUserEmailAddress] = useState<string>(() => {
    return localStorage.getItem('subpilot_notify_email_address') || '';
  });
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  // Track the permission status on load
  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  // Sync preference states to localStorage
  useEffect(() => {
    localStorage.setItem('subpilot_notify_push', String(browserPushEnabled));
  }, [browserPushEnabled]);

  useEffect(() => {
    localStorage.setItem('subpilot_notify_email', String(emailAlertsEnabled));
  }, [emailAlertsEnabled]);

  // Request browser Notification permissions
  const handleToggleBrowserPush = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop push notifications.');
      return;
    }

    if (browserPushEnabled) {
      setBrowserPushEnabled(false);
      return;
    }

    const permission = await Notification.requestPermission();
    setPermissionStatus(permission);
    
    if (permission === 'granted') {
      setBrowserPushEnabled(true);
      // Trigger a beautiful greeting push
      new Notification('SubPilot Renewal Alerts Active', {
        body: 'You will receive real browser-based alerts for upcoming renewals!',
        tag: 'subpilot-welcome',
      });
    } else {
      setBrowserPushEnabled(false);
      alert('Notification permission was denied. Please adjust your browser settings to allow renewal notifications.');
    }
  };

  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('subpilot_notify_email_address', userEmailAddress);
    setIsEditingEmail(false);
  };

  // Dispatch a browser push notification if active and granted
  const dispatchNativeNotification = (alertItem: ToastAlert) => {
    if (browserPushEnabled && 'Notification' in window && Notification.permission === 'granted') {
      const daysText = alertItem.daysRemaining === 0 
        ? 'TODAY' 
        : alertItem.daysRemaining === 1 
          ? 'TOMORROW' 
          : `in ${alertItem.daysRemaining} days`;

      new Notification(`SubPilot SaaS Renewal: ${alertItem.name}`, {
        body: `Upcoming payment ${daysText} (${alertItem.nextRenewalDate}). Cost: ${formatCurrency(alertItem.price, alertItem.currency)}`,
        requireInteraction: true,
      });
    }
  };

  // Automatically monitor real upcoming renewals (within 7 days)
  useEffect(() => {
    const activeUpcoming = subscriptions.filter(sub => {
      if (sub.status !== 'active' && sub.status !== 'trialing') return false;
      const days = getDaysRemaining(sub.nextRenewalDate);
      // Trigger alerts if renewal is in the next 7 days
      return days >= 0 && days <= 7;
    });

    const newAlerts = activeUpcoming
      .filter(sub => sub.id && !dismissedIds.has(sub.id))
      .map(sub => {
        const item: ToastAlert = {
          id: sub.id!,
          subscriptionId: sub.id,
          name: sub.name,
          price: sub.price,
          currency: sub.currency || 'USD',
          cycle: sub.cycle,
          daysRemaining: getDaysRemaining(sub.nextRenewalDate),
          nextRenewalDate: sub.nextRenewalDate,
          url: sub.url,
          isDemo: false,
        };
        return item;
      });

    // Check if we have newly entered alerts to trigger native pushes
    newAlerts.forEach(alertItem => {
      // Avoid spamming; check if this is not already in alerts
      const isAlreadyAlerting = alerts.some(a => a.id === alertItem.id);
      if (!isAlreadyAlerting) {
        dispatchNativeNotification(alertItem);
      }
    });

    setAlerts(prev => {
      const demoAlerts = prev.filter(a => a.isDemo);
      const existingRealIds = new Set(newAlerts.map(a => a.id));
      const filteredDemo = demoAlerts.filter(a => !existingRealIds.has(a.id));
      return [...filteredDemo, ...newAlerts];
    });
  }, [subscriptions, dismissedIds, browserPushEnabled]);

  const handleClose = (id: string, subId?: string) => {
    if (subId) {
      setDismissedIds(prev => {
        const next = new Set(prev);
        next.add(subId);
        return next;
      });
    }
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const handleLocate = (subId?: string) => {
    if (!subId) return;
    const element = document.getElementById(`sub-row-${subId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('bg-accent/25', 'border-y', 'border-accent/50');
      setTimeout(() => {
        element.classList.remove('bg-accent/25', 'border-y', 'border-accent/50');
      }, 2500);
    }
  };

  // Trigger a demo warning toast manually (with HTML5 Desktop option if active)
  const triggerDemoAlert = () => {
    const demoId = `demo-${Date.now()}`;
    const demoItems = [
      { name: 'Github Enterprise Workspace', price: 21.00, currency: 'USD', cycle: 'monthly', daysRemaining: 3, nextRenewalDate: '2026-07-19', url: 'https://github.com' },
      { name: 'Slack Premium Team Seat', price: 12.50, currency: 'USD', cycle: 'monthly', daysRemaining: 1, nextRenewalDate: '2026-07-17', url: 'https://slack.com' },
      { name: 'Adobe Creative License', price: 49.99, currency: 'EUR', cycle: 'monthly', daysRemaining: 0, nextRenewalDate: '2026-07-16', url: 'https://adobe.com' }
    ];
    const picked = demoItems[Math.floor(Math.random() * demoItems.length)];
    
    const demoAlert: ToastAlert = {
      id: demoId,
      name: `${picked.name} (Simulated)`,
      price: picked.price,
      currency: picked.currency,
      cycle: picked.cycle,
      daysRemaining: picked.daysRemaining,
      nextRenewalDate: picked.nextRenewalDate,
      url: picked.url,
      isDemo: true,
    };

    setAlerts(prev => [demoAlert, ...prev]);
    dispatchNativeNotification(demoAlert);
  };

  return (
    <div className="space-y-4" id="renewal-alerts-integration">
      {/* Notifications Configuration Card */}
      <div className="bg-surface border border-surface-border rounded-2xl p-6 shadow-xl hover:border-accent/30 transition-all duration-300">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-surface-border pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-accent/10 rounded-xl text-accent">
              <BellRing className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-sm font-display leading-tight">Renewal Alerts Engine</h3>
              <p className="text-[10px] text-text-dim uppercase tracking-wider font-semibold">Governance and automatic notifications</p>
            </div>
          </div>

          <button
            onClick={triggerDemoAlert}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sidebar hover:bg-surface border border-surface-border hover:border-accent/40 text-text-dim hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm ml-auto md:ml-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            Trigger Test Alert
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Browser Desktop Push Notification Toggle */}
          <div className="flex items-start gap-3 p-3.5 bg-sidebar/50 rounded-xl border border-surface-border/50">
            <div className={`p-2 rounded-lg shrink-0 ${browserPushEnabled ? 'bg-success/10 text-success' : 'bg-white/5 text-text-dim'}`}>
              <Laptop className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white block">Desktop Browser Push</span>
                
                {/* Custom toggle slider */}
                <button
                  id="toggle-browser-push"
                  onClick={handleToggleBrowserPush}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    browserPushEnabled ? 'bg-accent' : 'bg-surface-border'
                  }`}
                  aria-label="Toggle Browser notifications"
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      browserPushEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <p className="text-[10px] text-text-dim leading-relaxed mt-1">
                Receive real HTML5 browser desktop banner notifications when any billing cycles approach renewal.
              </p>
              {browserPushEnabled && (
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="w-1.5 h-1.5 bg-success rounded-full animate-ping" />
                  <span className="text-[9px] text-success font-bold uppercase tracking-wider">
                    Permissions: {permissionStatus}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Email Subscription Notifications Toggle */}
          <div className="flex items-start gap-3 p-3.5 bg-sidebar/50 rounded-xl border border-surface-border/50">
            <div className={`p-2 rounded-lg shrink-0 ${emailAlertsEnabled ? 'bg-accent/10 text-accent' : 'bg-white/5 text-text-dim'}`}>
              <Mail className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white block">Daily Email Summaries</span>
                
                {/* Custom toggle slider */}
                <button
                  id="toggle-email-alerts"
                  onClick={() => setEmailAlertsEnabled(!emailAlertsEnabled)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    emailAlertsEnabled ? 'bg-accent' : 'bg-surface-border'
                  }`}
                  aria-label="Toggle Email alerts"
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      emailAlertsEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              
              {emailAlertsEnabled ? (
                <div className="mt-2">
                  {isEditingEmail || !userEmailAddress ? (
                    <form onSubmit={handleSaveEmail} className="flex gap-1.5">
                      <input
                        type="email"
                        placeholder="your@email.com"
                        value={userEmailAddress}
                        onChange={(e) => setUserEmailAddress(e.target.value)}
                        required
                        className="flex-1 bg-surface border border-surface-border rounded-lg px-2.5 py-1 text-[11px] text-white focus:outline-none focus:border-accent font-mono"
                      />
                      <button
                        type="submit"
                        className="px-2.5 py-1 bg-accent hover:bg-accent/80 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                      >
                        Save
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between bg-surface/50 border border-surface-border/50 rounded-lg px-2.5 py-1 text-[11px]">
                      <span className="text-text-main font-mono truncate max-w-[140px]">{userEmailAddress}</span>
                      <button
                        type="button"
                        onClick={() => setIsEditingEmail(true)}
                        className="text-[9px] text-accent font-bold hover:underline"
                      >
                        Change
                      </button>
                    </div>
                  )}
                  <p className="text-[9px] text-accent/80 font-semibold uppercase tracking-wider mt-1 flex items-center gap-1">
                    <span className="w-1 h-1 bg-accent rounded-full" /> Registered for renewal Digests
                  </p>
                </div>
              ) : (
                <p className="text-[10px] text-text-dim leading-relaxed mt-1">
                  Opt-in to get premium digest reports and peak billing expense alerts pushed to your inbox.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Toast Area */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3.5 w-full max-w-[380px] pointer-events-none">
        <AnimatePresence>
          {alerts.map((alert) => (
            <ToastItem
              key={alert.id}
              alert={alert}
              baseCurrency={baseCurrency}
              onClose={() => handleClose(alert.id, alert.subscriptionId)}
              onLocate={() => handleLocate(alert.subscriptionId)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

interface ToastItemProps {
  alert: ToastAlert;
  baseCurrency: string;
  onClose: () => void;
  onLocate: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ alert, baseCurrency, onClose, onLocate }) => {
  const [timeLeft, setTimeLeft] = useState(8000); // 8 seconds auto-dismiss
  const isHovered = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeLeft <= 0) {
      onClose();
    }
  }, [timeLeft, onClose]);

  useEffect(() => {
    const interval = 100;
    timerRef.current = setInterval(() => {
      if (!isHovered.current) {
        setTimeLeft(prev => {
          if (prev <= interval) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - interval;
        });
      }
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const daysLabel = alert.daysRemaining === 0 
    ? 'Today' 
    : alert.daysRemaining === 1 
      ? 'Tomorrow' 
      : `${alert.daysRemaining} days`;

  const isCritical = alert.daysRemaining <= 2;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, transition: { duration: 0.25 } }}
      onMouseEnter={() => { isHovered.current = true; }}
      onMouseLeave={() => { isHovered.current = false; }}
      className="pointer-events-auto relative overflow-hidden bg-surface border border-surface-border p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.65)] flex items-start gap-3.5 transition-all group hover:border-white/10"
    >
      {/* Left indicator accent strip */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isCritical ? 'bg-rose-500' : 'bg-warning'}`} />

      {/* Dynamic icon container */}
      <div className={`p-2 rounded-lg shrink-0 ${isCritical ? 'bg-rose-500/10 text-rose-400' : 'bg-warning/10 text-warning'}`}>
        {isCritical ? <AlertTriangle className="w-4 h-4 animate-bounce" /> : <Calendar className="w-4 h-4" />}
      </div>

      {/* Information details */}
      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="font-semibold text-white text-xs truncate font-display">{alert.name}</span>
          {alert.isDemo && (
            <span className="text-[9px] bg-accent/20 text-accent font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">Test</span>
          )}
        </div>
        <p className="text-[11px] text-text-dim leading-relaxed">
          SaaS renewal coming up <strong className={isCritical ? 'text-rose-400 font-bold' : 'text-warning font-bold'}>{daysLabel}</strong> on {alert.nextRenewalDate}.
        </p>
        <p className="text-[10px] text-white/50 font-mono mt-1">
          Cost: {formatCurrency(alert.price, alert.currency)} / {alert.cycle.replace('ly', '')}
        </p>

        {/* Action Panel */}
        <div className="flex items-center gap-2.5 mt-2.5">
          {!alert.isDemo && alert.subscriptionId && (
            <button
              onClick={onLocate}
              className="flex items-center gap-1 px-2 py-1 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
            >
              <Eye className="w-3 h-3 text-accent" />
              Locate
            </button>
          )}
          {alert.url && (
            <a
              href={alert.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-2 py-1 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg text-[10px] font-bold transition-all"
            >
              <ExternalLink className="w-3 h-3" />
              Portal
            </a>
          )}
        </div>
      </div>

      {/* Dismiss button */}
      <button
        onClick={onClose}
        className="text-text-dim hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors shrink-0 cursor-pointer"
        title="Dismiss alert"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Smoothly animated progress bar indicator for auto-dismiss */}
      <div 
        className="absolute bottom-0 left-0 h-[3px] bg-accent/40 transition-all duration-100" 
        style={{ width: `${(timeLeft / 8000) * 100}%` }}
      />
    </motion.div>
  );
};
