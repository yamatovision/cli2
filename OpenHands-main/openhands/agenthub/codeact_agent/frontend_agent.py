"""Frontend/UI Agent - specialized for frontend development and UI/UX design."""

from openhands.agenthub.codeact_agent.codeact_agent import CodeActAgent
from openhands.core.config import AgentConfig
from openhands.llm.llm import LLM


class FrontendAgent(CodeActAgent):
    """
    Frontend/UI Agent - specialized for frontend development and UI/UX design.

    This agent focuses on:
    - User interface design and implementation
    - User experience optimization
    - Responsive design and accessibility
    - Frontend frameworks (React, Vue, Angular)
    - Client-side state management
    - Performance optimization
    - Cross-browser compatibility
    """

    VERSION = '1.0'

    def __init__(self, llm: LLM, config: AgentConfig) -> None:
        # Set the frontend-specific prompt file
        if not config.system_prompt_filename or config.system_prompt_filename == 'requirements_engineer.j2':
            config.system_prompt_filename = 'frontend_agent.j2'

        super().__init__(llm, config)
