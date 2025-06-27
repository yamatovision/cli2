#!/usr/bin/env python3
"""
DelegateTool動作確認テストスクリプト
completion_criteriaフィールドが正しく機能するかを確認
"""

import sys
import json
from pathlib import Path

# プロジェクトのルートをPythonパスに追加
sys.path.insert(0, str(Path(__file__).parent))

try:
    # DelegateToolのインポート
    from openhands.agenthub.codeact_agent.tools.delegate import DelegateTool
    from openhands.events.action.agent import AgentDelegateAction
    
    print("=== DelegateTool 動作確認テスト ===\n")
    
    # 1. DelegateToolの構造を確認
    print("1. DelegateToolの定義確認:")
    print(f"Tool Name: {DelegateTool['function']['name']}")
    print(f"Required fields: {DelegateTool['function']['parameters']['required']}")
    
    # inputsの必須フィールドを確認
    inputs_props = DelegateTool['function']['parameters']['properties']['inputs']
    print(f"Inputs required fields: {inputs_props['required']}")
    print(f"Inputs properties: {list(inputs_props['properties'].keys())}")
    
    # thoughtフィールドが存在しないことを確認
    if 'thought' in DelegateTool['function']['parameters']['properties']:
        print("⚠️ WARNING: thoughtフィールドがまだ存在しています！")
    else:
        print("✅ thoughtフィールドは正しく削除されています")
    
    # completion_criteriaフィールドが存在することを確認
    if 'completion_criteria' in inputs_props['properties']:
        print("✅ completion_criteriaフィールドが存在します")
    else:
        print("⚠️ ERROR: completion_criteriaフィールドが見つかりません！")
    
    print("\n2. AgentDelegateActionのテスト:")
    
    # 正しい形式でAgentDelegateActionを作成
    test_inputs = {
        "task": "認証APIの統合テストを実行する",
        "completion_criteria": "15個全てのテストが通過すること",
        "requirements": "テストファイルは変更禁止",
        "context": "バックエンド実装完了済み"
    }
    
    # AgentDelegateActionの作成
    action = AgentDelegateAction(
        agent="test_quality_verification",
        inputs=test_inputs
    )
    
    print(f"Agent: {action.agent}")
    print(f"Action type: {action.action}")
    print(f"Message: {action.message}")
    print("Inputs:")
    for key, value in action.inputs.items():
        print(f"  {key}: {value}")
    
    # thoughtフィールドが存在しないことを確認
    if hasattr(action, 'thought'):
        print(f"⚠️ WARNING: AgentDelegateActionにthoughtフィールドが存在: '{action.thought}'")
    else:
        print("✅ AgentDelegateActionからthoughtフィールドが正しく削除されています")
    
    print("\n3. 委譲プロトコルの形式確認:")
    
    # オーケストレーターが使用する形式
    delegate_format = {
        "agent": "backend",
        "inputs": {
            "task": "ユーザー認証APIを実装する",
            "completion_criteria": "ログイン・ログアウト・トークン更新が動作すること",
            "requirements": "JWT認証を使用、セキュリティベストプラクティスに従う",
            "context": "要件定義書のセクション3.2を参照"
        }
    }
    
    print("委譲形式の例:")
    print(json.dumps(delegate_format, indent=2, ensure_ascii=False))
    
    # 必須フィールドのチェック
    print("\n4. 必須フィールドの検証:")
    
    # taskのみの場合（エラーになるはず）
    try:
        incomplete_action = AgentDelegateAction(
            agent="backend",
            inputs={"task": "何かをする"}
        )
        # DelegateToolの検証をシミュレート
        if 'completion_criteria' not in incomplete_action.inputs:
            print("⚠️ completion_criteriaが不足しています（実際の実行時にエラーになります）")
    except Exception as e:
        print(f"エラー: {e}")
    
    print("\n=== テスト完了 ===")
    print("\n推奨事項:")
    print("1. オーケストレーターは常にcompletion_criteriaを含めて委譲する")
    print("2. 各エージェントはcompletion_criteriaを参照して作業を完了判定する")
    print("3. SCOPE_PROGRESS.mdには完了状況を簡潔に記録する")
    
except ImportError as e:
    print(f"インポートエラー: {e}")
    print("パスを確認してください")
except Exception as e:
    print(f"予期しないエラー: {e}")
    import traceback
    traceback.print_exc()