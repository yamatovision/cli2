from dataclasses import dataclass

from core.events.action import Action
from core.events.observation import Observation
from core.runtime.plugins.agent_skills import agentskills
from core.runtime.plugins.requirement import Plugin, PluginRequirement


@dataclass
class AgentSkillsRequirement(PluginRequirement):
    name: str = 'agent_skills'
    documentation: str = agentskills.DOCUMENTATION


class AgentSkillsPlugin(Plugin):
    name: str = 'agent_skills'

    async def initialize(self, username: str) -> None:
        """Initialize the plugin."""
        pass

    async def run(self, action: Action) -> Observation:
        """Run the plugin for a given action."""
        raise NotImplementedError('AgentSkillsPlugin does not support run method')
