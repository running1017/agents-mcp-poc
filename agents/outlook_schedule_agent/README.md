# Outlook Schedule Agent

a2a-jsとExpressを使用したOutlookスケジュール管理エージェントです。

## 機能

- A2Aプロトコルを使用したエージェント間通信
- Outlookカレンダーの予定取得
- スケジュールの空き時間確認
- OBO (On-Behalf-Of) フローによる権限継承
- W3C Trace-Contextによる分散トレーシング

## アーキテクチャ

```
User → Main App → Outlook Schedule Agent (this) → Outlook MCP → Microsoft Graph API
```

## 技術スタック

- **ランタイム**: Node.js 24
- **言語**: TypeScript
- **フレームワーク**: Express
- **A2Aライブラリ**: @a2a-js/sdk
- **ロギング**: Winston
- **HTTPクライアント**: Axios

## セットアップ

### 1. 環境変数の設定

`.env.example`をコピーして`.env`ファイルを作成し、必要な値を設定してください。

```bash
cp .env.example .env
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

### 4. ビルド

```bash
npm run build
npm start
```

## Dockerでの実行

```bash
# ビルド
docker build -t outlook-schedule-agent .

# 実行
docker run -p 8000:8000 --env-file .env outlook-schedule-agent
```

## API エンドポイント

### ヘルスチェック
```
GET /health
```

### A2Aエージェントカード
```
GET /.well-known/agent-card.json
```

### A2Aメッセージング
```
POST /messages
```

## 使用例

### A2A クライアントからの呼び出し

```typescript
import { A2AClient } from '@a2a-js/sdk';

const client = await A2AClient.fromCardUrl(
  'http://localhost:8000/.well-known/agent-card.json'
);

const response = await client.sendMessage({
  message: {
    role: 'user',
    parts: [
      {
        kind: 'text',
        text: '今週の予定を教えて'
      }
    ]
  },
  metadata: {
    accessToken: 'your-access-token-here'
  }
});

console.log(response);
```

## セキュリティ

### OBO (On-Behalf-Of) フロー

このエージェントはエンドユーザーの権限を維持するためにOBOフローを実装しています:

1. ユーザーがMain Appにアクセストークンを提供
2. Main Appがこのエージェントにトークンをメタデータとして転送
3. エージェントがOutlook MCPにトークンを転送
4. Outlook MCPがMicrosoft Graph APIにアクセス

### 必要な権限

- `User.Read.All`
- `Group.Read.All`
- `Calendars.Read`

## トレーシング

W3C Trace-Contextヘッダー (`traceparent`) を使用して、すべてのリクエストをトレースします。

## ログ

Winstonを使用したJSON形式のログ出力:

```json
{
  "timestamp": "2025-01-06 12:00:00",
  "level": "info",
  "service": "outlook-schedule-agent",
  "message": "Executing Outlook Schedule Agent",
  "traceId": "abc123..."
}
```

ログレベルは環境変数`LOG_LEVEL`で設定できます (debug, info, warn, error)。

## ライセンス

MIT
