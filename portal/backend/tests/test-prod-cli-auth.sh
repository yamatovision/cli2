#!/bin/bash

# 本番環境CLI認証テストスクリプト
# 色定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 本番環境URL
BASE_URL="https://bluelamp-235426778039.asia-northeast1.run.app/api/cli"

echo -e "${YELLOW}=== 本番環境CLI認証テスト ===${NC}"
echo "エンドポイント: $BASE_URL"
echo ""

# 1. ヘルスチェック
echo -e "${YELLOW}1. APIヘルスチェック${NC}"
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/../" | tail -n 1)
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ APIは正常に動作しています${NC}"
else
    echo -e "${RED}✗ APIが応答しません (HTTP $HEALTH_RESPONSE)${NC}"
    exit 1
fi

# 2. 無効な認証情報でのテスト
echo -e "\n${YELLOW}2. 無効な認証情報でのテスト${NC}"
INVALID_RESPONSE=$(curl -s -X POST "$BASE_URL/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"invalid@example.com","password":"wrongpassword"}' \
    -w "\n%{http_code}" | tail -n 1)

if [ "$INVALID_RESPONSE" = "401" ]; then
    echo -e "${GREEN}✓ 無効な認証情報を正しく拒否しました${NC}"
else
    echo -e "${RED}✗ 予期しないレスポンス (HTTP $INVALID_RESPONSE)${NC}"
fi

# 3. 実際のユーザーでのテスト（手動入力）
echo -e "\n${YELLOW}3. 実際のユーザーでのテスト${NC}"
echo "テストするユーザーの認証情報を入力してください："
read -p "Email: " EMAIL
read -s -p "Password: " PASSWORD
echo ""

# ログインテスト
echo -e "\n${YELLOW}ログインテスト中...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"deviceInfo\":{\"deviceName\":\"CLI Test\",\"platform\":\"test\"}}")

# レスポンスの解析
if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ ログイン成功！${NC}"
    
    # トークンを抽出
    TOKEN=$(echo "$LOGIN_RESPONSE" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
    echo "トークン: ${TOKEN:0:30}..."
    
    # トークン検証テスト
    echo -e "\n${YELLOW}4. トークン検証テスト${NC}"
    VERIFY_RESPONSE=$(curl -s -X POST "$BASE_URL/verify" \
        -H "Content-Type: application/json" \
        -H "X-CLI-Token: $TOKEN")
    
    if echo "$VERIFY_RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✓ トークン検証成功！${NC}"
        echo "$VERIFY_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$VERIFY_RESPONSE"
    else
        echo -e "${RED}✗ トークン検証失敗${NC}"
        echo "$VERIFY_RESPONSE"
    fi
    
    # ログアウトテスト
    echo -e "\n${YELLOW}5. ログアウトテスト${NC}"
    read -p "ログアウトテストを実行しますか？ (y/n): " LOGOUT_CONFIRM
    if [ "$LOGOUT_CONFIRM" = "y" ]; then
        LOGOUT_RESPONSE=$(curl -s -X POST "$BASE_URL/logout" \
            -H "Content-Type: application/json" \
            -H "X-CLI-Token: $TOKEN")
        
        if echo "$LOGOUT_RESPONSE" | grep -q '"success":true'; then
            echo -e "${GREEN}✓ ログアウト成功！${NC}"
        else
            echo -e "${RED}✗ ログアウト失敗${NC}"
            echo "$LOGOUT_RESPONSE"
        fi
    fi
else
    echo -e "${RED}✗ ログイン失敗${NC}"
    echo "$LOGIN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LOGIN_RESPONSE"
fi

echo -e "\n${YELLOW}=== テスト完了 ===${NC}"