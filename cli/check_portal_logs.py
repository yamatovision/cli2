#!/usr/bin/env python3
"""Portal側のログを確認するための簡易スクリプト"""
import requests
import json
import time

# ローカルPortalサーバー
base_url = "http://localhost:8080/api"

print("=" * 60)
print("Portal CLI認証テスト - ログ確認用")
print("=" * 60)

# CLIクライアントでログイン
login_data = {
    "email": "shiraishi.tatsuya@mikoto.co.jp", 
    "password": "aikakumei",
    "clientType": "cli"
}

print(f"\n1. リクエスト送信:")
print(f"   URL: {base_url}/simple/auth/login")
print(f"   データ: {json.dumps(login_data, indent=2)}")

print("\n2. レスポンス待機中...")
print("   (Portal側のコンソールログを確認してください)")
print("   特に以下のログを探してください:")
print("   - 'CLI認証: CLI APIキーを自動発行'")
print("   - 'CLI認証: generateCliApiKey呼び出し前'")
print("   - 'CLI認証: generateCliApiKeyの返り値'")
print("   - 'generateCliApiKey: 新しいキーを生成'")
print("   - 'generateCliApiKey: 保存成功'")

# リクエスト送信
response = requests.post(f"{base_url}/simple/auth/login", json=login_data)

print(f"\n3. レスポンス受信:")
print(f"   Status: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    print(f"   成功: {data.get('success')}")
    print(f"   メッセージ: {data.get('message')}")
    
    if 'data' in data:
        print(f"\n4. レスポンスデータ:")
        print(f"   キー一覧: {list(data['data'].keys())}")
        
        if 'cliApiKey' in data['data']:
            print(f"   ✅ CLI APIキー: {data['data']['cliApiKey'][:20]}...")
        else:
            print(f"   ❌ CLI APIキーが含まれていません")
            
        if 'user' in data['data']:
            user = data['data']['user']
            print(f"   ユーザー: {user.get('name')} ({user.get('email')})")
else:
    print(f"   エラー: {response.text}")

print("\n" + "=" * 60)
print("Portal側のコンソールログを確認してください")
print("=" * 60)