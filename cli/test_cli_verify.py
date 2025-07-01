#!/usr/bin/env python3
"""CLI APIキー検証テスト"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from openhands.cli.auth import PortalAuthenticator

async def test_cli_verify():
    print("=" * 60)
    print("CLI APIキー検証テスト")
    print("=" * 60)
    
    # ローカルPortalに接続
    auth = PortalAuthenticator("http://localhost:8080/api")
    
    # 保存されたAPIキーを読み込み
    api_key = auth.load_api_key()
    
    if not api_key:
        print("❌ 保存されたAPIキーが見つかりません")
        return
        
    print(f"保存されたAPIキー: {api_key[:20]}...")
    
    try:
        print("\nAPIキーを検証中...")
        result = await auth.verify_api_key(api_key)
        
        print("\n✅ APIキー検証成功！")
        print(f"ユーザー情報:")
        if 'user' in result:
            user = result['user']
            print(f"  名前: {user.get('name')}")
            print(f"  Email: {user.get('email')}")
            print(f"  ロール: {user.get('role')}")
        
    except ValueError as e:
        print(f"❌ 検証エラー: {e}")
    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    asyncio.run(test_cli_verify())