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
  max_parallel_agents = 10  # 5から10に増加
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
  - `/status`: エージェント一覧と進捗状況
  - `/talk [agent]`: 特定エージェントとの対話
  - `/close [agent]`: エージェントの終了
  - `/auto`: 完全自律モードの開始（プロジェクト完了まで）
  - `/pause`: 自律モードの一時停止
  - `/resume`: 処理の再開
  - `/progress`: SCOPE_PROGRESS.mdの現在状態を表示

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
        self.autonomous_mode = False  # 自律モード
        self.pause_requested = False  # 一時停止フラグ

    def step(self, state: State) -> Action:
        """メインの処理ループ"""
        # 0. ユーザー割り込みチェック（最優先）
        if self._check_user_interrupt(state):
            return self._handle_interrupt(state)

        # 1. ユーザー入力を解析
        user_input = state.inputs.get("message", "")

        # 2. コマンド処理
        if user_input.startswith("/"):
            return self._handle_command(user_input)

        # 3. 自律モードの場合
        if self.autonomous_mode and not user_input:
            return self._autonomous_step(state)

        # 4. 適切なエージェントに振り分け
        target_agent = self._determine_target_agent(user_input)

        # 5. エージェントが未起動なら起動
        if target_agent not in self.active_agents:
            self._launch_agent(target_agent)

        # 6. メッセージを転送
        return self._delegate_to_agent(target_agent, user_input)

    def _check_user_interrupt(self, state: State) -> bool:
        """ユーザー割り込みをチェック"""
        # ユーザーからの任意の入力があれば割り込みとして扱う
        return bool(state.inputs.get("message")) and self.autonomous_mode

    def _handle_interrupt(self, state: State) -> Action:
        """割り込み処理"""
        self.autonomous_mode = False

        # アクティブエージェントの状態を保存
        self._save_all_agent_states()

        return MessageAction(
            content=f"""
🛑 **実行を一時停止しました**

現在の状態：
- アクティブエージェント: {len(self.active_agents)}個
- 進行中のタスク: {self._get_active_tasks_summary()}

何かご指示はありますか？
（何も入力せずにEnterで自律モードを再開します）
"""
        )
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

### 4.4 MessageRouter実装（自律的AI判断機能付き）

```python
# /openhands/orchestrator/message_router.py

class MessageRouter:
    """メッセージのルーティング（自律的AI判断機能付き）"""

    def __init__(self, llm: LLM):
        self.llm = llm
        self.routing_rules = self._load_routing_rules()
        self.agent_capabilities = self._load_agent_capabilities()

    def determine_target(self, message: str, scope_progress: dict, active_agents: dict) -> str:
        """AI判断により対象エージェントを自律的に決定"""

        # 1. 明示的な指示がある場合
        explicit_agent = self._check_explicit_instruction(message)
        if explicit_agent:
            return explicit_agent

        # 2. キーワードベースのルーティング
        keyword_agent = self._keyword_based_routing(message)
        if keyword_agent:
            return keyword_agent

        # 3. AI判断による自律的な決定
        return self._ai_based_routing(message, scope_progress, active_agents)

    def _ai_based_routing(self, message: str, scope_progress: dict, active_agents: dict) -> str:
        """AIを使用した自律的なエージェント選択"""

        prompt = f"""
        ## 現在のプロジェクト状況

        ### ユーザーメッセージ
        {message}

        ### プロジェクト進捗（SCOPE_PROGRESS.md）
        {json.dumps(scope_progress, ensure_ascii=False, indent=2)}

        ### アクティブなエージェント
        {json.dumps(active_agents, ensure_ascii=False, indent=2)}

        ### 利用可能なエージェントと能力
        {json.dumps(self.agent_capabilities, ensure_ascii=False, indent=2)}

        ## タスク
        上記の情報を基に、次に起動すべきエージェントを判断してください。

        判断基準：
        1. プロジェクトの現在のフェーズ
        2. 未完了のタスク
        3. 依存関係（前提条件）
        4. 並列実行可能性
        5. ユーザーの意図

        回答形式：
        {
            "agent": "エージェント名",
            "reason": "選択理由",
            "parallel_candidates": ["並列実行可能な他のエージェント"],
            "next_steps": ["今後の推奨ステップ"]
        }
        """

        response = self.llm.completion(
            messages=[
                {"role": "system", "content": "あなたはプロジェクト管理の専門家です。"},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )

        decision = json.loads(response.choices[0].message.content)

        # 並列実行の判断
        if decision.get("parallel_candidates"):
            self._schedule_parallel_agents(decision["parallel_candidates"])

        return decision["agent"]

    def _load_agent_capabilities(self) -> Dict[str, Dict]:
        """各エージェントの能力と前提条件を定義"""
        return {
            "RequirementsEngineerAgent": {
                "capabilities": ["要件定義", "機能仕様作成", "ユーザーストーリー"],
                "prerequisites": [],
                "phase": "planning"
            },
            "UIUXDesignerAgent": {
                "capabilities": ["モックアップ作成", "画面設計", "UI設計"],
                "prerequisites": ["要件定義完了"],
                "phase": "design"
            },
            "DataModelingAgent": {
                "capabilities": ["データベース設計", "スキーマ定義", "型定義"],
                "prerequisites": ["要件定義完了"],
                "phase": "design"
            },
            "SystemArchitectAgent": {
                "capabilities": ["認証設計", "セキュリティ設計", "システム構成"],
                "prerequisites": ["要件定義完了"],
                "phase": "design"
            },
            "ImplementationConsultantAgent": {
                "capabilities": ["実装計画", "タスク分解", "優先順位付け"],
                "prerequisites": ["設計完了"],
                "phase": "planning"
            },
            "PrototypeImplementationAgent": {
                "capabilities": ["フロントエンド実装", "モックAPI実装"],
                "prerequisites": ["モックアップ完了", "型定義完了"],
                "phase": "implementation"
            },
            "BackendImplementationAgent": {
                "capabilities": ["API実装", "ビジネスロジック", "データベース接続"],
                "prerequisites": ["データモデル完了", "認証設計完了"],
                "phase": "implementation"
            },
            # ... 他のエージェント
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
- 並列実行可能エージェント数: 10個以上（設定値に更新）
- メモリ使用量: 現行比200%以内（並列数増加に対応）
- ユーザー満足度: 向上
- 自律的エージェント起動成功率: 80%以上

## 10. 永続コンテキスト実装（2025-01-24追加）

### 10.1 OrchestratorCondenser実装

オーケストレーター専用のCondenserを実装し、長期的なコンテキスト管理を実現：

```python
# /openhands/memory/condenser/impl/orchestrator_condenser.py

class OrchestratorCondenser(RollingCondenser):
    """オーケストレーター専用のCondenser"""

    def __init__(self, llm: LLM, max_size: int = 200, keep_first: int = 10):
        super().__init__(llm, max_size, keep_first)
        self.agent_summaries = {}

    def get_condensation(self, view: View) -> Condensation:
        # エージェント別の活動を要約
        agent_summaries = self._summarize_by_agent(view)

        # プロジェクト全体の進捗を要約
        project_summary = self._summarize_project_progress(view)

        # 重要な決定事項を保持
        key_decisions = self._extract_key_decisions(view)

        # SCOPE_PROGRESS.mdの状態も含める
        scope_progress = self._get_scope_progress_summary()

        summary = self._generate_summary(
            agent_summaries,
            project_summary,
            key_decisions,
            scope_progress
        )

        return Condensation(
            action=CondensationAction(
                summary=summary,
                metadata={
                    'agent_states': self._get_agent_states(view),
                    'scope_progress': scope_progress
                }
            )
        )
```

### 10.2 エージェントセッション管理の拡張

```python
# /openhands/orchestrator/agent_session_manager.py

class AgentSessionManager:
    """エージェント別のセッション管理（永続化対応）"""

    def __init__(self, file_store: FileStore, llm: LLM):
        self.file_store = file_store
        self.llm = llm
        self.sessions = {}
        self.condensers = {}  # エージェント別Condenser

    def create_agent_session(self, agent_type: str, parent_sid: str) -> str:
        """新しいエージェントセッションを作成"""
        sid = f"{parent_sid}-{agent_type}-{uuid.uuid4()}"

        # 独立したEventStreamを作成
        event_stream = EventStream(sid, self.file_store)

        # エージェント専用のCondenser
        condenser = LLMSummarizingCondenser(
            llm=self.llm,
            max_size=50,  # エージェント用は小さめ
            keep_first=5
        )

        # 既存の要約があれば復元
        existing_summary = self._load_agent_summary(agent_type)

        self.sessions[agent_type] = {
            'sid': sid,
            'event_stream': event_stream,
            'state': State(session_id=sid),
            'last_activity': datetime.now(),
            'context_summary': existing_summary
        }

        self.condensers[agent_type] = condenser

        return sid

    def handle_context_overflow(self, agent_type: str):
        """コンテキストオーバーフロー時の処理"""
        session = self.sessions.get(agent_type)
        if not session:
            return

        # 現在の状態を要約
        condenser = self.condensers[agent_type]
        condensed = condenser.condensed_history(session['state'])

        if isinstance(condensed, Condensation):
            # 要約をSCOPE_PROGRESS.mdに記録
            self._update_scope_progress_with_summary(
                agent_type,
                condensed.action.summary
            )

            # 新しいセッションを作成
            new_sid = self.create_agent_session(
                agent_type,
                session['sid'].rsplit('-', 2)[0]
            )

            # 要約を引き継ぎ
            self.sessions[agent_type]['context_summary'] = condensed.action.summary
```

### 10.3 自律的エージェント起動の強化

```python
# /openhands/agenthub/orchestrator/orchestrator_agent.py

class OrchestratorAgent(Agent):

    def _autonomous_step(self, state: State) -> Action:
        """完全自律モードでの動作"""

        # エージェントからの報告があればSCOPE_PROGRESSを即座に確認
        if self._has_agent_updates():
            self._process_agent_updates(state)

        # プロジェクト完了判定
        if self._is_project_complete():
            self.autonomous_mode = False
            return MessageAction(
                content="🎉 プロジェクトが完了しました！全てのタスクが正常に終了しました。"
            )

        # 次のアクションを決定
        next_action = self._decide_next_action(state)

        if next_action:
            return next_action
        else:
            # 待機状態
            return MessageAction(
                content="⏳ エージェントの作業完了を待機中...",
                wait_for_response=False  # ユーザー入力を待たない
            )

    def _process_agent_updates(self, state: State):
        """エージェントからの更新を処理"""
        for agent_type, update in self._get_pending_updates().items():
            if 'scopeprogress_updates' in update:
                # SCOPE_PROGRESS.mdを即座に更新
                self._update_scope_progress(update['scopeprogress_updates'])

                # 依存タスクの確認
                self._check_and_launch_dependent_tasks(agent_type)

    def _should_auto_launch_agents(self, state: State) -> List[str]:
        """自律的にエージェントを起動すべきか判断"""

        # SCOPE_PROGRESS.mdを解析
        scope_progress = self._load_scope_progress()

        # 現在のフェーズを判定
        current_phase = self._determine_current_phase(scope_progress)

        # アクティブタスクを取得
        active_tasks = self._get_active_tasks(scope_progress)

        # 未開始の依存タスクを探す
        pending_tasks = self._find_pending_tasks_with_met_dependencies(
            scope_progress,
            active_tasks
        )

        # 起動すべきエージェントを決定
        agents_to_launch = []

        for task in pending_tasks:
            agent_type = self._map_task_to_agent(task)
            if agent_type and agent_type not in self.active_agents:
                if len(self.active_agents) < self.config.max_parallel_agents:
                    agents_to_launch.append(agent_type)

        return agents_to_launch

    def _handle_command(self, command: str) -> Action:
        """コマンド処理の拡張"""
        parts = command.split()
        cmd = parts[0].lower()

        if cmd == "/auto":
            self.autonomous_mode = True
            return MessageAction(
                content="""
🚀 **完全自律モードを開始します**

オーケストレーターがプロジェクト完了まで自動的に進行します。

- 進捗はリアルタイムで表示されます
- いつでも何か入力すれば一時停止できます
- `/progress`で詳細な進捗を確認できます

開始しています...
"""
            )
        elif cmd == "/progress":
            return self._show_detailed_progress()
        # ... 他のコマンド
```

## 11. 実装済み成果物（2025-01-24追加）

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
