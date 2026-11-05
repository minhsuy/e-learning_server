import { CourseLevel } from '@prisma/client'
import { CourseBlueprint } from './categories-data'

export const COURSES_BUSINESS_MARKETING: readonly CourseBlueprint[] = [
  // ==========================================
  // CAT-11: Digital Marketing & Tăng trưởng trực tuyến (22 courses)
  // Quota: 7 BEGINNER, 10 INTERMEDIATE, 5 ADVANCED | 2 FREE, 20 PAID
  // ==========================================
  {
    title: 'Nhập Môn Digital Marketing: Bức Tranh Toàn Cảnh & Lộ Trình Nghề Nghiệp Từ Số 0',
    slug: 'nhap-mon-digital-marketing-buc-tranh-toan-canh-lo-trinh-nghe-nghiep-tu-so-0',
    categorySlug: 'digital-marketing',
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0,
    leadSummary: 'Hiểu rõ bản chất tiếp thị số, phân biệt các kênh truyền thông chủ lực và xây dựng tư duy đa kênh từ SEO, Quảng cáo đến Mạng xã hội cho người mới bắt đầu.',
    industryContext: 'Trong thời đại số hóa, mọi doanh nghiệp từ tiểu thương đến tập đoàn toàn cầu đều cần Digital Marketing để tiếp cận và giữ chân khách hàng mục tiêu.',
    coreTopics: [
      'Bản chất Marketing: Mô hình 4P, 7P và sự chuyển dịch sang mô hình 4C trong môi trường số',
      'Hệ thống kênh truyền thông số: Phân biệt Earned Media, Owned Media và Paid Media',
      'Hành trình khách hàng trực tuyến: Mô hình AIDA (Attention, Interest, Desire, Action) và Phễu chuyển đổi số',
      'Tổng quan các bộ phận: SEO, Content, Performance Ads, Social Media, Email Marketing và Marketing Automation',
      'Các chỉ số đo lường hiệu quả cốt lõi: Reach, Impressions, CTR, CPC, CPM, CPA và ROI'
    ],
    handsOnProject: 'Xây dựng một bản kế hoạch truyền thông số sơ bộ đa kênh cho một sản phẩm mới trong ngành thực phẩm đồ uống.',
    targetAudience: 'Sinh viên các ngành kinh tế, người chuyển ngành sang Marketing, chủ cửa hàng kinh doanh nhỏ lẻ.',
    careerApplication: 'Định hình rõ định hướng chuyên môn để lựa chọn nhánh phát triển sự nghiệp phù hợp trong ngành Digital Marketing.',
    requirements: [
      'Không yêu cầu bằng cấp hay kinh nghiệm marketing trước đó',
      'Sử dụng Internet thành thạo và yêu thích quan sát hành vi mua sắm trực tuyến'
    ],
    benefits: [
      'Nắm bắt bức tranh toàn cảnh không còn cảm giác mơ hồ trước hàng loạt thuật ngữ viết tắt',
      'Hiểu rõ khách hàng mục tiêu của mình đang xuất hiện ở những kênh trực tuyến nào',
      'Biết cách đọc và phân tích các chỉ số cơ bản trong báo cáo tiếp thị',
      'Xây dựng lộ trình học tập và tích lũy kỹ năng thực tế có định hướng rõ ràng'
    ],
    techniques: ['Digital Marketing', 'Marketing Funnel', 'AIDA Model', 'Customer Journey', 'Digital Media', 'Marketing Metrics'],
    documents: [
      'Từ điển 100 thuật ngữ Digital Marketing thông dụng nhất',
      'Mẫu lập kế hoạch truyền thông tích hợp tổng quan (Master Plan Template)'
    ]
  },
  {
    title: 'SEO Cơ Bản Cho Người Mới Bắt Đầu: Tối Ưu Hóa Công Cụ Tìm Kiếm Google',
    slug: 'seo-co-ban-cho-nguoi-moi-bat-dau-toi-uu-hoa-cong-cu-tim-kiem-google',
    categorySlug: 'digital-marketing',
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0,
    leadSummary: 'Đưa website lên trang nhất Google hoàn toàn miễn phí: Nghiên cứu từ khóa mục tiêu, tối ưu On-Page và xây dựng cấu trúc bài viết chuẩn SEO.',
    industryContext: 'Hơn 90% trải nghiệm mua sắm trực tuyến bắt đầu từ một lượt tìm kiếm trên Google; SEO đem lại nguồn truy cập bền vững và tỷ lệ chuyển đổi cao nhất.',
    coreTopics: [
      'Cơ chế hoạt động của bộ máy tìm kiếm Google: Thu thập dữ liệu (Crawling), Lập chỉ mục (Indexing) và Xếp hạng (Ranking)',
      'Kỹ thuật nghiên cứu từ khóa với Google Keyword Planner: Xác định Search Intent và độ khó từ khóa',
      'Tối ưu hóa On-Page chuẩn SEO: Thẻ tiêu đề Title, Meta Description, Thẻ Heading (H1, H2, H3), URL thân thiện và Alt hình ảnh',
      'Tối ưu liên kết nội bộ (Internal Linking) và cấu trúc cây nội dung chuyên đề (Topic Clusters)',
      'Cài đặt và sử dụng các công cụ miễn phí đắc lực: Google Search Console và Google Analytics 4'
    ],
    handsOnProject: 'Viết và tối ưu một bài viết blog chuẩn SEO 1500 từ cho website bất động sản đạt điểm xanh trên Yoast SEO / Rank Math.',
    targetAudience: 'Người viết nội dung (Content Writer), Quản trị website, Marketer mới vào nghề, Người muốn xây blog kiếm tiền tiếp thị liên kết.',
    careerApplication: 'Tự tin ứng tuyển vị trí Junior SEO Executive hoặc tự tối ưu website cá nhân lên top Google.',
    requirements: [
      'Có kỹ năng viết tiếng Việt rõ ràng, mạch lạc',
      'Biết sử dụng máy tính và các trình soạn thảo văn bản thông thường'
    ],
    benefits: [
      'Hiểu sâu cách Google đánh giá và xếp hạng một bài viết có giá trị cho người dùng',
      'Tìm kiếm được những từ khóa ngách có lượng tìm kiếm tốt nhưng ít đối thủ cạnh tranh',
      'Tối ưu On-Page bài bản giúp website nhanh chóng được Google thu thập và index',
      'Đọc hiểu báo cáo Google Search Console để phát hiện những từ khóa đang mang lại khách truy cập'
    ],
    techniques: ['SEO', 'On-Page SEO', 'Keyword Research', 'Google Search Console', 'Topic Clusters', 'Search Intent'],
    documents: [
      'Checklist 25 tiêu chuẩn On-Page SEO bắt buộc kiểm tra trước khi xuất bản bài viết',
      'Bảng mẫu nghiên cứu từ khóa và phân nhóm Search Intent trên Google Sheets'
    ]
  },
  {
    title: 'Nghệ Thuật Viết Nội Dung Bán Hàng Thôi Miên (Copywriting & Content Marketing)',
    slug: 'nghe-thuat-viet-noi-dung-ban-hang-thoi-mien-copywriting-content-marketing',
    categorySlug: 'digital-marketing',
    level: CourseLevel.BEGINNER,
    price: 399000,
    oldPrice: 650000,
    leadSummary: 'Làm chủ nghệ thuật sử dụng ngòi bút lay động cảm xúc và kích thích hành vi mua hàng: Áp dụng các công thức kinh điển PAS, AIDA, FAB và Storytelling.',
    industryContext: 'Nội dung là vua (Content is King); hình ảnh và quảng cáo có thể thu hút sự chú ý, nhưng câu từ sắc bén mới là thứ trực tiếp mang tiền về cho doanh nghiệp.',
    coreTopics: [
      'Phân biệt Copywriting (Viết để bán hàng ngay) và Content Marketing (Xây dựng niềm tin dài hạn)',
      'Nghiên cứu sâu Insight khách hàng: Nỗi đau (Pain points), Nỗi sợ hãi (Fears) và Mong ước thầm kín (Desires)',
      'Các công thức viết bài quảng cáo kinh điển: AIDA, PAS (Problem - Agitate - Solve), FAB (Features - Advantages - Benefits)',
      'Nghệ thuật giật tít (Headline): 10 mẫu tiêu đề khiến người đọc không thể không bấm vào',
      'Kỹ thuật viết trang đích chuyển đổi cao (Landing Page Copywriting) và bài quảng cáo Facebook thu hút'
    ],
    handsOnProject: 'Soạn thảo trọn bộ nội dung bán hàng gồm 3 bài quảng cáo Facebook, 1 kịch bản video ngắn và 1 bài viết Landing Page cho sản phẩm chăm sóc da.',
    targetAudience: 'Người làm Content, Nhân viên kinh doanh online, Freelance Writer và chủ shop tự kinh doanh.',
    careerApplication: 'Trở thành Copywriter chuyên nghiệp có thể tạo ra doanh số đột phá từ ngòi bút.',
    requirements: [
      'Yêu thích viết lách và mong muốn cải thiện khả năng truyền tải ý tưởng',
      'Có khả năng quan sát tâm lý con người trong cuộc sống thường nhật'
    ],
    benefits: [
      'Chấm dứt hoàn toàn tình trạng cạn kiệt ý tưởng hoặc ngồi nhìn trang giấy trắng hàng giờ liền',
      'Biết cách chuyển hóa các đặc tính kỹ thuật khô khan thành lợi ích sống động, hấp dẫn khách hàng',
      'Viết những câu mở đầu sắc lẹm khiến người đọc bị cuốn hút cho đến tận dòng kêu gọi hành động cuối cùng',
      'Nâng cao tỷ lệ chuyển đổi bài viết bán hàng mà không tạo cảm giác chào mời thô thiển'
    ],
    techniques: ['Copywriting', 'Content Marketing', 'AIDA Formula', 'PAS Formula', 'Storytelling', 'Headline Formulas'],
    documents: [
      'Sổ tay 100 tiêu đề mẫu có tỷ lệ click cao nhất mọi thời đại',
      'Bộ khung kịch bản viết bài bán hàng và trang đích tối ưu tỷ lệ mua'
    ]
  },
  {
    title: 'Quảng Cáo Facebook & Instagram Ads Thực Chiến Cho Người Mới Bắt Đầu',
    slug: 'quang-cao-facebook-instagram-ads-thuc-chien-cho-nguoi-moi-bat-dau',
    categorySlug: 'digital-marketing',
    level: CourseLevel.BEGINNER,
    price: 450000,
    oldPrice: 750000,
    leadSummary: 'Thiết lập chiến dịch quảng cáo Meta Ads chuẩn mực: Quản trị tài khoản doanh nghiệp BM, nhắm mục tiêu chuẩn xác, A/B testing và đọc hiểu số liệu.',
    industryContext: 'Hệ sinh thái Meta với hàng chục triệu người dùng Việt Nam vẫn là cỗ máy tạo đơn hàng tức thời mạnh mẽ nhất cho các ngành hàng bán lẻ.',
    coreTopics: [
      'Cấu trúc tài khoản quảng cáo Meta: Business Suite, Business Manager (BM), Phân quyền và Thẻ thanh toán an toàn',
      'Cấu trúc 3 tầng của chiến dịch quảng cáo: Chiến dịch (Campaign) - Nhóm quảng cáo (Ad Set) - Quảng cáo (Ad)',
      'Lựa chọn mục tiêu chiến dịch phù hợp: Tin nhắn (Messages), Tương tác (Engagement) hay Chuyển đổi (Conversions)',
      'Nhắm chọn mục tiêu chi tiết (Targeting): Nhân khẩu học, Vị trí địa lý, Sở thích và Hành vi người dùng',
      'Kiểm tra thử nghiệm A/B Creative (Hình ảnh, Video, Nội dung) để tìm ra mẫu quảng cáo chiến thắng (Winning Ad)'
    ],
    handsOnProject: 'Tạo lập và khởi chạy một chiến dịch quảng cáo tin nhắn bán hàng trên Facebook với ngân sách 100.000đ/ngày mang lại tin nhắn đầu tiên.',
    targetAudience: 'Chủ shop kinh doanh online, Nhân viên tiếp thị mới phụ trách chạy ads, Cá nhân kinh doanh dịch vụ.',
    careerApplication: 'Tự tin vận hành các chiến dịch quảng cáo Facebook cơ bản cho bản thân hoặc doanh nghiệp nhỏ.',
    requirements: [
      'Có tài khoản cá nhân Facebook hoạt động bình thường trên 6 tháng',
      'Có thẻ thanh toán quốc tế Visa hoặc Mastercard có sẵn số dư tối thiểu 100.000 VNĐ'
    ],
    benefits: [
      'Tự tay tạo và quản trị tài khoản quảng cáo an toàn, hạn chế tối đa nguy cơ bị khóa tài khoản bất thường',
      'Biết cách chọn đúng đối tượng khách hàng thực sự có nhu cầu mua hàng, tránh lãng phí ngân sách',
      'Hiểu rõ các chỉ số giá tin nhắn, CPM, CTR để đánh giá mẫu quảng cáo đang đắt hay rẻ',
      'Không còn phụ thuộc vào các đơn vị dịch vụ quảng cáo bên ngoài'
    ],
    techniques: ['Facebook Ads', 'Instagram Ads', 'Meta Business Suite', 'Ad Targeting', 'AB Testing', 'Ad Budgeting'],
    documents: [
      'Cẩm nang xử lý các chính sách vi phạm quảng cáo Meta và quy trình kháng nghị tài khoản',
      'Checklist 10 bước kiểm tra bắt buộc trước khi bấm nút Đăng (Publish) chiến dịch quảng cáo'
    ]
  },
  {
    title: 'Xây Dựng Kênh TikTok & Sáng Tạo Video Ngắn Triệu View Từ Con Số 0',
    slug: 'xay-dung-kenh-tiktok-sang-tao-video-ngan-trieu-view-tu-con-so-0',
    categorySlug: 'digital-marketing',
    level: CourseLevel.BEGINNER,
    price: 399000,
    oldPrice: 650000,
    leadSummary: 'Làm chủ thuật toán gợi ý của TikTok: Lên kịch bản giữ chân người xem trong 3 giây đầu, quay dựng video bằng điện thoại với CapCut và xây kênh bền vững.',
    industryContext: 'Video dạng ngắn (Short-form Video) là xu hướng tiêu thụ nội dung bùng nổ nhất lịch sử; TikTok là đòn bẩy nhanh nhất để xây dựng thương hiệu cá nhân và bán lẻ.',
    coreTopics: [
      'Giải mã thuật toán phân phối For You Page (FYP): Chỉ số hoàn thành video, Thời gian xem, Tương tác và Tỷ lệ chia sẻ',
      'Định vị kênh và xác lập tệp khán giả mục tiêu: Chủ đề cốt lõi, Phong cách thể hiện và Lịch xuất bản định kỳ',
      'Công thức kịch bản video ngắn: 3 giây Hook giữ chân, 15 giây phát triển nội dung và Kêu gọi hành động khéo léo',
      'Quay dựng video chuyên nghiệp hoàn toàn bằng điện thoại thông minh và ứng dụng CapCut',
      'Quy chuẩn cộng đồng TikTok và những lỗi cấm kỵ khiến kênh bị bóp tương tác (Shadowban)'
    ],
    handsOnProject: 'Lên ý tưởng, viết kịch bản, quay và biên tập hoàn chỉnh một video ngắn 60 giây đăng tải lên TikTok đạt trên 1000 lượt xem tự nhiên.',
    targetAudience: 'Người sáng tạo nội dung mới, Nhà bán hàng muốn khai thác kênh TikTok, Cá nhân muốn xây dựng thương hiệu cá nhân.',
    careerApplication: 'Tự tin phát triển kênh TikTok cho bản thân hoặc đảm nhận vai trò TikTok Creator cho các thương hiệu.',
    requirements: [
      'Điện thoại thông minh có camera hoạt động tốt và cài đặt ứng dụng TikTok, CapCut',
      'Sự tự tin hoặc mong muốn vượt qua rào cản ngại ngùng trước ống kính máy quay'
    ],
    benefits: [
      'Nắm bắt công thức tạo các câu Hook mở đầu hấp dẫn ngăn chặn người xem lướt qua video',
      'Sử dụng thành thạo các tính năng cắt ghép, chèn chữ, lồng nhạc bắt trend trên ứng dụng CapCut',
      'Biết cách chuyển đổi người xem video thành người theo dõi và khách hàng trung thành',
      'Xây dựng kênh sạch, tuân thủ đúng chính sách kiểm duyệt khắt khe của TikTok'
    ],
    techniques: ['TikTok Algorithm', 'Short-form Video', 'CapCut', 'Video Hook', 'Content Ideation', 'Personal Branding'],
    documents: [
      'Bộ sưu tập 50 câu Hook mở đầu video ngắn đã được chứng minh hiệu quả giữ chân người xem',
      'Mẫu kịch bản phân cảnh 2 cột chuẩn cho video TikTok'
    ]
  },
  {
    title: 'Quảng Cáo Google Search Ads Cơ Bản: Tiếp Cận Khách Hàng Đúng Thời Điểm Tìm Kiếm',
    slug: 'quang-cao-google-search-ads-co-ban-tiep-can-khach-hang-tim-kiem',
    categorySlug: 'digital-marketing',
    level: CourseLevel.BEGINNER,
    price: 450000,
    oldPrice: 750000,
    leadSummary: 'Xuất hiện ngay trước mắt khách hàng khi họ chủ động tìm mua sản phẩm với Google Search Ads: Lựa chọn từ khóa, đối sánh, viết mẫu quảng cáo và quản lý giá thầu.',
    industryContext: 'Khách hàng gõ tìm kiếm trên Google là những người có nhu cầu mua sắm cấp thiết nhất; Google Search Ads mang lại tỷ lệ chốt đơn trực tiếp vượt trội.',
    coreTopics: [
      'Tổng quan hệ thống Google Ads và cơ chế đấu giá quảng cáo theo thời gian thực (Ad Auction)',
      'Nghiên cứu và lựa chọn các loại đối sánh từ khóa: Đối sánh rộng (Broad), Khớp cụm từ (Phrase) và Khớp chính xác (Exact)',
      'Sử dụng danh sách từ khóa phủ định (Negative Keywords) để loại bỏ những cú nhấp chuột lãng phí',
      'Viết mẫu quảng cáo tìm kiếm thích ứng (Responsive Search Ads - RSA) điểm chất lượng cao',
      'Cài đặt các tiện ích mở rộng (Assets): Đoạn liên kết trang web, Đoạn chú thích, Cuộc gọi và Khuyến mãi'
    ],
    handsOnProject: 'Cấu hình và triển khai chiến dịch Google Tìm Kiếm cho dịch vụ sửa chữa điện tử với ngân sách thử nghiệm 50.000đ/ngày.',
    targetAudience: 'Người làm tiếp thị, Nhân viên chạy quảng cáo Google, Chủ doanh nghiệp dịch vụ địa phương.',
    careerApplication: 'Tự tin thiết lập và tối ưu các chiến dịch tìm kiếm Google cho các doanh nghiệp vừa và nhỏ.',
    requirements: [
      'Có tài khoản Google (Gmail) và thẻ thanh toán quốc tế Visa/Mastercard',
      'Hiểu biết cơ bản về sản phẩm hoặc dịch vụ mình muốn quảng cáo'
    ],
    benefits: [
      'Hiểu sâu cơ chế xếp hạng Ad Rank dựa trên Điểm chất lượng (Quality Score) và Giá thầu',
      'Ngăn chặn triệt để tình trạng cháy ngân sách do click ảo hoặc người dùng tìm kiếm sai mục đích',
      'Viết các mẫu quảng cáo hấp dẫn với đầy đủ tiện ích liên kết giúp mở rộng diện tích hiển thị',
      'Kiểm soát chi phí theo từng cú nhấp chuột (CPC) một cách minh bạch'
    ],
    techniques: ['Google Ads', 'Google Search Ads', 'Keyword Matching', 'Negative Keywords', 'Quality Score', 'RSA'],
    documents: [
      'Bảng danh sách từ khóa phủ định dùng chung theo từng ngành nghề để ngăn lãng phí ngân sách',
      'Checklist tối ưu điểm chất lượng mẫu quảng cáo đạt mức Tốt và Xuất sắc'
    ]
  },
  {
    title: 'Tiếp Thị Qua Thư Điện Tử (Email Marketing Automation) Với Mailchimp & Brevo',
    slug: 'tiep-thi-qua-thu-dien-tu-email-marketing-automation-mailchimp-brevo',
    categorySlug: 'digital-marketing',
    level: CourseLevel.BEGINNER,
    price: 390000,
    oldPrice: 620000,
    leadSummary: 'Khai thác kênh truyền thông sở hữu (Owned Media) có ROI cao nhất thế giới: Thu thập tệp khách hàng tiềm năng, thiết kế bản tin tin cậy và tự động hóa chuỗi email chào mừng.',
    industryContext: 'Theo các nghiên cứu toàn cầu, Email Marketing mang lại tỷ suất lợi nhuận trung bình lên tới $36 cho mỗi $1 chi phí đầu tư bỏ ra.',
    coreTopics: [
      'Vị thế của Email Marketing trong kỷ nguyên số: Tại sao danh sách email là tài sản vô giá của doanh nghiệp',
      'Kỹ thuật xây dựng danh sách email hợp pháp với Mồi câu chất lượng (Lead Magnet / Opt-in Form)',
      'Thiết kế mẫu thư điện tử (Newsletter Template) chuẩn responsive hiển thị đẹp mắt trên di động',
      'Phân loại và gắn thẻ phân khúc người đăng ký (Segmentation & Tagging) theo hành vi',
      'Thiết lập chuỗi email tự động (Automation Workflow): Email chào mừng, Khảo sát và Chăm sóc định kỳ'
    ],
    handsOnProject: 'Tạo lập trang thu thập email tặng tài liệu miễn phí và cấu hình chuỗi 3 email tự động chăm sóc người đăng ký trên nền tảng Brevo.',
    targetAudience: 'Marketer, Chủ cửa hàng trực tuyến, Giảng viên khóa học, Chuyên gia tư vấn muốn chăm sóc tệp khách hàng dài hạn.',
    careerApplication: 'Làm chủ kênh bán hàng gián tiếp bền vững, không chịu sự phụ thuộc vào sự thay đổi thuật toán của mạng xã hội.',
    requirements: [
      'Có địa chỉ email cá nhân hoặc email theo tên miền doanh nghiệp',
      'Kỹ năng viết lách giao tiếp qua thư từ lịch thiệp'
    ],
    benefits: [
      'Xây dựng danh sách hàng nghìn khách hàng tiềm năng trung thành mà không vi phạm luật chống thư rác (Spam)',
      'Tự động gửi email đúng người, đúng thời điểm mà không tốn công sức làm thủ công mỗi ngày',
      'Nắm bắt các chỉ số tỷ lệ mở thư (Open Rate) và tỷ lệ click (CTR) để liên tục cải tiến tiêu đề thư',
      'Tăng trưởng doanh số bán lại (Re-order) từ tệp khách hàng cũ với chi phí gần như bằng 0'
    ],
    techniques: ['Email Marketing', 'Mailchimp', 'Brevo', 'Lead Magnet', 'Marketing Automation', 'List Segmentation'],
    documents: [
      'Bộ sưu tập 30 tiêu đề email có tỷ lệ mở thư trên 40%',
      'Sơ đồ kịch bản chuỗi email chăm sóc khách hàng tự động cho các ngành phổ biến'
    ]
  },
  {
    title: 'SEO Chuyên Sâu: Chiến Lược Nội Dung Topic Cluster & Xây Dựng Thực Thể Entity',
    slug: 'seo-chuyen-sau-chien-luoc-noi-dung-topic-cluster-xay-dung-thuc-the-entity',
    categorySlug: 'digital-marketing',
    level: CourseLevel.INTERMEDIATE,
    price: 699000,
    oldPrice: 1050000,
    leadSummary: 'Thống trị kết quả tìm kiếm với chiến lược chùm nội dung (Topic Cluster), củng cố độ uy tín thực thể (Semantic SEO & Entity) và tối ưu trải nghiệm người dùng theo chuẩn Google Helpful Content.',
    industryContext: 'Các thuật toán AI mới nhất của Google không còn xếp hạng dựa trên việc nhồi nhét từ khóa đơn lẻ mà đánh giá dựa trên sự am hiểu toàn diện của website về một chủ đề chuyên môn.',
    coreTopics: [
      'Chuyển dịch từ Keyword-centric sang Topic-centric trong kỷ nguyên Semantic Search',
      'Thiết kế cấu trúc Topic Cluster hoàn chỉnh: Bài viết trụ cột (Pillar Page) và các bài viết vệ tinh (Cluster Content)',
      'Xây dựng thực thể doanh nghiệp (Entity Optimization): Đăng ký Google Business Profile, Đồng bộ NAP và Schema Markup',
      'Định hình chỉ số E-E-A-T của Google: Kinh nghiệm (Experience), Chuyên môn (Expertise), Thẩm quyền (Authoritativeness) và Đáng tin cậy (Trustworthiness)',
      'Kiểm toán nội dung toàn trang (Content Audit): Tái cấu trúc, Gộp bài và Loại bỏ nội dung mồ côi (Orphan Pages)'
    ],
    handsOnProject: 'Xây dựng một bản đồ Topic Cluster gồm 1 bài Pillar và 15 bài Cluster cho một trung tâm nha khoa uy tín và viết mã Schema JSON-LD hoàn chỉnh.',
    targetAudience: 'SEO Specialist, Content Leader, Quản lý Marketing muốn đưa website bứt phá trước các đối thủ lớn.',
    careerApplication: 'Tự tin đảm nhận vai trò SEO Strategist cho các dự án quy mô hàng chục nghìn bài viết.',
    requirements: [
      'Đã nắm vững các kiến thức SEO cơ bản và On-page SEO',
      'Hiểu biết cơ bản về cấu trúc mã HTML'
    ],
    benefits: [
      'Tạo dựng cấu trúc website khoa học giúp Google Bot thu thập dữ liệu nhanh chóng và trọn vẹn',
      'Bảo vệ website không bị rớt hạng khi Google tung ra các đợt cập nhật thuật toán cốt lõi (Core Updates)',
      'Chiếm lĩnh đồng loạt hàng trăm từ khóa dài (Long-tail Keywords) liên quan đến chủ đề',
      'Khẳng định vị thế chuyên gia hàng đầu của thương hiệu trong lĩnh vực kinh doanh'
    ],
    techniques: ['Semantic SEO', 'Topic Cluster', 'EEAT', 'Entity SEO', 'Schema Markup', 'Content Audit'],
    documents: [
      'Template bản đồ tư duy Topic Cluster chi tiết trên Mindmeister / XMind',
      'Bộ mã nguồn mẫu Schema JSON-LD cho các thực thể Doanh nghiệp, Bác sĩ, Khóa học và Bài viết'
    ]
  },
  {
    title: 'Kỹ Thuật SEO Kỹ Thuật Số (Technical SEO) & Tối Ưu Tốc Độ Tải Trang Core Web Vitals',
    slug: 'ky-thuat-seo-ky-thuat-so-technical-seo-toi-uu-toc-do-core-web-vitals',
    categorySlug: 'digital-marketing',
    level: CourseLevel.INTERMEDIATE,
    price: 650000,
    oldPrice: 990000,
    leadSummary: 'Làm chủ các yếu tố kỹ thuật ngầm quyết định khả năng lập chỉ mục của website: Kiểm soát ngân sách thu thập dữ liệu (Crawl Budget), file Robots.txt, Sitemap XML và bộ chỉ số Core Web Vitals.',
    industryContext: 'Dù nội dung có hay đến mấy, nếu website bị lỗi kỹ thuật không thể thu thập dữ liệu hoặc tải quá chậm, Google sẽ ngay lập tức giáng hạng trang web của bạn.',
    coreTopics: [
      'Quản lý ngân sách thu thập dữ liệu (Crawl Budget) và tối ưu hóa tệp Robots.txt cùng Sitemap.xml',
      'Xử lý trùng lặp nội dung: Thẻ Canonical, Phân trang (Pagination) và Thẻ Hreflang cho website đa ngôn ngữ',
      'Bộ chỉ số trải nghiệm trang Core Web Vitals: LCP (Largest Contentful Paint), INP (Interaction to Next Paint) và CLS (Cumulative Layout Shift)',
      'Tối ưu hóa tài nguyên web: Nén hình ảnh WebP/AVIF, Trì hoãn JavaScript không thiết yếu và Bộ nhớ đệm (Caching)',
      'Sử dụng Screaming Frog SEO Spider để quét và khắc phục toàn diện các mã lỗi HTTP (404, 301, 500)'
    ],
    handsOnProject: 'Thực hiện kiểm toán kỹ thuật toàn diện cho một website thương mại điện tử bằng Screaming Frog và cải thiện điểm PageSpeed từ 45 lên trên 90 điểm.',
    targetAudience: 'Technical SEO, Web Developer, Quản trị viên hệ thống muốn đảm bảo website hoàn hảo về mặt kỹ thuật.',
    careerApplication: 'Trở thành chuyên gia Technical SEO đắt giá có khả năng phối hợp nhịp nhàng với đội ngũ kỹ sư phần mềm.',
    requirements: [
      'Hiểu biết cơ bản về giao thức web (HTTP/HTTPS), HTML, CSS và JavaScript',
      'Có quyền truy cập quản trị vào một website hoặc máy chủ web để thực hành'
    ],
    benefits: [
      'Phát hiện và vá toàn bộ các lỗ hổng kỹ thuật ngăn cản Google index các trang quan trọng',
      'Tối ưu tốc độ tải trang dưới 2 giây giúp tăng tỷ lệ chuyển đổi và trải nghiệm người dùng mượt mà',
      'Xử lý triệt để hiện tượng xê dịch bố cục gây khó chịu (CLS) khi người dùng lướt web trên di động',
      'Làm chủ công cụ phân tích kỹ thuật chuyên sâu Screaming Frog'
    ],
    techniques: ['Technical SEO', 'Core Web Vitals', 'Screaming Frog', 'PageSpeed Optimization', 'Robots.txt', 'Canonical'],
    documents: [
      'Checklist 50 tiêu chí Technical SEO Audit chuẩn mực',
      'Hướng dẫn cấu hình tệp .htaccess và Nginx tối ưu bộ nhớ đệm và nén tài nguyên'
    ]
  },
  {
    title: 'Tối Ưu Hóa Tỷ Lệ Chuyển Đổi (CRO) Cho Trang Đích (Landing Page Optimization)',
    slug: 'toi-uu-hoa-ty-le-chuyen-doi-cro-cho-trang-dich-landing-page-optimization',
    categorySlug: 'digital-marketing',
    level: CourseLevel.INTERMEDIATE,
    price: 590000,
    oldPrice: 890000,
    leadSummary: 'Biến lượng truy cập đắt đỏ thành khách hàng thực tế: Phân tích bản đồ nhiệt (Heatmaps), ghi lại phiên người dùng, tối ưu luồng thị giác và chạy thử nghiệm A/B Testing khoa học.',
    industryContext: 'Nhân đôi tỷ lệ chuyển đổi cũng có ý nghĩa tương đương với việc bạn nhân đôi doanh số bán hàng mà không cần chi thêm một đồng nào cho tiền chạy quảng cáo.',
    coreTopics: [
      'Khái niệm cốt lõi của CRO (Conversion Rate Optimization) và phương pháp luận thử nghiệm khoa học',
      'Phân tích hành vi định tính với Hotjar / Microsoft Clarity: Heatmaps (Click, Scroll), Session Recordings',
      'Mô hình đánh giá chuyển đổi LIFT Model: Giá trị cốt lõi, Tính liên quan, Độ rõ ràng, Sự lo âu và Tính cấp bách',
      'Tối ưu hóa các thành phần trọng yếu: Tiêu đề Hero Section, Biểu mẫu đăng ký (Form), Nút kêu gọi hành động (CTA)',
      'Quy trình thiết lập và phân tích thử nghiệm A/B Testing chuẩn thống kê để đưa ra quyết định dựa trên dữ liệu'
    ],
    handsOnProject: 'Thực hiện phân tích bản đồ nhiệt của một trang bán hàng, đưa ra 3 giả thuyết cải tiến và thiết kế phiên bản B để thử nghiệm.',
    targetAudience: 'Growth Marketer, Performance Marketer, UI/UX Designer và chủ doanh nghiệp muốn tối ưu hóa chi phí quảng cáo.',
    careerApplication: 'Trở thành chuyên gia tối ưu chuyển đổi được các công ty thương mại điện tử và dịch vụ số săn đón.',
    requirements: [
      'Hiểu biết cơ bản về các chỉ số tiếp thị số (Conversion Rate, Bounce Rate)',
      'Có tư duy phân tích logic và kiên nhẫn với các con số thống kê'
    ],
    benefits: [
      'Nhìn thấu lý do thực sự khiến người dùng rời bỏ trang web mà không mua hàng qua bản đồ nhiệt',
      'Thiết kế biểu mẫu đăng ký thông minh giúp giảm tối đa tỷ lệ bỏ dở',
      'Xây dựng các giả thuyết cải tiến dựa trên dữ liệu hành vi thực tế thay vì suy đoán cảm tính',
      'Gia tăng doanh thu trực tiếp từ cùng một lượng ngân sách quảng cáo hiện hữu'
    ],
    techniques: ['CRO', 'Landing Page', 'Heatmaps', 'A/B Testing', 'Microsoft Clarity', 'Conversion Funnel'],
    documents: [
      'Bảng ma trận đánh giá giả thuyết thử nghiệm PIE Framework (Potential, Importance, Ease)',
      'Bộ tiêu chuẩn 35 điểm vàng tối ưu giao diện Landing Page chuyển đổi cao'
    ]
  },
  {
    title: 'Quảng Cáo Google Performance Max (PMax) & Google Shopping Nâng Cao',
    slug: 'quang-cao-google-performance-max-pmax-google-shopping-nang-cao',
    categorySlug: 'digital-marketing',
    level: CourseLevel.INTERMEDIATE,
    price: 750000,
    oldPrice: 1190000,
    leadSummary: 'Khai thác tối đa sức mạnh máy học của Google với chiến dịch Performance Max: Tối ưu dữ liệu nguồn cấp Google Merchant Center và phân bổ ngân sách thông minh trên mọi kênh.',
    industryContext: 'Performance Max đang là vũ khí số một giúp các nhà bán lẻ trực tuyến tiếp cận khách hàng đồng thời trên Tìm kiếm, YouTube, Gmail, Maps và Mạng hiển thị chỉ bằng một chiến dịch duy nhất.',
    coreTopics: [
      'Bản chất hoạt động của thuật toán Smart Bidding và mô hình phân bổ hướng dữ liệu (Data-driven Attribution)',
      'Thiết lập và chuẩn hóa nguồn cấp dữ liệu sản phẩm (Product Feed) trên Google Merchant Center',
      'Cấu hình nhóm tài sản (Asset Groups) chất lượng cao trong chiến dịch Performance Max: Hình ảnh, Video, Tiêu đề, Logo',
      'Xây dựng tín hiệu đối tượng (Audience Signals): Tệp khách hàng tùy chỉnh, Tệp tiếp thị lại và Dữ liệu bên thứ nhất (First-party Data)',
      'Chiến lược tối ưu hóa và đọc báo cáo chuyên sâu: Báo cáo vị trí hiển thị, Tách chiến dịch theo biên lợi nhuận sản phẩm'
    ],
    handsOnProject: 'Xây dựng một chiến dịch Google Performance Max hoàn chỉnh cho một cửa hàng thời trang với danh mục 50 sản phẩm và tối ưu hóa ROAS.',
    targetAudience: 'Performance Marketer, Quản lý thương mại điện tử, Chủ shop bán lẻ có website bán hàng.',
    careerApplication: 'Tự tin quản lý các chiến dịch quảng cáo ngân sách lớn với hiệu quả lợi nhuận trên chi phí quảng cáo (ROAS) cao.',
    requirements: [
      'Đã có kinh nghiệm chạy Google Search Ads cơ bản',
      'Website bán hàng trực tuyến có giỏ hàng và thanh toán trực tiếp'
    ],
    benefits: [
      'Tận dụng sức mạnh AI của Google để tự động tìm kiếm khách hàng tiềm năng trên mọi nền tảng',
      'Đồng bộ danh mục sản phẩm tự động từ website lên Google Shopping mà không lo sai giá hay hết hàng',
      'Nắm bắt cách huấn luyện thuật toán máy học thông qua việc cung cấp các tín hiệu đối tượng chất lượng',
      'Bảo vệ biên lợi nhuận của doanh nghiệp bằng cách tập trung ngân sách vào các mặt hàng bán chạy nhất'
    ],
    techniques: ['Google Performance Max', 'Google Shopping', 'Google Merchant Center', 'Smart Bidding', 'ROAS Optimization'],
    documents: [
      'Cẩm nang tối ưu hóa tiêu đề và thuộc tính sản phẩm chuẩn Google Shopping',
      'Bảng tính phân bổ ngân sách chiến dịch PMax theo nhóm lợi nhuận sản phẩm'
    ]
  },
  {
    title: 'Quảng Cáo TikTok Ads Chuyên Sâu: Tối Ưu Phễu Chuyển Đổi & Bán Hàng Qua TikTok Shop',
    slug: 'quang-cao-tiktok-ads-chuyen-sau-toi-uu-chuyen-doi-tiktok-shop',
    categorySlug: 'digital-marketing',
    level: CourseLevel.INTERMEDIATE,
    price: 650000,
    oldPrice: 990000,
    leadSummary: 'Làm chủ cỗ máy bán hàng bùng nổ nhất hiện nay: Chạy quảng cáo chuyển đổi TikTok Pixel, tối ưu hóa livestream bán hàng và bùng nổ đơn hàng cùng TikTok Shop.',
    industryContext: 'TikTok Shop đã trở thành sàn thương mại điện tử lớn thứ 2 tại Việt Nam, mở ra kỷ nguyên Shoppertainment (Mua sắm kết hợp giải trí) đầy tiềm năng.',
    coreTopics: [
      'Cài đặt TikTok Ads Manager, Business Center và cấu hình TikTok Pixel chuẩn xác trên website',
      'Các định dạng quảng cáo chuyển đổi chủ lực: Spark Ads (Quảng cáo đẩy bài tự nhiên), Video Shopping Ads',
      'Thiết lập gian hàng TikTok Shop: Quản lý sản phẩm, Vận hành kho vận, Cấu hình chiến dịch khuyến mãi',
      'Quảng cáo Livestream: Kỹ thuật kích thích mắt xem, Giữ chân người xem và Bắn voucher kích cầu chốt đơn liên tục',
      'Hợp tác với mạng lưới nhà sáng tạo (KOC/KOL) qua tính năng Affiliate tiếp thị liên kết trên TikTok Shop'
    ],
    handsOnProject: 'Lên kế hoạch và triển khai một phiên Livestream bán hàng 2 tiếng trên TikTok Shop kết hợp chạy quảng cáo thúc đẩy doanh số đạt mốc 100 đơn hàng.',
    targetAudience: 'Chủ shop thời trang, mỹ phẩm, đồ gia dụng, Nhà sáng tạo nội dung muốn kiếm tiền từ bán hàng trực tiếp.',
    careerApplication: 'Trở thành chuyên viên vận hành TikTok Shop và Performance Ads được các thương hiệu bán lẻ săn lùng.',
    requirements: [
      'Có tài khoản ngân hàng và căn cước công dân để đăng ký gian hàng TikTok Shop',
      'Đã có sản phẩm sẵn sàng kinh doanh và khả năng xuất hiện trong các video ngắn'
    ],
    benefits: [
      'Tự tin thiết lập các chiến dịch quảng cáo TikTok chuyển đổi chi phí thấp, hiệu quả cao',
      'Làm chủ quy trình vận hành một phiên livestream bán hàng năng lượng cao từ khâu chuẩn bị đến chốt deal',
      'Kết nối với hàng trăm KOC/KOL sẵn sàng nhận mẫu thử và làm video bán hàng ăn hoa hồng',
      'Tránh các lỗi vi phạm chính sách bán hàng của TikTok dẫn đến việc bị khóa gian hàng'
    ],
    techniques: ['TikTok Ads', 'TikTok Shop', 'Livestream Selling', 'Spark Ads', 'TikTok Pixel', 'Affiliate Marketing'],
    documents: [
      'Quy chuẩn các từ ngữ bị cấm trên TikTok Shop và cách nói giảm nói tránh an toàn',
      'Bảng kịch bản chi tiết cho phiên livestream bán hàng 2 giờ đỉnh cao'
    ]
  },
  {
    title: 'Phân Tích Dữ Liệu Marketing Với Google Analytics 4 (GA4) & Google Looker Studio',
    slug: 'phan-tich-du-lieu-marketing-google-analytics-4-ga4-looker-studio',
    categorySlug: 'digital-marketing',
    level: CourseLevel.INTERMEDIATE,
    price: 590000,
    oldPrice: 890000,
    leadSummary: 'Làm chủ nền tảng phân tích thế hệ mới Google Analytics 4: Thiết lập sự kiện theo dõi qua Google Tag Manager và xây dựng bảng điều khiển trực quan tự động trên Looker Studio.',
    industryContext: 'Dữ liệu là la bàn của người làm tiếp thị; không thể tối ưu những gì bạn không thể đo lường một cách chính xác và khoa học.',
    coreTopics: [
      'Mô hình dữ liệu dựa trên sự kiện (Event-based Model) của GA4 và sự khác biệt với Universal Analytics cũ',
      'Triển khai theo dõi nâng cao bằng Google Tag Manager (GTM): Sự kiện cuộn trang, Xem video, Nhấp liên kết ngoài và Mua hàng',
      'Thiết lập theo dõi thương mại điện tử (Enhanced E-commerce Tracking): Xem chi tiết, Bỏ giỏ hàng, Bắt đầu thanh toán và Giao dịch',
      'Đọc hiểu các báo cáo trọng yếu trong GA4: Báo cáo chuyển đổi kênh (Acquisition), Mức độ tương tác (Engagement) và Doanh thu',
      'Kết nối dữ liệu GA4 với Google Looker Studio: Thiết kế Dashboard tự động cập nhật báo cáo cho ban giám đốc'
    ],
    handsOnProject: 'Cài đặt hệ thống theo dõi sự kiện hoàn chỉnh qua Google Tag Manager và thiết kế bảng báo cáo tự động trên Looker Studio cho một website khóa học.',
    targetAudience: 'Data Analyst, Performance Marketer, Quản lý Marketing cần báo cáo số liệu minh bạch, tự động hóa.',
    careerApplication: 'Trở thành Marketing Data Specialist có khả năng đo lường và đưa ra các đề xuất kinh doanh dựa trên số liệu chuẩn xác.',
    requirements: [
      'Có quyền truy cập vào một website thực tế để cài đặt mã theo dõi GTM',
      'Tư duy phân tích số liệu và logic'
    ],
    benefits: [
      'Đo lường chính xác từng hành động của khách hàng trên website mà không cần nhờ lập trình viên can thiệp',
      'Xác định rõ ràng kênh quảng cáo nào đang mang lại nhiều doanh thu thực tế nhất',
      'Tiết kiệm hàng chục giờ làm báo cáo Excel thủ công hàng tuần nhờ bảng điều khiển Looker Studio tự động',
      'Tự tin thuyết trình số liệu trước ban lãnh đạo với các biểu đồ trực quan, sinh động'
    ],
    techniques: ['Google Analytics 4', 'GA4', 'Google Tag Manager', 'Looker Studio', 'E-commerce Tracking', 'Data Visualization'],
    documents: [
      'Gói cấu hình mẫu Container Google Tag Manager (GTM JSON) tích hợp sẵn các sự kiện thương mại điện tử',
      'Template báo cáo tổng quan Marketing đa kênh chuyên nghiệp trên Looker Studio'
    ]
  },
  {
    title: 'Chiến Lược Tiếp Thị Đa Kênh Tích Hợp (Omnichannel Marketing Strategy)',
    slug: 'chien-luoc-tiep-thi-da-kenh-tich-hop-omnichannel-marketing-strategy',
    categorySlug: 'digital-marketing',
    level: CourseLevel.INTERMEDIATE,
    price: 790000,
    oldPrice: 1250000,
    leadSummary: 'Hợp nhất toàn bộ các điểm chạm tiếp thị thành một thể thống nhất: Kết nối dữ liệu khách hàng từ Online đến Offline, cá nhân hóa thông điệp và tối ưu hóa vòng đời khách hàng.',
    industryContext: 'Khách hàng ngày nay không mua sắm trên một kênh duy nhất; họ có thể xem sản phẩm trên TikTok, tìm kiếm trên Google, nhận email tư vấn và mua tại cửa hàng vật lý.',
    coreTopics: [
      'Sự khác biệt cốt lõi giữa Tiếp thị đa kênh rời rạc (Multi-channel) và Tiếp thị hợp nhất (Omnichannel)',
      'Bản đồ hành trình khách hàng đa chiều (Omnichannel Customer Journey Map) từ Nhận biết đến Trung thành',
      'Hợp nhất dữ liệu khách hàng: Nền tảng dữ liệu khách hàng (CDP - Customer Data Platform) và hệ thống CRM',
      'Chiến lược nội dung đồng bộ: Giữ vững một thông điệp thương hiệu xuyên suốt mọi nền tảng truyền thông',
      'Mô hình kinh doanh O2O (Online to Offline): Thu hút khách hàng trực tuyến đến trải nghiệm tại điểm bán trực tiếp'
    ],
    handsOnProject: 'Xây dựng kế hoạch chiến dịch tiếp thị tích hợp đa kênh ra mắt chuỗi sản phẩm hữu cơ mới với ngân sách 500 triệu đồng.',
    targetAudience: 'Marketing Manager, Brand Manager, Chủ chuỗi cửa hàng bán lẻ và Nhà hoạch định chiến lược.',
    careerApplication: 'Nâng tầm tư duy lãnh đạo, quản lý toàn diện các chiến dịch tiếp thị quy mô lớn của doanh nghiệp.',
    requirements: [
      'Đã có kinh nghiệm quản lý hoặc thực thi ít nhất 2 kênh tiếp thị số khác nhau',
      'Hiểu biết tổng quan về mô hình kinh doanh bán lẻ hoặc dịch vụ'
    ],
    benefits: [
      'Xóa bỏ tình trạng giẫm chân lên nhau và cạnh tranh nội bộ giữa các phòng ban tiếp thị',
      'Mang lại trải nghiệm nhất quán, mượt mà giúp khách hàng gia tăng niềm tin vào thương hiệu',
      'Tối ưu hóa giá trị trọn đời của khách hàng (Customer Lifetime Value - CLV)',
      'Phân bổ ngân sách tiếp thị thông minh vào các mắt xích mang lại hiệu quả cao nhất'
    ],
    techniques: ['Omnichannel Strategy', 'Customer Data Platform', 'CRM', 'O2O Marketing', 'Customer Lifetime Value', 'Brand Consistency'],
    documents: [
      'Khung kế hoạch tiếp thị tích hợp (Integrated Marketing Communications - IMC Plan Template)',
      'Bảng ma trận phân bổ ngân sách và thông điệp theo từng giai đoạn hành trình khách hàng'
    ]
  },
  {
    title: 'Xây Dựng Thương Hiệu Cá Nhân Đỉnh Cao Trên Mạng Xã Hội (Personal Branding)',
    slug: 'xay-dung-thuong-hieu-ca-nhan-dinh-cao-tren-mang-xa-hoi-personal-branding',
    categorySlug: 'digital-marketing',
    level: CourseLevel.INTERMEDIATE,
    price: 490000,
    oldPrice: 790000,
    leadSummary: 'Biến chuyên môn cá nhân thành tài sản sinh lời: Định vị bản thân, xuất bản nội dung giá trị trên Facebook, LinkedIn, TikTok và mở ra cơ hội nghề nghiệp vô hạn.',
    industryContext: 'Trong thế giới phẳng, thương hiệu cá nhân của bạn chính là bản CV quyền lực nhất; mọi người thích làm ăn và tin tưởng con người cụ thể hơn là những logo công ty vô cảm.',
    coreTopics: [
      'Xác lập định vị độc bản: Bạn là ai, Bạn giúp đỡ ai, Bạn giải quyết vấn đề gì tốt nhất thế giới (Unique Value Proposition)',
      'Chiến lược nội dung cá nhân: Chia sẻ chuyên môn, Câu chuyện trải nghiệm thực tế và Quan điểm sống chân thành',
      'Khai thác sức mạnh mạng xã hội nghề nghiệp LinkedIn: Tối ưu hồ sơ chuyên gia, Kết nối mạng lưới lãnh đạo cấp cao',
      'Kỹ thuật tương tác và kết nối cộng đồng: Biến người theo dõi (Followers) thành người ủng hộ nhiệt thành (Advocates)',
      'Thương mại hóa thương hiệu cá nhân: Nhận lời mời diễn thuyết, Tư vấn chiến lược, Bán khóa học hoặc Dịch vụ chuyên môn'
    ],
    handsOnProject: 'Tái cấu trúc toàn diện hồ sơ LinkedIn và trang cá nhân, viết 5 bài viết chuyên môn sâu thu hút tối thiểu 50 lượt tương tác chất lượng.',
    targetAudience: 'Chuyên gia, Quản lý, Giảng viên, Freelancer, Nhà sáng lập doanh nghiệp muốn gia tăng tầm ảnh hưởng.',
    careerApplication: 'Mở ra vô vàn cơ hội việc làm tốt, đối tác làm ăn tự tìm đến và gia tăng vị thế chuyên gia đầu ngành.',
    requirements: [
      'Có ít nhất một lĩnh vực chuyên môn hoặc đam mê mà bạn muốn chia sẻ với cộng đồng',
      'Sẵn sàng cởi mở và kiên trì xuất bản nội dung đều đặn'
    ],
    benefits: [
      'Xác định rõ ràng định vị hình ảnh cá nhân không bị nhầm lẫn với hàng ngàn người ngoài kia',
      'Tạo dựng mạng lưới quan hệ chất lượng cao với các chuyên gia và lãnh đạo doanh nghiệp',
      'Nhận được các lời mời hợp tác kinh doanh và cơ hội nghề nghiệp mà không cần nộp hồ sơ xin việc',
      'Tự tin chia sẻ tri thức và tạo ra giá trị tích cực cho cộng đồng xã hội'
    ],
    techniques: ['Personal Branding', 'LinkedIn Marketing', 'Thought Leadership', 'Content Strategy', 'Networking', 'Monetization'],
    documents: [
      'Bộ câu hỏi khai phá năng lực cốt lõi và định vị thương hiệu cá nhân',
      'Checklist 20 tiêu chuẩn làm đẹp và chuyên nghiệp hóa hồ sơ cá nhân trên LinkedIn'
    ]
  },
  {
    title: 'Tiếp Thị Kỹ Thuật Số Dựa Trên Dữ Liệu Bán Lẻ (Retail Media Networks & Trade Marketing)',
    slug: 'tiep-thi-ky-thuat-so-dua-tren-du-lieu-ban-le-retail-media-networks',
    categorySlug: 'digital-marketing',
    level: CourseLevel.INTERMEDIATE,
    price: 690000,
    oldPrice: 1050000,
    leadSummary: 'Làm chủ làn sóng tiếp thị số thứ ba: Tiếp cận người tiêu dùng ngay tại điểm bán kỹ thuật số của các sàn thương mại điện tử lớn (Shopee Ads, Lazada Ads, GrabAds).',
    industryContext: 'Retail Media Network đang là mảng quảng cáo phát triển nhanh nhất toàn cầu khi dữ liệu bên thứ nhất của các nhà bán lẻ trở nên cực kỳ quý giá sau sự thoái lui của Third-party Cookies.',
    coreTopics: [
      'Sự trỗi dậy của Retail Media và giá trị của dữ liệu hành vi mua sắm thực tế (First-party Shopper Data)',
      'Quảng cáo nội sàn trên Shopee và Lazada: Đấu thầu từ khóa, Quảng cáo khám phá, Banner trang chủ',
      'Tối ưu hóa gian hàng chính hãng (Shopee Mall / LazMall): Hình ảnh đại diện, Video mô tả, Đánh giá 5 sao',
      'Hợp tác thương mại số (Co-marketing & Mega Campaign): Tận dụng các ngày siêu hội mua sắm (Double Days 11.11, 12.12)',
      'Đo lường hiệu quả quảng cáo bán lẻ: Chỉ số ACOS (Advertising Cost of Sales), ROAS và Tỷ lệ mua lại'
    ],
    handsOnProject: 'Lập kế hoạch chiến dịch quảng cáo và khuyến mãi hoàn chỉnh cho một gian hàng trên Shopee vào ngày hội siêu sale 11.11 đạt doanh thu 200 triệu đồng.',
    targetAudience: 'E-commerce Specialist, Trade Marketer, Quản lý ngành hàng tại các công ty hàng tiêu dùng nhanh (FMCG).',
    careerApplication: 'Trở thành chuyên gia thương mại điện tử nội sàn được các tập đoàn bán lẻ đa quốc gia săn đón.',
    requirements: [
      'Hiểu biết cơ bản về quy trình vận hành của các sàn thương mại điện tử',
      'Có tư duy kinh doanh và nhạy bén với các chương trình khuyến mãi'
    ],
    benefits: [
      'Tối ưu hóa chi phí quảng cáo trên Shopee và Lazada để đạt tỷ lệ ACOS dưới 15%',
      'Thiết kế các gói khuyến mãi (Flash Sale, Mua kèm deal sốc) kích thích khách hàng mua nhiều sản phẩm',
      'Đàm phán và tận dụng tối đa các gói hỗ trợ truyền thông từ sàn thương mại điện tử',
      'Gia tăng thứ hạng hiển thị tự nhiên của sản phẩm trong các kết quả tìm kiếm nội sàn'
    ],
    techniques: ['Retail Media', 'Shopee Ads', 'Lazada Ads', 'E-commerce Trade Marketing', 'ACOS', 'Mega Campaigns'],
    documents: [
      'Bảng tính kế hoạch ngân sách và dự phóng doanh thu cho chiến dịch siêu sale ngày đôi',
      'Checklist tối ưu hình ảnh và nội dung gian hàng chuẩn Shopee Mall'
    ]
  },
  {
    title: 'Kỹ Thuật Tăng Trưởng Đột Phá (Growth Hacking) & Tối Ưu Phễu AARRR',
    slug: 'ky-thuat-tang-truong-dot-pha-growth-hacking-toi-uu-pheu-aarrr',
    categorySlug: 'digital-marketing',
    level: CourseLevel.ADVANCED,
    price: 890000,
    oldPrice: 1450000,
    leadSummary: 'Ứng dụng tư duy tăng trưởng đột phá của thung lũng Silicon: Làm chủ phễu Pirate Metrics (AARRR), thiết kế các vòng lặp lan truyền (Viral Loops) và văn hóa thử nghiệm tốc độ cao.',
    industryContext: 'Các kỳ lân công nghệ như Airbnb, Dropbox, Uber hay TikTok vươn lên thống trị không phải nhờ ngân sách quảng cáo khổng lồ mà nhờ các chiến thuật Growth Hacking sáng tạo lồng ghép trực tiếp vào sản phẩm.',
    coreTopics: [
      'Bản chất của Growth Hacking: Giao thoa giữa Marketing, Kỹ thuật công nghệ và Phân tích dữ liệu',
      'Phễu tăng trưởng Pirate Metrics (AARRR): Acquisition, Activation, Retention, Referral và Revenue',
      'Khoảnh khắc Aha! (Aha Moment): Nhận diện và rút ngắn tối đa thời gian giúp người dùng mới cảm nhận giá trị sản phẩm',
      'Thiết kế cơ chế giới thiệu lan truyền (Viral Referral Loops): Tặng thưởng đôi bên (Two-sided Referral Incentives)',
      'Quy trình vận hành thử nghiệm tăng trưởng hàng tuần (Rapid Experimentation Process): Ưu tiên ý tưởng theo ICE Framework'
    ],
    handsOnProject: 'Thiết kế một cơ chế giới thiệu lan truyền (Referral Program) hoàn chỉnh cho một ứng dụng công nghệ tài chính hướng tới mục tiêu tăng trưởng tự nhiên 30% mỗi tháng.',
    targetAudience: 'Growth Hacker, Head of Growth, Product Manager, Nhà sáng lập khởi nghiệp công nghệ.',
    careerApplication: 'Đảm nhận vị trí lãnh đạo tăng trưởng (Chief Growth Officer) dẫn dắt các startup bứt phá thần tốc.',
    requirements: [
      'Kinh nghiệm thực chiến về tiếp thị số hoặc phát triển sản phẩm công nghệ',
      'Tư duy phân tích số liệu sắc bén và tinh thần thử nghiệm không ngại thất bại'
    ],
    benefits: [
      'Xây dựng cỗ máy tăng trưởng người dùng tự động được tích hợp trực tiếp vào tính năng sản phẩm',
      'Rút ngắn thời gian để người dùng mới trải nghiệm khoảnh khắc kỳ diệu đầu tiên của ứng dụng',
      'Vận hành quy trình thử nghiệm tăng trưởng khoa học, thử nghiệm 5-10 giả thuyết mới mỗi tuần',
      'Giảm thiểu sự phụ thuộc vào chi phí quảng cáo trả phí (Paid Ads) ngày càng đắt đỏ'
    ],
    techniques: ['Growth Hacking', 'AARRR Funnel', 'Aha Moment', 'Viral Loops', 'ICE Framework', 'Rapid Experimentation'],
    documents: [
      'Bảng theo dõi và chấm điểm ý tưởng thử nghiệm tăng trưởng ICE Scorecard',
      'Phân tích chi tiết 10 case study kinh điển về các chiến thuật Growth Hacking thành công nhất lịch sử'
    ]
  },
  {
    title: 'Hệ Thống Tự Động Hóa Tiếp Thị Doanh Nghiệp (Enterprise Marketing Automation) Với HubSpot',
    slug: 'he-thong-tu-dong-hoa-tiep-thi-doanh-nghiep-marketing-automation-hubspot',
    categorySlug: 'digital-marketing',
    level: CourseLevel.ADVANCED,
    price: 990000,
    oldPrice: 1650000,
    leadSummary: 'Thiết lập cỗ máy nuôi dưỡng khách hàng tiềm năng tự động quy mô lớn: Chấm điểm khách hàng (Lead Scoring), đồng bộ CRM đa luồng và liên kết nhịp nhàng giữa Marketing và Sales.',
    industryContext: 'Hơn 70% khách hàng tiềm năng chưa sẵn sàng mua hàng ngay; Marketing Automation giúp doanh nghiệp tự động nuôi dưỡng và chỉ chuyển giao cho đội Sale khi khách hàng đã thực sự chín muồi.',
    coreTopics: [
      'Kiến trúc hệ thống Inbound Marketing và các giai đoạn trưởng thành của khách hàng (Lifecycle Stages)',
      'Thiết lập mô hình chấm điểm tiềm năng (Lead Scoring Framework): Dựa trên dữ liệu nhân khẩu học và hành vi tương tác',
      'Xây dựng các kịch bản tự động hóa phức tạp (Complex Workflows): Phân nhánh điều kiện IF/THEN, Trễ thời gian và Cập nhật thuộc tính',
      'Hòa giải và kết nối nhịp nhàng giữa Marketing và Sales (Smarketing): Quy ước SLA và quy trình bàn giao khách hàng',
      'Báo cáo phân bổ doanh thu đa điểm chạm (Multi-touch Revenue Attribution): Đo lường chính xác đóng góp của từng chiến dịch'
    ],
    handsOnProject: 'Xây dựng một hệ thống Marketing Automation hoàn chỉnh trên HubSpot bao gồm Lead Scoring, phân luồng khách hàng tự động và thông báo tức thời cho đội Sale.',
    targetAudience: 'Marketing Automation Specialist, B2B Marketer, CRM Manager, Giám đốc kinh doanh.',
    careerApplication: 'Làm chủ nền tảng CRM và Automation hàng đầu thế giới HubSpot với mức lương chuyên gia hấp dẫn.',
    requirements: [
      'Hiểu biết sâu sắc về quy trình bán hàng doanh nghiệp (B2B Sales Cycle)',
      'Tư duy logic cấu trúc quy trình hệ thống'
    ],
    benefits: [
      'Tự động hóa hoàn toàn quy trình phân loại và chăm sóc hàng nghìn khách hàng tiềm năng cùng lúc',
      'Tăng gấp đôi tỷ lệ chuyển đổi từ khách hàng tiềm năng (Lead) thành hợp đồng thực tế',
      'Xóa bỏ hoàn toàn mâu thuẫn giữa đội ngũ Marketing (chê Sales không chịu chốt) và đội Sales (chê Marketing mang về khách rác)',
      'Chứng minh rành mạch giá trị đóng góp bằng tiền mặt của từng chiến dịch Marketing cho doanh nghiệp'
    ],
    techniques: ['Marketing Automation', 'HubSpot CRM', 'Lead Scoring', 'Inbound Marketing', 'Revenue Attribution', 'Smarketing'],
    documents: [
      'Bảng tiêu chí chấm điểm khách hàng tiềm năng Lead Scoring chuẩn cho doanh nghiệp B2B',
      'Sơ đồ quy trình làm việc (Workflows Blueprint) chăm sóc khách hàng tự động đa tầng'
    ]
  },
  {
    title: 'Chiến Lược Tiếp Thị Dựa Trên Khách Hàng Mục Tiêu (Account-Based Marketing - ABM) Cho B2B',
    slug: 'chien-luoc-tiep-thi-account-based-marketing-abm-cho-b2b',
    categorySlug: 'digital-marketing',
    level: CourseLevel.ADVANCED,
    price: 950000,
    oldPrice: 1550000,
    leadSummary: 'Chinh phục các hợp đồng triệu đô trong lĩnh vực B2B: Nhắm chọn tài khoản mục tiêu (Target Accounts), lập bản đồ ban mua hàng (Buying Committee) và cá nhân hóa trải nghiệm đỉnh cao.',
    industryContext: 'Trong kinh doanh B2B, việc đánh bắt diện rộng bằng quảng cáo đại trà cực kỳ lãng phí; ABM là chiến lược bắn tỉa tập trung toàn bộ nguồn lực vào một số ít khách hàng doanh nghiệp lớn nhất.',
    coreTopics: [
      'Triết lý Account-Based Marketing: Thay thế phễu truyền thống bằng mô hình phễu đảo ngược (Flipped Funnel)',
      'Xây dựng hồ sơ khách hàng lý tưởng (ICP - Ideal Customer Profile) và danh sách tài khoản mục tiêu (Target Account List)',
      'Lập bản đồ các bên liên quan trong ban mua hàng doanh nghiệp (Buying Committee): Người sử dụng, Người ảnh hưởng, Người gác cổng và Người ra quyết định',
      'Thiết kế chiến dịch tiếp thị cá nhân hóa 1:1, 1:Vài và 1:Nhiều bằng các thông điệp chuyên biệt',
      'Phối hợp tác chiến đa kênh chính xác: Quảng cáo LinkedIn Ads nhắm theo tên công ty, Thư ngỏ trực tiếp và Sự kiện kết nối kín'
    ],
    handsOnProject: 'Lên kế hoạch một chiến dịch ABM toàn diện nhắm vào danh sách 20 tập đoàn tài chính hàng đầu để bán giải pháp phần mềm bảo mật.',
    targetAudience: 'B2B Marketing Director, Enterprise Sales Manager, Account Executive, Lãnh đạo công ty công nghệ B2B.',
    careerApplication: 'Đảm nhận các vị trí chiến lược cao cấp phụ trách khách hàng lớn (Key Accounts) tại các tập đoàn công nghệ toàn cầu.',
    requirements: [
      'Tối thiểu 2 năm kinh nghiệm trong lĩnh vực tiếp thị hoặc kinh doanh B2B',
      'Hiểu rõ quy trình mua sắm và ra quyết định phức tạp trong các tổ chức doanh nghiệp lớn'
    ],
    benefits: [
      'Tập trung tối đa thời gian và ngân sách vào những thương vụ có giá trị hợp đồng lớn nhất',
      'Rút ngắn chu kỳ đàm phán hợp đồng phức tạp từ hàng năm xuống còn vài tháng',
      'Xây dựng mối quan hệ tin cậy sâu sắc với các lãnh đạo cấp cao (C-level) của khách hàng mục tiêu',
      'Đạt tỷ lệ thắng thầu vượt trội so với các đối thủ sử dụng phương pháp tiếp thị đại trà'
    ],
    techniques: ['Account-Based Marketing', 'ABM', 'B2B Marketing', 'LinkedIn Ads', 'Buying Committee', 'Ideal Customer Profile'],
    documents: [
      'Mẫu xây dựng hồ sơ khách hàng doanh nghiệp lý tưởng (ICP Worksheet)',
      'Bản đồ phân tích các vai trò ra quyết định trong ban mua hàng doanh nghiệp'
    ]
  },
  {
    title: 'Ứng Dụng AI & Dữ Liệu Lớn Trong Tự Động Hóa Sáng Tạo Tiếp Thị (AI in Marketing)',
    slug: 'ung-dung-ai-du-lieu-lon-trong-tu-dong-hoa-sang-tao-tiep-thi-ai-marketing',
    categorySlug: 'digital-marketing',
    level: CourseLevel.ADVANCED,
    price: 850000,
    oldPrice: 1390000,
    leadSummary: 'Tăng tốc năng suất tiếp thị gấp 10 lần với Trí tuệ nhân tạo: Thiết kế Prompt chuyên sâu cho sáng tạo nội dung, tự động hóa nghiên cứu thị trường và ứng dụng mô hình dự đoán hành vi.',
    industryContext: 'AI không thay thế người làm Marketing, nhưng người làm Marketing biết làm chủ AI sẽ nhanh chóng thay thế những người làm theo phương pháp thủ công cũ kỹ.',
    coreTopics: [
      'Kỹ thuật thiết kế câu lệnh chuyên sâu (Prompt Engineering) dành riêng cho các tác vụ Marketing trên ChatGPT, Claude',
      'Xây dựng trợ lý ảo chuyên biệt (Custom GPTs) được huấn luyện theo đúng giọng điệu và cẩm nang thương hiệu của công ty',
      'Sản xuất hình ảnh và video quảng cáo quy mô lớn bằng Midjourney, Stable Diffusion và Runway AI',
      'Tự động hóa nghiên cứu đối thủ và lắng nghe mạng xã hội (Social Listening) với các công cụ AI phân tích cảm xúc (Sentiment Analysis)',
      'Ứng dụng học máy dự đoán tỷ lệ khách hàng rời bỏ (Predictive Churn) và giá trị vòng đời khách hàng'
    ],
    handsOnProject: 'Xây dựng một hệ sinh thái AI thu nhỏ tự động sản xuất bài viết blog, hình ảnh minh họa và kịch bản video quảng cáo theo lịch định kỳ.',
    targetAudience: 'Marketer hiện đại, Creative Director, Quản lý nội dung muốn bứt phá năng suất lao động bằng công nghệ AI.',
    careerApplication: 'Trở thành chuyên gia tiên phong trong việc tích hợp giải pháp AI vào phòng Marketing của doanh nghiệp.',
    requirements: [
      'Có tài khoản và thường xuyên sử dụng các công cụ Generative AI cơ bản',
      'Tư duy cởi mở và sẵn sàng đón nhận các công nghệ mới'
    ],
    benefits: [
      'Rút ngắn thời gian lên ý tưởng và sản xuất nội dung chiến dịch từ vài ngày xuống còn vài giờ',
      'Tạo ra hàng trăm biến thể nội dung quảng cáo để thử nghiệm đa biến trong tích tắc',
      'Xây dựng các trợ lý ảo nội bộ làm việc 24/7 theo đúng chuẩn mực thương hiệu của doanh nghiệp',
      'Giải phóng bản thân khỏi các công việc lặp đi lặp lại để tập trung vào tư duy chiến lược đỉnh cao'
    ],
    techniques: ['AI in Marketing', 'Prompt Engineering', 'Generative AI', 'Custom GPTs', 'Midjourney', 'Predictive Marketing'],
    documents: [
      'Tuyển tập 100 câu lệnh Prompt vàng độc quyền dành cho mọi tác vụ Digital Marketing',
      'Hướng dẫn từng bước cấu hình Custom GPT cho phòng Marketing doanh nghiệp'
    ]
  },
  {
    title: 'Nghệ Thuật Xử Lý Khủng Hoảng Truyền Thông Xã Hội & Quản Trị Danh Tiếng Trực Tuyến',
    slug: 'nghe-thuat-xu-ly-khung-hoang-truyen-thong-xa-hoi-quan-tri-danh-tieng',
    categorySlug: 'digital-marketing',
    level: CourseLevel.ADVANCED,
    price: 890000,
    oldPrice: 1450000,
    leadSummary: 'Bảo vệ tài sản vô giá của thương hiệu trong tâm bão dư luận: Lập kế hoạch phòng ngừa, hệ thống cảnh báo sớm, quy trình 24 giờ phản ứng nhanh và nghệ thuật xin lỗi chân thành.',
    industryContext: 'Danh tiếng gầy dựng trong 20 năm có thể bị hủy hoại chỉ trong 20 phút bởi một sự cố mạng xã hội; cách doanh nghiệp ứng phó với khủng hoảng sẽ quyết định sự sống còn của thương hiệu.',
    coreTopics: [
      'Bản chất và các giai đoạn tiến hóa của một cuộc khủng hoảng truyền thông trong kỷ nguyên mạng xã hội',
      'Thiết lập hệ thống lắng nghe xã hội (Social Listening System) và các chỉ số cảnh báo nguy cơ bùng phát khủng hoảng',
      'Quy tắc vàng 24 giờ phản ứng nhanh: Thành lập ban chỉ đạo khẩn cấp, Thu thập sự thật và Đóng băng các quảng cáo nhạy cảm',
      'Nghệ thuật phát ngôn và soạn thảo thông điệp phản hồi: Công thức xin lỗi chân thành, Minh bạch và Cam kết hành động cụ thể',
      'Chiến lược phục hồi danh tiếng hậu khủng hoảng (Reputation Recovery) và củng cố lại niềm tin của công chúng'
    ],
    handsOnProject: 'Xây dựng cuốn cẩm nang phản ứng khủng hoảng truyền thông chi tiết cho một thương hiệu bán lẻ lớn và thực hành diễn tập một kịch bản khủng hoảng giả định.',
    targetAudience: 'Giám đốc truyền thông (CCO), Quản lý PR, Brand Manager, Người phát ngôn doanh nghiệp, Nhà sáng lập.',
    careerApplication: 'Đảm nhận trọng trách bảo vệ danh tiếng thương hiệu cấp cao tại các tập đoàn lớn hoặc công ty quan hệ công chúng (PR Agency).',
    requirements: [
      'Có trải nghiệm làm việc trong môi trường truyền thông, báo chí hoặc quản trị thương hiệu',
      'Bản lĩnh tâm lý vững vàng và khả năng giữ bình tĩnh trước áp lực dư luận'
    ],
    benefits: [
      'Phát hiện sớm các đốm lửa tiêu cực trước khi chúng bùng phát thành đám cháy khủng hoảng truyền thông dữ dội',
      'Hành động quyết đoán, chuẩn xác theo quy trình bài bản thay vì hoảng loạn đưa ra các quyết định sai lầm',
      'Biết cách viết thông điệp xoa dịu cơn giận dữ của cộng đồng bằng sự chân thành và trách nhiệm thực sự',
      'Biến nguy cơ thành cơ hội để tái khẳng định các giá trị đạo đức tốt đẹp của thương hiệu'
    ],
    techniques: ['Crisis Management', 'Social Listening', 'Public Relations', 'Reputation Management', 'Media Relations', 'Spokesperson'],
    documents: [
      'Cuốn cẩm nang quy trình ứng phó khủng hoảng truyền thông (Crisis Playbook) mẫu',
      'Bộ khung thông cáo báo chí và kịch bản phát ngôn chuẩn cho các tình huống khẩn cấp'
    ]
  },
  {
    title: 'Tiếp Thị Liên Kết (Affiliate Marketing) & Hợp Tác Với Mạng Lưới Nhà Sáng Tạo KOC/KOL',
    slug: 'tiep-thi-lien-ket-affiliate-marketing-mang-luoi-koc-kol',
    categorySlug: 'digital-marketing',
    level: CourseLevel.INTERMEDIATE,
    price: 590000,
    oldPrice: 890000,
    leadSummary: 'Bùng nổ doanh số với chi phí cố định tối thiểu: Xây dựng mạng lưới tiếp thị liên kết, đàm phán chính sách hoa hồng cho KOC/KOL và theo dõi chuyển đổi đơn hàng qua AccessTrade, TikTok Shop.',
    industryContext: 'Affiliate Marketing cho phép nhãn hàng chỉ trả phí khi có đơn hàng thành công thực tế, trở thành kênh phân phối hiệu quả nhất cho các thương hiệu trực tiếp đến người tiêu dùng (D2C).',
    coreTopics: [
      'Bản chất và các mô hình tính phí của Affiliate Marketing: CPS (Cost per Sale), CPL (Cost per Lead), CPC và RevShare',
      'Lựa chọn và làm việc với các nền tảng mạng lưới liên kết (Affiliate Networks): AccessTrade, MasOffer, Ecomobi và TikTok Shop Creator Center',
      'Chiến lược tìm kiếm, sàng lọc và tiếp cận KOC/KOL phù hợp: Đánh giá chất lượng người theo dõi thực tế và tỷ lệ tương tác',
      'Đàm phán chính sách hoa hồng lũy tiến và cung cấp tài nguyên truyền thông (Product Seeding, Banners, Discount Codes)',
      'Hệ thống theo dõi mã giới thiệu, đường dẫn UTM và phát hiện gian lận đơn ảo (Affiliate Fraud Prevention)'
    ],
    handsOnProject: 'Xây dựng một chiến dịch tuyển dụng và kích hoạt 30 KOC/KOL quảng bá cho một dòng sản phẩm gia dụng mới với cơ chế chia sẻ doanh thu 15%.',
    targetAudience: 'Brand Manager, E-commerce Specialist, Người làm Marketing cho các sàn bán lẻ, Người muốn làm Affiliate Publisher.',
    careerApplication: 'Tự tin xây dựng kênh doanh số từ mạng lưới nhà sáng tạo nội dung mà không phụ thuộc vào tiền chạy quảng cáo trực tiếp.',
    requirements: [
      'Hiểu biết cơ bản về thương mại điện tử và tiếp thị số',
      'Kỹ năng đàm phán và giao tiếp đối ngoại'
    ],
    benefits: [
      'Tạo ra dòng doanh số hàng trăm triệu đồng mỗi tháng từ hàng chục đối tác bán hộ',
      'Kiểm soát chi phí tiếp thị rủi ro bằng 0 vì chỉ trả tiền khi khách hàng đã nhận và thanh toán đơn',
      'Xây dựng mối quan hệ đối tác bền chặt với các nhà sáng tạo nội dung hàng đầu',
      'Bảo vệ ngân sách doanh nghiệp trước các chiêu trò gian lận click và đơn hàng ma'
    ],
    techniques: ['Affiliate Marketing', 'KOC/KOL Outreach', 'Cost Per Sale (CPS)', 'Tracking Links & UTM', 'TikTok Shop Affiliate', 'AccessTrade'],
    documents: [
      'Mẫu hợp đồng hợp tác tiếp thị liên kết chuẩn pháp lý cho nhãn hàng và KOC',
      'Bảng tính mô phỏng tỷ lệ hoa hồng và dự phóng biên lợi nhuận ròng'
    ]
  },

  // ==========================================
  // CAT-12: Quản trị kinh doanh & Khởi nghiệp (20 courses)
  // Quota: 6 BEGINNER, 9 INTERMEDIATE, 5 ADVANCED | 2 FREE, 18 PAID
  // ==========================================
  {
    title: 'Nhập Môn Quản Trị Kinh Doanh: Nền Tảng Vận Hành Doanh Nghiệp Cho Người Mới Bắt Đầu',
    slug: 'nhap-mon-quan-tri-kinh-doanh-nen-tang-van-hanh-doanh-nghiep',
    categorySlug: 'quan-tri-kinh-doanh-va-khoi-nghiep',
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0,
    leadSummary: 'Làm quen với các chức năng cốt lõi của một tổ chức kinh doanh: Kế hoạch, Tổ chức, Lãnh đạo, Kiểm soát và cách phối hợp nhịp nhàng giữa các phòng ban.',
    industryContext: 'Hiểu được cách một bộ máy doanh nghiệp vận hành là bước đệm tối quan trọng để bạn trở thành một nhà quản lý giỏi hoặc tự tin khởi nghiệp kinh doanh độc lập.',
    coreTopics: [
      'Bốn chức năng quản trị kinh điển của Henri Fayol: Lập kế hoạch (Planning), Tổ chức (Organizing), Lãnh đạo (Leading) và Kiểm soát (Controlling)',
      'Cấu trúc tổ chức doanh nghiệp phổ biến: Mô hình chức năng, Mô hình ma trận và Mô hình phẳng trong các công ty khởi nghiệp',
      'Sự phối hợp giữa các phân hệ: Sản xuất, Marketing, Kinh doanh (Sales), Nhân sự (HR) và Tài chính kế toán',
      'Kỹ năng lập kế hoạch công việc và phân bổ nguồn lực hiệu quả trong nhóm',
      'Văn hóa doanh nghiệp và đạo đức kinh doanh trong thời đại số'
    ],
    handsOnProject: 'Xây dựng sơ đồ cơ cấu tổ chức và bản mô tả chức năng nhiệm vụ cho các phòng ban của một công ty thương mại quy mô 30 nhân sự.',
    targetAudience: 'Sinh viên khối ngành kinh tế, nhân sự chuẩn bị được cất nhắc lên vị trí quản lý nhóm, người ấp ủ ý định kinh doanh.',
    careerApplication: 'Trang bị tư duy tổng thể về kinh doanh giúp bạn thấu hiểu bức tranh lớn của công ty và phối hợp công việc hiệu quả.',
    requirements: [
      'Không đòi hỏi kiến thức quản trị chuyên sâu trước đó',
      'Mong muốn học hỏi cách tổ chức và làm việc khoa học'
    ],
    benefits: [
      'Thấu hiểu vai trò và sự liên kết mật thiết giữa các phòng ban trong một công ty',
      'Biết cách phân chia công việc rõ ràng, tránh tình trạng đùn đẩy trách nhiệm',
      'Hiểu rõ các nguyên tắc cốt lõi giúp một tổ chức vận hành trơn tru và có kỷ luật',
      'Xây dựng tác phong làm việc chuyên nghiệp chuẩn mực của người làm kinh doanh'
    ],
    techniques: ['Business Administration', 'Management Principles', 'Organizational Structure', 'Leadership', 'Resource Allocation'],
    documents: [
      'Bảng tổng hợp các lý thuyết quản trị kinh điển ứng dụng vào doanh nghiệp hiện đại',
      'Mẫu quy chế phân công nhiệm vụ và phối hợp liên phòng ban trong công ty'
    ]
  },
  {
    title: 'Khởi Sự Kinh Doanh Tinh Gọn (Lean Startup) & Mô Hình Kinh Doanh Canvas',
    slug: 'khoi-su-kinh-doanh-tinh-gon-lean-startup-mo-hinh-canvas',
    categorySlug: 'quan-tri-kinh-doanh-va-khoi-nghiep',
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0,
    leadSummary: 'Khởi nghiệp thông minh với chi phí thấp nhất: Áp dụng phương pháp Lean Startup, vẽ bản đồ Business Model Canvas và kiểm chứng ý tưởng với khách hàng trước khi đầu tư.',
    industryContext: 'Hơn 90% các dự án khởi nghiệp thất bại vì họ tạo ra những sản phẩm hoàn hảo mà không một ai có nhu cầu mua; khởi sự tinh gọn giúp bạn kiểm chứng thị trường nhanh với rủi ro tối thiểu.',
    coreTopics: [
      'Triết lý Khởi nghiệp Tinh gọn của Eric Ries: Vòng lặp Xây dựng - Đo lường - Học hỏi (Build - Measure - Learn)',
      'Lập bản đồ 9 ô Mô hình Kinh doanh Canvas (Business Model Canvas): Từ Phân khúc khách hàng đến Dòng doanh thu',
      'Xác định Sản phẩm khả thi tối thiểu (MVP - Minimum Viable Product): Cách tạo MVP nhanh mà không cần vốn lớn',
      'Phỏng vấn kiểm chứng vấn đề khách hàng (Customer Problem Validation) tránh thiên kiến xác nhận',
      'Nghệ thuật Chuyển hướng chiến lược (Pivot) kịp thời khi các giả định ban đầu bị thị trường bác bỏ'
    ],
    handsOnProject: 'Phác thảo mô hình kinh doanh Canvas cho một ý tưởng khởi nghiệp dịch vụ giặt ủi tiện lợi và thiết kế một bản thử nghiệm MVP kiểm chứng thực tế.',
    targetAudience: 'Nhà sáng lập khởi nghiệp, cá nhân muốn tự mở cửa hàng hoặc kinh doanh online với số vốn nhỏ.',
    careerApplication: 'Tự tin bắt đầu hành trình kinh doanh với phương pháp khoa học, giảm thiểu tối đa rủi ro mất vốn.',
    requirements: [
      'Có một ý tưởng kinh doanh ấp ủ hoặc mong muốn tìm kiếm cơ hội khởi nghiệp',
      'Tinh thần dám dấn thân và sẵn sàng lắng nghe phản hồi từ thị trường'
    ],
    benefits: [
      'Đánh giá tính khả thi của một ý tưởng kinh doanh chỉ trong 1 trang giấy Canvas',
      'Tiết kiệm hàng trăm triệu đồng tiền vốn bằng cách kiểm chứng nhu cầu khách hàng trước khi sản xuất hàng loạt',
      'Tạo ra phiên bản thử nghiệm MVP đơn giản trong vài ngày để thăm dò thị trường',
      'Biết chính xác khi nào nên kiên trì theo đuổi và khi nào cần linh hoạt chuyển hướng kinh doanh'
    ],
    techniques: ['Lean Startup', 'Business Model Canvas', 'MVP', 'Customer Validation', 'Pivot', 'Entrepreneurship'],
    documents: [
      'Template Business Model Canvas chuẩn độ phân giải cao có thể in ấn hoặc chỉnh sửa online',
      'Bộ câu hỏi phỏng vấn khách hàng chuẩn theo phương pháp The Mom Test'
    ]
  },
  {
    title: 'Kỹ Năng Đàm Phán & Thương Lượng Trong Kinh Doanh Đạt Thỏa Thuận Đôi Bên Cùng Thắng',
    slug: 'ky-nang-dam-phan-thuong-luong-kinh-doanh-doi-ben-cung-thang',
    categorySlug: 'quan-tri-kinh-doanh-va-khoi-nghiep',
    level: CourseLevel.BEGINNER,
    price: 399000,
    oldPrice: 650000,
    leadSummary: 'Làm chủ nghệ thuật đàm phán dựa trên nguyên tắc của Harvard: Chuẩn bị phương án thay thế tốt nhất (BATNA), xác định vùng thỏa thuận (ZOPA) và giữ vững mối quan hệ đối tác.',
    industryContext: 'Trong kinh doanh, bạn không nhận được những gì bạn xứng đáng, bạn chỉ nhận được những gì bạn có thể đàm phán được trên bàn thương lượng.',
    coreTopics: [
      'Phương pháp đàm phán Harvard (Principled Negotiation): Tách con người ra khỏi vấn đề, Tập trung vào lợi ích thay vì lập trường',
      'Công tác chuẩn bị trước khi bước vào bàn đàm phán: Xác định mục tiêu tối đa, Điểm dừng bước (Walk-away point) và BATNA',
      'Xác định Vùng thỏa thuận khả thi (ZOPA - Zone of Possible Agreement)',
      'Nghệ thuật đặt câu hỏi dẫn dắt, Lắng nghe tích cực và Đọc vị ngôn ngữ cơ thể của đối tác',
      'Chiến thuật xử lý các tình huống bế tắc và kỹ thuật chốt thỏa thuận bằng văn bản rõ ràng'
    ],
    handsOnProject: 'Thực hành đóng vai đàm phán hợp đồng thuê mặt bằng kinh doanh giữa chủ nhà khó tính và người khởi nghiệp để đạt mức giá tối ưu.',
    targetAudience: 'Nhân viên kinh doanh, Quản lý mua hàng (Purchasing), Chủ doanh nghiệp và bất kỳ ai muốn nâng cao kỹ năng thuyết phục.',
    careerApplication: 'Mang lại những hợp đồng có điều khoản có lợi nhất cho bản thân và công ty mà không làm rạn nứt mối quan hệ hợp tác.',
    requirements: [
      'Không yêu cầu kinh nghiệm đàm phán trước đó',
      'Mong muốn rèn luyện sự tự tin và tư duy linh hoạt trong giao tiếp'
    ],
    benefits: [
      'Chấm dứt cảm giác lo sợ, lép vế khi ngồi vào bàn thương lượng với những đối tác lớn',
      'Luôn có phương án dự phòng vững chắc (BATNA) giúp bạn tự tin từ chối những thỏa thuận bất lợi',
      'Biết cách tìm ra các giá trị trao đổi bổ sung ngoài tiền bạc để hai bên cùng hài lòng',
      'Tạo dựng danh tiếng là một nhà đàm phán công bằng, đáng tin cậy và chuyên nghiệp'
    ],
    techniques: ['Negotiation Skills', 'BATNA', 'ZOPA', 'Principled Negotiation', 'Win-Win Strategy', 'Persuasion'],
    documents: [
      'Bảng checklist chuẩn bị đàm phán 7 yếu tố chuẩn Harvard',
      'Bộ tài liệu kịch bản phản hồi các câu từ chối giá và ép giá phổ biến'
    ]
  },
  {
    title: 'Kỹ Năng Bán Hàng Chuyên Nghiệp (B2C & B2B Sales) & Nghệ Thuật Xử Lý Từ Chối',
    slug: 'ky-nang-ban-hang-chuyen-nghiep-sales-nghe-thuat-xu-ly-tu-choi',
    categorySlug: 'quan-tri-kinh-doanh-va-khoi-nghiep',
    level: CourseLevel.BEGINNER,
    price: 420000,
    oldPrice: 690000,
    leadSummary: 'Làm chủ quy trình bán hàng chuẩn 7 bước: Tiếp cận khách hàng, khơi gợi nhu cầu, trình bày giải pháp thuyết phục, vượt qua mọi lời từ chối và chốt đơn tự nhiên.',
    industryContext: 'Bán hàng là kỹ năng sống còn của mọi doanh nghiệp; một chuyên viên bán hàng xuất sắc không bao giờ lo thiếu việc làm trong bất kỳ hoàn cảnh kinh tế nào.',
    coreTopics: [
      'Tâm thế đúng đắn của người bán hàng hiện đại: Người giải quyết vấn đề và nhà tư vấn đáng tin cậy chứ không phải người nài ép',
      'Kỹ thuật đặt câu hỏi SPIN Selling kinh điển: Tình hình (Situation), Vấn đề (Problem), Gợi ý hậu quả (Implication), Đề xuất giá trị (Need-payoff)',
      'Nghệ thuật lắng nghe và cô lập lời từ chối của khách hàng: Về giá cả, Thời gian, Quyền quyết định và Độ tin cậy',
      'Các phương pháp chốt đơn (Closing Techniques) đỉnh cao: Chốt đơn giả định, Chốt đơn khan hiếm, Chốt đơn lựa chọn thay thế',
      'Chăm sóc khách hàng sau bán hàng và nghệ thuật xin lời giới thiệu (Referral Sales)'
    ],
    handsOnProject: 'Xây dựng một bộ kịch bản gọi điện tư vấn (Telesales Script) và kịch bản gặp mặt trực tiếp khách hàng kèm phương án xử lý 10 lời từ chối phổ biến nhất.',
    targetAudience: 'Nhân viên kinh doanh mới vào nghề, Chuyên viên tư vấn bảo hiểm, Bất động sản, Chủ doanh nghiệp vừa và nhỏ.',
    careerApplication: 'Bứt phá doanh số cá nhân, gia tăng thu nhập từ tiền hoa hồng và mở rộng mạng lưới quan hệ khách hàng chất lượng.',
    requirements: [
      'Có khát khao thành công trong nghề bán hàng và sẵn sàng đón nhận những lời từ chối',
      'Kỹ năng diễn đạt tiếng Việt trôi chảy và lịch thiệp'
    ],
    benefits: [
      'Xóa bỏ hoàn toàn nỗi sợ hãi khi nhấc máy gọi điện hoặc gặp gỡ khách hàng mới',
      'Biết cách đặt những câu hỏi đắt giá khiến khách hàng tự nhận ra mức độ nghiêm trọng của vấn đề họ đang gặp phải',
      'Hóa giải các lời từ chối như Đắt quá hay Để tôi suy nghĩ thêm một cách nhẹ nhàng, thông minh',
      'Biến một khách hàng mua lẻ thành khách hàng trọn đời luôn giới thiệu bạn bè ủng hộ bạn'
    ],
    techniques: ['Sales Skills', 'SPIN Selling', 'Objection Handling', 'Closing Techniques', 'Telesales', 'Consultative Selling'],
    documents: [
      'Bộ kịch bản xử lý 25 tình huống khách hàng từ chối kinh điển',
      'Quy trình mẫu 7 bước bán hàng chuyên nghiệp kèm bảng đánh giá hiệu suất (Sales Scorecard)'
    ]
  },
  {
    title: 'Quản Lý Thời Gian & Nâng Cao Hiệu Suất Cá Nhân Cho Nhà Quản Lý',
    slug: 'quan-ly-thoi-gian-nang-cao-hieu-suat-ca-nhan-cho-nha-quan-ly',
    categorySlug: 'quan-tri-kinh-doanh-va-khoi-nghiep',
    level: CourseLevel.BEGINNER,
    price: 350000,
    oldPrice: 590000,
    leadSummary: 'Thoát khỏi vòng xoáy bận rộn vô nghĩa: Làm chủ ma trận Eisenhower, phương pháp Time-blocking, kỹ thuật Pomodoro và nghệ thuật ủy quyền công việc thông minh.',
    industryContext: 'Thời gian là tài nguyên công bằng duy nhất mà tất cả mọi người đều có 24 giờ như nhau; năng lực quản trị bản thân là nền tảng để bạn quản trị những người khác.',
    coreTopics: [
      'Nhận diện các kẻ cắp thời gian trong môi trường công sở: Thông báo điện thoại, Họp hành vô bổ và Thói quen trì hoãn',
      'Ma trận Eisenhower: Phân loại công việc theo Khẩn cấp vs Quan trọng và chiến lược hành động tương ứng',
      'Phương pháp phân bổ khối thời gian (Time-blocking) và chế độ làm việc sâu không gián đoạn (Deep Work)',
      'Nghệ thuật ủy quyền công việc: Cách bàn giao công việc cho cấp dưới kèm mục tiêu rõ ràng mà không sợ bị hỏng việc',
      'Ứng dụng công nghệ hỗ trợ quản lý công việc cá nhân: Notion, Todoist, Google Calendar'
    ],
    handsOnProject: 'Lập kế hoạch tuần làm việc mẫu tối ưu theo phương pháp Time-blocking và xây dựng một quy trình ủy quyền 3 nhiệm vụ thường ngày cho cấp dưới.',
    targetAudience: 'Các nhà quản lý, Trưởng nhóm, Doanh nhân khởi nghiệp đang cảm thấy quá tải và kiệt sức vì công việc ngập đầu.',
    careerApplication: 'Cân bằng giữa công việc và cuộc sống cá nhân, giải phóng thời gian để tập trung vào các quyết định chiến lược quan trọng.',
    requirements: [
      'Mong muốn thay đổi thói quen làm việc bừa bãi và nâng cao kỷ luật bản thân',
      'Có sổ tay ghi chép hoặc điện thoại cài đặt ứng dụng lịch'
    ],
    benefits: [
      'Hoàn thành các công việc quan trọng nhất ngay từ đầu ngày mà không bị phân tâm bởi việc vụn vặt',
      'Tự tin nói Không với những lời nhờ vả hoặc cuộc họp không mang lại giá trị thực tế',
      'Ủy quyền thành công các công việc tác nghiệp hàng ngày giúp nhân viên dưới quyền có cơ hội phát triển',
      'Giảm bớt căng thẳng, mệt mỏi và duy trì năng lượng làm việc tích cực suốt tuần'
    ],
    techniques: ['Time Management', 'Eisenhower Matrix', 'Deep Work', 'Time Blocking', 'Delegation', 'Productivity'],
    documents: [
      'Bảng mẫu lập kế hoạch ngày và tuần chuẩn phương pháp Time-blocking',
      'Checklist 5 bước bàn giao và ủy quyền công việc an toàn cho cấp dưới'
    ]
  },
  {
    title: 'Nghệ Thuật Lãnh Đạo & Truyền Cảm Hứng Cho Đội Ngũ Dành Cho Quản Lý Mới',
    slug: 'nghe-thuat-lanh-dao-truyen-cam-hung-cho-doi-ngu-quan-ly-moi',
    categorySlug: 'quan-tri-kinh-doanh-va-khoi-nghiep',
    level: CourseLevel.BEGINNER,
    price: 399000,
    oldPrice: 650000,
    leadSummary: 'Chuyển hóa từ một chuyên viên làm việc giỏi thành một người lãnh đạo truyền cảm hứng: Xây dựng niềm tin, lắng nghe thấu cảm, thúc đẩy động lực và gắn kết các thành viên.',
    industryContext: 'Người ta thường gia nhập công ty vì thương hiệu, nhưng lại rời bỏ công ty vì người quản lý trực tiếp; kỹ năng lãnh đạo thấu cảm là chìa khóa giữ chân người tài.',
    coreTopics: [
      'Sự khác biệt căn bản giữa một Nhà quản lý (Manager - Làm đúng quy trình) và Nhà lãnh đạo (Leader - Làm điều đúng đắn)',
      'Lãnh đạo phục vụ (Servant Leadership): Đặt sự phát triển và thành công của nhân viên lên hàng đầu',
      'Kỹ năng lắng nghe thấu cảm và tổ chức các buổi gặp gỡ riêng định kỳ (1-on-1 Meetings) hiệu quả',
      'Nghệ thuật ghi nhận và khen ngợi kịp thời: Khích lệ động lực tự thân bên trong mỗi con người',
      'Xây dựng môi trường an toàn tâm lý (Psychological Safety) để các thành viên thoải mái sáng tạo và dám thừa nhận sai lầm'
    ],
    handsOnProject: 'Soạn thảo khung nội dung cho buổi gặp mặt 1-on-1 định kỳ với một nhân viên đang có dấu hiệu giảm sút động lực và xây dựng kế hoạch hỗ trợ họ lấy lại phong độ.',
    targetAudience: 'Người mới được thăng chức quản lý nhóm, Trưởng phòng trẻ tuổi, Nhà sáng lập doanh nghiệp muốn xây dựng văn hóa gắn kết.',
    careerApplication: 'Trở thành người sếp được nhân viên yêu mến, kính trọng và sẵn sàng cống hiến hết mình vì mục tiêu chung.',
    requirements: [
      'Đang phụ trách hoặc chuẩn bị phụ trách một nhóm làm việc từ 2 người trở lên',
      'Có lòng trắc ẩn và sự quan tâm chân thành đến sự tiến bộ của người khác'
    ],
    benefits: [
      'Xây dựng được mối quan hệ tin cậy và sự tôn trọng tự nhiên từ các thành viên trong đội ngũ',
      'Biết cách tổ chức buổi họp 1-on-1 để lắng nghe những tâm tư, khó khăn sâu kín của nhân viên',
      'Thúc đẩy tinh thần làm việc nhóm và lòng nhiệt huyết cống hiến mà không cần dùng đến quyền uy đe dọa',
      'Tạo dựng một tập thể đoàn kết, nơi mọi người hỗ trợ nhau cùng vượt qua các mục tiêu thách thức'
    ],
    techniques: ['Leadership', 'Servant Leadership', '1-on-1 Meetings', 'Psychological Safety', 'Team Motivation', 'Empathy'],
    documents: [
      'Bộ câu hỏi gợi mở cho các buổi gặp riêng 1-on-1 giữa sếp và nhân viên',
      'Sổ tay hướng dẫn khen ngợi và góp ý mang tính xây dựng theo mô hình SBI (Situation - Behavior - Impact)'
    ]
  },
  {
    title: 'Phân Tích Báo Cáo Tài Chính Cho Nhà Quản Lý Không Chuyên Tài Chính',
    slug: 'phan-tich-bao-cao-tai-chinh-cho-nha-quan-ly-khong-chuyen',
    categorySlug: 'quan-tri-kinh-doanh-va-khoi-nghiep',
    level: CourseLevel.INTERMEDIATE,
    price: 650000,
    oldPrice: 990000,
    leadSummary: 'Đọc vị sức khỏe tài chính doanh nghiệp dễ dàng: Giải mã Bảng cân đối kế toán, Báo cáo kết quả kinh doanh và Báo cáo lưu chuyển tiền tệ để ra quyết định kinh doanh chuẩn xác.',
    industryContext: 'Tài chính là ngôn ngữ chung của thế giới kinh doanh; nếu không biết đọc báo cáo tài chính, bạn chẳng khác nào một phi công đang lái máy bay trong sương mù mà không có bảng điều khiển.',
    coreTopics: [
      'Giải mã Bảng cân đối kế toán (Balance Sheet): Phương trình kế toán cốt lõi Tài sản = Nợ phải trả + Vốn chủ sở hữu',
      'Mổ xẻ Báo cáo kết quả hoạt động kinh doanh (P&L): Doanh thu, Giá vốn hàng bán (COGS), Lợi nhuận gộp, Chi phí vận hành (OPEX) và EBITDA',
      'Báo cáo lưu chuyển tiền tệ (Cash Flow Statement): Phân biệt rõ ràng giữa Lợi nhuận trên sổ sách và Tiền mặt thực tế trong két',
      'Các chỉ số tài chính sống còn: Chỉ số thanh khoản, Biên lợi nhuận, Chỉ số đòn bẩy nợ và Hiệu quả sử dụng vốn ROE/ROA',
      'Phân tích điểm hòa vốn (Break-even Analysis) và lập kế hoạch ngân sách dự toán cho dự án kinh doanh mới'
    ],
    handsOnProject: 'Thực hiện phân tích toàn diện bộ báo cáo tài chính 3 năm liên tiếp của một công ty niêm yết và đưa ra khuyến nghị cải thiện dòng tiền cho ban giám đốc.',
    targetAudience: 'Giám đốc doanh nghiệp, Trưởng các bộ phận chức năng (Marketing, Sales, IT, HR) muốn hiểu rõ ngôn ngữ tài chính.',
    careerApplication: 'Tự tin trao đổi chuyên sâu với phòng kế toán, ban kiểm soát và tham gia vào các quyết định đầu tư chiến lược.',
    requirements: [
      'Không đòi hỏi bằng cấp kế toán chuyên ngành',
      'Biết sử dụng các phép tính số học cơ bản và bảng tính Microsoft Excel'
    ],
    benefits: [
      'Nhìn thấu bức tranh tài chính thực sự phía sau những con số báo cáo khô khan của công ty',
      'Hiểu rõ vì sao công ty có lãi lớn trên sổ sách nhưng lại luôn trong tình trạng thiếu hụt tiền mặt',
      'Tính toán chính xác điểm hòa vốn trước khi quyết định mở rộng mặt bằng hoặc ra mắt dòng sản phẩm mới',
      'Đề xuất các phương án cắt giảm chi phí lãng phí và tối ưu hóa vòng quay hàng tồn kho'
    ],
    techniques: ['Financial Analysis', 'Balance Sheet', 'P&L Statement', 'Cash Flow', 'Break-even Analysis', 'ROE/ROA'],
    documents: [
      'Bảng tính Excel tự động tính toán 20 chỉ số tài chính trọng yếu kèm biểu đồ so sánh',
      'Từ điển giải thích 50 thuật ngữ tài chính kế toán bằng ngôn ngữ đời thường dễ hiểu nhất'
    ]
  },
  {
    title: 'Quản Trị Chiến Lược & Lợi Thế Cạnh Tranh Bền Vững Với Mô Hình Michael Porter',
    slug: 'quan-tri-chien-luoc-loi-the-canh-tranh-ben-vung-michael-porter',
    categorySlug: 'quan-tri-kinh-doanh-va-khoi-nghiep',
    level: CourseLevel.INTERMEDIATE,
    price: 790000,
    oldPrice: 1250000,
    leadSummary: 'Định vị doanh nghiệp vượt lên trên đối thủ: Áp dụng mô hình 5 Áp lực cạnh tranh của Porter, Chuỗi giá trị (Value Chain), Chiến lược Đại dương xanh và Ma trận BCG.',
    industryContext: 'Chiến lược không phải là làm mọi thứ tốt hơn đối thủ; chiến lược là lựa chọn làm những điều khác biệt để mang lại giá trị độc nhất cho khách hàng.',
    coreTopics: [
      'Bản chất của Chiến lược kinh doanh: Phân biệt giữa Hiệu quả tác nghiệp (Operational Effectiveness) và Định vị chiến lược (Strategic Positioning)',
      'Phân tích cấu trúc ngành với Mô hình 5 Áp lực cạnh tranh của Michael Porter (Porter’s Five Forces)',
      'Ba chiến lược cạnh tranh tổng quát: Dẫn đầu về chi phí (Cost Leadership), Khác biệt hóa (Differentiation) và Tập trung (Focus)',
      'Phân tích Chuỗi giá trị nội bộ (Value Chain Analysis) để xác định các năng lực cốt lõi (Core Competencies)',
      'Chiến lược Đại dương xanh (Blue Ocean Strategy): Tạo ra không gian thị trường mới không có cạnh tranh thông qua Khung 4 hành động (ERRC)'
    ],
    handsOnProject: 'Thực hiện phân tích chiến lược cạnh tranh toàn diện cho một chuỗi cà phê nội địa trước sự đổ bộ của các thương hiệu quốc tế và đề xuất chiến lược khác biệt hóa.',
    targetAudience: 'Nhà sáng lập, Giám đốc điều hành, Trưởng bộ phận hoạch định chiến lược và Chuyên viên tư vấn quản trị.',
    careerApplication: 'Tham gia xây dựng kế hoạch kinh doanh trung và dài hạn cho các doanh nghiệp quy mô vừa và lớn.',
    requirements: [
      'Có hiểu biết vững vàng về hoạt động kinh doanh và môi trường cạnh tranh thị trường',
      'Tư duy phân tích tổng hợp và tầm nhìn bao quát'
    ],
    benefits: [
      'Nhìn thấu các mối đe dọa tiềm ẩn từ đối thủ mới gia nhập và sản phẩm thay thế trong ngành',
      'Định hình rõ ràng con đường khác biệt hóa sản phẩm giúp thoát khỏi cuộc chiến cạnh tranh phá giá đẫm máu',
      'Tập trung nguồn lực có hạn của công ty vào đúng các mắt xích tạo ra giá trị cao nhất trong chuỗi giá trị',
      'Xây dựng các rào cản phòng thủ vững chắc bảo vệ thị phần của doanh nghiệp trong dài hạn'
    ],
    techniques: ['Strategic Management', 'Porter Five Forces', 'Value Chain', 'Blue Ocean Strategy', 'Differentiation', 'Core Competencies'],
    documents: [
      'Bộ tài liệu khung phân tích chiến lược 5 áp lực cạnh tranh kèm bảng câu hỏi đánh giá',
      'Template ma trận Đường cong giá trị (Strategy Canvas) của Chiến lược Đại dương xanh'
    ]
  },
  {
    title: 'Quản Trị Mục Tiêu & Động Lực Doanh Nghiệp Với OKR & KPI Thực Chiến',
    slug: 'quan-tri-muc-tieu-dong-luc-doanh-nghiep-okr-kpi-thuc-chien',
    categorySlug: 'quan-tri-kinh-doanh-va-khoi-nghiep',
    level: CourseLevel.INTERMEDIATE,
    price: 690000,
    oldPrice: 1050000,
    leadSummary: 'Đưa toàn bộ tổ chức cùng nhìn về một hướng: Phân biệt và kết hợp nhuần nhuyễn giữa OKR (Mục tiêu & Kết quả then chốt) và KPI (Chỉ số đo lường hiệu suất) trong vận hành.',
    industryContext: 'Nhiều doanh nghiệp thất bại khi áp dụng OKR vì bê nguyên xi mô hình của Google mà không hiểu rõ sự khác biệt giữa việc duy trì vận hành ổn định (KPI) và tạo đột phá tăng trưởng (OKR).',
    coreTopics: [
      'So sánh chuyên sâu giữa KPI (Giữ vững phong độ vận hành) và OKR (Thúc đẩy bứt phá giới hạn)',
      'Cấu trúc một bộ OKR chuẩn mực: Mục tiêu đầy cảm hứng (Objective) và các Kết quả then chốt đo lường được (Key Results)',
      'Quy trình căn chỉnh mục tiêu liên phòng ban (Alignment): Kết hợp giao chỉ tiêu từ trên xuống (Top-down) và đề xuất sáng kiến từ dưới lên (Bottom-up)',
      'Quy trình Check-in hàng tuần: Theo dõi tiến độ, Thảo luận trở ngại và Tinh chỉnh hành động liên tục',
      'Đánh giá và chấm điểm OKR cuối chu kỳ: Tách bạch rõ ràng giữa đánh giá OKR và đánh giá lương thưởng để tránh bẫy tự hạ thấp mục tiêu'
    ],
    handsOnProject: 'Xây dựng bộ OKR cấp công ty và phân tầng xuống bộ OKR cho 3 phòng ban chức năng (Marketing, Sales, Product) trong một quý kinh doanh.',
    targetAudience: 'CEO, Quản lý cấp cao, Giám đốc nhân sự, Trưởng phòng muốn nâng cao tính kỷ luật và sự tập trung của đội ngũ.',
    careerApplication: 'Trở thành chuyên gia triển khai OKR / KPI nội bộ giúp doanh nghiệp vận hành tinh gọn và hiệu quả.',
    requirements: [
      'Có kinh nghiệm quản lý đội ngũ hoặc điều hành doanh nghiệp',
      'Hiểu rõ mục tiêu kinh doanh hàng năm của tổ chức'
    ],
    benefits: [
      'Xóa bỏ hoàn toàn tình trạng nhân viên bận rộn cả ngày nhưng kết quả chung của công ty không tiến triển',
      'Tạo ra sự liên kết mục tiêu rõ ràng giữa từng cá nhân với sự thành bại của toàn công ty',
      'Biến các buổi họp báo cáo dài dòng thành các buổi Check-in 30 phút tập trung giải quyết khó khăn thực tế',
      'Tạo động lực để nhân viên dám nghĩ lớn, đặt ra các mục tiêu thách thức mà không sợ bị phạt nếu chưa đạt 100%'
    ],
    techniques: ['OKRs', 'KPIs', 'Goal Setting', 'Check-in Process', 'Performance Management', 'Alignment'],
    documents: [
      'Bộ tài liệu 100 ví dụ OKR chuẩn mực cho các phòng ban (Tech, Sales, Marketing, HR, Finance)',
      'Biểu mẫu biên bản họp Check-in OKR hàng tuần giúp duy trì kỷ luật'
    ]
  },
  {
    title: 'Quản Trị Nguồn Nhân Lực Chiến Lược Cho Doanh Nghiệp Tăng Trưởng (Strategic HRM)',
    slug: 'quan-tri-nguon-nhan-luc-chien-luoc-tang-truong-hrm',
    categorySlug: 'quan-tri-kinh-doanh-va-khoi-nghiep',
    level: CourseLevel.INTERMEDIATE,
    price: 650000,
    oldPrice: 990000,
    leadSummary: 'Thu hút, giữ chân và phát triển nhân tài: Thiết kế chính sách lương thưởng đãi ngộ (C&B), xây dựng khung năng lực và nuôi dưỡng văn hóa doanh nghiệp vững mạnh.',
    industryContext: 'Con người là tài sản quý giá nhất của doanh nghiệp; một chiến lược nhân sự đúng đắn sẽ biến nguồn lực con người thành lợi thế cạnh tranh khó bị sao chép nhất trên thị trường.',
    coreTopics: [
      'Chuyển dịch vai trò nhân sự: Từ hành chính sự vụ sang Đối tác nhân sự chiến lược (HR Business Partner - HRBP)',
      'Quy trình tuyển dụng thu hút nhân tài: Xây dựng thương hiệu nhà tuyển dụng (Employer Branding) và phỏng vấn hành vi (STAR Method)',
      'Thiết kế chính sách đãi ngộ tổng thể (Total Rewards): Cân bằng giữa Lương cứng, Thưởng hiệu suất, Cổ phần ESOP và Phúc lợi phi tài chính',
      'Xây dựng Khung năng lực tiêu chuẩn (Competency Framework) phục vụ đào tạo và phát triển nhân sự',
      'Quản trị văn hóa doanh nghiệp: Biến những giá trị cốt lõi trên giấy thành hành vi chuẩn mực hàng ngày của nhân viên'
    ],
    handsOnProject: 'Thiết kế một bản kế hoạch tuyển dụng và chính sách giữ chân 10 nhân sự công nghệ chủ chốt trong giai đoạn công ty tăng trưởng nóng.',
    targetAudience: 'Giám đốc nhân sự, Trưởng phòng tuyển dụng, Nhà sáng lập doanh nghiệp đang đối mặt với bài toán biến động nhân sự.',
    careerApplication: 'Trở thành Giám đốc nhân sự chuyên nghiệp (CHRO) có tiếng nói quyết định trong hội đồng quản trị.',
    requirements: [
      'Đã có trải nghiệm làm việc trong môi trường công sở hoặc quản lý nhân viên',
      'Quan tâm sâu sắc đến tâm lý và sự phát triển con người trong tổ chức'
    ],
    benefits: [
      'Thu hút được những ứng viên tài năng phù hợp nhất với giá trị văn hóa của công ty',
      'Xây dựng chính sách lương thưởng công bằng, minh bạch kích thích sự cống hiến tối đa',
      'Giảm thiểu tối đa tỷ lệ nhảy việc của các nhân sự nòng cốt',
      'Định hình văn hóa công ty gắn kết, tạo niềm tự hào cho các thành viên khi gắn bó lâu dài'
    ],
    techniques: ['Strategic HRM', 'HRBP', 'Total Rewards', 'Competency Framework', 'Employer Branding', 'STAR Method'],
    documents: [
      'Bộ câu hỏi phỏng vấn đánh giá năng lực theo mô hình STAR cho các vị trí phổ biến',
      'Mẫu khung năng lực 3 tầng (Năng lực cốt lõi, Năng lực chuyên môn, Năng lực lãnh đạo)'
    ]
  },
  {
    title: 'Tối Ưu Hóa & Chuẩn Hóa Quy Trình Vận Hành Doanh Nghiệp (Standard Operating Procedures - SOP)',
    slug: 'toi-uu-hoa-chuan-hoa-quy-trinh-van-hanh-doanh-nghiep-sop',
    categorySlug: 'quan-tri-kinh-doanh-va-khoi-nghiep',
    level: CourseLevel.INTERMEDIATE,
    price: 590000,
    oldPrice: 890000,
    leadSummary: 'Giải phóng người lãnh đạo khỏi sự vụ vi mô: Xây dựng hệ thống quy trình chuẩn SOP, loại bỏ lãng phí theo phương pháp Lean và tự động hóa vận hành trơn tru.',
    industryContext: 'Một doanh nghiệp chỉ có thể mở rộng quy mô khi nó có khả năng vận hành trơn tru ngay cả khi người sáng lập đi vắng; bí quyết nằm ở hệ thống quy trình chuẩn mực.',
    coreTopics: [
      'Tư duy quản trị theo quy trình (Business Process Management - BPM): Nhìn nhận tổ chức như một dòng chảy công việc',
      'Nhận diện 8 loại lãng phí kinh điển theo triết lý Tinh gọn (Lean Waste / Muda) trong văn phòng và dịch vụ',
      'Quy chuẩn vẽ sơ đồ luồng công việc (Process Flowchart) sử dụng ký hiệu BPMN chuẩn quốc tế',
      'Kỹ thuật biên soạn tài liệu Quy trình thao tác chuẩn (SOP): Đơn giản, Rõ ràng, Dễ hiểu, Kèm hình ảnh và Video minh họa',
      'Giám sát tuân thủ quy trình và văn hóa cải tiến liên tục không ngừng (Kaizen)'
    ],
    handsOnProject: 'Khảo sát, chuẩn hóa và đóng gói trọn bộ quy trình xử lý đơn hàng và giao hàng hoàn chỉnh từ A-Z cho một công ty bán lẻ đa kênh.',
    targetAudience: 'Giám đốc vận hành (COO), Quản lý chất lượng (QA/QC), Chủ doanh nghiệp muốn thoát khỏi việc phải can thiệp vào từng việc vặt hàng ngày.',
    careerApplication: 'Trở thành chuyên gia tư vấn chuẩn hóa vận hành doanh nghiệp với năng lực tối ưu hóa chi phí vượt trội.',
    requirements: [
      'Có kinh nghiệm làm việc thực tế trong các quy trình nghiệp vụ của công ty',
      'Tư duy logic, tỉ mỉ và thích sự ngăn nắp, có hệ thống'
    ],
    benefits: [
      'Nhân viên mới có thể nhanh chóng bắt tay vào công việc mà không tốn công đào tạo cầm tay chỉ việc nhiều tuần',
      'Loại bỏ triệt để các sai sót lặp đi lặp lại do hiểu nhầm hoặc làm việc theo thói quen tự phát',
      'Cắt giảm từ 20-30% thời gian chờ đợi và các thao tác thừa thãi trong quy trình làm việc',
      'Giúp người lãnh đạo an tâm ủy quyền và dành thời gian cho các mục tiêu chiến lược lớn'
    ],
    techniques: ['SOP', 'Business Process Management', 'Lean Muda', 'BPMN Flowchart', 'Kaizen', 'Operations Management'],
    documents: [
      'Bộ khung mẫu tài liệu SOP chuẩn mực có thể áp dụng ngay cho mọi phòng ban',
      'Thư viện 20 ký hiệu sơ đồ luồng công việc BPMN chuẩn trên Draw.io / Visio'
    ]
  },
  {
    title: 'Nghệ Thuật Xây Dựng Bản Kế Hoạch Kinh Doanh Toàn Diện (Business Plan Mastery)',
    slug: 'nghe-thuat-xay-dung-ban-ke-hoach-kinh-doanh-toan-dien-business-plan',
    categorySlug: 'quan-tri-kinh-doanh-va-khoi-nghiep',
    level: CourseLevel.INTERMEDIATE,
    price: 650000,
    oldPrice: 990000,
    leadSummary: 'Đóng gói ý tưởng thành một bản kế hoạch kinh doanh chuẩn mực: Nghiên cứu thị trường, kế hoạch tiếp thị, kế hoạch vận hành và mô hình dự phóng tài chính 3-5 năm.',
    industryContext: 'Một bản kế hoạch kinh doanh sắc sảo là tấm hộ chiếu bắt buộc nếu bạn muốn vay vốn ngân hàng, thu hút cổ đông chiến lược hoặc thuyết phục các quỹ đầu tư mạo hiểm.',
    coreTopics: [
      'Cấu trúc chuẩn của một bản Kế hoạch kinh doanh quốc tế: Tóm tắt điều hành (Executive Summary), Phân tích ngành và Đối thủ',
      'Phương pháp ước tính dung lượng thị trường: Mô hình TAM (Total Addressable Market), SAM (Serviceable Available Market) và SOM',
      'Kế hoạch Marketing & Bán hàng chi tiết kèm dự toán chi phí thu hút khách hàng (CAC)',
      'Kế hoạch vận hành và nhân sự: Lộ trình phát triển sản phẩm và cột mốc hoàn thành (Milestones)',
      'Xây dựng mô hình tài chính dự phóng 3 năm: Bảng dự tính doanh thu, Lợi nhuận P&L và Phân tích độ nhạy (Sensitivity Analysis)'
    ],
    handsOnProject: 'Soạn thảo trọn vẹn một bản Kế hoạch kinh doanh hoàn chỉnh dày 25 trang kèm file tài chính Excel cho một dự án chuỗi cửa hàng tiện lợi nhượng quyền.',
    targetAudience: 'Người khởi nghiệp đang chuẩn bị mở công ty, Quản lý dự án phụ trách đơn vị kinh doanh mới (SBU), Sinh viên bảo vệ đề án tốt nghiệp.',
    careerApplication: 'Tự tin đàm phán với ngân hàng và nhà đầu tư để huy động vốn phục vụ kế hoạch mở rộng kinh doanh.',
    requirements: [
      'Đã có ý tưởng kinh doanh cụ thể và hiểu biết về ngành hàng dự định tham gia',
      'Kỹ năng tính toán cơ bản trên bảng tính Excel'
    ],
    benefits: [
      'Nhìn thấy trước toàn bộ các chi phí phát sinh và rủi ro tiềm ẩn trước khi dốc tiền đầu tư thực tế',
      'Tính toán chính xác số vốn cần huy động và thời gian dự kiến có thể hoàn vốn (Payback Period)',
      'Sở hữu một tài liệu thuyết phục, chuyên nghiệp để tự tin đi gõ cửa các nhà đầu tư và ngân hàng',
      'Định hình lộ trình hành động rõ ràng từng bước cho đội ngũ sáng lập trong 3 năm đầu tiên'
    ],
    techniques: ['Business Plan', 'Financial Modeling', 'TAM SAM SOM', 'Executive Summary', 'Market Analysis', 'Payback Period'],
    documents: [
      'Mẫu bản Kế hoạch kinh doanh hoàn chỉnh bằng file Word chuẩn format quốc tế',
      'File Excel mô hình tài chính động dự phóng 3 năm được liên kết công thức tự động'
    ]
  },
  {
    title: 'Chiến Lược Bán Hàng & Đàm Phán Doanh Nghiệp Lớn (B2B Solution Selling)',
    slug: 'chien-luoc-ban-hang-dam-phan-doanh-nghiep-lon-b2b-solution-selling',
    categorySlug: 'quan-tri-kinh-doanh-va-khoi-nghiep',
    level: CourseLevel.INTERMEDIATE,
    price: 750000,
    oldPrice: 1190000,
    leadSummary: 'Làm chủ phương pháp bán giải pháp giá trị cao cho khách hàng tổ chức: Quản lý chu kỳ bán hàng dài hạn, thiết lập quan hệ với các bên liên quan và kỹ thuật chào thầu RFI/RFP.',
    industryContext: 'Bán hàng B2B không đơn thuần là giao dịch mua bán sản phẩm mà là một quá trình đồng hành tư vấn chiến lược giúp đối tác giải quyết các bài toán kinh doanh phức tạp.',
    coreTopics: [
      'Đặc thù của bán hàng giải pháp B2B: Quyết định tập thể, Chu kỳ kéo dài nhiều tháng, Rủi ro cao và Giá trị hợp đồng lớn',
      'Khung phương pháp luận Bán hàng theo thử thách (The Challenger Sale): Dạy khách hàng điều mới, Tùy chỉnh thông điệp và Nắm quyền kiểm soát',
      'Quy trình quản lý cơ hội bán hàng (Opportunity Management) trong đường ống bán hàng (Sales Pipeline)',
      'Kỹ thuật phản hồi hồ sơ mời thầu (RFI - Request for Information & RFP - Request for Proposal) chuyên nghiệp',
      'Xây dựng Tuyên ngôn giá trị kinh tế (Business Case) chứng minh tỷ suất hoàn vốn ROI cho khách hàng doanh nghiệp'
    ],
    handsOnProject: 'Xây dựng một bộ hồ sơ chào giải pháp hoàn chỉnh cho gói phần mềm quản trị doanh nghiệp trị giá 1 tỷ đồng đáp ứng bài thầu của một tập đoàn sản xuất.',
    targetAudience: 'B2B Sales Specialist, Account Manager, Kỹ sư giải pháp (Solution Architect), Lãnh đạo công ty cung cấp dịch vụ doanh nghiệp.',
    careerApplication: 'Chinh phục những hợp đồng thương mại lớn mang lại doanh số đột phá cho công ty và thu nhập khủng cho cá nhân.',
    requirements: [
      'Có kinh nghiệm làm việc trong môi trường kinh doanh giữa các tổ chức',
      'Khả năng giao tiếp chuyên nghiệp và tư duy giải quyết vấn đề'
    ],
    benefits: [
      'Xác định đúng người có quyền lực thực sự trong ban lãnh đạo của khách hàng doanh nghiệp',
      'Soạn thảo hồ sơ đề xuất giải pháp sắc bén làm nổi bật năng lực vượt trội của công ty trước các đối thủ',
      'Thuyết phục khách hàng chi trả mức giá cao xứng đáng cho giá trị mang lại thay vì bị cuốn vào bẫy phá giá',
      'Duy trì mối quan hệ đối tác chiến lược bền vững để tiếp tục ký kết các hợp đồng gia hạn và bán thêm (Upsell)'
    ],
    techniques: ['Solution Selling', 'Challenger Sale', 'B2B Sales Pipeline', 'RFP Response', 'ROI Business Case', 'Key Account Management'],
    documents: [
      'Mẫu hồ sơ đề xuất kỹ thuật và thương mại (Technical & Commercial Proposal Template)',
      'Bảng tính đo lường chỉ số ROI và thời gian hoàn vốn dành riêng cho khách hàng doanh nghiệp'
    ]
  },
  {
    title: 'Phát Triển Kênh Phân Phối & Quản Trị Hệ Thống Đại Lý (Channel & Distribution Management)',
    slug: 'phat-trien-kenh-phan-phoi-quan-tri-he-thong-dai-ly',
    categorySlug: 'quan-tri-kinh-doanh-va-khoi-nghiep',
    level: CourseLevel.INTERMEDIATE,
    price: 690000,
    oldPrice: 1050000,
    leadSummary: 'Mở rộng độ phủ hàng hóa trên toàn quốc: Thiết kế chính sách chiết khấu đại lý, quản lý đội ngũ giám sát bán hàng (ASM) và giải quyết triệt để xung đột kênh phân phối.',
    industryContext: 'Hàng hóa muốn đến tay người tiêu dùng cuối cùng đều phải dựa vào mạng lưới phân phối; ai nắm giữ được kênh phân phối, người đó nắm giữ huyết mạch của thị trường.',
    coreTopics: [
      'Các mô hình kênh phân phối phổ biến: Phân phối trực tiếp, Kênh truyền thống (GT - General Trade) và Kênh hiện đại (MT - Modern Trade)',
      'Thiết kế chính sách giá và chiết khấu thương mại: Chiết khấu trực tiếp, Thưởng doanh số quý/năm, Hỗ trợ công nợ an toàn',
      'Tiêu chí đánh giá, lựa chọn và đàm phán hợp đồng với Nhà phân phối / Đại lý cấp 1',
      'Xử lý triệt để các xung đột kênh phân phối: Hiện tượng lấn vùng, Bán phá giá, Bán lén lút qua kênh trực tuyến',
      'Vận hành đội ngũ bán hàng thực địa (Sales Reps) và ứng dụng phần mềm định vị DMS (Distribution Management System)'
    ],
    handsOnProject: 'Thiết kế trọn gói chính sách phân phối và quy chế quản lý đại lý trên toàn quốc cho một nhãn hàng đồ uống thiên nhiên mới ra mắt.',
    targetAudience: 'Giám đốc bán hàng toàn quốc (NSM), Giám đốc kênh phân phối, Trưởng vùng kinh doanh (ASM), Chủ cơ sở sản xuất.',
    careerApplication: 'Quản lý và mở rộng mạng lưới phân phối hàng nghìn điểm bán cho các công ty sản xuất hàng tiêu dùng và công nghiệp.',
    requirements: [
      'Hiểu biết cơ bản về hoạt động bán buôn và thị trường bán lẻ tại Việt Nam',
      'Kỹ năng đàm phán thương mại và quản trị rủi ro công nợ'
    ],
    benefits: [
      'Thiết lập chính sách chiết khấu đủ hấp dẫn để đại lý nhiệt tình bán hàng nhưng vẫn bảo đảm lợi nhuận công ty',
      'Bảo vệ trật tự giá cả trên thị trường, ngăn chặn việc đại lý lớn chèn ép và bán phá giá làm hỏng thị trường',
      'Kiểm soát dòng tiền công nợ chặt chẽ, không để đại lý chiếm dụng vốn gây rủi ro nợ xấu',
      'Xây dựng sự gắn kết dài hạn giúp nhà phân phối luôn xem công ty bạn là đối tác ưu tiên hàng đầu'
    ],
    techniques: ['Distribution Management', 'Channel Strategy', 'GT & MT Channels', 'Trade Discounts', 'Channel Conflict', 'DMS System'],
    documents: [
      'Mẫu hợp đồng phân phối độc quyền và không độc quyền chuẩn mực pháp lý',
      'Bảng tính ma trận chiết khấu theo quy mô doanh số và thời gian thanh toán'
    ]
  },
  {
    title: 'Quản Trị Rủi Ro Doanh Nghiệp (Enterprise Risk Management - ERM) Chuẩn COSO',
    slug: 'quan-tri-rui-ro-doanh-nghiep-enterprise-risk-management-coso',
    categorySlug: 'quan-tri-kinh-doanh-va-khoi-nghiep',
    level: CourseLevel.INTERMEDIATE,
    price: 650000,
    oldPrice: 990000,
    leadSummary: 'Bảo vệ thành quả kinh doanh trước những biến động khôn lường: Nhận diện, đánh giá ma trận rủi ro chiến lược, tài chính, vận hành và xây dựng kế hoạch ứng phó liên tục.',
    industryContext: 'Kinh doanh luôn đi kèm với rủi ro; người chiến thắng không phải là người liều mạng mà là người biết lường trước các mối đe dọa để chuẩn bị sẵn phương án phòng thủ vững chắc.',
    coreTopics: [
      'Khung quản trị rủi ro doanh nghiệp theo chuẩn quốc tế COSO ERM và tiêu chuẩn ISO 31000',
      'Phân loại các tầng rủi ro: Rủi ro chiến lược, Rủi ro thị trường & tài chính, Rủi ro vận hành, Rủi ro pháp lý & tuân thủ',
      'Xây dựng Ma trận rủi ro (Risk Heat Map): Đánh giá Xác suất xảy ra (Likelihood) và Mức độ ảnh hưởng (Impact)',
      'Bốn chiến lược xử lý rủi ro cốt lõi: Chấp nhận (Accept), Né tránh (Avoid), Giảm thiểu (Mitigate) và Chuyển giao (Transfer)',
      'Kế hoạch đảm bảo tính liên tục trong hoạt động kinh doanh (Business Continuity Planning - BCP) khi thảm họa xảy ra'
    ],
    handsOnProject: 'Xây dựng Bảng kiểm soát rủi ro (Risk Register) và Ma trận nhiệt cho 15 rủi ro lớn nhất của một doanh nghiệp xuất nhập khẩu nông sản.',
    targetAudience: 'Thành viên ban kiểm soát, Quản lý rủi ro nội bộ, Giám đốc tài chính, Chủ doanh nghiệp muốn củng cố hệ thống phòng thủ.',
    careerApplication: 'Đảm nhận vai trò chuyên gia quản trị rủi ro tại các ngân hàng, tập đoàn kinh tế và công ty kiểm toán.',
    requirements: [
      'Có kiến thức tổng quan về hoạt động vận hành và tài chính doanh nghiệp',
      'Tư duy phân tích cẩn trọng và có trách nhiệm cao'
    ],
    benefits: [
      'Nhìn thấy trước những lỗ hổng nguy hiểm trong hoạt động kinh doanh trước khi chúng gây ra tổn thất tiền bạc',
      'Phân bổ nguồn lực hợp lý để ưu tiên xử lý các rủi ro chí mạng có nguy cơ làm phá sản công ty',
      'Bảo đảm tính liên tục của doanh nghiệp giúp hệ thống vẫn duy trì hoạt động ngay cả khi gặp biến cố lớn',
      'Gia tăng niềm tin vững chắc của cổ đông và các tổ chức tài chính vào sự bền vững của công ty'
    ],
    techniques: ['Enterprise Risk Management', 'COSO ERM', 'Risk Heat Map', 'Risk Register', 'Business Continuity', 'ISO 31000'],
    documents: [
      'Template bảng kiểm soát rủi ro doanh nghiệp (Risk Register Template) bằng Excel',
      'Mẫu kế hoạch duy trì hoạt động kinh doanh liên tục (BCP Guideline)'
    ]
  },
  {
    title: 'Huy Động Vốn Khởi Nghiệp (Venture Capital & Angel Investment) & Nghệ Thuật Pitching',
    slug: 'huy-dong-von-khoi-nghiep-venture-capital-nghe-thuat-pitching',
    categorySlug: 'quan-tri-kinh-doanh-va-khoi-nghiep',
    level: CourseLevel.ADVANCED,
    price: 990000,
    oldPrice: 1650000,
    leadSummary: 'Làm chủ cuộc chơi gọi vốn mạo hiểm: Hiểu cách thức hoạt động của các quỹ VC, định giá doanh nghiệp khởi nghiệp, đọc hiểu bảng thỏa thuận Term Sheet và thuyết trình gọi vốn đỉnh cao.',
    industryContext: 'Huy động vốn là bệ phóng giúp các công ty khởi nghiệp bứt phá tăng trưởng; nhưng nếu không am hiểu luật chơi, nhà sáng lập có thể bị mất trắng quyền kiểm soát đứa con tinh thần của mình.',
    coreTopics: [
      'Vòng đời gọi vốn khởi nghiệp: Vòng hạt giống (Pre-seed, Seed), Series A, B, C và Lộ trình phát hành cổ phiếu IPO',
      'Tâm lý và mô hình vận hành của các Quỹ đầu tư mạo hiểm (VC Fund): Tỷ lệ hoàn vốn kỳ vọng và chiến lược thoái vốn',
      'Các phương pháp định giá công ty giai đoạn sớm: Phương pháp Berkus, Scorecard, Bội số doanh thu và Chiết khấu dòng tiền DCF',
      'Giải mã các điều khoản then chốt trong Bản thỏa thuận đầu tư (Term Sheet): Quyền phủ quyết, Quyền thanh lý ưu tiên (Liquidation Preference), Chống pha loãng (Anti-dilution)',
      'Thiết kế bài thuyết trình gọi vốn (Pitch Deck) 10-12 trang và kỹ thuật trình bày thuyết phục trước ban giám khảo đầu tư'
    ],
    handsOnProject: 'Soạn thảo trọn vẹn một bộ Pitch Deck chuẩn quốc tế cho dự án khởi nghiệp công nghệ y tế và diễn tập thuyết trình gọi vốn vòng Seed 500.000 USD.',
    targetAudience: 'Nhà sáng lập khởi nghiệp (Founders), Giám đốc tài chính (CFO), Nhà đầu tư thiên thần mới tham gia thị trường.',
    careerApplication: 'Tự tin tiếp cận, đàm phán và bảo vệ quyền lợi cổ đông khi đón nhận dòng vốn đầu tư mạo hiểm từ các quỹ hàng đầu.',
    requirements: [
      'Có ý tưởng khởi nghiệp có tiềm năng mở rộng quy mô lớn hoặc dự án đang vận hành',
      'Hiểu biết cơ bản về cơ cấu vốn chủ sở hữu và tài chính doanh nghiệp'
    ],
    benefits: [
      'Hiểu rõ các quỹ đầu tư thực sự tìm kiếm điều gì ở một nhà sáng lập để chuẩn bị câu trả lời hoàn hảo',
      'Không bao giờ bị hớ khi đàm phán tỷ lệ cổ phần và định giá công ty với các nhà đầu tư lão luyện',
      'Bảo vệ quyền kiểm soát công ty không bị truất quyền điều hành qua các điều khoản Term Sheet gài bẫy',
      'Sở hữu bài thuyết trình Pitch Deck sắc sảo làm nổi bật cơ hội thị trường và quy mô lợi nhuận'
    ],
    techniques: ['Venture Capital', 'Pitch Deck', 'Startup Valuation', 'Term Sheet', 'Angel Investment', 'Anti-dilution'],
    documents: [
      'Mẫu Term Sheet đầu tư chuẩn quốc tế (NVCA Standard Term Sheet) kèm giải thích chi tiết từng điều khoản',
      'Slide mẫu Pitch Deck chuẩn mực từng giúp các kỳ lân công nghệ gọi vốn thành công'
    ]
  },
  {
    title: 'Quản Trị Tái Cấu Trúc Doanh Nghiệp (Corporate Turnaround & Restructuring)',
    slug: 'quan-tri-tai-cau-truc-doanh-nghiep-turnaround-restructuring',
    categorySlug: 'quan-tri-kinh-doanh-va-khoi-nghiep',
    level: CourseLevel.ADVANCED,
    price: 1150000,
    oldPrice: 1790000,
    leadSummary: 'Cứu vãn và hồi sinh các doanh nghiệp đang khủng hoảng: Chẩn đoán nguyên nhân sụt giảm, tái cấu trúc dòng tiền khẩn cấp, thoái vốn tài sản không sinh lời và tái thiết chiến lược.',
    industryContext: 'Nhiều doanh nghiệp lớn rơi vào bờ vực phá sản vì ngủ quên trên chiến thắng và mở rộng dàn trải; chuyên gia tái cấu trúc là những bác sĩ đặc biệt giúp doanh nghiệp hồi sinh.',
    coreTopics: [
      'Chẩn đoán các dấu hiệu cảnh báo sớm của sự suy thoái doanh nghiệp: Dòng tiền âm liên tục, Mất thị phần, Nội bộ lục đục',
      'Quản trị dòng tiền khẩn cấp trong giai đoạn sống còn: Kiểm soát chi tiền mặt 13 tuần (13-Week Cash Flow Model)',
      'Tái cấu trúc tài chính: Đàm phán gia hạn nợ ngân hàng, Tái cơ cấu cấu trúc vốn (Debt-to-Equity Swap)',
      'Tái cấu trúc hoạt động: Cắt giảm chi phí cứng, Thu gọn danh mục sản phẩm, Thoái vốn khỏi các mảng thua lỗ',
      'Quản trị tâm lý và truyền thông nội bộ trong cơn bão tái cấu trúc để duy trì sự ổn định của tổ chức'
    ],
    handsOnProject: 'Xây dựng một kế hoạch giải cứu và tái cấu trúc toàn diện cho một chuỗi nhà hàng đang đối mặt với khoản nợ 50 tỷ đồng và dòng tiền cạn kiệt.',
    targetAudience: 'Thành viên Hội đồng quản trị, Giám đốc điều hành, Cố vấn tái cấu trúc doanh nghiệp, Chuyên gia ngân hàng xử lý nợ.',
    careerApplication: 'Đảm nhận các dự án tái cơ cấu doanh nghiệp quy mô lớn với vị trí Tổng giám đốc tái cấu trúc (Chief Restructuring Officer).',
    requirements: [
      'Tối thiểu 3 năm kinh nghiệm trong công tác điều hành hoặc tư vấn tài chính doanh nghiệp',
      'Bản lĩnh đối diện với những quyết định cắt giảm khó khăn và áp lực cao'
    ],
    benefits: [
      'Nắm bắt kỹ thuật kiểm soát dòng tiền 13 tuần giúp chặn đứng đà chảy máu tiền mặt của công ty trong tích tắc',
      'Tự tin đàm phán với các chủ nợ ngân hàng để tìm ra tiếng nói chung về phương án giãn nợ an toàn',
      'Quyết đoán cắt bỏ những mảng kinh doanh thua lỗ để tập trung bảo vệ phần cốt lõi khỏe mạnh của công ty',
      'Hồi sinh một doanh nghiệp trên bờ vực sụp đổ trở lại quỹ đạo tăng trưởng có lãi'
    ],
    techniques: ['Turnaround Management', '13-Week Cash Flow', 'Debt Restructuring', 'Cost Rationalization', 'CRO', 'Crisis Leadership'],
    documents: [
      'Bảng tính Excel dự phóng dòng tiền sống còn 13 tuần (13-Week Cash Forecast Model)',
      'Bản kế hoạch hành động 100 ngày đầu tiên cho Tổng giám đốc tái cấu trúc'
    ]
  },
  {
    title: 'Mua Bán & Sáp Nhập Doanh Nghiệp (M&A) Thực Chiến: Từ Định Giá Đến Tích Hợp Sau M&A',
    slug: 'mua-ban-sap-nhap-doanh-nghiep-ma-thuc-chien-dinh-gia-tich-hop',
    categorySlug: 'quan-tri-kinh-doanh-va-khoi-nghiep',
    level: CourseLevel.ADVANCED,
    price: 1250000,
    oldPrice: 1990000,
    leadSummary: 'Làm chủ các thương vụ M&A triệu đô: Lập chiến lược thâu tóm, thẩm định đặc biệt (Due Diligence), cấu trúc thương vụ, đàm phán hợp đồng SPA và tích hợp văn hóa sau sáp nhập.',
    industryContext: 'M&A là con đường nhanh nhất để doanh nghiệp thâm nhập thị trường mới hoặc thâu tóm công nghệ đối thủ; tuy nhiên hơn 70% các thương vụ M&A thất bại trong khâu tích hợp sau sáp nhập.',
    coreTopics: [
      'Chiến lược mua bán doanh nghiệp: Sáp nhập theo chiều dọc, Chiều ngang hay Đa ngành, Tìm kiếm mục tiêu phù hợp',
      'Thẩm định đặc biệt toàn diện (Due Diligence): Thẩm định tài chính, Pháp lý, Vận hành thương mại và Thuế',
      'Định giá doanh nghiệp trong giao dịch M&A: Định giá giá trị tài sản, Bội số giao dịch tương đương và Giá trị cộng hưởng (Synergy Value)',
      'Đàm phán và soạn thảo Hợp đồng mua bán cổ phần (SPA - Share Purchase Agreement): Các điều khoản cam đoan (Reps & Warranties), Quỹ giữ lại (Escrow)',
      'Tích hợp sau sáp nhập (Post-Merger Integration - PMI): Đồng bộ hệ thống công nghệ, Hợp nhất quy trình và Hòa nhập văn hóa nhân sự'
    ],
    handsOnProject: 'Thực hiện phân tích thẩm định một thương vụ mua lại chuỗi bán lẻ trị giá 5 triệu USD, phát hiện các rủi ro tiềm ẩn và đề xuất cấu trúc giá thanh toán.',
    targetAudience: 'Giám đốc M&A, Luật sư thương mại, Chuyên viên ngân hàng đầu tư, Lãnh đạo tập đoàn phụ trách chiến lược mở rộng.',
    careerApplication: 'Tham gia điều phối các giao dịch thâu tóm và sáp nhập doanh nghiệp đỉnh cao trên thị trường tài chính.',
    requirements: [
      'Hiểu biết chuyên sâu về tài chính doanh nghiệp, kế toán và luật thương mại',
      'Có kinh nghiệm làm việc trong các giao dịch đầu tư hoặc quản trị cấp cao'
    ],
    benefits: [
      'Nhận diện các cạm bẫy kế toán và nghĩa vụ nợ tiềm ẩn được giấu kín của công ty mục tiêu trong quá trình Due Diligence',
      'Tính toán chính xác giá trị cộng hưởng để không bị mua hớ với mức giá quá đắt',
      'Cấu trúc các điều khoản hợp đồng SPA chặt chẽ bảo vệ tối đa người mua trước các tranh chấp phát sinh',
      'Dẫn dắt thành công quá trình tích hợp sau sáp nhập giúp thương vụ thực sự tạo ra giá trị kinh tế như kỳ vọng'
    ],
    techniques: ['M&A', 'Due Diligence', 'Share Purchase Agreement', 'Post-Merger Integration', 'Synergy Valuation', 'Deal Structuring'],
    documents: [
      'Checklist thẩm định đặc biệt (Due Diligence Checklist) hơn 100 câu hỏi tài chính và pháp lý',
      'Mẫu hợp đồng khung Mua bán cổ phần (SPA Standard Agreement)'
    ]
  },
  {
    title: 'Chuyển Đổi Số Doanh Nghiệp Toàn Diện (Digital Transformation Leadership)',
    slug: 'chuyen-doi-so-doanh-nghiep-toan-dien-digital-transformation',
    categorySlug: 'quan-tri-kinh-doanh-va-khoi-nghiep',
    level: CourseLevel.ADVANCED,
    price: 990000,
    oldPrice: 1590000,
    leadSummary: 'Lãnh đạo cuộc cách mạng số hóa trong tổ chức: Tái định nghĩa mô hình kinh doanh, tự động hóa quy trình bằng công nghệ đám mây, ERP, AI và quản trị thay đổi văn hóa tổ chức.',
    industryContext: 'Chuyển đổi số không đơn thuần là mua sắm phần mềm công nghệ; đó là một cuộc cách mạng thay đổi tư duy, mô hình kinh doanh và cách con người phối hợp làm việc trong thời đại mới.',
    coreTopics: [
      'Bản chất của Chuyển đổi số: Phân biệt giữa Số hóa thông tin (Digitization), Số hóa quy trình (Digitalization) và Chuyển đổi số thực sự (Digital Transformation)',
      'Đánh giá mức độ sẵn sàng số của tổ chức qua Khung năng lực trưởng thành số (Digital Maturity Model)',
      'Lựa chọn và triển khai các hệ thống công nghệ nền tảng: ERP (SAP/Odoo), CRM, Data Lakehouse và Điện toán đám mây',
      'Tái thiết kế trải nghiệm khách hàng và tối ưu quy trình nội bộ bằng tự động hóa thông minh (RPA & AI)',
      'Quản trị sự thay đổi (Change Management): Vượt qua tâm lý phản kháng của nhân viên theo mô hình Prosci ADKAR'
    ],
    handsOnProject: 'Xây dựng một bản Đề án chuyển đổi số toàn diện lộ trình 3 năm cho một công ty sản xuất may mặc truyền thống với 500 lao động.',
    targetAudience: 'Giám đốc chuyển đổi số (CDO), Giám đốc công nghệ (CIO), CEO, Nhà quản trị muốn đưa doanh nghiệp bứt phá trong kỷ nguyên số.',
    careerApplication: 'Dẫn dắt các chiến lược chuyển đổi số cấp tập đoàn, khẳng định vị thế nhà lãnh đạo tương lai.',
    requirements: [
      'Có tầm nhìn quản trị tổ chức và hiểu biết tổng quan về xu hướng công nghệ hiện đại',
      'Kinh nghiệm lãnh đạo các dự án cải tiến quy trình trong doanh nghiệp'
    ],
    benefits: [
      'Tránh lãng phí hàng tỷ đồng đầu tư vào các phần mềm đắt đỏ nhưng nhân viên không chịu sử dụng',
      'Xây dựng lộ trình chuyển đổi số rõ ràng từng bước theo mức độ ưu tiên và năng lực tài chính',
      'Thuyết phục và giải tỏa nỗi lo lắng bị thay thế của đội ngũ nhân viên cũ khi áp dụng công nghệ mới',
      'Biến dữ liệu doanh nghiệp thành tài sản sinh lời và công cụ hỗ trợ ra quyết định kinh doanh chuẩn xác'
    ],
    techniques: ['Digital Transformation', 'Change Management', 'ADKAR Model', 'Digital Maturity', 'ERP Implementation', 'Business Innovation'],
    documents: [
      'Bộ câu hỏi đánh giá mức độ trưởng thành số của doanh nghiệp (Digital Maturity Assessment)',
      'Kế hoạch truyền thông và quản trị thay đổi theo mô hình ADKAR cho các dự án công nghệ'
    ]
  },
  {
    title: 'Quản Trị Doanh Nghiệp Theo Chuẩn Mực Quốc Tế (Corporate Governance & ESG)',
    slug: 'quan-tri-doanh-nghiep-chuan-muc-quoc-te-corporate-governance-esg',
    categorySlug: 'quan-tri-kinh-doanh-va-khoi-nghiep',
    level: CourseLevel.ADVANCED,
    price: 890000,
    oldPrice: 1450000,
    leadSummary: 'Nâng tầm giá trị doanh nghiệp với chuẩn mực quản trị hiện đại: Cơ cấu Hội đồng quản trị độc lập, kiểm soát nội bộ, minh bạch thông tin và thực hành tiêu chuẩn phát triển bền vững ESG.',
    industryContext: 'Các nhà đầu tư quốc tế và các quỹ hưu trí lớn trên thế giới chỉ rót vốn vào các doanh nghiệp có hệ thống quản trị minh bạch và cam kết thực hành bảo vệ môi trường, xã hội (ESG).',
    coreTopics: [
      'Khung quản trị công ty chuẩn mực của OECD: Quyền lợi cổ đông, Đối xử công bằng, Vai trò các bên hữu quan và Minh bạch thông tin',
      'Phân định rạch ròi vai trò giữa Hội đồng quản trị (Định hướng & Giám sát) và Ban điều hành (Thực thi & Tác nghiệp)',
      'Vai trò của các Thành viên Hội đồng quản trị độc lập và các tiểu ban chuyên trách (Tiểu ban Kiểm toán, Lương thưởng, Đề cử)',
      'Tiêu chuẩn ESG (Môi trường - Xã hội - Quản trị): Giảm thiểu phát thải carbon, Trách nhiệm cộng đồng và Đạo đức kinh doanh',
      'Soạn thảo Báo cáo phát triển bền vững (Sustainability Report) chuẩn sáng kiến báo cáo toàn cầu GRI'
    ],
    handsOnProject: 'Xây dựng bản Quy chế quản trị nội bộ hoàn chỉnh và đề xuất khung chiến lược thực hành ESG cho một doanh nghiệp sản xuất chuẩn bị niêm yết trên sàn chứng khoán.',
    targetAudience: 'Thành viên Hội đồng quản trị, Thư ký công ty, Cán bộ phụ trách quan hệ nhà đầu tư (IR), Lãnh đạo doanh nghiệp hướng tới IPO.',
    careerApplication: 'Đảm nhận các vai trò quản trị cấp cao tại các công ty đại chúng và tập đoàn niêm yết lớn.',
    requirements: [
      'Hiểu biết sâu sắc về luật doanh nghiệp, luật chứng khoán và quản trị kinh doanh',
      'Tư duy liêm chính và trách nhiệm xã hội cao'
    ],
    benefits: [
      'Nâng cao uy tín thương hiệu và tính minh bạch của công ty trong mắt các nhà đầu tư tổ chức',
      'Ngăn ngừa các xung đột lợi ích nội bộ và hiện tượng thao túng quyền lực trong doanh nghiệp',
      'Đạt được các tiêu chuẩn ESG quốc tế mở đường cho hàng hóa xuất khẩu sang thị trường Châu Âu và Mỹ',
      'Gia tăng định giá cổ phiếu của doanh nghiệp khi niêm yết nhờ giảm thiểu chi phí rủi ro quản trị'
    ],
    techniques: ['Corporate Governance', 'ESG Standards', 'OECD Guidelines', 'GRI Reporting', 'Board of Directors', 'Investor Relations'],
    documents: [
      'Mẫu Điều lệ công ty và Quy chế nội bộ về quản trị công ty chuẩn cho doanh nghiệp niêm yết',
      'Khung chỉ số đánh giá thực hành phát triển bền vững ESG theo tiêu chuẩn GRI'
    ]
  }
]
