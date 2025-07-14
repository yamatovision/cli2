#!/usr/bin/env python3
"""
14エージェント構造のマッピングテスト
各BlueLampエージェントが正しいプロンプトにマッピングされているかを確認
"""

import sys
import os
sys.path.insert(0, os.path.abspath('.'))

from openhands.agenthub.bluelamp_agents import (
    RequirementsEngineer,
    UIUXDesigner,
    DataModelingEngineer,
    SystemArchitect,
    ImplementationConsultant,
    EnvironmentSetup,
    PrcImplementation,
    DebugAgent,
    DeploySpecialist,
    ExpansionOrchestrator,
    PageCreator,
    RefactoringPlanner,
    RefactoringImplementation,
)
from openhands.portal.prompt_mapping import get_prompt_id_by_agent_name, get_all_agents
from openhands.core.config import AgentConfig

def test_agent_mapping():
    """各BlueLampエージェントのマッピングをテスト"""
    
    print("=== 14エージェント構造マッピングテスト ===\n")
    
    # テスト対象エージェントとその期待されるプロンプト名
    test_cases = [
        (RequirementsEngineer, 'requirements_engineer', '01'),
        (UIUXDesigner, 'uiux_designer', '02'),
        (DataModelingEngineer, 'data_modeling_engineer', '03'),
        (SystemArchitect, 'system_architect', '04'),
        (ImplementationConsultant, 'implementation_consultant', '05'),
        (EnvironmentSetup, 'environment_setup', '06'),
        (PrcImplementation, 'prc_implementation', '07'),
        (DebugAgent, 'debug_agent', '08'),
        (DeploySpecialist, 'deploy_specialist', '09'),
        (ExpansionOrchestrator, 'expansion_orchestrator', '10'),
        (PageCreator, 'page_creator', '11'),
        (RefactoringPlanner, 'refactoring_planner', '12'),
        (RefactoringImplementation, 'refactoring_implementation', '13'),
    ]
    
    all_passed = True
    
    for agent_class, expected_agent_name, expected_id in test_cases:
        try:
            # エージェントインスタンスを作成
            config = AgentConfig()
            agent = agent_class(llm=None, config=config)
            
            # 設定されたプロンプト名を取得
            actual_agent_name = config.system_prompt_filename
            
            # プロンプトIDを取得
            try:
                prompt_id = get_prompt_id_by_agent_name(actual_agent_name)
                prompt_id_str = f"{prompt_id:02d}"
            except Exception as e:
                prompt_id_str = f"ERROR: {e}"
            
            # テスト結果
            status = "✅ PASS" if actual_agent_name == expected_agent_name else "❌ FAIL"
            id_status = "✅" if prompt_id_str == expected_id else "❌"
            
            print(f"{agent_class.__name__:25} → {actual_agent_name:25} (ID: {prompt_id_str}) {status} {id_status}")
            
            if actual_agent_name != expected_agent_name:
                print(f"  Expected: {expected_agent_name}")
                all_passed = False
                
        except Exception as e:
            print(f"{agent_class.__name__:25} → ERROR: {e}")
            all_passed = False
    
    print(f"\n=== 利用可能なエージェント一覧 ===")
    available_agents = get_all_agents()
    for i, agent_name in enumerate(available_agents):
        print(f"{i:02d}: {agent_name}")
    
    print(f"\n=== テスト結果 ===")
    if all_passed:
        print("✅ 全てのマッピングが正常です！")
    else:
        print("❌ 一部のマッピングに問題があります。")
    
    return all_passed

def test_portal_api_connection():
    """Portal APIへの接続テスト"""
    print("\n=== Portal API接続テスト ===")
    
    try:
        from openhands.portal.prompt_manager import PortalPromptManager
        
        # orchestratorプロンプトを取得してテスト
        manager = PortalPromptManager('orchestrator')
        prompt = manager.get_system_prompt()
        
        if prompt and len(prompt) > 0:
            print("✅ Portal API接続成功")
            print(f"   orchestratorプロンプト長: {len(prompt)} 文字")
            print(f"   プロンプト開始: {prompt[:100]}...")
            return True
        else:
            print("❌ Portal APIからプロンプトを取得できませんでした")
            return False
            
    except Exception as e:
        print(f"❌ Portal API接続エラー: {e}")
        return False

if __name__ == "__main__":
    print("BlueLamp 14エージェント構造マッピングテスト開始\n")
    
    mapping_ok = test_agent_mapping()
    api_ok = test_portal_api_connection()
    
    print(f"\n=== 総合結果 ===")
    if mapping_ok and api_ok:
        print("✅ 全てのテストが成功しました！")
        sys.exit(0)
    else:
        print("❌ 一部のテストが失敗しました。")
        sys.exit(1)