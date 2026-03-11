'use client';

// ============================================
// API Keys Management Component - Premium Design
// ============================================

import React, { useState, useEffect } from 'react';
import {
  Key,
  Plus,
  Check,
  X,
  Eye,
  EyeOff,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Trash2,
  Settings2,
  Zap,
  Shield,
  Sparkles
} from 'lucide-react';

interface ApiKeyType {
  name: string;
  displayName: string;
  description: string;
  required: boolean;
  placeholder: string;
  helpUrl: string | null;
  isOAuth?: boolean;
  icon?: string;
  gradient?: string;
}

interface StoredApiKey {
  id: string;
  key_name: string;
  key_value: string;
  display_name: string;
  agent_id: string | null;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

interface TestResult {
  success: boolean;
  message: string;
}

const API_KEY_TYPES: ApiKeyType[] = [
  {
    name: 'groq',
    displayName: 'Groq',
    description: 'Lightning-fast AI inference',
    required: true,
    placeholder: 'gsk_...',
    helpUrl: 'https://console.groq.com/keys',
    gradient: 'from-orange-500 to-red-600',
  },
  {
    name: 'perplexity',
    displayName: 'Perplexity',
    description: 'Real-time web intelligence',
    required: true,
    placeholder: 'pplx-...',
    helpUrl: 'https://www.perplexity.ai/settings/api',
    gradient: 'from-cyan-500 to-blue-600',
  },
  {
    name: 'fal_ai',
    displayName: 'Fal.ai Flux',
    description: 'Professional image generation',
    required: true,
    placeholder: 'xxxxxxxx-xxxx-...',
    helpUrl: 'https://fal.ai/dashboard/keys',
    gradient: 'from-purple-500 to-pink-600',
  },
  {
    name: 'buffer',
    displayName: 'Buffer',
    description: 'Multi-platform publishing',
    required: true,
    placeholder: '1/xxxxxxxxxx',
    helpUrl: 'https://buffer.com/developers/api',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    name: 'cloudinary_cloud_name',
    displayName: 'Cloudinary Name',
    description: 'Cloud media storage',
    required: true,
    placeholder: 'your-cloud-name',
    helpUrl: 'https://cloudinary.com/console',
    gradient: 'from-yellow-500 to-orange-600',
  },
  {
    name: 'cloudinary_api_key',
    displayName: 'Cloudinary Key',
    description: 'API authentication',
    required: true,
    placeholder: '123456789012345',
    helpUrl: 'https://cloudinary.com/console',
    gradient: 'from-yellow-500 to-orange-600',
  },
  {
    name: 'cloudinary_api_secret',
    displayName: 'Cloudinary Secret',
    description: 'Secure API access',
    required: true,
    placeholder: 'xxxxxxxxxxxxxx',
    helpUrl: 'https://cloudinary.com/console',
    gradient: 'from-yellow-500 to-orange-600',
  },
  {
    name: 'telegram_bot_token',
    displayName: 'Telegram Bot',
    description: 'Command & control interface',
    required: false,
    placeholder: '123456789:ABCdef...',
    helpUrl: 'https://core.telegram.org/bots#botfather',
    gradient: 'from-sky-400 to-blue-500',
  },
  {
    name: 'x_bearer_token',
    displayName: 'X / Twitter',
    description: 'Trending topics access',
    required: false,
    placeholder: 'AAAAAAAAAAAAAAAAAAAAAx...',
    helpUrl: 'https://developer.twitter.com/en/portal/dashboard',
    gradient: 'from-zinc-600 to-zinc-800',
  },
  {
    name: 'calendly',
    displayName: 'Calendly',
    description: 'Smart scheduling',
    required: false,
    placeholder: 'eyJhbGciOiJIUzI1NiIs...',
    helpUrl: 'https://calendly.com/integrations/api_webhooks',
    gradient: 'from-blue-400 to-cyan-500',
  },
  {
    name: 'google_drive',
    displayName: 'Google Drive',
    description: 'Content learning & RAG',
    required: false,
    placeholder: 'OAuth (use connect)',
    helpUrl: null,
    isOAuth: true,
    gradient: 'from-green-500 to-emerald-600',
  },
  {
    name: 'gmail',
    displayName: 'Gmail',
    description: 'Email automation',
    required: false,
    placeholder: 'OAuth (use connect)',
    helpUrl: null,
    isOAuth: true,
    gradient: 'from-red-500 to-rose-600',
  },
];

export default function ApiKeysPanel() {
  const [storedKeys, setStoredKeys] = useState<StoredApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [newKeyValues, setNewKeyValues] = useState<Record<string, string>>({});
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/agents/api-keys');
      const data = await response.json();

      if (data.success) {
        setStoredKeys(data.data);
      } else {
        setError(data.error || 'Failed to fetch API keys');
      }
    } catch (err) {
      setError('Failed to fetch API keys');
    } finally {
      setLoading(false);
    }
  };

  const getStoredKey = (keyName: string): StoredApiKey | undefined => {
    return storedKeys.find(k => k.key_name === keyName && k.agent_id === null);
  };

  const isKeyConfigured = (keyName: string): boolean => {
    return !!getStoredKey(keyName);
  };

  const handleSaveKey = async (keyName: string) => {
    const value = newKeyValues[keyName];
    if (!value || !value.trim()) return;

    setSaving(prev => ({ ...prev, [keyName]: true }));
    setError(null);

    try {
      const existingKey = getStoredKey(keyName);
      const method = existingKey ? 'PUT' : 'POST';
      const body = existingKey
        ? { id: existingKey.id, key_value: value.trim() }
        : { key_name: keyName, key_value: value.trim() };

      const response = await fetch('/api/agents/api-keys', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        await fetchApiKeys();
        setNewKeyValues(prev => ({ ...prev, [keyName]: '' }));
        setEditingKey(null);
        await testKey(keyName, value.trim());
      } else {
        setError(data.error || 'Failed to save API key');
      }
    } catch (err) {
      setError('Failed to save API key');
    } finally {
      setSaving(prev => ({ ...prev, [keyName]: false }));
    }
  };

  const handleDeleteKey = async (keyName: string) => {
    const existingKey = getStoredKey(keyName);
    if (!existingKey) return;

    if (!confirm(`Are you sure you want to delete the ${keyName} API key?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/agents/api-keys?id=${existingKey.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await fetchApiKeys();
        setTestResults(prev => {
          const newResults = { ...prev };
          delete newResults[keyName];
          return newResults;
        });
      } else {
        setError(data.error || 'Failed to delete API key');
      }
    } catch (err) {
      setError('Failed to delete API key');
    }
  };

  const testKey = async (keyName: string, keyValue?: string) => {
    setTesting(prev => ({ ...prev, [keyName]: true }));

    try {
      const existingKey = getStoredKey(keyName);
      const body = keyValue
        ? { key_name: keyName, key_value: keyValue }
        : { key_id: existingKey?.id };

      const response = await fetch('/api/agents/api-keys/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      setTestResults(prev => ({ ...prev, [keyName]: data }));
    } catch (err) {
      setTestResults(prev => ({
        ...prev,
        [keyName]: { success: false, message: 'Test failed' }
      }));
    } finally {
      setTesting(prev => ({ ...prev, [keyName]: false }));
    }
  };

  const requiredKeys = API_KEY_TYPES.filter(k => k.required);
  const optionalKeys = API_KEY_TYPES.filter(k => !k.required);
  const configuredCount = API_KEY_TYPES.filter(k => isKeyConfigured(k.name)).length;
  const requiredConfigured = requiredKeys.filter(k => isKeyConfigured(k.name)).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-zinc-800 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
          </div>
          <p className="mt-4 text-zinc-400">Loading API connections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Progress */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border border-zinc-800 p-6">
        <div className="absolute inset-0 bg-grid-white/[0.02]"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

        <div className="relative flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/20">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">API Connections</h2>
              <p className="text-zinc-400">
                Connect your services to power the automation engine
              </p>
            </div>
          </div>
          <button
            onClick={fetchApiKeys}
            className="p-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all hover:scale-105"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="relative mt-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-zinc-400">Setup Progress</span>
            <span className="text-white font-semibold">{requiredConfigured}/{requiredKeys.length} Required</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${(requiredConfigured / requiredKeys.length) * 100}%` }}
            ></div>
          </div>
          {requiredConfigured === requiredKeys.length && (
            <div className="flex items-center gap-2 mt-3 text-emerald-400">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">All required APIs connected!</span>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3 animate-in slide-in-from-top-2">
          <div className="p-1 bg-red-500/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <div className="flex-1">
            <p className="text-red-400 font-medium">Connection Error</p>
            <p className="text-red-300/70 text-sm">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-300 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Required APIs */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/20">
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Required Services</h3>
            <p className="text-sm text-zinc-500">Essential APIs for core functionality</p>
          </div>
        </div>

        <div className="grid gap-3">
          {requiredKeys.map(keyType => (
            <ApiKeyCard
              key={keyType.name}
              keyType={keyType}
              storedKey={getStoredKey(keyType.name)}
              isEditing={editingKey === keyType.name}
              newValue={newKeyValues[keyType.name] || ''}
              showValue={showValues[keyType.name] || false}
              testResult={testResults[keyType.name]}
              isTesting={testing[keyType.name] || false}
              isSaving={saving[keyType.name] || false}
              onEdit={() => setEditingKey(keyType.name)}
              onCancel={() => {
                setEditingKey(null);
                setNewKeyValues(prev => ({ ...prev, [keyType.name]: '' }));
              }}
              onValueChange={(value) => setNewKeyValues(prev => ({ ...prev, [keyType.name]: value }))}
              onToggleShow={() => setShowValues(prev => ({ ...prev, [keyType.name]: !prev[keyType.name] }))}
              onSave={() => handleSaveKey(keyType.name)}
              onTest={() => testKey(keyType.name)}
              onDelete={() => handleDeleteKey(keyType.name)}
            />
          ))}
        </div>
      </section>

      {/* Optional APIs */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-700">
            <Plus className="w-4 h-4 text-zinc-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Optional Services</h3>
            <p className="text-sm text-zinc-500">Additional integrations for enhanced features</p>
          </div>
        </div>

        <div className="grid gap-3">
          {optionalKeys.map(keyType => (
            <ApiKeyCard
              key={keyType.name}
              keyType={keyType}
              storedKey={getStoredKey(keyType.name)}
              isEditing={editingKey === keyType.name}
              newValue={newKeyValues[keyType.name] || ''}
              showValue={showValues[keyType.name] || false}
              testResult={testResults[keyType.name]}
              isTesting={testing[keyType.name] || false}
              isSaving={saving[keyType.name] || false}
              onEdit={() => setEditingKey(keyType.name)}
              onCancel={() => {
                setEditingKey(null);
                setNewKeyValues(prev => ({ ...prev, [keyType.name]: '' }));
              }}
              onValueChange={(value) => setNewKeyValues(prev => ({ ...prev, [keyType.name]: value }))}
              onToggleShow={() => setShowValues(prev => ({ ...prev, [keyType.name]: !prev[keyType.name] }))}
              onSave={() => handleSaveKey(keyType.name)}
              onTest={() => testKey(keyType.name)}
              onDelete={() => handleDeleteKey(keyType.name)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

// ============================================
// Premium API Key Card Component
// ============================================

interface ApiKeyCardProps {
  keyType: ApiKeyType;
  storedKey?: StoredApiKey;
  isEditing: boolean;
  newValue: string;
  showValue: boolean;
  testResult?: TestResult;
  isTesting: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onValueChange: (value: string) => void;
  onToggleShow: () => void;
  onSave: () => void;
  onTest: () => void;
  onDelete: () => void;
}

function ApiKeyCard({
  keyType,
  storedKey,
  isEditing,
  newValue,
  showValue,
  testResult,
  isTesting,
  isSaving,
  onEdit,
  onCancel,
  onValueChange,
  onToggleShow,
  onSave,
  onTest,
  onDelete,
}: ApiKeyCardProps) {
  const isConfigured = !!storedKey;
  const isSuccess = testResult?.success;
  const isFailed = testResult && !testResult.success;

  return (
    <div
      className={`
        group relative overflow-hidden rounded-xl border transition-all duration-300
        ${isConfigured
          ? isSuccess
            ? 'bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/50'
            : isFailed
              ? 'bg-red-500/5 border-red-500/30 hover:border-red-500/50'
              : 'bg-zinc-900/50 border-zinc-700 hover:border-zinc-600'
          : 'bg-zinc-900/30 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50'
        }
      `}
    >
      {/* Gradient accent line */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${keyType.gradient} opacity-0 group-hover:opacity-100 transition-opacity`}></div>

      <div className="p-4">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className={`
            relative flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center
            ${isConfigured
              ? `bg-gradient-to-br ${keyType.gradient} shadow-lg`
              : 'bg-zinc-800 border border-zinc-700'
            }
          `}>
            {isConfigured ? (
              <Check className="w-5 h-5 text-white" />
            ) : (
              <Key className="w-5 h-5 text-zinc-500" />
            )}

            {/* Status indicator */}
            {isConfigured && (
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-zinc-900 flex items-center justify-center
                ${isSuccess ? 'bg-emerald-500' : isFailed ? 'bg-red-500' : 'bg-zinc-600'}
              `}>
                {isTesting ? (
                  <Loader2 className="w-2.5 h-2.5 text-white animate-spin" />
                ) : isSuccess ? (
                  <Check className="w-2.5 h-2.5 text-white" />
                ) : isFailed ? (
                  <X className="w-2.5 h-2.5 text-white" />
                ) : null}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-white">{keyType.displayName}</h4>
              {isConfigured && testResult && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${isSuccess ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                  {isSuccess ? 'Connected' : 'Error'}
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-500">{keyType.description}</p>
            {testResult && !isSuccess && (
              <p className="text-xs text-red-400 mt-1">{testResult.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {keyType.helpUrl && (
              <a
                href={keyType.helpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                title="Get API Key"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            {isConfigured && !isEditing && (
              <>
                <button
                  onClick={onTest}
                  disabled={isTesting}
                  className="p-2.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-all disabled:opacity-50"
                  title="Test Connection"
                >
                  {isTesting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={onEdit}
                  className="p-2.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                  title="Edit"
                >
                  <Settings2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onDelete}
                  className="p-2.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}

            {!isConfigured && !isEditing && !keyType.isOAuth && (
              <button
                onClick={onEdit}
                className={`px-4 py-2 bg-gradient-to-r ${keyType.gradient} text-white text-sm font-medium rounded-lg transition-all hover:shadow-lg hover:scale-[1.02] flex items-center gap-2`}
              >
                <Plus className="w-4 h-4" />
                Connect
              </button>
            )}

            {keyType.isOAuth && !isConfigured && (
              <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-all border border-zinc-700 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Authorize
              </button>
            )}
          </div>
        </div>

        {/* Edit Mode */}
        {isEditing && (
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  type={showValue ? 'text' : 'password'}
                  value={newValue}
                  onChange={(e) => onValueChange(e.target.value)}
                  placeholder={keyType.placeholder}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm pr-12 transition-all"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={onToggleShow}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-800 transition-all"
                >
                  {showValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={onSave}
                disabled={isSaving || !newValue.trim()}
                className={`px-5 py-3 bg-gradient-to-r ${keyType.gradient} text-white font-medium rounded-xl transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Save
              </button>
              <button
                onClick={onCancel}
                className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-all border border-zinc-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
