"""UI/UX Designer Agent"""

from openhands.agenthub.ui_ux_designer.ui_ux_designer import UIUXDesigner
from openhands.controller.agent import Agent

# エージェントを登録
Agent.register('UIUXDesigner', UIUXDesigner)

__all__ = ['UIUXDesigner']