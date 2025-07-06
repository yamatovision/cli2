"""
ExpertAgents - 16個の専門エージェント
★1～★12のプロンプトを使用する専門エージェント群
"""

from .base.specialist_agent_base import SpecialistAgentBase
from .requirements_agent import RequirementsAgent
from .ui_design_agent import UIDesignAgent

# 残りのエージェントは順次実装予定
# from .data_modeling_agent import DataModelingAgent
# from .architect_agent import ArchitectAgent
# from .implementation_agent import ImplementationAgent
# from .environment_agent import EnvironmentAgent
# from .prototype_agent import PrototypeAgent
# from .backend_agent import BackendAgent
# from .test_quality_agent import TestQualityAgent
# from .api_integration_agent import APIIntegrationAgent
# from .debug_agent import DebugAgent
# from .performance_agent import PerformanceAgent

__all__ = [
    'SpecialistAgentBase',
    'RequirementsAgent',
    'UIDesignAgent',
    # 残りのエージェントは順次追加予定
    # 'DataModelingAgent',
    # 'ArchitectAgent',
    # 'ImplementationAgent',
    # 'EnvironmentAgent',
    # 'PrototypeAgent',
    # 'BackendAgent',
    # 'TestQualityAgent',
    # 'APIIntegrationAgent',
    # 'DebugAgent',
    # 'PerformanceAgent',
]