from openhands.agenthub.implementation_agent.implementation_agent import ImplementationAgent
from openhands.controller.agent import Agent

# ImplementationAgentとして登録
Agent.register('ImplementationAgent', ImplementationAgent)
# 後方互換性のため既存も残す（implementation用）
try:
    Agent.register('CodeActAgent2', ImplementationAgent)
except Exception:
    pass  # 既に登録済みの場合はスキップ
