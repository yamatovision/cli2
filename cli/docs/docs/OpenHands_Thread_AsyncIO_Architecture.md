# OpenHands スレッド・非同期処理アーキテクチャ解析レポート

## 概要

本ドキュメントは、OpenHandsシステムにおけるスレッド生成、非同期処理、およびシャットダウンメカニズムの詳細な分析結果をまとめたものです。特に「なぜCtrl+Cを複数回押さないと終了しないのか」という問題の根本原因を明らかにします。

## 1. スレッド生成のメカニズム

### 1.1 EventStreamのスレッド構造

EventStream（`openhands/events/stream.py`）は、イベント駆動アーキテクチャの中核を担い、以下のスレッドを生成します：

```
EventStream
├── メインスレッド
├── キューループスレッド (_queue_thread)
│   └── 専用イベントループ (_queue_loop)
└── サブスクライバー用スレッドプール群
    ├── サブスクライバー1用 ThreadPoolExecutor
    │   └── ワーカースレッド（専用イベントループ付き）
    ├── サブスクライバー2用 ThreadPoolExecutor
    │   └── ワーカースレッド（専用イベントループ付き）
    └── ...
```

#### 具体的に何が起きているか（レストランの例え）

これをレストランに例えると：

1. **メインスレッド** = レストランのマネージャー
   - お客様（ユーザー）からの注文を受け付ける
   - 全体の運営を管理

2. **キューループスレッド** = ウェイター長
   - 注文票（イベント）を管理
   - どの料理人に何を作ってもらうかを決める
   - 独自の作業スペース（イベントループ）を持つ

3. **サブスクライバー用スレッドプール** = 各専門料理人
   - **サブスクライバー1** = 前菜担当（例：AgentController）
   - **サブスクライバー2** = メイン料理担当（例：RuntimeClient）
   - **サブスクライバー3** = デザート担当（例：FileStore）
   - それぞれが独自のキッチン（イベントループ）を持つ

### 1.2 実際のエージェントとスレッドの関係

#### OpenHandsで実際に何が起きているか

例えば、ユーザーが「ファイルを作成して」と言った場合：

```
1. ユーザー入力「ファイルを作成して」
   ↓
2. メインスレッド（CLI）がMessageActionイベントを作成
   ↓
3. EventStream._queueに追加
   ↓
4. キューループスレッドが検知
   ↓
5. AgentController用のThreadPoolExecutorに送信
   ↓
6. AgentControllerのワーカースレッドで処理
   - LLMを呼び出し（OpenAI APIなど）
   - レスポンスを解析
   - FileWriteActionを生成
   ↓
7. FileWriteActionが再びEventStreamへ
   ↓
8. RuntimeClient用のThreadPoolExecutorが受信
   ↓
9. 実際にファイルを作成
```

#### 1.2.1 キューループスレッド

```python
# 生成箇所: EventStream.__init__ (行64-66)
self._queue_thread = threading.Thread(target=self._run_queue_loop)
self._queue_thread.daemon = True  # デーモンスレッドとして設定
self._queue_thread.start()
```

**役割**: イベントキューからイベントを取り出し、各サブスクライバーに配信

#### 1.2.2 サブスクライバー用スレッドプール

```python
# 生成箇所: EventStream.subscribe (行138)
pool = ThreadPoolExecutor(max_workers=1, initializer=initializer)
```

**特徴**:
- 各サブスクライバーごとに独立したスレッドプール
- 各スレッドは独自のイベントループを持つ
- サブスクライバーのコールバックを非同期で実行

### 1.3 コンテキストウィンドウとメモリの流れ

#### エージェントのメモリ管理

各エージェント（AgentController）は独自の状態（State）を持ち、会話履歴を管理：

```python
# AgentControllerの状態
self.state = State(
    history=[...],  # 会話履歴（Event のリスト）
    metrics={...},  # 使用トークン数など
    delegate_level=0,  # 委譲の深さ
)
```

**コンテキストウィンドウの管理**：

1. **履歴の蓄積**
   - すべてのイベント（ユーザーメッセージ、エージェントアクション、観察結果）が`history`に追加

2. **トークン数の監視**
   - LLM呼び出し前にトークン数をカウント
   - 上限に近づくと古い履歴を圧縮（Condensation）

3. **委譲時のコンテキスト**
   - 親エージェントから子エージェントへ委譲する際、必要な情報のみを渡す
   - 子エージェントは独自のコンテキストウィンドウを持つ

### 1.4 重要な誤解の訂正：エージェントは並列動作しない

#### すべてのAgentControllerは同じスレッドで動く

前述のスレッド構造図は**インフラ**を示したもので、実際のエージェント実行は異なります：

```
EventStream
├── メインスレッド（CLIのUI処理）
├── キューループスレッド（イベント配信係）
└── サブスクライバー用スレッドプール群
    ├── AgentController用 ThreadPoolExecutor（max_workers=1）
    │   └── 単一スレッドですべてのエージェントが順番に実行
    │       - OrchestratorAgent ← 実行中は他は待機
    │       - BackendAgent ← 親が委譲したら実行
    │       - FrontendAgent ← 順番待ち
    ├── RuntimeClient用 ThreadPoolExecutor
    └── FileStore用 ThreadPoolExecutor
```

#### なぜ並列動作しないのか

```python
# AgentControllerのサブスクライバー登録
event_stream.subscribe(
    EventStreamSubscriber.AGENT_CONTROLLER,
    agent_controller.on_event,
    max_workers=1  # ← これが重要！ワーカー数は1つのみ
)
```

### 1.5 実際のエージェント実行フロー

```
ユーザー：「ECサイトを作って」

時刻 0ms: OrchestratorAgent開始（AgentControllerスレッド）
         - タスクを分析
         - BackendAgentへの委譲を決定
         
時刻 100ms: OrchestratorAgent一時停止（delegate状態）
           BackendAgent開始（同じスレッド）
           - APIを実装
           
時刻 5000ms: BackendAgent完了
            OrchestratorAgent再開（同じスレッド）
            - FrontendAgentへの委譲を決定
            
時刻 5100ms: OrchestratorAgent再度一時停止
            FrontendAgent開始（同じスレッド）
```

#### この設計の理由

1. **状態管理の簡潔性**
   - 同時実行による競合状態（race condition）を回避
   - デバッグとトレースが容易

2. **LLMのボトルネック**
   - LLM API呼び出しは数秒〜数十秒かかる
   - 並列化してもLLM側で待ち行列になる

3. **委譲の明確性**
   - 親は子の完了を確実に待つ
   - 結果の受け渡しが単純

### 1.6 本当の並列処理

エージェントは順次実行ですが、以下は並列動作します：

```
エージェントがGPTの応答を待っている間（5秒）：
- RuntimeClientスレッド：前のファイル書き込みを実行
- FileStoreスレッド：ファイル変更を監視
- キューループスレッド：新しいイベントをチェック
```

つまり、**エージェントの思考は順次**、**実行は並列**という設計です。

## 2. 非同期ループの仕組み

### 2.1 イベントループとは何か？

#### 分かりやすい例え：コーヒーショップ

イベントループは、コーヒーショップのバリスタのような存在です：

1. **注文を受ける**（イベント受信）
2. **コーヒーマシンを起動**（非同期タスク開始）
3. **待ち時間に別の注文を処理**（他のタスクを実行）
4. **コーヒーが完成したら提供**（タスク完了）

### 2.2 OpenHandsにおける3つのイベントループ

#### 2.2.1 メインイベントループ
- **場所**: アプリケーション起動時
- **管理**: asyncioデフォルトループ
- **用途**: CLI入力の処理、初期化処理
- **例**: ユーザーからのコマンド入力待ち

#### 2.2.2 キューループ専用イベントループ
```python
# EventStream._run_queue_loop (行232-237)
def _run_queue_loop(self) -> None:
    self._queue_loop = asyncio.new_event_loop()
    asyncio.set_event_loop(self._queue_loop)
    try:
        self._queue_loop.run_until_complete(self._process_queue())
    finally:
        self._queue_loop.close()
```

**役割**: イベントの交通整理
- キューからイベントを取り出す
- 適切なサブスクライバーに配信
- 24時間365日動き続ける（無限ループ）

#### 2.2.3 サブスクライバースレッド用イベントループ
```python
# EventStream._init_thread_loop (行73-77)
def _init_thread_loop() -> None:
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    _thread_loops[subscriber_id][callback_id] = loop
```

**実際の例**:
- AgentController用ループ: LLM呼び出しを管理
- RuntimeClient用ループ: ファイル操作を管理
- FileStore用ループ: ファイル変更監視を管理

### 2.3 イベントループの相互作用（具体例）

```
例：ユーザーが「test.pyを作成して」と入力

1. [メインループ] ユーザー入力を受信
    ↓
2. [メインループ] MessageActionイベントを作成
    ↓
3. [EventStream._queue] にイベント追加
    ↓
4. [キューループ] イベントを検知（0.1秒ごとにチェック）
    ↓
5. [キューループ] AgentControllerのThreadPoolに送信
    ↓
6. [AgentControllerループ] LLMを呼び出し
    ↓
7. [AgentControllerループ] FileWriteActionを生成
    ↓
8. [EventStream._queue] に新しいイベント追加
    ↓
9. [キューループ] RuntimeClientのThreadPoolに送信
    ↓
10. [RuntimeClientループ] 実際にファイルを作成
```

## 3. タスクスケジューリングの流れ

### 3.1 タスクスケジューリングとは？

#### 郵便配達システムの例え

タスクスケジューリングは郵便配達システムに似ています：

1. **手紙（タスク）** が投函される
2. **郵便局（ThreadPoolExecutor）** が手紙を仕分け
3. **配達員（ワーカースレッド）** が配達
4. **受取確認（完了通知）** が返される

### 3.2 OpenHandsでの実際のタスクフロー

#### 具体例：「READMEファイルを作成」タスク

```
1. ユーザー入力: "READMEファイルを作成して"
   ↓
2. MessageActionイベント生成
   event_stream.add_event(MessageAction(content="READMEファイルを作成して"), EventSource.USER)
   ↓
3. EventStream._queueに追加
   self._queue.put({
       "event": MessageAction(...),
       "event_id": 1234,
       "timestamp": "2024-01-27T10:20:00"
   })
   ↓
4. キューループが検知（0.1秒以内）
   event = self._queue.get(timeout=0.1)
   ↓
5. AgentControllerのThreadPoolに送信
   future = agent_controller_pool.submit(agent_controller.on_event, event)
   ↓
6. AgentControllerワーカースレッドで処理
   - GPTに問い合わせ: "READMEファイルを作成するコマンドは？"
   - レスポンス解析: FileWriteAction生成
   ↓
7. 新しいイベント（FileWriteAction）をキューに追加
   ↓
8. RuntimeClientが受信して実際にファイル作成
```

### 3.3 タスクの優先順位とキューイング

#### EventStreamのキュー管理

```python
# 実際のキュー構造
self._queue = queue.Queue()  # FIFO（先入れ先出し）

# イベントの優先順位（暗黙的）
1. ユーザーメッセージ（最優先）
2. エージェントアクション
3. 観察結果（Observation）
4. システムメッセージ
```

### 3.4 タスクのライフサイクル詳細

```
[タスク生成]
    ↓ イベントとしてキューに追加
[EventStream._queue]
    ↓ 0.1秒以内に取り出し
[キューループ]
    ↓ 適切なサブスクライバーを特定
[ThreadPoolExecutor.submit()]
    ↓ 空いているワーカーに割り当て
[ワーカースレッド実行]
    ↓ 処理完了または例外発生
[結果返却/エラー処理]
    ↓ エラーの場合
[エラーイベント生成] → キューに再投入
```

### 3.5 並行処理の実例

```
同時に複数のタスクが処理される例：

時刻 0ms: ユーザー「ファイルAを作成」
時刻 10ms: AgentController処理開始
時刻 50ms: ユーザー「ファイルBも作成」
時刻 60ms: 2つ目のMessageAction生成（待機）
時刻 500ms: AgentControllerがFileWriteAction(A)生成
時刻 510ms: RuntimeClientがファイルA作成開始
時刻 520ms: AgentControllerが2つ目のメッセージ処理開始
時刻 600ms: ファイルA作成完了
時刻 1000ms: FileWriteAction(B)生成
時刻 1100ms: ファイルB作成完了
```

## 4. シャットダウンプロセスの詳細

### 4.1 シグナルハンドリング

```python
# shutdown_listener.py (行22-40)
def _register_signal_handler(sig: signal.Signals) -> None:
    def handler(sig_: int, frame: FrameType | None) -> None:
        global _should_exit
        if not _should_exit:
            _should_exit = True
            # 登録されたリスナーを実行
            for callable in _shutdown_listeners.values():
                callable()
```

### 4.2 EventStreamのクローズ処理

```python
# EventStream.close (行79-93)
def close(self) -> None:
    # 1. 停止フラグを設定
    self._stop_flag.set()
    
    # 2. キューループスレッドの終了を待つ
    if self._queue_thread.is_alive():
        self._queue_thread.join()
    
    # 3. サブスクライバーのクリーンアップ
    for subscriber_id in subscriber_ids:
        self._clean_up_subscriber(subscriber_id, callback_id)
    
    # 4. キューをクリア
    while not self._queue.empty():
        self._queue.get()
```

## 5. Ctrl+C終了問題の根本原因

### 5.1 問題の症状
- Ctrl+C（SIGINT）を1回押しても終了しない
- 複数回押すか、長時間待つ必要がある
- `RuntimeError: cannot schedule new futures after shutdown`エラーが発生

### 5.2 分かりやすい例え：閉店時間のレストラン

Ctrl+Cで終了しない問題は、レストランの閉店時間に例えられます：

1. **店長（メインスレッド）**: 「閉店します！」と宣言
2. **ウェイター長（キューループ）**: まだ注文票をチェックし続けている
3. **料理人たち（サブスクライバー）**: 自分のキッチンで作業を続けている
4. **問題**: 店長の声が厨房まで届かない！

### 5.3 技術的な根本原因

#### 原因1: スレッド間の通信問題
```
実際の流れ：

1. Ctrl+C → メインスレッドがSIGINTを受信
2. shutdown_listener が _should_exit = True を設定
3. しかし...
   - キューループスレッド: 独自のループで動作中
   - AgentControllerスレッド: LLM応答待ち（30秒以上かかることも）
   - RuntimeClientスレッド: ファイル操作中
```

#### 原因2: 各スレッドの無限ループ
```python
# キューループの問題のあるコード
async def _process_queue(self) -> None:
    while should_continue() and not self._stop_flag.is_set():
        event = self._queue.get(timeout=0.1)  # 0.1秒ごとにチェック
        # しかし、should_continue()のチェックは0.1秒に1回のみ
```

#### 原因3: LLM呼び出しのブロッキング
```python
# AgentControllerでの長時間処理
response = self.llm.completion(**params)  # 30秒以上かかることも
# この間、シャットダウンシグナルをチェックできない
```

### 5.4 なぜ複数回Ctrl+Cが必要か

```
1回目のCtrl+C:
- メインスレッドは終了準備開始
- 他のスレッドは気づかない

2回目のCtrl+C:
- より強制的なシャットダウン開始
- 一部のスレッドが強制終了

3回目のCtrl+C:
- OSレベルでの強制終了（SIGKILL相当）
```

### 5.5 実際のシャットダウン時の問題

```
時刻 0秒: Ctrl+C押下
時刻 0.1秒: メインスレッドが_should_exit=True設定
時刻 0.2秒: キューループが次のチェック（まだ気づいていない）
時刻 1秒: キューループがshould_continue()をチェック → 終了開始
時刻 5秒: AgentControllerがLLM呼び出し中... まだ終了できない
時刻 30秒: LLM呼び出し完了、ようやく終了チェック
時刻 31秒: 新しいタスクをスケジュールしようとする
→ エラー: "cannot schedule new futures after shutdown"
```

## 6. 残存するスレッドとリソース

### 6.1 シャットダウン後も残る可能性のあるリソース

1. **ThreadPoolExecutorのワーカースレッド**
   - 適切にshutdown()が呼ばれていない場合

2. **非同期タスク**
   - キャンセルされていないasyncioタスク

3. **イベントループ**
   - クローズされていないイベントループ

4. **ファイルディスクリプタ**
   - 開いたままのソケットやファイル

### 6.2 メモリリーク箇所

```python
# 例: EventStream._thread_loops
self._thread_loops[subscriber_id][callback_id] = loop
# サブスクライバー削除時にループが適切にクローズされない場合
```

## 7. 推奨される改善策

### 7.1 即時対応可能な修正

1. **グレースフルシャットダウンの実装**
```python
async def graceful_shutdown():
    # 全てのタスクをキャンセル
    tasks = asyncio.all_tasks()
    for task in tasks:
        task.cancel()
    # タスクの完了を待つ
    await asyncio.gather(*tasks, return_exceptions=True)
```

2. **コンテキストマネージャーの使用**
```python
with ThreadPoolExecutor(max_workers=1) as pool:
    # 処理
    pass  # 自動的にshutdown()が呼ばれる
```

3. **タイムアウト付きシャットダウン**
```python
def shutdown_with_timeout(timeout=5):
    start = time.time()
    while time.time() - start < timeout:
        if all_threads_stopped():
            break
        time.sleep(0.1)
    else:
        force_kill_remaining_threads()
```

### 7.2 長期的な改善案

1. **統一されたイベントループ管理**
   - 単一のイベントループで全処理を管理

2. **適切なシグナル伝播**
   - 全スレッドへのシグナル通知メカニズム

3. **リソース追跡システム**
   - 生成されたリソースの自動追跡と解放

## 8. 親エージェント・子エージェントのコンテキストウィンドウ管理

### 8.1 エージェントの親子関係とは？

#### 家族経営レストランの例え

エージェントの親子関係を家族経営レストランに例えると：

1. **親エージェント（OrchestratorAgent）** = オーナーシェフ
   - 全体の指揮を執る
   - 専門的な仕事は各部門に委譲

2. **子エージェント（BackendAgent等）** = 専門シェフ
   - 特定の料理を担当
   - 独自のレシピノート（コンテキスト）を持つ

### 8.2 コンテキストウィンドウの独立性

#### 重要な原則：子は親の履歴を引き継がない

```python
# 親エージェントが子を起動する際（start_delegate）
state = State(
    inputs=action.inputs,  # タスクの指示のみ渡す
    history=[],  # 空の履歴でスタート！
    start_id=current_event_id + 1,  # この時点から記録開始
    delegate_level=parent.delegate_level + 1,
)
```

**なぜ履歴を引き継がないのか？**
1. **メモリ効率**: 各エージェントが必要最小限の情報のみ保持
2. **独立性**: 子エージェントは親の過去に縛られない
3. **並列処理**: 複数の子が同時に動作可能

### 8.3 親子間での情報共有

#### 共有されるもの
```python
# メトリクス（トークン使用量）は共有
metrics=self.state.metrics  # 同じオブジェクトを参照

# 実行制限も共有
iteration_flag=self.state.iteration_flag  # 最大実行回数
budget_flag=self.state.budget_flag  # 予算制限
```

#### 共有されないもの
- **履歴（history）**: 各自が独立して管理
- **コンテキスト**: 各自のLLM呼び出しで独立
- **一時的な状態**: 各自のメモリ空間

### 8.4 実際の動作例（重要：順次実行）

```
例：「ECサイトを作って」というタスク

重要な前提：エージェントは同時実行されない！

1. OrchestratorAgent（親）- 時刻0秒
   履歴: [ユーザー: ECサイトを作って]
   判断: 「これは複数の専門家が必要」
   
2. BackendAgent（子1）への委譲 - 時刻1秒
   OrchestratorAgent: 一時停止状態へ
   BackendAgent: 開始
   引き継ぎ: {task: "商品管理APIを実装"}
   履歴: []（空からスタート）
   
3. BackendAgent完了 - 時刻30秒
   結果を親に返却
   OrchestratorAgent: 再開
   
4. FrontendAgent（子2）への委譲 - 時刻31秒
   OrchestratorAgent: 再度一時停止
   FrontendAgent: 開始
   引き継ぎ: {task: "商品一覧画面を作成"}
   履歴: []（空からスタート）
   
5. FrontendAgent完了 - 時刻60秒
   結果を親に返却
   OrchestratorAgent: 最終処理

つまり：
- 同時に動くエージェントは常に1つだけ
- 親は子の完了を待つ（delegate状態）
- 各エージェントは独自のコンテキストを持つが、実行は順番
```

### 8.5 コンテキストウィンドウ管理の詳細

#### トークン数の監視
```python
# 各エージェントが独自に監視
current_tokens = count_tokens(self.state.history)
if current_tokens > MAX_CONTEXT_TOKENS:
    # 古い履歴を削減
    self._handle_long_context_error()
```

#### 削減戦略（コンテキストオーバー時）
```python
def _apply_conversation_window(history):
    # 必須イベントを保持
    essential = [
        system_message,      # システムプロンプト
        first_user_message,  # 最初のユーザー入力
    ]
    
    # 最新の履歴の約半分を保持
    recent_events = history[-len(history)//2:]
    
    return essential + recent_events
```

### 8.6 メトリクスの階層管理

```python
# グローバルメトリクス（全体の累積）
global_metrics = {
    "prompt_tokens": 50000,      # 全エージェントの合計
    "completion_tokens": 20000,
    "total_cost": 0.7
}

# ローカルメトリクス（子エージェントの使用分）
local_metrics = current_metrics - parent_snapshot
# 例: BackendAgentが使用した分だけ
```

### 8.7 親子関係のメリット

1. **メモリ効率**
   - 各エージェントが独立したメモリ空間
   - 必要な情報のみ保持（親の全履歴を引き継がない）

2. **専門性の活用**
   - 各エージェントが専門分野に集中
   - 不要な情報を持たない

3. **エラー分離**
   - 子のエラーが親に直接影響しない
   - 個別にリトライ可能

4. **順次実行による単純性**
   - 競合状態が発生しない
   - デバッグが容易

### 8.8 注意点とベストプラクティス

1. **委譲時の情報設計**
   ```python
   # 良い例：必要十分な情報
   inputs = {
       "task": "ユーザー認証APIを実装",
       "requirements": "JWT使用、セキュア",
       "context": "既存のUserモデルを使用"
   }
   
   # 悪い例：過剰な情報
   inputs = {
       "task": "API実装",
       "entire_conversation": [...],  # 不要
   }
   ```

2. **タイムアウト管理**
   - 全体: 6時間
   - 非活動: 10分
   - 子が終了しない場合は強制終了

3. **結果の統合**
   - 子の出力は親の履歴に統合
   - 重要な成果物のみ保持

## 9. まとめ

OpenHandsの設計は、複雑なタスクを効率的に処理するために：

1. **EventStream**による非同期イベント配信
2. **独立したコンテキストウィンドウ**による並列処理
3. **階層的なエージェント構造**による専門性の活用

これらが組み合わさっていますが、その複雑さゆえにシャットダウン時の課題も生じています。本レポートで示した改善策を実装することで、よりクリーンで予測可能なシステムを実現できます。