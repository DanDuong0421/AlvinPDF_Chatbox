from fastapi import APIRouter, UploadFile, File, HTTPException
from app.schema.chat_schema import QueryResponse # Tái sử dụng schema
from app.services import pdf_service
import shutil
import os
from pydantic import BaseModel

router = APIRouter()
TEMP_DIR = "temp_uploads"
os.makedirs(TEMP_DIR, exist_ok=True) 

class PDFUploadResponse(BaseModel):
    success: bool
    message: str
    data: dict

@router.post("/upload", response_model=PDFUploadResponse)
async def upload_and_index_pdf(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Chỉ chấp nhận file PDF.")

    temp_file_path = os.path.join(TEMP_DIR, file.filename)

    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        collection_name = pdf_service.index_pdf_file(file, temp_file_path)
        
        return PDFUploadResponse(
            success=True,
            message=f"File '{file.filename}' đã được index thành công.",
            data={"pdf_collection_id": collection_name, "file_name": file.filename}
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)