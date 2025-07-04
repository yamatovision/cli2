#!/usr/bin/env python3
"""
シンプルなPortal統合テスト
最小限の依存関係でPortal連携機能をテストする
"""
import asyncio
import aiohttp
import json
import os
from pathlib import Path

# 設定
PORTAL_BASE_URL = "http://localhost:8081"
CLI_TOKEN = "cli_mck4vu1i_76edd6c16d7d1f6de153babb17e8542fb1ab58fd15d25754316435dcf1375798"

# プロンプトマッピング（簡略版）
PROMPT_MAPPING = {
    'feature_extension.j2': '67d795ccc7e55b63256e5dd6',
    'orchestrator.j2': '6862397f1428c1efc592f6cc',
    'debug_detective.j2': '67d52839c9efa29641812d95',
}


async def test_portal_connection():
    """Portal接続テスト"""
    print("🔗 Portal接続テスト")
    print("-" * 40)
    
    try:
        async with aiohttp.ClientSession() as session:
            headers = {'X-CLI-Token': CLI_TOKEN}
            
            # プロンプト一覧取得
            async with session.get(f"{PORTAL_BASE_URL}/api/cli/prompts", headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get('success'):
                        prompts = data.get('data', {}).get('prompts', [])
                        print(f"✅ プロンプト一覧取得成功: {len(prompts)}件")
                        return True
                    else:
                        print(f"❌ API応答エラー: {data}")
                        return False
                else:
                    print(f"❌ HTTP エラー: {response.status}")
                    return False
                    
    except Exception as e:
        print(f"❌ 接続エラー: {e}")
        return False


async def test_specific_prompt_fetch():
    """特定プロンプト取得テスト"""
    print("\n📄 特定プロンプト取得テスト")
    print("-" * 40)
    
    try:
        async with aiohttp.ClientSession() as session:
            headers = {'X-CLI-Token': CLI_TOKEN}
            
            # 機能拡張プランナーのプロンプトを取得
            prompt_id = PROMPT_MAPPING['feature_extension.j2']
            url = f"{PORTAL_BASE_URL}/api/cli/prompts/{prompt_id}"
            
            async with session.get(url, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get('success'):
                        prompt = data.get('data', {}).get('prompt', {})
                        content = prompt.get('content', '')
                        title = prompt.get('title', '')
                        
                        print(f"✅ プロンプト取得成功")
                        print(f"   タイトル: {title}")
                        print(f"   内容: {len(content)}文字")
                        print(f"   プレビュー: {content[:100]}...")
                        
                        # 機能拡張プランナーの特徴的な文字列をチェック
                        if "機能拡張プランナー" in content:
                            print("✅ 正しいプロンプト内容を確認")
                            return True
                        else:
                            print("⚠️  期待されるプロンプト内容と異なる")
                            return False
                    else:
                        print(f"❌ API応答エラー: {data}")
                        return False
                else:
                    print(f"❌ HTTP エラー: {response.status}")
                    return False
                    
    except Exception as e:
        print(f"❌ 取得エラー: {e}")
        return False


async def test_prompt_mapping():
    """プロンプトマッピングテスト"""
    print("\n🗺️  プロンプトマッピングテスト")
    print("-" * 40)
    
    try:
        async with aiohttp.ClientSession() as session:
            headers = {'X-CLI-Token': CLI_TOKEN}
            
            success_count = 0
            total_count = len(PROMPT_MAPPING)
            
            for filename, prompt_id in PROMPT_MAPPING.items():
                url = f"{PORTAL_BASE_URL}/api/cli/prompts/{prompt_id}"
                
                async with session.get(url, headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        if data.get('success'):
                            prompt = data.get('data', {}).get('prompt', {})
                            title = prompt.get('title', '')
                            print(f"✅ {filename} → {title}")
                            success_count += 1
                        else:
                            print(f"❌ {filename} → API応答エラー")
                    else:
                        print(f"❌ {filename} → HTTP {response.status}")
            
            print(f"\n結果: {success_count}/{total_count} マッピング成功")
            return success_count == total_count
                    
    except Exception as e:
        print(f"❌ マッピングテストエラー: {e}")
        return False


async def test_auth_validation():
    """認証検証テスト"""
    print("\n🔐 認証検証テスト")
    print("-" * 40)
    
    try:
        async with aiohttp.ClientSession() as session:
            # 正しいトークンでのテスト
            headers = {'X-CLI-Token': CLI_TOKEN}
            async with session.get(f"{PORTAL_BASE_URL}/api/cli/prompts", headers=headers) as response:
                if response.status == 200:
                    print("✅ 正しいトークンで認証成功")
                else:
                    print(f"❌ 正しいトークンで認証失敗: {response.status}")
                    return False
            
            # 無効なトークンでのテスト
            headers = {'X-CLI-Token': 'invalid_token'}
            async with session.get(f"{PORTAL_BASE_URL}/api/cli/prompts", headers=headers) as response:
                if response.status == 401:
                    print("✅ 無効なトークンで正しく認証拒否")
                else:
                    print(f"❌ 無効なトークンで予期しない応答: {response.status}")
                    return False
            
            # トークンなしでのテスト
            async with session.get(f"{PORTAL_BASE_URL}/api/cli/prompts") as response:
                if response.status == 401:
                    print("✅ トークンなしで正しく認証拒否")
                    return True
                else:
                    print(f"❌ トークンなしで予期しない応答: {response.status}")
                    return False
                    
    except Exception as e:
        print(f"❌ 認証テストエラー: {e}")
        return False


async def main():
    """メインテスト関数"""
    print("🚀 Portal統合テスト開始")
    print("=" * 50)
    
    tests = [
        ("Portal接続", test_portal_connection),
        ("認証検証", test_auth_validation),
        ("特定プロンプト取得", test_specific_prompt_fetch),
        ("プロンプトマッピング", test_prompt_mapping),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = await test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name}テストでエラー: {e}")
            results.append((test_name, False))
    
    # 結果サマリー
    print("\n" + "=" * 50)
    print("📊 テスト結果サマリー")
    print("-" * 50)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
        if result:
            passed += 1
    
    print("-" * 50)
    print(f"合計: {passed}/{total} テスト通過")
    
    if passed == total:
        print("🎉 すべてのテストが通過しました！")
        print("\n✨ Portal統合機能は正常に動作しています")
        return 0
    else:
        print("⚠️  一部のテストが失敗しました。")
        return 1


if __name__ == "__main__":
    try:
        exit_code = asyncio.run(main())
        exit(exit_code)
    except KeyboardInterrupt:
        print("\n\n⚠️  テストが中断されました")
        exit(1)
    except Exception as e:
        print(f"\n\n❌ テスト実行エラー: {e}")
        exit(1)