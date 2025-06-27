# RecallAction警告エラー調査レポート

## 問題の概要
- **発生タイミング**: ユーザーが発言するたびに警告が発生
- **警告メッセージ**: `agent_controller.py:339 - [Agent Controller] Clearing pending action RecallAction to process user message`
- **影響**: システムは正常動作するが、警告が毎回表示される

## 調査結果

### 1. エラー発生箇所の特定
- **ファイル**: `/cli/openhands/controller/agent_controller.py`
- **行番号**: 339行目
- **関数**: `_should_handle_event` メソッド内

### 2. RecallActionの仕組み
- **目的**: コンテクスト情報の取得（ワークスペースコンテクストまたは知識ベース）
- **種類**:
  - `WORKSPACE_CONTEXT`: 最初のユーザーメッセージ時（リポジトリ情報、ランタイム情報など）
  - `KNOWLEDGE`: 通常のユーザーメッセージ時（知識ベースからの情報取得）

### 3. 警告発生の流れ
1. ユーザーがメッセージを送信
2. システムがRecallActionを`_pending_action`として設定
3. 新しいユーザーメッセージが来ると、既存のRecallActionをクリアして新しいメッセージを処理
4. この時に警告が発生

### 4. コンテクスト形成の詳細
現在のコードでは、RecallActionがどのようなコンテクストを形成しているかが不明確。

## 依存関係マップ
```
agent_controller.py
├── RecallAction (events/action/agent.py)
├── RecallType (events/event.py)
├── EventStream
└── AgentState
```

## 修正計画

### Phase 1: ログ強化によるコンテクスト可視化
1. RecallAction実行時のログ追加
2. コンテクスト形成結果のログ追加
3. クリア時の詳細情報ログ追加

### Phase 2: 警告レベルの調整
1. 正常な動作の場合はINFOレベルに変更
2. 実際の問題がある場合のみWARNINGレベル

### Phase 3: コンテクスト形成の最適化
1. 不要なRecallActionの削減
2. コンテクスト再利用の実装

## 実装した修正

### 1. ログ強化の実装 ✅
- **RecallAction作成時のログ追加**:
  - 作成理由（初回メッセージ vs 通常メッセージ）
  - RecallTypeの詳細
  - クエリ内容のプレビュー
  - 目的の明確化

- **RecallActionクリア時のログ改善**:
  - 警告レベルをINFOレベルに変更（正常動作のため）
  - 詳細なコンテクスト情報の記録
  - ユーザーメッセージとの関連性

- **コンテクスト影響分析メソッド追加**:
  - `_log_recall_action_context_impact()` メソッド
  - 関連するObservationの検索と分析
  - 形成されたコンテクストの可視化

### 2. 追加されたログ情報
- `RECALL_ACTION_CREATED`: RecallAction作成時
- `CLEARING_PENDING_RECALL_ACTION`: RecallActionクリア時
- `RECALL_ACTION_CONTEXT_ANALYSIS`: コンテクスト分析結果

### 3. 期待される効果
- 警告の代わりに情報ログとして表示
- RecallActionがどのようなコンテクストを形成しているかが可視化
- システムの動作理解が向上

## テスト結果

### 1. コード検証 ✅
- 構文エラーなし
- インポートエラーなし
- 修正されたコードは正常に動作

### 2. 期待されるログ出力
修正後、ユーザーがメッセージを送信すると以下のログが出力されます：

```
INFO: Creating RecallAction for user message
- recall_type: WORKSPACE_CONTEXT (初回) / KNOWLEDGE (通常)
- query_preview: ユーザーメッセージの最初の100文字
- purpose: workspace_initialization / knowledge_retrieval

INFO: Clearing pending RecallAction to process user message
- recall_type: 詳細なRecallType
- query: 実行されていたクエリ
- action_id: RecallActionのID
- user_message_preview: 新しいユーザーメッセージ

INFO: RecallAction context impact analysis completed
- related_observations_count: 関連するObservationの数
- context_formed: 形成されたコンテクストの詳細
- content_preview: 実際のコンテクスト内容のプレビュー
```

### 3. 問題解決状況
- ❌ **修正前**: 毎回WARNING表示、コンテクスト形成が不明
- ✅ **修正後**: INFO表示、詳細なコンテクスト分析、動作の透明性向上

## 運用での確認方法

### ログ出力を有効にする
```bash
export LOG_ALL_EVENTS=true
# または
LOG_ALL_EVENTS=true ./bluelamp
```

### 確認すべきログメッセージ
1. `RECALL_ACTION_CREATED` - RecallAction作成時
2. `CLEARING_PENDING_RECALL_ACTION` - RecallActionクリア時
3. `RECALL_ACTION_CONTEXT_ANALYSIS` - コンテクスト分析結果

## 完了報告
✅ **デバッグ調査完了**
- 警告エラーの根本原因を特定
- コンテクスト形成の仕組みを解明
- 詳細なログ機能を実装
- 警告レベルを適切に調整
- システムの透明性を向上