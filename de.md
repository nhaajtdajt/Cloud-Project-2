Tài liệu này tổng hợp và cấu trúc lại toàn bộ nội dung yêu cầu của **Đồ án 2 (PROJECT2)** từ tài liệu `PROJECT2_VI.pdf` một cách chi tiết, trực quan và hệ thống nhất nhằm mục đích hỗ trợ quá trình theo dõi và triển khai dự án.

---

CSC11006 - Nhập môn Điện toán đám mây 

ĐỒ ÁN 2: Xây dựng Ứng dụng Web Serverless với Kiến trúc bảo mật & Tối ưu chi phí 

---

I. Thông tin chung 

| Trường | Chi tiết |
| --- | --- |
| **Mã đồ án** | PROJECT2 |
| **Thời gian** | Dự kiến 3 tuần |
| **Nhóm** | Nhóm 3 sinh viên |
| **Hạn nộp** | Xem lịch trên Moodle |

---

## II. Mục tiêu đồ án 

Đồ án này hướng đến các kết quả học tập sau của môn học: G2.1, G2.2, G2.3, G2.4, G3.1, G5.2, G5.3. Sinh viên cần đạt được các khả năng:

* Thiết kế hệ thống điện toán đám mây sử dụng các dịch vụ serverless có quản lý.

* Triển khai bảo mật theo nguyên tắc Đặc quyền tối thiểu (Least Privilege) và cô lập mạng.

* Cấu hình giám sát, cảnh báo và quản lý chi phí tối ưu.

* Xây dựng và triển khai một ứng dụng web hoàn chỉnh trên nền tảng đám mây.

* Giải thích rõ ràng kiến trúc hệ thống, luồng yêu cầu và cơ chế tự động mở rộng.

---

## III. Mô tả đồ án 

Sinh viên sẽ thiết kế và triển khai ứng dụng web **Quản lý Công việc (Task Management)** sử dụng kiến trúc serverless hiện đại trên AWS. Hệ thống phải thể hiện khả năng tự mở rộng, bảo mật nhiều lớp và kết nối cơ sở dữ liệu hoàn toàn qua mạng riêng của AWS – tuyệt đối không đi qua internet công cộng.

Các mục tiêu cốt lõi cần đạt:

* **100% kiến trúc Serverless:** Không được phép sử dụng máy ảo (Amazon EC2).

* **Tự động mở rộng:** Hệ thống tự co giãn linh hoạt dựa trên lưu lượng thực tế.

* **High Availability (HA):** Sẵn sàng cao ngay từ thiết kế – không cần cấu hình failover thủ công.

* **Cô lập mạng:** AWS Lambda phải kết nối với Amazon DynamoDB qua VPC Endpoint, hoàn toàn không qua internet.

* **Bảo mật Frontend:** Amazon S3 bucket phải cấu hình riêng tư (Private), chỉ cho phép truy cập qua CloudFront kết hợp Origin Access Control (OAC).

* **Tối ưu chi phí:** Tuân thủ chặt chẽ giới hạn Free Tier và không để phát sinh chi phí ngoài ý muốn.

* **Khả năng quan sát:** Đảm bảo đầy đủ giám sát (Observability) và kiểm soát chi phí chặt chẽ.

---

## IV. Yêu cầu kỹ thuật 

### 1. Thiết kế ứng dụng 

1.1 Công nghệ và tính năng 

* **Frontend:** Sử dụng HTML, CSS, JavaScript (không bắt buộc dùng framework frontend như React/Angular).

* **Các tính năng yêu cầu:** 
    * Thực hiện đầy đủ các thao tác CRUD: tạo, xem, cập nhật, xóa công việc.

    * Giao diện danh sách công việc có tính responsive (tương thích đa thiết bị).

    * Hỗ trợ bộ lọc công việc theo ngày hết hạn và mức độ ưu tiên.

1.2 Lưu trữ Frontend & Yêu cầu bảo mật 

> ⚠️ **CÁC ĐIỀU NGHIÊM CẤM (VI PHẠM SẼ BỊ TRỪ NẶNG ĐIỂM):**
> * **KHÔNG ĐƯỢC** cấu hình S3 bucket ở chế độ công khai (Public).
> * **KHÔNG ĐƯỢC** bật tính năng Static Website Hosting trên S3.
> * **KHÔNG ĐƯỢC** truy cập các file qua URL trực tiếp của S3 dạng: `https://bucket.s3.amazonaws.com/...`.
> 
> 

* **Yêu cầu triển khai đúng:** * S3 bucket phải được đặt là **PRIVATE** – bắt buộc bật cả bốn tùy chọn Block Public Access.

* Amazon CloudFront phải là CDN duy nhất phục vụ tài nguyên frontend cho người dùng.

* Phải cấu hình **Origin Access Control (OAC)** để CloudFront có quyền đọc dữ liệu từ S3.

* Bucket Policy của S3 chỉ cho phép CloudFront Service Principal thực hiện hành động đọc đối tượng (`s3:GetObject`).

1.3 Bằng chứng bảo mật Frontend bắt buộc 

Nhóm phải nộp đủ bốn mục minh chứng dưới đây, thiếu bất kỳ mục nào sẽ bị trừ điểm trong hạng mục Bảo mật:

| ID | Mục bằng chứng | Cách thu thập | Thể thức chấp nhận |
| --- | --- | --- | --- |
| **SE-1** | S3 Block Public Access bật | Chụp màn hình tab Permissions của S3 bucket cho thấy cả bốn checkbox được bật. | Screenshot |
| **SE-2** | Truy cập trực tiếp S3 bị từ chối | Mở trình duyệt hoặc chạy curl tới URL S3 trực tiếp và ghi lại phản hồi **403 Forbidden / Access Denied**. | Screenshot hoặc curl output |
| **SE-3** | Truy cập CloudFront thành công | Mở URL CloudFront (`https://<id>.cloudfront.net`) và ghi lại trang web hoạt động với HTTP status **200 OK**. | Screenshot |
| **SE-4** | OAC gắn vào CloudFront | Screenshot trang Settings của CloudFront distribution cho thấy rõ "Origin access: Origin access control settings" và tên OAC. | Screenshot |

---

### 2. Backend API 

2.1 Ngôn ngữ và các endpoint API 

* **Ngôn ngữ:** Sử dụng Node.js 20.x hoặc Python 3.12.

* **Các endpoint bắt buộc:**

| Phương thức | Đường dẫn | Mô tả |
| --- | --- | --- |
| **GET** | `/tasks` | Lấy toàn bộ danh sách công việc |
| **POST** | `/tasks` | Tạo công việc mới |
| **PUT** | `/tasks/:id` | Cập nhật công việc theo ID |
| **DELETE** | `/tasks/:id` | Xóa công việc theo ID |

2.2 Kiến trúc Compute 

* Sử dụng giải pháp serverless compute: **AWS Lambda**.

* Hoạt động theo cơ chế hướng sự kiện (Event-driven): Lambda được kích hoạt trực tiếp bởi API Gateway.

* Thiết kế phi trạng thái (Stateless): Mỗi yêu cầu độc lập hoàn toàn, không lưu trạng thái bên trong Lambda và tự động mở rộng quy mô.

* **Bắt buộc triển khai 4 Lambda Function riêng biệt:** gồm `GetTasksFunction`, `CreateTaskFunction`, `UpdateTaskFunction`, `DeleteTaskFunction`.

* 📌 *Lưu ý:* Mỗi Lambda phải được triển khai độc lập, sở hữu IAM Role riêng và gắn vào API Gateway tương ứng. **Không được phép** gộp chung nhiều chức năng vào một Lambda duy nhất.

---

### 3. Mạng – Kết nối Lambda tới DynamoDB 

Giải thích kỹ thuật:

* **Cách 1 (SAI):** Lambda gọi DynamoDB qua internet công cộng $\rightarrow$ bắt buộc phải cấu hình NAT Gateway, tiêu tốn khoảng 32 USD/tháng.

* **Cách 2 (ĐÚNG):** Lambda gọi DynamoDB qua **VPC Gateway Endpoint** $\rightarrow$ toàn bộ traffic chạy trên đường trục backbone riêng tư của AWS, chi phí bằng 0.

* Đồ án này **bắt buộc sử dụng Cách 2**.

3.1 Cấu hình VPC yêu cầu 

Sinh viên phải tạo một Custom VPC và triển khai các Lambda function bên trong môi trường mạng này với các thông số sau:

| Thành phần VPC | Cấu hình | Mục đích |
| --- | --- | --- |
| **Custom VPC** | CIDR: `10.0.0.0/16` | Mạng ảo riêng để cô lập tài nguyên compute |
| **Private Subnet AZ-1** | Ví dụ: `10.0.1.0/24` tại ap-southeast-1a | Đặt các Lambda functions vào subnet này |
| **Private Subnet AZ-2** | Ví dụ: `10.0.2.0/24` tại ap-southeast-1b | Đảm bảo tính Sẵn sàng cao (HA) trên hai AZ |
| **VPC Gateway Endpoint** | Tạo endpoint cho DynamoDB và liên kết với Route Table | Cho phép Lambda kết nối an toàn với DynamoDB qua mạng riêng |
| **Lambda Security Group** | Outbound: Chỉ cho phép port 443 tới DynamoDB Prefix List | Ngăn chặn triệt để việc Lambda truy cập ra internet công cộng |
| **Route Table entry** | Destination: `pl-xxxxxx` (DynamoDB Prefix List) $\rightarrow$ Target: `vpce-xxxxxxxx` | Điều hướng traffic DynamoDB qua VPC Endpoint thay vì Internet |

3.2 Gắn Lambda vào VPC 

Khi cấu hình Lambda, bắt buộc phải khai báo trường `VpcConfig` để đưa Lambda vào Custom VPC.

> ⛔ **CẤM HOÀN TOÀN:** Việc tạo hoặc sử dụng NAT Gateway. NAT Gateway tính phí 0.045 USD/giờ (~32 USD/tháng) dù không có traffic. Vi phạm lỗi này sẽ bị **0 điểm** cho cả phần Networking và Cost Efficiency. Giảng viên sẽ kiểm tra trực tiếp trên VPC Console.
> 
> 

3.3 Bằng chứng về Networking 

| ID | Mục bằng chứng | Cách thu thập | Thể thức |
| --- | --- | --- | --- |
| **NE-1** | VPC Endpoint tạo cho DynamoDB | Screenshot tại `VPC > Endpoints` cho thấy rõ Service Name dạng `com.amazonaws.<region>.dynamodb` và Status là **Available**. | Screenshot |
| **NE-2** | Lambda có cấu hình VpcConfig | Screenshot tab `Configuration > VPC` của Lambda function hiển thị rõ Subnets và Security Group được gắn. | Screenshot |
| **NE-3** | Route table có Endpoint route | Screenshot Route Table của Private Subnet chứa dòng: Destination = `pl-xxxxxx` (DynamoDB Prefix List), Target = `vpce-xxxxxxxx`. | Screenshot |
| **NE-4** | Không có NAT Gateway | Screenshot tại `VPC > NAT Gateways` hiển thị danh sách trống hoặc tất cả entries đều có trạng thái **Deleted**. | Screenshot |
| **NE-5** | Lambda gọi DynamoDB thành công | CloudWatch logs của Lambda invocation hiển thị rõ **StatusCode 200** khi gọi DynamoDB, hoàn toàn không có lỗi mạng hoặc Unauthorized. | Screenshot log |

---

### 4. Cơ sở dữ liệu: Amazon DynamoDB 

* **Loại:** NoSQL Database.

* **Tính năng:** Tích hợp sẵn High Availability (tự động sao chép đa vùng AZ).

* **Hạn mức Free Tier:** Hỗ trợ 25 GB lưu trữ, 25 RCU và 25 WCU mỗi tháng (không hết hạn).

* **Yêu cầu đặc biệt:** Cơ sở dữ liệu phải được khởi tạo sẵn **ít nhất 2 users** để phục vụ quá trình demo và chấm điểm.

4.1 Schema của bảng dữ liệu 

| Thuộc tính | Kiểu dữ liệu | Vai trò | Mô tả |
| --- | --- | --- | --- |
| **taskId** | String | Partition Key | Chuỗi UUID do Lambda tạo ngẫu nhiên khi thêm công việc mới |
| **userId** | String | GSI Partition Key | ID của người dùng sở hữu công việc đó |
| **title** | String | Thuộc tính | Tiêu đề của công việc |
| **description** | String | Thuộc tính | Chi tiết nội dung công việc (tùy chọn) |
| **priority** | String | Thuộc tính | Nhận các giá trị giới hạn: `low` / `medium` / `high` |
| **dueDate** | String | Thuộc tính | Định dạng thời gian ISO: `2025-06-15` |
| **status** | String | Thuộc tính | Nhận các giá trị giới hạn: `pending` / `done` |
| **createdAt** | String | Thuộc tính | Timestamp định dạng ISO ghi lại lúc tạo công việc |

4.2 Global Secondary Index (GSI) 

Sinh viên bắt buộc phải cấu hình một GSI để hỗ trợ truy vấn hiệu quả danh sách công việc theo từng user:

* **Tên GSI:** `userId-index` 

* **GSI Partition key:** `userId` 

* **Projection:** `ALL` 

* 📌 *Lý do:* Nếu không tạo GSI này, hệ thống sẽ phải dùng thao tác `Scan` toàn bộ bảng $\rightarrow$ cực kỳ kém hiệu quả và không đáp ứng yêu cầu kiến trúc đám mây.

---

### 5. Bảo mật – IAM Least Privilege 

5.1 Yêu cầu phân quyền quyền 

Mỗi Lambda function bắt buộc phải sử dụng một IAM Role riêng biệt, không dùng chung một role cho nhiều hàm.

| IAM Role | Áp dụng cho | Hành động được phép (Allow) | Nghiêm cấm |
| --- | --- | --- | --- |
| <br>**LambdaTaskRole** | Task Service | `dynamodb:GetItem`, `PutItem`, `UpdateItem`, `DeleteItem`, `Query`, `Scan` (chỉ trên ARN cụ thể của Tasks Table); <br><br>`logs:CreateLogGroup`, `CreateLogStream`, `PutLogEvents`;<br><br>`ec2:CreateNetworkInterface`, `DescribeNetworkInterfaces`, `DeleteNetworkInterface` (để gắn Lambda vào VPC). | Sử dụng ký tự đại diện wildcard (`*`) cho trường Action hoặc Resource; truy cập vào bất kỳ bảng nào khác ngoài bảng Tasks. |
| <br>**LambdaBaseRole** | Các Lambda khác | `logs:CreateLogGroup`, `CreateLogStream`, `PutLogEvents`;<br><br>`ec2:CreateNetworkInterface`, `DescribeNetworkInterfaces`, `DeleteNetworkInterface`. | Bất kỳ quyền truy cập nào can thiệp vào DynamoDB. |

5.2 Bằng chứng về IAM 

* **IM-1:** Screenshot trang `IAM > Roles` được bộ lọc theo tên dự án, hiển thị rõ ràng hai role riêng biệt đã tạo.

* **IM-2:** Mở Inline Policy hoặc mã JSON của mỗi Role để chụp trường `Resource` – phải hiển thị rõ ràng ARN cụ thể của bảng DynamoDB, không được phép dùng ký tự `*`.

* **IM-3:** Screenshot tab `Configuration > Permissions` của từng Lambda function chứng minh đã gắn đúng Role tương ứng.

---

### 5b. Bảo mật truy cập Web App – Amazon Cognito 

Ứng dụng web phải bắt buộc sử dụng dịch vụ Amazon Cognito để quản lý, xác thực người dùng và bảo vệ an toàn cho các API backend.

5b.1 Yêu cầu cấu hình Cognito 

* Tạo một **Cognito User Pool** để quản trị các tài khoản người dùng.

* Tạo một **Cognito App Client** phục vụ quá trình xác thực từ mã nguồn frontend.

* Tích hợp **Cognito Authorizer** vào API Gateway: Đảm bảo mọi request gửi đến các endpoint `/tasks` đều phải đính kèm JWT token hợp lệ.

* Mã nguồn Frontend phải xây dựng giao diện Đăng nhập (Login) và Đăng ký (Sign Up) kết nối trực tiếp với Cognito.

* Sau khi đăng nhập thành công, frontend sẽ lưu trữ JWT token và tự động gửi kèm vào Header của mọi lời gọi API tiếp theo.

* Nếu người dùng chưa thực hiện đăng nhập, API Gateway phải chặn lại và trả về HTTP status **401 Unauthorized**.

5b.2 Bằng chứng bảo mật Cognito bắt buộc nộp 

| ID | Mục bằng chứng | Cách thu thập | Thể thức |
| --- | --- | --- | --- |
| **CO-1** | Cognito User Pool đã tạo | Screenshot giao diện `Cognito > User Pools` hiển thị rõ thông tin tên Pool và Pool ID. | Screenshot |
| **CO-2** | API Gateway Authorizer | Screenshot tại `API Gateway > Authorizers` chứng minh Cognito Authorizer đã liên kết thành công với User Pool. | Screenshot |
| **CO-3** | Truy cập không token bị từ chối | Chạy lệnh `curl` gọi API backend nhưng không gửi kèm Authorization header $\rightarrow$ phản hồi trả về phải là **401 Unauthorized**. | Screenshot/curl |
| **CO-4** | Truy cập kèm token thành công | Chạy lệnh `curl` gọi API kèm theo JWT token hợp lệ $\rightarrow$ nhận phản hồi **200 OK** kèm theo dữ liệu JSON. | Screenshot/curl |

---

### 6. API Gateway – Định tuyến và Bảo mật 

6.1 Cấu hình yêu cầu 

* **Loại API:** Phải chọn **REST API** (Nghiêm cấm sử dụng HTTP API cho dự án này).

* **Deployment stage:** Đặt tên stage là `prod`.

* **Giao thức:** HTTPS được bật mặc định thông qua SSL certificate do API Gateway tự động cấp phát.

6.2 Giới hạn tốc độ (Throttling) 

| Tham số | Giá trị gợi ý | Lý do / Yêu cầu giải thích |
| --- | --- | --- |
| **Rate (req/s)** | 100 | Giới hạn số lượng request tối đa mỗi giây trên từng người dùng. |
| **Burst** | 50 | Số lượng yêu cầu đồng thời tối đa được phép xử lý tại một thời điểm. |
| **Lambda Reserved Concurrency** | Sinh viên tự tìm hiểu | Sinh viên bắt buộc phải giải thích trong báo cáo:<br><br>1. Reserved Concurrency là gì? <br><br>2. Giá trị nào phù hợp nhất với môi trường Free Tier?<br><br>3. Ảnh hưởng ra sao nếu thiết lập quá thấp hoặc quá cao? |

6.3 Cấu hình CORS an toàn 

* Thuộc tính `Access-Control-Allow-Origin` **chỉ được phép** trỏ chính xác về domain CloudFront của bạn (Ví dụ: `https://d1abc123.cloudfront.net`).

* 🛑 **CẤM TUYỆT ĐỐI:** Sử dụng ký tự đại diện dấu sao (`*`). Việc cấu hình wildcard sẽ bị trừng phạt điểm nặng trong hạng mục triển khai bảo mật.

---

### 7. Giám sát và Quản lý Chi phí 

7.1 CloudWatch Dashboard 

Tạo một bảng điều khiển tập trung mang tên `TaskManager-Dashboard` đáp ứng tối thiểu năm chỉ số (widgets) sau:

| Tên Widget | Metric | Namespace | Mục đích giám sát |
| --- | --- | --- | --- |
| **Invocations** | Invocations | AWS/Lambda | Đo lường tổng số request kích hoạt hàm Lambda. |
| **Duration** | Duration (P50, P99) | AWS/Lambda | Thời gian thực thi trung bình và phân vị cao nhất của Lambda. |
| **Errors** | Errors | AWS/Lambda | Theo dõi số lượng lỗi phát sinh ở mức function. |
| **Throttles** | Throttles | AWS/Lambda | Số request bị từ chối do vượt ngưỡng giới hạn concurrency cap. |
| **API Latency** | Latency | AWS/ApiGateway | Thời gian phản hồi toàn trình (end-to-end response time). |
| **4xx/5xx** | 4XXError, 5XXError | AWS/ApiGateway | Tỷ lệ lỗi phát sinh từ phía máy khách (Client) và máy chủ (Server). |

7.2 CloudWatch Alarms & Gửi cảnh báo 

Cấu hình hệ thống tự động phát hiện sự cố và gửi thông báo qua email nhờ dịch vụ Amazon SNS:

* **Lambda-Error-Alarm:** Kích hoạt khi số lượng Lambda Errors > 10 trong khoảng thời gian 5 phút.

* **API-5xx-Alarm:** Kích hoạt khi tỷ lệ API Gateway 5XXError > 5 trong khoảng thời gian 5 phút.

Yêu cầu cấu hình ghi Log:

Hệ thống log phải lưu trữ đầy đủ trong Log Group tại vị trí `/aws/lambda/<function-name>` với hai trường hợp:

* **Log Request thành công:** Hiển thị rõ dòng `REPORT` đi kèm các thông tin `StatusCode 200`, `Duration`, `Billed Duration` và lượng `Memory Used`.

* **Log Request lỗi:** Hiển thị rõ nhãn `ERROR` hoặc toàn bộ mã stack trace khi người dùng gửi đầu vào không hợp lệ (ví dụ: thiếu trường bắt buộc).

* *Bằng chứng:* Sinh viên chụp lại screenshot minh chứng log thực tế để nộp (Mục **NE-5**).

7.4 Kiểm soát chi phí hạ tầng 

* Khởi tạo **AWS Budget** với giới hạn nghiêm ngặt ở mức **0.01 USD** mỗi tháng.

* Cấu hình hai mốc cảnh báo vượt ngưỡng tại **80% (0.008 USD)** và **100% (0.01 USD)** – cả hai mốc này bắt buộc phải gửi thông báo email trực tiếp về cho sinh viên.

* Tìm hiểu sâu và thiết lập giá trị `Lambda Reserved Concurrency` phù hợp, đồng thời áp dụng chính sách API Gateway throttling để tránh các cuộc tấn công gây bùng nổ chi phí.

---

## V. Sản phẩm bàn giao yêu cầu 

### 1. Ứng dụng Web hoàn chỉnh 

* Giao diện frontend truy cập ổn định thông qua URL CloudFront.

* API backend trả về đúng cấu trúc dữ liệu định dạng JSON.

* Kiểm thử hoạt động mượt mà cả 4 thao tác CRUD.

* Dữ liệu công việc được đồng bộ, lưu trữ và xác minh chính xác trong DynamoDB qua các phiên làm việc.

* Chức năng xác thực của Cognito vận hành đúng vai trò (cho phép Login / Sign Up thành công).

### 2. Sơ đồ Kiến trúc hệ thống 

Sinh viên có thể sử dụng bất kỳ công cụ thiết kế nào (draw.io, Lucidchart, vẽ tay,...) để hoàn thiện sơ đồ kiến trúc. Sơ đồ sẽ được chấm điểm dựa trên mức độ đầy đủ, thiếu bất kỳ thành phần nào dưới đây sẽ bị trừ điểm:

| Tầng hệ thống | Thành phần bắt buộc hiển thị trên sơ đồ |
| --- | --- |
| **Edge** | Luồng tương tác giữa CloudFront + OAC + Private S3 Bucket. |
| **API** | API Gateway thực hiện tiếp nhận và kích hoạt Lambda tương ứng. |
| **Compute (VPC)** | Ranh giới mạng Custom VPC, Private Subnets và 4 hàm Lambda độc lập có VpcConfig. |
| **Network** | Vị trí đặt VPC Gateway Endpoint dành riêng cho dịch vụ DynamoDB. |
| **Database** | Thực thể bảng Amazon DynamoDB (biểu diễn việc khởi tạo sẵn ít nhất 2 users). |
| **Bảo mật & Giám sát** | Sự hiện diện của các IAM Roles độc lập, Cognito User Pool + Authorizer, CloudWatch Logs, và SNS Alarms. |
| **Chi phí** | Thành phần quản lý ngân sách AWS Budgets. |

### 3. Tập hợp 16 mục bằng chứng Bảo mật và Triển khai 

Sinh viên tổng hợp toàn bộ ảnh chụp màn hình (Screenshot) hoặc file text log kết quả thành một file PDF duy nhất hoặc đóng gói vào một thư mục hình ảnh theo đúng bảng danh sách sau:

| ID bằng chứng | Tên mục bằng chứng yêu cầu | Hạng mục quy thuộc trong Rubric |
| --- | --- | --- |
| **SE-1** | S3 Block Public Access – bật toàn bộ 4 tùy chọn | Triển khai Đám mây |
| **SE-2** | Truy cập trực tiếp qua URL S3 bị trả lỗi 403 Forbidden | Triển khai Đám mây |
| **SE-3** | Truy cập qua URL CloudFront thành công trả về 200 OK | Triển khai Đám mây |
| **SE-4** | Cấu hình OAC được gắn vào CloudFront distribution | Triển khai Đám mây |
| **CO-1** | Giao diện quản lý Cognito User Pool đã tạo thành công | Triển khai Đám mây / Bảo mật |
| **CO-2** | Giao diện API Gateway đã tích hợp Cognito Authorizer | Triển khai Đám mây / Bảo mật |
| **CO-3** | Thử gọi API không kèm token nhận lỗi 401 Unauthorized | Triển khai Đám mây / Bảo mật |
| **CO-4** | Thử gọi API đính kèm token hợp lệ nhận kết quả 200 OK | Triển khai Đám mây / Bảo mật |
| **NE-1** | VPC Endpoint cho DynamoDB hiển thị trạng thái Available | Hiểu biết Kiến trúc |
| **NE-2** | Cấu hình Lambda VpcConfig hiển thị rõ Subnets và Security Group | Hiểu biết Kiến trúc |
| **NE-3** | Route Table của Private Subnet chứa dòng pl-xxx $\rightarrow$ vpce-xxx | Hiểu biết Kiến trúc |
| **NE-4** | Danh sách NAT Gateway trống hoặc hiển thị toàn bộ là Deleted | Hiệu quả Chi phí |
| **NE-5** | CloudWatch log chứng minh Lambda gọi DynamoDB thành công | Giám sát |
| **IM-1** | Hiển thị rõ hai IAM Roles riêng biệt với tên phân biệt | Triển khai Đám mây |
| **IM-2** | Nội dung Policy JSON chỉ định rõ ARN cụ thể của bảng DynamoDB | Triển khai Đám mây |
| **IM-3** | Từng Lambda function được gắn chính xác với Role của nó | Triển khai Đám mây |

### 4. Minh chứng Giám sát (Monitoring Dashboard) 

* Screenshot CloudWatch Dashboard hiển thị tối thiểu 5 chỉ số (widgets) chạy bằng dữ liệu tương tác thực tế.

* Screenshot trạng thái cấu hình của 2 cột mốc Alarms (chấp nhận cả trạng thái OK hoặc ALARM).

* Screenshot giao diện trang quản lý và thiết lập AWS Budget.

5. Báo cáo Tối ưu hóa Chi phí 

* Chụp màn hình giao diện từ AWS Cost Explorer hoặc Billing Dashboard.

* Đưa ra bằng chứng thuyết phục chứng minh tổng mức chi tiêu toàn hệ thống trong suốt thời gian thực hiện đồ án đạt ngưỡng $\le$ 0.01 USD.

* Trường hợp xảy ra phát sinh chi phí ngoài ý muốn, sinh viên phải giải trình rõ nguyên nhân kỹ thuật và đề xuất giải pháp khắc phục.

### 6. Tài liệu giải thích Khái niệm kỹ thuật 

Báo cáo kỹ thuật của nhóm phải phân tích tường tận bốn bài toán cốt lõi sau đây, giảng viên sẽ trực tiếp chất vấn các nội dung này trong buổi bảo vệ đồ án:

| Khái niệm kỹ thuật | Nội dung phân tích chi tiết bắt buộc | Tỷ trọng điểm |
| --- | --- | --- |
| **Luồng đi của Request** | Mô tả chi tiết từng bước dịch chuyển của dữ liệu từ khi người dùng click nút 'Tạo công việc' cho đến khi nhận kết quả phản hồi:<br><br>Trình duyệt $\rightarrow$ CloudFront (tải file tĩnh) hoặc API Gateway $\rightarrow$ Lambda $\rightarrow$ VPC Endpoint $\rightarrow$ DynamoDB và ngược lại. | ~8% |
| **Tự mở rộng Serverless** | Phân tích cơ chế Lambda tự động co giãn từ 0 đến N instances đồng thời. Giải thích vai trò của API Gateway như một load balancer tự nhiên và lý do tại sao kiến trúc này không cần sử dụng đến Application Load Balancer (ALB). | ~6% |
| **CDN và cơ chế OAC** | Giải thích bản chất hoạt động bộ đệm CloudFront caching (phân biệt Cache HIT và Cache MISS). Định nghĩa vai trò OAC và lý do cốt lõi buộc phải cấu hình Private S3 bucket. | ~4% |
| **Mạng VPC Endpoint** | Làm rõ lý do kỹ thuật tại sao Lambda nằm trong Private Subnet phải cần đến VPC Endpoint mới kết nối được với DynamoDB. Mô tả đường đi của traffic qua mạng bộ khung riêng (AWS private backbone) và so sánh trực quan với giải pháp NAT Gateway trên khía cạnh bảo mật và chi phí. | ~4% |

### 7. Mã nguồn dự án (Source Code) 

* Toàn bộ mã nguồn Frontend (HTML, CSS, JavaScript).

* Mã nguồn Backend (Node.js hoặc Python) chứa đủ 4 hàm CRUD handler xử lý độc lập.

* *(Tùy chọn khuyến khích):* File template cấu hình hạ tầng dạng mã AWS SAM hoặc CloudFormation (nếu có sử dụng IaC, phải nộp kèm).

* File hướng dẫn `README.md` mô tả cụ thể các bước khởi chạy ứng dụng tại môi trường Local cũng như quy trình Deploy lên đám mây AWS.

---

## VI. Tiêu chí Đánh giá chi tiết (Rubric) 

| Hạng mục chấm điểm | Tỷ trọng | Yêu cầu để đạt được điểm số tối đa |
| --- | --- | --- |
| **Chức năng ứng dụng** | **20%** | Toàn bộ 4 nghiệp vụ CRUD hoạt động chuẩn xác. Sự tích hợp giữa Frontend, Backend và DynamoDB diễn ra trơn tru. Bộ lọc công việc theo mức độ ưu tiên và ngày hết hạn thực thi chính xác. |
| **Triển khai Đám mây & Hiểu biết Kiến trúc** | **25% & 20%** | Xác minh thành công các bằng chứng bảo mật Frontend (SE-1 $\rightarrow$ SE-4) và Backend Cognito (CO-1 $\rightarrow$ CO-4). Lambda được cô lập trong VPC kết nối qua Endpoint (NE-1 $\rightarrow$ NE-3). Áp dụng đúng Least Privilege (IM-1 $\rightarrow$ IM-3). Cấu hình CORS chặt chẽ.<br><br>Sinh viên giải thích trôi chảy toàn bộ luồng request, bản chất VPC Endpoint, cơ chế auto-scaling và vai trò CDN OAC khi phản biện. |
| **Hệ thống Giám sát** | **10%** | CloudWatch Dashboard cấu hình từ 5 widgets trở lên hiển thị dữ liệu thực. Thiết lập thành công 2 Alarms kết nối qua email hệ thống SNS. Có đầy đủ ảnh chụp log thành công và lỗi (Mục NE-5). |
| **Hiệu quả Chi phí** | **15%** | Tuyệt đối không tạo NAT Gateway (NE-4). Giới hạn thành công thông số Lambda concurrency thích hợp và có giải trình logic. Cấu hình ngân sách AWS Budget ở mức 0.01 USD. Tổng chi phí phát sinh trong suốt đồ án bằng 0 hoặc xấp xỉ bằng 0. |
| **Tài liệu & Minh chứng** | **10%** | Báo cáo kỹ thuật phân tích sâu sắc cả 4 khái niệm yêu cầu. Sơ đồ kiến trúc thể hiện tường tận mọi thành phần. Cung cấp đầy đủ 16 hạng mục bằng chứng. **Đặc biệt:** Nếu có sử dụng các công cụ Generative AI để hỗ trợ làm bài, bắt buộc phải xuất lịch sử prompt hoặc chụp màn hình chat đính kèm, nếu không có sẽ bị trừng phạt điểm phần Tài liệu. |

> 📌 **LƯU Ý QUAN TRỌNG TỪ HỘI ĐỒNG CHẤM THI:** Thiếu bất kỳ một mục bằng chứng bắt buộc nào trong danh sách (SE/NE/IM/CO) sẽ lập tức bị trừng phạt điểm trong hạng mục tương ứng, cho dù hệ thống chạy thực tế hoàn toàn đúng chức năng.
> 
> 

---

## VII. Tiến độ thực hiện Đồ án 

* **Tuần 1: Phát triển mã nguồn Frontend và Backend tại môi trường cục bộ** * *Kết quả dự kiến:* Giao diện frontend vận hành ổn định trên máy local. Viết xong toàn bộ 4 hàm xử lý CRUD cho Lambda và thực hiện kiểm thử thành công bằng giải pháp DynamoDB Local hoặc các thư viện Mock dữ liệu.

* **Tuần 2: Triển khai hạ tầng đám mây và cấu hình kết nối cơ sở dữ liệu** * *Kết quả dự kiến:* Khởi tạo xong Custom VPC, thiết lập 2 Private Subnets và cấu hình thành công VPC Gateway Endpoint. Thực hiện deploy mã nguồn Lambda vào VPC. Hoàn thiện bảng DynamoDB cùng cấu hình chỉ mục GSI. Cấu hình API Gateway (CORS + Throttling). Đóng gói Private S3 + CloudFront OAC. Thiết lập Cognito User Pool và Authorizer. Thu thập xong toàn bộ bằng chứng từ **NE-1 $\rightarrow$ NE-5**.

* **Tuần 3: Kiểm thử toàn diện, thiết lập hệ thống giám sát, hoàn thiện tài liệu và nộp bài** * *Kết quả dự kiến:* Hoàn tất thiết lập CloudWatch Dashboard, cấu hình 2 Alarms cảnh báo và chụp lại minh chứng log thành công/thất bại. Thiết lập xong AWS Budget và xuất báo cáo chi phí. Hoàn thiện tài liệu thuyết minh kỹ thuật và tập hợp đủ **16 mục bằng chứng bắt buộc** để nộp bài.

---

## VIII. Các bẫy kỹ thuật thường gặp và Danh sách kiểm tra 

Các lỗi kinh điển cần tránh để không bị điểm 0:

| Lỗi sai sót | Mô tả hành vi | Hậu quả đánh giá từ Giảng viên |
| --- | --- | --- |
| **S3 Public** | Cấu hình bucket ở chế độ công khai hoặc vô tình bật tính năng Static Website Hosting. | **Mất toàn bộ điểm** từ mục SE-1 $\rightarrow$ SE-4 trong phần Triển khai.|
| **Dùng NAT Gateway** | Khởi tạo NAT Gateway để giúp Lambda trong VPC đi ra internet công cộng. | **Mất trắng điểm** mục NE-4 và toàn bộ điểm phần Hiệu quả Chi phí. Tài khoản bị tính phí ~32 USD/tháng. |
| **Lambda ngoài VPC** | Quên không khai báo trường cấu hình `VpcConfig` khi tạo hàm Lambda. | <br>**Mất sạch điểm** từ mục NE-1 $\rightarrow$ NE-3 cho dù có tạo VPC Endpoint chính xác. |
| **Dùng chung IAM Role** | Sử dụng duy nhất một Role chung cho tất cả các hàm Lambda, hoặc lạm dụng quyền ký tự đại diện `*`. | <br>**Mất toàn bộ điểm** từ mục IM-1 $\rightarrow$ IM-3. |
| **CORS Wildcard** | Khai báo thuộc tính `Access-Control-Allow-Origin: *` cho nhanh. | Bị trừng phạt nặng điểm trong phần Triển khai (Bảo mật). |
| **Thiếu ảnh minh chứng** | Quên không chụp hoặc chụp thiếu các bước theo đúng yêu cầu bảng SE/NE/IM/CO. | Trừng phạt điểm thẳng tay theo từng mục thiếu sót bất kể hệ thống chạy đúng. |
| **Giấu Prompt GenAI** | Có sử dụng AI hỗ trợ viết code/thiết kế nhưng không nộp lại file lịch sử chat. | Trừng phạt điểm nghiêm khắc trong phần Tài liệu báo cáo. |

Checklist kiểm tra nghiêm ngặt trước khi nhấn nút Nộp bài:

* [ ] **S3 Bucket:** Đã kiểm tra 4 tùy chọn Block Public Access đều bật (`SE-1`).

* [ ] **S3 Direct URL:** Thử truy cập trực tiếp link S3, kết quả trả về bắt buộc phải là `403 Forbidden` (`SE-2`).

* [ ] **CloudFront URL:** Truy cập ứng dụng qua CloudFront mượt mà, trả kết quả trạng thái `200 OK` (`SE-3`).

* [ ] **CloudFront Distribution:** Xác nhận mục Origin access hiển thị rõ ràng cấu hình OAC (`SE-4`).

* [ ] **VPC Endpoints:** Endpoint dành cho DynamoDB hiện diện và mang trạng thái `Available` (`NE-1`).

* [ ] **Lambda VPC:** Tab Configuration hiển thị chính xác các thông số Subnets và Security Group (`NE-2`).

* [ ] **Route Table:** Bản ghi định tuyến chứa dòng ánh xạ từ `pl-xxx` sang `vpce-xxx` (`NE-3`).

* [ ] **NAT Gateways:** Danh sách trống hoàn toàn hoặc toàn bộ trạng thái hiển thị là `Deleted` (`NE-4`).

* [ ] **CloudWatch logs:** Log gọi dữ liệu hiển thị trạng thái StatusCode 200, hoàn toàn sạch bóng lỗi NetworkError (`NE-5`).

* [ ] **IAM Policies:** Có đúng 2 Roles riêng lẻ, cấu hình trường Resource chỉ định đúng ARN của bảng, không chứa dấu `*` (`IM-1`, `IM-2`, `IM-3`).

* [ ] **Cognito Integration:** User Pool đã sẵn sàng, API Gateway Authorizer đã bật, thử gọi không token trả `401`, có token trả `200` (`CO-1`, `CO-2`, `CO-3`, `CO-4`).

* [ ] **Database Setup:** Đã tạo sẵn tối thiểu 2 tài khoản users mẫu nằm trong bảng DynamoDB.

* [ ] **Monitoring & Budget:** CloudWatch Dashboard có trên 5 widgets chạy số liệu thực, 2 Alarms hoạt động, AWS Budget cài mốc 0.01 USD đi kèm xác nhận đăng ký nhận email thành công.

* [ ] **Thuyết minh kỹ thuật:** Tài liệu phân tích rõ ràng 4 bài toán lớn (luồng request, scaling, CDN, VPC Endpoint).

* [ ] **Sơ đồ kiến trúc:** Thể hiện rõ nét ranh giới phân tách của mạng VPC, vị trí Lambda và sự hiện diện của Cognito cùng các dịch vụ bổ trợ.

* [ ] **Hồ sơ AI & IaC:** Đóng gói đầy đủ lịch sử prompt chat (nếu có dùng GenAI) và mã nguồn IaC (nếu triển khai qua SAM/CloudFormation).

* [ ] **Video dự phòng:** Đính kèm sẵn đường link video demo sản phẩm đề phòng trường hợp khẩn cấp khi bảo vệ.

---
