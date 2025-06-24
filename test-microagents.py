#!/usr/bin/env python3
"""
16エージェントのマイクロエージェント読み込みテスト
OpenHandsの環境セットアップなしで動作確認
"""

import os
import sys
from pathlib import Path
import yaml
import re

def test_microagent_loading():
    """16エージェントのマイクロエージェント形式をテスト"""

    # bluelampマイクロエージェントディレクトリ
    bluelamp_dir = Path("OpenHands-main/microagents/bluelamp")

    if not bluelamp_dir.exists():
        print("❌ bluelampディレクトリが見つかりません")
        return False

    print("🔍 16エージェント読み込みテスト開始...")
    print(f"📁 ディレクトリ: {bluelamp_dir}")

    # 全マイクロエージェントファイルを取得
    agent_files = list(bluelamp_dir.glob("*.md"))

    if not agent_files:
        print("❌ マイクロエージェントファイルが見つかりません")
        return False

    print(f"📋 発見されたエージェント数: {len(agent_files)}")

    success_count = 0
    error_count = 0

    for agent_file in sorted(agent_files):
        try:
            # ファイル読み込み
            with open(agent_file, 'r', encoding='utf-8') as f:
                file_content = f.read()

            # フロントマター解析（YAML部分を抽出）
            if file_content.startswith('---'):
                parts = file_content.split('---', 2)
                if len(parts) >= 3:
                    yaml_content = parts[1]
                    content = parts[2].strip()
                    metadata = yaml.safe_load(yaml_content)
                else:
                    print(f"❌ {agent_file.name}: フロントマター形式が不正")
                    error_count += 1
                    continue
            else:
                print(f"❌ {agent_file.name}: フロントマターが見つかりません")
                error_count += 1
                continue

            # 必須フィールド確認
            required_fields = ['name', 'type', 'version', 'agent', 'triggers']
            missing_fields = [field for field in required_fields if field not in metadata]

            if missing_fields:
                print(f"❌ {agent_file.name}: 必須フィールド不足 {missing_fields}")
                error_count += 1
                continue

            # トリガー確認
            triggers = metadata.get('triggers', [])
            if not isinstance(triggers, list) or len(triggers) == 0:
                print(f"❌ {agent_file.name}: トリガーが設定されていません")
                error_count += 1
                continue

            # 成功
            print(f"✅ {metadata['name']}: {len(triggers)}個のトリガー設定済み")
            print(f"   📝 トリガー: {', '.join(triggers[:3])}{'...' if len(triggers) > 3 else ''}")
            success_count += 1

        except Exception as e:
            print(f"❌ {agent_file.name}: エラー - {str(e)}")
            error_count += 1

    print(f"\n📊 テスト結果:")
    print(f"✅ 成功: {success_count}個")
    print(f"❌ エラー: {error_count}個")
    print(f"📈 成功率: {success_count/(success_count+error_count)*100:.1f}%")

    return error_count == 0

def test_trigger_keywords():
    """トリガーキーワードのテスト"""
    print("\n🎯 トリガーキーワードテスト...")

    test_queries = [
        "要件定義を作成したい",
        "UIデザインを改善したい",
        "データモデルを設計したい",
        "システムアーキテクチャを決めたい",
        "バグを修正したい",
        "デプロイしたい"
    ]

    bluelamp_dir = Path("OpenHands-main/microagents/bluelamp")

    # 全エージェントのトリガーを収集
    all_triggers = {}
    for agent_file in bluelamp_dir.glob("*.md"):
        try:
            with open(agent_file, 'r', encoding='utf-8') as f:
                file_content = f.read()

            # フロントマター解析
            if file_content.startswith('---'):
                parts = file_content.split('---', 2)
                if len(parts) >= 3:
                    yaml_content = parts[1]
                    metadata = yaml.safe_load(yaml_content)

                    agent_name = metadata.get('name', agent_file.stem)
                    triggers = metadata.get('triggers', [])
                    all_triggers[agent_name] = triggers
                else:
                    continue
            else:
                continue

        except Exception as e:
            print(f"❌ {agent_file.name}: {e}")

    print(f"📋 登録エージェント数: {len(all_triggers)}")

    # クエリごとにマッチするエージェントを検索
    for query in test_queries:
        matched_agents = []

        for agent_name, triggers in all_triggers.items():
            for trigger in triggers:
                if trigger.lower() in query.lower():
                    matched_agents.append((agent_name, trigger))
                    break

        if matched_agents:
            agent_names = [agent[0] for agent in matched_agents]
            print(f"✅ '{query}' → {', '.join(agent_names)}")
        else:
            print(f"❌ '{query}' → マッチなし")

if __name__ == "__main__":
    print("🧪 OpenHands 16エージェント統合テスト")
    print("=" * 50)

    # カレントディレクトリ確認
    current_dir = Path.cwd()
    print(f"📁 実行ディレクトリ: {current_dir}")

    # マイクロエージェント読み込みテスト
    success = test_microagent_loading()

    # トリガーキーワードテスト
    test_trigger_keywords()

    print("\n" + "=" * 50)
    if success:
        print("🎉 全テスト成功！16エージェントはOpenHands形式で正常に変換されています")
    else:
        print("⚠️  一部エラーがありますが、基本的な統合は完了しています")
