"""
BlueLamp専門エージェント群

14個のBlueLampエージェントが新構造（01-14）にマッピング:
- 01-14: 各BlueLampエージェントが対応
- 07: プロトタイプ実装（新設）
- 08: 実装エージェント（PRC実装から名称変更）
- 14: AI親和性診断（新設）
- Portal API統合完了
"""

from .agents import (
    RequirementsEngineer,
    UIUXDesigner,
    DataModelingEngineer,
    SystemArchitect,
    ImplementationConsultant,
    EnvironmentSetup,
    PrototypeImplementation,
    ImplementationAgent,
    DebugAgent,
    DeploySpecialist,
    # ExpansionOrchestrator は ExtensionManagerAgent に統一
    PageCreator,
    RefactoringEngineer,
    AIFriendlinessDiagnostic,
)
from core.agents.agent import Agent

# 13個のBlueLamp専門エージェント - クラス名とプロンプトが一致
BLUELAMP_AGENTS = [
    ('RequirementsEngineer', RequirementsEngineer),
    ('UIUXDesigner', UIUXDesigner),
    ('DataModelingEngineer', DataModelingEngineer),
    ('SystemArchitect', SystemArchitect),
    ('ImplementationConsultant', ImplementationConsultant),
    ('EnvironmentSetup', EnvironmentSetup),
    ('PrototypeImplementation', PrototypeImplementation),
    ('ImplementationAgent', ImplementationAgent),
    ('DebugAgent', DebugAgent),
    ('DeploySpecialist', DeploySpecialist),
    # ExpansionOrchestrator は ExtensionManagerAgent に統一されました
    ('PageCreator', PageCreator),
    ('RefactoringEngineer', RefactoringEngineer),
    ('AIFriendlinessDiagnostic', AIFriendlinessDiagnostic),
]

for name, cls in BLUELAMP_AGENTS:
    Agent.register(name, cls)

__all__ = [name for name, _ in BLUELAMP_AGENTS]
