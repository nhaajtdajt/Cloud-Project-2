import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import crypto from "crypto";

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

const VALID_PRIORITIES = ["low", "medium", "high"];
const VALID_STATUSES = ["pending", "done"];

export const handler = async (event) => {
  console.log("CreateTask invoked:", JSON.stringify(event));

  const runHandler = async () => {
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 200, headers: corsHeaders, body: "" };
    }

    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          message: "Định dạng dữ liệu (Body) không phải JSON hợp lệ.",
        }),
      };
    }

    try {
      const userId = event.requestContext?.authorizer?.claims?.sub;
      if (!userId) {
        console.warn("CẢNH BÁO: Request thiếu thông tin xác thực Cognito");
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({
            message: "Không thể xác thực người dùng. Vui lòng đăng nhập lại.",
          }),
        };
      }

      if (
        !body.title ||
        typeof body.title !== "string" ||
        body.title.trim() === ""
      ) {
        console.log("Validation error: title is required");
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            message: 'Trường "title" là bắt buộc và không được để trống',
          }),
        };
      }

      if (body.priority && !VALID_PRIORITIES.includes(body.priority)) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            message: `Priority phải là một trong các giá trị: ${VALID_PRIORITIES.join(", ")}`,
          }),
        };
      }

      if (body.status && !VALID_STATUSES.includes(body.status)) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            message: `Status phải là một trong các giá trị: ${VALID_STATUSES.join(", ")}`,
          }),
        };
      }

      const task = {
        taskId: crypto.randomUUID(),
        userId: userId,
        title: body.title.trim(),
        description:
          typeof body.description === "string" ? body.description.trim() : "",
        priority: body.priority || "medium",
        dueDate: body.dueDate || "",
        status: body.status || "pending",
        createdAt: new Date().toISOString(),
      };

      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: task,
        }),
      );

      console.log("Task created successfully:", task.taskId);

      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify(task),
      };
    } catch (error) {
      console.error("LỖI HỆ THỐNG (CreateTask):", error);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          message: "Lỗi server khi tạo công việc.",
          error: error.message,
        }),
      };
    }
  };

  const response = await runHandler();
  console.log(`Response StatusCode: ${response.statusCode}`);
  return response;
};
