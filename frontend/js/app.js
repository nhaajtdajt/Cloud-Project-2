// ============================================================
// APP.JS — Logic chính của ứng dụng Task Manager
// ============================================================

let allTasks = [];
let editingTaskId = null;

// ============================================================
// KHỞI TẠO TRANG
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    // Kiểm tra xác thực
    if (!requireAuth()) return;

    // Hiển thị thông tin user
    const user = getCurrentUser();
    document.getElementById('user-email').textContent = user.email;

    // Gắn event handlers
    setupEventHandlers();

    // Load tasks
    loadTasks();
});

// ============================================================
// GẮN EVENT HANDLERS
// ============================================================
function setupEventHandlers() {
    // Form tạo/sửa task
    document.getElementById('task-form').addEventListener('submit', handleFormSubmit);

    // Nút đăng xuất
    document.getElementById('btn-logout').addEventListener('click', (e) => {
        e.preventDefault();
        signOut();
    });

    // Nút hủy sửa
    document.getElementById('btn-cancel-edit').addEventListener('click', cancelEdit);

    // Bộ lọc
    document.getElementById('filter-priority').addEventListener('change', applyFilters);
    document.getElementById('filter-date-from').addEventListener('change', applyFilters);
    document.getElementById('filter-date-to').addEventListener('change', applyFilters);
    document.getElementById('btn-clear-filters').addEventListener('click', clearFilters);
}

// ============================================================
// LOAD DANH SÁCH TASKS
// ============================================================
async function loadTasks() {
    showLoading();
    try {
        allTasks = await getTasks();
        applyFilters();
        updateStats();
    } catch (error) {
        console.error('Lỗi tải tasks:', error);
        showToast('Không thể tải danh sách công việc: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// ============================================================
// RENDER DANH SÁCH TASKS
// ============================================================
function renderTasks(tasks) {
    const container = document.getElementById('tasks-list');

    if (tasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <h3>Chưa có công việc nào</h3>
                <p>Hãy tạo công việc đầu tiên bằng form bên trên!</p>
            </div>
        `;
        return;
    }

    // Sắp xếp: pending trước, rồi theo dueDate
    tasks.sort((a, b) => {
        if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
        if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
        return 0;
    });

    container.innerHTML = tasks.map(task => createTaskCard(task)).join('');

    // Gắn event cho các nút trong card
    container.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => startEdit(btn.dataset.id));
    });
    container.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => handleDelete(btn.dataset.id));
    });
    container.querySelectorAll('.btn-toggle-status').forEach(btn => {
        btn.addEventListener('click', () => toggleStatus(btn.dataset.id));
    });
}

// ============================================================
// TẠO TASK CARD HTML
// ============================================================
function createTaskCard(task) {
    const overdue = task.status === 'pending' && isOverdue(task.dueDate);
    const priorityColor = getPriorityColor(task.priority);

    return `
        <div class="task-card ${task.status === 'done' ? 'task-done' : ''} ${overdue ? 'task-overdue' : ''}"
             data-id="${task.taskId}">
            <div class="task-card-header">
                <div class="task-priority-badge" style="background-color: ${priorityColor}">
                    ${getPriorityLabel(task.priority)}
                </div>
                <div class="task-status-badge status-${task.status}">
                    ${task.status === 'done' ? '✅' : '⏳'} ${getStatusLabel(task.status)}
                </div>
            </div>

            <h3 class="task-title">${escapeHtml(task.title)}</h3>

            ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}

            <div class="task-meta">
                ${task.dueDate ? `
                    <span class="task-due ${overdue ? 'overdue' : ''}">
                        📅 ${formatDate(task.dueDate)}
                        ${overdue ? '<span class="overdue-badge">Quá hạn!</span>' : ''}
                    </span>
                ` : ''}
                <span class="task-created">🕐 ${formatDateTime(task.createdAt)}</span>
            </div>

            <div class="task-actions">
                <button class="btn btn-sm btn-toggle-status" data-id="${task.taskId}"
                        title="${task.status === 'pending' ? 'Đánh dấu hoàn thành' : 'Đánh dấu đang chờ'}">
                    ${task.status === 'pending' ? '✅ Hoàn thành' : '↩️ Mở lại'}
                </button>
                <button class="btn btn-sm btn-outline btn-edit" data-id="${task.taskId}">
                    ✏️ Sửa
                </button>
                <button class="btn btn-sm btn-danger-outline btn-delete" data-id="${task.taskId}">
                    🗑️ Xóa
                </button>
            </div>
        </div>
    `;
}

// ============================================================
// XỬ LÝ FORM SUBMIT (Tạo mới hoặc Cập nhật)
// ============================================================
async function handleFormSubmit(event) {
    event.preventDefault();

    const taskData = {
        title: document.getElementById('input-title').value.trim(),
        description: document.getElementById('input-description').value.trim(),
        priority: document.getElementById('input-priority').value,
        dueDate: document.getElementById('input-dueDate').value,
        status: document.getElementById('input-status').value
    };

    // Validation
    if (!taskData.title) {
        showToast('Vui lòng nhập tiêu đề công việc!', 'error');
        document.getElementById('input-title').focus();
        return;
    }

    showLoading();
    try {
        if (editingTaskId) {
            // CẬP NHẬT
            await updateTask(editingTaskId, taskData);
            showToast('Đã cập nhật công việc thành công!');
            cancelEdit();
        } else {
            // TẠO MỚI
            await createTask(taskData);
            showToast('Đã tạo công việc mới thành công!');
        }

        // Reset form và reload
        document.getElementById('task-form').reset();
        await loadTasks();
    } catch (error) {
        console.error('Lỗi:', error);
        showToast('Có lỗi xảy ra: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// ============================================================
// BẮT ĐẦU SỬA TASK
// ============================================================
function startEdit(taskId) {
    const task = allTasks.find(t => t.taskId === taskId);
    if (!task) return;

    editingTaskId = taskId;

    // Điền dữ liệu vào form
    document.getElementById('input-title').value = task.title;
    document.getElementById('input-description').value = task.description || '';
    document.getElementById('input-priority').value = task.priority;
    document.getElementById('input-dueDate').value = task.dueDate || '';
    document.getElementById('input-status').value = task.status;

    // Đổi giao diện form
    document.getElementById('form-title').textContent = '✏️ Sửa công việc';
    document.getElementById('btn-submit').textContent = '💾 Cập nhật';
    document.getElementById('btn-cancel-edit').classList.remove('hidden');

    // Scroll lên form
    document.getElementById('task-form').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('input-title').focus();
}

// ============================================================
// HỦY SỬA
// ============================================================
function cancelEdit() {
    editingTaskId = null;
    document.getElementById('task-form').reset();
    document.getElementById('form-title').textContent = '➕ Tạo công việc mới';
    document.getElementById('btn-submit').textContent = '➕ Tạo công việc';
    document.getElementById('btn-cancel-edit').classList.add('hidden');
}

// ============================================================
// XÓA TASK
// ============================================================
async function handleDelete(taskId) {
    const task = allTasks.find(t => t.taskId === taskId);
    if (!task) return;

    const confirmed = await confirmAction(`Bạn có chắc muốn xóa công việc "${escapeHtml(task.title)}"?`);
    if (!confirmed) return;

    showLoading();
    try {
        await deleteTask(taskId);
        showToast('Đã xóa công việc thành công!');
        await loadTasks();
    } catch (error) {
        console.error('Lỗi xóa:', error);
        showToast('Không thể xóa: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// ============================================================
// TOGGLE STATUS (pending ↔ done)
// ============================================================
async function toggleStatus(taskId) {
    const task = allTasks.find(t => t.taskId === taskId);
    if (!task) return;

    const newStatus = task.status === 'pending' ? 'done' : 'pending';

    showLoading();
    try {
        await updateTask(taskId, { status: newStatus });
        showToast(newStatus === 'done' ? '✅ Đã hoàn thành!' : '↩️ Đã mở lại công việc!');
        await loadTasks();
    } catch (error) {
        console.error('Lỗi cập nhật:', error);
        showToast('Không thể cập nhật: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// ============================================================
// BỘ LỌC
// ============================================================
function applyFilters() {
    let filtered = [...allTasks];

    // Lọc theo priority
    const priorityFilter = document.getElementById('filter-priority').value;
    if (priorityFilter) {
        filtered = filtered.filter(t => t.priority === priorityFilter);
    }

    // Lọc theo ngày hạn (từ)
    const dateFrom = document.getElementById('filter-date-from').value;
    if (dateFrom) {
        filtered = filtered.filter(t => t.dueDate && t.dueDate >= dateFrom);
    }

    // Lọc theo ngày hạn (đến)
    const dateTo = document.getElementById('filter-date-to').value;
    if (dateTo) {
        filtered = filtered.filter(t => t.dueDate && t.dueDate <= dateTo);
    }

    renderTasks(filtered);

    // Cập nhật số lượng hiển thị
    const countEl = document.getElementById('filter-count');
    if (countEl) {
        countEl.textContent = `Hiển thị ${filtered.length} / ${allTasks.length} công việc`;
    }
}

function clearFilters() {
    document.getElementById('filter-priority').value = '';
    document.getElementById('filter-date-from').value = '';
    document.getElementById('filter-date-to').value = '';
    applyFilters();
}

// ============================================================
// CẬP NHẬT THỐNG KÊ
// ============================================================
function updateStats() {
    const total = allTasks.length;
    const done = allTasks.filter(t => t.status === 'done').length;
    const pending = allTasks.filter(t => t.status === 'pending').length;
    const overdue = allTasks.filter(t => t.status === 'pending' && isOverdue(t.dueDate)).length;

    const statsEl = document.getElementById('stats');
    if (statsEl) {
        statsEl.innerHTML = `
            <div class="stat-item">
                <span class="stat-number">${total}</span>
                <span class="stat-label">Tổng</span>
            </div>
            <div class="stat-item stat-pending">
                <span class="stat-number">${pending}</span>
                <span class="stat-label">Đang chờ</span>
            </div>
            <div class="stat-item stat-done">
                <span class="stat-number">${done}</span>
                <span class="stat-label">Hoàn thành</span>
            </div>
            ${overdue > 0 ? `
                <div class="stat-item stat-overdue">
                    <span class="stat-number">${overdue}</span>
                    <span class="stat-label">Quá hạn</span>
                </div>
            ` : ''}
        `;
    }
}
