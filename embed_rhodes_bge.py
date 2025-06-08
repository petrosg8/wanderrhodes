#!/usr/bin/env python3
"""
Embed rhodes_knowledge_base_clean.xml with OpenAI text-embedding-3-small
and store in a local Qdrant vector DB.
"""

import itertools, json, os, uuid, time
from lxml import etree
from tqdm import tqdm
from dotenv import load_dotenv

load_dotenv()                                   # picks up OPENAI_API_KEY

# ---------- config ----------
XML_FILE   = "rhodes_knowledge_base_clean.xml"
BATCH_TOKS = 2048            # OpenAI max per request
MIN_CHARS  = 200
COLLECTION = "rhodes_rag"
# ----------------------------

# --- OpenAI embedding wrapper ---
from langchain_openai import OpenAIEmbeddings
emb = OpenAIEmbeddings(model="text-embedding-3-small")

from qdrant_client import QdrantClient, models as qdrant

db = QdrantClient(path="rhodes_qdrant")

# --- NEW: make the collection once ---
VECTOR_DIM = len(emb.embed_query("ping"))        # 1536 for text-embedding-3-small
db.recreate_collection(
    collection_name=COLLECTION,
    vectors_config=qdrant.VectorParams(
        size=VECTOR_DIM,
        distance=qdrant.Distance.COSINE
    ),
)
# --------------------------------------

# --- simple tokenizer for size check (tiktoken) ---
import tiktoken
enc = tiktoken.encoding_for_model("text-embedding-3-small")

def iter_chunks():
    """Yield (text, meta) tuples ≤~600 tokens each."""
    for _, sect in etree.iterparse(XML_FILE, events=("end",), tag="section"):
        txt = (sect.text or "").replace("Quick view Bookmark", "").strip()
        if len(txt) < MIN_CHARS:
            sect.clear();  continue
        parent = sect.getparent()
        meta = {
            "url":     parent.get("source"),
            "title":   parent.findtext("title") or "",
            "section": sect.get("name") or "",
            "doc_id":  parent.get("id"),
        }
        # naive sentence split so we rarely exceed 600 tokens
        for para in txt.split("\n\n"):
            if len(enc.encode(para)) > 600:
                # break long para into 200-token windows
                toks = enc.encode(para)
                for i in range(0, len(toks), 600):
                    yield enc.decode(toks[i:i+600]), meta
            else:
                yield para.strip(), meta
        sect.clear()

def batcher(iterator, max_tokens=BATCH_TOKS):
    """Group texts so total token count ≤ max_tokens."""
    batch, tok_count = [], 0
    for text, meta in iterator:
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
    vectors = emb.embed_documents(list(texts))   # remote call
    points = [
        qdrant.PointStruct(
            id=str(uuid.uuid4()),
            vector=v,
            payload={**m, "text": t},
        )
        for v, m, t in zip(vectors, metas, texts)
    ]
    db.upsert(collection_name=COLLECTION, points=points)

count = db.count(collection_name=COLLECTION).count
print(f"✅  All done — {count} chunks embedded and stored.")
