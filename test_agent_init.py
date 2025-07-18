#!/usr/bin/env python3
"""
エージェント初期化プロセスのテストスクリプト
"""

import sys
import os

# パスを追加
sys.path.insert(0, '/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/cli2')

try:
    from core.agents.agent import Agent
    from core.config import AgentConfig, LLMConfig
    from core.llm.llm import LLM
    
    print("✅ 基本的なimport成功")
    
    # LLMの作成
    llm_config = LLMConfig()
    llm = LLM(config=llm_config)
    
    # RequirementsEngineerの詳細テスト
    print("\n🧪 RequirementsEngineer の詳細テスト:")
    
    # 1. デフォルトconfigでの作成
    print("  1. デフォルトconfigでの作成:")
    agent_cls = Agent.get_cls('RequirementsEngineer')
    agent1 = agent_cls(llm=llm)
    print(f"    config.system_prompt_filename: {agent1.config.system_prompt_filename}")
    
    # 2. 明示的なconfigでの作成
    print("  2. 明示的なconfigでの作成:")
    config = AgentConfig()
    print(f"    作成前のconfig.system_prompt_filename: {config.system_prompt_filename}")
    agent2 = agent_cls(llm=llm, config=config)
    print(f"    作成後のconfig.system_prompt_filename: {agent2.config.system_prompt_filename}")
    
    # 3. 初期化プロセスの詳細確認
    print("  3. 初期化プロセスの詳細確認:")
    print(f"    agent2.config is config: {agent2.config is config}")
    print(f"    id(agent2.config): {id(agent2.config)}")
    print(f"    id(config): {id(config)}")
    
    # 4. プロンプトマネージャーの確認
    print("  4. プロンプトマネージャーの確認:")
    pm = agent2.prompt_manager
    print(f"    PM.system_prompt_filename: {pm.system_prompt_filename}")
    print(f"    PM.config.system_prompt_filename: {agent2.config.system_prompt_filename}")
    
    # 5. 他のエージェントでも確認
    print("\n🧪 他のエージェントでの確認:")
    test_agents = ['DebugAgent', 'PageCreator']
    
    for agent_name in test_agents:
        agent_cls = Agent.get_cls(agent_name)
        agent = agent_cls(llm=llm)
        print(f"  {agent_name}: {agent.config.system_prompt_filename}")
        
except Exception as e:
    print(f"❌ エラー: {e}")
    import traceback
    traceback.print_exc()