from openhands.agenthub.blueprint_agent.blueprint_agent import BlueprintAgent
from openhands.controller.agent import Agent

# BlueprintAgentとして登録
Agent.register('BlueprintAgent', BlueprintAgent)
