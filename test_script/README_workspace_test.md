# Anthropicワークスペース作成機能テスト

このディレクトリには、Anthropicワークスペース作成機能をテストするための複数のスクリプトが含まれています。

## テストスクリプトの概要

- **test_workspace_creation.js**: Anthropic APIを直接呼び出して、ワークスペースが作成できるかをテストします
- **test_controller_workspace.js**: バックエンドコントローラーを直接テストします
- **test_backend_workspace_api.js**: 実際のバックエンドAPIを呼び出してワークスペース作成をテストします

## 環境変数の設定

テストを実行する前に、必要な環境変数を設定してください。`.env`ファイルに以下の変数を追加することができます：

```
# Anthropic APIキー (必須)
ANTHROPIC_ADMIN_KEY=sk-ant-api-...

# MongoDB接続URI (コントローラーテスト用)
MONGODB_URI=mongodb://localhost:27017/appgenius

# API接続先 (バックエンドAPIテスト用)
API_BASE_URL=http://localhost:5000/api

# テストユーザー情報 (バックエンドAPIテスト用)
TEST_USER_EMAIL=your-email@example.com
TEST_USER_PASSWORD=your-password
```

## テスト実行方法

### 1. Anthropic API直接テスト

Anthropic APIが正常に動作するかを確認するための基本的なテストです。

```bash
# 環境変数を設定
export ANTHROPIC_ADMIN_KEY=sk-ant-api-...

# スクリプトを実行
node test_workspace_creation.js
```

このテストが成功すれば、Anthropic APIキーが正常に動作していることが確認できます。

### 2. コントローラーテスト

バックエンドコントローラーのロジックをテストします。実際のデータベースに接続するため、
MongoDBが実行されている必要があります。

```bash
# 環境変数を設定
export ANTHROPIC_ADMIN_KEY=sk-ant-api-...
export MONGODB_URI=mongodb://localhost:27017/appgenius

# スクリプトを実行
node test_controller_workspace.js
```

### 3. バックエンドAPIテスト

実際のバックエンドサーバーが実行されている状態で、APIを呼び出してテストします。
バックエンドサーバーが実行されている必要があります。

```bash
# 環境変数を設定
export API_BASE_URL=http://localhost:5000/api
export TEST_USER_EMAIL=your-email@example.com
export TEST_USER_PASSWORD=your-password

# スクリプトを実行
node test_backend_workspace_api.js
```

## テスト結果の確認

各テストスクリプトは、成功または失敗を標準出力に表示します。
テストが成功した場合は、Anthropicコンソール (https://console.anthropic.com/workspaces) で
実際にワークスペースが作成されたことを確認できます。

## 注意事項

- 開発環境では、実際にAnthropicワークスペースは作成されず、モックレスポンスが返されます
- テスト用の組織とユーザーは自動的に作成/削除されますが、APIテストでは実際のデータが使用されます
- 本番環境で実行する場合は、適切なAPIキーを使用してください

## トラブルシューティング

1. `ANTHROPIC_ADMIN_KEY`が正しく設定されていることを確認
2. バックエンドサーバーが実行されていることを確認
3. MongoDBが実行されていることを確認
4. テストユーザーが存在し、正しいパスワードが設定されていることを確認
5. テスト用の組織が少なくとも1つ存在することを確認