# CLI認証システム デバッグロードマップ

## 問題の概要
1. **APIキー取得エラー**: レスポンスに`cliApiKey`が含まれていない
2. **レスポンス構造の不一致**: 期待される`cliApiKey`の代わりに`['accessToken', 'refreshToken', 'user']`が返されている
3. **認証エンドポイント**: `/simple/auth/login`

## エラー発生箇所
- ファイル: `/cli/openhands/cli/auth.py`
- 行: 314 - `logger.error("CLI API key not found in response")`
- 期待値: `response_data.get("cliApiKey")`
- 実際の値: `['accessToken', 'refreshToken', 'user']`

## 依存関係マップ
```
CLI認証システム
├── クライアント側 (cli/openhands/cli/auth.py)
│   ├── PortalAuthenticator.login_with_email_password()
│   ├── エンドポイント: /simple/auth/login
│   └── 期待レスポンス: {data: {cliApiKey: "...", user: {...}}}
│
└── サーバー側 (portal/backend/)
    ├── 認証エンドポイント実装
    ├── clientType: "cli" の処理
    └── 実際のレスポンス: {accessToken, refreshToken, user}
```

## デバッグ手順

### ステップ1: 環境変数・設定の確認
- [ ] PORTAL_BASE_URL の確認
- [ ] 本番環境とローカル環境の差異調査
- [ ] サーバー側の環境変数確認

### ステップ2: サーバー側認証エンドポイントの調査
- [ ] Portal側の `/simple/auth/login` エンドポイント実装確認
- [ ] `clientType: "cli"` の処理ロジック確認
- [ ] レスポンス構造の確認

### ステップ3: レスポンス構造の修正
- [ ] サーバー側でcliApiKeyを返すように修正
- [ ] または、クライアント側でaccessTokenを使用するように修正

### ステップ4: ログ設置とテスト
- [ ] 詳細なデバッグログの追加
- [ ] 修正後のテスト実行
- [ ] エラーハンドリングの改善

## 現在の状況
- エラー箇所: 特定済み
- 根本原因: レスポンス構造の不一致
- サーバー側調査結果: 
  - `generateCliApiKey()`メソッドは実装済み
  - しかし実際のレスポンスに`cliApiKey`が含まれていない
  - 代わりに`apiKey`オブジェクトが返されている
- 次のアクション: CLI APIキー生成処理のデバッグ

## ログ情報
```
08:21:40 - bluelamp.cli.auth:ERROR: auth.py:314 - CLI API key not found in response
08:21:40 - bluelamp.cli.auth:ERROR: auth.py:315 - Response data keys: ['accessToken', 'refreshToken', 'user']
```