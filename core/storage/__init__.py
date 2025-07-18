import os

import httpx

from core.storage.files import FileStore
from core.storage.local import LocalFileStore
from core.storage.memory_file_store import InMemoryFileStore
from core.storage.web_hook import WebHookFileStore

# Optional imports for cloud storage
try:
    from core.storage.google_cloud import GoogleCloudFileStore
except ImportError:
    GoogleCloudFileStore = None

try:
    from core.storage.s3 import S3FileStore
except ImportError:
    S3FileStore = None


def get_file_store(
    file_store_type: str,
    file_store_path: str | None = None,
    file_store_web_hook_url: str | None = None,
    file_store_web_hook_headers: dict | None = None,
) -> FileStore:
    store: FileStore
    if file_store_type == 'local':
        if file_store_path is None:
            raise ValueError('file_store_path is required for local file store')
        store = LocalFileStore(file_store_path)
    elif file_store_type == 's3':
        if S3FileStore is None:
            raise ValueError('S3 storage dependencies not installed')
        store = S3FileStore(file_store_path)
    elif file_store_type == 'google_cloud':
        if GoogleCloudFileStore is None:
            raise ValueError('Google Cloud storage dependencies not installed')
        store = GoogleCloudFileStore(file_store_path)
    else:
        store = InMemoryFileStore()
    if file_store_web_hook_url:
        if file_store_web_hook_headers is None:
            # Fallback to default headers. Use the session api key if it is defined in the env.
            file_store_web_hook_headers = {}
            if os.getenv('SESSION_API_KEY'):
                file_store_web_hook_headers['X-Session-API-Key'] = os.getenv(
                    'SESSION_API_KEY'
                )
        store = WebHookFileStore(
            store,
            file_store_web_hook_url,
            httpx.Client(headers=file_store_web_hook_headers or {}),
        )
    return store