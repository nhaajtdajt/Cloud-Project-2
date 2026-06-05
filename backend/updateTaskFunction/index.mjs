import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

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
  console.log("UpdateTask invoked:", JSON.stringify(event));

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

      let updateExpression = "SET";
      const expressionAttributeNames = {};
      const expressionAttributeValues = {};
      let hasUpdates = false;

      if (body.title !== undefined) {
        if (typeof body.title !== "string" || body.title.trim() === "") {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({
              message: 'Trường "title" không được để trống.',
            }),
          };
        }
        updateExpression += " #title = :title,";
        expressionAttributeNames["#title"] = "title";
        expressionAttributeValues[":title"] = body.title.trim();
        hasUpdates = true;
      }

      if (body.description !== undefined) {
        updateExpression += " #desc = :desc,";
        expressionAttributeNames["#desc"] = "description";
        expressionAttributeValues[":desc"] =
          typeof body.description === "string" ? body.description.trim() : "";
        hasUpdates = true;
      }

      if (body.priority !== undefined) {
        if (!VALID_PRIORITIES.includes(body.priority)) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({
              message: `Priority phải là một trong: ${VALID_PRIORITIES.join(", ")}`,
            }),
          };
        }
        updateExpression += " #pri = :pri,";
        expressionAttributeNames["#pri"] = "priority";
        expressionAttributeValues[":pri"] = body.priority;
        hasUpdates = true;
      }

      if (body.dueDate !== undefined) {
        updateExpression += " #due = :due,";
        expressionAttributeNames["#due"] = "dueDate";
        expressionAttributeValues[":due"] = body.dueDate;
        hasUpdates = true;
      }

      if (body.status !== undefined) {
        if (!VALID_STATUSES.includes(body.status)) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({
              message: `Status phải là một trong: ${VALID_STATUSES.join(", ")}`,
            }),
          };
        }
        updateExpression += " #st = :st,";
        expressionAttributeNames["#st"] = "status";
        expressionAttributeValues[":st"] = body.status;
        hasUpdates = true;
      }

      if (!hasUpdates) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            message: "Không có thông tin hợp lệ nào để cập nhật.",
          }),
        };
      }

      updateExpression = updateExpression.slice(0, -1);

      const params = {
        TableName: TABLE_NAME,
        Key: {
          taskId: taskId,
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ConditionExpression: "attribute_exists(taskId) AND userId = :uid",
        ReturnValues: "ALL_NEW",
      };

      params.ExpressionAttributeValues[":uid"] = userId;

      const result = await docClient.send(new UpdateCommand(params));
      console.log(`Cập nhật thành công task: ${taskId} cho user: ${userId}`);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(result.Attributes),
      };
    } catch (error) {
      console.error("LỖI HỆ THỐNG (UpdateTask):", error);

      if (error.name === "ConditionalCheckFailedException") {
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({
            message:
              "Công việc không tồn tại, hoặc bạn không có quyền chỉnh sửa công việc này.",
          }),
        };
      }

      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          message: "Lỗi server khi cập nhật công việc.",
          error: error.message,
        }),
      };
    }
  };

  const response = await runHandler();
  console.log(`Response StatusCode: ${response.statusCode}`);
  return response;
};
