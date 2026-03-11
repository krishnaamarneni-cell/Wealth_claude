'use client';

// ============================================
// API Keys Management Component
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
  Settings2
} from 'lucide-react';

interface ApiKeyType {
  name: string;
  displayName: string;
  description: string;
  required: boolean;
  placeholder: string;
  helpUrl: string | null;
  isOAuth?: boolean;
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
    displayName: 'Groq API',
    description: 'AI content generation',
    required: true,
    placeholder: 'gsk_...',
    helpUrl: 'https://console.groq.com/keys',
  },
  {
    name: 'perplexity',
    displayName: 'Perplexity API',
    description: 'Web research & trends',
    required: true,
    placeholder: 'pplx-...',
    helpUrl: 'https://www.perplexity.ai/settings/api',
  },
  {
    name: 'fal_ai',
    displayName: 'Fal.ai (Flux)',
    description: 'Image generation',
    required: true,
    placeholder: 'xxxxxxxx-xxxx-...',
    helpUrl: 'https://fal.ai/dashboard/keys',
  },
  {
    name: 'buffer',
    displayName: 'Buffer',
    description: 'Social media posting',
    required: true,
    placeholder: '1/xxxxxxxxxx',
    helpUrl: 'https://buffer.com/developers/api',
  },
  {
    name: 'cloudinary_cloud_name',
    displayName: 'Cloudinary Cloud Name',
    description: 'Image hosting',
    required: true,
    placeholder: 'your-cloud-name',
    helpUrl: 'https://cloudinary.com/console',
  },
  {
    name: 'cloudinary_api_key',
    displayName: 'Cloudinary API Key',
    description: 'Image hosting',
    required: true,
    placeholder: '123456789012345',
    helpUrl: 'https://cloudinary.com/console',
  },
  {
    name: 'cloudinary_api_secret',
    displayName: 'Cloudinary API Secret',
    description: 'Image hosting',
    required: true,
    placeholder: 'xxxxxxxxxxxxxx',
    helpUrl: 'https://cloudinary.com/console',
  },
  {
    name: 'telegram_bot_token',
    displayName: 'Telegram Bot Token',
    description: 'Bot commands',
    required: false,
    placeholder: '123456789:ABCdef...',
    helpUrl: 'https://core.telegram.org/bots#botfather',
  },
  {
    name: 'x_bearer_token',
    displayName: 'X Bearer Token',
    description: 'Trending topics',
    required: false,
    placeholder: 'AAAAAAAAAAAAAAAAAAAAAx...',
    helpUrl: 'https://developer.twitter.com/en/portal/dashboard',
  },
  {
    name: 'calendly',
    displayName: 'Calendly',
    description: 'Meeting scheduling',
    required: false,
    placeholder: 'eyJhbGciOiJIUzI1NiIs...',
    helpUrl: 'https://calendly.com/integrations/api_webhooks',
  },
  {
    name: 'google_drive',
    displayName: 'Google Drive',
    description: 'Winning content RAG',
    required: false,
    placeholder: 'OAuth (use connect)',
    helpUrl: null,
    isOAuth: true,
  },
  {
    name: 'gmail',
    displayName: 'Gmail',
    description: 'Email management',
    required: false,
    placeholder: 'OAuth (use connect)',
    helpUrl: null,
    isOAuth: true,
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

  // Fetch stored keys on mount
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

        // Auto-test the key
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

  const getStatusColor = (keyName: string) => {
    const result = testResults[keyName];
    if (!result) return 'bg-zinc-800';
    return result.success ? 'bg-emerald-500/20' : 'bg-red-500/20';
  };

  const getStatusIcon = (keyName: string) => {
    const result = testResults[keyName];
    if (testing[keyName]) {
      return <Loader2 className="w-4 h-4 animate-spin text-blue-400" />;
    }
    if (!result) return null;
    return result.success
      ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
      : <AlertCircle className="w-4 h-4 text-red-400" />;
  };

  const requiredKeys = API_KEY_TYPES.filter(k => k.required);
  const optionalKeys = API_KEY_TYPES.filter(k => !k.required);
  const configuredCount = API_KEY_TYPES.filter(k => isKeyConfigured(k.name)).length;
  const requiredConfigured = requiredKeys.filter(k => isKeyConfigured(k.name)).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-400" />
            API Connections
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            {requiredConfigured}/{requiredKeys.length} required • {configuredCount}/{API_KEY_TYPES.length} total
          </p>
        </div>
        <button
          onClick={fetchApiKeys}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-medium">Error</p>
            <p className="text-red-300/80 text-sm">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Required APIs */}
      <div>
        <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
          Required APIs
        </h3>
        <div className="grid gap-3">
          {requiredKeys.map(keyType => (
            <ApiKeyRow
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
              getStatusColor={() => getStatusColor(keyType.name)}
              getStatusIcon={() => getStatusIcon(keyType.name)}
            />
          ))}
        </div>
      </div>

      {/* Optional APIs */}
      <div>
        <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-zinc-500 rounded-full"></span>
          Optional APIs
        </h3>
        <div className="grid gap-3">
          {optionalKeys.map(keyType => (
            <ApiKeyRow
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
              getStatusColor={() => getStatusColor(keyType.name)}
              getStatusIcon={() => getStatusIcon(keyType.name)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// API Key Row Component
// ============================================

interface ApiKeyRowProps {
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
  getStatusColor: () => string;
  getStatusIcon: () => React.ReactNode;
}

function ApiKeyRow({
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
  getStatusColor,
  getStatusIcon,
}: ApiKeyRowProps) {
  const isConfigured = !!storedKey;

  return (
    <div className={`rounded-xl border border-zinc-800 overflow-hidden transition-all ${getStatusColor()}`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left side - Info */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`p-2 rounded-lg ${isConfigured ? 'bg-emerald-500/20' : 'bg-zinc-800'}`}>
              {isConfigured ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Key className="w-4 h-4 text-zinc-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-white">{keyType.displayName}</h4>
                {getStatusIcon()}
              </div>
              <p className="text-sm text-zinc-400">{keyType.description}</p>
              {testResult && (
                <p className={`text-xs mt-1 ${testResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                  {testResult.message}
                </p>
              )}
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {keyType.helpUrl && (
              <a
                href={keyType.helpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
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
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
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
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Settings2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onDelete}
                  className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}

            {!isConfigured && !isEditing && !keyType.isOAuth && (
              <button
                onClick={onEdit}
                className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            )}

            {keyType.isOAuth && !isConfigured && (
              <button
                className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Connect
              </button>
            )}
          </div>
        </div>

        {/* Edit Mode */}
        {isEditing && (
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showValue ? 'text' : 'password'}
                  value={newValue}
                  onChange={(e) => onValueChange(e.target.value)}
                  placeholder={keyType.placeholder}
                  className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm pr-10"
                  autoFocus
                />
                <button
                  onClick={onToggleShow}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  {showValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={onSave}
                disabled={isSaving || !newValue.trim()}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
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
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors"
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
