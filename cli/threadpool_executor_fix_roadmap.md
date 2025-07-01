# ThreadPoolExecutor競合状態修正ロードマップ

## 🎯 問題の詳細分析

### 根本原因
1. **エラー発生箇所**: `openhands/events/stream.py` Line 270
   ```python
   future = pool.submit(callback, event)
   ```

2. **エラーメッセージ**: `RuntimeError: cannot schedule new futures after shutdown`

3. **発生条件**:
   - ThreadPoolExecutorが`shutdown()`された後
   - 新しいイベントが処理キューに残っている
   - `pool.submit()`を呼び出そうとする

### 影響範囲
1. **主要影響**: システム不安定化、予期しないシャットダウン
2. **発生タイミング**: エージェント完了時、割り込み処理時
3. **関連ファイル**:
   - `openhands/events/stream.py` (主要)
   - `openhands/utils/async_utils.py` (グローバルExecutor)

## 🔧 修正戦略

### Phase 1: 安全チェック機能の実装
1. **ThreadPoolExecutor状態確認**
   - `_shutdown`フラグの確認
   - submit前の状態チェック

2. **エラーハンドリング強化**
   - RuntimeErrorの適切なキャッチ
   - 代替処理の実装

### Phase 2: 競合状態の回避
1. **シャットダウン順序の制御**
   - イベントストリーム処理の完了待ち
   - ThreadPoolExecutorの適切なシャットダウン

2. **状態管理の改善**
   - シャットダウン状態の追跡
   - 新規タスクの受付停止

### Phase 3: ログ・監視機能の追加
1. **詳細デバッグログ**
   - ThreadPoolExecutor状態の追跡
   - submit操作の詳細ログ

2. **エラー発生時の状態監視**
   - 競合状態の検出
   - リソース状態の記録

## 📝 修正実装計画

### 1. stream.py の修正
```python
# Line 270 周辺の修正
try:
    # ThreadPoolExecutorの状態確認
    if hasattr(pool, '_shutdown') and pool._shutdown:
        logger.warning(f"THREADPOOL_DEBUG: Pool {callback_id} already shutdown, skipping callback")
        continue
    
    future = pool.submit(callback, event)
    future.add_done_callback(
        self._make_error_handler(callback_id, key)
    )
    logger.info(f"AGENT_SWITCH_DEBUG: Sync callback {callback_id} submitted to thread pool")
except RuntimeError as e:
    if "cannot schedule new futures after shutdown" in str(e):
        logger.warning(f"THREADPOOL_DEBUG: Cannot submit to shutdown pool {callback_id}: {e}")
        # 代替処理: 直接同期実行
        try:
            callback(event)
            logger.info(f"THREADPOOL_DEBUG: Fallback sync execution completed for {callback_id}")
        except Exception as fallback_error:
            logger.error(f"THREADPOOL_DEBUG: Fallback execution failed for {callback_id}: {fallback_error}")
    else:
        raise
```

### 2. async_utils.py の修正
```python
# Line 67 周辺の修正
def call_async_from_sync(
    corofn: Callable, timeout: float = GENERAL_TIMEOUT, *args, **kwargs
):
    # ... existing code ...
    
    # ThreadPoolExecutor状態確認の改善
    if hasattr(EXECUTOR, '_shutdown') and EXECUTOR._shutdown:
        logger.warning("THREADPOOL_DEBUG: Global executor shutdown, using direct execution")
        result = run()
        return result

    try:
        future = EXECUTOR.submit(run)
        futures.wait([future], timeout=timeout or None)
        result = future.result()
        return result
    except RuntimeError as e:
        if "cannot schedule new futures after shutdown" in str(e):
            logger.warning(f"THREADPOOL_DEBUG: Global executor shutdown during submit: {e}")
            # フォールバック: 直接実行
            result = run()
            return result
        else:
            raise
```

### 3. 新しいシャットダウン管理クラス
```python
# openhands/utils/shutdown_manager.py (新規作成)
class ShutdownManager:
    def __init__(self):
        self._shutdown_initiated = False
        self._shutdown_lock = threading.Lock()
    
    def initiate_shutdown(self):
        with self._shutdown_lock:
            self._shutdown_initiated = True
    
    def is_shutdown_initiated(self):
        return self._shutdown_initiated
    
    def safe_submit(self, executor, fn, *args, **kwargs):
        if self.is_shutdown_initiated():
            logger.warning("SHUTDOWN_DEBUG: Shutdown initiated, executing directly")
            return fn(*args, **kwargs)
        
        try:
            return executor.submit(fn, *args, **kwargs)
        except RuntimeError as e:
            if "cannot schedule new futures after shutdown" in str(e):
                logger.warning(f"SHUTDOWN_DEBUG: Executor shutdown, fallback to direct execution: {e}")
                return fn(*args, **kwargs)
            else:
                raise
```

## 🧪 テスト計画

### 1. エラー再現テスト
```python
# test_threadpool_fix.py
def test_shutdown_race_condition():
    # ThreadPoolExecutorシャットダウン後のsubmitテスト
    pass

def test_event_stream_shutdown():
    # EventStreamのシャットダウン処理テスト
    pass
```

### 2. 統合テスト
- エージェント完了時の正常終了確認
- 割り込み処理時の安全性確認
- 複数エージェント切り替え時の安定性確認

## 📊 期待される成果

### 1. システム安定性の向上
- ThreadPoolExecutorエラーの完全解決
- 予期しないシャットダウンの防止
- リソースリークの解消

### 2. 保守性の向上
- 詳細なデバッグログによる問題追跡
- エラー発生時の迅速な原因特定
- 将来的な競合状態の予防

### 3. ユーザー体験の改善
- エージェント切り替え時の安定動作
- 割り込み処理の信頼性向上
- システム全体の応答性向上

---

**次のアクション**: Phase 1の安全チェック機能実装から開始
**優先度**: 🔴 最高
**推定作業時間**: 60-90分