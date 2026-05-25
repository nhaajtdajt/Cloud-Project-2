// ============================================================
// CreateTaskFunction — POST /tasks
// Tạo công việc mới cho user đang đăng nhập
// Tự sinh taskId (UUID) và createdAt (ISO timestamp)
// ============================================================

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import crypto from 'crypto';

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

// Các giá trị hợp lệ
const VALID_PRIORITIES = ['low', 'medium', 'high'];
const VALID_STATUSES = ['pending', 'done'];

export const handler = async (event) => {
    console.log('CreateTask invoked:', JSON.stringify(event));

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: corsHeaders, body: '' };
    }

    try {
        // Lấy userId từ Cognito
        const userId = event.requestContext.authorizer.claims.sub;

        // Parse body
        const body = JSON.parse(event.body || '{}');

        // ========== VALIDATION ==========
        if (!body.title || body.title.trim() === '') {
            console.error('Validation error: title is required');
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'Trường "title" là bắt buộc' })
            };
        }

        if (body.priority && !VALID_PRIORITIES.includes(body.priority)) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'Priority phải là: low, medium, hoặc high' })
            };
        }

        if (body.status && !VALID_STATUSES.includes(body.status)) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'Status phải là: pending hoặc done' })
            };
        }

        // ========== TẠO TASK ==========
        const task = {
            taskId: crypto.randomUUID(),
            userId: userId,
            title: body.title.trim(),
            description: (body.description || '').trim(),
            priority: body.priority || 'medium',
            dueDate: body.dueDate || '',
            status: body.status || 'pending',
            createdAt: new Date().toISOString()
        };

        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: task
        }));

        console.log('Task created:', task.taskId);

        return {
            statusCode: 201,
            headers: corsHeaders,
            body: JSON.stringify(task)
        };

    } catch (error) {
        console.error('ERROR CreateTask:', error);

        // Lỗi parse JSON
        if (error instanceof SyntaxError) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'Body không phải JSON hợp lệ' })
            };
        }

        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                message: 'Lỗi server khi tạo công việc',
                error: error.message
            })
        };
    }
};
