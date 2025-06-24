# OpenHands Token Management Analysis

## Overview
OpenHands implements multiple sophisticated strategies to prevent token limit issues when using multiple agents. This document analyzes the key mechanisms and provides insights into how the system manages tokens efficiently.

## 1. Token Tracking and Usage Monitoring

### Token Metrics System (llm/metrics.py)
OpenHands tracks detailed token usage through the `TokenUsage` class:
```python
class TokenUsage(BaseModel):
    prompt_tokens: int = Field(default=0)
    completion_tokens: int = Field(default=0)
    cache_read_tokens: int = Field(default=0)
    cache_write_tokens: int = Field(default=0)
    context_window: int = Field(default=0)
    per_turn_token: int = Field(default=0)
```

### Real-time Token Counting (llm/llm.py)
- The LLM class includes `get_token_count()` method for accurate token counting
- Supports custom tokenizers for specific models
- Monitors token usage per completion and accumulates metrics
- Tracks context window utilization

## 2. Memory Management and Optimization Strategies

### Event Filtering System (events/event_filter.py)
- Filters out unnecessary events to reduce context size:
  - Hidden events
  - Backend system events (NullAction, NullObservation, etc.)
  - Events between delegate action/observation pairs
- Preserves only essential events for agent context

### History Management (controller/state/state_tracker.py)
- Maintains separate history for agents and delegates
- Filters delegate events to prevent context bloat
- Only includes delegate action and observation summaries, not full delegate history

## 3. Condenser Functionality

### Condenser Architecture (memory/condenser/)
Multiple condenser implementations for different strategies:

#### a. Recent Events Condenser
- Keeps only the most recent N events
- Preserves first K events (usually system message and initial user message)
- Simple but effective for short conversations

#### b. LLM Summarizing Condenser
- Uses LLM to create intelligent summaries of forgotten events
- Maintains structured summaries with:
  - USER_CONTEXT: Essential user requirements
  - COMPLETED: Tasks completed
  - PENDING: Tasks remaining
  - CURRENT_STATE: Variables and data structures
  - CODE_STATE: For coding tasks
- Inserts summaries at appropriate positions in history

#### c. Advanced Condensers
- Observation Masking Condenser
- Browser Output Condenser
- Amortized Forgetting Condenser
- LLM Attention Condenser

### Condenser Triggers
- Activated when history exceeds `max_size` threshold
- Generates `CondensationAction` events to track what was condensed

## 4. Event Stream Optimization

### Efficient Storage (events/stream.py)
- Page-based caching system for events
- Stores events in batches to reduce I/O operations
- Implements write-through caching

### Event Serialization
- Efficient JSON serialization
- Secret replacement to prevent token waste on sensitive data
- Truncation of large event content

## 5. Agent Context Management

### Context Window Handling (controller/agent_controller.py)
When context window is exceeded:
1. **Automatic Truncation** (if enabled):
   - Applies conversation window to cut history roughly in half
   - Preserves essential events:
     - System message
     - First user message
     - Associated recall observations
   - Maintains action-observation pairs integrity

2. **CondensationAction Generation**:
   - Creates action indicating which events were forgotten
   - Allows agent to understand context was condensed

### Delegate Context Isolation
- Delegates start with fresh context (start_id)
- Parent agent doesn't include full delegate history
- Only delegate results are preserved in parent context

## 6. Token Limit Prevention Mechanisms

### Configuration Options (core/config/llm_config.py)
```python
max_input_tokens: int | None  # Configurable input limit
max_output_tokens: int | None # Configurable output limit
max_message_chars: int = 30_000  # Truncate observations
```

### Automatic Token Limit Detection
- Catches `ContextWindowExceededError` from various providers
- String matching for provider-specific errors
- Graceful handling with retry or condensation

### Budget Control System (controller/state/control_flags.py)
- Monitors accumulated costs (token-based pricing)
- Prevents runaway token usage through budget limits
- Expandable limits in non-headless mode

## 7. Multi-Agent Token Sharing

### Metrics Sharing
- Global metrics shared between parent and delegate agents
- Accumulated token usage tracked across all agents
- Budget control applies to entire conversation

### State Management
- Parent metrics snapshot before delegation
- Local metrics calculation for delegates
- Efficient metric merging after delegation

## 8. Best Practices for Token Management

### 1. Configure Appropriate Condensers
```python
# Example: LLM Summarizing Condenser
condenser_config = LLMSummarizingCondenserConfig(
    max_size=100,  # Trigger condensation after 100 events
    keep_first=1,  # Always keep system message
    max_event_length=10_000  # Truncate long events
)
```

### 2. Enable History Truncation
```python
agent_config.enable_history_truncation = True
```

### 3. Set Token Budgets
```python
# Set maximum budget per task
max_budget_per_task = 10.0  # $10 USD
```

### 4. Use Event Filtering
- Configure appropriate event filters
- Exclude unnecessary event types
- Hide internal system events

### 5. Monitor Token Usage
- Check `state.metrics.accumulated_token_usage`
- Monitor context window utilization
- Track per-agent token consumption

## Conclusion

OpenHands implements a comprehensive token management system that:
1. Tracks token usage at multiple levels
2. Intelligently condenses history when needed
3. Isolates delegate contexts to prevent bloat
4. Provides configurable limits and budgets
5. Handles token limit errors gracefully
6. Optimizes event storage and transmission

These mechanisms work together to enable efficient multi-agent collaboration without hitting token limits, even in long-running conversations with multiple delegations.
