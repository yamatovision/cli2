from openhands.agenthub.codeact_agent.codeact_agent import CodeActAgent
from openhands.controller.agent import Agent

# BlueLampOrchestratorとして登録
Agent.register('BlueLampOrchestrator', CodeActAgent)
# 後方互換性のため既存も残す
Agent.register('CodeActAgent', CodeActAgent)
