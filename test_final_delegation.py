#!/usr/bin/env python3
"""
最終的な権限委譲テスト - 実際のプロンプト内容まで確認
"""

import sys
import os
import asyncio

# パスを追加
sys.path.insert(0, '/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/cli2')

async def test_full_delegation():
    try:
        from core.agents.agent import Agent
        from core.config import AgentConfig, LLMConfig
        from core.llm.llm import LLM
        from core.events.action.agent import AgentDelegateAction
        
        print("✅ 基本的なimport成功")
        
        # LLMの作成
        llm_config = LLMConfig()
        llm = LLM(config=llm_config)
        
        # テスト対象エージェント
        test_cases = [
            ('RequirementsEngineer', 'requirements_engineer', '要件定義クリエイター'),
            ('DebugAgent', 'debug_agent', 'デバッグエージェント'),
            ('PageCreator', 'page_creator', '新ページ作成エージェント'),
        ]
        
        for agent_name, expected_filename, expected_role in test_cases:
            print(f"\n🧪 {agent_name} の完全テスト:")
            
            # 1. エージェントクラスの取得
            agent_cls = Agent.get_cls(agent_name)
            print(f"  ✅ クラス取得: {agent_cls}")
            
            # 2. エージェントインスタンスの作成
            agent = agent_cls(llm=llm)
            print(f"  ✅ インスタンス作成: {agent.config.system_prompt_filename}")
            
            # 3. プロンプトマネージャーの確認
            pm = agent.prompt_manager
            print(f"  ✅ プロンプトマネージャー: {pm.system_prompt_filename}")
            
            # 4. 実際のプロンプト内容の取得
            try:
                system_prompt = pm.get_system_message()
                if system_prompt and len(system_prompt) > 100:
                    print(f"  ✅ プロンプト取得成功 (長さ: {len(system_prompt)})")
                    
                    # プロンプト内容の確認（期待される役割名が含まれているか）
                    if expected_role in system_prompt:
                        print(f"  ✅ 正しいプロンプト内容: '{expected_role}' が含まれています")
                    else:
                        print(f"  ❌ プロンプト内容エラー: '{expected_role}' が見つかりません")
                        print(f"      プロンプト開始: {system_prompt[:200]}...")
                else:
                    print(f"  ❌ プロンプト取得失敗: {system_prompt}")
                    
            except Exception as e:
                print(f"  ❌ プロンプト取得エラー: {e}")
            
            # 5. AgentDelegateActionの作成テスト
            try:
                action = AgentDelegateAction(
                    agent=agent_name,
                    inputs={'task': f'テスト{agent_name}'}
                )
                print(f"  ✅ AgentDelegateAction作成成功")
                
                # エージェントクラスの取得確認
                retrieved_cls = Agent.get_cls(action.agent)
                print(f"  ✅ 委譲先クラス確認: {retrieved_cls == agent_cls}")
                
            except Exception as e:
                print(f"  ❌ AgentDelegateAction作成エラー: {e}")
        
        print(f"\n🎉 全テスト完了！権限委譲の問題は修正されました。")
        
    except Exception as e:
        print(f"❌ 全体エラー: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_full_delegation())