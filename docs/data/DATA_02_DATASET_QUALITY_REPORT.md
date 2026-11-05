# DATA-02: DATASET QUALITY & RECOMMENDATION READINESS REPORT

**Project**: TMdemy E-Learning Platform  
**Target Purpose**: Dataset Expansion for Hybrid Course Recommendation System  
**Audit Date**: 2026-10-28  
**Scope**: 610 Approved Courses across 20 Populated Active Categories in PostgreSQL 16.11  

---

## 1. Dataset Overview & Dimension Analysis

Following the execution of **DATA-02**, the TMdemy course catalog transitioned from a tech-centric, mono-domain catalog (concentrated mostly in programming and web development) to a comprehensive, multi-domain educational catalog ready for recommendation algorithm experiments.

### Key Dataset Dimensions

| Metric | Pre-DATA-02 (Legacy) | DATA-02 Seeded Addition | Current Active Catalog |
| :--- | :--- | :--- | :--- |
| **Total Approved Courses** | 340 | **+270** | **610** |
| **Populated Active Categories** | 4 | **+16** | **20** |
| **Unpopulated Active Categories** | 2 (`vibe-coding`, `hardware`) | 0 | 2 |
| **Soft-Deleted Test Categories** | 1 | +7 | 8 |
| **Unique Instructors Represented** | 4 (including admin) | 3 verified teachers | 4 (3 verified teachers + 1 admin) |
| **Average Description Word Count** | ~85 words (legacy) | **313 words** (new) | **~186 words** (overall) |

---

## 2. Category & Domain Distribution

The catalog now encompasses 20 populated educational categories spanning Technology, Design, Business, Finance, Languages, Media, and Lifestyle:

| Category ID | Category Name | Domain | Approved Courses | % of Catalog |
| :--- | :--- | :--- | :---: | :---: |
| `dddf433f-347b-5024-b70d-2398aaed3660` | Lập trình | Core Technology | 113 | 18.5% |
| `d2fec401-49e0-52a4-b0a3-6eb8d531bb80` | Thiết kế web | Web Engineering | 114 | 18.7% |
| `2ec199fc-a7e0-531e-b79d-14b479f74853` | Khoa học dữ liệu | Data Science | 57 | 9.3% |
| `084d6053-7823-4cb8-a7e7-7dba3e6a78bf` | Trí tuệ nhân tạo (AI) | Artificial Intelligence | 56 | 9.2% |
| `626ff628-88f2-5436-9ad4-ec547e86547a` | Phát triển ứng dụng di động | Mobile Development | 18 | 3.0% |
| `97739f60-fb34-5cb7-87b1-11d2585fc58d` | An ninh mạng & Bảo mật | Cybersecurity | 16 | 2.6% |
| `de33e051-5616-5b78-b31b-17e40e6b3037` | Điện toán đám mây & DevOps | Cloud & Infrastructure | 18 | 3.0% |
| `7afb937c-ae97-5bae-bd7d-f377ab0bf799` | Cơ sở dữ liệu & Kỹ thuật dữ liệu | Databases & Data Eng | 16 | 2.6% |
| `ebfd0b83-65bd-5393-8529-e81a395a4cd1` | Thiết kế UI/UX & Sản phẩm số | Product & UX Design | 20 | 3.3% |
| `b8fec287-f686-5239-b780-5f4b2fff2947` | Thiết kế đồ họa & Truyền thông thị giác | Graphic Arts | 16 | 2.6% |
| `fbbde717-fb63-5dde-b45b-4041909976d9` | Digital Marketing & Tăng trưởng | Marketing & Growth | 22 | 3.6% |
| `289121d2-c54f-5b9e-a993-dd909a430b91` | Quản trị kinh doanh & Khởi nghiệp | Business Management | 20 | 3.3% |
| `ee865886-b009-5b54-bcee-f055c659c6fb` | Tài chính, Kế toán & Đầu tư | Finance & Accounting | 18 | 3.0% |
| `88d6470a-af9a-5883-aa07-a2bb3d78c8f9` | Quản lý dự án & Vận hành Agile | Project Management | 16 | 2.6% |
| `9f6485ab-dc41-54c7-a8a3-796b649a37be` | Tin học văn phòng & Tự động hóa | Office Productivity | 18 | 3.0% |
| `b7f79eec-ca57-5122-95b5-089e4629d0d9` | Phát triển bản thân & Kỹ năng mềm | Personal Development | 18 | 3.0% |
| `8b19f844-2304-567f-b090-963eb0c2a7fd` | Ngoại ngữ ứng dụng & Giao tiếp quốc tế | Languages & IELTS/TOEIC | 20 | 3.3% |
| `8c0b20dd-4b33-56bd-9067-07a230795e49` | Nhiếp ảnh, Dựng phim & Sáng tạo nội dung| Creative Media | 14 | 2.3% |
| `92cc10e6-324b-5a40-bf0b-942cc4c65ce6` | Âm nhạc & Nghệ thuật sáng tạo | Music & Audio | 10 | 1.6% |
| `ff50bad7-4dbd-5bcd-a225-533eaf3f8cb5` | Sức khỏe, Thể chất & Lối sống | Wellness & Health | 10 | 1.6% |
| **Total Active Approved** | | | **610** | **100%** |

---

## 3. Linguistic & Vocabulary Quality Analysis

### 3.1 Course Description Richness
- **Word Count Distribution (DATA-02 Cohort)**:
  - Minimum: **225 words**
  - Average: **313.2 words**
  - Maximum: **373 words**
  - Standard Deviation: **24.6 words**
- **Structure & Format**:
  Every description is written in natural, fluent academic Vietnamese and structured into 4 consistent sections:
  1. *Giới thiệu tổng quan (Introduction)*: Domain context and target learner profile.
  2. *Nội dung cốt lõi (Core Curriculum)*: Detailed modules and practical projects.
  3. *Phương pháp giảng dạy (Pedagogical Approach)*: Hands-on case studies and real-world workflows.
  4. *Kết quả đầu ra (Learning Outcomes)*: Practical competencies acquired.

### 3.2 Metadata Completeness
In addition to plain text descriptions, all 270 new courses feature structured metadata arrays essential for multi-feature recommendation models:
- **`techniques` (3–5 items per course)**: Key tools, frameworks, and practical methodologies (e.g., `["React Native", "Expo", "Redux Toolkit", "Push Notifications"]`, `["Figma", "Design Systems", "Prototyping", "Usability Testing"]`).
- **`requirements` (3–4 items per course)**: Prerequisites and hardware/software needs.
- **`benefits` (4–5 items per course)**: Concrete takeaways and career impact.

---

## 4. Course Level & Price Distribution

To ensure realistic user preference filtering and multi-objective ranking, the newly seeded courses were stratified across level tiers and pricing ladders:

### Level Breakdown (DATA-02 Cohort)
- `BEGINNER`: 78 courses (28.9%)
- `INTERMEDIATE`: 105 courses (38.9%)
- `ADVANCED`: 47 courses (17.4%)
- `ALL_LEVELS`: 40 courses (14.8%)

### Pricing Distribution (DATA-02 Cohort)
- Free (`price = 0`): 12 courses (4.4%)
- Tier 1 (199,000 – 399,000 VND): 92 courses (34.1%)
- Tier 2 (499,000 – 799,000 VND): 114 courses (42.2%)
- Tier 3 (899,000 – 1,499,000 VND): 42 courses (15.6%)
- Premium Tier (1,599,000 – 1,999,000 VND): 10 courses (3.7%)

All courses provide realistic `oldPrice` anchors ($20\% - 45\%$ discount margins) for realistic catalog UI presentation.

---

## 5. Recommendation Systems Readiness Assessment

| Recommendation Method | Dataset Fitness | Key Strengths & Potential Bottlenecks |
| :--- | :---: | :--- |
| **Content-based Filtering (TF-IDF + Cosine Similarity)** | **EXCELLENT** | High discrimination between distinct domains; rich vocabulary in `techniques` and `title` creates sharp term frequency vectors. |
| **Semantic Sentence Embeddings (PhoBERT / `multilingual-e5`)** | **EXCELLENT** | Descriptions are written in grammatical Vietnamese prose with rich semantic context, ideal for dense vector indexation (e.g. Pgvector or Pinecone). |
| **Cross-Domain Discovery & Serendipity** | **HIGH** | Adjacent domains (e.g. `UI/UX` vs `Web Dev`, `Data Engineering` vs `Data Science`, `Project Management` vs `DevOps`) enable realistic cross-selling recommendation pathways. |
| **Collaborative Filtering (Matrix Factorization / Item-KNN)** | **REQUIRES USER SESSIONS** | The catalog dataset provides the item catalog; actual user interactions (views, cart adds, enrollments) will be simulated or collected during testing phases. |

---

## 6. Academic Disclosure & Ethical Notes

1. **Demonstration & Research Scope**:
   All 270 courses added in DATA-02 represent synthetic catalog metadata specifically engineered to support evaluation of recommendation models, search filtering, and catalog discovery.
2. **Asset Transparency**:
   These courses do not possess pre-recorded video media, completed interactive quizzes, or downloadable code repositories. They are marked with sample placeholder images and public intro links.
3. **Zero Fabricated Engagements**:
   No fake ratings, false reviews, or deceptive enrollment counts were injected. The courses start with baseline status `APPROVED`, `view: 0` (or deterministic initial view count), and `sold: 0`.

