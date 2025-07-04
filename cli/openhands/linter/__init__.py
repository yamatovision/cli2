"""Linter module for OpenHands.

Part of this Linter module is adapted from Aider (Apache 2.0 License, [original
code](https://github.com/paul-gauthier/aider/blob/main/aider/linter.py)).
- Please see the [original repository](https://github.com/paul-gauthier/aider) for more information.
- The detailed implementation of the linter can be found at: https://github.com/All-Hands-AI/openhands-aci.
"""

try:
    from openhands_aci.linter import DefaultLinter, LintResult
    __all__ = ['DefaultLinter', 'LintResult']
except ImportError:
    # Fallback when openhands-aci is not available
    class DefaultLinter:
        def __init__(self, *args, **kwargs):
            pass
        
        def lint(self, *args, **kwargs):
            return []
    
    class LintResult:
        def __init__(self, *args, **kwargs):
            pass
    
    __all__ = ['DefaultLinter', 'LintResult']
