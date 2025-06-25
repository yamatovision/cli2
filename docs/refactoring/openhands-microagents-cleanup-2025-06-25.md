# リファクタリング計画: OpenHands不要マイクロエージェント機能削除 2025-06-25

## 1. 現状分析

### 1.1 対象概要
OpenHandsプロジェクト内で、ユーザーワークスペースの`.openhands/microagents`ディレクトリからマイクロエージェントを読み込む機能と、`/init`コマンドによる`repo.md`ファイル作成機能が実装されているが、実際には使用されておらず混乱の原因となっている。実際に機能しているのは`GLOBAL_MICROAGENTS_DIR`からの読み込みのみである。

### 1.2 問題点と課題
- **機能の不整合**: 実装されているが実際には動作しない機能が存在
- **コードの複雑化**: 不要な分岐処理とエラーハンドリングが含まれている
- **ドキュメントとの乖離**: コメントや説明が実際の動作と一致しない
- **テストの無駄**: 使用されない機能のテストが維持されている
- **開発者の混乱**: 新規開発者が機能の動作を誤解する可能性

### 1.3 関連ファイル一覧
- `openhands/runtime/base.py` - メインの問題箇所（735-796行）
- `openhands/cli/commands.py` - `/init`コマンド実装（107-264行）
- `openhands/core/setup.py` - マイクロエージェント読み込み呼び出し（167-171行）
- `openhands/server/session/agent_session.py` - サーバーセッションでの呼び出し（474-479行）
- `openhands/cli/main.py` - CLIでの呼び出し（195-198行）
- `tests/runtime/test_microagent.py` - 関連テスト
- `tests/unit/test_cli_commands.py` - CLIコマンドテスト
- `tests/unit/test_microagent_utils.py` - マイクロエージェントユーティリティテスト
- `openhands/microagent/microagent.py` - 関連コメント（171行、247行）

### 1.4 依存関係図
```
get_microagents_from_selected_repo (base.py)
├── openhands/core/setup.py (create_memory)
├── openhands/server/session/agent_session.py (create_memory)
└── openhands/cli/main.py (reload_microagents)

init_repository (commands.py)
├── handle_init_command (commands.py)
└── openhands/cli/main.py (handle_init)

テスト依存関係:
├── tests/runtime/test_microagent.py
├── tests/unit/test_cli_commands.py
└── tests/unit/test_microagent_utils.py
```

## 2. リファクタリングの目標

### 2.1 期待される成果
- **コード削減**: 約200行のコード削除（実装とテスト含む）
- **機能の明確化**: 実際に動作する機能のみが残る
- **保守性向上**: 不要な分岐処理の削除により理解しやすいコードになる
- **テスト効率化**: 実際に使用される機能のみのテストに集約
- **ドキュメント整合性**: コメントと実装の一致

### 2.2 維持すべき機能
- `GLOBAL_MICROAGENTS_DIR`からのマイクロエージェント読み込み
- 組織/ユーザーレベルのマイクロエージェント読み込み（`get_microagents_from_org_or_user`）
- `.openhands_instructions`ファイルの読み込み（レガシー機能として維持）
- 既存のマイクロエージェント機能全般

## 3. 理想的な実装

### 3.1 全体アーキテクチャ
リファクタリング後は、マイクロエージェントの読み込みが以下のシンプルな構造になる：

1. **グローバルマイクロエージェント**: `GLOBAL_MICROAGENTS_DIR`から読み込み
2. **組織/ユーザーレベル**: 選択されたリポジトリに基づく組織/ユーザーレベルのマイクロエージェント
3. **レガシー指示**: `.openhands_instructions`ファイル（後方互換性のため維持）

### 3.2 核心的な改善ポイント
- **単一責任の原則**: 各メソッドが明確に定義された単一の責任を持つ
- **不要な分岐の削除**: 使用されない`.openhands/microagents`関連の処理を完全削除
- **エラーハンドリングの簡素化**: 実際に発生し得るエラーのみを処理
- **テストの集約**: 実際に動作する機能のみをテスト

### 3.3 新しいメソッド構造
```python
def get_microagents_from_selected_repo(self, selected_repository: str | None) -> list[BaseMicroagent]:
    """Load microagents from the selected repository.

    Loads:
    1. Organization/user level microagents (if repository is selected)
    2. Legacy .openhands_instructions file (for backward compatibility)
    """
    loaded_microagents: list[BaseMicroagent] = []

    # Load org/user level microagents
    if selected_repository:
        org_microagents = self.get_microagents_from_org_or_user(selected_repository)
        loaded_microagents.extend(org_microagents)

    # Load legacy instructions
    legacy_microagents = self._load_legacy_instructions()
    loaded_microagents.extend(legacy_microagents)

    return loaded_microagents
```

## 4. 実装計画

### フェーズ1: 関連テストディレクトリの完全削除
- **目標**: 不要な機能のテストディレクトリを完全削除
- **影響範囲**: テストファイル3つとその関連ディレクトリ
- **タスク**:
  1. **T1.1**: `tests/runtime/test_microagent.py`の完全削除
     - 対象: ファイル全体
     - 実装: ファイルを削除
  2. **T1.2**: `tests/unit/test_cli_commands.py`の完全削除
     - 対象: ファイル全体
     - 実装: ファイルを削除
  3. **T1.3**: `tests/unit/test_microagent_utils.py`の完全削除
     - 対象: ファイル全体
     - 実装: ファイルを削除
- **検証ポイント**:
  - 残存するテストが正常に実行される
  - 削除されたテストファイルが存在しない

### フェーズ2: `/init`コマンドの削除
- **目標**: `/init`コマンドとその関連機能を完全削除
- **影響範囲**: `openhands/cli/commands.py`、`openhands/cli/main.py`
- **タスク**:
  1. **T2.1**: `handle_init_command`関数の削除
     - 対象: `openhands/cli/commands.py` 107-135行
     - 実装: 関数全体を削除
  2. **T2.2**: `init_repository`関数の削除
     - 対象: `openhands/cli/commands.py` 210-264行
     - 実装: 関数全体を削除
  3. **T2.3**: CLIでの`/init`コマンドハンドリング削除
     - 対象: `openhands/cli/main.py` 190-200行周辺
     - 実装: `/init`コマンドの分岐処理を削除
  4. **T2.4**: 関連するimportの整理
     - 対象: 各ファイルの冒頭
     - 実装: 不要になったimportを削除
- **検証ポイント**:
  - CLIが正常に起動する
  - `/init`コマンドが認識されない（期待される動作）
  - 他のCLIコマンドが正常に動作する

### フェーズ3: `get_microagents_from_selected_repo`メソッドの簡素化
- **目標**: 不要な`.openhands/microagents`読み込み処理を削除し、メソッドを簡素化
- **なぜ削除ではなく簡素化なのか**: このメソッドは`openhands/core/setup.py`、`openhands/server/session/agent_session.py`、`openhands/cli/main.py`から実際に呼び出されているため、メソッド自体は必要。ただし、メソッド内の不要な`.openhands/microagents`関連処理のみを削除する。
- **影響範囲**: `openhands/runtime/base.py`
- **タスク**:
  1. **T3.1**: `.openhands/microagents`ディレクトリ参照の削除
     - 対象: 747行、758行
     - 実装: `microagents_dir`変数とその使用箇所を削除
  2. **T3.2**: `_load_microagents_from_directory`呼び出しの削除
     - 対象: 791-794行
     - 実装: リポジトリマイクロエージェント読み込み処理を削除
  3. **T3.3**: `.openhands_instructions`読み込み処理の保持
     - 対象: 765-788行
     - 実装: IssueResolver機能で使用されているため、`.openhands_instructions`読み込み処理は保持
  4. **T3.4**: メソッドのドキュメント更新
     - 対象: 738-745行のコメント
     - 実装: 実際の動作に合わせてコメントを更新
- **検証ポイント**:
  - 組織/ユーザーレベルのマイクロエージェントが正常に読み込まれる
  - `.openhands_instructions`ファイルが正常に読み込まれる（IssueResolver機能のため）
  - `.openhands/microagents`ディレクトリへの不要なアクセスが発生しない
  - メソッドを呼び出している箇所が正常に動作する

### フェーズ4: 関連コメントとドキュメントの更新
- **目標**: 削除された機能に関する言及を全て削除・更新
- **影響範囲**: 複数ファイルのコメント
- **タスク**:
  1. **T4.1**: `openhands/microagent/microagent.py`のコメント更新
     - 対象: 171行、247行
     - 実装: `.openhands/microagents/repo.md`への言及を削除
  2. **T4.2**: `openhands/core/setup.py`のコメント更新
     - 対象: 167行
     - 実装: 実際の動作に合わせてコメントを更新
  3. **T4.3**: `openhands/server/session/agent_session.py`のコメント更新
     - 対象: 474行
     - 実装: 実際の動作に合わせてコメントを更新
- **検証ポイント**:
  - 全てのコメントが実際の動作と一致している
  - 削除された機能への言及がない

### フェーズ5: 最終確認と動作検証
- **目標**: 全体の動作を確認し、リファクタリングの完了を検証
- **影響範囲**: プロジェクト全体
- **タスク**:
  1. **T5.1**: 残存テストの実行確認
     - 対象: プロジェクト全体のテストスイート
     - 実装: 削除されていないテストが正常に実行されることを確認
  2. **T5.2**: 主要機能の動作確認
     - 対象: マイクロエージェント読み込み機能
     - 実装: 組織/ユーザーレベルのマイクロエージェント読み込みが正常に動作することを確認
  3. **T5.3**: CLIの動作確認
     - 対象: OpenHands CLI
     - 実装: `/init`コマンドが削除され、他のコマンドが正常に動作することを確認
- **検証ポイント**:
  - 残存するテストが正常に通過する
  - 削除された機能に関するコードが存在しない
  - 既存機能が正常に動作する
  - 不要なファイルアクセスが発生しない

## 5. 期待される効果

### 5.1 コード削減
- **削除予定行数**: 約200行
  - `openhands/cli/commands.py`: 約60行削除
  - `openhands/runtime/base.py`: 約30行削除
  - テストファイル: 約110行削除
- **削減率**: 対象機能関連コードの100%削除

### 5.2 保守性向上
- **理解しやすさ**: 実際に動作する機能のみが残るため、新規開発者の理解が容易
- **デバッグ効率**: 不要な分岐処理がないため、問題の特定が迅速
- **テスト効率**: 実際に使用される機能のみをテストするため、テスト実行時間短縮

### 5.3 拡張性改善
- **明確な責任分離**: 各メソッドの責任が明確になり、将来の機能追加が容易
- **シンプルなアーキテクチャ**: 複雑な分岐がないため、新機能の追加時の影響範囲が予測しやすい

## 6. リスクと対策

### 6.1 潜在的リスク
- **隠れた依存関係**: 削除対象機能に予期しない依存がある可能性
- **テスト不足**: 削除後の動作確認が不十分な可能性
- **ドキュメント更新漏れ**: 関連ドキュメントの更新漏れ

### 6.2 対策
- **段階的削除**: フェーズごとに動作確認を行い、問題があれば即座にロールバック
- **包括的テスト**: 各フェーズ後に全テストスイートを実行
- **コードレビュー**: 削除前後のコードを詳細にレビューし、見落としを防止
- **バックアップ**: 各フェーズ開始前にGitコミットを作成し、安全なロールバックポイントを確保

## 7. 備考

### 7.1 実装順序の重要性
フェーズの順序は依存関係に基づいて設計されており、順序を変更すると予期しない問題が発生する可能性があります。特にテストの無効化を最初に行うことで、削除作業中の安全性を確保します。

### 7.2 将来の拡張性
このリファクタリングにより、マイクロエージェント機能の拡張が必要になった場合、明確で理解しやすい基盤の上に新機能を構築できます。

### 7.3 代替案
もし将来的に`.openhands/microagents`機能が必要になった場合、このリファクタリング後の簡潔な構造を基に、適切に設計された機能として再実装することを推奨します。
