from openhands.agenthub.codeact_agent2.codeact_agent2 import CodeActAgent2
from openhands.controller.agent import Agent

# CodeActAgent2として登録（bluelamp3と一致させる）
Agent.register('CodeActAgent2', CodeActAgent2)
