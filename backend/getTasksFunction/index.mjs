import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || "TasksTable";
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers":
    "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
};

export const handler = async (event) => {
  console.log("GetTasks invoked:", JSON.stringify(event));

  const runHandler = async () => {
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 200, headers: corsHeaders, body: "" };
    }

    try {
      const userId = event.requestContext?.authorizer?.claims?.sub;

      if (!userId) {
        console.warn("CẢNH BÁO: Request thiếu thông tin xác thực Cognito Claims");
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({
            message: "Không thể xác thực người dùng. Vui lòng đăng nhập lại.",
          }),
        };
      }

      console.log("Xác thực thành công. userId:", userId);

      const params = {
        TableName: TABLE_NAME,
        IndexName: "userId-index",
        KeyConditionExpression: "userId = :uid",
        ExpressionAttributeValues: {
          ":uid": userId,
        },
      };

      const result = await docClient.send(new QueryCommand(params));
      const items = result.Items ?? [];
      console.log(`Tìm thấy ${items.length} công việc cho user ${userId}`);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(items),
      };
    } catch (error) {
      console.error("LỖI HỆ THỐNG (GetTasks):", error);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          message: "Đã xảy ra lỗi hệ thống khi lấy danh sách công việc.",
          error: error.message,
        }),
      };
    }
  };

  const response = await runHandler();
  console.log(`Response StatusCode: ${response.statusCode}`);
  return response;
};
