'use client';

import { useEffect, useState } from 'react';
import { useAgentStore, type CustomHeader } from '@/lib/agentStore';

interface AgentInfo {
  id: string;
  name: string;
  url: string;
  status: 'online' | 'offline' | 'checking';
  description: string;
  type: 'agent' | 'mcp' | 'unknown';
  version?: string;
  capabilities?: string[];
}

interface AgentInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AgentInfoModal({ isOpen, onClose }: AgentInfoModalProps) {
  const { agentUrls, addAgentUrl, removeAgentUrl, updateAgentHeaders } = useAgentStore();
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingHeaders, setEditingHeaders] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAgentInfo();
    }
  }, [isOpen, agentUrls]);

  const fetchAgentInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/agents/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urls: agentUrls }),
      });
      const data = await response.json();
      setAgents(data.agents);
    } catch (error) {
      console.error('Failed to fetch agent info:', error);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUrl = () => {
    if (newUrl.trim()) {
      addAgentUrl(newUrl.trim());
      setNewUrl('');
      setShowAddForm(false);
    }
  };

  const handleRemoveAgent = (id: string) => {
    if (confirm('このエージェントを削除してもよろしいですか？')) {
      removeAgentUrl(id);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">
            接続中のエージェント・MCPサーバー
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Agent List */}
              <div className="space-y-3">
                {agents.map((agent) => {
                  const agentUrl = agentUrls.find(a => a.id === agent.id);
                  return (
                    <AgentCard
                      key={agent.id}
                      agent={agent}
                      headers={agentUrl?.headers || []}
                      isEditingHeaders={editingHeaders === agent.id}
                      onRemove={() => handleRemoveAgent(agent.id)}
                      onEditHeaders={() => setEditingHeaders(agent.id)}
                      onSaveHeaders={(headers) => {
                        updateAgentHeaders(agent.id, headers);
                        setEditingHeaders(null);
                      }}
                      onCancelEdit={() => setEditingHeaders(null)}
                    />
                  );
                })}
              </div>

              {/* Add New Agent Form */}
              {showAddForm ? (
                <div className="border-2 border-dashed border-blue-300 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">新しいエージェントを追加</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      placeholder="http://agent-url:8000"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
                    />
                    <button
                      onClick={handleAddUrl}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      追加
                    </button>
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        setNewUrl('');
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50 transition-colors text-gray-600 hover:text-blue-600"
                >
                  + エージェントを追加
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-between items-center bg-gray-50">
          <button
            onClick={fetchAgentInfo}
            disabled={loading}
            className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 transition-colors"
          >
            🔄 再読み込み
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}

interface AgentCardProps {
  agent: AgentInfo;
  headers: CustomHeader[];
  isEditingHeaders: boolean;
  onRemove: () => void;
  onEditHeaders: () => void;
  onSaveHeaders: (headers: CustomHeader[]) => void;
  onCancelEdit: () => void;
}

function AgentCard({
  agent,
  headers,
  isEditingHeaders,
  onRemove,
  onEditHeaders,
  onSaveHeaders,
  onCancelEdit,
}: AgentCardProps) {
  const [editedHeaders, setEditedHeaders] = useState<CustomHeader[]>(headers);

  useEffect(() => {
    setEditedHeaders(headers);
  }, [headers]);

  const statusColor = {
    online: 'bg-green-500',
    offline: 'bg-red-500',
    checking: 'bg-yellow-500',
  }[agent.status];

  const statusText = {
    online: 'オンライン',
    offline: 'オフライン',
    checking: '確認中...',
  }[agent.status];

  const typeColor = {
    agent: 'bg-purple-100 text-purple-700',
    mcp: 'bg-green-100 text-green-700',
    unknown: 'bg-gray-100 text-gray-700',
  }[agent.type];

  const typeText = {
    agent: 'エージェント',
    mcp: 'MCP',
    unknown: '不明',
  }[agent.type];

  const handleAddHeader = () => {
    setEditedHeaders([...editedHeaders, { key: '', value: '' }]);
  };

  const handleRemoveHeader = (index: number) => {
    setEditedHeaders(editedHeaders.filter((_, i) => i !== index));
  };

  const handleHeaderChange = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...editedHeaders];
    newHeaders[index][field] = value;
    setEditedHeaders(newHeaders);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="font-medium text-gray-800">{agent.name}</h4>
            <span className={`text-xs px-2 py-1 rounded-full ${typeColor}`}>
              {typeText}
            </span>
            <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
              agent.status === 'online' ? 'bg-green-100 text-green-700' :
              agent.status === 'offline' ? 'bg-red-100 text-red-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`}></span>
              {statusText}
            </span>
            {agent.version && (
              <span className="text-xs text-gray-500">v{agent.version}</span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-2">{agent.description}</p>
          {agent.capabilities && agent.capabilities.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {agent.capabilities.map((capability, idx) => (
                <span key={idx} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                  {capability}
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500 font-mono">{agent.url}</p>
        </div>
        <div className="flex gap-2 ml-4">
          <button
            onClick={onEditHeaders}
            className="text-gray-400 hover:text-blue-600 transition-colors"
            title="カスタムヘッダーを編集"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            onClick={onRemove}
            className="text-gray-400 hover:text-red-600 transition-colors"
            title="削除"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Custom Headers Section */}
      {isEditingHeaders && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-sm font-medium text-gray-700">カスタムヘッダー</h5>
            <button
              onClick={handleAddHeader}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              + ヘッダー追加
            </button>
          </div>
          <div className="space-y-2">
            {editedHeaders.map((header, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={header.key}
                  onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
                  placeholder="Header-Name"
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={header.value}
                  onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
                  placeholder="Header Value"
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={() => handleRemoveHeader(index)}
                  className="text-gray-400 hover:text-red-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => onSaveHeaders(editedHeaders.filter(h => h.key && h.value))}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              保存
            </button>
            <button
              onClick={onCancelEdit}
              className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* Display current headers when not editing */}
      {!isEditingHeaders && headers.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <h5 className="text-xs font-medium text-gray-700 mb-1">カスタムヘッダー:</h5>
          <div className="space-y-1">
            {headers.map((header, idx) => (
              <div key={idx} className="text-xs text-gray-600 font-mono">
                <span className="text-blue-600">{header.key}</span>: {header.value}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
