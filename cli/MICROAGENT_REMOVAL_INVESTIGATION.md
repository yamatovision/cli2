# Microagent Functionality Investigation Report

## Overview
This report documents all components related to the microagent functionality in BlueLamp/OpenHands, preparing for its complete removal.

## 1. Core Microagent Implementation Files

### Primary Implementation
- `/openhands/microagent/microagent.py` - Main microagent classes (BaseMicroagent, KnowledgeMicroagent, RepoMicroagent, TaskMicroagent)
- `/openhands/microagent/types.py` - Type definitions for microagents
- `/openhands/microagent/__init__.py` - Package initialization

### Microagent Storage
- `/cli/microagents/` - Directory containing 17 microagent markdown files (00-orchestrator.md through 16-refactoring-expert.md)
- Global microagents directory: `GLOBAL_MICROAGENTS_DIR` defined in memory.py as `os.path.join(os.path.dirname(os.path.dirname(openhands.__file__)), 'microagents')`

## 2. RecallAction and Microagent Triggering

### Action Classes
- `/openhands/events/action/agent.py` - Contains `RecallAction` class (lines 96-112)
- RecallAction types: `RecallType.WORKSPACE_CONTEXT` and `RecallType.KNOWLEDGE`

### Controller Integration
- `/openhands/controller/agent_controller.py`:
  - Imports RecallAction (line 63)
  - Creates RecallAction on first user message (lines 598-616)
  - Handles RecallAction in event processing

### Memory System
- `/openhands/memory/memory.py`:
  - Main handler for RecallAction events
  - `_on_event()` method processes RecallActions (lines 85-124)
  - `_on_workspace_context_recall()` - Handles workspace context loading (lines 131-183)
  - `_on_microagent_recall()` - Handles microagent knowledge retrieval (lines 185-202)
  - `_find_microagent_knowledge()` - Searches for triggered microagents (lines 204-231)
  - `load_user_workspace_microagents()` - Loads user workspace microagents (lines 233-249)
  - `_load_global_microagents()` - Loads global microagents (lines 250-262)
  - `get_microagent_mcp_tools()` - Gets MCP tools from microagents (lines 264-281)

## 3. Configuration and Control

### Agent Configuration
- `/openhands/core/config/agent_config.py`:
  - `disabled_microagents` field (line 40-41) - List of microagents to disable
  - `enable_prompt_extensions` field (line 36-37) - Controls prompt extensions

### Agent Registry Configuration
- `/cli/agent_configs.toml` - Contains configuration for all agents but no specific microagent settings

## 4. Prompt Templates and Integration

### Template Files
- `/openhands/agenthub/codeact_agent/prompts/microagent_info.j2` - Template for rendering microagent information
- `/openhands/agenthub/readonly_agent/prompts/microagent_info.j2` - Similar template for readonly agent

### Prompt Manager
- `/openhands/utils/prompt.py`:
  - `build_microagent_info()` method (lines 120-132) - Renders microagent info template
  - Loads microagent_info template in constructor (line 63)

### Conversation Memory
- `/openhands/memory/conversation_memory.py`:
  - Includes microagent knowledge in conversation (lines 574-616)
  - Filters disabled microagents (lines 596-602)
  - `_filter_agents_in_microagent_obs()` method (lines 659-669)

## 5. Runtime Integration

### Runtime Base
- `/openhands/runtime/base.py`:
  - `get_microagents_from_selected_repo()` method (lines 707-727) - Main entry point for loading microagents
  - Checks for user/org level microagents and .openhands_instructions files

### Session Management
- `/openhands/server/session/agent_session.py`:
  - Loads microagents from runtime (lines 474-479)
  - Calls `memory.load_user_workspace_microagents(microagents)`

## 6. Observation Classes

### Microagent-specific Observations
- `/openhands/events/observation/agent.py`:
  - `MicroagentKnowledge` class - Data structure for microagent content
  - `RecallObservation` class - Contains microagent_knowledge field

## 7. Test Files

Multiple test files reference microagents:
- `/tests/unit/test_microagent_no_header.py`
- `/tests/unit/test_conversation_memory.py`
- `/tests/unit/test_memory.py`
- `/tests/unit/test_prompt_manager.py`
- And others...

## 8. Documentation

Several documentation files mention microagents:
- `/docs/usage/prompting/microagents-*.mdx` - Multiple documentation files about microagents
- `/docs/orchestrator-implementation-plan.md`
- `/docs/agents-guide-ja.md`

## Key Components to Remove/Modify

1. **Complete Removal Required:**
   - `/openhands/microagent/` directory and all its contents
   - `/cli/microagents/` directory and all markdown files
   - All microagent-specific template files (microagent_info.j2)
   - Microagent-specific test files

2. **Modification Required:**
   - `agent_controller.py` - Remove RecallAction creation logic
   - `memory.py` - Remove all microagent handling methods
   - `conversation_memory.py` - Remove microagent knowledge inclusion
   - `prompt.py` - Remove microagent template loading and rendering
   - `agent_config.py` - Remove disabled_microagents field
   - `runtime/base.py` - Remove microagent loading methods
   - `agent_session.py` - Remove microagent loading calls

3. **RecallAction Handling:**
   - Keep RecallAction class but remove microagent-specific logic
   - Simplify to only handle workspace context without microagents

4. **Observation Classes:**
   - Remove MicroagentKnowledge class
   - Modify RecallObservation to remove microagent_knowledge field

## Dependencies to Update

After removal, ensure:
- No imports of microagent modules remain
- No references to microagent templates
- No configuration options for microagents
- Update all tests that depend on microagent functionality