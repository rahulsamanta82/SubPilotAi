import { useState, useEffect } from 'react';
import { 
  auth, db, handleFirestoreError, OperationType
} from './lib/firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { 
  collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc, getDocs, writeBatch 
} from 'firebase/firestore';
import { Subscription, Recommendation } from './types';
import { UserProfile } from './components/UserProfile';
import { AuthScreen } from './components/AuthScreen';
import { MetricCard } from './components/MetricCard';
import { SubscriptionList } from './components/SubscriptionList';
import { RenewalToastContainer } from './components/RenewalToastContainer';
import { CategoryPieChart } from './components/CategoryPieChart';
import { ScanDetect } from './components/ScanDetect';
import { ForecastChart } from './components/ForecastChart';
import { AiInsights } from './components/AiInsights';
import { AnnualSavingsCalculator } from './components/AnnualSavingsCalculator';
import { TeamManagement } from './components/TeamManagement';
import { CopilotChatbot } from './components/CopilotChatbot';
import { HelpCenter } from './components/HelpCenter';
import { AlertSettings } from './components/AlertSettings';
import { PaymentHistory } from './components/PaymentHistory';
import { SaaSComparison } from './components/SaaSComparison';
import { SecurityCenter } from './components/SecurityCenter';
import { CalendarAlertsHub } from './components/CalendarAlertsHub';
import { SmartInsightsMarketplace } from './components/SmartInsightsMarketplace';
import { WealthAnalyticsHub } from './components/WealthAnalyticsHub';
import { 
  Shield, CreditCard, Sparkles, LogOut, TrendingUp, 
  Users, User, HelpCircle, Activity, LayoutDashboard, Brain,
  Sun, Moon, Globe, Bell, History, ArrowLeftRight, Lock
} from 'lucide-react';
import { motion } from 'motion/react';
import { convertCurrency, formatCurrency, SUPPORTED_CURRENCIES, suggestCurrencyFromLocale } from './lib/currency';

// Standard high-quality mock data used to seed a new workspace so it looks impressive
const INITIAL_SEED_DATA: Omit<Subscription, 'id' | 'userId'>[] = [
  {
    name: 'Netflix Premium',
    price: 22.99,
    currency: 'USD',
    cycle: 'monthly',
    category: 'Entertainment',
    startDate: '2026-03-01',
    nextRenewalDate: '2026-07-20',
    status: 'active',
    owner: 'Personal',
    notes: 'Premium 4K ultra-high definition streaming tier.'
  },
  {
    name: 'AWS Cloud Hosting',
    price: 189.50,
    currency: 'USD',
    cycle: 'monthly',
    category: 'Infrastructure',
    startDate: '2026-01-15',
    nextRenewalDate: '2026-08-15',
    status: 'active',
    owner: 'Engineering Team',
    seatsUsed: 4,
    seatsTotal: 10,
    notes: 'Infrastructure cluster for production APIs and staging servers.'
  },
  {
    name: 'Adobe Creative Cloud',
    price: 54.99,
    currency: 'EUR',
    cycle: 'monthly',
    category: 'Design',
    startDate: '2025-11-20',
    nextRenewalDate: '2026-08-20',
    status: 'active',
    owner: 'Design Group',
    seatsUsed: 1,
    seatsTotal: 1,
    notes: 'Full access suite including Photoshop, Illustrator, and Premiere Pro.'
  },
  {
    name: 'ChatGPT Plus Pro',
    price: 20.00,
    currency: 'USD',
    cycle: 'monthly',
    category: 'Productivity',
    startDate: '2026-02-10',
    nextRenewalDate: '2026-07-18',
    status: 'active',
    owner: 'Personal',
    notes: 'Generative AI writing, coding, and thinking sandbox.'
  },
  {
    name: 'Figma Team Seat',
    price: 15.00,
    currency: 'GBP',
    cycle: 'monthly',
    category: 'Design',
    startDate: '2026-04-05',
    nextRenewalDate: '2026-08-05',
    status: 'active',
    owner: 'Design Group',
    seatsUsed: 3,
    seatsTotal: 5,
    notes: 'Shared UX design workspace for product layouts.'
  },
  {
    name: 'Zoom Workspace',
    price: 1500.00,
    currency: 'JPY',
    cycle: 'monthly',
    category: 'Communication',
    startDate: '2026-02-15',
    nextRenewalDate: '2026-08-15',
    status: 'active',
    owner: 'Engineering Team',
    seatsUsed: 8,
    seatsTotal: 10,
    notes: 'Global team virtual collaboration license.'
  },
  {
    name: 'Slack Pro',
    price: 400.00,
    currency: 'INR',
    cycle: 'monthly',
    category: 'Communication',
    startDate: '2026-01-10',
    nextRenewalDate: '2026-07-25',
    status: 'active',
    owner: 'Engineering Team',
    seatsUsed: 15,
    seatsTotal: 20,
    notes: 'Team collaboration and instant chat workspace.'
  }
];

const sanitizeFirestoreData = <T extends object>(data: T): any => {
  const sanitized: any = {};
  for (const [key, value] of Object.entries(data)) {
    sanitized[key] = value === undefined ? null : value;
  }
  return sanitized;
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scan' | 'optimizer' | 'forecast' | 'teams' | 'profile' | 'help' | 'alerts' | 'history' | 'comparison' | 'security'>('dashboard');
  const [profile, setProfile] = useState<any>(null);

  const [baseCurrency, setBaseCurrency] = useState<string>(() => {
    const saved = localStorage.getItem('subpilot_base_currency');
    if (saved) return saved;
    const suggested = suggestCurrencyFromLocale();
    localStorage.setItem('subpilot_base_currency', suggested);
    return suggested;
  });

  const handleBaseCurrencyChange = (newCurrency: string) => {
    setBaseCurrency(newCurrency);
    localStorage.setItem('subpilot_base_currency', newCurrency);
  };

  const [billingPeriodMode, setBillingPeriodMode] = useState<'monthly' | 'annual'>(() => {
    return (localStorage.getItem('subpilot_billing_period_mode') as 'monthly' | 'annual') || 'monthly';
  });

  const handleBillingPeriodChange = (mode: 'monthly' | 'annual') => {
    setBillingPeriodMode(mode);
    localStorage.setItem('subpilot_billing_period_mode', mode);
  };

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Monitor Auth state
  useEffect(() => {
    const isOfflineMode = localStorage.getItem('subpilot_offline_mode') === 'true';
    if (isOfflineMode) {
      setUser({
        uid: 'offline-guest',
        email: 'guest@subpilot.local',
        isAnonymous: true,
      });
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser && currentUser.uid !== 'offline-guest') {
        try {
          const token = await currentUser.getIdToken();
          const response = await fetch('/api/auth/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              name: currentUser.displayName || currentUser.email?.split('@')[0] || 'SubPilot Member'
            })
          });

          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const syncData = await response.json();
            if (response.ok) {
              console.log('[SubPilot Client Sync] MongoDB user document sync successful:', syncData);
            } else {
              console.warn('[SubPilot Client Sync] MongoDB user sync returned error response:', syncData);
            }
          } else {
            const textResponse = await response.text();
            console.warn('[SubPilot Client Sync] MongoDB user sync returned non-JSON response:', response.status, textResponse.substring(0, 150));
          }
        } catch (error) {
          console.error('[SubPilot Client Sync] MongoDB user sync error:', error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Monitor Profile details from Firestore or local storage
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    if (user.uid === 'offline-guest') {
      const stored = localStorage.getItem('subpilot_offline_profile');
      if (stored) {
        try {
          setProfile(JSON.parse(stored));
        } catch (e) {
          setProfile({
            userId: 'offline-guest',
            name: 'Guest Pilot',
            phoneNumber: '',
            profilePic: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
            updatedAt: new Date().toISOString()
          });
        }
      } else {
        const defaultProfile = {
          userId: 'offline-guest',
          name: 'Guest Pilot',
          phoneNumber: '',
          profilePic: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
          updatedAt: new Date().toISOString()
        };
        setProfile(defaultProfile);
        localStorage.setItem('subpilot_offline_profile', JSON.stringify(defaultProfile));
      }
      return;
    }

    const docRef = doc(db, 'profiles', user.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data());
      } else {
        const initialName = user.displayName || user.email?.split('@')[0] || 'SubPilot Member';
        const initialPic = user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces';
        const defaultProfile = {
          userId: user.uid,
          name: initialName,
          phoneNumber: '',
          profilePic: initialPic,
          updatedAt: new Date().toISOString()
        };
        setProfile(defaultProfile);
        setDoc(docRef, defaultProfile).catch(console.error);
      }
    }, (error) => {
      console.error("Failed to load profile from Firestore:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLocalGuestLogin = () => {
    localStorage.setItem('subpilot_offline_mode', 'true');
    setUser({
      uid: 'offline-guest',
      email: 'guest@subpilot.local',
      isAnonymous: true,
    });
  };

  // Sync subscriptions from Firestore in real-time
  useEffect(() => {
    if (!user) {
      setSubscriptions([]);
      return;
    }

    if (user.uid === 'offline-guest') {
      const stored = localStorage.getItem('subpilot_offline_subscriptions');
      if (stored) {
        try {
          setSubscriptions(JSON.parse(stored));
        } catch (e) {
          setSubscriptions([]);
          localStorage.setItem('subpilot_offline_subscriptions', JSON.stringify([]));
        }
      } else {
        setSubscriptions([]);
        localStorage.setItem('subpilot_offline_subscriptions', JSON.stringify([]));
      }
      return;
    }

    const q = query(
      collection(db, 'subscriptions'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const list: Subscription[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Subscription);
      });

      setSubscriptions(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'subscriptions');
    });

    return () => unsubscribe();
  }, [user]);

  // Operations CRUD
  const handleAddSubscription = async (newSub: Omit<Subscription, 'id' | 'userId'>) => {
    if (!user) return;

    if (user.uid === 'offline-guest') {
      const added: Subscription = {
        ...newSub,
        id: `local-${Date.now()}`,
        userId: user.uid,
      };
      const updated = [...subscriptions, added];
      setSubscriptions(updated);
      localStorage.setItem('subpilot_offline_subscriptions', JSON.stringify(updated));
      return;
    }

    try {
      await addDoc(collection(db, 'subscriptions'), sanitizeFirestoreData({
        ...newSub,
        userId: user.uid,
      }));
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'subscriptions');
    }
  };

  const handleUpdateSubscription = async (id: string, updatedFields: Partial<Subscription>) => {
    if (user?.uid === 'offline-guest') {
      const updated = subscriptions.map((sub) => {
        if (sub.id === id) {
          return { ...sub, ...updatedFields };
        }
        return sub;
      });
      setSubscriptions(updated);
      localStorage.setItem('subpilot_offline_subscriptions', JSON.stringify(updated));
      return;
    }

    try {
      const docRef = doc(db, 'subscriptions', id);
      await updateDoc(docRef, sanitizeFirestoreData(updatedFields));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `subscriptions/${id}`);
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    if (user?.uid === 'offline-guest') {
      const updated = subscriptions.filter(sub => sub.id !== id);
      setSubscriptions(updated);
      localStorage.setItem('subpilot_offline_subscriptions', JSON.stringify(updated));
      return;
    }

    try {
      const docRef = doc(db, 'subscriptions', id);
      await deleteDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `subscriptions/${id}`);
    }
  };

  const handleClearAllSubscriptions = async () => {
    if (!user) return;
    if (user.uid === 'offline-guest') {
      setSubscriptions([]);
      localStorage.setItem('subpilot_offline_subscriptions', JSON.stringify([]));
      return;
    }
    try {
      const q = query(
        collection(db, 'subscriptions'),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      setSubscriptions([]);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'subscriptions-bulk');
    }
  };

  const handleBulkImport = async (newSubs: Omit<Subscription, 'id' | 'userId'>[]) => {
    if (!user) return;

    if (user.uid === 'offline-guest') {
      const added = newSubs.map((sub, i) => ({
        ...sub,
        id: `local-import-${Date.now()}-${i}`,
        userId: user.uid,
      }));
      const updated = [...subscriptions, ...added];
      setSubscriptions(updated);
      localStorage.setItem('subpilot_offline_subscriptions', JSON.stringify(updated));
      return;
    }

    try {
      for (const sub of newSubs) {
        await addDoc(collection(db, 'subscriptions'), sanitizeFirestoreData({
          ...sub,
          userId: user.uid,
        }));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'subscriptions');
    }
  };

  const handleApplyRecommendation = async (rec: Recommendation) => {
    // Look up subscription referenced by recommendation
    const matchedSub = subscriptions.find(s => s.name.toLowerCase().includes(rec.subscriptionName.toLowerCase()));
    if (!matchedSub || !matchedSub.id) return;

    if (rec.type === 'duplicate' || rec.type === 'unused') {
      // Cancel/delete subscription to cut cost
      await handleDeleteSubscription(matchedSub.id);
    } else if (rec.type === 'saving') {
      // Switch monthly to yearly plan
      const discountPrice = matchedSub.price * 0.8; // simulate annual discount
      await handleUpdateSubscription(matchedSub.id, {
        cycle: 'yearly',
        price: discountPrice * 12, // convert rate
        notes: `${matchedSub.notes || ''} (Optimized to yearly pre-paid rate via AI recommendations)`
      });
    }
  };

  const handleLogout = async () => {
    if (user?.uid === 'offline-guest') {
      localStorage.removeItem('subpilot_offline_mode');
      setUser(null);
      return;
    }
    await signOut(auth);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent animate-spin rounded-full mb-3" />
        <span className="text-xs font-semibold text-text-dim">Loading Enterprise SubPilot Hub...</span>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onSuccess={() => {}} onLocalGuestLogin={handleLocalGuestLogin} />;
  }

  // Financial spend computations
  const computeFinancials = () => {
    let monthlySpend = 0;
    let yearlySpend = 0;
    let duplicateWarnings = 0;
    const namesSeen = new Set();

    subscriptions.forEach((sub) => {
      if (sub.status === 'cancelled') return;

      // Convert sub price from its native currency to user's selected base currency
      const priceInBase = convertCurrency(sub.price, sub.currency || 'USD', baseCurrency);

      // Price mapping to common monthly baseline
      let rate = priceInBase;
      if (sub.cycle === 'yearly') rate = priceInBase / 12;
      if (sub.cycle === 'weekly') rate = priceInBase * 4.33;
      if (sub.cycle === 'quarterly') rate = priceInBase / 3;

      monthlySpend += rate;
      yearlySpend += rate * 12;

      // Simple duplicate tracking for warnings badge
      const baseName = sub.name.split(' ')[0].toLowerCase();
      if (namesSeen.has(baseName)) {
        duplicateWarnings++;
      }
      namesSeen.add(baseName);
    });

    return {
      monthlySpend: Math.round(monthlySpend),
      yearlySpend: Math.round(yearlySpend),
      duplicateWarnings,
      totalActive: subscriptions.filter(s => s.status === 'active').length,
    };
  };

  const financials = computeFinancials();

  return (
    <div className="min-h-screen bg-bg flex flex-col text-text-main">
      
      {/* Universal Top Nav Command Header */}
      <header className="bg-surface/80 backdrop-blur-xl border-b border-surface-border px-4 sm:px-8 py-4 sticky top-0 z-40 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Dynamic premium logo design */}
            <div className="relative w-10 h-10 flex items-center justify-center cursor-pointer group">
              <div className="absolute inset-0 bg-gradient-to-tr from-accent via-purple-500 to-amber-400 rounded-2xl rotate-6 opacity-75 blur-[2px] transition-transform group-hover:rotate-12 duration-300" />
              <div className="absolute inset-0 bg-gradient-to-tr from-accent via-purple-600 to-amber-500 rounded-2xl transition-transform group-hover:scale-105 duration-300" />
              <Shield className="relative w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-text-main via-text-main to-accent font-display text-lg tracking-tight block">SubPilot AI</span>
              <span className="text-[9px] text-text-dim font-semibold uppercase tracking-widest block">SaaS Expense Governance</span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {profile && (
              <div 
                onClick={() => setActiveTab('profile')}
                className="flex items-center gap-2 bg-accent/5 border border-accent/15 px-3 py-1.5 rounded-xl cursor-pointer hover:bg-accent/10 hover:border-accent/30 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
                title="Manage Account Profile"
              >
                <img 
                  src={profile.profilePic || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'} 
                  alt="Profile Avatar" 
                  className="w-5.5 h-5.5 rounded-lg object-cover border border-accent/10 shadow-sm"
                  referrerPolicy="no-referrer"
                />
                <span className="text-xs text-text-main font-bold block max-w-[120px] truncate">
                  {profile.name}
                </span>
              </div>
            )}

            {/* Global Base Currency Selection */}
            <div className="flex items-center gap-2 bg-sidebar border border-surface-border/50 px-3 py-1.5 rounded-xl text-text-dim hover:text-text-main hover:border-accent/40 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
              <Globe className="w-4 h-4 text-accent" />
              <select
                id="base-currency-select"
                value={baseCurrency}
                onChange={(e) => handleBaseCurrencyChange(e.target.value)}
                className="bg-transparent text-xs font-bold focus:outline-none cursor-pointer pr-1"
                title="Select Base Display Currency"
              >
                {SUPPORTED_CURRENCIES.map((curr) => (
                  <option key={curr.code} value={curr.code} className="bg-surface text-text-main">
                    {curr.code} ({curr.symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Manual Light/Dark Theme Toggle Switch */}
            <button
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className="p-2.5 bg-sidebar hover:bg-surface rounded-xl border border-surface-border/50 hover:border-accent/40 text-text-dim hover:text-text-main transition-all cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-warning" />
              ) : (
                <Moon className="w-4 h-4 text-accent" />
              )}
            </button>

            <button
              onClick={handleLogout}
              className="p-2.5 bg-sidebar hover:bg-rose-500/10 rounded-xl border border-surface-border/50 hover:border-rose-500/30 text-text-dim hover:text-rose-400 transition-all cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Responsive Grid Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full flex-1 flex flex-col lg:flex-row gap-6 sm:gap-8">
        
        {/* Navigation Sidebar Drawer */}
        <aside className="w-full lg:w-64 shrink-0 lg:space-y-6">
          <div className="bg-sidebar border border-surface-border rounded-2xl p-3 sm:p-4 shadow-[0_10px_30px_rgba(0,0,0,0.15)]">
            <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest px-3 mb-2.5 hidden lg:block">
              Core Modules
            </span>
            <nav className="flex flex-row overflow-x-auto lg:flex-col gap-1.5 pb-2 lg:pb-0 scrollbar-none">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap lg:w-full ${
                  activeTab === 'dashboard'
                    ? 'bg-gradient-to-r from-accent to-purple-600 text-white shadow-[0_4px_15px_rgba(139,92,246,0.3)]'
                    : 'text-text-dim hover:bg-surface/80 hover:text-text-main'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                SaaS Dashboard
              </button>

              <button
                onClick={() => setActiveTab('scan')}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap lg:w-full ${
                  activeTab === 'scan'
                    ? 'bg-gradient-to-r from-accent to-purple-600 text-white shadow-[0_4px_15px_rgba(139,92,246,0.3)]'
                    : 'text-text-dim hover:bg-surface/80 hover:text-text-main'
                }`}
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                AI Scan & Detect
              </button>

              <button
                onClick={() => setActiveTab('optimizer')}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap lg:w-full ${
                  activeTab === 'optimizer'
                    ? 'bg-gradient-to-r from-accent to-purple-600 text-white shadow-[0_4px_15px_rgba(139,92,246,0.3)]'
                    : 'text-text-dim hover:bg-surface/80 hover:text-text-main'
                }`}
              >
                <Brain className="w-4 h-4 shrink-0" />
                AI Spend Optimizer
              </button>

              <button
                onClick={() => setActiveTab('forecast')}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap lg:w-full ${
                  activeTab === 'forecast'
                    ? 'bg-gradient-to-r from-accent to-purple-600 text-white shadow-[0_4px_15px_rgba(139,92,246,0.3)]'
                    : 'text-text-dim hover:bg-surface/80 hover:text-text-main'
                }`}
              >
                <TrendingUp className="w-4 h-4 shrink-0" />
                Wealth Plan & Analytics
              </button>

              <button
                onClick={() => setActiveTab('teams')}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap lg:w-full ${
                  activeTab === 'teams'
                    ? 'bg-gradient-to-r from-accent to-purple-600 text-white shadow-[0_4px_15px_rgba(139,92,246,0.3)]'
                    : 'text-text-dim hover:bg-surface/80 hover:text-text-main'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                Team Shared Seats
              </button>

              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap lg:w-full ${
                  activeTab === 'profile'
                    ? 'bg-gradient-to-r from-accent to-purple-600 text-white shadow-[0_4px_15px_rgba(139,92,246,0.3)]'
                    : 'text-text-dim hover:bg-surface/80 hover:text-text-main'
                }`}
              >
                <User className="w-4 h-4 shrink-0" />
                My User Profile
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap lg:w-full ${
                  activeTab === 'history'
                    ? 'bg-gradient-to-r from-accent to-purple-600 text-white shadow-[0_4px_15px_rgba(139,92,246,0.3)]'
                    : 'text-text-dim hover:bg-surface/80 hover:text-text-main'
                }`}
              >
                <History className="w-4 h-4 shrink-0" />
                Payment Ledger
              </button>

              <button
                onClick={() => setActiveTab('alerts')}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap lg:w-full ${
                  activeTab === 'alerts'
                    ? 'bg-gradient-to-r from-accent to-purple-600 text-white shadow-[0_4px_15px_rgba(139,92,246,0.3)]'
                    : 'text-text-dim hover:bg-surface/80 hover:text-text-main'
                }`}
              >
                <Bell className="w-4 h-4 shrink-0" />
                Calendar & Reminders
              </button>

              <button
                onClick={() => setActiveTab('comparison')}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap lg:w-full ${
                  activeTab === 'comparison'
                    ? 'bg-gradient-to-r from-accent to-purple-600 text-white shadow-[0_4px_15px_rgba(139,92,246,0.3)]'
                    : 'text-text-dim hover:bg-surface/80 hover:text-text-main'
                }`}
              >
                <ArrowLeftRight className="w-4 h-4 shrink-0" />
                Smart Insights
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap lg:w-full ${
                  activeTab === 'security'
                    ? 'bg-gradient-to-r from-accent to-purple-600 text-white shadow-[0_4px_15px_rgba(139,92,246,0.3)]'
                    : 'text-text-dim hover:bg-surface/80 hover:text-text-main'
                }`}
              >
                <Lock className="w-4 h-4 shrink-0" />
                Security & Privacy
              </button>

              <button
                onClick={() => setActiveTab('help')}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap lg:w-full ${
                  activeTab === 'help'
                    ? 'bg-gradient-to-r from-accent to-purple-600 text-white shadow-[0_4px_15px_rgba(139,92,246,0.3)]'
                    : 'text-text-dim hover:bg-surface/80 hover:text-text-main'
                }`}
              >
                <HelpCircle className="w-4 h-4 shrink-0" />
                Knowledge & Help
              </button>
            </nav>
          </div>

          <div className="hidden lg:block bg-gradient-to-br from-sidebar to-surface p-5 rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.05)] border border-surface-border">
            <span className="text-[10px] font-bold text-accent uppercase tracking-wider block mb-1">PRO ADVICE</span>
            <p className="text-xs leading-relaxed font-medium text-text-dim">
              We detect duplicate SaaS workspaces and unused seats in real time. Invite team members to manage permissions together.
            </p>
          </div>
        </aside>

        {/* Dynamic Panel Canvas */}
        <div className="flex-1 space-y-6 sm:space-y-8">
          
          {/* Dashboard Section Title and Toggle Control */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface border border-surface-border p-4.5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:border-accent/10 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse shadow-[0_0_8px_var(--color-accent)]" />
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-white font-display leading-tight">Performance Metrics Hub</h2>
                <p className="text-[10px] text-text-dim uppercase tracking-wider font-semibold">Real-time subscription rate projections</p>
              </div>
            </div>
            
            {/* Monthly vs Annual Recurring View Toggle */}
            <div className="flex items-center gap-1 bg-sidebar p-1 rounded-xl border border-surface-border/60 self-start sm:self-center shadow-inner">
              <button
                id="billing-mode-monthly"
                onClick={() => handleBillingPeriodChange('monthly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  billingPeriodMode === 'monthly'
                    ? 'bg-accent text-white shadow-sm shadow-accent/20'
                    : 'text-text-dim hover:text-text-main'
                }`}
              >
                Monthly baseline
              </button>
              <button
                id="billing-mode-annual"
                onClick={() => handleBillingPeriodChange('annual')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  billingPeriodMode === 'annual'
                    ? 'bg-accent text-white shadow-sm shadow-accent/20'
                    : 'text-text-dim hover:text-text-main'
                }`}
              >
                Annualized baseline
              </button>
            </div>
          </div>

          {/* Universal Performance Metrics Hub */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn">
            <MetricCard
              id="monthly-spend-card"
              title={billingPeriodMode === 'monthly' ? "Monthly SaaS Spend" : "Annual SaaS Spend"}
              value={
                billingPeriodMode === 'monthly'
                  ? formatCurrency(financials.monthlySpend, baseCurrency)
                  : formatCurrency(financials.yearlySpend, baseCurrency)
              }
              subtext={billingPeriodMode === 'monthly' ? "Consolidated monthly rate" : "Consolidated annual rate"}
              icon={CreditCard}
              colorClass="bg-indigo-50 text-indigo-600"
              trend={{ value: "-14%", isPositive: true }}
            />
            <MetricCard
              id="yearly-spend-card"
              title={billingPeriodMode === 'monthly' ? "Projected Monthly Run" : "Yearly Outlay Run"}
              value={
                billingPeriodMode === 'monthly'
                  ? formatCurrency(Math.round(financials.yearlySpend / 12), baseCurrency)
                  : formatCurrency(financials.yearlySpend, baseCurrency)
              }
              subtext={billingPeriodMode === 'monthly' ? "Average monthly commitment" : "Expected annual budget"}
              icon={TrendingUp}
              colorClass="bg-emerald-50 text-emerald-600"
              trend={{
                value: billingPeriodMode === 'monthly'
                  ? `-${formatCurrency(35, baseCurrency)}/mo`
                  : `-${formatCurrency(420, baseCurrency)}/yr`,
                isPositive: true
              }}
            />
            <MetricCard
              id="active-subs-card"
              title={billingPeriodMode === 'monthly' ? "Active Licenses (Monthly)" : "Active Licenses (Annual)"}
              value={`${financials.totalActive}`}
              subtext={billingPeriodMode === 'monthly' ? "Paid SaaS licenses this month" : "Paid SaaS licenses this year"}
              icon={Activity}
              colorClass="bg-violet-50 text-violet-600"
            />
            <MetricCard
              id="duplicate-warns-card"
              title={billingPeriodMode === 'monthly' ? "Monthly Waste Risks" : "Annual Waste Risks"}
              value={`${financials.duplicateWarnings}`}
              subtext={
                financials.duplicateWarnings > 0
                  ? (billingPeriodMode === 'monthly' ? "Potential monthly waste identified" : "Potential annual waste identified")
                  : "Perfect tool tracking"
              }
              icon={Shield}
              colorClass={financials.duplicateWarnings > 0 ? "bg-amber-50 text-amber-600 animate-pulse" : "bg-teal-50 text-teal-600"}
            />
          </div>

          {/* Module Router View */}
          <div className="space-y-8">
            {activeTab === 'dashboard' && (
              <>
                <RenewalToastContainer subscriptions={subscriptions} baseCurrency={baseCurrency} />
                <CategoryPieChart subscriptions={subscriptions} baseCurrency={baseCurrency} />
                <SubscriptionList
                  subscriptions={subscriptions}
                  onAdd={handleAddSubscription}
                  onUpdate={handleUpdateSubscription}
                  onDelete={handleDeleteSubscription}
                  onClearAll={handleClearAllSubscriptions}
                  baseCurrency={baseCurrency}
                />
              </>
            )}

            {activeTab === 'scan' && (
              <ScanDetect onImport={handleBulkImport} userId={user.uid} />
            )}

            {activeTab === 'optimizer' && (
              <div className="space-y-8 animate-fadeIn">
                <AnnualSavingsCalculator
                  subscriptions={subscriptions}
                  onUpdateSubscription={handleUpdateSubscription}
                  baseCurrency={baseCurrency}
                />
                <AiInsights
                  subscriptions={subscriptions}
                  onApplyRecommendation={handleApplyRecommendation}
                />
              </div>
            )}

            {activeTab === 'forecast' && (
              <WealthAnalyticsHub subscriptions={subscriptions} baseCurrency={baseCurrency} />
            )}

            {activeTab === 'teams' && (
              <TeamManagement />
            )}

            {activeTab === 'profile' && (
              <UserProfile 
                user={user} 
                profile={profile} 
                onUpdateOfflineProfile={(updated) => {
                  setProfile(updated);
                  localStorage.setItem('subpilot_offline_profile', JSON.stringify(updated));
                }} 
                />
            )}

            {activeTab === 'history' && (
              <PaymentHistory 
                user={user}
                subscriptions={subscriptions}
                baseCurrency={baseCurrency}
              />
            )}

            {activeTab === 'alerts' && (
              <CalendarAlertsHub 
                subscriptions={subscriptions}
                baseCurrency={baseCurrency}
              />
            )}

            {activeTab === 'comparison' && (
              <SmartInsightsMarketplace 
                subscriptions={subscriptions}
                onUpdateSubscription={handleUpdateSubscription}
                onDeleteSubscription={handleDeleteSubscription}
                baseCurrency={baseCurrency}
              />
            )}

            {activeTab === 'security' && (
              <SecurityCenter 
                user={user}
                subscriptions={subscriptions}
                onClearLocalData={() => {
                  setSubscriptions([]);
                  setProfile(null);
                }}
              />
            )}

            {activeTab === 'help' && (
              <HelpCenter 
                subscriptions={subscriptions}
                userProfile={profile}
                baseCurrency={baseCurrency}
              />
            )}
          </div>
        </div>
      </main>

      {/* Universal footer */}
      <footer className="bg-surface border-t border-surface-border py-6 text-center text-xs text-text-dim font-medium">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>&copy; 2026 SubPilot AI. Production-ready enterprise spend governance systems.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Privacy Agreement</a>
            <a href="#" className="hover:text-white transition-colors">Financial SLA Compliance</a>
          </div>
        </div>
      </footer>

      {/* Floating AI Copilot Chatbot */}
      <CopilotChatbot 
        subscriptions={subscriptions}
        userProfile={profile}
        baseCurrency={baseCurrency}
        billingPeriodMode={billingPeriodMode}
        financials={financials}
      />
    </div>
  );
}
