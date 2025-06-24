#!/usr/bin/env python3
"""
16エージェント クイックテスト
"""

import yaml
from pathlib import Path

def quick_test():
    """クイックテスト実行"""

    # エージェント読み込み
    bluelamp_dir = Path("OpenHands-main/microagents/bluelamp")
    agents = {}

    for agent_file in bluelamp_dir.glob("*.md"):
        try:
            with open(agent_file, 'r', encoding='utf-8') as f:
                content = f.read()

            if content.startswith('---'):
                parts = content.split('---', 2)
                if len(parts) >= 3:
                    metadata = yaml.safe_load(parts[1])
                    agents[metadata.get('name')] = metadata.get('triggers', [])
        except:
            continue

    print(f"🤖 読み込み完了: {len(agents)}個のエージェント")
    print("=" * 50)

    # テストクエリ
    test_queries = [
        "要件定義を作成したい",
        "UIデザインを改善したい",
        "データベース設計をしたい",
        "バックエンドAPIを実装したい",
        "バグを修正したい",
        "デプロイしたい"
    ]

    for query in test_queries:
        print(f"\n🔍 '{query}'")
        matches = []

        for agent_name, triggers in agents.items():
            for trigger in triggers:
                if trigger.lower() in query.lower():
                    matches.append(agent_name)
                    break

        if matches:
            print(f"✅ マッチ: {', '.join(matches)}")
        else:
            print("❌ マッチなし")

    print(f"\n📊 統計:")
    print(f"📋 総エージェント数: {len(agents)}")
    total_triggers = sum(len(triggers) for triggers in agents.values())
    print(f"🎯 総トリガー数: {total_triggers}")
    print(f"📈 平均トリガー数: {total_triggers/len(agents):.1f}")

if __name__ == "__main__":
    quick_test()
