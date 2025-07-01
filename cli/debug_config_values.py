#!/usr/bin/env python3
"""
エージェント切り替え制御機能の設定値を確認するデバッグスクリプト
"""

import sys
import os
sys.path.insert(0, '/Users/tatsuya/Desktop/システム開発/blc')

from openhands.core.config import OpenHandsConfig
from openhands.core.config.security_config import SecurityConfig

def debug_config_values():
    print("=== エージェント切り替え制御機能 設定値デバッグ ===\n")
    
    # 1. config.tomlから設定を読み込み
    config_path = "/Users/tatsuya/Desktop/システム開発/blc/config.toml"
    print(f"1. 設定ファイル: {config_path}")
    
    try:
        # 設定ファイルを直接読み込み
        import toml
        with open(config_path, 'r') as f:
            toml_data = toml.load(f)
        print("✅ 設定ファイル読み込み成功")
        print(f"   TOML内容: {toml_data}")
        
        # OpenHandsConfigを作成
        config = OpenHandsConfig()
        if 'security' in toml_data:
            security_data = toml_data['security']
            config.security = SecurityConfig.model_validate(security_data)
        print("✅ OpenHandsConfig作成成功")
    except Exception as e:
        print(f"❌ 設定ファイル読み込み失敗: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # 2. SecurityConfig の値を確認
    print(f"\n2. SecurityConfig の値:")
    print(f"   - confirmation_mode: {config.security.confirmation_mode}")
    print(f"   - agent_switch_confirmation: {config.security.agent_switch_confirmation}")
    print(f"   - agent_switch_logging: {config.security.agent_switch_logging}")
    print(f"   - security_analyzer: {config.security.security_analyzer}")
    
    # 3. getattr での取得値を確認
    print(f"\n3. getattr での取得値:")
    agent_switch_confirmation = getattr(config.security, 'agent_switch_confirmation', True)
    agent_switch_logging = getattr(config.security, 'agent_switch_logging', True)
    print(f"   - getattr(config.security, 'agent_switch_confirmation', True): {agent_switch_confirmation}")
    print(f"   - getattr(config.security, 'agent_switch_logging', True): {agent_switch_logging}")
    
    # 4. デフォルト値の確認
    print(f"\n4. SecurityConfig デフォルト値:")
    default_security = SecurityConfig()
    print(f"   - confirmation_mode: {default_security.confirmation_mode}")
    print(f"   - agent_switch_confirmation: {default_security.agent_switch_confirmation}")
    print(f"   - agent_switch_logging: {default_security.agent_switch_logging}")
    
    # 5. 問題の分析
    print(f"\n5. 問題分析:")
    if config.security.confirmation_mode == False:
        print("   ⚠️  confirmation_mode が False に設定されています")
        print("      これがエージェント切り替え確認をスキップする原因の可能性があります")
    
    if config.security.agent_switch_confirmation == True:
        print("   ✅ agent_switch_confirmation は True に設定されています")
    else:
        print("   ❌ agent_switch_confirmation が False に設定されています")
    
    # 6. 環境変数の確認
    print(f"\n6. 関連環境変数:")
    env_vars = [
        'SANDBOX_VOLUMES',
        'PYTHONPATH',
        'RUNTIME',
        'INSTALL_DOCKER'
    ]
    for var in env_vars:
        value = os.environ.get(var, 'Not set')
        print(f"   - {var}: {value}")

if __name__ == "__main__":
    debug_config_values()