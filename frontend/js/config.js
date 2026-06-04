// ============================================================
// CONFIG.JS — Cấu hình ứng dụng Task Manager
// Cập nhật các giá trị này sau khi deploy AWS (Tuần 2)
// ============================================================

const CONFIG = {
  // API Gateway Invoke URL (thay sau khi deploy)
  API_URL: "https://owuatkgwh3.execute-api.ap-southeast-1.amazonaws.com/prod",

  // Amazon Cognito Configuration
  COGNITO: {
    REGION: "ap-southeast-1",
    USER_POOL_ID: "ap-southeast-1_XPD5UXGns", // Cập nhật User Pool ID thực của bạn
    APP_CLIENT_ID: "29l4fmgm3t8paq1mat3l3tsvoj", // Cập nhật App Client ID thực của bạn
  },
};
