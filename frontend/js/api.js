// ============================================================
// API.JS — Gọi các API CRUD (kèm JWT Token)
// ============================================================

const API_BASE = CONFIG.API_URL;

// ============================================================
// Helper: Tạo headers với Authorization token
// ============================================================
async function getAuthHeaders() {
    try {
        const token = await getValidToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': token
        };
    } catch (e) {
        console.warn("Không thể lấy token mới tự động, sử dụng token hiện tại:", e);
        const token = getToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': token || ''
        };
    }
}

// ============================================================
// Helper: Xử lý response
// ============================================================
async function handleResponse(response) {
    if (response.status === 401) {
        // Token hết hạn hoặc không hợp lệ
        signOut();
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || `Lỗi ${response.status}`);
    }

    return data;
}

// ============================================================
// GET /tasks — Lấy toàn bộ danh sách công việc của user
// ============================================================
async function getTasks() {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/tasks`, {
        method: 'GET',
        headers: headers
    });
    return handleResponse(response);
}

// ============================================================
// POST /tasks — Tạo công việc mới
// ============================================================
async function createTask(taskData) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            title: taskData.title,
            description: taskData.description || '',
            priority: taskData.priority || 'medium',
            dueDate: taskData.dueDate || '',
            status: taskData.status || 'pending'
        })
    });
    return handleResponse(response);
}

// ============================================================
// PUT /tasks/:id — Cập nhật công việc theo ID
// ============================================================
async function updateTask(taskId, taskData) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(taskData)
    });
    return handleResponse(response);
}

// ============================================================
// DELETE /tasks/:id — Xóa công việc theo ID
// ============================================================
async function deleteTask(taskId) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: headers
    });
    return handleResponse(response);
}
