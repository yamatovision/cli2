# AppGenius CLI移行プロジェクト

## 1. 基本情報

- **進捗状況**: 進行中
- **最終更新日**: 2025-06-26
- **最終更新内容**: ClaudeCodeから独自CLIへの移行計画

## 実行中エージェント

現在実行中のエージェントはありません。

## 完了した作業

| 作業内容 | 完了時刻 | 結果 |
|----------|----------|------|
| RecallAction警告エラーの調査 | 2025-06-26 19:45 | 正常動作確認（デッドロック防止機能） |
| エージェント切り替え詳細ログ機能実装 | 2025-06-26 20:05 | 実装完了（切り替え情報・引き継ぎ内容・コンテクスト監視） |
| **T1: 大規模コードクリーンアップ** | 2025-06-28 | **完了** - bluelamp CLI以外の全ファイル削除、最小構成実現 |
| agenthubフォルダ整理 | 2025-06-28 22:03 | **完了** - 不要エージェント22個削除、bluelamp_agents/とcodeact_agent/のみ保持 |
| **Git自動タイムスタンプ機能実装** | 2025-06-29 09:07 | **完了** - prepare-commit-msg/post-commitフック実装、日本時間対応 |
| **日本語ブランディング統合計画策定** | 2025-06-29 09:10 | **完了** - 8タスクの詳細実装計画書作成、段階的実装アプローチ策定 |

- [ ] **CLI-MIGRATION**: ClaudeCodeから独自CLIへの移行（Phase 1）
  - 目標: 2025-07-15
  - 参照: [/docs/plans/planning/ext-claudecode-to-cli-migration-2025-06-26.md]
  - 内容: 最小限認証システム導入、CLI起動フローの簡素化、大規模コードクリーンアップ
    - 大規模コードクリーンアップ（最優先）- 20+ファイルの削除
    - CLI認証システムの基盤実装（最小限）
    - Portal側CLI認証API実装（simple.routes.js拡張）
    - VSCode拡張のCLI起動対応
    - 既存ClaudeCode機能の段階的廃止

- [ ] **ESC-INTERRUPT**: ESCキー割り込み機能の実装
  - 目標: 2025-07-01
  - 参照: [/docs/plans/planning/ext-esc-interrupt-2025-06-28.md]
  - 内容: ClaudeCode風のESCキー割り込み機能実装、現在タスク完了後の残りタスクキャンセル

- [ ] **BRANDING-INTEGRATION**: ブルーランプブランディング統合
  - 目標: 2025-07-05
  - 参照: [/docs/plans/planning/ext-bluelamp-branding-integration-2025-06-28.md]
  - 内容: CLI全体のブルーランプブランディング統合、日本語化、カラーテーマ変更

## 2. タスクリスト（Phase 1 - 最小限実装）

- [x] **T1**: 大規模コードクリーンアップ（最優先） ✅ **完了**
  - bluelamp CLI以外の全ファイル・ディレクトリを削除
  - 重複ディレクトリの排除（cli/, OpenHands-main/, portal/, frontend/, backend/等）
  - 調査・デバッグファイルの削除
  - 最小構成の実現（bluelamp CLI動作確認済み）

- [ ] **T2**: CLI認証システムの基盤実装（最小限）
  - シンプル認証クライアント（simple_auth.py）
  - Portal API連携クライアント（portal_client.py）
  - Claude APIキー管理（api_key_manager.py）

- [ ] **T3**: Portal側CLI認証API実装（simple.routes.js拡張）
  - simple.routes.jsにCLI認証エンドポイント追加
  - simpleAuth.controller.jsにCLI認証処理追加
  - 個人ユーザーのみ対応

- [ ] **T4**: VSCode拡張のCLI起動対応
  - dialogManager.jsの簡素化
  - promptCards.jsの直接CLI起動
  - ScopeManagerPanelのCLI起動処理

- [ ] **T5**: 設定ファイルとドキュメント更新
  - config.tomlの認証設定追加
  - ユーザー向けセットアップガイド
  - 移行手順書

- [ ] **T6**: テストとデバッグ
  - 認証フローのテスト
  - CLI起動フローのテスト
  - エラーハンドリングの検証

- [ ] **T7**: 既存ClaudeCode機能の段階的廃止
  - 旧機能の無効化
  - 設定ファイルのクリーンアップ
  - 最終的な不要コードの削除

- [ ] **CTRL-C-FORCE-EXIT**: Ctrl+C強制終了機能の実装
  - 目標: 2025-07-01
  - 参照: [/docs/plans/planning/ext-ctrl-c-force-exit-2025-06-25.md]
  - 内容: 確実なCtrl+C強制終了機能実装、複雑な既存実装の大幅クリーンアップ

- [ ] **ESC-INTERRUPT**: ESCキー割り込み機能の実装
  - 目標: 2025-07-01
  - 参照: [/docs/plans/planning/ext-esc-interrupt-2025-06-28.md]
  - 内容: ClaudeCode風のESCキー割り込み機能実装、現在タスク完了後の残りタスクキャンセル
