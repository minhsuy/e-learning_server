import { CourseLevel } from '@prisma/client'
import { CourseBlueprint } from './categories-data'
import { COURSES_TECH as PART1 } from './courses-tech'

export const COURSES_TECH_PART2: readonly CourseBlueprint[] = [
  // ==========================================
  // CAT-06: An ninh mạng & Bảo mật (16 courses)
  // Quota: 5 BEGINNER, 7 INTERMEDIATE, 4 ADVANCED | 2 FREE, 14 PAID
  // ==========================================
  {
    title: 'Nhập Môn An Ninh Mạng: Nền Tảng Bảo Mật Thông Tin Dành Cho Mọi Người',
    slug: 'nhap-mon-an-ninh-mang-nen-tang-bao-mat-thong-tin',
    categorySlug: 'an-ninh-mang-va-bao-mat',
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0,
    leadSummary: 'Hiểu rõ các nguyên lý cốt lõi về an toàn thông tin, nhận diện các mối đe dọa lừa đảo phi kỹ thuật và trang bị kỹ năng tự bảo vệ dữ liệu trong kỷ nguyên số.',
    industryContext: 'Hơn 90% các vụ tấn công mạng bắt đầu từ lỗi nhận thức con người; hiểu biết an ninh mạng cơ bản là yêu cầu thiết yếu cho mọi nhân sự công nghệ.',
    coreTopics: [
      'Tam giác bảo mật CIA (Confidentiality, Integrity, Availability) và các mô hình phòng thủ theo chiều sâu',
      'Kỹ thuật lừa đảo phi kỹ thuật (Social Engineering): Phishing, Smishing, Vishing và cách phòng chống',
      'Mật mã học cơ bản: Mã hóa đối xứng, bất đối xứng, hàm băm (Hash), chứng chỉ số SSL/TLS',
      'An toàn mật khẩu, xác thực đa yếu tố (MFA), an toàn mạng không dây Wi-Fi và sao lưu dữ liệu'
    ],
    handsOnProject: 'Xây dựng kế hoạch bảo mật thông tin toàn diện cho môi trường cá nhân và doanh nghiệp nhỏ, thực hành mô phỏng nhận diện email lừa đảo.',
    targetAudience: 'Sinh viên, người làm văn phòng hoặc những ai muốn bắt đầu con đường sự nghiệp trong ngành an toàn thông tin.',
    careerApplication: 'Trang bị chứng chỉ nền tảng, tạo bước đệm hoàn hảo để học tiếp các chứng chỉ quốc tế như CompTIA Security+.',
    requirements: [
      'Biết sử dụng máy tính và trình duyệt web cơ bản, không yêu cầu kiến thức kỹ thuật nâng cao'
    ],
    benefits: [
      'Hiểu rõ bản chất hoạt động của các cuộc tấn công mạng phổ biến',
      'Thành thạo kỹ năng thiết lập mật khẩu mạnh và quản lý mật khẩu an toàn',
      'Tự bảo vệ tài khoản cá nhân và dữ liệu nhạy cảm trước nguy cơ bị đánh cắp danh tính',
      'Nắm bắt bức tranh tổng quan về các vị trí việc làm trong ngành an ninh mạng'
    ],
    techniques: ['Cybersecurity Basics', 'CIA Triad', 'Social Engineering', 'Cryptography', 'Phishing Defense', 'MFA'],
    documents: [
      'Cẩm nang bảo mật dữ liệu cá nhân và doanh nghiệp chuẩn quốc tế',
      'Checklist 20 bước kiểm tra an toàn thiết bị máy tính cá nhân'
    ]
  },
  {
    title: 'Bảo Mật Hệ Điều Hành Linux: Quản Trị và Gia Cố Máy Chủ (Linux Hardening)',
    slug: 'bao-mat-he-dieu-hanh-linux-quan-tri-va-gia-co-may-chu',
    categorySlug: 'an-ninh-mang-va-bao-mat',
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0,
    leadSummary: 'Làm chủ kỹ thuật gia cố và bảo vệ máy chủ Linux trước các đợt quét cổng và xâm nhập trái phép: phân quyền người dùng, cấu hình tường lửa UFW/iptables và kiểm soát dịch vụ.',
    industryContext: 'Hơn 85% máy chủ trên Internet chạy hệ điều hành Linux, biến việc gia cố bảo mật Linux thành kỹ năng nền tảng của mọi System Administrator.',
    coreTopics: [
      'Quản lý danh tính và phân quyền tệp chuyên sâu: sudo, file permissions, SUID/SGID, Sticky Bit',
      'Cấu hình SSH an toàn: Vô hiệu hóa root login, đăng nhập bằng SSH Key cặp khóa, chống brute-force với Fail2ban',
      'Thiết lập tường lửa máy chủ với UFW và iptables: Quy tắc lọc gói tin, chỉ mở các cổng dịch vụ cần thiết',
      'Giám sát log hệ thống và phát hiện bất thường với journalctl, auditd và rsyslog'
    ],
    handsOnProject: 'Gia cố toàn diện một máy chủ Ubuntu Server 22.04 LTS chạy dịch vụ web, đạt điểm đánh giá bảo mật tối đa theo chuẩn CIS Benchmark.',
    targetAudience: 'Quản trị viên hệ thống, DevOps, lập trình viên Backend vận hành máy chủ Linux.',
    careerApplication: 'Tự tin quản trị và bảo vệ hệ thống máy chủ doanh nghiệp trước các rủi ro bảo mật internet.',
    requirements: [
      'Biết các lệnh dòng lệnh Linux cơ bản (cd, ls, cat, nano/vim)'
    ],
    benefits: [
      'Triệt tiêu các cấu hình mặc định thiếu an toàn trên hệ điều hành Linux',
      'Chặn đứng các cuộc tấn công quét cổng và dò quét mật khẩu tự động',
      'Thiết lập hệ thống ghi vết nhật ký phục vụ điều tra sự cố',
      'Tuân thủ các khuyến nghị an toàn máy chủ theo tiêu chuẩn CIS Benchmark'
    ],
    techniques: ['Linux Security', 'Server Hardening', 'SSH Hardening', 'Fail2ban', 'UFW', 'CIS Benchmark'],
    documents: [
      'Checklist gia cố máy chủ Linux chuẩn CIS Benchmark tóm tắt',
      'Script Bash tự động hóa kiểm tra cấu hình an toàn hệ thống Linux'
    ]
  },
  {
    title: 'Phân Tích Gói Tin Mạng Thực Chiến Với Wireshark',
    slug: 'phan-tich-goi-tin-mang-thuc-chien-voi-wireshark',
    categorySlug: 'an-ninh-mang-va-bao-mat',
    level: CourseLevel.BEGINNER,
    price: 249000,
    oldPrice: 380000,
    leadSummary: 'Học cách bắt và phân tích sâu các gói tin mạng trên từng lớp giao thức TCP/IP bằng phần mềm Wireshark để chẩn đoán sự cố mạng và phát hiện lưu lượng độc hại.',
    industryContext: 'Wireshark là công cụ giám sát gói tin tiêu chuẩn công nghiệp được sử dụng tại hầu hết các trung tâm điều hành an ninh mạng (SOC) toàn cầu.',
    coreTopics: [
      'Kiến trúc mạng TCP/IP và quá trình bắt tay 3 bước (Three-way Handshake) của TCP',
      'Cài đặt và thiết lập bộ lọc bắt gói tin (Capture Filters) và bộ lọc hiển thị (Display Filters)',
      'Phân tích sâu các giao thức thông dụng: DNS, DHCP, HTTP, HTTPS (TLS Handshake), ARP',
      'Nhận diện các dấu hiệu tấn công mạng: Quét cổng SYN Scan, ARP Spoofing, tấn công DoS/DDoS'
    ],
    handsOnProject: 'Phân tích tệp dữ liệu bắt gói tin (PCAP) của một cuộc tấn công mạng thực tế, truy tìm địa chỉ IP kẻ tấn công và tái hiện lại dữ liệu truyền tải.',
    targetAudience: 'Kỹ sư mạng, sinh viên ngành an toàn thông tin, nhân viên hỗ trợ kỹ thuật IT Helpdesk.',
    careerApplication: 'Tự tin ứng tuyển vị trí SOC Analyst Level 1 hoặc Network Security Engineer.',
    requirements: [
      'Hiểu khái niệm địa chỉ IP, cổng Port và mô hình mạng OSI cơ bản'
    ],
    benefits: [
      'Sử dụng thành thạo phần mềm Wireshark để chụp và phân tích lưu lượng mạng',
      'Hiểu sâu bản chất dữ liệu truyền đi trên đường truyền vật lý',
      'Phát hiện nhanh chóng các điểm nghẽn hiệu năng mạng và các dịch vụ truyền mật khẩu rõ ràng',
      'Trang bị kỹ năng phân tích bằng chứng phục vụ điều tra số (Digital Forensics)'
    ],
    techniques: ['Wireshark', 'Packet Analysis', 'TCP/IP', 'Network Protocols', 'PCAP Analysis', 'Network Forensics'],
    documents: [
      'Bảng tra cứu cú pháp các bộ lọc Wireshark Display Filters thông dụng nhất',
      'Bộ sưu tập 10 tệp mẫu PCAP mô phỏng các đợt tấn công mạng phục vụ thực hành'
    ]
  },
  {
    title: 'Quản Trị An Toàn Thông Tin Doanh Nghiệp Theo Chuẩn ISO/IEC 27001',
    slug: 'quan-tri-an-toan-thong-tin-doanh-nghiep-iso-27001',
    categorySlug: 'an-ninh-mang-va-bao-mat',
    level: CourseLevel.BEGINNER,
    price: 349000,
    oldPrice: 500000,
    leadSummary: 'Tìm hiểu hệ thống quản lý an toàn thông tin (ISMS) theo tiêu chuẩn quốc tế ISO/IEC 27001:2022, phương pháp đánh giá rủi ro và xây dựng chính sách bảo mật cho tổ chức.',
    industryContext: 'Chứng chỉ ISO 27001 là tấm vé bắt buộc để các doanh nghiệp công nghệ Việt Nam ký kết hợp đồng với các đối tác khách hàng quốc tế tại Mỹ, Nhật Bản và châu Âu.',
    coreTopics: [
      'Cấu trúc tiêu chuẩn ISO/IEC 27001:2022 và các nhóm biện pháp kiểm soát trong Annex A',
      'Phương pháp luận nhận diện tài sản thông tin, đánh giá mối đe dọa và quản lý rủi ro',
      'Xây dựng Tuyên bố áp dụng (Statement of Applicability - SoA) và kế hoạch xử lý rủi ro',
      'Quy trình chuẩn bị và thực hiện đánh giá nội bộ (Internal Audit) an toàn thông tin'
    ],
    handsOnProject: 'Xây dựng trọn bộ hồ sơ chính sách an toàn thông tin và bảng đánh giá rủi ro cho một công ty phần mềm quy mô 50 nhân sự.',
    targetAudience: 'Chuyên viên tuân thủ (Compliance), Quản lý IT, Trưởng phòng An ninh mạng và các kiểm toán viên nội bộ.',
    careerApplication: 'Phát triển sự nghiệp ở mảng Governance, Risk and Compliance (GRC) với cơ hội thăng tiến cao.',
    requirements: [
      'Hiểu biết cơ bản về hoạt động vận hành của một doanh nghiệp công nghệ'
    ],
    benefits: [
      'Nắm bắt toàn diện các yêu cầu bắt buộc của tiêu chuẩn ISO 27001 phiên bản mới nhất',
      'Biết cách lập ma trận đánh giá rủi ro an toàn thông tin định lượng và định tính',
      'Soạn thảo các chính sách bảo mật phù hợp với văn hóa và nguồn lực doanh nghiệp',
      'Tự tin dẫn dắt doanh nghiệp vượt qua các đợt đánh giá chứng nhận chính thức'
    ],
    techniques: ['ISO 27001', 'ISMS', 'Risk Assessment', 'GRC', 'Internal Audit', 'Security Policies'],
    documents: [
      'Bộ biểu mẫu chính sách an toàn thông tin mẫu chuẩn ISO 27001:2022 bằng tiếng Việt và tiếng Anh',
      'Bảng tính Excel mẫu phục vụ nhận diện tài sản và tính toán điểm rủi ro'
    ]
  },
  {
    title: 'Kiểm Thử Xâm Nhập Web Cơ Bản: Làm Chủ OWASP Top 10',
    slug: 'kiem-thu-xam-nhap-web-co-ban-owasp-top-10',
    categorySlug: 'an-ninh-mang-va-bao-mat',
    level: CourseLevel.BEGINNER,
    price: 399000,
    oldPrice: 599000,
    leadSummary: 'Nắm vững 10 lỗ hổng bảo mật ứng dụng web nguy hiểm nhất theo bảng xếp hạng OWASP Top 10, học cách nhận diện, khai thác thử nghiệm và biện pháp khắc phục triệt để.',
    industryContext: 'Hơn 70% các vụ rò rỉ dữ liệu doanh nghiệp xuất phát từ các lỗ hổng lập trình web cơ bản như SQL Injection hay Broken Access Control.',
    coreTopics: [
      'Tổng quan bảng xếp hạng OWASP Top 10 mới nhất và bề mặt tấn công ứng dụng web',
      'Lỗ hổng kiểm soát truy cập (Broken Access Control) và leo thang đặc quyền IDOR',
      'Lỗ hổng chèn mã độc: SQL Injection, Cross-Site Scripting (XSS), Command Injection',
      'Lỗ hổng cấu hình sai an ninh (Security Misconfiguration) và xác thực yếu (Authentication Failures)'
    ],
    handsOnProject: 'Thực hành khai thác và vá lỗi trực tiếp trên môi trường lab an toàn DVWA (Damn Vulnerable Web Application) và OWASP Juice Shop.',
    targetAudience: 'Web Developer muốn viết code bảo mật hơn hoặc người mới bắt đầu học Ethical Hacking / Bug Bounty.',
    careerApplication: 'Trở thành Web Security Specialist hoặc tự tin tham gia các chương trình tìm lỗi nhận tiền thưởng Bug Bounty.',
    requirements: [
      'Hiểu cách thức hoạt động cơ bản của ứng dụng web (HTML, JavaScript, HTTP request, cơ sở dữ liệu SQL)'
    ],
    benefits: [
      'Nhận diện tức thì các đoạn mã nguồn có nguy cơ gây mất an toàn thông tin',
      'Hiểu rõ phương thức tin tặc khai thác các lỗ hổng web trong thực tế',
      'Biết cách sử dụng các hàm mã hóa, Prepared Statements và Sanitization để vá lỗi vĩnh viễn',
      'Xây dựng tư duy phòng thủ vững chắc ngay từ giai đoạn thiết kế tính năng'
    ],
    techniques: ['OWASP Top 10', 'Web Security', 'SQL Injection', 'XSS', 'IDOR', 'Ethical Hacking'],
    documents: [
      'Sổ tay hướng dẫn phòng chống 10 lỗ hổng OWASP dành cho lập trình viên',
      'File Docker-compose dựng nhanh môi trường phòng thí nghiệm bảo mật web DVWA'
    ]
  },
  {
    title: 'Làm Chủ Burp Suite: Công Cụ Kiểm Thử Bảo Mật Web Hàng Đầu',
    slug: 'lam-chu-burp-suite-cong-cu-kiem-thu-bao-mat-web',
    categorySlug: 'an-ninh-mang-va-bao-mat',
    level: CourseLevel.INTERMEDIATE,
    price: 450000,
    oldPrice: 650000,
    leadSummary: 'Thành thạo công cụ đánh chặn và phân tích gói tin HTTP/HTTPS số 1 thế giới Burp Suite Community & Professional phục vụ kiểm thử xâm nhập chuyên nghiệp.',
    industryContext: 'Burp Suite là kỹ năng bắt buộc phải có trong CV của mọi chuyên gia kiểm thử bảo mật (Penetration Tester) và thợ săn tiền thưởng Bug Bounty.',
    coreTopics: [
      'Thiết lập proxy chặn bắt lưu lượng mạng: Cài đặt CA Certificate, cấu hình trình duyệt và xử lý WebSocket',
      'Công cụ Burp Repeater: Sửa đổi và gửi lại các request HTTP để thăm dò phản hồi máy chủ',
      'Tự động hóa tấn công với Burp Intruder: Các chế độ tấn công Sniper, Battering Ram, Pitchfork, Cluster Bomb',
      'Giải mã và phân tích dữ liệu với Burp Decoder, Comparer và kho tiện ích mở rộng BApp Store'
    ],
    handsOnProject: 'Vượt qua 15 phòng lab thực hành kiểm thử bảo mật thực tế trên nền tảng PortSwigger Web Security Academy.',
    targetAudience: 'Chuyên viên an toàn thông tin, lập trình viên muốn tự kiểm tra bảo mật sản phẩm của nhóm.',
    careerApplication: 'Đáp ứng yêu cầu kỹ năng thực hành công cụ trong các kỳ thi lấy chứng chỉ quốc tế như Burp Suite Certified Practitioner.',
    requirements: [
      'Đã nắm vững kiến thức về giao thức HTTP và các lỗ hổng web OWASP cơ bản'
    ],
    benefits: [
      'Tự do can thiệp và bẻ cong luồng dữ liệu giữa trình duyệt và máy chủ',
      'Tự động hóa quá trình fuzzing dữ liệu để tìm kiếm các điểm yếu tiềm ẩn',
      'Sử dụng các extension mạnh mẽ giúp tăng gấp đôi hiệu suất rà soát lỗ hổng',
      'Tự tin sử dụng công cụ kiểm thử bảo mật tiêu chuẩn của các hãng bảo mật lớn'
    ],
    techniques: ['Burp Suite', 'Web Pentesting', 'HTTP Proxy', 'Burp Intruder', 'Repeater', 'PortSwigger Academy'],
    documents: [
      'Bộ từ điển Payloads thông dụng phục vụ tấn công Intruder trong kiểm thử bảo mật',
      'Danh sách các extension Burp Suite hữu ích nhất cho người làm pentest'
    ]
  },
  {
    title: 'SOC Analyst Thực Chiến: Điều Tra và Phản Ứng Sự Cố An Ninh Mạng Với SIEM',
    slug: 'soc-analyst-thuc-chien-dieu-tra-phan-ung-su-co-siem',
    categorySlug: 'an-ninh-mang-va-bao-mat',
    level: CourseLevel.INTERMEDIATE,
    price: 499000,
    oldPrice: 750000,
    leadSummary: 'Đào tạo kỹ năng phân tích nhật ký, điều tra cảnh báo an ninh và xử lý sự cố mã độc trong trung tâm điều hành an ninh mạng (SOC) bằng hệ thống SIEM Splunk và ELK.',
    industryContext: 'Các ngân hàng, tập đoàn viễn thông và cơ quan chính phủ đang liên tục mở rộng trung tâm SOC 24/7, tạo ra nhu cầu tuyển dụng rất lớn cho vị trí SOC Analyst.',
    coreTopics: [
      'Quy trình vận hành SOC hiện đại: Tiếp nhận cảnh báo, phân loại mức độ rủi ro (Triage), điều tra và báo cáo',
      'Hệ thống SIEM: Thu thập log từ máy chủ, tường lửa, thiết bị mạng và tương quan sự kiện (Event Correlation)',
      'Viết câu lệnh truy vấn phân tích log với Splunk SPL và Elasticsearch KQL',
      'Khung ma trận chiến thuật MITRE ATT&CK và quy trình xử lý sự cố chuẩn NIST Incident Response'
    ],
    handsOnProject: 'Điều tra một cuộc tấn công ransomware xâm nhập mạng nội bộ, lập mốc thời gian sự cố (Timeline) và viết báo cáo điều tra chuyên nghiệp.',
    targetAudience: 'Người muốn theo đuổi hướng phòng thủ an ninh mạng (Blue Team), kỹ sư SOC cấp độ Tier 1/Tier 2.',
    careerApplication: 'Tự tin phỏng vấn và làm việc ngay tại các trung tâm giám sát an ninh mạng của các tổ chức tài chính.',
    requirements: [
      'Hiểu rõ về hệ điều hành Windows/Linux và mô hình mạng máy tính',
      'Biết cách đọc các định dạng log cơ bản (Syslog, Windows Event Logs)'
    ],
    benefits: [
      'Hiểu rõ vai trò và công việc hàng ngày của một chuyên viên phân tích tại trung tâm SOC',
      'Thành thạo kỹ năng tìm kiếm và phân tích log trên các nền tảng SIEM hàng đầu',
      'Ánh xạ các hành vi tấn công vào khung MITRE ATT&CK để đưa ra biện pháp ngăn chặn',
      'Viết báo cáo sự cố an ninh thông tin mạch lạc, rõ ràng cho ban lãnh đạo'
    ],
    techniques: ['SOC Analyst', 'SIEM', 'Splunk', 'MITRE ATT&CK', 'Incident Response', 'Log Analysis'],
    documents: [
      'Bộ kịch bản phản ứng nhanh sự cố (Playbooks) cho các tình huống tấn công mạng điển hình',
      'Mẫu báo cáo điều tra sự cố an toàn thông tin tiêu chuẩn doanh nghiệp'
    ]
  },
  {
    title: 'Kiểm Thử Xâm Nhập Mạng Nội Bộ (Network Pentesting) Với Kali Linux & Metasploit',
    slug: 'kiem-thu-xam-nhap-mang-noi-bo-kali-linux-metasploit',
    categorySlug: 'an-ninh-mang-va-bao-mat',
    level: CourseLevel.INTERMEDIATE,
    price: 549000,
    oldPrice: 799000,
    leadSummary: 'Làm chủ các công cụ và kỹ thuật tấn công mạng nội bộ trên hệ điều hành Kali Linux: quét cổng Nmap, khai thác lỗ hổng dịch vụ với Metasploit Framework và leo thang đặc quyền.',
    industryContext: 'Đánh giá an ninh hạ tầng mạng nội bộ giúp tổ chức phát hiện các lỗ hổng nghiêm trọng trước khi bị tin tặc xâm nhập sâu vào hệ thống dữ liệu cốt lõi.',
    coreTopics: [
      'Kỹ thuật thu thập thông tin mạng (Reconnaissance) và quét cổng nâng cao với Nmap',
      'Khai thác lỗ hổng tự động và tùy chỉnh với Metasploit Framework (MSFConsole)',
      'Kỹ thuật tấn công mật khẩu: Password Spraying, Brute-force với Hydra và bẻ khóa Hash với John the Ripper / Hashcat',
      'Hậu khai thác (Post-Exploitation): Duy trì truy cập, thu thập thông tin xác thực trên bộ nhớ máy tính'
    ],
    handsOnProject: 'Xâm nhập và chiếm quyền điều khiển hoàn toàn một mạng máy chủ giả lập trong môi trường phòng thí nghiệm ảo hóa an toàn.',
    targetAudience: 'Ethical Hackers, kỹ sư an ninh mạng muốn hoàn thiện kỹ năng tấn công mạng (Red Team).',
    careerApplication: 'Tạo nền tảng vững chắc để thi các chứng chỉ thực hành an ninh mạng uy tín như OSCP hay CEH Practical.',
    requirements: [
      'Thành thạo dòng lệnh Linux và có kiến thức vững vàng về mạng máy tính TCP/IP',
      'Máy tính có tối thiểu 8GB RAM để chạy máy ảo Kali Linux'
    ],
    benefits: [
      'Sử dụng thành thạo các công cụ kiểm thử an ninh chuyên nghiệp trên Kali Linux',
      'Hiểu rõ phương thức khai thác lỗ hổng dịch vụ từ xa (Remote Code Execution)',
      'Biết cách trích xuất mật khẩu và mã băm từ hệ thống sau khi đã chiếm quyền',
      'Đề xuất các biện pháp cấu hình phòng thủ vững chắc cho quản trị viên mạng'
    ],
    techniques: ['Network Pentesting', 'Kali Linux', 'Metasploit', 'Nmap', 'Hydra', 'Privilege Escalation'],
    documents: [
      'Cẩm nang câu lệnh Nmap và Metasploit cheatsheet cho kiểm thử mạng',
      'Hướng dẫn thiết lập mạng lab an toàn với máy ảo Vulnerable VMs'
    ]
  },
  {
    title: 'Bảo Mật Điện Toán Đám Mây AWS: Thiết Kế Hạ Tầng Đám Mây An Toàn',
    slug: 'bao-mat-dien-toan-dam-may-aws-thiet-ke-an-toan',
    categorySlug: 'an-ninh-mang-va-bao-mat',
    level: CourseLevel.INTERMEDIATE,
    price: 499000,
    oldPrice: 750000,
    leadSummary: 'Thiết kế và bảo vệ hạ tầng đám mây Amazon Web Services theo nguyên tắc đặc quyền tối thiểu: quản lý định danh IAM, mã hóa dữ liệu KMS, bảo mật mạng VPC và giám sát với GuardDuty.',
    industryContext: 'Hơn 80% sự cố rò rỉ dữ liệu trên đám mây bắt nguồn từ việc cấu hình sai quyền truy cập AWS IAM hoặc để lộ public các bucket S3.',
    coreTopics: [
      'Quản lý định danh và quyền truy cập AWS IAM chuyên sâu: Roles, Policies, Service Control Policies (SCPs)',
      'Bảo mật dữ liệu tĩnh và dữ liệu chuyển tiếp với AWS Key Management Service (KMS) và Secrets Manager',
      'Kiến trúc mạng VPC an toàn: Security Groups, Network ACLs, VPC Endpoints, Private Subnets',
      'Phát hiện mối đe dọa thông minh trên đám mây với AWS GuardDuty, Security Hub và CloudTrail'
    ],
    handsOnProject: 'Rà soát và vá toàn diện một hạ tầng AWS bị cấu hình sai, triển khai tự động hóa phát hiện rò rỉ khóa truy cập Access Keys.',
    targetAudience: 'Cloud Engineer, DevOps, Security Engineer làm việc với hạ tầng đám mây AWS.',
    careerApplication: 'Chuẩn bị cho chứng chỉ quốc tế AWS Certified Security - Specialty với cơ hội mức lương vượt trội.',
    requirements: [
      'Đã có kiến thức cơ bản về các dịch vụ điện toán đám mây AWS (EC2, S3, VPC)'
    ],
    benefits: [
      'Xây dựng chính sách IAM chặt chẽ tuân thủ nguyên tắc Least Privilege',
      'Mã hóa toàn diện mọi tài nguyên lưu trữ và cơ sở dữ liệu trên đám mây',
      'Ngăn chặn nguy cơ rò rỉ dữ liệu từ các thùng chứa S3 ra môi trường internet công cộng',
      'Thiết lập hệ thống cảnh báo tức thì khi có hành vi bất thường trên tài khoản AWS'
    ],
    techniques: ['AWS Security', 'Cloud Security', 'AWS IAM', 'AWS KMS', 'VPC Security', 'GuardDuty'],
    documents: [
      'Bộ tài liệu AWS Security Best Practices và ma trận rà soát cấu hình đám mây',
      'Các mẫu chính sách IAM Policy mẫu chuẩn cho từng vai trò dự án'
    ]
  },
  {
    title: 'Phát Triển Phần Mềm An Toàn (DevSecOps): Tích Hợp Bảo Mật Vào CI/CD',
    slug: 'phat-trien-phan-mem-an-toan-devsecops-tich-hop-ci-cd',
    categorySlug: 'an-ninh-mang-va-bao-mat',
    level: CourseLevel.INTERMEDIATE,
    price: 450000,
    oldPrice: 650000,
    leadSummary: 'Chuyển dịch bảo mật sang bên trái (Shift-Left Security): tích hợp tự động hóa quét mã nguồn tĩnh (SAST), phân tích phụ thuộc (SCA) và quét lỗ hổng container vào đường ống CI/CD.',
    industryContext: 'Mô hình DevSecOps giúp các doanh nghiệp phát hiện lỗi bảo mật ngay khi lập trình viên gõ code, tiết kiệm hàng trăm lần chi phí so với việc vá lỗi sau khi sản phẩm đã lên production.',
    coreTopics: [
      'Triết lý Shift-Left Security và các trụ cột công nghệ trong đường ống DevSecOps',
      'Kiểm thử bảo mật mã nguồn tĩnh (SAST) với SonarQube và Semgrep',
      'Kiểm tra rủi ro phụ thuộc mã nguồn mở (Software Composition Analysis - SCA) với Snyk và Dependency-Check',
      'Bảo mật Container và Docker Images: Quét lỗ hổng với Trivy, tối ưu hóa kích thước và quyền root'
    ],
    handsOnProject: 'Tích hợp trọn bộ các công cụ quét bảo mật tự động vào GitHub Actions, tự động chặn merge code nếu phát hiện lỗ hổng nghiêm trọng.',
    targetAudience: 'DevOps Engineer, Software Developers, Tech Leads mong muốn nâng cao tiêu chuẩn an toàn cho sản phẩm.',
    careerApplication: 'Đón đầu xu hướng tuyển dụng DevSecOps đang khan hiếm nhân lực chất lượng cao trên thị trường.',
    requirements: [
      'Hiểu quy trình phát triển phần mềm và đã từng sử dụng một hệ thống CI/CD (GitHub Actions, GitLab CI)'
    ],
    benefits: [
      'Tự động hóa hoàn toàn việc kiểm tra bảo mật mà không làm chậm tiến độ dự án',
      'Ngăn chặn triệt để việc vô tình đẩy mật khẩu, API keys lên kho mã nguồn Git',
      'Kiểm soát và cập nhật kịp thời các thư viện mã nguồn mở bị dính lỗ hổng bảo mật',
      'Xây dựng văn hóa trách nhiệm bảo mật chung cho toàn bộ đội ngũ phát triển'
    ],
    techniques: ['DevSecOps', 'SAST', 'SCA', 'SonarQube', 'Trivy', 'CI/CD Security'],
    documents: [
      'Kịch bản YAML mẫu tích hợp SonarQube, Snyk và Trivy vào GitHub Actions',
      'Chính sách tiêu chuẩn chất lượng (Quality Gate) chuẩn cho dự án phần mềm'
    ]
  },
  {
    title: 'Tấn Công và Phòng Thủ Hệ Thống Active Directory Doanh Nghiệp',
    slug: 'tan-cong-va-phong-thu-active-directory-doanh-nghiep',
    categorySlug: 'an-ninh-mang-va-bao-mat',
    level: CourseLevel.INTERMEDIATE,
    price: 549000,
    oldPrice: 850000,
    leadSummary: 'Hiểu sâu cơ chế xác thực và cấu trúc miền Active Directory của hệ điều hành Windows Server, thực hành các kỹ thuật tấn công Kerberos và phương pháp giám sát bảo vệ.',
    industryContext: 'Hơn 95% các doanh nghiệp trong danh sách Fortune 500 sử dụng Active Directory để quản lý người dùng; đây là mục tiêu hàng đầu của các nhóm tin tặc tống tiền chuyên nghiệp.',
    coreTopics: [
      'Kiến trúc Active Directory: Domain Controllers, GPO, giao thức xác thực NTLM và Kerberos',
      'Thu thập thông tin miền với BloodHound: Phân tích đường dẫn tấn công ngắn nhất đến quyền Domain Admin',
      'Các kỹ thuật tấn công Kerberos phổ biến: Kerberoasting, AS-REP Roasting, Pass-the-Hash',
      'Biện pháp phòng thủ: Kiến trúc phân tầng Tiered Administrative Model, LAPS và bảo vệ tài khoản quản trị'
    ],
    handsOnProject: 'Mô phỏng một đợt tấn công từ tài khoản nhân viên thông thường leo thang chiếm quyền điều khiển toàn bộ miền Domain Controller và sau đó triển khai giải pháp gia cố.',
    targetAudience: 'Kỹ sư an toàn thông tin, Quản trị viên hệ thống Windows Server, Chuyên viên kiểm thử mạng nội bộ.',
    careerApplication: 'Làm chủ kỹ năng cốt lõi được săn đón trong các dịch vụ đánh giá an ninh chuyên nghiệp (Enterprise Penetration Testing).',
    requirements: [
      'Hiểu kiến thức mạng căn bản và có hiểu biết về hệ điều hành Windows Server'
    ],
    benefits: [
      'Hiểu rõ cách thức tin tặc di chuyển ngang (Lateral Movement) trong mạng nội bộ công ty',
      'Sử dụng thành thạo công cụ BloodHound để lập bản đồ rủi ro phân quyền',
      'Phát hiện và vô hiệu hóa các tài khoản có cấu hình xác thực yếu',
      'Thiết kế hạ tầng Active Directory có khả năng cô lập thiệt hại khi bị tấn công'
    ],
    techniques: ['Active Directory', 'Kerberos', 'BloodHound', 'Kerberoasting', 'Pass-the-Hash', 'Windows Security'],
    documents: [
      'Sơ đồ mô hình phân tầng quản trị Tier Model cho Active Directory',
      'Hướng dẫn cấu hình kiểm toán nâng cao (Advanced Audit Policy) cho Windows Event Logs'
    ]
  },
  {
    title: 'Kiểm Thử Xâm Nhập Ứng Dụng Web Nâng Cao: Vượt Qua WAF và Khai Thác Chuỗi Lỗ Hổng',
    slug: 'kiem-thu-xam-nhap-web-nang-cao-bypass-waf',
    categorySlug: 'an-ninh-mang-va-bao-mat',
    level: CourseLevel.ADVANCED,
    price: 699000,
    oldPrice: 999000,
    leadSummary: 'Khóa học chuyên sâu dành cho chuyên gia kiểm thử bảo mật: kỹ thuật vượt qua tường lửa ứng dụng web (WAF Bypass), tấn công giải mã hóa bất an (Insecure Deserialization) và kết hợp chuỗi lỗi thực thi mã từ xa (RCE).',
    industryContext: 'Khi các ứng dụng hiện đại đều được bảo vệ bởi Cloudflare hay ModSecurity, các kỹ thuật khai thác cơ bản sẽ hoàn toàn bị chặn đứng, đòi hỏi kỹ năng bẻ khóa nâng cao.',
    coreTopics: [
      'Kỹ thuật làm rối và né tránh tường lửa ứng dụng web (WAF Evasion): Chunked transfer, ký tự đặc biệt, biến đổi ngữ nghĩa',
      'Khai thác lỗ hổng Deserialize nguy hiểm trên Java, PHP, Python và .NET',
      'Tấn công giả mạo yêu cầu từ phía máy chủ (SSRF) khai thác dịch vụ đám mây Metadata Services (AWS/GCP)',
      'Tấn công tiêm nhiễm giao diện máy chủ (Server-Side Template Injection - SSTI) và Server-Side Request Smuggling'
    ],
    handsOnProject: 'Khai thác thành công một chuỗi lỗ hổng phức tạp từ SSRF vượt qua tường lửa WAF để đọc thông tin bí mật đám mây và chiếm quyền shell máy chủ.',
    targetAudience: 'Senior Web Penetration Testers, Bug Bounty Hunters chuyên nghiệp, Security Researchers.',
    careerApplication: 'Đạt đẳng cấp chuyên gia có thể phát hiện các lỗ hổng 0-day phức tạp trên các hệ thống lớn.',
    requirements: [
      'Đã có kinh nghiệm thực tế về kiểm thử web ít nhất 1 năm và sử dụng thành thạo Burp Suite',
      'Khả năng đọc hiểu mã nguồn ở mức khá (Python, Java, PHP hoặc JavaScript)'
    ],
    benefits: [
      'Nắm vững tư duy kết hợp nhiều lỗi bảo mật nhỏ thành một đòn tấn công có sức tàn phá lớn',
      'Hiểu rõ cơ chế hoạt động của WAF để phát hiện những kẽ hở logic trong việc nhận dạng mẫu',
      'Thành thạo kỹ thuật khai thác các lỗ hổng thời thượng nhất hiện nay (SSRF, Deserialization, HTTP Smuggling)',
      'Đóng góp các phát hiện bảo mật giá trị cao trên các nền tảng quốc tế như HackerOne, Bugcrowd'
    ],
    techniques: ['Advanced Web Pentest', 'WAF Bypass', 'SSRF', 'Insecure Deserialization', 'SSTI', 'HTTP Smuggling'],
    documents: [
      'Kho tài liệu kỹ thuật về các kỹ thuật bypass WAF mới nhất kèm mẫu payload',
      'Tổng hợp các kịch bản khai thác lỗ hổng SSRF trên các nhà cung cấp đám mây lớn'
    ]
  },
  {
    title: 'Phân Tích Mã Độc Cơ Bản Đến Nâng Cao (Malware Analysis & Triage)',
    slug: 'phan-tich-ma-doc-co-ban-den-nang-cao',
    categorySlug: 'an-ninh-mang-va-bao-mat',
    level: CourseLevel.ADVANCED,
    price: 649000,
    oldPrice: 899000,
    leadSummary: 'Học cách mổ xẻ các phần mềm độc hại (Ransomware, Trojan, Spyware) trong môi trường sandbox an toàn: phân tích tĩnh, phân tích động và trích xuất chỉ số đe dọa (IoCs).',
    industryContext: 'Trước sự gia tăng chóng mặt của các cuộc tấn công mã hóa tống tiền, năng lực phân tích mã độc giúp doanh nghiệp nhanh chóng khoanh vùng thiệt hại và ngăn chặn lây lan.',
    coreTopics: [
      'Xây dựng phòng thí nghiệm phân tích mã độc an toàn, cô lập hoàn toàn với mạng bên ngoài',
      'Phân tích tĩnh (Static Analysis): Kiểm tra chữ ký tệp, phân tích cấu trúc PE Header, chuỗi ký tự String, hàm nhập khẩu',
      'Phân tích động (Dynamic Analysis): Giám sát hành vi tiến trình, can thiệp Registry, theo dõi kết nối mạng bằng Process Hacker và RegShot',
      'Sử dụng trình gỡ lỗi x64dbg để bước từng dòng lệnh Assembly và phân tích chức năng mã độc'
    ],
    handsOnProject: 'Phân tích một mẫu mã độc đào tiền ảo thực tế, trích xuất địa chỉ máy chủ chỉ huy (C2 Server) và viết luật YARA để phát hiện.',
    targetAudience: 'Chuyên viên điều tra sự cố (DFIR), Kỹ sư an ninh mạng cấp cao, Kỹ sư phân tích mã độc.',
    careerApplication: 'Gia nhập các đội phản ứng nhanh sự cố cấp cao (CSIRT) hoặc các hãng phát triển phần mềm diệt virus.',
    requirements: [
      'Hiểu biết sâu về kiến trúc hệ điều hành Windows, tiến trình, dịch vụ và bộ nhớ',
      'Có kiến thức cơ bản về hợp ngữ Assembly x86/x64 và ngôn ngữ C'
    ],
    benefits: [
      'Tự tin tiếp nhận và xử lý các mẫu tệp nghi ngờ mà không lo lây nhiễm ra hệ thống',
      'Giải mã được hành vi thực sự của các loại virus, mã độc tống tiền tinh vi',
      'Trích xuất đầy đủ các chỉ số IoC phục vụ việc đưa vào hệ thống phòng thủ tường lửa',
      'Biết cách viết luật YARA để quét và phát hiện các biến thể mã độc mới'
    ],
    techniques: ['Malware Analysis', 'Static Analysis', 'Dynamic Analysis', 'x64dbg', 'YARA Rules', 'Reverse Engineering'],
    documents: [
      'Hướng dẫn thiết lập môi trường phòng lab phân tích mã độc Flare-VM an toàn tuyệt đối',
      'Mẫu báo cáo phân tích mã độc kỹ thuật số chuẩn chuyên gia'
    ]
  },
  {
    title: 'Điều Tra Số và Ứng Cứu Sự Cố Khẩn Cấp (Digital Forensics & Incident Response - DFIR)',
    slug: 'dieu-tra-so-va-ung-cuu-su-co-khan-cap-dfir',
    categorySlug: 'an-ninh-mang-va-bao-mat',
    level: CourseLevel.ADVANCED,
    price: 649000,
    oldPrice: 899000,
    leadSummary: 'Trang bị kỹ năng của một thám tử kỹ thuật số: thu thập chứng cứ số nguyên vẹn, phân tích bộ nhớ RAM bằng Volatility và tái hiện toàn bộ hành vi xâm nhập của kẻ tấn công.',
    industryContext: 'Khi xảy ra sự cố an ninh nghiêm trọng, việc điều tra chính xác kẻ tấn công đã làm gì, đánh cắp dữ liệu nào là yêu cầu sống còn phục vụ trách nhiệm pháp lý và bảo hiểm mạng.',
    coreTopics: [
      'Quy chuẩn thu thập chứng cứ số bảo toàn tính toàn vẹn (Chain of Custody) và tạo ảnh đĩa (Disk Imaging)',
      'Phân tích dấu vết hệ điều hành Windows: MFT, Prefetch, Shimcache, Amcache, UserAssist',
      'Phân tích bộ nhớ tạm thời RAM với Volatility Framework: Tìm kiếm tiến trình ẩn, mã độc được tiêm vào bộ nhớ',
      'Tái dựng mốc thời gian sự cố (Super Timeline Analysis) bằng Plaso và log2timeline'
    ],
    handsOnProject: 'Điều tra một vụ rò rỉ dữ liệu máy chủ tài chính, tái dựng chính xác từng bước thao tác của tin tặc từ khi xâm nhập đến khi tẩu tán dữ liệu.',
    targetAudience: 'Chuyên viên phản ứng sự cố, Điều tra viên kỹ thuật số, Chuyên gia an ninh mạng pháp lý.',
    careerApplication: 'Đảm nhận các vị trí chuyên gia điều tra số tại các công ty dịch vụ an ninh mạng hàng đầu hoặc cơ quan thực thi pháp luật.',
    requirements: [
      'Nắm vững kiến thức hệ thống tập tin NTFS/EXT4 và cấu trúc vận hành của hệ điều hành',
      'Đã có kinh nghiệm làm việc trong lĩnh vực bảo mật hoặc quản trị mạng'
    ],
    benefits: [
      'Biết cách thu thập bằng chứng điện tử có giá trị pháp lý trước tòa án',
      'Khám phá được các hành vi tinh vi mà kẻ tấn công cố tình xóa dấu vết nhật ký log',
      'Sử dụng thành thạo bộ công cụ điều tra bộ nhớ Volatility hàng đầu thế giới',
      'Xác định chính xác phạm vi ảnh hưởng (Scope of Compromise) của đợt tấn công'
    ],
    techniques: ['Digital Forensics', 'Incident Response', 'Volatility', 'RAM Analysis', 'Timeline Analysis', 'Chain of Custody'],
    documents: [
      'Quy trình biểu mẫu ghi nhận chuỗi bảo quản bằng chứng số Chain of Custody chuẩn',
      'Sổ tay hướng dẫn vị trí các dấu vết số (Artifacts) quan trọng trên hệ điều hành Windows'
    ]
  },
  {
    title: 'Kỹ Thuật Đỏ (Red Teaming): Tấn Công Mô Phỏng Nâng Cao Phục Vụ Đánh Giá Doanh Nghiệp',
    slug: 'ky-thuat-do-red-teaming-tan-cong-mo-phong-nang-cao',
    categorySlug: 'an-ninh-mang-va-bao-mat',
    level: CourseLevel.ADVANCED,
    price: 699000,
    oldPrice: 999000,
    leadSummary: 'Học cách đóng vai trò một nhóm tin tặc chuyên nghiệp (Advanced Persistent Threat - APT): xây dựng hạ tầng chỉ huy C2 ẩn danh, né tránh phần mềm phòng chống mã độc EDR và chiếm quyền toàn diện tổ chức.',
    industryContext: 'Các tập đoàn lớn không chỉ cần quét lỗi tự động mà cần các đợt diễn tập thực chiến Red Team để kiểm tra khả năng phản ứng thực tế của đội ngũ bảo vệ Blue Team.',
    coreTopics: [
      'Thiết kế hạ tầng tấn công chỉ huy ẩn danh (C2 Infrastructure) với Redirectors, Domain Fronting',
      'Sử dụng các nền tảng C2 mã nguồn mở hiện đại: Mythic, Havoc hoặc Sliver',
      'Kỹ thuật né tránh phần mềm phòng thủ EDR/AV: Xáo trộn bộ nhớ, thay thế API hooks (Direct System Calls), Process Injection',
      'Mô phỏng đòn tấn công phi kỹ thuật có chủ đích (Spear Phishing) và triển khai tệp đính kèm độc hại an toàn'
    ],
    handsOnProject: 'Thực hiện một chiến dịch Red Team mô phỏng từ việc gửi email lừa đảo, chiếm quyền máy trạm ban đầu, né tránh EDR và di chuyển ngang chiếm trọn Domain Controller.',
    targetAudience: 'Senior Pentesters, Red Team Operators, chuyên gia an ninh mạng muốn vươn tới cấp độ cao nhất.',
    careerApplication: 'Trở thành Red Team Lead với cơ hội mức thu nhập và đãi ngộ hàng đầu trong ngành an toàn thông tin.',
    requirements: [
      'Có kiến thức chuyên sâu về kiểm thử mạng nội bộ và Active Directory',
      'Biết lập trình cơ bản với C/C++, C# hoặc Golang'
    ],
    benefits: [
      'Làm chủ tư duy và chiến thuật của các nhóm tin tặc khét tiếng nhất thế giới',
      'Hiểu rõ cơ chế phát hiện của các giải pháp phòng vệ EDR hiện đại để tìm cách vượt qua',
      'Biết cách xây dựng hệ thống máy chủ điều khiển tấn công an toàn và chuyên nghiệp',
      'Giúp các tổ chức lớn nhận thức rõ lỗ hổng trong quy trình con người và công nghệ'
    ],
    techniques: ['Red Teaming', 'C2 Framework', 'EDR Evasion', 'Direct Syscalls', 'Process Injection', 'APT Simulation'],
    documents: [
      'Kế hoạch kịch bản diễn tập thực chiến (Rules of Engagement) chuẩn cho chiến dịch Red Team',
      'Mẫu mã nguồn C++ thực hiện kỹ thuật tiêm tiến trình và gọi Direct System Calls an toàn'
    ]
  },
  {
    title: 'An Ninh Mạng Cho Hệ Thống Ô Tô và Thiết Bị IoT (IoT & Automotive Security)',
    slug: 'an-ninh-mang-cho-he-thong-o-to-thiet-bi-iot',
    categorySlug: 'an-ninh-mang-va-bao-mat',
    level: CourseLevel.ADVANCED,
    price: 599000,
    oldPrice: 850000,
    leadSummary: 'Khám phá lĩnh vực an ninh mạng mới mẻ và đầy tiềm năng: phân tích giao thức mạng trên xe ô tô CAN Bus, trích xuất firmware thiết bị thông minh IoT và tìm kiếm lỗ hổng phần cứng.',
    industryContext: 'Xe điện thông minh và hàng tỷ thiết bị IoT đang tràn ngập đời sống; an toàn cho phương tiện tự hành và thiết bị y tế thông minh đang là mối quan tâm hàng đầu của xã hội.',
    coreTopics: [
      'Kiến trúc mạng trên ô tô: Giao thức CAN Bus, OBD-II port, chẩn đoán UDS và phân tích tín hiệu',
      'Thu thập và mô phỏng lưu lượng CAN Bus bằng công cụ can-utils và SocketCAN trên Linux',
      'Phân tích bảo mật thiết bị IoT: Trích xuất firmware, phân tích hệ thống tập tin với Binwalk',
      'Khai thác lỗ hổng giao thức truyền thông không dây tầm ngắn: Bluetooth Low Energy (BLE), Zigbee, Wi-Fi IoT'
    ],
    handsOnProject: 'Giả lập kết nối mạng CAN Bus của ô tô ảo, gửi tín hiệu can thiệp bảng điều khiển tốc độ và đồng hồ đo nhiên liệu thành công.',
    targetAudience: 'Kỹ sư phần mềm nhúng, chuyên gia bảo mật phần cứng, lập trình viên ô tô (Automotive Software Engineers).',
    careerApplication: 'Đón đầu làn sóng công nghiệp xe điện và nhà thông minh tại các tập đoàn lớn như VinFast hay Bosch.',
    requirements: [
      'Hiểu kiến thức cơ bản về hệ điều hành Linux và vi điều khiển hoặc phần cứng điện tử',
      'Có niềm đam mê với thiết bị vật lý và xe hơi thông minh'
    ],
    benefits: [
      'Hiểu rõ cấu trúc giao tiếp dữ liệu nội bộ bên trong một chiếc xe hơi hiện đại',
      'Biết cách giải nén và phân tích mã nguồn firmware của các thiết bị camera, router',
      'Nhận diện các lỗ hổng nghiêm trọng có thể đe dọa trực tiếp đến tính mạng con người',
      'Trở thành một trong những chuyên gia bảo mật ô tô và IoT tiên phong tại Việt Nam'
    ],
    techniques: ['Automotive Security', 'CAN Bus', 'IoT Security', 'Firmware Analysis', 'Binwalk', 'Hardware Hacking'],
    documents: [
      'Hướng dẫn thiết lập môi trường giả lập mạng xe hơi ảo (Virtual CAN) trên máy tính',
      'Bảng tra cứu mã định danh gói tin CAN ID thông dụng trên các dòng xe hiện đại'
    ]
  }
]
