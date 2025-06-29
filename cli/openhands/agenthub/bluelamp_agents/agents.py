"""BlueLamp専門エージェント群"""

import os
from typing import List, Dict, Any, Optional
from openhands.agenthub.codeact_agent.codeact_agent import CodeActAgent
from openhands.controller.state.state import State
from openhands.events.action import AgentFinishAction
from openhands.utils.prompt import PromptManager
from openhands.core.logger import openhands_logger as logger


class BlueLampBaseAgent(CodeActAgent):
    """BlueLamp専門エージェントの基底クラス"""

    VERSION = '1.0'

    @property
    def prompt_manager(self) -> PromptManager:
        """BlueLampエージェント用のプロンプトマネージャーを返す"""
        if self._prompt_manager is None:
            # BlueLampエージェントのプロンプトディレクトリを使用
            prompt_dir = os.path.join(os.path.dirname(__file__), 'prompts')
            self._prompt_manager = PromptManager(
                prompt_dir=prompt_dir,
                system_prompt_filename=self.config.system_prompt_filename,
            )
        return self._prompt_manager

    def _get_tools(self) -> List[Any]:
        """委譲ツールを除外したツールリストを返す"""
        tools = super()._get_tools()
        # 委譲関連ツールを除外（delegate_で始まるツール名）
        filtered_tools = []
        for tool in tools:
            # ChatCompletionToolParamオブジェクトの場合
            if hasattr(tool, 'function') and hasattr(tool.function, 'name'):
                if not tool.function.name.startswith('delegate_'):
                    filtered_tools.append(tool)
            # dict形式の場合
            elif isinstance(tool, dict) and 'function' in tool:
                if not tool.get('function', {}).get('name', '').startswith('delegate_'):
                    filtered_tools.append(tool)
            else:
                # その他のツールはそのまま含める
                filtered_tools.append(tool)
        return filtered_tools


# 16個の専門エージェント定義
class RequirementsEngineer(BlueLampBaseAgent):
    """★1 要件定義エンジニア: プロジェクトの要件定義書を作成"""
    def __init__(self, llm: Any, config: Any = None):
        if config is None:
            from openhands.core.config import AgentConfig
            config = AgentConfig()
        config.system_prompt_filename = 'requirements_engineer.j2'
        super().__init__(llm, config)


class UIUXDesigner(BlueLampBaseAgent):
    """★2 UI/UXデザイナー: ユーザーインターフェースとエクスペリエンスを設計"""
    def __init__(self, llm: Any, config: Any = None):
        if config is None:
            from openhands.core.config import AgentConfig
            config = AgentConfig()
        config.system_prompt_filename = 'ui_ux_designer.j2'
        super().__init__(llm, config)


class DataModelingEngineer(BlueLampBaseAgent):
    """★3 データモデリングエンジニア: データベース設計とER図作成"""
    def __init__(self, llm: Any, config: Any = None):
        if config is None:
            from openhands.core.config import AgentConfig
            config = AgentConfig()
        config.system_prompt_filename = 'data_modeling_engineer.j2'
        super().__init__(llm, config)


class SystemArchitect(BlueLampBaseAgent):
    """★4 システムアーキテクト: システム全体のアーキテクチャ設計"""
    def __init__(self, llm: Any, config: Any = None):
        if config is None:
            from openhands.core.config import AgentConfig
            config = AgentConfig()
        config.system_prompt_filename = 'system_architect.j2'
        super().__init__(llm, config)


class ImplementationConsultant(BlueLampBaseAgent):
    """★5 実装計画コンサルタント: 実装戦略と技術選定"""
    def __init__(self, llm: Any, config: Any = None):
        if config is None:
            from openhands.core.config import AgentConfig
            config = AgentConfig()
        config.system_prompt_filename = 'implementation_consultant.j2'
        super().__init__(llm, config)


class EnvironmentSetup(BlueLampBaseAgent):
    """★6 環境構築: 開発環境とインフラ構築"""
    def __init__(self, llm: Any, config: Any = None):
        if config is None:
            from openhands.core.config import AgentConfig
            config = AgentConfig()
        config.system_prompt_filename = 'environment_setup.j2'
        super().__init__(llm, config)


class PrototypeImplementation(BlueLampBaseAgent):
    """★7 プロトタイプ実装: 初期プロトタイプとMVP開発"""
    def __init__(self, llm: Any, config: Any = None):
        if config is None:
            from openhands.core.config import AgentConfig
            config = AgentConfig()
        config.system_prompt_filename = 'prototype_implementation.j2'
        super().__init__(llm, config)


class BackendImplementation(BlueLampBaseAgent):
    """★8 バックエンド実装: サーバーサイドロジックとAPI開発"""
    def __init__(self, llm: Any, config: Any = None):
        if config is None:
            from openhands.core.config import AgentConfig
            config = AgentConfig()
        config.system_prompt_filename = 'backend_implementation.j2'
        super().__init__(llm, config)


class TestQualityVerification(BlueLampBaseAgent):
    """★9 テスト品質検証: テストコード作成と品質保証"""
    def __init__(self, llm: Any, config: Any = None):
        if config is None:
            from openhands.core.config import AgentConfig
            config = AgentConfig()
        config.system_prompt_filename = 'test_quality_verification.j2'
        super().__init__(llm, config)


class APIIntegration(BlueLampBaseAgent):
    """★10 API統合: 外部APIとの統合実装"""
    def __init__(self, llm: Any, config: Any = None):
        if config is None:
            from openhands.core.config import AgentConfig
            config = AgentConfig()
        config.system_prompt_filename = 'api_integration.j2'
        super().__init__(llm, config)


class DebugDetective(BlueLampBaseAgent):
    """★11 デバッグ探偵: バグ修正とエラー解決"""
    def __init__(self, llm: Any, config: Any = None):
        if config is None:
            from openhands.core.config import AgentConfig
            config = AgentConfig()
        config.system_prompt_filename = 'debug_detective.j2'
        super().__init__(llm, config)


class DeploySpecialist(BlueLampBaseAgent):
    """★12 デプロイスペシャリスト: デプロイメントとインフラ管理"""
    def __init__(self, llm: Any, config: Any = None):
        if config is None:
            from openhands.core.config import AgentConfig
            config = AgentConfig()
        config.system_prompt_filename = 'deploy_specialist.j2'
        super().__init__(llm, config)


class GitHubManager(BlueLampBaseAgent):
    """★13 GitHubマネージャー: Git管理とリポジトリ運用"""
    def __init__(self, llm: Any, config: Any = None):
        if config is None:
            from openhands.core.config import AgentConfig
            config = AgentConfig()
        config.system_prompt_filename = 'github_manager.j2'
        super().__init__(llm, config)


class TypeScriptManager(BlueLampBaseAgent):
    """★14 TypeScriptマネージャー: 型定義管理と型エラー修正"""
    def __init__(self, llm: Any, config: Any = None):
        if config is None:
            from openhands.core.config import AgentConfig
            config = AgentConfig()
        config.system_prompt_filename = 'typescript_manager.j2'
        super().__init__(llm, config)


class FeatureExtension(BlueLampBaseAgent):
    """★15 機能拡張: 新機能開発と既存機能強化"""
    def __init__(self, llm: Any, config: Any = None):
        if config is None:
            from openhands.core.config import AgentConfig
            config = AgentConfig()
        config.system_prompt_filename = 'feature_extension.j2'
        super().__init__(llm, config)


class RefactoringExpert(BlueLampBaseAgent):
    """★16 リファクタリングエキスパート: コード改善と最適化"""
    def __init__(self, llm: Any, config: Any = None):
        if config is None:
            from openhands.core.config import AgentConfig
            config = AgentConfig()
        config.system_prompt_filename = 'refactoring_expert.j2'
        super().__init__(llm, config)
