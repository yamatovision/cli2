# CTRL+C終了問題 デバッグロードマップ

## 問題概要
BlueLamp CLIアプリケーションでCTRL+Cを押しても即座に終了できない、または終了に時間がかかる問題の調査と修正。

## 関連ファイルと依存関係

### 主要ファイル
1. **openhands/cli/main.py** - メインエントリーポイント
   - `main()`: KeyboardInterrupt処理の最上位
   - `main_with_loop()`: 非同期メインループ
   - `run_session()`: セッション実行ループ
   - `cleanup_session()`: リソースクリーンアップ

2. **openhands/cli/tui.py** - ユーザーインターフェース
   - `read_prompt_input()`: プロンプト入力処理
   - `read_confirmation_input()`: 確認入力処理
   - `process_agent_pause()`: エージェント一時停止処理

3. **openhands/core/loop.py** - エージェント実行ループ
   - `run_agent_until_done()`: エージェント実行制御

### 依存関係フロー
```
main() 
├── main_with_loop()
    ├── run_session()
        ├── create_agent()
        ├── create_runtime()
        ├── create_controller()
        ├── run_agent_until_done() [core/loop.py]
        ├── prompt_for_next_task()
        │   └── read_prompt_input() [tui.py]
        ├── on_event_async()
        │   └── read_confirmation_input() [tui.py]
        ├── process_agent_pause() [tui.py]
        └── cleanup_session()
```

## 現在の問題点

### 1. KeyboardInterrupt処理の不備
- **場所**: `main.py:462-463`
- **問題**: 非同期タスクが適切にキャンセルされていない
- **影響**: CTRL+C押下後も非同期処理が継続

### 2. TUI入力処理での問題
- **場所**: `tui.py:557-558, 581-582`
- **問題**: KeyboardInterruptを`/exit`や`no`に変換している
- **影響**: 即座の終了ではなくコマンド処理になる

### 3. 非同期タスクのキャンセル処理
- **場所**: `main.py:94-98`
- **問題**: タイムアウトが2秒と短く、強制終了されない
- **影響**: 長時間実行中のタスクが残る

### 4. シグナルハンドリングの欠如
- **問題**: SIGINTシグナルの適切な処理がない
- **影響**: システムレベルでの割り込み処理が不完全

## 修正ロードマップ

### Phase 1: 環境調査とログ設置
1. **現在の実行環境確認**
   - Python版本、OS環境
   - 実行中のタスク状況

2. **ログ機能追加**
   - 各段階での処理状況をログ出力
   - タスクキャンセル状況の可視化

### Phase 2: シグナルハンドラー実装
1. **SIGINTハンドラー追加**
   - `main.py`にシグナルハンドラー実装
   - グローバル終了フラグの設定

2. **非同期タスクの適切なキャンセル**
   - タイムアウト時間の延長
   - 強制キャンセル機能の追加

### Phase 3: TUI入力処理の改善
1. **KeyboardInterrupt処理の修正**
   - `read_prompt_input()`の即座終了
   - `read_confirmation_input()`の即座終了

2. **プロセス一時停止処理の改善**
   - `process_agent_pause()`でのCTRL+C処理

### Phase 4: 統合テストと検証
1. **各段階でのテスト**
   - 通常終了の確認
   - CTRL+C終了の確認
   - 異常終了時の動作確認

2. **パフォーマンス測定**
   - 終了時間の測定
   - リソースクリーンアップの確認

## 期待する結果
- CTRL+C押下から1-2秒以内での確実な終了
- 適切なリソースクリーンアップ
- ユーザーフレンドリーな終了メッセージ

## 実装済み修正内容

### Phase 1: 環境調査とログ設置 ✅
- **環境確認**: Python 3.9.6、macOS ARM64
- **ログ機能追加**: 全ての主要関数にCTRL+C_DEBUGログを追加

### Phase 2: シグナルハンドラー実装 ✅
- **SIGINTハンドラー追加**: `setup_signal_handlers()`関数を実装
- **グローバル終了フラグ**: `_shutdown_requested`イベントを追加
- **非同期タスクキャンセル**: タイムアウトを5秒に延長、強制キャンセル機能追加

### Phase 3: TUI入力処理の改善 ✅
- **KeyboardInterrupt処理**: 各入力関数でCTRL+Cキーバインディング追加
- **プロセス一時停止処理**: `process_agent_pause()`でCTRL+C時の即座終了処理

### Phase 4: エージェントループの改善 ✅
- **run_agent_until_done**: シャットダウンチェックを追加
- **prompt_for_next_task**: 各ステップでシャットダウンチェック
- **on_event_async**: イベント処理前のシャットダウンチェック

## 修正されたファイル

1. **openhands/cli/main.py**
   - シグナルハンドラー追加
   - グローバル終了フラグ実装
   - cleanup_session関数の改善
   - main関数の終了処理強化

2. **openhands/cli/tui.py**
   - 各入力関数にCTRL+Cキーバインディング追加
   - ログ出力追加
   - process_agent_pause関数の改善

3. **openhands/core/loop.py**
   - run_agent_until_done関数にシャットダウンチェック追加

## ログ出力内容

以下のログが出力されるようになりました：
- `CTRL+C_DEBUG: Signal handlers registered`
- `CTRL+C_DEBUG: Starting BlueLamp CLI application`
- `CTRL+C_DEBUG: Signal X received, initiating shutdown...`
- `CTRL+C_DEBUG: Starting session cleanup...`
- `CTRL+C_DEBUG: Found X pending tasks to cancel`
- `CTRL+C_DEBUG: CTRL+C pressed in [input type]`
- `CTRL+C_DEBUG: Shutdown requested, breaking agent loop`

## テスト手順

### 基本テスト
1. アプリケーション起動
2. プロンプト待機中にCTRL+C押下
3. 1-2秒以内での終了確認

### 詳細テスト
1. 各入力状態でのCTRL+C動作確認
2. エージェント実行中のCTRL+C動作確認
3. ログ出力の確認

## 次のステップ
実際のテストを実行し、動作確認を行う。