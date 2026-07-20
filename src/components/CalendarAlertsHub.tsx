import React, { useState, useEffect } from 'react';
import { 
  Calendar, Bell, Clock, AlertTriangle, Shield, CheckCircle2, Sliders, Mail, 
  Monitor, ChevronLeft, ChevronRight, MessageSquare, Terminal, Eye, Play, ExternalLink
} from 'lucide-react';
import { Subscription } from '../types';
import { formatCurrency } from '../lib/currency';

interface CalendarAlertsHubProps {
  subscriptions: Subscription[];
  baseCurrency: string;
}

interface SubscriptionAlertConfig {
  subscriptionId: string;
  leadDays: number;
  emailEnabled: boolean;
  pushEnabled: boolean;
}

export const CalendarAlertsHub: React.FC<CalendarAlertsHubProps> = ({ subscriptions, baseCurrency }) => {
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
  const [globalEmail, setGlobalEmail] = useState(() => localStorage.getItem('subpilot_alert_email') || 'operations@subpilot.ai');
  const [globalLeadDays, setGlobalLeadDays] = useState(() => parseInt(localStorage.getItem('subpilot_global_lead_days') || '3'));
  const [testNotification, setTestNotification] = useState<{ active: boolean; message: string; subName: string } | null>(null);
  
  // Calendar Navigation
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);

  // Webhook Simulator state
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookPlatform, setWebhookPlatform] = useState<'slack' | 'discord'>('slack');
  const [simulatedPayload, setSimulatedPayload] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

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

  // Webhook Simulation Builder
  const handleSimulateWebhook = (sub: Subscription) => {
    setIsSimulating(true);
    setTimeout(() => {
      const daysLeft = getDaysRemaining(sub.nextRenewalDate);
      
      if (webhookPlatform === 'slack') {
        const payload = {
          text: `⚠️ SubPilot Renewal Warning: *${sub.name}* is renewing soon!`,
          blocks: [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: "🚀 SubPilot Spend Governance System",
                emoji: true
              }
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*Alert Level:* ${daysLeft <= 2 ? "🔴 High Urgency" : "🟡 Medium Urgency"}\n*Subscription:* ${sub.name}\n*Cost:* *${formatCurrency(sub.price, sub.currency || 'USD')}* (Normal cycle: ${sub.cycle})\n*Next Renewal:* \`${sub.nextRenewalDate}\` (${daysLeft <= 0 ? "TODAY" : `in ${daysLeft} days`})`
              }
            },
            {
              type: "context",
              elements: [
                {
                  type: "mrkdwn",
                  text: `👤 *Owner:* ${sub.owner || 'Operations team'} • 📂 *Category:* ${sub.category || 'Software'}`
                }
              ]
            }
          ]
        };
        setSimulatedPayload(payload);
      } else {
        // Discord Embed
        const payload = {
          username: "SubPilot Webhook Sentinel",
          avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
          content: `⚠️ **SubPilot Spend Advisory**: **${sub.name}** renewal is imminent!`,
          embeds: [
            {
              title: `Subscription Warning: ${sub.name}`,
              description: `A scheduled recurring license invoice will occur in ${daysLeft <= 0 ? "less than 24 hours" : `${daysLeft} days`}.`,
              color: daysLeft <= 2 ? 16711680 : 16753920, // Red vs Orange
              fields: [
                { name: "Projected Debit", value: `**${formatCurrency(sub.price, sub.currency || 'USD')}**`, inline: true },
                { name: "Billing Frequency", value: sub.cycle, inline: true },
                { name: "Renewal Target", value: sub.nextRenewalDate, inline: true },
                { name: "Workspace Allocation", value: sub.owner || 'General Pool', inline: true }
              ],
              footer: { text: "SubPilot AI Spend Guard • Operational Security Rule" }
            }
          ]
        };
        setSimulatedPayload(payload);
      }
      setIsSimulating(false);
    }, 450);
  };

  // Calendar helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  // Filter subscriptions that renew in the currently selected month/year
  const getSubscriptionsForDay = (day: number) => {
    return activeSubs.filter(sub => {
      if (!sub.nextRenewalDate) return false;
      const rDate = new Date(sub.nextRenewalDate);
      
      // Match if the subscription renews on this exact calendar date OR
      // if it is a monthly cycle and the day of month matches
      const isSameYearMonth = rDate.getFullYear() === year && rDate.getMonth() === month && rDate.getDate() === day;
      const isMonthlyMatchesDay = sub.cycle === 'monthly' && rDate.getDate() === day;
      
      return isSameYearMonth || isMonthlyMatchesDay;
    });
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Calendar cells compiling
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null); // blank padding cells
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn" id="renewal-calendar-reminders">
      
      {/* Test Notification Banner */}
      {testNotification && (
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 border-2 border-accent text-white p-4.5 rounded-2xl flex items-start gap-3.5 shadow-[0_4px_25px_rgba(139,92,246,0.35)] animate-bounce">
          <div className="p-2.5 bg-accent rounded-xl text-white">
            <Bell className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent">Simulated Alarm Dispatch Test</span>
            <p className="text-xs sm:text-sm font-semibold leading-relaxed">{testNotification.message}</p>
            <span className="text-[9px] text-text-dim block pt-0.5">Dispatched to: {globalEmail} • Local Socket Alert Completed</span>
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
      <div className="bg-gradient-to-br from-indigo-100/50 via-purple-50/30 to-surface dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-surface border border-indigo-500/10 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Calendar className="w-4 h-4 text-accent" />
              <span className="text-xs font-bold uppercase tracking-wider">Renewal Calendar & Alerts Hub</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-text-main font-display tracking-tight">
              Calendar & Reminders
            </h1>
            <p className="text-xs text-text-dim max-w-xl leading-relaxed">
              Track upcoming renewal dates, organize alerts, configure lead warning buffers, and test Slack or Discord webhook message delivery vectors.
            </p>
          </div>
          <div className="bg-sidebar border border-surface-border p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
            <Sliders className="w-5 h-5 text-accent" />
            <div>
              <span className="text-[10px] text-text-dim font-bold uppercase tracking-wider block">Total Monitored</span>
              <span className="text-sm font-extrabold text-text-main block">{activeSubs.length} Alarms Tracked</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Calendar Grid (Left) + Reminders & Webhook Config (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* Left Columns: Interactive Calendar */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-surface-border rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
            
            {/* Calendar Month Selector Row */}
            <div className="flex items-center justify-between pb-3 border-b border-surface-border/50">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-accent" />
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-white font-display">
                    {monthNames[month]} {year}
                  </h2>
                  <p className="text-[10px] text-text-dim uppercase tracking-wider font-semibold">Active spend renewal dates grid</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 bg-sidebar hover:bg-sidebar/80 border border-surface-border rounded-lg text-text-dim hover:text-white transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 bg-sidebar hover:bg-sidebar/80 border border-surface-border rounded-lg text-text-dim hover:text-white transition-all cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Calendar Grid Container */}
            <div className="space-y-4">
              {/* Day names headers */}
              <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold text-text-dim uppercase tracking-wider">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              {/* Monthly days grid */}
              <div className="grid grid-cols-7 gap-1.5 min-h-[280px]">
                {calendarCells.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="bg-sidebar/20 rounded-xl border border-surface-border/10 opacity-30 min-h-[56px]" />;
                  }

                  const daySubs = getSubscriptionsForDay(day);

                  return (
                    <div 
                      key={`day-${day}`} 
                      className={`bg-sidebar/40 rounded-xl border p-2 min-h-[64px] flex flex-col justify-between hover:border-accent/40 transition-all ${
                        daySubs.length > 0 ? 'border-accent/20 bg-accent/5' : 'border-surface-border/30'
                      }`}
                    >
                      <span className={`text-[11px] font-mono font-bold leading-none ${daySubs.length > 0 ? 'text-accent' : 'text-text-dim'}`}>
                        {day}
                      </span>

                      {/* Day subscriptions dot tags */}
                      <div className="space-y-1 mt-1.5">
                        {daySubs.map((sub) => {
                          const daysLeft = getDaysRemaining(sub.nextRenewalDate);
                          
                          // Payment Urgency Indicator color coding
                          let urgencyColor = 'bg-indigo-500';
                          if (daysLeft <= 1) {
                            urgencyColor = 'bg-rose-500 animate-pulse'; // Red for < 48 hours
                          } else if (daysLeft <= 7) {
                            urgencyColor = 'bg-amber-500'; // Orange for < 1 week
                          } else {
                            urgencyColor = 'bg-emerald-500'; // Green/Blue for others
                          }

                          return (
                            <button
                              key={sub.id}
                              onClick={() => setSelectedSubId(sub.id || null)}
                              className="w-full text-left truncate flex items-center gap-1 p-0.5 rounded text-[9px] font-bold text-white hover:bg-sidebar transition-all cursor-pointer"
                              title={`${sub.name} - ${formatCurrency(sub.price, sub.currency || 'USD')}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${urgencyColor}`} />
                              <span className="truncate">{sub.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Subscription Detail Panel */}
            {selectedSubId && (() => {
              const sub = activeSubs.find(s => s.id === selectedSubId);
              if (!sub) return null;
              const daysLeft = getDaysRemaining(sub.nextRenewalDate);

              let urgencyBg = 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400';
              let urgencyText = 'Renewal in Safe Window';
              if (daysLeft <= 1) {
                urgencyBg = 'bg-rose-500/10 border-rose-500/35 text-rose-400 animate-pulse';
                urgencyText = 'CRITICAL: RENEWS SOON (<48 hours)';
              } else if (daysLeft <= 7) {
                urgencyBg = 'bg-amber-500/10 border-amber-500/25 text-amber-400';
                urgencyText = 'URGENT NOTICE (<7 days)';
              }

              return (
                <div className="bg-sidebar rounded-xl border border-accent/25 p-4 animate-fadeIn space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-accent font-bold uppercase tracking-widest block">Selected Renewal Event</span>
                      <h4 className="text-xs sm:text-sm font-extrabold text-white">{sub.name}</h4>
                    </div>
                    <span className={`text-[8px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${urgencyBg}`}>
                      {urgencyText}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs leading-normal">
                    <div>
                      <span className="text-[9px] text-text-dim block font-semibold uppercase">Cost Projection</span>
                      <strong className="text-white font-mono">{formatCurrency(sub.price, sub.currency || 'USD')}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-text-dim block font-semibold uppercase">Billing Interval</span>
                      <strong className="text-white capitalize">{sub.cycle}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-text-dim block font-semibold uppercase">Renewal Date</span>
                      <strong className="text-white font-mono">{sub.nextRenewalDate}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-text-dim block font-semibold uppercase">Countdown Timer</span>
                      <strong className="text-white font-mono">{daysLeft <= 0 ? 'TODAY' : `${daysLeft} days`}</strong>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1 border-t border-surface-border/40 justify-between items-center">
                    <p className="text-[10px] text-text-dim">
                      Allocation: <strong className="text-white font-bold">{sub.owner || 'Operations Dept'}</strong>
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => triggerSimulatedAlert(sub)}
                        className="bg-accent/15 border border-accent/20 hover:bg-accent hover:text-white text-accent px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase transition-all cursor-pointer"
                      >
                        Simulate Alert
                      </button>
                      <button
                        onClick={() => handleSimulateWebhook(sub)}
                        className="bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white text-emerald-400 px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase transition-all cursor-pointer"
                      >
                        Simulate Webhook
                      </button>
                      <button
                        onClick={() => setSelectedSubId(null)}
                        className="text-[10px] text-text-dim hover:text-white font-semibold cursor-pointer"
                      >
                        Close Panel
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

          </div>
        </div>

        {/* Right Column: Alerts and Integration Webhook Simulator */}
        <div className="space-y-6 sm:space-y-8">
          
          {/* Dispatch Destination Card */}
          <div className="bg-surface border border-surface-border rounded-2xl p-5 shadow-md space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-surface-border/50">
              <Shield className="w-4.5 h-4.5 text-accent" />
              <h3 className="text-sm font-extrabold text-white font-display">Alarm Notifications</h3>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[9px] font-bold text-text-dim uppercase tracking-wider mb-1.5">
                  Corporate Notification Email
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
          </div>

          {/* Webhook Dispatch Simulator */}
          <div className="bg-surface border border-surface-border rounded-2xl p-5 shadow-md space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-surface-border/50">
              <Terminal className="w-4.5 h-4.5 text-accent" />
              <h3 className="text-sm font-extrabold text-white font-display">Webhook Integrator</h3>
            </div>

            <p className="text-xs text-text-dim leading-relaxed font-medium">
              Simulate dispatch notifications sending directly to corporate chats like Slack or Discord. Enter mock target below.
            </p>

            <div className="space-y-3 pt-1">
              {/* Selector */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setWebhookPlatform('slack'); setSimulatedPayload(null); }}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-bold uppercase border cursor-pointer text-center transition-all ${
                    webhookPlatform === 'slack' ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400' : 'bg-sidebar border-surface-border text-text-dim'
                  }`}
                >
                  Slack Channel
                </button>
                <button
                  type="button"
                  onClick={() => { setWebhookPlatform('discord'); setSimulatedPayload(null); }}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-bold uppercase border cursor-pointer text-center transition-all ${
                    webhookPlatform === 'discord' ? 'bg-purple-500/15 border-purple-500/30 text-purple-400' : 'bg-sidebar border-surface-border text-text-dim'
                  }`}
                >
                  Discord Server
                </button>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-text-dim uppercase tracking-wider mb-1.5">
                  Webhook Target URL
                </label>
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full bg-sidebar border border-surface-border rounded-xl py-2 px-3 text-[10px] font-mono text-white focus:outline-none focus:border-accent"
                />
              </div>

              {/* Run Simulation Trigger */}
              {activeSubs.length > 0 ? (
                <div className="space-y-2">
                  <span className="text-[9px] text-text-dim font-semibold block">Select template source:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeSubs.slice(0, 3).map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => handleSimulateWebhook(sub)}
                        disabled={isSimulating}
                        className="bg-sidebar border border-surface-border hover:border-accent hover:bg-sidebar/80 text-[10px] text-white px-2 py-1 rounded-lg transition-all font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Play className="w-2.5 h-2.5 text-accent shrink-0" />
                        <span>{sub.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <span className="text-[10px] text-text-dim block">Create subscriptions to unlock integration webhooks.</span>
              )}

              {/* Simulated Payload Code Panel */}
              {simulatedPayload && (
                <div className="space-y-2 animate-fadeIn pt-2 border-t border-surface-border/50">
                  <span className="text-[9px] font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Simulated Payload Dispatch
                  </span>
                  
                  <div className="bg-sidebar rounded-lg p-3 border border-surface-border/60 text-[9px] font-mono text-green-400 overflow-x-auto max-h-[140px] leading-relaxed">
                    <pre>{JSON.stringify(simulatedPayload, null, 2)}</pre>
                  </div>

                  <span className="text-[8px] text-text-dim block leading-relaxed">
                    ✅ Webhook compilation complete. In production, this JSON block is dispatched as an HTTP POST payload with Content-Type application/json.
                  </span>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
