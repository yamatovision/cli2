"""Data Modeling Engineer Agent"""

from openhands.agenthub.data_modeling_engineer.data_modeling_engineer import DataModelingEngineer
from openhands.controller.agent import Agent

# エージェントを登録
Agent.register('DataModelingEngineer', DataModelingEngineer)

__all__ = ['DataModelingEngineer']