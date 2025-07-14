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
    PrcImplementation,
    DebugAgent,
    DeploySpecialist,
    ExpansionOrchestrator,
    PageCreator,
    RefactoringPlanner,
    RefactoringImplementation,
)
from openhands.controller.agent import Agent

# 13個のBlueLampエージェント - クラス名とプロンプトが一致
BLUELAMP_AGENTS = [
    ('RequirementsEngineer', RequirementsEngineer),
    ('UIUXDesigner', UIUXDesigner),
    ('DataModelingEngineer', DataModelingEngineer),
    ('SystemArchitect', SystemArchitect),
    ('ImplementationConsultant', ImplementationConsultant),
    ('EnvironmentSetup', EnvironmentSetup),
    ('PrcImplementation', PrcImplementation),
    ('DebugAgent', DebugAgent),
    ('DeploySpecialist', DeploySpecialist),
    ('ExpansionOrchestrator', ExpansionOrchestrator),
    ('PageCreator', PageCreator),
    ('RefactoringPlanner', RefactoringPlanner),
    ('RefactoringImplementation', RefactoringImplementation),
]

for name, cls in BLUELAMP_AGENTS:
    Agent.register(name, cls)

__all__ = [name for name, _ in BLUELAMP_AGENTS]
