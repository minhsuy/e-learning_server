# REC-01: DATASET QUALITY & RECOMMENDATION READINESS REPORT

**Project**: TMdemy E-Learning Platform  
**Roadmap Stage**: Recommendation System — Step REC-01  
**Audit Date**: 2026-10-29  
**Dataset Scope**: 608 Eligible Approved Courses across 20 Populated Categories  
**Artifact Evaluated**: `data/recommendation/raw/courses.json` & `data/recommendation/raw/courses.csv`  

---

## 1. Actual Dataset Size & Baseline Comparison

Following the execution of the dataset audit pipeline, the observed live PostgreSQL dataset metrics were compared against the expectations established during the DATA-02 seeding phase:

| Metric | Baseline Expectation | Observed Live Value | Variance / Explanation |
| :--- | :---: | :---: | :--- |
| **Total Database Courses** | 648 | **648** | Unchanged. |
| **Total Database Categories** | 30 | **30** | Unchanged. |
| **Approved Active Courses** | 610 | **610** | Unchanged. |
| **Eligible Exported Courses** | ~610 | **608** | **-2** (1 soft-deleted course + 1 test course with null category). |
| **Active Categories in Database** | 22 | **22** | Unchanged (8 soft-deleted test/legacy categories). |
| **Categories with Eligible Courses** | 20 | **20** | Unchanged (`vibe-coding` & `hardware` have 0 courses). |
| **Instructors Represented** | 4 | **4** | 3 verified teachers (518 courses) + 1 admin (90 legacy courses). |

---

## 2. Category & Domain Distribution Breakdown

The 608 eligible courses are distributed across 20 populated educational categories:

| Rank | Category Name | Domain | Eligible Courses | % of Dataset | Cumulative % |
| :---: | :--- | :--- | :---: | :---: | :---: |
| 1 | Lập trình web | Web Development | 87 | 14.31% | 14.31% |
| 2 | Lập trình | Core Software Engineering | 86 | 14.14% | 28.45% |
| 3 | Trí tuệ nhân tạo (AI) | Artificial Intelligence | 83 | 13.65% | 42.11% |
| 4 | Khoa học dữ liệu | Data Science & Analytics | 82 | 13.49% | 55.59% |
| 5 | Digital Marketing & Tăng trưởng | Marketing & Growth | 22 | 3.62% | 59.21% |
| 6 | Thiết kế UI/UX & Sản phẩm số | Product Design | 20 | 3.29% | 62.50% |
| 7 | Ngoại ngữ ứng dụng & Giao tiếp quốc tế | Languages & Certifications | 20 | 3.29% | 65.79% |
| 8 | Quản trị kinh doanh & Khởi nghiệp | Business & Entrepreneurship | 20 | 3.29% | 69.08% |
| 9 | Phát triển ứng dụng di động | Mobile Engineering | 18 | 2.96% | 72.04% |
| 10 | Phát triển bản thân & Kỹ năng mềm | Soft Skills & Personal Growth | 18 | 2.96% | 75.00% |
| 11 | Tài chính, Kế toán & Đầu tư | Finance & Accounting | 18 | 2.96% | 77.96% |
| 12 | Tin học văn phòng & Tự động hóa | Productivity & Office Automation| 18 | 2.96% | 80.92% |
| 13 | Điện toán đám mây & DevOps | Cloud & Infrastructure | 18 | 2.96% | 83.88% |
| 14 | Cơ sở dữ liệu & Kỹ thuật dữ liệu | Database & Big Data Eng | 16 | 2.63% | 86.51% |
| 15 | Quản lý dự án & Vận hành Agile | Project Management | 16 | 2.63% | 89.14% |
| 16 | An ninh mạng & Bảo mật | Cybersecurity & Infosec | 16 | 2.63% | 91.78% |
| 17 | Thiết kế đồ họa & Truyền thông thị giác | Graphic Design & Visual Arts | 16 | 2.63% | 94.41% |
| 18 | Nhiếp ảnh, Dựng phim & Sáng tạo nội dung | Media Production | 14 | 2.30% | 96.71% |
| 19 | Âm nhạc & Nghệ thuật sáng tạo | Creative Arts & Audio | 10 | 1.64% | 98.36% |
| 20 | Sức khỏe, Thể chất & Lối sống | Wellness & Physical Health | 10 | 1.64% | 100.00% |
| **Total** | | | **608** | **100.00%** | |

---

## 3. Metadata Completeness & Null Analysis

All 608 records were audited across all schema properties:

| Field | Source Type | Missing / Empty Records | % Complete | Audit Notes |
| :--- | :--- | :---: | :---: | :--- |
| `course_id` | UUID | 0 | 100.0% | Unique primary keys. |
| `title` | VarChar(255) | 0 | 100.0% | Complete. |
| `slug` | VarChar(255) | 0 | 100.0% | Complete and distinct. |
| `description` | Text | 0 | 100.0% | Complete (zero empty strings). |
| `category_id` | UUID | 0 | 100.0% | Enforced by eligibility policy. |
| `category_name` | VarChar(200) | 0 | 100.0% | Complete. |
| `level` | CourseLevel | 0 | 100.0% | Valid enums (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`). |
| `type` | CourseType | 0 | 100.0% | Valid enums (`FREE`, `PAID`). |
| `price` | Decimal $\rightarrow$ Number | 0 | 100.0% | Valid numbers in VND. |
| `old_price` | Decimal $\rightarrow$ Number | 0 | 100.0% | Valid numbers in VND. |
| `techniques` | String[] | 10 | 98.36% | Exactly 10 legacy courses have empty arrays (`[]`). |
| `requirements` | String[] | 0 | 100.0% | Complete. |
| `benefits` | String[] | 0 | 100.0% | Complete. |
| `teacher_id` | UUID | 0 | 100.0% | Complete. |
| `image` | String | 0 | 100.0% | Complete. |
| `intro_url` | String | 271 | 55.43% | Expected: 270 DATA-02 demo courses + 1 legacy course omit intro video. |

---

## 4. Text Quality & Linguistic Statistics

### 4.1 Word-Count Methodology Note
In Vietnamese, linguistic words can be monosyllabic (đơn âm) or polysyllabic/compound (từ ghép, từ láy, e.g. *"trí tuệ nhân tạo"*, *"học sâu"*, *"thiết kế đồ họa"*).  
For the statistical measures reported below, **whitespace tokenization** (space-delimited tokens/syllables) was employed. While whitespace tokenization counts syllables rather than segmented compound words, it provides an objective, reproducible baseline across languages before language-specific morphological segmenters (e.g., `pyvi`, `underthesea`, or `RDRsegmenter`) are applied in REC-02.

### 4.2 Comprehensive Text Statistics

| Text Attribute | Minimum | Maximum | Mean ($\mu$) | Median | Std Dev ($\sigma$) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Title Characters** | 20 | 109 | 69.34 | 69.00 | 10.89 |
| **Title Words (Tokens)** | 2 | 20 | 13.38 | 13.00 | 2.31 |
| **Description Characters** | 34 | 1,804 | 748.49 | 147.00 | 699.77 |
| **Description Words (Tokens)** | 7 | 371 | 150.71 | 30.00 | 142.64 |
| **Legacy Description Words (N=338)**| 7 | 45 | 24.77 | 25.00 | 7.62 |
| **DATA-02 Description Words (N=270)**| 225 | 371 | 308.37 | 312.00 | 24.63 |

### 4.3 Vocabulary Diversity
- Total unique space-delimited tokens across all titles and descriptions: **6,168 unique tokens**.
- Legacy sub-corpus unique vocabulary: **2,347 tokens**.
- DATA-02 sub-corpus unique vocabulary: **5,449 tokens**.
- Overlap between legacy and DATA-02 vocabulary: **1,628 tokens** (high core domain vocabulary sharing).

---

## 5. Duplicate and Near-Duplicate Detection

### 5.1 Exact Duplicates
- **Exact Duplicate Titles**: Exactly **1 pair** (0.16% of dataset).
  - Course A: `850bba28-aa30-5fc7-af57-eb568a991cb1`
    - Title: *"Giám Sát Hệ Thống Toàn Diện Với Prometheus và Grafana"*
    - Category: *Điện toán đám mây & DevOps* (DATA-02 cohort)
  - Course B: `e5c7f365-02a7-5db9-84d1-89b2f451fd76`
    - Title: *"Giám Sát Hệ Thống Toàn Diện Với Prometheus và Grafana"*
    - Category: *Lập trình* (Legacy cohort)
  - *Analysis*: While the title is identical, the course descriptions, techniques, and categories are completely different. Course A focuses on Kubernetes monitoring, metrics scraping, Alertmanager, and Grafana dashboards. Course B focuses on application-level Prometheus client library integration in programming projects. No deduplication is required.
- **Exact Duplicate Descriptions**: **0** (Zero identical descriptions).

### 5.2 Near-Duplicate Analysis
- Pairwise 3-gram character and word shingle Jaccard similarity was evaluated across all $\frac{608 \times 607}{2} = 184,528$ distinct pairs.
- Threshold $\ge 0.80$: **0 pairs found**.
- Threshold $\ge 0.70$: **0 pairs found**.
- Highest cross-course description similarity observed was **0.42** (between closely related courses within the same category, such as Docker Fundamentals vs. Kubernetes Advanced).
- **Conclusion**: The catalog is free of near-duplicate copy-paste descriptions.

---

## 6. Synthetic Content Risk Analysis (DATA-02 vs. Legacy)

Because DATA-02 introduced 270 synthetic courses generated by AI assistants, the dataset was audited for template artifacts:

| Audit Dimension | Legacy Cohort (N=338) | DATA-02 Seeded Cohort (N=270) | Comparative Finding |
| :--- | :--- | :--- | :--- |
| **Description Length** | Short (mean 24.8 words) | Detailed (mean 308.4 words) | **High Asymmetry**: Legacy has brief teasers; DATA-02 has 4 structured sections. |
| **Vocabulary Richness**| 2,347 unique tokens | 5,449 unique tokens | DATA-02 expanded vocabulary by +132%. |
| **Metadata Arrays** | 10 courses omit `techniques` | 100% complete (`techniques`, `benefits`, `requirements`) | DATA-02 is strictly consistent. |
| **Repetitive Boilerplate** | Low | Low (each course tailored to its specific curriculum) | No "lorem ipsum" or repeated prompt artifacts detected. |

---

## 7. Category Imbalance Analysis

- **Head Dominance**: The top 4 legacy tech categories (`Lập trình web`, `Lập trình`, `Trí tuệ nhân tạo (AI)`, `Khoa học dữ liệu`) account for **338 courses (55.59%)**.
- **Long Tail**: The remaining 16 categories account for **270 courses (44.41%)**, averaging 16.9 courses per category.
- **Smallest Categories**: `Âm nhạc & Nghệ thuật sáng tạo` (10 courses, 1.64%) and `Sức khỏe, Thể chất & Lối sống` (10 courses, 1.64%).
- **Imbalance Assessment**: This distribution accurately reflects real-world e-learning platforms (e.g. Udemy, Coursera), where Computer Science and AI have substantially higher course volumes than niche hobbies. For Content-Based Recommendation, category imbalance does not harm similarity computations, provided TF-IDF inverse document frequencies are computed across the full corpus.

---

## 8. Problematic Records & Audit Exceptions

The following specific records require notation for downstream modeling:

1. **Course `fdf556cd-89f3-4aad-a041-cb74fdc2a0f2` ("Course Hotfix 1793015610339")**:
   - Status: `APPROVED`, `categoryId: null`.
   - Action: Properly excluded from the recommendation export by the eligibility policy.
2. **Course `19253682-4aa1-51c7-82cc-076d6c37772c` ("Phục Chế và Nâng Cấp Chất Lượng Hình Ảnh Bằng Siêu Độ Phân Giải (Super Resolution)")**:
   - Status: `APPROVED`, `isDestroyed: true`.
   - Action: Properly excluded from the recommendation export.
3. **10 Legacy Courses with Empty `techniques: []`**:
   - IDs: `0a294d1b-7da9-51a1-9bb4-a82f3ef423bc`, `19a86187-b9f0-51a1-be86-d249f03d526e`, `20ba4ca3-bf72-5ca1-bf74-2e93b1d9bf89`, `2ec6da93-bb5b-568e-9ea3-ca021798e6ad`, `3b1fc434-7b96-512c-9159-f8c5b62b086e`, `4c7bbda7-36e6-52c6-a67b-1cb18cb3e9bc`, `5ad8346e-1da8-54c3-b4d2-28df529cf129`, `6ca9eb4b-01ee-564a-a03d-82d22bdf7850`, `7f212959-1912-581d-b6a8-bf228131d27f`, `8dd20ba8-29ab-58f7-872c-e362140e7cb2`.
   - Action: Downstream text feature synthesizers must handle empty `techniques` gracefully.

---

## 9. Recommendations for Feature Engineering & TF-IDF (REC-02)

To maximize recommendation accuracy in subsequent steps, the following practices are recommended:

1. **Composite Text Feature Synthesis**:
   Do not rely solely on `description` due to the length disparity between legacy and DATA-02 records. Instead, create a synthesized document representation:
   $$\text{Doc} = \text{repeat}(\text{title}, 3) + \text{repeat}(\text{category\_name}, 2) + \text{join}(\text{techniques}, \text{ " "}) \times 2 + \text{join}(\text{benefits}, \text{ " "}) + \text{description}$$
2. **Vietnamese Stopword Filtering**:
   Filter common Vietnamese grammatical particles (*"và"*, *"của"*, *"các"*, *"những"*, *"được"*, *"cho"*, *"với"*, *"trong"*, *"khóa học"*, *"bạn sẽ"*) to prevent them from dominating cosine similarity vectors.
3. **L2 Vector Normalization**:
   Use cosine normalization on TF-IDF vectors to ensure that courses with long DATA-02 descriptions do not artificially overpower courses with shorter legacy descriptions.
4. **Sub-linear Term Frequency Scaling**:
   Apply $1 + \log(\text{tf})$ scaling (`sublinear_tf=True` in scikit-learn's `TfidfVectorizer`) to diminish the influence of words repeated many times in long descriptions.

---

## 10. Overall Recommendation-Readiness Assessment

| Criterion | Readiness Rating | Rationale |
| :--- | :---: | :--- |
| **Catalog Scale & Coverage** | **EXCELLENT** | 608 vetted courses across 20 distinct educational domains. |
| **Metadata Consistency** | **EXCELLENT** | 100% titles, levels, prices, categories, and benefits intact. |
| **Linguistic Quality** | **HIGH** | Fluent academic Vietnamese, rich technical vocabulary (6,168 unique tokens). |
| **Deduplication State** | **EXCELLENT** | 0 exact duplicate descriptions; 0 near-duplicates above threshold. |
| **Overall Verdict** | **READY FOR REC-02** | The dataset is cleanly exported and mathematically validated for ML vectorization. |

