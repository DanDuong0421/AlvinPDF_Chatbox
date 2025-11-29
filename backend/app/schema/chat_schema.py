from pydantic import BaseModel, Field
from typing import List, Optional

class Source(BaseModel):
    name: str # Tên file PDF

class QueryRequest(BaseModel):
    question: str
    pdf_collection_id: str  # BẮT BUỘC: ID của file PDF muốn hỏi
    top_k: int = 5

class QueryResponse(BaseModel):
    answer: str
    sources: List[Source]