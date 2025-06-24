# BlueLamp オーケストレーター実装計画書

**作成日**: 2025-01-24
**バージョン**: 1.0.0
**ステータス**: 計画段階

## 1. 概要

### 1.1 目的
現在のBlueLamp CLIの単一エージェント方式から、オーケストレーターを中心としたマルチエージェント方式へ移行する。これにより、複数の専門エージェントを並列・協調的に動作させ、より効率的な開発支援を実現する。

### 1.2 主要な変更点
- BlueLamp起動時にオーケストレーターが最初に登場
- ユーザーとの対話窓口をオーケストレーターに一本化
- 16個の専門エージェントを必要に応じて起動・管理
- エージェント間の通信とコンテキスト管理の実装

## 2. アーキテクチャ設計

### 2.1 システム構成図
```
┌─────────────────┐
│     ユーザー      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ オーケストレーター │ ← 新規実装
├─────────────────┤
│ - エージェント管理 │
│ - メッセージ中継  │
│ - コンテキスト管理 │
└────────┬────────┘
         │
    ┌────┴────┬────────┬────────┐
    ▼         ▼        ▼        ▼
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│要件定義│ │ UI/UX │ │データ │ │ ... │
│エージェ│ │デザイナ│ │モデリング│ │16個 │
└──────┘ └──────┘ └──────┘ └──────┘
```

### 2.2 データフロー
1. ユーザー入力 → オーケストレーター
2. オーケストレーター → 適切なエージェントに振り分け
3. エージェント → オーケストレーター（結果・質問）
4. オーケストレーター → ユーザー（統合された応答）

## 3. 実装対象ファイル一覧

### 3.1 新規作成ファイル

#### 3.1.1 オーケストレーターエージェント本体
```
/openhands/agenthub/orchestrator/
├── __init__.py
├── orchestrator_agent.py
└── prompts/
    └── system_prompt.j2
```

#### 3.1.2 オーケストレーター用マイクロエージェント
```
/microagents/bluelamp/
└── 00-orchestrator.md  # オーケストレーターのシステムプロンプト
```

#### 3.1.3 エージェント管理システム
```
/openhands/orchestrator/
├── __init__.py
├── agent_manager.py      # エージェントのライフサイクル管理
├── session_manager.py    # セッション管理
├── message_router.py     # メッセージルーティング
└── context_manager.py    # コンテキスト管理
```

### 3.2 修正対象ファイル

#### 3.2.1 メイン実行ファイル
- **`/openhands/cli/main.py`**
  - デフォルトエージェントをOrchestratorAgentに変更
  - 初期化処理の修正

#### 3.2.2 設定ファイル
- **`/config.toml`**
  ```toml
  [agent]
  default_agent = "OrchestratorAgent"  # CodeActAgent から変更

  [orchestrator]
  max_parallel_agents = 5
  agent_timeout = 300  # seconds
  enable_agent_sleep = true
  sleep_after_minutes = 15
  ```

#### 3.2.3 エージェント登録
- **`/openhands/agenthub/__init__.py`**
  - OrchestratorAgentの登録追加

#### 3.2.4 UI/表示関連
- **`/openhands/cli/tui.py`**
  - オーケストレーター用の表示関数追加
  - アクティブエージェント一覧表示
  - エージェントステータス表示

#### 3.2.5 コマンド処理
- **`/openhands/cli/commands.py`**
  - オーケストレーター専用コマンドの追加
  - `/status`: エージェント一覧
  - `/talk [agent]`: 特定エージェントとの対話
  - `/close [agent]`: エージェントの終了

## 4. 詳細な変更内容

### 4.1 OrchestratorAgent実装

```python
# /openhands/agenthub/orchestrator/orchestrator_agent.py

class OrchestratorAgent(Agent):
    """BlueLampオーケストレーターエージェント"""

    def __init__(self, llm: LLM, config: AgentConfig):
        super().__init__(llm, config)
        self.agent_manager = AgentManager()
        self.session_manager = SessionManager()
        self.message_router = MessageRouter()
        self.active_agents = {}

    def step(self, state: State) -> Action:
        """メインの処理ループ"""
        # 1. ユーザー入力を解析
        user_input = state.inputs.get("message", "")

        # 2. コマンド処理
        if user_input.startswith("/"):
            return self._handle_command(user_input)

        # 3. 適切なエージェントに振り分け
        target_agent = self._determine_target_agent(user_input)

        # 4. エージェントが未起動なら起動
        if target_agent not in self.active_agents:
            self._launch_agent(target_agent)

        # 5. メッセージを転送
        return self._delegate_to_agent(target_agent, user_input)
```

### 4.2 AgentManager実装

```python
# /openhands/orchestrator/agent_manager.py

class AgentManager:
    """エージェントのライフサイクル管理"""

    def __init__(self):
        self.agents = {}
        self.agent_states = {}  # active, sleeping, closed

    def launch_agent(self, agent_type: str, session_id: str) -> AgentController:
        """新しいエージェントを起動"""
        # 独立したランタイムとコントローラーを作成
        runtime = create_runtime(
            config=self.config,
            sid=f"{session_id}-{agent_type}"
        )
        agent = create_agent(agent_type, self.config)
        controller = AgentController(agent, runtime)

        self.agents[agent_type] = {
            'controller': controller,
            'runtime': runtime,
            'state': 'active',
            'last_activity': datetime.now()
        }

        return controller

    def sleep_agent(self, agent_type: str):
        """エージェントをスリープ状態に"""
        # コンテキストを保存してリソースを解放

    def wake_agent(self, agent_type: str):
        """スリープ中のエージェントを起床"""
        # コンテキストを復元
```

### 4.3 SessionManager実装

```python
# /openhands/orchestrator/session_manager.py

class SessionManager:
    """エージェントセッションの管理"""

    def __init__(self):
        self.sessions = {}

    def create_session(self, agent_type: str) -> str:
        """新しいセッションを作成"""
        session_id = f"{agent_type}-{uuid.uuid4()}"
        self.sessions[session_id] = {
            'agent_type': agent_type,
            'created_at': datetime.now(),
            'context': [],
            'status': 'active'
        }
        return session_id

    def save_context(self, session_id: str, context: List[Event]):
        """セッションのコンテキストを保存"""
        # Condenserを使用してコンテキストを圧縮
```

### 4.4 MessageRouter実装

```python
# /openhands/orchestrator/message_router.py

class MessageRouter:
    """メッセージのルーティング"""

    def __init__(self):
        self.routing_rules = self._load_routing_rules()

    def determine_target(self, message: str) -> str:
        """メッセージから対象エージェントを判定"""
        # キーワードベースのルーティング
        for keyword, agent in self.routing_rules.items():
            if keyword in message.lower():
                return agent

        # コンテキストベースのルーティング
        return self._context_based_routing(message)

    def _load_routing_rules(self) -> Dict[str, str]:
        """ルーティングルールを読み込み"""
        return {
            "要件定義": "RequirementsEngineerAgent",
            "モックアップ": "UIUXDesignerAgent",
            "データベース": "DataModelingAgent",
            # ... 他のルール
        }
```

### 4.5 UI表示の修正

```python
# /openhands/cli/tui.py に追加

def display_orchestrator_status(active_agents: Dict[str, Dict]) -> None:
    """オーケストレーターのステータス表示"""
    print_formatted_text(HTML('<cyan>═══════════════════════════════════════</cyan>'))
    print_formatted_text(HTML('<cyan>BlueLamp オーケストレーター</cyan>'))
    print_formatted_text(HTML('<cyan>═══════════════════════════════════════</cyan>'))

    print_formatted_text(HTML('<yellow>アクティブエージェント:</yellow>'))
    for agent_type, info in active_agents.items():
        status_icon = get_status_icon(info['state'])
        last_activity = format_time_ago(info['last_activity'])
        print_formatted_text(
            HTML(f'  {status_icon} {agent_type} - {info["state"]} ({last_activity})')
        )

    print_formatted_text(HTML('<cyan>───────────────────────────────────────</cyan>'))

def get_status_icon(state: str) -> str:
    """ステータスアイコンを取得"""
    icons = {
        'active': '🟢',
        'working': '⚡',
        'waiting': '🟡',
        'sleeping': '😴',
        'completed': '✅',
        'closed': '❌'
    }
    return icons.get(state, '❓')
```

## 5. 実装手順

### Phase 1: 基盤構築（1-2日）
1. OrchestratorAgent基本クラスの実装
2. AgentManager, SessionManager, MessageRouterの基本実装
3. config.tomlの更新

### Phase 2: エージェント管理（2-3日）
1. エージェントの起動・終了機能
2. セッション管理機能
3. コンテキスト管理機能

### Phase 3: UI/UX改善（1-2日）
1. オーケストレーター専用UI
2. エージェントステータス表示
3. コマンドシステムの実装

### Phase 4: 統合テスト（2-3日）
1. 各エージェントとの連携テスト
2. 並列実行テスト
3. エラーハンドリング

### Phase 5: 最適化（1-2日）
1. パフォーマンスチューニング
2. メモリ管理の最適化
3. ドキュメント作成

## 6. テスト計画

### 6.1 単体テスト
- OrchestratorAgentの基本動作
- 各マネージャークラスの機能
- メッセージルーティングの精度

### 6.2 統合テスト
- エージェント間の通信
- セッションの永続性
- エラー時の復旧

### 6.3 シナリオテスト
- 要件定義 → モックアップ作成フロー
- 並列エージェント実行
- エージェントの終了と再起動

## 7. リスクと対策

### 7.1 技術的リスク
| リスク | 影響度 | 対策 |
|--------|--------|------|
| メモリ使用量の増大 | 高 | Condenserの活用、スリープ機能 |
| エージェント間の競合 | 中 | 排他制御、リソース管理 |
| レスポンス遅延 | 中 | 非同期処理、キャッシュ |

### 7.2 実装上の課題
- 既存のCodeActAgentとの互換性維持
- マイクロエージェントシステムとの統合
- エラーハンドリングの複雑化

## 8. 今後の検討事項

### 8.1 オーケストレーターのシステムプロンプト
- エージェント管理の指針
- ユーザー対話のガイドライン
- エラー時の対応方法

### 8.2 拡張機能
- エージェントの自動選択AI
- ワークフローテンプレート
- 進捗レポート機能

## 9. 成功指標

- エージェント切り替え時間: 3秒以内
- 並列実行可能エージェント数: 5個以上
- メモリ使用量: 現行比150%以内
- ユーザー満足度: 向上

## 10. 実装済み成果物（2025-01-24追加）

### 10.1 作成済みファイル

#### オーケストレーター関連
- **`/microagents/bluelamp/00-orchestrator.md`**
  - オーケストレーターのシステムプロンプト
  - 役割、ツール、エージェント管理方法を定義
  - SCOPE_PROGRESS.md管理プロトコルを含む

- **`/microagents/bluelamp/orchestrator-task-definitions.md`**
  - 全16エージェントのTask定義
  - 統一された通信プロトコル（AgentDelegateAction、AgentFinishAction）
  - 各エージェントへの具体的な指示テンプレート

#### SCOPE_PROGRESS管理
- **`/src/utils/TemplateService.ts`** (更新)
  - SCOPE_PROGRESS.mdテンプレートをシンプル化
  - モックアップ一覧、プロトタイプ作成、API実装タスクリストのセクション追加

### 10.2 設計上の決定事項

#### 通信プロトコル
1. **エージェントからの質問**
   ```python
   AgentDelegateAction(
       agent='orchestrator',
       inputs={'type': 'question', 'content': '質問内容'},
       thought='ユーザーに確認が必要です'
   )
   ```

2. **作業完了報告**
   ```python
   AgentFinishAction(
       final_thought='作業を完了しました',
       task_completed=True,
       outputs={
           '成果物パス': '/path/to/file',
           'scopeprogress_updates': {
               'セクション名': '更新内容'
           }
       }
   )
   ```

#### エージェント起動方法
- Taskツールを使用（既存のDELEGATE機能を活用）
- エージェントプロンプトファイルを読み込むよう指示
- プロジェクト固有の情報をオーケストレーターから提供

### 10.3 コンテキスト管理戦略

1. **分離方針**
   - オーケストレーターは最小限の情報のみ保持
   - 各エージェントが独立したコンテキストで動作
   - SCOPE_PROGRESS.mdを通じた情報共有

2. **エージェント再起動対応**
   - コンテキスト切れ時はSCOPE_PROGRESS.mdに状態を記録
   - 同じエージェントを新規セッションで起動
   - 引き継ぎ情報はAgentFinishActionのoutputsで提供

---

**次のステップ**:
1. ~~この計画書のレビューと承認~~
2. ~~オーケストレーターのシステムプロンプト詳細設計~~ ✓ 完了
3. Phase 1の実装開始
