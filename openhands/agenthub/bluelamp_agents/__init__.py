"""
BlueLamp専門エージェント群

13個のBlueLampエージェントが14エージェント構造（00-13）にマッピング:
- 00: orchestrator (BlueprintAgent用)
- 01-13: 各BlueLampエージェントが対応
- 重複なし、Portal API統合完了
"""

from .agents import (
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
)
from openhands.controller.agent import Agent

# 13個のBlueLampエージェントを一括登録
# 各エージェントは14エージェント構造（00-13）のプロンプトにマッピング
# 
# マッピング詳細:
# RequirementsEngineer → requirements_engineer (01)
# UIUXDesigner → uiux_designer (02)
# DataModelingEngineer → data_modeling_engineer (03)
# SystemArchitect → system_architect (04)
# ImplementationConsultant → implementation_consultant (05)
# EnvironmentSetup → environment_setup (06)
# PrototypeImplementation → prc_implementation (07)
# BackendImplementation → debug_agent (08)
# TestQualityVerification → deploy_specialist (09)
# APIIntegration → expansion_orchestrator (10)
# DebugDetective → page_creator (11)
# DeploySpecialist → refactoring_planner (12)
# GitHubManager → refactoring_implementation (13)
BLUELAMP_AGENTS = [
    ('RequirementsEngineer', RequirementsEngineer),
    ('UIUXDesigner', UIUXDesigner),
    ('DataModelingEngineer', DataModelingEngineer),
    ('SystemArchitect', SystemArchitect),
    ('ImplementationConsultant', ImplementationConsultant),
    ('EnvironmentSetup', EnvironmentSetup),
    ('PrototypeImplementation', PrototypeImplementation),
    ('BackendImplementation', BackendImplementation),
    ('TestQualityVerification', TestQualityVerification),
    ('APIIntegration', APIIntegration),
    ('DebugDetective', DebugDetective),
    ('DeploySpecialist', DeploySpecialist),
    ('GitHubManager', GitHubManager),
]

for name, cls in BLUELAMP_AGENTS:
    Agent.register(name, cls)

__all__ = [name for name, _ in BLUELAMP_AGENTS]
