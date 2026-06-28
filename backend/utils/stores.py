"""Shared vector-store singletons."""
import os

from config import VECTOR_DIR
from utils.vector_store import VectorStore

_main = None


def get_main_store() -> VectorStore:
    """Knowledge base of uploaded documents, used by chat + query."""
    global _main
    if _main is None:
        _main = VectorStore(os.path.join(VECTOR_DIR, "embedding_store.pkl"))
    return _main
