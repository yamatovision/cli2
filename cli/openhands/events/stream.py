import asyncio
import queue
import threading
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from enum import Enum
from functools import partial
from typing import Any, Callable

from openhands.core.logger import openhands_logger as logger
from openhands.events.event import Event, EventSource
from openhands.events.event_store import EventStore
from openhands.events.serialization.event import event_from_dict, event_to_dict
from openhands.io import json
from openhands.storage import FileStore
from openhands.storage.locations import (
    get_conversation_dir,
)
from openhands.utils.async_utils import call_sync_from_async
from openhands.utils.shutdown_listener import should_continue


class EventStreamSubscriber(str, Enum):
    AGENT_CONTROLLER = 'agent_controller'
    SECURITY_ANALYZER = 'security_analyzer'
    RESOLVER = 'openhands_resolver'
    SERVER = 'server'
    RUNTIME = 'runtime'
    MEMORY = 'memory'
    MAIN = 'main'
    TEST = 'test'


async def session_exists(
    sid: str, file_store: FileStore, user_id: str | None = None
) -> bool:
    try:
        await call_sync_from_async(file_store.list, get_conversation_dir(sid, user_id))
        return True
    except FileNotFoundError:
        return False


class EventStream(EventStore):
    secrets: dict[str, str]
    # For each subscriber ID, there is a map of callback functions - useful
    # when there are multiple listeners
    _subscribers: dict[str, dict[str, Callable]]
    _lock: threading.Lock
    _queue: queue.Queue[Event]
    _queue_thread: threading.Thread
    _queue_loop: asyncio.AbstractEventLoop | None
    _thread_pools: dict[str, dict[str, ThreadPoolExecutor]]
    _thread_loops: dict[str, dict[str, asyncio.AbstractEventLoop]]
    _write_page_cache: list[dict]

    def __init__(self, sid: str, file_store: FileStore, user_id: str | None = None):
        super().__init__(sid, file_store, user_id)
        self._stop_flag = threading.Event()
        self._queue: queue.Queue[Event] = queue.Queue()
        self._thread_pools = {}
        self._thread_loops = {}
        self._queue_loop = None
        self._queue_thread = threading.Thread(target=self._run_queue_loop)
        self._queue_thread.daemon = True
        self._queue_thread.start()
        self._subscribers = {}
        self._lock = threading.Lock()
        self.secrets = {}
        self._write_page_cache = []

    def _init_thread_loop(self, subscriber_id: str, callback_id: str) -> None:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        if subscriber_id not in self._thread_loops:
            self._thread_loops[subscriber_id] = {}
        self._thread_loops[subscriber_id][callback_id] = loop

    def close(self) -> None:
        self._stop_flag.set()
        if self._queue_thread.is_alive():
            self._queue_thread.join()

        subscriber_ids = list(self._subscribers.keys())
        for subscriber_id in subscriber_ids:
            callback_ids = list(self._subscribers[subscriber_id].keys())
            for callback_id in callback_ids:
                self._clean_up_subscriber(subscriber_id, callback_id)

        # Clear queue
        while not self._queue.empty():
            self._queue.get()

    def _clean_up_subscriber(self, subscriber_id: str, callback_id: str) -> None:
        if subscriber_id not in self._subscribers:
            logger.warning(f'Subscriber not found during cleanup: {subscriber_id}')
            return
        if callback_id not in self._subscribers[subscriber_id]:
            logger.warning(f'Callback not found during cleanup: {callback_id}')
            return
        if (
            subscriber_id in self._thread_loops
            and callback_id in self._thread_loops[subscriber_id]
        ):
            loop = self._thread_loops[subscriber_id][callback_id]
            current_task = asyncio.current_task(loop)
            pending = [
                task for task in asyncio.all_tasks(loop) if task is not current_task
            ]
            for task in pending:
                task.cancel()
            try:
                loop.stop()
                loop.close()
            except Exception as e:
                logger.warning(
                    f'Error closing loop for {subscriber_id}/{callback_id}: {e}'
                )
            del self._thread_loops[subscriber_id][callback_id]

        if (
            subscriber_id in self._thread_pools
            and callback_id in self._thread_pools[subscriber_id]
        ):
            pool = self._thread_pools[subscriber_id][callback_id]
            pool.shutdown()
            del self._thread_pools[subscriber_id][callback_id]

        del self._subscribers[subscriber_id][callback_id]

    def subscribe(
        self,
        subscriber_id: EventStreamSubscriber,
        callback: Callable[[Event], None],
        callback_id: str,
    ) -> None:
        initializer = partial(self._init_thread_loop, subscriber_id, callback_id)
        pool = ThreadPoolExecutor(max_workers=1, initializer=initializer)
        if subscriber_id not in self._subscribers:
            self._subscribers[subscriber_id] = {}
            self._thread_pools[subscriber_id] = {}

        if callback_id in self._subscribers[subscriber_id]:
            raise ValueError(
                f'Callback ID on subscriber {subscriber_id} already exists: {callback_id}'
            )

        self._subscribers[subscriber_id][callback_id] = callback
        self._thread_pools[subscriber_id][callback_id] = pool

    def unsubscribe(
        self, subscriber_id: EventStreamSubscriber, callback_id: str
    ) -> None:
        if subscriber_id not in self._subscribers:
            logger.warning(f'Subscriber not found during unsubscribe: {subscriber_id}')
            return

        if callback_id not in self._subscribers[subscriber_id]:
            logger.warning(f'Callback not found during unsubscribe: {callback_id}')
            return

        self._clean_up_subscriber(subscriber_id, callback_id)

    def add_event(self, event: Event, source: EventSource) -> None:
        logger.info(f"AGENT_SWITCH_DEBUG: EventStream.add_event called - event_type: {type(event).__name__}, source: {source}")
        if event.id != Event.INVALID_ID:
            raise ValueError(
                f'Event already has an ID:{event.id}. It was probably added back to the EventStream from inside a handler, triggering a loop.'
            )
        event._timestamp = datetime.now().isoformat()
        event._source = source  # type: ignore [attr-defined]
        logger.info("AGENT_SWITCH_DEBUG: About to acquire lock for event processing")
        with self._lock:
            event._id = self.cur_id  # type: ignore [attr-defined]
            self.cur_id += 1

            # Take a copy of the current write page
            current_write_page = self._write_page_cache

            data = event_to_dict(event)
            data = self._replace_secrets(data)
            
            # Encrypt SystemMessageAction content in memory cache for security
            from openhands.events.action.message import SystemMessageAction
            from openhands.security.memory_encryption import get_memory_encryption
            
            if isinstance(event, SystemMessageAction):
                encryption = get_memory_encryption()
                # For actions, content is stored in args
                if 'args' in data and 'content' in data['args']:
                    original_content = data['args']['content']
                    data['args']['content'] = encryption.encrypt(original_content)
                    logger.info(
                        "SECURITY: SystemMessageAction content encrypted in memory cache",
                        extra={
                            'event_id': event.id,
                            'user_id': self.user_id,
                            'session_id': self.sid,
                            'content_length': len(original_content),
                            'encrypted_length': len(data['args']['content'])
                        }
                    )
            
            event = event_from_dict(data)
            current_write_page.append(data)

            # If the page is full, create a new page for future events / other threads to use
            if len(current_write_page) == self.cache_size:
                self._write_page_cache = []

        if event.id is not None:
            # Skip file storage for SystemMessageAction (security enhancement)
            from openhands.events.action.message import SystemMessageAction
            
            if isinstance(event, SystemMessageAction):
                logger.info(
                    "SECURITY: SystemMessageAction file storage disabled to prevent prompt leakage",
                    extra={
                        'event_id': event.id,
                        'user_id': self.user_id,
                        'session_id': self.sid,
                        'content_length': len(event.content)
                    }
                )
            else:
                # Write the event to the store - this can take some time
                event_json = json.dumps(data)
                filename = self._get_filename_for_id(event.id, self.user_id)
                if len(event_json) > 1_000_000:  # Roughly 1MB in bytes, ignoring encoding
                    logger.warning(
                        f'Saving event JSON over 1MB: {len(event_json):,} bytes, filename: {filename}',
                        extra={
                            'user_id': self.user_id,
                            'session_id': self.sid,
                            'size': len(event_json),
                        },
                    )
                self.file_store.write(filename, event_json)

            # Store the cache page last - if it is not present during reads then it will simply be bypassed.
            self._store_cache_page(current_write_page)
        logger.info("AGENT_SWITCH_DEBUG: About to put event in queue")
        self._queue.put(event)
        logger.info("AGENT_SWITCH_DEBUG: Event added to queue successfully")

    def _store_cache_page(self, current_write_page: list[dict]):
        """Store a page in the cache. Reading individual events is slow when there are a lot of them, so we use pages."""
        if len(current_write_page) < self.cache_size:
            return
        start = current_write_page[0]['id']
        end = start + self.cache_size
        contents = json.dumps(current_write_page)
        cache_filename = self._get_filename_for_cache(start, end)
        self.file_store.write(cache_filename, contents)

    def set_secrets(self, secrets: dict[str, str]) -> None:
        self.secrets = secrets.copy()

    def update_secrets(self, secrets: dict[str, str]) -> None:
        self.secrets.update(secrets)

    def _replace_secrets(self, data: dict[str, Any]) -> dict[str, Any]:
        for key in data:
            if isinstance(data[key], dict):
                data[key] = self._replace_secrets(data[key])
            elif isinstance(data[key], str):
                for secret in self.secrets.values():
                    data[key] = data[key].replace(secret, '<secret_hidden>')
        return data

    def _run_queue_loop(self) -> None:
        self._queue_loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self._queue_loop)
        try:
            self._queue_loop.run_until_complete(self._process_queue())
        finally:
            self._queue_loop.close()

    async def _process_queue(self) -> None:
        while should_continue() and not self._stop_flag.is_set():
            event = None
            try:
                event = self._queue.get(timeout=0.1)
            except queue.Empty:
                continue

            logger.info(f"AGENT_SWITCH_DEBUG: Processing event from queue: {type(event).__name__}")
            # pass each event to each callback in order
            for key in sorted(self._subscribers.keys()):
                callbacks = self._subscribers[key]
                # Create a copy of the keys to avoid "dictionary changed size during iteration" error
                callback_ids = list(callbacks.keys())
                for callback_id in callback_ids:
                    # Check if callback_id still exists (might have been removed during iteration)
                    if callback_id in callbacks:
                        callback = callbacks[callback_id]
                        logger.info(f"AGENT_SWITCH_DEBUG: Calling callback {callback_id} for subscriber {key}")
                        try:
                            # Check if callback is async
                            if asyncio.iscoroutinefunction(callback):
                                await callback(event)
                                logger.info(f"AGENT_SWITCH_DEBUG: Async callback {callback_id} completed")
                            else:
                                # Use thread pool for sync callbacks
                                pool = self._thread_pools[key][callback_id]
                                try:
                                    # Check if ThreadPoolExecutor is shutdown
                                    if hasattr(pool, '_shutdown') and pool._shutdown:
                                        logger.warning(f"THREADPOOL_DEBUG: Pool {callback_id} already shutdown, using direct execution")
                                        # Fallback: direct synchronous execution
                                        callback(event)
                                        logger.info(f"THREADPOOL_DEBUG: Direct execution completed for {callback_id}")
                                    else:
                                        future = pool.submit(callback, event)
                                        future.add_done_callback(
                                            self._make_error_handler(callback_id, key)
                                        )
                                        logger.info(f"AGENT_SWITCH_DEBUG: Sync callback {callback_id} submitted to thread pool")
                                except RuntimeError as e:
                                    if "cannot schedule new futures after shutdown" in str(e):
                                        logger.warning(f"THREADPOOL_DEBUG: Cannot submit to shutdown pool {callback_id}: {e}")
                                        # Fallback: direct synchronous execution
                                        try:
                                            callback(event)
                                            logger.info(f"THREADPOOL_DEBUG: Fallback sync execution completed for {callback_id}")
                                        except Exception as fallback_error:
                                            logger.error(f"THREADPOOL_DEBUG: Fallback execution failed for {callback_id}: {fallback_error}")
                                    else:
                                        raise
                        except Exception as e:
                            logger.error(
                                f'Error in event callback {callback_id} for subscriber {key}: {str(e)}',
                            )

    def _make_error_handler(
        self, callback_id: str, subscriber_id: str
    ) -> Callable[[Any], None]:
        def _handle_callback_error(fut: Any) -> None:
            try:
                # This will raise any exception that occurred during callback execution
                fut.result()
            except Exception as e:
                logger.error(
                    f'Error in event callback {callback_id} for subscriber {subscriber_id}: {str(e)}',
                )
                # Re-raise in the main thread so the error is not swallowed
                raise e

        return _handle_callback_error
