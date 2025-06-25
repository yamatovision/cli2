# BlueLamp 16-Agent Dynamic Switching System

## 概要

BlueLamp 16-Agent Systemは、オーケストレーションエージェントが複数の専門エージェントを動的に呼び出し、協調して作業を行うシステムです。

## 実装された機能

### 1. オーケストレーションエージェント
- **プロンプト**: `requirements_engineer.j2` (BlueLampオーケストレーター)
- **役割**: 16エージェントシステムの交通整理、進捗管理、エージェント間の調整
- **委譲機能**: 専門エージェントへの作業委譲とコンテキスト管理
- **特徴**: 実作業は行わず、適切なエージェントへの振り分けのみ

### 2. 専門エージェント

#### BackendAgent (★8 バックエンド実装)
- **プロンプト**: `backend_agent.j2` (垂直スライスバックエンド実装エージェント)
- **専門分野**: 垂直スライス方式での機能単位のバックエンド実装
- **機能**: データモデル→リポジトリ→サービス→コントローラ→統合テスト
- **特徴**: DB-TDD、実データ主義、★9への引き継ぎ準備

#### FrontendAgent (★2 UIUXデザイナー)
- **プロンプト**: `frontend_agent.j2` (モックアップクリエーター&アナライザー)
- **専門分野**: シンプルなUIモックアップ作成、本質的価値の抽出
- **機能**: Material UI、HTML/CSS/JS、効率化パターン適用
- **特徴**: スティーブ・ジョブス哲学、認知負荷最適化

#### DeploymentAgent (★12 デプロイスペシャリスト)
- **プロンプト**: `deployment_agent.j2` (デプロイ&CICD専門)
- **専門分野**: デプロイ環境構築、CI/CDパイプライン設定
- **機能**: Firebase/Cloud Run推奨、アカウント開設代行、環境変数設定
- **特徴**: 非技術者対応、日本語サポート重視

## システム構成

### エージェント設定ファイル
```toml
# agent_configs.toml
[agents.orchestration]
name = "OrchestrationAgent"
system_prompt_filename = "requirements_engineer.j2"

[agents.backend]
name = "BackendAgent"
system_prompt_filename = "backend_agent.j2"

[agents.frontend]
name = "FrontendAgent"
system_prompt_filename = "frontend_agent.j2"

[agents.deployment]
name = "DeploymentAgent"
system_prompt_filename = "deployment_agent.j2"
```

### 委譲ルール
```toml
[delegation]
orchestration_can_delegate_to = ["backend", "frontend", "deployment"]
backend_can_delegate_to = ["orchestration"]
frontend_can_delegate_to = ["orchestration"]
deployment_can_delegate_to = ["orchestration"]
```

## 使用方法

### 1. エージェント委譲の実行

オーケストレーションエージェントから専門エージェントへの委譲：

```json
{
  "action": "delegate",
  "agent": "BackendAgent",
  "inputs": {
    "task": "API設計と実装",
    "requirements": "ユーザー認証機能付きのREST API",
    "context": "Node.js + Express + MongoDB構成"
  }
}
```

### 2. コンテキスト管理

- **親エージェント**: 委譲前の状態が保持される
- **子エージェント**: 新しいコンテキストウィンドウ（0スタート）
- **復帰時**: 親のコンテキストに子の実行結果が統合される

### 3. 実行フロー

1. **要件定義**: オーケストレーションエージェントがユーザー要件を分析
2. **作業分割**: 専門分野ごとに作業を分割
3. **エージェント委譲**: 適切な専門エージェントに委譲
4. **専門作業実行**: 各エージェントが専門知識で作業実行
5. **結果統合**: オーケストレーションエージェントが結果を統合
6. **品質確認**: 全体の整合性と品質を確認

## 技術実装

### AgentDelegateAction
- エージェント間の委譲を管理
- コンテキストウィンドウの分離
- 多層委譲に対応

### AgentRegistry
- エージェント設定の管理
- 委譲ルールの検証
- 動的エージェント設定の読み込み

### PromptManager
- 各エージェント専用プロンプトの管理
- 動的プロンプト切り替え
- テンプレートレンダリング

## 設定変更

### デフォルトエージェントの変更
```python
# openhands/core/config/agent_config.py
system_prompt_filename: str = Field(default='requirements_engineer.j2')
```

### 新しい専門エージェントの追加
1. プロンプトファイルを作成: `prompts/new_agent.j2`
2. 設定ファイルに追加: `agent_configs.toml`
3. 委譲ルールを更新

## テスト

```bash
# エージェント委譲テスト
python -m pytest tests/unit/test_agent_delegation.py

# プロンプトマネージャーテスト
python -m pytest tests/unit/test_prompt_manager.py

# エージェント設定テスト
python -c "from openhands.core.config.agent_registry import agent_registry; print(agent_registry.get_available_agents())"
```

## 利点

1. **専門性の向上**: 各エージェントが特定分野に特化
2. **コンテキスト管理**: 効率的なメモリ使用
3. **スケーラビリティ**: 新しい専門エージェントの追加が容易
4. **品質向上**: 専門知識による高品質な実装
5. **協調作業**: エージェント間の効果的な連携

## 今後の拡張

- データベースエージェント
- セキュリティエージェント
- テストエージェント
- ドキュメンテーションエージェント
- その他の専門分野エージェント
