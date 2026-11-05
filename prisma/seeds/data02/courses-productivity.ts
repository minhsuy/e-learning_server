import { CourseLevel } from '@prisma/client'
import { CourseBlueprint } from './categories-data'

export const COURSES_PRODUCTIVITY: readonly CourseBlueprint[] = [
  // ==========================================
  // CAT-15: Kỹ năng tin học văn phòng & Năng suất (18 courses)
  // Quota: 6 BEGINNER, 8 INTERMEDIATE, 4 ADVANCED | 2 FREE, 16 PAID
  // ==========================================
  {
    title: 'Thành Thạo Microsoft Word Văn Phòng: Soạn Thảo & Chuẩn Hóa Văn Bản Hành Chính',
    slug: 'thanh-thao-microsoft-word-van-phong-soan-thao-chuan-hoa-van-ban',
    categorySlug: 'tin-hoc-van-phong-va-tu-dong-hoa',
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0,
    leadSummary: 'Soạn thảo văn bản chuẩn Nghị định 30/2020/NĐ-CP: Căn chỉnh lề, định dạng Styles tự động, tạo mục lục tự động, trộn thư (Mail Merge) và bảo mật tài liệu.',
    industryContext: 'Hầu hết nhân viên văn phòng mất hàng giờ chỉnh sửa thủ công từng trang tài liệu; làm chủ Microsoft Word chuẩn quy phạm giúp bạn tạo ra những văn bản hoàn mỹ trong tích tắc.',
    coreTopics: [
      'Quy chuẩn soạn thảo văn bản hành chính Việt Nam: Phông chữ, Cỡ chữ, Khổ giấy và Khoảng cách lề theo Nghị định 30',
      'Định dạng văn bản chuyên nghiệp với hệ thống Styles (Heading 1, 2, 3, Normal): Thay đổi toàn bộ bố cục chỉ trong 1 cú nhấp chuột',
      'Tạo mục lục tự động, danh mục bảng biểu và hình ảnh liên kết động',
      'Kỹ thuật ngắt trang và phân đoạn tài liệu (Section Breaks): Thiết lập đầu trang chân trang (Header & Footer) và khổ giấy ngang/dọc xen kẽ',
      'Tính năng trộn thư Mail Merge: Tự động in hàng trăm hợp đồng lao động, thư mời và giấy khen từ danh sách Excel'
    ],
    handsOnProject: 'Soạn thảo và chuẩn hóa hoàn chỉnh một tập tài liệu Đề án kinh doanh dày 30 trang bao gồm bìa chuẩn, mục lục tự động và bảng biểu được đánh số liên kết.',
    targetAudience: 'Nhân viên văn phòng, Cán bộ hành chính nhân sự, Trợ lý giám đốc, Sinh viên làm khóa luận tốt nghiệp.',
    careerApplication: 'Tạo ra những bộ hồ sơ, tài liệu và hợp đồng có độ chuyên nghiệp cao nhất, nâng cao hình ảnh uy tín của bản thân và công ty.',
    requirements: [
      'Máy tính cài đặt phần mềm Microsoft Word (khuyến nghị từ bản 2016 trở lên)',
      'Kỹ năng gõ bàn phím tiếng Việt cơ bản'
    ],
    benefits: [
      'Soạn thảo văn bản đúng chuẩn thể thức hành chính nhà nước không lo bị bắt lỗi lề lối',
      'Tự động tạo mục lục chính xác đến từng trang chỉ sau 3 giây mà không cần gõ thủ công',
      'In hàng nghìn thư mời hoặc hợp đồng có thông tin cá nhân hóa tự động từ file Excel',
      'Tiết kiệm 80% thời gian chỉnh sửa định dạng khi hoàn thiện các báo cáo dài'
    ],
    techniques: ['Microsoft Word', 'Document Formatting', 'Styles & Headings', 'Table of Contents', 'Mail Merge', 'Section Breaks'],
    documents: [
      'Bảng quy chuẩn thể thức văn bản hành chính theo Nghị định 30/2020/NĐ-CP',
      'Bộ mẫu template hợp đồng, công văn và báo cáo chuẩn mực cho doanh nghiệp'
    ]
  },
  {
    title: 'Google Workspace Cơ Bản: Làm Việc Nhóm Đám Mây Hiệu Quả Với Drive, Docs, Sheets & Forms',
    slug: 'google-workspace-co-ban-lam-viec-nhom-dam-may',
    categorySlug: 'tin-hoc-van-phong-va-tu-dong-hoa',
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0,
    leadSummary: 'Làm việc nhóm thời gian thực không biên giới: Quản lý lưu trữ đám mây Google Drive an toàn, cộng tác chỉnh sửa Docs, Sheets đồng thời và tạo biểu mẫu khảo sát trực tuyến Google Forms.',
    industryContext: 'Hệ sinh thái đám mây Google Workspace là tiêu chuẩn làm việc của các công ty công nghệ và doanh nghiệp hiện đại nhờ tính linh hoạt và khả năng làm việc từ xa mượt mà.',
    coreTopics: [
      'Tổ chức không gian lưu trữ thông minh trên Google Drive: Phân quyền chia sẻ (Viewer, Commenter, Editor) và bảo mật thư mục',
      'Cộng tác thời gian thực trên Google Docs: Tính năng đề xuất chỉnh sửa (Suggesting), Nhận xét (Comments) và Lịch sử phiên bản (Version History)',
      'Google Sheets căn bản: Chia sẻ dữ liệu, Khóa dải ô quan trọng và cộng tác tính toán đồng thời không sợ xung đột',
      'Tạo biểu mẫu khảo sát và thu thập thông tin tự động với Google Forms: Các loại câu hỏi, Điều kiện rẽ nhánh và Xuất dữ liệu sang Sheets',
      'Quản lý lịch làm việc và phòng họp thông minh với Google Calendar và Google Meet'
    ],
    handsOnProject: 'Xây dựng một hệ thống Google Forms khảo sát ý kiến khách hàng tự động lưu dữ liệu vào Google Sheets và chia sẻ báo cáo phân quyền cho các thành viên.',
    targetAudience: 'Nhân sự làm việc từ xa (Remote Worker), Doanh nghiệp chuyển đổi số sang đám mây, Nhóm làm việc cần cộng tác nhanh.',
    careerApplication: 'Tối ưu hóa năng lực làm việc nhóm trong môi trường công sở hiện đại và các tổ chức quốc tế.',
    requirements: [
      'Chỉ cần tài khoản Google (Gmail) miễn phí và trình duyệt web kết nối Internet',
      'Không đòi hỏi cấu hình máy tính mạnh'
    ],
    benefits: [
      'Chấm dứt hoàn toàn tình trạng gửi qua gửi lại hàng chục phiên bản file đính kèm email làm loạn số liệu',
      'Phục hồi lại dữ liệu văn bản đã chỉnh sửa bất kỳ lúc nào nhờ tính năng Version History',
      'Thu thập thông tin khách hàng hoặc ý kiến nhân viên tự động 24/7 một cách khoa học',
      'Làm việc cộng tác mượt mà với đồng nghiệp dù đang ở bất kỳ nơi nào trên thế giới'
    ],
    techniques: ['Google Workspace', 'Google Drive', 'Google Docs', 'Google Sheets', 'Google Forms', 'Cloud Collaboration'],
    documents: [
      'Sổ tay hướng dẫn thiết lập phân quyền và bảo mật dữ liệu trên Google Drive',
      'Mẫu biểu mẫu Google Forms khảo sát độ hài lòng khách hàng chuẩn doanh nghiệp'
    ]
  },
  {
    title: 'Xây Dựng Hệ Thống Quản Lý Tri Thức Cá Nhân & Công Việc Toàn Diện Với Notion',
    slug: 'xay-dung-he-thong-quan-ly-tri-thuc-cong-viec-notion',
    categorySlug: 'tin-hoc-van-phong-va-tu-dong-hoa',
    level: CourseLevel.BEGINNER,
    price: 399000,
    oldPrice: 650000,
    leadSummary: 'Biến Notion thành bộ não thứ hai (Second Brain): Áp dụng phương pháp PARA của Tiago Forte, làm chủ cơ sở dữ liệu quan hệ (Relational Databases) và tự động hóa ghi chú.',
    industryContext: 'Trong thời đại bội thực thông tin, khả năng tổ chức, lưu trữ và trích xuất tri thức nhanh chóng là lợi thế cạnh tranh cá nhân lớn nhất của những người làm việc trí óc.',
    coreTopics: [
      'Phương pháp luận Xây dựng bộ não thứ hai (Building a Second Brain) và mô hình CODE (Capture, Organize, Distill, Express)',
      'Khung tổ chức dữ liệu PARA: Dự án (Projects), Lĩnh vực (Areas), Tài nguyên (Resources) và Kho lưu trữ (Archives)',
      'Làm quen giao diện khối (Block-based) của Notion: Text, Callout, Toggle list, Synced blocks',
      'Làm chủ Notion Databases nâng cao: Thuộc tính (Properties), Các chế độ xem (Table, Board, Calendar, Gallery), Quan hệ (Relation) và Rollup',
      'Tạo bảng điều khiển cuộc sống (Life Dashboard): Quản lý tài chính, Theo dõi thói quen, Mục tiêu năm và Dự án công việc'
    ],
    handsOnProject: 'Xây dựng một không gian làm việc All-in-One trên Notion kết nối quản lý dự án công ty, danh mục tài liệu học tập và nhật ký thói quen cá nhân.',
    targetAudience: 'Sinh viên, Người làm việc tự do (Freelancer), Nhà quản lý, Bất kỳ ai muốn sắp xếp cuộc sống và công việc ngăn nắp, thông minh.',
    careerApplication: 'Gia tăng gấp đôi khả năng ghi nhớ và năng suất xử lý thông tin cá nhân trong mọi lĩnh vực nghề nghiệp.',
    requirements: [
      'Máy tính hoặc máy tính bảng kết nối Internet và tài khoản Notion cá nhân miễn phí',
      'Mong muốn xây dựng phong cách sống và làm việc có tổ chức'
    ],
    benefits: [
      'Không bao giờ bị quên mất một ý tưởng hay hoặc bài học quý giá từng đọc được',
      'Nhìn thấy rõ ràng tiến độ của tất cả các mục tiêu cuộc đời trên một màn hình Dashboard duy nhất',
      'Kết nối thông tin giữa các dự án công việc một cách thông minh mà không bị phân tán',
      'Xây dựng cho bản thân một kho tàng tri thức số cá nhân đồng hành suốt cuộc đời'
    ],
    techniques: ['Notion', 'Second Brain', 'PARA Method', 'Relational Databases', 'Life Dashboard', 'Knowledge Management'],
    documents: [
      'Bộ Template Notion Second Brain hoàn chỉnh có thể nhân bản (Duplicate) vào tài khoản ngay lập tức',
      'Sơ đồ quy trình thu thập và xử lý thông tin hàng ngày theo phương pháp PARA'
    ]
  },
  {
    title: 'Làm Chủ Trình Chiếu Đẳng Cấp Với Canva: Thiết Kế Đồ Họa Nhanh Cho Dân Không Chuyên',
    slug: 'lam-chu-trinh-chieu-dang-cap-canva-do-hoa-nhanh',
    categorySlug: 'tin-hoc-van-phong-va-tu-dong-hoa',
    level: CourseLevel.BEGINNER,
    price: 350000,
    oldPrice: 590000,
    leadSummary: 'Thiết kế mọi thứ chỉ trong vài phút: Làm chủ kho tài nguyên khổng lồ của Canva để tự tay làm slide thuyết trình, poster, CV xin việc, thiệp mời và video ngắn ấn tượng.',
    industryContext: 'Canva đã phổ cập hóa thiết kế đồ họa cho hàng trăm triệu người dùng trên toàn cầu; bạn không cần phải học Photoshop phức tạp để tạo ra những ấn phẩm hình ảnh đẹp mắt.',
    coreTopics: [
      'Làm quen giao diện và công cụ Canva: Khung vẽ, Lưới bố cục, Thư viện thành phần (Elements) và Tải lên tài nguyên cá nhân',
      'Nguyên tắc phối hợp màu sắc và chọn font chữ tiếng Việt không bị lỗi dấu trên Canva',
      'Thiết kế Slide thuyết trình chuyên nghiệp: Sử dụng các bố cục chuẩn, biểu đồ dữ liệu và hiệu ứng hoạt họa mượt mà',
      'Tạo bộ nhận diện cá nhân: Thiết kế bản CV ấn tượng, Danh thiếp, Banner Facebook và Ảnh bìa LinkedIn',
      'Khai thác các tính năng AI thông minh của Canva Magic Studio: Xóa vật thể thừa, Tạo ảnh từ mô tả và Mở rộng khung hình'
    ],
    handsOnProject: 'Thiết kế trọn gói một bộ hồ sơ xin việc chuẩn chuyên nghiệp gồm: CV 1 trang hiện đại, Thư xin việc (Cover Letter) và Bản thuyết trình năng lực cá nhân trên Canva.',
    targetAudience: 'Nhân viên văn phòng, Giáo viên, Sinh viên, Chủ kinh doanh nhỏ tự làm hình ảnh truyền thông.',
    careerApplication: 'Tự tin tự sản xuất nhanh các ấn phẩm truyền thông hình ảnh phục vụ công việc hàng ngày mà không cần phụ thuộc vào Designer.',
    requirements: [
      'Máy tính kết nối Internet để sử dụng phiên bản Canva nền tảng web (miễn phí hoặc Pro)',
      'Không đòi hỏi bất kỳ năng khiếu mỹ thuật hay kỹ năng vẽ nào'
    ],
    benefits: [
      'Tự tay làm ra những bản thuyết trình và áp phích đẹp mắt chỉ trong vòng 15-30 phút',
      'Sở hữu một bản CV xin việc hiện đại, nổi bật thu hút ánh nhìn của nhà tuyển dụng',
      'Sử dụng thành thạo các tính năng AI của Canva để tăng tốc công việc thiết kế',
      'Xuất file dưới nhiều định dạng tối ưu cho in ấn chất lượng cao hoặc chia sẻ trực tuyến'
    ],
    techniques: ['Canva', 'Visual Presentation', 'CV Design', 'Magic Studio AI', 'Typography', 'Social Graphics'],
    documents: [
      'Danh sách 50 bộ Font chữ tiếng Việt đẹp mắt và không bị lỗi dấu trên Canva',
      'Bộ sưu tập các từ khóa tìm kiếm thành phần (Elements Keywords) bí mật trên Canva'
    ]
  },
  {
    title: 'Quản Lý Công Việc & Lịch Trình Làm Việc Thông Minh Với Microsoft Outlook & Teams',
    slug: 'quan-ly-cong-viec-lich-trinh-microsoft-outlook-teams',
    categorySlug: 'tin-hoc-van-phong-va-tu-dong-hoa',
    level: CourseLevel.BEGINNER,
    price: 350000,
    oldPrice: 550000,
    leadSummary: 'Làm chủ trung tâm liên lạc doanh nghiệp: Làm sạch hộp thư đến (Inbox Zero), thiết lập quy tắc lọc thư tự động, đồng bộ lịch họp và cộng tác kênh làm việc trên Microsoft Teams.',
    industryContext: 'Hầu hết các tập đoàn lớn và doanh nghiệp đa quốc gia đều sử dụng bộ giải pháp Microsoft 365; làm chủ Outlook và Teams là kỹ năng sinh tồn thiết yếu trong môi trường công sở lớn.',
    coreTopics: [
      'Phương pháp quản lý hòm thư Inbox Zero: Quy tắc 2 phút và phân loại thư vào các thư mục hành động',
      'Tự động hóa xử lý email trong Outlook: Thiết lập Rules & Alerts, Bước thao tác nhanh (Quick Steps) và Chữ ký số chuyên nghiệp',
      'Lên lịch họp thông minh với Outlook Calendar: Đặt lịch họp định kỳ, Tra cứu thời gian rảnh của đồng nghiệp (Scheduling Assistant)',
      'Giao tiếp hiệu quả trên Microsoft Teams: Kênh làm việc (Channels), Trò chuyện nhóm, Cuộc họp trực tuyến và Chia sẻ màn hình',
      'Tích hợp công việc với Microsoft To-Do và Planner để theo dõi tiến độ nhiệm vụ cá nhân và phòng ban'
    ],
    handsOnProject: 'Thiết lập toàn bộ hệ thống quy tắc lọc thư tự động trong Outlook giúp hòm thư luôn duy trì trạng thái Inbox Zero và tổ chức một buổi họp nhóm chuyên nghiệp trên Teams.',
    targetAudience: 'Nhân viên văn phòng tại các tập đoàn sử dụng Microsoft 365, Quản lý hành chính, Thư ký ban giám đốc.',
    careerApplication: 'Tối ưu hóa thời gian xử lý email hàng ngày, thể hiện phong cách làm việc chuyên nghiệp, chuẩn chỉ.',
    requirements: [
      'Máy tính cài đặt bộ ứng dụng Microsoft Office/365 hoặc tài khoản Outlook công ty',
      'Mong muốn giải quyết tình trạng hòm thư bị ngập trong hàng trăm email chưa đọc'
    ],
    benefits: [
      'Không bao giờ bị sót một email quan trọng của sếp hoặc đối tác giữa hàng ngàn email quảng cáo',
      'Tiết kiệm từ 1 đến 2 giờ mỗi ngày cho việc đọc và xử lý thư điện tử',
      'Lên lịch các cuộc họp công ty chuẩn xác không bị trùng giờ hay xung đột lịch làm việc',
      'Cộng tác nhịp nhàng với hàng trăm đồng nghiệp trên các kênh Teams có tổ chức'
    ],
    techniques: ['Microsoft Outlook', 'Microsoft Teams', 'Inbox Zero', 'Calendar Scheduling', 'Quick Steps', 'Microsoft Planner'],
    documents: [
      'Bảng quy tắc lọc thư mẫu (Outlook Rules Blueprint) phân loại email tự động',
      'Mẫu chữ ký email công sở chuẩn nhận diện thương hiệu doanh nghiệp'
    ]
  },
  {
    title: 'Kỹ Năng Đánh Máy 10 Ngón Siêu Tốc & Sử Dụng Phím Tắt Hệ Thống Trên Windows/macOS',
    slug: 'ky-nang-danh-may-10-ngon-phim-tat-windows-macos',
    categorySlug: 'tin-hoc-van-phong-va-tu-dong-hoa',
    level: CourseLevel.BEGINNER,
    price: 250000,
    oldPrice: 450000,
    leadSummary: 'Nâng cấp tốc độ nhập liệu lên 60-80 từ/phút: Kỹ thuật đặt ngón tay chuẩn trên hàng phím cơ sở, phương pháp gõ không cần nhìn bàn phím (Touch Typing) và 50 phím tắt vàng điều hướng máy tính.',
    industryContext: 'Bàn phím là công cụ giao tiếp chính giữa bạn và máy tính mỗi ngày; tăng gấp đôi tốc độ gõ phím đồng nghĩa với việc bạn tiết kiệm được hàng trăm giờ làm việc mỗi năm.',
    coreTopics: [
      'Giải phẫu bàn phím và vị trí hai phím gờ F và J: Điểm xuất phát của toàn bộ 10 ngón tay',
      'Quy tắc phân công ngón tay chuẩn xác cho từng phím chữ, số và ký tự đặc biệt',
      'Phương pháp gõ chữ không nhìn phím (Touch Typing): Rèn luyện phản xạ ghi nhớ cơ bắp (Muscle Memory)',
      'So sánh và lựa chọn chuẩn gõ tiếng Việt tối ưu tốc độ: Kiểu gõ Telex vs VNI',
      'Bộ 50 phím tắt thần tốc trên hệ điều hành Windows và macOS: Quản lý cửa sổ, Đa nhiệm ảo, Chụp màn hình và Khôi phục thao tác'
    ],
    handsOnProject: 'Thực hiện lộ trình luyện tập 14 ngày trên phần mềm chuyên dụng và vượt qua bài kiểm tra tốc độ gõ 10 ngón đạt tối thiểu 65 từ/phút (WPM) với độ chính xác trên 98%.',
    targetAudience: 'Bất kỳ ai làm việc với máy tính hàng ngày muốn nâng cao tốc độ nhập liệu và thao tác làm việc chuyên nghiệp.',
    careerApplication: 'Tạo dựng tác phong làm việc nhanh nhẹn, tự tin trước đồng nghiệp và đối tác, giải phóng tư duy tập trung vào nội dung thay vì lo tìm phím bấm.',
    requirements: [
      'Máy tính cá nhân có bàn phím vật lý hoạt động bình thường',
      'Sự kiên nhẫn luyện tập 15-20 phút mỗi ngày trong 2 tuần đầu tiên'
    ],
    benefits: [
      'Gõ văn bản với tốc độ ánh sáng mà mắt vẫn có thể tập trung hoàn toàn vào màn hình',
      'Không còn cảm giác mỏi mắt, mỏi cổ do phải liên tục cúi xuống nhìn bàn phím',
      'Thao tác điều hướng trên máy tính mượt mà bằng phím tắt không cần chạm vào con chuột',
      'Gia tăng đáng kể năng suất soạn thảo email, văn bản và trò chuyện công việc'
    ],
    techniques: ['Touch Typing', '10-finger Typing', 'Keyboard Shortcuts', 'Windows Shortcuts', 'macOS Navigation', 'Muscle Memory'],
    documents: [
      'Sơ đồ phân bổ ngón tay trên bàn phím QWERTY chuẩn có thể in màu dán bàn làm việc',
      'Bảng tra cứu song song phím tắt điều hướng trên Windows và macOS'
    ]
  },
  {
    title: 'Phân Tích Dữ Liệu Kinh Doanh Nâng Cao Với Microsoft Power BI Toàn Diện',
    slug: 'phan-tich-du-lieu-kinh-doanh-nang-cao-microsoft-power-bi',
    categorySlug: 'tin-hoc-van-phong-va-tu-dong-hoa',
    level: CourseLevel.INTERMEDIATE,
    price: 790000,
    oldPrice: 1250000,
    leadSummary: 'Biến dữ liệu thô thành những câu chuyện thị giác kinh doanh sắc bén: Làm sạch dữ liệu với Power Query, xây dựng mô hình dữ liệu quan hệ (Star Schema), lập trình ngôn ngữ DAX và tạo Dashboard tương tác.',
    industryContext: 'Power BI của Microsoft là công cụ kinh doanh thông minh (Business Intelligence) dẫn đầu thị trường toàn cầu, kỹ năng Power BI giúp bạn nâng tầm vị thế từ nhân viên văn phòng lên chuyên viên phân tích.',
    coreTopics: [
      'Quy trình phân tích dữ liệu 4 bước trong Power BI: Trích xuất (Get Data), Làm sạch (Transform), Mô hình hóa (Model) và Trực quan hóa (Visualize)',
      'Làm sạch và chuyển đổi dữ liệu chuyên nghiệp với Power Query: Xoay cột (Unpivot), Ghép bảng (Merge & Append) và Xử lý lỗi',
      'Thiết kế mô hình dữ liệu chuẩn: Bảng dữ kiện (Fact Table), Bảng chiều (Dimension Table) và mối quan hệ Star Schema',
      'Lập trình tính toán chỉ số kinh doanh với ngôn ngữ DAX (Data Analysis Expressions): CALCULATE, RELATED, ALL, FILTER và Time Intelligence (So sánh cùng kỳ YoY, MTD, YTD)',
      'Thiết kế bảng điều khiển báo cáo (Interactive Dashboard) có bộ lọc tương tác chéo, điều hướng thông minh và xuất bản lên Power BI Service'
    ],
    handsOnProject: 'Xây dựng một Dashboard phân tích toàn cảnh doanh số và lợi nhuận đa chi nhánh tương tác thời gian thực cho một chuỗi siêu thị bán lẻ.',
    targetAudience: 'Data Analyst, Kế toán viên, Chuyên viên phân tích tài chính, Quản lý kinh doanh muốn xây dựng báo cáo quản trị tự động.',
    careerApplication: 'Trở thành chuyên viên BI (Business Intelligence Specialist) được các tập đoàn lớn săn đón với mức đãi ngộ cao.',
    requirements: [
      'Máy tính cá nhân chạy hệ điều hành Windows để cài đặt phần mềm Power BI Desktop miễn phí',
      'Đã có kiến thức nền tảng về bảng biểu và hàm tính toán trong Excel'
    ],
    benefits: [
      'Tự động hóa hoàn toàn quy trình làm mới báo cáo hàng tháng chỉ bằng một nút bấm Refresh',
      'Nhìn thấy ngay các xu hướng doanh số bất thường và cơ hội thị trường qua các biểu đồ tương tác',
      'Làm chủ hàm CALCULATE quyền năng để tính toán mọi chỉ số nghiệp vụ phức tạp',
      'Tạo ra những Dashboard điều hành đẹp mắt chuẩn quốc tế khiến ban giám đốc ấn tượng sâu sắc'
    ],
    techniques: ['Power BI', 'DAX Formulas', 'Power Query', 'Star Schema', 'Data Modeling', 'Interactive Dashboard'],
    documents: [
      'Sổ tay tra cứu các hàm DAX thông dụng nhất kèm ví dụ thực tế',
      'Bộ tệp dữ liệu bán lẻ mẫu (Sample Retail Datasets) chuẩn hóa phục vụ thực hành'
    ]
  },
  {
    title: 'Tự Động Hóa Tác Vụ Văn Phòng Với Excel VBA & Macro Cho Dân Không Chuyên IT',
    slug: 'tu-dong-hoa-tac-vu-van-phong-excel-vba-macro',
    categorySlug: 'tin-hoc-van-phong-va-tu-dong-hoa',
    level: CourseLevel.INTERMEDIATE,
    price: 650000,
    oldPrice: 990000,
    leadSummary: 'Ủy quyền công việc buồn tẻ cho máy tính tự làm: Ghi Macro tự động, viết mã VBA tùy biến, tự động tổng hợp dữ liệu từ hàng trăm file Excel và xuất báo cáo PDF gửi email hàng loạt.',
    industryContext: 'Hằng ngày có hàng ngàn nhân viên văn phòng phải làm những công việc lặp đi lặp lại như sao chép dữ liệu giữa các file; chỉ cần vài dòng lệnh VBA, bạn có thể hoàn thành công việc của cả ngày trong 10 giây.',
    coreTopics: [
      'Làm quen công cụ lập trình Visual Basic for Applications (VBA) và tính năng ghi Macro tự động (Record Macro)',
      'Cấu trúc lập trình VBA cơ bản: Biến, Kiểu dữ liệu, Cấu trúc rẽ nhánh If...Then...Else và Vòng lặp For...Next, Do...While',
      'Thao tác với các đối tượng trong Excel: Range, Cells, Worksheet, Workbook và xử lý sự kiện (Events)',
      'Tự động gom và gộp dữ liệu từ nhiều tệp Excel trong cùng một thư mục vào một bảng tổng hợp duy nhất',
      'Tự động xuất báo cáo thành tệp PDF và kết nối với Outlook để gửi email đính kèm đến từng khách hàng tương ứng'
    ],
    handsOnProject: 'Viết một chương trình VBA hoàn chỉnh tự động đọc 50 file báo cáo doanh số chi nhánh gửi về, gộp vào bảng tổng hợp và gửi email phản hồi kết quả cho các trưởng chi nhánh.',
    targetAudience: 'Nhân viên kế toán, Hành chính nhân sự, Quản lý kho, Chuyên viên xử lý dữ liệu văn phòng.',
    careerApplication: 'Bứt phá năng suất lao động, trở thành nhân sự vượt trội trong mắt cấp trên nhờ khả năng tự động hóa công việc vượt bậc.',
    requirements: [
      'Thành thạo các thao tác và hàm tính toán thông thường trên Microsoft Excel',
      'Không đòi hỏi kiến thức lập trình chuyên nghiệp trước đó'
    ],
    benefits: [
      'Giải phóng hoàn toàn bản thân khỏi các tác vụ nhàm chán lặp đi lặp lại mỗi ngày',
      'Gộp hàng trăm file báo cáo chi nhánh trong vòng chưa đầy 1 phút với độ chính xác tuyệt đối 100%',
      'Tự tạo ra các nút bấm thần thánh trên bảng tính giúp đồng nghiệp hoàn thành công việc dễ dàng',
      'Tiết kiệm hàng chục giờ làm thêm buổi tối để tận hưởng cuộc sống cá nhân'
    ],
    techniques: ['Excel VBA', 'Macros', 'Automation', 'VBA Loops', 'Outlook Integration', 'Data Consolidation'],
    documents: [
      'Thư viện 30 đoạn mã VBA mẫu (Code Snippets) thông dụng nhất có thể sao chép và dùng ngay',
      'File Excel mẫu thực hành lập trình VBA kèm chú thích giải thích từng dòng lệnh'
    ]
  },
  {
    title: 'Xây Dựng Ứng Dụng Doanh Nghiệp Không Cần Viết Code (No-Code App) Với AppSheet & Glide',
    slug: 'xay-dung-ung-dung-doanh-nghiep-no-code-appsheet-glide',
    categorySlug: 'tin-hoc-van-phong-va-tu-dong-hoa',
    level: CourseLevel.INTERMEDIATE,
    price: 590000,
    oldPrice: 890000,
    leadSummary: 'Biến bảng tính Google Sheets thành ứng dụng di động chuyên nghiệp: Quản lý kho hàng, điểm danh nhân viên, quét mã vạch và phê duyệt đơn từ ngay trên điện thoại.',
    industryContext: 'Kỷ nguyên No-Code cho phép bất kỳ ai không biết lập trình cũng có thể tự tạo ra các phần mềm quản lý nội bộ cho doanh nghiệp trong vài ngày với chi phí gần như bằng 0.',
    coreTopics: [
      'Tổng quan về cuộc cách mạng No-Code và hai nền tảng hàng đầu: Google AppSheet và Glide Apps',
      'Thiết kế cấu trúc bảng dữ liệu nguồn trên Google Sheets chuẩn hóa cho ứng dụng di động',
      'Tạo giao diện người dùng (UX/UI): Chế độ xem biểu mẫu (Form), Danh sách thẻ (Card view), Bản đồ vị trí (Map) và Lịch làm việc',
      'Thiết lập logic nghiệp vụ và hành vi (Actions & Workflows): Gửi email thông báo tự động, Phê duyệt đa cấp',
      'Khai thác cảm biến phần cứng của điện thoại thông minh: Quét mã vạch/QR Code, Chụp ảnh hiện trường và Chữ ký điện tử trên màn hình'
    ],
    handsOnProject: 'Xây dựng một ứng dụng di động hoàn chỉnh quản lý nhập - xuất - tồn kho hàng hóa có tính năng quét mã vạch và chụp ảnh chứng từ bằng điện thoại.',
    targetAudience: 'Chủ doanh nghiệp vừa và nhỏ, Quản lý kho vận, Giám sát thi công công trường, Nhân sự phụ trách số hóa quy trình nội bộ.',
    careerApplication: 'Tự tay giải quyết các bài toán số hóa nghiệp vụ cho công ty mà không cần thuê đội ngũ lập trình viên đắt đỏ.',
    requirements: [
      'Thành thạo việc tổ chức bảng dữ liệu trên Google Sheets hoặc Excel',
      'Có điện thoại thông minh để cài đặt thử nghiệm ứng dụng'
    ],
    benefits: [
      'Tự tay xây dựng xong một ứng dụng di động nghiệp vụ chỉ sau 2-3 ngày học tập',
      'Loại bỏ hoàn toàn việc ghi chép sổ sách giấy tờ dễ thất lạc tại kho hàng và công trường',
      'Nhân viên có thể quét mã vạch sản phẩm và nhập liệu tức thời vào hệ thống ngay tại hiện trường',
      'Tiết kiệm hàng trăm triệu đồng chi phí thuê ngoài phát triển phần mềm di động'
    ],
    techniques: ['No-Code', 'Google AppSheet', 'Glide Apps', 'Google Sheets as DB', 'QR Scanning', 'Workflow Automation'],
    documents: [
      'File Google Sheets mẫu có cấu trúc chuẩn để kết nối trực tiếp vào AppSheet',
      'Sổ tay hướng dẫn cấu hình phân quyền người dùng và bảo mật trên ứng dụng No-Code'
    ]
  },
  {
    title: 'Tự Động Hóa Quy Trình Công Việc Đa Nền Tảng Với Zapier & Make (Integromat)',
    slug: 'tu-dong-hoa-quy-trinh-cong-viec-da-nen-tang-zapier-make',
    categorySlug: 'tin-hoc-van-phong-va-tu-dong-hoa',
    level: CourseLevel.INTERMEDIATE,
    price: 650000,
    oldPrice: 990000,
    leadSummary: 'Kết nối mọi phần mềm bạn đang sử dụng thành một cỗ máy tự động: Đồng bộ dữ liệu giữa Facebook Ads, Google Sheets, Gmail, Slack và CRM mà không cần viết một dòng mã nào.',
    industryContext: 'Doanh nghiệp hiện đại sử dụng trung bình từ 10 đến 20 ứng dụng phần mềm khác nhau; Zapier và Make là chất keo kết dính giúp các ứng dụng tự động trò chuyện và truyền dữ liệu cho nhau.',
    coreTopics: [
      'Bản chất của tự động hóa tích hợp: Mô hình Triggers (Điều kiện kích hoạt), Actions (Hành động) và Webhooks',
      'Xây dựng các kịch bản tự động hóa trên Zapier: Tạo Zaps đơn luồng và đa bước (Multi-step Zaps)',
      'Làm chủ công cụ trực quan mạnh mẽ Make (Integromat): Xử lý luồng rẽ nhánh (Router), Bộ lọc điều kiện và Xử lý mảng dữ liệu (Iterators & Aggregators)',
      'Tự động hóa tiếp thị và bán hàng: Khi có khách hàng điền biểu mẫu Facebook Ads -> Tự động ghi vào Sheets -> Gửi email chào mừng -> Nhắn tin báo số điện thoại cho Sale qua Telegram/Zalo',
      'Xử lý lỗi tự động hóa và thiết lập cơ chế chạy lại (Error Handling & Retry Logic)'
    ],
    handsOnProject: 'Xây dựng một kịch bản tự động hóa toàn diện trên Make kết nối giữa Google Forms, Trello, Google Calendar và gửi tin nhắn cảnh báo tức thì vào nhóm chat Slack.',
    targetAudience: 'Growth Marketer, Quản lý vận hành, Nhà sáng lập kinh doanh online, Nhân sự phụ trách tối ưu hóa quy trình làm việc.',
    careerApplication: 'Trở thành chuyên gia tự động hóa quy trình (Automation Specialist) giúp các doanh nghiệp tinh gọn bộ máy vận hành.',
    requirements: [
      'Có tài khoản sử dụng các công cụ phần mềm văn phòng cơ bản (Google Workspace, Trello, Slack)',
      'Tư duy logic theo nguyên tắc Nếu Điều Này Xảy Ra Thì Làm Điều Kia (IFTTT)'
    ],
    benefits: [
      'Xóa bỏ hoàn toàn việc nhân viên phải sao chép dữ liệu bằng tay từ ứng dụng này sang ứng dụng khác',
      'Tốc độ phản hồi khách hàng tiềm năng diễn ra tức thì trong vài giây thay vì phải chờ đợi nhiều giờ',
      'Xây dựng những cỗ máy vận hành kinh doanh tự động chạy bền bỉ 24/7/365',
      'Tối ưu hóa năng suất của toàn bộ tổ chức mà không cần tuyển thêm nhân sự hành chính'
    ],
    techniques: ['Zapier', 'Make (Integromat)', 'No-Code Automation', 'Webhooks', 'API Integration', 'Data Routing'],
    documents: [
      'Sơ đồ 10 kịch bản tự động hóa kinh điển nhất dành cho mọi doanh nghiệp vừa và nhỏ',
      'Bảng so sánh chi tiết tính năng và chi phí giữa Zapier, Make và n8n'
    ]
  },
  {
    title: 'Làm Chủ Nền Tảng Cơ Sở Dữ Liệu No-Code Airtable Cho Quản Lý Dự Án & Vận Hành',
    slug: 'lam-chu-co-so-du-lieu-no-code-airtable-quan-ly-van-hanh',
    categorySlug: 'tin-hoc-van-phong-va-tu-dong-hoa',
    level: CourseLevel.INTERMEDIATE,
    price: 550000,
    oldPrice: 850000,
    leadSummary: 'Vượt xa giới hạn của bảng tính Excel truyền thống: Khám phá sức mạnh của cơ sở dữ liệu quan hệ kết hợp giao diện bảng tính mượt mà trên Airtable, tạo tự động hóa và bảng điều khiển trực quan.',
    industryContext: 'Airtable được mệnh danh là bảng tính thế hệ mới kết hợp sức mạnh của cơ sở dữ liệu thực thụ; nó đang trở thành công cụ vận hành cốt lõi của các agency sáng tạo và startup công nghệ.',
    coreTopics: [
      'Sự khác biệt căn bản giữa Bảng tính (Spreadsheet) và Cơ sở dữ liệu quan hệ (Relational Database)',
      'Các kiểu dữ liệu chuyên sâu trong Airtable: Single line, Multi-select, Attachment, Linked Records và Lookup/Rollup',
      'Thiết lập các góc nhìn đa dạng (Views): Grid, Kanban, Calendar, Gallery và Timeline Gantt',
      'Tạo lập các luồng tự động hóa tích hợp sẵn (Airtable Automations) không cần phần mềm trung gian',
      'Xây dựng giao diện tương tác tùy chỉnh (Airtable Interfaces) dành riêng cho từng vai trò người dùng trong công ty'
    ],
    handsOnProject: 'Xây dựng một hệ thống cơ sở dữ liệu quản trị toàn diện cho một Agency truyền thông gồm phân hệ Quản lý khách hàng (CRM), Quản lý dự án và Theo dõi ngân sách trên Airtable.',
    targetAudience: 'Agency Manager, Quản lý sản xuất nội dung, Trưởng nhóm dự án, Điều phối viên sản xuất.',
    careerApplication: 'Tổ chức hệ thống quản trị dữ liệu linh hoạt, khoa học cho các doanh nghiệp dịch vụ và sáng tạo.',
    requirements: [
      'Đã có kiến thức cơ bản về lập bảng biểu trên Excel hoặc Google Sheets',
      'Tư duy liên kết dữ liệu giữa các thực thể'
    ],
    benefits: [
      'Liên kết thông tin giữa các bảng dữ liệu mượt mà mà không cần dùng đến các hàm VLOOKUP phức tạp',
      'Đính kèm trực tiếp hình ảnh, tệp hợp đồng PDF vào từng dòng dữ liệu rõ ràng',
      'Tự động gửi email thông báo khi trạng thái dự án được chuyển sang giai đoạn mới',
      'Tạo ra các giao diện bảng điều khiển đẹp mắt cho từng thành viên mà không để lộ các dữ liệu nhạy cảm'
    ],
    techniques: ['Airtable', 'Relational DB', 'Linked Records', 'Airtable Automations', 'Airtable Interfaces', 'CRM Systems'],
    documents: [
      'Bộ Template Airtable Base quản trị dự án Agency hoàn chỉnh có thể nhân bản sử dụng ngay',
      'Hướng dẫn cấu hình các công thức tính toán và hàm Rollup nâng cao trong Airtable'
    ]
  },
  {
    title: 'Quản Lý Dữ Liệu Khách Hàng Chuyên Nghiệp Với Nền Tảng Lark Suite (Lark Base)',
    slug: 'quan-ly-du-lieu-khach-hang-chuyen-nghiep-lark-suite-lark-base',
    categorySlug: 'tin-hoc-van-phong-va-tu-dong-hoa',
    level: CourseLevel.INTERMEDIATE,
    price: 490000,
    oldPrice: 790000,
    leadSummary: 'Làm chủ nền tảng làm việc tất cả trong một đang thống trị các doanh nghiệp châu Á: Tận dụng Lark Base để quản trị quan hệ khách hàng (CRM), phê duyệt quy trình và họp trực tuyến mượt mà.',
    industryContext: 'Lark Suite do ByteDance phát triển đang nhanh chóng thay thế các bộ phần mềm văn phòng rời rạc nhờ sự kết hợp hoàn hảo giữa Chat, Docs, Base, Calendar và Video Call trong một ứng dụng duy nhất.',
    coreTopics: [
      'Kiến trúc siêu ứng dụng của Lark Suite: Tại sao các công ty tăng trưởng nhanh lại chuyển dịch sang Lark',
      'Làm chủ Lark Base: Thiết kế bảng cơ sở dữ liệu nhiều chiều, Liên kết bản ghi và Tính toán tổng hợp',
      'Thiết kế quy trình phê duyệt điện tử (Approval Flow): Đơn xin nghỉ phép, Tạm ứng công tác phí và Đề xuất mua sắm',
      'Tự động hóa thông báo nghiệp vụ trực tiếp vào các nhóm chat công việc qua Lark Bot',
      'Tài liệu hóa quy trình công ty trên Lark Wiki và tổ chức cuộc họp không giấy tờ theo phương pháp Silent Meeting'
    ],
    handsOnProject: 'Xây dựng một hệ thống CRM quản lý khách hàng và quy trình phê duyệt hợp đồng tự động trên Lark Base kết nối trực tiếp với nhóm chat bán hàng.',
    targetAudience: 'Doanh nhân khởi nghiệp, Trưởng phòng kinh doanh, Quản lý nhân sự, Doanh nghiệp muốn tinh gọn công cụ làm việc.',
    careerApplication: 'Dẫn dắt quy trình triển khai nền tảng cộng tác số Lark Suite cho các tổ chức và doanh nghiệp thế hệ mới.',
    requirements: [
      'Tài khoản Lark cá nhân hoặc tài khoản doanh nghiệp miễn phí',
      'Sẵn sàng làm quen với phong cách làm việc cộng tác hiện đại'
    ],
    benefits: [
      'Tập trung toàn bộ hoạt động trao đổi công việc, dữ liệu và lịch họp về một ứng dụng duy nhất trên điện thoại và máy tính',
      'Xóa bỏ hoàn toàn quy trình ký duyệt giấy tờ rườm rà, phê duyệt mọi đơn từ chỉ sau một cú chạm',
      'Tự động gửi thông báo chúc mừng sinh nhật khách hàng và nhắc việc cho nhân viên qua chatbot',
      'Tổ chức các cuộc họp ngắn gọn, hiệu quả cao theo phong cách đọc tài liệu im lặng (Silent Meeting)'
    ],
    techniques: ['Lark Suite', 'Lark Base', 'Lark Approval', 'Lark Bot Automation', 'Silent Meetings', 'Enterprise Wiki'],
    documents: [
      'Bản kế hoạch triển khai và chuyển đổi dữ liệu sang Lark Suite cho doanh nghiệp trong 7 ngày',
      'Bộ mẫu các quy trình phê duyệt hành chính nhân sự chuẩn mực trên Lark'
    ]
  },
  {
    title: 'Tự Động Hóa Quy Trình Bằng Robot Ảo (Robotic Process Automation - RPA) Với UiPath',
    slug: 'tu-dong-hoa-quy-trinh-robot-ao-rpa-uipath',
    categorySlug: 'tin-hoc-van-phong-va-tu-dong-hoa',
    level: CourseLevel.ADVANCED,
    price: 990000,
    oldPrice: 1590000,
    leadSummary: 'Tạo ra những nhân viên ảo làm việc không biết mệt mỏi: Làm chủ nền tảng RPA số một thế giới UiPath, tự động hóa thao tác chuột bàn phím, trích xuất dữ liệu hóa đơn và đồng bộ phần mềm kế toán cũ.',
    industryContext: 'Nhiều doanh nghiệp vẫn đang sử dụng các phần mềm kế toán cổ điển không có cổng kết nối API; robot ảo RPA là giải pháp hoàn hảo để tự động hóa thao tác nhập liệu mà không cần sửa đổi hệ thống cũ.',
    coreTopics: [
      'Bản chất của công nghệ RPA: Mô phỏng hành vi của con người trên giao diện đồ họa (UI Automation)',
      'Giao diện phát triển UiPath Studio: Hoạt động (Activities), Biến (Variables), Đối số (Arguments) và Luồng điều khiển',
      'Kỹ thuật nhận diện phần tử giao diện (Selectors): Tinh chỉnh Full Selectors, Fuzzy Selectors để robot hoạt động ổn định',
      'Tự động hóa tác vụ Excel, Email và trích xuất dữ liệu hóa đơn điện tử (PDF Invoice Scraping)',
      'Xây dựng Robot có người giám sát (Attended Robot) và Robot chạy ngầm độc lập (Unattended Robot) tuân thủ khung chuẩn ReFramework'
    ],
    handsOnProject: 'Xây dựng một con robot UiPath tự động tải hóa đơn PDF từ email khách hàng, đọc mã số thuế và số tiền, rồi tự động nhập vào phần mềm kế toán máy bàn.',
    targetAudience: 'RPA Developer mới vào nghề, Kế toán viên có tư duy công nghệ, Kỹ sư tối ưu quy trình doanh nghiệp.',
    careerApplication: 'Gia nhập thị trường tuyển dụng kỹ sư RPA đang rất khan hiếm nhân lực tại các ngân hàng và tập đoàn tài chính.',
    requirements: [
      'Máy tính cá nhân chạy Windows có cấu hình khá để cài đặt UiPath Studio Community (miễn phí)',
      'Tư duy phân tích quy trình chi tiết từng bước'
    ],
    benefits: [
      'Xây dựng các robot phần mềm thay thế hoàn toàn con người thực hiện các tác vụ nhập liệu hàng đêm',
      'Loại bỏ 100% các sai sót gõ nhầm số liệu trong các báo cáo tài chính quan trọng',
      'Kết nối thông suốt giữa các hệ thống phần mềm cũ kỹ với các công nghệ đám mây hiện đại',
      'Định giá dịch vụ phát triển robot tự động hóa với mức thù lao dự án hấp dẫn'
    ],
    techniques: ['RPA', 'UiPath Studio', 'UI Selectors', 'Invoice Scraping', 'ReFramework', 'Process Automation'],
    documents: [
      'Sách hướng dẫn tối ưu hóa UI Selectors để robot không bị lỗi khi giao diện phần mềm thay đổi',
      'Dự án mã nguồn UiPath mẫu tự động xử lý hóa đơn điện tử và gửi email'
    ]
  },
  {
    title: 'Phát Triển Trợ Lý Tự Động Hóa Văn Phòng Với Microsoft Power Automate',
    slug: 'phat-trien-tro-ly-tu-dong-hoa-microsoft-power-automate',
    categorySlug: 'tin-hoc-van-phong-va-tu-dong-hoa',
    level: CourseLevel.ADVANCED,
    price: 890000,
    oldPrice: 1450000,
    leadSummary: 'Làm chủ công cụ tự động hóa bản quyền trong hệ sinh thái Microsoft 365: Xây dựng Cloud Flows tự động hóa luồng tài liệu và Desktop Flows (RPA) điều khiển ứng dụng máy bàn.',
    industryContext: 'Được tích hợp sẵn trong hệ sinh thái Windows và Microsoft 365, Power Automate là lựa chọn tự động hóa hàng đầu được các tập đoàn Fortune 500 tin cậy triển khai.',
    coreTopics: [
      'Kiến trúc của Microsoft Power Platform: Power Automate Cloud Flows vs Power Automate Desktop (PAD)',
      'Tạo các luồng đám mây tự động: Luồng theo lịch trình (Scheduled), Luồng tự động khi có sự kiện (Automated) và Luồng kích hoạt thủ công (Instant)',
      'Xây dựng quy trình phê duyệt đa cấp (Approval Workflows) gửi thông báo phê duyệt trực tiếp trên Microsoft Teams và Email',
      'Tự động hóa ứng dụng máy bàn với Power Automate Desktop: Ghi lại thao tác (Desktop Recorder), Trích xuất bảng dữ liệu từ ứng dụng cũ',
      'Tích hợp trí tuệ nhân tạo AI Builder: Nhận diện chữ viết tay, Phân loại văn bản và Trích xuất thông tin danh thiếp tự động'
    ],
    handsOnProject: 'Xây dựng quy trình tự động hóa tiếp nhận hồ sơ thanh toán: Đọc tệp đính kèm trong email, gửi yêu cầu phê duyệt cho trưởng phòng trên Teams, và lưu trữ vào thư viện SharePoint.',
    targetAudience: 'Chuyên viên quản trị hệ thống Microsoft 365, Nhân viên văn phòng nâng cao, Chuyên viên phân tích nghiệp vụ.',
    careerApplication: 'Trở thành Power Platform Specialist dẫn đầu phong trào phát triển ứng dụng nội bộ (Citizen Developer) trong doanh nghiệp.',
    requirements: [
      'Máy tính cá nhân sử dụng Windows 10/11 có cài đặt Power Automate Desktop',
      'Tài khoản Microsoft cá nhân hoặc tài khoản trường học/doanh nghiệp'
    ],
    benefits: [
      'Tận dụng tối đa bản quyền Microsoft 365 có sẵn của công ty mà không phát sinh thêm chi phí phần mềm bên ngoài',
      'Tự động lưu trữ các tệp đính kèm email quan trọng vào đúng thư mục SharePoint có tổ chức',
      'Rút ngắn thời gian xét duyệt các thủ tục hành chính từ vài ngày xuống còn vài phút',
      'Ứng dụng các mô hình AI có sẵn để xử lý hồ sơ tài liệu giấy tờ thông minh'
    ],
    techniques: ['Power Automate', 'Cloud Flows', 'Desktop Flows (PAD)', 'Teams Approvals', 'AI Builder', 'SharePoint Integration'],
    documents: [
      'Tuyển tập 25 mẫu luồng tự động hóa Power Automate ứng dụng ngay cho khối văn phòng',
      'Hướng dẫn cấu hình bảo mật dữ liệu (Data Loss Prevention - DLP) cho các luồng tự động'
    ]
  },
  {
    title: 'Lập Trình Tự Động Hóa Bằng Google Apps Script (GAS) Cho Hệ Sinh Thái Google',
    slug: 'lap-trinh-tu-dong-hoa-google-apps-script-gas',
    categorySlug: 'tin-hoc-van-phong-va-tu-dong-hoa',
    level: CourseLevel.ADVANCED,
    price: 790000,
    oldPrice: 1250000,
    leadSummary: 'Khai phóng toàn bộ sức mạnh tiềm ẩn của Google Workspace: Lập trình bằng ngôn ngữ JavaScript hiện đại để mở rộng tính năng Sheets, gửi email tự động và tạo menu tùy chỉnh.',
    industryContext: 'Nếu như Excel có VBA thì Google Workspace có Google Apps Script chạy trực tiếp trên nền tảng đám mây của Google; đây là công cụ tối thượng để xây dựng các giải pháp tự động hóa miễn phí.',
    coreTopics: [
      'Môi trường phát triển Google Apps Script: Trình chỉnh sửa trên web, Ngôn ngữ JavaScript nền tảng (ES6+)',
      'Thao tác với dịch vụ SpreadsheetApp: Đọc và ghi dữ liệu hàng loạt vào Google Sheets tối ưu tốc độ thực thi',
      'Tự động gửi email cá nhân hóa với dịch vụ MailApp và GmailApp: Soạn thảo email bằng mã HTML đẹp mắt kèm tệp đính kèm',
      'Thiết lập các trình kích hoạt tự động (Triggers): Kích hoạt theo thời gian (Time-driven) và kích hoạt khi có người chỉnh sửa (On edit / On form submit)',
      'Tạo menu tùy chỉnh và hộp thoại giao diện người dùng (Custom Dialogs) trực tiếp trong Google Docs/Sheets'
    ],
    handsOnProject: 'Viết một chương trình Apps Script hoàn chỉnh tự động tạo chứng chỉ tốt nghiệp dạng PDF từ Google Slides dựa trên danh sách học viên trong Google Sheets và gửi email tự động cho từng người.',
    targetAudience: 'Người sử dụng Google Sheets nâng cao, Lập trình viên muốn xây dựng tiện ích mở rộng (Add-ons) cho Google Workspace, Quản lý văn phòng.',
    careerApplication: 'Tự tay xây dựng các công cụ phần mềm nội bộ chạy trên nền tảng đám mây Google hoàn toàn miễn phí, không tốn tiền thuê máy chủ.',
    requirements: [
      'Hiểu biết cơ bản về cấu trúc bảng tính Google Sheets',
      'Biết lập trình JavaScript cơ bản là một lợi thế (khóa học hướng dẫn chi tiết từ đầu)'
    ],
    benefits: [
      'Tự động hóa việc tạo và gửi hàng trăm chứng chỉ hoặc thư xác nhận PDF chỉ sau một cú nhấp chuột',
      'Chương trình chạy hoàn toàn trên máy chủ của Google 24/7 mà bạn không cần phải mở máy tính cá nhân',
      'Tự tạo ra các hàm tính toán tùy chỉnh (Custom Functions) giải quyết những bài toán mà các hàm có sẵn không làm được',
      'Kết nối thông suốt Google Sheets với các dịch vụ bên ngoài qua các cuộc gọi API RESTful'
    ],
    techniques: ['Google Apps Script', 'JavaScript ES6', 'SpreadsheetApp', 'Triggers', 'PDF Generation', 'Gmail Automation'],
    documents: [
      'Bộ mã nguồn mẫu 20 hàm tùy chỉnh Google Apps Script thông dụng nhất',
      'Hướng dẫn đóng gói và xuất bản tiện ích bổ sung Google Workspace Add-on'
    ]
  },
  {
    title: 'Xây Dựng Báo Cáo Tài Chính & Bảng Điều Khiển Động Đỉnh Cao Trên Excel (Advanced Excel Dashboard)',
    slug: 'xay-dung-bao-cao-tai-chinh-bang-dieu-khien-dong-excel-dashboard',
    categorySlug: 'tin-hoc-van-phong-va-tu-dong-hoa',
    level: CourseLevel.ADVANCED,
    price: 750000,
    oldPrice: 1190000,
    leadSummary: 'Biến bảng tính Excel khô khan thành tác phẩm trực quan hóa dữ liệu đỉnh cao: Làm chủ các hàm mảng động (Dynamic Arrays), thanh trượt chọn thời gian (Slicers) và biểu đồ tương tác cao cấp.',
    industryContext: 'Nhiều nhà lãnh đạo vẫn thích xem báo cáo trên Excel hơn bất kỳ phần mềm nào khác; khả năng tạo ra một Dashboard Excel vừa đẹp mắt vừa tự động tương tác là vũ khí bí mật giúp bạn nổi bật.',
    coreTopics: [
      'Bộ hàm mảng động thế hệ mới của Microsoft 365: FILTER, SORT, SORTBY, UNIQUE, SEQUENCE và XLOOKUP',
      'Nguyên lý thiết kế giao diện báo cáo chuyên nghiệp: Phối hợp màu sắc, Bố cục phân khu thông tin và Sử dụng biểu tượng KPI trực quan',
      'Kết nối nhiều Pivot Table với thanh trượt Slicers và Timeline để tạo bộ lọc thời gian tương tác đồng bộ',
      'Thiết kế các biểu đồ nâng cao: Biểu đồ hình thác nước (Waterfall Chart), Biểu đồ nhiệt (Heatmap) và Biểu đồ đo lường tốc độ (Gauge Chart)',
      'Tối ưu hóa dung lượng file và khóa bảo vệ cấu trúc bảng tính an toàn trước khi chuyển giao cho người dùng cuối'
    ],
    handsOnProject: 'Thiết kế trọn vẹn một Bảng điều khiển hiệu suất kinh doanh (Executive Sales Dashboard) tương tác linh hoạt trên một trang màn hình Excel duy nhất không cần cuộn trang.',
    targetAudience: 'Chuyên viên phân tích dữ liệu, Kế toán trưởng, Quản lý kinh doanh, Bất kỳ ai thường xuyên phải báo cáo số liệu trước ban giám đốc.',
    careerApplication: 'Tạo dựng dấu ấn cá nhân chuyên nghiệp đỉnh cao với các bản báo cáo trực quan, sắc sảo khiến mọi người thán phục.',
    requirements: [
      'Máy tính cài đặt phiên bản Microsoft Excel 2021 hoặc Microsoft 365 để sử dụng các hàm mảng động',
      'Nắm vững cách sử dụng các hàm điều kiện và Pivot Table cơ bản'
    ],
    benefits: [
      'Làm chủ các hàm mảng động giúp trích xuất và lọc danh sách tự động mà không cần viết công thức cho từng ô',
      'Trình bày toàn bộ tình hình kinh doanh của công ty trên một màn hình trực quan duy nhất',
      'Ban giám đốc có thể tự do bấm chọn tháng, quý hoặc nhân viên để xem số liệu thay đổi tức thì',
      'Nâng tầm báo cáo nội bộ của công ty lên tiêu chuẩn quốc tế đẹp mắt và sắc nét'
    ],
    techniques: ['Advanced Excel', 'Dynamic Arrays', 'Excel Dashboard', 'FILTER & UNIQUE', 'Slicers & Timelines', 'Data Visualization'],
    documents: [
      'Bộ sưu tập 5 mẫu Dashboard Excel chuyên nghiệp đa ngành nghề (Tài chính, Bán hàng, Nhân sự)',
      'Bảng quy chuẩn phối màu và kiểu biểu đồ tương ứng cho từng loại dữ liệu kinh doanh'
    ]
  },
  {
    title: 'Xây Dựng Báo Cáo & Dashboard Tự Động Hóa Với Google Looker Studio',
    slug: 'xay-dung-bao-cao-dashboard-tu-dong-hoa-google-looker-studio',
    categorySlug: 'tin-hoc-van-phong-va-tu-dong-hoa',
    level: CourseLevel.INTERMEDIATE,
    price: 490000,
    oldPrice: 790000,
    leadSummary: 'Biến dữ liệu đám mây thành bảng điều khiển trực quan tương tác hoàn toàn miễn phí: Kết nối Google Sheets, BigQuery, Google Analytics và thiết kế báo cáo quản trị tự động cập nhật.',
    industryContext: 'Google Looker Studio là giải pháp Business Intelligence nền tảng web mạnh mẽ, miễn phí 100%, lý tưởng cho các doanh nghiệp vừa và nhỏ muốn xây dựng hệ thống báo cáo số hóa tự động.',
    coreTopics: [
      'Tổng quan hệ sinh thái Google Looker Studio: Nguồn dữ liệu (Data Sources), Trường tính toán (Calculated Fields) và Trang báo cáo',
      'Kết nối trực tiếp dữ liệu từ Google Sheets, CSV, PostgreSQL và các công cụ tiếp thị trực tuyến',
      'Thiết kế biểu đồ đa dạng: Bảng tổng hợp số liệu, Biểu đồ chuỗi thời gian, Biểu đồ nhiệt bản đồ địa lý và Thẻ chỉ số KPI (Scorecards)',
      'Tạo bộ điều khiển tương tác (Controls): Bộ chọn khoảng ngày, Bộ lọc thả xuống (Dropdown filter) và Bộ lọc phạm vi giá trị',
      'Chia sẻ và phân quyền an toàn: Đặt lịch tự động gửi báo cáo định kỳ dạng PDF qua email cho ban giám đốc'
    ],
    handsOnProject: 'Xây dựng một Dashboard báo cáo hiệu suất kinh doanh tổng hợp 5 trang trên Google Looker Studio kết nối tự động với Google Sheets và đặt lịch gửi email mỗi sáng thứ Hai.',
    targetAudience: 'Nhân viên văn phòng, Quản lý kinh doanh, Marketer, Người muốn tự động hóa việc làm báo cáo định kỳ.',
    careerApplication: 'Tối ưu hóa thời gian làm báo cáo hàng tuần, nâng cao năng lực trực quan hóa dữ liệu trong mắt lãnh đạo.',
    requirements: [
      'Chỉ cần tài khoản Google (Gmail) miễn phí và trình duyệt web',
      'Hiểu biết cơ bản về cấu trúc bảng dữ liệu cột và dòng'
    ],
    benefits: [
      'Tự động cập nhật số liệu thời gian thực mà không cần làm mới hay sao chép dữ liệu thủ công',
      'Thiết kế các biểu đồ đẹp mắt, tương tác mượt mà chia sẻ qua liên kết web bảo mật',
      'Tiết kiệm chi phí bản quyền phần mềm phân tích đắt đỏ cho công ty',
      'Lập lịch gửi báo cáo tự động đến hòm thư sếp đúng giờ mà không cần can thiệp'
    ],
    techniques: ['Google Looker Studio', 'Data Visualization', 'Calculated Fields', 'Interactive Controls', 'Dashboard Design', 'Automated Email Reports'],
    documents: [
      'Bộ 3 mẫu Dashboard Looker Studio chuyên nghiệp chuẩn nhận diện doanh nghiệp',
      'File dữ liệu Google Sheets mẫu chuẩn hóa phục vụ việc kết nối và thực hành'
    ]
  },
  {
    title: 'Ứng Dụng Generative AI (ChatGPT & Claude) Tăng Tốc Xử Lý Công Việc Văn Phòng Gấp 5 Lần',
    slug: 'ung-dung-generative-ai-chatgpt-claude-tang-toc-van-phong',
    categorySlug: 'tin-hoc-van-phong-va-tu-dong-hoa',
    level: CourseLevel.INTERMEDIATE,
    price: 450000,
    oldPrice: 750000,
    leadSummary: 'Làm việc thông minh cùng trí tuệ nhân tạo: Thiết kế Prompt chuyên sâu cho soạn thảo công văn, tóm tắt báo cáo hàng trăm trang, viết công thức Excel phức tạp và tự động hóa email.',
    industryContext: 'AI không cướp đi công việc của bạn, nhưng người biết sử dụng AI thành thạo sẽ làm thay phần việc của 3 nhân viên văn phòng truyền thống trong một nửa thời gian.',
    coreTopics: [
      'Nguyên lý hoạt động của các mô hình ngôn ngữ lớn (LLM): Hiểu đúng năng lực và giới hạn ảo giác (Hallucination)',
      'Khung thiết kế câu lệnh hoàn hảo (Prompt Engineering Framework): Vai trò (Role), Bối cảnh (Context), Hướng dẫn chi tiết (Instructions) và Định dạng đầu ra (Output Format)',
      'Tự động hóa xử lý văn bản: Tóm tắt biên bản cuộc họp, Rà soát lỗi ngữ pháp, Viết lại nội dung theo các giọng điệu khác nhau',
      'Trợ lý bảng tính siêu việt: Yêu cầu AI viết các công thức Excel/Sheets lồng nhau phức tạp và mã macro VBA chỉ bằng ngôn ngữ tự nhiên',
      'Xử lý và phân tích tệp tài liệu PDF/Excel dung lượng lớn bằng tính năng Advanced Data Analysis của ChatGPT và Claude Projects'
    ],
    handsOnProject: 'Xây dựng một bộ thư viện 20 câu lệnh Prompt cá nhân hóa cho các tác vụ hàng ngày của công việc bạn và sử dụng AI soạn thảo một bản Đề xuất dự án 5 trang trong 20 phút.',
    targetAudience: 'Nhân viên văn phòng, Trợ lý, Quản trị viên hành chính, Bất kỳ ai muốn nâng cao năng suất công việc văn phòng bằng AI.',
    careerApplication: 'Trở thành nhân sự thế hệ mới có năng suất lao động đột phá, dẫn đầu phong trào ứng dụng AI tại nơi làm việc.',
    requirements: [
      'Máy tính kết nối Internet và tài khoản ChatGPT hoặc Claude (miễn phí hoặc Plus)',
      'Tư duy cởi mở và mong muốn làm việc thông minh hơn'
    ],
    benefits: [
      'Soạn thảo các email đối tác và thông báo nội bộ chỉ trong 30 giây với câu từ chuẩn mực',
      'Không còn phải đau đầu nhớ tên hay cú pháp của các hàm Excel phức tạp',
      'Đọc và nắm bắt nội dung cốt lõi của các tập tài liệu dài hàng chục trang trong vài phút',
      'Giải phóng thời gian làm việc để tập trung vào các nhiệm vụ chiến lược có giá trị cao'
    ],
    techniques: ['Generative AI', 'ChatGPT', 'Claude AI', 'Prompt Engineering', 'AI for Office', 'Excel Formula Generation'],
    documents: [
      'Bộ sưu tập 50 câu lệnh Prompt vàng chuyên dụng cho mọi tác vụ hành chính văn phòng',
      'Sổ tay hướng dẫn bảo mật dữ liệu công ty và tránh rò rỉ thông tin nội bộ khi dùng AI'
    ]
  },

  // ==========================================
  // CAT-16: Phát triển bản thân & Kỹ năng mềm (18 courses)
  // Quota: 6 BEGINNER, 8 INTERMEDIATE, 4 ADVANCED | 2 FREE, 16 PAID
  // ==========================================
  {
    title: 'Thuyết Trình Trước Đám Đông & Nói Chuyện Tự Tin Trước Ống Kính',
    slug: 'thuyet-trinh-truoc-dam-dong-noi-chuyen-tu-tin-ong-kinh',
    categorySlug: 'phat-trien-ban-than-va-ky-nang-mem',
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0,
    leadSummary: 'Vượt qua nỗi sợ hãi sân khấu: Kỹ thuật kiểm soát hơi thở bụng, làm chủ giọng nói (Tốc độ, Cao độ, Điểm dừng), ngôn ngữ cơ thể cuốn hút và mở đầu bài nói ấn tượng.',
    industryContext: 'Nỗi sợ nói trước công chúng là nỗi sợ phổ biến nhất của con người; nhưng khả năng diễn đạt ý tưởng tự tin và truyền cảm hứng lại là chìa khóa mở toang mọi cánh cửa thăng tiến.',
    coreTopics: [
      'Giải mã tâm lý học của sự lo âu khi thuyết trình và kỹ thuật hít thở sâu làm dịu hệ thần kinh trong 60 giây',
      'Khai phóng nội lực giọng nói: Luyện tập phát âm từ bụng, Điều chỉnh tốc độ (Pacing), Nhấn nhá trọng âm và Nghệ thuật của khoảng lặng (The Power of Pauses)',
      'Làm chủ ngôn ngữ cơ thể: Ánh mắt kết nối (Eye Contact), Nụ cười, Tư thế đứng đĩnh đạc và Cử chỉ tay tự nhiên',
      'Cấu trúc bài thuyết trình kinh điển theo mô hình 3 phần: Mở đầu gây sốc, Thân bài 3 luận điểm cốt lõi và Kết bài kêu gọi hành động lay động',
      'Kỹ thuật nói chuyện tự nhiên trước ống kính máy quay khi quay video hoặc họp trực tuyến Zoom/Teams'
    ],
    handsOnProject: 'Thực hành quay một video thuyết trình 3 phút chia sẻ về một chủ đề bạn đam mê, áp dụng đầy đủ các kỹ thuật ánh mắt, cử chỉ tay và nhấn nhá giọng nói.',
    targetAudience: 'Người hay bị run sợ khi đứng trước đám đông, Sinh viên chuẩn bị bảo vệ đồ án, Quản lý nhóm cần điều hành cuộc họp.',
    careerApplication: 'Tự tin làm chủ mọi sân khấu, gây ấn tượng sâu sắc trong các buổi phỏng vấn, báo cáo công việc và gọi vốn.',
    requirements: [
      'Điện thoại có camera để tự quay lại bài nói của bản thân và tự đánh giá',
      'Sẵn sàng bước ra khỏi vùng an toàn để luyện tập thực tế'
    ],
    benefits: [
      'Chấm dứt hoàn toàn tình trạng run rẩy, tim đập thình thịch và quên sạch lời khi bước lên bục thuyết trình',
      'Biết cách mở đầu bài nói cuốn hút khiến khán giả lập tức dẹp bỏ điện thoại để chăm chú lắng nghe',
      'Sở hữu giọng nói trầm ấm, rõ ràng, có sức truyền cảm và uy lực tự nhiên',
      'Tự tin xuất hiện trước ống kính máy quay để sản xuất video chia sẻ tri thức chuyên nghiệp'
    ],
    techniques: ['Public Speaking', 'Body Language', 'Voice Modulation', 'Stage Fright Control', 'Storytelling', 'Video Presentation'],
    documents: [
      'Bảng kiểm tra 10 yếu tố đánh giá năng lực thuyết trình trước đám đông',
      'Checklist 5 phút khởi động thanh quản và thả lỏng cơ mặt trước giờ lên sân khấu'
    ]
  },
  {
    title: 'Giao Tiếp Thấu Cảm & Lắng Nghe Sâu Trong Công Việc Và Cuộc Sống',
    slug: 'giao-tiep-thau-cam-lang-nghe-sau-cong-viec-cuoc-song',
    categorySlug: 'phat-trien-ban-than-va-ky-nang-mem',
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0,
    leadSummary: 'Kết nối sâu sắc với con người: Thực hành giao tiếp phi bạo lực (Nonviolent Communication - NVC), nghệ thuật lắng nghe tích cực và hóa giải bất đồng bằng sự thấu hiểu.',
    industryContext: 'Hầu hết các bi kịch trong quan hệ con người bắt nguồn từ việc chúng ta lắng nghe để đối đáp, tranh cãi chứ không phải để thấu hiểu; lắng nghe sâu là nền tảng của mọi mối quan hệ bền vững.',
    coreTopics: [
      'Bốn cấp độ của sự lắng nghe theo Otto Scharmer: Lắng nghe phán xét, Lắng nghe thực tế, Lắng nghe thấu cảm và Lắng nghe tạo sinh',
      'Khung phương pháp Giao tiếp phi bạo lực của Marshall Rosenberg: Quan sát (Observations), Cảm xúc (Feelings), Nhu cầu (Needs) và Yêu cầu (Requests)',
      'Nghệ thuật đặt câu hỏi mở và phản chiếu cảm xúc (Reflective Listening): Bạn không cần đồng ý, bạn chỉ cần thấu hiểu',
      'Loại bỏ các thói quen xấu giết chết cuộc trò chuyện: Ngắt lời, Phán xét, Đưa ra lời khuyên vội vã và Kể lể chuyện của bản thân',
      'Hóa giải cơn giận dữ của người khác bằng sự bình tĩnh và đồng cảm chân thành'
    ],
    handsOnProject: 'Thực hành áp dụng công thức 4 bước NVC để viết một bức thư giải quyết xung đột kéo dài với một người bạn hoặc đồng nghiệp.',
    targetAudience: 'Bất kỳ ai muốn cải thiện các mối quan hệ cá nhân và công việc, Nhân viên chăm sóc khách hàng, Trưởng nhóm quản lý con người.',
    careerApplication: 'Trở thành người có trí tuệ cảm xúc cao, được đồng nghiệp tin tưởng tâm sự và xây dựng được các mối quan hệ đối tác bền chặt.',
    requirements: [
      'Tâm hồn cởi mở và mong muốn chân thành hiểu người khác',
      'Không đòi hỏi kỹ năng đối thoại hoa mỹ'
    ],
    benefits: [
      'Lắng nghe trọn vẹn những tâm tư sâu kín mà người đối diện chưa kịp nói ra thành lời',
      'Biết cách bày tỏ cảm xúc và nhu cầu của bản thân một cách chân thành mà không làm tổn thương người khác',
      'Hóa giải những hiểu lầm và bất đồng quan điểm trong hòa bình, gắn kết',
      'Xây dựng các mối quan hệ gia đình và tình bạn sâu sắc, chân thật và bền vững'
    ],
    techniques: ['Empathic Communication', 'Active Listening', 'Nonviolent Communication (NVC)', 'Reflective Listening', 'Emotional Intelligence', 'Conflict De-escalation'],
    documents: [
      'Bảng tra cứu danh sách các từ ngữ chỉ Cảm xúc và Nhu cầu phổ biến trong NVC',
      'Cẩm nang 7 bài tập rèn luyện kỹ năng lắng nghe không phán xét hàng ngày'
    ]
  },
  {
    title: 'Xây Dựng Thói Quen Nguyên Tử & Kỷ Luật Bản Thân (Atomic Habits)',
    slug: 'xay-dung-thoi-quen-nguyen-tu-ky-luat-ban-than-atomic-habits',
    categorySlug: 'phat-trien-ban-than-va-ky-nang-mem',
    level: CourseLevel.BEGINNER,
    price: 350000,
    oldPrice: 590000,
    leadSummary: 'Thay đổi nhỏ, kết quả lớn: Ứng dụng 4 quy luật thay đổi hành vi của James Clear, thiết kế môi trường sống hỗ trợ kỷ luật và duy trì thói quen tích cực bền bỉ suốt đời.',
    industryContext: 'Thành công không phải là kết quả của những cú nhảy vọt ngẫu nhiên; thành công là sản phẩm của những thói quen tốt nhỏ bé được lặp đi lặp lại một cách kỷ luật mỗi ngày.',
    coreTopics: [
      'Sức mạnh của sự cải thiện 1% mỗi ngày: Lãi kép của thói quen và Thung lũng của sự thất vọng (Valley of Disappointment)',
      'Ba tầng lớp của sự thay đổi hành vi: Thay đổi kết quả, Thay đổi quy trình và Thay đổi căn tính (Identity-based Habits)',
      'Quy luật 1 - Khiến nó rõ ràng: Thiết kế môi trường và kỹ thuật Xếp chồng thói quen (Habit Stacking)',
      'Quy luật 2 & 3 - Khiến nó hấp dẫn & Dễ dàng: Quy tắc 2 phút để bắt đầu và Giảm thiểu lực cản hành động',
      'Quy luật 4 - Khiến nó thỏa mãn: Theo dõi thói quen (Habit Tracking) và đối tác chịu trách nhiệm (Accountability Partner)'
    ],
    handsOnProject: 'Xây dựng một bản kế hoạch thiết lập 3 thói quen mới (Đọc sách, Tập thể dục, Dậy sớm) ứng dụng đầy đủ 4 quy luật của James Clear và duy trì theo dõi trong 21 ngày.',
    targetAudience: 'Người thường xuyên bắt đầu mục tiêu với sự hào hứng nhưng bỏ cuộc giữa chừng sau vài ngày, người muốn sống có kỷ luật.',
    careerApplication: 'Xây dựng nền tảng kỷ luật thép giúp bạn hoàn thành mọi mục tiêu dài hạn trong sự nghiệp và cuộc sống.',
    requirements: [
      'Sổ tay cá nhân hoặc ứng dụng theo dõi thói quen trên điện thoại',
      'Cam kết bắt đầu từ những hành động cực nhỏ chỉ mất 2 phút mỗi ngày'
    ],
    benefits: [
      'Dễ dàng bắt đầu những thói quen tốt mà không cần phải gồng mình dùng ý chí cạn kiệt',
      'Từ bỏ những thói quen xấu (nghiện lướt mạng xã hội, trì hoãn) bằng cách tái thiết kế môi trường',
      'Duy trì sự kiên định bền bỉ ngay cả trong những ngày tâm trạng chán nản, thiếu động lực',
      'Xây dựng niềm tin tự hào về căn tính của một con người kỷ luật, kiên cường'
    ],
    techniques: ['Atomic Habits', 'Behavioral Design', 'Habit Stacking', '2-Minute Rule', 'Identity-based Habits', 'Self-Discipline'],
    documents: [
      'Bảng tính theo dõi thói quen Habit Tracker 12 tháng có biểu đồ tự động',
      'Bộ thẻ bài 4 quy luật tạo thói quen tốt và 4 quy luật phá vỡ thói quen xấu'
    ]
  },
  {
    title: 'Trí Tuệ Cảm Xúc (EQ) Trong Công Sở: Thấu Hiểu Cảm Xúc & Quản Trị Bản Thân',
    slug: 'tri-tue-cam-xuc-eq-cong-so-thau-hieu-quan-tri-ban-than',
    categorySlug: 'phat-trien-ban-than-va-ky-nang-mem',
    level: CourseLevel.BEGINNER,
    price: 390000,
    oldPrice: 650000,
    leadSummary: 'Chỉ số thông minh IQ giúp bạn được tuyển dụng, nhưng chỉ số cảm xúc EQ mới giúp bạn được thăng chức: Nhận diện cảm xúc, kiểm soát cơn bốc đồng và thích ứng với môi trường làm việc áp lực.',
    industryContext: 'Hơn 85% yếu tố phân biệt những nhà lãnh đạo xuất chúng với những người bình thường nằm ở trí tuệ cảm xúc; EQ là năng lực con người độc nhất mà AI không bao giờ thay thế được.',
    coreTopics: [
      'Năm thành tố cốt lõi của Trí tuệ cảm xúc theo Daniel Goleman: Tự nhận thức, Tự điều chỉnh, Động lực tự thân, Đồng cảm và Kỹ năng xã hội',
      'Giải phẫu hiện tượng Cướp quyền của hạch hạnh nhân (Amygdala Hijack): Tại sao chúng ta thường hối hận sau những cơn giận dữ bốc đồng',
      'Khoảng dừng thần thánh giữa Kích thích và Phản hồi: Thực hành kỹ năng phản hồi có ý thức thay vì phản ứng theo bản năng',
      'Kỹ thuật tái định khung nhận thức (Cognitive Reframing): Biến thất bại và lời chỉ trích thành cơ hội học hỏi',
      'Xây dựng sự bền bỉ tinh thần (Resilience) vượt qua nghịch cảnh và áp lực công việc dồn dập'
    ],
    handsOnProject: 'Thực hiện nhật ký theo dõi cảm xúc trong 7 ngày làm việc, nhận diện 3 tình huống thường kích hoạt cơn giận dữ (Triggers) và viết kế hoạch phản ứng thay thế tích cực.',
    targetAudience: 'Nhân viên công sở thường bị căng thẳng, người dễ nổi nóng hoặc hay tự ti trước áp lực, nhà quản lý muốn rèn luyện phong thái điềm đạm.',
    careerApplication: 'Duy trì sự bình tĩnh, sáng suốt trước mọi biến cố, trở thành chỗ dựa tinh thần đáng tin cậy cho đồng nghiệp và cấp dưới.',
    requirements: [
      'Sự trung thực tuyệt đối với chính bản thân khi đối diện với những cảm xúc tiêu cực',
      'Sổ tay cá nhân để ghi chép nhật ký cảm xúc hàng ngày'
    ],
    benefits: [
      'Nhận biết ngay khoảnh khắc cơn giận dữ bắt đầu nhen nhóm để kịp thời điều hòa hơi thở',
      'Không bao giờ buông ra những lời cay đắng gây tổn thương đồng nghiệp và làm hỏng sự nghiệp',
      'Đón nhận những lời nhận xét tiêu cực của sếp với tâm thế bình thản, cầu tiến',
      'Tạo dựng phong thái đĩnh đạc, hòa nhã và đáng kính trọng của một người trưởng thành về cảm xúc'
    ],
    techniques: ['Emotional Intelligence (EQ)', 'Self-Regulation', 'Amygdala Hijack', 'Cognitive Reframing', 'Emotional Resilience', 'Mindfulness'],
    documents: [
      'Bảng kiểm tra đánh giá chỉ số trí tuệ cảm xúc EQ 25 câu hỏi chuẩn quốc tế',
      'Hướng dẫn kỹ thuật hít thở hộp (Box Breathing) giúp hạ hỏa cơn giận trong 2 phút'
    ]
  },
  {
    title: 'Tư Duy Phản Biện (Critical Thinking) & Ra Quyết Định Sáng Suốt Trong Công Việc',
    slug: 'tu-duy-phan-bien-critical-thinking-ra-quyet-dinh',
    categorySlug: 'phat-trien-ban-than-va-ky-nang-mem',
    level: CourseLevel.BEGINNER,
    price: 420000,
    oldPrice: 690000,
    leadSummary: 'Thoát khỏi bẫy suy nghĩ cảm tính: Nhận diện các ngụy biện logic (Fallacies), các thiên kiến nhận thức (Cognitive Biases) và áp dụng các mô hình tư duy (Mental Models) để ra quyết định chuẩn xác.',
    industryContext: 'Trong một thế giới tràn ngập tin giả và thông tin rác, khả năng suy nghĩ độc lập, hoài nghi lành mạnh và phản biện logic là kỹ năng sinh tồn của mọi trí thức.',
    coreTopics: [
      'Bản chất của Tư duy phản biện: Phân biệt rõ ràng giữa Sự thật khách quan (Facts) và Ý kiến chủ quan (Opinions)',
      'Nhận diện 10 lỗi ngụy biện logic kinh điển: Tấn công cá nhân (Ad Hominem), Người rơm (Strawman), Lập luận vòng tròn, Ngụy biện trượt dốc',
      'Nhận diện các thiên kiến nhận thức phổ biến: Thiên kiến xác nhận (Confirmation Bias), Thiên kiến mỏ neo, Hiệu ứng đám đông',
      'Các mô hình tư duy kinh điển: Nguyên lý cơ bản từ số 0 (First Principles Thinking), Đảo ngược vấn đề (Inversion) và Lưỡi dao Occam',
      'Khung ra quyết định ma trận đa tiêu chí (Decision Matrix) để lựa chọn phương án tối ưu'
    ],
    handsOnProject: 'Thực hiện phản biện và bóc tách các lỗ hổng lập luận trong một bài viết phân tích xu hướng thị trường gây sốt trên mạng xã hội.',
    targetAudience: 'Người trẻ muốn rèn luyện tư duy độc lập, Quản lý cần đưa ra các quyết định quan trọng, Nhà nghiên cứu, Nhà phân tích.',
    careerApplication: 'Đưa ra những quyết định kinh doanh và nghề nghiệp đúng đắn, không bị dẫn dắt bởi đám đông hay những lập luận ngụy biện.',
    requirements: [
      'Tâm thế cởi mở, sẵn sàng thừa nhận quan điểm của mình có thể sai khi có bằng chứng mới',
      'Yêu thích sự thật và tính logic chặt chẽ'
    ],
    benefits: [
      'Nhìn thấu ngay những chiêu trò thao túng tâm lý và ngụy biện trong các cuộc tranh luận',
      'Không bao giờ vội vã tin theo những lời đồn thổi vô căn cứ trên mạng xã hội',
      'Tự tin bảo vệ quan điểm cá nhân bằng những luận cứ khoa học, thuyết phục',
      'Đưa ra các quyết định lớn trong đời (chọn việc, đầu tư, mua nhà) dựa trên phân tích đa chiều'
    ],
    techniques: ['Critical Thinking', 'Logical Fallacies', 'Cognitive Biases', 'First Principles', 'Decision Matrix', 'Mental Models'],
    documents: [
      'Sổ tay bỏ túi nhận diện 20 lỗi ngụy biện logic thường gặp nhất trong đời sống',
      'Bảng mẫu ma trận ra quyết định có trọng số (Weighted Decision Matrix) trên Excel'
    ]
  },
  {
    title: 'Đọc Nhanh & Ghi Nhớ Sâu Kiến Thức (Speed Reading & Super Memory)',
    slug: 'doc-nhanh-ghi-nho-sau-kien-thuc-speed-reading-memory',
    categorySlug: 'phat-trien-ban-than-va-ky-nang-mem',
    level: CourseLevel.BEGINNER,
    price: 350000,
    oldPrice: 590000,
    leadSummary: 'Đọc xong 1 cuốn sách trong 2 giờ với độ hiểu sâu: Loại bỏ thói quen đọc thầm trong đầu (Subvocalization), mở rộng tầm nhìn ngoại vi và làm chủ kỹ thuật Lâu đài ký ức (Memory Palace).',
    industryContext: 'Lượng tri thức nhân loại nhân đôi sau mỗi vài năm; khả năng tiếp thu và ghi nhớ thông tin với tốc độ vượt trội là đòn bẩy tri thức đưa bạn dẫn đầu trong mọi lĩnh vực.',
    coreTopics: [
      'Phá vỡ các lầm tưởng về việc đọc: Đọc nhanh không làm giảm sự thấu hiểu nếu bạn biết cách đọc có phương pháp',
      'Kỹ thuật đọc nhanh: Sử dụng vật dẫn đường (Pointer), Loại bỏ thói quen đọc thầm từng từ trong cổ họng và Nhóm cụm từ (Chunking)',
      'Mở rộng góc nhìn ngoại vi của mắt và kỹ thuật đọc lướt tìm ý chính (Skimming & Scanning)',
      'Phương pháp đọc sách 3 tầng (Syntopical Reading) của Mortimer Adler: Nắm bắt cấu trúc cuốn sách chỉ sau 15 phút',
      'Nghệ thuật siêu trí nhớ: Phương pháp liên tưởng hình ảnh sống động và kỹ thuật xây dựng Lâu đài ký ức (Loci Method / Memory Palace)'
    ],
    handsOnProject: 'Thực hành đọc hoàn tất một cuốn sách phát triển bản thân 250 trang trong 90 phút và ghi nhớ toàn bộ 10 ý tưởng cốt lõi bằng sơ đồ Lâu đài ký ức.',
    targetAudience: 'Sinh viên phải ôn thi khối lượng kiến thức lớn, Chuyên gia cần cập nhật tài liệu liên tục, Người đam mê đọc sách.',
    careerApplication: 'Rút ngắn thời gian tiếp thu tri thức mới lên gấp 3 lần, xây dựng kho tàng kiến thức sâu rộng vượt trội so với bạn bè đồng trang lứa.',
    requirements: [
      'Có sẵn ít nhất 2 cuốn sách giấy phi hư cấu (sách kinh tế, kỹ năng, khoa học) để thực hành',
      'Sự tập trung cao độ trong các bài tập rèn luyện chuyển động mắt'
    ],
    benefits: [
      'Tăng tốc độ đọc từ 200 từ/phút lên trên 500 từ/phút mà vẫn nắm chắc nội dung cốt lõi',
      'Đọc hết những cuốn sách chuyên môn dày cộp đang nằm phủ bụi trên giá sách chỉ trong vài buổi tối',
      'Ghi nhớ chính xác tên người, số điện thoại và danh mục thông tin dài mà không cần sổ tay',
      'Tự tin bước vào các kỳ thi cử hoặc buổi phỏng vấn kiến thức hóc búa'
    ],
    techniques: ['Speed Reading', 'Subvocalization Control', 'Chunking', 'Memory Palace', 'Loci Method', 'Active Recall'],
    documents: [
      'Bảng kiểm tra đo lường tốc độ đọc WPM và tỷ lệ thấu hiểu văn bản',
      'Hướng dẫn từng bước xây dựng Lâu đài ký ức đầu tiên trong chính ngôi nhà của bạn'
    ]
  },
  {
    title: 'Kỹ Năng Giải Quyết Vấn Đề Phức Tạp (Complex Problem Solving) & Tư Duy Thiết Kế (Design Thinking)',
    slug: 'ky-nang-giai-quyet-van-de-phuc-tap-design-thinking',
    categorySlug: 'phat-trien-ban-than-va-ky-nang-mem',
    level: CourseLevel.INTERMEDIATE,
    price: 590000,
    oldPrice: 890000,
    leadSummary: 'Làm chủ phương pháp đổi mới sáng tạo chuẩn Stanford d.school: 5 bước Thấu cảm (Empathize), Xác định vấn đề (Define), Lên ý tưởng (Ideate), Tạo mẫu thử (Prototype) và Kiểm thử (Test).',
    industryContext: 'Diễn đàn Kinh tế Thế giới (WEF) liên tục xếp Giải quyết vấn đề phức tạp là kỹ năng quan trọng số một của thế kỷ 21; Design Thinking là bộ công cụ tối thượng để tìm ra các giải pháp đột phá.',
    coreTopics: [
      'Tư duy Thiết kế (Design Thinking) là gì: Quy trình sáng tạo lấy con người làm trung tâm (Human-Centered Innovation)',
      'Bước 1 - Thấu cảm (Empathize): Quan sát, Phỏng vấn và Đồng cảm sâu sắc với trải nghiệm thực tế của người dùng',
      'Bước 2 - Xác định vấn đề (Define): Đặt lại câu hỏi định hướng giải pháp Làm thế nào để chúng ta... (How Might We - HMW)',
      'Bước 3 - Lên ý tưởng (Ideate): Kỹ thuật Brainstorming không phán xét, Tư duy phân kỳ (Divergent) và Hội tụ (Convergent)',
      'Bước 4 & 5 - Tạo mẫu thử (Prototype) & Kiểm thử (Test): Xây dựng mô hình thử nghiệm nhanh giá rẻ để nhận phản hồi sớm'
    ],
    handsOnProject: 'Ứng dụng trọn vẹn 5 bước Design Thinking để giải quyết bài toán giảm thiểu thời gian chờ đợi lấy thuốc của bệnh nhân tại một phòng khám đa khoa.',
    targetAudience: 'Product Builder, Quản lý dự án, Nhà khởi nghiệp, Chuyên viên đổi mới sáng tạo, Bất kỳ ai đối mặt với các bài toán hóc búa không có lời giải sẵn.',
    careerApplication: 'Trở thành người giải quyết vấn đề xuất chúng (Master Problem Solver) có khả năng khai thông mọi bế tắc trong doanh nghiệp.',
    requirements: [
      'Tư duy cởi mở, tò mò và tinh thần không ngại thử nghiệm sai lầm',
      'Có giấy ghi chú nhiều màu (Post-it notes) và bút viết để thực hành lên ý tưởng'
    ],
    benefits: [
      'Giải quyết đúng gốc rễ vấn đề thay vì chỉ chữa cháy các triệu chứng bề nổi',
      'Thúc đẩy tinh thần sáng tạo đột phá cho bản thân và toàn bộ đội ngũ làm việc',
      'Tiết kiệm hàng tháng trời làm việc vô ích nhờ tạo mẫu thử nghiệm nhanh để kiểm chứng',
      'Tạo ra những giải pháp thực sự chạm đến trái tim và làm hài lòng người sử dụng cuối'
    ],
    techniques: ['Design Thinking', 'Human-Centered Design', 'How Might We (HMW)', 'Brainstorming', 'Rapid Prototyping', 'User Testing'],
    documents: [
      'Bộ thẻ bài kích thích sáng tạo Design Thinking Action Cards chuẩn Stanford',
      'Mẫu khung tổng hợp thấu cảm người dùng (Empathy Map Canvas)'
    ]
  },
  {
    title: 'Nghệ Thuật Kể Chuyện Truyền Cảm Hứng Trong Kinh Doanh (Business Storytelling)',
    slug: 'nghe-thuat-ke-chuyen-truyen-cam-hung-business-storytelling',
    categorySlug: 'phat-trien-ban-than-va-ky-nang-mem',
    level: CourseLevel.INTERMEDIATE,
    price: 550000,
    oldPrice: 850000,
    leadSummary: 'Biến những số liệu khô khan thành câu chuyện chạm đến trái tim: Cấu trúc câu chuyện 3 hồi kinh điển, kỹ thuật dẫn dắt cảm xúc và nghệ thuật kể chuyện thương hiệu thu phục lòng người.',
    industryContext: 'Não bộ con người không được tiến hóa để ghi nhớ các bảng tính số liệu hay danh sách gạch đầu dòng khô khan; con người ghi nhớ và hành động theo những câu chuyện truyền cảm hứng.',
    coreTopics: [
      'Tại sao Kể chuyện (Storytelling) là kỹ năng quyền lực nhất của người lãnh đạo: Cơ chế sinh học của Oxytocin và Dopamine khi nghe chuyện',
      'Cấu trúc câu chuyện kinh điển: Bối cảnh bình yên -> Biến cố xung đột -> Hành trình gian khổ -> Khoảnh khắc bừng sáng -> Kết quả chuyển hóa',
      'Bốn loại câu chuyện mọi nhà lãnh đạo cần có: Câu chuyện Tôi là ai, Câu chuyện Tại sao tôi ở đây, Câu chuyện Bài học thất bại và Câu chuyện Tầm nhìn tương lai',
      'Nghệ thuật lồng ghép số liệu vào cốt truyện: Biến số phần trăm và doanh thu thành nỗi đau hoặc niềm vui của một con người cụ thể',
      'Kỹ thuật tạo cao trào, Sử dụng hình ảnh giác quan (Sensory Details) và Thông điệp bài học đắt giá'
    ],
    handsOnProject: 'Viết và kể một câu chuyện truyền cảm hứng dài 4 phút về sự vượt khó vươn lên của công ty để trình bày trong lễ tổng kết năm trước toàn thể nhân viên.',
    targetAudience: 'Lãnh đạo doanh nghiệp, Giảng viên, Diễn giả, Nhân viên kinh doanh, Người làm truyền thông thương hiệu.',
    careerApplication: 'Thu phục lòng người, truyền cảm hứng và thổi bùng ngọn lửa nhiệt huyết cho đội ngũ và khách hàng.',
    requirements: [
      'Có những trải nghiệm sống hoặc câu chuyện công việc thực tế của bản thân',
      'Sẵn sàng bộc lộ sự chân thành và cảm xúc thật'
    ],
    benefits: [
      'Biến các buổi thuyết trình khô cứng thành những trải nghiệm đầy cảm xúc và đáng nhớ',
      'Thuyết phục khách hàng và nhà đầu tư tin tưởng vào tầm nhìn dài hạn của bạn',
      'Gắn kết đội ngũ nhân viên cùng chung một giấc mơ và hệ giá trị văn hóa tốt đẹp',
      'Tạo dựng phong cách lãnh đạo truyền cảm hứng tự nhiên, giàu sức hút'
    ],
    techniques: ['Storytelling', 'Narrative Arc', 'Business Storytelling', 'Emotional Connection', 'Sensory Details', 'Hero Journey'],
    documents: [
      'Khung kịch bản kể chuyện 7 bước (Story Canvas) chuẩn Hollywood ứng dụng cho doanh nghiệp',
      'Bộ sưu tập 20 câu chuyện kinh doanh truyền cảm hứng kinh điển nhất thế giới'
    ]
  },
  {
    title: 'Kỹ Năng Đặt Câu Hỏi Dẫn Dắt & Khai Vấn Bản Thân (Self-Coaching Mastery)',
    slug: 'ky-nang-dat-cau-hoi-dan-dat-khai-van-ban-than-self-coaching',
    categorySlug: 'phat-trien-ban-than-va-ky-nang-mem',
    level: CourseLevel.INTERMEDIATE,
    price: 490000,
    oldPrice: 750000,
    leadSummary: 'Làm chủ cuộc đời mình: Ứng dụng mô hình khai vấn GROW kinh điển của Sir John Whitmore, kỹ thuật viết nhật ký phản tư (Reflective Journaling) để tự gỡ bỏ niềm tin giới hạn.',
    industryContext: 'Câu trả lời thông minh chỉ đến từ những câu hỏi sắc sảo; chất lượng cuộc sống của bạn phụ thuộc trực tiếp vào chất lượng những câu hỏi mà bạn tự đặt ra cho chính mình mỗi ngày.',
    coreTopics: [
      'Khai vấn (Coaching) là gì: Khai phá tiềm năng nội tại tối đa của con người thay vì dạy bảo hay chỉ tay năm ngón',
      'Mô hình khai vấn GROW kinh điển: Mục tiêu (Goal) -> Thực tại (Reality) -> Lựa chọn (Options) -> Ý chí cam kết hành động (Will)',
      'Sức mạnh của những câu hỏi quyền năng (Powerful Questions): Câu hỏi Tại sao (gây phòng thủ) vs Câu hỏi Như thế nào & Cái gì (gợi mở giải pháp)',
      'Nhận diện và đập tan những Niềm tin giới hạn (Limiting Beliefs) đang kìm hãm sự phát triển của bạn',
      'Nghệ thuật viết nhật ký phản tư (Journaling): Tự trò chuyện với tiềm thức và khai thông những nút thắt tâm lý'
    ],
    handsOnProject: 'Thực hành một phiên tự khai vấn (Self-coaching Session) kéo dài 45 phút cho một mục tiêu nghề nghiệp quan trọng đang bị trì hoãn và xây dựng kế hoạch hành động cụ thể.',
    targetAudience: 'Người đang cảm thấy mất phương hướng, bế tắc trong sự nghiệp, người muốn phát triển bản thân độc lập không phụ thuộc vào người khác.',
    careerApplication: 'Trở thành người thầy của chính mình, tự tin điều hướng bản thân vượt qua mọi giai đoạn khủng hoảng cuộc đời.',
    requirements: [
      'Một cuốn sổ tay đẹp và một không gian yên tĩnh để tự đối thoại với chính mình',
      'Sự dũng cảm nhìn thẳng vào những điểm yếu và nỗi sợ hãi bên trong'
    ],
    benefits: [
      'Tự tìm ra câu trả lời và lối thoát cho những vấn đề khó khăn mà không cần chờ đợi ai khuyên bảo',
      'Xóa bỏ vĩnh viễn tư duy nạn nhân hay đổ lỗi cho hoàn cảnh để nắm quyền tự quyết cuộc đời',
      'Xác định rõ ràng mục tiêu thực sự mà mình mong muốn chứ không phải chạy theo kỳ vọng của xã hội',
      'Tạo dựng sự tự tin nội tại vững chắc không thể bị lung lay trước những phán xét bên ngoài'
    ],
    techniques: ['Self-Coaching', 'GROW Model', 'Powerful Questions', 'Reflective Journaling', 'Limiting Beliefs', 'Personal Accountability'],
    documents: [
      'Bộ sưu tập 50 câu hỏi khai vấn quyền năng đánh thức tiềm thức theo mô hình GROW',
      'Mẫu nhật ký phản tư buổi sáng và buổi tối giúp định tâm và tập trung năng lượng'
    ]
  },
  {
    title: 'Quản Lý Căng Thẳng & Chăm Sóc Sức Khỏe Tinh Thần Cho Người Đi Làm (Stress Management & Mindfulness)',
    slug: 'quan-ly-cang-thang-cham-soc-suc-khoe-tinh-than-mindfulness',
    categorySlug: 'phat-trien-ban-than-va-ky-nang-mem',
    level: CourseLevel.INTERMEDIATE,
    price: 399000,
    oldPrice: 650000,
    leadSummary: 'Tìm lại sự an yên giữa bộn bề công sở: Khoa học về stress và hormone Cortisol, phương pháp chánh niệm (Mindfulness), kỹ thuật thiền định quét cơ thể và thiết lập ranh giới bảo vệ bản thân.',
    industryContext: 'Hội chứng kiệt sức nghề nghiệp (Burnout) đang trở thành đại dịch thầm lặng nơi công sở; chăm sóc sức khỏe tinh thần là khoản đầu tư thông minh nhất để duy trì sự nghiệp bền bỉ.',
    coreTopics: [
      'Cơ chế sinh học của Stress: Phân biệt Stress tích cực (Eustress) giúp bứt phá và Stress độc hại (Distress) tàn phá cơ thể',
      'Nhận diện các dấu hiệu cảnh báo của Hội chứng kiệt sức (Burnout Syndrome): Mệt mỏi mãn tính, Hoài nghi bản thân và Giảm sút năng suất',
      'Thực hành Chánh niệm (Mindfulness) trong công việc: Ăn trong chánh niệm, Đi bộ chánh niệm và Thiền định ngắn 5 phút',
      'Kỹ thuật quét cơ thể (Body Scan Meditation) và Thư giãn cơ tiến triển (PMR) giúp xua tan căng thẳng cơ bắp và ngủ ngon',
      'Nghệ thuật thiết lập ranh giới công việc - cuộc sống (Work-Life Boundaries): Quyền được ngắt kết nối ngoài giờ làm việc'
    ],
    handsOnProject: 'Xây dựng một bộ quy chuẩn chăm sóc bản thân (Self-Care Plan) hàng tuần kết hợp thực hành thiền định chánh niệm 10 phút mỗi ngày trong 14 ngày liên tục.',
    targetAudience: 'Nhân viên văn phòng thường xuyên làm việc quá tải, người bị mất ngủ, lo âu, cảm thấy kiệt sức vì công việc.',
    careerApplication: 'Tái tạo năng lượng sống dồi dào, duy trì phong độ làm việc bền bỉ trong dài hạn mà không phải trả giá bằng sức khỏe.',
    requirements: [
      'Một không gian yên tĩnh và một chiếc ghế ngồi thoải mái',
      'Mong muốn học cách yêu thương và trân trọng sức khỏe của chính mình'
    ],
    benefits: [
      'Hạ mức độ hormone căng thẳng Cortisol giúp cơ thể và tâm trí trở lại trạng thái thư thái tự nhiên',
      'Cải thiện chất lượng giấc ngủ sâu, chấm dứt tình trạng trằn trọc lo nghĩ về công việc lúc nửa đêm',
      'Duy trì sự tập trung tinh thần sắc bén và trí nhớ minh mẫn suốt ngày dài làm việc',
      'Học cách từ chối lịch thiệp để bảo vệ năng lượng và thời gian quý báu của bản thân'
    ],
    techniques: ['Stress Management', 'Mindfulness', 'Burnout Prevention', 'Body Scan Meditation', 'Work-Life Boundaries', 'Box Breathing'],
    documents: [
      'File âm thanh hướng dẫn thiền định quét cơ thể 10 phút giọng đọc trầm ấm thư giãn',
      'Bảng đánh giá mức độ nguy cơ kiệt sức nghề nghiệp theo thang đo Maslach Burnout Inventory'
    ]
  },
  {
    title: 'Xây Dựng Mối Quan Hệ Chất Lượng & Nghệ Thuật Kết Nối Chuyên Nghiệp (Networking)',
    slug: 'xay-dung-moi-quan-he-chat-luong-networking-chuyen-nghiep',
    categorySlug: 'phat-trien-ban-than-va-ky-nang-mem',
    level: CourseLevel.INTERMEDIATE,
    price: 450000,
    oldPrice: 750000,
    leadSummary: 'Đừng đi ăn một mình: Làm chủ nghệ thuật kết nối mạng lưới quan hệ dựa trên sự chân thành và tinh thần cho đi trước (Give and Take), biến người xa lạ thành quý nhân hỗ trợ sự nghiệp.',
    industryContext: 'Hơn 70% các cơ hội việc làm tốt nhất và các hợp đồng kinh doanh lớn không bao giờ được đăng tuyển công khai; chúng được trao đổi qua mạng lưới quan hệ chất lượng.',
    coreTopics: [
      'Tư duy kết nối đúng đắn của Adam Grant: Phân biệt Người nhận (Takers), Người sòng phẳng (Matchers) và Người cho đi thành công (Givers)',
      'Xóa bỏ định kiến về Networking: Không phải là sự vụ lợi giả tạo hay phát danh thiếp vô tội vạ mà là xây dựng tình bạn chuyên nghiệp',
      'Kỹ thuật trò chuyện bắt chuyện tự nhiên (Small Talk): Phá vỡ tảng băng im lặng bằng những câu hỏi mở thú vị',
      'Quản lý danh bạ mối quan hệ chuyên nghiệp bằng Personal CRM: Ghi chú sở thích, sinh nhật và chu kỳ hỏi thăm',
      'Nuôi dưỡng mạng lưới quan hệ dài hạn: Cách duy trì kết nối tinh tế mà không tạo cảm giác làm phiền'
    ],
    handsOnProject: 'Lập danh mục 20 mối quan hệ hạt giống quan trọng nhất cho sự nghiệp của bạn và thực hiện chiến dịch kết nối lại với 5 người đã lâu không liên lạc.',
    targetAudience: 'Người hướng nội ngại kết nối, Chuyên viên muốn mở rộng mạng lưới nghề nghiệp, Nhà quản lý muốn xây dựng quan hệ đối tác.',
    careerApplication: 'Luôn có những quý nhân sẵn sàng giúp đỡ, mở ra những cơ hội kinh doanh và nấc thang sự nghiệp bất ngờ.',
    requirements: [
      'Tấm lòng chân thành và mong muốn giúp đỡ người khác mà không đòi hỏi đền đáp ngay',
      'Có tài khoản mạng xã hội LinkedIn hoặc Facebook'
    ],
    benefits: [
      'Tự tin bước vào bất kỳ sự kiện giao lưu nào và dễ dàng bắt chuyện với những người xa lạ',
      'Xây dựng được mạng lưới quan hệ rộng khắp với các chuyên gia và lãnh đạo uy tín trong ngành',
      'Được mọi người yêu mến và nhớ đến đầu tiên mỗi khi có cơ hội công việc hoặc dự án mới',
      'Nhận được sự chỉ dẫn quý giá từ các tiền bối đi trước giúp tránh được các sai lầm đắt giá'
    ],
    techniques: ['Networking', 'Give and Take', 'Small Talk', 'Personal CRM', 'Relationship Building', 'Social Capital'],
    documents: [
      'Bảng mẫu Personal CRM quản lý mối quan hệ thông minh trên Notion/Excel',
      'Tuyển tập 30 câu hỏi mở phá băng (Icebreaker Questions) thông minh cho các buổi tiệc'
    ]
  },
  {
    title: 'Thích Ứng Linh Hoạt Với Biến Động (Agility & Adaptability In Career)',
    slug: 'thich-ung-linh-hoat-voi-bien-dong-career-agility',
    categorySlug: 'phat-trien-ban-than-va-ky-nang-mem',
    level: CourseLevel.INTERMEDIATE,
    price: 490000,
    oldPrice: 790000,
    leadSummary: 'Sống sót và phát triển rực rỡ trong thế giới VUCA/BANI: Nuôi dưỡng tư duy phát triển (Growth Mindset), sẵn sàng gỡ bỏ kiến thức cũ (Unlearn) để học lại kiến thức mới (Relearn).',
    industryContext: 'Trong một thế giới biến đổi với tốc độ chóng mặt dưới sự dẫn dắt của AI, kẻ sống sót không phải là kẻ mạnh nhất hay thông minh nhất, mà là kẻ có khả năng thích ứng linh hoạt nhất.',
    coreTopics: [
      'Bản chất của thế giới hiện đại: Chuyển dịch từ mô hình VUCA (Biến động, Bất định, Phức tạp, Mơ hồ) sang mô hình BANI (Dễ vỡ, Lo âu, Phi tuyến, Khó hiểu)',
      'Tư duy phát triển (Growth Mindset) của Carol Dweck: Tin rằng tài năng và trí thông minh có thể rèn luyện được qua nỗ lực',
      'Quy trình 3 bước thích ứng: Học hỏi (Learn) -> Dũng cảm gỡ bỏ kiến thức đã lỗi thời (Unlearn) -> Học lại kiến thức mới phù hợp (Relearn)',
      'Xây dựng danh mục kỹ năng hình chữ T (T-shaped Skills): Sâu về một chuyên môn cốt lõi và rộng về nhiều lĩnh vực bổ trợ',
      'Lập kế hoạch phòng ngừa rủi ro nghề nghiệp: Xây dựng quỹ an toàn và đa dạng hóa các nguồn thu nhập'
    ],
    handsOnProject: 'Đánh giá lại toàn bộ bộ kỹ năng hiện tại của bản thân, xác định 2 kỹ năng sắp bị AI thay thế và lập kế hoạch học tập 2 kỹ năng mới thay thế trong 6 tháng.',
    targetAudience: 'Người đang cảm thấy lo lắng bị mất việc trước làn sóng tự động hóa, người muốn chuyển đổi nghề nghiệp, người muốn duy trì giá trị bản thân bền vững.',
    careerApplication: 'Luôn giữ vững vị thế người lao động đắt giá, không bao giờ bị tụt hậu hay bị đào thải trước các biến động công nghệ.',
    requirements: [
      'Sự dũng cảm từ bỏ cái tôi chuyên gia cũ kỹ',
      'Tinh thần học hỏi suốt đời (Lifelong Learning)'
    ],
    benefits: [
      'Xóa tan nỗi sợ hãi mơ hồ về tương lai và công nghệ trí tuệ nhân tạo AI',
      'Biết cách chủ động học hỏi các kỹ năng mới với tốc độ nhanh chóng và có phương pháp',
      'Dễ dàng hòa nhập và tỏa sáng trong các môi trường làm việc mới nhiều biến động',
      'Xây dựng sự nghiệp vững như bàn thạch có khả năng chống chịu trước mọi cuộc khủng hoảng kinh tế'
    ],
    techniques: ['Career Agility', 'Growth Mindset', 'Learn Unlearn Relearn', 'T-shaped Skills', 'Lifelong Learning', 'VUCA/BANI Navigation'],
    documents: [
      'Bảng kiểm tra đánh giá mức độ thiên hướng Tư duy Cố định vs Tư duy Phát triển',
      'Khung kế hoạch phát triển kỹ năng cá nhân (Individual Development Plan - IDP) 1 năm'
    ]
  },
  {
    title: 'Làm Chủ Năng Lực Tập Trung Sâu Trong Kỷ Nguyên Xao Nhãng (Deep Work Mastery)',
    slug: 'lam-chu-nang-luc-tap-trung-sau-deep-work-mastery',
    categorySlug: 'phat-trien-ban-than-va-ky-nang-mem',
    level: CourseLevel.ADVANCED,
    price: 690000,
    oldPrice: 1050000,
    leadSummary: 'Quy tắc vàng để thành công trong thế giới bị phân tâm của Cal Newport: Rèn luyện khả năng làm việc sâu không gián đoạn, cai nghiện kỹ thuật số (Digital Minimalism) và nhân đôi năng suất trí tuệ.',
    industryContext: 'Khả năng tập trung sâu vào một công việc khó khăn mà không bị xao nhãng đang trở thành một siêu năng lực ngày càng hiếm hoi và cực kỳ có giá trị trong nền kinh tế tri thức.',
    coreTopics: [
      'Khái niệm Làm việc sâu (Deep Work) vs Làm việc nông cạn (Shallow Work): Sự hủy hoại của các thông báo tin nhắn liên tục',
      'Bốn triết lý sắp xếp lịch trình Deep Work: Triết lý tu sĩ, Triết lý song hành, Triết lý nhịp điệu và Triết lý nhà báo',
      'Quy tắc 1 - Làm việc sâu: Thiết lập nghi thức bắt đầu, Địa điểm riêng biệt và Loại bỏ hoàn toàn kết nối Internet cá nhân',
      'Quy tắc 2 - Tận dụng sự buồn chán: Huấn luyện bộ não chịu đựng sự thiếu vắng dopamine kích thích tức thời',
      'Quy tắc 3 - Từ bỏ mạng xã hội: Áp dụng phương pháp Tối giản kỹ thuật số (Digital Minimalism) và Thanh lọc dopamine (Dopamine Detox)'
    ],
    handsOnProject: 'Thực hiện thử nghiệm 7 ngày áp dụng chế độ Deep Work 90 phút mỗi sáng sớm không điện thoại và viết một bài tiểu luận hoàn chỉnh với chất lượng vượt trội.',
    targetAudience: 'Lập trình viên, Nhà văn, Nhà nghiên cứu, Nhà sáng tạo, Người làm việc trí óc cần sự tập trung cao độ.',
    careerApplication: 'Tạo ra những công trình và sản phẩm trí tuệ có độ phức tạp cao và chất lượng xuất sắc mà người bình thường không thể làm được.',
    requirements: [
      'Quyết tâm cao độ dám ngắt kết nối với các thiết bị thông minh trong những khoảng thời gian cố định',
      'Mong muốn tạo ra những thành quả công việc có giá trị vượt bậc'
    ],
    benefits: [
      'Hoàn thành khối lượng công việc khó khăn của cả một ngày chỉ trong 2-3 giờ tập trung sâu',
      'Khôi phục lại khả năng đọc sâu những tài liệu phức tạp mà không bị cảm giác bồn chồn muốn kiểm tra điện thoại',
      'Thoát khỏi cảm giác kiệt sức vì phải đa nhiệm (Multitasking) liên tục suốt cả ngày',
      'Tìm lại niềm vui sướng thuần khiết khi đắm chìm trong dòng chảy sáng tạo (Flow State)'
    ],
    techniques: ['Deep Work', 'Digital Minimalism', 'Dopamine Detox', 'Flow State', 'Monotasking', 'Attention Management'],
    documents: [
      'Bản quy ước thiết lập nghi thức làm việc sâu (Deep Work Ritual Checklist)',
      'Kế hoạch 30 ngày thanh lọc kỹ thuật số (Digital Decluttering Protocol)'
    ]
  },
  {
    title: 'Nghệ Thuật Lãnh Đạo Tự Thân & Thao Túng Tâm Lý Tích Cực (Self-Leadership & NLP)',
    slug: 'nghe-thuat-lanh-dao-tu-than-thao-tung-tam-ly-tich-cuc-nlp',
    categorySlug: 'phat-trien-ban-than-va-ky-nang-mem',
    level: CourseLevel.ADVANCED,
    price: 790000,
    oldPrice: 1250000,
    leadSummary: 'Lập trình lại ngôn ngữ tư duy với NLP: Neo cảm xúc tích cực (Anchoring), tái tạo mô hình thành công (Modeling) và chuyển hóa trạng thái năng lượng đỉnh cao trong tích tắc.',
    industryContext: 'Bạn không thể lãnh đạo bất kỳ ai nếu bạn chưa học được cách lãnh đạo chính bản thân mình; NLP cung cấp các công cụ mạnh mẽ để làm chủ cảm xúc và hành vi vô thức.',
    coreTopics: [
      'Các tiền đề cốt lõi của Lập trình ngôn ngữ tư duy (Neuro-Linguistic Programming - NLP): Bản đồ không phải là vùng đất',
      'Hệ thống tiếp nhận thông tin VAKOG (Thị giác, Thính giác, Xúc giác, Khứu giác, Vị giác) và nhận diện phong cách tư duy của người khác',
      'Kỹ thuật Neo cảm xúc (Anchoring): Cài đặt điểm kích hoạt trạng thái tự tin và hưng phấn tức thời trên cơ thể',
      'Kỹ thuật Đồng điệu và Dẫn dắt (Pacing & Leading): Xây dựng sự tin tưởng vô thức (Rapport) ngay từ cái nhìn đầu tiên',
      'Phương pháp mô phỏng xuất sắc (Modeling Excellence): Giải mã và sao chép chiến lược tư duy của những người thành công nhất trong ngành'
    ],
    handsOnProject: 'Thực hành cài đặt một mỏ neo cảm xúc tự tin trên ngón tay và áp dụng kỹ thuật Pacing & Leading để thuyết phục một khách hàng có định kiến.',
    targetAudience: 'Nhà lãnh đạo, Chuyên viên bán hàng cao cấp, Diễn giả, Người muốn làm chủ tâm lý và trạng thái năng lượng bản thân.',
    careerApplication: 'Luôn xuất hiện trước đối tác với phong thái đĩnh đạc, quyền lực và năng lượng tích cực cuốn hút nhất.',
    requirements: [
      'Tư duy cởi mở tìm hiểu về cơ chế hoạt động của não bộ và tiềm thức',
      'Sẵn sàng thực hành các bài tập tâm lý học trải nghiệm'
    ],
    benefits: [
      'Lập tức kích hoạt trạng thái tự tin và bình tĩnh trước những sự kiện trọng đại chỉ bằng một cử chỉ tay',
      'Xây dựng thiện cảm và sự tin cậy vô thức với người đối diện chỉ sau vài phút trò chuyện',
      'Xóa bỏ những ký ức tiêu cực và nỗi sợ hãi vô lý đang kìm hãm bước tiến của bản thân',
      'Sao chép nhanh chóng các thói quen và cách tư duy hiệu quả của những người giỏi nhất'
    ],
    techniques: ['NLP', 'Self-Leadership', 'Anchoring', 'Pacing and Leading', 'Modeling Excellence', 'Rapport Building'],
    documents: [
      'Sơ đồ các vị trí neo cảm xúc hiệu quả trên cơ thể người',
      'Bảng câu hỏi xác định phong cách tiếp nhận thông tin ưu thế VAKOG'
    ]
  },
  {
    title: 'Tư Duy Hệ Thống Cho Nhà Quản Trị Cấp Cao (Systems Thinking For Leaders)',
    slug: 'tu-duy-he-thong-cho-nha-quan-tri-cap-cao-systems-thinking',
    categorySlug: 'phat-trien-ban-than-va-ky-nang-mem',
    level: CourseLevel.ADVANCED,
    price: 890000,
    oldPrice: 1450000,
    leadSummary: 'Nhìn thấu bức tranh toàn cảnh: Áp dụng nguyên lý Tư duy hệ thống của Peter Senge, nhận diện các vòng lặp phản hồi (Feedback Loops), độ trễ thời gian và điểm đòn bẩy thay đổi tổ chức.',
    industryContext: 'Hầu hết các giải pháp ngắn hạn ngày hôm nay sẽ trở thành vấn đề nan giải ngày mai vì chúng ta tư duy theo đường thẳng; Tư duy hệ thống giúp lãnh đạo giải quyết các bài toán gốc rễ bền vững.',
    coreTopics: [
      'Sự khác biệt giữa Tư duy phân tích tuyến tính (A dẫn đến B) và Tư duy hệ thống phi tuyến (Mọi thứ đều liên kết với nhau)',
      'Hai loại vòng lặp phản hồi cơ bản: Vòng lặp củng cố tạo đà (Reinforcing Loops) và Vòng lặp cân bằng tự điều chỉnh (Balancing Loops)',
      'Hiện tượng Trễ thời gian (Time Delays) và tại sao các chính sách nôn nóng thường phản tác dụng',
      'Nhận diện các khuôn mẫu hệ thống kinh điển (System Archetypes): Bi kịch của của chung, Giới hạn của sự tăng trưởng, Chuyển gánh nặng',
      'Tìm kiếm Điểm đòn bẩy cao (High Leverage Points) của Donella Meadows: Tác động nhỏ mang lại sự chuyển hóa khổng lồ cho tổ chức'
    ],
    handsOnProject: 'Vẽ sơ đồ vòng lặp nhân quả (Causal Loop Diagram) phân tích bài toán tỷ lệ nghỉ việc cao của nhân viên trong công ty và xác định điểm đòn bẩy chính sách để hóa giải.',
    targetAudience: 'CEO, Giám đốc chiến lược, Nhà hoạch định chính sách, Lãnh đạo cấp cao chịu trách nhiệm về sự phát triển dài hạn.',
    careerApplication: 'Nâng tầm tư duy lãnh đạo ở tầm vóc vĩ mô, đưa ra những quyết định chiến lược có giá trị bền vững qua nhiều thế hệ.',
    requirements: [
      'Kinh nghiệm quản lý điều hành tổ chức hoặc hoạch định chính sách',
      'Tư duy trừu tượng và khả năng nhìn nhận sự việc đa chiều'
    ],
    benefits: [
      'Chấm dứt việc đưa ra các giải pháp chữa cháy chắp vá tạo ra thêm nhiều rắc rối trong tương lai',
      'Dự đoán trước các tác dụng phụ không mong muốn của các chính sách quản lý mới',
      'Tìm ra điểm đòn bẩy chính xác giúp xoay chuyển tình thế khó khăn của công ty với nguồn lực tối thiểu',
      'Nhìn thấu trật tự và quy luật vận hành ẩn sau sự hỗn loạn bề ngoài của thị trường'
    ],
    techniques: ['Systems Thinking', 'Causal Loop Diagrams', 'Feedback Loops', 'Leverage Points', 'System Archetypes', 'Peter Senge Principles'],
    documents: [
      'Tuyển tập 8 khuôn mẫu hệ thống kinh điển (System Archetypes) và chiến lược hóa giải',
      'Template phần mềm Kumu / Vensim vẽ sơ đồ vòng lặp nhân quả chuẩn quốc tế'
    ]
  },
  {
    title: 'Khai Phóng Năng Lực Trực Giác & Đưa Ra Quyết Định Trong Tình Huống Căng Thẳng Cao (Intuitive Decision Making)',
    slug: 'khai-phong-nang-luc-truc-giac-ra-quyet-dinh-tinh-huong-cang-thang',
    categorySlug: 'phat-trien-ban-than-va-ky-nang-mem',
    level: CourseLevel.ADVANCED,
    price: 850000,
    oldPrice: 1390000,
    leadSummary: 'Khi dữ liệu không còn đủ và thời gian cạn kiệt: Khai thác sức mạnh của trực giác chuyên gia (Expert Intuition), mô hình nhận diện khuôn mẫu RPD và đưa ra quyết định sinh tử.',
    industryContext: 'Trong các tình huống khủng hoảng sinh tử, người lãnh đạo không có thời gian để mở bảng Excel phân tích; trực giác được tôi luyện qua kinh nghiệm chính là la bàn cứu rỗi tổ chức.',
    coreTopics: [
      'Khoa học về Trực giác: Trực giác không phải là giác quan thứ sáu thần bí mà là khả năng nhận diện khuôn mẫu tiềm thức siêu tốc của não bộ',
      'Mô hình quyết định dựa trên nhận diện (Recognition-Primed Decision Model - RPD) của Gary Klein',
      'Phân biệt giữa Trực giác chuyên gia đáng tin cậy và Ảo tưởng cảm tính nông nổi: Điều kiện môi trường có quy luật ổn định',
      'Kỹ thuật mô phỏng tinh thần (Mental Simulation): Chạy thử nghiệm các kịch bản hành động trong đầu trước khi ra lệnh',
      'Rèn luyện trực giác qua việc tổng kết và phân tích các bài học thất bại trong quá khứ'
    ],
    handsOnProject: 'Thực hành mô phỏng đưa ra quyết định giải quyết một sự cố an toàn thông tin rò rỉ dữ liệu khẩn cấp trong điều kiện thiếu 50% thông tin cần thiết trong 15 phút.',
    targetAudience: 'Chỉ huy hiện trường, Bác sĩ cấp cứu, Giám đốc ứng phó khủng hoảng, Nhà lãnh đạo điều hành trong các môi trường rủi ro cao.',
    careerApplication: 'Bản lĩnh cầm trịch và đưa ra quyết định quyết đoán cứu vãn tổ chức trong những thời khắc hiểm nghèo nhất.',
    requirements: [
      'Đã có ít nhất vài năm kinh nghiệm thực chiến trong lĩnh vực chuyên môn của mình',
      'Tâm lý vững vàng khi đối diện với sự không chắc chắn'
    ],
    benefits: [
      'Tự tin đưa ra quyết định dứt khoát ngay cả khi không có đủ số liệu và thời gian để suy tính',
      'Khai thác kho tàng kinh nghiệm phong phú được lưu trữ trong tầng tiềm thức sâu kín',
      'Giữ được sự bình tĩnh phi thường giữa lúc mọi người xung quanh đang hoảng loạn, mất phương hướng',
      'Trở thành điểm tựa vững chắc cho toàn bộ tổ chức trong các giai đoạn giông bão bất ngờ'
    ],
    techniques: ['Intuitive Decision Making', 'Recognition-Primed Decision (RPD)', 'Mental Simulation', 'Crisis Leadership', 'Pattern Recognition'],
    documents: [
      'Bảng tiêu chí kiểm tra tính đáng tin cậy của trực giác trước khi ra quyết định lớn',
      'Bộ kịch bản tình huống diễn tập ứng phó khủng hoảng và ra quyết định tốc độ cao'
    ]
  },
  {
    title: 'Nghệ Thuật Thích Ứng Văn Hóa & Làm Việc Nhóm Đa Thế Hệ (Gen Z, Gen Y, Gen X)',
    slug: 'nghe-thuat-thich-ung-van-hoa-lam-viec-nhom-da-the-he',
    categorySlug: 'phat-trien-ban-than-va-ky-nang-mem',
    level: CourseLevel.INTERMEDIATE,
    price: 399000,
    oldPrice: 650000,
    leadSummary: 'Xóa bỏ khoảng cách thế hệ nơi công sở: Thấu hiểu hệ giá trị khác biệt giữa Gen X, Millennials (Gen Y) và Gen Z, nghệ thuật giao tiếp tôn trọng và gắn kết sức mạnh tập thể.',
    industryContext: 'Lần đầu tiên trong lịch sử, công sở hiện đại có sự hiện diện đồng thời của 4 thế hệ; việc dung hòa và khai thác thế mạnh của từng thế hệ là năng lực lãnh đạo thiết yếu.',
    coreTopics: [
      'Đặc điểm tâm lý và bối cảnh lịch sử định hình các thế hệ: Baby Boomers, Gen X (Độc lập), Gen Y (Cầu tiến) và Gen Z (Công nghệ, Tự do)',
      'Nhận diện các điểm xung đột phổ biến: Quan điểm về giờ giấc làm việc, Phong cách phản hồi (Feedback) và Định nghĩa về sự trung thành',
      'Nghệ thuật giao tiếp xuyên thế hệ: Cách người trẻ trình bày ý tưởng thuyết phục sếp lớn tuổi và cách quản lý tạo động lực cho nhân sự Gen Z',
      'Xây dựng văn hóa học hỏi hai chiều (Reverse Mentoring): Người đi trước truyền thụ kinh nghiệm thực chiến, người trẻ chia sẻ xu hướng công nghệ số',
      'Hòa nhập môi trường làm việc đa văn hóa và tôn trọng sự đa dạng (Diversity, Equity & Inclusion - DEI)'
    ],
    handsOnProject: 'Xây dựng một bản thỏa thuận văn hóa làm việc nhóm (Team Working Agreement) dung hòa kỳ vọng giữa 3 thế hệ nhân sự trong một phòng ban kinh doanh.',
    targetAudience: 'Nhân sự trẻ mới đi làm, Quản lý nhóm có thành viên thuộc nhiều độ tuổi khác nhau, Chuyên viên nhân sự văn hóa doanh nghiệp.',
    careerApplication: 'Tự tin hòa nhập, làm việc ăn ý và thăng tiến nhanh chóng trong bất kỳ môi trường công sở đa dạng nào.',
    requirements: [
      'Tư duy cởi mở và không định kiến, dán nhãn tiêu cực lên các thế hệ khác',
      'Có trải nghiệm làm việc nhóm thực tế'
    ],
    benefits: [
      'Không còn cảm giác ức chế hay lạc lõng khi làm việc cùng đồng nghiệp khác biệt về độ tuổi',
      'Biết cách đối thoại khéo léo giúp các bên thấu hiểu và tôn trọng góc nhìn của nhau',
      'Tận dụng được sự nhạy bén công nghệ của người trẻ kết hợp với vốn sống dày dặn của thế hệ đi trước',
      'Tạo dựng môi trường làm việc hòa đồng, ấm áp và giàu năng lượng sáng tạo'
    ],
    techniques: ['Cross-generational Communication', 'DEI Principles', 'Reverse Mentoring', 'Conflict Resolution', 'Workplace Empathy', 'Team Cohesion'],
    documents: [
      'Bảng ma trận đối chiếu kỳ vọng và phong cách làm việc của Gen X, Gen Y và Gen Z',
      'Mẫu thỏa thuận văn hóa làm việc nhóm đa thế hệ (Team Charter Template)'
    ]
  },
  {
    title: 'Thiết Kế Cuộc Đời Đáng Sống (Designing Your Life) Theo Phương Pháp Đại Học Stanford',
    slug: 'thiet-ke-cuoc-doi-dang-song-designing-your-life-stanford',
    categorySlug: 'phat-trien-ban-than-va-ky-nang-mem',
    level: CourseLevel.INTERMEDIATE,
    price: 490000,
    oldPrice: 790000,
    leadSummary: 'Ứng dụng tư duy thiết kế để kiến tạo cuộc đời và sự nghiệp: Đánh giá la bàn cuộc sống, phác thảo 3 kế hoạch cuộc đời Odysseys và thử nghiệm các nguyên mẫu nghề nghiệp tương lai.',
    industryContext: 'Dựa trên khóa học nổi tiếng nhất tại Đại học Stanford của Bill Burnett và Dave Evans, phương pháp này giúp bạn thoát khỏi bế tắc và chủ động thiết kế một cuộc đời hạnh phúc, ý nghĩa.',
    coreTopics: [
      'Năm tư duy của nhà thiết kế cuộc đời: Tò mò (Curiosity), Thiên vị hành động (Bias to action), Tái định khung (Reframing), Nhận thức quy trình và Hợp tác cấp tiến',
      'Đánh giá la bàn cân bằng cuộc sống Dashboard: Sức khỏe (Health), Công việc (Work), Vui chơi (Play) và Tình yêu (Love)',
      'Nhật ký năng lượng tốt (Good Time Journal): Nhận diện các hoạt động mang lại trạng thái dòng chảy (Flow) và rút cạn năng lượng',
      'Phác thảo 3 kế hoạch cuộc đời 5 năm (Odyssey Plans): Kế hoạch hiện tại, Kế hoạch nếu phương án 1 biến mất, và Kế hoạch nếu không lo lắng về tiền bạc',
      'Tạo nguyên mẫu cuộc sống (Life Prototyping): Phỏng vấn trải nghiệm thực tế (Prototyping Conversations) trước khi quyết định chuyển ngành'
    ],
    handsOnProject: 'Vẽ trọn vẹn bản thiết kế 3 kế hoạch cuộc đời 5 năm Odyssey Plans cho tương lai của chính bạn và thực hiện 1 cuộc phỏng vấn nguyên mẫu với một người đang làm công việc bạn mơ ước.',
    targetAudience: 'Người đang cảm thấy mông lung, bế tắc trong công việc hiện tại, người chuẩn bị tốt nghiệp hoặc người muốn tái định vị cuộc đời ở tuổi 30, 40.',
    careerApplication: 'Tự tin lựa chọn con đường sự nghiệp phù hợp nhất với bản thân, sống một cuộc đời trọn vẹn và không hối tiếc.',
    requirements: [
      'Sự trung thực với chính bản thân về những mong muốn và nỗi sợ hãi',
      'Tâm thế sẵn sàng hành động thử nghiệm thay vì chỉ ngồi suy nghĩ'
    ],
    benefits: [
      'Thoát khỏi cảm giác mắc kẹt trong một công việc nhàm chán bằng các bước hành động thử nghiệm an toàn',
      'Nhìn thấy rõ ràng có nhiều phiên bản cuộc đời hạnh phúc khác nhau mà bạn hoàn toàn có thể theo đuổi',
      'Tái cân bằng giữa sự nghiệp, sức khỏe và các mối quan hệ yêu thương',
      'Định hình la bàn cuộc sống giúp bạn luôn đưa ra những quyết định nhất quán với giá trị cốt lõi'
    ],
    techniques: ['Designing Your Life', 'Odyssey Planning', 'Life Dashboard', 'Prototyping Conversations', 'Bias to Action', 'Good Time Journal'],
    documents: [
      'Bộ tài liệu phác thảo 3 kế hoạch cuộc đời Odyssey Plans chuẩn Stanford',
      'Mẫu nhật ký theo dõi năng lượng và trạng thái dòng chảy Good Time Journal'
    ]
  }
]
