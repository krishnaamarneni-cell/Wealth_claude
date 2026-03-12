'use client';

// ============================================
// Social Accounts Panel - Multiple Accounts Support
// components/agents/SocialAccountsPanel.tsx
// ============================================

import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Check,
  X,
  AlertCircle,
  Loader2,
  Unlink,
  Plus,
  Building2,
  User,
} from 'lucide-react';

interface SocialAccount {
  id: string;
  platform: 'x' | 'linkedin';
  account_id: string;
  account_name: string | null;
  account_handle: string | null;
  account_avatar_url: string | null;
  account_type: 'person' | 'organization' | null;
  is_active: boolean;
  token_expires_at: string | null;
}

const PLATFORM_CONFIG = {
  x: {
    name: 'X / Twitter',
    icon: '𝕏',
    color: 'bg-zinc-800',
    textColor: 'text-white',
    connectUrl: '/api/agents/x',
  },
  linkedin: {
    name: 'LinkedIn',
    icon: 'in',
    color: 'bg-[#0A66C2]',
    textColor: 'text-white',
    connectUrl: '/api/agents/linkedin',
  },
};

interface SocialAccountsPanelProps {
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  selectable?: boolean;
  showAddButtons?: boolean;
}

export default function SocialAccountsPanel({
  selectedIds = [],
  onSelectionChange,
  selectable = false,
  showAddButtons = true,
}: SocialAccountsPanelProps) {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/agents/social');
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

  const disconnectAccount = async (accountId: string) => {
    if (!confirm('Disconnect this account?')) return;

    setDisconnecting(accountId);
    try {
      const response = await fetch(`/api/agents/social?id=${accountId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setAccounts(prev => prev.filter(a => a.id !== accountId));
        if (onSelectionChange) {
          onSelectionChange(selectedIds.filter(id => id !== accountId));
        }
      } else {
        setError(data.error || 'Failed to disconnect');
      }
    } catch (err) {
      setError('Failed to disconnect account');
    } finally {
      setDisconnecting(null);
    }
  };

  const toggleSelection = (accountId: string) => {
    if (!selectable || !onSelectionChange) return;

    if (selectedIds.includes(accountId)) {
      onSelectionChange(selectedIds.filter(id => id !== accountId));
    } else {
      onSelectionChange([...selectedIds, accountId]);
    }
  };

  const connectAccount = (platform: 'x' | 'linkedin') => {
    window.location.href = PLATFORM_CONFIG[platform].connectUrl;
  };

  const isTokenExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) <= new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
      </div>
    );
  }

  const xAccounts = accounts.filter(a => a.platform === 'x');
  const linkedinAccounts = accounts.filter(a => a.platform === 'linkedin');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Connected Accounts</h3>
          <p className="text-sm text-zinc-500">
            {accounts.length} account{accounts.length !== 1 ? 's' : ''} connected
          </p>
        </div>
        <button
          onClick={fetchAccounts}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
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

      {/* X / Twitter Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold">
              𝕏
            </div>
            <span className="font-medium text-white">X / Twitter</span>
            <span className="text-xs text-zinc-500">({xAccounts.length} connected)</span>
          </div>
          {showAddButtons && (
            <button
              onClick={() => connectAccount('x')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Account
            </button>
          )}
        </div>

        {xAccounts.length === 0 ? (
          <div className="p-4 border border-dashed border-zinc-700 rounded-xl text-center">
            <p className="text-sm text-zinc-500">No X accounts connected</p>
          </div>
        ) : (
          <div className="space-y-2">
            {xAccounts.map(account => (
              <AccountCard
                key={account.id}
                account={account}
                config={PLATFORM_CONFIG.x}
                selectable={selectable}
                isSelected={selectedIds.includes(account.id)}
                isExpired={isTokenExpired(account.token_expires_at)}
                isDisconnecting={disconnecting === account.id}
                onToggleSelect={() => toggleSelection(account.id)}
                onDisconnect={() => disconnectAccount(account.id)}
                onReconnect={() => connectAccount('x')}
              />
            ))}
          </div>
        )}
      </div>

      {/* LinkedIn Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#0A66C2] flex items-center justify-center text-white font-bold text-sm">
              in
            </div>
            <span className="font-medium text-white">LinkedIn</span>
            <span className="text-xs text-zinc-500">({linkedinAccounts.length} connected)</span>
          </div>
          {showAddButtons && (
            <button
              onClick={() => connectAccount('linkedin')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Account
            </button>
          )}
        </div>

        {linkedinAccounts.length === 0 ? (
          <div className="p-4 border border-dashed border-zinc-700 rounded-xl text-center">
            <p className="text-sm text-zinc-500">No LinkedIn accounts connected</p>
          </div>
        ) : (
          <div className="space-y-2">
            {linkedinAccounts.map(account => (
              <AccountCard
                key={account.id}
                account={account}
                config={PLATFORM_CONFIG.linkedin}
                selectable={selectable}
                isSelected={selectedIds.includes(account.id)}
                isExpired={isTokenExpired(account.token_expires_at)}
                isDisconnecting={disconnecting === account.id}
                onToggleSelect={() => toggleSelection(account.id)}
                onDisconnect={() => disconnectAccount(account.id)}
                onReconnect={() => connectAccount('linkedin')}
              />
            ))}
          </div>
        )}
      </div>

      {/* Help Text */}
      <p className="text-xs text-zinc-600 text-center">
        Connect multiple accounts to post to different profiles. Each agent can be assigned specific accounts.
      </p>
    </div>
  );
}

// ============================================
// Account Card Component
// ============================================

function AccountCard({
  account,
  config,
  selectable,
  isSelected,
  isExpired,
  isDisconnecting,
  onToggleSelect,
  onDisconnect,
  onReconnect,
}: {
  account: SocialAccount;
  config: typeof PLATFORM_CONFIG.x;
  selectable: boolean;
  isSelected: boolean;
  isExpired: boolean;
  isDisconnecting: boolean;
  onToggleSelect: () => void;
  onDisconnect: () => void;
  onReconnect: () => void;
}) {
  const isOrganization = account.account_type === 'organization';

  return (
    <div
      onClick={selectable ? onToggleSelect : undefined}
      className={`
        relative flex items-center gap-3 p-3 rounded-xl border transition-all
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
          w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0
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
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className={`w-10 h-10 rounded-full ${config.color} flex items-center justify-center ${config.textColor} font-bold`}>
            {config.icon}
          </div>
        )}
        {/* Type badge */}
        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center`}>
          {isOrganization ? (
            <Building2 className="w-3 h-3 text-blue-400" />
          ) : (
            <User className="w-3 h-3 text-zinc-400" />
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white truncate">
            {account.account_name || account.account_handle || 'Unknown'}
          </span>
          {isOrganization && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
              Company
            </span>
          )}
          {isExpired && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
              Expired
            </span>
          )}
        </div>
        {account.account_handle && (
          <p className="text-sm text-zinc-500 truncate">@{account.account_handle}</p>
        )}
      </div>

      {/* Actions */}
      {!selectable && (
        <div className="flex items-center gap-1">
          {isExpired && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReconnect();
              }}
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs rounded-lg transition-all"
            >
              Reconnect
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDisconnect();
            }}
            disabled={isDisconnecting}
            className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
            title="Disconnect"
          >
            {isDisconnecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Unlink className="w-4 h-4" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
