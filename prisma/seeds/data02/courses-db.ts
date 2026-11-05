import { CourseLevel } from '@prisma/client'
import { CourseBlueprint } from './categories-data'

export const COURSES_DB: readonly CourseBlueprint[] = [
  // ==========================================
  // CAT-08: Cơ sở dữ liệu & Kỹ thuật dữ liệu (16 courses)
  // Quota: 5 BEGINNER, 7 INTERMEDIATE, 4 ADVANCED | 2 FREE, 14 PAID
  // ==========================================
  {
    title: 'Nhập Môn Cơ Sở Dữ Liệu Quan Hệ & Ngôn Ngữ SQL Từ Con Số 0',
    slug: 'nhap-mon-co-so-du-lieu-quan-he-ngon-ngu-sql-tu-con-so-0',
    categorySlug: 'co-so-du-lieu-va-ky-thuat-du-lieu',
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0,
    leadSummary: 'Làm chủ tư duy mô hình hóa dữ liệu quan hệ và cú pháp truy vấn SQL chuẩn từ cơ bản đến nâng cao, ứng dụng mượt mà trên PostgreSQL và MySQL.',
    industryContext: 'SQL là kỹ năng bắt buộc hàng đầu đối với mọi lập trình viên phần mềm, chuyên viên phân tích dữ liệu và kỹ sư hệ thống trên toàn cầu.',
    coreTopics: [
      'Nguyên lý cơ sở dữ liệu quan hệ (RDBMS), bảng, khóa chính (Primary Key), khóa ngoại (Foreign Key)',
      'Cú pháp truy vấn cơ bản: SELECT, WHERE, ORDER BY, LIMIT, DISTINCT và lọc dữ liệu với LIKE, IN, BETWEEN',
      'Liên kết bảng chuyên sâu: INNER JOIN, LEFT JOIN, RIGHT JOIN, FULL OUTER JOIN và CROSS JOIN',
      'Hàm tổng hợp và nhóm dữ liệu: COUNT, SUM, AVG, MIN, MAX kết hợp GROUP BY và mệnh đề HAVING',
      'Thao tác thay đổi dữ liệu DDL và DML: INSERT, UPDATE, DELETE và tạo cấu trúc bảng với CREATE TABLE'
    ],
    handsOnProject: 'Xây dựng và truy vấn hệ thống cơ sở dữ liệu bán hàng trực tuyến với hơn 10 bảng liên kết thực tế.',
    targetAudience: 'Sinh viên năm nhất CNTT, chuyên viên nghiệp vụ phi công nghệ và lập trình viên mới bắt đầu.',
    careerApplication: 'Đáp ứng toàn bộ bài test SQL đầu vào cho các vị trí Junior Backend Developer, Data Analyst và QA Tester.',
    requirements: [
      'Máy tính cá nhân có khả năng cài đặt công cụ pgAdmin, DBeaver hoặc MySQL Workbench',
      'Không yêu cầu kinh nghiệm lập trình hay kiến thức toán học phức tạp'
    ],
    benefits: [
      'Thao tác truy xuất dữ liệu thành thạo và chính xác từ các bảng quan hệ phức tạp',
      'Hiểu rõ quan hệ 1-1, 1-Nhiều và Nhiều-Nhiều cùng cách thiết kế khóa ngoại chuẩn hóa',
      'Viết các câu lệnh tổng hợp báo cáo doanh số, số lượng người dùng linh hoạt',
      'Tránh các sai lầm cơ bản dẫn đến sai lệch kết quả dữ liệu truy vấn'
    ],
    techniques: ['SQL', 'PostgreSQL', 'MySQL', 'RDBMS', 'Data Modeling', 'DBeaver'],
    documents: [
      'Cẩm nang tóm tắt cú pháp SQL chuẩn ANSI và các mẹo tối ưu JOIN phổ biến',
      'Bộ bài tập 50 câu đố SQL thực chiến kèm lời giải và kịch bản bảng mẫu'
    ]
  },
  {
    title: 'Thiết Kế Cơ Sở Dữ Liệu Chuẩn Hóa & Mô Hình Thực Thể ERD Chuyên Nghiệp',
    slug: 'thiet-ke-co-so-du-lieu-chuan-hoa-mo-hinh-thuc-the-erd-chuyen-nghiep',
    categorySlug: 'co-so-du-lieu-va-ky-thuat-du-lieu',
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0,
    leadSummary: 'Làm chủ quy trình thiết kế cơ sở dữ liệu chuẩn công nghiệp từ phân tích nghiệp vụ, vẽ sơ đồ ERD đến áp dụng các dạng chuẩn 1NF, 2NF, 3NF và BCNF.',
    industryContext: 'Một thiết kế cơ sở dữ liệu tồi sẽ hủy hoại khả năng mở rộng của toàn bộ ứng dụng và gây ra dị thường cập nhật dữ liệu nghiêm trọng.',
    coreTopics: [
      'Phân tích yêu cầu bài toán nghiệp vụ thực tế và xác định thực thể, thuộc tính',
      'Mô hình thực thể quan hệ ERD (Entity Relationship Diagram) với ký hiệu Crow Foot',
      'Lý thuyết chuẩn hóa cơ sở dữ liệu: Dạng chuẩn 1NF, 2NF, 3NF và Boyce-Codd (BCNF)',
      'Xử lý quan hệ nhiều-nhiều (N-N) thông qua bảng trung gian (Junction Table)',
      'Các trường hợp phi chuẩn hóa (Denormalization) có kiểm soát để tối ưu tốc độ đọc'
    ],
    handsOnProject: 'Thiết kế trọn vẹn mô hình dữ liệu cho nền tảng đặt phòng khách sạn và vé máy bay trực tuyến quy mô lớn.',
    targetAudience: 'Lập trình viên Backend, Data Engineer muốn nâng cao tư duy thiết kế kiến trúc lưu trữ dữ liệu.',
    careerApplication: 'Tự tin tham gia giai đoạn System Design và Data Architecture trong các dự án phần mềm doanh nghiệp.',
    requirements: [
      'Đã nắm được khái niệm cơ bản về bảng và câu lệnh SQL đơn giản',
      'Tư duy phân tích bài toán logic và khả năng trừu tượng hóa thông tin'
    ],
    benefits: [
      'Xây dựng sơ đồ ERD rõ ràng, nhất quán và chuẩn xác với các phần mềm chuyên dụng',
      'Loại bỏ triệt để hiện tượng dư thừa dữ liệu và dị thường khi thêm, sửa, xóa',
      'Lựa chọn chính xác kiểu dữ liệu tối ưu bộ nhớ cho từng cột',
      'Đánh giá và phản biện thiết kế dữ liệu của đồng nghiệp trong quá trình review mã nguồn'
    ],
    techniques: ['ERD', 'Database Design', 'Normalization', 'Crow Foot', 'Data Architecture'],
    documents: [
      'Sơ đồ quy trình chuẩn hóa từ 1NF đến BCNF với các ví dụ trực quan',
      'Template thiết kế ERD chuẩn trên Draw.io và dbdocs.io'
    ]
  },
  {
    title: 'Thành Thạo PostgreSQL Thực Chiến: Quản Trị, Lập Trình Stored Procedure & Triggers',
    slug: 'thanh-thao-postgresql-thuc-chien-quan-tri-lap-trinh-stored-procedure-triggers',
    categorySlug: 'co-so-du-lieu-va-ky-thuat-du-lieu',
    level: CourseLevel.BEGINNER,
    price: 499000,
    oldPrice: 799000,
    leadSummary: 'Khai thác tối đa sức mạnh của hệ quản trị cơ sở dữ liệu nguồn mở tiên tiến nhất thế giới PostgreSQL, từ JSONB, View, Indexing đến PL/pgSQL.',
    industryContext: 'PostgreSQL trở thành cơ sở dữ liệu được các công ty khởi nghiệp và tập đoàn công nghệ lớn ưu tiên lựa chọn hàng đầu nhờ tính năng vượt trội.',
    coreTopics: [
      'Kiến trúc nội bộ PostgreSQL: Process, Memory, WAL (Write-Ahead Logging) và MVCC',
      'Lưu trữ và truy vấn dữ liệu bán cấu trúc với kiểu dữ liệu JSONB và toán tử chuyên biệt',
      'Tạo View, Materialized View để tăng tốc báo cáo định kỳ',
      'Lập trình cơ sở dữ liệu với PL/pgSQL: Viết Function, Stored Procedure và Transaction control',
      'Tự động hóa nghiệp vụ với Trigger và Event Trigger trên bảng'
    ],
    handsOnProject: 'Xây dựng module kiểm toán thay đổi dữ liệu (Audit Trail) tự động bằng Trigger và JSONB trong PostgreSQL.',
    targetAudience: 'Backend Developer sử dụng Node.js, Go, Java hoặc Python muốn làm chủ tầng dữ liệu PostgreSQL.',
    careerApplication: 'Tự tin đảm nhận vai trò quản trị cơ sở dữ liệu phụ trách các hệ thống backend trọng yếu.',
    requirements: [
      'Hiểu biết cơ bản về SQL và các câu lệnh SELECT, INSERT, UPDATE',
      'Đã cài đặt PostgreSQL 15+ trên môi trường máy cá nhân'
    ],
    benefits: [
      'Khai thác thành thạo kiểu dữ liệu JSONB kết hợp dữ liệu quan hệ linh hoạt',
      'Viết các hàm PL/pgSQL xử lý tính toán phức tạp ngay tại tầng cơ sở dữ liệu',
      'Ứng dụng Materialized View giảm tải thời gian query từ vài giây xuống mili-giây',
      'Thiết lập ràng buộc toàn vẹn dữ liệu chặt chẽ qua Constraint và Triggers'
    ],
    techniques: ['PostgreSQL', 'PL/pgSQL', 'JSONB', 'Triggers', 'Materialized Views', 'MVCC'],
    documents: [
      'Tài liệu tra cứu nhanh các hàm thao tác JSONB và cú pháp PL/pgSQL',
      'Mã nguồn mẫu các Stored Procedure quản lý giao dịch và Audit Log'
    ]
  },
  {
    title: 'Làm Chủ MongoDB & NoSQL Cho Ứng Dụng Hiện Đại',
    slug: 'lam-chu-mongodb-nosql-cho-ung-dung-hien-dai',
    categorySlug: 'co-so-du-lieu-va-ky-thuat-du-lieu',
    level: CourseLevel.BEGINNER,
    price: 450000,
    oldPrice: 750000,
    leadSummary: 'Xây dựng và vận hành cơ sở dữ liệu tài liệu NoSQL với MongoDB, nắm vững kỹ thuật Schema Design linh hoạt và Aggregation Pipeline siêu việt.',
    industryContext: 'MongoDB là cơ sở dữ liệu NoSQL phổ biến nhất thế giới, lý tưởng cho các ứng dụng có cấu trúc dữ liệu biến đổi nhanh và yêu cầu mở rộng ngang.',
    coreTopics: [
      'So sánh mô hình Quan hệ SQL và NoSQL Document-Oriented: Khi nào nên chọn MongoDB',
      'Cú pháp CRUD nâng cao với MongoDB Query Language (MQL) và Compass GUI',
      'Kỹ thuật thiết kế Schema trong NoSQL: Nhúng (Embedding) vs Tham chiếu (Referencing)',
      'Làm chủ Aggregation Pipeline: $match, $group, $project, $lookup, $unwind và $facet',
      'Tạo Index tối ưu tìm kiếm: Compound Index, Text Index, TTL Index và Geospatial Index'
    ],
    handsOnProject: 'Hệ thống lưu trữ và phân tích dữ liệu mạng xã hội với bài viết, bình luận lồng nhau và tìm kiếm vị trí địa lý gần nhất.',
    targetAudience: 'Fullstack Developer, Backend Developer làm việc với Node.js / MERN stack hoặc ứng dụng di động.',
    careerApplication: 'Làm chủ hoàn toàn cơ sở dữ liệu tài liệu cho các hệ thống startup, thương mại điện tử và dịch vụ phân tán.',
    requirements: [
      'Kiến thức lập trình cơ bản và định dạng dữ liệu JSON/BSON',
      'Máy tính cá nhân cài đặt MongoDB Community Server hoặc tài khoản MongoDB Atlas'
    ],
    benefits: [
      'Thiết kế schema NoSQL tối ưu theo đặc thù truy vấn đọc/ghi của bài toán',
      'Thực hiện các phân tích thống kê đa chiều phức tạp với Aggregation Pipeline',
      'Tránh lỗi anti-pattern phổ biến gây phình to document quá giới hạn 16MB',
      'Kết nối và thao tác hiệu quả với MongoDB Driver và ODM Mongoose/Prisma'
    ],
    techniques: ['MongoDB', 'NoSQL', 'Aggregation Pipeline', 'BSON', 'Indexing', 'Mongoose'],
    documents: [
      'Sổ tay thiết kế Document Schema Patterns và Best Practices',
      'Bộ sưu tập 30 bài tập Aggregation Pipeline từ cơ bản đến phức tạp'
    ]
  },
  {
    title: 'Redis Siêu Tốc: Kỹ Thuật Caching, Distributed Locks & Message Broker',
    slug: 'redis-sieu-toc-ky-thuat-caching-distributed-locks-message-broker',
    categorySlug: 'co-so-du-lieu-va-ky-thuat-du-lieu',
    level: CourseLevel.BEGINNER,
    price: 399000,
    oldPrice: 650000,
    leadSummary: 'Tận dụng sức mạnh lưu trữ bộ nhớ In-Memory của Redis để bứt phá tốc độ ứng dụng web, xây dựng hệ thống khóa phân tán và hàng đợi xử lý.',
    industryContext: 'Hầu như tất cả các hệ thống chịu tải cao ngày nay đều đặt Redis phía trước database để giảm thiểu thời gian phản hồi xuống dưới 1 mili-giây.',
    coreTopics: [
      'Kiến trúc In-Memory của Redis và các cấu trúc dữ liệu cốt lõi: String, Hash, List, Set, Sorted Set',
      'Chiến lược Caching hiệu quả: Cache-Aside, Write-Through, Write-Back và xử lý Cache Stampede / Cache Avalanche',
      'Quản lý vòng đời dữ liệu: TTL, Eviction Policies (LRU, LFU, Random)',
      'Khóa phân tán (Distributed Lock) với Redlock và an toàn trong môi trường Multi-instance',
      'Hàng đợi tin nhắn và Real-time Messaging với Redis Pub/Sub và Redis Streams'
    ],
    handsOnProject: 'Xây dựng hệ thống bảng xếp hạng game trực tuyến theo thời gian thực (Real-time Leaderboard) với Sorted Sets phục vụ hàng triệu người chơi.',
    targetAudience: 'Backend Developer muốn tối ưu hóa hiệu năng hệ thống chịu tải lớn và giảm tải cho Database chính.',
    careerApplication: 'Trang bị kỹ năng giải quyết bài toán tải cao (High Concurrency), một tiêu chí then chốt trong phỏng vấn kỹ sư Senior.',
    requirements: [
      'Biết lập trình Backend với một trong các ngôn ngữ: JavaScript/TypeScript, Python, Java, Go',
      'Cơ bản hiểu về REST API và cơ sở dữ liệu quan hệ'
    ],
    benefits: [
      'Lựa chọn đúng cấu trúc dữ liệu Redis tối ưu bộ nhớ RAM cho từng bài toán',
      'Triển khai kiến trúc Caching phòng thủ chống sập hệ thống khi hàng vạn truy vấn đồng thời',
      'Sử dụng Redis Streams xây dựng Event Bus nội bộ mượt mà',
      'Bảo vệ tài nguyên dùng chung trong môi trường phân tán bằng Distributed Locks an toàn'
    ],
    techniques: ['Redis', 'In-Memory DB', 'Caching', 'PubSub', 'Redis Streams', 'Distributed Locks'],
    documents: [
      'Bản đồ cấu trúc dữ liệu Redis và ma trận so sánh độ phức tạp Big-O',
      'Template mã nguồn triển khai Cache Layer chuẩn cho ứng dụng Node.js/Go'
    ]
  },
  {
    title: 'Tối Ưu Hóa Truy Vấn SQL & Đánh Chỉ Mục Index Chuyên Sâu Trong RDBMS',
    slug: 'toi-uu-hoa-truy-van-sql-danh-chi-muc-index-chuyen-sau-trong-rdbms',
    categorySlug: 'co-so-du-lieu-va-ky-thuat-du-lieu',
    level: CourseLevel.INTERMEDIATE,
    price: 650000,
    oldPrice: 990000,
    leadSummary: 'Làm chủ kỹ thuật đọc hiểu Execution Plan (EXPLAIN ANALYZE), thiết kế chiến lược Index (B-Tree, Hash, GIN) và tối ưu truy vấn SQL chậm chạp.',
    industryContext: 'Hơn 80% sự cố hiệu năng trong các hệ thống phần mềm bắt nguồn từ việc truy vấn cơ sở dữ liệu không tối ưu và thiếu index phù hợp.',
    coreTopics: [
      'Mổ xẻ kế hoạch thực thi: Đọc hiểu và phân tích EXPLAIN và EXPLAIN (ANALYZE, BUFFERS)',
      'Phân biệt Seq Scan, Index Scan, Index Only Scan và Bitmap Index Scan',
      'Cấu trúc vật lý của B-Tree Index: Cơ chế phân nhánh, độ sâu và chi phí ghi khi cập nhật',
      'Các loại Index nâng cao: Composite Index, Partial Index, Expression Index và GIN/GiST',
      'Tối ưu hóa các truy vấn có SUBQUERY, EXISTS, IN, CTE (Common Table Expression) và Window Functions'
    ],
    handsOnProject: 'Khắc phục sự cố và tăng tốc truy vấn hệ thống thanh toán hàng trăm triệu bản ghi từ 15 giây xuống dưới 80 mili-giây.',
    targetAudience: 'Backend Developer, Database Administrator (DBA) có kinh nghiệm từ 1 năm muốn giải quyết triệt để nút thắt cổ chai về dữ liệu.',
    careerApplication: 'Trở thành chuyên gia giải quyết bài toán hiệu năng (Performance Tuning) được các công ty săn đón.',
    requirements: [
      'Nắm vững cú pháp SQL và có kinh nghiệm làm việc với PostgreSQL hoặc MySQL trong dự án thực tế',
      'Có kiến thức cơ bản về cấu trúc dữ liệu và giải thuật'
    ],
    benefits: [
      'Chẩn đoán nguyên nhân câu lệnh SQL chạy chậm trong tích tắc qua kế hoạch thực thi',
      'Thiết kế Index chính xác đáp ứng đúng thứ tự lọc và sắp xếp (Rule Leftmost Prefix)',
      'Biết cách viết lại truy vấn (Query Rewriting) để trình tối ưu hóa chọn đường đi tối ưu nhất',
      'Tiết kiệm chi phí phần cứng máy chủ cơ sở dữ liệu bằng cách tận dụng tài nguyên thông minh'
    ],
    techniques: ['Query Optimization', 'B-Tree Index', 'EXPLAIN ANALYZE', 'PostgreSQL Tuning', 'Performance Tuning'],
    documents: [
      'Cẩm nang đọc hiểu Execution Plan trong PostgreSQL và MySQL',
      'Bộ sưu tập 20 case study thực tế về tối ưu hóa truy vấn chậm'
    ]
  },
  {
    title: 'Phân Vùng Dữ Liệu (Partitioning) & Sharding Cho Cơ Sở Dữ Liệu Quy Mô Lớn',
    slug: 'phan-vung-du-lieu-partitioning-sharding-cho-co-so-du-lieu-quy-mo-lon',
    categorySlug: 'co-so-du-lieu-va-ky-thuat-du-lieu',
    level: CourseLevel.INTERMEDIATE,
    price: 750000,
    oldPrice: 1190000,
    leadSummary: 'Thiết kế chiến lược mở rộng cơ sở dữ liệu khi vượt ngưỡng hàng trăm Gigabyte và Terabyte thông qua Table Partitioning và Sharding phân tán.',
    industryContext: 'Khi dữ liệu tích lũy qua nhiều năm, việc duy trì một bảng đơn lẻ sẽ làm suy giảm nghiêm trọng hiệu năng đọc/ghi và công tác sao lưu dữ liệu.',
    coreTopics: [
      'Chiến lược phân vùng bảng (Table Partitioning): Range, List, Hash Partitioning trong PostgreSQL',
      'Cơ chế Partition Pruning giúp loại trừ các phân vùng không cần quét',
      'Quản lý vòng đời dữ liệu lịch sử (Data Archiving) bằng cách Detach phân vùng cũ sang kho lạnh',
      'Nguyên lý Sharding cơ sở dữ liệu: Chia nhỏ dữ liệu ngang sang nhiều máy chủ vật lý',
      'Giải quyết thách thức Sharding: Cross-shard Queries, Distributed Transactions và lựa chọn Shard Key'
    ],
    handsOnProject: 'Xây dựng kiến trúc phân vùng tự động theo tháng cho hệ thống nhật ký giao dịch ngân hàng với hàng tỷ dòng dữ liệu.',
    targetAudience: 'Senior Backend Engineer, Data Architect, System Engineer chuẩn bị đối mặt với bài toán dữ liệu lớn.',
    careerApplication: 'Nâng cao năng lực thiết kế cơ sở dữ liệu đáp ứng tiêu chuẩn Enterprise Scale.',
    requirements: [
      'Thành thạo cơ bản và nâng cao về PostgreSQL/MySQL',
      'Hiểu rõ các nguyên lý về chỉ mục và tối ưu hóa truy vấn'
    ],
    benefits: [
      'Triển khai thành công Table Partitioning tăng tốc truy vấn dữ liệu thời gian lên nhiều lần',
      'Quản lý và giải phóng dung lượng đĩa cứng hiệu quả mà không làm gián đoạn hệ thống',
      'Hiểu sâu các đánh đổi (Trade-offs) khi quyết định phân tách Sharding ngang',
      'Định hình chiến lược lưu trữ dữ liệu nhiều tầng (Hot/Warm/Cold Storage Tiering)'
    ],
    techniques: ['Partitioning', 'Sharding', 'PostgreSQL', 'High Availability', 'Data Archival', 'Scale-Out'],
    documents: [
      'Tài liệu hướng dẫn tự động tạo Partition bảng bằng pg_partman',
      'Kiến trúc mẫu so sánh giữa Table Partitioning nội bộ và Sharding bên ngoài'
    ]
  },
  {
    title: 'Xây Dựng Data Pipeline & ETL Với Python, Apache Airflow & Pandas',
    slug: 'xay-dung-data-pipeline-etl-voi-python-apache-airflow-pandas',
    categorySlug: 'co-so-du-lieu-va-ky-thuat-du-lieu',
    level: CourseLevel.INTERMEDIATE,
    price: 699000,
    oldPrice: 1050000,
    leadSummary: 'Thiết kế, xây dựng và lập lịch các đường ống thu thập và biến đổi dữ liệu tự động (ETL/ELT) với Python và hệ thống điều phối hàng đầu Apache Airflow.',
    industryContext: 'Dữ liệu thô phân tán tại nhiều nguồn khác nhau cần được làm sạch và hợp nhất liên tục để phục vụ các phòng ban ra quyết định kinh doanh.',
    coreTopics: [
      'Khái niệm cốt lõi của kỹ thuật dữ liệu: ETL (Extract, Transform, Load) vs ELT (Extract, Load, Transform)',
      'Trích xuất dữ liệu đa nguồn: REST API, SQL Databases, S3 Storage, CSV, JSON và Parquet',
      'Làm sạch và biến đổi dữ liệu với thư viện Pandas và Polars hiệu năng cao',
      'Kiến trúc Apache Airflow: DAG (Directed Acyclic Graph), Operators, Sensors, Hooks và XComs',
      'Xử lý lỗi đường ống: Retry logic, Dead Letter Queues, Alerting qua Slack và bảo đảm tính Idempotent'
    ],
    handsOnProject: 'Đường ống ETL hoàn chỉnh tự động thu thập tỷ giá và giá cổ phiếu hàng ngày, biến đổi chuẩn hóa và nạp vào Data Warehouse.',
    targetAudience: 'Software Engineer muốn chuyển hướng sang Data Engineering hoặc Data Analyst muốn tự động hóa công việc lấy dữ liệu.',
    careerApplication: 'Đáp ứng các yêu cầu cốt lõi của vị trí Data Engineer tại các công ty Fintech, E-commerce và tư vấn dữ liệu.',
    requirements: [
      'Khả năng lập trình Python cơ bản (hàm, vòng lặp, xử lý ngoại lệ, thư viện chuẩn)',
      'Hiểu biết cơ bản về cơ sở dữ liệu quan hệ và cú pháp SQL'
    ],
    benefits: [
      'Viết mã DAG trong Apache Airflow rõ ràng, chuẩn module và dễ bảo trì',
      'Đảm bảo đường ống dữ liệu có thể chạy lại an toàn bất kỳ lúc nào mà không trùng lặp dữ liệu',
      'Tự động hóa hoàn toàn quy trình báo cáo dữ liệu định kỳ cho doanh nghiệp',
      'Giám sát và nhận thông báo tức thời khi có sự cố phát sinh tại bất kỳ bước xử lý nào'
    ],
    techniques: ['Python', 'Apache Airflow', 'ETL', 'Pandas', 'Data Pipeline', 'Docker'],
    documents: [
      'Template dự án Apache Airflow chuẩn chạy trên Docker Compose',
      'Bộ checklist kiểm tra chất lượng dữ liệu trong quá trình biến đổi ETL'
    ]
  },
  {
    title: 'Kiến Trúc Dữ Liệu Data Warehouse Hiện Đại Với Snowflake & BigQuery',
    slug: 'kien-truc-du-lieu-data-warehouse-hien-dai-voi-snowflake-bigquery',
    categorySlug: 'co-so-du-lieu-va-ky-thuat-du-lieu',
    level: CourseLevel.INTERMEDIATE,
    price: 799000,
    oldPrice: 1250000,
    leadSummary: 'Làm chủ kiến trúc kho dữ liệu đám mây (Cloud Data Warehouse) hiện đại, ứng dụng mô hình Kimball Dimensional Modeling (Star/Snowflake Schema) và công cụ dbt.',
    industryContext: 'Các doanh nghiệp hiện đại đang dần loại bỏ kho dữ liệu tại chỗ (On-premise) cồng kềnh để chuyển sang Snowflake và Google BigQuery với chi phí tối ưu.',
    coreTopics: [
      'So sánh OLTP (Online Transaction Processing) vs OLAP (Online Analytical Processing)',
      'Lý thuyết mô hình hóa đa chiều Kimball: Fact Tables, Dimension Tables, Star Schema và Snowflake Schema',
      'Kiến trúc tách rời lưu trữ và tính toán (Separation of Storage & Compute) của Snowflake và BigQuery',
      'Sử dụng công cụ dbt (data build tool) để quản lý mô hình dữ liệu bằng mã nguồn SQL khai báo và kiểm thử tự động',
      'Quản lý dữ liệu thay đổi chậm SCD (Slowly Changing Dimensions) Type 1, Type 2 và Type 3'
    ],
    handsOnProject: 'Xây dựng Data Warehouse chuẩn hóa cho một chuỗi siêu thị bán lẻ kết hợp mô hình phân tích doanh số đa kênh.',
    targetAudience: 'Data Engineer, BI Developer, Data Architect và Analytics Engineer.',
    careerApplication: 'Làm chủ công nghệ Cloud Data Warehouse hàng đầu, nâng cao mức lương và cơ hội làm việc trong môi trường quốc tế.',
    requirements: [
      'Kinh nghiệm viết câu truy vấn SQL ở mức độ trung cấp trở lên',
      'Hiểu biết tổng quan về điện toán đám mây là một lợi thế'
    ],
    benefits: [
      'Thiết kế cấu trúc Fact và Dimension bảng chuẩn xác cho các bài toán phân tích kinh doanh',
      'Sử dụng dbt để xây dựng quy trình chuyển đổi ELT chuẩn hóa theo nguyên lý phần mềm',
      'Tối ưu chi phí lưu trữ và tính toán khi truy vấn hàng tỷ dòng dữ liệu trên BigQuery và Snowflake',
      'Triển khai kiểm thử tính toàn vẹn và cảnh báo dữ liệu sai lệch tự động'
    ],
    techniques: ['Snowflake', 'BigQuery', 'dbt', 'Data Warehouse', 'Kimball', 'Dimensional Modeling'],
    documents: [
      'Bản thiết kế mẫu Star Schema cho các ngành Bán lẻ, Tài chính và Giáo dục',
      'Hướng dẫn cấu hình dự án dbt từ đầu kết nối với Google BigQuery'
    ]
  },
  {
    title: 'Kỹ Thuật Dữ Liệu Thời Gian Thực Với Apache Kafka & Event Streaming',
    slug: 'ky-thuat-du-lieu-thoi-gian-thuc-voi-apache-kafka-event-streaming',
    categorySlug: 'co-so-du-lieu-va-ky-thuat-du-lieu',
    level: CourseLevel.INTERMEDIATE,
    price: 850000,
    oldPrice: 1390000,
    leadSummary: 'Xây dựng nền tảng xử lý dữ liệu dòng (Stream Processing) có độ trễ cực thấp và khả năng chịu tải hàng trăm nghìn thông điệp mỗi giây với Apache Kafka.',
    industryContext: 'Kafka là xương sống truyền thông dữ liệu thời gian thực của hầu hết các gã khổng lồ công nghệ như Uber, Netflix, LinkedIn và các hệ thống ngân hàng.',
    coreTopics: [
      'Kiến trúc phân tán của Kafka: Topics, Partitions, Brokers, Producers, Consumers và Consumer Groups',
      'Cơ chế phân vùng Partition, thứ tự thông điệp (Ordering Guarantees) và cân bằng tải Rebalancing',
      'Mức độ tin cậy và cam kết giao phát thông điệp: At-most-once, At-least-once và Exactly-once Semantics (EOS)',
      'Schema Registry và định dạng Apache Avro trong việc bảo đảm tiến hóa cấu trúc dữ liệu không gián đoạn',
      'Xử lý luồng dữ liệu thời gian thực cơ bản với Kafka Streams và ksqlDB'
    ],
    handsOnProject: 'Hệ thống phát hiện gian lận giao dịch thẻ tín dụng trực tuyến theo thời gian thực dựa trên luồng sự kiện từ Apache Kafka.',
    targetAudience: 'Backend Developer, Data Engineer muốn nâng cấp kỹ năng xử lý dữ liệu thời gian thực phân tán.',
    careerApplication: 'Tự tin giải quyết các bài toán kiến trúc hướng sự kiện (Event-Driven Architecture) quy mô lớn.',
    requirements: [
      'Hiểu rõ các nguyên tắc lập trình hướng đối tượng và giao tiếp mạng cơ bản',
      'Đã làm quen với một ngôn ngữ lập trình như Java, Python, Go hoặc TypeScript'
    ],
    benefits: [
      'Cài đặt và cấu hình cụm Kafka Cluster trên môi trường Docker an toàn',
      'Viết mã Producer/Consumer chịu lỗi cao, xử lý hiện tượng trễ thông điệp (Consumer Lag)',
      'Thiết kế cấu trúc Topic và Partition tối ưu cho bài toán tăng trưởng dữ liệu',
      'Xử lý các bài toán nghiệp vụ phức tạp đòi hỏi thông điệp được xử lý chính xác một lần'
    ],
    techniques: ['Apache Kafka', 'Event Streaming', 'Kafka Streams', 'Avro', 'Schema Registry', 'Zookeeper/KRaft'],
    documents: [
      'Sơ đồ kiến trúc nội bộ của Kafka Broker và cơ chế phân vùng',
      'Bộ mã nguồn mẫu Producer và Consumer xử lý lỗi nâng cao bằng Java và Python'
    ]
  },
  {
    title: 'Tìm Kiếm Dữ Liệu Toàn Văn & Phân Tích Log Với Elasticsearch & Kibana (ELK)',
    slug: 'tim-kiem-du-lieu-toan-van-phan-tich-log-voi-elasticsearch-kibana-elk',
    categorySlug: 'co-so-du-lieu-va-ky-thuat-du-lieu',
    level: CourseLevel.INTERMEDIATE,
    price: 599000,
    oldPrice: 899000,
    leadSummary: 'Khai thác công cụ tìm kiếm phân tán số một thế giới Elasticsearch để xây dựng tính năng tìm kiếm thông minh, tự động gợi ý và giám sát log tập trung.',
    industryContext: 'Elasticsearch cung cấp khả năng tìm kiếm Full-Text Search siêu tốc và phân tích hàng Terabyte dữ liệu nhật ký hệ thống gần như tức thời.',
    coreTopics: [
      'Nguyên lý Inverted Index và cơ chế phân tích từ vựng (Analyzers, Tokenizers, Token Filters)',
      'Thiết kế Index Mapping: Phân biệt kiểu text và keyword, cấu hình n-gram cho Autocomplete',
      'Cú pháp truy vấn Query DSL: Match Query, Multi-match, Bool Query, Fuzzy Query và Range Query',
      'Tính toán điểm số liên quan (Relevance Scoring) với thuật toán BM25 và tùy biến trọng số (Boosting)',
      'Thu thập và trực quan hóa dữ liệu nhật ký hệ thống với Logstash/Beats và Dashboard Kibana'
    ],
    handsOnProject: 'Xây dựng bộ máy tìm kiếm sản phẩm thương mại điện tử thông minh hỗ trợ gõ sai chính tả, gợi ý từ khóa và bộ lọc đa diện (Faceted Search).',
    targetAudience: 'Fullstack Developer, Backend Developer, DevOps Engineer và Data Analyst.',
    careerApplication: 'Làm chủ giải pháp tìm kiếm dữ liệu và giám sát hệ thống chuẩn doanh nghiệp.',
    requirements: [
      'Hiểu biết cơ bản về định dạng JSON và giao thức REST API',
      'Có kiến thức nền tảng về cơ sở dữ liệu quan hệ'
    ],
    benefits: [
      'Tự xây dựng tính năng tìm kiếm sản phẩm tốc độ cao, hỗ trợ tiếng Việt có dấu và không dấu',
      'Làm chủ thuật toán BM25 để tùy chỉnh độ ưu tiên kết quả tìm kiếm theo mong muốn kinh doanh',
      'Xây dựng các biểu đồ phân tích số liệu trực quan trên Kibana từ hàng triệu log giao dịch',
      'Cấu hình Shards và Replicas đảm bảo tính sẵn sàng cao và khả năng mở rộng cụm Elastic'
    ],
    techniques: ['Elasticsearch', 'Kibana', 'ELK Stack', 'Full-Text Search', 'BM25', 'Log Analysis'],
    documents: [
      'Cẩm nang tra cứu cú pháp Elasticsearch Query DSL thông dụng',
      'Cấu hình bộ phân tích tiếng Việt chuẩn (Vietnamese Analysis Plugin) cho Elasticsearch'
    ]
  },
  {
    title: 'GraphQL & Apollo Server: Tối Ưu Tầng Truy Vấn Dữ Liệu Hiện Đại',
    slug: 'graphql-apollo-server-toi-uu-tang-truy-van-du-lieu-hien-dai',
    categorySlug: 'co-so-du-lieu-va-ky-thuat-du-lieu',
    level: CourseLevel.INTERMEDIATE,
    price: 499000,
    oldPrice: 799000,
    leadSummary: 'Thay thế những hạn chế của REST API truyền thống bằng GraphQL, mang lại khả năng truy vấn dữ liệu chính xác, linh hoạt và tối ưu băng thông di động.',
    industryContext: 'GraphQL do Meta phát triển đã trở thành tiêu chuẩn vàng cho các hệ thống frontend phức tạp muốn lấy dữ liệu đúng những gì cần thiết.',
    coreTopics: [
      'So sánh chuyên sâu GraphQL vs REST API: Giải quyết bài toán Over-fetching và Under-fetching',
      'Định nghĩa GraphQL Schema (SDL): Types, Queries, Mutations và Subscriptions',
      'Xây dựng Resolver Functions và cơ chế xử lý dữ liệu phân cấp lồng nhau',
      'Giải quyết triệt để bài toán kinh điển N+1 Queries bằng thư viện DataLoader',
      'Xác thực quyền hạn (Authentication & Authorization) và giới hạn độ sâu truy vấn (Query Depth Limiting)'
    ],
    handsOnProject: 'Hệ thống GraphQL API hợp nhất dữ liệu từ nhiều microservices cho ứng dụng mạng xã hội có tính năng Chat thời gian thực với Subscription.',
    targetAudience: 'Backend và Frontend Developer muốn xây dựng lớp giao tiếp dữ liệu hiện đại, mượt mà.',
    careerApplication: 'Tự tin tham gia các dự án công nghệ lớn ứng dụng kiến trúc Federation GraphQL.',
    requirements: [
      'Kinh nghiệm lập trình Node.js và TypeScript cơ bản',
      'Đã từng xây dựng hoặc tiêu thụ các REST API trước đây'
    ],
    benefits: [
      'Thiết kế Schema GraphQL rõ ràng, kiểu dữ liệu an toàn và dễ mở rộng',
      'Triển khai DataLoader loại bỏ hoàn toàn các truy vấn trùng lặp vào cơ sở dữ liệu',
      'Bảo vệ GraphQL API khỏi các tấn công quá tải truy vấn sâu nguy hiểm',
      'Kết nối GraphQL Client (Apollo Client/URQL) ở frontend mượt mà'
    ],
    techniques: ['GraphQL', 'Apollo Server', 'DataLoader', 'TypeScript', 'API Design', 'Subscriptions'],
    documents: [
      'Sổ tay hướng dẫn thiết kế GraphQL Schema theo chuẩn Relay Specification',
      'Template dự án Apollo Server tích hợp Prisma ORM và DataLoader'
    ]
  },
  {
    title: 'Xử Lý Dữ Liệu Lớn Phân Tán Với Apache Spark & PySpark',
    slug: 'xu-ly-du-lieu-lon-phan-tan-voi-apache-spark-pyspark',
    categorySlug: 'co-so-du-lieu-va-ky-thuat-du-lieu',
    level: CourseLevel.ADVANCED,
    price: 990000,
    oldPrice: 1590000,
    leadSummary: 'Làm chủ khung tính toán phân tán trong bộ nhớ Apache Spark với ngôn ngữ Python (PySpark), xử lý hàng trăm Gigabyte và Terabyte dữ liệu song song.',
    industryContext: 'Apache Spark là tiêu chuẩn công nghiệp không thể thay thế cho các tác vụ tính toán dữ liệu lớn, phân tích dữ liệu quy mô cụm và huấn luyện mô hình học máy.',
    coreTopics: [
      'Kiến trúc phân tán của Spark: Driver, Executors, Cluster Manager, DAG Scheduler và Task Execution',
      'Mô hình trừu tượng hóa: So sánh RDD (Resilient Distributed Datasets) và Spark DataFrame/Dataset',
      'Các phép biến đổi Narrow vs Wide Transformations, hiện tượng Data Shuffling và cách tối ưu hóa',
      'Kỹ thuật phân vùng Partition Tuning, Broadcast Variables và Accumulators',
      'Lập trình phân tích dữ liệu với Spark SQL và đọc/ghi định dạng cột Apache Parquet, Delta Lake'
    ],
    handsOnProject: 'Xử lý và phân tích bộ dữ liệu hơn 100 triệu chuyến đi taxi tại thành phố New York, tính toán doanh thu và xu hướng giao thông theo thời gian thực.',
    targetAudience: 'Data Engineer, Data Scientist, Senior Software Engineer có định hướng phát triển trong lĩnh vực Big Data.',
    careerApplication: 'Mở ra cơ hội ứng tuyển vào các vị trí Big Data Engineer tại các công ty công nghệ đa quốc gia.',
    requirements: [
      'Nắm vững ngôn ngữ Python và cú pháp truy vấn SQL nâng cao',
      'Hiểu biết cơ bản về hệ điều hành Linux và hệ thống phân tán'
    ],
    benefits: [
      'Viết mã PySpark chuẩn hóa xử lý song song trên cụm máy tính',
      'Hiểu rõ cơ chế Data Shuffle để triệt tiêu các tác vụ chạy chậm bất thường (Straggler Tasks)',
      'Tối ưu hóa dung lượng lưu trữ và tốc độ truy vấn với định dạng Parquet nén Snappy',
      'Làm chủ công nghệ tính toán dữ liệu lớn tiên tiến hàng đầu thị trường'
    ],
    techniques: ['Apache Spark', 'PySpark', 'Big Data', 'Distributed Computing', 'Parquet', 'Delta Lake'],
    documents: [
      'Sổ tay tối ưu hóa cấu hình Spark Cluster cho môi trường sản xuất',
      'Bộ bài tập phân tích dữ liệu lớn trên Jupyter Notebook với PySpark'
    ]
  },
  {
    title: 'Xây Dựng Kho Dữ Liệu Mở Lakehouse Với Delta Lake & Apache Iceberg',
    slug: 'xay-dung-kho-du-lieu-mo-lakehouse-voi-delta-lake-apache-iceberg',
    categorySlug: 'co-so-du-lieu-va-ky-thuat-du-lieu',
    level: CourseLevel.ADVANCED,
    price: 1150000,
    oldPrice: 1790000,
    leadSummary: 'Tiếp cận kiến trúc dữ liệu hiện đại nhất Lakehouse: Kết hợp tính kinh tế của Data Lake với độ tin cậy giao dịch ACID của Data Warehouse qua Delta Lake và Apache Iceberg.',
    industryContext: 'Kiến trúc Lakehouse đang thay thế dần các kho dữ liệu đóng độc quyền, mang lại khả năng quản trị dữ liệu tập trung với định dạng bảng mở.',
    coreTopics: [
      'Sự tiến hóa từ Data Warehouse sang Data Lake và sự ra đời của kiến trúc Lakehouse',
      'Giao dịch ACID trên lưu trữ đám mây (S3/GCS): Cơ chế Transaction Log và Optimistic Concurrency Control',
      'Tính năng tua ngược thời gian (Time Travel) và kiểm toán thay đổi dữ liệu theo lịch sử',
      'Tối ưu hóa hiệu năng bảng: Z-Ordering, Data Skipping, Compaction và Vacuuming giải phóng bộ nhớ',
      'So sánh chuyên sâu Delta Lake, Apache Iceberg và Apache Hudi'
    ],
    handsOnProject: 'Xây dựng một kiến trúc Lakehouse hợp nhất dữ liệu cho hệ thống tài chính với khả năng rollback dữ liệu về bất kỳ thời điểm nào trong 30 ngày.',
    targetAudience: 'Data Architect, Lead Data Engineer, Senior Analytics Engineer chịu trách nhiệm thiết kế hạ tầng dữ liệu.',
    careerApplication: 'Trở thành kiến trúc sư dữ liệu đón đầu làn sóng công nghệ Lakehouse hiện đại.',
    requirements: [
      'Kinh nghiệm vững chắc về Apache Spark và hệ thống kho dữ liệu đám mây',
      'Hiểu biết sâu sắc về các nguyên lý giao dịch ACID và lưu trữ Object Storage'
    ],
    benefits: [
      'Thiết kế và triển khai kiến trúc lưu trữ dữ liệu mở độc lập với nhà cung cấp dịch vụ đám mây',
      'Ứng dụng tính năng Time Travel phục vụ việc gỡ lỗi dữ liệu và tuân thủ các quy định bảo mật',
      'Duy trì hiệu năng truy vấn ổn định bất chấp việc ghi dữ liệu liên tục nhờ kỹ thuật nén tệp tự động',
      'Định hình chiến lược kiến trúc dữ liệu dài hạn cho doanh nghiệp'
    ],
    techniques: ['Lakehouse', 'Delta Lake', 'Apache Iceberg', 'ACID on Object Storage', 'Time Travel', 'Data Lake'],
    documents: [
      'Kiến trúc tham chiếu Lakehouse cho doanh nghiệp trên AWS và GCP',
      'Mã nguồn kịch bản tối ưu hóa Compaction và Vacuuming định kỳ'
    ]
  },
  {
    title: 'Quản Trị Cơ Sở Dữ Liệu PostgreSQL Nâng Cao: Sẵn Sàng Cao (HA), Replication & Disaster Recovery',
    slug: 'quan-tri-co-so-du-lieu-postgresql-nang-cao-ha-replication-disaster-recovery',
    categorySlug: 'co-so-du-lieu-va-ky-thuat-du-lieu',
    level: CourseLevel.ADVANCED,
    price: 1250000,
    oldPrice: 1990000,
    leadSummary: 'Thiết kế và vận hành cụm cơ sở dữ liệu PostgreSQL chuẩn Enterprise: Streaming Replication, tự động chuyển đổi dự phòng với Patroni, sao lưu liên tục với pgBackRest.',
    industryContext: 'Bất kỳ phút giây ngừng hoạt động (Downtime) nào của cơ sở dữ liệu chính cũng gây thiệt hại hàng trăm triệu đồng cho doanh nghiệp.',
    coreTopics: [
      'Kiến trúc sao chép dữ liệu PostgreSQL: Physical Streaming Replication (Sync vs Async) và Logical Replication',
      'Quản lý Connection Pooling hiệu năng cao với PgBouncer: Cấu hình Transaction Mode và Session Mode',
      'Xây dựng cụm High Availability (HA) tự động Failover với Patroni, Etcd và HAProxy',
      'Chiến lược sao lưu và khôi phục thảm họa (Disaster Recovery): PITR (Point-In-Time Recovery) với pgBackRest',
      'Giám sát hiệu năng và cảnh báo sự cố: Thu thập chỉ số với pg_stat_activity, pg_stat_statements và Prometheus'
    ],
    handsOnProject: 'Triển khai cụm PostgreSQL 3 nodes có tính năng tự động chuyển đổi dự phòng trong vòng dưới 10 giây khi node Master gặp sự cố.',
    targetAudience: 'Senior DevOps, Database Administrator (DBA), Infrastructure Engineer và Backend Architect.',
    careerApplication: 'Đảm nhận trọng trách bảo vệ tính liên tục trong hoạt động của các hệ thống cơ sở dữ liệu ngân hàng, chứng khoán và thương mại.',
    requirements: [
      'Kinh nghiệm thực tế quản trị hệ thống Linux và cơ sở dữ liệu PostgreSQL',
      'Hiểu rõ về mạng máy tính, DNS và các nguyên tắc phân tán'
    ],
    benefits: [
      'Thiết lập cụm PostgreSQL có khả năng tự phục hồi mà không cần can thiệp thủ công',
      'Thực hiện Point-In-Time Recovery khôi phục dữ liệu chính xác đến từng giây trước thời điểm xảy ra sự cố',
      'Tối ưu hóa hàng nghìn kết nối đồng thời mà không làm kiệt quệ tài nguyên RAM của máy chủ',
      'Nắm vững các chỉ số giám sát quan trọng để phát hiện sớm các nguy cơ tắc nghẽn'
    ],
    techniques: ['PostgreSQL HA', 'Patroni', 'PgBouncer', 'pgBackRest', 'Replication', 'PITR', 'Disaster Recovery'],
    documents: [
      'Sách hướng dẫn quy trình ứng phó sự cố khẩn cấp (Runbook) cho cơ sở dữ liệu',
      'Bộ tệp cấu hình hoàn chỉnh cho Patroni, PgBouncer và pgBackRest trên Linux'
    ]
  },
  {
    title: 'Kỹ Thuật Phục Hồi Dữ Liệu & Bảo Mật Cơ Sở Dữ Liệu Chuẩn Quốc Tế',
    slug: 'ky-thuat-phuc-hoi-du-lieu-bao-mat-co-so-du-lieu-chuan-quoc-te',
    categorySlug: 'co-so-du-lieu-va-ky-thuat-du-lieu',
    level: CourseLevel.ADVANCED,
    price: 890000,
    oldPrice: 1450000,
    leadSummary: 'Bảo vệ tài sản dữ liệu quý giá của doanh nghiệp trước các cuộc tấn công mạng, tuân thủ các tiêu chuẩn bảo mật dữ liệu PCI-DSS, GDPR và mã hóa dữ liệu nhiều lớp.',
    industryContext: 'Rò rỉ dữ liệu khách hàng không chỉ dẫn đến các khoản phạt pháp lý khổng lồ mà còn hủy hoại hoàn toàn uy tín thương hiệu của doanh nghiệp.',
    coreTopics: [
      'Nguyên tắc đặc quyền tối thiểu (Principle of Least Privilege) và quản lý phân quyền theo vai trò RBAC trong RDBMS',
      'Mã hóa dữ liệu tại chỗ (Data at Rest) với Transparent Data Encryption (TDE) và mã hóa trên đường truyền (Data in Transit) với TLS/SSL',
      'Bảo mật dữ liệu nhạy cảm: Cơ chế phân quyền cấp dòng (Row-Level Security - RLS) và mặt nạ dữ liệu (Data Masking)',
      'Phòng chống và ngăn chặn triệt để tấn công SQL Injection ở tầng cơ sở dữ liệu',
      'Thiết lập hệ thống giám sát kiểm toán dữ liệu (Database Auditing) tuân thủ tiêu chuẩn an ninh quốc tế'
    ],
    handsOnProject: 'Cấu hình hệ thống cơ sở dữ liệu y tế bảo mật toàn diện với Row-Level Security, mã hóa cột dữ liệu nhạy cảm và ghi log kiểm toán không thể sửa đổi.',
    targetAudience: 'Security Engineer, Senior Backend Developer, Database Administrator và Compliance Officer.',
    careerApplication: 'Trở thành chuyên gia an toàn thông tin chuyên biệt cho tầng dữ liệu doanh nghiệp.',
    requirements: [
      'Có kiến thức chuyên sâu về cơ sở dữ liệu quan hệ và quản trị hệ điều hành',
      'Hiểu biết cơ bản về mật mã học và bảo mật mạng'
    ],
    benefits: [
      'Triển khai Row-Level Security bảo vệ dữ liệu giữa các tổ chức khách hàng trong mô hình Multi-tenant',
      'Mã hóa các thông tin nhạy cảm (số thẻ tín dụng, số căn cước, mật khẩu) an toàn tuyệt đối',
      'Xây dựng nhật ký kiểm toán không thể bị giả mạo ghi nhận mọi hành vi truy cập dữ liệu',
      'Đạt được sự tuân thủ các chứng chỉ an toàn thông tin khắt khe của ngành tài chính'
    ],
    techniques: ['Database Security', 'Row-Level Security', 'Data Encryption', 'PCI-DSS', 'Audit Logging', 'RBAC'],
    documents: [
      'Checklist 40 điểm đánh giá an toàn bảo mật cơ sở dữ liệu chuẩn CIS Benchmark',
      'Mẫu chính sách phân quyền dữ liệu và cấu hình Row-Level Security mẫu'
    ]
  }
]
