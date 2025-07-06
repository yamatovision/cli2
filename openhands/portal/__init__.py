"""
Portal連携モジュール
Portal APIとの連携機能を提供
"""

from .prompt_client import PortalPromptClient, fetch_portal_prompt, test_portal_connection
from .portal_prompt_manager import PortalPromptManager, create_portal_prompt_manager
from .prompt_mapping import (
    PROMPT_MAPPING, 
    ID_TO_LOCAL, 
    PROMPT_TITLES,
    get_prompt_id, 
    get_local_filename, 
    get_prompt_title, 
    is_portal_prompt
)

__all__ = [
    'PortalPromptClient',
    'PortalPromptManager', 
    'fetch_portal_prompt',
    'test_portal_connection',
    'create_portal_prompt_manager',
    'PROMPT_MAPPING',
    'ID_TO_LOCAL',
    'PROMPT_TITLES',
    'get_prompt_id',
    'get_local_filename', 
    'get_prompt_title',
    'is_portal_prompt'
]