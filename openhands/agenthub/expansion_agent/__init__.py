from openhands.agenthub.expansion_agent.expansion_agent import ExpansionAgent
from openhands.controller.agent import Agent

# ExpansionAgentとして登録
Agent.register('ExpansionAgent', ExpansionAgent)
# 後方互換性のため既存も残す（expansion用）
try:
    Agent.register('CodeActAgent3', ExpansionAgent)
except Exception:
    pass  # 既に登録済みの場合はスキップ
