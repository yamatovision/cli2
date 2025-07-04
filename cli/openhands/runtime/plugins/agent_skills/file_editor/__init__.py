"""This file imports a global singleton of the `EditTool` class as well as raw functions that expose
its __call__.
The implementation of the `EditTool` class can be found at: https://github.com/All-Hands-AI/openhands-aci/.
"""

try:
    from openhands_aci.editor import file_editor
except ImportError:
    # Fallback when openhands-aci is not available
    def file_editor(*args, **kwargs):
        return "File editor not available - openhands-aci not installed"

__all__ = ['file_editor']
