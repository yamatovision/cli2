#!/usr/bin/env python3
"""
最終統合テスト
Portal統合機能の完全なテストスイート
"""
import asyncio
import sys
from pathlib import Path
import tempfile
import json

# 独立したPortal統合モジュールをインポート
from portal_integration import PortalIntegration, fetch_prompt, test_portal_connection


async def test_complete_workflow():
    """完全なワークフローテスト"""
    print("🔄 完全ワークフローテスト")
    print("-" * 50)
    
    portal = PortalIntegration()
    
    # 1. 認証状態確認
    print("1. 認証状態確認...")
    token = portal.load_token()
    if token:
        print(f"   ✅ 保存済みトークン: {token[:20]}...")
    else:
        print("   ❌ トークンが見つかりません")
        return False
    
    # 2. 接続テスト
    print("2. Portal接続テスト...")
    if await portal.test_connection():
        print("   ✅ Portal接続成功")
    else:
        print("   ❌ Portal接続失敗")
        return False
    
    # 3. プロンプト一覧取得
    print("3. プロンプト一覧取得...")
    prompts = await portal.get_available_prompts()
    if prompts and len(prompts) > 0:
        print(f"   ✅ プロンプト一覧取得成功: {len(prompts)}件")
    else:
        print("   ❌ プロンプト一覧取得失敗")
        return False
    
    # 4. 特定プロンプト取得（複数）
    print("4. 特定プロンプト取得テスト...")
    test_prompts = [
        'feature_extension.j2',
        'orchestrator.j2',
        'debug_detective.j2'
    ]
    
    for filename in test_prompts:
        content = await portal.fetch_prompt_by_filename(filename)
        if content and len(content) > 100:
            print(f"   ✅ {filename}: {len(content)}文字")
        else:
            print(f"   ❌ {filename}: 取得失敗")
            return False
    
    # 5. ファイル保存テスト
    print("5. ファイル保存テスト...")
    with tempfile.TemporaryDirectory() as temp_dir:
        output_path = Path(temp_dir) / "test_prompt.j2"
        
        if await portal.save_prompt_to_file('feature_extension.j2', output_path):
            print(f"   ✅ ファイル保存成功: {output_path}")
            
            # ファイル内容確認
            with open(output_path, 'r', encoding='utf-8') as f:
                saved_content = f.read()
            
            if "機能拡張プランナー" in saved_content:
                print("   ✅ ファイル内容確認成功")
            else:
                print("   ❌ ファイル内容が期待と異なる")
                return False
        else:
            print("   ❌ ファイル保存失敗")
            return False
    
    print("✅ 完全ワークフローテスト成功")
    return True


async def test_convenience_functions():
    """便利関数テスト"""
    print("\n🛠️  便利関数テスト")
    print("-" * 50)
    
    # 1. test_portal_connection関数
    print("1. test_portal_connection関数...")
    if await test_portal_connection():
        print("   ✅ test_portal_connection() 成功")
    else:
        print("   ❌ test_portal_connection() 失敗")
        return False
    
    # 2. fetch_prompt関数
    print("2. fetch_prompt関数...")
    content = await fetch_prompt('feature_extension.j2')
    if content and len(content) > 100:
        print(f"   ✅ fetch_prompt() 成功: {len(content)}文字")
    else:
        print("   ❌ fetch_prompt() 失敗")
        return False
    
    print("✅ 便利関数テスト成功")
    return True


async def test_error_handling():
    """エラーハンドリングテスト"""
    print("\n⚠️  エラーハンドリングテスト")
    print("-" * 50)
    
    portal = PortalIntegration()
    
    # 1. 存在しないプロンプトファイル
    print("1. 存在しないプロンプトファイルテスト...")
    content = await portal.fetch_prompt_by_filename('nonexistent.j2')
    if content is None:
        print("   ✅ 存在しないファイルで正しくNoneを返す")
    else:
        print("   ❌ 存在しないファイルで予期しない結果")
        return False
    
    # 2. 無効なプロンプトID
    print("2. 無効なプロンプトIDテスト...")
    content = await portal.fetch_prompt_by_id('invalid_id')
    if content is None:
        print("   ✅ 無効なIDで正しくNoneを返す")
    else:
        print("   ❌ 無効なIDで予期しない結果")
        return False
    
    # 3. プロンプトマッピング確認
    print("3. プロンプトマッピング確認...")
    if portal.is_portal_prompt('feature_extension.j2'):
        print("   ✅ 既知のファイルを正しく認識")
    else:
        print("   ❌ 既知のファイルの認識に失敗")
        return False
    
    if not portal.is_portal_prompt('unknown.j2'):
        print("   ✅ 未知のファイルを正しく認識")
    else:
        print("   ❌ 未知のファイルの認識に失敗")
        return False
    
    print("✅ エラーハンドリングテスト成功")
    return True


async def test_performance():
    """パフォーマンステスト"""
    print("\n⚡ パフォーマンステスト")
    print("-" * 50)
    
    import time
    
    portal = PortalIntegration()
    
    # 1. 複数プロンプトの並列取得
    print("1. 複数プロンプト並列取得テスト...")
    start_time = time.time()
    
    tasks = [
        portal.fetch_prompt_by_filename('feature_extension.j2'),
        portal.fetch_prompt_by_filename('orchestrator.j2'),
        portal.fetch_prompt_by_filename('debug_detective.j2'),
    ]
    
    results = await asyncio.gather(*tasks)
    end_time = time.time()
    
    success_count = sum(1 for result in results if result is not None)
    elapsed = end_time - start_time
    
    print(f"   ✅ 並列取得完了: {success_count}/3 成功, {elapsed:.2f}秒")
    
    if success_count == 3 and elapsed < 10:  # 10秒以内
        print("   ✅ パフォーマンス良好")
    else:
        print("   ⚠️  パフォーマンスに問題の可能性")
        return False
    
    print("✅ パフォーマンステスト成功")
    return True


def test_cli_commands():
    """CLIコマンドテスト"""
    print("\n💻 CLIコマンドテスト")
    print("-" * 50)
    
    import subprocess
    
    cli_script = Path(__file__).parent / "portal_integration.py"
    
    # 1. テストコマンド
    print("1. テストコマンド...")
    result = subprocess.run([sys.executable, str(cli_script), "test"], 
                          capture_output=True, text=True)
    if result.returncode == 0:
        print("   ✅ CLIテストコマンド成功")
    else:
        print(f"   ❌ CLIテストコマンド失敗: {result.stderr}")
        return False
    
    # 2. 一覧コマンド
    print("2. 一覧コマンド...")
    result = subprocess.run([sys.executable, str(cli_script), "list"], 
                          capture_output=True, text=True)
    if result.returncode == 0 and "利用可能なプロンプト" in result.stdout:
        print("   ✅ CLI一覧コマンド成功")
    else:
        print(f"   ❌ CLI一覧コマンド失敗: {result.stderr}")
        return False
    
    # 3. プロンプト取得コマンド
    print("3. プロンプト取得コマンド...")
    with tempfile.NamedTemporaryFile(suffix='.j2', delete=False) as tmp_file:
        tmp_path = tmp_file.name
    
    try:
        result = subprocess.run([
            sys.executable, str(cli_script), "fetch", 
            "feature_extension.j2", "-o", tmp_path
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            # ファイルが作成されたか確認
            if Path(tmp_path).exists():
                with open(tmp_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                if "機能拡張プランナー" in content:
                    print("   ✅ CLIプロンプト取得コマンド成功")
                else:
                    print("   ❌ CLIプロンプト取得コマンド: 内容が期待と異なる")
                    return False
            else:
                print("   ❌ CLIプロンプト取得コマンド: ファイルが作成されない")
                return False
        else:
            print(f"   ❌ CLIプロンプト取得コマンド失敗: {result.stderr}")
            return False
    finally:
        # クリーンアップ
        if Path(tmp_path).exists():
            Path(tmp_path).unlink()
    
    print("✅ CLIコマンドテスト成功")
    return True


async def main():
    """メインテスト関数"""
    print("🚀 最終統合テスト開始")
    print("=" * 60)
    
    tests = [
        ("完全ワークフロー", test_complete_workflow),
        ("便利関数", test_convenience_functions),
        ("エラーハンドリング", test_error_handling),
        ("パフォーマンス", test_performance),
        ("CLIコマンド", test_cli_commands),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            if asyncio.iscoroutinefunction(test_func):
                result = await test_func()
            else:
                result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name}テストでエラー: {e}")
            results.append((test_name, False))
    
    # 結果サマリー
    print("\n" + "=" * 60)
    print("📊 最終テスト結果サマリー")
    print("-" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
        if result:
            passed += 1
    
    print("-" * 60)
    print(f"合計: {passed}/{total} テスト通過")
    
    if passed == total:
        print("🎉 すべてのテストが通過しました！")
        print("\n✨ Portal統合機能は完全に動作しています")
        print("\n🎯 実装完了:")
        print("   • Portal側: 認証付きプロンプト取得API")
        print("   • CLI側: 独立したPortal統合モジュール")
        print("   • 認証: CLIトークンベース認証")
        print("   • プロンプト取得: 17個のプロンプトマッピング")
        print("   • エラーハンドリング: 完全対応")
        print("   • CLIコマンド: 完全対応")
        return 0
    else:
        print("⚠️  一部のテストが失敗しました。")
        return 1


if __name__ == "__main__":
    try:
        exit_code = asyncio.run(main())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n\n⚠️  テストが中断されました")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ テスト実行エラー: {e}")
        sys.exit(1)