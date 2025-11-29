// script.js

// Khai báo các biến DOM
const fileInput = document.getElementById('pdf-upload');
const chatInput = document.getElementById('chat-input');
const chatForm = document.getElementById('chat-form');
const messagesArea = document.getElementById('messages-area');
const sendButton = document.getElementById('send-button');
const fileStatus = document.getElementById('file-status');
const footerMessage = document.getElementById('footer-message');
const chatEnd = document.getElementById('chat-end');
const welcomeMessage = document.getElementById('welcome-message');

// Biến trạng thái
let uploadedFile = null;
let isLoading = false;
const API_BASE_URL = 'http://127.0.0.1:8000';

// --- HÀM XỬ LÝ MARKDOWN (Mới) ---
const formatMarkdown = (text, isBot) => {
    let html = text;

    // 1. Chuyển đổi **text** thành <strong>text</strong> (In đậm)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 2. Chuyển đổi * List thành <ul><li> (Chỉ cho Bot để dễ định dạng)
    if (isBot) {
        // Thay thế * List (dạng * Chữ) thành <li>
        html = html.replace(/^\*\s*/gm, '<li>').replace(/^-/gm, '<li>');
        // Bọc trong <ul> nếu phát hiện list items
        if (html.includes('<li>')) {
            html = `<ul class="list-disc list-inside ml-4 mt-1">${html}</ul>`;
        }
    }

    // 3. Đảm bảo xuống dòng được xử lý (Sử dụng <br> thay vì <p> bên trong)
    html = html.replace(/\n/g, '<br>');
    return html;
};


// --- Hàm Tiện ích ---

function renderMessage(message) {
    welcomeMessage.style.display = 'none';

    const isUser = message.sender === 'user';

    // 1. Tạo phần tử wrapper ngoài cùng (Căn trái/phải)
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `flex w-full ${isUser ? 'justify-end' : 'justify-start'}`;

    // 2. Tạo khối nội dung (ĐÃ SỬA: Bỏ w-full max-w-3xl để nó co giãn)
    const contentBlock = document.createElement('div');
    contentBlock.className = `flex items-start ${isUser ? 'ml-auto mr-0' : 'mx-auto'}`;

    // 3. Tạo Icon/Avatar (Giữ nguyên)
    const iconDiv = document.createElement('div');
    const iconClass = isUser
        ? 'bg-gray-700 text-white'
        : 'bg-blue-500 text-white';

    iconDiv.className = `p-2 rounded-full ${iconClass} ${isUser ? 'order-2 ml-4' : 'order-1 mr-4'} mt-1`;
    iconDiv.innerHTML = isUser
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-user"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-cpu"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><path d="M9 18h6M9 6h6M12 9v6"></path></svg>';

    // 4. Tạo Nội dung (Text và Header)
    const textBlock = document.createElement('div');
    textBlock.className = `flex flex-col flex-1 p-0 ${isUser ? 'order-1 text-right' : 'order-2 text-left'}`;

    const senderName = document.createElement('p');
    senderName.className = 'font-semibold mb-1 text-sm text-gray-600';
    senderName.textContent = isUser ? 'Đan Dương' : 'AlvinPDF RAG';

    const textContent = document.createElement('div');

    // ĐÃ SỬA: Thêm inline-block và max-w-lg để bong bóng co giãn
    const bubbleClass = isUser
        ? 'bg-blue-500 text-white rounded-t-xl rounded-bl-xl shadow-md inline-block max-w-lg' // User
        : 'bg-gray-100 text-gray-800 rounded-t-xl rounded-br-xl shadow-sm inline-block max-w-lg'; // Bot

    textContent.className = `text-base ${bubbleClass} p-3 whitespace-pre-wrap`;
    // ÁP DỤNG FORMAT MARKDOWN
    textContent.innerHTML = formatMarkdown(message.text, isUser);

    // 5. Thêm các phần vào khối nội dung
    textBlock.appendChild(senderName);
    textBlock.appendChild(textContent);

    // Xử lý nguồn (Sources)
    if (message.sources && message.sources.length > 0) {
        const sourcesDiv = document.createElement('div');
        sourcesDiv.className = `mt-3 pt-3 border-t border-gray-200 ${isUser ? 'text-right' : 'text-left'}`;
        sourcesDiv.innerHTML = `<h4 class="text-xs font-medium text-gray-500 mb-1">🔍 Nguồn trích dẫn:</h4>
            <ul class="flex flex-wrap gap-2 ${isUser ? 'justify-end' : 'justify-start'}">
                ${message.sources.map(src =>
            `<li class="px-2 py-0.5 text-xs ${isUser ? 'bg-gray-200 text-gray-600' : 'bg-blue-100 text-blue-700'} rounded-full">${src.name}</li>`
        ).join('')}
            </ul>`;
        textBlock.appendChild(sourcesDiv);
    }

    // 6. Gắn kết tất cả lại
    contentBlock.appendChild(iconDiv);
    contentBlock.appendChild(textBlock);
    messageWrapper.appendChild(contentBlock);
    messagesArea.appendChild(messageWrapper);

    // Cuộn xuống
    chatEnd.scrollIntoView({ behavior: 'smooth' });
}

function updateUI() {
    // Cập nhật trạng thái tải lên
    const uploadLabel = document.querySelector('label[for="pdf-upload"]');
    uploadLabel.classList.toggle('bg-gray-200', isLoading);
    uploadLabel.classList.toggle('text-gray-500', isLoading);
    uploadLabel.classList.toggle('text-gray-700', !isLoading);

    // Cập nhật trạng thái nút gửi
    const isSendDisabled = !uploadedFile || isLoading || !chatInput.value.trim();
    sendButton.disabled = isSendDisabled;

    // Cập nhật Tailwind classes (Làm nút sáng lên khi có chữ)
    if (isSendDisabled) {
        sendButton.classList.remove('bg-blue-500', 'text-white', 'hover:bg-blue-600');
        sendButton.classList.add('bg-gray-300', 'text-gray-500');
    } else {
        sendButton.classList.remove('bg-gray-300', 'text-gray-500');
        sendButton.classList.add('bg-blue-500', 'text-white', 'hover:bg-blue-600');
    }

    // Cập nhật trạng thái ô nhập liệu
    chatInput.disabled = !uploadedFile || isLoading;
    chatInput.placeholder = uploadedFile
        ? 'Hỏi bất cứ điều gì về tài liệu...'
        : 'Vui lòng tải file PDF lên để bắt đầu';

    // Cập nhật trạng thái footer và header file status
    if (uploadedFile) {
        footerMessage.innerHTML = `Đang chat với: <strong>${uploadedFile.name}</strong>`;
        fileStatus.innerHTML = `<span class="text-sm text-green-600">Đang chat với: <strong>${uploadedFile.name}</strong></span>`;
    } else {
        footerMessage.textContent = 'Để bắt đầu, hãy tải lên một tệp PDF.';
        fileStatus.innerHTML = `<span class="text-gray-500 text-sm">Chưa có tệp</span>`;
    }
}


// --- Xử lý sự kiện ---

// 1. Tải lên PDF
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file || isLoading) return;

    isLoading = true;
    updateUI();
    messagesArea.innerHTML = ''; // Xóa tin nhắn cũ

    const formData = new FormData();
    formData.append('file', file);

    try {
        // Hiển thị tin nhắn đang tải
        renderMessage({ id: 'uploading', sender: 'bot', text: 'Đang tải lên và xử lý file...' });

        const response = await fetch(`${API_BASE_URL}/pdf/upload`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (response.ok) {
            uploadedFile = {
                id: data.data.pdf_collection_id,
                name: data.data.file_name,
            };
            messagesArea.innerHTML = ''; // Xóa tin nhắn "Đang tải lên"
            renderMessage({
                id: 'welcome',
                sender: 'bot',
                text: `Đã tải file "${uploadedFile.name}" thành công. Bây giờ bạn có thể hỏi về tài liệu này.`
            });
        } else {
            throw new Error(data.detail || 'Lỗi không xác định khi xử lý file.');
        }

    } catch (error) {
        messagesArea.innerHTML = ''; // Xóa tin nhắn "Đang tải lên"
        renderMessage({ id: 'error', sender: 'bot', text: `Lỗi: ${error.message}` });
        uploadedFile = null;
    } finally {
        isLoading = false;
        e.target.value = '';
        updateUI();
    }
});


// 2. Gửi tin nhắn
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = chatInput.value.trim();
    if (!input || isLoading || !uploadedFile) return;

    const userMessage = { id: Date.now().toString(), sender: 'user', text: input };
    renderMessage(userMessage);
    chatInput.value = ''; // Xóa nội dung input sau khi gửi

    isLoading = true;
    updateUI();

    try {
        const payload = { question: input, pdf_collection_id: uploadedFile.id };

        const response = await fetch(`${API_BASE_URL}/chat/ask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok) {
            const botMessage = {
                id: Date.now().toString() + 'bot',
                sender: 'bot',
                text: data.answer,
                sources: data.sources.map(src => ({ name: src.name })), // Định dạng lại nguồn
            };
            renderMessage(botMessage);
        } else {
            throw new Error(data.detail || 'Lỗi không xác định từ server chat.');
        }

    } catch (error) {
        renderMessage({
            id: Date.now().toString() + 'err',
            sender: 'bot',
            text: `Xin lỗi, đã có lỗi xảy ra khi chat: ${error.message}`
        });
    } finally {
        isLoading = false;
        updateUI();
    }
});

// Kích hoạt nút guiw
chatInput.addEventListener('input', updateUI);

// Khởi tạo giao diện lần đầu
document.addEventListener('DOMContentLoaded', updateUI);