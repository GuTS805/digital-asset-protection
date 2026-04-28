"""
Database client.
- If SUPABASE_URL and SUPABASE_KEY are set: uses Supabase.
- Otherwise: falls back to an in-memory store so the app runs without credentials.
"""

import os
import json
import logging
from dotenv import load_dotenv

load_dotenv()

_DB_FILE = os.path.join(os.path.dirname(__file__), "data", "db.json")


def _load_store() -> dict:
    try:
        with open(_DB_FILE) as f:
            return json.load(f)
    except Exception:
        return {"assets": [], "violations": []}


def _save_store(store: dict):
    os.makedirs(os.path.dirname(_DB_FILE), exist_ok=True)
    with open(_DB_FILE, "w") as f:
        json.dump(store, f, default=str, indent=2)


# ── In-memory fallback ──────────────────────────────────────────────────────

class _QueryBuilder:
    def __init__(self, store: list):
        self._store = store
        self._filters: list[tuple] = []
        self._order_col: str | None = None
        self._order_desc: bool = False
        self._limit_n: int | None = None
        self._single = False
        self._select_cols = "*"

    def select(self, cols="*"):
        self._select_cols = cols
        return self

    def insert(self, record: dict):
        self._store.append(dict(record))
        _save_store(_STORE)
        return self

    def update(self, patch: dict):
        for item in self._store:
            if all(item.get(k) == v for k, v in self._filters):
                item.update(patch)
        return self

    def delete(self):
        remove = [i for i in self._store if all(i.get(k) == v for k, v in self._filters)]
        for r in remove:
            self._store.remove(r)
        return self

    def eq(self, col: str, val):
        self._filters.append((col, val))
        return self

    def order(self, col: str, desc: bool = False):
        self._order_col = col
        self._order_desc = desc
        return self

    def limit(self, n: int):
        self._limit_n = n
        return self

    def single(self):
        self._single = True
        return self

    def execute(self):
        results = [
            r for r in self._store
            if all(r.get(k) == v for k, v in self._filters)
        ]
        if self._order_col:
            results = sorted(results, key=lambda x: x.get(self._order_col, ""), reverse=self._order_desc)
        if self._limit_n:
            results = results[:self._limit_n]

        # Mimic joined select (assets(name)) for violations
        enriched = []
        for r in results:
            row = dict(r)
            if "assets" not in row and "asset_id" in row:
                asset = next(
                    (a for a in _STORE.get("assets", []) if a.get("id") == row.get("asset_id")),
                    None,
                )
                row["assets"] = {"name": asset["name"]} if asset else None
            enriched.append(row)

        if self._single:
            return type("R", (), {"data": enriched[0] if enriched else None})()
        return type("R", (), {"data": enriched})()


_STORE: dict[str, list] = _load_store()


class _Table:
    def __init__(self, name: str):
        self._name = name
        if name not in _STORE:
            _STORE[name] = []

    def select(self, cols="*"):
        return _QueryBuilder(_STORE[self._name]).select(cols)

    def insert(self, record: dict):
        return _QueryBuilder(_STORE[self._name]).insert(record)

    def update(self, patch: dict):
        qb = _QueryBuilder(_STORE[self._name])
        qb._patch = patch
        # Return a builder that applies update on eq().execute()
        class _Updater:
            def __init__(self, store, patch):
                self._store = store
                self._patch = patch
                self._filters = []
            def eq(self, col, val):
                self._filters.append((col, val))
                return self
            def execute(self):
                for item in self._store:
                    if all(item.get(k) == v for k, v in self._filters):
                        item.update(self._patch)
                _save_store(_STORE)
                return type("R", (), {"data": None})()
        return _Updater(_STORE[self._name], patch)

    def delete(self):
        class _Deleter:
            def __init__(self, store):
                self._store = store
                self._filters = []
            def eq(self, col, val):
                self._filters.append((col, val))
                return self
            def execute(self):
                to_remove = [r for r in self._store if all(r.get(k) == v for k, v in self._filters)]
                for r in to_remove:
                    self._store.remove(r)
                _save_store(_STORE)
                return type("R", (), {"data": None})()
        return _Deleter(_STORE[self._name])


class _StorageBucket:
    def upload(self, path, data): pass
    def get_public_url(self, path): return f"/static/{path}"


class _Storage:
    def from_(self, bucket): return _StorageBucket()


class _MockClient:
    def table(self, name): return _Table(name)
    storage = _Storage()


# ── Real Supabase ────────────────────────────────────────────────────────────

_client = None


def get_db():
    global _client
    if _client is not None:
        return _client

    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_KEY", "")

    if url and key:
        try:
            from supabase import create_client
            _client = create_client(url, key)
            logging.getLogger(__name__).info("Connected to Supabase")
        except Exception as e:
            logging.getLogger(__name__).warning(f"Supabase init failed ({e}), using in-memory store")
            _client = _MockClient()
    else:
        _client = _MockClient()

    return _client
