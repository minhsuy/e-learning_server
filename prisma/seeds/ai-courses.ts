import { CourseLevel } from '@prisma/client'
import { CourseRawDef } from './web-courses'

export const AI_COURSES: CourseRawDef[] = [
  // 1-15: Machine Learning Fundamentals & Classic ML
  {
    title: 'Học Máy (Machine Learning) Thực Chiến Với Python và Scikit-Learn',
    slug: 'hoc-may-machine-learning-thuc-chien-scikit-learn',
    desc: 'Khóa học nền tảng toàn diện nhất: Hồi quy, Cây quyết định (Decision Trees), Rừng ngẫu nhiên (Random Forest), Đánh giá chéo Cross-Validation.',
    techs: ['Machine Learning', 'Scikit-Learn', 'Supervised Learning', 'Python'],
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0
  },
  {
    title: 'Làm Chủ XGBoost, LightGBM và CatBoost Trong Các Cuộc Thi Kaggle',
    slug: 'lam-chu-xgboost-lightgbm-catboost-kaggle',
    desc: 'Thuật toán thống trị dữ liệu dạng bảng: cơ chế Gradient Boosting, tinh chỉnh siêu tham số với Optuna, xử lý biến phân loại và ngăn ngừa overfitting.',
    techs: ['XGBoost', 'LightGBM', 'CatBoost', 'Optuna', 'Kaggle'],
    level: CourseLevel.INTERMEDIATE,
    price: 449000,
    oldPrice: 650000
  },
  {
    title: 'Kỹ Nghệ Đặc Trưng Dữ Liệu (Feature Engineering) Chuyên Sâu Cho Học Máy',
    slug: 'ky-nghe-dac-trung-feature-engineering-chuyen-sau',
    desc: 'Chìa khóa quyết định độ chính xác mô hình: mã hóa Target Encoding, tương tác đặc trưng đa thức, xử lý dữ liệu ngày giờ và giảm chiều thông minh.',
    techs: ['Feature Engineering', 'Data Preprocessing', 'Feature Selection', 'ML'],
    level: CourseLevel.INTERMEDIATE,
    price: 349000,
    oldPrice: 480000
  },
  {
    title: 'Học Không Giám Sát (Unsupervised Learning): Phân Cụm và Phát Hiện Bất Thường',
    slug: 'hoc-khong-giam-sat-unsupervised-learning-phan-cum',
    desc: 'Khám phá cấu trúc ẩn không cần nhãn: K-Means++, DBSCAN, Gaussian Mixture Models (GMM), Isolation Forest và One-Class SVM.',
    techs: ['Unsupervised Learning', 'Clustering', 'Anomaly Detection', 'GMM'],
    level: CourseLevel.BEGINNER,
    price: 249000,
    oldPrice: 350000
  },
  {
    title: 'Hệ Thống Gợi Ý (Recommender Systems) Thực Chiến: Từ Ma Trận Đến Deep Learning',
    slug: 'he-thong-goi-y-recommender-systems-thuc-chien',
    desc: 'Xây dựng thuật toán gợi ý như Netflix, Spotify: Lọc cộng tác (Collaborative Filtering), Phân rã ma trận SVD, mô hình Two-Tower và Neural Collaborative Filtering.',
    techs: ['Recommender Systems', 'Collaborative Filtering', 'Matrix Factorization', 'Two-Tower'],
    level: CourseLevel.ADVANCED,
    price: 599000,
    oldPrice: 850000
  },
  {
    title: 'Toán Học Cốt Lõi Cho Trí Tuệ Nhân Tạo: Bản Chất Các Thuật Toán Học Máy',
    slug: 'toan-hoc-cot-loi-cho-tri-tue-nhan-tao-ai',
    desc: 'Hiểu cội nguồn toán học đằng sau code: hàm mất mát (Loss functions), tối ưu hóa lồi, đạo hàm ma trận và định lý xác suất cực đại MLE/MAP.',
    techs: ['Math for AI', 'Convex Optimization', 'MLE', 'Calculus for ML'],
    level: CourseLevel.INTERMEDIATE,
    price: 299000,
    oldPrice: 420000
  },
  {
    title: 'Học Máy Tự Động (AutoML): Tăng Tốc Phát Triển Với AutoGluon và FLAML',
    slug: 'hoc-may-tu-dong-automl-autogluon-flaml',
    desc: 'Tự động hóa hoàn toàn quy trình: tự động chọn mô hình tốt nhất, tự động trích xuất đặc trưng và kết hợp đa mô hình (Ensembling) chỉ với vài dòng code.',
    techs: ['AutoML', 'AutoGluon', 'FLAML', 'Model Selection'],
    level: CourseLevel.BEGINNER,
    price: 199000,
    oldPrice: 280000
  },
  {
    title: 'Phân Tích Khả Năng Giải Thích Của Mô Hình Học Máy (Explainable AI - XAI)',
    slug: 'phan-tich-kha-nang-giai-thich-mo-hinh-xai-shap-lime',
    desc: 'Mở chiếc hộp đen của AI: sử dụng giá trị SHAP (Shapley Additive exPlanations), LIME và Partial Dependence Plots để thuyết phục khách hàng và tuân thủ luật.',
    techs: ['Explainable AI', 'SHAP', 'LIME', 'Model Interpretability'],
    level: CourseLevel.ADVANCED,
    price: 399000,
    oldPrice: 550000
  },
  {
    title: 'Mô Hình Cây Nâng Cao: Decision Trees, Random Forest và Extra Trees',
    slug: 'mo-hinh-cay-nang-cao-decision-trees-random-forest',
    desc: 'Đi sâu vào cơ chế phân chia nhánh: chỉ số Gini Impurity, Entropy, Information Gain, kỹ thuật Bagging và đánh giá mức độ quan trọng của đặc trưng.',
    techs: ['Tree-based Models', 'Random Forest', 'Gini Impurity', 'Bagging'],
    level: CourseLevel.BEGINNER,
    price: 149000,
    oldPrice: 220000
  },
  {
    title: 'Máy Vectơ Hỗ Trợ (Support Vector Machines - SVM) Từ Cơ Bản Đến Nâng Cao',
    slug: 'may-vector-ho-tro-svm-tu-co-ban-den-nang-cao',
    desc: 'Làm chủ ranh giới phân loại: siêu phẳng tối ưu lề cực đại (Maximum Margin), kỹ thuật biến đổi Kernel Trick (RBF, Polynomial) và Soft-margin SVM.',
    techs: ['SVM', 'Kernel Trick', 'Support Vectors', 'Classification'],
    level: CourseLevel.INTERMEDIATE,
    price: 199000,
    oldPrice: 280000
  },
  {
    title: 'Thuật Toán Học Bán Giám Sát (Semi-Supervised Learning) Cho Dữ Liệu Thiếu Nhãn',
    slug: 'hoc-ban-giam-sat-semi-supervised-learning',
    desc: 'Tận dụng 99% dữ liệu chưa gán nhãn: Pseudo-labeling, Self-training, Co-training và Label Propagation tiết kiệm chi phí thuê người gán nhãn dữ liệu.',
    techs: ['Semi-Supervised', 'Pseudo-labeling', 'Label Propagation', 'Data Efficiency'],
    level: CourseLevel.ADVANCED,
    price: 449000,
    oldPrice: 650000
  },
  {
    title: 'Phát Hiện Trôi Dạt Dữ Liệu và Suy Giảm Mô Hình (Data & Concept Drift)',
    slug: 'phat-hien-troi-dat-du-lieu-concept-drift',
    desc: 'Bảo vệ mô hình trên production không bị tụt độ chính xác: kiểm định Kolmogorov-Smirnov, Population Stability Index (PSI) và tự động huấn luyện lại.',
    techs: ['Data Drift', 'Concept Drift', 'Evidently AI', 'Model Monitoring'],
    level: CourseLevel.INTERMEDIATE,
    price: 299000,
    oldPrice: 420000
  },
  {
    title: 'Xử Lý Dữ Liệu Mất Cân Bằng Cực Đoan Trong Phân Lớp Học Máy',
    slug: 'xu-ly-du-lieu-mat-can-bang-cuc-doan-hoc-may',
    desc: 'Bí quyết giải bài toán tỷ lệ 1:1000: SMOTE, ADASYN, Focal Loss, Cost-sensitive Learning, đánh giá bằng PR-AUC thay thế hoàn toàn ROC-AUC.',
    techs: ['Imbalanced Learning', 'SMOTE', 'Focal Loss', 'PR-AUC'],
    level: CourseLevel.INTERMEDIATE,
    price: 249000,
    oldPrice: 350000
  },
  {
    title: 'Xây Dựng Pipeline Học Máy Hoàn Chỉnh Với Scikit-Learn Pipelines và ColumnTransformer',
    slug: 'xay-dung-pipeline-hoc-may-hoan-chinh-scikit-learn',
    desc: 'Viết code sạch không rò rỉ dữ liệu (Data Leakage): kết hợp tiền xử lý số, chữ, scaling và estimator vào một object duy nhất dễ dàng lưu file pkl.',
    techs: ['Scikit-Learn Pipeline', 'ColumnTransformer', 'Data Leakage Prevention', 'Joblib'],
    level: CourseLevel.BEGINNER,
    price: 149000,
    oldPrice: 220000
  },
  {
    title: 'Phân Tích Cụm Nâng Cao và Kỹ Thuật Đồ Thị Cho Phân Nhóm Khách Hàng',
    slug: 'phan-tich-cum-nang-cao-ky-thuat-do-thi-khach-hang',
    desc: 'Vượt qua hạn chế của K-Means: Spectral Clustering phân cụm phi tuyến tính, HDBSCAN phân cụm mật độ tự động tìm số lượng nhóm tối ưu.',
    techs: ['HDBSCAN', 'Spectral Clustering', 'Density-based', 'Graph Partitioning'],
    level: CourseLevel.ADVANCED,
    price: 349000,
    oldPrice: 480000
  },

  // 16-30: Deep Learning & PyTorch / TensorFlow
  {
    title: 'Học Sâu (Deep Learning) Toàn Tập Với PyTorch: Từ Mạng Nơ-ron Đến Ứng Dụng',
    slug: 'hoc-sau-deep-learning-toan-tap-voi-pytorch',
    desc: 'Khóa học học sâu số 1: Tensors, Autograd tính đạo hàm tự động, Multilayer Perceptron (MLP), hàm kích hoạt ReLU/GELU, tối ưu hóa AdamW.',
    techs: ['PyTorch', 'Deep Learning', 'Neural Networks', 'Backpropagation'],
    level: CourseLevel.BEGINNER,
    price: 399000,
    oldPrice: 599000
  },
  {
    title: 'TensorFlow 2 và Keras Chuyên Sâu Cho Kỹ Sư AI Doanh Nghiệp',
    slug: 'tensorflow-2-va-keras-chuyen-sau-ky-su-ai',
    desc: 'Hệ sinh thái AI hoàn chỉnh của Google: tf.data pipeline xử lý dữ liệu cực nhanh, Functional API, Subclassing, TensorBoard và TFLite cho di động.',
    techs: ['TensorFlow 2', 'Keras', 'TensorBoard', 'TFLite'],
    level: CourseLevel.INTERMEDIATE,
    price: 349000,
    oldPrice: 480000
  },
  {
    title: 'Mạng Nơ-ron Tích Chập (Convolutional Neural Networks - CNN) Chuyên Sâu',
    slug: 'mang-no-ron-tich-chap-cnn-chuyen-sau',
    desc: 'Hiểu cặn kẽ thị giác máy tính: phép tích chập (Convolution), Pooling, Batch Normalization, kiến trúc kinh điển ResNet, EfficientNet và ConvNeXt.',
    techs: ['CNN', 'ResNet', 'Computer Vision', 'PyTorch'],
    level: CourseLevel.INTERMEDIATE,
    price: 399000,
    oldPrice: 550000
  },
  {
    title: 'Mạng Nơ-ron Tái Phát (RNN, LSTM và GRU) Cho Dữ Liệu Tuần Tự và Âm Thanh',
    slug: 'mang-no-ron-tai-phat-rnn-lstm-gru-tuan-tu',
    desc: 'Xử lý dữ liệu chuỗi có yếu tố thời gian: giải quyết triệt để vấn đề mất đạo hàm (Vanishing Gradient), cơ chế cổng nhớ của LSTM và GRU.',
    techs: ['RNN', 'LSTM', 'GRU', 'Sequence Modeling', 'PyTorch'],
    level: CourseLevel.INTERMEDIATE,
    price: 299000,
    oldPrice: 420000
  },
  {
    title: 'Kiến Trúc Transformer Toàn Tập: Cơ Chế Attention Is All You Need',
    slug: 'kien-truc-transformer-toan-tap-co-che-attention',
    desc: 'Tự code kiến trúc làm thay đổi toàn bộ thế giới AI: Self-Attention, Multi-Head Attention, Positional Encoding, Encoder-Decoder từ con số 0.',
    techs: ['Transformers', 'Self-Attention', 'PyTorch from Scratch', 'Deep Learning'],
    level: CourseLevel.ADVANCED,
    price: 599000,
    oldPrice: 850000
  },
  {
    title: 'Tối Ưu Hóa và Huấn Luyện Mạng Nơ-ron Sâu: Tránh Overfitting và Tăng Tốc Học',
    slug: 'toi-uu-hoa-huan-luyen-mang-no-ron-sau-deep-learning',
    desc: 'Kỹ thuật huấn luyện của chuyên gia: Dropout, Weight Decay, Learning Rate Schedulers (Cosine Annealing), Gradient Clipping và Mixed Precision (FP16).',
    techs: ['Optimization', 'Mixed Precision', 'Learning Rate Warmup', 'Regularization'],
    level: CourseLevel.INTERMEDIATE,
    price: 249000,
    oldPrice: 350000
  },
  {
    title: 'Mạng Đối Kháng Tạo Sinh (Generative Adversarial Networks - GANs)',
    slug: 'mang-doi-khang-tao-sinh-gans-chuyen-sau',
    desc: 'Cuộc chiến giữa Generator và Discriminator: DCGAN tạo khuôn mặt, CycleGAN biến ảnh ngựa thành ngựa vằn, StyleGAN tạo chân dung người cực nét.',
    techs: ['GANs', 'CycleGAN', 'StyleGAN', 'Generative Deep Learning'],
    level: CourseLevel.ADVANCED,
    price: 499000,
    oldPrice: 699000
  },
  {
    title: 'Mô Hình Khuếch Tán (Diffusion Models): Bản Chất Hoạt Động Của Midjourney và Stable Diffusion',
    slug: 'mo-hinh-khuech-tan-diffusion-models-ban-chat',
    desc: 'Công nghệ tạo ảnh đột phá nhất hiện nay: quy trình thêm nhiễu và khử nhiễu (DDPM), U-Net dự đoán nhiễu và Conditioning hướng dẫn tạo ảnh.',
    techs: ['Diffusion Models', 'DDPM', 'Stable Diffusion', 'Generative AI'],
    level: CourseLevel.ADVANCED,
    price: 649000,
    oldPrice: 899000
  },
  {
    title: 'Học Tự Giám Sát (Self-Supervised Learning) Trong Thị Giác và Ngôn Ngữ',
    slug: 'hoc-tu-giam-sat-self-supervised-learning',
    desc: 'Huấn luyện không cần con người gán nhãn: Contrastive Learning (SimCLR), Masked Autoencoders (MAE), DINO và chuyển giao đặc trưng đỉnh cao.',
    techs: ['Self-Supervised', 'Contrastive Learning', 'SimCLR', 'DINO'],
    level: CourseLevel.ADVANCED,
    price: 549000,
    oldPrice: 799000
  },
  {
    title: 'Mạng Nơ-ron Đồ Thị (Graph Neural Networks - GNNs) Với PyTorch Geometric',
    slug: 'mang-no-ron-do-thi-gnn-pytorch-geometric',
    desc: 'Học sâu trên cấu trúc mạng lưới: Graph Convolutional Networks (GCN), GAT với cơ chế Attention đồ thị, ứng dụng dự đoán phân tử thuốc và phát hiện gian lận.',
    techs: ['GNN', 'PyTorch Geometric', 'GCN', 'Graph Deep Learning'],
    level: CourseLevel.ADVANCED,
    price: 549000,
    oldPrice: 799000
  },
  {
    title: 'Nhập Môn Học Sâu Cho Người Mới Bắt Đầu: Hiểu Bản Chất Không Cần Toán Nặng',
    slug: 'nhap-mon-hoc-sau-cho-nguoi-moi-bat-dau',
    desc: 'Giải thích bằng hình minh họa trực quan: mạng nơ-ron học như thế nào, lan truyền tiến/lùi là gì và tự tay làm một mạng phân loại chữ số viết tay MNIST.',
    techs: ['Deep Learning Basics', 'MNIST', 'Neural Nets Intuition', 'PyTorch'],
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0
  },
  {
    title: 'Học Biểu Diễn và Nhúng Vector (Embeddings): Word2Vec, GloVe và FastText',
    slug: 'hoc-bieu-dien-nhung-vector-embeddings-word2vec',
    desc: 'Biến từ ngữ thành tọa độ không gian: kiến trúc CBOW và Skip-Gram, Negative Sampling, đo khoảng cách Cosine và bài toán quan hệ từ ngữ kinh điển.',
    techs: ['Word2Vec', 'Embeddings', 'Skip-Gram', 'Vector Space'],
    level: CourseLevel.BEGINNER,
    price: 199000,
    oldPrice: 280000
  },
  {
    title: 'Mạng Nơ-ron Tích Hợp Vật Lý (Physics-Informed Neural Networks - PINNs)',
    slug: 'mang-no-ron-tich-hop-vat-ly-pinns',
    desc: 'Ứng dụng AI giải phương trình vi phân đạo hàm riêng: kết hợp định luật vật lý cơ bản vào hàm mất mát để mô phỏng dòng chảy chất lỏng và truyền nhiệt.',
    techs: ['PINNs', 'Scientific Machine Learning', 'Differential Equations', 'DeepXDE'],
    level: CourseLevel.ADVANCED,
    price: 599000,
    oldPrice: 850000
  },
  {
    title: 'Huấn Luyện Mô Hình Lớn Phân Tán Đa GPU Với DeepSpeed và PyTorch FSDP',
    slug: 'huan-luyen-mo-hinh-lon-phan-tan-deepspeed-fsdp',
    desc: 'Huấn luyện mô hình hàng chục tỷ tham số: Zero Redundancy Optimizer (ZeRO Stages 1-3), Tensor Parallelism, Pipeline Parallelism và tối ưu VRAM GPU.',
    techs: ['DeepSpeed', 'FSDP', 'Distributed Training', 'Multi-GPU'],
    level: CourseLevel.ADVANCED,
    price: 899000,
    oldPrice: 1299000
  },
  {
    title: 'Lượng Tử Hóa và Nén Mô Hình Học Sâu (Quantization & Pruning): Chạy AI Trên Thiết Bị Biên',
    slug: 'luong-tu-hoa-nen-mo-hinh-hoc-sau-quantization',
    desc: 'Giảm kích thước mô hình 4 lần không mất độ chính xác: Post-Training Quantization (INT8/INT4), QAT, Pruning tỉa cành trọng số và Knowledge Distillation.',
    techs: ['Quantization', 'Model Pruning', 'INT8', 'Knowledge Distillation', 'Edge AI'],
    level: CourseLevel.ADVANCED,
    price: 499000,
    oldPrice: 699000
  },

  // 31-45: Generative AI, LLMs & Prompt Engineering
  {
    title: 'Làm Chủ Generative AI và Xây Dựng Ứng Dụng Với OpenAI API',
    slug: 'lam-chu-generative-ai-xay-dung-ung-dung-openai-api',
    desc: 'Khai thác tối đa GPT-4o: Function Calling tự động gọi API, Assistants API, Streaming câu trả lời, Vision API xử lý hình ảnh và quản lý chi phí tokens.',
    techs: ['OpenAI API', 'GPT-4', 'Function Calling', 'Generative AI', 'Python'],
    level: CourseLevel.BEGINNER,
    price: 299000,
    oldPrice: 420000
  },
  {
    title: 'Kỹ Nghệ Ra Lệnh (Prompt Engineering) Chuyên Nghiệp Cho Lập Trình Viên',
    slug: 'ky-nghe-ra-lenh-prompt-engineering-chuyen-nghiep',
    desc: 'Nâng độ chính xác câu trả lời lên 95%: Few-Shot Prompting, Chain-of-Thought (CoT), ReAct framework, Directional Stimulus và chống Prompt Injection.',
    techs: ['Prompt Engineering', 'Chain of Thought', 'ReAct Pattern', 'LLM Security'],
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0
  },
  {
    title: 'Xây Dựng Hệ Thống RAG (Retrieval-Augmented Generation) Nâng Cao Từ A Đến Z',
    slug: 'xay-dung-he-thong-rag-retrieval-augmented-generation-nang-cao',
    desc: 'Kết nối LLM với dữ liệu riêng của công ty: Chunking thông minh, Hybrid Search (Keyword + Vector), Reranking với Cohere, Contextual Compression và RAG Triad eval.',
    techs: ['RAG', 'Vector Search', 'Hybrid Search', 'Reranking', 'LlamaIndex'],
    level: CourseLevel.ADVANCED,
    price: 699000,
    oldPrice: 999000
  },
  {
    title: 'LangChain Toàn Tập: Xây Dựng Ứng Dụng AI Đa Tác Vụ Với LLMs',
    slug: 'langchain-toan-tap-xay-dung-ung-dung-ai-da-tac-vu',
    desc: 'Làm chủ framework phổ biến nhất: LangChain Expression Language (LCEL), Chains, Memory, Output Parsers, Tools và kết nối cơ sở dữ liệu SQL.',
    techs: ['LangChain', 'LCEL', 'Python', 'LLM Chains'],
    level: CourseLevel.INTERMEDIATE,
    price: 449000,
    oldPrice: 650000
  },
  {
    title: 'LlamaIndex Chuyên Sâu: Cầu Nối Giữa Dữ Liệu Doanh Nghiệp và Mô Hình Ngôn Ngữ',
    slug: 'llamaindex-chuyen-sau-cau-noi-du-lieu-va-llm',
    desc: 'Tối ưu hóa lập chỉ mục tài liệu phức tạp: Document Loaders (PDF, Excel, Notion), Router Queries, Sub-Question Query Engine và xây dựng Knowledge Graph RAG.',
    techs: ['LlamaIndex', 'Knowledge Graph RAG', 'Document Indexing', 'Python'],
    level: CourseLevel.INTERMEDIATE,
    price: 449000,
    oldPrice: 650000
  },
  {
    title: 'Xây Dựng AI Agents Tự Trị Đa Tác Nhân Với LangGraph và CrewAI',
    slug: 'xay-dung-ai-agents-tu-tri-langgraph-crewai',
    desc: 'Tạo đội ngũ nhân viên AI ảo phối hợp làm việc: định nghĩa State Machine trong LangGraph, lập kế hoạch tác vụ, tự sửa lỗi code và Human-in-the-loop.',
    techs: ['AI Agents', 'LangGraph', 'CrewAI', 'Multi-Agent Systems'],
    level: CourseLevel.ADVANCED,
    price: 749000,
    oldPrice: 1099000
  },
  {
    title: 'Tinh Chỉnh Mô Hình Ngôn Ngữ Lớn (LLM Fine-Tuning) Với LoRA và QLoRA',
    slug: 'tinh-chinh-mo-hinh-llm-fine-tuning-lora-qlora',
    desc: 'Huấn luyện mô hình Llama-3, Mistral theo phong cách riêng trên 1 GPU cá nhân: Chuẩn bị dataset, Unsloth tăng tốc gấp 5 lần, SFT và DPO căn chỉnh đạo đức.',
    techs: ['Fine-Tuning', 'LoRA', 'QLoRA', 'Unsloth', 'Llama 3'],
    level: CourseLevel.ADVANCED,
    price: 799000,
    oldPrice: 1199000
  },
  {
    title: 'Tự Host và Vận Hành LLM Cục Bộ Với Ollama, vLLM và Hugging Face TGI',
    slug: 'tu-host-van-hanh-llm-cuc-bo-ollama-vllm',
    desc: 'Bảo mật dữ liệu tuyệt đối không đẩy ra ngoài: chạy LLM offline trên máy tính cá nhân bằng Ollama, triển khai vLLM throughput khủng với PagedAttention.',
    techs: ['Ollama', 'vLLM', 'Local LLM', 'PagedAttention', 'Self-Hosted AI'],
    level: CourseLevel.INTERMEDIATE,
    price: 349000,
    oldPrice: 480000
  },
  {
    title: 'Đánh Giá Chất Lượng Ứng Dụng LLM (LLM Evaluation) Với Ragas và TruLens',
    slug: 'danh-gia-chat-luong-ung-dung-llm-ragas-trulens',
    desc: 'Đo lường độ ảo giác (Hallucination): tính toán chỉ số Faithfulness, Answer Relevance, Context Precision và xây dựng bộ test tự động chấm điểm cho AI.',
    techs: ['LLM Eval', 'Ragas', 'TruLens', 'Hallucination Detection'],
    level: CourseLevel.ADVANCED,
    price: 399000,
    oldPrice: 550000
  },
  {
    title: 'Xây Dựng Chatbot Trợ Lý Ảo Thông Minh Phục Vụ Khách Hàng 24/7',
    slug: 'xay-dung-chatbot-tro-ly-ao-thong-minh-24-7',
    desc: 'Dự án thực tế cho doanh nghiệp: nhớ ngữ cảnh hội thoại, tra cứu chính sách công ty, tạo đơn hàng tự động và chuyển giao mượt mà cho nhân viên hỗ trợ.',
    techs: ['Chatbot Development', 'Conversational AI', 'OpenAI', 'Next.js', 'PostgreSQL'],
    level: CourseLevel.INTERMEDIATE,
    price: 399000,
    oldPrice: 550000
  },
  {
    title: 'Bảo Mật và Phòng Chống Tấn Công Vào Mô Hình AI (LLM Security & Red Teaming)',
    slug: 'bao-mat-phong-chong-tan-cong-mo-hinh-ai-llm-security',
    desc: 'Phòng thủ trước OWASP Top 10 for LLM: Prompt Injection, Jailbreak phá rào cản, trích xuất dữ liệu nhạy cảm hệ thống và phòng thủ bằng NeMo Guardrails.',
    techs: ['LLM Security', 'Red Teaming', 'Jailbreak Defense', 'NeMo Guardrails'],
    level: CourseLevel.ADVANCED,
    price: 499000,
    oldPrice: 699000
  },
  {
    title: 'Tạo Ứng Dụng Tóm Tắt Văn Bản và Biên Dịch Tự Động Bằng Mô Hình Ngôn Ngữ',
    slug: 'tao-ung-dung-tom-tat-van-ban-bien-dich-tu-dong',
    desc: 'Xử lý tài liệu hàng trăm trang vượt cửa sổ ngữ cảnh: chiến lược Map-Reduce, Refine, trích xuất thông tin cấu trúc JSON an toàn tuyệt đối với Pydantic.',
    techs: ['Text Summarization', 'Pydantic Instructor', 'Structured Output', 'LLM'],
    level: CourseLevel.BEGINNER,
    price: 199000,
    oldPrice: 280000
  },
  {
    title: 'Tìm Kiếm Ngữ Nghĩa (Semantic Search) Đỉnh Cao Với Vector Database và Embeddings',
    slug: 'tim-kiem-ngu-nghia-semantic-search-vector-database',
    desc: 'Hiểu đúng ý người dùng không cần đúng từng từ khóa: so khớp đa ngôn ngữ, xây dựng bộ lọc siêu dữ liệu (metadata filtering) và xếp hạng kết quả.',
    techs: ['Semantic Search', 'Pinecone', 'Qdrant', 'Sentence Transformers'],
    level: CourseLevel.INTERMEDIATE,
    price: 299000,
    oldPrice: 420000
  },
  {
    title: 'Lập Trình Trợ Lý Giọng Nói Thông Minh (Voice AI Agent) Thời Gian Thực',
    slug: 'lap-trinh-tro-ly-giong-noi-voice-ai-agent-realtime',
    desc: 'Giao tiếp bằng giọng nói không độ trễ: Whisper chuyển giọng nói thành văn bản (STT), LLM xử lý phản hồi và ElevenLabs sinh giọng nói tự nhiên (TTS).',
    techs: ['Voice AI', 'Whisper', 'ElevenLabs', 'Realtime Audio', 'WebRTC'],
    level: CourseLevel.ADVANCED,
    price: 549000,
    oldPrice: 799000
  },
  {
    title: 'Tự Động Hóa Soạn Thảo và Sáng Tạo Nội Dung Tiếp Thị Bằng AI',
    slug: 'tu-dong-hoa-soan-thao-sang-tao-noi-dung-tiep-thi-ai',
    desc: 'Xây dựng công cụ Copywriting nội bộ: sinh bài viết chuẩn SEO, kịch bản video TikTok, email marketing cá nhân hóa và quản lý kho template gợi ý.',
    techs: ['Content Automation', 'Copywriting AI', 'Marketing Tools', 'API Integration'],
    level: CourseLevel.BEGINNER,
    price: 149000,
    oldPrice: 220000
  },

  // 46-60: Natural Language Processing (NLP) & Audio
  {
    title: 'Xử Lý Ngôn Ngữ Tự Nhiên (NLP) Toàn Tập Với Hugging Face Transformers',
    slug: 'xu-ly-ngon-ngu-tu-nhien-nlp-toan-tap-hugging-face',
    desc: 'Thư viện số 1 về NLP: Tải pre-trained models, Tokenizers (BPE, WordPiece), Dataset pipeline, Huấn luyện phân loại văn bản và trích xuất thực thể NER.',
    techs: ['Hugging Face', 'Transformers', 'NLP', 'BERT', 'Python'],
    level: CourseLevel.BEGINNER,
    price: 349000,
    oldPrice: 480000
  },
  {
    title: 'Mô Hình BERT và Biến Thể (RoBERTa, DeBERTa): Làm Chủ Trích Xuất Ngữ Nghĩa',
    slug: 'mo-hinh-bert-roberta-deberta-ngu-nghia',
    desc: 'Hiểu cặn kẽ mô hình Encoder-only: Masked Language Modeling (MLM), Next Sentence Prediction, tinh chỉnh cho tác vụ phân loại nhãn và gán nhãn thực thể.',
    techs: ['BERT', 'RoBERTa', 'DeBERTa', 'Named Entity Recognition'],
    level: CourseLevel.INTERMEDIATE,
    price: 399000,
    oldPrice: 550000
  },
  {
    title: 'Xử Lý Ngôn Ngữ Tự Nhiên Tiếng Việt Chuyên Sâu (Vietnamese NLP)',
    slug: 'xu-ly-ngon-ngu-tu-nhien-tieng-viet-chuyen-sau',
    desc: 'Giải quyết đặc thù tiếng Việt: Tách từ ghép với VnCoreNLP/PyVi, mô hình ngôn ngữ PhoBERT, sửa lỗi chính tả tự động và nhận diện cảm xúc tiếng Việt.',
    techs: ['Vietnamese NLP', 'PhoBERT', 'PyVi', 'VnCoreNLP', 'Text Processing'],
    level: CourseLevel.INTERMEDIATE,
    price: 299000,
    oldPrice: 420000
  },
  {
    title: 'Nhận Dạng Thực Thể Tên Riêng (Named Entity Recognition - NER) Với SpaCy',
    slug: 'nhan-dang-thuc-the-ten-rieng-ner-spacy',
    desc: 'Trích xuất tự động tên người, địa điểm, tổ chức, số tiền, ngày tháng từ hợp đồng pháp lý và văn bản hành chính bằng SpaCy công nghiệp.',
    techs: ['SpaCy', 'NER', 'Information Extraction', 'Rule-based Matching'],
    level: CourseLevel.BEGINNER,
    price: 199000,
    oldPrice: 280000
  },
  {
    title: 'Mô Hình Hóa Chủ Đề Văn Bản (Topic Modeling) Với BERTopic và LDA',
    slug: 'mo-hinh-hoa-chu-de-van-ban-bertopic-lda',
    desc: 'Tự động phân loại hàng vạn bài báo không cần gắn nhãn trước: kỹ thuật c-TF-IDF của BERTopic, UMAP giảm chiều và hiển thị cụm chủ đề tương tác.',
    techs: ['BERTopic', 'Topic Modeling', 'LDA', 'Unsupervised NLP'],
    level: CourseLevel.INTERMEDIATE,
    price: 249000,
    oldPrice: 350000
  },
  {
    title: 'Nhận Dạng Giọng Nói (Automatic Speech Recognition - ASR) Với OpenAI Whisper',
    slug: 'nhan-dang-giong-noi-asr-openai-whisper',
    desc: 'Chuyển audio thành văn bản chuẩn từng giây: tinh chỉnh Whisper trên tập dữ liệu tiếng Việt có tiếng ồn, cắt file audio dài và tạo phụ đề tự động (SRT).',
    techs: ['Speech-to-Text', 'Whisper', 'Audio Processing', 'Subtitles'],
    level: CourseLevel.ADVANCED,
    price: 499000,
    oldPrice: 699000
  },
  {
    title: 'Tổng Hợp Giọng Nói Tự Nhiên (Text-to-Speech - TTS) Bằng Deep Learning',
    slug: 'tong-hop-giong-noi-tu-nhien-tts-deep-learning',
    desc: 'Tự tạo giọng đọc AI truyền cảm: mô hình VITS, Coqui TTS, kỹ thuật nhân bản giọng nói (Voice Cloning) chỉ từ đoạn audio mẫu 10 giây.',
    techs: ['Text-to-Speech', 'Voice Cloning', 'Coqui TTS', 'Audio AI'],
    level: CourseLevel.ADVANCED,
    price: 549000,
    oldPrice: 799000
  },
  {
    title: 'Trích Xuất Thông Tin Từ Tài Liệu Quét (Document AI & LayoutLM)',
    slug: 'trich-xuat-thong-tin-tai-lieu-quet-layoutlm',
    desc: 'Đọc hiểu hóa đơn và hợp đồng dạng ảnh: kết hợp OCR văn bản, tọa độ không gian 2D và hình ảnh trực quan với mô hình LayoutLMv3.',
    techs: ['Document AI', 'LayoutLM', 'OCR', 'Information Extraction'],
    level: CourseLevel.ADVANCED,
    price: 599000,
    oldPrice: 850000
  },
  {
    title: 'Phân Tích Cảm Xúc Đa Cấp Độ (Aspect-Based Sentiment Analysis - ABSA)',
    slug: 'phan-tich-cam-xuc-da-cap-do-absa',
    desc: 'Không chỉ đánh giá tốt/xấu chung chung: bóc tách cảm xúc theo từng khía cạnh sản phẩm (ví dụ: màn hình đẹp nhưng pin yếu, giá đắt nhưng phục vụ tốt).',
    techs: ['ABSA', 'Aspect Sentiment', 'Deep Learning NLP', 'E-commerce Review'],
    level: CourseLevel.INTERMEDIATE,
    price: 299000,
    oldPrice: 420000
  },
  {
    title: 'Dịch Máy Nơ-ron (Neural Machine Translation - NMT) Với MarianMT và mBART',
    slug: 'dich-may-no-ron-nmt-marianmt-mbart',
    desc: 'Tự xây dựng hệ thống dịch thuật đa ngữ: kiến trúc Sequence-to-Sequence, cơ chế Beam Search giải mã và đo lường độ chính xác bằng chỉ số BLEU score.',
    techs: ['Machine Translation', 'MarianMT', 'mBART', 'BLEU Score'],
    level: CourseLevel.ADVANCED,
    price: 449000,
    oldPrice: 650000
  },
  {
    title: 'Xây Dựng Hệ Thống Hỏi Đáp Tự Động (Question Answering Systems)',
    slug: 'xay-dung-he-thong-hoi-dap-tu-dong-qa',
    desc: 'Tìm câu trả lời chính xác trong đoạn văn (Extractive QA) và tự sinh câu trả lời (Generative QA) sử dụng mô hình T5 và RoBERTa.',
    techs: ['Question Answering', 'Extractive QA', 'T5 Model', 'NLP'],
    level: CourseLevel.INTERMEDIATE,
    price: 349000,
    oldPrice: 480000
  },
  {
    title: 'Nhận Dạng Ý Định và Trích Xuất Thực Thể (Intent & Slot Filling) Cho Bot',
    slug: 'nhan-dang-y-dinh-intent-slot-filling-bot',
    desc: 'Trọng tâm của trợ lý ảo giao dịch: phân loại ý định người dùng (ví dụ: chuyển tiền) và bóc tách các trường tham số (số tiền, người nhận, ngân hàng).',
    techs: ['Intent Classification', 'Slot Filling', 'Rasa Framework', 'NLU'],
    level: CourseLevel.BEGINNER,
    price: 249000,
    oldPrice: 350000
  },
  {
    title: 'Phát Hiện Văn Bản Do Trí Tuệ Nhân Tạo Sinh Ra (AI Content Detection)',
    slug: 'phat-hien-van-ban-ai-sinh-ra-ai-detection',
    desc: 'Phát hiện bài viết viết bởi ChatGPT: phân tích chỉ số ngẫu nhiên Perplexity, Burstiness và huấn luyện bộ phân loại nhị phân phát hiện đạo văn AI.',
    techs: ['AI Detection', 'Perplexity', 'Text Forensics', 'Academic Integrity'],
    level: CourseLevel.INTERMEDIATE,
    price: 199000,
    oldPrice: 280000
  },
  {
    title: 'Xử Lý Tín Hiệu Âm Thanh (Audio Signal Processing) Cho Lập Trình Viên',
    slug: 'xu-ly-tin-hieu-am-thanh-audio-processing-python',
    desc: 'Nền tảng xử lý tiếng nói với Librosa: dạng sóng biên độ Waveform, biến đổi Fourier nhanh (FFT), phổ âm Mel-Spectrogram và lọc nhiễu nền.',
    techs: ['Audio Processing', 'Librosa', 'Spectrogram', 'FFT', 'Python Audio'],
    level: CourseLevel.BEGINNER,
    price: 199000,
    oldPrice: 280000
  },
  {
    title: 'Tự Động Phân Loại Email và Phát Hiện Thư Rác (Spam Filtering) Bằng Học Máy',
    slug: 'tu-dong-phan-loai-email-phat-hien-thu-rac-spam',
    desc: 'Bài toán kinh điển ứng dụng thực tiễn cao: phân loại Naive Bayes, lọc lừa đảo mạo danh (Phishing) và tích hợp vào hộp thư tự động.',
    techs: ['Naive Bayes', 'Spam Classification', 'Text Classification', 'NLP Basics'],
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0
  },

  // 61-75: Computer Vision (CV) & Multimodal AI
  {
    title: 'Thị Giác Máy Tính (Computer Vision) Toàn Tập Với OpenCV và Python',
    slug: 'thi-giac-may-tinh-computer-vision-opencv-python',
    desc: 'Nhập môn xử lý ảnh chuyên nghiệp: lọc nhiễu, biến đổi màu sắc, tách biên Canny, tìm đường bao Contours, biến đổi phối cảnh và ghép ảnh Panorama.',
    techs: ['OpenCV', 'Computer Vision', 'Image Processing', 'Python'],
    level: CourseLevel.BEGINNER,
    price: 249000,
    oldPrice: 350000
  },
  {
    title: 'Nhận Dạng Vật Thể Thời Gian Thực Với YOLOv8 và YOLOv10 Chuyên Sâu',
    slug: 'nhan-dang-vat-the-thoi-gian-thuc-yolov8-yolov10',
    desc: 'Công nghệ phát hiện vật thể số 1: Tự gán nhãn dữ liệu bằng Roboflow, huấn luyện mô hình phát hiện lỗi sản phẩm, đếm người và xe cộ với tốc độ 60 FPS.',
    techs: ['YOLOv8', 'YOLOv10', 'Object Detection', 'Roboflow', 'PyTorch'],
    level: CourseLevel.INTERMEDIATE,
    price: 499000,
    oldPrice: 699000
  },
  {
    title: 'Phân Đoạn Hình Ảnh (Image Segmentation) Với Mask R-CNN và Segment Anything (SAM)',
    slug: 'phan-doan-hinh-anh-mask-rcnn-segment-anything-sam',
    desc: 'Khoanh vùng đối tượng chính xác từng pixel: Semantic Segmentation với U-Net y tế, Instance Segmentation và công nghệ đỉnh cao Meta SAM.',
    techs: ['Image Segmentation', 'Segment Anything', 'U-Net', 'Mask R-CNN'],
    level: CourseLevel.ADVANCED,
    price: 549000,
    oldPrice: 799000
  },
  {
    title: 'Nhận Diện Khuôn Mặt (Face Recognition) và Phát Hiện Gian Lận Điểm Danh',
    slug: 'nhan-dien-khuon-mat-face-recognition-diem-danh',
    desc: 'Xây dựng hệ thống chấm công nhận diện mặt: phát hiện khuôn mặt RetinaFace, trích xuất đặc trưng ArcFace, chống giả mạo mặt qua ảnh (Anti-Spoofing).',
    techs: ['Face Recognition', 'ArcFace', 'Anti-Spoofing', 'RetinaFace'],
    level: CourseLevel.ADVANCED,
    price: 599000,
    oldPrice: 850000
  },
  {
    title: 'Nhận Dạng Chữ Viết Quang Học (OCR) Tiếng Việt Với Tesseract và EasyOCR',
    slug: 'nhan-dang-chu-viet-quang-hoc-ocr-tieng-viet-easyocr',
    desc: 'Đọc tự động căn cước công dân và bằng lái xe: tiền xử lý ảnh nghiêng mờ, cắt khung văn bản, nhận dạng ký tự tiếng Việt có dấu chuẩn 98%.',
    techs: ['OCR', 'EasyOCR', 'Tesseract', 'Document Extraction'],
    level: CourseLevel.BEGINNER,
    price: 199000,
    oldPrice: 280000
  },
  {
    title: 'Theo Dõi Chuyển Động Vật Thể Đa Mục Tiêu (Multi-Object Tracking - DeepSORT)',
    slug: 'theo-doi-chuyen-dong-vat-the-da-muc-tieu-deepsort',
    desc: 'Theo dõi hành trình xe cộ và người đi bộ trên camera an ninh: thuật toán Kalman Filter, giải thuật Hungarian và re-identification (ReID).',
    techs: ['DeepSORT', 'ByteTrack', 'Object Tracking', 'Kalman Filter'],
    level: CourseLevel.ADVANCED,
    price: 499000,
    oldPrice: 699000
  },
  {
    title: 'Ước Lượng Tư Thế Con Người (Human Pose Estimation) Với MediaPipe',
    slug: 'uoc-luong-tu-the-con-nguoi-human-pose-mediapipe',
    desc: 'Theo dõi 33 khớp xương cơ thể trong thời gian thực: ứng dụng đếm số lần hít đất/squat trong gym, nhận diện cử chỉ tay và cảnh báo ngã té cho người già.',
    techs: ['MediaPipe', 'Pose Estimation', 'Gesture Recognition', 'Realtime CV'],
    level: CourseLevel.BEGINNER,
    price: 149000,
    oldPrice: 220000
  },
  {
    title: 'Trí Tuệ Nhân Tạo Đa Phương Thức (Multimodal AI) Với OpenAI CLIP và GPT-4V',
    slug: 'tri-tue-nhan-tao-da-phuong-thuc-multimodal-clip-gpt4v',
    desc: 'Hợp nhất hình ảnh và văn bản: tìm kiếm ảnh bằng câu miêu tả tự nhiên (Text-to-Image Search), hỏi đáp nội dung ảnh (Visual Question Answering).',
    techs: ['Multimodal AI', 'CLIP', 'GPT-4V', 'Visual QA'],
    level: CourseLevel.ADVANCED,
    price: 549000,
    oldPrice: 799000
  },
  {
    title: 'Phục Chế và Nâng Cấp Chất Lượng Hình Ảnh Bằng Siêu Độ Phân Giải (Super Resolution)',
    slug: 'phuc-che-nang-cap-chat-luong-anh-super-resolution',
    desc: 'Phục hồi ảnh cũ mờ: mô hình Real-ESRGAN phóng to ảnh gấp 4 lần không vỡ hạt, khử nhiễu, làm nét chân dung với CodeFormer.',
    techs: ['Super Resolution', 'Real-ESRGAN', 'Image Restoration', 'CodeFormer'],
    level: CourseLevel.INTERMEDIATE,
    price: 349000,
    oldPrice: 480000
  },
  {
    title: 'Thị Giác Máy Tính Trong Y Tế: Phân Tích Ảnh X-Quang và MRI Bằng AI',
    slug: 'thi-giac-may-tinh-y-te-xquang-mri-ai',
    desc: 'Hỗ trợ bác sĩ chẩn đoán: phát hiện viêm phổi trên ảnh X-quang ngực, phân đoạn khối u não trên ảnh cộng hưởng từ MRI và chuẩn hóa dữ liệu DICOM.',
    techs: ['Medical AI', 'DICOM Processing', 'X-Ray Diagnosis', 'Healthcare CV'],
    level: CourseLevel.ADVANCED,
    price: 649000,
    oldPrice: 899000
  },
  {
    title: 'Hệ Thống Hỗ Trợ Lái Xe Nâng Cao (ADAS) và Xe Tự Hành Cơ Bản',
    slug: 'he-thong-ho-tro-lai-xe-adas-xe-tu-hanh',
    desc: 'Các bài toán cốt lõi của xe tự lái: phát hiện làn đường (Lane Detection), nhận diện biển báo giao thông và ước lượng khoảng cách va chạm.',
    techs: ['Autonomous Vehicles', 'ADAS', 'Lane Detection', 'Traffic Sign AI'],
    level: CourseLevel.ADVANCED,
    price: 599000,
    oldPrice: 850000
  },
  {
    title: 'Xây Dựng Ứng Dụng Đổi Mặt và Thử Đồ Ảo (Virtual Try-On & Deepfake)',
    slug: 'xay-dung-ung-dung-doi-mat-thu-do-ao-virtual-try-on',
    desc: 'Ứng dụng thương mại điện tử thời trang: tráo đổi quần áo lên người mẫu ảo không cần chụp ảnh thật, hiểu cơ chế hoán đổi khuôn mặt và biện pháp bảo vệ.',
    techs: ['Virtual Try-On', 'Deepfake Technology', 'Image Warping', 'Diffusion'],
    level: CourseLevel.ADVANCED,
    price: 549000,
    oldPrice: 799000
  },
  {
    title: 'Xử Lý Video Bằng Trí Tuệ Nhân Tạo: Tóm Tắt Video và Phân Tích Cảnh Quay',
    slug: 'xu-ly-video-bang-ai-tom-tat-video-phan-tich-canh',
    desc: 'Phân tích video tự động: phát hiện chuyển cảnh (Shot Boundary Detection), nhận diện hành vi bạo lực, trích xuất khung hình tiêu biểu.',
    techs: ['Video AI', 'Action Recognition', 'Scene Detection', 'OpenCV Video'],
    level: CourseLevel.INTERMEDIATE,
    price: 399000,
    oldPrice: 550000
  },
  {
    title: 'Tạo Ảnh và Video Nghệ Thuật Chuyên Nghiệp Với ComfyUI và Stable Diffusion',
    slug: 'tao-anh-video-nghe-thuat-comfyui-stable-diffusion',
    desc: 'Quy trình sáng tạo dạng Node-based mạnh mẽ: ControlNet định hình tư thế, LoRA nhân vật, IP-Adapter giữ phong cách và tạo hoạt hình mượt mà với AnimateDiff.',
    techs: ['ComfyUI', 'Stable Diffusion', 'ControlNet', 'AnimateDiff'],
    level: CourseLevel.BEGINNER,
    price: 249000,
    oldPrice: 350000
  },
  {
    title: 'Ứng Dụng Thị Giác Máy Tính Trên Thiết Bị Di Động Với TFLite và CoreML',
    slug: 'thi-giac-may-tinh-di-dong-tflite-coreml',
    desc: 'Đưa mô hình AI chạy trực tiếp trên camera điện thoại không cần internet: tối ưu hóa FPS, tiết kiệm pin cho iPhone và điện thoại Android.',
    techs: ['TFLite', 'CoreML', 'Mobile AI', 'On-Device CV'],
    level: CourseLevel.INTERMEDIATE,
    price: 349000,
    oldPrice: 480000
  },

  // 76-90: MLOps, AI Engineering & Advanced Topics
  {
    title: 'MLOps Toàn Tập: Xây Dựng Quy Trình Vận Hành Học Máy Chuyên Nghiệp',
    slug: 'mlops-toan-tap-xay-dung-quy-trinh-van-hanh-hoc-may',
    desc: 'Thu hẹp khoảng cách giữa Data Science và DevOps: quản lý phiên bản mã nguồn, dữ liệu (DVC), theo dõi thử nghiệm (MLflow) và đóng gói triển khai Docker.',
    techs: ['MLOps', 'MLflow', 'DVC', 'Docker', 'CI/CD for ML'],
    level: CourseLevel.INTERMEDIATE,
    price: 499000,
    oldPrice: 699000
  },
  {
    title: 'Đóng Gói và Phục Vụ API Mô Hình AI Tốc Độ Cao Với FastAPI và Uvicorn',
    slug: 'dong-goi-phuc-vu-api-mo-hinh-ai-fastapi',
    desc: 'Chuẩn công nghiệp cho AI Service: Batching dự đoán tăng thông lượng, asynchronous endpoint, sinh tài liệu Swagger và kiểm tra dữ liệu với Pydantic.',
    techs: ['FastAPI', 'Uvicorn', 'Model Serving', 'Python API'],
    level: CourseLevel.BEGINNER,
    price: 199000,
    oldPrice: 280000
  },
  {
    title: 'Triển Khai Mô Hình AI Tốc Độ Cực Hạn Với NVIDIA Triton Inference Server',
    slug: 'trien-khai-mo-hinh-ai-nvidia-triton-inference-server',
    desc: 'Máy chủ suy luận hàng đầu của NVIDIA: Dynamic Batching, Model Ensembling, Concurrent Model Execution và hỗ trợ đa backend TensorRT/ONNX.',
    techs: ['NVIDIA Triton', 'TensorRT', 'High Throughput AI', 'GPU Serving'],
    level: CourseLevel.ADVANCED,
    price: 749000,
    oldPrice: 1099000
  },
  {
    title: 'Tối Ưu Hóa Tốc Độ Suy Luận Với ONNX Runtime và TensorRT',
    slug: 'toi-uu-hoa-toc-do-suy-luan-onnx-runtime-tensorrt',
    desc: 'Tăng tốc mô hình gấp 5-10 lần: chuyển đổi PyTorch sang định dạng trung gian ONNX, lượng tử hóa FP16/INT8 và tinh chỉnh kernel trên chip đồ họa.',
    techs: ['ONNX Runtime', 'TensorRT', 'Inference Optimization', 'C++ / Python'],
    level: CourseLevel.ADVANCED,
    price: 549000,
    oldPrice: 799000
  },
  {
    title: 'Học Tăng Cường (Reinforcement Learning) Cơ Bản Đến Deep Q-Learning (DQN)',
    slug: 'hoc-tang-cuong-reinforcement-learning-dqn',
    desc: 'Dạy máy tự học chơi game và ra quyết định: Phương trình Bellman, Markov Decision Process (MDP), Q-Learning, Deep Q-Networks (DQN) trên môi trường Gymnasium.',
    techs: ['Reinforcement Learning', 'Gymnasium', 'DQN', 'Policy Gradient'],
    level: CourseLevel.INTERMEDIATE,
    price: 399000,
    oldPrice: 550000
  },
  {
    title: 'Học Tăng Cường Nâng Cao Cho Người Máy và Robot: PPO và SAC',
    slug: 'hoc-tang-cuong-nang-cao-robot-ppo-sac',
    desc: 'Điều khiển chuyển động liên tục: Thuật toán Proximal Policy Optimization (PPO), Soft Actor-Critic (SAC) trong môi trường mô phỏng vật lý MuJoCo.',
    techs: ['PPO', 'SAC', 'MuJoCo', 'Robotics AI'],
    level: CourseLevel.ADVANCED,
    price: 649000,
    oldPrice: 899000
  },
  {
    title: 'Kubeflow Toàn Tập: Quản Lý Quy Trình Học Máy Trên Nền Tảng Kubernetes',
    slug: 'kubeflow-toan-tap-quy-trinh-hoc-may-kubernetes',
    desc: 'Quy mô cho các tập đoàn công nghệ lớn: Kubeflow Pipelines (KFP), Katib tự động dò siêu tham số, KServe triển khai mô hình serverless.',
    techs: ['Kubeflow', 'Kubernetes', 'KServe', 'Enterprise MLOps'],
    level: CourseLevel.ADVANCED,
    price: 699000,
    oldPrice: 999000
  },
  {
    title: 'Quản Lý Kho Đặc Trưng Dữ Liệu Tập Trung (Feature Store) Với Feast',
    slug: 'quan-ly-kho-dac-trung-feature-store-feast',
    desc: 'Thống nhất đặc trưng giữa huấn luyện và suy luận: tránh Data Skew giữa Offline Store (Parquet/Snowflake) và Online Store (Redis) độ trễ thấp.',
    techs: ['Feast', 'Feature Store', 'Online Store', 'Data Engineering AI'],
    level: CourseLevel.ADVANCED,
    price: 499000,
    oldPrice: 699000
  },
  {
    title: 'Xây Dựng Nền Tảng AI SaaS Hoàn Chỉnh: Từ Mô Hình Đến Đăng Ký Thu Phí',
    slug: 'xay-dung-nen-tang-ai-saas-hoan-chinh',
    desc: 'Biến kỹ năng AI thành doanh nghiệp có lợi nhuận: tích hợp cổng thanh toán Stripe tính phí theo credits/tokens, giao diện React và backend FastAPI.',
    techs: ['AI SaaS', 'Stripe Billing', 'Next.js', 'FastAPI', 'Business'],
    level: CourseLevel.ADVANCED,
    price: 899000,
    oldPrice: 1299000
  },
  {
    title: 'An Toàn Trí Tuệ Nhân Tạo (AI Alignment & Safety): Đạo Đức và Kiểm Soát AI',
    slug: 'an-toan-tri-tue-nhan-tao-ai-alignment-safety',
    desc: 'Đảm bảo AI phục vụ lợi ích nhân loại: RLHF (Reinforcement Learning from Human Feedback), DPO, Constitutional AI và phòng chống rủi ro sinh tồn AI.',
    techs: ['AI Safety', 'RLHF', 'Constitutional AI', 'AI Alignment'],
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0
  },
  {
    title: 'Lập Trình Trí Tuệ Nhân Tạo Nhúng Trên NVIDIA Jetson Nano và Raspberry Pi',
    slug: 'lap-trinh-ai-nhung-nvidia-jetson-nano',
    desc: 'AI gắn liền với thế giới thực: triển khai camera AI nhận diện biển số xe thông minh, nhận diện khuôn mặt trực tiếp trên mạch vi xử lý nhỏ gọn.',
    techs: ['Jetson Nano', 'Embedded AI', 'Edge Computing', 'Raspberry Pi'],
    level: CourseLevel.INTERMEDIATE,
    price: 449000,
    oldPrice: 650000
  },
  {
    title: 'Học Liên Bang (Federated Learning): Huấn Luyện AI Bảo Vệ Dữ Liệu Riêng Tư',
    slug: 'hoc-lien-bang-federated-learning-bao-mat',
    desc: 'Huấn luyện mô hình tập trung mà dữ liệu không bao giờ rời khỏi thiết bị người dùng: thuật toán Federated Averaging (FedAvg) và thư viện Flower.',
    techs: ['Federated Learning', 'Flower AI', 'Privacy-Preserving AI', 'Differential Privacy'],
    level: CourseLevel.ADVANCED,
    price: 549000,
    oldPrice: 799000
  },
  {
    title: 'Tự Động Hóa Kiểm Thử và Đánh Giá Mô Hình Học Máy (Continuous Testing for ML)',
    slug: 'tu-dong-hoa-kiem-thu-danh-gia-mo-hinh-hoc-may',
    desc: 'Đưa CI/CD vào học máy: kiểm tra tính suy biến (Invariance testing), kiểm tra ngưỡng phương sai và tự động từ chối deploy mô hình kém chất lượng.',
    techs: ['Continuous Testing', 'Deepchecks', 'Model Validation', 'QA for AI'],
    level: CourseLevel.INTERMEDIATE,
    price: 299000,
    oldPrice: 420000
  },
  {
    title: 'Chiến Lược Tối Ưu Hóa Chi Phí Điện Toán Đám Mây Cho Dự Án Trí Tuệ Nhân Tạo',
    slug: 'chien-luoc-toi-uu-hoa-chi-phi-dam-may-du-an-ai',
    desc: 'Tiết kiệm 70% ngân sách hạ tầng AI: tận dụng GPU Spot Instances trên RunPod/Lambda Labs, tự động tắt máy khi nhàn rỗi và so sánh giá nhà cung cấp.',
    techs: ['Cloud Cost Optimization', 'Spot GPU', 'RunPod', 'FinOps for AI'],
    level: CourseLevel.INTERMEDIATE,
    price: 249000,
    oldPrice: 350000
  },
  {
    title: 'Định Hướng Nghề Nghiệp Kỹ Sư AI (AI Engineer Roadmap): Từ Zero Đến Hero',
    slug: 'dinh-huong-nghe-nghiep-ky-su-ai-engineer-roadmap',
    desc: 'Lộ trình chuyển đổi thành AI Engineer thế hệ mới: xây dựng dự án thực chiến, tạo portfolio GitHub cuốn hút và kỹ năng đàm phán việc làm công nghệ.',
    techs: ['AI Engineer Roadmap', 'Career Guide', 'Portfolio Building', 'Soft Skills'],
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0
  }
]
