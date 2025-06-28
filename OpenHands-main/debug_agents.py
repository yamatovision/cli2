#!/usr/bin/env python3
"""エージェント登録状況のデバッグ"""

import sys
from pathlib import Path

# CLIパスを最優先で追加
cli_path = Path(__file__).parent / "cli"
sys.path.insert(0, str(cli_path))

print("=== エージェント登録状況デバッグ ===\n")

print(f"Python path: {sys.path[:3]}...")  # 最初の3つのパスを表示

try:
    # まずagenthubをインポート
    import openhands.agenthub as agenthub
    print(f"agenthub location: {agenthub.__file__}")
    
    # __all__を確認
    if hasattr(agenthub, '__all__'):
        print(f"agenthub.__all__: {agenthub.__all__}")
    else:
        print("agenthub.__all__ が見つかりません")
    
    # Agentクラスをインポート
    from openhands.controller.agent import Agent
    
    # 利用可能なエージェント一覧
    available_agents = Agent.list_agents()
    print(f"\n利用可能なエージェント ({len(available_agents)} 個):")
    for agent in sorted(available_agents):
        print(f"  - {agent}")
    
    # BlueLampエージェントの個別チェック
    print("\n=== BlueLampエージェント個別チェック ===")
    bluelamp_agents = [
        'BlueLampOrchestrator',
        'RequirementsEngineer',
        'FeatureExtension',
        'RefactoringExpert'
    ]
    
    for agent_name in bluelamp_agents:
        try:
            agent_class = Agent.get_cls(agent_name)
            print(f"✅ {agent_name}: {agent_class}")
        except Exception as e:
            print(f"❌ {agent_name}: {e}")

except Exception as e:
    print(f"❌ エラー: {e}")
    import traceback
    traceback.print_exc()