# SessionSwitchAgent リファクタリング提案

## 概要

SessionSwitchAgentの切り替えロジックが不安定であることを受け、より効率的で保守性の高いアーキテクチャへの移行を提案します。

## 現状の問題点

### 1. SessionSwitchAgentの課題
- 切り替えロジックが不安定
- 専門性が浅い（簡単なプロンプト切り替えのみ）
- 保守性が低い（複数のプロンプトファイルを個別管理）

### 2. 重複する構造
提供された3つの専門プロンプト（デバッグ探偵、機能拡張プランナー、リファクタリング）は共通の6フェーズ構造を持つ：

1. **ヒアリングフェーズ** - 徹底的な1問1答のヒアリング
2. **システム理解・コンテクスト形成フェーズ** - 関連ファイルの調査と理解
3. **計画策定フェーズ** - 詳細な計画書の作成
4. **ユーザー確認フェーズ** - 明示的な承認の取得
5. **影響シミュレーション/徹底調査フェーズ** - リスク評価と最終検証
6. **実装/修正フェーズ** - 安全な実行と報告

## 提案アーキテクチャ

### アプローチ1: マイクロエージェント化 + 汎用フレームワーク

#### 1.1 汎用6フェーズフレームワークの作成

```python
# openhands/agenthub/structured_workflow_agent/base_workflow_agent.py
class BaseWorkflowAgent(CodeActAgent):
    """
    6フェーズ構造を持つ汎用ワークフローエージェント
    """
    
    def __init__(self, llm: LLM, config: AgentConfig, workflow_config: WorkflowConfig):
        super().__init__(llm, config)
        self.workflow_config = workflow_config
        self.current_phase = 1
        self.phase_data = {}
        
    def execute_phase_1_hearing(self, state: State) -> Event:
        """フェーズ1: 徹底ヒアリング"""
        pass
        
    def execute_phase_2_investigation(self, state: State) -> Event:
        """フェーズ2: システム理解・コンテクスト形成"""
        pass
        
    def execute_phase_3_planning(self, state: State) -> Event:
        """フェーズ3: 計画策定"""
        pass
        
    def execute_phase_4_confirmation(self, state: State) -> Event:
        """フェーズ4: ユーザー確認"""
        pass
        
    def execute_phase_5_simulation(self, state: State) -> Event:
        """フェーズ5: 影響シミュレーション/徹底調査"""
        pass
        
    def execute_phase_6_implementation(self, state: State) -> Event:
        """フェーズ6: 実装/修正"""
        pass
```

#### 1.2 専門マイクロエージェントの作成

```markdown
# microagents/debug-detective.md
---
name: debug-detective
type: workflow
triggers: ["debug", "error", "bug", "fix", "troubleshoot"]
workflow_type: debug_detective
---

# デバッグ探偵マイクロエージェント

## 専門領域
プロジェクトのエラーを徹底的に調査しエラーを解消する専門家

## フェーズ別カスタマイズ

### フェーズ1: 徹底調査フェーズ
- ユーザーからエラーの状況をヒアリングあるいはエラーログをもらってそこから関連ファイル全てを徹底的に調べる
- 勝手に進めないこと。必ずユーザーにヒアリングするところからはじめること

### フェーズ2: ロジック理解、コンテクスト形成フェーズ
- エラーが起こったファイルのロジックを徹底的に理解しコンテクストを形成する

### フェーズ3: 自己確認フェーズ
- エラーが発生しているファイルに関連するロジックをしっかりと把握しておりなぜそのエラーが発生しているのかその原因となるファイルやコードを明確に説明できるかどうかを100%YESもしくはNOで自己分析を行う

### フェーズ4: 徹底調査フェーズ（条件分岐）
- 100%YESにならない場合はフェーズ4へ、100%YESならフェーズ5へすすむ
- エラーの原因を明確にするためのデータを集める

### フェーズ5: ユーザー確認フェーズ
- エラーが発生している箇所のファイルに関連するロジックを自然言語だけで非技術者でもわかりやすく説明
- なぜエラーが発生してしまっているのかその原因とファイルを自然言語で説明
- 修正方針をユーザーに提案し承認をもらう

### フェーズ6: 修正フェーズ
- 徹底調査に基づく安全な修正実行
- 型エラーチェックやテストによる検証
- 検証のために作成したテストファイルの削除とクリーンナップ

## 初期メッセージ
それではすすめていきましょう。エラーを教えてください
```

#### 1.3 ワークフロー設定の定義

```python
# openhands/agenthub/structured_workflow_agent/workflow_configs.py
@dataclass
class WorkflowConfig:
    name: str
    phases: List[PhaseConfig]
    initial_message: str
    completion_criteria: Dict[int, str]

@dataclass 
class PhaseConfig:
    phase_number: int
    name: str
    description: str
    custom_prompt: str
    validation_criteria: str
    next_phase_condition: str
```

### アプローチ2: 改良されたSessionSwitchAgent

SessionSwitchAgentを完全に廃止せず、改良する場合：

#### 2.1 フェーズ管理機能の追加

```python
class ImprovedSessionSwitchAgent(CodeActAgent):
    """
    フェーズ管理機能を持つ改良されたSessionSwitchAgent
    """
    
    def __init__(self, llm: LLM, config: AgentConfig):
        super().__init__(llm, config)
        self.current_mode = None
        self.current_phase = 1
        self.phase_data = {}
        self.workflow_state = WorkflowState()
        
    def switch_to_mode(self, mode: str) -> bool:
        """専門モードに切り替え、フェーズをリセット"""
        if mode in ['debug-detective', 'feature-planner', 'refactoring-manager']:
            self.current_mode = mode
            self.current_phase = 1
            self.phase_data = {}
            self.workflow_state.reset()
            return True
        return False
        
    def execute_current_phase(self, state: State) -> Event:
        """現在のフェーズを実行"""
        phase_executor = self.get_phase_executor()
        return phase_executor.execute(state, self.phase_data)
        
    def advance_to_next_phase(self) -> bool:
        """次のフェーズに進む"""
        if self.can_advance_phase():
            self.current_phase += 1
            return True
        return False
```

## 推奨アプローチ

### 推奨: アプローチ1（マイクロエージェント化）

**理由:**
1. **OpenHandsのアーキテクチャに適合**: 既存のマイクロエージェントシステムを活用
2. **保守性の向上**: 各専門領域が独立したマイクロエージェントとして管理
3. **拡張性**: 新しい専門領域を簡単に追加可能
4. **再利用性**: 汎用フレームワークを他のワークフローでも利用可能
5. **テスト容易性**: 各フェーズを独立してテスト可能

## 実装計画

### フェーズ1: 汎用フレームワークの作成
- [ ] BaseWorkflowAgentクラスの実装
- [ ] WorkflowConfigとPhaseConfigの定義
- [ ] フェーズ管理システムの実装

### フェーズ2: 専門マイクロエージェントの作成
- [ ] debug-detective.mdの作成
- [ ] feature-extension-planner.mdの作成  
- [ ] refactoring-manager.mdの作成

### フェーズ3: 統合とテスト
- [ ] マイクロエージェントローダーの拡張
- [ ] ワークフロー実行エンジンの統合
- [ ] 各専門領域のテスト

### フェーズ4: SessionSwitchAgentの段階的廃止
- [ ] 新システムへの移行ガイドの作成
- [ ] 既存機能の互換性確保
- [ ] SessionSwitchAgentの削除

## 期待される効果

1. **安定性の向上**: 構造化されたワークフローによる予測可能な動作
2. **保守性の向上**: モジュラー設計による管理の簡素化
3. **拡張性の向上**: 新しい専門領域の追加が容易
4. **ユーザー体験の向上**: 一貫したフェーズ進行による明確な進捗表示
5. **コード品質の向上**: 共通フレームワークによる標準化

## 次のステップ

1. この提案についてのフィードバックを収集
2. 実装優先度の決定
3. 詳細設計の開始
4. プロトタイプの作成

この提案により、SessionSwitchAgentの不安定性を解決し、より効率的で保守性の高いシステムを構築できると考えています。