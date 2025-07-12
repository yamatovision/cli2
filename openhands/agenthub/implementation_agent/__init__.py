from openhands.agenthub.implementation_agent.implementation_agent import ImplementationAgent
from openhands.controller.agent import Agent

# ImplementationAgentとして登録
Agent.register('ImplementationAgent', ImplementationAgent)
