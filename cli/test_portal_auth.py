#!/usr/bin/env python3
"""Portal認証のテストスクリプト"""
import asyncio
import aiohttp
import json
import logging

# ロギング設定
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

async def test_portal_login():
    """Portal APIへの直接ログインテスト"""
    # Portal APIのエンドポイント（本番）
    base_url = "https://bluelamp-235426778039.asia-northeast1.run.app/api"
    login_url = f"{base_url}/simple/auth/login"
    
    # テスト用のログイン情報
    payload = {
        "email": "shiraishi.tatsuya@mikoto.co.jp",
        "password": "aikakumei",
        "clientType": "cli"
    }
    
    print("=" * 60)
    print("Portal認証テスト")
    print("=" * 60)
    print(f"URL: {login_url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    print("-" * 60)
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(login_url, json=payload) as response:
                # レスポンスステータス
                print(f"Response Status: {response.status}")
                print(f"Response Headers: {dict(response.headers)}")
                print("-" * 60)
                
                # レスポンスボディ
                try:
                    data = await response.json()
                    print("Response Body:")
                    print(json.dumps(data, indent=2, ensure_ascii=False))
                except Exception as e:
                    print(f"Failed to parse JSON: {e}")
                    text = await response.text()
                    print(f"Raw response: {text}")
                
                print("-" * 60)
                
                # API keyの確認
                if response.status == 200 and isinstance(data, dict):
                    if data.get("success"):
                        response_data = data.get("data", {})
                        
                        # cliApiKeyの確認
                        cli_api_key = response_data.get("cliApiKey")
                        print(f"✅ cliApiKey found: {cli_api_key[:20] + '...' if cli_api_key else 'None'}")
                        
                        # apiKeyオブジェクトの確認
                        api_key_obj = response_data.get("apiKey")
                        if api_key_obj:
                            print(f"✅ apiKey object found: {api_key_obj}")
                            if isinstance(api_key_obj, dict):
                                key_value = api_key_obj.get("keyValue")
                                print(f"  - keyValue: {key_value[:20] + '...' if key_value else 'None'}")
                        
                        # ユーザー情報の確認
                        user = response_data.get("user")
                        if user:
                            print(f"✅ User info found: {user.get('name')} ({user.get('email')})")
                        
                        # その他のフィールドを表示
                        print(f"\nAll response data keys: {list(response_data.keys())}")
                    else:
                        print(f"❌ Login failed: {data.get('message', 'Unknown error')}")
                else:
                    print(f"❌ Unexpected response status: {response.status}")
                    
        except Exception as e:
            print(f"❌ Error during request: {e}")
            logger.exception("Request failed")

async def main():
    """メイン処理"""
    await test_portal_login()

if __name__ == "__main__":
    asyncio.run(main())