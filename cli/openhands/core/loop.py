import asyncio

from openhands.controller import AgentController
from openhands.core.logger import openhands_logger as logger
from openhands.core.schema import AgentState
from openhands.memory.memory import Memory
from openhands.runtime.base import Runtime


async def run_agent_until_done(
    controller: AgentController,
    runtime: Runtime,
    memory: Memory,
    end_states: list[AgentState],
) -> None:
    """
    run_agent_until_done takes a controller and a runtime, and will run
    the agent until it reaches a terminal state.
    Note that runtime must be connected before being passed in here.
    """

    def status_callback(msg_type: str, msg_id: str, msg: str) -> None:
        if msg_type == 'error':
            logger.error(msg)
            if controller:
                controller.state.last_error = msg
                asyncio.create_task(controller.set_agent_state_to(AgentState.ERROR))
        else:
            logger.info(msg)

    if hasattr(runtime, 'status_callback') and runtime.status_callback:
        raise ValueError(
            'Runtime status_callback was set, but run_agent_until_done will override it'
        )
    if hasattr(controller, 'status_callback') and controller.status_callback:
        raise ValueError(
            'Controller status_callback was set, but run_agent_until_done will override it'
        )

    runtime.status_callback = status_callback
    controller.status_callback = status_callback
    memory.status_callback = status_callback

    logger.info(f"AGENT_LOOP_DEBUG: Starting agent loop with end_states: {end_states}")
    
    while controller.state.agent_state not in end_states:
        current_state = controller.state.agent_state
        logger.debug(f"AGENT_LOOP_DEBUG: Current agent state: {current_state}, waiting for: {end_states}")
        
        # Check for shutdown request
        try:
            from openhands.cli.main import _shutdown_requested
            if _shutdown_requested.is_set():
                logger.info("CTRL+C_DEBUG: Shutdown requested, breaking agent loop")
                break
        except ImportError:
            # If we can't import the shutdown flag, continue normally
            pass
        
        # Check for user interrupt request (ESC key)
        try:
            from openhands.cli.interrupt_handler import is_user_interrupt_requested
            if is_user_interrupt_requested():
                logger.info("ESC_INTERRUPT: User interrupt detected in agent loop, setting agent to AWAITING_USER_INPUT")
                # Set agent state to awaiting user input to trigger prompt_for_next_task
                await controller.set_agent_state_to(AgentState.AWAITING_USER_INPUT)
                break
        except ImportError:
            # If we can't import the interrupt handler, continue normally
            pass
        
        await asyncio.sleep(1)
    
    final_state = controller.state.agent_state
    logger.info(f"AGENT_LOOP_DEBUG: Agent loop completed with final state: {final_state}")
