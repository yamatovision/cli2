#!/usr/bin/env python3
"""
権限委譲のテストスクリプト
"""

import sys
import os

# パスを追加
sys.path.insert(0, '/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/cli2')

try:
    # 必要なimport
    from core.agents.agent import Agent
    from core.events.action import AgentDelegateAction
    from core.agents.bluelamp_agents import *
    
    print("✅ 基本的なimport成功")
    
    # 権限委譲アクションの作成テスト
    print("\n🧪 AgentDelegateAction作成テスト:")
    
    test_cases = [
        ('RequirementsEngineer', {'task': 'テスト要件定義'}),
        ('DebugAgent', {'task': 'テストデバッグ'}),
        ('PageCreator', {'task': 'テストページ作成'}),
    ]
    
    for agent_name, inputs in test_cases:
        try:
            # AgentDelegateActionの作成
            action = AgentDelegateAction(
                agent=agent_name,
                inputs=inputs
            )
            print(f"✅ {agent_name}: AgentDelegateAction作成成功")
            print(f"   - agent: {action.agent}")
            print(f"   - inputs: {action.inputs}")
            
            # エージェントクラスの取得テスト
            agent_cls = Agent.get_cls(agent_name)
            print(f"   - class: {agent_cls}")
            
        except Exception as e:
            print(f"❌ {agent_name}: {e}")
            import traceback
            traceback.print_exc()
    
    print("\n📋 全登録エージェント:")
    for name in Agent.list_agents():
        print(f"  - {name}")
        
except Exception as e:
    print(f"❌ エラー: {e}")
    import traceback
    traceback.print_exc()