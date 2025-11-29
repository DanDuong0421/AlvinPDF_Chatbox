from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.lifespan import lifespan
from app.router import chat_router, pdf_router
import os

app = FastAPI(
    title="PlantSense MVP API",
    description="API cho chatbot RAG với PDF",
    lifespan=lifespan,
    version="1.0.0",
)

# Cho phép frontend gọi
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Cho phép tất cả (để test)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đăng ký router
app.include_router(chat_router.router, prefix="/chat", tags=["Chat"])
app.include_router(pdf_router.router, prefix="/pdf", tags=["PDF"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)