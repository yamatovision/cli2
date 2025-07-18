"""
OpenHands Core Module - 3-Layer Architecture

This module provides the core functionality for OpenHands with a clean 3-layer structure:
- Layer 1: Core functionality (agents, runtime, llm, storage, events)
- Layer 2: Extensions (integrations, security, portal, cli) 
- Layer 3: Resources (configs, docs, scripts)

This structure optimizes AI-friendliness by:
- Reducing cognitive load with max 3 layers
- Clear separation of concerns
- Intuitive module organization
"""

# Core functionality exports for easier imports
from .agents import *
from .llm import *
from .runtime import *
from .storage import *
from .events import *