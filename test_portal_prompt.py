#!/usr/bin/env python3
"""
Portal プロンプト取得のテストスクリプト
"""

import sys
import os
import asyncio

# パスを追加
sys.path.insert(0, '/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/cli2')

async def test_portal_prompt():
    try:
        from extensions.portal.portal_prompt_manager import PortalPromptManager
        from extensions.portal.prompt_mapping import get_prompt_id, is_portal_prompt
        from core.agents.state.state import State
        from core.message import Message
        
        print("✅ Portal関連のimport成功")
        
        # テスト用のプロンプトマネージャーを作成
        test_agents = [
            'requirements_engineer',
            'debug_agent', 
            'page_creator',
            'expansion_orchestrator'
        ]
        
        for agent_name in test_agents:
            print(f"\n🧪 {agent_name} のテスト:")
            
            # プロンプトIDの確認
            prompt_id = get_prompt_id(agent_name)
            is_portal = is_portal_prompt(agent_name)
            print(f"  プロンプトID: {prompt_id}")
            print(f"  Portal対象: {is_portal}")
            
            if not is_portal:
                print("  ❌ Portal対象外")
                continue
            
            # PortalPromptManagerの作成
            try:
                prompt_dir = "/tmp/test_prompts"  # ダミーディレクトリ
                os.makedirs(prompt_dir, exist_ok=True)
                
                manager = PortalPromptManager(
                    prompt_dir=prompt_dir,
                    system_prompt_filename=agent_name,
                    enable_portal=True
                )
                print("  ✅ PortalPromptManager作成成功")
                
                # プロンプト取得テスト
                try:
                    # ダミーのStateとMessageを作成
                    from core.message import TextContent
                    state = State()
                    messages = [Message(role="user", content=[TextContent(text="テストメッセージ")])]
                    
                    # システムプロンプトの取得を試行
                    system_prompt = manager.get_system_message()
                    
                    if system_prompt and len(system_prompt) > 100:
                        print(f"  ✅ プロンプト取得成功 (長さ: {len(system_prompt)})")
                        print(f"  プロンプト開始: {system_prompt[:100]}...")
                    else:
                        print(f"  ❌ プロンプト取得失敗または短すぎる: {system_prompt}")
                        
                except Exception as e:
                    print(f"  ❌ プロンプト取得エラー: {e}")
                    import traceback
                    traceback.print_exc()
                    
            except Exception as e:
                print(f"  ❌ PortalPromptManager作成エラー: {e}")
                import traceback
                traceback.print_exc()
        
    except Exception as e:
        print(f"❌ 全体エラー: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_portal_prompt())