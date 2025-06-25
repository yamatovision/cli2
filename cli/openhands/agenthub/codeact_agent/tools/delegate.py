from litellm import ChatCompletionToolParam, ChatCompletionToolParamFunctionChunk

from openhands.core.config.agent_registry import agent_registry
from openhands.llm.tool_names import DELEGATE_TOOL_NAME

# 動的にエージェントリストと説明を生成
def _get_delegate_description():
    """Generate delegate description dynamically from agent registry"""
    available_agents = agent_registry.get_available_agents()

    # オーケストレーションエージェントを除外（自己参照を避ける）
    available_agents = [agent for agent in available_agents if agent != 'orchestration']

    agent_descriptions = []
    for agent_key in available_agents:
        agent_config = agent_registry._agents.get(agent_key, {})
        desc = agent_config.get('description', 'No description available')
        agent_descriptions.append(f"- {agent_key}: {desc}")

    return f"""Delegate a task to a specialized agent.

Use this tool when:
- You need specialized expertise that another agent can provide
- The task requires domain-specific knowledge or skills
- You want to hand off a subtask to a more appropriate agent

Available agents:
{chr(10).join(agent_descriptions)}

The inputs should include:
- task: Clear description of what needs to be done
- requirements: Any specific requirements or constraints
- context: Background information the agent needs to know
"""

# 動的にエージェントリストを取得
def _get_agent_enum():
    """Get available agents for delegation dynamically"""
    available_agents = agent_registry.get_available_agents()
    # オーケストレーションエージェントを除外
    return [agent for agent in available_agents if agent != 'orchestration']

DelegateTool = ChatCompletionToolParam(
    type='function',
    function=ChatCompletionToolParamFunctionChunk(
        name=DELEGATE_TOOL_NAME,
        description=_get_delegate_description(),
        parameters={
            'type': 'object',
            'required': ['agent', 'inputs'],
            'properties': {
                'agent': {
                    'type': 'string',
                    'enum': _get_agent_enum(),
                    'description': 'The specialized agent to delegate the task to',
                },
                'inputs': {
                    'type': 'object',
                    'description': 'Task details and context for the agent',
                    'properties': {
                        'task': {
                            'type': 'string',
                            'description': 'Clear description of the task to be performed',
                        },
                        'requirements': {
                            'type': 'string',
                            'description': 'Specific requirements, constraints, or specifications',
                        },
                        'context': {
                            'type': 'string',
                            'description': 'Background information and context the agent needs',
                        },
                    },
                    'required': ['task'],
                },
                'thought': {
                    'type': 'string',
                    'description': 'Your reasoning for delegating to this specific agent',
                },
            },
        },
    ),
)
