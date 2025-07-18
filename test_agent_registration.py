#!/usr/bin/env python3
"""
エージェント登録のテストスクリプト
"""

import sys
import os

# パスを追加
sys.path.insert(0, '/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/cli2')

try:
    # 基本的なimport
    from core.agents.agent import Agent
    print("✅ Agent クラスのimport成功")
    
    # 初期状態の確認
    print(f"📋 初期登録エージェント数: {len(Agent._registry)}")
    if Agent._registry:
        print(f"📋 初期登録エージェント: {list(Agent._registry.keys())}")
    
    # bluelamp_agents をimport
    print("\n🔄 bluelamp_agents をimport中...")
    from core.agents.bluelamp_agents import *
    print("✅ bluelamp_agents のimport成功")
    
    # import後の状態確認
    print(f"📋 import後のエージェント数: {len(Agent._registry)}")
    print(f"📋 登録済みエージェント: {list(Agent._registry.keys())}")
    
    # 特定のエージェントの取得テスト
    test_agents = [
        'RequirementsEngineer',
        'DebugAgent', 
        'PageCreator',
        'RefactoringEngineer'
    ]
    
    print("\n🧪 エージェント取得テスト:")
    for agent_name in test_agents:
        try:
            agent_cls = Agent.get_cls(agent_name)
            print(f"✅ {agent_name}: {agent_cls}")
        except Exception as e:
            print(f"❌ {agent_name}: {e}")
            
except Exception as e:
    print(f"❌ エラー: {e}")
    import traceback
    traceback.print_exc()