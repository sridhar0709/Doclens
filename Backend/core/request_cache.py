"""In-memory TTL cache mapping request_id -> CitizenProfile.

The /api/draft endpoint needs the citizen profile captured during the earlier
/api/intake call, correlated by request_id. For the hackathon MVP this lives in
process memory with a TTL and a size cap (LRU-style eviction). It intentionally
does not survive a restart or span multiple instances — a note captured in the
architecture writeup; swapping in Redis/Postgres later is a drop-in change.

Access is guarded by a lock so concurrent async requests stay consistent.
"""

from __future__ import annotations

import threading
import time
from collections import OrderedDict

from ..models.request_models import CitizenProfile


class RequestCache:
    """Thread-safe TTL + size-bounded cache of request_id -> CitizenProfile."""

    def __init__(self, ttl_seconds: int, max_size: int) -> None:
        self._ttl = ttl_seconds
        self._max_size = max_size
        self._store: "OrderedDict[str, tuple[float, CitizenProfile]]" = OrderedDict()
        self._lock = threading.Lock()

    def _now(self) -> float:
        return time.monotonic()

    def set(self, request_id: str, profile: CitizenProfile) -> None:
        expires_at = self._now() + self._ttl
        with self._lock:
            self._store[request_id] = (expires_at, profile)
            self._store.move_to_end(request_id)
            self._evict_locked()

    def get(self, request_id: str) -> CitizenProfile | None:
        with self._lock:
            entry = self._store.get(request_id)
            if entry is None:
                return None
            expires_at, profile = entry
            if expires_at < self._now():
                # Expired; drop it.
                del self._store[request_id]
                return None
            self._store.move_to_end(request_id)
            return profile

    def _evict_locked(self) -> None:
        # Purge expired entries first.
        now = self._now()
        expired = [k for k, (exp, _) in self._store.items() if exp < now]
        for k in expired:
            del self._store[k]
        # Then enforce the size cap (evict oldest).
        while len(self._store) > self._max_size:
            self._store.popitem(last=False)

    def __len__(self) -> int:  # pragma: no cover - trivial
        with self._lock:
            return len(self._store)
