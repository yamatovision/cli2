#!/usr/bin/env python3
"""
シンプルなマッピングテスト - 依存関係を最小限に
"""

import sys
import os
sys.path.insert(0, os.path.abspath('.'))

def test_prompt_mapping():
    """prompt_mapping.pyの内容を直接テスト"""
    
    print("=== prompt_mapping.py テスト ===\n")
    
    try:
        from openhands.portal.prompt_mapping import get_prompt_id_by_agent_name, get_all_agents
        
        # 利用可能なエージェント一覧を取得
        available_agents = get_all_agents()
        print("利用可能なエージェント:")
        for i, agent_name in enumerate(available_agents):
            print(f"  {i:02d}: {agent_name}")
        
        print(f"\n総エージェント数: {len(available_agents)}")
        
        # 各エージェントのIDマッピングをテスト
        print("\n=== IDマッピングテスト ===")
        for agent_name in available_agents:
            try:
                prompt_id = get_prompt_id_by_agent_name(agent_name)
                print(f"  {agent_name:25} → ID: {prompt_id:02d}")
            except Exception as e:
                print(f"  {agent_name:25} → ERROR: {e}")
        
        return True
        
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def test_agent_files():
    """エージェントファイルの存在確認"""
    
    print("\n=== エージェントファイル存在確認 ===")
    
    agent_dir = "openhands/portal/agent"
    expected_files = [
        "00-orchestrator.md",
        "01-requirements-engineer.md", 
        "02-uiux-designer.md",
        "03-data-modeling-engineer.md",
        "04-system-architect.md",
        "05-implementation-consultant.md",
        "06-environment-setup.md",
        "07-prc-implementation-agent.md",
        "08-debug-agent.md",
        "09-deploy-specialist.md",
        "10-expansionOrchestrator.md",
        "11-page-creator.md",
        "12-refactoring-agent.md",
        "13-refactoring-implementation-agent.md",
    ]
    
    all_exist = True
    for filename in expected_files:
        filepath = os.path.join(agent_dir, filename)
        if os.path.exists(filepath):
            print(f"  ✅ {filename}")
        else:
            print(f"  ❌ {filename} (NOT FOUND)")
            all_exist = False
    
    return all_exist

def test_bluelamp_agents_config():
    """BlueLampエージェントの設定を直接確認"""
    
    print("\n=== BlueLampエージェント設定確認 ===")
    
    try:
        # agents.pyファイルを読み込んで設定を確認
        with open('openhands/agenthub/bluelamp_agents/agents.py', 'r') as f:
            content = f.read()
        
        # 各エージェントクラスの設定を抽出
        import re
        
        # クラス定義とその設定を抽出
        class_pattern = r'class (\w+)\(BlueLampBaseAgent\):.*?system_prompt_filename = [\'"]([^\'"]+)[\'"]'
        matches = re.findall(class_pattern, content, re.DOTALL)
        
        print("BlueLampエージェントの設定:")
        for class_name, prompt_name in matches:
            print(f"  {class_name:25} → {prompt_name}")
        
        print(f"\n設定されたエージェント数: {len(matches)}")
        
        return True
        
    except Exception as e:
        print(f"ERROR: {e}")
        return False

if __name__ == "__main__":
    print("シンプルマッピングテスト開始\n")
    
    mapping_ok = test_prompt_mapping()
    files_ok = test_agent_files()
    config_ok = test_bluelamp_agents_config()
    
    print(f"\n=== 総合結果 ===")
    if mapping_ok and files_ok and config_ok:
        print("✅ 全てのテストが成功しました！")
        sys.exit(0)
    else:
        print("❌ 一部のテストが失敗しました。")
        sys.exit(1)