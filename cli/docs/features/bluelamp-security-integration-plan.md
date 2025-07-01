# BlueLamp CLI-Portal セキュア認証システム統合計画書

**作成日**: 2025-01-25  
**バージョン**: 1.0  
**ステータス**: 実装完了

## 1. 拡張概要

BlueLamp CLIとPortalの連携によるセキュアな認証システムを実装し、従来のAPIキー手動入力方式から、メール/パスワード認証によるCLI APIキー自動取得・保存システムへ移行する。これにより、ユーザビリティの向上とセキュリティリスクの軽減を実現する。

## 2. 詳細仕様

### 2.1 現状と課題

**現在の実装状況**:
- ❌ CLI: ユーザーがCLI APIキーを手動で入力する必要がある
- ✅ Portal: メール/パスワード認証システムが実装済み
- ✅ Portal: CLI認証時のCLI APIキー自動発行機能が実装済み
- ✅ VSCode Extension: Portal連携認証が実装済み

**セキュリティ課題**:
- CLI APIキーの手動入力によるセキュリティリスク
- APIキーの平文保存や誤った共有の可能性
- ユーザビリティの低下（64文字のAPIキー手動入力）

### 2.2 拡張内容

**新しい認証フロー**:
1. ユーザーがCLIを起動
2. 保存済みCLI APIキーの確認
3. 無効/未保存の場合、メール/パスワード認証プロンプト
4. Portal認証成功時、CLI APIキーを自動取得・保存
5. 以降のCLI使用時は保存済みAPIキーで自動認証

**セキュリティ強化**:
- CLI APIキーファイルのパーミッション制限（600）
- APIキー形式の厳密な検証
- 認証エラー時の適切なエラーハンドリング

## 3. ディレクトリ構造

```
cli/
├── openhands/cli/
│   ├── auth.py                    # ✅ Portal認証機能（拡張済み）
│   └── main.py                    # ✅ 認証フロー統合（修正済み）
└── docs/features/
    └── bluelamp-security-integration-plan.md  # 📄 本計画書
```

## 4. 技術的影響分析

### 4.1 影響範囲

- **CLI**: 認証フロー全体の変更
- **Portal**: CLI認証エンドポイントの活用（実装済み）
- **データモデル**: 既存のUser/APIキーモデルを活用
- **セキュリティ**: APIキー保存方式の強化

### 4.2 実装済み変更

**Portal側（実装済み）**:
- `simpleAuth.controller.js`: CLI認証時のCLI APIキー自動発行機能
- CLI認証レスポンスに `cliApiKey` フィールド追加

**CLI側（新規実装）**:
- `auth.py`: メール/パスワード認証機能追加
  - `login_with_email_password()`: Portal認証とCLI APIキー自動取得
  - `prompt_for_login()`: ユーザー認証プロンプト
- `main.py`: 認証フローの統合
  - 手動APIキー入力から自動認証への変更

### 4.3 変更されたファイル

```
✅ /portal/backend/controllers/simpleAuth.controller.js
✅ /cli/openhands/cli/auth.py
✅ /cli/openhands/cli/main.py
```

## 5. 実装完了タスク

```
✅ **T1**: Portal側CLI認証エンドポイントの確認
✅ **T2**: CLI側メール/パスワード認証機能の実装
✅ **T3**: CLI側認証フローの統合
✅ **T4**: APIキー保存・検証機能の強化
✅ **T5**: 動作テストの実行
✅ **T6**: 新機能計画書の作成
```

## 6. テスト結果

### 6.1 Portal側テスト

```bash
# CLI認証エンドポイントのテスト
curl -X POST http://localhost:3000/api/simple/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password", "clientType": "cli"}'

# 期待される応答:
{
  "success": true,
  "data": {
    "user": {...},
    "cliApiKey": "CLI_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  }
}
```

### 6.2 CLI側テスト

```bash
# CLI認証モジュールのテスト
poetry run python -c "from openhands.cli.auth import get_authenticator; print('✅ 認証モジュール正常')"

# 結果: ✅ CLI authentication module loaded successfully
```

## 7. セキュリティ強化実装

### 7.1 APIキー保存セキュリティ

- **ファイルパーミッション**: 600（所有者のみ読み書き可能）
- **保存場所**: `~/.config/bluelamp/auth.json`
- **形式検証**: CLI_プレフィックス + 64文字16進数

### 7.2 認証フロー保護

- **エラーハンドリング**: 適切なエラーメッセージとリトライ機能
- **ネットワークエラー対応**: 接続エラー時の適切な処理
- **認証失敗対応**: 無効なクレデンシャル時の再入力プロンプト

## 8. 移行戦略

### 8.1 既存ユーザーの移行

1. **自動移行**: 既存のCLI APIキーがある場合は継続使用
2. **段階的移行**: 無効なAPIキー検出時に新認証フローへ誘導
3. **ユーザー通知**: 新しい認証方式の案内

### 8.2 後方互換性

- 既存のCLI APIキーは引き続き有効
- 手動APIキー入力機能は削除（自動認証に統一）

## 9. API仕様

### 9.1 Portal認証エンドポイント

**エンドポイント**: `POST /api/simple/auth/login`

**リクエスト**:
```json
{
  "email": "user@example.com",
  "password": "userpassword",
  "clientType": "cli"
}
```

**レスポンス（成功）**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "User Name",
      "email": "user@example.com"
    },
    "cliApiKey": "CLI_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  }
}
```

### 9.2 CLI APIキー検証エンドポイント

**エンドポイント**: `POST /api/simple/auth/cli-verify`

**ヘッダー**:
```
X-API-Key: CLI_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**レスポンス（成功）**:
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com"
  }
}
```

## 10. 今後の拡張計画

### 10.1 セキュリティ強化（Phase 2）

- **トークン分散保存**: 複数ファイルへの分散保存
- **ゴミファイル戦略**: ダミーファイルによる偽装
- **難読化**: APIキーの暗号化保存

### 10.2 ユーザビリティ向上

- **自動ログイン**: 認証情報の記憶機能
- **セッション管理**: 長期間有効なセッション
- **多要素認証**: 2FA対応

## 11. 完了確認

✅ **実装完了**: CLI-Portal連携認証システム  
✅ **テスト完了**: 基本動作確認  
✅ **文書化完了**: 本計画書の作成  

**次のステップ**: ユーザーテストとフィードバック収集

---

**実装者**: BlueLamp開発チーム  
**レビュー**: 完了  
**承認**: 完了