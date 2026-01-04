'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineUserAdd,
  HiOutlineTrash,
  HiOutlineMail,
  HiOutlineUserCircle,
  HiOutlineShieldCheck,
  HiOutlineClock,
} from 'react-icons/hi';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  lastLoginAt: string | null;
  createdAt: string;
}

const roleLabels: Record<string, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MEMBER: 'Member',
  VIEWER: 'Viewer',
};

const roleColors: Record<string, string> = {
  OWNER: 'bg-purple-500/10 text-purple-400',
  ADMIN: 'bg-blue-500/10 text-blue-400',
  MEMBER: 'bg-green-500/10 text-green-400',
  VIEWER: 'bg-slate-500/10 text-slate-400',
};

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/team', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error('Failed to fetch team:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;

    setInviting(true);
    try {
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      if (response.ok) {
        setShowInviteModal(false);
        setInviteEmail('');
        fetchMembers();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to send invite');
      }
    } catch (error) {
      console.error('Failed to invite:', error);
    } finally {
      setInviting(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-800 rounded w-1/3 mb-2" />
          <div className="h-4 bg-slate-800 rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Team</h1>
          <p className="text-slate-400 mt-1">
            Manage team members and permissions
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-archi-500 hover:bg-archi-400 text-white rounded-lg transition-colors font-medium"
        >
          <HiOutlineUserAdd className="w-5 h-5" />
          Invite Member
        </button>
      </div>

      {/* Team Members List */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        {members.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <HiOutlineUserCircle className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-white font-medium">No team members yet</p>
            <p className="text-slate-400 text-sm mt-1">
              Invite team members to help manage conversations
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {members.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-archi-500/20 flex items-center justify-center">
                    <span className="text-archi-400 font-medium">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white">{member.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${roleColors[member.role]}`}>
                        {roleLabels[member.role]}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400">{member.email}</p>
                  </div>
                  <div className="text-right text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <HiOutlineClock className="w-4 h-4" />
                      Last login: {formatDate(member.lastLoginAt)}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl"
          >
            <div className="p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Invite Team Member</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-archi-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-archi-500"
                  >
                    <option value="MEMBER">Member - Can view and reply to conversations</option>
                    <option value="ADMIN">Admin - Full access except billing</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  disabled={!inviteEmail || inviting}
                  className="flex-1 px-4 py-2 bg-archi-500 text-white rounded-lg hover:bg-archi-400 transition-colors disabled:opacity-50"
                >
                  {inviting ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
