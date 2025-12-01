# 🤖 AlvinPDF Chatbot System

**Project Status:** Hoàn thành (Được phát triển cho Niên luận ngành Hệ thống Thông tin)

**Tóm tắt:** Hệ thống AlvinPDF Chatbot là một Ứng dụng Web (Web Application) sử dụng kiến trúc **Retrieval-Augmented Generation (RAG)** để phân tích, lập chỉ mục nội dung file PDF (Ví dụ: Tài liệu chuyên ngành, Quy tắc nhân sự) và cung cấp khả năng trả lời câu hỏi chính xác thông qua mô hình **Gemini**.

-----

## 🌟 Chức năng Cốt lõi (Key Features)

  * **Tải lên & Xử lý PDF:** Phân tích nội dung file PDF bằng **`pypdf`** và áp dụng chiến lược **TokenTextSplitter** (`512` tokens).
  * **Vector hóa:** Sử dụng **`intfloat/multilingual-e5-large`** để tạo vector nhúng (1024 chiều) đa ngôn ngữ.
  * **Truy xuất Ngữ cảnh:** Sử dụng **Qdrant** (Vector Database) để tìm kiếm các đoạn văn bản liên quan nhất (top K) theo ngữ nghĩa.
  * **Sinh câu trả lời (Generation):** Sử dụng **Gemini-2.5-Flash** để tổng hợp câu trả lời dựa trên ngữ cảnh đã trích xuất, giảm thiểu bịa đặt (hallucination).
  * **Kiến trúc Client-Server:** Frontend (HTML/JS) giao tiếp với Backend (FastAPI).

-----

## ⚙️ Kiến trúc Kỹ thuật (Technical Stack)

| Lớp | Công nghệ | Chi tiết |
| :--- | :--- | :--- |
| **Backend / RAG** | **Python** (3.11+) / **FastAPI** | Cung cấp các API endpoint (`/pdf/upload`, `/chat/ask`). |
| **Vector Database** | **Qdrant** | Chạy In-memory (Phát triển) và sử dụng Cosine Similarity để tìm kiếm. |
| **Mô hình AI (LLM)** | **Gemini-2.5-Flash** | Mô hình ngôn ngữ lớn (LLM) cho tầng tạo câu trả lời. |
| **Mô hình Nhúng** | **Sentence-Transformers** | `intfloat/multilingual-e5-large` (Vectorization). |
| **Frontend** | **HTML5/JS/Tailwind CSS** | Giao diện người dùng web tĩnh, tương tác qua `fetch()` API. |
| **Triển khai** | **Uvicorn** / **Docker** | Uvicorn chạy server ASGI. Docker được đề xuất cho môi trường sản phẩm. |

-----

## 📦 Yêu cầu & Cài đặt (Setup)

### Yêu cầu Tiên quyết

  * Python 3.11+ (Đã tạo `venv`).
  * Khóa API **Gemini** (Lấy từ Google AI Studio).
  * Công cụ Git.

### Cài đặt Backend

1.  **Clone Dự án:**
    ```bash
    git clone https://github.com/DanDuong0421/AlvinPDF_Chatbox.git
    cd AlvinPDF_Chatbox/backend
    ```
2.  **Kích hoạt venv và Cài đặt:**
    ```bash
    source venv/Scripts/activate # Kích hoạt môi trường ảo
    pip install -r requirements.txt # Cài đặt các thư viện cần thiết
    ```
3.  **Cấu hình API Key:**
      * Tạo file **`.env`** trong thư mục `backend/`.
      * Dán Khóa API của bạn vào đó:
        ```
        GOOGLE_API_KEY=...khoá_API_của_bạn...
        MODEL_EMBEDDING=intfloat/multilingual-e5-large
        ```

-----

## 🏃 Hướng dẫn Khởi động và Sử dụng

Bạn cần mở hai terminal để chạy Backend và Frontend:

### 1\. Khởi động Backend (API Server)

```bash
# Trong thư mục backend/ (sau khi venv đã được kích hoạt)
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2\. Khởi động Frontend (Web Server)

```bash
# Mở terminal mới
cd ../frontend_js 
python -m http.server 8080 
```

Truy cập trình duyệt tại: `http://localhost:8080`

### 3\. Tương tác RAG

1.  **Upload:** Nhấp vào icon Upload và chọn file PDF.
2.  **Indexing:** Backend sẽ xử lý và lưu vector vào Qdrant.
3.  **Query:** Gõ câu hỏi vào ô chat. Hệ thống sẽ trả lời với độ trung thực cao dựa trên nội dung tài liệu.

-----