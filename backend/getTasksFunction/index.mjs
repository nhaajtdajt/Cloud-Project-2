import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

// Khởi tạo client bên ngoài handler để tái sử dụng giữa các lần lambda invoke (tăng hiệu năng)
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || "TasksTable";
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

// CORS headers — dùng chung cho mọi response
const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers":
    "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
};

export const handler = async (event) => {
  console.log("GetTasks invoked:", JSON.stringify(event));

  // 1. Xử lý OPTIONS preflight cho CORS (Trình duyệt gửi trước khi gọi API thật)
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" };
  }

  try {
    // 2. Bảo mật: Kiểm tra an toàn sự tồn tại của Cognito Authorizer
    const userId = event.requestContext?.authorizer?.claims?.sub;

    if (!userId) {
      console.warn("CẢNH BÁO: Request thiếu thông tin xác thực Cognito Claims");
      return {
        statusCode: 401, // Unauthorized
        headers: corsHeaders,
        body: JSON.stringify({
          message: "Không thể xác thực người dùng. Vui lòng đăng nhập lại.",
        }),
      };
    }

    console.log("Xác thực thành công. userId:", userId);

    // 3. Query DynamoDB qua GSI userId-index
    const params = {
      TableName: TABLE_NAME,
      IndexName: "userId-index",
      KeyConditionExpression: "userId = :uid",
      ExpressionAttributeValues: {
        ":uid": userId,
      },
    };

    const result = await docClient.send(new QueryCommand(params));

    // Đoạn này dùng `result.Items ?? []` đề phòng trường hợp result.Items bị undefined
    const items = result.Items ?? [];
    console.log(`Tìm thấy ${items.length} công việc cho user ${userId}`);

    // 4. Trả kết quả về cho Client
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(items),
    };
  } catch (error) {
    // Log chi tiết lỗi lên AWS CloudWatch để DEV tiện theo dõi
    console.error("LỖI HỆ THỐNG (GetTasks):", error);

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        message: "Đã xảy ra lỗi hệ thống khi lấy danh sách công việc.",
        error: error.message, // Trả về câu thông báo lỗi kỹ thuật (optional, có thể ẩn đi ở production nếu cần bảo mật sâu)
      }),
    };
  }
};
