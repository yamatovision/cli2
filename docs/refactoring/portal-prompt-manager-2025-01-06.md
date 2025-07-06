# リファクタリング計画: PortalPromptManager 2025-01-06

## 1. 現状分析

### 1.1 対象概要
PortalPromptManagerクラスは、Portal APIからプロンプトを取得し、ローカルファイルへのフォールバック機能を持つPromptManagerの拡張クラス。現在400行を超える複雑な実装となっており、Portal API専用のシンプルな実装への変更が必要。

### 1.2 問題点と課題
- **複雑な継承構造**: PromptManagerを継承しつつ、Portal専用の場合は親クラスの初期化をスキップする不自然な処理
- **重複したロジック**: `get_system_message()`と`get_system_message_async()`で同じような処理が重複
- **複雑な認証処理**: `_fetch_portal_content()`内で認証エラー時の自動再認証処理が複雑で重複
- **不要なフォールバック処理**: `_get_local_manager()`の複雑な遅延初期化とローカルファイルへのフォールバック
- **不要な機能**: `get_example_user_message()`、`get_user_message()`、`user_prompt.j2`関連の処理
- **テンプレート処理の混在**: Portal用とローカル用のテンプレート処理が混在

### 1.3 関連ファイル一覧
- `/openhands/portal/portal_prompt_manager.py` (リファクタリング対象)
- `/openhands/portal/prompt_client.py` (変更なし)
- `/openhands/portal/prompt_mapping.py` (変更なし)
- `/openhands/portal/additional_info.j2` (保持)
- `/openhands/portal/user_prompt.j2` (削除)
- `/openhands/portal/__init__.py` (軽微な変更)

### 1.4 依存関係図
```
PortalPromptManager
├── PortalPromptClient (Portal API通信)
├── prompt_mapping (ファイル名→ID変換)
├── additional_info.j2 (ローカルテンプレート)
└── 使用箇所:
    ├── CodeActAgent (line 102)
    ├── BlueLampBaseAgent (line 26)
    ├── SpecialistAgentBase (line 79)
    ├── CodeActAgent2 (line 105)
    ├── AgentController (line 202 - get_example_user_message)
    └── ConversationMemory (line 578, 609 - build_microagent_info)
```

## 2. リファクタリングの目標

### 2.1 期待される成果
- **コード削減**: 400行から200行程度への削減（50%削減）
- **保守性向上**: 継承をやめて独立したクラスにし、理解しやすい構造に変更
- **拡張性改善**: Portal API専用の明確な責務により、将来の機能追加が容易
- **エラー処理の一貫性**: 統一されたエラーハンドリングとログ出力

### 2.2 維持すべき機能
- Portal APIからのシステムプロンプト取得
- `additional_info.j2`テンプレートによるワークスペースコンテキスト構築
- 認証エラー時の自動再認証機能
- プロンプトキャッシュ機能
- Portal接続テスト機能
- `add_turns_left_reminder()`機能

## 3. 理想的な実装

### 3.1 全体アーキテクチャ
Portal API専用の独立したクラスとして設計し、以下の責務に集中：
1. Portal APIからのプロンプト取得
2. `additional_info.j2`テンプレートの処理
3. 認証処理とキャッシュ管理

### 3.2 核心的な改善ポイント
- **継承の廃止**: PromptManagerを継承せず、独立したクラスとして実装
- **非同期ベース**: 同期・非同期の重複を解消し、非同期ベースに統一
- **シンプルな認証**: 自動再認証ロジックを簡素化
- **最小限のテンプレート**: `additional_info.j2`のみをサポート

### 3.3 新しいクラス構造
```python
class PortalPromptManager:
    """Portal API専用のプロンプトマネージャー"""
    
    # 必要最小限のメソッド
    async def get_system_message() -> str
    def build_workspace_context() -> str
    def add_turns_left_reminder()
    async def test_portal_connection() -> bool
    def clear_cache()
```

## 4. 実装計画

### フェーズ1: 不要機能の削除
- **目標**: 不要なメソッドと依存関係を削除
- **影響範囲**: PortalPromptManager、AgentController、ConversationMemory
- **タスク**:
  1. **T1.1**: `get_example_user_message()`メソッドを削除
     - 対象: `portal_prompt_manager.py` line 291-302
     - 実装: メソッド削除、AgentControllerの呼び出し箇所を修正
  2. **T1.2**: `get_user_message()`メソッドを削除
     - 対象: `portal_prompt_manager.py` line 304-307
     - 実装: メソッド削除
  3. **T1.3**: `build_microagent_info()`を空実装に変更
     - 対象: `portal_prompt_manager.py` line 340-343
     - 実装: 常に空文字を返すよう簡素化
  4. **T1.4**: `user_prompt.j2`ファイルを削除
     - 対象: `/openhands/portal/user_prompt.j2`
     - 実装: ファイル削除
  5. **T1.5**: user_prompt関連の処理を削除
     - 対象: `portal_prompt_manager.py` line 72-77
     - 実装: `_user_template`関連の処理を削除
- **検証ポイント**:
  - AgentControllerでエラーが発生しないこと
  - ConversationMemoryで`build_microagent_info()`が正常に動作すること

### フェーズ2: 継承構造の廃止
- **目標**: PromptManagerの継承をやめて独立したクラスにする
- **影響範囲**: PortalPromptManager
- **タスク**:
  1. **T2.1**: クラス定義から継承を削除
     - 対象: `portal_prompt_manager.py` line 22
     - 実装: `class PortalPromptManager:` に変更
  2. **T2.2**: `__init__`メソッドを簡素化
     - 対象: `portal_prompt_manager.py` line 25-82
     - 実装: Portal専用の初期化処理のみに変更
  3. **T2.3**: `_get_local_manager()`メソッドを削除
     - 対象: `portal_prompt_manager.py` line 84-107
     - 実装: メソッド削除、関連する処理も削除
  4. **T2.4**: 必要最小限の属性のみ保持
     - 対象: 初期化処理全体
     - 実装: `portal_client`, `_portal_content_cache`, `_additional_info_template`のみ保持
- **検証ポイント**:
  - 各エージェントクラスでPortalPromptManagerが正常に初期化されること
  - 型チェックエラーが発生しないこと

### フェーズ3: 同期・非同期処理の統一
- **目標**: 重複した処理を解消し、非同期ベースに統一
- **影響範囲**: PortalPromptManager
- **タスク**:
  1. **T3.1**: `get_system_message()`を非同期ベースに変更
     - 対象: `portal_prompt_manager.py` line 183-231
     - 実装: 内部で`get_system_message_async()`を呼び出すシンプルな実装に変更
  2. **T3.2**: `get_system_message_async()`をメインメソッドに変更
     - 対象: `portal_prompt_manager.py` line 233-259
     - 実装: メインの実装ロジックとして整理
  3. **T3.3**: 認証処理を簡素化
     - 対象: `_fetch_portal_content()` line 109-181
     - 実装: 重複した認証処理を統一し、シンプルな再認証ロジックに変更
- **検証ポイント**:
  - 同期・非同期両方の呼び出しで正常にプロンプトが取得できること
  - 認証エラー時の自動再認証が正常に動作すること

### フェーズ4: テンプレート処理の最適化
- **目標**: additional_info.j2のみをサポートする最適化された実装
- **影響範囲**: PortalPromptManager
- **タスク**:
  1. **T4.1**: `build_workspace_context()`を最適化
     - 対象: `portal_prompt_manager.py` line 309-338
     - 実装: additional_info.j2のみを使用するシンプルな実装に変更
  2. **T4.2**: 不要なテンプレート処理を削除
     - 対象: 初期化処理のテンプレート読み込み部分
     - 実装: additional_info.j2のみを読み込む処理に簡素化
  3. **T4.3**: エラーハンドリングを統一
     - 対象: 全体のエラー処理
     - 実装: 一貫したエラーハンドリングとログ出力に統一
- **検証ポイント**:
  - `build_workspace_context()`が正常に動作すること
  - テンプレートエラー時の適切なフォールバック処理

### フェーズ5: 最終調整とクリーンアップ
- **目標**: コードの最終調整と不要な処理の削除
- **影響範囲**: PortalPromptManager、__init__.py
- **タスク**:
  1. **T5.1**: 不要なインポートを削除
     - 対象: `portal_prompt_manager.py` 冒頭のインポート文
     - 実装: 使用されていないインポートを削除
  2. **T5.2**: `__init__.py`から不要なエクスポートを削除
     - 対象: `/openhands/portal/__init__.py`
     - 実装: 削除されたメソッドのエクスポートを削除
  3. **T5.3**: ドキュメント文字列を更新
     - 対象: クラスとメソッドのdocstring
     - 実装: Portal API専用であることを明記
  4. **T5.4**: テスト関数を更新
     - 対象: `test_portal_prompt_manager()` line 369-398
     - 実装: 新しい実装に合わせてテスト内容を更新
- **検証ポイント**:
  - 全ての使用箇所で正常に動作すること
  - インポートエラーが発生しないこと
  - テスト関数が正常に実行されること

## 5. 期待される効果

### 5.1 コード削減
- **現在**: 401行
- **予想削減後**: 200行程度
- **削減率**: 約50%

### 5.2 保守性向上
- 継承の廃止により、クラスの責務が明確化
- 重複コードの削除により、修正箇所が一元化
- シンプルな構造により、新規開発者の理解が容易

### 5.3 拡張性改善
- Portal API専用の明確な責務により、Portal関連機能の追加が容易
- 認証処理の簡素化により、認証方式の変更に対応しやすい
- テンプレート処理の最適化により、新しいテンプレートの追加が容易

## 6. リスクと対策

### 6.1 潜在的リスク
- **互換性の破綻**: 削除されるメソッドを使用している箇所でエラーが発生する可能性
- **型チェックエラー**: 継承を廃止することで型チェックエラーが発生する可能性
- **認証処理の不具合**: 認証処理の簡素化により、エッジケースで問題が発生する可能性

### 6.2 対策
- **段階的な実装**: フェーズごとに検証を行い、問題を早期発見
- **使用箇所の事前調査**: 削除対象メソッドの使用箇所を事前に特定し、適切な修正を実施
- **テスト実行**: 各フェーズ後にテスト関数を実行し、動作確認を実施
- **ロールバック準備**: 各フェーズ完了時にコミットを作成し、問題発生時のロールバックを可能にする

## 7. 備考

### 7.1 削除される機能の影響
- `get_example_user_message()`: AgentControllerで使用されているが、空文字を返すよう修正
- `build_microagent_info()`: ConversationMemoryで使用されているが、既に空文字を返しているため影響なし
- `get_user_message()`: 使用箇所が見つからないため、安全に削除可能

### 7.2 今後の拡張可能性
- Portal API側でのテンプレート機能追加時の対応
- 複数のPortal環境への対応
- キャッシュ戦略の改善（TTL、無効化タイミングなど）