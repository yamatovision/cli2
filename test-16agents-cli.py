#!/usr/bin/env python3
"""
16エージェント軽量テストCLI
OpenHandsセットアップなしで動作確認
"""

import yaml
import re
from pathlib import Path
import sys

class Agent16Tester:
    def __init__(self):
        self.agents = {}
        self.load_agents()

    def load_agents(self):
        """16エージェントを読み込み"""
        bluelamp_dir = Path("OpenHands-main/microagents/bluelamp")

        if not bluelamp_dir.exists():
            print("❌ bluelampディレクトリが見つかりません")
            return

        print(f"📁 エージェント読み込み中: {bluelamp_dir}")

        for agent_file in bluelamp_dir.glob("*.md"):
            try:
                with open(agent_file, 'r', encoding='utf-8') as f:
                    content = f.read()

                # フロントマター解析
                if content.startswith('---'):
                    parts = content.split('---', 2)
                    if len(parts) >= 3:
                        metadata = yaml.safe_load(parts[1])
                        agent_content = parts[2].strip()

                        agent_name = metadata.get('name')
                        triggers = metadata.get('triggers', [])

                        self.agents[agent_name] = {
                            'metadata': metadata,
                            'content': agent_content,
                            'triggers': triggers,
                            'file': agent_file.name
                        }

            except Exception as e:
                print(f"❌ {agent_file.name}: {e}")

        print(f"✅ {len(self.agents)}個のエージェント読み込み完了")

    def find_matching_agents(self, query):
        """クエリにマッチするエージェントを検索"""
        matches = []

        for agent_name, agent_data in self.agents.items():
            triggers = agent_data['triggers']

            for trigger in triggers:
                if trigger.lower() in query.lower():
                    matches.append({
                        'name': agent_name,
                        'trigger': trigger,
                        'metadata': agent_data['metadata'],
                        'content_preview': agent_data['content'][:200] + "..."
                    })
                    break

        return matches

    def test_query(self, query):
        """クエリテスト実行"""
        print(f"\n🔍 クエリ: '{query}'")
        print("-" * 50)

        matches = self.find_matching_agents(query)

        if not matches:
            print("❌ マッチするエージェントが見つかりません")
            return

        print(f"✅ {len(matches)}個のエージェントがマッチ:")

        for i, match in enumerate(matches, 1):
            print(f"\n{i}. 🤖 {match['name']}")
            print(f"   🎯 トリガー: {match['trigger']}")
            print(f"   📝 プレビュー: {match['content_preview']}")

    def interactive_test(self):
        """インタラクティブテスト"""
        print("\n🧪 16エージェント インタラクティブテスト")
        print("=" * 50)
        print("💡 使い方: 質問を入力してください（'quit'で終了）")
        print("📋 例: '要件定義を作成したい', 'バグを修正したい'")

        while True:
            try:
                query = input("\n❓ 質問: ").strip()

                if query.lower() in ['quit', 'exit', 'q']:
                    print("👋 テスト終了")
                    break

                if not query:
                    continue

                self.test_query(query)

            except KeyboardInterrupt:
                print("\n👋 テスト終了")
                break

    def run_preset_tests(self):
        """プリセットテスト実行"""
        print("\n🧪 プリセットテスト実行")
        print("=" * 50)

        test_queries = [
            "新しいWebアプリを作りたい",
            "要件定義を作成したい",
            "UIデザインを改善したい",
            "データベース設計をしたい",
            "バックエンドAPIを実装したい",
            "テストを書きたい",
            "バグを修正したい",
            "デプロイしたい",
            "TypeScriptエラーを解決したい",
            "リファクタリングしたい"
        ]

        for query in test_queries:
            self.test_query(query)

    def show_agent_list(self):
        """エージェント一覧表示"""
        print("\n📋 登録エージェント一覧")
        print("=" * 50)

        for i, (name, data) in enumerate(self.agents.items(), 1):
            triggers = data['triggers']
            print(f"{i:2d}. 🤖 {name}")
            print(f"     🎯 トリガー: {', '.join(triggers[:3])}{'...' if len(triggers) > 3 else ''}")

def main():
    tester = Agent16Tester()

    if len(tester.agents) == 0:
        print("❌ エージェントが読み込まれませんでした")
        return

    print("🎯 テストモード選択:")
    print("1. プリセットテスト実行")
    print("2. インタラクティブテスト")
    print("3. エージェント一覧表示")

    try:
        choice = input("\n選択 (1-3): ").strip()

        if choice == "1":
            tester.run_preset_tests()
        elif choice == "2":
            tester.interactive_test()
        elif choice == "3":
            tester.show_agent_list()
        else:
            print("❌ 無効な選択です")

    except KeyboardInterrupt:
        print("\n👋 終了")

if __name__ == "__main__":
    main()
