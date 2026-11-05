import { CourseLevel } from '@prisma/client'
import { CourseBlueprint } from './categories-data'

export const COURSES_TECH_PART3: readonly CourseBlueprint[] = [
  // ==========================================
  // CAT-07: Điện toán đám mây & DevOps (18 courses)
  // Quota: 5 BEGINNER, 8 INTERMEDIATE, 5 ADVANCED | 2 FREE, 16 PAID
  // ==========================================
  {
    title: 'Nhập Môn Điện Toán Đám Mây: Nền Tảng AWS và Cloud Computing',
    slug: 'nhap-mon-dien-toan-dam-may-aws-cloud-computing',
    categorySlug: 'dien-toan-dam-may-va-devops',
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0,
    leadSummary: 'Hiểu rõ mô hình điện toán đám mây, các dịch vụ hạ tầng cốt lõi của Amazon Web Services (AWS) và tự tay triển khai ứng dụng web đầu tiên lên môi trường cloud an toàn.',
    industryContext: 'Hơn 80% doanh nghiệp toàn cầu đã chuyển dịch hạ tầng công nghệ sang đám mây, biến kỹ năng Cloud thành tiêu chuẩn bắt buộc cho mọi kỹ sư phần mềm.',
    coreTopics: [
      'Mô hình đám mây IaaS, PaaS, SaaS, khái niệm Regions và Availability Zones (AZs) của AWS',
      'Máy chủ ảo Amazon EC2: Chọn loại instance, cấu hình Security Groups và quản lý SSH Key Pairs',
      'Lưu trữ đám mây không giới hạn với Amazon S3: Buckets, lưu trữ tĩnh, phân quyền IAM bucket policies',
      'Mạng đám mây căn bản: Tổng quan Virtual Private Cloud (VPC), Subnets và Internet Gateways'
    ],
    handsOnProject: 'Khởi tạo một máy chủ EC2 Linux, cài đặt máy chủ Nginx và triển khai một trang web tĩnh tải ảnh từ S3 với chứng chỉ SSL miễn phí.',
    targetAudience: 'Sinh viên IT, lập trình viên mới bắt đầu hoặc chuyên viên quản trị hệ thống muốn chuyển dịch sang công nghệ đám mây.',
    careerApplication: 'Chuẩn bị kiến thức vững chắc cho kỳ thi lấy chứng chỉ quốc tế AWS Certified Cloud Practitioner (CLF-C02).',
    requirements: [
      'Có máy tính kết nối Internet và thẻ thanh toán quốc tế để đăng ký tài khoản AWS Free Tier (được miễn phí 12 tháng)'
    ],
    benefits: [
      'Hiểu rõ bản chất vận hành và cách tối ưu chi phí của hạ tầng điện toán đám mây',
      'Tự tay khởi tạo và quản lý máy chủ ảo trên đám mây trong vòng 5 phút',
      'Lưu trữ và phân phối tệp tin tĩnh toàn cầu với độ sẵn sàng 99.999999999%',
      'Tự tin giải thích kiến trúc đám mây cơ bản trong các buổi phỏng vấn xin việc'
    ],
    techniques: ['AWS', 'Cloud Computing', 'Amazon EC2', 'Amazon S3', 'AWS IAM', 'Nginx Cloud'],
    documents: [
      'Cẩm nang quản lý chi phí AWS Free Tier tránh bị trừ tiền ngoài ý muốn',
      'Tài liệu ôn tập 100 câu hỏi trọng tâm kỳ thi AWS Certified Cloud Practitioner'
    ]
  },
  {
    title: 'Làm Chủ Docker & Docker Compose: Đóng Gói và Vận Hành Container Cho Lập Trình Viên',
    slug: 'lam-chu-docker-docker-compose-cho-lap-trinh-vien',
    categorySlug: 'dien-toan-dam-may-va-devops',
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0,
    leadSummary: 'Giải quyết triệt để vấn đề "chạy được trên máy tôi nhưng không chạy được trên máy khác" bằng cách đóng gói trọn gói môi trường ứng dụng với Docker và Docker Compose.',
    industryContext: 'Container hóa là nền tảng cốt lõi của toàn bộ phong trào DevOps và kiến trúc vi dịch vụ (Microservices) hiện đại.',
    coreTopics: [
      'Bản chất Container vs Máy ảo Virtual Machine: Namespaces, cgroups và cơ chế chia sẻ nhân hệ điều hành',
      'Viết tệp Dockerfile chuẩn mực: Multi-stage builds, tối ưu hóa lớp layer cache và thu nhỏ kích thước image',
      'Quản lý dữ liệu bền vững và kết nối mạng: Docker Volumes, Bind Mounts, Bridge Networks',
      'Điều phối nhiều container với Docker Compose: Định nghĩa dịch vụ Web, Database, Redis trong 1 tệp YAML'
    ],
    handsOnProject: 'Đóng gói một hệ thống hoàn chỉnh gồm Frontend React, Backend Node.js và cơ sở dữ liệu PostgreSQL khởi chạy chỉ với một lệnh duy nhất.',
    targetAudience: 'Lập trình viên mọi ngôn ngữ muốn chuẩn hóa môi trường phát triển và triển khai sản phẩm mượt mà.',
    careerApplication: 'Tự tin làm việc trong mọi dự án công nghệ hiện đại yêu cầu tiêu chuẩn container hóa.',
    requirements: [
      'Biết sử dụng dòng lệnh cơ bản và đã từng chạy ít nhất một ứng dụng web (Node.js, Python hoặc Java)'
    ],
    benefits: [
      'Khởi tạo môi trường phát triển mới chỉ trong vài giây mà không lo xung đột phiên bản phần mềm',
      'Tối ưu kích thước Docker image từ hàng gigabyte xuống dưới 50MB siêu nhẹ',
      'Kết nối an toàn giữa các dịch vụ trong mạng nội bộ container biệt lập',
      'Tự tin đẩy image lên Docker Hub và triển khai lên bất kỳ máy chủ đám mây nào'
    ],
    techniques: ['Docker', 'Docker Compose', 'Containerization', 'Dockerfile', 'Multi-Stage Build', 'Microservices'],
    documents: [
      'Bảng tra cứu các lệnh Docker CLI thông dụng và cấu trúc Dockerfile tối ưu',
      'Mẫu tệp docker-compose.yml chuẩn cho các stack phổ biến (Node.js/PostgreSQL, Python/MySQL)'
    ]
  },
  {
    title: 'Quản Trị Linux Chuyên Nghiệp Cho Kỹ Sư DevOps (Linux for DevOps)',
    slug: 'quan-tri-linux-chuyen-nghiep-cho-ky-su-devops',
    categorySlug: 'dien-toan-dam-may-va-devops',
    level: CourseLevel.BEGINNER,
    price: 299000,
    oldPrice: 420000,
    leadSummary: 'Nắm vững kỹ năng dòng lệnh Linux thực chiến, viết kịch bản Bash tự động hóa và xử lý sự cố mạng, tài nguyên hệ thống dành riêng cho kỹ sư DevOps.',
    industryContext: 'Mọi công cụ DevOps từ Docker, Kubernetes đến Terraform đều vận hành trên nền Linux; thiếu kiến thức Linux là rào cản lớn nhất của các kỹ sư mới vào nghề.',
    coreTopics: [
      'Kỹ năng dòng lệnh nâng cao: Lọc văn bản với grep, awk, sed, chuyển hướng luồng dữ liệu I/O Redirection',
      'Viết kịch bản tự động hóa Bash Shell Scripting: Biến, điều kiện, vòng lặp, xử lý tham số và kiểm tra mã lỗi',
      'Quản lý tiến trình và tài nguyên: ps, top, htop, kill, kiểm tra mức sử dụng RAM, CPU và dung lượng ổ đĩa (df, du)',
      'Quản lý dịch vụ với Systemd: Tạo unit file tùy chỉnh, cấu hình dịch vụ tự khởi động khi máy chủ boot'
    ],
    handsOnProject: 'Viết bộ script Bash tự động kiểm tra sức khỏe máy chủ, tự động sao lưu cơ sở dữ liệu và gửi thông báo cảnh báo qua Telegram khi tài nguyên vượt ngưỡng 80%.',
    targetAudience: 'Những ai đang chuẩn bị theo học DevOps hoặc lập trình viên muốn làm chủ hệ điều hành máy chủ.',
    careerApplication: 'Sẵn sàng vượt qua các bài kiểm tra thực hành dòng lệnh Linux trong các buổi phỏng vấn vị trí DevOps / SRE.',
    requirements: [
      'Máy tính cá nhân có thể cài đặt máy ảo Ubuntu hoặc sử dụng Windows Subsystem for Linux (WSL2)'
    ],
    benefits: [
      'Tự động hóa các tác vụ quản trị máy chủ lặp đi lặp lại một cách nhanh chóng',
      'Tự tin gỡ lỗi khi hệ thống gặp sự cố treo tiến trình hoặc đầy dung lượng ổ cứng',
      'Hiểu rõ cách thức quản lý và khởi tạo các dịch vụ ngầm với Systemd',
      'Nâng cao tốc độ thao tác trên máy chủ từ xa thông qua terminal'
    ],
    techniques: ['Linux', 'Bash Scripting', 'Systemd', 'DevOps Fundamentals', 'Shell Automation', 'System Administration'],
    documents: [
      'Cẩm nang 50 câu lệnh Linux quan trọng nhất cho DevOps kèm ví dụ thực tế',
      'Kho script mẫu Bash tự động hóa sao lưu và bảo trì máy chủ'
    ]
  },
  {
    title: 'Nhập Môn Tự Động Hóa CI/CD Với GitHub Actions',
    slug: 'nhap-mon-tu-dong-hoa-ci-cd-github-actions',
    categorySlug: 'dien-toan-dam-may-va-devops',
    level: CourseLevel.BEGINNER,
    price: 349000,
    oldPrice: 499000,
    leadSummary: 'Học cách xây dựng quy trình Tích hợp liên tục và Triển khai liên tục (CI/CD) hiện đại, tích hợp chặt chẽ với kho mã nguồn GitHub bằng GitHub Actions.',
    industryContext: 'GitHub Actions đã nhanh chóng trở thành công cụ CI/CD phổ biến nhất thế giới nhờ tính tiện dụng, không cần tự dựng máy chủ và kho Action cộng đồng đồ sộ.',
    coreTopics: [
      'Các khái niệm cốt lõi của GitHub Actions: Workflows, Events, Jobs, Steps, Actions và Runners',
      'Cú pháp tệp cấu hình YAML: Đặt biến môi trường, ma trận chạy đa phiên bản (Matrix Strategy)',
      'Quản lý thông tin nhạy cảm an toàn với GitHub Secrets và Environment Protection Rules',
      'Tự động hóa chạy kiểm thử tự động, build Docker image và đẩy lên GitHub Container Registry (GHCR)'
    ],
    handsOnProject: 'Xây dựng một đường ống CI/CD hoàn chỉnh: mỗi khi lập trình viên mở Pull Request, hệ thống tự động kiểm tra cú pháp và chạy test; khi merge vào main, tự động deploy lên máy chủ đám mây.',
    targetAudience: 'Lập trình viên muốn tự động hóa công việc triển khai mã nguồn mà không cần cài đặt phần mềm Jenkins phức tạp.',
    careerApplication: 'Áp dụng ngay vào các dự án cá nhân và công việc công ty, nâng cao tính chuyên nghiệp của kho mã nguồn.',
    requirements: [
      'Biết sử dụng Git cơ bản (commit, push, pull, branch) và có tài khoản GitHub miễn phí'
    ],
    benefits: [
      'Tự động hóa quy trình kiểm thử chất lượng mã nguồn trước khi tích hợp',
      'Loại bỏ hoàn toàn rủi ro triển khai thủ công sai sót do con người',
      'Sử dụng các Action có sẵn từ GitHub Marketplace để tăng tốc độ cấu hình',
      'Tự tin xây dựng đường ống phân phối phần mềm chuẩn DevOps cho dự án'
    ],
    techniques: ['GitHub Actions', 'CI/CD', 'YAML Workflows', 'Automated Testing', 'Docker Integration', 'DevOps Pipeline'],
    documents: [
      'Mẫu tệp Workflow YAML chuẩn cho các dự án Node.js, Python, Java và Go',
      'Tài liệu hướng dẫn tối ưu chi phí và thời gian chạy máy ảo GitHub-hosted runners'
    ]
  },
  {
    title: 'Khởi Tạo và Triển Khai Ứng Dụng Nhanh Trên Google Cloud Platform (GCP)',
    slug: 'khoi-tao-va-trien-khai-ung-dung-nhanh-tren-gcp',
    categorySlug: 'dien-toan-dam-may-va-devops',
    level: CourseLevel.BEGINNER,
    price: 299000,
    oldPrice: 450000,
    leadSummary: 'Khám phá nền tảng đám mây tân tiến của Google: triển khai container serverless với Cloud Run, lưu trữ Cloud Storage và quản lý cơ sở dữ liệu Cloud SQL dễ dàng.',
    industryContext: 'Google Cloud nổi tiếng với hạ tầng mạng cáp quang tốc độ cao và các dịch vụ Container Serverless cực kỳ tiện dụng, được các công ty công nghệ sáng tạo ưa chuộng.',
    coreTopics: [
      'Tổng quan hệ sinh thái GCP: Quản lý dự án Projects, IAM, hạn ngạch Quotas và thanh toán Billing',
      'Dịch vụ điện toán Serverless Google Cloud Run: Triển khai container tự động co giãn từ 0 đến hàng nghìn phiên bản',
      'Lưu trữ đối tượng với Google Cloud Storage (GCS) và phân quyền truy cập an toàn',
      'Quản lý cơ sở dữ liệu PostgreSQL/MySQL trên đám mây với dịch vụ Google Cloud SQL'
    ],
    handsOnProject: 'Đóng gói một ứng dụng API và triển khai lên Cloud Run kết nối với cơ sở dữ liệu Cloud SQL, tự động co giãn theo lượng truy cập thực tế.',
    targetAudience: 'Lập trình viên muốn triển khai sản phẩm lên môi trường đám mây của Google mà không cần bận tâm quản trị máy chủ.',
    careerApplication: 'Tạo tiền đề chuẩn bị cho chứng chỉ quốc tế Google Cloud Associate Cloud Engineer.',
    requirements: [
      'Tài khoản Google và thẻ thanh toán để kích hoạt 300 USD credit dùng thử miễn phí của Google Cloud'
    ],
    benefits: [
      'Tận dụng sức mạnh Serverless giúp tiết kiệm 100% chi phí máy chủ khi không có người dùng',
      'Không phải lo lắng về việc vá lỗi hệ điều hành hay bảo trì phần cứng',
      'Triển khai container lên internet chỉ trong vòng 30 giây',
      'Hiểu rõ mô hình phân quyền và bảo mật danh tính của Google Cloud'
    ],
    techniques: ['Google Cloud', 'GCP', 'Cloud Run', 'Cloud SQL', 'Serverless', 'GCS'],
    documents: [
      'Hướng dẫn kích hoạt gói 300 USD tín dụng miễn phí của Google Cloud an toàn',
      'Bộ câu lệnh mẫu Google Cloud SDK (gcloud CLI) thực hành nhanh'
    ]
  },
  {
    title: 'Kiến Trúc Hạ Tầng AWS Chuyên Nghiệp (AWS Certified Solutions Architect Associate)',
    slug: 'kien-truc-ha-tang-aws-chuyen-nghiep-saa-c03',
    categorySlug: 'dien-toan-dam-may-va-devops',
    level: CourseLevel.INTERMEDIATE,
    price: 549000,
    oldPrice: 799000,
    leadSummary: 'Khóa học chuẩn bị toàn diện cho kỳ thi AWS Certified Solutions Architect Associate (SAA-C03): thiết kế hệ thống có tính sẵn sàng cao, chịu lỗi và tối ưu chi phí.',
    industryContext: 'AWS SAA-C03 là chứng chỉ kiến trúc đám mây uy tín và được các nhà tuyển dụng săn đón nhiều nhất trên toàn thế giới hiện nay.',
    coreTopics: [
      'Thiết kế mạng đám mây doanh nghiệp VPC đa vùng: Public/Private Subnets, NAT Gateway, Transit Gateway',
      'Hệ thống tự động co giãn Auto Scaling Groups (ASG) và bộ cân bằng tải Application Load Balancer (ALB)',
      'Các giải pháp cơ sở dữ liệu chuyên sâu: Amazon RDS Multi-AZ, Aurora Serverless, DynamoDB',
      'Khung kiến trúc tối ưu AWS Well-Architected Framework: Độ tin cậy, Hiệu năng, Bảo mật, Tối ưu chi phí'
    ],
    handsOnProject: 'Thiết kế và triển khai một hệ thống web thương mại điện tử 3 tầng (3-tier architecture) có khả năng tự động chịu lỗi và tự co giãn khi lưu lượng tăng đột biến.',
    targetAudience: 'Kỹ sư phần mềm, quản trị hệ thống, kỹ sư DevOps muốn nâng tầm trở thành Kiến trúc sư giải pháp đám mây.',
    careerApplication: 'Tự tin vượt qua kỳ thi chứng chỉ quốc tế AWS SAA-C03 và đảm nhận các vị trí Cloud Architect mức lương cao.',
    requirements: [
      'Đã nắm kiến thức cơ bản về AWS hoặc có hiểu biết về mạng và máy chủ'
    ],
    benefits: [
      'Làm chủ tư duy thiết kế hệ thống lớn có khả năng chịu tải hàng triệu người dùng',
      'Hiểu sâu cơ chế hoạt động và lựa chọn dịch vụ AWS tối ưu cho từng bài toán kinh doanh',
      'Tiết kiệm hàng nghìn đô la chi phí hạ tầng cho doanh nghiệp nhờ kỹ thuật tối ưu kiến trúc',
      'Nắm chắc bộ đề thi và các mẹo làm bài thi chứng chỉ AWS SAA-C03 mới nhất'
    ],
    techniques: ['AWS Solutions Architect', 'VPC Design', 'Load Balancer', 'Auto Scaling', 'Amazon RDS', 'Well-Architected'],
    documents: [
      'Sơ đồ tư duy tóm tắt toàn bộ dịch vụ trong kỳ thi AWS SAA-C03',
      'Bộ 300 câu hỏi trắc nghiệm mô phỏng kỳ thi thật kèm giải thích chi tiết'
    ]
  },
  {
    title: 'Làm Chủ Kubernetes: Điều Phối Container Sản Xuất (Certified Kubernetes Administrator)',
    slug: 'lam-chu-kubernetes-dieu-phoi-container-san-xuat-cka',
    categorySlug: 'dien-toan-dam-may-va-devops',
    level: CourseLevel.INTERMEDIATE,
    price: 599000,
    oldPrice: 850000,
    leadSummary: 'Học cách triển khai, quản trị và xử lý sự cố cụm máy chủ Kubernetes thực tế theo định hướng kỳ thi quốc tế CKA của Cloud Native Computing Foundation (CNCF).',
    industryContext: 'Kubernetes đã trở thành hệ điều hành tiêu chuẩn của điện toán đám mây; mọi công ty lớn đều đang chuyển đổi hệ thống sang nền tảng này.',
    coreTopics: [
      'Kiến trúc nội bộ Kubernetes: API Server, etcd, Kube-Scheduler, Kube-Controller-Manager, Kubelet, Kube-Proxy',
      'Các đối tượng cốt lõi: Pods, Deployments, ReplicaSets, Services (ClusterIP, NodePort, LoadBalancer)',
      'Quản lý cấu hình và bí mật với ConfigMaps, Secrets, lưu trữ bền vững với PersistentVolumes (PV/PVC)',
      'Điều hướng lưu lượng vào cụm với Ingress Controller, bảo mật mạng với NetworkPolicies'
    ],
    handsOnProject: 'Khởi tạo một cụm Kubernetes đa node bằng kubeadm trên máy chủ Linux thực tế, triển khai hệ thống microservices và cấu hình tự động phục hồi khi có node chết.',
    targetAudience: 'DevOps Engineers, SysAdmins, Backend Developers muốn làm chủ công nghệ điều phối container số 1 thế giới.',
    careerApplication: 'Đáp ứng 100% yêu cầu kỹ năng thực hành cho kỳ thi CKA (Certified Kubernetes Administrator).',
    requirements: [
      'Thành thạo công nghệ Docker và có kiến thức vững về dòng lệnh Linux'
    ],
    benefits: [
      'Hiểu sâu bản chất giao tiếp giữa các thành phần trong cụm Kubernetes',
      'Tự tay khắc phục các lỗi phổ biến như CrashLoopBackOff, ImagePullBackOff, Pending Pods',
      'Triển khai các ứng dụng không gián đoạn dịch vụ với chiến lược Rolling Updates',
      'Thành thạo công cụ kubectl để thao tác thần tốc trên terminal'
    ],
    techniques: ['Kubernetes', 'K8s', 'CKA', 'Container Orchestration', 'kubectl', 'Microservices'],
    documents: [
      'Cẩm nang câu lệnh kubectl và mẫu file cấu hình YAML thông dụng nhất',
      'Kịch bản phòng lab giả lập 15 bài thi thực hành CKA thực tế'
    ]
  },
  {
    title: 'Hạ Tầng Dưới Dạng Mã Nguồn (Infrastructure as Code) Với Terraform',
    slug: 'ha-tang-duoi-dang-ma-nguon-terraform-iac',
    categorySlug: 'dien-toan-dam-may-va-devops',
    level: CourseLevel.INTERMEDIATE,
    price: 499000,
    oldPrice: 750000,
    leadSummary: 'Tự động hóa hoàn toàn việc khởi tạo hạ tầng đám mây đa nền tảng (AWS, Azure, GCP) bằng mã nguồn khai báo HCL với công cụ Terraform của HashiCorp.',
    industryContext: 'Không còn việc bấm chuột thủ công trên web console; quản lý hạ tầng bằng code giúp kiểm soát phiên bản qua Git và tái lập môi trường chỉ trong vài phút.',
    coreTopics: [
      'Cú pháp ngôn ngữ HashiCorp Configuration Language (HCL): Providers, Resources, Data Sources, Variables, Outputs',
      'Vòng đời quản lý trạng thái: terraform init, plan, apply, destroy và tệp terraform.tfstate',
      'Quản lý trạng thái từ xa an toàn (Remote State) với Amazon S3 và khóa trạng thái DynamoDB State Locking',
      'Xây dựng các Module tái sử dụng (Terraform Modules) và quản lý đa môi trường (Dev, Staging, Prod)'
    ],
    handsOnProject: 'Viết bộ mã nguồn Terraform hoàn chỉnh tự động khởi tạo toàn bộ hạ tầng mạng VPC, máy chủ và cơ sở dữ liệu trên AWS chỉ với một câu lệnh.',
    targetAudience: 'DevOps Engineers, Cloud Engineers muốn chuẩn hóa quy trình triển khai hạ tầng theo chuẩn IaC.',
    careerApplication: 'Tự tin tham gia các dự án quản trị hạ tầng chuyên nghiệp và chuẩn bị cho kỳ thi HashiCorp Certified: Terraform Associate.',
    requirements: [
      'Hiểu kiến thức cơ bản về các dịch vụ điện toán đám mây AWS hoặc GCP'
    ],
    benefits: [
      'Loại bỏ hoàn toàn sự sai khác cấu hình giữa các môi trường phát triển và sản xuất',
      'Kiểm soát và xem trước chính xác những tài nguyên nào sẽ bị thay đổi trước khi bấm áp dụng',
      'Đóng gói kiến trúc hạ tầng thành các module tái sử dụng cho nhiều dự án khác nhau',
      'Làm chủ công cụ IaC phổ biến nhất trong các tập đoàn công nghệ toàn cầu'
    ],
    techniques: ['Terraform', 'Infrastructure as Code', 'HCL', 'Terraform Modules', 'Remote State', 'Cloud Automation'],
    documents: [
      'Bộ thư viện Terraform Module mẫu khởi tạo mạng VPC và cụm máy chủ chuẩn doanh nghiệp',
      'Checklist các quy tắc thực hành tốt nhất (Best Practices) khi quản lý Terraform State'
    ]
  },
  {
    title: 'Giám Sát Hệ Thống Toàn Diện Với Prometheus và Grafana',
    slug: 'giam-sat-he-thong-toan-dien-prometheus-grafana',
    categorySlug: 'dien-toan-dam-may-va-devops',
    level: CourseLevel.INTERMEDIATE,
    price: 399000,
    oldPrice: 599000,
    leadSummary: 'Thu thập số liệu đo lường (Metrics), trực quan hóa bảng điều khiển sống động và thiết lập hệ thống cảnh báo tức thì cho cụm máy chủ và container với Prometheus và Grafana.',
    industryContext: 'Một hệ thống không có công cụ giám sát giống như lái máy bay ban đêm không có bảng đồng hồ; phát hiện sớm sự cố là trách nhiệm sống còn của kỹ sư SRE.',
    coreTopics: [
      'Mô hình giám sát dựa trên số liệu (Metrics-based Monitoring): Counter, Gauge, Histogram, Summary',
      'Cơ chế kéo số liệu (Pull model) của Prometheus, cấu hình thu thập qua Node Exporter và cAdvisor',
      'Viết câu lệnh truy vấn thời gian thực với ngôn ngữ PromQL (Prometheus Query Language)',
      'Thiết kế Dashboard trực quan tuyệt đẹp trên Grafana và cấu hình cảnh báo qua Alertmanager tới Telegram/Slack'
    ],
    handsOnProject: 'Xây dựng trung tâm điều hành giám sát toàn diện cho hệ thống máy chủ và cụm Docker, tự động gửi tin nhắn báo động khi CPU vượt quá 85%.',
    targetAudience: 'Kỹ sư vận hành hệ thống, DevOps, Backend Developers muốn kiểm soát sức khỏe ứng dụng thời gian thực.',
    careerApplication: 'Nâng cao năng lực vận hành hệ thống, sẵn sàng cho các vị trí Site Reliability Engineer (SRE).',
    requirements: [
      'Biết sử dụng Docker và lệnh Linux cơ bản'
    ],
    benefits: [
      'Phát hiện sự cố và điểm nghẽn hiệu năng trước khi người dùng kịp phàn nàn',
      'Thành thạo viết câu lệnh PromQL để tính toán tỷ lệ lỗi và thời gian phản hồi (P95, P99)',
      'Tạo các bảng điều khiển chuyên nghiệp gây ấn tượng mạnh với ban lãnh đạo',
      'Tự động hóa kênh thông báo khẩn cấp đến đội trực vận hành'
    ],
    techniques: ['Prometheus', 'Grafana', 'PromQL', 'Alertmanager', 'Monitoring', 'SRE'],
    documents: [
      'File JSON mẫu của hơn 10 Grafana Dashboard tuyệt đẹp cho Linux, Docker và Nginx',
      'Bộ công thức PromQL tính toán các chỉ số vàng (Golden Signals) của Google SRE'
    ]
  },
  {
    title: 'Triển Khai và Quản Lý Cụm Kubernetes Trên Đám Mây AWS (Amazon EKS)',
    slug: 'trien-khai-va-quan-ly-kubernetes-tren-aws-eks',
    categorySlug: 'dien-toan-dam-may-va-devops',
    level: CourseLevel.INTERMEDIATE,
    price: 549000,
    oldPrice: 799000,
    leadSummary: 'Làm chủ dịch vụ quản lý Kubernetes hàng đầu Amazon Elastic Kubernetes Service (EKS): triển khai cụm với eksctl, quản lý Node Groups, tích hợp mạng VPC CNI và lưu trữ EBS/EFS.',
    industryContext: 'Hầu hết các doanh nghiệp không tự cài đặt Kubernetes từ đầu mà chọn dịch vụ được quản lý như AWS EKS để giảm tải công việc vận hành phần control plane.',
    coreTopics: [
      'Khởi tạo và cấu hình cụm EKS chuyên nghiệp bằng công cụ CLI eksctl',
      'Mô hình mạng AWS VPC CNI: Cấp phát địa chỉ IP thật cho từng Pod trong mạng nội bộ VPC',
      'Phân quyền truy cập cụm kết hợp giữa AWS IAM và Kubernetes RBAC (EKS Pod Identity)',
      'Quản lý lưu trữ với AWS EBS CSI Driver và giải pháp serverless compute với AWS Fargate for EKS'
    ],
    handsOnProject: 'Triển khai một ứng dụng thương mại điện tử microservices hoàn chỉnh lên cụm Amazon EKS có gắn tên miền thật và tự động cấp phát chứng chỉ SSL.',
    targetAudience: 'DevOps và Cloud Engineers đã có nền tảng Kubernetes muốn triển khai thực tế trên hạ tầng đám mây AWS.',
    careerApplication: 'Trở thành chuyên gia EKS được các công ty lớn săn đón với mức thu nhập vượt trội.',
    requirements: [
      'Đã hiểu các khái niệm cơ bản về Kubernetes (Pod, Deployment, Service) và AWS'
    ],
    benefits: [
      'Nắm vững quy trình vận hành cụm Kubernetes trên môi trường doanh nghiệp thực tế',
      'Tận dụng sức mạnh hạ tầng mạng và lưu trữ siêu tốc của AWS',
      'Phân quyền an toàn cho từng ứng dụng tương tác với các tài nguyên AWS S3/DynamoDB',
      'Tự tin giải quyết các bài toán hạ tầng phức tạp nhất trong thực tế'
    ],
    techniques: ['Amazon EKS', 'Kubernetes', 'AWS', 'eksctl', 'VPC CNI', 'Cloud Native'],
    documents: [
      'File cấu hình Cluster Config mẫu triển khai cụm EKS chuẩn production bằng eksctl',
      'Tài liệu hướng dẫn tối ưu chi phí chạy worker nodes với AWS Spot Instances'
    ]
  },
  {
    title: 'Quản Lý Cấu Hình và Tự Động Hóa Máy Chủ Doanh Nghiệp Với Ansible',
    slug: 'quan-ly-cau-hinh-tu-dong-hoa-may-chu-ansible',
    categorySlug: 'dien-toan-dam-may-va-devops',
    level: CourseLevel.INTERMEDIATE,
    price: 449000,
    oldPrice: 650000,
    leadSummary: 'Quản lý cấu hình hàng trăm máy chủ cùng lúc không cần cài đặt agent (Agentless): viết Ansible Playbooks, quản lý kho máy chủ Inventory và tự động hóa cập nhật phần mềm qua SSH.',
    industryContext: 'Cấu hình thủ công từng máy chủ qua SSH là nguyên nhân chính dẫn đến sai sót cấu hình (Configuration Drift); Ansible giải quyết bài toán này một cách tinh gọn.',
    coreTopics: [
      'Kiến trúc Agentless của Ansible và giao tiếp qua kết nối an toàn SSH',
      'Cấu trúc tệp kiểm kê máy chủ Inventory (tĩnh và động Dynamic Inventory)',
      'Viết kịch bản Ansible Playbooks với cú pháp YAML: Modules (apt, yum, copy, systemd, template Jinja2)',
      'Tổ chức mã nguồn tái sử dụng với Ansible Roles và chia sẻ qua Ansible Galaxy'
    ],
    handsOnProject: 'Viết kịch bản Ansible tự động triển khai đồng loạt máy chủ Web Nginx, cài đặt tường lửa và cập nhật bản vá bảo mật cho một cụm 10 máy chủ trong vòng 2 phút.',
    targetAudience: 'System Administrators, Kỹ sư vận hành máy chủ, DevOps muốn tự động hóa việc cấu hình hạ tầng.',
    careerApplication: 'Nâng cao năng lực quản trị quy mô lớn, đáp ứng tiêu chuẩn của các trung tâm dữ liệu và nhà mạng.',
    requirements: [
      'Nắm vững dòng lệnh Linux và hiểu cách tạo khóa SSH Key'
    ],
    benefits: [
      'Cấu hình đồng loạt hàng chục, hàng trăm máy chủ chỉ với một lệnh duy nhất',
      'Đảm bảo tính bất biến (Idempotency): Chỉ thay đổi những thành phần chưa đúng cấu hình',
      'Tái sử dụng các vai trò Roles đã được cộng đồng kiểm nghiệm trên Ansible Galaxy',
      'Lưu trữ toàn bộ cấu hình máy chủ dưới dạng mã nguồn trong kho Git'
    ],
    techniques: ['Ansible', 'Configuration Management', 'Ansible Playbooks', 'YAML', 'Automation', 'DevOps Tools'],
    documents: [
      'Bộ sưu tập Ansible Roles chuẩn để cài đặt Nginx, PostgreSQL, Docker và Node.js',
      'Cheatsheet tra cứu nhanh các module Ansible thông dụng nhất'
    ]
  },
  {
    title: 'Làm Chủ Quản Lý Gói Ứng Dụng Kubernetes Với Helm',
    slug: 'lam-chu-quan-ly-goi-ung-dung-kubernetes-helm',
    categorySlug: 'dien-toan-dam-may-va-devops',
    level: CourseLevel.INTERMEDIATE,
    price: 349000,
    oldPrice: 500000,
    leadSummary: 'Tạm biệt hàng chục tệp YAML rời rạc: học cách đóng gói, chia sẻ và quản lý vòng đời ứng dụng trên cụm Kubernetes bằng trình quản lý gói Helm (The Package Manager for Kubernetes).',
    industryContext: 'Helm được xem như apt hay npm của Kubernetes; hầu như mọi phần mềm mã nguồn mở muốn chạy trên K8s đều được phân phối dưới dạng Helm Chart.',
    coreTopics: [
      'Kiến trúc Helm 3 và cấu trúc một gói Helm Chart: Chart.yaml, values.yaml, thư mục templates',
      'Ngôn ngữ tạo mẫu Go Templates: Biến, hàm, cấu trúc điều kiện if/else, vòng lặp range',
      'Quản lý vòng đời phát hành (Releases): helm install, upgrade, rollback về phiên bản cũ tức thì',
      'Quản lý phụ thuộc (Chart Dependencies) và đóng gói đưa lên kho lưu trữ Artifact Hub'
    ],
    handsOnProject: 'Đóng gói một ứng dụng microservices thành một Helm Chart chuyên nghiệp, hỗ trợ cấu hình đa môi trường linh hoạt qua các tệp values riêng biệt.',
    targetAudience: 'DevOps Engineers, Software Developers làm việc với Kubernetes muốn quản lý triển khai gọn gàng.',
    careerApplication: 'Tối ưu hóa quy trình triển khai CI/CD vào cụm Kubernetes một cách chuẩn mực.',
    requirements: [
      'Đã có kiến thức cơ bản về các đối tượng trong Kubernetes (Deployment, Service, Ingress)'
    ],
    benefits: [
      'Giảm 80% số lượng dòng code YAML trùng lặp nhờ tính năng tạo mẫu (Templating)',
      'Thu hồi (Rollback) phiên bản lỗi về trạng thái ổn định trước đó chỉ trong 1 giây',
      'Dễ dàng cài đặt các phần mềm phức tạp như Redis, Kafka, Prometheus chỉ với một dòng lệnh',
      'Chuẩn hóa quy trình phân phối sản phẩm phần mềm cho khách hàng tự triển khai'
    ],
    techniques: ['Helm', 'Kubernetes', 'Helm Charts', 'Go Templates', 'K8s Deployment', 'Cloud Native'],
    documents: [
      'Khung cấu trúc Helm Chart Starter chuẩn có sẵn cấu hình Ingress và HPA',
      'Bảng tra cứu các hàm xử lý chuỗi và logic thông dụng trong Go Templates'
    ]
  },
  {
    title: 'GitOps Thực Chiến: Triển Khai Ứng Dụng Lên Kubernetes Tự Động Với ArgoCD',
    slug: 'gitops-thuc-chien-trien-khai-kubernetes-argocd',
    categorySlug: 'dien-toan-dam-may-va-devops',
    level: CourseLevel.INTERMEDIATE,
    price: 499000,
    oldPrice: 750000,
    leadSummary: 'Áp dụng triết lý GitOps hiện đại: biến kho lưu trữ Git thành nguồn chân lý duy nhất (Single Source of Truth) và tự động đồng bộ trạng thái cụm Kubernetes với công cụ ArgoCD.',
    industryContext: 'GitOps đang thay thế dần các đường ống CI/CD đẩy truyền thống nhờ tính minh bạch, khả năng kiểm toán lịch sử thay đổi và tự động khôi phục khi cụm bị lệch trạng thái.',
    coreTopics: [
      'Triết lý GitOps và sự khác biệt giữa mô hình Push-based vs Pull-based Deployment',
      'Cài đặt và cấu hình ArgoCD trên cụm Kubernetes: Giao diện trực quan và công cụ dòng lệnh argocd CLI',
      'Mô hình Application of Applications để quản lý hàng chục dịch vụ trong một dự án lớn',
      'Tự động đồng bộ (Auto-sync), tự động sửa chữa trạng thái lệch (Self-healing) và tích hợp Helm'
    ],
    handsOnProject: 'Xây dựng quy trình GitOps hoàn chỉnh: mỗi khi lập trình viên cập nhật thẻ image trên Git, ArgoCD tự động phát hiện và đồng bộ phiên bản mới lên cụm production.',
    targetAudience: 'DevOps Engineers, Tech Leads, SRE muốn nâng cấp quy trình phân phối ứng dụng lên chuẩn mực cao nhất.',
    careerApplication: 'Làm chủ công nghệ GitOps thời thượng, đón đầu xu hướng tại các công ty công nghệ tiên phong.',
    requirements: [
      'Đã nắm chắc kiến thức về Git và thành thạo sử dụng Kubernetes'
    ],
    benefits: [
      'Toàn bộ lịch sử thay đổi hạ tầng được lưu vết minh bạch qua các commit trên Git',
      'Ngăn chặn hoàn toàn việc sửa đổi cấu hình thủ công trực tiếp trên cụm máy chủ',
      'Tự động phục hồi cấu hình về trạng thái chuẩn trên Git nếu có ai đó vô tình thay đổi',
      'Theo dõi tiến độ triển khai trực quan qua giao diện đồ họa sinh động của ArgoCD'
    ],
    techniques: ['GitOps', 'ArgoCD', 'Kubernetes', 'Continuous Delivery', 'Declarative Setup', 'Cloud Native'],
    documents: [
      'Mẫu thiết kế kho mã nguồn Git theo mô hình GitOps đa môi trường (Dev, Staging, Production)',
      'Quy trình xử lý sự cố và phục hồi cụm Kubernetes với ArgoCD'
    ]
  },
  {
    title: 'Kiến Trúc Hạ Tầng Bất Biến (Immutable Infrastructure) Với Packer & Terraform',
    slug: 'kien-truc-ha-tang-bat-bien-packer-terraform',
    categorySlug: 'dien-toan-dam-may-va-devops',
    level: CourseLevel.ADVANCED,
    price: 649000,
    oldPrice: 899000,
    leadSummary: 'Thiết kế hạ tầng bất biến tiêu chuẩn cao: không bao giờ sửa chữa máy chủ đang chạy mà luôn tạo mới máy chủ từ các bản ảnh máy ảo (AMI) được đóng gói sẵn bởi Packer và triển khai bởi Terraform.',
    industryContext: 'Mô hình hạ tầng bất biến giúp triệt tiêu hoàn toàn các lỗi tích tụ theo thời gian trên máy chủ và cho phép mở rộng quy mô hệ thống tức thì khi có biến động tải.',
    coreTopics: [
      'Triết lý hạ tầng bất biến (Immutable Infrastructure) vs hạ tầng biến đổi (Mutable Infrastructure)',
      'Tự động hóa xây dựng bản ảnh máy chủ với HashiCorp Packer: Cấu hình tệp HCL, tích hợp Ansible Provisioner',
      'Quy trình làm cứng bảo mật (Hardening) trước khi xuất bản ảnh máy ảo AWS AMI',
      'Kết hợp Packer và Terraform để triển khai các cụm máy chủ Auto Scaling khởi động trong 10 giây'
    ],
    handsOnProject: 'Xây dựng đường ống tự động tạo bản ảnh máy ảo AWS AMI đã cài sẵn ứng dụng và bảo mật, sau đó dùng Terraform để kích hoạt thay thế cụm máy chủ không gián đoạn dịch vụ.',
    targetAudience: 'Senior DevOps Engineers, Cloud Architects muốn tối ưu hóa độ ổn định tuyệt đối cho hệ thống lớn.',
    careerApplication: 'Đảm nhận các vị trí kiến trúc sư hạ tầng cấp cao trong các công ty công nghệ đa quốc gia.',
    requirements: [
      'Thành thạo công cụ Terraform, Ansible và có kinh nghiệm quản trị máy chủ Linux trên AWS'
    ],
    benefits: [
      'Triệt tiêu hoàn toàn hiện tượng lệch cấu hình (Configuration Drift) giữa các máy chủ trong cụm',
      'Rút ngắn thời gian khởi động máy chủ mới từ 15 phút xuống dưới 30 giây khi cần tăng tải',
      'Đảm bảo mọi máy chủ sinh ra đều đồng nhất 100% về phiên bản phần mềm và cấu hình bảo mật',
      'Nâng cao mức độ an toàn thông tin nhờ loại bỏ nhu cầu truy cập SSH vào máy chủ đang chạy'
    ],
    techniques: ['Immutable Infrastructure', 'Packer', 'Terraform', 'AMI Building', 'Cloud Architecture', 'DevOps Advanced'],
    documents: [
      'Bộ template Packer mẫu hỗ trợ build bản ảnh tối ưu cho AWS và Azure',
      'Quy trình kiểm thử tự động bản ảnh máy chủ với Goss trước khi xuất bản'
    ]
  },
  {
    title: 'Xây Dựng Nền Tảng Kỹ Sư Nội Bộ (Platform Engineering) Với Kubernetes',
    slug: 'xay-dung-nen-tang-platform-engineering-kubernetes',
    categorySlug: 'dien-toan-dam-may-va-devops',
    level: CourseLevel.ADVANCED,
    price: 699000,
    oldPrice: 999000,
    leadSummary: 'Khóa học đón đầu xu thế công nghệ mới nhất: chuyển đổi từ DevOps truyền thống sang Platform Engineering, xây dựng Cổng thông tin tự phục vụ nội bộ (Internal Developer Platform - IDP) với Backstage và Crossplane.',
    industryContext: 'Gartner dự báo đến năm 2026, hơn 80% các tổ chức kỹ thuật phần mềm lớn sẽ thành lập nhóm Platform Engineering để tối ưu trải nghiệm của lập trình viên (Developer Experience - DevEx).',
    coreTopics: [
      'Sự tiến hóa từ DevOps sang Platform Engineering: Giảm tải nhận thức (Cognitive Load) cho lập trình viên',
      'Xây dựng cổng thông tin nhà phát triển Backstage (của Spotify): Quản lý danh mục dịch vụ (Software Catalog) và mẫu khởi tạo (Software Templates)',
      'Điều phối tài nguyên đám mây theo phong cách Kubernetes với Crossplane: Tự phục vụ hạ tầng đám mây không cần tài khoản cloud trực tiếp',
      'Đo lường năng suất lập trình viên với khung chỉ số DORA Metrics và SPACE Framework'
    ],
    handsOnProject: 'Xây dựng một cổng IDP hoàn chỉnh: lập trình viên chỉ cần điền biểu mẫu trên web để tự động sinh mã nguồn, tạo repo Git, khởi tạo cơ sở dữ liệu trên cloud và triển khai lên Kubernetes.',
    targetAudience: 'Principal DevOps Engineers, Technical Directors, Platform Architects.',
    careerApplication: 'Đứng đầu làn sóng chuyển đổi Platform Engineering với cơ hội việc làm và mức đãi ngộ cao nhất thị trường.',
    requirements: [
      'Kinh nghiệm sâu rộng về Kubernetes, CI/CD và kiến trúc điện toán đám mây'
    ],
    benefits: [
      'Giúp lập trình viên tự phục vụ hạ tầng mà không cần phụ thuộc vào đội ngũ DevOps',
      'Rút ngắn thời gian khởi tạo một dịch vụ mới từ vài ngày xuống còn 5 phút',
      'Chuẩn hóa toàn bộ các tiêu chuẩn kỹ thuật và bảo mật của toàn công ty tại một nơi duy nhất',
      'Nâng cao trải nghiệm làm việc của đội ngũ kỹ sư và giữ chân nhân tài công nghệ'
    ],
    techniques: ['Platform Engineering', 'Backstage', 'Crossplane', 'Internal Developer Platform', 'DevEx', 'DORA Metrics'],
    documents: [
      'Bộ tài liệu khung kiến trúc Internal Developer Platform tiêu chuẩn cho doanh nghiệp',
      'Mẫu cấu hình tích hợp Backstage với Kubernetes và GitHub'
    ]
  },
  {
    title: 'Làm Chủ Mạng Dịch Vụ Microservices (Service Mesh) Với Istio',
    slug: 'lam-chu-service-mesh-istio-kubernetes',
    categorySlug: 'dien-toan-dam-may-va-devops',
    level: CourseLevel.ADVANCED,
    price: 649000,
    oldPrice: 899000,
    leadSummary: 'Giải quyết các bài toán giao tiếp phức tạp trong kiến trúc Microservices: điều phối lưu lượng thông minh (Canary Deployment), mã hóa kết nối mTLS tự động và phân tán dấu vết với Istio và Envoy Proxy.',
    industryContext: 'Khi số lượng vi dịch vụ lên tới hàng chục hay hàng trăm, việc quản lý bảo mật kết nối và phân luồng thử nghiệm tính năng bắt buộc phải dựa vào công nghệ Service Mesh.',
    coreTopics: [
      'Kiến trúc Service Mesh: Data Plane (Envoy Sidecar Proxy) và Control Plane (Istiod)',
      'Điều phối lưu lượng nâng cao: VirtualServices, DestinationRules, định tuyến dựa trên trọng số (Canary Release) và lỗi thử nghiệm (Fault Injection)',
      'Bảo mật kết nối dịch vụ với Mutual TLS (mTLS): Tự động quay vòng chứng chỉ số, chính sách xác thực PeerAuthentication',
      'Quan sát hệ thống vi dịch vụ phân tán: Trực quan hóa đồ thị kết nối mạng với Kiali, truy vết phân tán với Jaeger'
    ],
    handsOnProject: 'Triển khai Istio Service Mesh cho một hệ thống microservices, thực hiện chiến lược phát hành Canary Release 90/10 mượt mà và kiểm tra mã hóa mTLS toàn bộ lưu lượng.',
    targetAudience: 'Senior DevOps, Cloud Architects, Microservices Developers.',
    careerApplication: 'Trở thành chuyên gia xử lý các bài toán kiến trúc mạng vi dịch vụ phức tạp trong các dự án công nghệ quy mô lớn.',
    requirements: [
      'Có kiến thức chuyên sâu về Kubernetes và mạng máy tính'
    ],
    benefits: [
      'Thực hiện kiểm thử tính năng mới trên người dùng thực mà không sợ ảnh hưởng đến toàn bộ hệ thống',
      'Mã hóa an toàn tuyệt đối toàn bộ lưu lượng truyền tải nội bộ giữa các microservices',
      'Truy vết chính xác từng microsecond độ trễ của request đi qua chuỗi hàng chục dịch vụ',
      'Tách biệt hoàn toàn các yêu cầu mạng và bảo mật ra khỏi mã nguồn ứng dụng của lập trình viên'
    ],
    techniques: ['Istio', 'Service Mesh', 'Envoy Proxy', 'mTLS', 'Canary Deployment', 'Distributed Tracing'],
    documents: [
      'File cấu hình mẫu các kịch bản điều phối lưu lượng giao thông mạng nâng cao trên Istio',
      'Cẩm nang gỡ lỗi và kiểm tra kết nối Envoy Sidecar Proxy'
    ]
  },
  {
    title: 'Kỹ Thuật Hỗn Loạn (Chaos Engineering): Kiểm Thử Độ Bền Bỉ Hệ Thống Với Chaos Mesh',
    slug: 'ky-thuat-hon-loan-chaos-engineering-chaos-mesh',
    categorySlug: 'dien-toan-dam-may-va-devops',
    level: CourseLevel.ADVANCED,
    price: 599000,
    oldPrice: 850000,
    leadSummary: 'Chủ động tiêm lỗi vào hệ thống production để kiểm tra khả năng phục hồi: giả lập sập node, mất mạng, nghẽn đường truyền và rò rỉ bộ nhớ bằng công cụ Chaos Mesh trên Kubernetes.',
    industryContext: 'Hệ thống lớn chắc chắn sẽ gặp sự cố vào thời điểm bất ngờ nhất; kỹ thuật hỗn loạn giúp các tập đoàn như Netflix đảm bảo dịch vụ không bao giờ sập trước mắt người dùng.',
    coreTopics: [
      'Nguyên lý cốt lõi của Chaos Engineering: Giả định trạng thái ổn định, đưa ra giả thuyết và thử nghiệm có kiểm soát',
      'Cài đặt và thiết lập công cụ thử nghiệm lỗi Chaos Mesh trên cụm Kubernetes',
      'Các kịch bản tiêm lỗi thực tế: Pod Chaos (kill pod), Network Chaos (làm trễ mạng, mất gói tin), Stress Chaos (quá tải CPU/RAM)',
      'Đo lường độ đàn hồi của hệ thống và đánh giá độ hiệu quả của các giải pháp tự phục hồi'
    ],
    handsOnProject: 'Thực hiện một đợt thử nghiệm hỗn loạn: liên tục đánh sập các node cơ sở dữ liệu và làm trễ mạng 2000ms để kiểm tra xem hệ thống có tự động chuyển mạch và duy trì trải nghiệm người dùng hay không.',
    targetAudience: 'Site Reliability Engineers (SRE), Senior DevOps, Quality Assurance Leads.',
    careerApplication: 'Xây dựng tiêu chuẩn độ tin cậy cấp độ cao nhất cho các hệ thống tài chính và thương mại lớn.',
    requirements: [
      'Nắm chắc kiến thức về Kubernetes và các giải pháp giám sát hệ thống'
    ],
    benefits: [
      'Phát hiện các điểm lỗi chí mạng tiềm ẩn trước khi chúng biến thành thảm họa thực tế',
      'Chứng minh và kiểm chứng tính hiệu quả thực tế của các giải pháp High Availability (HA)',
      'Xây dựng sự tự tin tuyệt đối cho đội ngũ kỹ thuật khi vận hành hệ thống trong các đợt cao điểm khuyến mãi lớn',
      'Rèn luyện phản xạ ứng phó sự cố cho đội ngũ kỹ sư thông qua các tình huống thực chiến'
    ],
    techniques: ['Chaos Engineering', 'Chaos Mesh', 'SRE', 'System Resilience', 'Fault Injection', 'High Availability'],
    documents: [
      'Mẫu tài liệu kế hoạch thử nghiệm hỗn loạn (Chaos Experiment Plan) chuẩn cho doanh nghiệp',
      'Bộ kịch bản YAML tiêm lỗi Chaos Mesh thông dụng cho các thành phần hạ tầng'
    ]
  },
  {
    title: 'Tối Ưu Hóa Chi Phí Điện Toán Đám Mây Doanh Nghiệp (FinOps Certified Practitioner)',
    slug: 'toi-uu-hoa-chi-phi-dam-may-finops',
    categorySlug: 'dien-toan-dam-may-va-devops',
    level: CourseLevel.ADVANCED,
    price: 549000,
    oldPrice: 799000,
    leadSummary: 'Làm chủ văn hóa và phương pháp luận FinOps: phân bổ chi phí minh bạch, loại bỏ lãng phí tài nguyên đám mây và tối ưu hóa chi phí hàng triệu USD cho doanh nghiệp.',
    industryContext: 'Chi phí đám mây đang là một trong những khoản chi lớn nhất của các công ty công nghệ; chuyên gia FinOps giúp tiết kiệm 20-40% ngân sách mà không ảnh hưởng đến hiệu năng.',
    coreTopics: [
      'Khung phương pháp luận FinOps: Ba giai đoạn Inform (Thấu hiểu), Optimize (Tối ưu), Operate (Vận hành)',
      'Chiến lược mua tài nguyên cam kết: AWS Savings Plans, Reserved Instances, Spot Instances',
      'Nhận diện và dọn dẹp tài nguyên lãng phí: Ổ đĩa EBS mồ côi, Snapshots cũ, NAT Gateway nhàn rỗi, Rightsizing máy chủ',
      'Thiết lập văn hóa gắn thẻ tài nguyên (Tagging Strategy) và phân bổ chi phí về từng nhóm sản phẩm'
    ],
    handsOnProject: 'Kiểm toán toàn diện chi phí tài khoản AWS giả lập có hóa đơn 50.000 USD/tháng, lập báo cáo tối ưu chi phí và đề xuất phương án tiết kiệm 18.000 USD/tháng.',
    targetAudience: 'Engineering Managers, Cloud Architects, DevOps Leads, Giám đốc công nghệ (CTO).',
    careerApplication: 'Đạt chứng chỉ FinOps Certified Practitioner và trở thành nhân vật quan trọng trong ban điều hành chiến lược chi tiêu công nghệ của công ty.',
    requirements: [
      'Hiểu rõ các dịch vụ tính tiền chính của điện toán đám mây AWS hoặc Azure'
    ],
    benefits: [
      'Giúp doanh nghiệp cắt giảm hàng trăm triệu đến hàng tỷ đồng tiền thuê máy chủ mỗi tháng',
      'Minh bạch hóa chi phí hạ tầng đến từng dòng lệnh và từng tính năng của sản phẩm',
      'Xây dựng cầu nối thấu hiểu giữa đội ngũ kỹ thuật phần mềm và bộ phận tài chính kế toán',
      'Tối ưu hóa vòng đời tài nguyên, bảo vệ lợi nhuận biên cho các sản phẩm công nghệ'
    ],
    techniques: ['FinOps', 'Cloud Cost Optimization', 'AWS Cost Explorer', 'Savings Plans', 'Spot Instances', 'Rightsizing'],
    documents: [
      'Bảng kiểm toán chi phí đám mây 25 bước rà soát lãng phí tài nguyên',
      'Chính sách quy chuẩn gắn thẻ tài nguyên (AWS Tagging Policy) tiêu chuẩn'
    ]
  }
]
