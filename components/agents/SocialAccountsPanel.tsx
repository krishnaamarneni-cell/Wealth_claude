'use client';

// ============================================
// Social Accounts Panel - WealthClaude Style
// components/agents/SocialAccountsPanel.tsx
// ============================================

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  RefreshCw,
  Check,
  X,
  AlertCircle,
  Loader2,
  Link2,
  Unlink,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';

interface SocialAccount {
  id: string;
  platform: 'x' | 'linkedin';
  account_id: string;
  account_name: string | null;
  account_handle: string | null;
  account_avatar_url: string | null;
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
}

const ERROR_MESSAGES: Record<string, string> = {
  unauthorized: 'You must be logged in to connect social accounts.',
  x_not_configured: 'X/Twitter credentials are not configured. Check X_CLIENT_ID and X_CLIENT_SECRET env vars.',
  x_oauth_failed: 'Failed to start X/Twitter OAuth. Please try again.',
  linkedin_not_configured: 'LinkedIn credentials are not configured. Check LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET env vars.',
  linkedin_oauth_failed: 'Failed to start LinkedIn OAuth. Please try again.',
  x_connected: 'X/Twitter account connected successfully!',
  linkedin_connected: 'LinkedIn account connected successfully!',
};

export default function SocialAccountsPanel({
  selectedIds = [],
  onSelectionChange,
  selectable = false,
}: SocialAccountsPanelProps) {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Read error/success from URL params (set by OAuth callbacks)
    const errorParam = searchParams?.get('error');
    const successParam = searchParams?.get('connected');
    if (errorParam) {
      setError(ERROR_MESSAGES[errorParam] || `OAuth error: ${errorParam}`);
    }
    if (successParam) {
      setSuccess(ERROR_MESSAGES[`${successParam}_connected`] || `${successParam} connected!`);
    }
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

  const xAccount = accounts.find(a => a.platform === 'x');
  const linkedinAccount = accounts.find(a => a.platform === 'linkedin');

  return (
    <div className="space-y-4">
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

      {/* Success */}
      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-emerald-300">{success}</span>
          <button onClick={() => setSuccess(null)} className="ml-auto text-emerald-400 hover:text-emerald-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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

      {/* Platform Cards */}
      <div className="grid gap-3">
        {/* X / Twitter */}
        <PlatformCard
          platform="x"
          account={xAccount}
          config={PLATFORM_CONFIG.x}
          selectable={selectable}
          isSelected={xAccount ? selectedIds.includes(xAccount.id) : false}
          isExpired={xAccount ? isTokenExpired(xAccount.token_expires_at) : false}
          onConnect={() => connectAccount('x')}
          onDisconnect={() => xAccount && disconnectAccount(xAccount.id)}
          onToggleSelect={() => xAccount && toggleSelection(xAccount.id)}
        />

        {/* LinkedIn */}
        <PlatformCard
          platform="linkedin"
          account={linkedinAccount}
          config={PLATFORM_CONFIG.linkedin}
          selectable={selectable}
          isSelected={linkedinAccount ? selectedIds.includes(linkedinAccount.id) : false}
          isExpired={linkedinAccount ? isTokenExpired(linkedinAccount.token_expires_at) : false}
          onConnect={() => connectAccount('linkedin')}
          onDisconnect={() => linkedinAccount && disconnectAccount(linkedinAccount.id)}
          onToggleSelect={() => linkedinAccount && toggleSelection(linkedinAccount.id)}
        />
      </div>

      {/* Help Text */}
      <p className="text-xs text-zinc-600 text-center">
        Click Connect to authorize posting to your accounts
      </p>
    </div>
  );
}

// ============================================
// Platform Card Component
// ============================================

function PlatformCard({
  platform,
  account,
  config,
  selectable,
  isSelected,
  isExpired,
  onConnect,
  onDisconnect,
  onToggleSelect,
}: {
  platform: 'x' | 'linkedin';
  account: SocialAccount | undefined;
  config: typeof PLATFORM_CONFIG.x;
  selectable: boolean;
  isSelected: boolean;
  isExpired: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onToggleSelect: () => void;
}) {
  const isConnected = !!account && !isExpired;

  return (
    <div
      onClick={selectable && isConnected ? onToggleSelect : undefined}
      className={`
        relative flex items-center gap-4 p-4 rounded-xl border transition-all
        ${selectable && isConnected ? 'cursor-pointer' : ''}
        ${isSelected
          ? 'bg-emerald-500/10 border-emerald-500/50'
          : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
        }
      `}
    >
      {/* Selection Checkbox */}
      {selectable && isConnected && (
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

      {/* Platform Icon */}
      <div className="relative flex-shrink-0">
        {account?.account_avatar_url ? (
          <img
            src={account.account_avatar_url}
            alt={account.account_name || ''}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className={`w-12 h-12 rounded-full ${config.color} flex items-center justify-center ${config.textColor} font-bold text-lg`}>
            {config.icon}
          </div>
        )}
        {/* Platform badge */}
        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${config.color} flex items-center justify-center text-[10px] ${config.textColor} border-2 border-zinc-900`}>
          {config.icon}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white">
            {config.name}
          </span>
          {isConnected && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
              Connected
            </span>
          )}
          {isExpired && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
              Expired
            </span>
          )}
        </div>
        {account ? (
          <div className="text-sm text-zinc-500">
            {account.account_name || account.account_handle}
            {account.account_handle && account.account_name && (
              <span> • @{account.account_handle}</span>
            )}
          </div>
        ) : (
          <div className="text-sm text-zinc-600">Not connected</div>
        )}
      </div>

      {/* Action Button */}
      {!selectable && (
        <div>
          {isConnected ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDisconnect();
              }}
              className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
              title="Disconnect"
            >
              <Unlink className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onConnect}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-all"
            >
              Connect
            </button>
          )}
        </div>
      )}
    </div>
  );
}
