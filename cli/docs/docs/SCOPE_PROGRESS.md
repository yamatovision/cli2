# AppGenius CLI移行プロジェクト

## 1. 基本情報

- **進捗状況**: 進行中
- **最終更新日**: 2025-06-26
- **最終更新内容**: ClaudeCodeから独自CLIへの移行計画

## 実行中エージェント

| エージェント名 | 開始時刻 | 作業内容 |
|---------------|----------|----------|
| - | - | - |

## 完了した作業

| 作業内容 | 完了時刻 | 結果 |
|----------|----------|------|
| RecallAction警告エラーの調査 | 2025-06-26 19:45 | 正常動作確認（デッドロック防止機能） |
| エージェント切り替え詳細ログ機能実装 | 2025-06-26 20:05 | 実装完了（切り替え情報・引き継ぎ内容・コンテクスト監視） |
| CmdRunActionタイムアウト問題の修正 | 2025-06-27 18:34 | 根本原因修正完了（loop.py無限待機→ステップ実行、ログスパム対策） |
| EventStreamSubscriberループクローズエラー修正 | 2025-06-27 18:40 | 実行中イベントループの安全なクローズ機能実装完了 |
| VSCode拡張promptCards機能のBluelamp CLI対応 | 2025-06-29 | 16個のプロンプトカード削除、ブルーランプ起動ボタン実装完了 |

- [x] **EXT-001**: promptCards機能からBluelamp CLI起動への変更
  - 目標: 2025-06-29
  - 参照: [/docs/plans/planning/ext-bluelamp-migration-2025-06-29.md]
  - 内容: セキュリティ脆弱性の解消とブルーランプCLI統合
  - 完了: 2025-06-29 - promptCards機能を単一のブルーランプ起動ボタンに変更、プロンプトファイル脆弱性を解消

- [ ] **CLI-MIGRATION**: ClaudeCodeから独自CLIへの移行（Phase 1）
  - 目標: 2025-07-15
  - 参照: [/docs/plans/planning/ext-claudecode-to-cli-migration-2025-06-26.md]
  - 内容: 最小限認証システム導入、CLI起動フローの簡素化、大規模コードクリーンアップ
    - 大規模コードクリーンアップ（最優先）- 20+ファイルの削除
    - CLI認証システムの基盤実装（最小限）
    - Portal側CLI認証API実装（simple.routes.js拡張）
    - VSCode拡張のCLI起動対応
    - 既存ClaudeCode機能の段階的廃止

## 2. タスクリスト（Phase 1 - 最小限実装）

- [ ] **T1**: 大規模コードクリーンアップ（最優先）
  - 使用されていないルートファイルの削除（user系、organization系、api-proxy系）
  - 使用されていないコントローラー・モデル・サービスの削除
  - 使用されていないミドルウェアの削除
  - 関連テストファイルの削除（20+ファイル）
  - app.jsのコメントアウト部分の整理

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
