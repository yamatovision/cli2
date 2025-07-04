# ハニーポットシステムテストコマンド一覧

## 本番環境エンドポイント
- Base URL: https://bluelamp-235426778039.asia-northeast1.run.app

## 1. トラップキーのテスト

### 1.1 「当たり」トラップキー（偽プロンプトを返す）

```bash
# 当たりのトラップキー: bluelamp_cli_token_x9y8z7w6v5u4t3s2
# プロンプト一覧取得
curl -X GET "https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/prompts" \
  -H "X-API-Key: bluelamp_cli_token_x9y8z7w6v5u4t3s2" \
  -H "Content-Type: application/json"

# 特定プロンプト取得（例: ID=67d795ccc7e55b63256e5dd6）
curl -X GET "https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/prompts/67d795ccc7e55b63256e5dd6" \
  -H "X-API-Key: bluelamp_cli_token_x9y8z7w6v5u4t3s2" \
  -H "Content-Type: application/json"

# Authorizationヘッダー形式
curl -X GET "https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/prompts" \
  -H "Authorization: Bearer bluelamp_cli_token_x9y8z7w6v5u4t3s2" \
  -H "Content-Type: application/json"

# クエリパラメータ形式
curl -X GET "https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/prompts?apiKey=bluelamp_cli_token_x9y8z7w6v5u4t3s2" \
  -H "Content-Type: application/json"

# ボディパラメータ形式（POSTリクエストで）
curl -X POST "https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/prompts" \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "bluelamp_cli_token_x9y8z7w6v5u4t3s2"}'
```

### 1.2 「外れ」トラップキー（エラーを返す）

```bash
# セッション内トラップキー例
curl -X GET "https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/prompts" \
  -H "X-API-Key: sk-proj-vX8mN3kP9qR2sT5wY7zB1cD4" \
  -H "Content-Type: application/json"

# デコイディレクトリトラップキー例（当たりではないもの）
curl -X GET "https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/prompts" \
  -H "X-API-Key: sk-proj-pQ2rS4tU6vW8xY0zA2bC4dE6" \
  -H "Content-Type: application/json"

# CLIトークン風トラップキー
curl -X GET "https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/prompts" \
  -H "X-API-Key: cli_mk8n3p_a302ae96bc54d1789ef23456" \
  -H "Content-Type: application/json"

# BlueLamp API風トラップキー
curl -X GET "https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/prompts" \
  -H "X-API-Key: bluelamp_api_2025_prod_7f8e9d0c1b2a" \
  -H "Content-Type: application/json"
```

### 1.3 その他のトラップキー（全て「外れ」）

```bash
# トラップキーリストからランダムに選択
TRAP_KEYS=(
  "sk-proj-aB2cD4eF6gH8iJ0kL2mN4oP6"
  "sk-proj-qR9sT7uV5wX3yZ1aB9cD7eF5"
  "sk-proj-mN6oP8qR0sT2uV4wX6yZ8aB0"
  "sk-proj-eF3gH5iJ7kL9mN1oP3qR5sT7"
  "sk-proj-uV2wX4yZ6aB8cD0eF2gH4iJ6"
  "sk-proj-kL8mN0oP2qR4sT6uV8wX0yZ2"
  "sk-proj-aB4cD6eF8gH0iJ2kL4mN6oP8"
  "sk-proj-qR1sT3uV5wX7yZ9aB1cD3eF5"
  "sk-proj-mN7oP9qR1sT3uV5wX7yZ9aB1"
  "sk-proj-eF4gH6iJ8kL0mN2oP4qR6sT8"
  "sk-proj-uV0wX2yZ4aB6cD8eF0gH2iJ4"
  "sk-proj-kL5mN7oP9qR1sT3uV5wX7yZ9"
  "sk-proj-aB3cD5eF7gH9iJ1kL3mN5oP7"
  "sk-proj-qR9sT1uV3wX5yZ7aB9cD1eF3"
  "sk-proj-mN5oP7qR9sT1uV3wX5yZ7aB9"
  "sk-proj-eF1gH3iJ5kL7mN9oP1qR3sT5"
  "sk-proj-uV7wX9yZ1aB3cD5eF7gH9iJ1"
  "sk-proj-kL3mN5oP7qR9sT1uV3wX5yZ7"
  "sk-proj-aB9cD1eF3gH5iJ7kL9mN1oP3"
  "sk-proj-xY7zB9cD1eF3gH5iJ7kL9mN1"
  "sk-proj-fG8hI0jK2lM4nO6pQ8rS0tU2"
  "sk-proj-wX3yZ5aB7cD9eF1gH3iJ5kL7"
  "sk-proj-mN9oP1qR3sT5uV7wX9yZ1aB3"
)

# ランダムにトラップキーを選んでテスト
for KEY in "${TRAP_KEYS[@]}"; do
  echo "Testing trap key: $KEY"
  curl -X GET "https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/prompts" \
    -H "X-API-Key: $KEY" \
    -H "Content-Type: application/json"
  echo -e "\n---\n"
  sleep 1  # レート制限を避けるため
done
```

## 2. 期待される応答

### 2.1 「当たり」トラップキー（bluelamp_cli_token_x9y8z7w6v5u4t3s2）の場合

```json
{
  "success": true,
  "data": {
    "prompt": {
      "id": "trap-prompt-xxxx",
      "title": "偽のプロンプトタイトル",
      "content": "これは偽のプロンプトコンテンツです...",
      "metadata": {
        "isHoneypot": true
      }
    },
    "access": {
      "canEdit": false,
      "canDelete": false,
      "expiresAt": "2025-07-09T12:00:00.000Z"
    }
  }
}
```

### 2.2 「外れ」トラップキーの場合（ランダムなエラーパターン）

```json
// パターン1: 無効なAPIキー
{
  "success": false,
  "error": "INVALID_API_KEY",
  "message": "Invalid API key format"
}

// パターン2: 取り消されたAPIキー
{
  "success": false,
  "error": "API_KEY_REVOKED",
  "message": "This API key has been revoked"
}

// パターン3: サブスクリプション必要
{
  "success": false,
  "error": "SUBSCRIPTION_REQUIRED",
  "message": "This feature requires a paid subscription"
}

// パターン4: レート制限
{
  "success": false,
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Rate limit exceeded. Please try again later"
}
```

## 3. 正規の認証テスト（比較用）

```bash
# 正規のCLIトークンを使用（事前にログインが必要）
# 1. まずログインしてトークンを取得
curl -X POST "https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "your-password",
    "deviceInfo": {
      "deviceName": "Test Device",
      "platform": "darwin"
    }
  }'

# 2. 取得したトークンでプロンプト一覧を取得
curl -X GET "https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/prompts" \
  -H "X-CLI-Token: cli_xxxxx_yyyyy" \
  -H "Content-Type: application/json"
```

## 4. 制裁の確認

トラップキーを使用した後、同じアカウントでログインを試みると、アカウントがブロックされていることを確認できます：

```bash
# トラップキー使用後のログイン試行
curl -X POST "https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "blocked-user@example.com",
    "password": "password"
  }'

# 期待される応答
{
  "success": false,
  "error": "ACCOUNT_BLOCKED",
  "message": "アカウントがセキュリティ違反により停止されています"
}
```

## 5. テスト実行の注意事項

1. **本番環境でのテストは慎重に** - トラップキーの使用は即座にアカウント停止につながります
2. **テスト用アカウントを使用** - 本番のアカウントではテストしないでください
3. **レート制限に注意** - 連続したリクエストは避けてください
4. **ログの確認** - Portal側のログでトラップ検知が記録されているか確認してください

## 6. デバッグ用コマンド

```bash
# ヘッダーの詳細を表示
curl -v -X GET "https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/prompts" \
  -H "X-API-Key: bluelamp_cli_token_x9y8z7w6v5u4t3s2" \
  -H "Content-Type: application/json"

# レスポンスヘッダーも含めて表示
curl -i -X GET "https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/prompts" \
  -H "X-API-Key: bluelamp_cli_token_x9y8z7w6v5u4t3s2" \
  -H "Content-Type: application/json"

# JSONを整形して表示
curl -X GET "https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/prompts" \
  -H "X-API-Key: bluelamp_cli_token_x9y8z7w6v5u4t3s2" \
  -H "Content-Type: application/json" | jq .
```



ルーティングを確認します。ハニーポットのダミープロンプトは
  /api/cli/prompts ルートを通ります。

  フローを整理すると：
  1. /api/cli/prompts または /api/cli/prompts/:id にリクエスト
  2. verifyCliToken ミドルウェアでトラップキーをチェック
  3. トラップキーの場合、req.isHoneypot = true を設定
  4. cliPromptController で req.isHoneypot
  をチェックし、ダミープロンプトを返す

  17個のプロンプトIDを取得して、正確なテストコマンドを作成します。





















  3. トラップキーの場合、req.isHoneypot = true を設定




