"""BlueLamp Orchestrator Agent Implementation"""

import os
from typing import List, Dict, Any, Optional
from openhands.agenthub.codeact_agent.codeact_agent import CodeActAgent
from openhands.controller.state.state import State
from openhands.controller.agent import Agent
from openhands.events.action import AgentDelegateAction, AgentFinishAction, MessageAction
from openhands.events.observation.delegate import AgentDelegateObservation
from openhands.utils.prompt import PromptManager
from openhands.core.logger import openhands_logger as logger


class BlueLampOrchestrator(CodeActAgent):
    """BlueLamp Orchestrator: 16の専門エージェントを統括するメインオーケストレーター"""
    
    VERSION = '1.0'
    
    def __init__(
        self,
        llm: Any,
        config: Any = None,
    ):
        super().__init__(llm=llm, config=config)
        self._prompt_manager = None
        self.delegated_agent = None
        self.delegation_count = 0
        
    @property
    def prompt_manager(self) -> PromptManager:
        """独自のプロンプトマネージャーを使用"""
        if self._prompt_manager is None:
            self._prompt_manager = PromptManager(
                prompt_dir=os.path.join(os.path.dirname(__file__), 'prompts'),
                system_prompt_filename=self.config.system_prompt_filename,
            )
        return self._prompt_manager
    
    def get_agent_for_task(self, task_type: str, context: Dict[str, Any]) -> Optional[str]:
        """タスクタイプに基づいて適切なエージェントを選択"""
        
        # エージェントマッピング
        agent_mapping = {
            'requirements': 'RequirementsEngineer',
            'ui_design': 'UIUXDesigner',
            'data_modeling': 'DataModelingEngineer',
            'system_architecture': 'SystemArchitect',
            'implementation_plan': 'ImplementationConsultant',
            'environment_setup': 'EnvironmentSetup',
            'prototype': 'PrototypeImplementation',
            'backend': 'BackendImplementation',
            'test': 'TestQualityVerification',
            'api_integration': 'APIIntegration',
            'debug': 'DebugDetective',
            'deploy': 'DeploySpecialist',
            'github': 'GitHubManager',
            'typescript': 'TypeScriptManager',
            'feature': 'FeatureExtension',
            'refactor': 'RefactoringExpert',
        }
        
        return agent_mapping.get(task_type)
    
    def create_delegation_inputs(self, task: str, requirements: Optional[str] = None, 
                               context: Optional[Dict[str, Any]] = None,
                               completion_criteria: Optional[str] = None) -> Dict[str, Any]:
        """委譲時の標準入力形式を作成"""
        inputs = {
            'task': task,
        }
        
        if requirements:
            inputs['requirements'] = requirements
            
        if context:
            inputs['context'] = context
            
        if completion_criteria:
            inputs['completion_criteria'] = completion_criteria
            
        return inputs
    
    def analyze_project_state(self, state: State) -> Dict[str, Any]:
        """プロジェクトの現在状態を分析"""
        # TODO: SCOPE_PROGRESS.mdを読み取って現在の状態を判断
        # 実装例：
        analysis = {
            'has_requirements': False,
            'has_mockups': False,
            'has_data_models': False,
            'has_implementation': False,
            'has_tests': False,
            'type_errors': [],
            'next_phase': 'requirements'
        }
        
        return analysis
    
    def step(self, state: State) -> AgentDelegateAction | AgentFinishAction | MessageAction:
        """BlueLampOrchestratorのメインステップ関数"""
        
        # 最新のメッセージを取得
        latest_event = state.history.get_last_event()
        
        # 委譲結果の処理
        if isinstance(latest_event, AgentDelegateObservation):
            logger.info(f"Received delegation result from {self.delegated_agent}")
            self.delegated_agent = None
            
            # 結果に基づいて次のアクションを決定
            if latest_event.outputs.get('task_completed') == 'TRUE':
                # プロジェクト状態を再分析
                project_state = self.analyze_project_state(state)
                
                # 次のタスクを決定
                if project_state['next_phase'] == 'complete':
                    return AgentFinishAction(
                        outputs={'message': 'プロジェクトが完了しました。すべてのタスクが正常に完了しています。'}
                    )
        
        # 初回実行またはユーザーからの新規要求
        if self.delegated_agent is None:
            project_state = self.analyze_project_state(state)
            
            # フェーズに基づいて次のエージェントを決定
            if not project_state['has_requirements']:
                # 要件定義フェーズ
                self.delegated_agent = 'RequirementsEngineer'
                return AgentDelegateAction(
                    agent=self.delegated_agent,
                    inputs=self.create_delegation_inputs(
                        task='プロジェクトの要件定義書を作成してください',
                        completion_criteria='requirements.mdファイルが作成され、SCOPE_PROGRESS.mdにページリストが記載されること'
                    )
                )
            
            elif not project_state['has_mockups']:
                # UI/UXデザインフェーズ
                self.delegated_agent = 'UIUXDesigner'
                return AgentDelegateAction(
                    agent=self.delegated_agent,
                    inputs=self.create_delegation_inputs(
                        task='次のページのモックアップを作成してください',
                        context={'requirements_path': '/docs/requirements.md'},
                        completion_criteria='mockups/ディレクトリにHTMLファイルが作成されること'
                    )
                )
            
            elif not project_state['has_data_models']:
                # データモデリングフェーズ
                self.delegated_agent = 'DataModelingEngineer'
                return AgentDelegateAction(
                    agent=self.delegated_agent,
                    inputs=self.create_delegation_inputs(
                        task='モックアップからデータモデルを設計してください',
                        context={'mockups_dir': '/mockups/'},
                        completion_criteria='frontend/src/types/index.tsとbackend/src/types/index.tsが作成されること'
                    )
                )
            
            # 型エラーがある場合は優先的に修正
            elif project_state['type_errors']:
                self.delegated_agent = 'TypeScriptManager'
                return AgentDelegateAction(
                    agent=self.delegated_agent,
                    inputs=self.create_delegation_inputs(
                        task='TypeScriptの型エラーを修正してください',
                        context={'errors': project_state['type_errors']},
                        completion_criteria='すべての型エラーが解消されること'
                    )
                )
        
        # デフォルトアクション
        return MessageAction(
            content="プロジェクトの状態を分析中です。次の適切なアクションを決定します。"
        )