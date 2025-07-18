from core.agents.extension_manager_agent.extension_manager_agent import ExtensionManagerAgent
from core.agents.agent import Agent

# ExtensionManagerAgentとして登録
Agent.register('ExtensionManagerAgent', ExtensionManagerAgent)
