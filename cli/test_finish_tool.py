#!/usr/bin/env python3
"""
FinishTool変更の影響を確認するテストスクリプト
task_completedがstring型からboolean型に変更された影響をチェック
"""

import sys
from pathlib import Path

# プロジェクトのルートをPythonパスに追加
sys.path.insert(0, str(Path(__file__).parent))

print("=== FinishTool 変更確認テスト ===\n")

# 1. finish.pyの確認
finish_tool_path = Path(__file__).parent / "openhands/agenthub/codeact_agent/tools/finish.py"
print("1. finish.pyの変更確認:")
if finish_tool_path.exists():
    with open(finish_tool_path, 'r') as f:
        content = f.read()
    
    # boolean型になっているか確認
    if "'type': 'boolean'" in content:
        print("✅ task_completedがboolean型に変更されています")
    else:
        print("⚠️ ERROR: task_completedがまだstring型です")
    
    # partialオプションが削除されているか確認
    if "'partial'" in content:
        print("⚠️ ERROR: 'partial'オプションがまだ存在します")
    else:
        print("✅ 'partial'オプションは削除されています")

# 2. function_calling.pyでの処理を確認
function_calling_path = Path(__file__).parent / "openhands/agenthub/codeact_agent/function_calling.py"
print("\n2. function_calling.pyでのFinishTool処理確認:")
if function_calling_path.exists():
    with open(function_calling_path, 'r') as f:
        content = f.read()
    
    # AgentFinishActionの処理部分を探す
    import re
    finish_action_match = re.search(
        r'FinishTool.*?AgentFinishAction\((.*?)\)',
        content,
        re.DOTALL
    )
    
    if finish_action_match:
        print("AgentFinishAction作成部分:")
        print("-" * 40)
        # 該当部分の前後を表示
        start = max(0, finish_action_match.start() - 200)
        end = min(len(content), finish_action_match.end() + 100)
        print(content[start:end])
        print("-" * 40)
        
        # task_completedの処理を確認
        if "task_completed" in finish_action_match.group(1):
            print("⚠️ 注意: task_completedパラメータが使用されています")
            print("   型の不一致（string → boolean）に注意が必要です")

# 3. AgentFinishActionクラスの確認
agent_py_path = Path(__file__).parent / "openhands/events/action/agent.py"
print("\n3. AgentFinishActionクラスの確認:")
if agent_py_path.exists():
    with open(agent_py_path, 'r') as f:
        content = f.read()
    
    # AgentFinishActionクラスを探す
    finish_class_match = re.search(
        r'class AgentFinishAction.*?(?=\nclass|\n@|\Z)',
        content,
        re.DOTALL
    )
    
    if finish_class_match:
        class_content = finish_class_match.group(0)
        print("AgentFinishActionクラスの定義:")
        print("-" * 40)
        print(class_content[:400] + "..." if len(class_content) > 400 else class_content)
        print("-" * 40)
        
        # task_completedフィールドの型を確認
        if "task_completed:" in class_content:
            print("⚠️ task_completedフィールドが存在します")
            print("   型の整合性を確認してください")

print("\n=== 推奨事項 ===")
print("1. task_completedがboolean型に変更されたので、")
print("   'true'/'false'の文字列ではなく、True/Falseのboolean値を期待します")
print("2. function_calling.pyでの型変換処理の確認が必要かもしれません")
print("3. 既存のエージェントプロンプトで'true'/'false'を使用している箇所の更新が必要かもしれません")