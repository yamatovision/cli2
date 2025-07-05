# 🔄 エージェント切り替え・継続作業の解決策

> **問題**: 現在の権限委譲システムは「タスク完了で自動終了」のため、継続的な作業（デバッグ、新機能開発）に不向き

## 🎯 **現在の制約分析**

### ❌ **現在の問題点**

1. **自動終了の制約**
   ```
   エージェント委譲 → タスク完了 → 自動的に親に戻る
   ```
   - デバッグ → 確認 → さらなる開発の連続作業ができない
   - 特定エージェントでの継続作業が困難

2. **固定的な起動システム**
   ```python
   # openhands/core/config/config_utils.py L7
   OH_DEFAULT_AGENT = 'CodeActAgent'  # 常にCodeActAgentで起動
   ```

3. **委譲ベースの制約**
   - 必ず親エージェント（CodeActAgent）から委譲
   - 委譲先エージェントは独立して動作できない

---

## 🚀 **解決策の提案**

### 💡 **解決策1: 初期エージェント選択機能**

#### 🔧 **実装方法**

**1. CLIオプションの追加**
```bash
# 現在
openhands-cli  # 常にCodeActAgentで起動

# 提案
openhands-cli --agent CodeActAgent     # デフォルト
openhands-cli --agent ★1要件定義エンジニア  # 要件定義エージェントで起動
openhands-cli --agent ★15デバッグエンジニア # デバッグエージェントで起動
```

**2. 設定ファイルでの指定**
```yaml
# config.yaml
default_agent: "★15デバッグエンジニア"  # デバッグエージェントをデフォルトに
```

**3. 実装箇所**
```python
# openhands/cli/main.py
def setup_config_from_args(args) -> OpenHandsConfig:
    config = OpenHandsConfig()
    
    # 新機能：エージェント選択
    if args.agent:
        config.default_agent = args.agent
    
    return config

# openhands/core/setup.py
def create_agent(config: OpenHandsConfig) -> Agent:
    # 指定されたエージェントで起動
    agent_cls: type[Agent] = Agent.get_cls(config.default_agent)
    # ...
```

#### ✅ **メリット**
- 最初から目的のエージェントで起動
- 委譲なしで継続作業可能
- 既存システムへの影響最小

---

### 💡 **解決策2: セッション内エージェント切り替え**

#### 🔧 **実装方法**

**1. 切り替えコマンドの追加**
```bash
# セッション中にエージェント切り替え
/switch ★15デバッグエンジニア
/switch CodeActAgent
/switch ★2UI/UXデザイナー
```

**2. 新しいアクション定義**
```python
# openhands/events/action/agent.py
@dataclass
class AgentSwitchAction(Action):
    """エージェント切り替えアクション（委譲ではない）"""
    target_agent: str
    preserve_context: bool = True  # コンテキスト保持
    action: str = ActionType.AGENT_SWITCH
```

**3. コントローラーでの実装**
```python
# openhands/controller/agent_controller.py
async def switch_agent(self, action: AgentSwitchAction) -> None:
    """エージェント切り替え（委譲ではない）"""
    # 1. 現在のエージェント状態保存
    current_context = self.get_context_snapshot()
    
    # 2. 新しいエージェント作成
    new_agent_cls = Agent.get_cls(action.target_agent)
    new_agent = new_agent_cls(llm=self.agent.llm, config=self.agent.config)
    
    # 3. エージェント交換
    self.agent = new_agent
    
    # 4. コンテキスト復元（オプション）
    if action.preserve_context:
        self.restore_context(current_context)
    
    # 5. 切り替え通知
    obs = AgentSwitchObservation(
        from_agent=self.agent.__class__.__name__,
        to_agent=action.target_agent,
        content=f"Switched to {action.target_agent}"
    )
    self.event_stream.add_event(obs, EventSource.AGENT)
```

#### ✅ **メリット**
- セッション中の柔軟な切り替え
- コンテキスト保持可能
- 委譲の制約なし

---

### 💡 **解決策3: 継続モード付き委譲**

#### 🔧 **実装方法**

**1. 継続フラグ付き委譲**
```python
# openhands/events/action/agent.py
@dataclass
class AgentDelegateAction(Action):
    agent: str
    inputs: dict
    continuous_mode: bool = False  # 🆕 継続モードフラグ
    auto_return: bool = True       # 🆕 自動復帰フラグ
```

**2. 継続モードの制御**
```python
# openhands/controller/agent_controller.py
def on_event(self, event: Event) -> None:
    if self.delegate is not None:
        delegate_state = self.delegate.get_agent_state()
        
        # 継続モードの場合は自動終了しない
        if (delegate_state in (AgentState.FINISHED, AgentState.ERROR, AgentState.REJECTED) 
            and self.delegate_action.auto_return):
            self.end_delegate()
            return
        elif (delegate_state == AgentState.FINISHED 
              and self.delegate_action.continuous_mode):
            # 継続モード：完了しても委譲継続
            self.delegate.set_agent_state_to(AgentState.RUNNING)
            return
```

**3. 手動終了コマンド**
```bash
# 継続モード中の手動終了
/end_delegation
/return_to_parent
```

#### ✅ **メリット**
- 既存の委譲システムを拡張
- 後方互換性維持
- 柔軟な制御

---

### 💡 **解決策4: マルチエージェントセッション**

#### 🔧 **実装方法**

**1. 複数エージェントの同時管理**
```python
# openhands/controller/multi_agent_controller.py
class MultiAgentController:
    def __init__(self):
        self.agents: dict[str, AgentController] = {}
        self.active_agent: str = "CodeActAgent"
    
    async def add_agent(self, name: str, agent_cls: str):
        """新しいエージェントを追加"""
        agent = Agent.get_cls(agent_cls)()
        controller = AgentController(agent=agent, sid=f"{self.sid}-{name}")
        self.agents[name] = controller
    
    async def switch_to(self, agent_name: str):
        """アクティブエージェントを切り替え"""
        if agent_name in self.agents:
            self.active_agent = agent_name
```

**2. セッション管理**
```bash
# 複数エージェントの管理
/add_agent debug ★15デバッグエンジニア
/add_agent ui ★2UI/UXデザイナー
/switch_to debug
/switch_to ui
/list_agents
```

#### ✅ **メリット**
- 複数エージェントの並行管理
- 柔軟な切り替え
- 各エージェントの独立性

---

## 🎯 **推奨実装順序**

### 🥇 **Phase 1: 初期エージェント選択（最優先）**
```bash
# 即座に実装可能
openhands-cli --agent ★15デバッグエンジニア
```
- **実装コスト**: 低
- **効果**: 高
- **リスク**: 最小

### 🥈 **Phase 2: セッション内切り替え**
```bash
# セッション中の切り替え
/switch ★15デバッグエンジニア
```
- **実装コスト**: 中
- **効果**: 高
- **リスク**: 中

### 🥉 **Phase 3: 継続モード委譲**
```python
# 既存システムの拡張
AgentDelegateAction(agent="★15デバッグエンジニア", continuous_mode=True)
```
- **実装コスト**: 中
- **効果**: 中
- **リスク**: 中

---

## 🔧 **具体的な実装例**

### 📝 **Phase 1の実装**

**1. CLIオプション追加**
```python
# openhands/cli/main.py
def add_cli_args(parser: argparse.ArgumentParser):
    # 既存のオプション...
    
    # 🆕 エージェント選択オプション
    parser.add_argument(
        '--agent',
        type=str,
        default=None,
        help='Initial agent to use (default: CodeActAgent)'
    )
```

**2. 設定反映**
```python
# openhands/cli/main.py
def setup_config_from_args(args) -> OpenHandsConfig:
    config = OpenHandsConfig()
    
    # 🆕 エージェント設定
    if args.agent:
        # エージェントが登録されているか確認
        try:
            Agent.get_cls(args.agent)
            config.default_agent = args.agent
        except AgentNotRegisteredError:
            logger.error(f"Agent '{args.agent}' not found. Available agents: {Agent.list_agents()}")
            sys.exit(1)
    
    return config
```

**3. 使用例**
```bash
# デバッグエージェントで起動
openhands-cli --agent "★15デバッグエンジニア"

# UI/UXデザイナーで起動
openhands-cli --agent "★2UI/UXデザイナー"

# 利用可能エージェント一覧
openhands-cli --list-agents
```

---

## 🎯 **16エージェントシステムでの活用**

### 🚀 **使用パターン**

**1. 専門作業モード**
```bash
# デバッグ専用セッション
openhands-cli --agent "★15デバッグエンジニア"
> バグ修正 → テスト → さらなるバグ発見 → 修正... (継続)

# UI/UX専用セッション
openhands-cli --agent "★2UI/UXデザイナー"
> デザイン作成 → レビュー → 修正 → 改善... (継続)
```

**2. 段階的切り替えモード**
```bash
# 要件定義から開始
openhands-cli --agent "★1要件定義エンジニア"
> 要件完了後
/switch ★3データモデリング
> データモデル完了後
/switch ★4バックエンド開発
```

**3. オーケストレーター制御モード**
```bash
# オーケストレーターで起動
openhands-cli --agent "★16オーケストレーター"
> 自動的に適切なエージェントに委譲・切り替え
```

---

## ✅ **結論**

### 🎯 **最適解**

**Phase 1の「初期エージェント選択」が最も効果的**：

1. **即座に実装可能**
2. **既存システムへの影響最小**
3. **ユーザーの要求を完全に満たす**
4. **16エージェントシステムと完全互換**

### 🚀 **実装後の効果**

```bash
# 問題解決例
openhands-cli --agent "★15デバッグエンジニア"
> バグ修正
> テスト実行
> 新たなバグ発見
> さらなる修正
> 機能追加
> 継続的な開発...
# 🎉 委譲の制約なしで継続作業可能！
```

この解決策により、16エージェント協調システムでの柔軟で効率的な作業が実現できます。