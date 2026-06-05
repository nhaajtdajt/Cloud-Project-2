import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";

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
  console.log("DeleteTask invoked:", JSON.stringify(event));

  const runHandler = async () => {
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 200, headers: corsHeaders, body: "" };
    }

    try {
      const userId = event.requestContext?.authorizer?.claims?.sub;
      const taskId = event.pathParameters?.id;

      if (!userId) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({
            message: "Không thể xác thực người dùng. Vui lòng đăng nhập lại.",
          }),
        };
      }

      if (!taskId) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ message: "Thiếu taskId trên đường dẫn URL" }),
        };
      }

      const params = {
        TableName: TABLE_NAME,
        Key: {
          taskId: taskId,
        },
        ConditionExpression: "attribute_exists(taskId) AND userId = :uid",
        ExpressionAttributeValues: {
          ":uid": userId,
        },
      };

      await docClient.send(new DeleteCommand(params));
      console.log(`Xóa thành công công việc: ${taskId} của user: ${userId}`);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Đã xóa công việc thành công." }),
      };
    } catch (error) {
      console.error("LỖI HỆ THỐNG (DeleteTask):", error);

      if (error.name === "ConditionalCheckFailedException") {
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({
            message:
              "Công việc không tồn tại, hoặc bạn không có quyền xóa công việc này.",
          }),
        };
      }

      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          message: "Lỗi server khi xóa công việc.",
          error: error.message,
        }),
      };
    }
  };

  const response = await runHandler();
  console.log(`Response StatusCode: ${response.statusCode}`);
  return response;
};
