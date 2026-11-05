# DATA-02 — MULTI-DOMAIN CATEGORY & COURSE SEED IMPLEMENTATION PLAN

- **Project**: TMdemy E-Learning Platform (`e-learning_server`)
- **Document Type**: Implementation-Ready Technical Plan for `DATA-02`
- **Status**: **PROPOSAL — AWAITING USER APPROVAL (DO NOT EXECUTE IN DATA-01)**
- **Companion Audit Report**: [DATA_01_CATEGORY_COURSE_DATASET_AUDIT_REPORT.md](file:///d:/e-learning-project/e-learning_server/docs/progress/DATA_01_CATEGORY_COURSE_DATASET_AUDIT_REPORT.md)

---

## 1. Overview & Objectives

This document provides the complete, implementation-ready engineering specification for **DATA-02**, which expands the TMdemy PostgreSQL (`tmdemy`) catalog from a 4-category IT-only dataset (**378 existing courses**) into a **20-category multi-domain learning platform** (**648 total courses** = 378 existing + **270 new courses**).

### Core Engineering Guarantees
1. **Zero Destructive Operations**: No existing categories, courses, chapters, lessons, users, enrollments, orders, or ratings are deleted, reset, or overwritten.
2. **100% Schema Freeze Compliance**: Uses the exact physical columns in `prisma/schema.prisma` (`Category` and `Course` models) and validates all records against `src/models/category.model.ts` and `src/models/course.model.ts`.
3. **Strict Teacher Eligibility**: Assigns all 270 new courses exclusively to the **3 verified, active `TEACHER` accounts** (`teacher02`, `teacher_cntt`, `giaovientrungquoc`)—**90 courses each**—using a reproducible, category-stratified seeded PRNG shuffle.
4. **Recommendation-Grade Metadata**: Eliminates the 1-sentence descriptions and identical `requirements`/`benefits` boilerplate found in the legacy 360-course seed. Every new course includes a **250–400 word multi-paragraph Vietnamese description**, **4–6 observable learning outcomes (`benefits`)**, **2–4 level-calibrated prerequisites (`requirements`)**, **4–7 domain skill tags (`techniques`)**, and **2–3 domain-authentic deliverables (`documents`)**.

---

## 2. Exact Proposed Category List (16 New + 4 Retained Core = 20 Categories)

### 2.1 Deterministic Category UUIDv5 Generation
All 16 new categories use deterministic RFC 4122 UUIDv5 IDs derived from the project's seed namespace (`SEED_COURSE_NAMESPACE = '7b2a6f84-1d3e-4b95-a8c2-3e5f7a9d1b0c'`) with key format `seed-category:<slug>`.

### 2.2 Complete Category Specification Table

| Cat Code | Display Name (`name`) | Unique Slug (`slug`) | Main Domain | Vietnamese Description (`<= 200` chars) | Existing Courses | Target New Courses | Final Courses | Priority |
| :---: | :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| `CAT-01` | **Lập trình web** *(Existing)* | `lap-trinh-web` | Technology | Danh mục các khoá học lập trình web | 95 | **0** | **95** | Retained |
| `CAT-02` | **Lập trình** *(Existing)* | `lap-trinh` | Technology | Danh mục các khóa học về lập trình web | 94 | **0** | **94** | Retained |
| `CAT-03` | **Khoa học dữ liệuu** *(Existing)* | `khoa-hoc-du-lieu` | Data & AI | Danh mục các khóa học về Data Science, Machine Learning | 90 | **0** | **90** | Retained |
| `CAT-04` | **ai course** *(Existing)* | `ai-course` | Data & AI | Danh mục các khóa học về AI | 91 | **0** | **91** | Retained |
| `CAT-05` | **Phát triển ứng dụng di động** | `phat-trien-ung-dung-di-dong` | Technology | Xây dựng ứng dụng di động đa nền tảng và native trên iOS, Android với Flutter, React Native, SwiftUI và Kotlin. | 0 | **18** | **18** | **P1** |
| `CAT-06` | **An ninh mạng & Bảo mật** | `an-ninh-mang-va-bao-mat` | Technology | Bảo mật hệ thống, kiểm thử xâm nhập (Pentest), SOC, bảo mật ứng dụng web, đám mây và phòng chống mã độc. | 0 | **16** | **16** | **P1** |
| `CAT-07` | **Điện toán đám mây & DevOps** | `dien-toan-dam-may-va-devops` | Technology | Kiến trúc đám mây AWS, Azure, GCP, tự động hóa CI/CD, Kubernetes, Terraform, giám sát hệ thống và SRE. | 0 | **18** | **18** | **P1** |
| `CAT-08` | **Cơ sở dữ liệu & Kỹ thuật dữ liệu** | `co-so-du-lieu-va-ky-thuat-du-lieu` | Data & AI | Thiết kế cơ sở dữ liệu SQL/NoSQL, tối ưu truy vấn, xây dựng Data Pipeline, Apache Spark, Kafka và Lakehouse. | 0 | **16** | **16** | **P1** |
| `CAT-09` | **Thiết kế UI/UX & Sản phẩm số** | `thiet-ke-ui-ux-va-san-pham-so` | Design | Nghiên cứu người dùng (UX Research), thiết kế giao diện trên Figma, xây dựng Design System và Prototyping. | 0 | **20** | **20** | **P1** |
| `CAT-10` | **Thiết kế đồ họa & Truyền thông thị giác** | `thiet-ke-do-hoa` | Design | Thiết kế nhận diện thương hiệu, ấn phẩm truyền thông, minh họa kỹ thuật số với Photoshop, Illustrator, InDesign. | 0 | **16** | **16** | **P2** |
| `CAT-11` | **Digital Marketing & Tăng trưởng** | `digital-marketing` | Marketing | Chiến lược tiếp thị số đa kênh, SEO, Google Ads, Facebook/TikTok Ads, Content Marketing, CRM và Growth Hacking. | 0 | **22** | **22** | **P1** |
| `CAT-12` | **Quản trị kinh doanh & Khởi nghiệp** | `quan-tri-kinh-doanh-va-khoi-nghiep` | Business | Chiến lược kinh doanh, phát triển sản phẩm, xây dựng mô hình khởi nghiệp, quản trị vận hành và lãnh đạo đội ngũ. | 0 | **20** | **20** | **P1** |
| `CAT-13` | **Tài chính, Kế toán & Đầu tư** | `tai-chinh-ke-toan-va-dau-tu` | Finance | Phân tích báo cáo tài chính doanh nghiệp, kế toán thực hành, lập mô hình tài chính (Financial Modeling) và đầu tư. | 0 | **18** | **18** | **P1** |
| `CAT-14` | **Quản lý dự án & Vận hành Agile** | `quan-ly-du-an-va-van-hanh` | Operations | Quản trị dự án chuyên nghiệp theo chuẩn PMP, Agile, Scrum, Kanban, quản lý rủi ro với Jira và Confluence. | 0 | **16** | **16** | **P2** |
| `CAT-15` | **Tin học văn phòng & Tự động hóa** | `tin-hoc-van-phong-va-tu-dong-hoa` | Productivity | Làm chủ Excel nâng cao, Google Sheets, Word, PowerPoint, VBA, Power Automate và ứng dụng AI tối ưu công việc. | 0 | **18** | **18** | **P1** |
| `CAT-16` | **Phát triển bản thân & Kỹ năng mềm** | `phat-trien-ban-than-va-ky-nang-mem` | Personal Growth | Kỹ năng giao tiếp, thuyết trình trước đám đông, tư duy phản biện, đàm phán, quản lý thời gian và trí tuệ cảm xúc. | 0 | **18** | **18** | **P2** |
| `CAT-17` | **Ngoại ngữ ứng dụng & Giao tiếp quốc tế** | `ngoai-ngu-ung-dung` | Languages | Tiếng Anh thương mại, luyện thi IELTS/TOEIC, tiếng Nhật, tiếng Hàn, tiếng Trung giao tiếp trong môi trường làm việc. | 0 | **20** | **20** | **P1** |
| `CAT-18` | **Nhiếp ảnh, Dựng phim & Sáng tạo nội dung** | `nhiep-anh-va-dung-phim` | Creative Media | Kỹ thuật nhiếp ảnh, quay dựng video chuyên nghiệp với Premiere Pro, CapCut, DaVinci Resolve và After Effects. | 0 | **14** | **14** | **P2** |
| `CAT-19` | **Âm nhạc & Nghệ thuật sáng tạo** | `am-nhac-va-nghe-thuat-sang-tao` | Creative Media | Nhạc lý ứng dụng, đệm hát Guitar, Piano, sản xuất âm nhạc (Music Production), hòa âm phối khí và luyện thanh. | 0 | **10** | **10** | **P3** |
| `CAT-20` | **Sức khỏe, Thể chất & Lối sống** | `suc-khoe-the-chat-va-loi-song` | Wellness | Dinh dưỡng khoa học, Yoga phục hồi, huấn luyện thể lực cá nhân, chăm sóc sức khỏe tinh thần và công thái học. | 0 | **10** | **10** | **P3** |

---

## 3. Target New Course Breakdown per Category (Difficulty, Type & Teacher Stratification)

| Cat Code | Category Slug | New Courses | `BEGINNER` | `INTERMEDIATE` | `ADVANCED` | `FREE` (`0đ`) | `PAID` (`>0đ`) | Teacher 1 (`teacher02`) | Teacher 2 (`teacher_cntt`) | Teacher 3 (`giaovientrungquoc`) |Example Sub-Topics Covered |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `CAT-05` | `phat-trien-ung-dung-di-dong` | **18** | 6 | 8 | 4 | 2 | 16 | 6 | 6 | 6 | Flutter & Bloc, React Native & Expo, SwiftUI & SwiftData, Kotlin Jetpack Compose, Mobile CI/CD Fastlane, In-App Purchases, Offline-First SQLite/Realm |
| `CAT-06` | `an-ninh-mang-va-bao-mat` | **16** | 5 | 7 | 4 | 2 | 14 | 5 | 5 | 6 | OWASP Top 10 Web Pentesting, Burp Suite, SOC Analyst & SIEM Splunk, Network Forensics Wireshark, Cloud Security IAM, DevSecOps SAST/DAST, Reverse Engineering |
| `CAT-07` | `dien-toan-dam-may-va-devops` | **18** | 5 | 8 | 5 | 2 | 16 | 6 | 6 | 6 | AWS Solutions Architect, Azure Administrator, GCP Cloud Run, Kubernetes Production (EKS/Helm/ArgoCD), Terraform IaC, Prometheus & Grafana, Linux Kernel & Networking |
| `CAT-08` | `co-so-du-lieu-va-ky-thuat-du-lieu` | **16** | 5 | 7 | 4 | 2 | 14 | 5 | 6 | 5 | PostgreSQL Query Tuning & Indexing, MongoDB Aggregation & Sharding, Redis Caching & Streams, Apache Airflow, dbt Core, Apache Spark & Delta Lake, ClickHouse |
| `CAT-09` | `thiet-ke-ui-ux-va-san-pham-so` | **20** | 8 | 8 | 4 | 2 | 18 | 7 | 7 | 6 | Figma Auto Layout & Variables, UX Research & Usability Testing, Design Systems & Tokens, Mobile App UI/UX, SaaS Dashboard UX, Accessibility (WCAG), UX Writing |
| `CAT-10` | `thiet-ke-do-hoa` | **16** | 7 | 6 | 3 | 2 | 14 | 5 | 5 | 6 | Brand Identity & Logo Design, Adobe Illustrator Vector Mastery, Photoshop Retouching & Manipulation, InDesign Editorial Layout, Packaging Design, Typography |
| `CAT-11` | `digital-marketing` | **22** | 9 | 9 | 4 | 2 | 20 | 7 | 7 | 8 | Technical & Entity SEO, Google Search/Display Ads, Meta & TikTok Conversion Ads, GA4 & Looker Studio Marketing Attribution, Email CRM Automation, B2B LinkedIn |
| `CAT-12` | `quan-tri-kinh-doanh-va-khoi-nghiep` | **20** | 8 | 8 | 4 | 2 | 18 | 7 | 6 | 7 | Lean Startup & MVP Validation, OKRs & KPI Execution, Product Management, B2B Consultative Sales, E-Commerce Operations, Supply Chain & Unit Economics |
| `CAT-13` | `tai-chinh-ke-toan-va-dau-tu` | **18** | 7 | 7 | 4 | 2 | 16 | 6 | 6 | 6 | Financial Statement Analysis, 3-Statement Financial Modeling, DCF & Valuation, Vietnamese VAS vs IFRS Accounting, Corporate Cashflow & Budgeting, Personal Finance |
| `CAT-14` | `quan-ly-du-an-va-van-hanh` | **16** | 6 | 7 | 3 | 2 | 14 | 5 | 6 | 5 | PMP Exam Prep (PMBOK 7), Scrum Master & Product Owner, Jira & Confluence Workflows, Risk & Stakeholder Management, IT Business Analysis (BABOK), Kanban |
| `CAT-15` | `tin-hoc-van-phong-va-tu-dong-hoa` | **18** | 8 | 7 | 3 | 2 | 16 | 6 | 6 | 6 | Advanced Excel Formulas & Dynamic Arrays, Excel Power Query & PivotTables, VBA Macros, Google Sheets & Apps Script, Executive PowerPoint Storytelling, Power Automate |
| `CAT-16` | `phat-trien-ban-than-va-ky-nang-mem` | **18** | 9 | 7 | 2 | 2 | 16 | 6 | 6 | 6 | Public Speaking & Executive Presence, Critical Thinking & Structured Problem Solving, Win-Win Negotiation, Deep Work & Time Management, Emotional Intelligence (EQ) |
| `CAT-17` | `ngoai-ngu-ung-dung` | **20** | 9 | 8 | 3 | 2 | 18 | 7 | 6 | 7 | Business English Email & Meetings, English for Software Engineers, IELTS Academic 7.0+ Writing/Speaking, TOEIC 800+, Japanese JLPT N4-N3 IT/Business, Korean TOPIK |
| `CAT-18` | `nhiep-anh-va-dung-phim` | **14** | 6 | 6 | 2 | 2 | 12 | 5 | 5 | 4 | Mirrorless Photography & Lighting, Adobe Premiere Pro Video Editing, DaVinci Resolve Color Grading, After Effects Motion Graphics, CapCut Short-Form Storytelling |
| `CAT-19` | `am-nhac-va-nghe-thuat-sang-tao` | **10** | 5 | 4 | 1 | 2 | 8 | 3 | 4 | 3 | Acoustic Guitar Fingerstyle & Chords, Contemporary Piano & Chord Voicings, Applied Music Theory, FL Studio / Logic Pro Music Production, Vocal Breathing |
| `CAT-20` | `suc-khoe-the-chat-va-loi-song` | **10** | 5 | 4 | 1 | 2 | 8 | 4 | 3 | 3 | Evidence-Based Nutrition & Macro Planning, Therapeutic Yoga for Office Workers, Posture & Desk Ergonomics, Strength & Mobility Training, Mindfulness & Stress |
| **Total** | **16 New Categories** | **270** | **108** | **108** | **54** | **32** | **238** | **90** | **90** | **90** | **100% Balanced & Stratified** |

---

## 4. Representative Course Examples (Full Schema-Compliant Metadata)

Below are concrete representative courses illustrating the exact metadata quality required across the 16 new categories. Notice how `description` (~260–320 words), `requirements`, `benefits`, `techniques`, and `documents` are deeply tailored to each course's specific domain and difficulty level.

### Example 1 — `CAT-13` (`tai-chinh-ke-toan-va-dau-tu`) — `INTERMEDIATE`
```typescript
{
  title: 'Lập Mô Hình Tài Chính Doanh Nghiệp (3-Statement Financial Modeling) Thực Chiến Trên Excel',
  slug: 'lap-mo-hinh-tai-chinh-doanh-nghiep-3-statement-financial-modeling-tren-excel',
  categorySlug: 'tai-chinh-ke-toan-va-dau-tu',
  level: CourseLevel.INTERMEDIATE,
  type: CourseType.PAID,
  price: 549000,
  oldPrice: 799000,
  description: `Làm chủ kỹ năng xây dựng mô hình tài chính 3 báo cáo (3-Statement Financial Model) tích hợp hoàn chỉnh từ dữ liệu lịch sử đến dự phóng 5 năm cho chuyên viên phân tích tài chính, đầu tư và FP&A.

Trong môi trường tài chính doanh nghiệp, đầu tư vốn cổ phần (Private Equity) và ngân hàng đầu tư (Investment Banking), khả năng xây dựng một mô hình tài chính động, minh bạch và không lỗi tham chiếu vòng là kỹ năng cốt lõi nhất. Khóa học này hướng dẫn bạn từng bước chuẩn hóa dữ liệu kế toán lịch sử, thiết kế cấu trúc bảng tính theo tiêu chuẩn quốc tế FAST và liên kết chặt chẽ ba báo cáo: Báo cáo kết quả hoạt động kinh doanh (Income Statement), Bảng cân đối kế toán (Balance Sheet) và Báo cáo lưu chuyển tiền tệ (Cash Flow Statement).

Xuyên suốt khóa học, học viên sẽ trực tiếp thực hành trên bộ số liệu thực tế của một doanh nghiệp sản xuất và bán lẻ đang niêm yết. Bạn sẽ học cách tách biệt các giả định kinh doanh (Revenue Drivers, COGS, OPEX), lập lịch biểu khấu hao tài sản cố định (CAPEX & Depreciation Schedule), tính toán vốn lưu động ròng (Net Working Capital - AR, AP, Inventory) và xây dựng lịch biểu nợ vay - lãi vay (Debt & Interest Schedule) có cơ chế tự động cân bằng tiền mặt.

Bên cạnh kỹ thuật dựng mô hình, khóa học trang bị tư duy phân tích kịch bản (Scenario Analysis: Base, Upside, Downside) và phân tích độ nhạy (Sensitivity Analysis) để đánh giá tác động của biến động lãi suất, tỷ giá và sản lượng tiêu thụ lên dòng tiền tự do (Free Cash Flow) của doanh nghiệp.`,
  requirements: [
    'Nắm vững kiến thức nguyên lý kế toán và hiểu ý nghĩa cơ bản của 3 báo cáo tài chính',
    'Sử dụng thành thạo các hàm Excel thông dụng (SUMIFS, INDEX/MATCH hoặc XLOOKUP, IF)',
    'Máy tính cá nhân cài đặt Microsoft Excel 2019, 2021 hoặc Microsoft 365'
  ],
  benefits: [
    'Xây dựng hoàn chỉnh mô hình tài chính 3 báo cáo (IS, BS, CFS) liên kết động 100% từ con số 0',
    'Thiết kế các bảng phụ trợ chuyên sâu: Lịch khấu hao CAPEX, Vốn lưu động (NWC) và Lịch trả nợ vay',
    'Thiết lập hệ thống kiểm tra tính cân bằng tự động (Balance Check & Error Flags) chuẩn kiểm toán',
    'Thực hiện phân tích kịch bản kinh doanh (Scenario Manager) và độ nhạy (Data Tables) phục vụ ra quyết định',
    'Chuẩn hóa định dạng mô hình tài chính theo quy chuẩn trình bày của các quỹ đầu tư và bộ phận FP&A'
  ],
  techniques: [
    'Financial Modeling',
    '3-Statement Model',
    'Corporate Finance',
    'FP&A',
    'Excel Finance',
    'Cash Flow Forecasting'
  ],
  documents: [
    'Bộ file Excel Template 3-Statement Financial Model thực hành (chưa điền công thức và bản hoàn chỉnh)',
    'Sổ tay quy chuẩn định dạng mô hình tài chính quốc tế và phím tắt Excel tăng tốc độ dựng model',
    'Bộ dữ liệu báo cáo tài chính 3 năm của doanh nghiệp mẫu phục vụ bài tập cuối khóa'
  ]
}
```

### Example 2 — `CAT-09` (`thiet-ke-ui-ux-va-san-pham-so`) — `ADVANCED`
```typescript
{
  title: 'Kiến Trúc Design System Đa Thương Hiệu Với Figma Variables và Design Tokens',
  slug: 'kien-truc-design-system-da-thuong-hieu-voi-figma-variables-va-design-tokens',
  categorySlug: 'thiet-ke-ui-ux-va-san-pham-so',
  level: CourseLevel.ADVANCED,
  type: CourseType.PAID,
  price: 599000,
  oldPrice: 899000,
  description: `Thiết kế, vận hành và mở rộng hệ thống Design System cấp độ doanh nghiệp hỗ trợ đa giao diện (Light/Dark Mode) và đa thương hiệu (Multi-Brand) bằng Figma Variables, Auto Layout 5 và quy trình bàn giao Design Tokens sang mã nguồn.

Khi sản phẩm số phát triển lên quy mô hàng chục màn hình trên cả Web, iOS và Android, việc thiết kế từng màn hình rời rạc sẽ dẫn đến sự thiếu nhất quán nghiêm trọng và làm chậm tốc độ phát triển của đội ngũ kỹ sư. Khóa học chuyên sâu này được thiết kế dành riêng cho Product Designer, UI/UX Designer cấp độ Middle/Senior và Frontend Architect muốn làm chủ phương pháp kiến trúc một Design System bền vững, dễ bảo trì và đồng bộ trực tiếp với quy trình phát triển phần mềm.

Nội dung khóa học đi sâu vào kiến trúc phân tầng Design Tokens 3 lớp: Primitive Tokens (bảng màu gốc, thang đo khoảng cách), Semantic Tokens (màu ngữ nghĩa theo trạng thái nền, chữ, viền) và Component-Specific Tokens. Bạn sẽ thực hành cấu hình Figma Variables để chuyển đổi tức thì giữa chế độ Sáng/Tối (Light/Dark Mode) và giao diện đa thương hiệu (White-label theming) mà không cần nhân bản component.

Hơn thế nữa, khóa học hướng dẫn quy trình xây dựng bộ thư viện hơn 40 Core Components phức tạp (Data Table, Modal, Navigation, Form Controls) sử dụng Component Properties, Slot Pattern, cùng quy trình xuất JSON Design Tokens tích hợp với Style Dictionary để bàn giao mượt mà cho đội ngũ lập trình viên.`,
  requirements: [
    'Đã sử dụng thành thạo công cụ Figma cơ bản, bao gồm Frame, Constraints và Auto Layout',
    'Có ít nhất 6 tháng kinh nghiệm thiết kế giao diện Web hoặc Mobile App thực tế',
    'Tài khoản Figma (khuyến khích gói Giáo dục hoặc Professional để thực hành đa chế độ Variables)'
  ],
  benefits: [
    'Thiết kế kiến trúc phân tầng 3 lớp Design Tokens (Primitive, Semantic, Component) chuẩn công nghiệp',
    'Làm chủ Figma Variables để tự động hóa chế độ Light/Dark Mode và Responsive Breakpoints',
    'Xây dựng thư viện UI Components phức tạp có tính tái sử dụng cao bằng Slot Pattern và Variant Properties',
    'Viết tài liệu hướng dẫn sử dụng (Component Documentation, Do/Don’t, Accessibility WCAG AA) cho đội ngũ sản phẩm',
    'Thiết lập quy trình đồng bộ Design Tokens từ Figma sang kho mã nguồn Frontend qua JSON và Style Dictionary'
  ],
  techniques: [
    'Design Systems',
    'Figma Variables',
    'Design Tokens',
    'UI Architecture',
    'Auto Layout',
    'WCAG Accessibility'
  ],
  documents: [
    'File Figma Design System Starter Kit hoàn chỉnh với hơn 300 Variables và 40 Core Components',
    'Tài liệu Checklist kiểm định chất lượng Component và tiêu chuẩn độ tương phản màu WCAG 2.1',
    'Bộ mẫu JSON Design Tokens và cấu hình chuyển đổi sang biến CSS/Tailwind'
  ]
}
```

### Example 3 — `CAT-11` (`digital-marketing`) — `BEGINNER`
```typescript
{
  title: 'SEO Tổng Thể Thực Chiến: Nghiên Cứu Từ Khóa, Onpage và Xây Dựng Nội Dung Lên Top Bền Vững',
  slug: 'seo-tong-the-thuc-chien-nghien-cuu-tu-khoa-onpage-va-xay-dung-noi-dung-ben-vung',
  categorySlug: 'digital-marketing',
  level: CourseLevel.BEGINNER,
  type: CourseType.PAID,
  price: 349000,
  oldPrice: 499000,
  description: `Nắm vững phương pháp SEO Tổng Thể (Holistic SEO) từ nghiên cứu ý định tìm kiếm (Search Intent), lập cấu trúc Topic Cluster đến tối ưu Onpage và đo lường tăng trưởng lưu lượng truy cập tự nhiên với Google Search Console.

Thay vì chạy theo các thủ thuật đánh lừa thuật toán ngắn hạn dễ bị Google phạt, phương pháp SEO Tổng Thể tập trung vào việc thấu hiểu hành trình tìm kiếm của khách hàng và xây dựng hệ thống nội dung mang lại giá trị thực sự. Khóa học này được thiết kế bài bản dành cho người mới bắt đầu, chuyên viên Content Marketing, chủ doanh nghiệp nhỏ và những ai muốn xây dựng kênh thu hút khách hàng tiềm năng miễn phí bền vững qua công cụ tìm kiếm.

Trong khóa học, bạn sẽ nắm rõ cơ chế thu thập dữ liệu (Crawling), lập chỉ mục (Indexing) và xếp hạng (Ranking) của Google hiện đại. Học viên được hướng dẫn thực hành phân nhóm hàng nghìn từ khóa theo Search Intent (Informational, Commercial, Transactional), thiết kế kiến trúc Silo / Topic Cluster (Pillar Page và Cluster Content) giúp bao phủ toàn diện chủ đề ngành hàng.

Bên cạnh đó, khóa học cung cấp quy trình chuẩn hóa bài viết chuẩn SEO tuân thủ tiêu chí E-E-A-T, cách tối ưu thẻ tiêu đề, cấu trúc Heading, Internal Linking, Schema Markup cơ bản và kỹ thuật đọc báo cáo Google Search Console để liên tục cải thiện thứ hạng từ khóa thực tế.`,
  requirements: [
    'Không yêu cầu kinh nghiệm SEO trước đó, phù hợp cho người mới bắt đầu từ con số 0',
    'Biết sử dụng máy tính văn phòng, trình duyệt web và Google Sheets cơ bản',
    'Có sẵn một website cá nhân, blog thực hành hoặc dự án giả định để áp dụng bài tập'
  ],
  benefits: [
    'Phân tích và gom nhóm bộ từ khóa ngành hàng theo đúng ý định tìm kiếm (Search Intent) của khách hàng',
    'Thiết kế cấu trúc nội dung Topic Cluster và sơ đồ liên kết nội bộ (Internal Link) giúp tăng uy tín chuyên đề',
    'Tối ưu hóa toàn diện các yếu tố Onpage (Title, Meta, Heading, Image SEO, URL, E-E-A-T) cho trang đích',
    'Sử dụng thành thạo Google Search Console và các công cụ nghiên cứu từ khóa để theo dõi hiệu quả SEO',
    'Phát hiện và khắc phục các lỗi lập chỉ mục (Indexing), trùng lặp nội dung (Keyword Cannibalization) phổ biến'
  ],
  techniques: [
    'SEO',
    'Keyword Research',
    'Onpage SEO',
    'Topic Cluster',
    'Google Search Console',
    'Content Marketing'
  ],
  documents: [
    'Bảng mẫu Google Sheets lập kế hoạch từ khóa (Keyword Mapping) và lịch biên tập nội dung Topic Cluster',
    'Checklist 45 tiêu chí kiểm tra bài viết chuẩn SEO Onpage và E-E-A-T trước khi xuất bản',
    'Tài liệu hướng dẫn đọc chỉ số Impressions, CTR, Position và xử lý lỗi trên Google Search Console'
  ]
}
```

### Example 4 — `CAT-17` (`ngoai-ngu-ung-dung`) — `INTERMEDIATE`
```typescript
{
  title: 'Tiếng Anh Thương Mại Chuyên Nghiệp: Viết Email, Đàm Phán và Thuyết Trình Quốc Tế',
  slug: 'tieng-anh-thuong-mai-chuyen-nghiep-viet-email-dam-phan-va-thuyet-trinh-quoc-te',
  categorySlug: 'ngoai-ngu-ung-dung',
  level: CourseLevel.INTERMEDIATE,
  type: CourseType.PAID,
  price: 399000,
  oldPrice: 599000,
  description: `Nâng tầm năng lực giao tiếp Tiếng Anh công sở (Business English) dành cho người đi làm: viết email chuẩn mực, điều phối cuộc họp đa quốc gia, thuyết trình số liệu và đàm phán hợp đồng với đối tác nước ngoài.

Rất nhiều nhân sự có nền tảng ngữ pháp và từ vựng tiếng Anh giao tiếp thông thường nhưng vẫn gặp lúng túng khi phải viết một email xử lý khủng hoảng, phản biện lịch sự trong cuộc họp hay trình bày báo cáo chiến lược trước ban giám đốc người nước ngoài. Khóa học này tập trung 100% vào ngôn ngữ tiếng Anh thương mại thực dụng (Practical Business Communication) trong môi trường tập đoàn đa quốc gia và làm việc từ xa toàn cầu.

Khóa học được chia thành 4 học phần cốt lõi theo đúng dòng chảy công việc hàng ngày. Học phần 1 giúp bạn làm chủ văn phong viết Email và tin nhắn công việc (Slack/Teams) ngắn gọn, rõ ràng, đúng sắc thái trang trọng (Tone of Voice). Học phần 2 cung cấp hệ thống cấu trúc câu để mở đầu, dẫn dắt, nêu ý kiến, đồng tình hoặc phản bác khéo léo trong các cuộc họp trực tuyến.

Ở học phần 3 và 4, bạn sẽ thực hành kỹ thuật thuyết trình biểu đồ tăng trưởng, báo cáo kết quả kinh doanh (Pitching & Reporting) cùng các chiến thuật ngôn từ trong đàm phán thương mại ( thương lượng giá, tiến độ, điều khoản hợp đồng) để đạt được thỏa thuận đôi bên cùng có lợi.`,
  requirements: [
    'Có nền tảng tiếng Anh tương đương trình độ B1 (CEFR) hoặc TOEIC 500+ / IELTS 5.0 trở lên',
    'Đang đi làm hoặc chuẩn bị ứng tuyển vào môi trường doanh nghiệp có sử dụng tiếng Anh',
    'Sẵn sàng ghi âm bài thực hành nói và viết lại email theo các tình huống mẫu trong khóa học'
  ],
  benefits: [
    'Soạn thảo thành thạo 15 loại Email thương mại (đề xuất, báo cáo,催 nhắc nhở khéo léo, xử lý sự cố)',
    'Tự tin điều phối và đóng góp ý kiến sắc bén trong các cuộc họp quốc tế bằng tiếng Anh chuyên nghiệp',
    'Trình bày mạch lạc các biểu đồ số liệu, xu hướng tài chính và kế hoạch dự án trước lãnh đạo và khách hàng',
    'Vận dụng linh hoạt các mẫu câu đàm phán, nhượng bộ có điều kiện và chốt thỏa thuận hợp đồng',
    'Loại bỏ các lỗi diễn đạt dịch từng từ từ tiếng Việt sang tiếng Anh (Vietlish) gây hiểu lầm nơi công sở'
  ],
  techniques: [
    'Business English',
    'Email Writing',
    'Business Negotiation',
    'English Presentation',
    'Corporate Communication'
  ],
  documents: [
    'Cẩm nang 120 mẫu câu và cấu trúc Email Tiếng Anh Thương Mại phân loại theo từng tình huống công sở',
    'Bộ từ vựng chuyên ngành kinh doanh, tài chính, quản lý dự án và mô tả biểu đồ số liệu',
    'Kịch bản mẫu (Role-play Scripts) cho cuộc họp báo cáo tiến độ và đàm phán hợp đồng với khách hàng'
  ]
}
```

---

## 5. Metadata Templates & TypeScript Contracts

In DATA-02, all seed definitions will use strict TypeScript interfaces and pass runtime validation through `createCategoryInputSchema` (`src/models/category.model.ts`) and `createCourseInputSchema` (`src/models/course.model.ts`) prior to database insertion:

```typescript
import { CourseLevel, CourseStatus, CourseType } from '@prisma/client'

export interface SeedCategoryDefinition {
  id: string               // Deterministic UUIDv5: generateDeterministicUuid(`seed-category:${slug}`)
  name: string             // 2..200 chars, unique
  slug: string             // kebab-case, 2..250 chars, unique
  description: string      // 100..200 chars (complies with category.middleware.ts <= 200 char rule)
  createdById: string      // '8eb5b1cb-9b46-5ce8-b7c2-9d0d86c893e8' (admin_tmdemy)
}

export interface SeedCourseDefinition {
  id: string               // Deterministic UUIDv5: generateDeterministicUuid(`seed-course-v2:${slug}`)
  title: string            // 35..110 chars, unique
  slug: string             // kebab-case, unique
  description: string      // 250..400 Vietnamese words (~1,400..2,400 chars), multi-paragraph
  price: number            // 0 if FREE; otherwise realistic tier (149000..899000)
  oldPrice: number         // 0 if FREE; otherwise >= price
  type: CourseType         // CourseType.FREE | CourseType.PAID
  status: CourseStatus     // Configurable per Decision 1 (PENDING safe default or APPROVED)
  level: CourseLevel       // BEGINNER | INTERMEDIATE | ADVANCED
  view: number             // Deterministic views (0 if PENDING/REJECTED)
  sold: number             // Deterministic sold count (0 if PENDING/REJECTED)
  image: string            // Valid HTTPS thumbnail URL from domain-matched curated set
  introUrl: string         // Valid HTTPS intro video URL
  requirements: string[]   // 2..4 level-calibrated prerequisites (unique per course)
  benefits: string[]       // 4..6 observable learning outcomes (unique per course)
  techniques: string[]     // 4..7 specific skill/topic tags for recommendation engine
  documents: string[]      // 2..3 domain-authentic course deliverables
  categoryId: string       // FK -> Category.id
  authorId: string         // FK -> User.id (strictly from ELIGIBLE_TEACHER_IDS)
}
```

---

## 6. Teacher Selection Rules & Deterministic PRNG Algorithm

### 6.1 Strict Eligibility Rules
1. Only existing `User` records in `tmdemy` where `role === 'TEACHER'`, `status === 'ACTIVE'`, and `isVerified === true` are eligible.
2. Verified against the live database, the exact eligible pool is:
   - `13608f92-8acf-53e3-adcb-0d832e9cb1d4` (`teacher02`)
   - `6dd1ccd9-420b-5c6d-8322-75223e67e549` (`teacher_cntt`)
   - `c79ee551-3b2e-48ca-9105-c0669f04e6bb` (`giaovientrungquoc`)
3. `admin_tmdemy` (`role = ADMIN`) and the 14 unverified test teacher accounts (`isVerified = false`) are strictly excluded.
4. Pre-flight check in the seed script queries `prisma.user.findMany` for these 3 IDs and aborts immediately if any of the 3 is missing, inactive, or does not have `role = 'TEACHER'`.

### 6.2 Seeded PRNG Balanced Assignment Implementation
```typescript
import crypto from 'crypto'

export const ELIGIBLE_TEACHER_IDS = [
  '13608f92-8acf-53e3-adcb-0d832e9cb1d4', // teacher02
  '6dd1ccd9-420b-5c6d-8322-75223e67e549', // teacher_cntt
  'c79ee551-3b2e-48ca-9105-c0669f04e6bb'  // giaovientrungquoc
] as const

export const TEACHER_ASSIGNMENT_SEED = 'TMDEMY-DATA-02-TEACHER-ASSIGNMENT-SEED-2026'

/**
 * Pure deterministic Mulberry32 PRNG seeded from SHA-256 of seed string
 */
export function createSeededRng(seedString: string): () => number {
  const hash = crypto.createHash('sha256').update(seedString, 'utf8').digest()
  let state = hash.readUInt32LE(0)
  return function nextRandom(): number {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Generates a 270-element teacher ID array where:
 * 1. Every teacher receives exactly 90 courses overall (90 * 3 = 270).
 * 2. Within each category, teacher counts differ by at most 1 (as shown in Section 3).
 * 3. Course-to-teacher order within each category is shuffled via Mulberry32 PRNG.
 */
```

---

## 7. Proposed Seed Script Structure, Batching & Idempotency

### 7.1 Proposed File Layout (To Be Created in DATA-02 Only After Approval)
```text
prisma/
  seeds/
    multi-domain/
      categories-data.ts          # 16 new category definitions + deterministic UUIDv5
      tech-expansion-courses.ts   # CAT-05..CAT-08 (Mobile, Cybersec, Cloud/DevOps, DB/DataEng - 68 courses)
      design-courses.ts           # CAT-09..CAT-10 (UI/UX, Graphic Design - 36 courses)
      business-finance-courses.ts # CAT-11..CAT-14 (Marketing, Business, Finance, PM/Agile - 76 courses)
      productivity-lang-courses.ts# CAT-15..CAT-17 (Office, Soft Skills, Foreign Languages - 56 courses)
      creative-wellness-courses.ts# CAT-18..CAT-20 (Photo/Video, Music, Health/Wellness - 34 courses)
      validation-gate.ts          # Zod validation + 4-stage duplicate & TF-IDF similarity gate
scripts/
  run_data02_seed.ts              # CLI runner supporting --dry-run, --status=PENDING|APPROVED, --rollback
```

### 7.2 Batch Processing & Transaction Boundaries
1. **Category Batch**: All 16 categories are upserted in **1 atomic transaction** (`prisma.$transaction(categories.map(...))`).
2. **Course Batches**: The 270 courses are processed in **9 sequential batches of 30 courses** (`BATCH_SIZE = 30`).
3. Each batch of 30 courses runs inside an atomic array transaction `await prisma.$transaction(batch.map((course) => prisma.course.upsert(...)))`.
4. **Failure Recovery**: Because every category and course uses a deterministic UUIDv5 (`where: { id: course.id }`) and idempotent `upsert`, if batch #5 fails due to a transient database connection drop, rerunning `scripts/run_data02_seed.ts` safely reconciles batches #1–#4 with zero duplicates and completes batches #5–#9.

### 7.3 Idempotency Guarantee
- **Category Idempotency**: `prisma.category.upsert({ where: { id: cat.id }, update: { ... }, create: { ... } })`.
- **Course Idempotency**: `prisma.course.upsert({ where: { id: course.id }, update: { ... }, create: { ... } })`.
- Running the seed script 1 time, 2 times, or 10 times produces the **exact same 30 categories and 648 courses** with **0 duplicate slugs and 0 duplicate IDs**.

---

## 8. Pre-Seed & Post-Seed Validation Criteria

### 8.1 Pre-Seed Automated Gates (`--dry-run` and Pre-Commit Check)
Before writing a single record to PostgreSQL, `validation-gate.ts` verifies:
1. **Schema & Zod Gate**: All 16 categories pass `createCategoryInputSchema` (`description.length <= 200`); all 270 courses pass `createCourseInputSchema`.
2. **Description Depth Gate**: Every new course has `description` length $\ge 1,000$ characters and $\ge 220$ words, structured in multiple paragraphs.
3. **Outcome & Prerequisite Diversity Gate**: Every new course has $4 \le \text{benefits.length} \le 6$, $2 \le \text{requirements.length} \le 4$, $4 \le \text{techniques.length} \le 7$, $2 \le \text{documents.length} \le 3$, and **0 duplicate `benefits` or `requirements` arrays** across all 270 courses.
4. **Slug & Title Uniqueness Gate**: 0 collisions against the 378 existing DB courses and within the 270 new courses.
5. **TF-IDF Cosine Similarity Gate**: Max pairwise TF-IDF cosine similarity across all $378 + 270 = 648$ courses must be $< 0.65$ (excluding the pre-existing Step 5/6 test duplicates).
6. **Teacher Balance Gate**: Each of the 3 verified teacher IDs is assigned to exactly 90 courses ($90 \times 3 = 270$).

### 8.2 Post-Seed Verification Queries
Immediately after seeding, the script verifies:
- `prisma.category.count()` equals `30` (`14 existing + 16 new`).
- `prisma.course.count()` equals `648` (`378 existing + 270 new`).
- All 378 pre-existing courses retain their exact original `authorId`, `categoryId`, `status`, and `isDestroyed` values.
- Unique slug count across `courses` equals `648 / 648`.

---

## 9. Backup and Rollback Strategy

Because DATA-02 only inserts records with deterministic UUIDv5 primary keys derived from `seed-category:<slug>` (16 IDs) and `seed-course-v2:<slug>` (270 IDs) and never mutates existing rows:
1. **Pre-Seed Snapshot**: Export a JSON snapshot of existing category and course IDs (`378` course IDs, `14` category IDs) to `scripts/migration-logs/data02-pre-seed-snapshot.json`.
2. **Surgical Rollback Command (`--rollback`)**:
   If rollback is ever required, `npx.cmd tsx scripts/run_data02_seed.ts --rollback` deletes **only** the 270 deterministic `seed-course-v2:*` course IDs and 16 deterministic `seed-category:*` category IDs inside a single Prisma transaction:
   ```typescript
   await prisma.$transaction([
     prisma.course.deleteMany({ where: { id: { in: DATA_02_COURSE_IDS } } }),
     prisma.category.deleteMany({ where: { id: { in: DATA_02_CATEGORY_IDS } } })
   ])
   ```
   This restores the database to its exact pre-DATA-02 state (`14 categories`, `378 courses`) without touching any baseline, test, or Phase 5 records.

---

## 10. Acceptance Criteria for DATA-02

- [ ] **AC-01**: All 16 new categories exist in `categories` with valid Vietnamese names, unique slugs, and descriptions $\le 200$ chars.
- [ ] **AC-02**: All 270 new courses exist in `courses` distributed across the 16 new categories according to the Section 3 table.
- [ ] **AC-03**: Total courses in `tmdemy` is **648** (`378 + 270`), with **0 duplicate slugs** and **0 duplicate normalized titles** among catalog courses.
- [ ] **AC-04**: All 270 new courses are assigned exclusively to the 3 verified active `TEACHER` accounts (`teacher02`: +90, `teacher_cntt`: +90, `giaovientrungquoc`: +90).
- [ ] **AC-05**: 100% of the 270 new courses have multi-paragraph descriptions (250–400 words) and unique, course-specific `benefits`, `requirements`, `techniques`, and `documents`.
- [ ] **AC-06**: Running `scripts/run_data02_seed.ts` a second time results in 0 new records and 0 errors (100% idempotent).
- [ ] **AC-07**: Zero existing database records (users, existing categories, existing courses, enrollments, progress, XP) were deleted or altered.

---

## 11. Explicit List of Decisions Awaiting User Approval

> [!IMPORTANT]
> **Execution Gate**: No seed scripts or database writes will be executed until the Project Owner reviews and approves the following decisions:

1. **Decision 1 (Course Status)**: Should the 270 new courses be seeded with `status = PENDING` (safe default per Section 9, requiring approval before appearing on public `GET /api/courses`), or `status = APPROVED` (immediately visible in public catalog & recommendation queries)?
2. **Decision 2 (Eligible Teacher Pool)**: Confirm using strictly the **3 verified active teachers** (`teacher02`, `teacher_cntt`, `giaovientrungquoc` — 90 new courses each), excluding `admin_tmdemy` (`ADMIN`) and the 14 unverified test teacher accounts.
3. **Decision 3 (Taxonomy & Volume)**: Confirm the **16 new categories** (forming a 20-category catalog) and **+270 new courses** (**648 total courses**).
4. **Decision 4 (Existing Category Hygiene)**: Keep all 14 existing categories 100% untouched (*Option A*), or fix the display-name typo `"Khoa học dữ liệuu"` $\rightarrow$ `"Khoa học dữ liệu"`, rename `"ai course"` $\rightarrow$ `"Trí tuệ nhân tạo (AI)"` (keeping slugs unchanged), and soft-delete the 7 `"Step 5/6 Category ..."` test artifact categories (*Option B*)?
5. **Decision 5 (Outline Chapters)**: Seed only `Course` metadata (*Option A — Recommended*), or also seed 3–4 structural `Chapter` outline titles per new course without fake video lessons (*Option B*)?

