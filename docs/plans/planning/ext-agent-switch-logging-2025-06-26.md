# エージェント切り替え詳細ログ機能実装計画

## 1. 基本情報

- **作成日**: 2025-06-26
- **要求者**: ユーザー
- **実装レベル**: 中規模機能拡張
- **影響範囲**: agent_controller.py、ログシステム

## 2. 要件定義

### 2.1 ログ出力要件
1. **エージェント切り替え情報**
   - 切り替え元エージェント名
   - 切り替え先エージェント名
   - 切り替え理由
   - 切り替え時刻

2. **引き継ぎメッセージ内容**
   - AgentDelegateActionの詳細内容
   - タスク説明、要件、コンテクスト

3. **コンテクストウィンドウ情報**
   - 現在のイベント数
   - コンテクストウィンドウ使用率
   - 削減情報（該当時）

### 2.2 ログレベル
- **INFO**: 正常な切り替え情報
- **DEBUG**: 詳細な引き継ぎ内容
- **WARNING**: コンテクストウィンドウ制限関連

## 3. 実装計画

### 3.1 Phase 1: エージェント切り替えログ強化

**対象ファイル**: `cli/openhands/controller/agent_controller.py`

**修正箇所1**: `start_delegate`メソッド（720-800行目）
```python
# 現在のログ（798-800行目）を拡張
self.log(
    'info',
    f'🔄 AGENT SWITCH: {self.agent.name} → {delegate_agent.name}',
    extra={
        'msg_type': 'AGENT_SWITCH_START',
        'from_agent': self.agent.name,
        'to_agent': delegate_agent.name,
        'switch_time': current_time,
        'delegate_level': self.state.delegate_level + 1,
        'task_summary': action.inputs.get('task', 'No task specified')[:100],
        'context_events_count': len(self.state.history),
        'parent_iteration': self.state.iteration_flag.current_value
    }
)

# 引き継ぎ詳細ログ（DEBUG）
self.log(
    'debug',
    f'📋 HANDOVER DETAILS: Task delegation to {delegate_agent.name}',
    extra={
        'msg_type': 'AGENT_HANDOVER_DETAILS',
        'delegate_inputs': action.inputs,
        'thought': getattr(action, 'thought', 'No thought provided'),
        'agent_config': agent_config.model_dump() if hasattr(agent_config, 'model_dump') else str(agent_config)
    }
)
```

**修正箇所2**: `end_delegate`メソッド（802-884行目）
```python
# 880-884行目のログを拡張
delegate_duration = time.time() - self._delegate_start_time if self._delegate_start_time else 0
self.log(
    'info',
    f'🔄 AGENT SWITCH COMPLETE: {self.delegate.agent.name} → {self.agent.name}',
    extra={
        'msg_type': 'AGENT_SWITCH_END',
        'from_agent': self.delegate.agent.name,
        'to_agent': self.agent.name,
        'delegate_state': str(delegate_state),
        'duration_seconds': round(delegate_duration, 2),
        'delegate_iterations': self.delegate.state.iteration_flag.current_value - self.state.iteration_flag.current_value,
        'final_outputs': delegate_outputs,
        'context_events_count': len(self.state.history)
    }
)
```

### 3.2 Phase 2: コンテクストウィンドウ情報ログ

**修正箇所3**: `_handle_long_context_error`メソッド（1093-1132行目）
```python
# 1099-1102行目のログを拡張
total_events = len(self.state.history)
kept_events_count = len(kept_events)
reduction_percentage = round((total_events - kept_events_count) / total_events * 100, 1)

self.log(
    'warning',
    f'📊 CONTEXT WINDOW EXCEEDED: Reduced {total_events} → {kept_events_count} events ({reduction_percentage}% reduction)',
    extra={
        'msg_type': 'CONTEXT_WINDOW_REDUCTION',
        'total_events_before': total_events,
        'kept_events_count': kept_events_count,
        'forgotten_events_count': len(forgotten_event_ids),
        'reduction_percentage': reduction_percentage,
        'agent_name': self.agent.name,
        'delegate_level': self.state.delegate_level
    }
)
```

**修正箇所4**: 新規メソッド追加（コンテクストウィンドウ使用率監視）
```python
def _log_context_window_status(self, event_type: str = 'step') -> None:
    """コンテクストウィンドウの使用状況をログに記録"""
    try:
        current_events = len(self.state.history)
        # LLMの最大コンテクスト長を取得（概算）
        max_context = getattr(self.agent.llm.config, 'max_input_tokens', 4096)
        # イベント1つあたり平均100トークンと仮定
        estimated_tokens = current_events * 100
        usage_percentage = min(round(estimated_tokens / max_context * 100, 1), 100)
        
        if usage_percentage > 80:  # 80%を超えた場合のみログ
            self.log(
                'info',
                f'📊 CONTEXT USAGE: {usage_percentage}% ({current_events} events, ~{estimated_tokens} tokens)',
                extra={
                    'msg_type': 'CONTEXT_WINDOW_STATUS',
                    'event_type': event_type,
                    'current_events': current_events,
                    'estimated_tokens': estimated_tokens,
                    'usage_percentage': usage_percentage,
                    'max_context_tokens': max_context,
                    'agent_name': self.agent.name
                }
            )
    except Exception as e:
        self.log('debug', f'Failed to log context window status: {str(e)}')
```

### 3.3 Phase 3: ログ呼び出し箇所の追加

**修正箇所5**: `_step`メソッドにコンテクスト監視を追加
```python
# _stepメソッドの開始時にコンテクスト使用率をチェック
async def _step(self) -> None:
    # 既存のコード...
    
    # コンテクストウィンドウ使用率監視（10ステップごと）
    if self.state.iteration_flag.current_value % 10 == 0:
        self._log_context_window_status('periodic_check')
```

## 4. 実装順序

1. **Phase 1**: エージェント切り替えログ強化（30分）
2. **Phase 2**: コンテクストウィンドウ情報ログ（20分）
3. **Phase 3**: ログ呼び出し箇所の追加（10分）
4. **テスト**: 実際のエージェント切り替えでログ確認（10分）

## 5. 期待される効果

### 5.1 ユーザーメリット
- エージェント切り替えの透明性向上
- 引き継ぎ内容の可視化
- パフォーマンス問題の早期発見

### 5.2 開発者メリット
- デバッグ効率の向上
- エージェント間通信の追跡容易化
- コンテクストウィンドウ管理の最適化

## 6. 設定オプション（将来拡張）

```toml
[logging.agent_switch]
enabled = true
log_level = "info"
include_handover_details = true
context_window_threshold = 80  # %
periodic_context_check_interval = 10  # steps
```

## 7. ログ出力例

```
2025-06-26 19:47:15 - INFO - [Agent Controller abc123] 🔄 AGENT SWITCH: OrchestratorAgent → FeatureExpansionAgent
2025-06-26 19:47:15 - DEBUG - [Agent Controller abc123] 📋 HANDOVER DETAILS: Task delegation to FeatureExpansionAgent
2025-06-26 19:47:45 - INFO - [Agent Controller abc123] 📊 CONTEXT USAGE: 85% (234 events, ~23400 tokens)
2025-06-26 19:48:20 - INFO - [Agent Controller abc123] 🔄 AGENT SWITCH COMPLETE: FeatureExpansionAgent → OrchestratorAgent
```

## 8. 実装完了条件

- [ ] エージェント切り替え時の詳細ログ出力
- [ ] 引き継ぎ内容の可視化
- [ ] コンテクストウィンドウ使用率監視
- [ ] 実際のエージェント切り替えでのテスト完了
- [ ] ログレベルの適切な設定