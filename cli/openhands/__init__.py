import os

__package_name__ = 'bluelamp-ai'


def get_version():
    # Try getting the version from importlib.metadata first (modern approach)
    try:
        from importlib.metadata import PackageNotFoundError, version
        return version(__package_name__)
    except (ImportError, PackageNotFoundError):
        pass

    # Try getting the version from pyproject.toml (development environment)
    try:
        root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        with open(os.path.join(root_dir, 'pyproject.toml'), 'r') as f:
            for line in f:
                if line.startswith('version ='):
                    return line.split('=')[1].strip().strip('"')
    except FileNotFoundError:
        pass

    # Fallback to hardcoded version
    return '1.0.12'


try:
    __version__ = get_version()
except Exception:
    __version__ = 'unknown'
