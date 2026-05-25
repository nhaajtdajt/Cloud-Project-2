// ============================================================
// SEED SCRIPT — Tạo dữ liệu mẫu cho DynamoDB
// Yêu cầu: Database phải có ít nhất 2 users khởi tạo sẵn
// Cách chạy: node seed.mjs (yêu cầu cấu hình aws credentials)
// ============================================================

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import crypto from 'crypto';

// Đảm bảo bạn đã cấu hình region ap-southeast-1
const client = new DynamoDBClient({ region: 'ap-southeast-1' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'TasksTable';

// Hardcode 2 userId (Nên lấy từ Cognito User Pool sau khi tạo user)
// Vui lòng sửa lại userId tương ứng với sub của user trong Cognito!
const USER_1 = 'user-id-001'; 
const USER_2 = 'user-id-002';

const seedData = [
    // User 1
    {
        taskId: crypto.randomUUID(),
        userId: USER_1,
        title: 'Hoàn thành báo cáo môn Cloud',
        description: 'Báo cáo phải đủ 4 khái niệm và 16 bằng chứng',
        priority: 'high',
        dueDate: '2026-06-15',
        status: 'pending',
        createdAt: new Date().toISOString()
    },
    {
        taskId: crypto.randomUUID(),
        userId: USER_1,
        title: 'Họp nhóm đồ án',
        description: 'Thảo luận phân công công việc',
        priority: 'medium',
        dueDate: '2026-05-30',
        status: 'done',
        createdAt: new Date(Date.now() - 86400000).toISOString() // Hôm qua
    },
    // User 2
    {
        taskId: crypto.randomUUID(),
        userId: USER_2,
        title: 'Cài đặt AWS CLI',
        description: 'Cài đặt và cấu hình credentials',
        priority: 'high',
        dueDate: '2026-05-26',
        status: 'pending',
        createdAt: new Date().toISOString()
    },
    {
        taskId: crypto.randomUUID(),
        userId: USER_2,
        title: 'Tìm hiểu về Cognito',
        description: 'Đọc tài liệu về User Pool và App Client',
        priority: 'low',
        dueDate: '2026-06-01',
        status: 'pending',
        createdAt: new Date().toISOString()
    }
];

async function seed() {
    console.log(`Bắt đầu seed data vào bảng ${TABLE_NAME}...`);
    
    for (const item of seedData) {
        try {
            await docClient.send(new PutCommand({
                TableName: TABLE_NAME,
                Item: item
            }));
            console.log(`✅ Đã tạo task: ${item.title} cho user: ${item.userId}`);
        } catch (error) {
            console.error(`❌ Lỗi tạo task: ${item.title}`, error);
        }
    }
    
    console.log('Seed data hoàn tất!');
    console.log('Lưu ý: Bạn cần tạo 2 user trong Cognito và cập nhật userId trong script này để map đúng.');
}

seed();
