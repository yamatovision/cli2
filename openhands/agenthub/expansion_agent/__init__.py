from openhands.agenthub.expansion_agent.expansion_agent import ExpansionAgent
from openhands.controller.agent import Agent

# ExpansionAgentとして登録
Agent.register('ExpansionAgent', ExpansionAgent)
