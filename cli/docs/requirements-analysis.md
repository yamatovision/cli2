# OpenHands 要件定義書

## 1. プロジェクト概要

### 1.1 プロジェクト名
OpenHands（旧称：OpenDevin）

### 1.2 プロジェクトビジョン
「Code Less, Make More」- AIエージェントによる自律的なソフトウェア開発を実現するプラットフォーム

### 1.3 プロジェクトの目的
- 人間の開発者ができることをすべて実行可能なAIエージェントの提供
- コード修正、コマンド実行、ウェブブラウジング、API呼び出しなどの自動化
- 開発作業の効率化と自動化による生産性向上

## 2. システム要件

### 2.1 機能要件

#### 2.1.1 エージェント機能
- **コード実行機能**
  - Pythonコードの実行（Jupyter環境）
  - Bashコマンドの実行
  - 複数のプログラミング言語のサポート

- **ファイル操作機能**
  - ファイルの読み取り・書き込み
  - ディレクトリの作成・削除
  - ファイルシステムのナビゲーション

- **ウェブブラウジング機能**
  - URLアクセスとコンテンツ取得
  - ウェブページとのインタラクション
  - スクリーンショット機能

- **API連携機能**
  - 外部APIの呼び出し
  - GitHub/GitLab/Bitbucketとの統合
  - MCP（Model Context Protocol）対応

#### 2.1.2 エージェントタイプ

##### メインエージェント（実際に動作するAIエージェント）
1. **CodeActAgent** - 汎用コーディングエージェント
   - マネージャー的役割（唯一委任機能を持つ）
   - デフォルトエージェント
   - 他のエージェントへの委任が可能（現在はBrowsingAgentのみ）

2. **BrowsingAgent** - ウェブブラウジング専門
   - CodeActAgentから委任を受けて動作
   - 委任機能なし

3. **LocAgent** - コードベース探索専門
   - 直接起動のみ（委任されない）
   - 大規模コードベースの解析に特化

4. **ReadonlyAgent** - 読み取り専用操作
   - 直接起動のみ（委任されない）
   - セキュリティ監査やコードレビュー向け

5. **VisualBrowsingAgent** - ビジュアルブラウジング対応
   - 直接起動のみ（委任されない）
   - スクリーンショットベースのWeb操作

6. **DummyAgent** - テスト専用エージェント

#### 2.1.3 ランタイム環境
- **Docker Runtime**（デフォルト）- ローカル開発用
- **Local Runtime** - ホスト直接実行
- **Remote Runtime** - リモートサーバー実行
- **E2B Runtime** - クラウドベース実行
- **Modal Runtime** - サーバーレス実行
- **Kubernetes Runtime** - エンタープライズ向け

#### 2.1.4 ユーザーインターフェース
- **Webインターフェース**
  - React/TypeScriptベースのSPA
  - リアルタイムチャット機能
  - ファイルエクスプローラー
  - ターミナル表示
  - コードエディタビュー

- **CLIインターフェース**
  - コマンドライン操作
  - ヘッドレスモード
  - バッチ処理対応

- **API インターフェース**
  - RESTful API
  - WebSocket通信
  - イベントストリーム

### 2.2 非機能要件

#### 2.2.1 性能要件
- 最大反復回数：500回（設定可能）
- 同時実行会話数：ユーザーあたり3つまで
- 会話の自動終了：10日間の非活動後
- LLMトークン制限：モデルに依存
  - GPT-4: 最大128,000トークン
  - Claude 3: 最大200,000トークン
  - GPT-3.5: 最大16,385トークン
- トークン管理：
  - 自動履歴圧縮（Condenser機能）
  - LLMベースの要約生成
  - 上限到達前の予防的圧縮

#### 2.2.2 セキュリティ要件
- サンドボックス環境での実行
- ユーザー認証（JWT）
- ファイルアクセス制御
- セキュリティアナライザーによる監視
- ネットワーク分離オプション

#### 2.2.3 拡張性要件
- カスタムエージェントの追加
- プラグインシステム
- 外部ツール統合（MCP）
- 複数のLLMプロバイダー対応

#### 2.2.4 運用要件
- Dockerベースのデプロイメント
- Kubernetesサポート
- モニタリング（OpenTelemetry）
- ログ管理

## 3. システムアーキテクチャ

### 3.1 全体構成
```
┌─────────────────┐
│  Frontend (UI)  │
├─────────────────┤
│   REST API      │
│  WebSocket      │
├─────────────────┤
│    Server       │
├─────────────────┤
│  Controller     │
├─────────────────┤
│     Agent       │
├─────────────────┤
│    Runtime      │
└─────────────────┘
```

### 3.2 主要コンポーネント

#### 3.2.1 Frontend
- **技術スタック**: React, TypeScript, Vite
- **主要機能**: UI表示、ユーザー入力、リアルタイム更新

#### 3.2.2 Server
- **技術スタック**: FastAPI, Python
- **主要機能**: API提供、WebSocket管理、セッション管理

#### 3.2.3 Controller
- **機能**: エージェント実行管理、イベント処理、状態管理

#### 3.2.4 Agent
- **機能**: タスク実行、LLM通信、アクション生成

#### 3.2.5 Runtime
- **機能**: 実行環境提供、アクション実行、セキュリティ隔離

### 3.3 データフロー
1. ユーザーがタスクを入力
2. サーバーがセッションを作成
3. コントローラーがデフォルトエージェント（通常はCodeActAgent）を起動
4. エージェントがLLMと通信してアクションを決定
5. 必要に応じて他のエージェントに委任（新規インスタンス、0トークンから開始）
6. ランタイムがアクションを実行
7. 結果がイベントストリーム経由でユーザーに返却

### 3.4 エージェント委任メカニズム
- 委任は**逐次実行**（並列実行ではない）
- 親エージェントは子エージェントの完了を待機
- 子エージェントは新規インスタンスとして0トークンから開始
- 完了時は要約のみが親に返却（詳細な履歴は共有されない）

## 4. 技術要件

### 4.1 開発言語・フレームワーク
- **バックエンド**: Python 3.12+
- **フロントエンド**: TypeScript, React
- **API**: FastAPI
- **非同期処理**: asyncio

### 4.2 主要ライブラリ
- **LLM統合**: litellm
- **ウェブブラウジング**: browsergym-core
- **非同期通信**: python-socketio
- **コンテナ**: Docker
- **オーケストレーション**: Kubernetes（オプション）

### 4.3 外部サービス連携
- **LLMプロバイダー**
  - OpenAI
  - Anthropic Claude
  - Google Gemini
  - Azure OpenAI
  - ローカルLLM（Ollama等）

- **コードリポジトリ**
  - GitHub
  - GitLab
  - Bitbucket

- **クラウドサービス**
  - E2B
  - Modal
  - Google Cloud
  - AWS

## 5. デプロイメント要件

### 5.1 ローカル環境
- Docker Desktop
- 最小8GB RAM
- Python 3.12+
- Node.js（フロントエンド開発時）

### 5.2 本番環境
- Kubernetes 1.28+
- 永続ストレージ
- ロードバランサー
- TLS証明書

### 5.3 設定管理
- TOML形式の設定ファイル
- 環境変数による上書き
- シークレット管理

## 6. 開発・運用要件

### 6.1 開発プロセス
- GitHubフロー
- 自動テスト（pytest）
- コードフォーマット（ruff）
- 型チェック（mypy）

### 6.2 モニタリング
- OpenTelemetry統合
- メトリクス収集
- トレース機能
- ログ集約

### 6.3 ドキュメント
- 技術ドキュメント（docs/）
- APIドキュメント（OpenAPI）
- ユーザーガイド
- 貢献者ガイド

## 7. 制約事項

### 7.1 技術的制約
- シングルユーザー向け設計（マルチテナント非対応）
- LLMのコンテキスト長制限
- ランタイム環境の制限（サンドボックス）

### 7.2 ライセンス
- MITライセンス
- オープンソースプロジェクト

## 8. 今後の拡張計画

### 8.1 機能拡張
- マルチエージェント協調
- より高度なメモリ管理
- カスタムツールの容易な追加

### 8.2 性能改善
- レスポンス時間の短縮
- トークン使用量の最適化
- スケーラビリティの向上

### 8.3 エコシステム
- プラグインマーケットプレイス
- コミュニティ貢献の促進
- エンタープライズ機能の追加

## 9. マイクロエージェント

### 9.1 マイクロエージェントとは
マイクロエージェントは**実際のエージェントではなく**、既存のエージェントに知識や手順を注入するプロンプト拡張機能です。

### 9.2 マイクロエージェントの種類

#### 知識型（Knowledge）- キーワードで自動発動
- **github** - GitHub操作の知識提供
- **docker** - Dockerインストール・使用方法
- **npm** - npm非対話的実行の支援
- **security** - セキュリティベストプラクティス
- **kubernetes** - KINDを使用したローカルK8s開発
- **gitlab** - GitLab API操作
- **bitbucket** - Bitbucket API操作
- **ssh** - SSH接続の確立と管理
- **testing** - テスト作成のベストプラクティス

#### リポジトリ型（Repo）- 常に有効
- `.openhands/microagents/repo.md` - プロジェクト固有のルール
- 組織レベルの共通ルール（オプション）

#### タスク型（Task）- コマンドで発動、パラメータ必須
- **/fix_test** - テスト修正タスク
- **/update_test** - テスト更新タスク
- **/code_review** - コードレビュータスク

### 9.3 BlueLampプロジェクトのマイクロエージェント（16個）
- **architect** - アーキテクチャ設計（知識型）
- **engineer** - 実装担当（知識型）
- **frontend** - フロントエンド開発（知識型）
- **backend** - バックエンド開発（知識型）
- **qa** - 品質保証（知識型）
- **devops** - インフラ・CI/CD（知識型）
- **security** - セキュリティ専門（知識型）
- **database** - データベース設計（知識型）
- **api** - API設計（知識型）
- **testing** - テスト戦略（知識型）
- **documentation** - ドキュメント作成（知識型）
- **project_manager** - プロジェクト管理（知識型）
- **ux** - UXデザイン（知識型）
- **performance** - パフォーマンス最適化（知識型）
- **reviewer** - コードレビュー（知識型）
- **integrator** - システム統合（知識型）

### 9.4 マイクロエージェントの動作
- ユーザーメッセージのキーワードでのみ発動（エージェントの発言では発動しない）
- 現在のエージェントのコンテキストに知識を注入
- 新しいセッションは開始せず、トークンは追加消費

## 10. 実装されているアクション一覧

### 10.1 エージェント制御アクション
1. **AgentFinishAction** (`/openhands/events/action/agent.py`)
   - タスクを完了し、完了状態（true/partial/false）を報告
   - アクションタイプ: `FINISH`

2. **AgentThinkAction** (`/openhands/events/action/agent.py`)
   - エージェントの思考プロセスをログに記録
   - アクションタイプ: `THINK`

3. **AgentRejectAction** (`/openhands/events/action/agent.py`)
   - 完了できないタスクを拒否
   - アクションタイプ: `REJECT`

4. **AgentDelegateAction** (`/openhands/events/action/agent.py`)
   - 他のエージェントにタスクを委任
   - アクションタイプ: `DELEGATE`

5. **ChangeAgentStateAction** (`/openhands/events/action/agent.py`)
   - エージェントの状態変更を通知
   - アクションタイプ: `CHANGE_AGENT_STATE`

6. **RecallAction** (`/openhands/events/action/agent.py`)
   - グローバルディレクトリまたはユーザーワークスペースからコンテンツを取得
   - アクションタイプ: `RECALL`

7. **CondensationAction** (`/openhands/events/action/agent.py`)
   - 指定されたイベントを忘却し、オプションで要約を提供
   - アクションタイプ: `CONDENSATION`

### 10.2 ファイル操作アクション
8. **FileReadAction** (`/openhands/events/action/files.py`)
   - ファイルの読み取り（特定の行範囲の読み取りをサポート）
   - アクションタイプ: `READ`

9. **FileWriteAction** (`/openhands/events/action/files.py`)
   - ファイルへの書き込み（特定の行範囲への書き込みをサポート）
   - アクションタイプ: `WRITE`

10. **FileEditAction** (`/openhands/events/action/files.py`)
    - 各種コマンドを使用したファイル編集（view, create, str_replace, insert, undo_edit）
    - LLMベースとACIベースの編集モードをサポート
    - アクションタイプ: `EDIT`

### 10.3 コマンド実行アクション
11. **CmdRunAction** (`/openhands/events/action/commands.py`)
    - tmuxセッションでシェルコマンドを実行
    - ブロッキング/非ブロッキング実行と静的プロセス実行をサポート
    - アクションタイプ: `RUN`

12. **IPythonRunCellAction** (`/openhands/events/action/commands.py`)
    - IPythonカーネルでPythonコードを実行
    - アクションタイプ: `RUN_IPYTHON`

### 10.4 ウェブブラウジングアクション
13. **BrowseURLAction** (`/openhands/events/action/browse.py`)
    - 特定のURLを開いてブラウズ
    - アクションタイプ: `BROWSE`

14. **BrowseInteractiveAction** (`/openhands/events/action/browse.py`)
    - ブラウザインスタンスとの対話（クリック、タイプ、スクロールなど）
    - アクションタイプ: `BROWSE_INTERACTIVE`

### 10.5 コミュニケーションアクション
15. **MessageAction** (`/openhands/events/action/message.py`)
    - ユーザーへのメッセージ送信（画像やファイルを含めることが可能）
    - アクションタイプ: `MESSAGE`

16. **SystemMessageAction** (`/openhands/events/action/message.py`)
    - エージェントプロンプトと利用可能なツールを含むシステムメッセージ
    - アクションタイプ: `SYSTEM`

### 10.6 MCP（Model Context Protocol）アクション
17. **MCPAction** (`/openhands/events/action/mcp.py`)
    - MCPサーバーと対話して外部ツールを呼び出す
    - アクションタイプ: `MCP`

### 10.7 ユーティリティアクション
18. **NullAction** (`/openhands/events/action/empty.py`)
    - 何もしないno-operationアクション
    - アクションタイプ: `NULL`

### 10.8 追加のアクションタイプ（スキーマ定義のみ）
以下のアクションタイプはスキーマで定義されているが、専用のアクションクラスは実装されていない：
- `START` - 新しい開発タスクを開始（クライアントのみ）
- `PAUSE` - タスクを一時停止
- `RESUME` - タスクを再開
- `STOP` - タスクを停止
- `PUSH` - GitHubにブランチをプッシュ
- `SEND_PR` - GitHubにPRを送信

各アクションは基底の`Action`クラスを継承し、以下を持つ：
- `runnable`プロパティ：実行可能かどうかを示す
- `security_risk`レベル：LOW、MEDIUM、HIGH
- `message`プロパティ：ユーザーフレンドリーな表示用
- `action`フィールド：ActionTypeを指定

## 11. CLIモードで利用可能な機能

### 11.1 CLIモードの概要
CLIモードは、Dockerなしでローカル環境で直接実行できる軽量な実行モードです。ブラウジングやJupyter等の一部機能は制限されますが、コード編集やファイル操作などの基本的な開発タスクを実行できます。

### 11.2 利用可能なエージェント（CLIモード）

#### 実用的なエージェント
1. **CodeActAgent** (`/openhands/agenthub/codeact_agent/`)
   - デフォルトの汎用エージェント
   - ファイル操作、コマンド実行、コード編集が可能
   - 注意：BrowsingAgentへの委任は機能しない

2. **ReadOnlyAgent** (`/openhands/agenthub/readonly_agent/`)
   - 読み取り専用の安全なエージェント
   - コードレビューや分析に適している

3. **LocAgent** (`/openhands/agenthub/loc_agent/`)
   - CodeActAgentの特殊版
   - 大規模コードベースの探索に特化

#### テスト用エージェント
4. **DummyAgent** (`/openhands/agenthub/dummy_agent/`)
   - 開発・テスト用のモックエージェント

#### CLIモードで使用不可のエージェント
- **BrowsingAgent** - ブラウザ機能が必要
- **VisualBrowsingAgent** - ブラウザ機能が必要

### 11.3 利用可能なツールとアクション（CLIモード）

#### ファイル操作
- **FileReadAction**: ファイル読み取り
- **FileWriteAction**: ファイル書き込み
- **FileEditAction**: ファイル編集（str_replace、insert等）

#### コマンド実行
- **CmdRunAction**: bashコマンド実行（Windows: PowerShell）
- **IPythonRunCellAction**: Pythonコード実行

#### エージェント制御
- **MessageAction**: ユーザーとの対話
- **AgentFinishAction**: タスク完了
- **AgentThinkAction**: 思考プロセスの記録
- **AgentRejectAction**: タスク拒否

#### その他
- **MCPAction**: 外部ツール統合（設定が必要）
- **RecallAction**: マイクロエージェント知識の取得

### 11.4 CLIランタイム（`/openhands/runtime/impl/cli/`）

#### 特徴
- ローカルのsubprocessでコマンドを実行
- Python標準ライブラリでファイル操作
- 一時ディレクトリまたは指定ディレクトリで作業
- セキュリティ：サンドボックス化されていない

#### 制限事項
- ブラウザ機能：利用不可
- Jupyter機能：設定により利用可能だが推奨されない
- Docker：不要（直接実行）
- ネットワーク分離：なし

### 11.5 推奨設定（config.toml）

```toml
[runtime]
runtime = "cli"

[agent]
default_agent = "CodeActAgent"
enable_browsing = false
enable_jupyter = false  # CLIモードでは推奨されない
enable_cmd = true
enable_editor = true
enable_llm_editor = false  # より安定したstr_replace_editorを推奨
```

### 11.6 ディレクトリ構造（CLIモード関連）

```
/openhands/
├── /agenthub/              # エージェント実装
│   ├── /codeact_agent/     # メインエージェント
│   ├── /readonly_agent/    # 読み取り専用
│   └── /loc_agent/         # コードベース探索
├── /cli/                   # CLIインターフェース
├── /runtime/
│   └── /impl/cli/          # CLIランタイム実装
├── /events/
│   ├── /action/            # 実行可能なアクション
│   └── /observation/       # アクション結果
└── /memory/                # トークン管理・履歴圧縮
```

### 11.7 CLIモードの使用例

```bash
# 基本的な使用
poetry run python -m openhands.core.main \
  -t "Fix the bug in main.py" \
  -c CodeActAgent

# 読み取り専用モード
poetry run python -m openhands.core.main \
  -t "Review the code quality" \
  -c ReadOnlyAgent

# 作業ディレクトリ指定
poetry run python -m openhands.core.main \
  -t "Refactor the project" \
  -c CodeActAgent \
  --workspace-dir /path/to/project
```

## 12. 用語集

- **Agent**: タスクを実行するAIエンティティ
- **Runtime**: エージェントが動作する実行環境
- **Controller**: エージェントの実行を管理するコンポーネント
- **Event Stream**: 非同期イベント処理システム
- **MCP**: Model Context Protocol - 外部ツール統合プロトコル
- **Condenser**: 会話履歴を圧縮する機能
- **Sandbox**: 隔離された実行環境
- **Microagent**: エージェントに知識を注入するプロンプト拡張
- **Delegate**: エージェントが他のエージェントにタスクを委任すること
- **Parent Agent**: 委任元のエージェント（役割であり特定の型ではない）
- **Action**: エージェントが実行可能な操作の単位
- **Observation**: アクション実行後の結果を表すイベント
- **CLIRuntime**: Dockerなしでローカル実行するランタイム
- **bid**: ブラウザ要素の一意識別子（browser ID）
