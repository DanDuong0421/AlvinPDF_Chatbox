import os
import pypdf
import uuid
from typing import List
from qdrant_client import QdrantClient, models
from langchain_text_splitters import TokenTextSplitter
from transformers import AutoTokenizer
from fastapi import UploadFile, HTTPException
from app.core.lifespan import models_cache # Lấy model đã tải sẵn
from dotenv import load_dotenv


load_dotenv()

# Kích thước vector (lấy từ model embedding của bạn)
# model "intfloat/multilingual-e5-large" có kích thước là 1024
VECTOR_DIMENSION = 1024 

def load_text_from_pdf(file_path: str) -> str:
    text = ""
    try:
        reader = pypdf.PdfReader(file_path)
        for page in reader.pages:
            text += page.extract_text() or ""
    except Exception as e:
        print(f"Lỗi khi đọc file PDF {file_path}: {e}")
        raise HTTPException(status_code=500, detail=f"Không thể đọc file PDF: {e}")
    return text

def index_pdf_file(file: UploadFile, temp_file_path: str) -> str:
    try:
        embedding_model = models_cache["embedding_model"]
        qdrant_client: QdrantClient = models_cache["qdrant_client"]
        
        tokenizer = AutoTokenizer.from_pretrained(os.getenv("MODEL_EMBEDDING"))
        text_splitter = TokenTextSplitter.from_huggingface_tokenizer(
            tokenizer=tokenizer,
            chunk_size=512,
            chunk_overlap=50
        )
    except KeyError:
        raise HTTPException(status_code=500, detail="Các mô hình AI chưa được khởi tạo.")

    collection_name = f"pdf_{uuid.uuid4().hex}" 
    try:
        qdrant_client.recreate_collection( # Dùng recreate_collection cho an toàn
            collection_name=collection_name,
            vectors_config=models.VectorParams(
                size=VECTOR_DIMENSION, distance=models.Distance.COSINE
            ),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Không thể tạo collection Qdrant: {e}")

    full_text = load_text_from_pdf(temp_file_path)
    if not full_text:
        raise HTTPException(status_code=400, detail="File PDF không có nội dung hoặc không thể đọc.")
    
    chunks = text_splitter.split_text(full_text)
    print(f"Đã chia file PDF thành {len(chunks)} chunks.")

    batch_size = 128
    point_id_counter = 0

    for i in range(0, len(chunks), batch_size):
        batch_chunks = chunks[i : i + batch_size]
        texts_to_embed = ["passage: " + chunk for chunk in batch_chunks]
        
        print(f"Đang vector hóa batch {i//batch_size + 1}...")
        vectors = embedding_model.encode(texts_to_embed).tolist()

        points_to_upsert = []
        for j, chunk_text in enumerate(batch_chunks):
            points_to_upsert.append(
                models.PointStruct(
                    id=point_id_counter,
                    vector=vectors[j],
                    payload={
                        "content": chunk_text,
                        "source": file.filename 
                    },
                )
            )
            point_id_counter += 1

        qdrant_client.upsert(
            collection_name=collection_name,
            points=points_to_upsert,
            wait=True
        )
    
    print(f"Đã index thành công vào collection: {collection_name}")
    return collection_name