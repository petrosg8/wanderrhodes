#!/usr/bin/env python3
import os
import sys
import json
from langchain_openai import OpenAIEmbeddings
from qdrant_client import QdrantClient

def main():
    # 1. Read command-line
    if len(sys.argv) < 2:
        print("[]", end="")
        return
    query = sys.argv[1]
    try:
        limit = int(sys.argv[2])
    except (IndexError, ValueError):
        limit = 5

    # 2. Connect to your on-disk Qdrant
    COLLECTION = os.getenv("RAG_COLLECTION", "rhodes_rag")
    DB_PATH    = os.getenv("RAG_DB_PATH", "rhodes_qdrant")
    EMBED_MODEL= os.getenv("RAG_EMBED_MODEL", "text-embedding-3-small")

    client   = QdrantClient(path=DB_PATH)

    # 3. Embed the query
    embedder = OpenAIEmbeddings(model=EMBED_MODEL)
    vector   = embedder.embed_query(query)

    # 4. Retrieve top-k (use .search for compatibility)
    hits = client.search(
        collection_name=COLLECTION,
        query_vector=vector,
        limit=limit
    )

    # 5. Build a JSON array of results
    out = []
    for hit in hits:
        meta = hit.payload
        out.append({
            "title":   meta.get("title", ""),
            "section": meta.get("section", ""),
            "text":    meta.get("text", ""),
            "url":     meta.get("url", "")
        })

    # 6. Print it all as one JSON string
    sys.stdout.write(json.dumps(out))
    sys.stdout.flush()

if __name__ == "__main__":
    main()
