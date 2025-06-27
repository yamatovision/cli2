#!/usr/bin/env python3
"""
シンプルなDelegateTool構造確認スクリプト
"""

import sys
from pathlib import Path

# ファイルを直接読み込んで確認
delegate_tool_path = Path(__file__).parent / "openhands/agenthub/codeact_agent/tools/delegate.py"
agent_action_path = Path(__file__).parent / "openhands/events/action/agent.py"

print("=== DelegateTool 変更確認 ===\n")

# 1. delegate.pyの確認
print("1. delegate.pyの確認:")
if delegate_tool_path.exists():
    with open(delegate_tool_path, 'r') as f:
        content = f.read()
        
    # thoughtフィールドのチェック
    if "'thought':" in content:
        print("⚠️ ERROR: delegate.pyにまだ'thought'フィールドが存在します！")
        # 該当行を表示
        for i, line in enumerate(content.split('\n')):
            if "'thought':" in line:
                print(f"  行{i+1}: {line.strip()}")
    else:
        print("✅ thoughtフィールドは正しく削除されています")
    
    # completion_criteriaフィールドのチェック
    if "'completion_criteria':" in content:
        print("✅ completion_criteriaフィールドが存在します")
        # 該当行を表示
        for i, line in enumerate(content.split('\n')):
            if "'completion_criteria':" in line:
                print(f"  行{i+1}: {line.strip()}")
    else:
        print("⚠️ ERROR: completion_criteriaフィールドが見つかりません！")
    
    # requiredフィールドの確認
    if "required': ['task', 'completion_criteria']" in content:
        print("✅ taskとcompletion_criteriaが必須フィールドとして設定されています")
    else:
        print("⚠️ WARNING: 必須フィールドの設定を確認してください")

else:
    print(f"ファイルが見つかりません: {delegate_tool_path}")

print("\n2. agent.pyの確認:")
if agent_action_path.exists():
    with open(agent_action_path, 'r') as f:
        content = f.read()
    
    # AgentDelegateActionクラスの部分を抽出
    import re
    delegate_class_match = re.search(
        r'class AgentDelegateAction\(Action\):.*?(?=\nclass|\n@|\Z)', 
        content, 
        re.DOTALL
    )
    
    if delegate_class_match:
        class_content = delegate_class_match.group(0)
        print("AgentDelegateActionクラスの内容:")
        print("-" * 40)
        print(class_content[:300] + "..." if len(class_content) > 300 else class_content)
        print("-" * 40)
        
        if "thought:" in class_content:
            print("⚠️ ERROR: AgentDelegateActionにまだthoughtフィールドが存在します！")
        else:
            print("✅ thoughtフィールドは正しく削除されています")
    else:
        print("AgentDelegateActionクラスが見つかりません")
else:
    print(f"ファイルが見つかりません: {agent_action_path}")

print("\n3. 推奨される委譲形式:")
print("""
{
  "agent": "test_quality_verification",
  "inputs": {
    "task": "認証APIの統合テストを全て通過させる",
    "completion_criteria": "15個全てのテストが通過すること",
    "requirements": "テストファイルは変更せず実装側で対応",
    "context": "バックエンド実装が完了済み"
  }
}
""")

print("=== 確認完了 ===")