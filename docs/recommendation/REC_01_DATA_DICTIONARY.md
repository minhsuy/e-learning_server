# REC-01: RECOMMENDATION DATASET DATA DICTIONARY

**Project**: TMdemy E-Learning Platform  
**Dataset Name**: TMdemy Course Catalog Recommendation Corpus  
**Dataset Version**: `1.0.0`  
**Manifest Fingerprint**: `3e4ea41aad2d5c44c3a57a3837a9fbc8860b4c392e1ee4fa32d5e8e1051939dd` (SHA-256)  
**Primary Export Formats**:
- `data/recommendation/raw/courses.json` (Native JSON array, UTF-8)
- `data/recommendation/raw/courses.csv` (RFC 4180 CSV, UTF-8)

---

## 1. Export Schema & Field Specifications

The dataset exports exactly 18 canonical fields mapped from the PostgreSQL schema:

| Column / Key | Physical Prisma Source | Data Type | Nullable | Description & Constraints | Sample Value |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `course_id` | `Course.id` | UUID (string) | **No** | RFC 4122 v4/v5 UUID primary key. Unique identifier for the course. | `"0005ba33-88bc-5b48-bf09-c11dfbfe6217"` |
| `title` | `Course.title` | String | **No** | Official course title in Vietnamese. Max 255 chars. | `"Lập trình Frontend toàn diện với React 18"` |
| `slug` | `Course.slug` | String | **No** | Unique URL-safe slug for web routing. | `"lap-trinh-frontend-toan-dien-voi-react-18"` |
| `description` | `Course.description` | Text | **No** | Full text description of the course curriculum and objectives. | `"Khóa học cung cấp kiến thức nền tảng và nâng cao..."` |
| `category_id` | `Course.categoryId` | UUID (string) | **No** | Foreign key linking to the parent category. | `"ebfd0b83-65bd-5393-8529-e81a395a4cd1"` |
| `category_name`| `Category.name` | String | **No** | Vietnamese display name of the category. | `"Thiết kế UI/UX & Sản phẩm số"` |
| `category_slug`| `Category.slug` | String | **No** | URL slug of the category. | `"thiet-ke-ui-ux-va-san-pham-so"` |
| `level` | `Course.level` | Enum (string) | **No** | Difficulty tier: `'BEGINNER'`, `'INTERMEDIATE'`, `'ADVANCED'`. | `"INTERMEDIATE"` |
| `type` | `Course.type` | Enum (string) | **No** | Monetization type: `'PAID'`, `'FREE'`. | `"PAID"` |
| `price` | `Course.price` | Float (number) | **No** | Current course price in Vietnamese Đồng (VND). `0` for free courses. | `499000` |
| `old_price` | `Course.oldPrice` | Float (number) | **No** | Original/anchor list price in VND prior to promotion discount. | `799000` |
| `techniques` | `Course.techniques` | Array (string[]) | **No** | Key technologies, libraries, and tools taught in the course. | `["React", "Redux Toolkit", "TypeScript"]` |
| `requirements` | `Course.requirements` | Array (string[]) | **No** | Prerequisites and required background knowledge. | `["Kiến thức cơ bản về HTML/CSS/JS"]` |
| `benefits` | `Course.benefits` | Array (string[]) | **No** | Learning outcomes and competencies gained after completion. | `["Tự xây dựng ứng dụng web SPA hoàn chỉnh"]` |
| `teacher_id` | `Course.authorId` | UUID (string) | **No** | Foreign key linking to the course author (`User.id`). | `"13608f92-8acf-53e3-adcb-0d832e9cb1d4"` |
| `teacher_name`| `User.username` | String | **No** | Unique username handle of the instructor. | `"teacher02"` |
| `created_at` | `Course.createdAt` | ISO 8601 String | **No** | Creation timestamp in UTC timezone. | `"2026-10-28T15:07:16.120Z"` |
| `updated_at` | `Course.updatedAt` | ISO 8601 String | **No** | Last update timestamp in UTC timezone. | `"2026-10-28T15:07:16.120Z"` |

---

## 2. Serialization & Format Rules

### 2.1 JSON Format (`courses.json`)
- Top-level structure: An array of 608 objects.
- Encoding: UTF-8 without BOM.
- Indentation: 2 spaces.
- Array fields (`techniques`, `requirements`, `benefits`): Represented natively as JSON arrays of strings (`["item1", "item2"]`).
- Numbers (`price`, `old_price`): Serialized as native numeric values without quotes.

### 2.2 CSV Format (`courses.csv`)
- Standard: RFC 4180 compliant CSV.
- Row Delimiter: `\r\n` (CRLF).
- Field Delimiter: Comma (`,`).
- Escaping: All fields enclosed in double quotes (`"`). Internal double quotes escaped as `""`.
- Array fields (`techniques`, `requirements`, `benefits`): Encoded as valid JSON array strings (e.g. `"[\"Figma\", \"Wireframing\"]"`). This enables lossless parsing in Python without ambiguous delimiter collisions.

---

## 3. Dataset Eligibility Policy

Every record in the dataset strictly satisfies:
1. `Course.status = 'APPROVED'`
2. `Course.isDestroyed = false`
3. `Course.categoryId IS NOT NULL`
4. `Category.isDestroyed = false`

*Excluded records*: PENDING courses, REJECTED courses, soft-deleted courses, and courses linked to deleted categories.

---

## 4. Dataset Versioning & Content Fingerprinting

- **Version Scheme**: Semantic Versioning (`MAJOR.MINOR.PATCH`).
  - Current Version: `1.0.0`
- **Content Fingerprint (SHA-256)**:
  - Calculated over a deterministic canonical projection of sorted records (ordered ascending by `course_id`).
  - Independent of file generation timestamps.
  - Manifest file: `data/recommendation/manifest.json`.

---

## 5. Python Integration Guide (For ML Engineers)

### 5.1 Loading with Pandas via JSON (Recommended)

```python
import json
import pandas as pd

# Load JSON directly into a DataFrame
df = pd.read_json("data/recommendation/raw/courses.json")

print(f"Loaded {len(df)} courses across {df['category_name'].nunique()} categories.")
print(df[["title", "category_name", "level", "price"]].head())
```

### 5.2 Loading with Pandas via CSV

Because array fields are serialized as JSON strings in CSV, use `json.loads` or `ast.literal_eval` to convert them back to Python lists:

```python
import json
import pandas as pd

# Define converters for array columns
converters = {
    "techniques": json.loads,
    "requirements": json.loads,
    "benefits": json.loads
}

df_csv = pd.read_csv("data/recommendation/raw/courses.csv", converters=converters)

print(f"Loaded {len(df_csv)} courses from CSV.")
print("Sample techniques:", df_csv.loc[0, "techniques"])
```

### 5.3 Text Preprocessing Sample for Scikit-Learn TF-IDF

```python
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer

df = pd.read_json("data/recommendation/raw/courses.json")

# 1. Synthesize weighted composite document
def build_corpus_text(row):
    techs = " ".join(row["techniques"]) if isinstance(row["techniques"], list) else ""
    bens = " ".join(row["benefits"]) if isinstance(row["benefits"], list) else ""
    # Weight title (3x), category (2x), techniques (2x), benefits (1x), description (1x)
    return f"{row['title']} {row['title']} {row['title']} {row['category_name']} {row['category_name']} {techs} {techs} {bens} {row['description']}"

corpus = df.apply(build_corpus_text, axis=1)

# 2. Vectorize with sublinear TF scaling
vectorizer = TfidfVectorizer(
    sublinear_tf=True,
    min_df=2,
    ngram_range=(1, 2)
)

tfidf_matrix = vectorizer.fit_transform(corpus)
print(f"TF-IDF matrix shape: {tfidf_matrix.shape}")
```

---

## 6. API Status Statement

> [!NOTE]
> **REC-01 introduced NO API changes.**  
> No existing Express endpoints, request contracts, or response schemas were modified. The public catalog API (`GET /api/courses`, `GET /api/categories`) remains 100% frozen and backward compatible.

