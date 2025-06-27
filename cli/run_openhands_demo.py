#!/usr/bin/env python3
"""
OpenHands を直接実行するデモスクリプト
CLIがインストールされていない場合の代替方法
"""

import os
import sys

# 現在のディレクトリをPythonパスに追加
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

def check_environment():
    """環境をチェック"""
    print("🔍 環境チェック中...")
    
    # 必要なモジュールの確認
    required_modules = [
        'openhands',
        'litellm',
        'browsergym'
    ]
    
    missing_modules = []
    for module in required_modules:
        try:
            __import__(module)
            print(f"✅ {module} - インストール済み")
        except ImportError:
            print(f"❌ {module} - 未インストール")
            missing_modules.append(module)
    
    if missing_modules:
        print(f"\n⚠️  以下のモジュールをインストールしてください:")
        print(f"pip install {' '.join(missing_modules)}")
        return False
    
    return True

def run_browsing_agent_demo():
    """BrowsingAgentのデモを実行"""
    print("\n🚀 BrowsingAgent デモ")
    print("=" * 60)
    
    # 実際のコードをシミュレート
    demo_code = """
# 実際のBrowsingAgent使用例
from openhands.agenthub.browsing_agent import BrowsingAgent
from openhands.controller.state import State
from openhands.core.config import AgentConfig
from openhands.llm.llm import LLM

# エージェントの初期化
config = AgentConfig()
llm = LLM(model="gpt-4")
agent = BrowsingAgent(llm=llm, config=config)

# タスクの実行
state = State()
state.inputs['task'] = "MongoDBのアカウント作成手順を教えて"

# エージェントの実行
action = agent.step(state)
print(action)
"""
    
    print("以下のようなコードで実行されます:")
    print(demo_code)
    
    print("\n📋 代替実行方法:")
    print("1. Poetry環境での実行:")
    print("   poetry run python -m openhands.cli")
    print("\n2. 直接Pythonスクリプトとして:")
    print("   python3 -m openhands.cli")
    print("\n3. 開発モードで:")
    print("   python3 openhands/cli/__main__.py")

def show_installation_guide():
    """インストールガイドを表示"""
    print("\n📦 OpenHandsのインストール方法")
    print("=" * 60)
    
    print("\n1. 最も簡単な方法（pip）:")
    print("   pip install openhands")
    
    print("\n2. 開発環境でのインストール:")
    print("   git clone https://github.com/All-Hands-AI/OpenHands.git")
    print("   cd OpenHands")
    print("   pip install -e .")
    
    print("\n3. Poetry を使用:")
    print("   poetry install")
    print("   poetry run oh")
    
    print("\n4. requirements.txt から:")
    print("   pip install -r requirements.txt")

def main():
    print("=" * 60)
    print("🤖 OpenHands 実行ガイド")
    print("=" * 60)
    
    # 環境チェック
    if not check_environment():
        show_installation_guide()
        return
    
    # デモ実行
    run_browsing_agent_demo()
    
    print("\n\n✨ 次のステップ:")
    print("1. OpenHandsをインストール: pip install openhands")
    print("2. CLIを起動: oh")
    print("3. BrowsingAgentを選択: /agent browsing_agent")
    print("4. タスクを入力して実行")

if __name__ == "__main__":
    main()