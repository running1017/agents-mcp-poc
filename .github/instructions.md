# AIエージェント調査研究 PoC

このリポジトリは、AIエージェントの調査研究を目的としたPoC（Proof of Concept）プロジェクトです。

---

## 目的

### 全社分散型AIエージェント基盤のリスク整理

#### リスク項目
- **権限昇格**
  - ユーザーがエージェント経由で他部署データにアクセス
- **監査不能**
  - エージェントやツールの処理が連鎖することで、インシデント発生時の原因特定が困難

#### 権限管理の目標
- エンドユーザーの権限範囲を末端まで維持

#### 監査・追跡性の目標
- 誰が（実行ユーザー特定）
- どうやって（エージェント・MCP間の呼び出し経路）
- 何を実行したか（最終的なMCPツールの操作内容）

### セキュリティルール整備

#### OBO（On-Behalf-Of）フローによる認証チェーン化

**技術的な実現方法**
- ユーザーは `scope="ServiceB.Read"` でサービスAの呼び出し用アクセストークンをEntra IDから取得
- サービスAはそのアクセストークンを使ってサービスBのアクセストークンを再度Entra IDから取得してサービスBを呼び出す
- この仕組みにより、エンドユーザーの権限範囲を各サービス間で維持

#### W3C Trace-Contextによる処理フローの追跡

**W3C Trace-Contextとは**
- 分散システムにおいて複数のサービス間を跨ぐリクエストを一意に追跡するための国際標準規格

**シンプルなログ構成の課題**
- 各サービスのログがバラバラで関連性がわからない

**Trace-Context導入後の効果**
- 1つのtrace-idで全サービスのログを横断検索可能
- 同じIDを伝播することで、リクエストの全体的な流れを追跡

---

## 構成
### 全体構成
- `src/docker-compose.yml`: 全コンテナの起動・連携設定
- `src/mcp/`: MCPサーバー群
- `src/agents/`: エージェント群

### ① `onenote_mcp/`: OneNoteをGraph API経由で操作するためのMCPサーバー
  - 機能
    - OneNoteノートブック、セクション、ページの取得
    - 特定キーワードでの検索
  - 権限
    - User.Read.All
    - Group.Read.All
    - Notes.Read.All
  - 技術スタック
    - Python 3.12
    - FastMCP
### ② `outlook_mcp/`: OutlookをGraph API経由で操作するためのMCPサーバー
  - 機能
    - Outlookの個人、共有カレンダーの取得
    - 人名やキーワードでのアドレス検索
    - `.msg`ファイルの作成
  - 権限
    - User.Read.All
    - Group.Read.All
    - Calendars.Read
  - 技術スタック
    - C# 14
    - .NET Core 10.0
    - MCP C# SDK
### ③ `onenote_search_agent/`: OneNote内を検索するエージェント
  - 機能
    - ユーザーの問い合わせに基づきOneNote内を検索し、関連情報を抽出して回答
  - 技術スタック
    - Python 3.12
    - FastAPI
    - LangChain
### ④ `outlook_schedule_agent/`: Outlookの予定表を確認し空き時間を調整するエージェント
  - 機能
    - ユーザーの問い合わせに基づきOutlook予定表を確認し、空き時間を調整して回答
  - 技術スタック
    - Node.js 24
    - NestJS
    - TypeScript
    - LangChain.js
### ⑤ `main_app/`: 上記エージェントを統括するメインエージェントとフロントエンドアプリケーション
  - 機能
    - ユーザーからの問い合わせを受け付け、適切なエージェントに振り分け
    - エージェントからの回答をユーザーに返す
  - 技術スタック
    - Next.js
    - TypeScript
    - LangChain.js
