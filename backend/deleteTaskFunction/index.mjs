// ============================================================
// DeleteTaskFunction — DELETE /tasks/:id
// Xóa công việc của user đang đăng nhập
// Đảm bảo user chỉ có thể xóa công việc của mình
// ============================================================

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand } from '@aws-sdk/lib-dynamodb';

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

export const handler = async (event) => {
    console.log('DeleteTask invoked:', JSON.stringify(event));

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

        const params = {
            TableName: TABLE_NAME,
            Key: {
                taskId: taskId
            },
            // ConditionExpression đảm bảo user chỉ có thể xóa task của CHÍNH MÌNH
            ConditionExpression: 'userId = :uid',
            ExpressionAttributeValues: {
                ':uid': userId
            }
        };

        await docClient.send(new DeleteCommand(params));
        
        console.log('Task deleted:', taskId);

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'Đã xóa công việc thành công' })
        };

    } catch (error) {
        console.error('ERROR DeleteTask:', error);

        // Bắt lỗi ConditionCheckFailed: task không tồn tại hoặc của người khác
        if (error.name === 'ConditionalCheckFailedException') {
            return {
                statusCode: 403,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'Không tìm thấy công việc, hoặc bạn không có quyền xóa công việc này' })
            };
        }

        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                message: 'Lỗi server khi xóa công việc',
                error: error.message
            })
        };
    }
};
