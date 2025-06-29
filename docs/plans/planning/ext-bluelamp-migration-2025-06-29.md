# 機能拡張計画: promptCards機能からBluelamp CLI起動への変更 2025-06-29

## 1. 拡張概要

promptCards機能の16個のプロンプトカードを削除し、代わりに単一の「ブルーランプを起動」ボタンに変更する。これにより、プロンプトファイルの脆弱性を解消し、自社開発のブルーランプCLIを活用した統合開発環境を提供する。

## 2. 詳細仕様

### 2.1 現状と課題

**現在の実装状況**:
- promptCards機能で16個のプロンプトカードを表示
- カードクリック時にClaudeCodeを起動
- プロンプトファイルがユーザーフォルダに一時保存される脆弱性

**課題**:
- プロンプト内容の外部漏洩リスク
- 16個の個別カード vs ブルーランプCLIの機能重複
- セキュリティ上の懸念

### 2.2 拡張内容

**削除する機能**:
- 16個のプロンプトカード表示
- プロンプトファイルの受け渡し処理
- ClaudeCode起動ロジック

**追加する機能**:
- 単一の「ブルーランプを起動」ボタン
- ボタンクリック時のターミナルモード選択ダイアログ
- 選択されたプロジェクトの場所でターミナル起動
- 「ブルーランプ」コマンドの自動実行

## 3. ディレクトリ構造

既存ファイルの変更が中心となるため、新しいディレクトリは作成しない。

```
vscode-extension/
├── media/components/promptCards/
│   ├── promptCards.js (大幅簡素化)
│   └── promptCards.css (スタイル調整)
├── media/components/dialogManager/
│   └── dialogManager.js (コマンド変更)
└── src/
    ├── ui/scopeManager/ScopeManagerPanel.ts (メッセージハンドラー変更)
    └── services/launcher/SpecializedLaunchHandlers.ts (起動ロジック変更)
```

## 4. 技術的影響分析

### 4.1 影響範囲

- **フロントエンド**: promptCards.js、dialogManager.js
- **バックエンド**: ScopeManagerPanel.ts、SpecializedLaunchHandlers.ts
- **データモデル**: メッセージ形式の変更
- **その他**: プロンプトファイル関連処理の削除

### 4.2 データモデル変更計画

**メッセージ形式変更**:
```typescript
// 変更前
interface LaunchPromptMessage {
  command: 'launchPromptFromURL';
  url: string;
  index: number;
  name?: string;
  splitTerminal: boolean;
}

// 変更後
interface LaunchBluelampMessage {
  command: 'launchBluelamp';
  projectPath: string;
  splitTerminal: boolean;
}
```

**プロンプト情報の削除**:
- promptUrls配列（16個のURL）
- promptInfo配列（16個のプロンプト情報）
- プロンプトファイル関連の型定義

### 4.3 変更が必要なファイル

```
- media/components/promptCards/promptCards.js: 16個のカード → 1個のボタンに変更
- media/components/dialogManager/dialogManager.js: 新しいコマンド対応
- src/ui/scopeManager/ScopeManagerPanel.ts: launchBluelampコマンドハンドラー追加
- src/services/launcher/SpecializedLaunchHandlers.ts: ブルーランプ起動ロジック追加
- src/services/PromptServiceClient.ts: 不要になるため削除検討
```

## 5. タスクリスト

```
- [ ] **T1**: promptCards.jsの簡素化実装
  - 16個のプロンプトカード削除
  - 単一の「ブルーランプを起動」ボタン追加
  - 新しいコマンド`launchBluelamp`の発行

- [ ] **T2**: dialogManager.jsの調整
  - 既存のターミナルモード選択ダイアログを活用
  - 新しいコマンドへの対応追加

- [ ] **T3**: ScopeManagerPanelのメッセージハンドラー追加
  - `launchBluelamp`コマンドのハンドラー実装
  - プロジェクトパス取得ロジック

- [ ] **T4**: SpecializedLaunchHandlersの起動ロジック変更
  - ブルーランプ起動メソッド追加
  - 既存のClaudeCode起動ロジックを参考に実装

- [ ] **T5**: 不要コードの削除
  - プロンプトファイル関連処理の削除
  - 使用されなくなったメソッドの削除

- [ ] **T6**: テストと検証
  - 新機能の動作確認
  - ターミナルモード選択の動作確認
  - プロジェクトパス取得の動作確認

- [ ] **T7**: UIスタイルの調整
  - promptCards.cssの更新
  - ボタンデザインの最適化
```

## 6. テスト計画

### 6.1 機能テスト

**基本機能**:
- [ ] 「ブルーランプを起動」ボタンの表示
- [ ] ボタンクリック時のダイアログ表示
- [ ] ターミナルモード選択の動作
- [ ] プロジェクト場所でのターミナル起動
- [ ] 「ブルーランプ」コマンドの自動実行

**エラーハンドリング**:
- [ ] プロジェクトが選択されていない場合
- [ ] ターミナル作成に失敗した場合
- [ ] ブルーランプコマンドが見つからない場合

### 6.2 統合テスト

**既存機能との連携**:
- [ ] スコープマネージャーとの連携
- [ ] プロジェクト管理機能との連携
- [ ] 認証システムとの連携

### 6.3 セキュリティテスト

**脆弱性の解消確認**:
- [ ] プロンプトファイルが作成されないことの確認
- [ ] 一時ファイルの残存がないことの確認
- [ ] 外部への情報漏洩がないことの確認

## 7. SCOPE_PROGRESSへの統合

SCOPE_PROGRESS.mdに以下のタスクを追加：

```markdown
- [ ] **EXT-001**: promptCards機能からBluelamp CLI起動への変更
  - 目標: 2025-07-05
  - 参照: [/docs/plans/planning/ext-bluelamp-migration-2025-06-29.md]
  - 内容: セキュリティ脆弱性の解消とブルーランプCLI統合
```

## 8. 備考

### 8.1 実装上の注意点

**既存機能の保持**:
- ターミナルモード選択機能は既存のものを活用
- プロジェクト選択機能は変更しない
- 認証システムとの連携は維持

**段階的実装**:
- 新機能を追加してから旧機能を削除
- 各段階でのテストを徹底
- 問題発生時のロールバック計画を準備

### 8.2 将来の拡張可能性

**ブルーランプCLIとの連携強化**:
- エージェント選択機能の追加可能性
- プロジェクト情報の自動連携
- 実行結果の表示機能

**UI/UXの改善**:
- ボタンデザインの最適化
- 起動状態の視覚的フィードバック
- エラーメッセージの改善