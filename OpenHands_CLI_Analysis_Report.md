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

### 10. BlueLampシステム効率的実装ガイド

#### 🚀 最効率アプローチ: CodeActAgent拡張パターン

OpenHandsの既存アーキテクチャを最大限活用した効率的な実装方法：

```
openhands/
└── agenthub/
    ├── __init__.py  # 既存エージェント + BlueLamp統合
    ├── codeact_agent/  # 既存 → BlueLampOrchestrator化
    │   ├── __init__.py
    │   ├── codeact_agent.py  # BlueLampロジック統合
    │   ├── function_calling.py  # 16個の委譲ツール追加
    │   └── prompts/
    │       └── system_prompt.j2  # BlueLampプロンプト
    ├── browsing_agent/  # 既存のまま
    ├── readonly_agent/  # 既存のまま
    ├── visualbrowsing_agent/  # 既存のまま
    ├── dummy_agent/  # 既存のまま
    ├── loc_agent/  # 既存のまま
    │
    └── bluelamp_agents/  # ★統合ディレクトリ
        ├── __init__.py  # 16エージェント一括登録
        ├── agents.py    # 16エージェントクラス統合定義
        └── prompts/     # 16個のプロンプトファイル
            ├── requirements_engineer.j2
            ├── ui_ux_designer.j2
            ├── data_modeling_engineer.j2
            ├── system_architect.j2
            ├── implementation_consultant.j2
            ├── environment_setup.j2
            ├── prototype_implementation.j2
            ├── backend_implementation.j2
            ├── test_quality_verification.j2
            ├── api_integration.j2
            ├── debug_detective.j2
            ├── deploy_specialist.j2
            ├── github_manager.j2
            ├── typescript_manager.j2
            ├── feature_extension.j2
            └── refactoring_expert.j2
```

#### 💡 効率性の核心

**1. CodeActAgent拡張による委譲システム**
```python
# openhands/agenthub/codeact_agent/function_calling.py に追加
elif tool_call.function.name == 'delegate_to_requirements_engineer':
    action = AgentDelegateAction(agent='RequirementsEngineer', inputs=arguments)
elif tool_call.function.name == 'delegate_to_ui_ux_designer':
    action = AgentDelegateAction(agent='UIUXDesigner', inputs=arguments)
# ... 残り14個の委譲ツール
```

**2. 統合エージェントファイル**
```python
# openhands/agenthub/bluelamp_agents/agents.py
class RequirementsEngineer(Agent):
    VERSION = '1.0'
    @property
    def prompt_manager(self):
        return PromptManager(
            prompt_dir=os.path.join(os.path.dirname(__file__), 'prompts'),
            system_prompt_filename='requirements_engineer.j2'
        )
    def step(self, state): 
        return AgentFinishAction(output="要件定義書作成完了")

# 16エージェントを1ファイルで効率的に定義
```

**3. デフォルトエージェント設定**
```toml
# config.toml
[core]
default_agent = "CodeActAgent"  # BlueLampOrchestrator化済み
```

#### 📊 構造比較

| 項目 | 従来設計 | 効率的設計 |
|------|----------|------------|
| **ディレクトリ数** | 17個 | 1個 |
| **ファイル数** | 51個 | 5個 |
| **実装時間** | 数日 | 数時間 |
| **保守性** | 分散管理 | 集中管理 |
| **デバッグ** | 複雑 | シンプル |

#### ⚡ 実装ステップ

1. **CodeActAgent → BlueLampOrchestrator化**
   - system_prompt.j2をBlueLampプロンプトに変更
   - function_calling.pyに16個の委譲ツール追加

2. **bluelamp_agents統合ディレクトリ作成**
   - 16個の軽量エージェントクラスを1ファイルで定義
   - 16個のプロンプトを1ディレクトリに集約

3. **起動テスト**
   ```bash
   poetry run openhands  # CodeActAgentがBlueLampOrchestratorとして動作
   ```

#### 🎯 設計の利点

- **既存システム活用**: OpenHandsの委譲メカニズムをそのまま利用
- **最小変更**: 既存コードへの影響を最小限に抑制
- **保守容易**: 集中管理による簡潔な構造
- **拡張性**: 新しい専門エージェントの追加が簡単

#### 🔄 委譲フローの実装例

**BlueLampOrchestrator委譲フロー:**
```
ユーザー要求 → BlueLampOrchestrator（CodeActAgent化）
    ↓
[進捗分析] → 適切な専門エージェントを選択
    ↓
AgentDelegateAction → 専門エージェント実行
    ↓
AgentDelegateObservation → 結果をOrchestrator受信
    ↓
[次フェーズ判断] → 継続 or 完了
```

**委譲ツールの実装例:**
```python
# openhands/agenthub/codeact_agent/function_calling.py に追加

# 16個の委譲ツール定義
BLUELAMP_TOOLS = [
    {
        'type': 'function',
        'function': {
            'name': 'delegate_to_requirements_engineer',
            'description': '要件定義タスクをRequirementsEngineerに委譲',
            'parameters': {
                'type': 'object',
                'properties': {
                    'task': {'type': 'string', 'description': '実行するタスク内容'},
                    'context': {'type': 'object', 'description': '追加コンテキスト'}
                },
                'required': ['task']
            }
        }
    },
    # ... 残り15個の委譲ツール
]

# function_calling.pyの処理部分
elif tool_call.function.name == 'delegate_to_requirements_engineer':
    action = AgentDelegateAction(agent='RequirementsEngineer', inputs=arguments)
elif tool_call.function.name == 'delegate_to_ui_ux_designer':
    action = AgentDelegateAction(agent='UIUXDesigner', inputs=arguments)
# ... 残り14個の処理
```

**統合エージェント定義:**
```python
# openhands/agenthub/bluelamp_agents/agents.py
import os
from openhands.controller.agent import Agent
from openhands.events.action import AgentFinishAction
from openhands.utils.prompt import PromptManager

class BlueLampBaseAgent(Agent):
    """BlueLamp専門エージェントの基底クラス"""
    VERSION = '1.0'
    
    def __init__(self, llm, config=None):
        super().__init__(llm, config)
        self._prompt_manager = None
    
    @property 
    def prompt_manager(self):
        if self._prompt_manager is None:
            self._prompt_manager = PromptManager(
                prompt_dir=os.path.join(os.path.dirname(__file__), 'prompts'),
                system_prompt_filename=f'{self.__class__.__name__.lower()}.j2'
            )
        return self._prompt_manager
    
    def step(self, state):
        # 基本的な実装: タスク完了を返す
        return AgentFinishAction(output=f"{self.__class__.__name__}タスク完了")

# 16個の専門エージェント定義
class RequirementsEngineer(BlueLampBaseAgent): pass
class UIUXDesigner(BlueLampBaseAgent): pass  
class DataModelingEngineer(BlueLampBaseAgent): pass
class SystemArchitect(BlueLampBaseAgent): pass
class ImplementationConsultant(BlueLampBaseAgent): pass
class EnvironmentSetup(BlueLampBaseAgent): pass
class PrototypeImplementation(BlueLampBaseAgent): pass
class BackendImplementation(BlueLampBaseAgent): pass
class TestQualityVerification(BlueLampBaseAgent): pass
class APIIntegration(BlueLampBaseAgent): pass
class DebugDetective(BlueLampBaseAgent): pass
class DeploySpecialist(BlueLampBaseAgent): pass
class GitHubManager(BlueLampBaseAgent): pass
class TypeScriptManager(BlueLampBaseAgent): pass
class FeatureExtension(BlueLampBaseAgent): pass
class RefactoringExpert(BlueLampBaseAgent): pass
```

**一括登録:**
```python
# openhands/agenthub/bluelamp_agents/__init__.py
from .agents import *
from openhands.controller.agent import Agent

# 16エージェントを一括登録
BLUELAMP_AGENTS = [
    ('RequirementsEngineer', RequirementsEngineer),
    ('UIUXDesigner', UIUXDesigner),
    ('DataModelingEngineer', DataModelingEngineer),
    ('SystemArchitect', SystemArchitect),
    ('ImplementationConsultant', ImplementationConsultant),
    ('EnvironmentSetup', EnvironmentSetup),
    ('PrototypeImplementation', PrototypeImplementation),
    ('BackendImplementation', BackendImplementation),
    ('TestQualityVerification', TestQualityVerification),
    ('APIIntegration', APIIntegration),
    ('DebugDetective', DebugDetective),
    ('DeploySpecialist', DeploySpecialist),
    ('GitHubManager', GitHubManager),
    ('TypeScriptManager', TypeScriptManager),
    ('FeatureExtension', FeatureExtension),
    ('RefactoringExpert', RefactoringExpert),
]

for name, cls in BLUELAMP_AGENTS:
    Agent.register(name, cls)
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

## CodeActAgent詳細分析

### ディレクトリ構造と役割

```
openhands/agenthub/codeact_agent/
├── README.md                    # エージェントの概要とドキュメント
├── __init__.py                  # エージェント登録 (Agent.register)
├── codeact_agent.py            # メインエージェントクラス実装
├── function_calling.py         # ツール定義と関数呼び出し処理
├── prompts/                    # プロンプトテンプレート
│   ├── additional_info.j2       # 追加情報テンプレート
│   ├── in_context_learning_example.j2       # 学習例テンプレート
│   ├── in_context_learning_example_suffix.j2 # 学習例サフィックス
│   ├── microagent_info.j2       # マイクロエージェント情報
│   ├── system_prompt.j2         # システムプロンプト（メイン）
│   └── user_prompt.j2           # ユーザープロンプト
└── tools/                      # 専用ツール実装
    ├── __init__.py              # ツールインポート定義
    ├── bash.py                  # Bashコマンド実行ツール
    ├── browser.py               # ブラウザ操作ツール
    ├── finish.py                # タスク完了ツール
    ├── ipython.py               # Python実行ツール
    ├── llm_based_edit.py        # LLMベースファイル編集
    ├── str_replace_editor.py    # 文字列置換エディタ
    └── think.py                 # 思考プロセスツール
```

### 各ファイルの詳細な役割

#### 1. __init__.py
**役割**: エージェント登録とモジュール定義
```python
from openhands.agenthub.codeact_agent.codeact_agent import CodeActAgent
from openhands.controller.agent import Agent

Agent.register('CodeActAgent', CodeActAgent)
```
- CodeActAgentクラスをOpenHandsエコシステムに登録
- CLIから`--agent-cls CodeActAgent`で指定可能にする

#### 2. codeact_agent.py
**役割**: CodeActAgentのメインクラス実装

**主要機能**:
- **エージェント基底クラス継承**: `Agent`クラスを継承した完全なエージェント実装
- **ツール管理**: 8つの内蔵ツール（bash, ipython, browser, editor等）の統合
- **メモリ管理**: ConversationMemoryとCondenser（記憶圧縮）機能
- **状態管理**: エージェントの実行状態とアクション履歴を管理
- **設定可能性**: enable_browsing, enable_jupyter, enable_llm_editorの切り替え

**主要なメソッド**:
- `__init__()`: LLM、設定、ツール、メモリの初期化
- `prompt_manager`: プロンプトテンプレートの管理
- `_get_tools()`: 利用可能ツールのリスト生成
- `step()`: 1ステップの実行（State → Action）
- `reset()`: エージェント状態のリセット

#### 3. function_calling.py
**役割**: 関数呼び出しインターフェースとツール定義

**主要機能**:
- **ツール定義**: 各ツールのパラメータスキーマと説明
- **レスポンス解析**: LLM出力をOpenHandsアクションに変換
- **委譲処理**: AgentDelegateActionの実装
- **エラーハンドリング**: 関数呼び出しの検証とエラー処理

**処理フロー**:
```python
response_to_actions(ModelResponse) → list[Action]
```
1. LLMからのtool_callsを解析
2. 各tool_callを対応するActionに変換
3. 引数の検証とエラーハンドリング
4. Actionリストを返す

**サポートする関数**:
- `execute_bash`: Bashコマンド実行
- `execute_ipython_cell`: Python実行
- `str_replace_editor`: ファイル編集
- `edit_file`: LLMベースファイル編集
- `browser`: ブラウザ操作
- `finish`: タスク完了
- `think`: 思考プロセス
- `delegate_to_browsing_agent`: BrowsingAgentへの委譲

#### 4. prompts/system_prompt.j2
**役割**: エージェントの基本的な動作指針と役割定義

**主要な指針**:
- **効率性**: 複数アクションの統合、適切なツールの使用
- **ファイルシステム**: 絶対パス使用、直接編集優先
- **コード品質**: クリーンで効率的な実装、最小限の変更
- **バージョン管理**: Git操作の安全性、適切なコミット
- **問題解決ワークフロー**: 探索→分析→テスト→実装→検証

#### 5. tools/配下の専用ツール

##### bash.py
- **機能**: Linuxコマンド実行
- **特徴**: バックグラウンド実行、タイムアウト処理、インタラクティブプロセス対応

##### browser.py
- **機能**: Webブラウザ操作
- **特徴**: ページナビゲーション、要素操作、フォーム入力、ファイルアップロード

##### finish.py
- **機能**: タスク完了処理
- **特徴**: 最終結果の出力、エージェント終了処理

##### ipython.py
- **機能**: Python/IPython実行
- **特徴**: マジックコマンド対応、変数スコープ管理、パッケージインストール

##### llm_based_edit.py
- **機能**: LLMを使ったファイル編集
- **特徴**: 自然言語での編集指示、部分編集、大ファイル対応

##### str_replace_editor.py
- **機能**: 文字列置換によるファイル編集
- **特徴**: 正確な文字列マッチング、アンドゥ機能、行番号表示

##### think.py
- **機能**: 思考プロセスの明示的処理
- **特徴**: 内部推論の可視化、デバッグ支援

### CodeActAgentの設計思想

#### 1. 統一アクション空間
- すべての操作をコード実行として統一
- Bash、Python、ブラウザ操作を単一インターフェースで提供

#### 2. 関数呼び出しベース
- LiteLLMのChatCompletionToolParamを使用
- 構造化された関数呼び出しインターフェース

#### 3. プラガブル設計
- ツールの有効/無効を設定で切り替え可能
- 新しいツールの追加が容易

#### 4. メモリ効率
- 会話履歴の自動圧縮（Condenser）
- メモリ使用量の最適化

#### 5. 委譲機能
- 他のエージェントへのタスク委譲（delegate_to_browsing_agent）
- マルチエージェント協調の基盤

### BlueLampシステムへの適用

#### CodeActAgentをBlueLampOrchestratorとして拡張する方法

1. **プロンプト変更**:
   - `prompts/system_prompt.j2`をBlueLampオーケストレーターの役割に変更

2. **委譲ツールの追加**:
   - `function_calling.py`に16の専門エージェントへの委譲ツールを追加
   ```python
   elif tool_call.function.name == 'delegate_to_requirements_engineer':
       action = AgentDelegateAction(agent='RequirementsEngineer', inputs=arguments)
   ```

3. **ツールリストの拡張**:
   - `_get_tools()`メソッドでBlueLamp委譲ツールを含める

#### 優位性

1. **実績のある基盤**: CodeActAgentは安定した実装とテストされた機能を提供
2. **豊富なツール**: 8つの内蔵ツールをそのまま活用可能
3. **委譲システム**: 既存の委譲メカニズムを拡張するだけで実装可能
4. **設定管理**: 既存の設定システムをそのまま利用
5. **メモリ管理**: 大規模プロジェクトでのメモリ効率を確保

このCodeActAgentの詳細分析により、BlueLampシステムの実装がOpenHandsの既存アーキテクチャと完全に調和することが確認できます。

