# FINISHツール改良計画 - ユーザー確認とタスク更新機能

## 1. 背景と課題

### 現状の問題
- エージェントが権限超過やエラー時に勝手にFINISHツールを使用して終了してしまう
- ユーザーの許可なしに作業が終了され、コンテキストが失われる
- FINISHツールの`task_completed`パラメータが`true`のみしか選択できない

### 解決したい課題
1. **コンテキストの保持**: 勝手に終了されることで失われるコンテキストを維持
2. **ユーザー制御**: タスク完了の判断をユーザーが最終決定
3. **柔軟性**: タスクを更新して作業を継続する選択肢の提供

## 2. 技術調査結果

### 2.1 エージェントの動作フロー

```python
# AgentController._handle_action() より
elif isinstance(action, AgentFinishAction):
    self.state.outputs = action.outputs
    await self.set_agent_state_to(AgentState.FINISHED)
```

重要な発見：
- `AgentFinishAction`を実行しなければ、エージェントの状態は`RUNNING`のまま維持される
- エージェントのコンテキスト（会話履歴）は`State`オブジェクトに保持される
- 新しいユーザーメッセージが来れば、通常通り`step()`メソッドが呼ばれる

### 2.2 DELEGATEツールの実装

```python
# DELEGATEツールのパラメータ
'properties': {
    'task': {'type': 'string', 'description': 'タスクの内容'}
}
```

- タスクは`task`パラメータで設定される
- 委譲されたエージェントはこのタスクを実行する

### 2.3 FINISHツールの現状

```python
# 現在のFINISHツール定義
_FINISH_DESCRIPTION = """このツールが使用されると現在の会話とコンテクストが終了して権限委譲元のAIに戻ります。
必ずユーザーに許可をもらってから task_completed: true に切り替えてください。"""
```

問題点：
- 説明文で「必ずユーザーに許可をもらってから」と指示しているが、LLMが無視することがある
- `task_completed`は`enum: ['true']`で固定されている

## 3. 実装設計

### 3.1 基本方針
- FINISHツール呼び出し時に2段階の確認プロセスを導入
- ユーザーに「完了」または「タスク更新」の選択肢を提供
- タスク更新の場合はコンテキストを維持したまま作業継続

### 3.2 実装詳細

#### 3.2.1 FINISHツールの修正

```python
# core/agents/orchestrator_agent/tools/finish.py

_FINISH_DESCRIPTION = """タスクの完了または更新を行います。
重要：このツールは必ずユーザーの確認を取ってから実行されます。
- タスク完了：現在のタスクを終了して委譲元に戻る
- タスク更新：現在のタスクを更新して作業を継続
"""

FinishTool = ChatCompletionToolParam(
    type='function',
    function=ChatCompletionToolParamFunctionChunk(
        name=FINISH_TOOL_NAME,
        description=_FINISH_DESCRIPTION,
        parameters={
            'type': 'object',
            'required': ['message'],
            'properties': {
                'message': {
                    'type': 'string',
                    'description': '完了内容の要約と引き継ぎメッセージ',
                },
                # task_completed パラメータを削除
            },
        },
    ),
)
```

#### 3.2.2 function_calling.pyの拡張

```python
# core/agents/orchestrator_agent/function_calling.py

# エージェントごとの確認状態を管理
agent_finish_states = {}

elif tool_call.function.name == FinishTool['function']['name']:
    agent_id = getattr(state, 'agent_id', id(state))
    
    if not agent_finish_states.get(agent_id, {}).get('confirmed'):
        # ステップ1: 確認メッセージを表示
        current_task = getattr(state, 'current_task', 'タスク情報なし')
        
        confirmation_msg = f"""
========================================
タスク完了の確認
========================================

【現在のタスク】
{current_task}

【完了内容・引き継ぎ事項】
{arguments.get('message', '')}

このタスクを完了してよろしいですか？
- はい/yes/y: タスクを完了して終了
- 更新/update/u: 新しいタスクを設定して継続
"""
        
        # FINISHアクションを保留
        agent_finish_states[agent_id] = {
            'status': 'pending_confirmation',
            'pending_finish': AgentFinishAction(
                final_thought=arguments.get('message', ''),
                task_completed=AgentFinishTaskCompleted.TRUE
            ),
            'current_task': current_task
        }
        
        action = MessageAction(
            content=confirmation_msg,
            wait_for_response=True,
            metadata={
                'type': 'finish_confirmation',
                'agent_id': agent_id
            }
        )
    else:
        # ステップ2: 確認済みの処理
        saved_state = agent_finish_states[agent_id]
        
        if saved_state.get('update_task'):
            # タスク更新：FINISHをキャンセルして継続
            action = MessageAction(
                content=f"タスクを更新しました：{saved_state['new_task']}\n作業を継続します。"
            )
            # コンテキストは維持される
        else:
            # タスク完了：保留していたFINISHを実行
            action = saved_state['pending_finish']
        
        # 状態をクリア
        del agent_finish_states[agent_id]
```

#### 3.2.3 ユーザー応答処理

```python
# ユーザー応答を処理する関数（メインループまたは適切な場所に実装）

def handle_finish_confirmation(user_input: str, metadata: dict) -> Action:
    """FINISHツールの確認に対するユーザー応答を処理"""
    
    if metadata.get('type') == 'finish_confirmation':
        agent_id = metadata['agent_id']
        saved_state = agent_finish_states.get(agent_id, {})
        
        if user_input.lower() in ['yes', 'y', 'はい']:
            # タスク完了を承認
            agent_finish_states[agent_id]['confirmed'] = True
            
            return MessageAction(
                content="承認されました。タスクを完了します。",
                metadata={'trigger_finish': True, 'agent_id': agent_id}
            )
                
        elif user_input.lower() in ['update', 'u', '更新']:
            # タスク更新モード
            agent_finish_states[agent_id] = {
                **saved_state,
                'status': 'awaiting_new_task'
            }
            
            return MessageAction(
                content="新しいタスクの内容を教えてください：",
                wait_for_response=True,
                metadata={'type': 'new_task_input', 'agent_id': agent_id}
            )
            
        else:
            # 無効な応答
            return MessageAction(
                content="「はい」または「更新」で応答してください。",
                wait_for_response=True,
                metadata={'type': 'finish_confirmation', 'agent_id': agent_id}
            )
    
    elif metadata.get('type') == 'new_task_input':
        # 新しいタスクの入力を処理
        agent_id = metadata['agent_id']
        new_task = user_input
        
        # タスクを更新（実装方法はシステムに依存）
        # state.current_task = new_task  # 例
        
        agent_finish_states[agent_id] = {
            'confirmed': True,
            'update_task': True,
            'new_task': new_task
        }
        
        return MessageAction(
            content=f"新しいタスクを設定しました：{new_task}",
            metadata={'trigger_task_update': True, 'agent_id': agent_id}
        )
```

## 4. 実装上の考慮事項

### 4.1 メリット
1. **コンテキスト保持**: エージェントが勝手に終了せず、作業履歴が維持される
2. **ユーザー制御**: タスク完了の最終判断をユーザーが行える
3. **柔軟性**: タスクを更新して作業を継続できる
4. **引き継ぎ機能維持**: `final_thought`による委譲元への報告機能は維持

### 4.2 潜在的なリスク
1. **履歴の肥大化**: 長時間の作業でコンテキストウィンドウを超える可能性
2. **委譲元への報告遅延**: タスク更新を繰り返すと委譲元への報告が遅れる
3. **状態管理の複雑化**: 確認待ち状態の管理が必要

### 4.3 代替案
より保守的なアプローチとして、タスク更新時は一度完了してから新しいDELEGATEを推奨する方法もある：

```python
elif response.lower() in ['update', 'u', '更新']:
    return MessageAction(
        content="""
タスクを更新する場合は、一度このタスクを完了してから、
新しいタスクとして委譲し直すことを推奨します。

今すぐ完了しますか？（yes/no）
""",
        wait_for_response=True
    )
```

## 5. テスト計画

### 5.1 単体テスト
- FINISHツール呼び出し時の確認メッセージ生成
- ユーザー応答の処理ロジック
- 状態管理の正確性

### 5.2 統合テスト
- エージェントのタスク完了フロー全体
- タスク更新後の作業継続
- エラーケースの処理

### 5.3 手動テスト
CLIでの実際の動作確認：
1. 通常のタスク完了フロー
2. タスク更新フロー
3. 無効な応答の処理
4. 複数回のタスク更新

## 6. 実装スケジュール

1. **Phase 1**: FINISHツールの修正とfunction_calling.pyの基本実装（1-2日）
2. **Phase 2**: ユーザー応答処理とメインループへの統合（1日）
3. **Phase 3**: テストとバグ修正（2日）
4. **Phase 4**: ドキュメント更新とレビュー（1日）

## 7. まとめ

この実装により、エージェントが勝手に作業を終了することを防ぎ、ユーザーが完全にコントロールできるようになります。特に重要なのは、コンテキストを維持したままタスクを更新して作業を継続できる点で、これにより柔軟で効率的な作業フローが実現できます。