// ============================================================
// CONFIG.JS — Cấu hình ứng dụng Task Manager
// Cập nhật các giá trị này sau khi deploy AWS (Tuần 2)
// ============================================================

const CONFIG = {
    // API Gateway Invoke URL (thay sau khi deploy)
    API_URL: 'https://YOUR_API_ID.execute-api.ap-southeast-1.amazonaws.com/prod',

    // Amazon Cognito Configuration
    COGNITO: {
        REGION: 'ap-southeast-1',
        USER_POOL_ID: 'ap-southeast-1_XXXXXXXXX',   // Thay bằng User Pool ID thực
        APP_CLIENT_ID: 'xxxxxxxxxxxxxxxxxxxxxxxxxx'  // Thay bằng App Client ID thực
    }
};
