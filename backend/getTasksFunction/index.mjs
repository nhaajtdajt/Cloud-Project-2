// ============================================================
// GetTasksFunction — GET /tasks
// Lấy toàn bộ công việc của user đang đăng nhập
// Dùng GSI userId-index để query hiệu quả
// ============================================================

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || 'TasksTable';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

// CORS headers — dùng chung cho mọi response
const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
};

export const handler = async (event) => {
    console.log('GetTasks invoked:', JSON.stringify(event));

    // Xử lý OPTIONS preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: corsHeaders, body: '' };
    }

    try {
        // Lấy userId từ Cognito Authorizer
        const userId = event.requestContext.authorizer.claims.sub;
        console.log('userId:', userId);

        // Query DynamoDB qua GSI userId-index
        const params = {
            TableName: TABLE_NAME,
            IndexName: 'userId-index',
            KeyConditionExpression: 'userId = :uid',
            ExpressionAttributeValues: {
                ':uid': userId
            }
        };

        const result = await docClient.send(new QueryCommand(params));
        console.log('Query result count:', result.Items.length);

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify(result.Items || [])
        };

    } catch (error) {
        console.error('ERROR GetTasks:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                message: 'Lỗi server khi lấy danh sách công việc',
                error: error.message
            })
        };
    }
};
