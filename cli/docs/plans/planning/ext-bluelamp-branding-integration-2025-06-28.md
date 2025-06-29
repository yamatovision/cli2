# 機能拡張計画: BlueLamp CLI 日本語ブランディング統合 2025-06-28

## 1. 拡張概要

OpenHandsからBlueLampブランドへの完全な移行と日本語化対応。CLI全体をブルーランプブランドに統一し、日本語での自然な表現に変更することで、日本のユーザーにとってより親しみやすいツールに変更する。

## 2. 詳細仕様

### 2.1 現状と課題

現在のCLIはOpenHandsブランドで英語メッセージが中心となっている。具体的な課題：
- OpenHandsのASCIIロゴとブランド名が表示される
- 全てのメッセージが英語で表示される
- カラーテーマがゴールド系（#FFD700）
- ブランド統一性の欠如

### 2.2 拡張内容

**ブランディング統合:**
- OpenHandsのASCIIロゴ → BlueLampのASCIIアート
- 「OpenHands CLI」→「BlueLamp CLI」
- カラーテーマをブルー系統に変更

**日本語化対応:**
- 全ての英語メッセージを適切な日本語に翻訳
- ブルーランプが話しているような自然な表現
- 日本のビジネス文化に適した丁寧語・敬語の使用

## 3. ディレクトリ構造

新機能を既存ファイルに詰め込まず、専用のブランディングモジュールとして分離：

```
openhands/cli/branding/
├── __init__.py
├── bluelamp_ascii.py      # BlueLampのASCIIアート定義
├── japanese_messages.py   # 日本語メッセージ定義
└── bluelamp_colors.py     # ブルーランプカラーテーマ定義
```

## 4. 技術的影響分析

### 4.1 影響範囲

- **CLI全体**: 全てのユーザー向けメッセージとブランド表示
- **カラーテーマ**: prompt_toolkitのスタイル設定
- **ASCIIアート**: バナー表示機能
- **パッケージ情報**: プロジェクト名とメタデータ

### 4.2 変更が必要なファイル

```
- openhands/cli/branding/__init__.py: 新規作成 - ブランディングモジュール初期化
- openhands/cli/branding/bluelamp_ascii.py: 新規作成 - BlueLampのASCIIアート
- openhands/cli/branding/japanese_messages.py: 新規作成 - 日本語メッセージ定義
- openhands/cli/branding/bluelamp_colors.py: 新規作成 - ブルーカラーテーマ
- openhands/cli/main.py: メインメッセージの日本語化とブランド変更
- openhands/cli/tui.py: バナー、メッセージ、色の変更
- openhands/cli/commands.py: コマンドメッセージの日本語化
- openhands/cli/settings.py: 設定画面メッセージの日本語化
- openhands/cli/utils.py: 設定ファイルパスの変更（.openhands → .bluelamp）
- openhands/__init__.py: パッケージ名の変更
- pyproject.toml: プロジェクト情報の更新
```

## 5. タスクリスト

```
- [ ] **T1**: ブランディングモジュールの作成
- [ ] **T2**: カラーテーマの変更（ブルー系統）
- [ ] **T3**: ASCIIロゴの変更（BlueLamp）
- [ ] **T4**: 日本語メッセージの実装
- [ ] **T5**: メインCLIファイルの更新
- [ ] **T6**: コマンド処理の日本語化
- [ ] **T7**: 設定画面の日本語化
- [ ] **T8**: パッケージ情報の更新
```

### 6. テスト計画

**基本動作テスト:**
- CLIの起動確認
- 各コマンド（/help, /status, /settings等）の動作確認
- エラーハンドリングの確認

**ブランディングテスト:**
- BlueLampのASCIIロゴ表示確認
- ブルー系カラーテーマの表示確認
- ブランド名の統一確認

**日本語化テスト:**
- 全メッセージの日本語表示確認
- 自然な日本語表現の確認
- 文字化けの確認

## 7. SCOPE_PROGRESSへの統合

SCOPE_PROGRESS.mdに以下のタスクとして統合：

```markdown
- [ ] **BRANDING-INTEGRATION**: ブルーランプブランディング統合
  - 目標: 2025-07-05
  - 参照: [/docs/plans/planning/ext-bluelamp-branding-integration-2025-06-28.md]
  - 内容: CLI全体のブルーランプブランディング統合、日本語化、カラーテーマ変更
```

## 8. 備考

**実装上の注意点:**
- 既存の機能を壊さないよう段階的に実装
- 新しいブランディングモジュールを作成して既存コードの肥大化を防ぐ
- 日本語メッセージは自然で親しみやすい表現を心がける
- カラーテーマは視認性を保ちつつブルー系統に統一

**将来の拡張性:**
- 多言語対応の基盤として活用可能
- ブランディング要素の一元管理
- テーマのカスタマイズ機能への発展可能性