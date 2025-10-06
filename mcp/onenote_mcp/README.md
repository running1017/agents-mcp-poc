# OneNote MCP Server

FastMCPを使用したOneNote MCP サーバー実装。OBOフロー（On-Behalf-Of）とW3C Trace-Contextに対応しています。

## 機能

- **FastMCP**: Pythonic で高速なMCPサーバー実装
- **OBOフロー**: Entra IDを使用したOn-Behalf-Of認証フロー
- **W3C Trace-Context**: 分散トレーシングのための国際標準に準拠
- **ホットリロード**: 開発時のコード変更を自動検出して再起動

## アーキテクチャ

```
ユーザー → 上位サービス → OneNote MCP → Microsoft Graph API
                              ↓
                        OBOトークン取得
                        Trace-Context伝播
```

## 提供するツール

### 1. `list_notebooks`
ユーザーがアクセス可能なすべてのOneNoteノートブックを一覧表示します。

**パラメータ:**
- `access_token` (str): OBOフロー用のユーザーアクセストークン
- `traceparent` (str, optional): W3C traceparentヘッダー
- `tracestate` (str, optional): W3C tracestateヘッダー

**戻り値:**
- ノートブック情報のリスト（ID、表示名、作成日時、更新日時）

### 2. `list_sections`
指定したノートブック内のすべてのセクションを一覧表示します。

**パラメータ:**
- `notebook_id` (str): ノートブックID
- `access_token` (str): OBOフロー用のユーザーアクセストークン
- `traceparent` (str, optional): W3C traceparentヘッダー
- `tracestate` (str, optional): W3C tracestateヘッダー

**戻り値:**
- セクション情報のリスト

### 3. `list_pages`
指定したセクション内のすべてのページを一覧表示します。

**パラメータ:**
- `section_id` (str): セクションID
- `access_token` (str): OBOフロー用のユーザーアクセストークン
- `traceparent` (str, optional): W3C traceparentヘッダー
- `tracestate` (str, optional): W3C tracestateヘッダー

**戻り値:**
- ページ情報のリスト

### 4. `search_onenote`
すべてのOneNoteコンテンツを横断検索します。

**パラメータ:**
- `query` (str): 検索クエリ文字列
- `access_token` (str): OBOフロー用のユーザーアクセストークン
- `traceparent` (str, optional): W3C traceparentヘッダー
- `tracestate` (str, optional): W3C tracestateヘッダー

**戻り値:**
- 検索結果のリスト

### 5. `get_page_content`
指定したページのHTMLコンテンツを取得します。

**パラメータ:**
- `page_id` (str): ページID
- `access_token` (str): OBOフロー用のユーザーアクセストークン
- `traceparent` (str, optional): W3C traceparentヘッダー
- `tracestate` (str, optional): W3C tracestateヘッダー

**戻り値:**
- ページコンテンツ情報（HTMLコンテンツを含む）

## セットアップ

### 環境変数

`.env`ファイルを作成して以下の環境変数を設定してください：

```bash
# Entra ID Configuration
TENANT_ID=your-tenant-id
CLIENT_ID=your-client-id
CLIENT_SECRET=your-client-secret

# Server Configuration
HOST=0.0.0.0
PORT=8000

# Microsoft Graph API
GRAPH_API_BASE_URL=https://graph.microsoft.com/v1.0
```

### 必要な権限

Microsoft Graph APIで以下の権限が必要です：

- `User.Read.All`
- `Group.Read.All`
- `Notes.Read.All`

## 開発

### ローカル実行

```bash
# 依存関係のインストール
pip install -e .

# サーバー起動
python -m src.server
```

### Docker実行

```bash
# ビルドと起動
docker compose up onenote-mcp --build

# ログ確認
docker compose logs -f onenote-mcp
```

### ホットリロード

Dockerコンテナは`/app`ディレクトリをマウントしており、`src/`ディレクトリ内のファイル変更を検出して自動的に再起動します。

## セキュリティ原則

### OBOフロー（On-Behalf-Of）

1. 上位サービスからユーザーのアクセストークンを受け取る
2. Entra IDに対してOBOトークンをリクエスト
3. 取得したOBOトークンでMicrosoft Graph APIを呼び出す
4. エンドユーザーの権限が全チェーン通して維持される

### W3C Trace-Context

- `traceparent`ヘッダー: `{version}-{trace-id}-{parent-id}-{trace-flags}`形式
- `tracestate`ヘッダー: オプションの追加トレース情報
- すべてのサービス呼び出しでTrace-Contextを伝播
- ログでtrace-idを記録し、クロスサービスの相関分析を可能に

## トラブルシューティング

### OBO認証エラー

```
Authentication failed: Unable to acquire OBO token
```

- Entra IDの設定を確認
- クライアントシークレットの有効期限を確認
- 必要な権限が付与されているか確認

### Trace-Context警告

```
Invalid traceparent format
```

- W3C Trace-Context仕様に準拠した形式か確認
- バージョンは`00`のみサポート

## 参考資料

- [FastMCP公式ドキュメント](https://gofastmcp.com/)
- [Microsoft Graph API - OneNote](https://learn.microsoft.com/en-us/graph/api/resources/onenote)
- [W3C Trace Context](https://www.w3.org/TR/trace-context/)
- [Entra ID OBO Flow](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-on-behalf-of-flow)
