# 🔄 セッション内エージェント切り替え機能 実装計画書

> **目的**: 同一セッション内でエージェントを動的に切り替える機能を実装し、16エージェント協調システムの基盤を構築

## 📋 **現状分析**

### ❌ **現在の状況**
- **セッション内切り替え機能は存在しない**
- エージェントは初期化時に固定される
- 切り替えには新しいセッション開始が必要

### ✅ **利用可能な既存機能**
```python
# 1. エージェントレジストリ（既存）
Agent._registry: dict[str, type['Agent']] = {}
Agent.get_cls(name: str) -> type['Agent']
Agent.list_agents() -> list[str]

# 2. AgentController構造（既存）
self.agent: Agent  # 単純な代入で交換可能
self.event_stream: EventStream  # セッション状態保持
self.state: State  # 会話履歴・ワークスペース保持

# 3. システムメッセージ機能（既存）
agent.get_system_message() -> SystemMessageAction
```

---

## 🎯 **実装概要**

### **核心アイデア**
```python
# 現在
controller = AgentController(agent=CodeActAgent())
# エージェント固定、変更不可

# 実装後
controller = AgentController(agent=CodeActAgent())
controller.switch_agent("★15機能拡張")  # 🆕 動的切り替え
controller.switch_agent("★11デバッグ探偵")  # 🆕 自由な切り替え
```

### **設計原則**
1. **セッション継続性**: 会話履歴・ワークスペース・ファイル状態を完全保持
2. **最小限の変更**: 既存システムへの影響を最小化
3. **後方互換性**: 既存の使用方法を破壊しない
4. **拡張性**: 16エージェントシステムに対応

---

## 🔧 **詳細実装計画**

### **Phase 1: コア機能実装**

#### **1.1 AgentController拡張**

**ファイル**: `openhands/controller/agent_controller.py`

```python
class AgentController:
    def __init__(self, ...):
        # 既存の初期化処理
        self.agent = agent
        self.agent_history: list[str] = []  # 🆕 切り替え履歴
        self.original_agent_name = agent.name  # 🆕 初期エージェント記録
    
    def switch_agent(self, agent_name: str) -> dict:
        """セッション内でエージェントを切り替え
        
        Args:
            agent_name (str): 切り替え先エージェント名
            
        Returns:
            dict: 切り替え結果
                - success (bool): 成功/失敗
                - message (str): 結果メッセージ
                - previous_agent (str): 前のエージェント名
                - current_agent (str): 現在のエージェント名
        """
        try:
            # 1. 入力検証
            available_agents = Agent.list_agents()
            if agent_name not in available_agents:
                return {
                    "success": False,
                    "message": f"エージェント '{agent_name}' は利用できません",
                    "available_agents": available_agents,
                    "previous_agent": self.agent.name,
                    "current_agent": self.agent.name
                }
            
            # 2. 現在のエージェント情報保存
            previous_agent_name = self.agent.name
            
            # 3. 新しいエージェント作成
            agent_cls = Agent.get_cls(agent_name)
            new_agent = agent_cls(
                llm=self.agent.llm,  # LLM設定継承
                config=self.agent.config  # 設定継承
            )
            
            # 4. プロンプトマネージャー初期化
            self._initialize_agent_prompt_manager(new_agent)
            
            # 5. エージェント交換
            self.agent = new_agent
            
            # 6. 切り替え履歴記録
            self.agent_history.append(f"{previous_agent_name} -> {agent_name}")
            
            # 7. システムメッセージ更新
            self._update_system_message(agent_name, previous_agent_name)
            
            # 8. 切り替え通知
            self._notify_agent_switch(previous_agent_name, agent_name)
            
            return {
                "success": True,
                "message": f"エージェントを {previous_agent_name} から {agent_name} に切り替えました",
                "previous_agent": previous_agent_name,
                "current_agent": agent_name,
                "switch_count": len(self.agent_history)
            }
            
        except Exception as e:
            logger.error(f"エージェント切り替えエラー: {e}")
            return {
                "success": False,
                "message": f"切り替えに失敗しました: {str(e)}",
                "previous_agent": self.agent.name,
                "current_agent": self.agent.name
            }
    
    def _initialize_agent_prompt_manager(self, agent: Agent) -> None:
        """新しいエージェントのプロンプトマネージャーを初期化"""
        from openhands.utils.prompt import PromptManager
        
        # プロンプトマネージャー作成
        agent._prompt_manager = PromptManager(
            agent_name=agent.name,
            microagent_dir=self.agent._prompt_manager.microagent_dir if hasattr(self.agent, '_prompt_manager') else None
        )
    
    def _update_system_message(self, new_agent_name: str, previous_agent_name: str) -> None:
        """システムメッセージを新しいエージェント用に更新"""
        system_msg = self.agent.get_system_message()
        if system_msg:
            # システムメッセージにコンテクスト追加
            context_info = f"\n\n--- エージェント切り替え情報 ---\n"
            context_info += f"前のエージェント: {previous_agent_name}\n"
            context_info += f"現在のエージェント: {new_agent_name}\n"
            context_info += f"セッション継続中: 過去の会話履歴とワークスペース状態を引き継いでいます\n"
            
            system_msg.content += context_info
            self.event_stream.add_event(system_msg, EventSource.AGENT)
    
    def _notify_agent_switch(self, previous_agent: str, current_agent: str) -> None:
        """エージェント切り替えをユーザーに通知"""
        from openhands.events.observation.message import MessageObservation
        
        notification = MessageObservation(
            content=f"🔄 エージェント切り替え完了\n"
                   f"📤 {previous_agent}\n"
                   f"📥 {current_agent}\n"
                   f"💾 セッション状態: 継続中"
        )
        self.event_stream.add_event(notification, EventSource.AGENT)
    
    def get_agent_info(self) -> dict:
        """現在のエージェント情報を取得"""
        return {
            "current_agent": self.agent.name,
            "original_agent": self.original_agent_name,
            "switch_history": self.agent_history,
            "available_agents": Agent.list_agents(),
            "session_id": self.id
        }
```

#### **1.2 CLIコマンド実装**

**ファイル**: `openhands/cli/commands.py` (新規作成)

```python
"""セッション内エージェント切り替えコマンド"""

import re
from typing import Optional
from openhands.controller.agent_controller import AgentController
from openhands.controller.agent import Agent
from openhands.core.logger import openhands_logger as logger


class AgentSwitchCommand:
    """エージェント切り替えコマンドハンドラー"""
    
    SWITCH_PATTERN = re.compile(r'^/switch\s+(.+)$', re.IGNORECASE)
    LIST_PATTERN = re.compile(r'^/agents?$', re.IGNORECASE)
    INFO_PATTERN = re.compile(r'^/info$', re.IGNORECASE)
    HELP_PATTERN = re.compile(r'^/help$', re.IGNORECASE)
    
    def __init__(self, controller: AgentController):
        self.controller = controller
    
    def handle_command(self, user_input: str) -> Optional[dict]:
        """コマンドを処理
        
        Args:
            user_input (str): ユーザー入力
            
        Returns:
            Optional[dict]: コマンド処理結果（Noneの場合は通常メッセージとして処理）
        """
        user_input = user_input.strip()
        
        # /switch コマンド
        if match := self.SWITCH_PATTERN.match(user_input):
            agent_name = match.group(1).strip()
            return self._handle_switch(agent_name)
        
        # /agents コマンド
        elif self.LIST_PATTERN.match(user_input):
            return self._handle_list_agents()
        
        # /info コマンド
        elif self.INFO_PATTERN.match(user_input):
            return self._handle_agent_info()
        
        # /help コマンド
        elif self.HELP_PATTERN.match(user_input):
            return self._handle_help()
        
        return None  # 通常メッセージとして処理
    
    def _handle_switch(self, agent_name: str) -> dict:
        """エージェント切り替え処理"""
        result = self.controller.switch_agent(agent_name)
        
        if result["success"]:
            print(f"✅ {result['message']}")
            logger.info(f"Agent switched: {result['previous_agent']} -> {result['current_agent']}")
        else:
            print(f"❌ {result['message']}")
            if "available_agents" in result:
                print(f"利用可能なエージェント: {', '.join(result['available_agents'])}")
        
        return result
    
    def _handle_list_agents(self) -> dict:
        """利用可能エージェント一覧表示"""
        try:
            agents = Agent.list_agents()
            current_agent = self.controller.agent.name
            
            print("\n📋 利用可能なエージェント:")
            for agent in sorted(agents):
                marker = "👉" if agent == current_agent else "  "
                print(f"{marker} {agent}")
            
            print(f"\n現在のエージェント: {current_agent}")
            
            return {
                "success": True,
                "agents": agents,
                "current_agent": current_agent
            }
        except Exception as e:
            print(f"❌ エージェント一覧取得エラー: {e}")
            return {"success": False, "error": str(e)}
    
    def _handle_agent_info(self) -> dict:
        """現在のエージェント情報表示"""
        info = self.controller.get_agent_info()
        
        print(f"\n🤖 エージェント情報:")
        print(f"現在: {info['current_agent']}")
        print(f"初期: {info['original_agent']}")
        print(f"切り替え回数: {len(info['switch_history'])}")
        
        if info['switch_history']:
            print(f"\n📜 切り替え履歴:")
            for i, switch in enumerate(info['switch_history'], 1):
                print(f"  {i}. {switch}")
        
        return info
    
    def _handle_help(self) -> dict:
        """ヘルプ表示"""
        help_text = """
🔄 セッション内エージェント切り替えコマンド

📋 利用可能コマンド:
  /switch <エージェント名>  - エージェントを切り替え
  /agents                  - 利用可能エージェント一覧
  /info                    - 現在のエージェント情報
  /help                    - このヘルプを表示

💡 使用例:
  /switch ★15機能拡張
  /switch CodeActAgent
  /agents
  /info

🔑 特徴:
  • セッション状態（会話履歴・ワークスペース）を完全保持
  • 任意の順序でエージェント切り替え可能
  • 16エージェントシステム対応
        """
        print(help_text)
        
        return {"success": True, "help_displayed": True}
```

#### **1.3 メインループ統合**

**ファイル**: `openhands/cli/main.py` (修正)

```python
# 既存のmain.pyに追加
from openhands.cli.commands import AgentSwitchCommand

async def main_loop(controller: AgentController):
    """メインループにコマンド処理を統合"""
    
    # コマンドハンドラー初期化
    command_handler = AgentSwitchCommand(controller)
    
    print("🚀 OpenHands CLI開始")
    print("💡 /help でコマンド一覧を表示")
    
    while True:
        try:
            user_input = input(f"[{controller.agent.name}] > ")
            
            if not user_input.strip():
                continue
            
            # 終了コマンド
            if user_input.lower() in ['/exit', '/quit', 'exit', 'quit']:
                print("👋 セッションを終了します")
                break
            
            # エージェント切り替えコマンド処理
            command_result = command_handler.handle_command(user_input)
            
            if command_result is not None:
                # コマンドが処理された場合、エージェントには送信しない
                continue
            
            # 通常のメッセージとしてエージェントに送信
            await controller.add_user_message(user_input)
            
        except KeyboardInterrupt:
            print("\n👋 セッションを終了します")
            break
        except Exception as e:
            logger.error(f"メインループエラー: {e}")
            print(f"❌ エラーが発生しました: {e}")
```

---

### **Phase 2: 16エージェントシステム対応**

#### **2.1 専用エージェント実装**

**ディレクトリ構造**:
```
openhands/agenthub/
├── genius_agents/              # 🆕 16エージェント専用
│   ├── __init__.py
│   ├── base_genius_agent.py    # 基底クラス
│   ├── requirements_agent.py   # ★1要件定義エンジニア
│   ├── ui_design_agent.py      # ★2UI/UXデザイナー
│   ├── data_modeling_agent.py  # ★3データモデリングエンジニア
│   ├── architect_agent.py      # ★4システムアーキテクト
│   ├── implementation_agent.py # ★5実装コンサルタント
│   ├── environment_agent.py    # ★6環境構築
│   ├── prototype_agent.py      # ★7プロトタイプ実装
│   ├── backend_agent.py        # ★8バックエンド実装
│   ├── test_agent.py           # ★9テスト品質検証
│   ├── api_integration_agent.py # ★10API統合
│   ├── debug_agent.py          # ★11デバッグ探偵
│   ├── deploy_agent.py         # ★12デプロイスペシャリスト
│   ├── git_agent.py            # ★13GitHubマネージャー
│   ├── typescript_agent.py     # ★14TypeScriptマネージャー
│   ├── feature_agent.py        # ★15機能拡張
│   └── refactor_agent.py       # ★16リファクタリングエキスパート
```

**基底クラス**: `openhands/agenthub/genius_agents/base_genius_agent.py`

```python
"""16エージェントシステム基底クラス"""

from abc import abstractmethod
from openhands.agenthub.codeact_agent.codeact_agent import CodeActAgent
from openhands.core.config import AgentConfig
from openhands.llm.llm import LLM


class BaseGeniusAgent(CodeActAgent):
    """16エージェントシステムの基底クラス
    
    CodeActAgentの機能を継承し、専門特化したプロンプトとツールを追加
    """
    
    # 各エージェントで定義する必須フィールド
    AGENT_NUMBER: str = ""  # "★1", "★2", etc.
    AGENT_ROLE: str = ""    # "要件定義エンジニア", "UI/UXデザイナー", etc.
    SPECIALIZATION: list[str] = []  # 専門分野
    
    def __init__(self, llm: LLM, config: AgentConfig):
        super().__init__(llm, config)
        self._setup_specialized_prompt()
        self._setup_specialized_tools()
    
    @abstractmethod
    def _setup_specialized_prompt(self) -> None:
        """専門特化したプロンプトを設定"""
        pass
    
    @abstractmethod
    def _setup_specialized_tools(self) -> None:
        """専門特化したツールを設定"""
        pass
    
    @property
    def name(self) -> str:
        """エージェント名を返す"""
        return f"{self.AGENT_NUMBER}{self.AGENT_ROLE}"
    
    def get_agent_description(self) -> str:
        """エージェントの説明を返す"""
        return f"""
{self.name}

専門分野:
{chr(10).join(f"• {spec}" for spec in self.SPECIALIZATION)}

基本機能: CodeActAgentの全機能 + 専門特化機能
        """
```

**具体例**: `openhands/agenthub/genius_agents/debug_agent.py`

```python
"""★11デバッグ探偵エージェント"""

from openhands.agenthub.genius_agents.base_genius_agent import BaseGeniusAgent
from openhands.core.config import AgentConfig
from openhands.llm.llm import LLM


class DebugAgent(BaseGeniusAgent):
    """★11デバッグ探偵 - バグの根本原因分析と効率的な修正を専門とするエージェント"""
    
    AGENT_NUMBER = "★11"
    AGENT_ROLE = "デバッグ探偵"
    SPECIALIZATION = [
        "バグの根本原因分析",
        "効率的なデバッグ手法",
        "テスト駆動デバッグ",
        "パフォーマンス問題の特定",
        "ログ分析とエラートレース",
        "再現可能なテストケース作成"
    ]
    
    def _setup_specialized_prompt(self) -> None:
        """デバッグ専門のプロンプトを設定"""
        debug_prompt = """
あなたは★11デバッグ探偵です。

【専門分野】
• バグの根本原因分析
• 効率的なデバッグ手法
• テスト駆動デバッグ
• パフォーマンス問題の特定
• ログ分析とエラートレース
• 再現可能なテストケース作成

【デバッグアプローチ】
1. 問題の再現手順を明確化
2. ログとエラーメッセージの詳細分析
3. 仮説立案と検証
4. 最小限の修正で根本解決
5. 回帰テストケース作成

【性格・思考パターン】
• 論理的で体系的
• 問題を細分化して分析
• 再現可能性を重視
• 根本原因にフォーカス
• 予防的な観点も考慮

【禁止事項】
• 表面的な修正
• 根拠のない推測
• テストなしの修正
• 副作用の無視
        """
        
        # プロンプトマネージャーに設定
        if hasattr(self, '_prompt_manager') and self._prompt_manager:
            self._prompt_manager.add_specialized_prompt("debug", debug_prompt)
    
    def _setup_specialized_tools(self) -> None:
        """デバッグ専門のツールを設定"""
        debug_tools = [
            {
                "type": "function",
                "function": {
                    "name": "analyze_error_log",
                    "description": "エラーログを分析して根本原因を特定",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "log_content": {"type": "string", "description": "分析するログ内容"},
                            "error_type": {"type": "string", "description": "エラーの種類"}
                        },
                        "required": ["log_content"]
                    }
                }
            },
            {
                "type": "function", 
                "function": {
                    "name": "create_reproduction_test",
                    "description": "バグの再現テストケースを作成",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "bug_description": {"type": "string", "description": "バグの説明"},
                            "expected_behavior": {"type": "string", "description": "期待される動作"},
                            "actual_behavior": {"type": "string", "description": "実際の動作"}
                        },
                        "required": ["bug_description", "expected_behavior", "actual_behavior"]
                    }
                }
            }
        ]
        
        # ツールを追加
        for tool in debug_tools:
            self.tools.append(tool)
```

#### **2.2 エージェント登録システム**

**ファイル**: `openhands/agenthub/genius_agents/__init__.py`

```python
"""16エージェントシステム自動登録"""

from openhands.controller.agent import Agent
from openhands.core.logger import openhands_logger as logger

# 16エージェントをインポート
from .requirements_agent import RequirementsAgent
from .ui_design_agent import UIDesignAgent
from .data_modeling_agent import DataModelingAgent
from .architect_agent import ArchitectAgent
from .implementation_agent import ImplementationAgent
from .environment_agent import EnvironmentAgent
from .prototype_agent import PrototypeAgent
from .backend_agent import BackendAgent
from .test_agent import TestAgent
from .api_integration_agent import APIIntegrationAgent
from .debug_agent import DebugAgent
from .deploy_agent import DeployAgent
from .git_agent import GitAgent
from .typescript_agent import TypeScriptAgent
from .feature_agent import FeatureAgent
from .refactor_agent import RefactorAgent


def register_genius_agents():
    """16エージェントをシステムに登録"""
    
    agents = {
        "★1要件定義エンジニア": RequirementsAgent,
        "★2UI/UXデザイナー": UIDesignAgent,
        "★3データモデリングエンジニア": DataModelingAgent,
        "★4システムアーキテクト": ArchitectAgent,
        "★5実装コンサルタント": ImplementationAgent,
        "★6環境構築": EnvironmentAgent,
        "★7プロトタイプ実装": PrototypeAgent,
        "★8バックエンド実装": BackendAgent,
        "★9テスト品質検証": TestAgent,
        "★10API統合": APIIntegrationAgent,
        "★11デバッグ探偵": DebugAgent,
        "★12デプロイスペシャリスト": DeployAgent,
        "★13GitHubマネージャー": GitAgent,
        "★14TypeScriptマネージャー": TypeScriptAgent,
        "★15機能拡張": FeatureAgent,
        "★16リファクタリングエキスパート": RefactorAgent,
    }
    
    registered_count = 0
    for name, agent_cls in agents.items():
        try:
            Agent.register(name, agent_cls)
            registered_count += 1
            logger.info(f"Registered agent: {name}")
        except Exception as e:
            logger.error(f"Failed to register agent {name}: {e}")
    
    logger.info(f"Successfully registered {registered_count}/16 genius agents")
    return registered_count


# 自動登録実行
register_genius_agents()
```

---

### **Phase 3: 統合テスト・検証**

#### **3.1 単体テスト**

**ファイル**: `tests/unit/test_agent_switching.py`

```python
"""セッション内エージェント切り替え機能のテスト"""

import pytest
from unittest.mock import Mock, patch

from openhands.controller.agent_controller import AgentController
from openhands.controller.agent import Agent
from openhands.agenthub.codeact_agent.codeact_agent import CodeActAgent
from openhands.cli.commands import AgentSwitchCommand


class TestAgentSwitching:
    """エージェント切り替え機能のテストクラス"""
    
    @pytest.fixture
    def mock_controller(self):
        """モックAgentControllerを作成"""
        controller = Mock(spec=AgentController)
        controller.agent = Mock(spec=CodeActAgent)
        controller.agent.name = "CodeActAgent"
        controller.agent_history = []
        controller.original_agent_name = "CodeActAgent"
        return controller
    
    def test_switch_agent_success(self, mock_controller):
        """正常なエージェント切り替えテスト"""
        # モック設定
        with patch.object(Agent, 'list_agents', return_value=['CodeActAgent', '★11デバッグ探偵']):
            with patch.object(Agent, 'get_cls') as mock_get_cls:
                mock_new_agent = Mock()
                mock_new_agent.name = "★11デバッグ探偵"
                mock_get_cls.return_value = Mock(return_value=mock_new_agent)
                
                # 実際のメソッドを呼び出し
                controller = AgentController.__new__(AgentController)
                controller.agent = Mock()
                controller.agent.name = "CodeActAgent"
                controller.agent.llm = Mock()
                controller.agent.config = Mock()
                controller.agent_history = []
                controller.event_stream = Mock()
                
                result = controller.switch_agent("★11デバッグ探偵")
                
                # 結果検証
                assert result["success"] is True
                assert "CodeActAgent" in result["message"]
                assert "★11デバッグ探偵" in result["message"]
    
    def test_switch_agent_invalid_name(self, mock_controller):
        """無効なエージェント名でのテスト"""
        with patch.object(Agent, 'list_agents', return_value=['CodeActAgent']):
            controller = AgentController.__new__(AgentController)
            controller.agent = Mock()
            controller.agent.name = "CodeActAgent"
            
            result = controller.switch_agent("InvalidAgent")
            
            assert result["success"] is False
            assert "利用できません" in result["message"]
    
    def test_command_handler_switch(self):
        """コマンドハンドラーのテスト"""
        mock_controller = Mock()
        mock_controller.switch_agent.return_value = {
            "success": True,
            "message": "切り替え完了"
        }
        
        handler = AgentSwitchCommand(mock_controller)
        result = handler.handle_command("/switch ★11デバッグ探偵")
        
        assert result is not None
        assert result["success"] is True
        mock_controller.switch_agent.assert_called_once_with("★11デバッグ探偵")
    
    def test_command_handler_list(self):
        """エージェント一覧コマンドのテスト"""
        mock_controller = Mock()
        mock_controller.agent.name = "CodeActAgent"
        
        with patch.object(Agent, 'list_agents', return_value=['CodeActAgent', '★11デバッグ探偵']):
            handler = AgentSwitchCommand(mock_controller)
            result = handler.handle_command("/agents")
            
            assert result["success"] is True
            assert "CodeActAgent" in result["agents"]
            assert "★11デバッグ探偵" in result["agents"]
```

#### **3.2 統合テスト**

**ファイル**: `tests/integration/test_agent_switching_integration.py`

```python
"""エージェント切り替え統合テスト"""

import pytest
import asyncio
from openhands.controller.agent_controller import AgentController
from openhands.events import EventStream
from openhands.agenthub.codeact_agent.codeact_agent import CodeActAgent


class TestAgentSwitchingIntegration:
    """エージェント切り替えの統合テスト"""
    
    @pytest.fixture
    async def controller(self):
        """実際のAgentControllerを作成"""
        event_stream = EventStream("test_session")
        agent = CodeActAgent(llm=Mock(), config=Mock())
        
        controller = AgentController(
            agent=agent,
            event_stream=event_stream,
            iteration_delta=10
        )
        
        yield controller
        
        await controller.close()
    
    @pytest.mark.asyncio
    async def test_session_continuity(self, controller):
        """セッション継続性のテスト"""
        # 初期メッセージ追加
        await controller.add_user_message("テストメッセージ1")
        
        # 履歴確認
        initial_history_length = len(controller.state.history)
        assert initial_history_length > 0
        
        # エージェント切り替え
        result = controller.switch_agent("★11デバッグ探偵")
        assert result["success"] is True
        
        # 履歴が保持されているか確認
        assert len(controller.state.history) >= initial_history_length
        
        # 新しいメッセージ追加
        await controller.add_user_message("テストメッセージ2")
        
        # 履歴が継続されているか確認
        assert len(controller.state.history) > initial_history_length
    
    @pytest.mark.asyncio
    async def test_multiple_switches(self, controller):
        """複数回切り替えのテスト"""
        switches = [
            "★11デバッグ探偵",
            "★15機能拡張", 
            "★16リファクタリングエキスパート",
            "CodeActAgent"
        ]
        
        for agent_name in switches:
            result = controller.switch_agent(agent_name)
            assert result["success"] is True
            assert controller.agent.name == agent_name
        
        # 切り替え履歴確認
        assert len(controller.agent_history) == len(switches)
```

---

## 📋 **実装スケジュール**

### **Week 1: コア機能実装**
- [ ] AgentController.switch_agent()メソッド実装
- [ ] 基本的なエラーハンドリング
- [ ] 単体テスト作成・実行

### **Week 2: CLI統合**
- [ ] AgentSwitchCommandクラス実装
- [ ] メインループ統合
- [ ] コマンドパーサー実装

### **Week 3: 16エージェント対応**
- [ ] BaseGeniusAgentクラス実装
- [ ] 主要エージェント（★11, ★15, ★16）実装
- [ ] エージェント登録システム実装

### **Week 4: テスト・検証**
- [ ] 統合テスト実装・実行
- [ ] パフォーマンステスト
- [ ] ドキュメント作成

---

## 🎯 **成功指標**

### **機能要件**
- [ ] `/switch <エージェント名>` でエージェント切り替え可能
- [ ] セッション状態（履歴・ワークスペース）完全保持
- [ ] 16エージェント全てに切り替え可能
- [ ] エラー時の適切なフォールバック

### **非機能要件**
- [ ] 切り替え時間 < 1秒
- [ ] メモリ使用量増加 < 10%
- [ ] 既存機能への影響なし
- [ ] 後方互換性維持

### **ユーザビリティ**
- [ ] 直感的なコマンド体系
- [ ] 明確なエラーメッセージ
- [ ] ヘルプ機能完備
- [ ] 切り替え状況の可視化

---

## 🚀 **使用例**

```bash
# セッション開始
$ openhands-cli --agent CodeActAgent

[CodeActAgent] > プロジェクトを作成してください
CodeActAgent: プロジェクトを作成しました...

# 機能拡張フェーズに移行
[CodeActAgent] > /switch ★15機能拡張
✅ エージェントを CodeActAgent から ★15機能拡張 に切り替えました

[★15機能拡張] > 新しいユーザー認証機能を追加したい
★15機能拡張: 新機能の要件を分析し、実装計画を作成します...

# デバッグが必要になった場合
[★15機能拡張] > /switch ★11デバッグ探偵
✅ エージェントを ★15機能拡張 から ★11デバッグ探偵 に切り替えました

[★11デバッグ探偵] > 認証機能にバグがあります
★11デバッグ探偵: バグの詳細を調査し、根本原因を特定します...

# 情報確認
[★11デバッグ探偵] > /info
🤖 エージェント情報:
現在: ★11デバッグ探偵
初期: CodeActAgent
切り替え回数: 2

📜 切り替え履歴:
  1. CodeActAgent -> ★15機能拡張
  2. ★15機能拡張 -> ★11デバッグ探偵
```

---

## 🎉 **まとめ**

**セッション内エージェント切り替え機能は完全に新規実装が必要**ですが、**既存システムの構造を最大限活用**することで、**比較的簡単に実装可能**です。

### **実装の容易さの理由**
1. **エージェントレジストリ既存**: Agent._registry活用
2. **単純な代入**: self.agent = new_agent
3. **セッション状態保持**: 既存のEventStream・State活用
4. **最小限の変更**: 既存システムへの影響最小

### **16エージェント協調システムの基盤**
この実装により、**構築フェーズ（委譲）+ 拡張フェーズ（切り替え）**のハイブリッドシステムが実現し、ユーザーの「継続的な専門作業」要求に完璧に応えることができます。