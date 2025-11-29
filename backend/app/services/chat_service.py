import logging
from app.core.lifespan import models_cache
from app.schema.chat_schema import QueryRequest, Source
from qdrant_client import QdrantClient
from app.prompts.chat_prompts import PROMPT_RAG_TEMPLATE

async def process_chat_request(request: QueryRequest) -> dict:
    try:
        embedding_model = models_cache["embedding_model"]
        qdrant_client: QdrantClient = models_cache["qdrant_client"]
        llm_rag = models_cache["llm_rag"]
        collection_name = request.pdf_collection_id

        # 2. BƯỚC R (Retrieval - Truy xuất)
        text_to_search = "query: " + request.question
        query_vector = embedding_model.encode(text_to_search).tolist()
        search_results = qdrant_client.search(
            collection_name=collection_name,
            query_vector=query_vector,
            limit=request.top_k,
        )

        context = ""
        retrieved_sources = set()
        for result in search_results:
            if result.payload:
                context += result.payload["content"] + "\n---\n"
                retrieved_sources.add(result.payload["source"])

        # 3. BƯỚC A (Augmented - Tăng cường)
        final_prompt = PROMPT_RAG_TEMPLATE.format(
            context=context, question=request.question
        )

        # 4. BƯỚC G (Generation - Sinh)
        response_from_llm = await llm_rag.generate_content_async(final_prompt)
        answer = response_from_llm.text
        
        final_sources = [Source(name=str(src)) for src in retrieved_sources]

        return { "answer": answer, "sources": final_sources }

    except Exception as e:
        logging.error(f"Lỗi RAG: {e}", exc_info=True)
        if "not found" in str(e).lower() or "does not exist" in str(e).lower():
             return {
                "answer": "Lỗi: Không tìm thấy file PDF này. Có thể server đã khởi động lại. Vui lòng tải file lên lại.",
                "sources": []
            }
        return {
            "answer": "Xin lỗi, đã có lỗi xảy ra trong quá trình xử lý. Vui lòng thử lại.",
            "sources": []
        }