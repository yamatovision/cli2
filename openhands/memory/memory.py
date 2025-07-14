from __future__ import annotations
import asyncio
import uuid
from datetime import datetime, timezone
from typing import Callable

from openhands.core.logger import openhands_logger as logger
from openhands.events.event import Event
from openhands.events.stream import EventStream, EventStreamSubscriber
from openhands.runtime.base import Runtime
from openhands.utils.prompt import (
    ConversationInstructions,
    RepositoryInfo,
    RuntimeInfo,
)


class Memory:
    """Memory is a simplified component that manages repository and runtime information."""

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

        # Store repository / runtime info to send them to the templating later
        self.repository_info: RepositoryInfo | None = None
        self.runtime_info: RuntimeInfo | None = None
        self.conversation_instructions: ConversationInstructions | None = None

    def on_event(self, event: Event):
        """Handle an event from the event stream."""
        asyncio.get_event_loop().run_until_complete(self._on_event(event))

    async def _on_event(self, event: Event):
        """Handle an event from the event stream asynchronously."""
        # Currently no events to handle since RecallAction is removed
        pass

    def set_repository_info(self, repository_info: RepositoryInfo):
        """Sets the repository info (name, instructions, etc.) for prompt injection (templating)."""
        logger.debug('Setting repository info')
        self.repository_info = repository_info

    def set_runtime_info(self, runtime: Runtime):
        """Sets the runtime info (available tools, etc.) for prompt injection (templating)."""
        logger.debug('Setting runtime info')
        
        # Get date in PST timezone
        from datetime import timezone as tz
        from datetime import timedelta
        pst = tz(timedelta(hours=-8))
        date_str = datetime.now(pst).strftime('%Y-%m-%d')
        
        self.runtime_info = RuntimeInfo(
            date=date_str,
            environment_class=runtime.__class__.__name__,
            enabled_tools=runtime.config.enable_tools,
            disabled_tools=runtime.config.disable_tools,
        )

    def set_conversation_instructions(
        self, conversation_instructions: ConversationInstructions
    ):
        """Sets the conversation instructions for prompt injection (templating)."""
        logger.debug('Setting conversation instructions')
        self.conversation_instructions = conversation_instructions

    def get_repo_instructions(self) -> str:
        """Returns repository instructions if available."""
        if self.repository_info and self.repository_info.repo_instructions:
            return self.repository_info.repo_instructions
        return ''

    def close(self):
        """Close the memory component."""
        self.event_stream.unsubscribe(EventStreamSubscriber.MEMORY, self.sid)