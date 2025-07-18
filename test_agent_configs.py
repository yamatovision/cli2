#!/usr/bin/env python3
"""
エージェント設定のテストスクリプト
"""

import sys
import os

# パスを追加
sys.path.insert(0, '/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/cli2')

try:
    from core.agents.agent import Agent
    from core.config import AgentConfig
    
    print("✅ 基本的なimport成功")
    
    # 各エージェントクラスの取得とデフォルト設定確認
    test_agents = [
        'RequirementsEngineer',
        'DebugAgent', 
        'PageCreator',
        'RefactoringEngineer'
    ]
    
    for agent_name in test_agents:
        try:
            print(f"\n🧪 {agent_name} のテスト:")
            
            # エージェントクラスの取得
            agent_cls = Agent.get_cls(agent_name)
            print(f"  ✅ クラス取得成功: {agent_cls}")
            
            # デフォルトconfigの作成
            default_config = AgentConfig()
            print(f"  デフォルトconfig.system_prompt_filename: {default_config.system_prompt_filename}")
            
            # エージェント固有のconfigがあるかチェック
            # （通常はエージェントクラス内で設定される）
            try:
                from core.llm.llm import LLM
                from core.config import LLMConfig
                
                llm_config = LLMConfig()
                llm = LLM(config=llm_config)
                
                # エージェントインスタンスの作成
                agent_instance = agent_cls(llm=llm, config=default_config)
                print(f"  エージェントconfig.system_prompt_filename: {agent_instance.config.system_prompt_filename}")
                
                # プロンプトマネージャーの確認
                if hasattr(agent_instance, 'prompt_manager'):
                    pm = agent_instance.prompt_manager
                    print(f"  プロンプトマネージャー: {type(pm)}")
                    if hasattr(pm, 'system_prompt_filename'):
                        print(f"  PM.system_prompt_filename: {pm.system_prompt_filename}")
                
            except Exception as e:
                print(f"  ❌ エージェントインスタンス作成エラー: {e}")
                
        except Exception as e:
            print(f"❌ {agent_name}: {e}")
            import traceback
            traceback.print_exc()
        
except Exception as e:
    print(f"❌ 全体エラー: {e}")
    import traceback
    traceback.print_exc()