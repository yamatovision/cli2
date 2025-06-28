"""Feature Extension Agent"""

from openhands.agenthub.feature_extension.feature_extension import FeatureExtension
from openhands.controller.agent import Agent

# エージェントを登録
Agent.register('FeatureExtension', FeatureExtension)

__all__ = ['FeatureExtension']