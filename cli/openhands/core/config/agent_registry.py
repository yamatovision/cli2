"""Agent Registry for BlueLamp 16-Agent System"""

import os
import tomllib
from typing import Dict, List, Optional

from openhands.core.config.agent_config import AgentConfig
from openhands.core.logger import openhands_logger as logger


class AgentRegistry:
    """Registry for managing multiple agent configurations"""

    def __init__(self, config_path: Optional[str] = None):
        if config_path is None:
            # Look for agent_configs.toml in the project root
            project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
            config_path = os.path.join(project_root, "agent_configs.toml")

        self.config_path = config_path
        self._agents: Dict[str, Dict] = {}
        self._delegation_rules: Dict[str, List[str]] = {}
        self._load_config()

    def _load_config(self):
        """Load agent configurations from TOML file"""
        if not os.path.exists(self.config_path):
            logger.warning(f"Agent config file not found: {self.config_path}")
            return

        try:
            with open(self.config_path, 'rb') as f:
                config = tomllib.load(f)

            # Load agent configurations
            if 'agents' in config:
                self._agents = config['agents']
                logger.info(f"Loaded {len(self._agents)} agent configurations")

            # Load delegation rules
            if 'delegation' in config:
                self._delegation_rules = config['delegation']
                logger.info(f"Loaded delegation rules: {self._delegation_rules}")

        except Exception as e:
            logger.error(f"Failed to load agent config: {e}")

    def get_agent_config(self, agent_name: str) -> Optional[AgentConfig]:
        """Get AgentConfig for a specific agent"""
        if agent_name not in self._agents:
            logger.warning(f"Agent '{agent_name}' not found in registry")
            return None

        agent_info = self._agents[agent_name]

        return AgentConfig(
            classpath=agent_info.get('classpath'),
            system_prompt_filename=agent_info.get('system_prompt_filename', 'system_prompt.j2'),
            enable_finish=agent_info.get('enable_finish', True),
            enable_delegate=agent_info.get('enable_delegate', True)
        )

    def can_delegate_to(self, from_agent: str, to_agent: str) -> bool:
        """Check if one agent can delegate to another"""
        delegation_key = f"{from_agent}_can_delegate_to"
        allowed_agents = self._delegation_rules.get(delegation_key, [])
        return to_agent in allowed_agents

    def get_available_agents(self) -> List[str]:
        """Get list of all available agent names"""
        return list(self._agents.keys())

    def get_delegatable_agents(self, from_agent: str) -> List[str]:
        """Get list of agents that the given agent can delegate to"""
        delegation_key = f"{from_agent}_can_delegate_to"
        return self._delegation_rules.get(delegation_key, [])


# Global registry instance
agent_registry = AgentRegistry()
