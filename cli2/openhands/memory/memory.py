import asyncio
import uuid
from datetime import datetime, timezone
from typing import Callable

from openhands.core.logger import openhands_logger as logger
from openhands.events.action.agent import RecallAction
from openhands.events.event import Event, EventSource, RecallType
from openhands.events.observation.agent import (
    RecallObservation,
)
from openhands.events.observation.empty import NullObservation
from openhands.events.stream import EventStream, EventStreamSubscriber
from openhands.runtime.base import Runtime
from openhands.utils.prompt import (
    ConversationInstructions,
    RepositoryInfo,
    RuntimeInfo,
)

# Microagent functionality has been removed


class Memory:
    """Memory is a component that listens to the EventStream for information retrieval actions
    (a RecallAction) and publishes observations with the content (such as RecallObservation).
    """

    sid: str
    event_stream: EventStream
    status_callback: Callable | None
    loop: asyncio.AbstractEventLoop | None

    def __init__(
        self,
        event_stream: EventStream,
        sid: str,
        status_callback: Callable | None = None,
    ):
        self.event_stream = event_stream
        self.sid = sid if sid else str(uuid.uuid4())
        self.status_callback = status_callback
        self.loop = None

        self.event_stream.subscribe(
            EventStreamSubscriber.MEMORY,
            self.on_event,
            self.sid,
        )

        # Microagent functionality has been removed

        # Store repository / runtime info to send them to the templating later
        self.repository_info: RepositoryInfo | None = None
        self.runtime_info: RuntimeInfo | None = None
        self.conversation_instructions: ConversationInstructions | None = None

        # Microagent functionality has been removed

    def on_event(self, event: Event):
        """Handle an event from the event stream."""
        asyncio.get_event_loop().run_until_complete(self._on_event(event))

    async def _on_event(self, event: Event):
        """Handle an event from the event stream asynchronously."""
        try:
            if isinstance(event, RecallAction):
                # if this is a workspace context recall (on first user message)
                # create and add a RecallObservation
                # with info about repo, runtime, instructions, etc.
                if (
                    event.source == EventSource.USER
                    and event.recall_type == RecallType.WORKSPACE_CONTEXT
                ):
                    logger.debug('Workspace context recall')
                    workspace_obs: RecallObservation | NullObservation | None = None

                    workspace_obs = self._on_workspace_context_recall(event)
                    if workspace_obs is None:
                        workspace_obs = NullObservation(content='')

                    # important: this will release the execution flow from waiting for the retrieval to complete
                    workspace_obs._cause = event.id  # type: ignore[union-attr]

                    self.event_stream.add_event(workspace_obs, EventSource.ENVIRONMENT)
                    return

                # Microagent functionality has been removed
        except Exception as e:
            error_str = f'Error: {str(e.__class__.__name__)}'
            logger.error(error_str)
            self.send_error_message('STATUS$ERROR_MEMORY', error_str)
            return

    def _on_workspace_context_recall(
        self, event: RecallAction
    ) -> RecallObservation | None:
        """Add repository and runtime information to the stream as a RecallObservation.

        Microagent functionality has been removed.
        """
        # Create WORKSPACE_CONTEXT info:
        # - repository_info
        # - runtime_info
        # - repository_instructions

        # Collect raw repository instructions
        repo_instructions = ''

        # Microagent functionality has been removed
        # microagent_knowledge removed

        # Create observation if we have anything
        if (
            self.repository_info
            or self.runtime_info
            or repo_instructions
            or self.conversation_instructions
        ):
            obs = RecallObservation(
                recall_type=RecallType.WORKSPACE_CONTEXT,
                repo_name=self.repository_info.repo_name
                if self.repository_info and self.repository_info.repo_name is not None
                else '',
                repo_directory=self.repository_info.repo_directory
                if self.repository_info
                and self.repository_info.repo_directory is not None
                else '',
                repo_instructions=repo_instructions if repo_instructions else '',
                runtime_hosts=self.runtime_info.available_hosts
                if self.runtime_info and self.runtime_info.available_hosts is not None
                else {},
                additional_agent_instructions=self.runtime_info.additional_agent_instructions
                if self.runtime_info
                and self.runtime_info.additional_agent_instructions is not None
                else '',
                microagent_knowledge=[],
                content='Added workspace context',
                date=self.runtime_info.date if self.runtime_info is not None else '',
                custom_secrets_descriptions=self.runtime_info.custom_secrets_descriptions
                if self.runtime_info is not None
                else {},
                conversation_instructions=self.conversation_instructions.content
                if self.conversation_instructions is not None
                else '',
            )
            return obs
        return None

    # Microagent functionality has been removed

    def set_repository_info(self, repo_name: str, repo_directory: str) -> None:
        """Store repository info so we can reference it in an observation."""
        if repo_name or repo_directory:
            self.repository_info = RepositoryInfo(repo_name, repo_directory)
        else:
            self.repository_info = None

    def set_runtime_info(
        self,
        runtime: Runtime,
        custom_secrets_descriptions: dict[str, str],
    ) -> None:
        """Store runtime info (web hosts, ports, etc.)."""
        # e.g. { '127.0.0.1': 8080 }
        utc_now = datetime.now(timezone.utc)
        date = str(utc_now.date())

        if runtime.web_hosts or runtime.additional_agent_instructions:
            self.runtime_info = RuntimeInfo(
                available_hosts=runtime.web_hosts,
                additional_agent_instructions=runtime.additional_agent_instructions,
                date=date,
                custom_secrets_descriptions=custom_secrets_descriptions,
            )
        else:
            self.runtime_info = RuntimeInfo(
                date=date,
                custom_secrets_descriptions=custom_secrets_descriptions,
            )

    def set_conversation_instructions(
        self, conversation_instructions: str | None
    ) -> None:
        """Set contextual information for conversation
        This is information the agent may require.
        """
        self.conversation_instructions = ConversationInstructions(
            content=conversation_instructions or ''
        )

    def send_error_message(self, message_id: str, message: str):
        """Sends an error message if the callback function was provided."""
        if self.status_callback:
            try:
                if self.loop is None:
                    self.loop = asyncio.get_running_loop()
                asyncio.run_coroutine_threadsafe(
                    self._send_status_message('error', message_id, message), self.loop
                )
            except RuntimeError as e:
                logger.error(
                    f'Error sending status message: {e.__class__.__name__}',
                    stack_info=False,
                )

    async def _send_status_message(self, msg_type: str, id: str, message: str):
        """Sends a status message to the client."""
        if self.status_callback:
            self.status_callback(msg_type, id, message)
