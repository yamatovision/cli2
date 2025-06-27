from litellm import ChatCompletionToolParam, ChatCompletionToolParamFunctionChunk

from openhands.llm.tool_names import FINISH_TOOL_NAME

_FINISH_DESCRIPTION = """Complete your task and return control to the orchestrator.

Report what you accomplished and whether the task is complete.
"""

FinishTool = ChatCompletionToolParam(
    type='function',
    function=ChatCompletionToolParamFunctionChunk(
        name=FINISH_TOOL_NAME,
        description=_FINISH_DESCRIPTION,
        parameters={
            'type': 'object',
            'required': ['message', 'task_completed'],
            'properties': {
                'message': {
                    'type': 'string',
                    'description': 'Summary of what was accomplished',
                },
                'task_completed': {
                    'type': 'boolean',
                    'description': 'Whether the task is complete',
                },
            },
        },
    ),
)
