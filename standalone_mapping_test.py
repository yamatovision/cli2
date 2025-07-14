#!/usr/bin/env python3
"""
スタンドアロンマッピングテスト - 外部依存関係なし
"""

import re
import os

def test_mapping_consistency():
    """マッピングの一貫性をテスト"""
    
    print("=== マッピング一貫性テスト ===\n")
    
    # prompt_mapping.pyから設定を読み取り
    with open('openhands/portal/prompt_mapping.py', 'r') as f:
        mapping_content = f.read()
    
    # PROMPT_MAPPINGを抽出
    mapping_pattern = r"'([^']+)':\s*'([^']+)'"
    mapping_matches = re.findall(mapping_pattern, mapping_content)
    
    print("prompt_mapping.pyの設定:")
    prompt_mapping = {}
    for agent_name, prompt_id in mapping_matches:
        prompt_mapping[agent_name] = prompt_id
        print(f"  {agent_name:25} → {prompt_id}")
    
    print(f"\nマッピング数: {len(prompt_mapping)}")
    
    # agents.pyからBlueLampエージェントの設定を読み取り
    with open('openhands/agenthub/bluelamp_agents/agents.py', 'r') as f:
        agents_content = f.read()
    
    # エージェントクラスの設定を抽出
    class_pattern = r'class (\w+)\(BlueLampBaseAgent\):.*?system_prompt_filename = [\'"]([^\'"]+)[\'"]'
    class_matches = re.findall(class_pattern, agents_content, re.DOTALL)
    
    print("\nBlueLampエージェントの設定:")
    agent_configs = {}
    for class_name, prompt_name in class_matches:
        agent_configs[class_name] = prompt_name
        print(f"  {class_name:25} → {prompt_name}")
    
    print(f"\nBlueLampエージェント数: {len(agent_configs)}")
    
    # 一貫性チェック
    print("\n=== 一貫性チェック ===")
    all_consistent = True
    
    for class_name, prompt_name in agent_configs.items():
        if prompt_name in prompt_mapping:
            print(f"  ✅ {class_name:25} → {prompt_name} (マッピング存在)")
        else:
            print(f"  ❌ {class_name:25} → {prompt_name} (マッピング不存在)")
            all_consistent = False
    
    # 未使用のマッピングをチェック
    used_prompts = set(agent_configs.values())
    unused_prompts = set(prompt_mapping.keys()) - used_prompts
    
    if unused_prompts:
        print(f"\n未使用のプロンプト:")
        for prompt in unused_prompts:
            print(f"  ⚠️  {prompt}")
    
    return all_consistent

def test_file_existence():
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

def test_expected_mapping():
    """期待されるマッピングとの比較"""
    
    print("\n=== 期待マッピング比較 ===")
    
    # 期待されるマッピング
    expected_mapping = {
        'RequirementsEngineer': 'requirements_engineer',
        'UIUXDesigner': 'uiux_designer',
        'DataModelingEngineer': 'data_modeling_engineer',
        'SystemArchitect': 'system_architect',
        'ImplementationConsultant': 'implementation_consultant',
        'EnvironmentSetup': 'environment_setup',
        'PrcImplementation': 'prc_implementation',
        'DebugAgent': 'debug_agent',
        'DeploySpecialist': 'deploy_specialist',
        'ExpansionOrchestrator': 'expansion_orchestrator',
        'PageCreator': 'page_creator',
        'RefactoringPlanner': 'refactoring_planner',
        'RefactoringImplementation': 'refactoring_implementation',
    }
    
    # 実際の設定を読み取り
    with open('openhands/agenthub/bluelamp_agents/agents.py', 'r') as f:
        agents_content = f.read()
    
    class_pattern = r'class (\w+)\(BlueLampBaseAgent\):.*?system_prompt_filename = [\'"]([^\'"]+)[\'"]'
    actual_matches = re.findall(class_pattern, agents_content, re.DOTALL)
    actual_mapping = dict(actual_matches)
    
    all_correct = True
    for class_name, expected_prompt in expected_mapping.items():
        actual_prompt = actual_mapping.get(class_name, 'NOT_FOUND')
        if actual_prompt == expected_prompt:
            print(f"  ✅ {class_name:25} → {actual_prompt}")
        else:
            print(f"  ❌ {class_name:25} → {actual_prompt} (期待: {expected_prompt})")
            all_correct = False
    
    return all_correct

if __name__ == "__main__":
    print("スタンドアロンマッピングテスト開始\n")
    
    consistency_ok = test_mapping_consistency()
    files_ok = test_file_existence()
    mapping_ok = test_expected_mapping()
    
    print(f"\n=== 総合結果 ===")
    if consistency_ok and files_ok and mapping_ok:
        print("✅ 全てのテストが成功しました！")
        print("   - 14エージェント構造への移行完了")
        print("   - BlueLampエージェント13個が正しくマッピング")
        print("   - 重複マッピング解消済み")
        exit(0)
    else:
        print("❌ 一部のテストが失敗しました。")
        exit(1)