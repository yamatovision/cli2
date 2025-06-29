# 機能拡張計画: ClaudeCodeから独自CLIへの移行 2025-06-26

## 1. 拡張概要

現在のClaudeCode連携システムから独自開発のブルーランプCLIへの移行を行います。これにより、16エージェント選択の複雑なUIを排除し、オーケストレーター経由でのシンプルな起動フローを実現します。Phase 1では個人ユーザーのみ対応した最小限の認証システムを導入し、同時に不要なコードを削除してクリーンなコードベースを構築します。

## 2. 詳細仕様

### 2.1 現状と課題

**現在の実装状況：**
- SCOPE_PROGRESS → 開発プロンプト → 16エージェント選択 → ターミナル起動 → ClaudeCode連携
- VSCode認証による認証管理
- プロンプトカードによる複雑なエージェント選択UI
- ClaudeCode依存による外部ツール管理の複雑さ

**課題：**
- 16エージェント選択UIの複雑さ
- ClaudeCode外部依存によるメンテナンス負荷
- 大量の不要なコードの蓄積（user系、organization系、api-proxy系など）
- 使用されていない機能による複雑化とメンテナンス性の低下

### 2.2 拡張内容

**新しいフロー（Phase 1）：**
- SCOPE_PROGRESS → 開発プロンプト → ターミナル起動 → `bluelamp`コマンド（オーケストレーター経由で16エージェント）

**認証システム（Phase 1 - 最小限）：**
- Portal（MongoDB）ベースの個人ユーザー認証
- メールアドレス/パスワード認証（既存simple.routes.js拡張）
- Claude APIキーのローカル暗号化保存のみ
- 組織機能は一旦無視

**コードクリーンアップ（大規模）：**
- 不要なルートファイルの削除（user系、organization系、api-proxy系）
- 使われていないコントローラー・モデル・サービスの削除
- 不要なミドルウェアとテストファイルの削除
- simple.routes.js + simpleUser.model.js中心の統一された構成

## 3. ディレクトリ構造（Phase 1 - 最小限）

```
AppGenius/
├── cli/                                    # 既存CLIディレクトリ
│   ├── bluelamp                           # 既存CLI起動スクリプト
│   ├── config.toml                        # 既存設定ファイル（認証設定追加）
│   ├── agent_configs.toml                 # 既存エージェント設定
│   └── auth/                              # 新規：認証関連（最小限）
│       ├── __init__.py
│       ├── simple_auth.py                 # シンプル認証クライアント
│       ├── api_key_manager.py             # Claude APIキー管理
│       └── portal_client.py               # Portal API連携
│
├── vscode-extension/                       # 既存VSCode拡張
│   ├── media/
│   │   └── components/
│   │       ├── dialogManager/
│   │       │   └── dialogManager.js       # 変更：モーダル表示の簡素化
│   │       └── promptCards/
│   │           └── promptCards.js         # 変更：直接CLI起動
│   └── src/
│       ├── commands/
│       │   └── claudeCodeCommands.ts      # 変更：CLI起動コマンド
│       └── ui/scopeManager/
│           ├── ScopeManagerPanel.ts       # 変更：CLI起動処理
│           └── services/messageHandlers/
│               └── ScopeManagerMessageHandler.ts # 変更：メッセージ処理
│
└── portal/                                 # 既存Portal（大規模クリーンアップ）
    └── backend/
        ├── models/
        │   ├── simpleUser.model.js        # 既存：個人ユーザー管理
        │   ├── simpleOrganization.model.js # 既存：組織管理（Phase 2で使用）
        │   └── [削除対象: user.model.js, organization.model.js, workspace.model.js]
        ├── routes/
        │   ├── simple.routes.js           # 拡張：CLI認証API追加
        │   ├── prompt.routes.js           # 既存：プロンプト管理（残す）
        │   └── [削除対象: user.routes.js, organization.routes.js, api-proxy.routes.js]
        ├── controllers/
        │   ├── simpleAuth.controller.js   # 拡張：CLI認証処理追加
        │   ├── simpleUser.controller.js   # 既存：個人ユーザー管理
        │   ├── simpleOrganization.controller.js # 既存：組織管理（Phase 2で使用）
        │   └── [削除対象: user.controller.js, organization.controller.js, apiProxyController.js]
        ├── services/
        │   ├── prompt.service.js          # 既存：プロンプト管理（残す）
        │   └── [削除対象: user.service.js, auth.service.js, anthropicProxyService.js, apiUsageService.js]
        └── middlewares/
            ├── simple-auth.middleware.js  # 既存：認証ミドルウェア（残す）
            └── [削除対象: usage-limit.middleware.js]
```

## 4. 技術的影響分析

### 4.1 影響範囲（Phase 1）

- **フロントエンド**: プロンプトカード処理、モーダル表示の簡素化
- **バックエンド**: simple.routes.jsへのCLI認証API追加
- **CLI**: 最小限認証システム、Portal連携、APIキー管理
- **大規模クリーンアップ**: 使用されていない全機能の削除（user系、organization系、api-proxy系）

### 4.2 変更・追加が必要なファイル

```
【新規作成】
- /cli/auth/__init__.py: 認証モジュール初期化
- /cli/auth/simple_auth.py: シンプル認証クライアント
- /cli/auth/api_key_manager.py: Claude APIキー管理
- /cli/auth/portal_client.py: Portal API連携

【変更】
- /vscode-extension/media/components/dialogManager/dialogManager.js: モーダル表示の簡素化
- /vscode-extension/media/components/promptCards/promptCards.js: 直接CLI起動への変更
- /vscode-extension/src/commands/claudeCodeCommands.ts: CLI起動コマンドの追加
- /vscode-extension/src/ui/scopeManager/ScopeManagerPanel.ts: CLI起動処理への変更
- /vscode-extension/src/ui/scopeManager/services/messageHandlers/ScopeManagerMessageHandler.ts: メッセージ処理の変更
- /cli/config.toml: 認証設定の追加
- /portal/backend/routes/simple.routes.js: CLI認証エンドポイント追加
- /portal/backend/controllers/simpleAuth.controller.js: CLI認証処理追加

【削除対象（大規模クリーンアップ）】
■ ルートファイル
- /portal/backend/routes/user.routes.js: 使用されていない
- /portal/backend/routes/organization.routes.js: 使用されていない
- /portal/backend/routes/api-proxy.routes.js: 使用されていない

■ コントローラー
- /portal/backend/controllers/user.controller.js: 使用されていない
- /portal/backend/controllers/organization.controller.js: 使用されていない
- /portal/backend/controllers/apiProxyController.js: 使用されていない

■ モデル
- /portal/backend/models/user.model.js: 使用されていない
- /portal/backend/models/organization.model.js: 使用されていない
- /portal/backend/models/workspace.model.js: 使用されていない

■ サービス
- /portal/backend/services/user.service.js: 使用されていない
- /portal/backend/services/auth.service.js: 使用されていない
- /portal/backend/services/anthropicProxyService.js: 使用されていない
- /portal/backend/services/apiUsageService.js: 使用されていない

■ ミドルウェア
- /portal/backend/middlewares/usage-limit.middleware.js: 使用されていない

■ テストファイル
- /portal/backend/controllers/__tests__/organization.controller.test.js
- /portal/backend/controllers/__tests__/workspace.controller.test.js
- /portal/backend/models/__tests__/organization.test.js
- /portal/backend/models/__tests__/workspace.test.js
- /portal/backend/tests/api-proxy.test.js
- /portal/backend/tests/unit/user-model-session.test.js
```

## 5. タスクリスト（Phase 1 - 最小限実装）

```
- [ ] **T1**: 大規模コードクリーンアップ（最優先）
  - 使用されていないルートファイルの削除（user系、organization系、api-proxy系）
  - 使用されていないコントローラー・モデル・サービスの削除
  - 使用されていないミドルウェアの削除
  - 関連テストファイルの削除
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
```

## 6. テスト計画（Phase 1）

### 6.1 認証システムテスト
- 既存ユーザーでのCLI認証
- ログイン・ログアウト
- APIキー設定・暗号化保存

### 6.2 CLI起動フローテスト
- VSCode拡張からのCLI起動
- オーケストレーター経由のエージェント起動
- エラーハンドリング（認証失敗、APIキー無効等）

### 6.3 コードクリーンアップテスト
- 削除後の既存機能の動作確認
- simple.routes.js中心の動作確認
- 不要コード削除による影響の確認

## 7. SCOPE_PROGRESSへの統合

SCOPE_PROGRESS.mdに以下のタスクとして統合：

```markdown
- [ ] **CLI-MIGRATION**: ClaudeCodeから独自CLIへの移行（Phase 1）
  - 目標: 2025-07-15
  - 参照: [/docs/plans/planning/ext-claudecode-to-cli-migration-2025-06-26.md]
  - 内容: 最小限認証システム導入、CLI起動フローの簡素化、コードクリーンアップ
```

## 8. 備考

### 8.1 段階的実装戦略（更新）
- **Phase 1**: 最小限実装 + コードクリーンアップ（現在）
  - 個人ユーザーのみ対応
  - Claude APIキーのローカル管理のみ
  - 不要コードの削除
- **Phase 2**: 組織機能の復活・拡張（将来）
  - マルチテナント対応
  - 組織共有APIキー機能
  - 高度なサブスク管理

### 8.2 大規模コードクリーンアップの利点
- 大量の不要コード（20+ファイル）の除去によるバグリスク軽減
- メンテナンス性の大幅向上
- 新機能開発時の混乱防止
- simple系ファイル中心の統一された構成
- コードベースサイズの大幅削減

### 8.3 リスク管理
- 既存ユーザーへの影響を最小化
- 段階的移行による安定性確保
- 削除前のコードバックアップ
- ロールバック計画の準備

### 8.4 セキュリティ考慮事項
- Claude APIキーの暗号化保存
- 認証トークンの安全な管理
- 通信の暗号化（HTTPS）
- 最小権限の原則（Phase 1では個人ユーザーのみ）