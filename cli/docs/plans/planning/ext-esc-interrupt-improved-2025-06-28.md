# BlueLamp CLI - 改善されたESC割り込み実装計画

## 概要
既存の実装と参照CLIを分析した結果、より効率的でシンプルなイベント駆動型の実装方針を採用します。

## 現状分析

### 既存実装の強み
- `interrupt_handler.py`に完全な割り込みハンドラーが実装済み
- スレッドセーフな割り込みフラグ管理
- タスク完了状態の追跡機能

### 改善が必要な点
1. ESCキーバインディングが割り込みハンドラーに未接続
2. `process_agent_pause`関数が未実装
3. ポーリング方式（1秒ごと）で効率が悪い
4. `_shutdown_requested`変数が未定義

## 改善された実装計画

### フェーズ1: 基本的な接続（最小限の変更）

#### 1.1 ESCキーバインディングの接続
```python
# tui.py の read_prompt_input 関数内に追加
@kb.add('escape')
def handle_esc(event: KeyPressEvent) -> None:
    """ESCキーで割り込みを要求"""
    from openhands.cli.interrupt_handler import request_user_interrupt
    request_user_interrupt()
    # フィードバックメッセージを表示
    print_formatted_text(HTML('<gold>割り込みを要求しました...</gold>'))
```

#### 1.2 process_agent_pause関数の実装
```python
# main.py に追加
async def process_agent_pause(is_paused: asyncio.Event, event_stream) -> None:
    """エージェント実行中のESCキー監視（シンプル版）"""
    # 既存の割り込みハンドラーを活用
    from openhands.cli.interrupt_handler import is_interrupt_requested, clear_interrupt
    
    while True:
        if is_interrupt_requested():
            is_paused.set()
            clear_interrupt()
            break
        await asyncio.sleep(0.1)  # 100msごとにチェック
```

### フェーズ2: イベント駆動型への移行（効率化）

#### 2.1 割り込みハンドラーの改善
```python
# interrupt_handler.py に追加
class InterruptEvent:
    def __init__(self):
        self._event = asyncio.Event()
        self._lock = threading.Lock()
    
    def set(self):
        with self._lock:
            self._event.set()
    
    async def wait(self):
        await self._event.wait()
    
    def clear(self):
        with self._lock:
            self._event.clear()
```

#### 2.2 run_agent_until_done の改善
```python
# core/loop.py の改善
async def run_agent_until_done(
    controller,
    config: OpenHandsConfig,
    agent: Agent,
    event_stream: EventStream,
    headless_mode: bool = True,
    max_iterations: int | None = None,
    max_budget: float | None = None,
) -> bool:
    """イベント駆動型の割り込みチェック"""
    interrupt_event = InterruptEvent()
    
    # 割り込み監視タスク
    async def monitor_interrupt():
        while True:
            if is_interrupt_requested():
                interrupt_event.set()
                break
            await asyncio.sleep(0.1)
    
    monitor_task = asyncio.create_task(monitor_interrupt())
    
    try:
        # メインループ
        while True:
            # 割り込みチェック（非ブロッキング）
            if interrupt_event._event.is_set():
                handle_interrupt()
                break
            
            # エージェント処理
            await process_agent_step()
    finally:
        monitor_task.cancel()
```

### フェーズ3: 統合とテスト

#### 3.1 メッセージ表示の改善
- ESC押下時の即座のフィードバック
- 割り込み処理中の状態表示
- タスク完了後の適切なメッセージ

#### 3.2 エラーハンドリング
- 複数回のESC押下への対応
- 割り込み中の新規割り込み防止
- 適切なクリーンアップ処理

## 実装の優先順位

1. **必須（Phase 1）**
   - ESCキーバインディングの接続
   - process_agent_pause関数の基本実装
   - 未定義変数の修正

2. **推奨（Phase 2）**
   - イベント駆動型への移行
   - 効率的な割り込み監視

3. **オプション（Phase 3）**
   - UI/UXの改善
   - 高度なエラーハンドリング

## 技術的な利点

### シンプルさ
- 既存の`interrupt_handler.py`を最大限活用
- 最小限のコード変更で機能実現
- 段階的な改善が可能

### 効率性
- ポーリング間隔を1秒から0.1秒に短縮（Phase 1）
- イベント駆動で無駄なCPU使用を削減（Phase 2）
- 非同期処理の活用

### 保守性
- 明確な責任分離
- テスト可能な設計
- 既存コードとの互換性維持

## 実装スケジュール

1. **即座に実装可能**：Phase 1（30分）
2. **次のステップ**：Phase 2（1-2時間）
3. **将来的な改善**：Phase 3（必要に応じて）

この計画により、最小限の労力で最大の効果を得られる実装が可能です。