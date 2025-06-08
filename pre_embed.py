from lxml import etree
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import OpenAIEmbeddings
from langchain_community.vectorstores import Qdrant
import uuid, itertools

XML     = "rhodes_knowledge_base_first_clean.xml"   # your file
COLL    = "rhodes_rag"
SPLITTER = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=120)

emb = OpenAIEmbeddings(model="text-embedding-3-small")
db  = QdrantClient(":memory:")                # swap for your server

def yield_chunks():
    ctx = etree.iterparse(XML, events=("end",), tag="section")
    for _, sect in ctx:
        # -------- raw text & quick clean ---------- #
        raw = (sect.text or "").strip()
        if not raw or len(raw) < 200:
            continue                           # skip fluff

        # strip obvious boiler-plate tokens
        cleaned = raw.replace("Quick view Bookmark", "").strip()

        for chunk in SPLITTER.split_text(cleaned):
            yield chunk, {
                "url":   sect.getparent().get("source"),
                "title": sect.getparent().findtext("title"),
                "sec":   sect.get("name"),
            }
        sect.clear(); sect.getparent().clear()

# -------- batch-embed & upsert ---------- #
for batch in iter(lambda: list(itertools.islice(yield_chunks(), 64)), []):
    texts, metas = zip(*batch)
    vecs = emb.embed_documents(texts)
    points = [
        qdrant.PointStruct(id=str(uuid.uuid4()), vector=v, payload=m)
        for v, m in zip(vecs, metas)
    ]
    db.upsert(collection_name=COLL, points=points)

print("✅ indexed", db.count(collection_name=COLL).count, "chunks")
