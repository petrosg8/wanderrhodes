#!/usr/bin/env python3
"""Simple retrieval script using Qdrant local DB"""
import json, sys, os
from qdrant_client import QdrantClient, models as qdrant
from langchain_openai import OpenAIEmbeddings

COLLECTION = os.getenv("RAG_COLLECTION", "rhodes_rag")
DB_PATH = os.getenv("RAG_DB_PATH", "rhodes_qdrant")
EMBED_MODEL = os.getenv("RAG_EMBED_MODEL", "text-embedding-3-small")


def main():
    if len(sys.argv) < 2:
        print("Usage: rag_retrieve.py <query> [limit]", file=sys.stderr)
        sys.exit(1)
    query = sys.argv[1]
    limit = int(sys.argv[2]) if len(sys.argv) > 2 else 3

    embeddings = OpenAIEmbeddings(model=EMBED_MODEL)
    client = QdrantClient(path=DB_PATH)

    vector = embeddings.embed_query(query)
    results = client.search(collection_name=COLLECTION, query_vector=vector, limit=limit)

    payloads = [r.payload for r in results]
    print(json.dumps(payloads, ensure_ascii=False))


if __name__ == "__main__":
    main()
