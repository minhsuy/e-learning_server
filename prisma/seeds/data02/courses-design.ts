import { CourseLevel } from '@prisma/client'
import { CourseBlueprint } from './categories-data'

export const COURSES_DESIGN: readonly CourseBlueprint[] = [
  // ==========================================
  // CAT-09: Thiết kế UI/UX & Sản phẩm số (20 courses)
  // Quota: 6 BEGINNER, 9 INTERMEDIATE, 5 ADVANCED | 2 FREE, 18 PAID
  // ==========================================
  {
    title: 'Nhập Môn Thiết Kế UI/UX: Tư Duy Trải Nghiệm & Thành Thạo Figma Từ Cơ Bản',
    slug: 'nhap-mon-thiet-ke-ui-ux-tu-duy-trai-nghiem-thanh-thao-figma-tu-co-ban',
    categorySlug: 'thiet-ke-ui-ux-va-san-pham-so',
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0,
    leadSummary: 'Làm quen với tư duy thiết kế trải nghiệm người dùng (UX) và thành thạo công cụ thiết kế giao diện số một thế giới Figma từ các thao tác cơ bản nhất.',
    industryContext: 'Mọi ứng dụng di động và website thành công đều bắt đầu từ một trải nghiệm người dùng mượt mà và giao diện trực quan, thân thiện.',
    coreTopics: [
      'Khái niệm phân biệt giữa UI (User Interface) và UX (User Experience) trong sản phẩm số',
      'Quy trình thiết kế lấy người dùng làm trung tâm (User-Centered Design Process)',
      'Làm quen giao diện và công cụ Figma: Frames, Shapes, Pen Tool, Text và Vector networks',
      'Nguyên lý thị giác căn bản: Khoảng trắng (White space), Phân cấp thị giác (Hierarchy), Màu sắc và Typography',
      'Tạo Wireframe độ nét thấp (Low-Fidelity Wireframes) và chuyển thành Mockup trực quan'
    ],
    handsOnProject: 'Thiết kế giao diện ứng dụng quản lý chi tiêu cá nhân đơn giản với 5 màn hình tương tác cơ bản trên Figma.',
    targetAudience: 'Người mới bắt đầu chuyển ngành sang thiết kế, sinh viên thiết kế hoặc lập trình viên muốn tự làm giao diện đẹp.',
    careerApplication: 'Đặt nền móng vững chắc cho lộ trình trở thành UI/UX Designer chuyên nghiệp.',
    requirements: [
      'Máy tính kết nối Internet có thể chạy trình duyệt web hoặc ứng dụng Figma Desktop',
      'Không đòi hỏi năng khiếu vẽ tay hay kiến thức mỹ thuật trước đó'
    ],
    benefits: [
      'Sử dụng thành thạo các tính năng cơ bản của Figma trong thiết kế sản phẩm số',
      'Hiểu rõ lý do vì sao một giao diện hoạt động hiệu quả hoặc gây khó chịu cho người dùng',
      'Biết cách sắp xếp bố cục trang web và ứng dụng cân đối, khoa học',
      'Tạo ra bản thiết kế đầu tay hoàn chỉnh để bắt đầu xây dựng Portfolio'
    ],
    techniques: ['Figma', 'UI Design', 'UX Design', 'Wireframing', 'Visual Hierarchy', 'Typography'],
    documents: [
      'Bảng thuật ngữ UI/UX song ngữ Anh - Việt thông dụng',
      'Bộ khung Wireframe mẫu và bảng màu chuẩn dành cho người mới bắt đầu'
    ]
  },
  {
    title: 'Nghiên Cứu Người Dùng (UX Research) & Xây Dựng Bản Đồ Hành Trình Khách Hàng',
    slug: 'nghien-cuu-nguoi-dung-ux-research-xay-dung-ban-do-hanh-trinh-khach-hang',
    categorySlug: 'thiet-ke-ui-ux-va-san-pham-so',
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0,
    leadSummary: 'Làm chủ các phương pháp phỏng vấn, khảo sát, quan sát người dùng để thấu hiểu nỗi đau (pain points) và vẽ nên bản đồ hành trình trải nghiệm chân thực.',
    industryContext: 'Thiết kế mà không nghiên cứu người dùng cũng giống như bắn tên trong bóng tối; UX Research giúp doanh nghiệp tránh lãng phí hàng tỷ đồng phát triển sai tính năng.',
    coreTopics: [
      'Các phương pháp nghiên cứu định tính và định lượng: Phỏng vấn sâu, Khảo sát, Usability Testing',
      'Xây dựng chân dung người dùng mục tiêu (User Persona) dựa trên dữ liệu thực tế',
      'Phân tích ma trận đồng cảm (Empathy Map) và xác định đúng vấn đề cốt lõi cần giải quyết',
      'Thiết lập Bản đồ hành trình người dùng (Customer Journey Map - CJM)',
      'Tổng hợp phát hiện nghiên cứu thành tài liệu bàn giao chiến lược (Insights Deck)'
    ],
    handsOnProject: 'Thực hiện nghiên cứu UX hoàn chỉnh cho người dùng mua sắm nông sản trực tuyến và đề xuất giải pháp cải tiến quy trình đặt hàng.',
    targetAudience: 'UX Researcher, Product Owner, UI Designer muốn đào sâu kỹ năng đồng cảm và nghiên cứu hành vi.',
    careerApplication: 'Tự tin dẫn dắt các buổi phỏng vấn người dùng và thuyết phục các bên liên quan bằng bằng chứng nghiên cứu.',
    requirements: [
      'Tư duy tò mò, cởi mở và mong muốn thấu hiểu tâm lý con người',
      'Kỹ năng lắng nghe và ghi chép thông tin cơ bản'
    ],
    benefits: [
      'Thiết kế bảng câu hỏi phỏng vấn khách quan, tránh đặt câu hỏi mớm cung (Leading Questions)',
      'Vẽ bản đồ hành trình người dùng trực quan thể hiện rõ cảm xúc qua từng điểm chạm',
      'Phát hiện chính xác nút thắt cổ chai khiến người dùng từ bỏ sản phẩm',
      'Định hình lộ trình tính năng (Product Roadmap) dựa trên nhu cầu thực sự của người dùng'
    ],
    techniques: ['UX Research', 'User Persona', 'Customer Journey Map', 'Empathy Map', 'Usability Testing'],
    documents: [
      'Mẫu kịch bản phỏng vấn người dùng theo từng giai đoạn sản phẩm',
      'Template Customer Journey Map và User Persona trên công cụ FigJam'
    ]
  },
  {
    title: 'Làm Chủ Figma Nâng Cao: Auto Layout, Components, Variants & Variables',
    slug: 'lam-chu-figma-nang-cao-auto-layout-components-variants-variables',
    categorySlug: 'thiet-ke-ui-ux-va-san-pham-so',
    level: CourseLevel.BEGINNER,
    price: 499000,
    oldPrice: 799000,
    leadSummary: 'Nâng tầm kỹ năng Figma lên mức chuyên nghiệp với hệ thống Auto Layout đáp ứng mọi kích thước màn hình, Components đa biến thể và Figma Variables hiện đại.',
    industryContext: 'Figma liên tục cập nhật các tính năng mạnh mẽ mô phỏng logic lập trình, giúp các nhà thiết kế tạo ra các bản mẫu linh hoạt và bàn giao code chuẩn xác.',
    coreTopics: [
      'Làm chủ Auto Layout đa tầng: Resizing (Fixed, Hug, Fill), Gap, Padding và Absolute Position',
      'Tư duy đóng gói Component, Instance, Component Properties (Boolean, Text, Instance Swap)',
      'Tạo tổ hợp Component Variants với ma trận trạng thái (Hover, Active, Disabled, Error)',
      'Ứng dụng Figma Variables cho hệ màu (Color), khoảng cách (Spacing), số học và chuỗi',
      'Tạo chế độ Dark Mode / Light Mode và đa ngôn ngữ tự động chỉ bằng một cú nhấp chuột'
    ],
    handsOnProject: 'Xây dựng bộ thư viện UI Kit hoàn chỉnh gồm Button, Input, Dropdown, Modal và Card có khả năng co giãn hoàn hảo theo mọi khung hình.',
    targetAudience: 'UI/UX Designer đã biết Figma cơ bản muốn tăng tốc độ làm việc gấp 3 lần và chuyên nghiệp hóa quy trình thiết kế.',
    careerApplication: 'Đáp ứng tiêu chuẩn kỹ năng của các công ty công nghệ quốc tế và agency thiết kế hàng đầu.',
    requirements: [
      'Đã nắm được các công cụ cơ bản của Figma (Frame, Rectangle, Text, Vector)',
      'Hiểu biết tổng quan về thiết kế giao diện ứng dụng web/mobile'
    ],
    benefits: [
      'Xây dựng các thành phần giao diện co giãn thông minh không bị méo mó khi đổi nội dung',
      'Quản lý hệ thống Variables giúp chuyển đổi giao diện sáng/tối trong tích tắc',
      'Giảm thiểu tối đa lỗi sai lệch kích thước và màu sắc trong các dự án lớn',
      'Tạo lập các Component linh hoạt có khả năng tái sử dụng xuyên suốt toàn công ty'
    ],
    techniques: ['Figma', 'Auto Layout', 'Variants', 'Figma Variables', 'UI Kit', 'Responsive Design'],
    documents: [
      'File Figma mẫu thực hành Auto Layout từ cơ bản đến phức tạp',
      'Bộ sưu tập hơn 100 thành phần UI Components chuẩn quốc tế có thể tái sử dụng ngay'
    ]
  },
  {
    title: 'Kiến Trúc Thông Tin (Information Architecture) & Thiết Kế Luồng Người Dùng (User Flow)',
    slug: 'kien-truc-thong-tin-information-architecture-thiet-ke-luong-nguoi-dung-user-flow',
    categorySlug: 'thiet-ke-ui-ux-va-san-pham-so',
    level: CourseLevel.BEGINNER,
    price: 390000,
    oldPrice: 650000,
    leadSummary: 'Học cách phân loại, tổ chức nội dung và xây dựng sơ đồ trang (Sitemap) cùng luồng người dùng (User Flow) tối ưu, giúp khách hàng tìm kiếm thông tin dễ dàng.',
    industryContext: 'Một website có giao diện đẹp mắt đến đâu cũng trở nên vô dụng nếu người dùng bị lạc lối và không thể tìm thấy nút thanh toán hoặc thông tin họ cần.',
    coreTopics: [
      'Các nguyên lý của Kiến trúc Thông tin (Information Architecture - IA) trong sản phẩm số',
      'Kỹ thuật phân loại nội dung: Card Sorting (Open, Closed, Hybrid) và Tree Testing',
      'Xây dựng sơ đồ trang web (Sitemap) rõ ràng, khoa học và phân cấp hợp lý',
      'Vẽ luồng người dùng (User Flow, Task Flow, Wireflow) chi tiết bao gồm các nhánh rẽ và trường hợp ngoại lệ (Edge Cases)',
      'Tối ưu hóa các điểm nút ra quyết định để giảm thiểu tải nhận thức (Cognitive Load)'
    ],
    handsOnProject: 'Tái cấu trúc toàn bộ kiến trúc thông tin và luồng đặt khám chữa bệnh trực tuyến cho một ứng dụng y tế phức tạp.',
    targetAudience: 'UI/UX Designer, Product Manager, Business Analyst muốn làm chủ kỹ năng cấu trúc sản phẩm.',
    careerApplication: 'Nâng cao khả năng hoạch định cấu trúc sản phẩm quy mô lớn, tránh việc phát triển chắp vá.',
    requirements: [
      'Không yêu cầu kỹ năng đồ họa phức tạp, chỉ cần tư duy tổ chức thông tin logic',
      'Có thói quen sử dụng nhiều ứng dụng web và di động hàng ngày'
    ],
    benefits: [
      'Tổ chức cấu trúc menu và điều hướng giúp người dùng tìm thấy thứ họ muốn trong tối đa 3 lần bấm',
      'Sử dụng phương pháp Card Sorting để kiểm chứng cách người dùng thực sự phân loại thông tin',
      'Vẽ User Flow chi tiết bao quát toàn bộ các kịch bản thành công và kịch bản lỗi',
      'Giao tiếp hiệu quả với lập trình viên và Product Manager thông qua sơ đồ luồng chuẩn xác'
    ],
    techniques: ['Information Architecture', 'User Flow', 'Sitemap', 'Card Sorting', 'Tree Testing', 'Cognitive Load'],
    documents: [
      'Bộ ký hiệu quy chuẩn để vẽ User Flow và Wireflow chuyên nghiệp',
      'Bảng checklist kiểm tra tính logic của kiến trúc thông tin trước khi lên giao diện'
    ]
  },
  {
    title: 'Tâm Lý Học Trong Thiết Kế Trải Nghiệm (UX Psychology) & Mô Hình Hành Vi',
    slug: 'tam-ly-hoc-trong-thiet-ke-trai-nghiem-ux-psychology-mo-hinh-hanh-vi',
    categorySlug: 'thiet-ke-ui-ux-va-san-pham-so',
    level: CourseLevel.BEGINNER,
    price: 450000,
    oldPrice: 720000,
    leadSummary: 'Khám phá các quy luật tâm lý học nhận thức kinh điển (Hick, Fitts, Miller, Jakob) và ứng dụng các hiệu ứng tâm lý để tăng cường tương tác và giữ chân người dùng.',
    industryContext: 'Thiết kế xuất sắc là sự thấu hiểu sâu sắc cách bộ não con người xử lý thông tin, ghi nhớ và đưa ra quyết định hành động trong tiềm thức.',
    coreTopics: [
      'Các quy luật thiết kế kinh điển: Định luật Hick, Fitts, Miller, Jakob và Luật đóng kín Gestalt',
      'Mô hình hành vi Hook Model của Nir Eyal: Trigger, Action, Variable Reward và Investment',
      'Hiệu ứng tâm lý trong mua sắm: Sự khan hiếm (Scarcity), Bằng chứng xã hội (Social Proof), Mỏ neo giá (Anchoring)',
      'Nhận diện và tránh xa các thủ thuật đánh lừa người dùng (Dark Patterns / Deceptive Design)',
      'Nguyên lý đạo đức trong thiết kế sản phẩm công nghệ'
    ],
    handsOnProject: 'Phân tích và cải tạo giao diện trang thanh toán của sàn thương mại điện tử để gia tăng tỷ lệ chuyển đổi (Conversion Rate) dựa trên tâm lý học hành vi.',
    targetAudience: 'UI/UX Designer, Growth Hacker, Digital Marketer và Product Builder.',
    careerApplication: 'Giải thích và bảo vệ các quyết định thiết kế của mình trước ban giám đốc bằng các luận điểm khoa học vững chắc.',
    requirements: [
      'Tò mò về tâm lý con người và hành vi tiêu dùng',
      'Đã có trải nghiệm sử dụng các sản phẩm công nghệ phổ biến'
    ],
    benefits: [
      'Áp dụng các định luật Gestalt để nhóm thông tin một cách tự nhiên và dễ hiểu nhất',
      'Tận dụng hiệu ứng tâm lý tích cực để gia tăng mức độ gắn bó của khách hàng với sản phẩm',
      'Phát hiện và loại bỏ các bẫy Dark Patterns gây mất niềm tin của người dùng',
      'Nâng cao tỷ lệ chuyển đổi mà vẫn duy trì trải nghiệm người dùng nhân văn, bền vững'
    ],
    techniques: ['UX Psychology', 'Gestalt Principles', 'Hook Model', 'Behavioral Economics', 'Conversion Optimization'],
    documents: [
      'Sổ tay bỏ túi tổng hợp 30 quy luật tâm lý học ứng dụng trong thiết kế UI/UX',
      'Bộ thẻ bài UX Psychology Flashcards phục vụ việc đối chiếu khi thiết kế'
    ]
  },
  {
    title: 'Kiểm Thử Khả Năng Sử Dụng (Usability Testing) & Tối Ưu Tỷ Lệ Chuyển Đổi CRO',
    slug: 'kiem-thu-kha-nang-su-dung-usability-testing-toi-uu-ty-le-chuyen-doi-cro',
    categorySlug: 'thiet-ke-ui-ux-va-san-pham-so',
    level: CourseLevel.BEGINNER,
    price: 420000,
    oldPrice: 690000,
    leadSummary: 'Tổ chức các buổi kiểm thử khả năng sử dụng (Usability Testing) bài bản, phát hiện lỗi trải nghiệm người dùng và đo lường các chỉ số SUS, NPS, Task Success Rate.',
    industryContext: 'Đưa sản phẩm ra thị trường mà không qua Usability Testing là canh bạc rủi ro; chỉ cần thử nghiệm trên 5 người dùng đã giúp bạn phát hiện đến 85% lỗi trải nghiệm.',
    coreTopics: [
      'Các hình thức Usability Testing: Có điều phối (Moderated) vs Tự thực hiện (Unmoderated), Trực tiếp vs Từ xa',
      'Soạn thảo kế hoạch kiểm thử, bộ nhiệm vụ (Tasks) và bảng câu hỏi đánh giá',
      'Kỹ thuật Think-Aloud Protocol giúp lắng nghe suy nghĩ thầm kín của người dùng khi thao tác',
      'Đo lường định lượng trải nghiệm: Thang đo SUS (System Usability Scale), Time-on-Task và Success Rate',
      'Phân tích kết quả kiểm thử, xếp hạng độ nghiêm trọng của lỗi và đề xuất kế hoạch khắc phục'
    ],
    handsOnProject: 'Thực hiện buổi Usability Testing từ xa với 5 người dùng thực tế trên bản mẫu Figma của tính năng đăng ký khóa học và viết báo cáo đánh giá.',
    targetAudience: 'UI/UX Designer, QA Specialist, Product Owner mong muốn đo lường chất lượng trải nghiệm định lượng.',
    careerApplication: 'Tự tin dẫn dắt quy trình đảm bảo chất lượng trải nghiệm người dùng trong doanh nghiệp.',
    requirements: [
      'Có khả năng tạo bản mẫu tương tác Prototype cơ bản trên Figma',
      'Kỹ năng quan sát khách quan, không can thiệp vào hành động của người tham gia thử nghiệm'
    ],
    benefits: [
      'Xây dựng các kịch bản thử nghiệm chân thực phản ánh đúng hoàn cảnh sử dụng',
      'Tính toán chính xác điểm số SUS để so sánh độ tiện dụng của sản phẩm với tiêu chuẩn ngành',
      'Lọc ra những lỗi trải nghiệm chí mạng khiến khách hàng bỏ dở giao dịch',
      'Cải thiện tỷ lệ chuyển đổi thanh toán dựa trên số liệu thực chứng'
    ],
    techniques: ['Usability Testing', 'SUS Score', 'Think-Aloud Protocol', 'CRO', 'Product Analytics'],
    documents: [
      'Biểu mẫu thỏa thuận tham gia thử nghiệm và cam kết bảo mật thông tin',
      'File Excel tự động tính điểm System Usability Scale (SUS) và biểu đồ phân tích'
    ]
  },
  {
    title: 'Xây Dựng Hệ Thống Thiết Kế (Design System) Chuyên Nghiệp Trên Figma & Token Studio',
    slug: 'xay-dung-he-thong-thiet-ke-design-system-chuyen-nghiep-tren-figma-token-studio',
    categorySlug: 'thiet-ke-ui-ux-va-san-pham-so',
    level: CourseLevel.INTERMEDIATE,
    price: 699000,
    oldPrice: 1100000,
    leadSummary: 'Làm chủ nghệ thuật xây dựng Design System quy mô doanh nghiệp từ triết lý Atomic Design, Design Tokens đến quản trị đồng bộ giữa đội ngũ Thiết kế và Lập trình.',
    industryContext: 'Design System là tài sản cốt lõi của các công ty công nghệ lớn, giúp hàng trăm nhà thiết kế và kỹ sư phát triển sản phẩm với tốc độ nhanh và tính nhất quán tuyệt đối.',
    coreTopics: [
      'Nguyên lý Atomic Design: Atoms, Molecules, Organisms, Templates và Pages',
      'Quy chuẩn hóa nền tảng: Typography Scale, Color Palette, Spacing Grid, Elevation và Corner Radius',
      'Quản lý Design Tokens nâng cao với plugin Tokens Studio (Figma Tokens) và đồng bộ qua GitHub',
      'Thiết kế thư viện linh kiện toàn diện: Buttons, Forms, Navigation, Feedback và Data Display',
      'Quy trình vận hành, phiên bản hóa (Versioning), tài liệu hóa bằng Zeroheight / Storybook và đào tạo đội ngũ'
    ],
    handsOnProject: 'Xây dựng trọn vẹn một Design System đa nền tảng (Web & Mobile) hoàn chỉnh phục vụ cho một hệ sinh thái Fintech gồm 3 sản phẩm.',
    targetAudience: 'Mid/Senior UI/UX Designer, Lead Designer, Design System Engineer.',
    careerApplication: 'Nâng tầm giá trị chuyên môn, mở ra cơ hội đảm nhận vị trí Design System Specialist với mức thu nhập cao.',
    requirements: [
      'Thành thạo các tính năng nâng cao của Figma (Auto Layout, Components, Variants)',
      'Hiểu biết cơ bản về cách hoạt động của CSS (Box model, Flexbox, CSS Variables)'
    ],
    benefits: [
      'Thiết lập cấu trúc Design Tokens chuẩn hóa giúp xuất code trực tiếp cho lập trình viên',
      'Bảo đảm tính đồng bộ 100% về mặt hình ảnh trên tất cả các nền tảng Web, iOS, Android',
      'Rút ngắn thời gian thiết kế tính năng mới từ vài tuần xuống còn vài ngày',
      'Tài liệu hóa quy định sử dụng linh kiện rõ ràng, giúp nhân sự mới hòa nhập tức thì'
    ],
    techniques: ['Design System', 'Design Tokens', 'Atomic Design', 'Tokens Studio', 'Storybook', 'Figma Libraries'],
    documents: [
      'Bộ tài liệu hướng dẫn quy chuẩn đặt tên Design Tokens (Naming Convention Guideline)',
      'File Figma Starter Kit Design System bao gồm đầy đủ nền tảng màu sắc và kiểu chữ'
    ]
  },
  {
    title: 'Tạo Bản Mẫu Tương Tác Cao Cấp (Advanced Prototyping) & Micro-Interactions Với Protopie & Figma',
    slug: 'tao-ban-mau-tuong-tac-cao-cap-advanced-prototyping-micro-interactions-voi-protopie-figma',
    categorySlug: 'thiet-ke-ui-ux-va-san-pham-so',
    level: CourseLevel.INTERMEDIATE,
    price: 620000,
    oldPrice: 950000,
    leadSummary: 'Biến các bản thiết kế tĩnh thành các bản mẫu tương tác sống động như ứng dụng thật bằng Smart Animate trong Figma và công cụ mạnh mẽ ProtoPie.',
    industryContext: 'Một bản mẫu tương tác mượt mà có giá trị hơn hàng ngàn lời giải thích, giúp khách hàng và nhà đầu tư trải nghiệm trực quan trước khi viết dòng code nào.',
    coreTopics: [
      'Smart Animate trong Figma: Matching Layers, State Transitions và xử lý đường cong chuyển động Easing Curves',
      'Sử dụng Interactive Components trong Figma để tạo các tương tác nội tại mượt mà',
      'Chuyển giao sang ProtoPie: Mô hình Trigger, Response và Container',
      'Tạo logic nâng cao trong ProtoPie: Biến số (Variables), Biểu thức (Formulas) và Điều kiện rẽ nhánh (Conditions)',
      'Mô phỏng cảm biến phần cứng: Camera, Con quay hồi chuyển (Gyroscope), Nhập liệu bàn phím và Giọng nói'
    ],
    handsOnProject: 'Tạo bản mẫu tương tác ứng dụng ngân hàng số có hiệu ứng chuyển tiền FaceID, nhập mã PIN động và biểu đồ chi tiêu tương tác.',
    targetAudience: 'UI/UX Designer, Interaction Designer muốn đưa kỹ năng tương tác và chuyển động lên chuẩn quốc tế.',
    careerApplication: 'Gây ấn tượng mạnh mẽ với nhà tuyển dụng và khách hàng quốc tế qua những bản prototype đỉnh cao.',
    requirements: [
      'Sử dụng thành thạo Figma cơ bản và Auto Layout',
      'Tư duy logic về luồng tương tác và tính kiên nhẫn khi tinh chỉnh chuyển động'
    ],
    benefits: [
      'Tạo ra các vi tương tác (Micro-interactions) tinh tế nâng tầm cảm xúc của người dùng',
      'Mô phỏng chân thực các tính năng phức tạp có lưu trữ biến số mà không cần lập trình',
      'Kiểm thử người dùng chính xác hơn nhờ bản mẫu có phản hồi y hệt ứng dụng thật',
      'Xuất thông số chuyển động chính xác hỗ trợ lập trình viên hiện thực hóa trên code'
    ],
    techniques: ['ProtoPie', 'Figma Smart Animate', 'Micro-interactions', 'Advanced Prototyping', 'Easing Curves'],
    documents: [
      'Bảng thông số đường cong chuyển động Cubic-Bezier thông dụng cho ứng dụng mượt mà',
      'File mẫu ProtoPie thực hành các bài toán tương tác phức tạp (Cart, Search, Login)'
    ]
  },
  {
    title: 'Thiết Kế Ứng Dụng Di Động: Nắm Vững Chuẩn Human Interface Guidelines (iOS) & Material Design 3 (Android)',
    slug: 'thiet-ke-ung-dung-di-dong-human-interface-guidelines-material-design-3',
    categorySlug: 'thiet-ke-ui-ux-va-san-pham-so',
    level: CourseLevel.INTERMEDIATE,
    price: 580000,
    oldPrice: 890000,
    leadSummary: 'Làm chủ triết lý và quy chuẩn thiết kế ứng dụng di động chính thức của Apple (HIG) và Google (Material You / M3), thích ứng hoàn hảo với từng hệ điều hành.',
    industryContext: 'Vi phạm các nguyên tắc giao diện của Apple hay Google sẽ khiến ứng dụng của bạn bị từ chối duyệt lên App Store và gây bối rối cho người dùng nền tảng đó.',
    coreTopics: [
      'Tổng quan hệ sinh thái di động: Phân biệt thói quen sử dụng của người dùng iOS và Android',
      'Khám phá chuyên sâu Apple Human Interface Guidelines: Dynamic Island, Navigation Bar, Tab Bar, Sheets, Safe Area',
      'Làm chủ Google Material Design 3 (Material You): Dynamic Color, Bottom Navigation, FAB (Floating Action Button)',
      'Thiết kế giao diện đáp ứng (Adaptive Layout) cho iPhone, iPad, điện thoại Android và máy tính bảng gập',
      'Quy chuẩn kích thước vùng chạm (Touch Targets), tỷ lệ tương phản chữ và khả năng tiếp cận (Accessibility)'
    ],
    handsOnProject: 'Chuyển đổi một bản thiết kế ứng dụng giao đồ ăn từ phiên bản iOS chuẩn mực sang phiên bản Material Design 3 trên Android.',
    targetAudience: 'UI/UX Designer đang thiết kế app di động hoặc lập trình viên Mobile muốn trau chuốt thẩm mỹ sản phẩm.',
    careerApplication: 'Tự tin thiết kế ứng dụng di động chuẩn Native cho các dự án quy mô toàn cầu.',
    requirements: [
      'Thành thạo công cụ Figma',
      'Sở hữu hoặc thường xuyên sử dụng ít nhất một thiết bị di động thông minh'
    ],
    benefits: [
      'Tránh các sai sót ngớ ngẩn khi bê nguyên xi giao diện iOS sang Android hoặc ngược lại',
      'Tận dụng triệt để các linh kiện hệ thống có sẵn của Apple và Google để tiết kiệm công sức lập trình',
      'Đảm bảo ứng dụng vượt qua mọi vòng kiểm duyệt khắt khe của App Store và Google Play',
      'Mang lại trải nghiệm quen thuộc, thân thiện nhất cho người dùng trên từng thiết bị'
    ],
    techniques: ['iOS Design', 'Human Interface Guidelines', 'Material Design 3', 'Mobile UX', 'Accessibility'],
    documents: [
      'Bảng đối chiếu linh kiện song song giữa iOS HIG và Android Material 3',
      'File UI Kit chuẩn chính hãng Apple HIG và Material Design 3 cho Figma'
    ]
  },
  {
    title: 'Thiết Kế Web Thương Mại Điện Tử Chuyển Đổi Cao (E-Commerce UX Optimization)',
    slug: 'thiet-ke-web-thuong-mai-dien-tu-chuyen-doi-cao-ecommerce-ux-optimization',
    categorySlug: 'thiet-ke-ui-ux-va-san-pham-so',
    level: CourseLevel.INTERMEDIATE,
    price: 650000,
    oldPrice: 990000,
    leadSummary: 'Tối ưu hóa từng điểm chạm trên website thương mại điện tử: Trang chủ, Trang danh mục, Chi tiết sản phẩm (PDP), Giỏ hàng và Luồng thanh toán Checkout không ma sát.',
    industryContext: 'Trong thương mại điện tử, việc cải thiện chỉ 0.5% tỷ lệ chuyển đổi giỏ hàng có thể mang lại thêm hàng trăm triệu đến hàng tỷ đồng doanh thu mỗi tháng.',
    coreTopics: [
      'Giải mã hành trình mua sắm trực tuyến: Khám phá, Tìm kiếm, Đánh giá, Ra quyết định và Thanh toán',
      'Thiết kế trang danh mục sản phẩm (PLP): Bộ lọc đa tiêu chí (Faceted Search), sắp xếp và hiển thị biến thể',
      'Tối ưu hóa trang chi tiết sản phẩm (PDP): Hình ảnh sản phẩm, mô tả thông minh, nút Mua ngay và niềm tin xã hội',
      'Thiết kế trang giỏ hàng và thanh toán (Checkout UX): Thanh toán một bước (One-page Checkout), thanh toán khách (Guest Checkout)',
      'Tối ưu hóa trải nghiệm mua sắm trên thiết bị di động (Mobile Commerce / m-Commerce)'
    ],
    handsOnProject: 'Tái thiết kế toàn bộ luồng mua sắm và thanh toán cho một thương hiệu thời trang trực tuyến hướng tới tăng 25% tỷ lệ hoàn tất đơn hàng.',
    targetAudience: 'UI/UX Designer, E-commerce Specialist, Nhà sáng lập thương hiệu D2C và Growth Marketer.',
    careerApplication: 'Trở thành chuyên gia thiết kế E-commerce được các nhãn hàng và sàn bán lẻ săn đón.',
    requirements: [
      'Hiểu biết cơ bản về mô hình kinh doanh bán lẻ và thiết kế giao diện web',
      'Có kinh nghiệm mua sắm trực tuyến trên các nền tảng như Shopee, Tiki, Amazon'
    ],
    benefits: [
      'Nắm bắt các nguyên tắc thiết kế trang sản phẩm giúp gia tăng quyết định bỏ vào giỏ hàng',
      'Loại bỏ các rào cản tâm lý khiến khách hàng bỏ rơi giỏ hàng trong quá trình thanh toán',
      'Thiết kế bộ lọc tìm kiếm sản phẩm thông minh, tiện dụng ngay cả trên màn hình điện thoại nhỏ',
      'Áp dụng các tiêu chuẩn thiết kế E-commerce hàng đầu thế giới từ Baymard Institute'
    ],
    techniques: ['E-Commerce UX', 'CRO', 'Checkout Flow', 'PDP Optimization', 'Mobile Commerce', 'Baymard Standards'],
    documents: [
      'Bảng kiểm tra 80 tiêu chuẩn UX E-commerce chuẩn Baymard Institute',
      'File Figma thiết kế mẫu các luồng Checkout tối ưu cho thị trường Việt Nam'
    ]
  },
  {
    title: 'Thiết Kế Khả Năng Tiếp Cận (Accessibility - WCAG 2.2) Cho Sản Phẩm Số',
    slug: 'thiet-ke-kha-nang-tiep-can-accessibility-wcag-22-cho-san-pham-so',
    categorySlug: 'thiet-ke-ui-ux-va-san-pham-so',
    level: CourseLevel.INTERMEDIATE,
    price: 490000,
    oldPrice: 790000,
    leadSummary: 'Thiết kế sản phẩm số hòa nhập, thân thiện với người khuyết tật và người cao tuổi tuân thủ bộ tiêu chuẩn quốc tế WCAG 2.2 cấp độ AA.',
    industryContext: 'Hơn 1 tỷ người trên thế giới gặp các khó khăn về thị giác, thính giác hoặc vận động; tuân thủ Accessibility là yêu cầu pháp lý bắt buộc tại nhiều quốc gia.',
    coreTopics: [
      'Khái niệm Accessibility (a11y) và các dạng khuyết tật: Thị giác, Thính giác, Vận động và Nhận thức',
      'Bộ tiêu chuẩn WCAG 2.2: 4 nguyên tắc cốt lõi POUR (Perceivable, Operable, Understandable, Robust)',
      'Độ tương phản màu sắc (Color Contrast Ratio): Tiêu chuẩn 4.5:1 cho chữ thường và 3:1 cho chữ lớn',
      'Thiết kế cho người mù màu (Color Blindness): Các dạng khiếm sắc và kỹ thuật dùng Icon/Pattern bổ trợ',
      'Hỗ trợ điều hướng bằng bàn phím (Keyboard Navigation), Focus State và trình đọc màn hình (Screen Readers)'
    ],
    handsOnProject: 'Thực hiện kiểm toán khả năng tiếp cận (Accessibility Audit) cho một cổng dịch vụ công trực tuyến và tái thiết kế đạt chuẩn WCAG AA.',
    targetAudience: 'Product Designer, Frontend Developer mong muốn xây dựng sản phẩm công nghệ nhân văn, bao trùm.',
    careerApplication: 'Kỹ năng thiết yếu để làm việc với các khách hàng và thị trường phát triển như Mỹ, Châu Âu, Úc.',
    requirements: [
      'Đã có kiến thức nền tảng về thiết kế UI trên Figma',
      'Tâm thế quan tâm đến trách nhiệm xã hội của người làm sản phẩm số'
    ],
    benefits: [
      'Sử dụng các công cụ kiểm tra độ tương phản màu sắc chuyên nghiệp ngay trong quy trình thiết kế',
      'Thiết kế các trạng thái Focus rõ ràng, hỗ trợ hoàn hảo cho việc điều hướng bằng phím Tab',
      'Đảm bảo sản phẩm của công ty không vướng phải các vụ kiện pháp lý về vi phạm luật người khuyết tật (ADA)',
      'Gia tăng lượng người dùng tiềm năng bằng cách mở rộng khả năng tiếp cận cho mọi đối tượng'
    ],
    techniques: ['Accessibility', 'WCAG 2.2', 'a11y', 'Color Contrast', 'Screen Reader Support', 'Inclusive Design'],
    documents: [
      'Cẩm nang tóm tắt bộ tiêu chuẩn WCAG 2.2 cấp độ A & AA dành cho Designer',
      'Bộ plugin Figma khuyến nghị phục vụ kiểm tra khiếm thị và tương phản màu sắc'
    ]
  },
  {
    title: 'Thiết Kế Ứng Dụng Doanh Nghiệp Phức Tạp (B2B SaaS & Enterprise UX)',
    slug: 'thiet-ke-ung-dung-doanh-nghiep-phuc-tap-b2b-saas-enterprise-ux',
    categorySlug: 'thiet-ke-ui-ux-va-san-pham-so',
    level: CourseLevel.INTERMEDIATE,
    price: 750000,
    oldPrice: 1190000,
    leadSummary: 'Giải quyết các bài toán thiết kế phần mềm quản trị doanh nghiệp đồ sộ: Bảng dữ liệu lớn (Data Tables), Phân quyền phức tạp, Báo cáo phân tích và Biểu mẫu nhiều bước.',
    industryContext: 'Thị trường phần mềm B2B SaaS đang bùng nổ, kéo theo nhu cầu khổng lồ về các nhà thiết kế có khả năng đơn giản hóa những nghiệp vụ rối rắm thành giao diện mạch lạc.',
    coreTopics: [
      'Sự khác biệt cốt lõi giữa sản phẩm B2C (Cảm xúc, tốc độ) và B2B (Hiệu suất làm việc, độ chính xác)',
      'Thiết kế bảng dữ liệu chuyên sâu (Data Tables): Sắp xếp, Lọc nhiều tầng, Đóng băng cột, Chỉnh sửa trực tiếp (Inline Edit) và Xuất dữ liệu',
      'Xử lý biểu mẫu nhập liệu đồ sộ (Complex Forms): Phân nhóm thông tin, Validation thời gian thực và Lưu tự động',
      'Quản lý phân quyền người dùng phức tạp (RBAC - Role-Based Access Control) trên giao diện',
      'Thiết kế Dashboard hiển thị chỉ số kinh doanh trực quan với biểu đồ tương tác'
    ],
    handsOnProject: 'Thiết kế trọn vẹn phân hệ quản trị nhân sự và bảng tính lương tự động cho một hệ thống ERP doanh nghiệp với 2000 nhân viên.',
    targetAudience: 'UI/UX Designer, Product Designer đang làm việc tại các công ty phần mềm SaaS hoặc doanh nghiệp chuyển đổi số.',
    careerApplication: 'Trở thành Product Designer dày dặn kinh nghiệm giải quyết các bài toán nghiệp vụ phức tạp trị giá cao.',
    requirements: [
      'Có tư duy logic phân tích quy trình nghiệp vụ',
      'Thành thạo công cụ Figma và các nguyên lý thiết kế giao diện cơ bản'
    ],
    benefits: [
      'Làm chủ nghệ thuật thiết kế Data Table linh hoạt, hiển thị dữ liệu dày đặc mà không gây rối mắt',
      'Giảm thiểu tối đa sai sót khi người dùng nhập các biểu mẫu nghiệp vụ tài chính, nhân sự phức tạp',
      'Thiết kế giao diện hỗ trợ nhiều quyền hạn truy cập khác nhau trong cùng một tổ chức',
      'Tăng năng suất làm việc của nhân viên sử dụng phần mềm lên nhiều lần'
    ],
    techniques: ['Enterprise UX', 'B2B SaaS', 'Data Tables', 'Complex Forms', 'Dashboard Design', 'RBAC'],
    documents: [
      'File Figma linh kiện mẫu Data Table hỗ trợ đầy đủ các trạng thái tương tác nâng cao',
      'Quy chuẩn thiết kế biểu đồ trực quan hóa dữ liệu cho phần mềm quản trị'
    ]
  },
  {
    title: 'Viết Nội Dung Trải Nghiệm (UX Writing) & Thiết Kế Nội Dung (Content Design)',
    slug: 'viet-noi-dung-trai-nghiem-ux-writing-thiet-ke-noi-dung-content-design',
    categorySlug: 'thiet-ke-ui-ux-va-san-pham-so',
    level: CourseLevel.INTERMEDIATE,
    price: 490000,
    oldPrice: 750000,
    leadSummary: 'Làm chủ nghệ thuật sử dụng câu chữ dẫn đường trong sản phẩm số: Viết thông báo lỗi nhân văn, nút kêu gọi hành động (CTA), văn bản trợ giúp và định hình tiếng nói thương hiệu.',
    industryContext: 'Câu chữ là một phần không thể tách rời của thiết kế; một dòng thông báo lỗi vụng về có thể làm người dùng bực tức, trong khi một hướng dẫn khéo léo sẽ cứu vãn trải nghiệm.',
    coreTopics: [
      'UX Writing là gì: Phân biệt Copywriting quảng cáo, Content Marketing và UX Writing dẫn đường',
      'Bộ 3 nguyên tắc vàng của Microcopy: Rõ ràng (Clear), Ngắn gọn (Concise), Hữu ích (Useful)',
      'Thiết lập Giọng điệu và Ngôn phong sản phẩm (Tone of Voice Guidelines) phù hợp với bối cảnh cảm xúc người dùng',
      'Kỹ thuật viết các thành phần vi mô: Nút bấm (CTA), Thông báo lỗi (Error Messages), Tooltips, Placeholder và Trạng thái trống (Empty States)',
      'Thiết kế quy trình dẫn nhập người dùng mới (Onboarding Flow) hấp dẫn'
    ],
    handsOnProject: 'Soạn thảo toàn bộ hệ thống Microcopy và thông báo lỗi bằng tiếng Việt chuẩn mực cho một ứng dụng ví điện tử tài chính.',
    targetAudience: 'Copywriter muốn chuyển sang công nghệ, UI/UX Designer muốn nâng cấp câu chữ trong sản phẩm, Content Strategist.',
    careerApplication: 'Mở ra hướng đi nghề nghiệp mới với vai trò UX Writer chuyên biệt tại các tập đoàn công nghệ lớn.',
    requirements: [
      'Khả năng diễn đạt ngôn ngữ tiếng Việt lưu loát, súc tích và mạch lạc',
      'Hiểu biết tổng quan về ứng dụng di động và website'
    ],
    benefits: [
      'Biến những thông báo lỗi kỹ thuật khó hiểu thành lời khuyên cụ thể, hữu ích cho người dùng',
      'Viết các nút kêu gọi hành động có tỷ lệ bấm cao và không gây hiểu nhầm',
      'Tạo dựng cá tính thương hiệu gần gũi, đáng tin cậy qua từng câu chữ trên giao diện',
      'Dẫn dắt người dùng thực hiện xong tác vụ khó khăn một cách nhẹ nhàng'
    ],
    techniques: ['UX Writing', 'Content Design', 'Microcopy', 'Tone of Voice', 'Error Messages', 'Onboarding'],
    documents: [
      'Bảng mẫu xây dựng Brand Voice & Tone Matrix cho sản phẩm số',
      'Sổ tay hướng dẫn viết thông báo lỗi chuẩn nhân bản và cách xử lý các tình huống khó'
    ]
  },
  {
    title: 'Quy Trình Bàn Giao Thiết Kế Cho Lập Trình Viên (Design Handoff & Dev Collaboration)',
    slug: 'quy-trinh-ban-giao-thiet-ke-cho-lap-trinh-vien-design-handoff-dev-collaboration',
    categorySlug: 'thiet-ke-ui-ux-va-san-pham-so',
    level: CourseLevel.INTERMEDIATE,
    price: 399000,
    oldPrice: 650000,
    leadSummary: 'Thu hẹp khoảng cách giữa Designer và Developer: Tổ chức file Figma chuẩn mực, ghi chú thông số tương tác, làm chủ Dev Mode và quy trình Design QA sau khi code.',
    industryContext: 'Nỗi bức xúc lớn nhất của các nhà thiết kế là sản phẩm thực tế khi ra mắt khác xa so với bản vẽ Figma; giải pháp nằm ở quy trình bàn giao khoa học.',
    coreTopics: [
      'Tâm lý và góc nhìn của lập trình viên: Cách kỹ sư Frontend đọc và hiện thực hóa một bản thiết kế',
      'Tổ chức cấu trúc trang và tệp thiết kế rõ ràng: Trạng thái thiết kế (WIP, Ready for Dev, In QA, Deprecated)',
      'Khai thác tối đa Figma Dev Mode: Đọc thông số CSS/Flutter/Swift, trích xuất assets và kiểm tra Code Connect',
      'Viết tài liệu ghi chú kỹ thuật (Redlines & Specs): Trạng thái động, Logic biên (Edge Cases), Điểm ngắt Responsive',
      'Quy trình kiểm thử chất lượng giao diện (Design QA): So sánh từng pixel và báo cáo sai lệch hiệu quả'
    ],
    handsOnProject: 'Chuẩn bị một bộ hồ sơ bàn giao thiết kế hoàn chỉnh cho tính năng thanh toán phức tạp và phối hợp giả lập với đội ngũ lập trình.',
    targetAudience: 'UI/UX Designer muốn sản phẩm thật khi xuất xưởng đẹp y như bản thiết kế, Frontend Developer.',
    careerApplication: 'Trở thành Designer có tư duy kỹ thuật xuất sắc, được các kỹ sư công nghệ yêu quý và tôn trọng.',
    requirements: [
      'Đã làm chủ công cụ Figma',
      'Hiểu biết cơ bản về các thuật ngữ lập trình như padding, margin, flexbox, border-radius'
    ],
    benefits: [
      'Chấm dứt tình trạng tranh cãi bất tận giữa đội ngũ Thiết kế và Lập trình viên',
      'Tiết kiệm hàng chục giờ trả lời thắc mắc vụn vặt về thông số kích thước, màu sắc',
      'Đảm bảo 100% các trạng thái lỗi, tải trang, không có dữ liệu đều được lập trình viên triển khai đúng',
      'Nâng cao chất lượng sản phẩm cuối cùng tiệm cận độ hoàn hảo của bản vẽ'
    ],
    techniques: ['Design Handoff', 'Dev Mode', 'Design QA', 'Specs & Redlines', 'Developer Collaboration'],
    documents: [
      'Template ghi chú thông số thiết kế (Annotation Kit) chính thức trên Figma',
      'Bảng checklist kiểm tra giao diện Design QA trước khi đưa tính năng lên production'
    ]
  },
  {
    title: 'Thiết Kế Khung Sản Phẩm Chiến Lược (Product Strategy) & Định Hình Tầm Nhìn Sản Phẩm Số',
    slug: 'thiet-ke-khung-san-pham-chien-luoc-product-strategy-dinh-hinh-tam-nhin-san-pham-so',
    categorySlug: 'thiet-ke-ui-ux-va-san-pham-so',
    level: CourseLevel.INTERMEDIATE,
    price: 699000,
    oldPrice: 1050000,
    leadSummary: 'Nâng tầm từ người vẽ giao diện đơn thuần trở thành đối tác chiến lược của doanh nghiệp: Làm chủ Lean UX, Value Proposition Canvas và các chỉ số kinh doanh số.',
    industryContext: 'Các nhà thiết kế cấp cao không chỉ làm cho sản phẩm đẹp mắt mà còn phải đảm bảo sản phẩm đó tạo ra lợi nhuận và giải quyết bài toán cốt lõi của doanh nghiệp.',
    coreTopics: [
      'Mối liên hệ mật thiết giữa Thiết kế và Kết quả Kinh doanh: ROI của UX, CLV, CAC, Churn Rate',
      'Mô hình Lean UX: Xây dựng giả định (Assumptions), Thử nghiệm giả thuyết (Hypotheses) và MVP',
      'Thiết lập tuyên ngôn giá trị với Value Proposition Canvas và Business Model Canvas',
      'Khung đo lường trải nghiệm HEART Framework của Google kết hợp hệ thống chỉ số OKR/KPI',
      'Nghệ thuật trình bày (Pitching) giải pháp thiết kế thuyết phục ban điều hành và nhà đầu tư'
    ],
    handsOnProject: 'Xây dựng bản đề xuất chiến lược sản phẩm hoàn chỉnh cho một ứng dụng dịch vụ xe chung mới, kết hợp phân tích đối thủ và mô hình giá trị.',
    targetAudience: 'Senior Designer, Lead UI/UX, Product Owner muốn bước lên vị trí Product Manager hoặc Design Director.',
    careerApplication: 'Định hình sự nghiệp ở tầm vóc lãnh đạo sản phẩm công nghệ (Product Leadership).',
    requirements: [
      'Có kinh nghiệm làm việc trong các dự án sản phẩm công nghệ từ 2 năm trở lên',
      'Có mong muốn tìm hiểu về khía cạnh kinh doanh và quản trị doanh nghiệp'
    ],
    benefits: [
      'Biết cách nói ngôn ngữ của doanh nghiệp (Doanh thu, Tỷ lệ rời bỏ, Chi phí thu hút) thay vì chỉ nói về màu sắc',
      'Sử dụng khung đo lường Google HEART để chứng minh giá trị kinh tế của các cải tiến UX',
      'Lựa chọn đúng các tính năng cốt lõi cho phiên bản thử nghiệm MVP để tiết kiệm nguồn lực',
      'Tự tin bảo vệ các quyết định thiết kế chiến lược trước các nhà quản lý cấp cao'
    ],
    techniques: ['Product Strategy', 'Lean UX', 'Value Proposition Canvas', 'HEART Framework', 'Business Design'],
    documents: [
      'Bộ khung mẫu Product Strategy Canvas và Lean UX Canvas',
      'Bảng tính đo lường ROI của các dự án cải tiến trải nghiệm người dùng'
    ]
  },
  {
    title: 'Thiết Kế Giao Diện Sản Phẩm Cho Kỷ Nguyên AI (Designing for AI & LLMs)',
    slug: 'thiet-ke-giao-dien-san-pham-cho-ky-nguyen-ai-designing-for-ai-llms',
    categorySlug: 'thiet-ke-ui-ux-va-san-pham-so',
    level: CourseLevel.ADVANCED,
    price: 890000,
    oldPrice: 1450000,
    leadSummary: 'Đón đầu làn sóng trí tuệ nhân tạo: Thiết kế giao diện đàm thoại (Conversational UI), Copilot trong ứng dụng, xử lý tính bất định của AI và tạo dựng niềm tin.',
    industryContext: 'AI đang tái định hình toàn bộ cách con người tương tác với phần mềm; thiết kế cho AI đòi hỏi các nguyên lý mới mẻ về sự minh bạch, phản hồi và kiểm soát.',
    coreTopics: [
      'Bản chất của các mô hình AI/LLM và những thách thức trải nghiệm: Ảo giác (Hallucination), Độ trễ và Kết quả không dự đoán được',
      'Nguyên tắc thiết kế AI nhân bản của Google PAIR và Microsoft HAX Toolkit',
      'Thiết kế giao diện đàm thoại (Chat & Conversational UI): Gợi ý thông minh, Ngắt lời và Định dạng kết quả phong phú',
      'Tích hợp tính năng AI Co-pilot / Assistant vào các ứng dụng sẵn có: Bối cảnh, Phím tắt, Xem trước thay đổi',
      'Xây dựng lòng tin (User Trust): Minh bạch nguồn dữ liệu, Cơ chế phản hồi thích/không thích và Cho phép người dùng chỉnh sửa'
    ],
    handsOnProject: 'Thiết kế giao diện Trợ lý AI phân tích dữ liệu tài chính thông minh tích hợp trực tiếp vào phần mềm kế toán doanh nghiệp.',
    targetAudience: 'Senior UI/UX Designer, Product Designer muốn dẫn đầu trong kỷ nguyên Generative AI.',
    careerApplication: 'Trở thành một trong những nhà thiết kế tiên phong chuyên biệt về trải nghiệm người dùng AI (AI UX Specialist).',
    requirements: [
      'Kinh nghiệm dày dặn về thiết kế sản phẩm số (Web/App)',
      'Thường xuyên sử dụng các công cụ Generative AI như ChatGPT, Claude, Midjourney'
    ],
    benefits: [
      'Nắm vững các mẫu thiết kế (UX Patterns) chuẩn mực cho các sản phẩm ứng dụng Generative AI',
      'Xử lý khéo léo trạng thái chờ phản hồi của AI để người dùng không cảm thấy sốt ruột',
      'Cung cấp cho người dùng quyền kiểm soát tối cao đối với các quyết định do AI đề xuất',
      'Tạo ra các sản phẩm AI thực sự hữu ích chứ không chỉ dừng lại ở tính năng trình diễn'
    ],
    techniques: ['AI UX', 'Conversational UI', 'PAIR Guidelines', 'Copilot Design', 'Generative AI Patterns'],
    documents: [
      'Bộ thẻ nguyên tắc thiết kế AI (Human-AI Interaction Guidelines) từ Google và Microsoft',
      'File Figma tổng hợp 50 mẫu UI Patterns chuẩn cho các ứng dụng tích hợp LLM'
    ]
  },
  {
    title: 'Kiến Trúc Tương Tác Chuyển Động Điện Ảnh Trong Giao Diện (Motion Design for UI)',
    slug: 'kien-truc-tuong-tac-chuyen-dong-dien-anh-trong-giao-dien-motion-design-ui',
    categorySlug: 'thiet-ke-ui-ux-va-san-pham-so',
    level: CourseLevel.ADVANCED,
    price: 850000,
    oldPrice: 1350000,
    leadSummary: 'Làm chủ ngôn ngữ chuyển động thị giác trong sản phẩm số với Adobe After Effects và Lottie: Thổi hồn vào các nút bấm, biểu tượng và hiệu ứng chuyển cảnh điện ảnh.',
    industryContext: 'Chuyển động không chỉ là trang trí đơn thuần; chuyển động dẫn dắt sự chú ý, tạo cảm giác về không gian vật lý và nâng tầm đẳng cấp thương hiệu sản phẩm.',
    coreTopics: [
      '12 nguyên tắc chuyển động kinh điển của hoạt hình ứng dụng vào giao diện số',
      'Phân loại chuyển động UI: Chuyển cảnh điều hướng (Navigational), Phản hồi thao tác (Feedback), Thu hút chú ý và Nghệ thuật thương hiệu',
      'Làm chủ Adobe After Effects cho UI: Keyframes, Graph Editor, Speed & Value Graphs',
      'Xuất và tối ưu hóa chuyển động siêu nhẹ cho Web và Mobile bằng Lottie & Bodymovin',
      'Quy chuẩn hóa hệ thống chuyển động (Motion Tokens & Guidelines) trong Design System'
    ],
    handsOnProject: 'Xây dựng bộ chuyển động UI hoàn chỉnh cho một ứng dụng du lịch mạo hiểm gồm hiệu ứng chuyển trang 3D mượt mà và hoạt ảnh chúc mừng hoàn tất.',
    targetAudience: 'UI Designer, Motion Designer muốn chuyên sâu vào mảng hoạt họa cho ứng dụng công nghệ.',
    careerApplication: 'Được săn đón bởi các công ty phát triển sản phẩm cao cấp đòi hỏi sự hoàn mỹ đến từng chi tiết chuyển động.',
    requirements: [
      'Có kiến thức về thiết kế đồ họa tĩnh trên Figma hoặc Illustrator',
      'Đã từng làm quen với dòng thời gian (Timeline) trong các phần mềm dựng phim hoặc hoạt họa'
    ],
    benefits: [
      'Điều khiển mượt mà đường cong tốc độ chuyển động để hoạt ảnh tự nhiên, không bị cứng nhắc',
      'Tạo ra các tệp chuyển động Lottie định dạng JSON dung lượng cực nhẹ chạy mượt trên mọi thiết bị',
      'Sử dụng chuyển động để che giấu thời gian tải trang một cách thông minh',
      'Xây dựng tài liệu hướng dẫn chuyển động chi tiết giúp lập trình viên code đúng 100%'
    ],
    techniques: ['Motion Design', 'After Effects', 'Lottie', 'Graph Editor', 'Easing', 'Micro-animations'],
    documents: [
      'Bảng tra cứu các thông số thời lượng (Duration) và Easing chuẩn cho từng loại tương tác',
      'File dự án After Effects mẫu chứa các chuyển động UI kinh điển xuất sang Lottie'
    ]
  },
  {
    title: 'Tối Ưu Hóa Trải Nghiệm Đa Kênh (Omnichannel Service Design) & Bản Đồ Dịch Vụ',
    slug: 'toi-uu-hoa-trai-nghiem-da-kenh-omnichannel-service-design-ban-do-dich-vu',
    categorySlug: 'thiet-ke-ui-ux-va-san-pham-so',
    level: CourseLevel.ADVANCED,
    price: 920000,
    oldPrice: 1490000,
    leadSummary: 'Thiết kế trải nghiệm liền mạch kết nối giữa thế giới số (App/Web) và thế giới thực (Cửa hàng vật lý, Tổng đài hỗ trợ) bằng công cụ Bản đồ dịch vụ (Service Blueprint).',
    industryContext: 'Khách hàng không nhìn nhận doanh nghiệp qua từng phòng ban riêng rẽ; họ mong muốn một trải nghiệm đồng nhất dù đang lướt app hay bước vào cửa hàng.',
    coreTopics: [
      'Khái niệm Thiết kế Dịch vụ (Service Design) và tư duy hệ thống đa kênh (Omnichannel)',
      'Phân biệt Mặt trước sân khấu (Frontstage), Hậu trường (Backstage) và Quy trình hỗ trợ (Support Processes)',
      'Kỹ thuật xây dựng Bản đồ dịch vụ chi tiết (Service Blueprint): Từng bước tương tác, Nhân viên, Công nghệ và Bằng chứng hữu hình',
      'Hàn gắn các vết nứt gãy trải nghiệm khi khách hàng chuyển đổi giữa các kênh trực tuyến và ngoại tuyến',
      'Đo lường chất lượng dịch vụ tổng thể với các chỉ số CSAT, CES (Customer Effort Score) và LTV'
    ],
    handsOnProject: 'Thiết kế lại toàn bộ quy trình dịch vụ khám chữa bệnh từ xa kết hợp tái khám trực tiếp tại bệnh viện bằng Service Blueprint chi tiết.',
    targetAudience: 'Lead UX Designer, Service Designer, CX Manager, Quản lý vận hành và Chuyên viên tư vấn chuyển đổi số.',
    careerApplication: 'Đảm nhận vai trò kiến trúc sư trải nghiệm khách hàng cấp chiến lược cho các tập đoàn bán lẻ, ngân hàng và y tế.',
    requirements: [
      'Kinh nghiệm vững chắc về nghiên cứu người dùng và thiết kế hành trình khách hàng (Journey Mapping)',
      'Tư duy phân tích quy trình vận hành doanh nghiệp'
    ],
    benefits: [
      'Nhìn thấu toàn cảnh các mắt xích vận hành hậu trường hỗ trợ cho từng cú chạm trên màn hình ứng dụng',
      'Xóa bỏ tình trạng rời rạc thông tin giữa đội ngũ nhân viên cửa hàng và bộ phận công nghệ',
      'Xác định chính xác các điểm nghẽn quy trình gây bức xúc cho khách hàng và nhân viên',
      'Nâng cao lòng trung thành của khách hàng thông qua một dịch vụ hoàn hảo từ số đến thực'
    ],
    techniques: ['Service Design', 'Service Blueprint', 'Omnichannel UX', 'Frontstage & Backstage', 'CX Management'],
    documents: [
      'Template Service Blueprint chuẩn quốc tế trên FigJam và Miro',
      'Bộ tiêu chí đánh giá mức độ trưởng thành của trải nghiệm đa kênh trong doanh nghiệp'
    ]
  },
  {
    title: 'Nghệ Thuật Lãnh Đạo Thiết Kế (Design Leadership) & Quản Trị Đội Ngũ Sản Phẩm Số',
    slug: 'nghe-thuat-lanh-dao-thiet-ke-design-leadership-quan-tri-doi-ngu-san-pham-so',
    categorySlug: 'thiet-ke-ui-ux-va-san-pham-so',
    level: CourseLevel.ADVANCED,
    price: 990000,
    oldPrice: 1650000,
    leadSummary: 'Trang bị năng lực lãnh đạo, xây dựng văn hóa thiết kế, tuyển dụng, huấn luyện nhân tài và xác lập vị thế của bộ phận Thiết kế trong bàn tròn lãnh đạo công ty.',
    industryContext: 'Để đưa thiết kế trở thành động lực phát triển cốt lõi, người đứng đầu bộ phận thiết kế phải biết cách quản lý con người, phân bổ nguồn lực và bảo vệ tầm nhìn dài hạn.',
    coreTopics: [
      'Sự chuyển dịch tâm thế từ Chuyên gia thực thi (Individual Contributor) sang Nhà quản lý (Manager & Leader)',
      'Xây dựng Khung năng lực nghề nghiệp (Design Career Ladder) và quy trình đánh giá hiệu suất định kỳ',
      'Quy trình tuyển dụng và phỏng vấn Designer chuyên nghiệp: Đánh giá Portfolio, Bài test thực chiến và Đạo đức làm việc',
      'Tổ chức các buổi phê bình thiết kế (Design Critiques) xây dựng và duy trì văn hóa phản hồi tích cực',
      'Đàm phán ngân sách, phân bổ nguồn lực và quản lý các bên liên quan phức tạp trong tổ chức'
    ],
    handsOnProject: 'Xây dựng kế hoạch phát triển đội ngũ thiết kế gồm 10 nhân sự trong 12 tháng, bao gồm cơ cấu tổ chức, ma trận kỹ năng và quy trình vận hành.',
    targetAudience: 'Senior Designer chuẩn bị lên Lead, Design Manager, Head of Design, Art Director.',
    careerApplication: 'Tự tin tiếp quản và vận hành bộ phận thiết kế sản phẩm số tại các công ty quy mô vừa và lớn.',
    requirements: [
      'Tối thiểu 3 năm kinh nghiệm trong ngành thiết kế sản phẩm số',
      'Có trải nghiệm hướng dẫn hoặc làm việc nhóm cùng các nhà thiết kế khác'
    ],
    benefits: [
      'Thiết lập lộ trình thăng tiến rõ ràng giúp giữ chân các nhà thiết kế tài năng trong đội ngũ',
      'Biến các buổi Review thiết kế căng thẳng thành môi trường chia sẻ tri thức đầy cảm hứng',
      'Xây dựng tầm ảnh hưởng và tiếng nói uy tín của bộ phận thiết kế với Ban Giám đốc',
      'Thành thạo kỹ năng giải quyết xung đột ý kiến giữa đội ngũ thiết kế và các phòng ban liên quan'
    ],
    techniques: ['Design Leadership', 'Design Ops', 'People Management', 'Design Critiques', 'Hiring & Mentoring'],
    documents: [
      'Khung năng lực chi tiết cho từng cấp bậc Designer (Junior đến Principal)',
      'Bộ tài liệu quy chuẩn tổ chức buổi Design Critique hiệu quả trong 45 phút'
    ]
  },
  {
    title: 'Kiểm Toán Trải Nghiệm Người Dùng Toàn Diện (Comprehensive UX Audit & Heuristic Evaluation)',
    slug: 'kiem-toan-trai-nghiem-nguoi-dung-toan-dien-ux-audit-heuristic-evaluation',
    categorySlug: 'thiet-ke-ui-ux-va-san-pham-so',
    level: CourseLevel.ADVANCED,
    price: 790000,
    oldPrice: 1250000,
    leadSummary: 'Thực hiện kiểm toán trải nghiệm người dùng độc lập dựa trên 10 nguyên lý Heuristics của Jakob Nielsen, phân tích dữ liệu hành vi và đề xuất lộ trình khắc phục toàn diện.',
    industryContext: 'Dịch vụ UX Audit đang được các doanh nghiệp săn đón để nhanh chóng chẩn đoán các căn bệnh khiến sản phẩm số hoạt động kém hiệu quả trước khi đầu tư làm lại.',
    coreTopics: [
      'Phương pháp luận Heuristic Evaluation: 10 nguyên lý đánh giá khả năng sử dụng của Jakob Nielsen',
      'Kiểm toán đa chiều: Kết hợp đánh giá chuyên gia (Expert Review) với số liệu phân tích định lượng (Google Analytics, Hotjar, Mixpanel)',
      'Hệ thống chấm điểm mức độ nghiêm trọng của lỗi (Severity Rating) từ thẩm mỹ đến lỗi chí mạng',
      'Phân tích đối thủ cạnh tranh (Competitive UX Benchmarking) và đối sánh tiêu chuẩn ngành',
      'Soạn thảo Báo cáo Kiểm toán Trải nghiệm (UX Audit Report) mang tính hành động cao với lộ trình ưu tiên (Quick Wins vs Long-term)'
    ],
    handsOnProject: 'Thực hiện báo cáo kiểm toán UX độc lập cho một nền tảng học trực tuyến hiện có, chỉ ra 20 lỗi cốt lõi và phương án tái thiết kế.',
    targetAudience: 'Senior UI/UX Designer, UX Consultant, Product Manager muốn nâng cao kỹ năng phản biện và tư vấn giải pháp.',
    careerApplication: 'Cung cấp dịch vụ tư vấn kiểm toán trải nghiệm độc lập với mức thù lao chuyên gia hấp dẫn.',
    requirements: [
      'Có kiến thức sâu rộng về các nguyên lý thiết kế và trải nghiệm người dùng',
      'Kinh nghiệm đọc hiểu các chỉ số phân tích dữ liệu website cơ bản'
    ],
    benefits: [
      'Chỉ ra chính xác các điểm yếu chí mạng của sản phẩm chỉ trong vài ngày mà không tốn chi phí phỏng vấn người dùng quy mô lớn',
      'Trình bày các phát hiện một cách khoa học, thuyết phục dựa trên các tiêu chuẩn quốc tế đã được thừa nhận',
      'Phân loại danh sách công việc cần sửa chữa theo ma trận Tác động - Nỗ lực (Impact vs Effort)',
      'Tạo dựng lòng tin tuyệt đối với khách hàng doanh nghiệp thông qua báo cáo kiểm toán sắc sảo'
    ],
    techniques: ['UX Audit', 'Heuristic Evaluation', 'Jakob Nielsen Principles', 'Data Analysis', 'Competitive Benchmarking'],
    documents: [
      'Mẫu bảng tính kiểm toán 10 Heuristics kèm thang đo mức độ nghiêm trọng',
      'Template báo cáo kiểm toán UX chuyên nghiệp bằng PowerPoint và Figma'
    ]
  },

  // ==========================================
  // CAT-10: Thiết kế đồ họa & Mỹ thuật số (16 courses)
  // Quota: 5 BEGINNER, 7 INTERMEDIATE, 4 ADVANCED | 2 FREE, 14 PAID
  // ==========================================
  {
    title: 'Nền Tảng Mỹ Thuật Ứng Dụng: Bố Cục, Phối Màu & Typography Trong Đồ Họa',
    slug: 'nen-tang-my-thuat-ung-dung-bo-cuc-phoi-mau-typography-trong-do-hoa',
    categorySlug: 'thiet-ke-do-hoa',
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0,
    leadSummary: 'Nắm vững những quy luật thị giác bất biến tạo nên vẻ đẹp của mọi tác phẩm đồ họa: Bánh xe màu sắc, Bố cục tỷ lệ vàng và Nghệ thuật xếp chữ Typography.',
    industryContext: 'Công cụ có thể thay đổi từng ngày nhưng các nguyên lý thị giác căn bản đã tồn tại hàng trăm năm sẽ luôn là kim chỉ nam giúp tác phẩm của bạn có chiều sâu và sự cuốn hút.',
    coreTopics: [
      'Các yếu tố cơ bản của ngôn ngữ thị giác: Điểm, Đường, Hình khối, Mảng, Không gian và Chất cảm',
      'Lý thuyết màu sắc chuyên sâu: Bánh xe màu, Các quy tắc phối màu (Đơn sắc, Tương đồng, Bổ túc, Bộ ba) và Tâm lý học màu sắc',
      'Nghệ thuật sắp đặt bố cục: Quy tắc một phần ba (Rule of Thirds), Tỷ lệ vàng (Golden Ratio), Cân bằng và Tương phản',
      'Nền tảng Typography: Phân loại Font chữ (Serif, Sans-serif, Display, Script), Căn lề, Khoảng cách chữ (Kerning, Tracking, Leading)',
      'Phân cấp thị giác (Visual Hierarchy): Dẫn dắt ánh mắt người xem qua các tầng thông điệp'
    ],
    handsOnProject: 'Thiết kế một bộ 3 áp phích (Poster) nghệ thuật truyền tải thông điệp bảo vệ môi trường ứng dụng triệt để các nguyên lý bố cục và màu sắc.',
    targetAudience: 'Người mới bắt đầu đam mê đồ họa, sinh viên mỹ thuật ứng dụng hoặc người làm nội dung truyền thông.',
    careerApplication: 'Xây dựng nền tảng tư duy thẩm mỹ vững chắc trước khi bước vào sử dụng bất kỳ phần mềm thiết kế chuyên dụng nào.',
    requirements: [
      'Không yêu cầu năng khiếu vẽ bẩm sinh hay máy tính cấu hình mạnh',
      'Tâm hồn yêu thích cái đẹp và sự nhạy cảm với hình ảnh xung quanh'
    ],
    benefits: [
      'Tự tin lựa chọn và kết hợp các bảng màu hài hòa, tránh tình trạng màu sắc chát chúa hoặc nhạt nhòa',
      'Biết cách ghép nối tối đa 2-3 kiểu font chữ trong cùng một thiết kế một cách tinh tế',
      'Sắp xếp các mảng nội dung cân đối, làm nổi bật thông điệp chính ngay từ cái nhìn đầu tiên',
      'Giải thích được lý do vì sao một tác phẩm đẹp một cách khoa học, chuyên nghiệp'
    ],
    techniques: ['Color Theory', 'Typography', 'Visual Composition', 'Golden Ratio', 'Visual Hierarchy', 'Graphic Arts'],
    documents: [
      'Cẩm nang 50 bảng phối màu kinh điển kèm mã Hex chuẩn cho in ấn và kỹ thuật số',
      'Sổ tay hướng dẫn kết hợp Font chữ an toàn và hiệu quả cho người mới bắt đầu'
    ]
  },
  {
    title: 'Photoshop Cho Người Mới Bắt Đầu: Cắt Ghép, Chỉnh Sửa Ảnh & Xử Lý Đồ Họa Căn Bản',
    slug: 'photoshop-cho-nguoi-moi-bat-dau-cat-ghep-chinh-sua-anh-xu-ly-do-hoa-can-ban',
    categorySlug: 'thiet-ke-do-hoa',
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0,
    leadSummary: 'Làm chủ phần mềm xử lý hình ảnh quyền năng nhất hành tinh Adobe Photoshop: Tách nền siêu tốc, tẩy xóa khuyết điểm và ghép ảnh chân thực.',
    industryContext: 'Adobe Photoshop là kỹ năng kỹ thuật số cơ bản không thể thiếu trong mọi ngành nghề liên quan đến truyền thông, marketing, nhiếp ảnh và thương mại điện tử.',
    coreTopics: [
      'Làm quen không gian làm việc Photoshop, tư duy phân lớp Layers và chế độ hòa trộn (Blending Modes)',
      'Các công cụ cắt ghép vùng chọn: Marquee, Lasso, Quick Selection, Object Selection và Pen Tool thần thánh',
      'Làm chủ mặt nạ Layer Mask và Adjustment Layers để chỉnh sửa an toàn không phá hủy điểm ảnh gốc',
      'Kỹ thuật phục hồi và xóa chi tiết thừa: Spot Healing Brush, Clone Stamp và Content-Aware Fill',
      'Chỉnh sửa màu sắc và ánh sáng cơ bản với Levels, Curves, Hue/Saturation và Camera Raw Filter'
    ],
    handsOnProject: 'Thực hiện chỉnh sửa hoàn thiện một bức ảnh chân dung chuyên nghiệp và thiết kế một banner quảng cáo mỹ phẩm lung linh.',
    targetAudience: 'Người mới bắt đầu tìm hiểu đồ họa, Marketer, Content Creator, Chủ cửa hàng online tự thiết kế hình ảnh.',
    careerApplication: 'Tự tay sản xuất toàn bộ hình ảnh phục vụ mạng xã hội, quảng cáo và ấn phẩm truyền thông cá nhân.',
    requirements: [
      'Máy tính cá nhân cài đặt phiên bản Adobe Photoshop (khuyến nghị từ CC 2020 trở lên)',
      'Chuột máy tính thao tác nhạy để thực hiện việc cắt vẽ vùng chọn'
    ],
    benefits: [
      'Tách người và vật thể ra khỏi nền phức tạp mượt mà, không bị răng cưa hay dính viền màu cũ',
      'Xóa sạch các khuyết điểm trên da mặt hoặc các vật thể không mong muốn trong ảnh chỉ sau vài giây',
      'Cân chỉnh ánh sáng, độ tương phản và màu sắc bức ảnh trở nên rực rỡ và chuyên nghiệp',
      'Xuất file ảnh đúng định dạng tối ưu dung lượng cho Web, Facebook, Instagram'
    ],
    techniques: ['Photoshop', 'Layer Mask', 'Pen Tool', 'Color Correction', 'Retouching', 'Photo Manipulation'],
    documents: [
      'Bảng tổng hợp các phím tắt vàng trong Adobe Photoshop giúp tăng gấp đôi tốc độ thao tác',
      'Bộ tài nguyên Brush, Texture và Gradient đẹp mắt tuyển chọn dùng sẵn'
    ]
  },
  {
    title: 'Thành Thạo Adobe Illustrator: Vẽ Vector, Biểu Tượng & Minh Họa Đồ Họa Chuyên Nghiệp',
    slug: 'thanh-thao-adobe-illustrator-ve-vector-bieu-tuong-minh-hoa-do-hoa-chuyen-nghiep',
    categorySlug: 'thiet-ke-do-hoa',
    level: CourseLevel.BEGINNER,
    price: 499000,
    oldPrice: 799000,
    leadSummary: 'Khám phá thế giới đồ họa Vector sắc nét bất tận cùng Adobe Illustrator: Vẽ hình học, tạo logo, thiết kế bộ icon và các ấn phẩm in ấn sắc màu.',
    industryContext: 'Khác với Photoshop dựa trên điểm ảnh (Raster), Illustrator sử dụng toán học Vector cho phép phóng to thiết kế lên kích thước tòa nhà mà không bao giờ bị vỡ hạt.',
    coreTopics: [
      'Bản chất đồ họa Vector và cấu trúc tệp Illustrator (AI, EPS, SVG, PDF)',
      'Làm chủ Pen Tool, Curvature Tool, dựng hình học chuẩn xác với Pathfinder và Shape Builder Tool',
      'Tô màu sáng tạo: Gradient đa chiều, Mesh Tool tạo khối 3D mềm mại và Pattern lặp lại',
      'Xử lý chữ nghệ thuật trong Illustrator: Biến chữ thành hình khối (Create Outlines), uốn chữ theo đường cong',
      'Chuẩn bị file in ấn chuyên nghiệp: Hệ màu CMYK, Căn tràn lề (Bleed) và thiết lập thước đo chuẩn'
    ],
    handsOnProject: 'Thiết kế trọn bộ ấn phẩm nhận diện văn phòng cho một quán cà phê gồm: Logo, Danh thiếp, Menu gấp 3 và Túi giấy.',
    targetAudience: 'Người muốn theo đuổi nghề thiết kế đồ họa in ấn, minh họa sách báo, thiết kế bao bì thương hiệu.',
    careerApplication: 'Làm việc tự tin tại các xưởng in, công ty quảng cáo hoặc nhận các dự án thiết kế biểu trưng độc lập.',
    requirements: [
      'Máy tính cài đặt Adobe Illustrator CC',
      'Sự kiên nhẫn luyện tập với công cụ Pen Tool trong những bài thực hành đầu tiên'
    ],
    benefits: [
      'Vẽ lại bất kỳ hình ảnh hoặc phác thảo tay nào thành bản vẽ vector sắc nét hoàn hảo',
      'Tạo ra các biểu tượng (Icons) và hình khối đồ họa chuẩn tỷ lệ',
      'Xuất file in ấn chuẩn kỹ thuật không bị sai màu khi bàn giao cho nhà in',
      'Tạo các hoa văn (Pattern) độc đáo ứng dụng cho bao bì và vải vóc thời trang'
    ],
    techniques: ['Adobe Illustrator', 'Vector Graphics', 'Pen Tool', 'Shape Builder', 'CMYK Printing', 'Icon Design'],
    documents: [
      'Bộ bài tập luyện bút vẽ Pen Tool từ cơ bản đến đỉnh cao hình học',
      'File Illustrator mẫu thiết kế danh thiếp, phong bì thư và hóa đơn chuẩn kích thước in'
    ]
  },
  {
    title: 'Thiết Kế Đồ Họa Truyền Thông Xã Hội (Social Media Design) & Banner Marketing',
    slug: 'thiet-ke-do-hoa-truyen-thong-xa-hoi-social-media-design-banner-marketing',
    categorySlug: 'thiet-ke-do-hoa',
    level: CourseLevel.BEGINNER,
    price: 399000,
    oldPrice: 650000,
    leadSummary: 'Tạo ra những ấn phẩm truyền thông mạng xã hội bắt mắt, giữ chân người xem giữa dòng tin cuộn vô tận: Banner Facebook, Carousel Instagram, Thumbnail YouTube và TikTok.',
    industryContext: 'Một hình ảnh quảng cáo thu hút có thể giảm một nửa chi phí chạy ads và tăng gấp 3 lần lượng tương tác trên các nền tảng mạng xã hội.',
    coreTopics: [
      'Kích thước chuẩn và quy định hình ảnh trên các nền tảng: Facebook, Instagram, YouTube, TikTok, LinkedIn',
      'Quy tắc 3 giây: Cách thiết kế điểm nhấn thị giác (Focal Point) khiến người dùng dừng ngón tay khi lướt newsfeed',
      'Thiết kế chuỗi bài đăng đa khung hình (Instagram Carousel) kể chuyện thu hút',
      'Nghệ thuật giật tít hình ảnh: Bố trí tiêu đề nổi bật, màu sắc kích thích tò mò',
      'Quy trình sản xuất hàng loạt (Batch Design) giúp tiết kiệm thời gian cho các chiến dịch Marketing dài ngày'
    ],
    handsOnProject: 'Thiết kế trọn gói chiến dịch hình ảnh ra mắt dòng sản phẩm giày thể thao mới trên Facebook và Instagram gồm 10 ấn phẩm đồng bộ.',
    targetAudience: 'Marketer, Content Creator, Chủ shop kinh doanh online, Freelancer thiết kế truyền thông.',
    careerApplication: 'Trở thành Graphic Designer chuyên về Social Media cho các nhãn hàng hoặc Agency quảng cáo.',
    requirements: [
      'Sử dụng cơ bản Photoshop hoặc Illustrator',
      'Có tài khoản mạng xã hội để quan sát xu hướng thiết kế thịnh hành'
    ],
    benefits: [
      'Nắm vững kích thước chuẩn mọi khung hình mạng xã hội không lo bị cắt xén nội dung',
      'Thiết kế các mẫu Carousel dẫn dắt người xem lướt từ trang đầu đến trang cuối',
      'Sử dụng màu sắc tương phản mạnh mẽ để làm nổi bật thông điệp khuyến mãi',
      'Tạo ra phong cách hình ảnh nhất quán giúp khách hàng nhận ra thương hiệu ngay lập tức'
    ],
    techniques: ['Social Media Design', 'Banner Ads', 'Instagram Carousel', 'YouTube Thumbnail', 'Visual Marketing'],
    documents: [
      'Bảng kích thước chuẩn các loại ảnh mạng xã hội cập nhật mới nhất năm nay',
      'Bộ 20 Template Banner quảng cáo có thể thay thế hình ảnh và chữ linh hoạt'
    ]
  },
  {
    title: 'Nghệ Thuật Trình Bày Bản Thuyết Trình Ấn Tượng (Presentation Design With Canva & PowerPoint)',
    slug: 'nghe-thuat-trinh-bay-ban-thuyet-trinh-an-tuong-presentation-design-canva-powerpoint',
    categorySlug: 'thiet-ke-do-hoa',
    level: CourseLevel.BEGINNER,
    price: 350000,
    oldPrice: 590000,
    leadSummary: 'Xóa bỏ những slide thuyết trình nhàm chán đầy chữ; biến ý tưởng phức tạp thành những trang trình chiếu đồ họa hiện đại, trực quan với PowerPoint và Canva.',
    industryContext: 'Một bản thuyết trình ấn tượng là chìa khóa giúp bạn chốt hợp đồng tiền tỷ, gọi vốn khởi nghiệp thành công hoặc ghi điểm tuyệt đối với ban lãnh đạo.',
    coreTopics: [
      'Tư duy thiết kế Slide hiện đại: Trực quan hóa dữ liệu thay vì sao chép văn bản nguyên văn',
      'Làm chủ công cụ tạo slide nhanh chóng trên Canva và các tính năng nâng cao trong Microsoft PowerPoint',
      'Sử dụng hình khối, icon và hình ảnh chất lượng cao để minh họa thông điệp trừu tượng',
      'Trực quan hóa bảng biểu và số liệu kinh doanh: Chọn đúng dạng biểu đồ cho từng loại thông tin',
      'Hiệu ứng chuyển trang tinh tế (Morph Transition) tạo cảm giác liền mạch như một thước phim'
    ],
    handsOnProject: 'Thiết kế một bộ Slide gọi vốn (Pitch Deck) chuẩn quốc tế gồm 12 trang cho một dự án khởi nghiệp công nghệ giáo dục.',
    targetAudience: 'Nhân viên văn phòng, Quản lý dự án, Nhà sáng lập khởi nghiệp, Sinh viên bảo vệ đồ án tốt nghiệp.',
    careerApplication: 'Tạo lợi thế cạnh tranh vượt trội trong công việc văn phòng và đàm phán kinh doanh.',
    requirements: [
      'Máy tính có cài đặt Microsoft PowerPoint (từ bản 2019/365) hoặc tài khoản trình duyệt Canva',
      'Nội dung hoặc ý tưởng cần trình bày'
    ],
    benefits: [
      'Biến các khối văn bản dài dòng thành các sơ đồ trực quan dễ hiểu chỉ trong 5 phút',
      'Ứng dụng hiệu ứng Morph trong PowerPoint biến slide thành tác phẩm tương tác mượt mà',
      'Trình bày số liệu tài chính rõ ràng, giúp người nghe nắm bắt kết quả kinh doanh tức thì',
      'Tự tin thuyết trình trước đám đông với sự trợ lực của những trang slide đỉnh cao'
    ],
    techniques: ['PowerPoint', 'Canva', 'Pitch Deck', 'Slide Design', 'Morph Transition', 'Data Storytelling'],
    documents: [
      'Bộ sưu tập 10 Template Slide thuyết trình chuẩn doanh nghiệp đa ngành nghề',
      'Thư viện 500 Icons và Vector chất lượng cao sẵn sàng chèn vào bài thuyết trình'
    ]
  },
  {
    title: 'Thiết Kế Hệ Thống Nhận Diện Thương Hiệu Toàn Diện (Brand Identity Design)',
    slug: 'thiet-ke-he-thong-nhan-dien-thuong-hieu-toan-dien-brand-identity-design',
    categorySlug: 'thiet-ke-do-hoa',
    level: CourseLevel.INTERMEDIATE,
    price: 750000,
    oldPrice: 1190000,
    leadSummary: 'Làm chủ quy trình sáng tạo bộ nhận diện thương hiệu từ nghiên cứu định vị, thiết kế logo, lựa chọn bảng màu, font chữ đến biên soạn cẩm nang thương hiệu (Brand Guidelines).',
    industryContext: 'Bộ nhận diện thương hiệu là linh hồn thị giác của doanh nghiệp; một bộ nhận diện chuyên nghiệp giúp thương hiệu định vị đẳng cấp và tạo niềm tin vững chắc với khách hàng.',
    coreTopics: [
      'Quy trình thiết kế thương hiệu chuẩn: Nghiên cứu thị trường, Khám phá tính cách thương hiệu (Brand Archetypes)',
      'Quy tắc vàng trong thiết kế Logo: Đơn giản, Dễ nhớ, Vĩnh cửu, Đa năng và Phù hợp',
      'Phát triển hệ thống nhận diện cốt lõi: Logo chính, Logo phụ, Dấu ấn biểu trưng, Bảng màu và Hệ thống phân cấp chữ',
      'Ứng dụng nhận diện thương hiệu trên đa nền tảng: Ấn phẩm văn phòng, Bao bì, Biển bảng, Phương tiện vận chuyển và Mạng xã hội',
      'Soạn thảo Cẩm nang quy chuẩn thương hiệu (Brand Guidelines / Brand Book) chi tiết'
    ],
    handsOnProject: 'Sáng tạo trọn vẹn bộ nhận diện thương hiệu từ A-Z cho một chuỗi khách sạn nghỉ dưỡng sinh thái cao cấp kèm cuốn Brand Book dày 40 trang.',
    targetAudience: 'Graphic Designer đã có kỹ năng phần mềm muốn nâng tầm lên chuyên gia xây dựng thương hiệu (Branding Specialist).',
    careerApplication: 'Nhận các hợp đồng thiết kế nhận diện thương hiệu doanh nghiệp với giá trị từ hàng chục đến hàng trăm triệu đồng.',
    requirements: [
      'Thành thạo phần mềm Adobe Illustrator và Photoshop',
      'Có hiểu biết cơ bản về tiếp thị và định vị thương hiệu'
    ],
    benefits: [
      'Xây dựng câu chuyện thương hiệu hấp dẫn gắn liền với biểu tượng thị giác',
      'Thiết kế Logo đạt tiêu chuẩn thẩm mỹ cao, không bị lỗi thời theo năm tháng',
      'Biên soạn cuốn Brand Guidelines chuẩn mực hướng dẫn các đối tác sử dụng hình ảnh chính xác',
      'Tự tin thuyết trình và bảo vệ ý tưởng sáng tạo trước ban lãnh đạo khách hàng'
    ],
    techniques: ['Brand Identity', 'Logo Design', 'Brand Guidelines', 'Brand Strategy', 'Visual Identity', 'Typography'],
    documents: [
      'Template mẫu Brand Guidelines chuyên nghiệp bằng file Adobe InDesign và Illustrator',
      'Bộ bảng câu hỏi phỏng vấn khách hàng (Brand Discovery Questionnaire) trước khi thiết kế'
    ]
  },
  {
    title: 'Nghệ Thuật Xử Lý Ảnh Chân Dung & Quảng Cáo Đỉnh Cao (High-End Retouching)',
    slug: 'nghe-thuat-xu-ly-anh-chan-dung-quang-cao-dinh-cao-high-end-retouching',
    categorySlug: 'thiet-ke-do-hoa',
    level: CourseLevel.INTERMEDIATE,
    price: 690000,
    oldPrice: 1050000,
    leadSummary: 'Làm chủ kỹ thuật hậu kỳ ảnh chân dung và sản phẩm thương mại cao cấp: Tách tần số (Frequency Separation), Đánh sáng khối (Dodge & Burn) giữ nguyên cấu trúc da tự nhiên.',
    industryContext: 'Các tạp chí thời trang và nhãn hàng xa xỉ đòi hỏi những bức ảnh phải đạt độ hoàn mỹ tối đa nhưng làn da vẫn phải chân thực, không bị bệt màu hay giống tượng sáp.',
    coreTopics: [
      'Hiểu sâu về cấu trúc làn da, kết cấu hạt (Texture) và sắc độ chuyển dịch ánh sáng (Luminosity)',
      'Kỹ thuật phân tách tần số chi tiết (Frequency Separation): Xử lý màu sắc riêng biệt với bề mặt da',
      'Làm chủ nghệ thuật Dodge & Burn vi mô và vĩ mô để tạo khối gương mặt sắc sảo và cuốn hút',
      'Chỉnh hình thể tự nhiên với Liquify Tool: Giữ đúng tỷ lệ cơ thể và bối cảnh xung quanh',
      'Cân chỉnh màu da đồng nhất (Skin Tone Matching) và phối màu điện ảnh với Gradient Map, Color Lookup'
    ],
    handsOnProject: 'Thực hiện hậu kỳ hoàn chỉnh bức ảnh bìa tạp chí thời trang độ phân giải cao và ảnh quảng cáo trang sức kim cương lấp lánh.',
    targetAudience: 'Nhiếp ảnh gia chân dung, Retoucher chuyên nghiệp, Graphic Designer làm việc cho ngành thời trang, mỹ phẩm.',
    careerApplication: 'Làm việc cho các Studio ảnh cưới cao cấp, tạp chí thời trang hoặc nhận dự án Retouch quốc tế.',
    requirements: [
      'Thành thạo Photoshop ở mức trung cấp trở lên',
      'Khuyến khích sử dụng bảng vẽ điện tử (Wacom/Huion) để thao tác nét cọ chuẩn xác'
    ],
    benefits: [
      'Làm sạch toàn bộ mụn, vết thâm mà lỗ chân lông vẫn hiển thị sắc nét tự nhiên 100%',
      'Tạo khối khuôn mặt thanh thoát, sống động bằng kỹ thuật ánh sáng Dodge & Burn chuẩn Hollywood',
      'Xử lý tóc con xơ rối và trang điểm kỹ thuật số mượt mà',
      'Định hình phong cách màu sắc sang trọng, nâng tầm giá trị cho bức ảnh chụp'
    ],
    techniques: ['Frequency Separation', 'Dodge and Burn', 'High-End Retouching', 'Skin Tones', 'Photoshop Actions', 'Liquify'],
    documents: [
      'Bộ Photoshop Actions tự động thiết lập các lớp Frequency Separation và Dodge & Burn trong 1 giây',
      'Bộ ảnh RAW chân dung độ phân giải 45MP chuẩn quốc tế dành riêng cho thực hành'
    ]
  },
  {
    title: 'Thiết Kế Bao Bì Sản Phẩm (Packaging Design) & Mô Phỏng Không Gian 3D Mockup',
    slug: 'thiet-ke-bao-bi-san-pham-packaging-design-mo-phong-khong-gian-3d-mockup',
    categorySlug: 'thiet-ke-do-hoa',
    level: CourseLevel.INTERMEDIATE,
    price: 650000,
    oldPrice: 990000,
    leadSummary: 'Làm chủ quy trình thiết kế bao bì từ việc xây dựng bản vẽ trải phẳng (Dieline), lựa chọn chất liệu in ấn đến mô phỏng sản phẩm 3D sống động trong không gian trưng bày.',
    industryContext: 'Bao bì là người bán hàng thầm lặng trên kệ siêu thị; một thiết kế bao bì độc đáo không chỉ bảo vệ sản phẩm mà còn kích thích quyết định mua hàng trong tích tắc.',
    coreTopics: [
      'Các loại cấu trúc bao bì: Hộp giấy, Túi zip màng nhôm, Chai lọ thủy tinh, Lon kim loại và Nhãn mác',
      'Đọc hiểu và tạo bản vẽ kỹ thuật trải phẳng (Dielines): Đường cấn gấp (Crease), Đường cắt (Cut) và Vùng dán keo',
      'Quy chuẩn thông tin pháp lý trên bao bì: Mã vạch Barcode/QR, Bảng thành phần dinh dưỡng, Hạn sử dụng',
      'Các hiệu ứng in ấn đặc biệt: Ép kim vàng/bạc (Foil Stamping), Thúc nổi (Embossing), Phủ UV định hình',
      'Mô phỏng hình ảnh 3D chân thực của sản phẩm bằng Adobe Substance 3D Stager hoặc Photoshop 3D Mockups'
    ],
    handsOnProject: 'Thiết kế trọn bộ bao bì hộp trà thảo mộc cao cấp bao gồm bản vẽ in ấn kỹ thuật và bộ ảnh 3D Mockup phục vụ quảng cáo.',
    targetAudience: 'Graphic Designer muốn mở rộng chuyên môn sang lĩnh vực thiết kế sản phẩm tiêu dùng nhanh (FMCG).',
    careerApplication: 'Làm việc tại các phòng sáng tạo của các tập đoàn sản xuất hàng tiêu dùng hoặc xưởng bao bì xuất khẩu.',
    requirements: [
      'Thành thạo Adobe Illustrator và Photoshop',
      'Khả năng tư duy hình học không gian 3 chiều cơ bản'
    ],
    benefits: [
      'Tạo bản vẽ kỹ thuật chuẩn xác đến từng milimet, không bao giờ bị lệch khi dập khuôn thực tế',
      'Biết cách thiết lập các lớp file riêng biệt cho các hiệu ứng ép nhũ, phủ bóng UV cho nhà in',
      'Tạo ra các hình ảnh mô phỏng 3D tuyệt đẹp để đưa vào hồ sơ chào hàng mà không cần đợi sản xuất mẫu',
      'Hiểu rõ đặc tính của các chất liệu giấy, nhựa, thủy tinh để tư vấn giải pháp tối ưu chi phí cho khách hàng'
    ],
    techniques: ['Packaging Design', 'Dieline', 'Print Finishing', '3D Mockup', 'Adobe Illustrator', 'FMCG Branding'],
    documents: [
      'Thư viện 30 bản vẽ khuôn hộp (Dieline Templates) chuẩn công nghiệp thông dụng nhất',
      'Bộ Mockup chai lọ và hộp giấy 3D PSD chất lượng cao có thể thay đổi thiết kế nhanh'
    ]
  },
  {
    title: 'Nghệ Thuật Dàn Trang Sách Báo & Ấn Phẩm Xuất Bản Chuyên Nghiệp Với Adobe InDesign',
    slug: 'nghe-thuat-dan-trang-sach-bao-an-pham-xuat-ban-chuyen-nghiep-voi-adobe-indesign',
    categorySlug: 'thiet-ke-do-hoa',
    level: CourseLevel.INTERMEDIATE,
    price: 550000,
    oldPrice: 850000,
    leadSummary: 'Làm chủ phần mềm dàn trang số một ngành xuất bản Adobe InDesign: Thiết kế sách báo, tạp chí thời trang, catalogue giới thiệu sản phẩm và hồ sơ năng lực công ty.',
    industryContext: 'Khi phải xử lý những ấn phẩm dày hàng chục hoặc hàng trăm trang, InDesign là công cụ tối thượng mà Photoshop hay Illustrator không thể nào thay thế được.',
    coreTopics: [
      'Kiến trúc tài liệu nhiều trang trong InDesign: Master Pages (Trang chủ), Lưới cột (Grid Systems) và Đánh số trang tự động',
      'Quản lý văn bản hàng loạt với Paragraph Styles và Character Styles: Thay đổi định dạng toàn bộ cuốn sách chỉ trong 1 cú nhấp',
      'Xử lý hình ảnh liên kết (Links Panel) và ngắt dòng văn bản bao quanh hình (Text Wrap)',
      'Tạo bảng mục lục tự động (Table of Contents), chú thích cuối trang (Footnotes) và chỉ mục tra cứu',
      'Xuất bản ấn phẩm kỹ thuật số tương tác (Interactive PDF) và đóng gói gói tệp (Package) gửi nhà in'
    ],
    handsOnProject: 'Dàn trang hoàn chỉnh một cuốn tạp chí du lịch dày 32 trang với bố cục hiện đại, hình ảnh tràn lề và hệ thống kiểu chữ chuẩn mực.',
    targetAudience: 'Graphic Designer làm việc trong ngành xuất bản báo chí, công ty thiết kế hoặc doanh nghiệp thường xuyên làm hồ sơ năng lực.',
    careerApplication: 'Tự tin ứng tuyển các vị trí Dàn trang ấn phẩm (Desktop Publishing Specialist) tại các nhà xuất bản và tòa soạn.',
    requirements: [
      'Máy tính cá nhân cài đặt phần mềm Adobe InDesign CC',
      'Kiến thức cơ bản về phân loại font chữ và bố cục trang'
    ],
    benefits: [
      'Tiết kiệm hàng chục giờ đồng hồ khi dàn trang các tài liệu dài hàng trăm trang nhờ hệ thống Styles tự động',
      'Kiểm soát tuyệt đối các lỗi ngắt dòng luộm thuộm (Widows & Orphans) trong trình bày văn bản chuyên nghiệp',
      'Thiết lập lưới bố cục dạng Modular hoặc Baseline Grid giúp các dòng chữ thẳng hàng tuyệt đối giữa các cột',
      'Kiểm tra và sửa chữa toàn bộ lỗi thiếu hình, sai màu trước khi xuất bản in bằng Preflight'
    ],
    techniques: ['Adobe InDesign', 'Editorial Design', 'Grid Systems', 'Paragraph Styles', 'Preflight', 'Book Layout'],
    documents: [
      'Bộ 5 mẫu dàn trang Catalogue và Tạp chí chuẩn khổ A4 và US Letter sẵn dùng',
      'Bảng quy chuẩn kiểm tra kỹ thuật xuất file in (Preflight Checklist) trong InDesign'
    ]
  },
  {
    title: 'Vẽ Minh Họa Kỹ Thuật Số (Digital Illustration) Cho Người Mới Bắt Đầu',
    slug: 've-minh-hoa-ky-thuat-so-digital-illustration-cho-nguoi-moi-bat-dau',
    categorySlug: 'thiet-ke-do-hoa',
    level: CourseLevel.INTERMEDIATE,
    price: 590000,
    oldPrice: 890000,
    leadSummary: 'Khai phóng khả năng sáng tạo hội họa trên máy tính với Photoshop và Procreate: Phác thảo ý tưởng, vẽ nét Lineart, phối màu ánh sáng và tạo chất cảm tranh sống động.',
    industryContext: 'Hình vẽ minh họa độc bản đang trở thành xu hướng thống trị trên các website hiện đại, bao bì sản phẩm và bìa sách nhờ khả năng truyền tải cảm xúc độc đáo.',
    coreTopics: [
      'Làm quen với bảng vẽ điện tử và cài đặt lực nhấn ngòi bút (Pen Pressure Sensitivity)',
      'Quy trình sáng tạo một bức tranh minh họa: Tìm kiếm cảm hứng (Moodboard), Phác thảo sơ bộ (Thumbnailing) và Đi nét hoàn thiện (Lineart)',
      'Lý thuyết dựng khối và nguồn sáng: Đổ bóng bản thân (Form Shadow), Bóng đổ (Cast Shadow) và Ánh sáng phản xạ',
      'Kỹ thuật phối màu tranh: Lên mảng màu phẳng (Flat Color) và tô màu bóng chuyển tiếp (Rendering)',
      'Sử dụng Brush tạo chất cảm: Hạt cát (Grain), Màu nước (Watercolor) và Sơn dầu truyền thống'
    ],
    handsOnProject: 'Vẽ một bức tranh minh họa phong cảnh một góc phố cổ Hà Nội mùa thu mang phong cách nghệ thuật ấm áp, giàu cảm xúc.',
    targetAudience: 'Những ai yêu thích vẽ tranh, muốn chuyển từ vẽ giấy truyền thống sang vẽ trên máy tính hoặc iPad.',
    careerApplication: 'Bước chân vào con đường họa sĩ vẽ minh họa tự do (Freelance Illustrator), vẽ bìa sách báo và thiết kế nhân vật.',
    requirements: [
      'Máy tính có bảng vẽ đồ họa (Wacom, Huion, XP-Pen) hoặc iPad có Apple Pencil kèm ứng dụng Procreate',
      'Sự yêu thích vẽ vời và đam mê sáng tạo hình ảnh'
    ],
    benefits: [
      'Thao tác vẽ nét mượt mà, tự nhiên trên bảng vẽ điện tử không còn cảm giác trơn trượt',
      'Biết cách dựng nguồn sáng nhất quán giúp đồ vật và nhân vật có độ nổi khối chân thực',
      'Tự tạo và tùy biến các loại cọ vẽ (Custom Brushes) mang đậm dấu ấn cá nhân',
      'Hoàn thiện những bức tranh kỹ thuật số lung linh sẵn sàng in ấn làm quà tặng hoặc bán bản quyền'
    ],
    techniques: ['Digital Painting', 'Procreate', 'Photoshop Drawing', 'Lineart', 'Color Shading', 'Brushwork'],
    documents: [
      'Bộ sưu tập 30 cọ vẽ kỹ thuật số độc quyền (Digital Brushes) tạo chất liệu phong phú',
      'File vẽ từng bước từng lớp (Layer by Layer PSD) để học viên tham khảo cấu trúc bài vẽ'
    ]
  },
  {
    title: 'Thiết Kế Đồ Họa Động (Motion Graphics) & Kỹ Xảo Hoạt Họa Trong Quảng Cáo',
    slug: 'thiet-ke-do-hoa-dong-motion-graphics-ky-xao-hoat-hoa-trong-quang-cao',
    categorySlug: 'thiet-ke-do-hoa',
    level: CourseLevel.INTERMEDIATE,
    price: 790000,
    oldPrice: 1250000,
    leadSummary: 'Thổi sức sống chuyển động vào các hình ảnh đồ họa tĩnh với Adobe After Effects: Tạo logo chuyển động (Logo Animation), Video giải thích (Explainer Video) và đồ họa thông tin (Infographics).',
    industryContext: 'Video ngắn và đồ họa chuyển động đang là định dạng nội dung có tỷ lệ chuyển đổi cao nhất trên mạng xã hội, mở ra cơ hội vàng cho các Motion Graphic Designer.',
    coreTopics: [
      'Kết nối liền mạch giữa tệp vector Illustrator và không gian làm việc After Effects',
      'Làm chủ hệ thống Keyframe, đồ thị vận tốc Graph Editor và điều khiển gia tốc mượt mà',
      'Tạo hiệu ứng hình khối sống động với Shape Layers: Trim Paths, Repeater, Wiggle và Morphing',
      'Làm chữ chuyển động nghệ thuật (Kinetic Typography) theo nhịp điệu âm nhạc quảng cáo',
      'Kỹ thuật hoạt họa nhân vật 2D cơ bản: Gắn xương (Rigging) đơn giản bằng plugin Limber / Duik Bassel'
    ],
    handsOnProject: 'Sản xuất một video hoạt họa quảng cáo 30 giây giới thiệu tính năng ứng dụng giao hàng thông minh kết hợp âm thanh sống động.',
    targetAudience: 'Graphic Designer muốn nâng cấp kỹ năng lên đồ họa chuyển động, Video Editor muốn học thêm kỹ xảo.',
    careerApplication: 'Trở thành Motion Graphic Designer làm việc tại các công ty truyền thông, đài truyền hình hoặc Production House.',
    requirements: [
      'Thành thạo cơ bản Adobe Illustrator',
      'Máy tính cá nhân cấu hình khá (RAM tối thiểu 16GB, có card đồ họa rời là lợi thế)'
    ],
    benefits: [
      'Tự làm các đoạn hoạt họa biến hóa hình khối kỳ diệu thu hút mắt người xem ngay lập tức',
      'Biến các con số thống kê khô khan thành các biểu đồ chuyển động sinh động, hấp dẫn',
      'Làm chủ nhịp điệu (Pacing & Timing) giúp video chuyển động nhịp nhàng, bắt tai bắt mắt',
      'Nâng mức thù lao dự án lên gấp 2-3 lần so với chỉ thiết kế ấn phẩm 2D tĩnh thông thường'
    ],
    techniques: ['Motion Graphics', 'After Effects', 'Kinetic Typography', 'Shape Animation', 'Character Rigging', 'Explainer Video'],
    documents: [
      'Bộ kịch bản phân cảnh mẫu (Storyboard Template) phục vụ lên ý tưởng trước khi làm chuyển động',
      'Gói thư viện âm thanh hiệu ứng (Sound Effects) bản quyền dành riêng cho Motion Design'
    ]
  },
  {
    title: 'Xây Dựng Portfolio Thiết Kế Đồ Họa Đỉnh Cao & Chiến Lược Nhận Dự Án Freelance Quốc Tế',
    slug: 'xay-dung-portfolio-thiet-ke-do-hoa-dinh-cao-chien-luoc-freelance-quoc-te',
    categorySlug: 'thiet-ke-do-hoa',
    level: CourseLevel.INTERMEDIATE,
    price: 450000,
    oldPrice: 750000,
    leadSummary: 'Biến các tác phẩm thiết kế thành hồ sơ năng lực (Portfolio) triệu view trên Behance, Dribbble và học cách định giá, thương lượng hợp đồng Freelance với khách hàng nước ngoài.',
    industryContext: 'Hàng ngàn designer có kỹ năng tốt nhưng vẫn thất nghiệp vì không biết cách đóng gói câu chuyện dự án và tiếp thị bản thân ra thế giới bên ngoài.',
    coreTopics: [
      'Cấu trúc một Case Study đồ họa chuẩn mực: Vấn đề của khách hàng, Quy trình tư duy, Giải pháp thị giác và Kết quả đạt được',
      'Nghệ thuật trình bày dự án trên Behance: Bố cục dọc, Phối cảnh Mockup, Ảnh động GIF và Phân đoạn câu chuyện',
      'Xây dựng thương hiệu cá nhân trên mạng xã hội nghề nghiệp: Behance, Dribbble, LinkedIn và Instagram',
      'Định giá dịch vụ thiết kế: Tính giá theo giờ (Hourly Rate) vs Tính giá theo giá trị mang lại (Value-Based Pricing)',
      'Quy trình làm việc chuyên nghiệp: Hợp đồng thiết kế, Điều khoản đặt cọc, Giới hạn số lần sửa và Chăm sóc khách hàng'
    ],
    handsOnProject: 'Hoàn thiện một trang Case Study dự án nhận diện thương hiệu chuẩn quốc tế trên Behance đạt huy hiệu Featured.',
    targetAudience: 'Graphic Designer ở mọi cấp độ chuẩn bị tìm việc hoặc muốn bắt đầu sự nghiệp Freelancer tự do tài chính.',
    careerApplication: 'Tự tin đàm phán mức lương mơ ước hoặc kiếm hàng nghìn đô la từ các khách hàng toàn cầu qua Upwork, Fiverr.',
    requirements: [
      'Đã có sẵn ít nhất 2-3 dự án thiết kế hoàn thiện (dù là dự án giả định hay dự án thực tế)',
      'Mong muốn phát triển sự nghiệp thiết kế bài bản và chuyên nghiệp'
    ],
    benefits: [
      'Biết cách kể câu chuyện dự án lôi cuốn khiến nhà tuyển dụng và khách hàng muốn ký hợp đồng ngay lập tức',
      'Chấm dứt nỗi sợ bị khách hàng ép giá hoặc yêu cầu sửa đổi thiết kế vô tội vạ',
      'Thiết lập hợp đồng bảo vệ quyền lợi tác giả và bảo đảm nhận đủ tiền thanh toán đúng hạn',
      'Mở rộng tệp khách hàng vượt ra khỏi biên giới địa lý để tiếp cận thị trường quốc tế'
    ],
    techniques: ['Portfolio Design', 'Behance Case Study', 'Freelance Business', 'Client Negotiation', 'Value-Based Pricing'],
    documents: [
      'Mẫu hợp đồng dịch vụ thiết kế chuẩn song ngữ Anh - Việt bảo vệ quyền sở hữu trí tuệ',
      'Bảng biểu tính toán chi phí sinh hoạt và quy đổi mức giá thiết kế chuẩn thị trường'
    ]
  },
  {
    title: 'Sáng Tạo Kiểu Chữ Nghệ Thuật (Custom Typography & Lettering) Cho Thương Hiệu',
    slug: 'sang-tao-kieu-chu-nghe-thuat-custom-typography-lettering-cho-thuong-hieu',
    categorySlug: 'thiet-ke-do-hoa',
    level: CourseLevel.ADVANCED,
    price: 850000,
    oldPrice: 1350000,
    leadSummary: 'Làm chủ nghệ thuật vẽ chữ thủ công (Custom Lettering) và thiết kế font chữ số hóa hoàn chỉnh bằng phần mềm Glyphs: Mang lại nét độc bản tuyệt đối cho bộ nhận diện.',
    industryContext: 'Các thương hiệu hàng đầu thế giới luôn sở hữu kiểu chữ độc quyền để khắc sâu ấn tượng trong tâm trí khách hàng mà không đối thủ nào có thể sao chép.',
    coreTopics: [
      'Giải phẫu học con chữ (Type Anatomy): Chiều cao x-height, Quai trên (Ascender), Đuôi dưới (Descender), Chân chữ (Serif)',
      'Phác thảo chữ nghệ thuật bằng bút vẽ: Kỹ thuật tạo nét thanh nét đậm (Contrast & Stroke Dynamics)',
      'Số hóa chữ viết tay thành vector siêu mượt trong Illustrator: Đặt điểm Neo chuẩn xác (Extrema Points)',
      'Làm quen phần mềm thiết kế Font chuyên dụng (Glyphs / FontLab): Tạo hệ thống ký tự và dấu tiếng Việt chuẩn',
      'Căn chỉnh khoảng cách ký tự (Kerning & Metrics) và xuất bản tệp Font chuẩn OTF, TTF, WOFF2'
    ],
    handsOnProject: 'Sáng tạo một bộ ký tự chữ hoa nghệ thuật độc bản và thiết kế hoàn chỉnh một Logotype vẽ tay cho thương hiệu rượu vang cao cấp.',
    targetAudience: 'Senior Designer, Type Designer, Nghệ sĩ vẽ chữ (Letterer) muốn chuyên sâu vào đỉnh cao của đồ họa chữ.',
    careerApplication: 'Trở thành chuyên gia sáng tạo kiểu chữ hiếm hoi trên thị trường, cung cấp dịch vụ thiết kế font độc quyền cho tập đoàn.',
    requirements: [
      'Có cảm thụ thị giác xuất sắc và kỹ năng dùng Pen Tool vector thành thạo',
      'Đam mê và kiên nhẫn tỉ mỉ với từng đường nét cong của con chữ'
    ],
    benefits: [
      'Vẽ ra những biểu trưng dạng chữ (Logotype) độc nhất vô nhị không đụng hàng với bất kỳ font sẵn có nào',
      'Tự tay sản xuất ra tệp Font chữ có thể gõ được trên bàn phím máy tính hỗ trợ tiếng Việt đầy đủ',
      'Hiểu rõ các nguyên tắc quang học giúp con chữ trông cân đối tự nhiên trước mắt người nhìn',
      'Gia tăng đáng kể giá trị gói hợp đồng nhận diện thương hiệu khi kèm theo font chữ độc quyền'
    ],
    techniques: ['Custom Lettering', 'Type Design', 'Glyphs App', 'Kerning', 'Font Creation', 'Vector Craftsmanship'],
    documents: [
      'Bảng mẫu giải phẫu chi tiết tỷ lệ các con chữ Latin và hệ thống dấu thanh tiếng Việt',
      'File mẫu thiết lập không gian làm việc ban đầu trên phần mềm Glyphs'
    ]
  },
  {
    title: 'Nghệ Thuật Kể Chuyện Thị Giác Trong Thiết Kế Sáng Tạo (Visual Storytelling)',
    slug: 'nghe-thuat-ke-chuyen-thi-giac-trong-thiet-ke-sang-tao-visual-storytelling',
    categorySlug: 'thiet-ke-do-hoa',
    level: CourseLevel.ADVANCED,
    price: 890000,
    oldPrice: 1450000,
    leadSummary: 'Khai thác sức mạnh của ẩn dụ thị giác, biểu tượng văn hóa và cốt truyện cảm xúc để tạo ra những chiến dịch quảng cáo chạm thẳng vào trái tim người tiêu dùng.',
    industryContext: 'Khách hàng có thể quên những gì bạn nói, nhưng họ sẽ không bao giờ quên cảm xúc mà bạn mang lại thông qua một câu chuyện hình ảnh lay động lòng người.',
    coreTopics: [
      'Cấu trúc hành trình người hùng (The Hero’s Journey) ứng dụng vào xây dựng thông điệp thương hiệu',
      'Kỹ thuật sáng tạo ẩn dụ thị giác (Visual Metaphor): Kết hợp hai khái niệm tưởng chừng không liên quan thành một hình ảnh đắt giá',
      'Biểu tượng học (Semiotics) trong đồ họa: Giải mã ý nghĩa của các dấu hiệu văn hóa, màu sắc và hình tượng',
      'Xây dựng kịch bản hình ảnh đa tầng (Multi-layered Visuals) gợi mở nhiều tầng ý nghĩa cho người xem',
      'Điều phối cảm xúc người xem qua nhịp điệu ánh sáng, màu sắc và góc nhìn máy quay (Cinematic Composition)'
    ],
    handsOnProject: 'Sáng tạo một chiến dịch truyền thông thị giác đầy cảm xúc nâng cao nhận thức về sức khỏe tinh thần người trẻ gồm chuỗi 5 tác phẩm đồ họa liên hoàn.',
    targetAudience: 'Art Director, Senior Graphic Designer, Creative Strategist đang tìm kiếm sự đột phá trong tư duy sáng tạo.',
    careerApplication: 'Vươn lên vị trí Giám đốc Nghệ thuật (Art Director) hoặc Giám đốc Sáng tạo (Creative Director) tại các tập đoàn quảng cáo đa quốc gia.',
    requirements: [
      'Kinh nghiệm thực hành thiết kế đồ họa từ 3 năm trở lên',
      'Tâm hồn giàu trải nghiệm sống và vốn hiểu biết văn hóa, xã hội sâu rộng'
    ],
    benefits: [
      'Không bao giờ cạn kiệt ý tưởng độc đáo nhờ nắm vững phương pháp tư duy ẩn dụ hình ảnh',
      'Tạo ra những tác phẩm quảng cáo có sức sống lâu bền trong tâm trí công chúng',
      'Dẫn dắt các buổi Brainstorming sáng tạo hiệu quả cho toàn bộ đội ngũ thiết kế',
      'Tự tin cầm trịch các chiến dịch sáng tạo lớn cho các thương hiệu hàng đầu'
    ],
    techniques: ['Visual Storytelling', 'Art Direction', 'Semiotics', 'Visual Metaphor', 'Creative Concept', 'Campaign Design'],
    documents: [
      'Bộ bài tập 20 phương pháp kích thích tư duy ẩn dụ thị giác sáng tạo',
      'Tuyển tập phân tích 15 chiến dịch quảng cáo đoạt giải Cannes Lions danh giá'
    ]
  },
  {
    title: 'Đồ Họa 3D Trừu Tượng & Diễn Họa Sản Phẩm Cho Thương Hiệu Với Blender',
    slug: 'do-hoa-3d-truu-tuong-dien-hoa-san-pham-cho-thuong-hieu-voi-blender',
    categorySlug: 'thiet-ke-do-hoa',
    level: CourseLevel.ADVANCED,
    price: 950000,
    oldPrice: 1550000,
    leadSummary: 'Làm chủ phần mềm 3D mã nguồn mở hàng đầu thế giới Blender: Dựng hình khối trừu tượng, mô phỏng chất liệu thủy tinh, kim loại lấp lánh và kết xuất hình ảnh đẳng cấp.',
    industryContext: 'Đồ họa 3D đang trở thành ngôn ngữ thị giác mới của các thương hiệu công nghệ và thời trang tiên phong nhờ vẻ đẹp hiện đại, tương lai và chiều sâu không gian vượt trội.',
    coreTopics: [
      'Không gian ba chiều trong Blender: Tọa độ XYZ, Điều hướng, Dựng hình cơ bản (Mesh Modeling) và Modifiers',
      'Tạo hình trừu tượng (Abstract 3D Art): Sử dụng Geometry Nodes, Cloth Simulation và Dynamic Curves',
      'Nghệ thuật chiếu sáng phòng chụp ảo (Studio Lighting): Key light, Fill light, Rim light và môi trường HDR',
      'Làm chủ vật liệu chân thực (Procedural Shading): Thủy tinh khúc xạ, Kim loại xước, Nhựa nhám và Ánh ngọc trai',
      'Kết xuất đồ họa hiệu năng cao với Cycles Engine và xử lý hậu kỳ hoàn thiện bức ảnh (Compositing)'
    ],
    handsOnProject: 'Dựng hình và diễn họa 3D hoàn chỉnh cho một chai nước hoa xa xỉ đặt giữa khung cảnh thiên nhiên trừu tượng siêu thực.',
    targetAudience: 'Graphic Designer muốn bước chân vào thế giới 3D, 3D Artist muốn ứng dụng vào thiết kế thương hiệu.',
    careerApplication: 'Đáp ứng các đơn đặt hàng sáng tạo hình ảnh 3D cao cấp cho các thương hiệu công nghệ, mỹ phẩm và âm nhạc.',
    requirements: [
      'Máy tính cá nhân có card đồ họa rời (NVIDIA khuyến nghị) và tối thiểu 16GB RAM',
      'Chuột máy tính có con lăn giữa (Middle Click) để điều hướng không gian 3D'
    ],
    benefits: [
      'Tự tay tạo ra các hình khối 3D độc đáo làm Key Visual cho các sự kiện và chiến dịch thương hiệu',
      'Diễn họa sản phẩm chân thực đến từng vết xước mà không cần đến trường quay hay máy ảnh đắt tiền',
      'Làm chủ công cụ Blender hoàn toàn miễn phí nhưng sức mạnh không thua kém phần mềm thương mại hàng nghìn đô',
      'Mở rộng khả năng sáng tạo không giới hạn vượt ra khỏi mặt phẳng hai chiều truyền thống'
    ],
    techniques: ['Blender 3D', '3D Modeling', 'Procedural Shading', 'Studio Lighting', 'Cycles Render', 'Abstract 3D'],
    documents: [
      'Bản đồ phím tắt thao tác nhanh trong Blender 3D dành cho Designer 2D',
      'Gói 50 vật liệu Procedural Shaders sẵn dùng (Kính, Kim loại, Vải, Da, Vàng hồng)'
    ]
  },
  {
    title: 'Giám Đốc Nghệ Thuật (Art Direction): Chỉ Đạo Hình Ảnh & Quản Trị Sáng Tạo Chiến Dịch',
    slug: 'giam-doc-nghe-thuat-art-direction-chi-dao-hinh-anh-quan-tri-sang-tao-chien-dich',
    categorySlug: 'thiet-ke-do-hoa',
    level: CourseLevel.ADVANCED,
    price: 1190000,
    oldPrice: 1890000,
    leadSummary: 'Bước lên đỉnh cao của nghề thiết kế: Làm chủ kỹ năng định hình phong cách thị giác, chỉ đạo buổi chụp ảnh (Photoshoot), viết bản tóm tắt sáng tạo và dẫn dắt đội ngũ nghệ sĩ.',
    industryContext: 'Art Director là người bảo chứng cho linh hồn thẩm mỹ của chiến dịch; họ không trực tiếp vẽ từng pixel mà là người quyết định bức tranh tổng thể sẽ làm rung động công chúng ra sao.',
    coreTopics: [
      'Vai trò và trách nhiệm của Giám đốc Nghệ thuật: Cầu nối giữa chiến lược kinh doanh và thực thi thẩm mỹ',
      'Soạn thảo bản định hướng thị giác (Moodboard & Creative Direction Deck) chuẩn xác và truyền cảm hứng',
      'Chỉ đạo tiền kỳ và hiện trường buổi chụp ảnh / quay phim: Lựa chọn người mẫu, Bối cảnh, Ánh sáng, Trang phục và Đạo cụ',
      'Đánh giá và kiểm duyệt sản phẩm sáng tạo (Creative Feedback): Cách nhận xét khéo léo để đội ngũ phát huy tối đa tài năng',
      'Bảo vệ ý tưởng trước những khách hàng khó tính và dung hòa giữa nghệ thuật và bài toán doanh số'
    ],
    handsOnProject: 'Xây dựng hồ sơ chỉ đạo nghệ thuật hoàn chỉnh cho chiến dịch quảng bá Tết của một nhãn hàng nước giải khát lớn, bao gồm Moodboard, Storyboard và kế hoạch chụp hình.',
    targetAudience: 'Senior Designer, Lead Illustrator, Họa sĩ muốn thăng tiến lên vai trò lãnh đạo nghệ thuật cao nhất.',
    careerApplication: 'Đảm nhận vị trí Art Director tại các Creative Agency hàng đầu như Ogilvy, Dentsu, TBWA hoặc các tập đoàn bán lẻ.',
    requirements: [
      'Tối thiểu 4 năm kinh nghiệm làm việc trong môi trường sáng tạo chuyên nghiệp',
      'Vốn kiến thức thẩm mỹ uyên bác về nhiếp ảnh, điện ảnh, hội họa và thời trang'
    ],
    benefits: [
      'Làm chủ quy trình chỉ đạo nghệ thuật cho các chiến dịch quảng cáo triệu đô',
      'Tự tin điều hành các buổi chụp ảnh và quay phim chuyên nghiệp với hàng chục nhân sự',
      'Biến những bản tóm tắt yêu cầu (Brief) mơ hồ của khách hàng thành những concept hình ảnh choáng ngợp',
      'Định hình phong cách thị giác cho các thương hiệu tầm cỡ quốc gia và quốc tế'
    ],
    techniques: ['Art Direction', 'Photoshoot Direction', 'Moodboard Deck', 'Creative Leadership', 'Visual Branding'],
    documents: [
      'Bộ tài liệu Creative Brief và Photoshoot Guideline mẫu chuẩn agency quốc tế',
      'Sách hướng dẫn giao tiếp và đưa phản hồi sáng tạo hiệu quả cho các nghệ sĩ'
    ]
  }
]
