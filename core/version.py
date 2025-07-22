"""Version information for BlueLamp AI package."""

import importlib.metadata


def get_version() -> str:
    """Get the current version of the bluelamp-ai package.
    
    Returns:
        str: The version string from the installed package metadata.
    """
    try:
        # Try to get version from installed package
        return importlib.metadata.version("bluelamp-ai")
    except importlib.metadata.PackageNotFoundError:
        # Fallback to development version if package is not installed
        return "1.4.1-dev"


# Package version
__version__ = get_version()