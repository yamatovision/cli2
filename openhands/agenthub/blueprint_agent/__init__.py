from openhands.agenthub.blueprint_agent.blueprint_agent import BlueprintAgent
from openhands.controller.agent import Agent

# BlueprintAgentとして登録
Agent.register('BlueprintAgent', BlueprintAgent)
# 後方互換性のため既存も残す
Agent.register('CodeActAgent', BlueprintAgent)
Agent.register('BlueLampOrchestrator', BlueprintAgent)
