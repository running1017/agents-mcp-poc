import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CustomHeader {
  key: string;
  value: string;
}

export interface AgentUrl {
  id: string;
  url: string;
  headers?: CustomHeader[];
  addedAt: string;
}

interface AgentStore {
  agentUrls: AgentUrl[];
  addAgentUrl: (url: string, headers?: CustomHeader[]) => void;
  removeAgentUrl: (id: string) => void;
  updateAgentUrl: (id: string, url: string) => void;
  updateAgentHeaders: (id: string, headers: CustomHeader[]) => void;
}

// デフォルトのエージェントURL
const DEFAULT_AGENT_URLS: AgentUrl[] = [
  {
    id: 'onenote-search-agent',
    url: 'http://onenote-search-agent:8000',
    headers: [],
    addedAt: new Date().toISOString(),
  },
  {
    id: 'outlook-schedule-agent',
    url: 'http://outlook-schedule-agent:8000',
    headers: [],
    addedAt: new Date().toISOString(),
  },
];

export const useAgentStore = create<AgentStore>()(
  persist(
    (set) => ({
      agentUrls: DEFAULT_AGENT_URLS,

      addAgentUrl: (url: string, headers: CustomHeader[] = []) => {
        set((state) => ({
          agentUrls: [
            ...state.agentUrls,
            {
              id: `agent-${Date.now()}`,
              url,
              headers,
              addedAt: new Date().toISOString(),
            },
          ],
        }));
      },

      removeAgentUrl: (id: string) => {
        set((state) => ({
          agentUrls: state.agentUrls.filter((agent) => agent.id !== id),
        }));
      },

      updateAgentUrl: (id: string, url: string) => {
        set((state) => ({
          agentUrls: state.agentUrls.map((agent) =>
            agent.id === id ? { ...agent, url } : agent
          ),
        }));
      },

      updateAgentHeaders: (id: string, headers: CustomHeader[]) => {
        set((state) => ({
          agentUrls: state.agentUrls.map((agent) =>
            agent.id === id ? { ...agent, headers } : agent
          ),
        }));
      },
    }),
    {
      name: 'agent-urls-storage',
    }
  )
);
