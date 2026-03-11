'use client';

// ============================================
// Buffer Accounts Panel - WealthClaude Style
// ============================================

import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Check,
  X,
  AlertCircle,
  Loader2,
  Link2,
  Unlink,
  ExternalLink,
} from 'lucide-react';

interface BufferAccount {
  id: string;
  buffer_profile_id: string;
  platform: 'x' | 'linkedin' | 'instagram';
  account_name: string | null;
  account_handle: string | null;
  account_avatar_url: string | null;
  is_connected: boolean;
  last_synced_at: string | null;
}

const PLATFORM_CONFIG = {
  x: {
    name: 'X / Twitter',
    icon: '𝕏',
    color: 'bg-zinc-800',
    textColor: 'text-white',
  },
  linkedin: {
    name: 'LinkedIn',
    icon: 'in',
    color: 'bg-[#0A66C2]',
    textColor: 'text-white',
  },
  instagram: {
    name: 'Instagram',
    icon: '📷',
    color: 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400',
    textColor: 'text-white',
  },
};

interface BufferAccountsPanelProps {
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  selectable?: boolean;
}

export default function BufferAccountsPanel({
  selectedIds = [],
  onSelectionChange,
  selectable = false,
}: BufferAccountsPanelProps) {
  const [accounts, setAccounts] = useState<BufferAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/agents/buffer');
      const data = await response.json();

      if (data.success) {
        setAccounts(data.data);
      } else {
        setError(data.error || 'Failed to fetch accounts');
      }
    } catch (err) {
      setError('Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  };

  const syncAccounts = async () => {
    try {
      setSyncing(true);
      setError(null);

      const response = await fetch('/api/agents/buffer', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setAccounts(data.data);
      } else {
        setError(data.error || 'Failed to sync accounts');
      }
    } catch (err) {
      setError('Failed to sync accounts');
    } finally {
      setSyncing(false);
    }
  };

  const disconnectAccount = async (profileId: string) => {
    if (!confirm('Disconnect this account?')) return;

    try {
      const response = await fetch(`/api/agents/buffer?profile_id=${profileId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setAccounts(prev => prev.filter(a => a.buffer_profile_id !== profileId));
        if (onSelectionChange) {
          onSelectionChange(selectedIds.filter(id => id !== profileId));
        }
      } else {
        setError(data.error || 'Failed to disconnect');
      }
    } catch (err) {
      setError('Failed to disconnect account');
    }
  };

  const toggleSelection = (profileId: string) => {
    if (!selectable || !onSelectionChange) return;

    if (selectedIds.includes(profileId)) {
      onSelectionChange(selectedIds.filter(id => id !== profileId));
    } else {
      onSelectionChange([...selectedIds, profileId]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Connected Accounts</h3>
          <p className="text-sm text-zinc-500">
            {accounts.length} account{accounts.length !== 1 ? 's' : ''} via Buffer
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://buffer.com/app"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
            title="Open Buffer"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            onClick={syncAccounts}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-all"
          >
            {syncing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Sync
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-300">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Empty State */}
      {accounts.length === 0 && (
        <div className="text-center py-8 border border-dashed border-zinc-800 rounded-xl">
          <Link2 className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
          <h4 className="text-zinc-300 font-medium mb-1">No accounts connected</h4>
          <p className="text-sm text-zinc-500 mb-4">
            Add your Buffer API key first, then click Sync
          </p>
          <button
            onClick={syncAccounts}
            disabled={syncing}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-all inline-flex items-center gap-2"
          >
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Sync from Buffer
          </button>
        </div>
      )}

      {/* Accounts Grid */}
      {accounts.length > 0 && (
        <div className="grid gap-3">
          {accounts.map(account => {
            const config = PLATFORM_CONFIG[account.platform];
            const isSelected = selectedIds.includes(account.buffer_profile_id);

            return (
              <div
                key={account.id}
                onClick={() => toggleSelection(account.buffer_profile_id)}
                className={`
                  relative flex items-center gap-4 p-4 rounded-xl border transition-all
                  ${selectable ? 'cursor-pointer' : ''}
                  ${isSelected
                    ? 'bg-emerald-500/10 border-emerald-500/50'
                    : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                  }
                `}
              >
                {/* Selection Checkbox */}
                {selectable && (
                  <div className={`
                    w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                    ${isSelected
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'border-zinc-600 hover:border-zinc-500'
                    }
                  `}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                )}

                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {account.account_avatar_url ? (
                    <img
                      src={account.account_avatar_url}
                      alt={account.account_name || ''}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-full ${config.color} flex items-center justify-center ${config.textColor} font-bold`}>
                      {config.icon}
                    </div>
                  )}
                  {/* Platform badge */}
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${config.color} flex items-center justify-center text-[10px] ${config.textColor} border-2 border-zinc-900`}>
                    {account.platform === 'linkedin' ? 'in' : account.platform === 'x' ? '𝕏' : '📷'}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white truncate">
                      {account.account_name || account.account_handle}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                      Connected
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-500">
                    <span>{config.name}</span>
                    {account.account_handle && (
                      <>
                        <span>•</span>
                        <span>@{account.account_handle}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Disconnect */}
                {!selectable && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      disconnectAccount(account.buffer_profile_id);
                    }}
                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Disconnect"
                  >
                    <Unlink className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Help Text */}
      <p className="text-xs text-zinc-600 text-center">
        Connect more accounts in{' '}
        <a
          href="https://buffer.com/app"
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-500 hover:text-emerald-400"
        >
          Buffer Dashboard
        </a>
        , then click Sync
      </p>
    </div>
  );
}
