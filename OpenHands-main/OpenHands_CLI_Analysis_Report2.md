# OpenHands CLI機能 調査レポート

## 概要
OpenHandsは、AIエージェントを活用したコード開発支援ツールです。本レポートでは、OpenHands-mainプロジェクトのCLI（Command Line Interface）機能に関連するファイルの構造、依存関係、および各コンポーネントの役割について調査結果をまとめます。

## ディレクトリ構造（完全版）

```
OpenHands-main/
├── openhands/
│   ├── cli/                    # メインCLIディレクトリ
│   │   ├── main.py            # CLIエントリーポイント
│   │   ├── commands.py        # コマンドハンドラー実装
│   │   ├── tui.py            # Terminal UI実装
│   │   ├── settings.py       # 設定管理UI
│   │   ├── utils.py          # ユーティリティ関数
│   │   └── suppress_warnings.py # 警告抑制ユーティリティ
│   ├── agenthub/              # エージェント実装ディレクトリ
│   │   ├── codeact_agent/     # コード実行エージェント
│   │   ├── browsing_agent/    # ブラウジングエージェント
│   │   ├── readonly_agent/    # 読み取り専用エージェント
│   │   ├── visualbrowsing_agent/ # ビジュアルブラウジングエージェント
│   │   ├── dummy_agent/       # テスト用ダミーエージェント
│   │   └── loc_agent/         # ローカルエージェント
│   ├── controller/            # エージェントコントローラー
│   │   ├── agent.py          # エージェント基底クラス
│   │   ├── agent_controller.py # エージェントコントローラー実装
│   │   ├── action_parser.py  # アクションパーサー
│   │   ├── stuck.py          # スタック検出機能
│   │   └── state/            # 状態管理
│   ├── core/                 # コアシステム機能
│   │   ├── main.py           # コアメインエントリーポイント
│   │   ├── loop.py           # メインループ処理
│   │   ├── message.py        # メッセージ処理
│   │   ├── logger.py         # ロギング機能
│   │   ├── setup.py          # セットアップ機能
│   │   ├── config/           # 設定クラス
│   │   ├── schema/           # データスキーマ
│   │   └── const/            # 定数定義
│   ├── events/               # イベント処理システム
│   │   ├── action/           # アクションイベント
│   │   │   └── commands.py   # アクションコマンド定義
│   │   ├── observation/      # 観察イベント
│   │   │   └── commands.py   # 観察コマンド定義
│   │   ├── serialization/    # シリアライゼーション
│   │   ├── event.py          # イベント基底クラス
│   │   ├── stream.py         # イベントストリーム
│   │   └── tool.py           # ツールイベント
│   ├── runtime/              # ランタイム実装
│   │   ├── impl/             # 各種ランタイム実装
│   │   │   ├── cli/          # CLIランタイム
│   │   │   │   └── cli_runtime.py
│   │   │   ├── docker/       # Dockerランタイム
│   │   │   ├── kubernetes/   # Kubernetesランタイム
│   │   │   ├── local/        # ローカルランタイム
│   │   │   ├── remote/       # リモートランタイム
│   │   │   ├── runloop/      # ランループ実装
│   │   │   ├── e2b/          # E2Bランタイム
│   │   │   ├── modal/        # Modalランタイム
│   │   │   └── daytona/      # Daytonaランタイム
│   │   ├── utils/            # ランタイムユーティリティ
│   │   │   └── command.py    # コマンドユーティリティ
│   │   ├── plugins/          # ランタイムプラグイン
│   │   ├── browser/          # ブラウザ関連
│   │   └── mcp/              # MCPプロトコル関連
│   ├── server/               # サーバー関連機能
│   │   ├── routes/           # APIルート定義
│   │   ├── session/          # セッション管理
│   │   └── conversation_manager/ # 会話管理
│   ├── storage/              # ストレージ関連
│   │   ├── conversation/     # 会話データ保存
│   │   ├── settings/         # 設定データ保存
│   │   └── secrets/          # シークレット管理
│   ├── memory/               # メモリ管理
│   │   └── condenser/        # メモリ圧縮機能
│   ├── resolver/             # 問題解決関連
│   │   ├── interfaces/       # インターフェース定義
│   │   ├── patching/         # パッチ適用機能
│   │   └── prompts/          # プロンプトテンプレート
│   ├── experiments/          # 実験管理
│   │   └── experiment_manager.py
│   ├── security/             # セキュリティ関連
│   │   └── invariant/        # 不変条件チェック
│   ├── utils/                # 汎用ユーティリティ
│   ├── llm/                  # LLM関連機能
│   ├── mcp/                  # MCPクライアント実装
│   └── microagent/           # マイクロエージェント機能
├── config.template.toml       # 設定テンプレート
├── pyproject.toml            # プロジェクト設定とCLIエントリーポイント定義
├── tests/                    # テストディレクトリ
│   ├── unit/                 # ユニットテスト
│   │   ├── test_cli.py
│   │   ├── test_cli_commands.py
│   │   ├── test_cli_settings.py
│   │   ├── test_cli_setup_flow.py
│   │   ├── test_cli_tui.py
│   │   ├── test_cli_utils.py
│   │   ├── test_cli_workspace.py
│   │   ├── test_command_success.py
│   │   └── ...（その他多数のテスト）
│   └── runtime/              # ランタイムテスト
├── frontend/                 # フロントエンド（ターミナル機能含む）
│   └── src/
│       ├── components/features/terminal/
│       ├── services/terminal-service.ts
│       └── state/command-slice.ts
└── microagents/              # マイクロエージェント定義
    ├── default-tools.md
    ├── github.md
    ├── docker.md
    └── ...（その他のエージェント定義）
```

## 主要コンポーネントと役割

### 1. エントリーポイント

#### pyproject.toml
```toml
[tool.poetry.scripts]
openhands = "openhands.cli.main:main"
```
- Poetryによってインストール時に`openhands`コマンドとして登録
- `main:main`関数が実行エントリーポイント

### 2. メインCLIモジュール（openhands/cli/）

#### openhands/cli/main.py
**役割**: CLIアプリケーションのメインエントリーポイントと実行フロー管理

**主要機能**:
- 非同期イベントループの作成と管理
- コマンドライン引数のパース
- 設定の初期化と読み込み
- セッション管理（新規作成、再開）
- エージェントとランタイムの初期化
- イベントストリームの処理
- MCP（Model Context Protocol）ツールの統合

**重要な関数**:
- `main()`: エントリーポイント、イベントループを作成
- `main_with_loop()`: 引数パースと設定初期化
- `run_session()`: メインセッション実行ループ
- `on_event_async()`: 非同期イベントハンドラー

#### openhands/cli/commands.py
**役割**: CLIコマンドの実装とハンドリング

**利用可能なコマンド**:
- `/exit`: セッション終了
- `/help`: ヘルプ表示
- `/init`: リポジトリ初期化
- `/status`: 使用状況表示
- `/new`: 新規セッション開始
- `/settings`: 設定の表示・変更
- `/resume`: 一時停止したエージェントの再開

**主要機能**:
- コマンドディスパッチング
- セキュリティチェック（信頼されたディレクトリの確認）
- リポジトリ初期化とドキュメント生成

#### openhands/cli/tui.py
**役割**: Terminal User Interfaceの実装

**主要機能**:
- カラフルなターミナル表示
- OpenHandsバナーの表示
- イベントタイプに応じた出力フォーマット
- ファイル編集の差分表示
- インタラクティブな入力処理
- コマンドのオートコンプリート
- LLM使用メトリクスの追跡と表示

**UI要素**:
- カスタムカラースキーム（ゴールド、グレー）
- マルチライン入力サポート
- Ctrl+Pでエージェントの一時停止
- リッチな差分表示（追加/削除行のハイライト）

#### openhands/cli/settings.py
**役割**: 設定の表示と変更UI

**主要機能**:
- 現在の設定を整形して表示
- 基本設定の変更（LLMプロバイダー、モデル、APIキー）
- 高度な設定の変更（カスタムURL、エージェント選択など）
- 対応プロバイダー: Anthropic, OpenAI, Mistral

#### openhands/cli/utils.py
**役割**: 共通ユーティリティ関数

**主要機能**:
- ローカル設定管理（信頼されたディレクトリ）
- モデルとプロバイダーの解析・整理
- 検証済みモデルリストの管理

### 3. エージェント実装（openhands/agenthub/）

#### codeact_agent/
**役割**: コード実行とアクション処理を行うメインエージェント
- 最も多機能なエージェント実装
- ファイル操作、コマンド実行、ブラウジング等を統合

#### browsing_agent/
**役割**: Webブラウジング専門のエージェント
- Webページの閲覧と操作
- DOM要素の検索と相互作用

#### readonly_agent/
**役割**: 読み取り専用の安全なエージェント
- ファイルの読み取りのみ許可
- 変更操作を行わない安全モード

#### visualbrowsing_agent/
**役割**: ビジュアル要素を考慮したブラウジングエージェント
- スクリーンショット解析
- ビジュアル要素の認識と操作

#### dummy_agent/
**役割**: テスト用のダミーエージェント
- 開発・テスト用途
- 最小限の機能実装

#### loc_agent/
**役割**: ローカルファイル操作専門のエージェント
- ローカルファイルシステムの操作
- ファイルの検索と編集

### 4. コントローラー（openhands/controller/）

#### agent_controller.py
**役割**: エージェントのライフサイクル管理
- エージェントの初期化と終了
- アクションの実行制御
- 状態遷移の管理

#### action_parser.py
**役割**: エージェントアクションの解析
- LLM出力からアクションを抽出
- アクション形式の検証

#### stuck.py
**役割**: エージェントのスタック検出
- 無限ループの検出
- スタック状態からの回復

### 5. イベントシステム（openhands/events/）

#### action/commands.py
**役割**: 実行可能なアクションコマンドの定義
- CmdRunAction: コマンド実行
- FileEditAction: ファイル編集
- BrowseURLAction: URL閲覧

#### observation/commands.py
**役割**: 観察結果コマンドの定義
- CmdOutputObservation: コマンド出力
- FileReadObservation: ファイル読み取り結果
- BrowserOutputObservation: ブラウザ出力

### 6. ランタイム実装（openhands/runtime/impl/）

各ランタイムは異なる実行環境を提供：
- **docker/**: Dockerコンテナ内での隔離実行
- **kubernetes/**: Kubernetesクラスタでのスケーラブル実行
- **local/**: ローカルマシンでの直接実行
- **remote/**: リモートサーバーでの実行
- **e2b/**: E2Bクラウドサービスでの実行
- **modal/**: Modalクラウドプラットフォームでの実行
- **daytona/**: Daytonaプラットフォームでの実行
- **runloop/**: Runloopサービスでの実行

### 7. 依存関係

#### 外部ライブラリ
- **asyncio**: 非同期処理の基盤
- **prompt_toolkit**: リッチなTUI構築
- **litellm**: LLMプロバイダーの統一インターフェース
- **docker**: コンテナランタイム管理
- **fastapi**: Webサーバー機能（オプション）

#### OpenHandsコアモジュール
- **エージェントシステム**: AgentController, Agent
- **ランタイム**: Runtime, create_runtime
- **イベントシステム**: EventStream, 各種イベントクラス
- **メモリ管理**: Memory, LLMSummarizingCondenser
- **設定管理**: OpenHandsConfig, FileSettingsStore
- **MCP統合**: MCPツール管理

### 8. その他の重要コンポーネント

#### server/
**役割**: WebSocketサーバーとAPI実装
- リアルタイム通信の管理
- RESTful APIエンドポイント
- セッション管理

#### storage/
**役割**: データの永続化
- 会話履歴の保存
- 設定の保存と読み込み
- シークレット管理

#### memory/
**役割**: エージェントメモリ管理
- 会話コンテキストの管理
- メモリ圧縮とサマリー生成

#### resolver/
**役割**: 問題解決エンジン
- イシュー解決の自動化
- パッチ生成と適用

#### security/
**役割**: セキュリティ機能
- アクションの安全性検証
- ファイルアクセス制限

#### llm/
**役割**: LLMプロバイダー統合
- 複数のLLMプロバイダー対応
- プロンプト管理
- レスポンス処理

#### mcp/
**役割**: Model Context Protocol実装
- 外部ツールの統合
- プロトコル通信管理

#### microagent/
**役割**: マイクロエージェント管理
- 特定タスク用の小規模エージェント
- カスタムツール定義

## データフローと相互作用

### 全体的なアーキテクチャ

```
┌─────────────────────────────────────────────────────┐
│                      CLI Entry Point                      │
│                   (openhands command)                     │
└──────────────────────────┬──────────────────────────┘
                               │
                               ↓
┌─────────────────────────────────────────────────────┐
│                     main.py (CLI Core)                    │
│  ├─ Argument Parsing                                     │
│  ├─ Config Loading (config.toml, FileSettingsStore)      │
│  ├─ Session Management                                   │
│  └─ Event Loop Creation                                  │
└──────────────────────────┬──────────────────────────┘
                               │
        ┌───────────────────┴───────────────────┐
        ↓                                           ↓
┌──────────────────┐                     ┌──────────────────┐
│   Agent System    │                     │    Runtime       │
│  (agenthub/)      │←───────────────────→│  (runtime/impl/) │
└─────────┬────────┘                     └─────────┬────────┘
            │                                           │
            ↓                                           ↓
┌──────────────────┐                     ┌──────────────────┐
│   Controller      │                     │  Event System    │
│  (controller/)    │←───────────────────→│   (events/)      │
└─────────┬────────┘                     └─────────┬────────┘
            │                                           │
            └─────────────────┬──────────────────┘
                               │
                               ↓
┌─────────────────────────────────────────────────────┐
│                      TUI & Commands                       │
│              (tui.py, commands.py, settings.py)           │
└─────────────────────────────────────────────────────┘
```

### 詳細な処理フロー

```
1. ユーザー入力
   ↓
2. main.py (エントリーポイント)
   ├→ 引数パース
   ├→ 設定読み込み（config.toml, FileSettingsStore）
   └→ セッション開始
       ↓
3. run_session()
   ├→ エージェント作成 (agenthub/)
   ├→ ランタイム初期化 (runtime/impl/)
   ├→ コントローラー作成 (controller/)
   ├→ イベントストリーム設定 (events/)
   └→ メインループ
       ↓
4. イベント処理ループ
   ├→ tui.py (表示)
   ├→ commands.py (コマンド処理)
   └→ on_event_async (状態管理)
       ↓
5. アクション実行
   ├→ Agentがアクションを生成
   ├→ Controllerがアクションを検証
   ├→ Runtimeがアクションを実行
   └→ 結果をObservationとして返す
       ↓
6. 結果表示とフィードバック
   ├→ TUIが結果をフォーマット
   ├→ ユーザーに表示
   └→ 次のアクションへ
```

## 設定ファイル

### config.template.toml
- LLM設定（プロバイダー、モデル、APIキー）
- エージェント設定（使用エージェント、動作モード）
- サンドボックス設定（ランタイムタイプ、タイムアウト）
- セキュリティ設定（確認モード、ファイルアクセス制限）
- メモリ設定（コンデンサータイプ）

## テストカバレッジ

CLI機能に対して包括的なテストスイートが用意されています：
- 基本的なCLI動作テスト
- コマンドハンドリングテスト
- 設定管理テスト
- TUI表示テスト
- セットアップフローテスト
- エラーハンドリングテスト

## DELEGATION（委譲）メカニズム

OpenHandsは、エージェント間でタスクを委譲できる高度なマルチエージェントシステムを実装しています。

### 1. 委譲の基本コンポーネント

#### AgentDelegateAction（openhands/events/action/agent.py）
**役割**: エージェント委譲アクションの定義
- `agent`: 委譲先エージェント名
- `inputs`: 委譲時に渡すパラメータ
- `thought`: 委譲の理由
- メッセージ: "I'm asking {agent} for help with this task."

#### AgentDelegateObservation（openhands/events/observation/delegate.py）
**役割**: 委譲結果の観察
- `outputs`: 委譲先からの結果（辞書形式）
- 委譲タスクの完了状態と結果を含む

### 2. 委譲の実行フロー

#### AgentController（openhands/controller/agent_controller.py）での処理
1. `AgentDelegateAction`を受信すると`start_delegate()`を実行
2. `Agent.get_cls(action.agent)`で指定エージェントのクラスを取得
3. 子エージェントコントローラーを作成（メトリクスは共有、イテレーションは独立）
4. inputsに'task'が含まれる場合、MessageActionとして委譲先に投稿
5. 委譲先エージェントが独立して実行
6. 結果を`AgentDelegateObservation`として返却

### 3. エージェント登録システム

#### レジストリパターン（openhands/controller/agent.py）
```python
# エージェントの登録
Agent.register('BrowsingAgent', BrowsingAgent)
Agent.register('CodeActAgent', CodeActAgent)
# 利用可能なエージェントの一覧
Agent.list_agents()
```

#### 登録済みエージェント
- **BrowsingAgent**: Webブラウジング専門
- **CodeActAgent**: 汎用コーディングエージェント
- **DummyAgent**: テスト用
- **LocAgent**: ローケーション関連
- **ReadOnlyAgent**: 読み取り専用操作
- **VisualBrowsingAgent**: ビジュアルブラウジング

### 4. CodeActAgentの委譲実装例

```python
# openhands/agenthub/codeact_agent/function_calling.py
elif tool_call.function.name == 'delegate_to_browsing_agent':
    action = AgentDelegateAction(
        agent='BrowsingAgent',
        inputs=arguments,
    )
```

CodeActAgentはBrowsingAgentへの委譲ツールを持ち、ブラウジングタスクを専門エージェントに委譲できます。

### 5. マルチエージェントアーキテクチャ

#### 階層構造
- **Task**: ユーザーとOpenHands間の完全な会話
- **Subtask**: エージェント間または エージェント・ユーザー間の会話
- 親子関係: 委譲により親エージェントと子エージェントの関係が形成
- グローバルイテレーションカウンター: 全エージェントで共有
- ローカルイテレーション: 各エージェントで独立管理
- 委譲レベル: 委譲の深さを追跡

### 6. 状態管理

#### 委譲中の状態保持
- 親エージェントのdelegate_controllerが設定される
- メトリクスはグローバルに蓄積（子のメトリクスが親に追加）
- ローカルメトリクスは個別にアクセス可能
- 子の完了時に親のイテレーションカウントが更新
- 制御フラグ（予算、イテレーション制限）は親子で共有

### 7. 委譲の特徴と利点

1. **動的エージェント選択**: 登録済みの任意のエージェントに委譲可能
2. **状態保持**: 親エージェントは子の実行中も状態を維持
3. **メトリクス追跡**: グローバルとローカルの両方のメトリクスを管理
4. **エラーハンドリング**: 委譲先は様々な状態（FINISHED、ERROR、REJECTED）で終了可能
5. **リソース制限**: グローバル制限が委譲チェーン全体に適用

### 8. 委譲メカニズムの図解

```
┌─────────────────┐
│  User Request   │
└────────┬────────┘
         │
         ↓
┌─────────────────┐     delegate_to_browsing_agent()
│  CodeActAgent   │ ──────────────────────────────→
│   (Parent)      │                                  │
└─────────────────┘                                  │
         ↑                                           ↓
         │                                  ┌─────────────────┐
         │                                  │ BrowsingAgent   │
         │                                  │   (Child)       │
         │                                  └────────┬────────┘
         │                                           │
         │              AgentDelegateObservation     │
         └───────────────────────────────────────────┘
```

### 9. 制限事項と考慮点

1. 現在、CodeActAgentのみが明示的な委譲ツールを持つ（BrowsingAgent向けにハードコード）
2. 任意のエージェントに動的に委譲する汎用ツールは未実装
3. 委譲は一方向（親から子へ）で、実行中の通信チャネルは組み込まれていない

このDELEGATIONメカニズムにより、OpenHandsは真のマルチエージェントシステムとして機能し、専門化されたエージェントが複雑なタスクで協力できます。

### 10. カスタムエージェントの拡張実装ガイド

#### BlueLampシステム（1オーケストレーター + 16専門エージェント）のフラット構造

```
openhands/
└── agenthub/
    ├── __init__.py  # ここでインポートして登録を実行
    ├── codeact_agent/  # 既存のCodeActAgent
    ├── browsing_agent/  # 既存のBrowsingAgent
    │
    ├── bluelamp_orchestrator/  # ★0 BlueLampオーケストレーター: 全体統括
    │   ├── __init__.py
    │   ├── bluelamp_orchestrator.py
    │   └── prompts/
    │       └── system_prompt.j2
    │
    ├── requirements_engineer/  # ★1 要件定義エンジニア
    │   ├── __init__.py
    │   ├── requirements_engineer.py
    │   └── prompts/
    │       └── system_prompt.j2
    │
    ├── ui_ux_designer/  # ★2 UI/UXデザイナー
    │   ├── __init__.py
    │   ├── ui_ux_designer.py
    │   └── prompts/
    │       └── system_prompt.j2
    │
    ├── data_modeling_engineer/  # ★3 データモデリングエンジニア
    │   ├── __init__.py
    │   ├── data_modeling_engineer.py
    │   └── prompts/
    │       └── system_prompt.j2
    │
    ├── system_architect/  # ★4 システムアーキテクト
    │   ├── __init__.py
    │   ├── system_architect.py
    │   └── prompts/
    │       └── system_prompt.j2
    │
    ├── implementation_consultant/  # ★5 実装コンサルタント
    │   ├── __init__.py
    │   ├── implementation_consultant.py
    │   └── prompts/
    │       └── system_prompt.j2
    │
    ├── environment_setup/  # ★6 環境構築
    │   ├── __init__.py
    │   ├── environment_setup.py
    │   └── prompts/
    │       └── system_prompt.j2
    │
    ├── prototype_implementation/  # ★7 プロトタイプ実装
    │   ├── __init__.py
    │   ├── prototype_implementation.py
    │   └── prompts/
    │       └── system_prompt.j2
    │
    ├── backend_implementation/  # ★8 バックエンド実装
    │   ├── __init__.py
    │   ├── backend_implementation.py
    │   └── prompts/
    │       └── system_prompt.j2
    │
    ├── test_quality_verification/  # ★9 テスト品質検証
    │   ├── __init__.py
    │   ├── test_quality_verification.py
    │   └── prompts/
    │       └── system_prompt.j2
    │
    ├── api_integration/  # ★10 API統合
    │   ├── __init__.py
    │   ├── api_integration.py
    │   └── prompts/
    │       └── system_prompt.j2
    │
    ├── debug_detective/  # ★11 デバッグ探偵
    │   ├── __init__.py
    │   ├── debug_detective.py
    │   └── prompts/
    │       └── system_prompt.j2
    │
    ├── deploy_specialist/  # ★12 デプロイスペシャリスト
    │   ├── __init__.py
    │   ├── deploy_specialist.py
    │   └── prompts/
    │       └── system_prompt.j2
    │
    ├── github_manager/  # ★13 GitHubマネージャー
    │   ├── __init__.py
    │   ├── github_manager.py
    │   └── prompts/
    │       └── system_prompt.j2
    │
    ├── typescript_manager/  # ★14 TypeScriptマネージャー（共通サービス）
    │   ├── __init__.py
    │   ├── typescript_manager.py
    │   └── prompts/
    │       └── system_prompt.j2
    │
    ├── feature_extension/  # ★15 機能拡張
    │   ├── __init__.py
    │   ├── feature_extension.py
    │   └── prompts/
    │       └── system_prompt.j2
    │
    └── refactoring_expert/  # ★16 リファクタリングエキスパート
        ├── __init__.py
        ├── refactoring_expert.py
        └── prompts/
            └── system_prompt.j2
```

#### 各エージェントの実装例

**1. BlueLampOrchestrator（全体統括）**
```python
# openhands/agenthub/bluelamp_orchestrator/bluelamp_orchestrator.py
import os
from openhands.agenthub.codeact_agent.codeact_agent import CodeActAgent
from openhands.utils.prompt import PromptManager

class BlueLampOrchestrator(CodeActAgent):
    VERSION = '1.0'
    
    @property
    def prompt_manager(self) -> PromptManager:
        if self._prompt_manager is None:
            self._prompt_manager = PromptManager(
                prompt_dir=os.path.join(os.path.dirname(__file__), 'prompts'),
            )
        return self._prompt_manager

# openhands/agenthub/bluelamp_orchestrator/__init__.py
from openhands.agenthub.bluelamp_orchestrator.bluelamp_orchestrator import BlueLampOrchestrator
from openhands.controller.agent import Agent

Agent.register('BlueLampOrchestrator', BlueLampOrchestrator)
```

**2. RequirementsEngineer（★１ 要件定義エンジニア）**
```python
# openhands/agenthub/requirements_engineer/requirements_engineer.py
import os
from openhands.agenthub.codeact_agent.codeact_agent import CodeActAgent
from openhands.utils.prompt import PromptManager

class RequirementsEngineer(CodeActAgent):
    VERSION = '1.0'
    
    @property
    def prompt_manager(self) -> PromptManager:
        if self._prompt_manager is None:
            self._prompt_manager = PromptManager(
                prompt_dir=os.path.join(os.path.dirname(__file__), 'prompts'),
            )
        return self._prompt_manager

# openhands/agenthub/requirements_engineer/__init__.py
from openhands.agenthub.requirements_engineer.requirements_engineer import RequirementsEngineer
from openhands.controller.agent import Agent

Agent.register('RequirementsEngineer', RequirementsEngineer)
```

（他の15エージェントも同様の構造で実装）

#### メインの__init__.pyでの登録

```python
# openhands/agenthub/__init__.py
# 既存のインポート
from openhands.agenthub.browsing_agent import BrowsingAgent
from openhands.agenthub.codeact_agent import CodeActAgent

# BlueLampシステムのエージェントインポート
from openhands.agenthub.bluelamp_orchestrator import BlueLampOrchestrator

# 16の専門エージェント
from openhands.agenthub.requirements_engineer import RequirementsEngineer  # ★1
from openhands.agenthub.ui_ux_designer import UIUXDesigner  # ★2
from openhands.agenthub.data_modeling_engineer import DataModelingEngineer  # ★3
from openhands.agenthub.system_architect import SystemArchitect  # ★4
from openhands.agenthub.implementation_consultant import ImplementationConsultant  # ★5
from openhands.agenthub.environment_setup import EnvironmentSetup  # ★6
from openhands.agenthub.prototype_implementation import PrototypeImplementation  # ★7
from openhands.agenthub.backend_implementation import BackendImplementation  # ★8
from openhands.agenthub.test_quality_verification import TestQualityVerification  # ★9
from openhands.agenthub.api_integration import APIIntegration  # ★10
from openhands.agenthub.debug_detective import DebugDetective  # ★11
from openhands.agenthub.deploy_specialist import DeploySpecialist  # ★12
from openhands.agenthub.github_manager import GitHubManager  # ★13
from openhands.agenthub.typescript_manager import TypeScriptManager  # ★14
from openhands.agenthub.feature_extension import FeatureExtension  # ★15
from openhands.agenthub.refactoring_expert import RefactoringExpert  # ★16

__all__ = [
    'BrowsingAgent',
    'CodeActAgent',
    # BlueLampシステム
    'BlueLampOrchestrator',
    # 16の専門エージェント
    'RequirementsEngineer',
    'UIUXDesigner',
    'DataModelingEngineer',
    'SystemArchitect',
    'ImplementationConsultant',
    'EnvironmentSetup',
    'PrototypeImplementation',
    'BackendImplementation',
    'TestQualityVerification',
    'APIIntegration',
    'DebugDetective',
    'DeploySpecialist',
    'GitHubManager',
    'TypeScriptManager',
    'FeatureExtension',
    'RefactoringExpert',
]
```

#### システムプロンプトの例

**BlueLampOrchestrator用（bluelamp_orchestrator/prompts/system_prompt.j2）**
```jinja2
# 🌯 BlueLamp オーケストレーター

> **役割**: プロジェクト全体の調整役として19の専門エージェントを統括し、ユーザーの要望を完遂まで導く

## 📋 基本的な役割

### 1. 🎯 実装計画のオーガナイザー
  - **ヒアリング**: ユーザー要望を正確に理解し、適切なエージェントへ伝達
  - **計画委譲**: 新規プロジェクト、実装計画、機能追加の適切な委譲
  - **計画承認**: エージェントが作成した計画を確認し、実行開始を判断
  - **タスク管理**: SCOPE_PROGRESS.mdの進捗を監視し、次の委譲を決定

### 2. 👔 プロジェクトマネージャー
- **委譲実行**: 適切なコンテキストと明確な完了条件でエージェントに委譲
- **完了責任**: 委譲したタスクを完了まで追跡し、必要に応じて追加指示
- **品質管理**: 実装フェーズでは常に型エラー0を維持

{{ instructions }}
```

**RequirementsEngineer用（requirements_engineer/prompts/system_prompt.j2）**
```jinja2
# 📝 ★１ 要件定義エンジニア

> **役割**: ユーザーの要求を詳細な要件定義書に落とし込み、プロジェクトの土台を構築する

## 🎯 主要成果物

1. **`/docs/requirements.md`**
   - 機能要件の完全なリスト
   - 非機能要件の明確化
   - 制約条件の整理

2. **SCOPE_PROGRESS.mdのページリスト**
   - 必要なページの一覧
   - 各ページの目的と機能

{{ instructions }}
```

#### 委譲の実装例

**BlueLampオーケストレーターの実装**：
```python
class BlueLampOrchestrator(CodeActAgent):
    def step(self, state):
        # SCOPE_PROGRESS.mdから現在の状態を読み取り
        progress = self.read_progress()
        
        # 次に必要なタスクを判断（フェーズに関係なく）
        if not progress.requirements_done:
            return AgentDelegateAction(
                agent='RequirementsEngineer',
                inputs={'task': '要件定義書作成'}
            )
        
        elif not progress.all_mockups_done:
            next_page = progress.get_next_page_to_design()
            return AgentDelegateAction(
                agent='UIUXDesigner',
                inputs={'task': f'{next_page}のモックアップ作成'}
            )
        
        elif progress.has_type_errors:
            return AgentDelegateAction(
                agent='TypeScriptManager',
                inputs={
                    'task': '型エラー修正',
                    'errors': progress.type_errors
                }
            )
        
        elif progress.needs_backend_implementation:
            return AgentDelegateAction(
                agent='BackendImplementation',
                inputs={
                    'task': progress.next_backend_task,
                    'context': progress.implementation_context
                }
            )
        
        # すべて完了
        return FinishAction(output="プロジェクト完了")
```

**各専門エージェントへの直接委譲**：
```python
# 要件定義を委譲
action = AgentDelegateAction(
    agent='RequirementsEngineer',
    inputs={'task': '認証システムの要件定義書作成'}
)

# UI/UXデザインを委譲
action = AgentDelegateAction(
    agent='UIUXDesigner',
    inputs={'task': 'ログインページのモックアップ作成'}
)

# 型エラー修正を委譲（共通サービス）
action = AgentDelegateAction(
    agent='TypeScriptManager',
    inputs={
        'task': '型エラーの修正',
        'errors': type_check_result.errors
    }
)
```

#### BlueLampシステムのフラット委譲フロー

```
BlueLampOrchestrator (★0: 全体統括)
    │
    ├→ ★１ RequirementsEngineer (要件定義)
    ├→ ★２ UIUXDesigner (モックアップ)
    ├→ ★３ DataModelingEngineer (データモデル)
    ├→ ★４ SystemArchitect (システム設計)
    ├→ ★５ ImplementationConsultant (実装計画)
    ├→ ★６ EnvironmentSetup (環境構築)
    ├→ ★７ PrototypeImplementation (プロトタイプ)
    ├→ ★８ BackendImplementation (バックエンド)
    ├→ ★９ TestQualityVerification (テスト検証)
    ├→ ★１０ APIIntegration (API統合)
    ├→ ★１１ DebugDetective (デバッグ)
    ├→ ★１２ DeploySpecialist (デプロイ)
    ├→ ★１３ GitHubManager (Git管理)
    ├→ ★１４ TypeScriptManager (型エラー修正)
    ├→ ★１５ FeatureExtension (機能拡張)
    └→ ★１６ RefactoringExpert (リファクタ)

※ 各エージェントは完了後、必ずBlueLampOrchestratorに制御を返す
※ TypeScriptManagerは任意のタイミングで呼び出される共通サービス
```

#### 実行フローの例

```
[設計フェーズ]
Orchestrator → ★1 → Orchestrator → ★2 → Orchestrator → ★3 → ...

[実装フェーズ]
Orchestrator → ★8 → Orchestrator → ★14(型エラー) → Orchestrator → ★9 → ...

[緊急対応]
任意のタイミングで: Orchestrator → ★11(デバッグ) → Orchestrator
```

#### BlueLampシステム実装時の重要なポイント

1. **フラット構造**: 単一階層（オーケストレーター → 16専門エージェント）
2. **委譲ルール**: すべてのエージェントは完了後、オーケストレーターに制御を返す
3. **ディレクトリ構造**: 各エージェントは独立したディレクトリに配置
4. **プロンプト管理**: 各エージェントが独自の`prompts`ディレクトリを持つ
5. **登録処理**: `__init__.py`でAgent.registerを実行
6. **インポート**: `agenthub/__init__.py`で全エージェントをインポート
7. **命名規則**: 
   - オーケストレーター: BlueLampOrchestrator
   - 専門エージェント: RequirementsEngineer, UIUXDesigner等（役割を明確に表現）
8. **共通サービス**: TypeScriptManagerは任意のタイミングで呼び出される
9. **状態管理**: SCOPE_PROGRESS.mdを単一真実源として使用
10. **柔軟な実行順序**: フェーズに固定されず、必要に応じて任意のエージェントを呼び出し

#### 委譲権限の実装設計

**重要な設計原則：委譲能力はBlueLampOrchestratorのみに限定**

1. **BlueLampOrchestratorの実装**
```python
# BlueLampOrchestratorのみがAgentDelegateActionを使用可能
from openhands.events.action import AgentDelegateAction, AgentFinishAction

class BlueLampOrchestrator(CodeActAgent):
    def step(self, state):
        # 進捗に応じて適切なエージェントに委譲
        return AgentDelegateAction(
            agent='RequirementsEngineer',
            inputs={'task': '要件定義書を作成してください'}
        )
```

2. **16専門エージェントの実装**
```python
# 専門エージェントはAgentDelegateActionをインポートしない
from openhands.events.action import AgentFinishAction  # これのみ

class RequirementsEngineer(CodeActAgent):
    def step(self, state):
        # 自分のタスクを実行
        # ...
        
        # 完了したら単純に終了（他への委譲はしない）
        return AgentFinishAction(output="要件定義書作成完了")
```

3. **この設計の利点**
- **シンプルさ**: 委譲フローが常に「Orchestrator → Agent → Orchestrator」
- **循環防止**: 専門エージェント間の相互委譲が不可能なため、循環が発生しない
- **デバッグ容易性**: すべての委譲判断が1箇所（Orchestrator）に集約
- **制御の明確さ**: 全体の流れをOrchestratorで完全に把握可能

4. **実装時の確認事項**
- BlueLampOrchestratorのみ`AgentDelegateAction`をインポート
- 16の専門エージェントは`AgentFinishAction`のみ使用
- 各エージェントは自分のタスクに専念し、完了後は自動的にOrchestratorに戻る

#### フラット構造の利点

1. **シンプルさ**: 委譲フローが常に「オーケストレーター→エージェント→オーケストレーター」
2. **デバッグ容易性**: 委譲の追跡が簡単
3. **柔軟性**: 緊急対応（TypeScriptManager、DebugDetective）が即座に可能
4. **循環リスク最小**: 単一階層のため循環参照が発生しにくい
5. **状態管理の一元化**: オーケストレーターが全体の進捗を把握

このBlueLampシステムにより、17のエージェント（オーケストレーター+16専門）がシンプルかつ効率的に連携し、複雑なプロジェクトを設計からデプロイまで一貫して管理できるシステムが実現できます。

## まとめ

OpenHandsのCLIは、モジュラーで拡張性の高いアーキテクチャを採用しています。以下が主な特徴です：

### アーキテクチャの特徴

1. **完全なモジュール分離**
   - CLIコア (cli/)
   - エージェント実装 (agenthub/)
   - ランタイム環境 (runtime/impl/)
   - イベントシステム (events/)
   - コントローラー (controller/)

2. **非同期イベント駆動アーキテクチャ**
   - asyncioベースの効率的な処理
   - リアルタイムストリーミング
   - レスポンシブなUI

3. **プラガブルシステム**
   - 6種類のエージェント実装
   - 8種類のランタイム環境
   - MCPプロトコルによる外部ツール統合

4. **リッチなTUI**
   - カラフルなターミナル表示
   - インタラクティブなコマンドシステム
   - リアルタイムフィードバック

5. **包括的な設定管理**
   - TOMLベースの設定ファイル
   - 複数のLLMプロバイダー対応
   - 柔軟なセキュリティ設定

### 主要コンポーネントの相互関係

- **CLI** → **Agent** → **Controller** → **Runtime**
- **Event System** が全コンポーネント間の通信を仲介
- **Storage** がデータの永続化を担当
- **Security** がアクションの安全性を検証

### 開発者向けの利点

1. **拡張性**: 新しいエージェントやランタイムの追加が容易
2. **保守性**: モジュール分離による明確な責任分担
3. **テスタビリティ**: 各コンポーネントの独立テストが可能
4. **パフォーマンス**: 非同期処理による高効率化

このCLIシステムは、AIエージェントを活用したコード開発支援のための強力なプラットフォームを提供しています。