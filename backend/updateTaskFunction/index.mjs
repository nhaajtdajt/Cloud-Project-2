// ============================================================
// UpdateTaskFunction — PUT /tasks/:id
// Cập nhật công việc của user đang đăng nhập
// Đảm bảo user chỉ có thể sửa công việc của mình
// ============================================================

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || 'TasksTable';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
};

const VALID_PRIORITIES = ['low', 'medium', 'high'];
const VALID_STATUSES = ['pending', 'done'];

export const handler = async (event) => {
    console.log('UpdateTask invoked:', JSON.stringify(event));

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: corsHeaders, body: '' };
    }

    try {
        const userId = event.requestContext.authorizer.claims.sub;
        const taskId = event.pathParameters.id;
        
        if (!taskId) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'Thiếu taskId trong URL' })
            };
        }

        const body = JSON.parse(event.body || '{}');

        // Khởi tạo biểu thức update
        let updateExpression = 'SET';
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};
        let hasUpdates = false;

        // Xây dựng câu query update động tùy theo trường gửi lên
        if (body.title !== undefined) {
            if (body.title.trim() === '') {
                return {
                    statusCode: 400,
                    headers: corsHeaders,
                    body: JSON.stringify({ message: 'Trường "title" không được rỗng' })
                };
            }
            updateExpression += ' #title = :title,';
            expressionAttributeNames['#title'] = 'title';
            expressionAttributeValues[':title'] = body.title.trim();
            hasUpdates = true;
        }

        if (body.description !== undefined) {
            updateExpression += ' #desc = :desc,';
            expressionAttributeNames['#desc'] = 'description';
            expressionAttributeValues[':desc'] = body.description.trim();
            hasUpdates = true;
        }

        if (body.priority !== undefined) {
            if (!VALID_PRIORITIES.includes(body.priority)) {
                return {
                    statusCode: 400,
                    headers: corsHeaders,
                    body: JSON.stringify({ message: 'Priority phải là: low, medium, hoặc high' })
                };
            }
            updateExpression += ' #pri = :pri,';
            expressionAttributeNames['#pri'] = 'priority';
            expressionAttributeValues[':pri'] = body.priority;
            hasUpdates = true;
        }

        if (body.dueDate !== undefined) {
            updateExpression += ' #due = :due,';
            expressionAttributeNames['#due'] = 'dueDate';
            expressionAttributeValues[':due'] = body.dueDate;
            hasUpdates = true;
        }

        if (body.status !== undefined) {
            if (!VALID_STATUSES.includes(body.status)) {
                return {
                    statusCode: 400,
                    headers: corsHeaders,
                    body: JSON.stringify({ message: 'Status phải là: pending hoặc done' })
                };
            }
            updateExpression += ' #st = :st,';
            expressionAttributeNames['#st'] = 'status';
            expressionAttributeValues[':st'] = body.status;
            hasUpdates = true;
        }

        if (!hasUpdates) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'Không có thông tin nào để cập nhật' })
            };
        }

        // Bỏ dấu phẩy thừa ở cuối
        updateExpression = updateExpression.slice(0, -1);

        const params = {
            TableName: TABLE_NAME,
            Key: {
                taskId: taskId
            },
            UpdateExpression: updateExpression,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            // ConditionExpression đảm bảo user chỉ có thể cập nhật task của CHÍNH MÌNH
            ConditionExpression: 'userId = :uid',
            ReturnValues: 'ALL_NEW'
        };

        // Thêm :uid vào Value map vì nó dùng trong ConditionExpression
        params.ExpressionAttributeValues[':uid'] = userId;

        const result = await docClient.send(new UpdateCommand(params));
        
        console.log('Task updated:', taskId);

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify(result.Attributes)
        };

    } catch (error) {
        console.error('ERROR UpdateTask:', error);

        // Lỗi parse JSON
        if (error instanceof SyntaxError) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'Body không phải JSON hợp lệ' })
            };
        }

        // Bắt lỗi ConditionCheckFailed: task không tồn tại hoặc của người khác
        if (error.name === 'ConditionalCheckFailedException') {
            return {
                statusCode: 403,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'Không tìm thấy công việc, hoặc bạn không có quyền sửa công việc này' })
            };
        }

        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                message: 'Lỗi server khi cập nhật công việc',
                error: error.message
            })
        };
    }
};
