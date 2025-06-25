from openhands.agenthub.codeact_agent.api_integration_agent import ApiIntegrationAgent
from openhands.agenthub.codeact_agent.backend_agent import BackendAgent
from openhands.agenthub.codeact_agent.codeact_agent import CodeActAgent
from openhands.agenthub.codeact_agent.data_modeling_engineer_agent import DataModelingEngineerAgent
from openhands.agenthub.codeact_agent.debug_detective_agent import DebugDetectiveAgent
from openhands.agenthub.codeact_agent.deploy_specialist_agent import DeploySpecialistAgent
from openhands.agenthub.codeact_agent.deployment_agent import DeploymentAgent
from openhands.agenthub.codeact_agent.environment_setup_agent import EnvironmentSetupAgent
from openhands.agenthub.codeact_agent.feature_expansion_agent import FeatureExpansionAgent
from openhands.agenthub.codeact_agent.frontend_agent import FrontendAgent
from openhands.agenthub.codeact_agent.github_manager_agent import GitHubManagerAgent
from openhands.agenthub.codeact_agent.implementation_consultant_agent import ImplementationConsultantAgent
from openhands.agenthub.codeact_agent.prototype_implementation_agent import PrototypeImplementationAgent
from openhands.agenthub.codeact_agent.refactoring_expert_agent import RefactoringExpertAgent
from openhands.agenthub.codeact_agent.requirements_engineer_agent import RequirementsEngineerAgent
from openhands.agenthub.codeact_agent.system_architect_agent import SystemArchitectAgent
from openhands.agenthub.codeact_agent.test_quality_verification_agent import TestQualityVerificationAgent
from openhands.agenthub.codeact_agent.typescript_manager_agent import TypeScriptManagerAgent
from openhands.agenthub.codeact_agent.uiux_designer_agent import UIUXDesignerAgent
from openhands.controller.agent import Agent

# Original orchestrator agent
Agent.register('CodeActAgent', CodeActAgent)

# 16 Microagents System (numbered according to microagents/*.md)
Agent.register('01_requirements_engineer', RequirementsEngineerAgent)  # ★1 要件定義エンジニア
Agent.register('02_uiux_designer', UIUXDesignerAgent)                  # ★2 UIUXデザイナー
Agent.register('03_data_modeling_engineer', DataModelingEngineerAgent) # ★3 データモデリングエンジニア
Agent.register('04_system_architect', SystemArchitectAgent)           # ★4 システムアーキテクト
Agent.register('05_implementation_consultant', ImplementationConsultantAgent) # ★5 実装計画コンサルタント
Agent.register('06_environment_setup', EnvironmentSetupAgent)         # ★6 環境セットアップ
Agent.register('07_prototype_implementation', PrototypeImplementationAgent) # ★7 プロトタイプ実装
Agent.register('08_backend_implementation', BackendAgent)              # ★8 バックエンド実装
Agent.register('09_test_quality_verification', TestQualityVerificationAgent) # ★9 テスト品質検証
Agent.register('10_api_integration', ApiIntegrationAgent)             # ★10 API統合
Agent.register('11_debug_detective', DebugDetectiveAgent)              # ★11 デバッグ探偵
Agent.register('12_deploy_specialist', DeploySpecialistAgent)          # ★12 デプロイスペシャリスト
Agent.register('13_github_manager', GitHubManagerAgent)               # ★13 GitHubマネージャー
Agent.register('14_typescript_manager', TypeScriptManagerAgent)        # ★14 TypeScriptマネージャー
Agent.register('15_feature_expansion', FeatureExpansionAgent)          # ★15 機能拡張プランナー
Agent.register('16_refactoring_expert', RefactoringExpertAgent)        # ★16 リファクタリングエキスパート
Agent.register('frontend', FrontendAgent)                             # フロントエンド（番号未確定）
Agent.register('deployment', DeploymentAgent)                         # デプロイ（番号未確定）

# Legacy aliases (for backward compatibility)
Agent.register('requirements_engineer', RequirementsEngineerAgent)
Agent.register('uiux_designer', UIUXDesignerAgent)
Agent.register('data_modeling_engineer', DataModelingEngineerAgent)
Agent.register('system_architect', SystemArchitectAgent)
Agent.register('implementation_consultant', ImplementationConsultantAgent)
Agent.register('environment_setup', EnvironmentSetupAgent)
Agent.register('prototype_implementation', PrototypeImplementationAgent)
Agent.register('test_quality_verification', TestQualityVerificationAgent)
Agent.register('api_integration', ApiIntegrationAgent)
Agent.register('debug_detective', DebugDetectiveAgent)
Agent.register('deploy_specialist', DeploySpecialistAgent)
Agent.register('github_manager', GitHubManagerAgent)
Agent.register('typescript_manager', TypeScriptManagerAgent)
Agent.register('feature_expansion', FeatureExpansionAgent)
Agent.register('refactoring_expert', RefactoringExpertAgent)
Agent.register('backend', BackendAgent)
