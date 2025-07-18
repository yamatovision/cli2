# Controller Module

## 概要
OpenHandsのコア制御機能を提供するモジュールです。エージェントとの通信、状態管理、およびタスクの実行制御を担当します。

## 主要コンポーネント

### AgentController (`agent_controller.py`)
- エージェントのライフサイクル管理
- 状態追跡とイベント処理
- LLMメトリクスの収集

### StateTracker (`state/`)
- アプリケーション状態の管理
- イベント履歴の追跡
- 状態の永続化

## 依存関係
- `openhands.core`: 設定とロガー
- `openhands.events`: イベント処理
- `openhands.llm`: LLM統合
- `openhands.memory`: メモリ管理

## 使用例
```python
from openhands.controller.agent_controller import AgentController

controller = AgentController(
    agent=agent,
    max_iterations=10,
    event_stream=event_stream
)
```