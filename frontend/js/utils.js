// ============================================================
// UTILS.JS — Các hàm tiện ích
// ============================================================

// ============================================================
// FORMAT NGÀY
// ============================================================
function formatDate(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

function formatDateTime(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ============================================================
// KIỂM TRA TASK ĐÃ QUÁ HẠN
// ============================================================
function isOverdue(dueDate) {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dueDate) < today;
}

// ============================================================
// LẤY MÀU THEO PRIORITY
// ============================================================
function getPriorityColor(priority) {
    switch (priority) {
        case 'high': return '#ef4444';
        case 'medium': return '#f59e0b';
        case 'low': return '#22c55e';
        default: return '#6b7280';
    }
}

function getPriorityLabel(priority) {
    switch (priority) {
        case 'high': return 'Cao';
        case 'medium': return 'Trung bình';
        case 'low': return 'Thấp';
        default: return priority;
    }
}

function getStatusLabel(status) {
    switch (status) {
        case 'pending': return 'Đang chờ';
        case 'done': return 'Hoàn thành';
        default: return status;
    }
}

// ============================================================
// HIỂN THỊ TOAST NOTIFICATION
// ============================================================
function showToast(message, type = 'success') {
    // Xóa toast cũ nếu có
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();

    let iconSVG = '';
    if (type === 'success') {
        iconSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'error') {
        iconSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    } else {
        iconSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon" style="display: inline-flex; align-items: center;">${iconSVG}</span>
            <span class="toast-message">${message}</span>
        </div>
    `;
    document.body.appendChild(toast);

    // Animation hiện lên
    requestAnimationFrame(() => {
        toast.classList.add('toast-show');
    });

    // Tự ẩn sau 3 giây
    setTimeout(() => {
        toast.classList.remove('toast-show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================================
// HIỂN THỊ / ẨN LOADING
// ============================================================
function showLoading() {
    document.getElementById('loading-overlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.remove('active');
}

// ============================================================
// CONFIRM DIALOG
// ============================================================
function confirmAction(message) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';
        overlay.innerHTML = `
            <div class="confirm-dialog">
                <div class="confirm-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 32px; height: 32px; color: var(--color-warning); margin: 0 auto 12px;">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                </div>
                <p class="confirm-message">${message}</p>
                <div class="confirm-actions">
                    <button class="btn btn-secondary" id="confirm-cancel">Hủy</button>
                    <button class="btn btn-danger" id="confirm-ok">Xác nhận</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('active'));

        document.getElementById('confirm-ok').onclick = () => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
            resolve(true);
        };
        document.getElementById('confirm-cancel').onclick = () => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
            resolve(false);
        };
    });
}

// ============================================================
// ESCAPE HTML (Chống XSS)
// ============================================================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================
// DEBOUNCE
// ============================================================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
