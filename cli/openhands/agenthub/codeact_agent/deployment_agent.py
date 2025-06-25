"""Deployment Agent - specialized for infrastructure and deployment tasks."""

from openhands.agenthub.codeact_agent.codeact_agent import CodeActAgent
from openhands.core.config import AgentConfig
from openhands.llm.llm import LLM


class DeploymentAgent(CodeActAgent):
    """
    Deployment Agent - specialized for infrastructure and deployment.

    This agent focuses on:
    - Infrastructure setup and management
    - CI/CD pipeline configuration
    - Container orchestration (Docker, Kubernetes)
    - Cloud platform deployment
    - Monitoring and logging setup
    - Security configuration
    - Performance monitoring
    """

    VERSION = '1.0'

    def __init__(self, llm: LLM, config: AgentConfig) -> None:
        # Set the deployment-specific prompt file
        if not config.system_prompt_filename or config.system_prompt_filename == 'requirements_engineer.j2':
            config.system_prompt_filename = 'deployment_agent.j2'

        super().__init__(llm, config)
