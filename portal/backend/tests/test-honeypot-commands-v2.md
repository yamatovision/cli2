# ハニーポットシステムテストコマンド一覧（改訂版）

## 本番環境エンドポイント
- Base URL: https://bluelamp-235426778039.asia-northeast1.run.app

## 重要な発見
- トラップキーは `X-API-Key` ヘッダーではなく、`X-CLI-Token` ヘッダーとして送信する必要がある
- エンドポイントは `/api/cli/prompts` を使用

## 1. トラップキーのテスト（17個の実際のプロンプトID使用）

### 1.1 「当たり」トラップキー（偽プロンプトを返す）

```bash
# 当たりのトラップキー: bluelamp_cli_token_x9y8z7w6v5u4t3s2

# プロンプト一覧取得
curl -X GET "https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/prompts" \
  -H "X-API-Key: bluelamp_cli_token_x9y8z7w6v5u4t3s2 \
  -H "Content-Type: application/json"


  curl -X GET "https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/prompts/6862397f1428c1efc592f6ce" \
    -H "X-API-Key: bluelamp_cli_token_x9aa8z7w6v5u4t3s2" \
    -H "Content-Type: application/json"
    
    
    
    
    # 17個の実際のプロンプトIDでテスト
# 1. オーケストレーター
curl -X GET "https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/prompts/6862397f1428c1efc592f6cc" \
  -H "X-CLI-Token: bluelamp_cli_token_x9y8z7w6v5u4t3s2" \
  -H "Content-Type: application/json"

# 2. 要件定義エンジニア
curl -X GET "https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/prompts/6862397f1428c1efc592f6ce" \
  -H "X-CLI-Token: bluelamp_cli_token_x9y8z7w6v5u4t3s2" \
  -H "Content-Type: application/json"

# 3. UI/UXデザイナー
curl -X GET "https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/prompts/6862397f1428c1efc592f6d0" \
  -H "X-CLI-Token: bluelamp_cli_token_x9y8z7w6v5u4t3s2" \
  -H "Content-Type: application/json"

# 4. データモデリングエンジニア
curl -X GET "https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/prompts/6862397f1428c1efc592f6d2" \
  -H "X-CLI-Token: bluelamp_cli_token_x9y8z7w6v5u4t3s2" \
  -H "Content-Type: application/json"

# 5. システムアーキテクト
curl -X GET "https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/prompts/6862397f1428c1efc592f6d4" \
  -H "X-CLI-Token: bluelamp_cli_token_x9y8z7w6v5u4t3s2" \
  -H "Content-Type: application/json"

# 6. 実装コンサルタント
curl -X GET "https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/prompts/6862397f1428c1efc592f6d6" \
  -H "X-CLI-Token: bluelamp_cli_token_x9y8z7w6v5u4t3s2" \
  -H "Content-Type: application/json"

# 7. 環境構築
curl -X GET "https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/prompts/6862397f1428c1efc592f6d8" \
  -H "X-CLI-Token: bluelamp_cli_token_x9y8z7w6v5u4t3s2" \
  -H "Content-Type: application/json"

# 8. プロトタイプ実装
curl -X GET "https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/prompts/6862397f1428c1efc592f6da" \
  -H "X-CLI-Token: bluelamp_cli_token_x9y8z7w6v5u4t3s2" \
  -H "Content-Type: application/json"

# 9. バックエンド実装
curl -X GET "https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/prompts/6862397f1428c1efc592f6dc" \
  -H "X-CLI-Token: bluelamp_cli_token_x9y8z7w6v5u4t3s2" \
  -H "Content-Type: application/json"

# 10. テスト・品質検証
curl -X GET "https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/prompts/6862397f1428c1efc592f6de" \
  -H "X-CLI-Token: bluelamp_cli_token_x9y8z7w6v5u4t3s2" \
  -H "Content-Type: application/json"

# 11. API統合
curl -X GET "https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/prompts/6862397f1428c1efc592f6e0" \
  -H "X-CLI-Token: bluelamp_cli_token_x9y8z7w6v5u4t3s2" \
  -H "Content-Type: application/json"

# 12. デバッグ探偵
curl -X GET "https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/prompts/6862397f1428c1efc592f6e2" \
  -H "X-CLI-Token: bluelamp_cli_token_x9y8z7w6v5u4t3s2" \
  -H "Content-Type: application/json"

# 13. デプロイスペシャリスト
curl -X GET "https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/prompts/6862397f1428c1efc592f6e4" \
  -H "X-CLI-Token: bluelamp_cli_token_x9y8z7w6v5u4t3s2" \
  -H "Content-Type: application/json"

# 14. GitHubマネージャー
curl -X GET "https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/prompts/6862397f1428c1efc592f6e6" \
  -H "X-CLI-Token: bluelamp_cli_token_x9y8z7w6v5u4t3s2" \
  -H "Content-Type: application/json"

# 15. TypeScriptマネージャー
curl -X GET "https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/prompts/6862397f1428c1efc592f6e8" \
  -H "X-CLI-Token: bluelamp_cli_token_x9y8z7w6v5u4t3s2" \
  -H "Content-Type: application/json"

# 16. 機能拡張プランナー
curl -X GET "https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/prompts/6862397f1428c1efc592f6ea" \
  -H "X-CLI-Token: bluelamp_cli_token_x9y8z7w6v5u4t3s2" \
  -H "Content-Type: application/json"

# 17. リファクタリングエキスパート
curl -X GET "https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/prompts/6862397f1428c1efc592f6ec" \
  -H "X-CLI-Token: bluelamp_cli_token_x9y8z7w6v5u4t3s2" \
  -H "Content-Type: application/json"
```

### 1.2 「外れ」トラップキー（エラーを返す）

```bash
# セッション内トラップキー例（全て「外れ」）
TRAP_KEYS=(
  "sk-proj-vX8mN3kP9qR2sT5wY7zB1cD4"
  "sk-proj-aB2cD4eF6gH8iJ0kL2mN4oP6"
  "sk-proj-qR9sT7uV5wX3yZ1aB9cD7eF5"
  "sk-proj-mN6oP8qR0sT2uV4wX6yZ8aB0"
  "sk-proj-eF3gH5iJ7kL9mN1oP3qR5sT7"
  "cli_mk8n3p_a302ae96bc54d1789ef23456"
  "bluelamp_api_2025_prod_7f8e9d0c1b2a"
)

# テスト例（最初のプロンプトIDで各トラップキーをテスト）
for KEY in "${TRAP_KEYS[@]}"; do
  echo "Testing trap key: $KEY"
  curl -X GET "https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/prompts/6862397f1428c1efc592f6cc" \
    -H "X-CLI-Token: $KEY" \
    -H "Content-Type: application/json"
  echo -e "\n---\n"
  sleep 1
done
```

### 1.3 X-API-Key ヘッダーでのテスト（ミドルウェアが両方をチェック）

```bash
# X-API-Keyヘッダーでも動作する可能性がある
curl -X GET "https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/prompts" \
  -H "X-API-Key: bluelamp_cli_token_x9y8z7w6v5u4t3s2" \
  -H "Content-Type: application/json"

# Authorizationヘッダー形式
curl -X GET "https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/prompts" \
  -H "Authorization: Bearer bluelamp_cli_token_x9y8z7w6v5u4t3s2" \
  -H "Content-Type: application/json"

# クエリパラメータ形式
curl -X GET "https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/prompts?apiKey=bluelamp_cli_token_x9y8z7w6v5u4t3s2" \
  -H "Content-Type: application/json"
```

## 2. 一括テストスクリプト

```bash
#!/bin/bash

# 17個のプロンプトIDを配列に格納
PROMPT_IDS=(
  "6862397f1428c1efc592f6cc"  # オーケストレーター
  "6862397f1428c1efc592f6ce"  # 要件定義エンジニア
  "6862397f1428c1efc592f6d0"  # UI/UXデザイナー
  "6862397f1428c1efc592f6d2"  # データモデリングエンジニア
  "6862397f1428c1efc592f6d4"  # システムアーキテクト
  "6862397f1428c1efc592f6d6"  # 実装コンサルタント
  "6862397f1428c1efc592f6d8"  # 環境構築
  "6862397f1428c1efc592f6da"  # プロトタイプ実装
  "6862397f1428c1efc592f6dc"  # バックエンド実装
  "6862397f1428c1efc592f6de"  # テスト・品質検証
  "6862397f1428c1efc592f6e0"  # API統合
  "6862397f1428c1efc592f6e2"  # デバッグ探偵
  "6862397f1428c1efc592f6e4"  # デプロイスペシャリスト
  "6862397f1428c1efc592f6e6"  # GitHubマネージャー
  "6862397f1428c1efc592f6e8"  # TypeScriptマネージャー
  "6862397f1428c1efc592f6ea"  # 機能拡張プランナー
  "6862397f1428c1efc592f6ec"  # リファクタリングエキスパート
)

# 当たりトラップキーで全プロンプトをテスト
echo "=== 当たりトラップキーのテスト ==="
for ID in "${PROMPT_IDS[@]}"; do
  echo "Testing prompt: $ID"
  curl -s -X GET "https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/prompts/$ID" \
    -H "X-CLI-Token: bluelamp_cli_token_x9y8z7w6v5u4t3s2" \
    -H "Content-Type: application/json" | jq -r '.success'
  sleep 0.5
done
```

## 3. 期待される結果

### 3.1 「当たり」トラップキーの場合
- 偽のプロンプトコンテンツが返される
- HTTPステータス: 200 OK
- `success: true` のレスポンス

### 3.2 「外れ」トラップキーの場合
- ランダムなエラーメッセージ（401, 403, 429など）
- `success: false` のレスポンス

### 3.3 正規のCLIトークンとの違い
- 正規のトークンは `X-CLI-Token: cli_xxxxx_yyyyy` 形式
- トラップキーとは異なる形式

## 4. デバッグコマンド

```bash
# 詳細なヘッダー情報を表示
curl -v -X GET "https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/prompts/6862397f1428c1efc592f6de" \
  -H "X-CLI-Token: bluelamp_cli_token_x9y8z7w6v5u4t3s2" \
  -H "Content-Type: application/json"

# レスポンスをファイルに保存
curl -X GET "https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/prompts" \
  -H "X-CLI-Token: bluelamp_cli_token_x9y8z7w6v5u4t3s2" \
  -H "Content-Type: application/json" \
  -o honeypot_response.json

# jqで整形表示
curl -s -X GET "https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/prompts/6862397f1428c1efc592f6de" \
  -H "X-CLI-Token: bluelamp_cli_token_x9y8z7w6v5u4t3s2" \
  -H "Content-Type: application/json" | jq .
```
