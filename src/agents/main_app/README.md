# Main App - エージェントチャットアプリケーション

Next.js + TypeScript + Vercel AI SDK を使用した分散AIエージェントシステムのメインアプリケーション。

## 技術スタック

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **AI SDK**: Vercel AI SDK with Azure OpenAI
- **Styling**: Tailwind CSS
- **Runtime**: Node.js 24

## 機能

- リアルタイムチャットインターフェース
- OneNote検索エージェントへのルーティング
- Outlookスケジュール調整エージェントへのルーティング
- ストリーミングレスポンス対応
- W3C Trace-Context による分散トレーシング
- Entra ID OBOフローによる権限保持

## セットアップ

### 1. 環境変数の設定

`.env.example`をコピーして`.env`ファイルを作成:

```bash
cp .env.example .env
```

必要な環境変数を設定:

```env
# Azure OpenAI Configuration
AZURE_OPENAI_RESOURCE_NAME=your_azure_openai_resource_name
AZURE_OPENAI_API_KEY=your_azure_openai_api_key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o

# Entra ID Configuration (for OBO flow)
AZURE_CLIENT_ID=your_azure_client_id
AZURE_TENANT_ID=your_azure_tenant_id
AZURE_CLIENT_SECRET=your_azure_client_secret

# Agent URLs
ONENOTE_SEARCH_AGENT_URL=http://onenote-search-agent:8000
OUTLOOK_SCHEDULE_AGENT_URL=http://outlook-schedule-agent:8000

# W3C Trace Context
ENABLE_TRACING=true
```

**Azure OpenAI設定の取得方法:**

1. Azure Portalにログイン
2. Azure OpenAI Serviceリソースを開く
3. 「Keys and Endpoint」から以下を取得:
   - `AZURE_OPENAI_RESOURCE_NAME`: エンドポイントURL (`https://<resource-name>.openai.azure.com/`) からリソース名を抽出
   - `AZURE_OPENAI_API_KEY`: Key 1 または Key 2
4. 「Deployments」から使用するモデルのデプロイメント名を確認:
   - `AZURE_OPENAI_DEPLOYMENT_NAME`: デプロイメント名（例: `gpt-4o`）

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

アプリケーションは http://localhost:3000 で起動します。

### 4. Dockerでの実行

プロジェクトルートから:

```bash
cd ../../
docker compose up main-app --build
```

アプリケーションは http://localhost:8000 で起動します。

## プロジェクト構造

```
main_app/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts      # チャットAPIエンドポイント
│   ├── layout.tsx            # ルートレイアウト
│   ├── page.tsx              # チャットUI
│   └── globals.css           # グローバルスタイル
├── public/                   # 静的ファイル
├── Dockerfile                # コンテナ設定
├── next.config.ts            # Next.js設定
├── tailwind.config.ts        # Tailwind CSS設定
├── tsconfig.json             # TypeScript設定
└── package.json              # 依存関係
```

## API エンドポイント

### POST /api/chat

チャットメッセージを受け付け、ストリーミングレスポンスを返します。

**リクエスト:**
```json
{
  "messages": [
    { "role": "user", "content": "OneNoteで会議のメモを検索して" }
  ]
}
```

**レスポンス:**
ストリーム形式でAIの応答を返します。

## 開発ガイド

### エージェントルーティングの追加

`app/api/chat/route.ts`の`onFinish`コールバックでエージェントへのルーティングロジックを実装します:

```typescript
async onFinish({ text, finishReason, usage }) {
  // ユーザーの意図を判定
  if (text.includes('OneNote')) {
    // OneNote検索エージェントを呼び出し
  } else if (text.includes('スケジュール')) {
    // Outlookスケジュールエージェントを呼び出し
  }
}
```

### UIのカスタマイズ

`app/page.tsx`でチャットUIをカスタマイズできます。Tailwind CSSを使用してスタイリングしています。

## 本番環境デプロイ

### Next.jsスタンドアロン出力

本番環境用に最適化されたスタンドアロン出力を使用:

```bash
npm run build
```

ビルド成果物は`.next/standalone`に生成されます。

### Docker本番イメージ

マルチステージビルドで最適化されたイメージを作成:

```bash
docker build -t main-app .
docker run -p 8000:8000 --env-file .env main-app
```

## トラブルシューティング

### ポート8000が使用中

別のサービスがポート8000を使用している場合、docker-compose.ymlでポートマッピングを変更:

```yaml
ports:
  - "3000:8000"  # ホストの3000番ポートにマップ
```

### Azure OpenAI APIエラー

以下を確認してください:
- `.env`ファイルに正しい`AZURE_OPENAI_API_KEY`が設定されているか
- `AZURE_OPENAI_RESOURCE_NAME`が正しいリソース名になっているか
- `AZURE_OPENAI_DEPLOYMENT_NAME`が実際にデプロイされているモデル名と一致しているか
- Azure OpenAI Serviceのクォータが残っているか

### エージェント接続エラー

他のエージェントサービスが起動しているか確認:

```bash
docker compose ps
```

## ライセンス

このプロジェクトはPoCとして作成されています。
