# Standard library imports
import asyncio
import logging
import os
import sys

# Third-party imports
from prompt_toolkit import print_formatted_text
from prompt_toolkit.formatted_text import HTML
from prompt_toolkit.shortcuts import clear

# OpenHands imports
import openhands.agenthub
import openhands.cli.suppress_warnings  # noqa: F401

# CLI module imports
from openhands.cli.commands import (
    check_folder_security_agreement,
    handle_commands,
)
from openhands.cli.settings import modify_llm_settings_basic
from openhands.cli.tui import (
    UsageMetrics,
    display_agent_running_message,
    display_banner,
    display_event,
    display_initial_user_prompt,
    display_initialization_animation,
    display_runtime_initialization_message,
    display_welcome_message,
    process_agent_pause,
    read_confirmation_input,
    read_prompt_input,
)
from openhands.cli.utils import update_usage_metrics

# Controller imports
from openhands.controller import AgentController
from openhands.controller.agent import Agent

# Core configuration imports
from openhands.core.config import (
    OpenHandsConfig,
    parse_arguments,
    setup_config_from_args,
)
from openhands.core.config.condenser_config import NoOpCondenserConfig
from openhands.core.config.mcp_config import OpenHandsMCPConfigImpl
from openhands.core.config.utils import get_workspace_mount_path

# Core functionality imports
from openhands.core.logger import openhands_logger as logger
from openhands.core.loop import run_agent_until_done
from openhands.core.schema import AgentState
from openhands.core.setup import (
    create_agent,
    create_controller,
    create_memory,
    create_runtime,
    generate_sid,
    initialize_repository_for_runtime,
)

# Event system imports
from openhands.events import EventSource, EventStreamSubscriber
from openhands.events.action import (
    ChangeAgentStateAction,
    MessageAction,
)
from openhands.events.event import Event
from openhands.events.observation import AgentStateChangedObservation

# Other imports
from openhands.io import read_task
from openhands.mcp import add_mcp_tools_to_agent
from openhands.memory.condenser.impl.llm_summarizing_condenser import (
    LLMSummarizingCondenserConfig,
)
from openhands.runtime.base import Runtime
from openhands.storage.settings.file_settings_store import FileSettingsStore


async def cleanup_session(
    loop: asyncio.AbstractEventLoop,
    agent: Agent,
    runtime: Runtime,
    controller: AgentController,
) -> None:
    """Clean up all resources from the current session."""
    event_stream = runtime.event_stream
    end_state = controller.get_state()
    end_state.save_to_session(
        event_stream.sid,
        event_stream.file_store,
        event_stream.user_id,
    )

    try:
        current_task = asyncio.current_task(loop)
        pending = [task for task in asyncio.all_tasks(loop) if task is not current_task]

        if pending:
            done, pending_set = await asyncio.wait(set(pending), timeout=2.0)
            pending = list(pending_set)

        for task in pending:
            task.cancel()

        agent.reset()
        runtime.close()
        await controller.close()
        
        # 🚀 自動セッション削除機能
        try:
            from openhands.storage.session_cleanup import auto_cleanup_sessions
            cleanup_result = auto_cleanup_sessions(
                max_age_days=7,  # 7日以上古いセッションを削除
                dry_run=False,   # 実際に削除実行
                max_delete_count=50  # 一度に最大50個まで削除
            )
            if cleanup_result["deleted_count"] > 0:
                logger.info(
                    f"自動セッション削除: {cleanup_result['deleted_count']}個のセッション削除 "
                    f"({cleanup_result['deleted_size_mb']:.1f}MB節約)"
                )
        except Exception as cleanup_error:
            logger.warning(f"自動セッション削除エラー: {cleanup_error}")

    except Exception as e:
        logger.error(f'Error during session cleanup: {e}')


async def run_session(
    loop: asyncio.AbstractEventLoop,
    config: OpenHandsConfig,
    settings_store: FileSettingsStore,
    current_dir: str,
    task_content: str | None = None,
    conversation_instructions: str | None = None,
    session_name: str | None = None,
    skip_banner: bool = False,
) -> bool:
    new_session_requested = False

    sid = generate_sid(config, session_name)
    is_loaded = asyncio.Event()
    is_paused = asyncio.Event()  # Event to track agent pause requests
    always_confirm_mode = False  # Flag to enable always confirm mode

    # Show runtime initialization message
    display_runtime_initialization_message(config.runtime)

    # Initialization loader removed for cleaner login experience

    # Apply environment variable overrides for system_prompt_filename
    if config.default_agent == 'CodeActAgent2':
        system_prompt_filename = os.getenv('OPENHANDS_SYSTEM_PROMPT_FILENAME')
        if system_prompt_filename:
            agent_config = config.get_agent_config('CodeActAgent2')
            agent_config.system_prompt_filename = system_prompt_filename
            config.set_agent_config(agent_config, 'CodeActAgent2')
            logger.info(f"Applied system_prompt_filename from env: {system_prompt_filename}")

    agent = create_agent(config)
    runtime = create_runtime(
        config,
        sid=sid,
        headless_mode=True,
        agent=agent,
    )

    # Streaming callback is disabled - output is displayed via events instead
    # runtime.subscribe_to_shell_stream(stream_to_console)

    controller, initial_state = create_controller(agent, runtime, config)

    event_stream = runtime.event_stream

    usage_metrics = UsageMetrics()

    async def prompt_for_next_task(agent_state: str) -> bool:
        """Prompt for next task and return True if session should be closed."""
        nonlocal new_session_requested
        while True:
            next_message = await read_prompt_input(
                agent_state, multiline=config.cli_multiline_input, agent_type=config.default_agent,
            )

            if not next_message.strip():
                continue

            (
                close_repl,
                new_session_requested,
            ) = await handle_commands(
                next_message,
                event_stream,
                usage_metrics,
                sid,
                config,
                current_dir,
                settings_store,
            )

            if close_repl:
                return True
        return False

    async def on_event_async(event: Event) -> None:
        nonlocal is_paused, always_confirm_mode
        display_event(event, config)
        update_usage_metrics(event, usage_metrics)

        if isinstance(event, AgentStateChangedObservation):
            if event.agent_state in [
                AgentState.AWAITING_USER_INPUT,
                AgentState.FINISHED,
            ]:
                # If the agent is paused, do not prompt for input as it's already handled by PAUSED state change
                if is_paused.is_set():
                    return

                close_repl = await prompt_for_next_task(event.agent_state)
                if close_repl:
                    return

            if event.agent_state == AgentState.AWAITING_USER_CONFIRMATION:
                # If the agent is paused, do not prompt for confirmation
                # The confirmation step will re-run after the agent has been resumed
                if is_paused.is_set():
                    return

                if always_confirm_mode:
                    event_stream.add_event(
                        ChangeAgentStateAction(AgentState.USER_CONFIRMED),
                        EventSource.USER,
                    )
                    return

                confirmation_status = await read_confirmation_input()
                if confirmation_status == 'yes' or confirmation_status == 'always':
                    event_stream.add_event(
                        ChangeAgentStateAction(AgentState.USER_CONFIRMED),
                        EventSource.USER,
                    )
                else:
                    event_stream.add_event(
                        ChangeAgentStateAction(AgentState.USER_REJECTED),
                        EventSource.USER,
                    )

                # Set the always_confirm_mode flag if the user wants to always confirm
                if confirmation_status == 'always':
                    always_confirm_mode = True

            if event.agent_state == AgentState.PAUSED:
                is_paused.clear()  # Revert the event state before prompting for user input
                close_repl = await prompt_for_next_task(event.agent_state)
                if close_repl:
                    return

            if event.agent_state == AgentState.RUNNING:
                display_agent_running_message()
                loop.create_task(
                    process_agent_pause(is_paused, event_stream),
                )  # Create a task to track agent pause requests from the user

    def on_event(event: Event) -> None:
        loop.create_task(on_event_async(event))

    event_stream.subscribe(EventStreamSubscriber.MAIN, on_event, sid)

    await runtime.connect()

    # Initialize repository if needed
    repo_directory = None
    if config.sandbox.selected_repo:
        repo_directory = initialize_repository_for_runtime(
            runtime,
            selected_repository=config.sandbox.selected_repo,
        )

    memory = create_memory(
        runtime=runtime,
        event_stream=event_stream,
        sid=sid,
        selected_repository=config.sandbox.selected_repo,
        repo_directory=repo_directory,
        conversation_instructions=conversation_instructions,
    )

    # Add MCP tools to the agent
    if agent.config.enable_mcp:
        # Add OpenHands' MCP server by default
        _, openhands_mcp_stdio_servers = (
            OpenHandsMCPConfigImpl.create_default_mcp_server_config(
                config.mcp_host, config, None,
            )
        )

        runtime.config.mcp.stdio_servers.extend(openhands_mcp_stdio_servers)

        # MCP tools initialization moved to after login for cleaner login experience
        # await add_mcp_tools_to_agent(agent, runtime, memory)

    # Loading animation removed for cleaner login experience

    # Show OpenHands banner and session ID if not skipped
    if not skip_banner:
        # Clear the terminal
        clear()
        display_banner(session_id=sid)

    welcome_message = 'What do you want to build?'  # from the application
    initial_message = ''  # from the user

    if task_content:
        initial_message = task_content

    # If we loaded a state, we are resuming a previous session
    if initial_state is not None:
        logger.info(f'Resuming session: {sid}')

        if initial_state.last_error:
            # If the last session ended in an error, provide a message.
            initial_message = (
                "NOTE: the last session ended with an error."
                "Let's get back on track. Do NOT resume your task. Ask me about it."
            )
        else:
            # If we are resuming, we already have a task
            initial_message = ''
            welcome_message += '\nLoading previous conversation.'

    # Show OpenHands welcome
    display_welcome_message(welcome_message)

    # Initialize MCP tools after login and welcome message
    if config.mcp_host is not None and runtime.config.mcp.stdio_servers:
        logger.info("Initializing MCP tools...")
        await add_mcp_tools_to_agent(agent, runtime, memory)

    # The prompt_for_next_task will be triggered if the agent enters AWAITING_USER_INPUT.
    # If the restored state is already AWAITING_USER_INPUT, on_event_async will handle it.

    if initial_message:
        display_initial_user_prompt(initial_message)
        event_stream.add_event(MessageAction(content=initial_message), EventSource.USER)
    else:
        # No session restored, no initial action: prompt for the user's first message
        asyncio.create_task(prompt_for_next_task(''))

    await run_agent_until_done(
        controller, runtime, memory, [AgentState.STOPPED, AgentState.ERROR],
    )

    await cleanup_session(loop, agent, runtime, controller)

    return new_session_requested


async def run_setup_flow(config: OpenHandsConfig, settings_store: FileSettingsStore):
    """Run the setup flow to configure initial settings.

    Returns:
        bool: True if settings were successfully configured, False otherwise.
    """
    # Display the banner with ASCII art first
    display_banner(session_id='setup')

    print_formatted_text(
        HTML('<grey>No settings found. Starting initial setup...</grey>\n'),
    )

    # Use the existing settings modification function for basic setup
    await modify_llm_settings_basic(config, settings_store)


async def main_with_loop(loop: asyncio.AbstractEventLoop) -> None:
    """Runs the agent in CLI mode."""
    args = parse_arguments()

    logger.setLevel(logging.WARNING)

    # Load config from toml and override with command line arguments
    config: OpenHandsConfig = setup_config_from_args(args)

    # Load settings from Settings Store
    # TODO: Make this generic?
    settings_store = await FileSettingsStore.get_instance(config=config, user_id=None)
    settings = await settings_store.load()

    # Track if we've shown the banner during setup
    banner_shown = False

    # If settings don't exist, automatically enter the setup flow
    if not settings:
        # Clear the terminal before showing the banner
        clear()

        await run_setup_flow(config, settings_store)
        banner_shown = True

        settings = await settings_store.load()

    # Use settings from settings store if available and override with command line arguments
    if settings:
        if args.agent_cls:
            config.default_agent = str(args.agent_cls)
        else:
            # settings.agent is not None because we check for it in setup_config_from_args
            assert settings.agent is not None
            config.default_agent = settings.agent
        if not args.llm_config and settings.llm_model and settings.llm_api_key:
            llm_config = config.get_llm_config()
            llm_config.model = settings.llm_model
            llm_config.api_key = settings.llm_api_key
            llm_config.base_url = settings.llm_base_url
            config.set_llm_config(llm_config)
        config.security.confirmation_mode = (
            settings.confirmation_mode if settings.confirmation_mode else False
        )

        if settings.enable_default_condenser:
            # TODO: Make this generic?
            llm_config = config.get_llm_config()
            agent_config = config.get_agent_config(config.default_agent)
            agent_config.condenser = LLMSummarizingCondenserConfig(
                llm_config=llm_config,
                type='llm',
            )
            config.set_agent_config(agent_config)
            config.enable_default_condenser = True
        else:
            agent_config = config.get_agent_config(config.default_agent)
            agent_config.condenser = NoOpCondenserConfig(type='noop')
            config.set_agent_config(agent_config)
            config.enable_default_condenser = False

    # Determine if CLI defaults should be overridden
    val_override = args.override_cli_mode
    should_override_cli_defaults = (
        val_override is True
        or (isinstance(val_override, str) and val_override.lower() in ('true', '1'))
        or (isinstance(val_override, int) and val_override == 1)
    )

    if not should_override_cli_defaults:
        config.runtime = 'cli'
        # Set default workspace mount if not configured
        workspace_mount_path = get_workspace_mount_path(config)
        if not workspace_mount_path:
            # Set default workspace mount to current directory
            current_dir = os.getcwd()
            config.sandbox.volumes = f"{current_dir}:/workspace:rw"
        else:
            current_dir = workspace_mount_path
        config.security.confirmation_mode = True

    # Get current working directory from workspace mount
    workspace_dir = get_workspace_mount_path(config)
    if workspace_dir:
        current_dir = workspace_dir
    else:
        current_dir = os.getcwd()

    if not current_dir:
        raise ValueError('Workspace directory not specified')

    if not check_folder_security_agreement(config, current_dir):
        # User rejected, exit application
        return

    # Read task from file, CLI args, or stdin
    task_str = read_task(args, config.cli_multiline_input)

    # Run the first session
    new_session_requested = await run_session(
        loop,
        config,
        settings_store,
        current_dir,
        task_str,
        session_name=args.name,
        skip_banner=banner_shown,
    )

    # If a new session was requested, run it
    while new_session_requested:
        new_session_requested = await run_session(
            loop, config, settings_store, current_dir, None,
        )


def main():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(main_with_loop(loop))
    except KeyboardInterrupt:
        print('Received keyboard interrupt, shutting down...')
    except ConnectionRefusedError as e:
        print(f'Connection refused: {e}')
        sys.exit(1)
    except Exception as e:
        print(f'An error occurred: {e}')
        sys.exit(1)
    finally:
        try:
            # Cancel all running tasks
            pending = asyncio.all_tasks(loop)
            for task in pending:
                task.cancel()

            # Wait for all tasks to complete with a timeout
            loop.run_until_complete(asyncio.gather(*pending, return_exceptions=True))
            loop.close()
        except Exception as e:
            print(f'Error during cleanup: {e}')
            sys.exit(1)


if __name__ == '__main__':
    main()
