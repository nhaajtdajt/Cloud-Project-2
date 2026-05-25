# Task Manager Serverless trên AWS

Đây là mã nguồn cho Đồ án 2 môn Điện toán đám mây: Xây dựng ứng dụng Web Serverless với Kiến trúc bảo mật & Tối ưu chi phí.

## Cấu trúc thư mục

```
/
├── frontend/             # Frontend HTML/CSS/JS
│   ├── index.html        # Trang chính
│   ├── login.html        # Đăng nhập
│   ├── signup.html       # Đăng ký
│   ├── css/style.css     # CSS
│   └── js/               # Logic
│       ├── config.js     # Chứa API URL và Cognito config
│       ├── auth.js       # Xác thực
│       ├── api.js        # Giao tiếp API
│       ├── utils.js      # Tiện ích
│       └── app.js        # Logic chính UI
│
└── backend/              # Mã nguồn các Lambda functions
    ├── getTasksFunction/
    ├── createTaskFunction/
    ├── updateTaskFunction/
    ├── deleteTaskFunction/
    └── seed.mjs          # Script tạo dữ liệu mẫu
```

## Cách chạy cục bộ (Local Development)

### Frontend
1. Cài đặt tiện ích **Live Server** trên VS Code.
2. Mở thư mục `frontend` và chạy `index.html` với Live Server.
3. *Lưu ý:* Khi chạy cục bộ chưa kết nối AWS, bạn cần mock dữ liệu trong file `api.js` hoặc dùng các thư viện AWS SDK local.

### Backend
Mỗi thư mục trong `backend` chứa mã nguồn cho một Lambda function độc lập. Để test local, bạn cần tạo môi trường Node.js.

```bash
cd backend/getTasksFunction
npm init -y
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
```

## Các bước triển khai lên AWS (Tóm tắt)

1. **VPC:** Tạo VPC `10.0.0.0/16`, 2 Private Subnets, 1 VPC Gateway Endpoint cho DynamoDB.
2. **DynamoDB:** Tạo bảng `TasksTable` với Partition key `taskId`. Tạo GSI `userId-index` với Partition key `userId`.
3. **IAM:** Tạo role cho Lambda với policy cho phép gọi bảng `TasksTable` và log.
4. **Cognito:** Tạo User Pool và App Client.
5. **Lambda:** Zip từng thư mục trong `backend` và upload tạo thành 4 hàm Lambda. Cấu hình VpcConfig trỏ vào 2 Private Subnets.
6. **API Gateway:** Tạo REST API, cấu hình Cognito Authorizer, kết nối với 4 Lambda. Bật CORS và Throttling.
7. **Frontend Config:** Lấy Cognito ID và API URL gắn vào `frontend/js/config.js`. Cập nhật biến môi trường `ALLOWED_ORIGIN` trong Lambda.
8. **S3 & CloudFront:** Tạo S3 bucket (Block All Public Access), cấu hình CloudFront với OAC, cập nhật Bucket Policy. Upload thư mục `frontend` lên S3.

> **Lưu ý:** Vui lòng xem tài liệu `implementation_plan.md` để có hướng dẫn chi tiết từng bước.
