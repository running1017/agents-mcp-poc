# OneNote Search Agent - A2A Protocol Compatible

A2Aプロトコル公式SDK対応のOneNote検索エージェントです。

## 概要

このエージェントは、[A2A Python SDK](https://github.com/a2aproject/a2a-python)を使用して構築された、Microsoft OneNoteから情報を検索・抽出するためのA2A準拠AIエージェントです。

## A2A Protocol対応

このエージェントは[Agent2Agent (A2A) Protocol](https://a2a-protocol.org/)の公式Python SDKを使用して実装されており、以下の標準機能を提供します:

### 使用SDK

- **a2a-sdk** (>=0.3.0): A2A Protocol公式Python SDK
- **Starlette**: ASGIベースのWebフレームワーク (A2A SDKが内部使用)
- **Uvicorn**: ASGIサーバー

### AgentCard

エージェントの機能情報は `/.well-known/agent.json` エンドポイントで取得できます。

```bash
curl http://localhost:8003/.well-known/agent.json
```

### スキル（対話型マルチステップ対応）

このエージェントは以下のスキルを提供します:

1. **list_notebooks**: ノートブック一覧取得
   - 利用可能なOneNoteノートブックの一覧を表示
   - 例: "ノートブック一覧を表示して"

2. **search_onenote**: OneNote検索
   - 選択されたノートブック内から情報を検索
   - 例: "プロジェクト仕様書を検索"

3. **answer_question**: 質問回答
   - ノートブックの内容から質問に回答
   - 例: "プロジェクトの納期について教えて"

4. **summarize_content**: コンテンツ要約
   - ノートブックの内容を要約
   - 例: "今月のミーティング内容を要約して"

5. **extract_content**: コンテンツ抽出
   - 特定のページからコンテンツを抽出
   - 例: "「Q1計画」というタイトルのページを抽出して"

### 対話フロー

```
1. ユーザー: 「OneNoteを検索したい」
   ↓
2. エージェント: ノートブック一覧を表示
   ↓
3. ユーザー: ノートブックを選択（番号または名前）
   ↓
4. エージェント: ノートブック選択完了、操作を待機
   ↓
5. ユーザー: 検索/質問/要約/抽出を指示
   ↓
6. エージェント: 実行結果を返す
   ↓
7. （同じノートブック内で続けて操作可能）
```

## アーキテクチャ

### コンポーネント構成（モジュール分割）

```
onenote_search_agent/
├── main.py                        # エントリーポイント、AgentCard定義、サーバー起動
└── core/                          # コアロジック（機能ごとに分割）
    ├── __init__.py                # coreパッケージ初期化
    ├── conversation_state.py      # 対話状態の定義（Enum）
    ├── onenote_agent.py           # OneNoteエージェントのビジネスロジック
    └── executor.py                # AgentExecutor実装、状態遷移処理
```

**モジュール分割の利点:**
- **保守性向上**: 機能ごとにファイルが分かれ、変更箇所が明確
- **拡張性**: 新機能追加時に該当モジュールのみ修正
- **テスト容易性**: 各モジュールを独立してテスト可能
- **責任の分離**: 各モジュールが単一の責任を持つ

### 対話状態管理

エージェントは以下の状態を管理します:

- **INITIAL**: 初期状態（ノートブック未選択）
- **NOTEBOOK_SELECTED**: ノートブック選択済み（検索・質問・要約が可能）

各タスクIDごとに状態とノートブック選択を保持し、マルチステップの対話を実現します。

### 実装パターン

このエージェントは、A2A Python SDKの標準的な実装パターンに従っています:

1. **AgentExecutor**: `a2a.server.agent_execution.AgentExecutor`を継承
2. **AgentCard**: `a2a.types.AgentCard`でエージェント情報を定義
3. **AgentSkill**: `a2a.types.AgentSkill`でスキルを定義
4. **A2AStarletteApplication**: Starletteベースのアプリケーション
5. **対話状態管理**: タスクIDごとに会話状態を保持

### システム構成

```
OneNote Search Agent (A2A SDK)
    ↓
OneNote MCP Server
    ↓
Microsoft Graph API
```

## セットアップ

### 1. 環境変数の設定

`.env.example` をコピーして `.env` ファイルを作成してください:

```bash
cp .env.example .env
```

必要な環境変数:
- `ENTRA_TENANT_ID`: Entra IDテナントID
- `ENTRA_CLIENT_ID`: アプリケーションクライアントID
- `ENTRA_CLIENT_SECRET`: アプリケーションシークレット

### 2. Dockerコンテナとして起動

プロジェクトルートから:

```bash
cd /home/running1017/code/agents-mcp-poc/src
docker compose up onenote-search-agent
```

特定のサービスのみビルド:

```bash
docker compose build onenote-search-agent
docker compose up onenote-search-agent
```

**🔥 ホットリロード（開発モード）:**

Dockerコンテナ実行時もホットリロードが有効になっています:
- コードを変更すると自動的にサーバーが再起動
- `volumes`でホストのコードがコンテナにマウント
- uvicornの`reload=True`オプションで変更を監視

### 3. ローカル開発

```bash
pip install -r requirements.txt
python main.py  # ホットリロード有効
```

## エンドポイント

A2A SDKが自動的に以下のエンドポイントを提供します:

- `GET /.well-known/agent.json` - AgentCard (A2A仕様)
- `POST /api/v1/tasks` - タスク作成 (JSON-RPC 2.0)
- `GET /api/v1/tasks/{task_id}` - タスク状態取得
- `POST /api/v1/tasks/{task_id}/cancel` - タスクキャンセル

## 動作確認

サービス起動後:

```bash
# AgentCard取得
curl http://localhost:8003/.well-known/agent.json

# Step 1: タスク作成してノートブック一覧を取得 (JSON-RPC 2.0)
curl -X POST http://localhost:8003/api/v1/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "task.create",
    "params": {
      "input": "OneNoteを検索したい"
    },
    "id": 1
  }'

# Step 2: ノートブックを選択（task_idは上記のレスポンスから取得）
curl -X POST http://localhost:8003/api/v1/tasks/{task_id}/input \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "task.input",
    "params": {
      "input": "2"
    },
    "id": 2
  }'

# Step 3: 検索実行
curl -X POST http://localhost:8003/api/v1/tasks/{task_id}/input \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "task.input",
    "params": {
      "input": "プロジェクト仕様書を検索"
    },
    "id": 3
  }'

# タスク状態確認
curl http://localhost:8003/api/v1/tasks/{task_id}
```

### 対話例

```
ユーザー: 「OneNoteを検索したい」
↓
エージェント:
📚 利用可能なノートブック一覧:

1. 個人用ノート (ID: nb-001)
2. プロジェクトA (ID: nb-002)
3. ミーティング議事録 (ID: nb-003)
4. 技術メモ (ID: nb-004)

検索したいノートブックの番号または名前を指定してください。

---

ユーザー: 「2」
↓
エージェント:
✅ ノートブック「プロジェクトA」を選択しました。

検索キーワードを入力するか、以下の操作を指定してください:
- 検索: キーワードを入力
- 質問: 「〜について教えて」
- 要約: 「要約して」

---

ユーザー: 「プロジェクトの納期について教えて」
↓
エージェント:
💡 質問「プロジェクトの納期について教えて」への回答:
[検索結果に基づく回答...]
```

## セキュリティ

- **OBO (On-Behalf-Of) Flow**: エンドユーザーの権限を保持したままMicrosoft Graph APIにアクセス
- **W3C Trace-Context**: 分散トレーシングによる監査証跡の確保
- **A2A Protocol**: 標準化されたエージェント間通信

## 参考資料

- [A2A Protocol 公式サイト](https://a2a-protocol.org/)
- [A2A Python SDK](https://github.com/a2aproject/a2a-python)
- [A2A サンプル集](https://github.com/a2aproject/a2a-samples)

## 今後の実装予定

- [x] A2A Python SDK統合
- [x] AgentExecutor実装
- [x] AgentCard定義
- [ ] OneNote MCP Serverとの統合
- [ ] LangChainによる高度な検索機能
- [ ] ストリーミング対応
- [ ] 認証済みユーザー向け拡張カード対応
