# BlueLampシステム テスト実施指示書

## 🎯 テスト担当者への指示

あなたは、BlueLampシステムの実装完了後のテストと品質保証を担当します。
すべてのエージェントが正しく実装され、動作することを確認してください。

## 📋 前提条件

- 17個すべてのエージェントが実装済み（オーケストレーター + 16専門エージェント）
- `/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/OpenHands-main/cli/openhands/agenthub/__init__.py` が更新済み

## 🔍 テスト項目

### 1. 構造確認テスト

既存のテストスクリプトを実行：

```bash
cd /Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/OpenHands-main/
python3 test_bluelamp_structure.py
```

**期待される結果**:
- すべてのエージェント（17個）が「✅ 完全実装」と表示される
- 実装率: 100%
- 各エージェントに必要な3つのファイルがすべて存在する

### 2. インポートテスト

新しいテストファイルを作成して実行：

```python
#!/usr/bin/env python3
"""BlueLampシステム インポートテスト"""

import sys
from pathlib import Path

# CLIパスを追加
cli_path = Path(__file__).parent / "cli"
sys.path.insert(0, str(cli_path))

print("=== BlueLampシステム インポートテスト ===\n")

# すべてのエージェントをインポート
try:
    from openhands.agenthub import (
        BlueLampOrchestrator,
        RequirementsEngineer,
        UIUXDesigner,
        DataModelingEngineer,
        SystemArchitect,
        ImplementationConsultant,
        EnvironmentSetup,
        PrototypeImplementation,
        BackendImplementation,
        TestQualityVerification,
        APIIntegration,
        DebugDetective,
        DeploySpecialist,
        GitHubManager,
        TypeScriptManager,
        FeatureExtension,
        RefactoringExpert
    )
    print("✅ すべてのエージェントのインポートに成功しました！")
    
    # インポートされたクラスの確認
    agents = [
        BlueLampOrchestrator,
        RequirementsEngineer,
        UIUXDesigner,
        DataModelingEngineer,
        SystemArchitect,
        ImplementationConsultant,
        EnvironmentSetup,
        PrototypeImplementation,
        BackendImplementation,
        TestQualityVerification,
        APIIntegration,
        DebugDetective,
        DeploySpecialist,
        GitHubManager,
        TypeScriptManager,
        FeatureExtension,
        RefactoringExpert
    ]
    
    print(f"\nインポートされたエージェント数: {len(agents)}")
    for agent in agents:
        print(f"  - {agent.__name__}")
        
except ImportError as e:
    print(f"❌ インポートエラー: {e}")
    sys.exit(1)
```

### 3. エージェント登録確認テスト

```python
#!/usr/bin/env python3
"""BlueLampシステム エージェント登録テスト"""

import sys
from pathlib import Path

# CLIパスを追加
cli_path = Path(__file__).parent / "cli"
sys.path.insert(0, str(cli_path))

print("=== BlueLampシステム エージェント登録テスト ===\n")

try:
    # controller.agentモジュールを探す
    # 注: OpenHandsの実際の構造に合わせて調整が必要
    
    # まず、agenthubの__all__を確認
    from openhands import agenthub
    
    print("agenthub.__all__ の内容:")
    if hasattr(agenthub, '__all__'):
        for name in agenthub.__all__:
            print(f"  - {name}")
    else:
        print("  __all__ が定義されていません")
        
    print(f"\n登録されているエージェント数: {len(agenthub.__all__) if hasattr(agenthub, '__all__') else 0}")
    
except Exception as e:
    print(f"❌ エラー: {e}")
    import traceback
    traceback.print_exc()
```

### 4. プロンプトファイル検証テスト

```python
#!/usr/bin/env python3
"""BlueLampシステム プロンプト検証テスト"""

import os
from pathlib import Path

print("=== BlueLampシステム プロンプト検証テスト ===\n")

cli_path = Path(__file__).parent / "cli"
agenthub_path = cli_path / "openhands" / "agenthub"

agents = [
    "bluelamp_orchestrator",
    "requirements_engineer",
    "ui_ux_designer",
    "data_modeling_engineer",
    "system_architect",
    "implementation_consultant",
    "environment_setup",
    "prototype_implementation",
    "backend_implementation",
    "test_quality_verification",
    "api_integration",
    "debug_detective",
    "deploy_specialist",
    "github_manager",
    "typescript_manager",
    "feature_extension",
    "refactoring_expert"
]

for agent in agents:
    prompt_file = agenthub_path / agent / "prompts" / "system_prompt.j2"
    
    if prompt_file.exists():
        # ファイルサイズ確認
        size = prompt_file.stat().st_size
        
        # {{ instructions }} の存在確認
        with open(prompt_file, 'r', encoding='utf-8') as f:
            content = f.read()
            has_instructions = "{{ instructions }}" in content
            
        status = "✅" if size > 1000 and has_instructions else "⚠️"
        print(f"{status} {agent}: {size:,} bytes", end="")
        
        if not has_instructions:
            print(" ({{ instructions }} が見つかりません)", end="")
        print()
    else:
        print(f"❌ {agent}: プロンプトファイルが見つかりません")
```

### 5. 実装品質チェック

各エージェントについて以下を確認：

1. **クラス構造**
   - CodeActAgentを継承しているか
   - prompt_managerプロパティが実装されているか
   - VERSIONが定義されているか

2. **__init__.py の構造**
   - Agent.registerが呼ばれているか
   - __all__にクラス名が含まれているか

3. **プロンプトファイル**
   - privateディレクトリの内容と完全一致しているか
   - 末尾に{{ instructions }}があるか

## 📝 テスト実行手順

1. **事前準備**
   ```bash
   cd /Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/OpenHands-main/
   ```

2. **各テストを順番に実行**
   - 構造確認テスト
   - インポートテスト
   - エージェント登録テスト
   - プロンプト検証テスト

3. **問題が見つかった場合**
   - エラーメッセージを記録
   - 該当するエージェントのディレクトリを確認
   - 必要なファイルが欠けていないか確認
   - プロンプトファイルの内容を検証

## 🔧 よくある問題と解決方法

### インポートエラー
- **原因**: __init__.pyが正しく設定されていない
- **解決**: 各エージェントディレクトリの__init__.pyを確認

### プロンプトファイルのエラー
- **原因**: {{ instructions }}が抜けている、またはファイルが空
- **解決**: privateディレクトリから再度コピーして、末尾に{{ instructions }}を追加

### エージェント登録エラー
- **原因**: Agent.registerが呼ばれていない
- **解決**: __init__.pyでAgent.register('クラス名', クラス)を追加

## 📊 テスト完了基準

以下がすべて満たされていることを確認：

- [ ] 17個すべてのエージェントディレクトリが存在
- [ ] 各エージェントの3つのファイルがすべて存在
- [ ] すべてのエージェントがインポート可能
- [ ] プロンプトファイルが1000バイト以上
- [ ] プロンプトファイルに{{ instructions }}が含まれる
- [ ] agenthub/__init__.pyに17個のエージェントが登録

## 🎉 最終確認

すべてのテストが通過したら、以下のメッセージを報告してください：

```
BlueLampシステムのテスト完了！
✅ 17個すべてのエージェントが正常に実装されています
✅ すべてのインポートテストに合格
✅ プロンプトファイルの検証完了
✅ システムは完全に動作可能な状態です
```

問題がある場合は、具体的なエラー内容と該当エージェントを報告してください。