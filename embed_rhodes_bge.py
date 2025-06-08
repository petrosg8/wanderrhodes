#!/usr/bin/env python3
"""
Embed rhodes_knowledge_base_clean.xml with OpenAI text-embedding-3-small
and store in a local on-disk Qdrant vector DB, tagging each chunk with
a simple 'category' (e.g. restaurant, beach, other).
"""

import os
import itertools
import json
import uuid
from dotenv import load_dotenv
from lxml import etree
from tqdm import tqdm
import tiktoken

# Load API key
load_dotenv()

# ---------- Config ----------
XML_FILE     = "rhodes_knowledge_base_clean.xml"
BATCH_TOKENS = 2048
MIN_CHARS    = 200
COLLECTION   = os.getenv("RAG_COLLECTION", "rhodes_rag")
DB_PATH      = os.getenv("RAG_DB_PATH", "rhodes_qdrant")
EMBED_MODEL  = os.getenv("RAG_EMBED_MODEL", "text-embedding-3-small")
# ----------------------------

from langchain_openai import OpenAIEmbeddings
from qdrant_client import QdrantClient, models as qdrant

# Instantiate embedder & DB client
emb    = OpenAIEmbeddings(model=EMBED_MODEL)
client = QdrantClient(path=DB_PATH)

# Ensure collection exists (create if missing)
existing = [c.name for c in client.get_collections().collections]
dim      = len(emb.embed_query("ping"))
if COLLECTION not in existing:
    client.create_collection(
        collection_name=COLLECTION,
        vectors_config=qdrant.VectorParams(size=dim, distance=qdrant.Distance.COSINE),
    )

# Tokenizer for batching
enc = tiktoken.encoding_for_model(EMBED_MODEL)

def iter_chunks():
    for _, sect in etree.iterparse(XML_FILE, events=("end",), tag="section"):
        text = (sect.text or "").replace("Quick view Bookmark", "").strip()
        if len(text) < MIN_CHARS:
            sect.clear()
            continue

        parent = sect.getparent()
        url    = parent.get("source", "")
        # Heuristic category tagging
        if "/listing/" in url:
            category = "restaurant"
        elif "/beaches/" in url:
            category = "beach"
        else:
            category = "other"

        meta = {
            "url":      url,
            "title":    parent.findtext("title") or "",
            "section":  sect.get("name") or "",
            "doc_id":   parent.get("id") or "",
            "category": category
        }

        for para in text.split("\n\n"):
            toks = enc.encode(para)
            if len(toks) <= 600:
                yield para, meta
            else:
                for i in range(0, len(toks), 600):
                    yield enc.decode(toks[i : i + 600]), meta

        sect.clear()

def batcher(it, max_tokens=BATCH_TOKENS):
    batch, tok_count = [], 0
    for text, meta in it:
        n = len(enc.encode(text))
        if tok_count + n > max_tokens and batch:
            yield batch
            batch, tok_count = [], 0
        batch.append((text, meta))
        tok_count += n
    if batch:
        yield batch

print("Embedding via OpenAI …")
for batch in tqdm(batcher(iter_chunks())):
    texts, metas = zip(*batch)
    vectors      = emb.embed_documents(list(texts))
    points       = [
        qdrant.PointStruct(
            id=str(uuid.uuid4()),
            vector=v,
            payload={**m, "text": t},
        )
        for v, m, t in zip(vectors, metas, texts)
    ]
    client.upsert(collection_name=COLLECTION, points=points)

count = client.count(COLLECTION).count
print(f"✅ All done — {count} chunks embedded and stored.")
