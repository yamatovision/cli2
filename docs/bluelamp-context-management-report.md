# BlueLamp コンテキストウィンドウ管理の詳細調査レポート

**作成日**: 2025-06-25
**調査者**: Claude Code
**目的**: BlueLampでエージェントが切り替わる際のコンテキストウィンドウ管理の仕組みを事実に基づいて解明

## エグゼクティブサマリー

BlueLampにおけるエージェント切り替えは、OpenHandsの`AgentDelegateAction`機能を使用しており、**各デリゲートエージェントは親の履歴を引き継がない「クリーンスレート」で開始される**設計になっています。これにより、コンテキストウィンドウの制限を効果的に回避しています。

## 1. 実際の動作メカニズム

### 1.1 エージェント起動の流れ

1. **オーケストレーター（親エージェント）**
   - `00-orchestrator.md`のプロンプトで初期化されたCodeActAgent
   - ユーザーとの対話を管理
   - Taskツールを使用して専門エージェントを起動

2. **専門エージェント（子エージェント）の起動**
   ```python
   # オーケストレーターがTaskツールを使用
   Task(
       description="要件定義作成",
       prompt="要件定義エンジニアとして作業を実行..."
   )
   ```

3. **内部的な処理**
   - TaskツールがAgentDelegateActionに変換される
   - `start_delegate`メソッドが呼ばれる
   - 新しいエージェントコントローラーが作成される

### 1.2 コンテキストの分離

#### 重要なコード（agent_controller.py）：
```python
async def start_delegate(self, action: AgentDelegateAction) -> None:
    # start_idを現在のイベントストリームの最新ID + 1に設定
    start_id = self.event_stream.get_latest_event_id() + 1

    # 新しいエージェントコントローラーを作成
    self.delegate = AgentController(
        agent=agent,
        max_iterations=self.max_iterations,
        event_stream=self.event_stream,
        state=None,  # 新しいStateオブジェクトが作成される
        is_delegate=True,
        state_tracker=tracker,
        start_id=start_id,  # ここが重要！
        # ...
    )
```

#### この設計の意味：
- **start_id = 最新イベントID + 1**：デリゲートは親の履歴を「見ない」
- **新しいStateオブジェクト**：履歴は空から始まる
- **is_delegate=True**：イベントストリームを直接購読しない

## 2. コンテキストウィンドウの実際の管理

### 2.1 各エージェントのコンテキスト内容

#### オーケストレーター（親）のコンテキスト：
```
1. 00-orchestrator.mdのプロンプト（約11KB）
2. ユーザーとの対話履歴
3. 各エージェントの起動/完了記録
4. SCOPE_PROGRESS.mdの読み込み結果
```

#### 専門エージェント（子）のコンテキスト：
```
1. 該当する専門エージェントのプロンプト（例：01-requirements-engineer.md）
2. 親から渡されたタスク説明（AgentDelegateAction.inputs）
3. そのエージェント自身の作業履歴のみ
4. 親の履歴は一切含まれない
```

### 2.2 具体例：要件定義エンジニアの場合

```
オーケストレーター（10KB使用）
├─ ユーザー: "要件定義を作成してください"
├─ Task起動: 要件定義エンジニア
└─ AgentDelegateAction実行
    ↓
要件定義エンジニア（0KBから開始）
├─ 01-requirements-engineer.mdプロンプト（18KB）
├─ タスク: "要件定義を作成"
└─ 独自の作業履歴（親の履歴なし）
```

## 3. なぜエージェント切り替えがスムーズなのか

### 3.1 設計上の利点

1. **コンテキストウィンドウのリセット**
   - 各エージェントは新規セッションとして開始
   - 親の長い履歴に影響されない
   - 200Kトークン制限を各エージェントが独立して使用可能

2. **情報共有の仕組み**
   - ファイルシステム経由（SCOPE_PROGRESS.md等）
   - AgentDelegateAction.inputsでタスク情報を渡す
   - 成果物はファイルとして永続化

3. **並列実行の可能性**
   - 理論上、複数のデリゲートを同時実行可能
   - ただし、現在の実装は逐次実行のみ

### 3.2 トレードオフ

**メリット**：
- ✅ コンテキストウィンドウ制限の回避
- ✅ 各エージェントの独立性
- ✅ クリーンな作業環境

**デメリット**：
- ❌ 親の詳細な文脈を子が知らない
- ❌ エージェント間の直接的な情報共有不可
- ❌ ファイル経由の情報共有が必須

## 4. 実装の詳細

### 4.1 StateTrackerの役割

```python
class StateTracker:
    def _init_history(self):
        # start_idから履歴を初期化
        events = []
        for event in self.event_stream.get_events(start_id=self._start_id):
            events.append(event)
        self._state.history = events
```

### 4.2 デリゲート完了時の処理

```python
def end_delegate(self):
    # デリゲートの結果を取得
    delegate_outputs = self.delegate.state.outputs if self.delegate else {}

    # AgentDelegateObservationを作成
    obs = AgentDelegateObservation(
        outputs=delegate_outputs,
        content=f'Delegated agent finished with result:\n\n{content}'
    )

    # 親のイベントストリームに追加
    self.event_stream.add_event(obs, EventSource.AGENT)
```

## 5. 結論

### 5.1 コンテキスト管理の真実

1. **各エージェントは独立したコンテキスト**を持つ
2. **親の履歴は子に引き継がれない**（start_idメカニズム）
3. **情報共有はファイルとinputsディクショナリ**のみ
4. **コンテキストウィンドウは各エージェントでリセット**される

### 5.2 なぜ「適切に動作」しているのか

- **プロンプト設計の良さ**：各エージェントが自己完結的
- **タスクの明確な分離**：各エージェントの責務が明確
- **ファイルベースの永続化**：コンテキストを超えた情報共有

### 5.3 推奨事項

1. **大きなタスクは分割**：各エージェントのコンテキストを効率的に使用
2. **重要な情報はファイル化**：エージェント間で共有が必要な情報
3. **SCOPE_PROGRESS.mdの活用**：進捗と成果物の一元管理

---

**結論**: BlueLampのエージェント切り替えは、OpenHandsのDELEGATE機能により各エージェントが**独立したコンテキストウィンドウ**を持つ設計になっている。これにより、親エージェントの履歴に制限されることなく、各専門エージェントが最大限のコンテキストを活用できる。
