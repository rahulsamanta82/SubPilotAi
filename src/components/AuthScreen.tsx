import React, { useState } from 'react';
import { 
  auth 
} from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { Shield, Sparkles, Mail, Lock, User, Info, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthScreenProps {
  onSuccess: () => void;
  onLocalGuestLogin: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess, onLocalGuestLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onSuccess();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password. Feel free to use "Continue as Guest" to try out all database systems instantly.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email address is already registered. Try logging in.');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInAnonymously(auth);
      onSuccess();
    } catch (err: any) {
      console.warn("Firebase Anonymous Sign-In failed/disabled. Switching to Local Sandbox:", err);
      onLocalGuestLogin();
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('The Google sign-in popup was closed before completing. Please try again.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError(`Firebase Authentication: This domain (${window.location.hostname}) is not authorized in your Firebase Project Console. See instructions below to add it.`);
      } else {
        setError(err.message || 'Google Sign-In failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-screen" className="min-h-screen bg-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Immersive ambient glowing spheres */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[100px] -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] -z-10 animate-pulse" />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md premium-card p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] animated-glow-border relative z-10"
      >
        {/* Brand identity header */}
        <div className="text-center mb-8">
          <div className="relative w-14 h-14 mx-auto mb-4 flex items-center justify-center cursor-pointer group">
            <div className="absolute inset-0 bg-gradient-to-tr from-accent via-purple-500 to-amber-400 rounded-2xl rotate-6 opacity-75 blur-[2px] transition-transform group-hover:rotate-12 duration-300" />
            <div className="absolute inset-0 bg-gradient-to-tr from-accent via-purple-600 to-amber-500 rounded-2xl transition-transform group-hover:scale-105 duration-300" />
            <Shield className="relative w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-text-main via-text-main to-accent font-display tracking-tight">SubPilot AI</h1>
          <p className="text-xs text-text-dim mt-2 font-medium leading-relaxed">
            Enterprise-grade Subscription & SaaS Expense Control Command.
          </p>
        </div>

        {/* Dynamic Credentials Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1.5">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-text-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Rahul Samanta"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-sidebar border border-surface-border text-text-main placeholder:text-text-dim rounded-xl text-sm focus:bg-sidebar/80 focus:ring-2 focus:ring-accent/20 focus:border-accent focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-text-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="rahulsamanta5729@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-sidebar border border-surface-border text-text-main placeholder:text-text-dim rounded-xl text-sm focus:bg-sidebar/80 focus:ring-2 focus:ring-accent/20 focus:border-accent focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest">Password</label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-text-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-sidebar border border-surface-border text-text-main placeholder:text-text-dim rounded-xl text-sm focus:bg-sidebar/80 focus:ring-2 focus:ring-accent/20 focus:border-accent focus:outline-none transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-xl text-xs leading-relaxed">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
              
              {error.includes('unauthorized-domain') && (
                <div className="p-4 bg-sidebar/80 border border-accent/20 rounded-xl text-xs space-y-3 text-text-main">
                  <p className="font-bold text-accent">🛠️ How to authorize this domain in your Firebase project:</p>
                  <ol className="list-decimal list-inside space-y-1.5 text-text-dim text-[11px]">
                    <li>Go to the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-accent underline hover:text-blue-400">Firebase Console</a></li>
                    <li>Select your project <strong className="text-text-main">subpilot-49963</strong></li>
                    <li>Go to <strong className="text-text-main">Authentication</strong> &gt; <strong className="text-text-main">Settings</strong> &gt; <strong className="text-text-main">Authorized domains</strong></li>
                    <li>Click <strong className="text-text-main">Add domain</strong> and enter:</li>
                  </ol>
                  <div className="flex items-center justify-between p-2.5 bg-black/40 rounded-lg border border-white/5 font-mono text-[11px] text-text-main">
                    <span className="truncate mr-2">{window.location.hostname}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.hostname);
                        setCopiedDomain(true);
                        setTimeout(() => setCopiedDomain(false), 2000);
                      }}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all shrink-0 cursor-pointer ${
                        copiedDomain 
                          ? 'bg-success/20 border border-success/30 text-success' 
                          : 'bg-accent/20 border border-accent/30 text-accent hover:bg-accent/30'
                      }`}
                    >
                      {copiedDomain ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-[10px] text-text-dim leading-relaxed">
                    * After adding the domain, try clicking <strong>Sign in with Google</strong> again. No app rebuild or restart is required!
                  </p>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-accent to-purple-600 hover:from-accent hover:to-indigo-600 disabled:bg-white/5 disabled:text-text-dim text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-[0_4px_15px_rgba(139,92,246,0.3)] hover:shadow-[0_6px_20px_rgba(139,92,246,0.4)] hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Working...
              </>
            ) : (
              <>
                {isSignUp ? 'Create SaaS Account' : 'Authenticate Console'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs font-semibold text-accent hover:text-purple-400 transition-colors hover:underline cursor-pointer"
          >
            {isSignUp ? 'Already registered? Log in here' : 'New to SubPilot AI? Open a private workspace'}
          </button>
        </div>

        {/* Google sign-in alternative */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-surface-border" />
          <span className="relative bg-[#0E0D1A] px-3 text-[9px] font-bold text-text-dim uppercase tracking-widest">
            or connect instantly
          </span>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-sidebar hover:bg-surface border border-surface-border hover:border-accent/40 text-text-main font-bold py-2.5 px-4 rounded-xl text-sm transition-all hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer"
        >
          <svg className="w-4 h-4 mr-1 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.48 14.99 1 12 1 7.24 1 3.19 3.73 1.24 7.7l3.9 3.03C6.1 7.7 8.84 5.04 12 5.04z"
            />
            <path
              fill="#4285F4"
              d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.45h6.45c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.38-4.88 3.38-8.5z"
            />
            <path
              fill="#FBBC05"
              d="M5.14 14.73c-.24-.71-.38-1.47-.38-2.27s.14-1.56.38-2.27L1.24 7.16C.45 8.76 0 10.53 0 12.4s.45 3.64 1.24 5.24l3.9-3.03z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.01.68-2.31 1.09-3.9 1.09-3.16 0-5.9-2.66-6.86-5.69l-3.9 3.03C3.19 20.27 7.24 23 12 23z"
            />
          </svg>
          Sign in with Google
        </button>

        {/* Guest access alternative */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-surface-border" />
          <span className="relative bg-[#0E0D1A] px-3 text-[9px] font-bold text-text-dim uppercase tracking-widest">
            or test-drive instantly
          </span>
        </div>

        <button
          type="button"
          onClick={handleGuestLogin}
          disabled={loading}
          className="w-full bg-sidebar hover:bg-surface border border-surface-border hover:border-accent/40 text-text-main font-bold py-2.5 px-4 rounded-xl text-sm transition-all hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-accent" />
          Continue as Guest (Skip Account Setup)
        </button>

        <div className="mt-6 p-4.5 bg-accent/5 rounded-2xl flex items-start gap-2.5 border border-accent/15 shadow-[inset_0_1px_2px_rgba(255,255,255,0.02)]">
          <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <p className="text-[10px] text-text-dim leading-relaxed font-semibold">
            We've set up complete Cloud databases for storage. Guest data remains private to this sandbox browser environment and links to a private guest account.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
