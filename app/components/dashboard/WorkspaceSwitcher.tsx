'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Building2,
  ChevronDown,
  Plus,
  Settings,
  Users,
  Bot,
  Check,
  Loader2,
} from 'lucide-react';

interface Workspace {
  id: string;
  name: string;
  isOwner: boolean;
  isCurrent: boolean;
  tokenBalance: number;
  _count: {
    agents: number;
    users: number;
  };
  owner?: {
    name: string;
    email: string;
  };
}

interface WorkspaceSwitcherProps {
  onWorkspaceChange?: () => void;
}

export default function WorkspaceSwitcher({ onWorkspaceChange }: WorkspaceSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(false);
  const [showNewWorkspace, setShowNewWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [creating, setCreating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowNewWorkspace(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const res = await fetch('/api/workspaces');
      const data = await res.json();
      
      if (data.workspaces) {
        setWorkspaces(data.workspaces);
        const current = data.workspaces.find((w: Workspace) => w.isCurrent);
        setCurrentWorkspace(current || data.workspaces[0]);
      }
    } catch (err) {
      console.error('Error fetching workspaces:', err);
    }
  };

  const handleSwitchWorkspace = async (workspace: Workspace) => {
    if (workspace.isCurrent) {
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/workspaces', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: workspace.id }),
      });

      if (res.ok) {
        // Reload page to refresh all data with new workspace context
        window.location.reload();
      }
    } catch (err) {
      console.error('Error switching workspace:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    setCreating(true);
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWorkspaceName }),
      });

      if (res.ok) {
        const data = await res.json();
        // Switch to the new workspace
        await handleSwitchWorkspace({ ...data.workspace, isCurrent: false } as Workspace);
      }
    } catch (err) {
      console.error('Error creating workspace:', err);
    } finally {
      setCreating(false);
      setNewWorkspaceName('');
      setShowNewWorkspace(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors"
      >
        <Building2 className="w-4 h-4 text-blue-400" />
        <span className="text-sm font-medium text-white max-w-[120px] truncate">
          {currentWorkspace?.name || 'Select Workspace'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden z-50">
          <div className="p-2">
            <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Your Workspaces
            </p>

            {/* Workspace List */}
            <div className="space-y-1">
              {workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  onClick={() => handleSwitchWorkspace(workspace)}
                  disabled={loading}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    workspace.isCurrent
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-1.5 rounded-lg ${
                      workspace.isCurrent ? 'bg-blue-500/30' : 'bg-gray-700'
                    }`}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="font-medium truncate">{workspace.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Bot className="w-3 h-3" />
                          {workspace._count.agents}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {workspace._count.users}
                        </span>
                        {!workspace.isOwner && workspace.owner && (
                          <span className="text-gray-600">
                            by {workspace.owner.name || workspace.owner.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {workspace.isCurrent && (
                    <Check className="w-4 h-4 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {/* Create New */}
            <div className="mt-2 pt-2 border-t border-gray-700">
              {showNewWorkspace ? (
                <form onSubmit={handleCreateWorkspace} className="p-2">
                  <input
                    type="text"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    placeholder="Workspace name"
                    autoFocus
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      type="submit"
                      disabled={creating || !newWorkspaceName.trim()}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      {creating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Create'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewWorkspace(false);
                        setNewWorkspaceName('');
                      }}
                      className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowNewWorkspace(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">New Workspace</span>
                </button>
              )}
            </div>

            {/* Manage */}
            <div className="pt-2 border-t border-gray-700 mt-2">
              <a
                href="/dashboard/settings"
                className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm">Workspace Settings</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
