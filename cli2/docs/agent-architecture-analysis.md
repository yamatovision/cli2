# 🔍 エージェントアーキテクチャ実装計画

> **確定要件**: 3つのエージェントタイプが必要
> 1. **権限委譲管理エージェント** - ★構築フェーズ用
> 2. **セッション切り替えエージェント** - ★追加拡張フェーズ用  
> 3. **16個の専門エージェント** - 実際の作業実行用

## 📋 **システム要件の明確化**

### **★構築フェーズ(★1~★7★14★8★14★9★10)**
```
権限委譲管理エージェント
    ↓ 委譲
★1要件定義エンジニア
    ↓ 完了後、権限委譲管理エージェントに戻る
    ↓ 次の委譲
★2UI/UXデザイナー
    ↓ 途中で★14TypeScriptマネージャーに委譲
★14TypeScriptマネージャー
    ↓ 完了後、★2に戻る
★2UI/UXデザイナー
    ↓ 完了後、権限委譲管理エージェントに戻る
    ↓ 次の委譲
★8バックエンド実装
    ↓ ...
```

**課題**: 複雑な委譲チェーンの管理、階層的な委譲制御、完了状態の追跡

### **★追加拡張フェーズ（セッション切り替え）**
```
ユーザー: "★11デバッグ探偵に切り替えて"
    ↓
セッション切り替えエージェント
    ↓ 現在の状態を保存
    ↓ ★11デバッグ探偵に完全切り替え
★11デバッグ探偵（ユーザーと直接対話）
```

**課題**: セッション状態の保存・復元、コンテキストの引き継ぎ、ユーザー主導の切り替え

---

## 🏗️ **3エージェント実装アーキテクチャ**

### **Agent 1: DelegationManagerAgent（権限委譲管理）**

```python
class DelegationManagerAgent(CodeActAgent):
    """★構築フェーズの権限委譲を管理"""
    
    def __init__(self, llm: LLM, config: AgentConfig):
        super().__init__(llm, config)
        self.delegation_stack = []  # 委譲スタック
        self.task_tracker = TaskTracker()
        self.phase_manager = PhaseManager()
    
    def execute_construction_phase(self, project_requirements: dict) -> ProjectResult:
        """★構築フェーズ全体を実行"""
        # ★1~★7★14★8★14★9★10の順序で実行
        phases = [
            "★1要件定義", "★2UI/UX", "★3データモデリング", 
            "★4アーキテクト", "★5実装コンサル", "★6環境構築",
            "★7プロトタイプ", "★8バックエンド", "★9テスト品質", "★10API統合"
        ]
        
        for phase in phases:
            result = self.delegate_to_specialist(phase, self.prepare_task_context(phase))
            self.task_tracker.update_progress(phase, result)
            
            # ★14TypeScriptマネージャーが必要な場合は途中で委譲
            if self.needs_typescript_check(result):
                ts_result = self.delegate_to_specialist("★14TypeScript", result)
                result = self.merge_results(result, ts_result)
        
        return self.task_tracker.get_final_result()
    
    def delegate_to_specialist(self, agent_name: str, task_context: dict) -> DelegationResult:
        """専門エージェントに委譲"""
        # 委譲スタックにプッシュ
        delegation = Delegation(
            parent=self.name,
            child=agent_name,
            task=task_context,
            timestamp=datetime.now()
        )
        self.delegation_stack.append(delegation)
        
        # 専門エージェントを実行
        specialist = self.get_specialist_agent(agent_name)
        result = specialist.execute_delegated_task(delegation)
        
        # 委譲スタックからポップ
        completed_delegation = self.delegation_stack.pop()
        
        return DelegationResult(
            delegation=completed_delegation,
            result=result,
            status="completed"
        )
    
    def handle_nested_delegation(self, child_agent: str, nested_task: dict) -> DelegationResult:
        """ネストした委譲を処理（★2→★14など）"""
        # 現在の委譲を一時停止
        current_delegation = self.delegation_stack[-1]
        current_delegation.status = "paused"
        
        # ネストした委譲を実行
        nested_result = self.delegate_to_specialist(child_agent, nested_task)
        
        # 元の委譲を再開
        current_delegation.status = "resumed"
        
        return nested_result
```

### **Agent 2: SessionSwitchAgent（セッション切り替え）**

```python
class SessionSwitchAgent(CodeActAgent):
    """★追加拡張フェーズのセッション切り替えを管理"""
    
    def __init__(self, llm: LLM, config: AgentConfig):
        super().__init__(llm, config)
        self.session_store = SessionStore()
        self.context_manager = ContextManager()
        self.current_session = None
    
    def switch_to_specialist(self, target_agent: str, user_request: str) -> SwitchResult:
        """指定された専門エージェントにセッションを切り替え"""
        # 1. 現在のセッション状態を保存
        if self.current_session:
            self.save_current_session()
        
        # 2. ターゲットエージェントのセッション状態を復元
        target_session = self.session_store.load_or_create(target_agent)
        
        # 3. コンテキストを準備
        switch_context = self.context_manager.prepare_switch_context(
            from_session=self.current_session,
            to_session=target_session,
            user_request=user_request,
            conversation_history=self.get_conversation_history()
        )
        
        # 4. ターゲットエージェントを起動
        specialist = self.get_specialist_agent(target_agent)
        specialist.load_session_context(switch_context)
        
        # 5. セッション状態を更新
        self.current_session = target_session
        
        return SwitchResult(
            target_agent=target_agent,
            context=switch_context,
            session_id=target_session.id
        )
    
    def save_current_session(self) -> SessionState:
        """現在のセッション状態を保存"""
        session_state = SessionState(
            agent_name=self.current_session.agent_name,
            conversation_history=self.get_conversation_history(),
            working_directory=os.getcwd(),
            environment_variables=dict(os.environ),
            task_context=self.get_current_task_context(),
            timestamp=datetime.now()
        )
        
        self.session_store.save(session_state)
        return session_state
    
    def handle_user_switch_request(self, user_input: str) -> Action:
        """ユーザーのセッション切り替え要求を処理"""
        # "★11デバッグ探偵に切り替えて" のような要求を解析
        target_agent = self.parse_switch_request(user_input)
        
        if target_agent:
            switch_result = self.switch_to_specialist(target_agent, user_input)
            return MessageAction(
                content=f"{target_agent}に切り替えました。直接対話を開始してください。"
            )
        else:
            return MessageAction(
                content="切り替え先のエージェントを指定してください。例: ★11デバッグ探偵に切り替えて"
            )
```

### **Agent 3: SpecialistAgentBase（16専門エージェント基底クラス）**

```python
class SpecialistAgentBase(CodeActAgent):
    """16専門エージェントの基底クラス"""
    
    # 各専門エージェントで定義する必須フィールド
    AGENT_NUMBER: str = ""      # "★1", "★2", etc.
    AGENT_ROLE: str = ""        # "要件定義エンジニア", etc.
    SPECIALIZATION: list[str] = []  # 専門分野
    
    def __init__(self, llm: LLM, config: AgentConfig):
        super().__init__(llm, config)
        self.delegation_handler = DelegationHandler()
        self.session_handler = SessionHandler()
        self._setup_specialization()
    
    def execute_delegated_task(self, delegation: Delegation) -> TaskResult:
        """権限委譲管理エージェントからの委譲を実行"""
        # 1. 委譲コンテキストを適用
        self.delegation_handler.apply_delegation_context(delegation)
        
        # 2. 専門タスクを実行
        result = self.execute_specialized_task(delegation.task)
        
        # 3. 必要に応じて他のエージェントに委譲
        if self.needs_sub_delegation(result):
            sub_result = self.request_sub_delegation(delegation.parent, result)
            result = self.integrate_sub_result(result, sub_result)
        
        # 4. 結果を返却
        return TaskResult(
            agent=self.name,
            delegation_id=delegation.id,
            result=result,
            status="completed",
            timestamp=datetime.now()
        )
    
    def load_session_context(self, switch_context: SwitchContext) -> None:
        """セッション切り替えエージェントからのコンテキストを読み込み"""
        self.session_handler.apply_switch_context(switch_context)
        
        # 会話履歴を復元
        self.restore_conversation_history(switch_context.conversation_history)
        
        # 作業環境を復元
        self.restore_working_environment(switch_context.environment)
    
    def request_sub_delegation(self, parent_agent: str, current_result: TaskResult) -> DelegationResult:
        """親エージェントに子委譲を要求（★2→★14など）"""
        sub_delegation_request = SubDelegationRequest(
            requesting_agent=self.name,
            parent_agent=parent_agent,
            target_agent=self.determine_sub_agent(current_result),
            task_context=self.prepare_sub_task(current_result),
            reason=self.get_delegation_reason(current_result)
        )
        
        # 親エージェント（DelegationManagerAgent）に要求を送信
        return self.send_sub_delegation_request(sub_delegation_request)
    
    @abstractmethod
    def execute_specialized_task(self, task: dict) -> SpecializedResult:
        """専門タスクの実行（各エージェントで実装）"""
        pass
    
    @abstractmethod
    def _setup_specialization(self) -> None:
        """専門化の設定（各エージェントで実装）"""
        pass

# 具体的な専門エージェント例
class RequirementsAgent(SpecialistAgentBase):
    """★1要件定義エンジニア"""
    
    AGENT_NUMBER = "★1"
    AGENT_ROLE = "要件定義エンジニア"
    SPECIALIZATION = ["要件分析", "ユーザーストーリー作成", "機能仕様書作成"]
    
    def execute_specialized_task(self, task: dict) -> SpecializedResult:
        # 要件定義専門の処理
        requirements_doc = self.analyze_requirements(task["user_requirements"])
        scope_progress = self.create_scope_progress(requirements_doc)
        
        return SpecializedResult(
            primary_output=requirements_doc,
            secondary_outputs={"scope_progress": scope_progress},
            next_recommended_agent="★2UI/UXデザイナー"
        )
    
    def _setup_specialization(self) -> None:
        # 要件定義専門プロンプトとツールの設定
        pass

class DebugAgent(SpecialistAgentBase):
    """★11デバッグ探偵"""
    
    AGENT_NUMBER = "★11"
    AGENT_ROLE = "デバッグ探偵"
    SPECIALIZATION = ["バグ分析", "根本原因特定", "修正提案", "再現テスト作成"]
    
    def execute_specialized_task(self, task: dict) -> SpecializedResult:
        # デバッグ専門の処理
        error_analysis = self.analyze_error(task["error_info"])
        root_cause = self.identify_root_cause(error_analysis)
        fix_proposal = self.propose_fix(root_cause)
        
        return SpecializedResult(
            primary_output=fix_proposal,
            secondary_outputs={
                "error_analysis": error_analysis,
                "root_cause": root_cause
            },
            needs_typescript_check=True  # ★14への委譲が必要
        )
    
    def _setup_specialization(self) -> None:
        # デバッグ専門プロンプトとツールの設定
        pass
```

---

## 🔄 **統合動作フロー**

### **★構築フェーズの動作例**

```
1. ユーザー: "新しいプロジェクトを作って"
    ↓
2. DelegationManagerAgent.execute_construction_phase()
    ↓
3. delegate_to_specialist("★1要件定義", task_context)
    ↓
4. ★1要件定義.execute_delegated_task()
    ↓ 完了
5. DelegationManagerAgent（★1の結果を受け取り）
    ↓
6. delegate_to_specialist("★2UI/UX", task_context)
    ↓
7. ★2UI/UX.execute_delegated_task()
    ↓ 途中で型エラー発生
8. ★2UI/UX.request_sub_delegation("★14TypeScript")
    ↓
9. DelegationManagerAgent.handle_nested_delegation()
    ↓
10. ★14TypeScript.execute_delegated_task()
    ↓ 完了
11. ★2UI/UX（★14の結果を統合して継続）
    ↓ 完了
12. DelegationManagerAgent（次のフェーズへ）
```

### **★追加拡張フェーズの動作例**

```
1. ユーザー: "★11デバッグ探偵に切り替えて"
    ↓
2. SessionSwitchAgent.handle_user_switch_request()
    ↓
3. SessionSwitchAgent.switch_to_specialist("★11デバッグ探偵")
    ↓
4. 現在のセッション状態を保存
    ↓
5. ★11デバッグ探偵.load_session_context()
    ↓
6. ユーザーと★11デバッグ探偵が直接対話開始
    ↓
7. ユーザー: "元のエージェントに戻して"
    ↓
8. SessionSwitchAgent.switch_back()
```

---

## 🎯 **実装優先順位**

### **Phase 1: 基盤実装**
1. **SpecialistAgentBase** - 16エージェントの基底クラス
2. **★1要件定義エンジニア** - 最初の専門エージェント
3. **★14TypeScriptマネージャー** - 型チェック用

### **Phase 2: 権限委譲システム**
1. **DelegationManagerAgent** - 委譲管理機能
2. **委譲スタック管理** - ネストした委譲の制御
3. **★2, ★8, ★9エージェント** - 主要な実装エージェント

### **Phase 3: セッション切り替えシステム**
1. **SessionSwitchAgent** - セッション管理機能
2. **セッション状態の保存・復元** - 状態管理
3. **★11デバッグ探偵** - 切り替え対象エージェント

### **Phase 4: 残りの専門エージェント**
1. **★3~★13, ★15~★16** - 残りの専門エージェント
2. **統合テスト** - 全システムの連携テスト
3. **最適化** - パフォーマンス改善

---

## 🎉 **最終確認**

### **必要なエージェント数: 3つ**

1. **DelegationManagerAgent** - ★構築フェーズの権限委譲管理
2. **SessionSwitchAgent** - ★追加拡張フェーズのセッション切り替え
3. **SpecialistAgentBase + 16専門エージェント** - 実際の作業実行

### **各システムの独立性**

- **権限委譲システム**: 複雑な委譲チェーンを管理、階層的制御
- **セッション切り替えシステム**: ユーザー主導の切り替え、状態保存・復元
- **16エージェントシステム**: 専門タスクの実行、両システムに対応

**結論**: 3つのエージェントタイプが必要で、それぞれが明確に異なる責任を持つ最適なアーキテクチャです！