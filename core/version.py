"""Version information for BlueLamp AI package."""

import importlib.metadata


def get_version() -> str:
    """Get the current version of the bluelamp-ai package.
    
    Returns:
        str: The version string from the installed package metadata.
    
    Raises:
        importlib.metadata.PackageNotFoundError: If the package is not installed
    """
    # Try to get version from installed package - no fallback
    return importlib.metadata.version("bluelamp-ai")


# Package version
__version__ = get_version()