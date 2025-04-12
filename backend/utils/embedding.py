from langchain_upstage import UpstageEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from typing import List
import dotenv
import os

from openai import OpenAI

dotenv.load_dotenv()

UPSTAGE_API_KEY = os.getenv("UPSTAGE_API_KEY")
if not UPSTAGE_API_KEY:
    raise ValueError("UPSTAGE_API_KEY not found in environment variables.")

# Set up the embeddings client
embedding_model = UpstageEmbeddings(
    model="embedding-passage",
    upstage_api_key=UPSTAGE_API_KEY
)

def embed_and_store_chunks(chunks: List[Document], faiss_path: str = "vector_store") -> FAISS:
    """
    Embeds a list of Documents and stores them in a FAISS index.

    Parameters:
    - chunks: List of langchain Document objects with metadata
    - faiss_path: Where to persist the FAISS index (optional)

    Returns:
    - FAISS index object
    """

    vectorstore = FAISS.from_documents(documents=chunks, embedding=embedding_model)

    # Persist index to disk
    vectorstore.save_local(faiss_path)

    return vectorstore


# print(embed_and_store_chunks(chunks=[Document(page_content="Hello world", metadata={"source": "example.txt"})], faiss_path="faiss_index"))