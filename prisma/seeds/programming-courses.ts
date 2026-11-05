import { CourseLevel } from '@prisma/client'
import { CourseRawDef } from './web-courses'

export const PROGRAMMING_COURSES: CourseRawDef[] = [
  // 1-15: Core Languages (Python, Go, Java, Rust, C++, .NET)
  {
    title: 'Lập Trình Python Từ Số 0 Đến Chuyên Gia: Tư Duy Lập Trình Hiện Đại',
    slug: 'lap-trinh-python-tu-so-0-den-chuyen-gia-tu-duy-hien-dai',
    desc: 'Khóa học nền tảng toàn diện nhất về Python: kiểu dữ liệu, hàm, lập trình hướng đối tượng OOP, decorators, generators và xử lý ngoại lệ.',
    techs: ['Python', 'OOP', 'Data Structures', 'Problem Solving'],
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0
  },
  {
    title: 'Python Nâng Cao: Lập Trình Bất Đồng Bộ Asyncio và Concurrency',
    slug: 'python-nang-cao-lap-trinh-bat-dong-bo-asyncio-va-concurrency',
    desc: 'Làm chủ đa luồng (multithreading), đa tiến trình (multiprocessing) và lập trình async/await hiệu năng cao trên Python.',
    techs: ['Python', 'Asyncio', 'Multiprocessing', 'GIL Internals'],
    level: CourseLevel.ADVANCED,
    price: 399000,
    oldPrice: 599000
  },
  {
    title: 'Lập Trình Golang (Go): Xây Dựng Backend Microservices Hiệu Năng Cao',
    slug: 'lap-trinh-golang-go-xay-dung-backend-microservices-hieu-nang-cao',
    desc: 'Tận dụng sức mạnh Goroutines, Channels, Interfaces và cú pháp tinh gọn của Go để xây dựng hệ thống chịu tải hàng triệu request.',
    techs: ['Go', 'Golang', 'Goroutines', 'Microservices', 'gRPC'],
    level: CourseLevel.INTERMEDIATE,
    price: 499000,
    oldPrice: 750000
  },
  {
    title: 'Go Toàn Tập: Từ Cú Pháp Cơ Bản Đến Xây Dựng REST API Với Gin Framework',
    slug: 'go-toan-tap-tu-cu-phap-co-ban-den-rest-api-gin-framework',
    desc: 'Nhập môn ngôn ngữ lập trình của các kỹ sư Google: cấu trúc dữ liệu, xử lý lỗi chuẩn Go và dựng Web API siêu tốc với Gin.',
    techs: ['Go', 'Gin Framework', 'REST API', 'PostgreSQL'],
    level: CourseLevel.BEGINNER,
    price: 249000,
    oldPrice: 350000
  },
  {
    title: 'Java Core Chuyên Sâu: Nền Tảng Vững Chắc Cho Kỹ Sư Phần Mềm',
    slug: 'java-core-chuyen-sau-nen-tang-vung-chac-cho-ky-su-phan-mem',
    desc: 'Làm chủ Java: Collections Framework, Generics, Stream API, Lambda expressions, JVM memory model và Garbage Collection.',
    techs: ['Java', 'JVM', 'Collections', 'Stream API', 'OOP'],
    level: CourseLevel.BEGINNER,
    price: 299000,
    oldPrice: 420000
  },
  {
    title: 'Spring Boot 3 Enterprise: Phát Triển Dịch Vụ Backend Doanh Nghiệp',
    slug: 'spring-boot-3-enterprise-phat-trien-dich-vu-backend-doanh-nghiep',
    desc: 'Chuẩn công nghiệp cho các tập đoàn lớn: Spring Data JPA, Spring Security 6 với OAuth2, Flyway migration và Spring Cloud.',
    techs: ['Spring Boot 3', 'Java', 'Spring Security', 'Hibernate'],
    level: CourseLevel.ADVANCED,
    price: 699000,
    oldPrice: 999000
  },
  {
    title: 'Lập Trình Rust Cơ Bản: Ngôn Ngữ An Toàn Bộ Nhớ Thế Hệ Mới',
    slug: 'lap-trinh-rust-co-ban-ngon-ngu-an-toan-bo-nho-the-he-moi',
    desc: 'Khám phá khái niệm độc đáo của Rust: Ownership, Borrowing, Lifetimes và hệ thống type system mạnh mẽ ngăn chặn hoàn toàn lỗi null pointer.',
    techs: ['Rust', 'Cargo', 'Memory Safety', 'Systems Programming'],
    level: CourseLevel.INTERMEDIATE,
    price: 349000,
    oldPrice: 499000
  },
  {
    title: 'Rust Chuyên Sâu: Lập Trình Hệ Thống và Xử Lý Mạng Với Tokio',
    slug: 'rust-chuyen-sau-lap-trinh-he-thong-va-xu-ly-mang-voi-tokio',
    desc: 'Ứng dụng Rust trong thực tế: async runtime Tokio, Axum framework, FFI giao tiếp C và tối ưu hóa zero-cost abstractions.',
    techs: ['Rust', 'Tokio', 'Axum', 'Async Rust'],
    level: CourseLevel.ADVANCED,
    price: 599000,
    oldPrice: 850000
  },
  {
    title: 'Lập Trình C++ Hiện Đại (Modern C++ 20): Nền Tảng Kỹ Thuật Máy Tính',
    slug: 'lap-trinh-c-plus-plus-hien-dai-modern-cpp-20-nen-tang-ky-thuat',
    desc: 'Từ C++ cơ bản đến C++20: con trỏ thông minh (Smart Pointers), Move Semantics, Concepts, Ranges và lập trình mẫu Templates.',
    techs: ['C++', 'Modern C++20', 'STL', 'Memory Management'],
    level: CourseLevel.INTERMEDIATE,
    price: 399000,
    oldPrice: 550000
  },
  {
    title: 'Lập Trình C Cơ Bản: Nhập Môn Khoa Học Máy Tính Cho Người Mới Bắt Đầu',
    slug: 'lap-trinh-c-co-ban-nhap-mon-khoa-hoc-may-tinh',
    desc: 'Ngôn ngữ mẹ của mọi lập trình viên: hiểu rõ bản chất máy tính, cấu trúc bộ nhớ, con trỏ (pointers) và thuật toán cơ bản.',
    techs: ['C Language', 'Computer Science Basics', 'Pointers', 'Algorithms'],
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0
  },
  {
    title: 'Lập Trình C# và .NET 8: Xây Dựng Ứng Dụng Đa Nền Tảng',
    slug: 'lap-trinh-c-sharp-va-dotnet-8-xay-dung-ung-dung-da-nen-tang',
    desc: 'Hệ sinh thái Microsoft hiện đại: Entity Framework Core, ASP.NET Core Web API, Minimal APIs, Blazor và triển khai cross-platform.',
    techs: ['C#', '.NET 8', 'ASP.NET Core', 'EF Core'],
    level: CourseLevel.INTERMEDIATE,
    price: 449000,
    oldPrice: 650000
  },
  {
    title: 'Kotlin Toàn Tập: Ngôn Ngữ Hiện Đại Cho Backend và Lập Trình Android',
    slug: 'kotlin-toan-tap-ngon-ngu-hien-dai-cho-backend-va-android',
    desc: 'Tận hưởng cú pháp gọn gàng: Coroutines, Flow, Null Safety tuyệt đối, Extension functions và tích hợp hoàn hảo với Java.',
    techs: ['Kotlin', 'Coroutines', 'Android', 'Ktor'],
    level: CourseLevel.INTERMEDIATE,
    price: 349000,
    oldPrice: 480000
  },
  {
    title: 'Swift và SwiftUI: Lập Trình Ứng Dụng iOS Cho iPhone và iPad',
    slug: 'swift-va-swiftui-lap-trinh-ung-dung-ios-cho-iphone-va-ipad',
    desc: 'Khóa học làm app Apple đỉnh cao: declarative UI với SwiftUI, Combine framework, Swift Concurrency và đưa app lên App Store.',
    techs: ['Swift', 'SwiftUI', 'iOS Development', 'Xcode'],
    level: CourseLevel.INTERMEDIATE,
    price: 549000,
    oldPrice: 799000
  },
  {
    title: 'Lập Trình Hướng Đối Tượng (OOP) Thực Chiến: 4 Trụ Cột và Nguyên Lý SOLID',
    slug: 'lap-trinh-huong-doi-tuong-oop-thuc-chien-solid',
    desc: 'Chuyển hóa tư duy code: Đóng gói, Kế thừa, Đa hình, Trừu tượng hóa và ứng dụng triệt để SOLID để code không bao giờ lỗi thời.',
    techs: ['OOP', 'SOLID Principles', 'Clean Code', 'Software Design'],
    level: CourseLevel.BEGINNER,
    price: 199000,
    oldPrice: 299000
  },
  {
    title: 'Lập Trình Hàm (Functional Programming) Với JavaScript và TypeScript',
    slug: 'lap-trinh-ham-functional-programming-voi-javascript-typescript',
    desc: 'Tư duy lập trình không tác dụng phụ (Pure Functions): Immutability, Currying, Monads, Functors và xử lý dữ liệu thanh lịch.',
    techs: ['Functional Programming', 'TypeScript', 'Ramda', 'FP-TS'],
    level: CourseLevel.ADVANCED,
    price: 299000,
    oldPrice: 420000
  },

  // 16-30: Algorithms, Data Structures & Problem Solving
  {
    title: 'Cấu Trúc Dữ Liệu và Giải Thuật Kinh Điển Bằng Java và C++',
    slug: 'cau-truc-du-lieu-va-giai-thuat-kinh-dien-bang-java-va-cpp',
    desc: 'Trang bị nền tảng thuật toán cốt lõi: Array, Linked List, Stack, Queue, Tree, Heap, Graph và độ phức tạp thời gian Big-O.',
    techs: ['Algorithms', 'Data Structures', 'Big-O', 'Recursion'],
    level: CourseLevel.BEGINNER,
    price: 249000,
    oldPrice: 350000
  },
  {
    title: 'Chinh Phục Phỏng Vấn Thuật Toán LeetCode (LeetCode 75 Roadmap)',
    slug: 'chinh-phuc-phong-van-thuat-toan-leetcode-75-roadmap',
    desc: 'Luyện tập 75 bài toán kinh điển nhất thường xuất hiện tại FAANG/Big Tech: Two Pointers, Sliding Window, Binary Search và DFS/BFS.',
    techs: ['LeetCode', 'Interview Prep', 'Problem Solving', 'Data Structures'],
    level: CourseLevel.INTERMEDIATE,
    price: 399000,
    oldPrice: 599000
  },
  {
    title: 'Quy Hoạch Động (Dynamic Programming) Toàn Tập: Từ Số 0 Đến Bậc Thầy',
    slug: 'quy-hoach-dong-dynamic-programming-toan-tap',
    desc: 'Bẻ khóa dạng thuật toán hóc búa nhất: Memorization, Tabulation, Knapsack problem, Longest Common Subsequence và bài toán ma trận.',
    techs: ['Dynamic Programming', 'Algorithms', 'Optimization', 'Math'],
    level: CourseLevel.ADVANCED,
    price: 349000,
    oldPrice: 499000
  },
  {
    title: 'Thuật Toán Đồ Thị (Graph Algorithms) Chuyên Sâu: DFS, BFS, Dijkstra và A*',
    slug: 'thuat-toan-do-thi-graph-algorithms-chuyen-sau',
    desc: 'Ứng dụng tìm đường đi ngắn nhất, bản đồ số, phân tích mạng lưới kết nối xã hội, Topological Sort và thuật toán Kruskal.',
    techs: ['Graph Theory', 'Dijkstra', 'A-Star', 'Shortest Path'],
    level: CourseLevel.ADVANCED,
    price: 299000,
    oldPrice: 420000
  },
  {
    title: 'Giải Thuật Cho Người Mới Bắt Đầu: Rèn Luyện Tư Duy Lập Trình',
    slug: 'giai-thuat-cho-nguoi-moi-bat-dau-ren-luyen-tu-duy',
    desc: 'Bước đệm nhẹ nhàng không khô khan: thuật toán sắp xếp (Bubble, Merge, Quick Sort), tìm kiếm nhị phân và đệ quy trực quan.',
    techs: ['Sorting', 'Searching', 'Basic Algorithms', 'Logic'],
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0
  },
  {
    title: 'Lập Trình Thi Đấu (Competitive Programming) Chuyên Nghiệp',
    slug: 'lap-trinh-thi-dau-competitive-programming-chuyen-nghiep',
    desc: 'Bí kíp thi đấu Codeforces, ICPC: bit manipulation, number theory, Fenwick Tree, Segment Tree và giải bài tốc độ dưới áp lực thời gian.',
    techs: ['Segment Tree', 'Number Theory', 'Codeforces', 'Competitive Programming'],
    level: CourseLevel.ADVANCED,
    price: 449000,
    oldPrice: 650000
  },
  {
    title: 'Giải Thuật Nén Dữ Liệu và Mã Hóa: Huffman, LZW và AES',
    slug: 'giai-thuat-nen-du-lieu-va-ma-hoa-huffman-lzw-aes',
    desc: 'Tìm hiểu cách các tệp ZIP và hệ thống bảo mật hoạt động: mã hóa cây Huffman, giải thuật LZW và nguyên lý mật mã học hiện đại.',
    techs: ['Compression', 'Cryptography', 'Huffman Coding', 'Information Theory'],
    level: CourseLevel.INTERMEDIATE,
    price: 249000,
    oldPrice: 350000
  },
  {
    title: 'Thuật Toán Chuỗi Ký Tự Nâng Cao: KMP, Trie, Suffix Array và Aho-Corasick',
    slug: 'thuat-toan-chuoi-ky-tu-nang-cao-kmp-trie-suffix-array',
    desc: 'Xây dựng công cụ tìm kiếm văn bản siêu tốc: auto-complete với Trie, so khớp mẫu chuỗi hàng triệu ký tự không trễ nhịp.',
    techs: ['String Algorithms', 'Trie', 'Pattern Matching', 'KMP Algorithm'],
    level: CourseLevel.ADVANCED,
    price: 299000,
    oldPrice: 420000
  },
  {
    title: 'Tối Ưu Hóa Bộ Nhớ và Thuật Toán Xử Lý Dữ Liệu Lớn Trên RAM',
    slug: 'toi-uu-hoa-bo-nho-va-thuat-toan-xu-ly-du-lieu-lon-tren-ram',
    desc: 'Kỹ thuật cache-friendly, data-oriented design, tránh cache misses cấp CPU L1/L2/L3 để thuật toán chạy nhanh gấp 10 lần.',
    techs: ['CPU Cache', 'Memory Optimization', 'Low-level Coding', 'Performance'],
    level: CourseLevel.ADVANCED,
    price: 399000,
    oldPrice: 550000
  },
  {
    title: 'Thuật Toán Xác Suất và Cấu Trúc Dữ Liệu Randomized: Bloom Filter và HyperLogLog',
    slug: 'thuat-toan-xac-suat-bloom-filter-va-hyperloglog',
    desc: 'Vũ khí bí mật của Big Data: kiểm tra tồn tại với Bloom Filter siêu nhỏ, đếm số phần tử duy nhất hàng tỷ record với HyperLogLog.',
    techs: ['Bloom Filter', 'Probabilistic Data Structures', 'Big Data Algorithms'],
    level: CourseLevel.ADVANCED,
    price: 349000,
    oldPrice: 499000
  },
  {
    title: 'Thuật Toán Nhánh Cận và Quay Lui (Backtracking) Giải Bài Toán N-Queens và Sudoku',
    slug: 'thuat-toan-nhanh-can-va-quay-lui-backtracking',
    desc: 'Phương pháp duyệt không gian trạng thái thông minh: tỉa nhánh vô hiệu, giải đố Sudoku, bài toán mã đi tuần và xếp hậu.',
    techs: ['Backtracking', 'Branch and Bound', 'Recursion', 'Puzzle Solving'],
    level: CourseLevel.INTERMEDIATE,
    price: 199000,
    oldPrice: 280000
  },
  {
    title: 'Thuật Toán Tham Lam (Greedy Algorithms) và Ứng Dụng Tối Ưu Thực Tế',
    slug: 'thuat-toan-tham-lam-greedy-algorithms-va-ung-dung',
    desc: 'Ra quyết định tối ưu cục bộ: bài toán đổi tiền xu, lập lịch công việc, cây khung nhỏ nhất Prim và Kruskal.',
    techs: ['Greedy Algorithms', 'Optimization', 'Activity Selection', 'MST'],
    level: CourseLevel.BEGINNER,
    price: 149000,
    oldPrice: 220000
  },
  {
    title: 'Thực Hành Giải 50 Bài Toán Phỏng Vấn Kỹ Thuật Với Python',
    slug: 'thuc-hanh-giai-50-bai-toan-phong-van-ky-thuat-python',
    desc: 'Khóa luyện đề thực dụng: viết mã nguồn sạch, tối ưu thời gian và không gian bộ nhớ bằng các thư viện chuẩn của Python.',
    techs: ['Python', 'Interview Questions', 'Algorithms', 'Data Structures'],
    level: CourseLevel.INTERMEDIATE,
    price: 249000,
    oldPrice: 350000
  },
  {
    title: 'Toán Rời Rạc Dành Cho Lập Trình Viên: Logic, Tập Hợp và Xác Suất',
    slug: 'toan-roi-rac-danh-cho-lap-trinh-vien-logic-tap-hop',
    desc: 'Bổ sung nền tảng toán học máy tính: đại số Boole, quy nạp toán học, tổ hợp chỉnh hợp và ứng dụng trực tiếp trong code.',
    techs: ['Discrete Math', 'Logic', 'Boolean Algebra', 'Combinatorics'],
    level: CourseLevel.BEGINNER,
    price: 149000,
    oldPrice: 220000
  },
  {
    title: 'Thuật Toán Song Song (Parallel Algorithms) và Tính Toán Đa Lõi',
    slug: 'thuat-toan-song-song-parallel-algorithms-tinh-toan-da-loi',
    desc: 'Chia để trị trên hệ thống đa CPU: Fork-Join framework, parallel merge sort, xử lý mảng song song không bị race condition.',
    techs: ['Parallel Computing', 'Multithreading', 'Fork-Join', 'Algorithms'],
    level: CourseLevel.ADVANCED,
    price: 399000,
    oldPrice: 550000
  },

  // 31-45: Database, SQL & Storage Systems
  {
    title: 'PostgreSQL Nâng Cao: Tối Ưu Truy Vấn, Indexing và Quản Trị Hệ Thống',
    slug: 'postgresql-nang-cao-toi-uu-truy-van-indexing-quan-tri',
    desc: 'Trở thành chuyên gia cơ sở dữ liệu quan hệ số 1: phân tích EXPLAIN ANALYZE, B-Tree/GIN/GiST index, partitioning và vacuum tuning.',
    techs: ['PostgreSQL', 'Query Optimization', 'Indexes', 'Database Tuning'],
    level: CourseLevel.ADVANCED,
    price: 549000,
    oldPrice: 799000
  },
  {
    title: 'SQL Cơ Bản Đến Nâng Cao: Viết Truy Vấn Dữ Liệu Chuyên Nghiệp',
    slug: 'sql-co-ban-den-nang-cao-viet-truy-van-chuyen-nghiep',
    desc: 'Khóa học SQL đầy đủ nhất: SELECT, JOIN phức tạp, GROUP BY, Subqueries, Common Table Expressions (CTE) và Window Functions.',
    techs: ['SQL', 'Relational Databases', 'Window Functions', 'Queries'],
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0
  },
  {
    title: 'Thiết Kế Cơ Sở Dữ Liệu Quan Hệ Chuẩn Hóa và Mô Hình Dữ Liệu ERD',
    slug: 'thiet-ke-co-so-du-lieu-quan-he-chuan-hoa-erd',
    desc: 'Tránh hoàn toàn bẫy thiết kế: dạng chuẩn 1NF, 2NF, 3NF, BCNF, quan hệ khóa ngoại, tính toàn vẹn dữ liệu ACID và phi chuẩn hóa.',
    techs: ['Database Design', 'ERD', 'Normalization', 'Data Modeling'],
    level: CourseLevel.BEGINNER,
    price: 199000,
    oldPrice: 299000
  },
  {
    title: 'Làm Chủ Redis: Từ Caching Đến Message Queue và Distributed Locks',
    slug: 'lam-chu-redis-tu-caching-den-message-queue-distributed-locks',
    desc: 'Tận dụng toàn bộ cấu trúc dữ liệu in-memory: Strings, Hashes, Lists, Sets, Sorted Sets, Streams, Pub/Sub và Redlock an toàn.',
    techs: ['Redis', 'In-Memory DB', 'Distributed Locks', 'Cache'],
    level: CourseLevel.INTERMEDIATE,
    price: 349000,
    oldPrice: 499000
  },
  {
    title: 'MongoDB Toàn Tập: Cơ Sở Dữ Liệu NoSQL Cho Ứng Dụng Quy Mô Hiện Đại',
    slug: 'mongodb-toan-tap-co-so-du-lieu-nosql-hien-dai',
    desc: 'Làm việc với cấu trúc tài liệu BSON: Aggregation Framework chuyên sâu, Indexing, Sharding và Replica Sets đảm bảo dữ liệu luôn sẵn sàng.',
    techs: ['MongoDB', 'NoSQL', 'Aggregation', 'Replica Sets'],
    level: CourseLevel.INTERMEDIATE,
    price: 299000,
    oldPrice: 420000
  },
  {
    title: 'Giao Dịch Cơ Sở Dữ Liệu (Database Transactions) và Các Cấp Độ Isolation',
    slug: 'giao-dich-co-so-du-lieu-database-transactions-isolation-levels',
    desc: 'Giải quyết triệt để lỗi xung đột dữ liệu: Dirty Read, Non-repeatable Read, Phantom Read, khóa bi quan (Pessimistic) và lạc quan (Optimistic).',
    techs: ['ACID', 'Transactions', 'Concurrency Control', 'Deadlocks'],
    level: CourseLevel.ADVANCED,
    price: 399000,
    oldPrice: 550000
  },
  {
    title: 'Xây Dựng Hệ Thống Sharding và Phân Mảnh Dữ Liệu Quy Mô Hàng Tỷ Bản Ghi',
    slug: 'xay-dung-he-thong-sharding-phan-manh-du-lieu-hang-ty-ban-ghi',
    desc: 'Khi một máy chủ database quá tải: chiến lược Shard Key, Consistent Hashing, định tuyến truy vấn và quản lý migrations.',
    techs: ['Database Sharding', 'Distributed Data', 'High Availability', 'Architecture'],
    level: CourseLevel.ADVANCED,
    price: 699000,
    oldPrice: 999000
  },
  {
    title: 'MySQL 8 Quản Trị và Hiệu Năng: Cẩm Nang Vận Hành Production',
    slug: 'mysql-8-quan-tri-va-hieu-nang-cam-nang-production',
    desc: 'Cơ sở dữ liệu phổ biến nhất thế giới: InnoDB storage engine, buffer pool sizing, sao lưu nóng với Percona XtraBackup và sao chép replication.',
    techs: ['MySQL 8', 'InnoDB', 'Replication', 'DB Administration'],
    level: CourseLevel.INTERMEDIATE,
    price: 349000,
    oldPrice: 499000
  },
  {
    title: 'Cơ Sở Dữ Liệu Đồ Thị Neo4j: Phân Tích Mạng Xã Hội và Gian Lận Tài Chính',
    slug: 'co-so-du-lieu-do-thi-neo4j-phan-tich-mang-xa-hoi',
    desc: 'Lưu trữ mối quan hệ tự nhiên: ngôn ngữ truy vấn Cypher, duyệt quan hệ nghìn bậc trong mili-giây và biểu diễn tri thức đồ thị.',
    techs: ['Neo4j', 'Graph Database', 'Cypher Query', 'Knowledge Graphs'],
    level: CourseLevel.ADVANCED,
    price: 449000,
    oldPrice: 650000
  },
  {
    title: 'Cơ Sở Dữ Liệu Thời Gian (Time-Series Database) Với TimescaleDB và InfluxDB',
    slug: 'co-so-du-lieu-thoi-gian-timescaledb-va-influxdb',
    desc: 'Xử lý dữ liệu IoT và tài chính theo nhịp thời gian: nén dữ liệu thời gian 90%, rolling aggregations và phân tích xu hướng.',
    techs: ['TimescaleDB', 'InfluxDB', 'Time-series Data', 'IoT Storage'],
    level: CourseLevel.INTERMEDIATE,
    price: 349000,
    oldPrice: 480000
  },
  {
    title: 'Elasticsearch Toàn Tập: Xây Dựng Công Cụ Tìm Kiếm Toàn Văn (Full-Text Search)',
    slug: 'elasticsearch-toan-tap-xay-dung-tim-kiem-toan-van',
    desc: 'Công cụ tìm kiếm số 1 thế giới: Tokenizers, Analyzers, Inverted Index, Fuzzy search gợi ý từ khóa và tích hợp Kibana hiển thị log.',
    techs: ['Elasticsearch', 'ELK Stack', 'Full-Text Search', 'Inverted Index'],
    level: CourseLevel.INTERMEDIATE,
    price: 499000,
    oldPrice: 699000
  },
  {
    title: 'SQLite Nội Bộ: Tìm Hiểu Kiến Trúc Cơ Sở Dữ Liệu Nhúng Nhẹ Nhất Hành Tinh',
    slug: 'sqlite-noi-bo-kien-truc-co-so-du-lieu-nhung',
    desc: 'Khám phá bí mật đằng sau phần mềm được cài đặt nhiều nhất lịch sử: B-Tree pager, WAL (Write-Ahead Logging) và nhúng vào C/Python.',
    techs: ['SQLite', 'Embedded Database', 'WAL Mode', 'File Storage'],
    level: CourseLevel.INTERMEDIATE,
    price: 199000,
    oldPrice: 299000
  },
  {
    title: 'Kiểm Soát Phiên Bản Schema Dữ Liệu Tự Động Với Liquibase và Flyway',
    slug: 'kiem-soat-phien-ban-schema-du-lieu-voi-liquibase-va-flyway',
    desc: 'Không bao giờ phải chạy SQL script bằng tay trên production: versioned migrations, rollback tự động và tích hợp CI/CD.',
    techs: ['Flyway', 'Liquibase', 'Schema Migrations', 'DevOps DB'],
    level: CourseLevel.BEGINNER,
    price: 149000,
    oldPrice: 220000
  },
  {
    title: 'Cơ Sở Dữ Liệu Vector (Vector Databases): Qdrant, Pinecone và Milvus Cho AI',
    slug: 'co-so-du-lieu-vector-qdrant-pinecone-milvus-cho-ai',
    desc: 'Lưu trữ và tìm kiếm tương đồng ngữ nghĩa: HNSW algorithm, Approximate Nearest Neighbors (ANN), tích hợp embeddings cho LLM RAG.',
    techs: ['Vector DB', 'Qdrant', 'Pinecone', 'Embeddings', 'ANN Search'],
    level: CourseLevel.ADVANCED,
    price: 499000,
    oldPrice: 699000
  },
  {
    title: 'Sao Lưu, Phục Hồi Dữ Liệu và Kế Hoạch Ứng Phó Thảm Họa (Disaster Recovery)',
    slug: 'sao-luu-phuc-hoi-du-lieu-va-ke-hoach-ung-pho-tham-hoa',
    desc: 'Bảo vệ tài sản sống còn của công ty: Point-in-time Recovery (PITR), kiểm thử kịch bản khôi phục, RPO và RTO chuẩn SLA doanh nghiệp.',
    techs: ['Disaster Recovery', 'Database Backup', 'PITR', 'High Availability'],
    level: CourseLevel.INTERMEDIATE,
    price: 299000,
    oldPrice: 420000
  },

  // 46-60: DevOps, Cloud, Containers & Infrastructure
  {
    title: 'Docker và Docker Compose Thực Chiến Cho Kỹ Sư Phần Mềm',
    slug: 'docker-va-docker-compose-thuc-chien-cho-ky-su-phan-mem',
    desc: 'Đóng gói ứng dụng chuẩn công nghiệp: images, containers, networks, volumes, multi-stage build và tối ưu kích thước image dưới 50MB.',
    techs: ['Docker', 'Docker Compose', 'Container', 'Microservices'],
    level: CourseLevel.BEGINNER,
    price: 249000,
    oldPrice: 350000
  },
  {
    title: 'Kubernetes (K8s) Toàn Tập: Điều Phối Container Cho Hệ Thống Lớn',
    slug: 'kubernetes-k8s-toan-tap-dieu-phoi-container-he-thong-lon',
    desc: 'Làm chủ K8s: Pods, Deployments, Services, Ingress, ConfigMaps, Helm Charts và cơ chế tự động mở rộng Pods (HPA).',
    techs: ['Kubernetes', 'K8s', 'Helm', 'Container Orchestration'],
    level: CourseLevel.ADVANCED,
    price: 699000,
    oldPrice: 999000
  },
  {
    title: 'Làm Quen Với Điện Toán Đám Mây AWS Cho Người Mới Bắt Đầu',
    slug: 'lam-quen-voi-dien-toan-dam-may-aws-cho-nguoi-moi-bat-dau',
    desc: 'Khởi đầu với dịch vụ đám mây số 1 thế giới: EC2 máy chủ ảo, S3 lưu trữ tệp, RDS cơ sở dữ liệu, IAM phân quyền và VPC mạng riêng.',
    techs: ['AWS', 'Cloud Computing', 'EC2', 'S3', 'IAM'],
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0
  },
  {
    title: 'Kiến Trúc Sư Giải Pháp AWS (AWS Certified Solutions Architect Associate)',
    slug: 'kien-truc-su-giai-phap-aws-certified-solutions-architect',
    desc: 'Thiết kế hệ thống chịu lỗi cao trên AWS: Auto Scaling, Elastic Load Balancer, Route 53, CloudFront và bảo mật tối đa theo chuẩn Well-Architected.',
    techs: ['AWS Architect', 'Cloud Architecture', 'Auto Scaling', 'VPC'],
    level: CourseLevel.ADVANCED,
    price: 799000,
    oldPrice: 1199000
  },
  {
    title: 'Linux Dòng Lệnh và Shell Scripting (Bash) Từ Cơ Bản Đến Tự Động Hóa',
    slug: 'linux-dong-lenh-va-shell-scripting-bash-tu-dong-hoa',
    desc: 'Làm chủ hệ điều hành máy chủ thế giới: quản lý tiến trình, phân quyền tệp tin SSH, cron jobs, awk, sed và viết script tự động.',
    techs: ['Linux', 'Bash Script', 'Ubuntu Server', 'Command Line'],
    level: CourseLevel.BEGINNER,
    price: 199000,
    oldPrice: 280000
  },
  {
    title: 'Hạ Tầng Dưới Dạng Mã Nguồn (Infrastructure as Code - IaC) Với Terraform',
    slug: 'ha-tang-duoi-dang-ma-nguon-iac-voi-terraform',
    desc: 'Quản lý toàn bộ hạ tầng AWS, GCP bằng code: HCL syntax, modules tái sử dụng, quản lý file state an toàn và tự động hóa với CI/CD.',
    techs: ['Terraform', 'IaC', 'Cloud Automation', 'DevOps'],
    level: CourseLevel.INTERMEDIATE,
    price: 449000,
    oldPrice: 650000
  },
  {
    title: 'Giám Sát Hệ Thống Toàn Diện Với Prometheus và Grafana',
    slug: 'giam-sat-he-thong-toan-dien-voi-prometheus-va-grafana',
    desc: 'Thu thập số liệu đo lường (metrics), thiết kế bảng hiển thị Grafana đẹp mắt, cảnh báo Alertmanager qua Telegram và email.',
    techs: ['Prometheus', 'Grafana', 'Alertmanager', 'Monitoring'],
    level: CourseLevel.INTERMEDIATE,
    price: 349000,
    oldPrice: 480000
  },
  {
    title: 'CI/CD Pipeline Thực Chiến Với GitLab CI và GitHub Actions',
    slug: 'ci-cd-pipeline-thuc-chien-voi-gitlab-ci-va-github-actions',
    desc: 'Xây dựng đường ống vận chuyển code tự động: build test, quét lỗ hổng bảo mật SAST/DAST và deploy Zero-Downtime lên K8s.',
    techs: ['GitLab CI', 'GitHub Actions', 'CI/CD', 'Automated Deploy'],
    level: CourseLevel.INTERMEDIATE,
    price: 399000,
    oldPrice: 550000
  },
  {
    title: 'Làm Chủ Ansible: Quản Lý Cấu Hình và Triển Khai Hàng Trăm Máy Chủ',
    slug: 'lam-chu-ansible-quan-ly-cau-hinh-hang-tram-may-chu',
    desc: 'Tự động hóa không cần cài agent: viết Playbooks, Roles, bảo mật mật khẩu bằng Ansible Vault và điều khiển đồng loạt hệ thống.',
    techs: ['Ansible', 'Configuration Management', 'Automation', 'DevOps'],
    level: CourseLevel.INTERMEDIATE,
    price: 299000,
    oldPrice: 420000
  },
  {
    title: 'Serverless Toàn Tập: AWS Lambda, API Gateway và DynamoDB',
    slug: 'serverless-toan-tap-aws-lambda-api-gateway-dynamodb',
    desc: 'Xây dựng ứng dụng không cần quản lý máy chủ: tính phí theo mili-giây sử dụng, xử lý sự kiện Event-Driven và framework Serverless.',
    techs: ['AWS Lambda', 'Serverless', 'DynamoDB', 'Cloud Functions'],
    level: CourseLevel.INTERMEDIATE,
    price: 399000,
    oldPrice: 550000
  },
  {
    title: 'Bảo Mật Hệ Thống và An Toàn Mạng (DevSecOps) Trong Pipeline Hiện Đại',
    slug: 'bao-mat-he-thong-va-an-toan-mang-devsecops',
    desc: 'Đưa bảo mật vào từng giai đoạn phát triển: quét mã nguồn SonarQube, quét lỗ hổng container Trivy, quản lý secrets với HashiCorp Vault.',
    techs: ['DevSecOps', 'Trivy', 'SonarQube', 'Security Automation'],
    level: CourseLevel.ADVANCED,
    price: 499000,
    oldPrice: 720000
  },
  {
    title: 'Google Cloud Platform (GCP) Toàn Tập: GKE, Cloud Run và BigQuery',
    slug: 'google-cloud-platform-gcp-toan-tap-cloud-run',
    desc: 'Làm quen hệ sinh thái của Google: triển khai container trong 10 giây với Cloud Run, lưu trữ dữ liệu lớn với BigQuery.',
    techs: ['Google Cloud', 'GCP', 'Cloud Run', 'GKE'],
    level: CourseLevel.INTERMEDIATE,
    price: 399000,
    oldPrice: 550000
  },
  {
    title: 'Xây Dựng Service Mesh Với Istio Trong Cụm Kubernetes',
    slug: 'xay-dung-service-mesh-voi-istio-trong-kubernetes',
    desc: 'Kiểm soát giao tiếp giữa các vi dịch vụ: mTLS mã hóa lưu lượng, Canary deployments, Circuit Breaking và distributed tracing.',
    techs: ['Istio', 'Service Mesh', 'Kubernetes', 'Traffic Management'],
    level: CourseLevel.ADVANCED,
    price: 549000,
    oldPrice: 799000
  },
  {
    title: 'Thu Thập và Phân Tích Log Tập Trung Với Grafana Loki và Vector',
    slug: 'thu-thap-va-phan-tich-log-tap-trung-grafana-loki',
    desc: 'Giải pháp thay thế ELK stack siêu nhẹ: cấu hình Fluentbit/Vector đẩy log, truy vấn nhanh bằng LogQL trực tiếp trên Grafana.',
    techs: ['Loki', 'Log Management', 'Vector', 'Grafana'],
    level: CourseLevel.INTERMEDIATE,
    price: 249000,
    oldPrice: 350000
  },
  {
    title: 'Quản Trị Mạng Máy Tính (Computer Networking) Cho Kỹ Sư DevOps và Backend',
    slug: 'quan-tri-mang-may-tinh-networking-cho-ky-su',
    desc: 'Hiểu rõ nền tảng truyền thông Internet: mô hình OSI/TCP-IP, DNS, DHCP, NAT, Subnetting, TCP 3-way handshake và TLS handshake.',
    techs: ['Networking', 'TCP/IP', 'DNS', 'Subnetting', 'Protocols'],
    level: CourseLevel.BEGINNER,
    price: 199000,
    oldPrice: 280000
  },

  // 61-75: Software Architecture, Clean Code & System Design
  {
    title: 'Thiết Kế Hệ Thống Quy Mô Lớn (System Design Masterclass)',
    slug: 'thiet-ke-he-thong-quy-mo-lon-system-design-masterclass',
    desc: 'Bí kíp phỏng vấn và xây dựng hệ thống triệu người dùng: Load Balancer, Caching, Sharding, Message Queue, CAP Theorem và kiến trúc Twitter/Uber.',
    techs: ['System Design', 'Scalability', 'Distributed Systems', 'Architecture'],
    level: CourseLevel.ADVANCED,
    price: 899000,
    oldPrice: 1299000
  },
  {
    title: 'Clean Architecture và Domain-Driven Design (DDD) Trong Dự Án Thực Tế',
    slug: 'clean-architecture-va-domain-driven-design-ddd-thuc-te',
    desc: 'Tổ chức mã nguồn không bị thối rữa theo thời gian: Ubiquitous Language, Bounded Context, Entities, Value Objects, Aggregates và Use Cases.',
    techs: ['Clean Architecture', 'DDD', 'Domain Modeling', 'Enterprise Design'],
    level: CourseLevel.ADVANCED,
    price: 649000,
    oldPrice: 899000
  },
  {
    title: 'Mẫu Thiết Kế Phần Mềm (Design Patterns) Kinh Điển Gang of Four (GoF)',
    slug: 'mau-thiet-ke-phan-mem-design-patterns-kinh-dien-gof',
    desc: '23 mẫu thiết kế cốt lõi: Singleton, Factory, Observer, Strategy, Decorator, Adapter và cách áp dụng chuẩn xác trong code hiện đại.',
    techs: ['Design Patterns', 'GoF', 'Refactoring', 'Architecture'],
    level: CourseLevel.INTERMEDIATE,
    price: 299000,
    oldPrice: 420000
  },
  {
    title: 'Lập Trình Hướng Kiểm Thử (Test-Driven Development - TDD) Thực Chiến',
    slug: 'lap-trinh-huong-kiem-thu-test-driven-development-tdd',
    desc: 'Vòng lặp Red - Green - Refactor: viết test trước khi viết code, Unit testing, Mocking và xây dựng phần mềm không có lỗi phát sinh.',
    techs: ['TDD', 'Unit Testing', 'Refactoring', 'Clean Code'],
    level: CourseLevel.INTERMEDIATE,
    price: 249000,
    oldPrice: 350000
  },
  {
    title: 'Clean Code: Nghệ Thuật Viết Mã Nguồn Đẹp, Trong Sáng và Dễ Bảo Trì',
    slug: 'clean-code-nghe-thuat-viet-ma-nguon-dep-trong-sang',
    desc: 'Thói quen của lập trình viên xuất sắc: đặt tên biến có nghĩa, hàm ngắn gọn đơn trách nhiệm, xử lý lỗi gọn gàng và xóa sổ comment thừa.',
    techs: ['Clean Code', 'Best Practices', 'Refactoring', 'Software Quality'],
    level: CourseLevel.BEGINNER,
    price: 149000,
    oldPrice: 220000
  },
  {
    title: 'Kiến Trúc Hướng Sự Kiện (Event-Driven Architecture) Với Apache Kafka',
    slug: 'kien-truc-huong-su-kien-event-driven-architecture-kafka',
    desc: 'Xử lý luồng sự kiện thời gian thực: Kafka Topics, Partitions, Consumer Groups, Event Sourcing và CQRS Pattern cho hệ thống thanh toán.',
    techs: ['Apache Kafka', 'Event Driven', 'CQRS', 'Event Sourcing'],
    level: CourseLevel.ADVANCED,
    price: 749000,
    oldPrice: 1099000
  },
  {
    title: 'Bảo Trì và Hiện Đại Hóa Mã Nguồn Kế Thừa (Working with Legacy Code)',
    slug: 'bao-tri-va-hien-dai-hoa-ma-nguon-ke-thua-legacy-code',
    desc: 'Chiến thuật đối mặt với codebase phức tạp không có test: kỹ thuật Seam, Sprout method, Wrap method và strangler fig pattern di chuyển an toàn.',
    techs: ['Legacy Code', 'Refactoring', 'Strangler Pattern', 'Software Maintenance'],
    level: CourseLevel.INTERMEDIATE,
    price: 299000,
    oldPrice: 420000
  },
  {
    title: 'Xây Dựng Hệ Thống Phân Tán Bền Vững: Circuit Breaker và Retry Pattern',
    slug: 'xay-dung-he-thong-phan-tan-ben-vung-circuit-breaker',
    desc: 'Chống sụp đổ dây chuyền khi có sự cố mạng: Bulkhead pattern, Rate limiter token bucket, Exponential Backoff và Dead Letter Queue.',
    techs: ['Resilience', 'Circuit Breaker', 'Fault Tolerance', 'Distributed Systems'],
    level: CourseLevel.ADVANCED,
    price: 499000,
    oldPrice: 699000
  },
  {
    title: 'Kiến Trúc Microservices: Chiến Lược Phân Tách Database và Quản Lý Transaction Saga',
    slug: 'kien-truc-microservices-chien-luoc-phan-tach-database-saga',
    desc: 'Giải quyết bài toán toàn vẹn dữ liệu đa cơ sở dữ liệu: Choreography vs Orchestration Saga, hai pha commit 2PC và outbox pattern.',
    techs: ['Saga Pattern', 'Microservices', 'Transactional Outbox', 'Distributed DB'],
    level: CourseLevel.ADVANCED,
    price: 649000,
    oldPrice: 899000
  },
  {
    title: 'Thiết Kế API Chuẩn Doanh Nghiệp: REST, gRPC, WebSocket và GraphQL So Sánh',
    slug: 'thiet-ke-api-chuan-doanh-nghiep-rest-grpc-websocket',
    desc: 'Lựa chọn công nghệ giao tiếp phù hợp cho từng bài toán: Protocol Buffers tốc độ cao cho microservices, WebSocket cho realtime.',
    techs: ['API Design', 'gRPC', 'Protobuf', 'REST vs GraphQL'],
    level: CourseLevel.INTERMEDIATE,
    price: 349000,
    oldPrice: 480000
  },
  {
    title: 'Peer-to-Peer (P2P) và Giao Thức Mạng Phân Tán: WebRTC và BitTorrent',
    slug: 'peer-to-peer-p2p-va-giao-thuc-phan-tan-webrtc-bittorrent',
    desc: 'Giao tiếp trực tiếp không qua server trung gian: NAT Traversal, STUN/TURN/ICE, DHT Kademlia và truyền phát dữ liệu phi tập trung.',
    techs: ['WebRTC', 'P2P', 'BitTorrent', 'Distributed Protocols'],
    level: CourseLevel.ADVANCED,
    price: 499000,
    oldPrice: 699000
  },
  {
    title: 'Quy Trình Phát Triển Phần Mềm Linh Hoạt Agile và Scrum Cho Lập Trình Viên',
    slug: 'quy-trinh-phat-trien-phan-mem-agile-va-scrum',
    desc: 'Hòa nhập nhanh chóng vào môi trường làm việc thực tế: Sprint planning, Daily standup, Story points ước lượng và Retro cải tiến.',
    techs: ['Agile', 'Scrum', 'Jira', 'Sprint Planning', 'Teamwork'],
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0
  },
  {
    title: 'Kỹ Thuật Code Review Chuyên Nghiệp: Nâng Cao Chất Lượng Mã Nguồn Toàn Team',
    slug: 'ky-thuat-code-review-chuyen-nghiep-nang-cao-chat-luong',
    desc: 'Cách nhận xét code văn minh và hiệu quả: phát hiện lỗi tiềm ẩn, bảo vệ chuẩn mực chung và phát triển năng lực cho đồng nghiệp.',
    techs: ['Code Review', 'Engineering Culture', 'Best Practices', 'Collaboration'],
    level: CourseLevel.BEGINNER,
    price: 99000,
    oldPrice: 150000
  },
  {
    title: 'Viết Tài Liệu Kỹ Thuật (Technical Writing) Cho Developers và Kiến Trúc Sư',
    slug: 'viet-tai-lieu-ky-thuat-technical-writing-cho-developers',
    desc: 'Truyền tải ý tưởng rõ ràng: Architecture Decision Records (ADR), biểu đồ C4 Model trực quan, RFC đề xuất tính năng và tài liệu API.',
    techs: ['Technical Writing', 'ADR', 'C4 Model', 'Documentation'],
    level: CourseLevel.BEGINNER,
    price: 149000,
    oldPrice: 220000
  },
  {
    title: 'Phân Tích Đo Lường Hiệu Năng Ứng Dụng (Profiling & Benchmarking)',
    slug: 'phan-tich-do-luong-hieu-nang-ung-dung-profiling-benchmarking',
    desc: 'Tìm nút thắt cổ chai (bottlenecks): Flame graphs, CPU profiling, phân tích rò rỉ bộ nhớ (Memory leaks) và đo đạc chuẩn khoa học.',
    techs: ['Profiling', 'Flame Graphs', 'Benchmarking', 'Performance Analysis'],
    level: CourseLevel.ADVANCED,
    price: 399000,
    oldPrice: 550000
  },

  // 76-90: Mobile, Embedded & Special Topics
  {
    title: 'Flutter Toàn Tập: Phát Triển Ứng Dụng Di Động Đa Nền Tảng Cho iOS và Android',
    slug: 'flutter-toan-tap-phat-trien-ung-dung-di-dong-da-nen-tang',
    desc: 'Một mã nguồn cho mọi nền tảng: ngôn ngữ Dart, Widget tree, BLoC pattern, tích hợp Camera, GPS và đẩy app lên CH Play/App Store.',
    techs: ['Flutter', 'Dart', 'BLoC Pattern', 'Mobile App'],
    level: CourseLevel.BEGINNER,
    price: 399000,
    oldPrice: 599000
  },
  {
    title: 'Flutter Nâng Cao: Tối Ưu Hiệu Năng và Xây Dựng Custom Canvas Animation',
    slug: 'flutter-nang-cao-toi-uu-hieu-nang-custom-canvas-animation',
    desc: 'Làm chủ CustomPainter, shader effects, profiling 120 FPS mượt mà và viết plugin giao tiếp với mã nguồn gốc Java/Swift (Platform Channels).',
    techs: ['Flutter Advanced', 'CustomPainter', 'Platform Channels', 'Performance'],
    level: CourseLevel.ADVANCED,
    price: 499000,
    oldPrice: 720000
  },
  {
    title: 'Lập Trình Android Hiện Đại Với Jetpack Compose và Kotlin',
    slug: 'lap-trinh-android-hien-dai-jetpack-compose-kotlin',
    desc: 'Giao diện khai báo tương lai của Android: Compose UI, ViewModel, Hilt dependency injection, Room database và Coroutines.',
    techs: ['Android', 'Jetpack Compose', 'Kotlin', 'MVVM'],
    level: CourseLevel.INTERMEDIATE,
    price: 449000,
    oldPrice: 650000
  },
  {
    title: 'Lập Trình iOS Thực Chiến: Xây Dựng Ứng Dụng Đọc Tin Tức Với Swift 6',
    slug: 'lap-trinh-ios-thuc-chien-ung-dung-doc-tin-tuc-swift-6',
    desc: 'Làm quen chuẩn mới nhất của hệ điều hành iOS: Async/Await Swift Concurrency, CoreData lưu offline và widget màn hình khóa.',
    techs: ['Swift 6', 'iOS App', 'CoreData', 'Xcode'],
    level: CourseLevel.INTERMEDIATE,
    price: 399000,
    oldPrice: 550000
  },
  {
    title: 'Lập Trình Hệ Thống Nhúng (Embedded C) Cho Vi Điều Khiển STM32',
    slug: 'lap-trinh-he-thong-nhung-embedded-c-stm32',
    desc: 'Lập trình phần cứng thực thụ: GPIO, Timers, UART, I2C, SPI, Interrupts, thanh ghi vi điều khiển ARM Cortex-M và FreeRTOS.',
    techs: ['Embedded C', 'STM32', 'ARM Cortex', 'FreeRTOS'],
    level: CourseLevel.INTERMEDIATE,
    price: 499000,
    oldPrice: 750000
  },
  {
    title: 'Nhập Môn Internet of Things (IoT) Với Arduino và ESP32',
    slug: 'nhap-mon-internet-of-things-iot-voi-arduino-va-esp32',
    desc: 'Tự tay làm nhà thông minh: kết nối Wi-Fi, đọc cảm biến nhiệt độ/độ ẩm, điều khiển thiết bị qua MQTT và ứng dụng điện thoại.',
    techs: ['Arduino', 'ESP32', 'IoT', 'MQTT Protocol'],
    level: CourseLevel.BEGINNER,
    price: 249000,
    oldPrice: 350000
  },
  {
    title: 'Lập Trình Ứng Dụng Máy Tính (Desktop App) Đa Nền Tảng Với Tauri và Rust',
    slug: 'lap-trinh-ung-dung-may-tinh-tauri-va-rust',
    desc: 'Thay thế Electron siêu tốn RAM: tạo app desktop cho Windows/macOS/Linux với dung lượng dưới 5MB và tiêu thụ bộ nhớ cực thấp.',
    techs: ['Tauri', 'Rust', 'Web Frontend', 'Desktop App'],
    level: CourseLevel.INTERMEDIATE,
    price: 349000,
    oldPrice: 480000
  },
  {
    title: 'Lập Trình Game 2D Với Unity và C# Cho Người Mới Bắt Đầu',
    slug: 'lap-trinh-game-2d-voi-unity-va-c-sharp-cho-nguoi-moi',
    desc: 'Tự làm game đầu tay: vật lý 2D, nhân vật di chuyển nhảy né tránh, âm thanh, particle effects và xuất bản game lên web/PC.',
    techs: ['Unity', 'C#', 'Game Development', '2D Physics'],
    level: CourseLevel.BEGINNER,
    price: 299000,
    oldPrice: 420000
  },
  {
    title: 'Lập Trình Game 3D Với Godot Engine 4 Mã Nguồn Mở',
    slug: 'lap-trinh-game-3d-voi-godot-engine-4-ma-nguon-mo',
    desc: 'Khám phá công cụ làm game hot nhất hiện nay: GDScript, Node system, ánh sáng 3D, physics ragdoll và không mất phí bản quyền.',
    techs: ['Godot 4', 'GDScript', '3D Game', 'Game Engine'],
    level: CourseLevel.INTERMEDIATE,
    price: 349000,
    oldPrice: 499000
  },
  {
    title: 'Bảo Mật Phần Mềm và Đảo Ngược Mã Nguồn (Reverse Engineering Cơ Bản)',
    slug: 'bao-mat-phan-mem-dao-nguoc-ma-nguon-reverse-engineering',
    desc: 'Hiểu cách tin tặc bẻ khóa phần mềm: hợp ngữ x86/x64 assembly, dịch ngược bằng Ghidra, debug động với x64dbg và bảo vệ ứng dụng.',
    techs: ['Reverse Engineering', 'Assembly x86', 'Ghidra', 'Software Security'],
    level: CourseLevel.ADVANCED,
    price: 549000,
    oldPrice: 799000
  },
  {
    title: 'Nhập Môn Mật Mã Học Ứng Dụng (Applied Cryptography) Cho Lập Trình Viên',
    slug: 'nhap-mon-mat-ma-hoc-ung-dung-applied-cryptography',
    desc: 'Mã hóa đối xứng AES, bất đối xứng RSA/ECC, hàm băm SHA-256, chữ ký số và trao đổi khóa Diffie-Hellman không sai sót.',
    techs: ['Cryptography', 'RSA', 'AES', 'Public Key Infrastructure'],
    level: CourseLevel.INTERMEDIATE,
    price: 299000,
    oldPrice: 420000
  },
  {
    title: 'Xây Dựng Trình Thông Dịch (Interpreter) và Ngôn Ngữ Lập Trình Riêng',
    slug: 'xay-dung-trinh-thong-dich-interpreter-ngon-ngu-rieng',
    desc: 'Tự làm một ngôn ngữ lập trình: Lexer tách từ, Parser tạo Abstract Syntax Tree (AST), Evaluator thực thi code từng bước.',
    techs: ['Compilers', 'AST', 'Lexer', 'Language Design'],
    level: CourseLevel.ADVANCED,
    price: 499000,
    oldPrice: 699000
  },
  {
    title: 'Tự Động Hóa Kiểm Thử Phần Mềm (QA Automation) Với Robot Framework và Python',
    slug: 'tu-dong-hoa-kiem-thu-phan-mem-robot-framework-python',
    desc: 'Kiểm thử hướng từ khóa (Keyword-Driven): tự động hóa test web, API, database và xuất báo cáo kết quả chi tiết cho dự án.',
    techs: ['QA Automation', 'Robot Framework', 'Python', 'Software Testing'],
    level: CourseLevel.BEGINNER,
    price: 249000,
    oldPrice: 350000
  },
  {
    title: 'Lập Trình Tính Toán Song Song Trên GPU Với CUDA và C++',
    slug: 'lap-trinh-tinh-toan-song-song-gpu-cuda-cpp',
    desc: 'Tận dụng hàng nghìn nhân GPU NVIDIA: kiến trúc CUDA, quản lý shared memory, tối ưu hóa kernel cho tính toán ma trận siêu tốc.',
    techs: ['CUDA', 'GPU Programming', 'Parallel Computing', 'C++'],
    level: CourseLevel.ADVANCED,
    price: 699000,
    oldPrice: 999000
  },
  {
    title: 'Lộ Trình Trở Thành Kỹ Sư Phần Mềm Chuyên Nghiệp: Định Hướng Nghề Nghiệp',
    slug: 'lo-trinh-tro-thanh-ky-su-phan-mem-chuyen-nghiep',
    desc: 'Chiến lược phát triển sự nghiệp: chọn nhánh chuyên sâu, xây dựng CV ấn tượng, đàm phán lương và tư duy giải quyết vấn đề.',
    techs: ['Career Roadmap', 'Software Engineering', 'Soft Skills', 'Mentorship'],
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0
  }
]
