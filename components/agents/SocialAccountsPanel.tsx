'use client';

// ============================================
// Social Accounts Panel - Shows Personal + Company Pages
// components/agents/SocialAccountsPanel.tsx
// ============================================

import { useState, useEffect } from 'react';
import { Linkedin, Twitter, Building2, User, Trash2, RefreshCw } from 'lucide-react';

interface SocialAccount {
  id: string;
  platform: 'x' | 'linkedin';
  account_id: string;
  account_name: string;
  account_handle: string;
  account_type: 'person' | 'organization';
  is_active: boolean;
  token_expires_at?: string;
  updated_at: string;
}

export default function SocialAccountsPanel() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/agents/social');
      const data = await res.json();
      if (data.success) {
        setAccounts(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectPlatform = (platform: 'x' | 'linkedin') => {
    setConnecting(platform);
    window.location.href = `/api/agents/${platform}`;
  };

  const disconnectAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to disconnect this account?')) return;

    try {
      const res = await fetch(`/api/agents/social?id=${accountId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setAccounts(accounts.filter(a => a.id !== accountId));
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  const getAccountTypeIcon = (accountType: string) => {
    if (accountType === 'organization') {
      return <Building2 className="w-4 h-4 text-blue-400" />;
    }
    return <User className="w-4 h-4 text-gray-400" />;
  };

  const getAccountTypeLabel = (accountType: string) => {
    return accountType === 'organization' ? 'Company Page' : 'Personal';
  };

  const isTokenExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/3"></div>
          <div className="h-20 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  const linkedInAccounts = accounts.filter(a => a.platform === 'linkedin');
  const xAccounts = accounts.filter(a => a.platform === 'x');

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
      <h3 className="text-lg font-semibold text-white mb-4">Connected Accounts</h3>

      {/* LinkedIn Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Linkedin className="w-5 h-5 text-[#0A66C2]" />
            <span className="text-white font-medium">LinkedIn</span>
          </div>
          <button
            onClick={() => connectPlatform('linkedin')}
            disabled={connecting === 'linkedin'}
            className="px-3 py-1.5 bg-[#0A66C2] hover:bg-[#004182] text-white text-sm rounded-lg transition-colors disabled:opacity-50"
          >
            {connecting === 'linkedin' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : linkedInAccounts.length > 0 ? (
              'Reconnect'
            ) : (
              'Connect'
            )}
          </button>
        </div>

        {linkedInAccounts.length > 0 ? (
          <div className="space-y-2">
            {linkedInAccounts.map(account => (
              <div
                key={account.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${isTokenExpired(account.token_expires_at)
                    ? 'bg-red-900/20 border-red-800'
                    : 'bg-[#0d0d0d] border-gray-700'
                  }`}
              >
                <div className="flex items-center gap-3">
                  {getAccountTypeIcon(account.account_type)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{account.account_name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${account.account_type === 'organization'
                          ? 'bg-blue-900/50 text-blue-300'
                          : 'bg-gray-700 text-gray-300'
                        }`}>
                        {getAccountTypeLabel(account.account_type)}
                      </span>
                    </div>
                    <span className="text-gray-500 text-sm">@{account.account_handle}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isTokenExpired(account.token_expires_at) && (
                    <span className="text-red-400 text-xs">Token expired</span>
                  )}
                  {account.is_active && (
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  )}
                  <button
                    onClick={() => disconnectAccount(account.id)}
                    className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                    title="Disconnect"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No LinkedIn accounts connected</p>
        )}
      </div>

      {/* X Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Twitter className="w-5 h-5 text-white" />
            <span className="text-white font-medium">X (Twitter)</span>
          </div>
          <button
            onClick={() => connectPlatform('x')}
            disabled={connecting === 'x'}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
          >
            {connecting === 'x' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : xAccounts.length > 0 ? (
              'Reconnect'
            ) : (
              'Connect'
            )}
          </button>
        </div>

        {xAccounts.length > 0 ? (
          <div className="space-y-2">
            {xAccounts.map(account => (
              <div
                key={account.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${isTokenExpired(account.token_expires_at)
                    ? 'bg-red-900/20 border-red-800'
                    : 'bg-[#0d0d0d] border-gray-700'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-white font-medium">{account.account_name}</span>
                    <span className="text-gray-500 text-sm ml-2">@{account.account_handle}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isTokenExpired(account.token_expires_at) && (
                    <span className="text-red-400 text-xs">Token expired</span>
                  )}
                  {account.is_active && (
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  )}
                  <button
                    onClick={() => disconnectAccount(account.id)}
                    className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                    title="Disconnect"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No X accounts connected</p>
        )}
      </div>

      {/* Help text */}
      <div className="mt-6 p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
        <p className="text-blue-300 text-sm">
          💡 <strong>Tip:</strong> Connect LinkedIn to see both your personal profile and any Company Pages you manage.
          You can link different accounts to different agents.
        </p>
      </div>
    </div>
  );
}
