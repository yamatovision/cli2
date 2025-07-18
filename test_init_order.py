#!/usr/bin/env python3
"""
初期化順序のテストスクリプト
"""

import sys
import os

# パスを追加
sys.path.insert(0, '/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/cli2')

# デバッグ用のRequirementsEngineerクラスを作成
class DebugRequirementsEngineer:
    def __init__(self, llm, config=None):
        print(f"  🔍 DebugRequirementsEngineer.__init__ 開始")
        
        if config is None:
            from core.config import AgentConfig
            config = AgentConfig()
            print(f"  🔍 新しいconfig作成: {config.system_prompt_filename}")
        else:
            print(f"  🔍 既存config使用: {config.system_prompt_filename}")
        
        print(f"  🔍 config.system_prompt_filename設定前: {config.system_prompt_filename}")
        config.system_prompt_filename = 'requirements_engineer'
        print(f"  🔍 config.system_prompt_filename設定後: {config.system_prompt_filename}")
        
        # 親クラスの初期化をシミュレート
        self.llm = llm
        self.config = config
        self._prompt_manager = None
        
        print(f"  🔍 初期化完了: self.config.system_prompt_filename = {self.config.system_prompt_filename}")
    
    @property
    def prompt_manager(self):
        print(f"  🔍 prompt_manager プロパティアクセス")
        print(f"  🔍 self.config.system_prompt_filename = {self.config.system_prompt_filename}")
        
        if self._prompt_manager is None:
            print(f"  🔍 PortalPromptManager作成中...")
            # PortalPromptManagerの作成をシミュレート
            self._prompt_manager = f"PortalPromptManager(filename={self.config.system_prompt_filename})"
        
        return self._prompt_manager

try:
    from core.config import LLMConfig
    from core.llm.llm import LLM
    
    print("✅ 基本的なimport成功")
    
    # LLMの作成
    llm_config = LLMConfig()
    llm = LLM(config=llm_config)
    
    print("\n🧪 デバッグ用RequirementsEngineerのテスト:")
    debug_agent = DebugRequirementsEngineer(llm)
    print(f"  最終的なconfig: {debug_agent.config.system_prompt_filename}")
    print(f"  prompt_manager: {debug_agent.prompt_manager}")
    
    print("\n🧪 実際のRequirementsEngineerのテスト:")
    from core.agents.agent import Agent
    
    # 実際のRequirementsEngineerクラスを取得
    agent_cls = Agent.get_cls('RequirementsEngineer')
    
    # configを明示的に作成
    from core.config import AgentConfig
    config = AgentConfig()
    print(f"  作成直後のconfig: {config.system_prompt_filename}")
    
    # エージェントを作成（config=Noneで）
    print(f"  エージェント作成中（config=None）...")
    agent = agent_cls(llm=llm, config=None)
    print(f"  作成後のconfig: {agent.config.system_prompt_filename}")
    
    # prompt_managerにアクセス
    print(f"  prompt_managerアクセス中...")
    pm = agent.prompt_manager
    print(f"  PM.system_prompt_filename: {pm.system_prompt_filename}")
    
except Exception as e:
    print(f"❌ エラー: {e}")
    import traceback
    traceback.print_exc()