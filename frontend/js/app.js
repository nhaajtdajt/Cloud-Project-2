// ============================================================
// APP.JS — Logic chính của ứng dụng Task Manager
// ============================================================

let allTasks = [];
let editingTaskId = null;

// ============================================================
// KHỞI TẠO TRANG
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    // Khởi tạo theme
    initTheme();

    // Kiểm tra xác thực và tự động làm mới session nếu cần
    const authenticated = await checkAuthAndRefresh();
    if (!authenticated) {
        signOut();
        return;
    }

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
    document.getElementById('filter-date').addEventListener('change', applyFilters);
    document.getElementById('btn-clear-filters').addEventListener('click', clearFilters);

    // Nút đổi theme
    const themeBtn = document.getElementById('btn-theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', toggleTheme);
    }
}

// ============================================================
// ĐỔI THEME (LIGHT / DARK)
// ============================================================
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const body = document.body;
    const themeText = document.getElementById('theme-text');
    const sunIcon = document.querySelector('.theme-sun-icon');
    const moonIcon = document.querySelector('.theme-moon-icon');

    if (savedTheme === 'light') {
        body.classList.add('light-theme');
        if (themeText) themeText.textContent = 'Chế độ tối';
        if (sunIcon) sunIcon.classList.remove('hidden');
        if (moonIcon) moonIcon.classList.add('hidden');
    } else {
        body.classList.remove('light-theme');
        if (themeText) themeText.textContent = 'Chế độ sáng';
        if (sunIcon) sunIcon.classList.add('hidden');
        if (moonIcon) moonIcon.classList.remove('hidden');
    }
}

function toggleTheme() {
    const body = document.body;
    const isLight = body.classList.toggle('light-theme');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    initTheme();
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
                <div class="empty-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width: 48px; height: 48px; color: var(--text-muted);">
                        <path d="M9 11l3 3L22 4"></path>
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                    </svg>
                </div>
                <h3>Chưa có công việc nào</h3>
                <p>Hãy tạo công việc đầu tiên bằng form bên cạnh!</p>
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

    // SVG Icons definition
    const calendarIcon = `<svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;
    const clockIcon = `<svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
    const editIcon = `<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path></svg>`;
    const trashIcon = `<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;
    const checkIcon = `<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    const reopenIcon = `<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>`;

    return `
        <div class="task-card ${task.status === 'done' ? 'task-done' : ''} ${overdue ? 'task-overdue' : ''}"
             data-id="${task.taskId}">
            <div class="task-card-header">
                <span class="task-priority-badge" style="background-color: ${priorityColor}; color: ${task.priority === 'low' ? '#065f46' : (task.priority === 'high' ? '#7f1d1d' : '#92400e')}; background: ${task.priority === 'low' ? 'rgba(16, 185, 129, 0.15)' : (task.priority === 'high' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)')};">
                    ${getPriorityLabel(task.priority)}
                </span>
                <span class="task-status-badge status-${task.status}">
                    ${getStatusLabel(task.status)}
                </span>
            </div>

            <h3 class="task-title">${escapeHtml(task.title)}</h3>

            ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}

            <div class="task-meta">
                ${task.dueDate ? `
                    <span class="task-due ${overdue ? 'overdue' : ''}">
                        ${calendarIcon}
                        <span>${formatDate(task.dueDate)}</span>
                        ${overdue ? '<span class="overdue-badge">Quá hạn</span>' : ''}
                    </span>
                ` : ''}
                <span class="task-created">
                    ${clockIcon}
                    <span>Tạo lúc: ${formatDateTime(task.createdAt)}</span>
                </span>
            </div>

            <div class="task-actions">
                <button class="btn btn-sm ${task.status === 'pending' ? 'btn-success-light' : 'btn-outline'} btn-toggle-status" data-id="${task.taskId}"
                        title="${task.status === 'pending' ? 'Đánh dấu hoàn thành' : 'Đánh dấu đang chờ'}">
                    ${task.status === 'pending' ? `${checkIcon}<span>Hoàn thành</span>` : `${reopenIcon}<span>Mở lại</span>`}
                </button>
                <button class="btn btn-sm btn-outline btn-edit" data-id="${task.taskId}">
                    ${editIcon}<span>Sửa</span>
                </button>
                <button class="btn btn-sm btn-danger-outline btn-delete" data-id="${task.taskId}">
                    ${trashIcon}<span>Xóa</span>
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
    document.getElementById('form-title').textContent = 'Sửa công việc';
    document.getElementById('btn-submit').textContent = 'Cập nhật';
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
    document.getElementById('form-title').textContent = 'Tạo công việc mới';
    document.getElementById('btn-submit').textContent = 'Tạo công việc';
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
        showToast(newStatus === 'done' ? 'Đã hoàn thành công việc!' : 'Đã mở lại công việc!');
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

    // Lọc theo ngày hạn
    const filterDate = document.getElementById('filter-date').value;
    if (filterDate) {
        filtered = filtered.filter(t => t.dueDate === filterDate);
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
    document.getElementById('filter-date').value = '';
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
