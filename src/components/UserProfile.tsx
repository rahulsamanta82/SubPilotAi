import React, { useState, useEffect, useRef } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  User, Phone, Image as ImageIcon, Check, Loader2, Sparkles, ShieldCheck, 
  Upload, Building2, Briefcase, Globe, Info, Mail, ShieldAlert, Award, 
  Camera, Trash2, CheckCircle2, Lock, Key, RefreshCw, Eye, ExternalLink, Settings,
  Database, Wifi, WifiOff, BellRing, UserCheck, Shield
} from 'lucide-react';

interface UserProfileProps {
  user: any;
  profile: any;
  onUpdateOfflineProfile?: (updated: any) => void;
}

const PRESET_AVATARS = [
  { url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces', label: 'Jane (Product)' },
  { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces', label: 'Daniel (DevOps)' },
  { url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces', label: 'Sarah (Design)' },
  { url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces', label: 'Marcus (CFO)' },
  { url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=faces', label: 'Zoe (Engineer)' },
  { url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=faces', label: 'Raj (Founder)' }
];

const PASS_THEMES = [
  { id: 'carbon', label: 'Carbon Shield', bgClass: 'from-zinc-950 via-zinc-900 to-slate-900 border-zinc-800', accentClass: 'text-zinc-400', glowColor: 'rgba(24,24,27,0.4)' },
  { id: 'amethyst', label: 'Amethyst Spark', bgClass: 'from-slate-950 via-purple-950/40 to-slate-950 border-purple-500/20', accentClass: 'text-purple-400', glowColor: 'rgba(168,85,247,0.25)' },
  { id: 'obsidian', label: 'Obsidian Gold', bgClass: 'from-neutral-950 via-amber-950/20 to-neutral-950 border-amber-500/20', accentClass: 'text-amber-400', glowColor: 'rgba(245,158,11,0.2)' },
  { id: 'neon', label: 'Cyber Neon', bgClass: 'from-zinc-950 via-teal-950/20 to-zinc-950 border-teal-500/20', accentClass: 'text-teal-400', glowColor: 'rgba(20,184,166,0.2)' }
];

export const UserProfile: React.FC<UserProfileProps> = ({ user, profile, onUpdateOfflineProfile }) => {
  const [name, setName] = useState(profile?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber || '');
  const [profilePic, setProfilePic] = useState(profile?.profilePic || '');
  const [customPicUrl, setCustomPicUrl] = useState('');
  
  // Custom workspace fields
  const [jobTitle, setJobTitle] = useState(profile?.jobTitle || 'Finance Administrator');
  const [department, setDepartment] = useState(profile?.department || 'Operations');
  const [organization, setOrganization] = useState(profile?.organization || 'Global Enterprise');
  const [timezone, setTimezone] = useState(profile?.timezone || 'GMT -07:00 (PST)');
  const [bio, setBio] = useState(profile?.bio || 'Responsible for tracking and managing multi-cloud workspace subscription budgets.');

  // Notification Preferences
  const [emailNotify, setEmailNotify] = useState(profile?.emailNotify ?? true);
  const [pushNotify, setPushNotify] = useState(profile?.pushNotify ?? true);
  const [weeklyDigest, setWeeklyDigest] = useState(profile?.weeklyDigest ?? false);

  // Card theme local selection
  const [cardTheme, setCardTheme] = useState(profile?.cardTheme || 'carbon');

  // UI status states
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isOffline = !user || user.uid === 'offline-guest';

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhoneNumber(profile.phoneNumber || '');
      setProfilePic(profile.profilePic || '');
      setJobTitle(profile.jobTitle || 'Finance Administrator');
      setDepartment(profile.department || 'Operations');
      setOrganization(profile.organization || 'Global Enterprise');
      setTimezone(profile.timezone || 'GMT -07:00 (PST)');
      setBio(profile.bio || 'Responsible for tracking and managing multi-cloud workspace subscription budgets.');
      setEmailNotify(profile.emailNotify ?? true);
      setPushNotify(profile.pushNotify ?? true);
      setWeeklyDigest(profile.weeklyDigest ?? false);
      setCardTheme(profile.cardTheme || 'carbon');
    }
  }, [profile]);

  // Handle local system image upload + canvas compression
  const compressAndSetImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Invalid file type. Please select an image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError('File size too large (max 8MB). Canvas will optimize it, but please select a smaller file first.');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 200;
        const MAX_HEIGHT = 200;
        let width = img.width;
        let height = img.height;

        // Keep aspect ratio
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Draw image to canvas
          ctx.drawImage(img, 0, 0, width, height);
          // Convert to a highly compressed Base64 Data URL (0.75 JPEG Quality)
          const base64Data = canvas.toDataURL('image/jpeg', 0.75);
          setProfilePic(base64Data);
          setCustomPicUrl('');
        }
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      setError('Could not process the selected image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressAndSetImage(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      compressAndSetImage(file);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Display Name is required.');
      return;
    }

    setLoading(true);
    setSaved(false);
    setError(null);

    const updatedData = {
      userId: user?.uid || 'offline-guest',
      name: name.trim(),
      phoneNumber: phoneNumber.trim(),
      profilePic: profilePic || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces',
      jobTitle: jobTitle.trim(),
      department: department.trim(),
      organization: organization.trim(),
      timezone: timezone,
      bio: bio.trim(),
      emailNotify,
      pushNotify,
      weeklyDigest,
      cardTheme,
      updatedAt: new Date().toISOString()
    };

    if (isOffline) {
      if (onUpdateOfflineProfile) {
        onUpdateOfflineProfile(updatedData);
      }
      setSaved(true);
      setLoading(false);
      setTimeout(() => setSaved(false), 3000);
      return;
    }

    try {
      const docRef = doc(db, 'profiles', user.uid);
      await setDoc(docRef, updatedData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `profiles/${user.uid}`);
      setError('Failed to sync profile telemetry to secure Google Cloud servers.');
    } finally {
      setLoading(false);
    }
  };

  // Get active passport theme details
  const currentThemeObj = PASS_THEMES.find(t => t.id === cardTheme) || PASS_THEMES[0];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn" id="corporate-profile-center">
      
      {/* Toast Saved Alert */}
      {saved && (
        <div className="bg-emerald-500/10 border-2 border-emerald-500 text-white p-4.5 rounded-2xl flex items-start gap-3 shadow-[0_4px_25px_rgba(16,185,129,0.25)] animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">Database Sync Successful</span>
            <p className="text-xs sm:text-sm font-semibold leading-relaxed">Your professional workspace profile updates are safely stored in the database.</p>
          </div>
        </div>
      )}

      {/* Hero Banner Section */}
      <div className="bg-gradient-to-br from-purple-100/50 via-indigo-50/30 to-surface dark:from-purple-950/40 dark:via-zinc-900 dark:to-surface border border-purple-500/10 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
              <UserCheck className="w-4 h-4 text-accent" />
              <span className="text-xs font-bold uppercase tracking-wider">Workspace Identity Management</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-text-main font-display tracking-tight">
              Corporate Account Center
            </h1>
            <p className="text-xs text-text-dim max-w-xl leading-relaxed">
              Personalize your corporate credentials badge, upload local pictures with in-browser compression filters, configure notification alerts, and manage system directories.
            </p>
          </div>
          <div className="bg-sidebar border border-surface-border p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
            <ShieldCheck className="w-5 h-5 text-accent" />
            <div>
              <span className="text-[10px] text-text-dim font-bold uppercase tracking-wider block">Access Authority</span>
              <span className="text-sm font-extrabold text-text-main block">Verified Auditor Level-3</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* LEFT COLUMN: Corporate Pass Badge Showcase (Grid-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface border border-surface-border rounded-2xl p-5 sm:p-6 shadow-md space-y-5">
            
            <div className="pb-3 border-b border-surface-border/50">
              <h3 className="text-sm font-extrabold text-text-main font-display">Executive Spend Pass</h3>
              <p className="text-[10px] text-text-dim uppercase tracking-wider font-semibold font-mono">Real-time credentials badge</p>
            </div>

            {/* Virtual Badge Card container */}
            <div className={`dark-card relative rounded-2xl border bg-gradient-to-br p-5 overflow-hidden transition-all duration-500 ${currentThemeObj.bgClass}`}
                 style={{ boxShadow: `0 10px 30px -5px ${currentThemeObj.glowColor}` }}>
              
              {/* Glowing decorative circles */}
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />

              {/* Pass Header */}
              <div className="flex justify-between items-start pb-4 border-b border-white/10 relative">
                <div>
                  <span className="text-[8px] tracking-widest uppercase font-extrabold text-white/50 block">Audit Security Protocol</span>
                  <span className="text-xs font-black text-white font-display flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-accent shrink-0" />
                    SUBPILOT SPEND PASS
                  </span>
                </div>
                <div className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-white/20 bg-white/10 ${currentThemeObj.accentClass}`}>
                  ACTIVE
                </div>
              </div>

              {/* Pass Profile Picture and QR Side-by-Side */}
              <div className="flex items-center gap-4 py-5 relative">
                <div className="relative w-18 h-18 rounded-xl overflow-hidden border-2 border-white/20 bg-black/40 shadow-inner flex-shrink-0">
                  <img 
                    src={profilePic || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces'} 
                    alt="Badge Avatar" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-black text-white truncate font-display leading-tight">{name || 'Guest Pilot'}</h4>
                  <span className="text-[10px] font-bold text-white/70 block truncate mt-0.5">{jobTitle || 'Finance Officer'}</span>
                  <span className="text-[9px] text-white/40 block font-mono uppercase tracking-wider mt-0.5">{department || 'Operations'}</span>
                </div>
              </div>

              {/* Pass Metadata and Code */}
              <div className="flex justify-between items-end pt-4 border-t border-white/10 relative">
                <div className="space-y-1 text-[9px] leading-none font-semibold">
                  <div>
                    <span className="text-white/40 font-bold block uppercase text-[8px] tracking-wider mb-0.5">Corporate Pool</span>
                    <span className="text-white">{organization || 'Acme Group'}</span>
                  </div>
                  <div className="pt-2">
                    <span className="text-white/40 font-bold block uppercase text-[8px] tracking-wider mb-0.5">Location Zone</span>
                    <span className="text-white/90 font-mono text-[8px] truncate max-w-[120px] block">{timezone}</span>
                  </div>
                </div>

                {/* Simulated QR Code using Inline SVG */}
                <div className="bg-white p-1 rounded-lg w-12 h-12 flex-shrink-0 flex items-center justify-center">
                  <svg className="w-10 h-10 text-black" viewBox="0 0 100 100" fill="currentColor">
                    <rect x="0" y="0" width="25" height="25" />
                    <rect x="75" y="0" width="25" height="25" />
                    <rect x="0" y="75" width="25" height="25" />
                    <rect x="12" y="12" width="6" height="6" fill="white" />
                    <rect x="82" y="12" width="6" height="6" fill="white" />
                    <rect x="12" y="82" width="6" height="6" fill="white" />
                    {/* Random square markers for simulation */}
                    <rect x="35" y="10" width="10" height="15" />
                    <rect x="55" y="5" width="10" height="10" />
                    <rect x="45" y="25" width="15" height="15" />
                    <rect x="10" y="35" width="15" height="10" />
                    <rect x="35" y="55" width="25" height="10" />
                    <rect x="70" y="45" width="15" height="20" />
                    <rect x="55" y="75" width="15" height="15" />
                    <rect x="35" y="80" width="10" height="10" />
                  </svg>
                </div>
              </div>

              {/* Pass Serial ID bottom line */}
              <div className="pt-3.5 flex justify-between items-center text-[8px] text-white/35 font-mono relative">
                <span>SYSTEM ID: SUB-{user?.uid?.substring(0, 8).toUpperCase() || 'OFFLINE'}</span>
                <span>SECURE ABAC VERIFIED</span>
              </div>

            </div>

            {/* Badge theme picker selection buttons */}
            <div className="space-y-3 pt-1">
              <span className="text-[10px] text-text-dim font-bold uppercase tracking-wider block">Customize Badge Theme</span>
              <div className="grid grid-cols-2 gap-2">
                {PASS_THEMES.map((themeItem) => (
                  <button
                    key={themeItem.id}
                    type="button"
                    onClick={() => setCardTheme(themeItem.id)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase cursor-pointer border text-center transition-all ${
                      cardTheme === themeItem.id
                        ? 'bg-accent/15 border-accent text-accent'
                        : 'bg-sidebar/50 border-surface-border text-text-dim hover:text-white'
                    }`}
                  >
                    {themeItem.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Quick System Statistics Panel */}
          <div className="bg-sidebar border border-surface-border rounded-2xl p-5 shadow-sm space-y-4">
            <span className="text-[10px] font-bold text-accent uppercase tracking-wider block">Identity Statistics</span>
            
            <div className="space-y-3 text-xs leading-relaxed">
              <div className="flex justify-between items-center py-1.5 border-b border-surface-border/50">
                <span className="text-text-dim font-semibold">Account State:</span>
                <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Authorized
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-surface-border/50">
                <span className="text-text-dim font-semibold">Session Vault:</span>
                <span className="text-white font-mono">{isOffline ? 'Offline Sandbox' : 'Encrypted Firestore'}</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-text-dim font-semibold">Compliance Tier:</span>
                <span className="text-indigo-400 font-bold">SOC-2 Fully Ready</span>
              </div>
            </div>
          </div>

        </div>

        {/* CENTER COLUMN: Edit Credentials and details (Grid-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-surface border border-surface-border rounded-2xl p-5 sm:p-6 shadow-md space-y-6">
            
            <div className="pb-3 border-b border-surface-border/50">
              <h3 className="text-sm font-extrabold text-text-main font-display">Identity Credentials</h3>
              <p className="text-[10px] text-text-dim uppercase tracking-wider font-semibold font-mono">Personal and corporate attributes</p>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              
              {/* Display Name */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-text-dim uppercase tracking-widest">
                  Display Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-text-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="E.g. Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-sidebar border border-surface-border text-text-main placeholder:text-text-dim rounded-xl text-xs sm:text-sm focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              {/* Organization and Department Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-text-dim uppercase tracking-widest">
                    Organization / Company
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-text-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="E.g. Acme Corp"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-sidebar border border-surface-border text-text-main placeholder:text-text-dim rounded-xl text-xs focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-text-dim uppercase tracking-widest">
                    Department Division
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-text-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="E.g. Finance"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-sidebar border border-surface-border text-text-main placeholder:text-text-dim rounded-xl text-xs focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              </div>

              {/* Job Title and Phone Number Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-text-dim uppercase tracking-widest">
                    Professional Job Title
                  </label>
                  <div className="relative">
                    <Award className="w-4 h-4 text-text-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="E.g. Financial Director"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-sidebar border border-surface-border text-text-main placeholder:text-text-dim rounded-xl text-xs focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-text-dim uppercase tracking-widest">
                    Direct Phone Line
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-text-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      placeholder="E.g. +1 (555) 019-3283"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-sidebar border border-surface-border text-text-main placeholder:text-text-dim rounded-xl text-xs focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              </div>

              {/* Timezone Selection */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-text-dim uppercase tracking-widest">
                  Location Zone Timezone
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-text-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-sidebar border border-surface-border text-text-main rounded-xl text-xs focus:outline-none focus:border-accent"
                  >
                    <option value="GMT -07:00 (PST)" className="bg-surface">GMT -07:00 (Pacific Time PST)</option>
                    <option value="GMT -05:00 (EST)" className="bg-surface">GMT -05:00 (Eastern Time EST)</option>
                    <option value="GMT +00:00 (UTC)" className="bg-surface">GMT +00:00 (Greenwich Mean Time UTC)</option>
                    <option value="GMT +01:00 (CET)" className="bg-surface">GMT +01:00 (Central European Time CET)</option>
                    <option value="GMT +05:30 (IST)" className="bg-surface">GMT +05:30 (Indian Standard Time IST)</option>
                    <option value="GMT +08:00 (SGT)" className="bg-surface">GMT +08:00 (Singapore Time SGT)</option>
                    <option value="GMT +09:00 (JST)" className="bg-surface">GMT +09:00 (Japan Standard Time JST)</option>
                  </select>
                </div>
              </div>

              {/* Personal Bio */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-text-dim uppercase tracking-widest">
                  Personal Workspace Bio ({160 - bio.length} chars left)
                </label>
                <textarea
                  maxLength={160}
                  rows={3}
                  placeholder="Enter workspace bio details..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-2 bg-sidebar border border-surface-border text-text-main placeholder:text-text-dim rounded-xl text-xs focus:outline-none focus:border-accent resize-none leading-relaxed"
                />
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span className="font-semibold">{error}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-surface-border/50">
                <div className="flex items-center gap-2 text-[10px] text-text-dim font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Encrypted Channel</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-accent hover:bg-blue-600 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_4px_15px_rgba(139,92,246,0.3)]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Syncing...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Profile</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>

        {/* RIGHT COLUMN: Profile Picture Uploader & Presets + Notification Alerts (Grid-span-3) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* A. Local Upload & Preset Avatars Card */}
          <div className="bg-surface border border-surface-border rounded-2xl p-5 shadow-md space-y-4">
            <div className="pb-2 border-b border-surface-border/50">
              <h3 className="text-sm font-extrabold text-text-main font-display">Workspace Profile Pic</h3>
              <p className="text-[10px] text-text-dim uppercase tracking-wider font-semibold font-mono">System avatars & uploads</p>
            </div>

            {/* Drag and Drop Zone Container */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`p-4 border-2 border-dashed rounded-xl transition-all text-center space-y-3 cursor-pointer select-none ${
                dragOver 
                  ? 'border-accent bg-accent/5 scale-[1.02]' 
                  : 'border-surface-border/60 bg-sidebar/30 hover:border-accent/40 hover:bg-sidebar/50'
              }`}
              onClick={triggerFileSelect}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden" 
              />
              
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-accent mx-auto bg-black/40 relative group">
                <img 
                  src={profilePic || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces'} 
                  alt="Avatar Thumbnail" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-white block uppercase tracking-wider">Drag & Drop Local Pic</span>
                <span className="text-[9px] text-text-dim block font-medium">Or click to select from file system</span>
              </div>
            </div>

            {/* Custom URL Input block */}
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-text-dim uppercase tracking-wider mb-1">
                Or paste remote image link
              </label>
              <div className="relative">
                <ImageIcon className="w-3.5 h-3.5 text-text-dim absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={customPicUrl}
                  onChange={(e) => {
                    setCustomPicUrl(e.target.value);
                    if (e.target.value.trim().startsWith('http')) {
                      setProfilePic(e.target.value.trim());
                    }
                  }}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-sidebar border border-surface-border text-text-main placeholder:text-text-dim rounded-xl text-[10px] focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* Quick Presets Grid selection */}
            <div className="space-y-2 pt-1 border-t border-surface-border/50">
              <span className="text-[9px] text-text-dim font-extrabold uppercase tracking-widest block">Choose standard preset:</span>
              <div className="grid grid-cols-6 gap-1.5">
                {PRESET_AVATARS.map((preset, idx) => {
                  const isSelected = profilePic === preset.url;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setProfilePic(preset.url);
                        setCustomPicUrl('');
                      }}
                      title={preset.label}
                      className={`relative aspect-square rounded-lg overflow-hidden border transition-all cursor-pointer ${
                        isSelected ? 'border-accent scale-105 shadow-md' : 'border-surface-border hover:border-text-dim'
                      }`}
                    >
                      <img 
                        src={preset.url} 
                        alt={preset.label} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-accent/25 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* B. Communication & System Alert Toggles */}
          <div className="bg-surface border border-surface-border rounded-2xl p-5 shadow-md space-y-4">
            <div className="pb-2 border-b border-surface-border/50">
              <h3 className="text-sm font-extrabold text-text-main font-display">System Notifications</h3>
              <p className="text-[10px] text-text-dim uppercase tracking-wider font-semibold font-mono">Telemetry notice targets</p>
            </div>

            <div className="space-y-3.5 text-xs">
              
              {/* Email Toggle */}
              <div className="flex items-start gap-3 p-1.5 rounded-lg hover:bg-sidebar/30 transition-all">
                <input
                  type="checkbox"
                  id="notif-email"
                  checked={emailNotify}
                  onChange={(e) => setEmailNotify(e.target.checked)}
                  className="mt-0.5 rounded border-surface-border bg-sidebar text-accent focus:ring-accent accent-accent w-3.5 h-3.5"
                />
                <label htmlFor="notif-email" className="cursor-pointer">
                  <span className="font-extrabold text-text-main block">Email Renewal Alerts</span>
                  <span className="text-[10px] text-text-dim leading-relaxed block mt-0.5">Send active invoice alerts to corporate email target.</span>
                </label>
              </div>

              {/* Socket/Push Toggle */}
              <div className="flex items-start gap-3 p-1.5 rounded-lg hover:bg-sidebar/30 transition-all">
                <input
                  type="checkbox"
                  id="notif-push"
                  checked={pushNotify}
                  onChange={(e) => setPushNotify(e.target.checked)}
                  className="mt-0.5 rounded border-surface-border bg-sidebar text-accent focus:ring-accent accent-accent w-3.5 h-3.5"
                />
                <label htmlFor="notif-push" className="cursor-pointer">
                  <span className="font-extrabold text-text-main block">In-App Banner Notifications</span>
                  <span className="text-[10px] text-text-dim leading-relaxed block mt-0.5">Show real-time toast alerts upon upcoming renewal events.</span>
                </label>
              </div>

              {/* Weekly digest Toggle */}
              <div className="flex items-start gap-3 p-1.5 rounded-lg hover:bg-sidebar/30 transition-all">
                <input
                  type="checkbox"
                  id="notif-digest"
                  checked={weeklyDigest}
                  onChange={(e) => setWeeklyDigest(e.target.checked)}
                  className="mt-0.5 rounded border-surface-border bg-sidebar text-accent focus:ring-accent accent-accent w-3.5 h-3.5"
                />
                <label htmlFor="notif-digest" className="cursor-pointer">
                  <span className="font-extrabold text-text-main block">Weekly Budget Digests</span>
                  <span className="text-[10px] text-text-dim leading-relaxed block mt-0.5">Receive aggregated corporate spend summaries and forecasts.</span>
                </label>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
