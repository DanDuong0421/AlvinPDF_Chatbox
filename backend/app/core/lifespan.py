import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer
import google.generativeai as genai
from dotenv import load_dotenv

# --- 1. THÊM 2 DÒNG IMPORT NÀY ---
from transformers import AutoTokenizer
from langchain_text_splitters import TokenTextSplitter

load_dotenv()

# Biến cache toàn cục
models_cache = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Tải các mô hình AI
    print("Đang tải các mô hình AI...")
    genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
    
    model_name = os.getenv("MODEL_EMBEDDING", "intfloat/multilingual-e5-large")
    
    models_cache["embedding_model"] = SentenceTransformer(model_name)
    models_cache["llm_rag"] = genai.GenerativeModel("models/gemini-2.5-flash")

    # --- 2. THÊM 2 KHỐI NÀY VÀO CACHE ---
    print("Đang tải Tokenizer và Text Splitter...")
    models_cache["tokenizer"] = AutoTokenizer.from_pretrained(model_name)
    models_cache["text_splitter"] = TokenTextSplitter.from_huggingface_tokenizer(
        tokenizer=models_cache["tokenizer"],
        chunk_size=512,
        chunk_overlap=50
    )
    
    # 3. KHỞI TẠO QDRANT
    print("Khởi tạo Qdrant (in-memory)...")
    models_cache["qdrant_client"] = QdrantClient(location=":memory:")
    
    print("Hệ thống đã sẵn sàng!")
    
    yield
    
    # Dọn dẹp
    print("Đang dọn dẹp cache...")
    models_cache.clear()