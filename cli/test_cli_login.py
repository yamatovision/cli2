#!/usr/bin/env python3
"""CLIログインテスト"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from openhands.cli.auth import PortalAuthenticator

async def test_cli_login():
    print("=" * 60)
    print("CLI認証テスト")
    print("=" * 60)
    
    # ローカルPortalに接続
    auth = PortalAuthenticator("http://localhost:8080/api")
    
    # 既存の認証情報をクリア
    auth.clear_auth()
    print("既存の認証情報をクリアしました")
    
    # ログインテスト
    email = "shiraishi.tatsuya@mikoto.co.jp"
    password = "aikakumei"
    
    print(f"\nログイン情報:")
    print(f"  Email: {email}")
    print(f"  Password: {'*' * len(password)}")
    
    try:
        print("\nログイン中...")
        result = await auth.login_with_email_password(email, password)
        
        if result:
            print("\n✅ ログイン成功！")
            
            # 保存されたAPIキーを確認
            saved_key = auth.load_api_key()
            if saved_key:
                print(f"✅ CLI APIキーが保存されました: {saved_key[:20]}...")
                print(f"   保存場所: {auth.auth_file}")
                
                # 保存されたファイルの内容を確認
                if auth.auth_file.exists():
                    with open(auth.auth_file, 'r') as f:
                        import json
                        data = json.load(f)
                        print(f"   保存された内容: {list(data.keys())}")
            else:
                print("❌ APIキーの保存に失敗しました")
                
            # ユーザー情報を確認
            user_info = auth.get_user_info()
            if user_info:
                print(f"\nユーザー情報:")
                print(f"  名前: {user_info.get('name')}")
                print(f"  Email: {user_info.get('email')}")
                print(f"  ロール: {user_info.get('role')}")
        else:
            print("❌ ログインに失敗しました")
            
    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    asyncio.run(test_cli_login())