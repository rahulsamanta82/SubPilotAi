import React, { useState } from 'react';
import { 
  Users, UserPlus, FileCheck, CheckCircle2, XCircle, Clock, 
  Send, Shield, Sparkles, Building2, Check, ArrowRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ApprovalRequest {
  id: string;
  name: string;
  cost: number;
  cycle: string;
  requester: string;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected';
}

export const TeamManagement: React.FC = () => {
  const [members, setMembers] = useState([
    { id: '1', name: 'Rahul Samanta', email: 'rahulsamanta5729@gmail.com', role: 'Admin', avatarUrl: 'RS' },
    { id: '2', name: 'Sarah Connor', email: 'sarah.c@subpilot.io', role: 'Member', avatarUrl: 'SC' },
    { id: '3', name: 'David Smith', email: 'd.smith@freelance.org', role: 'Guest', avatarUrl: 'DS' },
    { id: '4', name: 'Emily Watson', email: 'emily.w@subpilot.io', role: 'Member', avatarUrl: 'EW' }
  ]);

  const [approvals, setApprovals] = useState<ApprovalRequest[]>([
    {
      id: 'app_1',
      name: 'Figma Enterprise Seat',
      cost: 45.00,
      cycle: 'monthly',
      requester: 'Emily Watson',
      purpose: 'Needs advanced prototyping and dev handoff capabilities for client presentation.',
      status: 'pending'
    },
    {
      id: 'app_2',
      name: 'Copilot Pro License Upgrade',
      cost: 19.00,
      cycle: 'monthly',
      requester: 'Sarah Connor',
      purpose: 'AI programming integration for development acceleration.',
      status: 'approved'
    }
  ]);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('Member');

  const [reqName, setReqName] = useState('');
  const [reqCost, setReqCost] = useState('');
  const [reqCycle, setReqCycle] = useState('monthly');
  const [reqPurpose, setReqPurpose] = useState('');

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isRequestOpen, setIsRequestOpen] = useState(false);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName) return;

    const newMember = {
      id: Math.random().toString(),
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      avatarUrl: inviteName.split(' ').map(n => n[0]).join('').toUpperCase()
    };

    setMembers([...members, newMember]);
    setInviteEmail('');
    setInviteName('');
    setIsInviteOpen(false);
  };

  const handleRequestApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqName || !reqCost) return;

    const newReq: ApprovalRequest = {
      id: `app_${Math.random().toString()}`,
      name: reqName,
      cost: parseFloat(reqCost),
      cycle: reqCycle,
      requester: 'Rahul Samanta',
      purpose: reqPurpose,
      status: 'pending'
    };

    setApprovals([newReq, ...approvals]);
    setReqName('');
    setReqCost('');
    setReqPurpose('');
    setIsRequestOpen(false);
  };

  const updateApprovalStatus = (id: string, status: 'approved' | 'rejected') => {
    setApprovals(prev =>
      prev.map(app => (app.id === id ? { ...app, status } : app))
    );
  };

  return (
    <div id="team-licensing" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Team Members List */}
      <div className="premium-card p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.15)] lg:col-span-1">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 border border-accent/25 rounded-xl">
              <Users className="w-5 h-5 text-accent" />
            </div>
            <span className="font-extrabold text-white font-display text-lg">Team Seats</span>
          </div>
          <button
            onClick={() => setIsInviteOpen(true)}
            className="p-1.5 hover:bg-sidebar text-accent rounded-lg transition-all cursor-pointer"
            title="Invite Seat"
          >
            <UserPlus className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-text-dim mb-4">
          {members.length} seats active out of 10 available Enterprise licenses.
        </p>

        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
          {members.map(member => (
            <div key={member.id} className="flex items-center justify-between p-3 bg-sidebar/50 border border-surface-border/60 rounded-xl hover:bg-sidebar transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/15 text-accent border border-accent/20 font-bold text-xs flex items-center justify-center">
                  {member.avatarUrl}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{member.name}</h4>
                  <p className="text-[10px] text-text-dim">{member.email}</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                member.role === 'Admin' ? 'bg-accent/15 text-accent border border-accent/20' :
                member.role === 'Guest' ? 'bg-warning/15 text-warning border border-warning/20' :
                'bg-white/5 text-text-dim border border-white/10'
              }`}>
                {member.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Approvals Workflow Manager */}
      <div className="premium-card p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.15)] lg:col-span-2 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 border border-accent/25 rounded-xl">
                <FileCheck className="w-5 h-5 text-accent" />
              </div>
              <span className="font-extrabold text-white font-display text-lg">SaaS Procurement</span>
            </div>
            <button
              onClick={() => setIsRequestOpen(true)}
              className="text-xs font-semibold text-accent hover:text-blue-400 bg-accent/10 hover:bg-accent/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Submit Request
            </button>
          </div>

          <p className="text-xs text-text-dim mb-4">
            Pre-approval workflow for new software trials, subscription upgrades, or cloud seats.
          </p>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {approvals.map(app => (
              <div key={app.id} className="p-4 bg-sidebar/40 rounded-xl border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{app.name}</span>
                    <span className="text-[10px] text-text-dim">by {app.requester}</span>
                  </div>
                  <p className="text-xs text-text-dim leading-relaxed max-w-md">{app.purpose}</p>
                  <span className="font-bold text-white text-xs block">
                    Cost: ${app.cost.toFixed(2)}/{app.cycle.replace('ly','')}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {app.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => updateApprovalStatus(app.id, 'approved')}
                        className="p-1.5 bg-success/15 text-success hover:bg-success/25 border border-success/25 rounded-lg transition-colors cursor-pointer"
                        title="Approve"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateApprovalStatus(app.id, 'rejected')}
                        className="p-1.5 bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/25 rounded-lg transition-colors cursor-pointer"
                        title="Reject"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      app.status === 'approved' ? 'bg-success/15 text-success border border-success/20' : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                    }`}>
                      {app.status === 'approved' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {app.status.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invite Member Dialog */}
      <AnimatePresence>
        {isInviteOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-surface-border rounded-2xl max-w-sm w-full p-6 shadow-2xl text-gray-200"
            >
              <h3 className="text-lg font-bold font-display text-white mb-4">Invite Seat Member</h3>
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-text-dim uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Connor"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-sidebar border border-surface-border text-white rounded-xl text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-dim uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="sarah.c@subpilot.io"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-sidebar border border-surface-border text-white rounded-xl text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-dim uppercase mb-1">Access Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-sidebar border border-surface-border text-white rounded-xl text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent focus:outline-none cursor-pointer"
                  >
                    <option value="Member">Member (View & Request)</option>
                    <option value="Admin">Admin (Full Billing Access)</option>
                    <option value="Guest">Guest (Temporary Audit Only)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsInviteOpen(false)}
                    className="px-4 py-2 border border-surface-border rounded-xl text-gray-200 hover:bg-sidebar text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-accent hover:bg-blue-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Send Invitation
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Procurement Request Dialog */}
      <AnimatePresence>
        {isRequestOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-surface-border rounded-2xl max-w-md w-full p-6 shadow-2xl text-gray-200"
            >
              <h3 className="text-lg font-bold font-display text-white mb-4">Submit Procurement Request</h3>
              <form onSubmit={handleRequestApproval} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-text-dim uppercase mb-1">SaaS Service</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Miro Board Upgrade, Datadog Pro"
                    value={reqName}
                    onChange={(e) => setReqName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-sidebar border border-surface-border text-white rounded-xl text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-text-dim uppercase mb-1">Cost (USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="15.00"
                      value={reqCost}
                      onChange={(e) => setReqCost(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-sidebar border border-surface-border text-white rounded-xl text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-dim uppercase mb-1">Billing Cycle</label>
                    <select
                      value={reqCycle}
                      onChange={(e) => setReqCycle(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-sidebar border border-surface-border text-white rounded-xl text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent focus:outline-none cursor-pointer"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-dim uppercase mb-1">Business Reason</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Explain why the company should fund this tool license."
                    value={reqPurpose}
                    onChange={(e) => setReqPurpose(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-sidebar border border-surface-border text-white rounded-xl text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent focus:outline-none resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRequestOpen(false)}
                    className="px-4 py-2 border border-surface-border rounded-xl text-gray-200 hover:bg-sidebar text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-accent hover:bg-blue-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
