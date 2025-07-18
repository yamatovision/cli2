from core.agents.orchestrator_agent.orchestrator_agent import OrchestratorAgent
from core.agents.agent import Agent

# OrchestratorAgentとして登録
Agent.register('OrchestratorAgent', OrchestratorAgent)
