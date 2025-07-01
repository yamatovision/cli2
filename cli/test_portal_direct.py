#!/usr/bin/env python3
"""Portal側でCLI APIキー生成をテストするスクリプト"""
import requests
import json

# MongoDBのユーザーIDを直接使用してCLI APIキーを生成する
base_url = "http://localhost:8080"

# 管理者権限でログイン
login_data = {
    "email": "shiraishi.tatsuya@mikoto.co.jp",
    "password": "aikakumei",
    "clientType": "portal"
}

print("1. Portalにログイン...")
response = requests.post(f"{base_url}/api/simple/auth/login", json=login_data)
if response.status_code != 200:
    print(f"ログイン失敗: {response.text}")
    exit(1)

auth_data = response.json()
access_token = auth_data['data']['accessToken']
user_id = auth_data['data']['user']['id']

print(f"ログイン成功: {auth_data['data']['user']['name']}")
print(f"ユーザーID: {user_id}")

# ユーザー情報を取得して現在のCLI APIキーを確認
headers = {"Authorization": f"Bearer {access_token}"}
print("\n2. 現在のユーザー情報を取得...")
response = requests.get(f"{base_url}/api/simple/users/{user_id}", headers=headers)
if response.status_code == 200:
    user_data = response.json()
    print(f"現在のCLI APIキー数: {len(user_data['data'].get('cliApiKeys', []))}")
    if user_data['data'].get('cliApiKeys'):
        for idx, key in enumerate(user_data['data']['cliApiKeys']):
            print(f"  キー{idx+1}: {key['key'][:20]}... (active: {key.get('isActive', False)})")

# CLIクライアントで再度ログイン
print("\n3. CLIクライアントでログイン...")
login_data['clientType'] = 'cli'
response = requests.post(f"{base_url}/api/simple/auth/login", json=login_data)
print(f"Response Status: {response.status_code}")
print("Response Body:")
print(json.dumps(response.json(), indent=2, ensure_ascii=False))

if response.status_code == 200:
    cli_data = response.json()
    if 'cliApiKey' in cli_data['data']:
        print(f"\n✅ CLI APIキーが発行されました: {cli_data['data']['cliApiKey'][:20]}...")
    else:
        print("\n❌ CLI APIキーがレスポンスに含まれていません")
        print(f"レスポンスのキー: {list(cli_data['data'].keys())}")