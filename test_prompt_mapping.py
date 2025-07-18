#!/usr/bin/env python3
"""
プロンプトマッピングのテストスクリプト
"""

import sys
import os

# パスを追加
sys.path.insert(0, '/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/cli2')

try:
    from extensions.portal.prompt_mapping import (
        PROMPT_MAPPING, 
        ID_TO_AGENT, 
        get_prompt_id, 
        is_portal_prompt,
        get_all_agents
    )
    
    print("✅ プロンプトマッピングのimport成功")
    
    # 重複チェック
    print("\n🔍 重複チェック:")
    prompt_ids = list(PROMPT_MAPPING.values())
    unique_ids = set(prompt_ids)
    
    if len(prompt_ids) == len(unique_ids):
        print("✅ プロンプトIDに重複なし")
    else:
        print("❌ プロンプトIDに重複あり")
        duplicates = [id for id in unique_ids if prompt_ids.count(id) > 1]
        for dup in duplicates:
            agents = [k for k, v in PROMPT_MAPPING.items() if v == dup]
            print(f"  重複ID {dup}: {agents}")
    
    # 逆マッピングチェック
    print("\n🔍 逆マッピングチェック:")
    for agent_name, prompt_id in PROMPT_MAPPING.items():
        reverse_agent = ID_TO_AGENT.get(prompt_id)
        if reverse_agent == agent_name:
            print(f"✅ {agent_name} ↔ {prompt_id}")
        else:
            print(f"❌ {agent_name} → {prompt_id} → {reverse_agent}")
    
    # 重要なエージェントのテスト
    print("\n🧪 重要エージェントのテスト:")
    test_agents = [
        'orchestrator',
        'expansion_orchestrator', 
        'debug_agent',
        'page_creator',
        'refactoring_engineer'
    ]
    
    for agent in test_agents:
        prompt_id = get_prompt_id(agent)
        is_portal = is_portal_prompt(agent)
        print(f"  {agent}: ID={prompt_id}, Portal={is_portal}")
    
    print(f"\n📋 全エージェント数: {len(get_all_agents())}")
    print("📋 全エージェント:")
    for agent in get_all_agents():
        print(f"  - {agent}")
        
except Exception as e:
    print(f"❌ エラー: {e}")
    import traceback
    traceback.print_exc()