import { NextResponse } from 'next/server';

interface CustomHeader {
  key: string;
  value: string;
}

interface AgentInfo {
  name: string;
  description: string;
  version?: string;
  type: 'agent' | 'mcp' | 'unknown';
  capabilities?: string[];
}

async function fetchAgentInfo(
  url: string,
  customHeaders: CustomHeader[] = []
): Promise<{
  status: 'online' | 'offline';
  info?: AgentInfo;
}> {
  try {
    // カスタムヘッダーをHeadersオブジェクトに変換
    const headers = new Headers();
    customHeaders.forEach((header) => {
      headers.set(header.key, header.value);
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒タイムアウト

    // エージェント情報エンドポイントを試す
    const infoResponse = await fetch(`${url}/info`, {
      method: 'GET',
      headers,
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timeoutId);

    if (infoResponse && infoResponse.ok) {
      const info = await infoResponse.json();
      return {
        status: 'online',
        info: {
          name: info.name || 'Unknown Agent',
          description: info.description || '',
          version: info.version,
          type: info.type || 'unknown',
          capabilities: info.capabilities || [],
        },
      };
    }

    // /infoが失敗したら/healthを試す
    const controller2 = new AbortController();
    const timeoutId2 = setTimeout(() => controller2.abort(), 3000);

    const healthResponse = await fetch(`${url}/health`, {
      method: 'GET',
      headers,
      signal: controller2.signal,
    }).catch(() => null);

    clearTimeout(timeoutId2);

    if (healthResponse && healthResponse.ok) {
      return {
        status: 'online',
        info: {
          name: 'Unknown Agent',
          description: 'エージェント情報の取得に失敗しました',
          type: 'unknown',
        },
      };
    }

    return { status: 'offline' };
  } catch (error) {
    return { status: 'offline' };
  }
}

export async function POST(request: Request) {
  try {
    const { urls } = await request.json();

    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json(
        { error: 'Invalid request: urls array is required' },
        { status: 400 }
      );
    }

    // 各URLから情報を並列取得
    const agentStatusPromises = urls.map(
      async (agentUrl: { id: string; url: string; headers?: CustomHeader[] }) => {
        const { status, info } = await fetchAgentInfo(
          agentUrl.url,
          agentUrl.headers || []
        );

        return {
          id: agentUrl.id,
          url: agentUrl.url,
          status,
          name: info?.name || 'Unknown',
          description: info?.description || '',
          version: info?.version,
          type: info?.type || 'unknown',
          capabilities: info?.capabilities || [],
        };
      }
    );

    const agents = await Promise.all(agentStatusPromises);

    return NextResponse.json({
      agents,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching agent status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent status' },
      { status: 500 }
    );
  }
}
