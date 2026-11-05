import { CourseLevel } from '@prisma/client'
import { CourseRawDef } from './web-courses'

export const DATA_COURSES: CourseRawDef[] = [
  // 1-15: Python for Data Science & Exploratory Data Analysis (EDA)
  {
    title: 'Phân Tích Dữ Liệu Thực Chiến Với Python, Pandas và NumPy',
    slug: 'phan-tich-du-lieu-thuc-chien-voi-python-pandas-numpy',
    desc: 'Làm chủ công cụ số 1 của Data Analyst: lọc, làm sạch dữ liệu khuyết thiếu, nối bảng (merge/join), nhóm dữ liệu (groupby) và pivot tables.',
    techs: ['Python', 'Pandas', 'NumPy', 'Data Cleaning', 'Data Wrangling'],
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0
  },
  {
    title: 'Xử Lý Dữ Liệu Tốc Độ Cao Với Polars: Kỷ Nguyên Mới Thay Thế Pandas',
    slug: 'xu-ly-du-lieu-toc-do-cao-voi-polars-thay-the-pandas',
    desc: 'Tăng tốc độ xử lý dữ liệu gấp 20 lần: thư viện Polars viết bằng Rust, lazy evaluation, tối ưu bộ nhớ cho tệp dữ liệu hàng chục gigabyte.',
    techs: ['Polars', 'Rust Engine', 'Python', 'High Performance Data'],
    level: CourseLevel.INTERMEDIATE,
    price: 299000,
    oldPrice: 420000
  },
  {
    title: 'Khám Phá Dữ Liệu (Exploratory Data Analysis - EDA) Cho Dự Án Thực Tế',
    slug: 'kham-pha-du-lieu-exploratory-data-analysis-eda',
    desc: 'Quy trình khai phá dữ liệu chuẩn: phân tích đơn biến, đa biến, phát hiện ngoại lai (outliers), kiểm tra tương quan và rút ra insights giá trị.',
    techs: ['EDA', 'Data Analytics', 'Statistics', 'Seaborn', 'Python'],
    level: CourseLevel.BEGINNER,
    price: 199000,
    oldPrice: 280000
  },
  {
    title: 'Thu Thập Dữ Liệu Tự Động (Web Scraping) Với Beautiful Soup và Scrapy',
    slug: 'thu-thap-du-lieu-tu-dong-web-scraping-scrapy',
    desc: 'Tự động cào dữ liệu từ hàng nghìn trang web: xử lý phân trang, vượt Captcha, xoay vòng IP Proxy và lưu trữ dữ liệu vào database.',
    techs: ['Web Scraping', 'Scrapy', 'BeautifulSoup', 'Selenium', 'Python'],
    level: CourseLevel.INTERMEDIATE,
    price: 349000,
    oldPrice: 480000
  },
  {
    title: 'Trực Quan Hóa Dữ Liệu Khoa Học Với Matplotlib và Seaborn',
    slug: 'truc-quan-hoa-du-lieu-khoa-hoc-voi-matplotlib-seaborn',
    desc: 'Biến số liệu khô khan thành biểu đồ sống động: histogram, boxplot, heatmap tương quan, scatter plot ma trận và định dạng xuất bản báo chí.',
    techs: ['Matplotlib', 'Seaborn', 'Data Visualization', 'Python Charts'],
    level: CourseLevel.BEGINNER,
    price: 149000,
    oldPrice: 220000
  },
  {
    title: 'Xây Dựng Biểu Đồ Tương Tác và Dashboard Với Plotly và Dash',
    slug: 'xay-dung-bieu-do-tuong-tac-dashboard-plotly-dash',
    desc: 'Tạo web app phân tích dữ liệu không cần frontend: zoom, pan, hover thông tin, dropdown tương tác và triển khai ứng dụng cho sếp xem.',
    techs: ['Plotly', 'Dash', 'Interactive Visuals', 'Python Web App'],
    level: CourseLevel.INTERMEDIATE,
    price: 349000,
    oldPrice: 499000
  },
  {
    title: 'Streamlit Toàn Tập: Biến Mã Nguồn Dữ Liệu Thành Ứng Dụng Web Trong Vài Phút',
    slug: 'streamlit-toan-tap-bien-ma-nguon-du-lieu-thanh-web-app',
    desc: 'Công cụ yêu thích của Data Scientists: tạo ứng dụng demo trực quan, tải tệp Excel lên phân tích ngay lập tức và chia sẻ liên kết nội bộ.',
    techs: ['Streamlit', 'Python', 'Rapid Prototyping', 'Dashboard'],
    level: CourseLevel.BEGINNER,
    price: 199000,
    oldPrice: 299000
  },
  {
    title: 'Kỹ Thuật Xử Lý Dữ Liệu Khuyết Thiếu và Chuẩn Hóa Dữ Liệu Nâng Cao',
    slug: 'ky-thuat-xu-ly-du-lieu-khuyet-thieu-chuan-hoa-nang-cao',
    desc: 'Các phương pháp điền khuyết tinh vi: KNN Imputer, MICE (IterativeImputer), chuẩn hóa RobustScaler, xử lý phân phối lệch (skewness).',
    techs: ['Data Preprocessing', 'Feature Scaling', 'Imputation', 'Scikit-Learn'],
    level: CourseLevel.INTERMEDIATE,
    price: 249000,
    oldPrice: 350000
  },
  {
    title: 'Tự Động Hóa Xử Lý Báo Cáo Excel Bằng Python (OpenPyXL và XlsxWriter)',
    slug: 'tu-dong-hoa-xu-ly-bao-cao-excel-bang-python',
    desc: 'Giải phóng thời gian làm việc văn phòng: đọc ghi hàng trăm file Excel cùng lúc, tự định dạng màu mè, vẽ biểu đồ và gửi email tự động.',
    techs: ['OpenPyXL', 'Excel Automation', 'Python Office', 'Productivity'],
    level: CourseLevel.BEGINNER,
    price: 149000,
    oldPrice: 220000
  },
  {
    title: 'Phân Tích Dữ Liệu Chuỗi Thời Gian (Time Series Analysis) Với Statsmodels',
    slug: 'phan-tich-du-lieu-chuoi-thoi-gian-time-series-statsmodels',
    desc: 'Phân tách xu hướng (trend), mùa vụ (seasonality), kiểm định tính dừng ADF, mô hình hóa ARIMA, SARIMA và giải thuật Prophet.',
    techs: ['Time Series', 'ARIMA', 'Prophet', 'Statsmodels', 'Forecasting'],
    level: CourseLevel.ADVANCED,
    price: 449000,
    oldPrice: 650000
  },
  {
    title: 'Phân Tích Dữ Liệu Không Gian Địa Lý (Geospatial Data) Với GeoPandas',
    slug: 'phan-tich-du-lieu-khong-gian-dia-ly-geopandas',
    desc: 'Xử lý bản đồ Shapefiles, GeoJSON: tính toán khoảng cách địa lý, vẽ bản đồ nhiệt phân bố khách hàng với Folium và Shapely.',
    techs: ['GeoPandas', 'Folium', 'GIS Analysis', 'Spatial Data'],
    level: CourseLevel.INTERMEDIATE,
    price: 349000,
    oldPrice: 480000
  },
  {
    title: 'Phân Tích Dữ Liệu Lớn Không Đủ Bộ Nhớ RAM Bằng Dask',
    slug: 'phan-tich-du-lieu-lon-khong-du-ram-bang-dask',
    desc: 'Chạy Pandas song song trên nhiều CPU: xử lý file CSV trăm gigabyte vượt quá dung lượng RAM máy tính cá nhân dễ dàng.',
    techs: ['Dask', 'Parallel Computing', 'Out-of-Core Data', 'Python'],
    level: CourseLevel.ADVANCED,
    price: 399000,
    oldPrice: 550000
  },
  {
    title: 'Khai Phá Dữ Liệu Văn Bản Cơ Bản: Biến Dữ Liệu Chữ Viết Thành Con Số',
    slug: 'khai-pha-du-lieu-van-ban-co-ban-text-mining',
    desc: 'Tiền xử lý tiếng Việt: tách từ, loại bỏ stopwords, TF-IDF, đám mây từ (WordCloud) và phân tích cảm xúc (Sentiment Analysis).',
    techs: ['Text Mining', 'NLTK', 'TF-IDF', 'NLP Basics'],
    level: CourseLevel.BEGINNER,
    price: 199000,
    oldPrice: 280000
  },
  {
    title: 'Thực Hành 20 Dự Án Phân Tích Dữ Liệu Thực Tế Cho Portfolio',
    slug: 'thuc-hanh-20-du-an-phan-tich-du-lieu-thuc-te-portfolio',
    desc: 'Xây dựng hồ sơ xin việc ấn tượng: phân tích doanh số bán hàng, tỷ lệ rời bỏ của khách hàng, dữ liệu COVID-19 và đánh giá phim.',
    techs: ['Data Portfolio', 'Python', 'Case Studies', 'Resume Building'],
    level: CourseLevel.INTERMEDIATE,
    price: 499000,
    oldPrice: 750000
  },
  {
    title: 'Jupyter Lab và Môi Trường Làm Việc Chuẩn Khoa Học Dữ Liệu',
    slug: 'jupyter-lab-va-moi-truong-chuan-khoa-hoc-du-lieu',
    desc: 'Sử dụng Conda môi trường ảo, Jupyter extensions, phím tắt tăng năng suất, tương tác Git và viết markdown báo cáo khoa học.',
    techs: ['Jupyter Lab', 'Conda', 'Virtual Environments', 'Productivity'],
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0
  },

  // 16-30: Business Intelligence, Power BI & Tableau
  {
    title: 'Power BI Thực Chiến: Từ Dữ Liệu Thô Đến Báo Cáo Quản Trị Đỉnh Cao',
    slug: 'power-bi-thuc-chien-tu-du-lieu-tho-den-bao-cao-quan-tri',
    desc: 'Làm chủ Power BI từ gốc: Power Query làm sạch dữ liệu, xây dựng Data Model hình sao (Star Schema), trực quan hóa chuyên nghiệp.',
    techs: ['Power BI', 'Power Query', 'Data Modeling', 'Star Schema'],
    level: CourseLevel.BEGINNER,
    price: 299000,
    oldPrice: 420000
  },
  {
    title: 'Làm Chủ Ngôn Ngữ DAX Trong Power BI: Từ Cơ Bản Đến Công Thức Nâng Cao',
    slug: 'lam-chu-ngon-ngu-dax-trong-power-bi',
    desc: 'Bí quyết tạo các chỉ số đo lường (Measures) thông minh: hàm CALCULATE, Time Intelligence, Filter Context và tối ưu tốc độ DAX.',
    techs: ['DAX', 'Power BI', 'CALCULATE', 'Time Intelligence'],
    level: CourseLevel.INTERMEDIATE,
    price: 399000,
    oldPrice: 550000
  },
  {
    title: 'Tableau Desktop Chuyên Nghiệp: Trực Quan Hóa Dữ Liệu Doanh Nghiệp',
    slug: 'tableau-desktop-chuyen-nghiep-truc-quan-hoa-du-lieu',
    desc: 'Khóa học ôn thi chứng chỉ Tableau Desktop Specialist: Calculated fields, Level of Detail (LOD) expressions, Parameter và Storyboards.',
    techs: ['Tableau', 'LOD Expressions', 'Data Visualization', 'BI'],
    level: CourseLevel.INTERMEDIATE,
    price: 449000,
    oldPrice: 650000
  },
  {
    title: 'Nghệ Thuật Kể Chuyện Bằng Dữ Liệu (Data Storytelling) Dành Cho Quản Lý',
    slug: 'nghe-thuat-ke-chuyen-bang-du-lieu-data-storytelling',
    desc: 'Thuyết phục ban lãnh đạo bằng dữ liệu: nguyên lý Gestalt trong thị giác, chọn loại biểu đồ chuẩn xác và cấu trúc bài thuyết trình kịch tính.',
    techs: ['Data Storytelling', 'Executive Reporting', 'Communication', 'Visual Design'],
    level: CourseLevel.BEGINNER,
    price: 249000,
    oldPrice: 350000
  },
  {
    title: 'Thiết Kế Dashboard Điều Hành Doanh Nghiệp (C-Level Dashboard Design)',
    slug: 'thiet-ke-dashboard-dieu-hanh-doanh-nghiep-c-level',
    desc: 'Các chỉ số quan trọng sống còn: Doanh thu, Lợi nhuận, Chi phí chuyển đổi khách hàng (CAC), Giá trị trọn đời (LTV) và tỷ lệ Churn.',
    techs: ['Dashboard Design', 'Executive KPI', 'Business Metrics', 'Power BI'],
    level: CourseLevel.INTERMEDIATE,
    price: 349000,
    oldPrice: 480000
  },
  {
    title: 'Google Looker Studio (Google Data Studio): Báo Cáo Marketing Miễn Phí',
    slug: 'google-looker-studio-bao-cao-marketing-mien-phi',
    desc: 'Kết nối tự động dữ liệu Google Analytics 4, Google Ads, Facebook Ads và YouTube: thiết kế báo cáo tự động cập nhật hàng ngày.',
    techs: ['Looker Studio', 'Google Analytics 4', 'Marketing Analytics'],
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0
  },
  {
    title: 'Quản Trị Hệ Thống Power BI Server và Chia Sẻ Báo Cáo Trong Doanh Nghiệp',
    slug: 'quan-tri-he-thong-power-bi-server-doanh-nghiep',
    desc: 'Phân quyền Row-Level Security (RLS) theo chi nhánh, thiết lập lịch tự động làm mới dữ liệu (On-premises Data Gateway), quản lý Workspace.',
    techs: ['Power BI Service', 'RLS Security', 'Data Gateway', 'Governance'],
    level: CourseLevel.ADVANCED,
    price: 499000,
    oldPrice: 699000
  },
  {
    title: 'Xây Dựng Báo Cáo Tài Chính và Phân Tích Dòng Tiền Trên Power BI',
    slug: 'xay-dung-bao-cao-tai-chinh-phan-tich-dong-tien-power-bi',
    desc: 'Mô hình hóa Báo cáo kết quả kinh doanh (P&L), Bảng cân đối kế toán, phân tích phương sai (Variance analysis) và dự báo dòng tiền.',
    techs: ['Financial Modeling', 'P&L Report', 'Power BI Finance', 'Variance Analysis'],
    level: CourseLevel.INTERMEDIATE,
    price: 399000,
    oldPrice: 550000
  },
  {
    title: 'Phân Tích Dữ Liệu Bán Lẻ và Chuỗi Cung Ứng Với Tableau',
    slug: 'phan-tich-du-lieu-ban-le-chuoi-cung-ung-tableau',
    desc: 'Tối ưu hóa hàng tồn kho: phân tích chu kỳ quay vòng hàng hóa, dự báo nhu cầu lưu kho, biểu đồ nhiệt vị trí kệ hàng và tỷ lệ giao trễ.',
    techs: ['Tableau', 'Supply Chain Analytics', 'Retail Data', 'Inventory'],
    level: CourseLevel.INTERMEDIATE,
    price: 349000,
    oldPrice: 480000
  },
  {
    title: 'Excel Nâng Cao Dành Cho Chuyên Viên Phân Tích Dữ Liệu (Power Query & Pivot)',
    slug: 'excel-nang-cao-cho-chuyen-vien-phan-tich-du-lieu',
    desc: 'Nâng trình Excel lên tầm chuyên gia: XLOOKUP, hàm mảng động FILTER/SORT/UNIQUE, Power Query gom nhiều file và Data Model.',
    techs: ['Excel Advanced', 'Power Query', 'Dynamic Arrays', 'XLOOKUP'],
    level: CourseLevel.BEGINNER,
    price: 199000,
    oldPrice: 299000
  },
  {
    title: 'Tự Động Hóa Dashboard Power BI Bằng Ngôn Ngữ Python và R Nhúng',
    slug: 'tu-dong-hoa-dashboard-power-bi-python-r-nhung',
    desc: 'Tích hợp biểu đồ tùy biến cao cấp: chạy script Python trực tiếp trong Power Query để làm sạch và dùng Matplotlib vẽ hình trên Power BI.',
    techs: ['Power BI', 'Python Integration', 'R Script', 'Advanced Visuals'],
    level: CourseLevel.ADVANCED,
    price: 349000,
    oldPrice: 480000
  },
  {
    title: 'Metabase: Nền Tảng Phân Tích Dữ Liệu Mã Nguồn Mở Tự Host Cho Doanh Nghiệp',
    slug: 'metabase-nen-tang-phan-tich-du-lieu-ma-nguon-mo',
    desc: 'Thay thế các phần mềm BI đắt đỏ: cài đặt Metabase trên Docker, kết nối PostgreSQL/MySQL, tạo câu hỏi trực quan và gửi thông báo Slack.',
    techs: ['Metabase', 'Open Source BI', 'SQL Dashboard', 'Docker'],
    level: CourseLevel.BEGINNER,
    price: 149000,
    oldPrice: 220000
  },
  {
    title: 'Phân Tích Hiệu Suất Nhân Sự (HR Analytics) Bằng Bảng Biểu Trực Quan',
    slug: 'phan-tich-hieu-suat-nhan-su-hr-analytics',
    desc: 'Đo lường sức khỏe tổ chức: tỷ lệ nhân viên nghỉ việc (Attrition rate), thời gian tuyển dụng trung bình, phân tích gắn kết và lương thưởng.',
    techs: ['HR Analytics', 'People Analytics', 'Power BI', 'KPI Reporting'],
    level: CourseLevel.BEGINNER,
    price: 199000,
    oldPrice: 280000
  },
  {
    title: 'Phân Tích Hành Vi Người Dùng Ứng Dụng Di Động Bằng Mixpanel và Amplitude',
    slug: 'phan-tich-hanh-vi-nguoi-dung-mixpanel-amplitude',
    desc: 'Làm chủ Product Analytics: phễu chuyển đổi (Funnels), giữ chân người dùng (Retention cohorts), theo dõi sự kiện (Event tracking).',
    techs: ['Product Analytics', 'Amplitude', 'Mixpanel', 'Cohort Analysis'],
    level: CourseLevel.INTERMEDIATE,
    price: 299000,
    oldPrice: 420000
  },
  {
    title: 'Bí Quyết Phỏng Vấn Vị Trí Data Analyst: Case Study Thực Tế Tại Doanh Nghiệp',
    slug: 'bi-quyet-phong-van-data-analyst-case-study',
    desc: 'Luyện đề phỏng vấn Business Sense: phân tích số liệu tụt dốc, giải quyết bài toán định giá và trình bày trực tiếp trước hội đồng tuyển dụng.',
    techs: ['Interview Prep', 'Data Analyst', 'Business Sense', 'Case Studies'],
    level: CourseLevel.INTERMEDIATE,
    price: 249000,
    oldPrice: 350000
  },

  // 31-45: SQL, Data Warehousing & Data Engineering
  {
    title: 'SQL Chuyên Sâu Cho Phân Tích Dữ Liệu và Kho Dữ Liệu Doanh Nghiệp',
    slug: 'sql-chuyen-sau-cho-phan-tich-du-lieu-kho-du-lieu',
    desc: 'Viết truy vấn phân tích đỉnh cao: Window Functions (ROW_NUMBER, DENSE_RANK, LEAD/LAG), CTE lồng nhau, Pivoting và tự tạo hàm UDF.',
    techs: ['Advanced SQL', 'Window Functions', 'CTEs', 'Analytics Queries'],
    level: CourseLevel.INTERMEDIATE,
    price: 299000,
    oldPrice: 420000
  },
  {
    title: 'Thiết Kế Kho Dữ Liệu Hiện Đại (Modern Data Warehouse) Với Snowflake',
    slug: 'thiet-ke-kho-du-lieu-hien-dai-snowflake',
    desc: 'Làm chủ nền tảng Cloud Data Warehouse số 1: kiến trúc tách biệt Compute và Storage, Virtual Warehouses, Time Travel và Data Sharing.',
    techs: ['Snowflake', 'Cloud Data Warehouse', 'Data Architecture', 'SQL'],
    level: CourseLevel.ADVANCED,
    price: 649000,
    oldPrice: 899000
  },
  {
    title: 'Google BigQuery Toàn Tập: Xử Lý Truy Vấn Petabyte Dữ Liệu Trong Vài Giây',
    slug: 'google-bigquery-toan-tap-xu-ly-truy-van-petabyte',
    desc: 'Serverless Data Warehouse của Google: Partitioned Tables, Clustered Tables, BigQuery ML huấn luyện AI bằng SQL và tối ưu chi phí slot.',
    techs: ['BigQuery', 'GCP', 'Data Warehouse', 'BigQuery ML'],
    level: CourseLevel.ADVANCED,
    price: 549000,
    oldPrice: 799000
  },
  {
    title: 'Làm Chủ dbt (Data Build Tool): Biến Đổi Dữ Liệu Chuẩn Kỹ Sư Phần Mềm',
    slug: 'lam-chu-dbt-data-build-tool-bien-doi-du-lieu',
    desc: 'Chuẩn mực ngành mới cho Analytics Engineering: mô hình hóa dữ liệu dạng module (Models), kiểm thử tự động (Tests) và sinh tài liệu tự động.',
    techs: ['dbt', 'Analytics Engineering', 'Data Modeling', 'Data Testing'],
    level: CourseLevel.INTERMEDIATE,
    price: 499000,
    oldPrice: 699000
  },
  {
    title: 'Xây Dựng Đường Ống Dữ Liệu (ETL Pipeline) Với Apache Airflow',
    slug: 'xay-dung-duong-ong-du-lieu-etl-apache-airflow',
    desc: 'Điều phối luồng công việc tự động: định nghĩa Directed Acyclic Graphs (DAGs) bằng Python, quản lý task dependencies, retry và cảnh báo lỗi.',
    techs: ['Apache Airflow', 'ETL', 'Data Orchestration', 'Python DAGs'],
    level: CourseLevel.ADVANCED,
    price: 599000,
    oldPrice: 850000
  },
  {
    title: 'Khai Phá Dữ Liệu Lớn Với Apache Spark và PySpark Chuyên Sâu',
    slug: 'khai-pha-du-lieu-lon-voi-apache-spark-va-pyspark',
    desc: 'Tính toán phân tán trên cụm máy chủ: RDDs, DataFrames, Spark SQL, tối ưu hóa Catalyst Optimizer, broadcast joins và giải quyết data skew.',
    techs: ['Apache Spark', 'PySpark', 'Big Data', 'Distributed Computing'],
    level: CourseLevel.ADVANCED,
    price: 699000,
    oldPrice: 999000
  },
  {
    title: 'Databricks và Kiến Trúc Lakehouse Hiện Đại (Delta Lake)',
    slug: 'databricks-va-kien-truc-lakehouse-hien-dai-delta-lake',
    desc: 'Kết hợp sức mạnh của Data Lake và Data Warehouse: kiến trúc Medallion (Bronze - Silver - Gold), ACID transactions trên tệp Parquet.',
    techs: ['Databricks', 'Delta Lake', 'Lakehouse', 'Apache Spark'],
    level: CourseLevel.ADVANCED,
    price: 749000,
    oldPrice: 1099000
  },
  {
    title: 'Xử Lý Luồng Dữ Liệu Thời Gian Thực (Streaming Data) Với Kafka và Flink',
    slug: 'xu-ly-luong-du-lieu-thoi-gian-thuc-kafka-flink',
    desc: 'Truy vấn dữ liệu đang chảy: Event Time, Watermarks, Windowing (Tumbling, Sliding), Stateful stream processing không để sót sự kiện.',
    techs: ['Apache Kafka', 'Apache Flink', 'Stream Processing', 'Realtime Data'],
    level: CourseLevel.ADVANCED,
    price: 699000,
    oldPrice: 999000
  },
  {
    title: 'Mô Hình Hóa Dữ Liệu Kho Chiều (Dimensional Modeling - Kimball Methodology)',
    slug: 'mo-hinh-hoa-du-lieu-kho-chieu-kimball-methodology',
    desc: 'Kinh điển thiết kế Data Warehouse: Fact Tables (giao dịch, snapshot), Dimension Tables, Conformed Dimensions và SCD loại 1, 2, 3.',
    techs: ['Kimball Modeling', 'Star Schema', 'SCD Type 2', 'Data Architecture'],
    level: CourseLevel.INTERMEDIATE,
    price: 349000,
    oldPrice: 480000
  },
  {
    title: 'Quản Lý Chất Lượng Dữ Liệu (Data Quality) Với Great Expectations',
    slug: 'quan-ly-chat-luong-du-lieu-great-expectations',
    desc: 'Ngăn chặn dữ liệu rác làm hỏng dashboard: viết unit tests cho dữ liệu, kiểm tra null, khoảng giá trị hợp lệ và sinh báo cáo Data Docs.',
    techs: ['Great Expectations', 'Data Quality', 'DataOps', 'Testing'],
    level: CourseLevel.INTERMEDIATE,
    price: 299000,
    oldPrice: 420000
  },
  {
    title: 'Hợp Đồng Dữ Liệu (Data Contracts): Chuẩn Hóa Giao Tiếp Giữa Software và Data',
    slug: 'hop-dong-du-lieu-data-contracts-chuan-hoa-giao-tiep',
    desc: 'Chấm dứt tình trạng backend đổi code làm gãy pipeline dữ liệu: thiết lập schema hợp đồng, kiểm tra tương thích ngược và thông báo tự động.',
    techs: ['Data Contracts', 'Data Governance', 'Schema Evolution', 'Protobuf'],
    level: CourseLevel.INTERMEDIATE,
    price: 249000,
    oldPrice: 350000
  },
  {
    title: 'Hệ Thống Lưu Trữ Tệp Định Dạng Cột: Parquet, ORC và Avro',
    slug: 'he-thong-luu-tru-dinh-dang-cot-parquet-orc-avro',
    desc: 'Hiểu cấu trúc vật lý tiết kiệm 80% dung lượng đĩa: nén Snappy, từ điển mã hóa, predicate pushdown và tối ưu tốc độ đọc dữ liệu lớn.',
    techs: ['Parquet', 'Columnar Storage', 'Avro', 'Big Data Formats'],
    level: CourseLevel.BEGINNER,
    price: 149000,
    oldPrice: 220000
  },
  {
    title: 'Quản Trị Metadata và Danh Mục Dữ Liệu (Data Catalog) Với DataHub',
    slug: 'quan-tri-metadata-danh-muc-du-lieu-datahub',
    desc: 'Tìm kiếm nguồn gốc dữ liệu (Data Lineage): biết chính xác dữ liệu bảng báo cáo lấy từ API nào, tác động thế nào khi thay đổi cấu trúc bảng.',
    techs: ['Data Catalog', 'DataHub', 'Data Lineage', 'Governance'],
    level: CourseLevel.ADVANCED,
    price: 399000,
    oldPrice: 550000
  },
  {
    title: 'Nhập Môn Data Engineering: Lộ Trình Toàn Diện Cho Người Chuyển Ngành',
    slug: 'nhap-mon-data-engineering-lo-trinh-toan-dien',
    desc: 'Bức tranh toàn cảnh: phân biệt OLTP vs OLAP, Data Lake vs Data Warehouse, các công cụ thiết yếu và bài tập thực hành tổng hợp.',
    techs: ['Data Engineering', 'Roadmap', 'ETL Basics', 'Cloud Data'],
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0
  },
  {
    title: 'Bảo Mật và Tuân Thủ Dữ Liệu Doanh Nghiệp (GDPR, HIPAA & An Toàn Dữ Liệu)',
    slug: 'bao-mat-tuan-thu-du-lieu-doanh-nghiep-gdpr-hipaa',
    desc: 'Bảo vệ thông tin cá nhân PII: mặt nạ dữ liệu (Data Masking), mã hóa cột nhạy cảm, cấp quyền truy cập theo vai trò và kiểm toán audit logs.',
    techs: ['Data Security', 'PII Masking', 'GDPR Compliance', 'Access Control'],
    level: CourseLevel.INTERMEDIATE,
    price: 299000,
    oldPrice: 420000
  },

  // 46-60: Statistics, Probability & Mathematics for Data
  {
    title: 'Xác Suất Thống Kê Ứng Dụng Trong Khoa Học Dữ Liệu và AI',
    slug: 'xac-suat-thong-ke-ung-dung-trong-khoa-hoc-du-lieu-ai',
    desc: 'Hiểu bản chất các con số: biến ngẫu nhiên, phân phối chuẩn (Gaussian), định lý giới hạn trung tâm CLT, kỳ vọng và phương sai.',
    techs: ['Statistics', 'Probability', 'Normal Distribution', 'Math for Data'],
    level: CourseLevel.BEGINNER,
    price: 199000,
    oldPrice: 299000
  },
  {
    title: 'Kiểm Định Giả Thuyết (Hypothesis Testing) và Thử Nghiệm A/B Testing Chuyên Sâu',
    slug: 'kiem-dinh-gia-thuyet-va-thu-nghiem-ab-testing',
    desc: 'Ra quyết định dựa trên khoa học: t-test, z-test, ANOVA, chi-square, giá trị p-value, sai lầm loại 1 và loại 2, tính toán cỡ mẫu cần thiết.',
    techs: ['A/B Testing', 'Hypothesis Testing', 'P-Value', 'Statistical Power'],
    level: CourseLevel.INTERMEDIATE,
    price: 349000,
    oldPrice: 480000
  },
  {
    title: 'Đại Số Tuyến Tính (Linear Algebra) Ứng Dụng Trong Học Máy và Xử Lý Dữ Liệu',
    slug: 'dai-so-tuyen-tinh-linear-algebra-ung-dung-hoc-may',
    desc: 'Cột trụ toán học của AI: vector, ma trận, phép nhân ma trận, định thức, eigenvalues, eigenvectors và phân tích suy biến SVD.',
    techs: ['Linear Algebra', 'Vectors', 'Matrices', 'Eigenvalues', 'Math for ML'],
    level: CourseLevel.BEGINNER,
    price: 199000,
    oldPrice: 280000
  },
  {
    title: 'Giải Tích Đa Biến và Tối Ưu Hóa (Calculus & Optimization) Cho AI',
    slug: 'giai-tich-da-bien-va-toi-uu-hoa-calculus-ai',
    desc: 'Hiểu cội nguồn thuật toán học: đạo hàm riêng, ma trận Jacobian, ma trận Hessian, Gradient Descent và phương pháp nhân tử Lagrange.',
    techs: ['Multivariable Calculus', 'Gradient Descent', 'Optimization', 'Math'],
    level: CourseLevel.INTERMEDIATE,
    price: 249000,
    oldPrice: 350000
  },
  {
    title: 'Thống Kê Bayes (Bayesian Statistics) và Mô Hình Xác Suất',
    slug: 'thong-ke-bayes-bayesian-statistics-mo-hinh-xac-suat',
    desc: 'Tư duy cập nhật niềm tin theo bằng chứng: định lý Bayes, phân phối Prior/Posterior, phương pháp Monte Carlo chuỗi Markov (MCMC).',
    techs: ['Bayesian Stats', 'PyMC', 'MCMC', 'Probabilistic Modeling'],
    level: CourseLevel.ADVANCED,
    price: 449000,
    oldPrice: 650000
  },
  {
    title: 'Phân Tích Hồi Quy Tuyến Tính và Logistic: Nền Tảng Mô Hình Hóa Thống Kê',
    slug: 'phan-tich-hoi-quy-tuyen-tinh-logistic-thong-ke',
    desc: 'Đi sâu vào giả định mô hình: phương sai không đổi (homoscedasticity), đa cộng tuyến VIF, phân tích phần dư residuals và đánh giá R-squared.',
    techs: ['Regression Analysis', 'Logistic Regression', 'Residuals', 'Statistics'],
    level: CourseLevel.BEGINNER,
    price: 199000,
    oldPrice: 280000
  },
  {
    title: 'Kỹ Thuật Lấy Mẫu Dữ Liệu (Sampling Techniques) và Bootstrapping',
    slug: 'ky-thuat-lay-mau-du-lieu-bootstrapping',
    desc: 'Lấy mẫu chuẩn xác khi dữ liệu mất cân bằng: Stratified sampling, Cluster sampling, Bootstrapping tính khoảng tin cậy không cần giả định phân phối.',
    techs: ['Bootstrapping', 'Sampling', 'Confidence Intervals', 'Resampling'],
    level: CourseLevel.INTERMEDIATE,
    price: 249000,
    oldPrice: 350000
  },
  {
    title: 'Phân Tích Tương Quan và Nhân Quả (Correlation vs Causation): Causal Inference',
    slug: 'phan-tich-tuong-quan-va-nhan-qua-causal-inference',
    desc: 'Vượt ra ngoài tương quan đơn thuần: đồ thị nhân quả DAGs, phương pháp biến công cụ (Instrumental Variables), Difference-in-Differences.',
    techs: ['Causal Inference', 'Do-Calculus', 'Econometrics', 'Natural Experiments'],
    level: CourseLevel.ADVANCED,
    price: 499000,
    oldPrice: 699000
  },
  {
    title: 'Thống Kê Phi Tham Số (Non-Parametric Statistics) và Kiểm Định Thứ Hạng',
    slug: 'thong-ke-phi-tham-so-kiem-dinh-thu-hang',
    desc: 'Khi dữ liệu không tuân theo phân phối chuẩn: Mann-Whitney U test, Wilcoxon signed-rank test, Kruskal-Wallis test và tương quan Spearman.',
    techs: ['Non-parametric', 'Mann-Whitney', 'Spearman', 'Ranking Tests'],
    level: CourseLevel.INTERMEDIATE,
    price: 199000,
    oldPrice: 299000
  },
  {
    title: 'Toán Học Cho Khoa Học Dữ Liệu: Khóa Học Tổng Quan Dễ Hiểu Không Đau Đầu',
    slug: 'toan-hoc-cho-khoa-hoc-du-lieu-tong-quan-de-hieu',
    desc: 'Ôn tập toàn bộ kiến thức toán cần thiết bằng hình ảnh và ví dụ trực quan trong code Python, không công thức khô khan đánh đố.',
    techs: ['Math Basics', 'Intuitive Math', 'Python Math', 'Data Foundations'],
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0
  },
  {
    title: 'Phân Tích Sống Sót (Survival Analysis) Trong Y Tế và Dự Đoán Churn Khách Hàng',
    slug: 'phan-tich-song-sot-survival-analysis-churn',
    desc: 'Mô hình hóa thời gian cho đến khi sự kiện xảy ra: đường cong sống sót Kaplan-Meier, mô hình hồi quy rủi ro tỷ lệ Cox.',
    techs: ['Survival Analysis', 'Kaplan-Meier', 'Cox Regression', 'Customer Churn'],
    level: CourseLevel.ADVANCED,
    price: 399000,
    oldPrice: 550000
  },
  {
    title: 'Lý Thuyết Hàng Đợi (Queueing Theory) và Mô Phỏng Sự Kiện Rời Rạc Với SimPy',
    slug: 'ly-thuyet-hang-doi-mo-phong-su-kien-simpy',
    desc: 'Mô phỏng tối ưu hóa vận hành: thời gian chờ đợi tại quầy thanh toán, bệnh viện, sân bay bằng mô hình toán học và code Python.',
    techs: ['SimPy', 'Queueing Theory', 'Discrete Event Simulation', 'Operations'],
    level: CourseLevel.ADVANCED,
    price: 349000,
    oldPrice: 480000
  },
  {
    title: 'Phân Tích Thành Phần Chính (PCA) và Kỹ Thuật Giảm Chiều Dữ Liệu',
    slug: 'phan-tich-thanh-phan-chinh-pca-giam-chieu',
    desc: 'Nén hàng trăm biến thành vài trục chính: toán học đằng sau PCA, t-SNE, UMAP để hiển thị dữ liệu nhiều chiều lên mặt phẳng 2D/3D.',
    techs: ['PCA', 'Dimensionality Reduction', 't-SNE', 'UMAP', 'Data Geometry'],
    level: CourseLevel.INTERMEDIATE,
    price: 299000,
    oldPrice: 420000
  },
  {
    title: 'Lý Thuyết Thông Tin (Information Theory) Ứng Dụng Trong Dữ Liệu',
    slug: 'ly-thuyet-thong-tin-information-theory-du-lieu',
    desc: 'Đo lường lượng thông tin và độ hỗn loạn: Entropy Shannon, Mutual Information, Kullback-Leibler (KL) Divergence trong khoa học dữ liệu.',
    techs: ['Information Theory', 'Entropy', 'KL Divergence', 'Data Science'],
    level: CourseLevel.ADVANCED,
    price: 349000,
    oldPrice: 480000
  },
  {
    title: 'Thực Hành Phân Tích Thống Kê Bằng Phần Mềm SPSS Cho Nghiên Cứu Thị Trường',
    slug: 'thuc-hanh-phan-tich-thong-ke-spss-nghien-cuu-thi-truong',
    desc: 'Công cụ kinh điển cho luận văn và khảo sát: kiểm định độ tin cậy Cronbach Alpha, phân tích nhân tố khám phá EFA và hồi quy đa biến.',
    techs: ['SPSS', 'Market Research', 'Cronbach Alpha', 'EFA'],
    level: CourseLevel.BEGINNER,
    price: 249000,
    oldPrice: 350000
  },

  // 61-75: Domain Analytics: Marketing, Finance, Healthcare & Retail
  {
    title: 'Phân Tích Dữ Liệu Marketing (Marketing Analytics) Toàn Diện',
    slug: 'phan-tich-du-lieu-marketing-marketing-analytics-toan-dien',
    desc: 'Tối ưu hóa ngân sách quảng cáo: mô hình phân bổ chuyển đổi (Multi-Touch Attribution), phân khúc khách hàng RFM và giá trị trọn đời CLV.',
    techs: ['Marketing Analytics', 'RFM Analysis', 'Attribution Modeling', 'ROI'],
    level: CourseLevel.INTERMEDIATE,
    price: 399000,
    oldPrice: 550000
  },
  {
    title: 'Phân Tích Dữ Liệu Tài Chính và Đầu Tư Chứng Khoán Với Python',
    slug: 'phan-tich-du-lieu-tai-chinh-chung-khoan-python',
    desc: 'Thu thập giá cổ phiếu tự động: tính toán lợi nhuận, độ lệch chuẩn rủi ro, tỷ số Sharpe, danh mục đầu tư tối ưu Markowitz và Backtesting.',
    techs: ['Financial Analytics', 'Stock Market', 'Portfolio Optimization', 'Backtesting'],
    level: CourseLevel.ADVANCED,
    price: 549000,
    oldPrice: 799000
  },
  {
    title: 'Phát Hiện Gian Lận Thẻ Tín Dụng và Rửa Tiền Bằng Khoa Học Dữ Liệu',
    slug: 'phat-hien-gian-lan-the-tin-dung-rua-tien-data-science',
    desc: 'Bảo vệ ngân hàng: xử lý bài toán dữ liệu mất cân bằng cực đại (1/10000 giao dịch gian lận), SMOTE, Isolation Forest và Autoencoders.',
    techs: ['Fraud Detection', 'Anomaly Detection', 'Imbalanced Data', 'Fintech'],
    level: CourseLevel.ADVANCED,
    price: 599000,
    oldPrice: 850000
  },
  {
    title: 'Phân Tích Dữ Liệu Thương Mại Điện Tử (E-Commerce Analytics): Tăng Tỷ Lệ Mua Hàng',
    slug: 'phan-tich-du-lieu-thuong-mai-dien-tu-e-commerce-analytics',
    desc: 'Giải quyết bài toán bỏ quên giỏ hàng (Cart Abandonment): phân tích đường dẫn duyệt web, tối ưu chương trình khuyến mãi và gợi ý sản phẩm bán kèm.',
    techs: ['E-Commerce Data', 'Funnel Analysis', 'Cart Abandonment', 'Conversion'],
    level: CourseLevel.INTERMEDIATE,
    price: 349000,
    oldPrice: 480000
  },
  {
    title: 'Khoa Học Dữ Liệu Trong Y Tế và Chăm Sóc Sức Khỏe (Healthcare Analytics)',
    slug: 'khoa-hoc-du-lieu-trong-y-te-healthcare-analytics',
    desc: 'Phân tích hồ sơ bệnh án điện tử EHR: dự đoán nguy cơ tái nhập viện, phân tích hiệu quả phác đồ điều trị và bảo mật dữ liệu y tế.',
    techs: ['Healthcare Analytics', 'EHR Data', 'Clinical Data', 'Medical Stats'],
    level: CourseLevel.ADVANCED,
    price: 499000,
    oldPrice: 699000
  },
  {
    title: 'Phân Tích Dữ Liệu Khách Hàng Viễn Thông: Giảm Thiểu Tỷ Lệ Hủy Hợp Đồng',
    slug: 'phan-tich-du-lieu-khach-hang-vien-thong-churn',
    desc: 'Dự đoán trước khi khách hàng chuyển mạng: phân tích lưu lượng cuộc gọi, hóa đơn hàng tháng, khiếu nại dịch vụ và chiến dịch giữ chân.',
    techs: ['Customer Retention', 'Telecom Analytics', 'Churn Prediction', 'Case Study'],
    level: CourseLevel.INTERMEDIATE,
    price: 299000,
    oldPrice: 420000
  },
  {
    title: 'Xây Dựng Hệ Thống Báo Cáo Phân Tích Chuỗi Nhà Hàng và F&B',
    slug: 'xay-dung-bao-cao-phan-tich-chuoi-nha-hang-f-and-b',
    desc: 'Tối ưu chi phí thực phẩm (Food Cost): quản lý lãng phí nguyên vật liệu, phân tích doanh thu theo khung giờ, hiệu quả từng món trên menu.',
    techs: ['F&B Analytics', 'Menu Engineering', 'Food Cost', 'Power BI'],
    level: CourseLevel.BEGINNER,
    price: 249000,
    oldPrice: 350000
  },
  {
    title: 'Phân Tích Dữ Liệu Năng Lượng và Lưới Điện Thông Minh (Smart Grid Data)',
    slug: 'phan-tich-du-lieu-nang-luong-luoi-dien-thong-minh',
    desc: 'Dự báo phụ tải điện: cân bằng cung cầu năng lượng tái tạo (điện mặt trời, gió) dựa trên dữ liệu cảm biến thời tiết và mức tiêu thụ thực tế.',
    techs: ['Smart Grid', 'Energy Analytics', 'IoT Sensor Data', 'Forecasting'],
    level: CourseLevel.ADVANCED,
    price: 449000,
    oldPrice: 650000
  },
  {
    title: 'Phân Tích Rủi Ro Tín Dụng và Chấm Điểm Khách Hàng Vay Vốn (Credit Scoring)',
    slug: 'phan-tich-rui-ro-tin-dung-cham-diem-khach-hang-vay',
    desc: 'Tiêu chuẩn ngành ngân hàng: tính toán xác suất vỡ nợ PD, tổn thất khi vỡ nợ LGD, thẻ điểm tín dụng Scorecard theo chuẩn Basel II/III.',
    techs: ['Credit Scoring', 'Risk Modeling', 'Fintech', 'Weight of Evidence'],
    level: CourseLevel.ADVANCED,
    price: 649000,
    oldPrice: 899000
  },
  {
    title: 'Phân Tích Dữ Liệu Thể Thao Chuyên Nghiệp (Sports Analytics)',
    slug: 'phan-tich-du-lieu-the-thao-chuyen-nghiep',
    desc: 'Mô hình Moneyball thực tế: phân tích chỉ số bàn thắng kỳ vọng (xG) trong bóng đá, biểu đồ nhiệt vị trí cầu thủ và hỗ trợ ban huấn luyện.',
    techs: ['Sports Analytics', 'Expected Goals xG', 'Player Tracking', 'Python'],
    level: CourseLevel.BEGINNER,
    price: 199000,
    oldPrice: 280000
  },
  {
    title: 'Tối Ưu Hóa Logistics và Lộ Trình Giao Hàng Bằng Dữ Liệu',
    slug: 'toi-uu-hoa-logistics-lo-trinh-giao-hang-du-lieu',
    desc: 'Giải bài toán người đưa thư (VRP): kết hợp Google OR-Tools, tối ưu số lượng chuyến xe tải, giảm tiêu thụ xăng dầu và giao hàng đúng hẹn.',
    techs: ['OR-Tools', 'Vehicle Routing', 'Logistics Analytics', 'Optimization'],
    level: CourseLevel.ADVANCED,
    price: 499000,
    oldPrice: 699000
  },
  {
    title: 'Phân Tích Dữ Liệu Bất Động Sản: Định Giá Tự Động Bằng Dữ Liệu Lịch Sử',
    slug: 'phan-tich-du-lieu-bat-dong-san-dinh-gia-tu-dong',
    desc: 'Tìm kiếm cơ hội đầu tư: tương quan giữa vị trí địa lý, tiện ích trường học bệnh viện với biến động giá đất theo thời gian.',
    techs: ['Real Estate Data', 'Hedonic Pricing', 'GIS', 'Regression'],
    level: CourseLevel.INTERMEDIATE,
    price: 299000,
    oldPrice: 420000
  },
  {
    title: 'Phân Tích Cảm Xúc Khách Hàng Đa Kênh (Customer Feedback Analytics)',
    slug: 'phan-tich-cam-xuc-khach-hang-da-kenh',
    desc: 'Lắng nghe mạng xã hội: gom bình luận từ Facebook, Shopee, App Store để chấm điểm độ hài lòng CSAT và chỉ số Net Promoter Score (NPS).',
    techs: ['Sentiment Analysis', 'NPS', 'Customer Feedback', 'Text Analytics'],
    level: CourseLevel.INTERMEDIATE,
    price: 249000,
    oldPrice: 350000
  },
  {
    title: 'Phân Tích Dữ Liệu Khách Sạn và Ngành Du Lịch (Hospitality Analytics)',
    slug: 'phan-tich-du-lieu-khach-san-nganh-du-lich',
    desc: 'Chiến lược định giá phòng linh hoạt (Dynamic Pricing): đo lường RevPAR, tỷ lệ lấp đầy phòng mùa cao điểm và dự báo đặt phòng sớm.',
    techs: ['Hospitality Data', 'RevPAR', 'Dynamic Pricing', 'Travel Analytics'],
    level: CourseLevel.BEGINNER,
    price: 199000,
    oldPrice: 280000
  },
  {
    title: 'Đạo Đức Dữ Liệu và Quyền Riêng Tư Trong Kỷ Nguyên Trí Tuệ Nhân Tạo',
    slug: 'dao-duc-du-lieu-quyen-rieng-tu-ky-nguyen-ai',
    desc: 'Tránh định kiến sai lệch trong dữ liệu (Data Bias), bảo vệ quyền lợi người yếu thế, nguyên tắc AI minh bạch và bảo mật dữ liệu khách hàng.',
    techs: ['Data Ethics', 'Fairness', 'Data Privacy', 'Responsible AI'],
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0
  },

  // 76-90: R Programming & Specialized Tools
  {
    title: 'Lập Trình R Cho Người Mới Bắt Đầu: Phân Tích Thống Kê Chuẩn Khoa Học',
    slug: 'lap-trinh-r-cho-nguoi-moi-bat-dau-phan-tich-thong-ke',
    desc: 'Nhập môn ngôn ngữ thống kê mạnh nhất thế giới: vector, data frame, factor, ma trận và môi trường làm việc RStudio trực quan.',
    techs: ['R Language', 'RStudio', 'Statistical Computing', 'Vectors'],
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0
  },
  {
    title: 'Làm Chủ Hệ Sinh Thái Tidyverse Trong R: Dplyr, Tidyr và Readr',
    slug: 'lam-chu-he-sinh-thai-tidyverse-trong-r',
    desc: 'Cú pháp đường ống pipe (%>%) kỳ diệu: biến đổi dữ liệu thanh lịch, xoay trục bảng dữ liệu dài ngắn và nhập xuất file siêu tốc.',
    techs: ['Tidyverse', 'Dplyr', 'Tidyr', 'Data Wrangling R'],
    level: CourseLevel.INTERMEDIATE,
    price: 249000,
    oldPrice: 350000
  },
  {
    title: 'Trực Quan Hóa Đỉnh Cao Với ggplot2: Ngữ Pháp Của Đồ Họa Trong R',
    slug: 'truc-quan-hoa-dinh-cao-voi-ggplot2-ngu-phap-do-hoa',
    desc: 'Thư viện vẽ biểu đồ đẹp nhất mọi thời đại: lớp dữ liệu (layers), scales, facets chia nhỏ biểu đồ, phối màu và tinh chỉnh chuẩn bài báo Nature.',
    techs: ['ggplot2', 'Grammar of Graphics', 'R Visualization', 'Publication Ready'],
    level: CourseLevel.BEGINNER,
    price: 199000,
    oldPrice: 280000
  },
  {
    title: 'Xây Dựng Web App Phân Tích Dữ Liệu Tương Tác Với R Shiny',
    slug: 'xay-dung-web-app-tuong-tac-voi-r-shiny',
    desc: 'Biến kết quả phân tích R thành phần mềm web cho người dùng cuối: reactivity programming, giao diện dashboard điều khiển và deploy Shiny Server.',
    techs: ['R Shiny', 'Web Applications', 'Interactive BI', 'RStudio'],
    level: CourseLevel.INTERMEDIATE,
    price: 349000,
    oldPrice: 480000
  },
  {
    title: 'Soạn Thảo Báo Cáo Nghiên Cứu Tái Lập (Reproducible Research) Với R Markdown',
    slug: 'soan-thao-bao-cao-tai-lap-r-markdown',
    desc: 'Kết hợp mã nguồn, biểu đồ và văn bản trong một tệp tin: xuất báo cáo tự động sang PDF, HTML, Word và slide thuyết trình không cần sửa thủ công.',
    techs: ['R Markdown', 'Knitr', 'Reproducible Science', 'Reporting'],
    level: CourseLevel.BEGINNER,
    price: 149000,
    oldPrice: 220000
  },
  {
    title: 'Phân Tích Dữ Liệu Sinh Học (Bioinformatics) Với R và Bioconductor',
    slug: 'phan-tich-du-lieu-sinh-hoc-bioinformatics-r-bioconductor',
    desc: 'Giải mã trình tự gen RNA-Seq: phân tích biểu hiện gen vi sai DESeq2, biểu đồ núi lửa Volcano Plot và phân loại mẫu sinh học.',
    techs: ['Bioinformatics', 'Bioconductor', 'Genomics', 'RNA-Seq'],
    level: CourseLevel.ADVANCED,
    price: 549000,
    oldPrice: 799000
  },
  {
    title: 'Mô Hình Hóa Thống Kê Tuyến Tính Nâng Cao Trong R: GLM và LMM',
    slug: 'mo-hinh-hoa-thong-ke-tuyen-tinh-r-glm-lmm',
    desc: 'Mô hình hồi quy tổng quát (GLM) cho biến đếm Poisson, mô hình hiệu ứng hỗn hợp tuyến tính (Linear Mixed-Effects Models) với lme4.',
    techs: ['GLM', 'Mixed Models', 'lme4', 'Statistical Modeling R'],
    level: CourseLevel.ADVANCED,
    price: 399000,
    oldPrice: 550000
  },
  {
    title: 'Khai Phá Dữ Liệu Mạng Xã Hội Với Thư Viện Igraph Trong R',
    slug: 'khai-pha-du-lieu-mang-xa-hoi-igraph-trong-r',
    desc: 'Phân tích cấu trúc đồ thị: chỉ số trung tâm (Betweenness, Closeness, PageRank), phát hiện cộng đồng (Community Detection) và mạng lưới liên kết.',
    techs: ['Igraph', 'Network Analysis', 'Graph Theory R', 'Social Networks'],
    level: CourseLevel.INTERMEDIATE,
    price: 299000,
    oldPrice: 420000
  },
  {
    title: 'Phân Tích Kinh Tế Lượng (Econometrics) Ứng Dụng Với R',
    slug: 'phan-tich-kinh-te-luong-econometrics-ung-dung-r',
    desc: 'Phân tích số liệu kinh tế vĩ mô: mô hình tự hồi quy vectơ (VAR), đồng liên kết Cointegration, kiểm định Granger nhân quả và dự báo chỉ số CPI.',
    techs: ['Econometrics', 'Time Series R', 'VAR Model', 'Cointegration'],
    level: CourseLevel.ADVANCED,
    price: 449000,
    oldPrice: 650000
  },
  {
    title: 'Quarto Toàn Tập: Công Cụ Xuất Bản Kỹ Thuật Đa Ngôn Ngữ (Python & R)',
    slug: 'quarto-toan-tap-xuat-ban-ky-thuat-da-ngon-ngu',
    desc: 'Thế hệ kế thừa vượt trội của R Markdown: viết sách, website, blog kỹ thuật hỗ trợ đồng thời cả Python, R, Julia và Observable JS.',
    techs: ['Quarto', 'Technical Publishing', 'Jupyter', 'Documentation'],
    level: CourseLevel.BEGINNER,
    price: 199000,
    oldPrice: 280000
  },
  {
    title: 'Kỹ Thuật Xử Lý Dữ Liệu Bảng Lớn Trong R Với data.table',
    slug: 'ky-thuat-xu-ly-du-lieu-bang-lon-r-data-table',
    desc: 'Tốc độ xử lý dữ liệu vô địch trong R: cú pháp [i, j, by], cập nhật dữ liệu tại chỗ (update by reference :=) không tốn thêm byte RAM nào.',
    techs: ['data.table', 'High Performance R', 'Fast Aggregation', 'Big Data R'],
    level: CourseLevel.INTERMEDIATE,
    price: 249000,
    oldPrice: 350000
  },
  {
    title: 'Phân Tích Dữ Liệu Khảo Sát Phức Tạp Với Gói Survey Trong R',
    slug: 'phan-tich-du-lieu-khao-sat-phuc-tap-survey-r',
    desc: 'Xử lý trọng số điều tra dân số, thiết kế mẫu phân tầng đa giai đoạn, ước lượng sai số chuẩn không thiên lệch cho cơ quan thống kê.',
    techs: ['Survey Package', 'Weighted Statistics', 'Sampling Design', 'Demographics'],
    level: CourseLevel.ADVANCED,
    price: 349000,
    oldPrice: 480000
  },
  {
    title: 'Lập Trình Hướng Gói (Package Development) Trong R: Tạo Thư Viện CRAN Riêng',
    slug: 'lap-trinh-huong-goi-package-development-trong-r',
    desc: 'Đóng gói mã nguồn khoa học chuyên nghiệp: devtools, roxygen2 viết tài liệu hàm, testthat kiểm thử tự động và phát hành lên CRAN.',
    techs: ['R Packages', 'CRAN', 'Devtools', 'Software Engineering R'],
    level: CourseLevel.ADVANCED,
    price: 399000,
    oldPrice: 550000
  },
  {
    title: 'Phân Tích Dữ Liệu Khách Hàng Bằng Mô Hình Phân Lớp (Clustering) Trong R',
    slug: 'phan-tich-du-lieu-khach-hang-clustering-trong-r',
    desc: 'Phân nhóm khách hàng tự động: K-Means, Hierarchical Clustering, DBSCAN lọc nhiễu và đánh giá chất lượng phân cụm bằng Silhouette Score.',
    techs: ['Clustering', 'K-Means', 'Customer Segmentation', 'Unsupervised R'],
    level: CourseLevel.BEGINNER,
    price: 199000,
    oldPrice: 280000
  },
  {
    title: 'Tổng Hợp So Sánh Python và R Trong Khoa Học Dữ Liệu: Khi Nào Dùng Gì?',
    slug: 'tong-hop-so-sanh-python-va-r-trong-khoa-hoc-du-lieu',
    desc: 'Cẩm nang dành cho người phân vân: so sánh ưu nhược điểm từng ngôn ngữ, cách kết hợp cả hai bằng Reticulate và định hướng học tập tối ưu.',
    techs: ['Python vs R', 'Reticulate', 'Data Science Strategy', 'Career Choice'],
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0
  }
]
