# システム分析資料: promptCards機能からBluelamp CLI起動への変更

**作成日**: 2025-06-29  
**最終更新**: 2025-06-29  
**ハッシュ**: promptcards-to-bluelamp-migration-001

## 1. 現在のシステム状態

### 1.1 promptCards機能の現在の実装

**ファイル構造**:
```
vscode-extension/
├── media/components/promptCards/
│   ├── promptCards.js (16個のプロンプトカード管理)
│   └── promptCards.css
├── media/components/dialogManager/
│   └── dialogManager.js (ターミナルモード選択ダイアログ)
└── src/services/launcher/
    ├── SpecializedLaunchHandlers.ts (ClaudeCode起動ロジック)
    └── TerminalProvisionService.ts (ターミナル作成サービス)
```

**データフロー**:
1. promptCards.js → 16個のプロンプトカード表示
2. カードクリック → dialogManager.showTerminalModeDialog()
3. ユーザー選択 → launchPromptFromURL コマンド
4. ScopeManagerPanel → _handleLaunchPromptFromURL()
5. ClaudeCodeLauncherService → SpecializedLaunchHandlers.launchWithPrompt()
6. ターミナルで `claude` コマンド実行

### 1.2 問題点

**セキュリティ脆弱性**:
- プロンプトファイルがユーザーフォルダに一時保存される
- プロンプト内容が外部に漏洩するリスク

**機能重複**:
- 16個の個別プロンプトカード vs ブルーランプCLIの16エージェント統合

## 2. 変更要件

### 2.1 機能変更概要

**削除する機能**:
- 16個のプロンプトカード
- プロンプトファイルの受け渡し機能
- ClaudeCode起動ロジック

**追加する機能**:
- 単一の「ブルーランプを起動」ボタン
- プロジェクト場所でのターミナル起動
- 「ブルーランプ」コマンドの自動実行

### 2.2 保持する機能

**既存機能の活用**:
- ターミナルモード選択ダイアログ（新しいタブ vs 分割タブ）
- プロジェクト選択機能
- TerminalProvisionService

## 3. 影響範囲分析

### 3.1 変更が必要なファイル

**フロントエンド**:
- `media/components/promptCards/promptCards.js` - 大幅簡素化
- `media/components/dialogManager/dialogManager.js` - コマンド変更

**バックエンド**:
- `src/ui/scopeManager/ScopeManagerPanel.ts` - メッセージハンドラー変更
- `src/services/launcher/SpecializedLaunchHandlers.ts` - 起動ロジック変更

### 3.2 データモデル変更

**メッセージ形式**:
```typescript
// 変更前
{
  command: 'launchPromptFromURL',
  url: string,
  index: number,
  name: string,
  splitTerminal: boolean
}

// 変更後
{
  command: 'launchBluelamp',
  projectPath: string,
  splitTerminal: boolean
}
```

## 4. 実装戦略

### 4.1 段階的変更アプローチ

**Phase 1**: promptCards.js の簡素化
- 16個のカード → 1個のボタンに変更
- 新しいコマンド `launchBluelamp` の発行

**Phase 2**: dialogManager.js の調整
- 既存のダイアログ機能を活用
- 新しいコマンドへの対応

**Phase 3**: バックエンドロジックの変更
- ScopeManagerPanel でのメッセージハンドリング
- SpecializedLaunchHandlers での起動ロジック変更

**Phase 4**: 不要コードの削除
- プロンプトファイル関連の処理削除
- ClaudeCode起動関連の処理削除

### 4.2 安全な実装手順

1. **新機能の追加**: 既存機能を残したまま新機能を追加
2. **段階的移行**: 新機能の動作確認後、旧機能を削除
3. **テスト**: 各段階でのテストと検証
4. **クリーンアップ**: 不要コードの削除

## 5. 技術的詳細

### 5.1 プロジェクトパス取得

**現在の実装**:
```typescript
const projectManagementService = ProjectManagementService.getInstance();
const activeProject = projectManagementService.getActiveProject();
const projectPath = activeProject?.path || '';
```

### 5.2 ターミナル作成

**既存のTerminalProvisionService活用**:
```typescript
const terminal = await this.terminalService.createConfiguredTerminal({
  cwd: projectPath,
  splitTerminal: options.splitTerminal
});
```

### 5.3 ブルーランプ起動

**新しいコマンド実行**:
```typescript
terminal.sendText('ブルーランプ');
```

## 6. リスク評価

### 6.1 技術的リスク

**低リスク**:
- 既存のターミナル機能を活用
- プロジェクト選択機能は既存のまま

**中リスク**:
- メッセージハンドリングの変更
- UI/UXの変更による混乱

### 6.2 対策

**段階的実装**:
- 既存機能を残したまま新機能を追加
- 十分なテスト期間を設ける

**ロールバック計画**:
- 各変更段階でのバックアップ
- 問題発生時の迅速な復旧手順

## 7. 成功指標

### 7.1 機能的指標

- [ ] 単一ボタンでブルーランプが起動できる
- [ ] ターミナルモード選択が正常に動作する
- [ ] プロジェクト場所でのターミナル起動が正常に動作する
- [ ] プロンプトファイルの脆弱性が解消される

### 7.2 技術的指標

- [ ] 不要なコードが削除される
- [ ] パフォーマンスが向上する
- [ ] セキュリティが強化される
- [ ] 保守性が向上する