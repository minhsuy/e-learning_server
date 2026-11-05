import { CourseLevel } from '@prisma/client'
import { CourseBlueprint } from './categories-data'

export const COURSES_CREATIVE_WELLNESS: readonly CourseBlueprint[] = [
  // ==========================================
  // CAT-18: Nhiếp ảnh, Quay phim & Dựng video (14 courses)
  // Quota: 4 BEGINNER, 6 INTERMEDIATE, 4 ADVANCED | 2 FREE, 12 PAID
  // ==========================================
  {
    title: 'Nhiếp Ảnh Nhập Môn: Làm Chủ Tam Giác Phơi Sáng & Bố Cục Khung Hình Cơ Bản',
    slug: 'nhiep-anh-nhap-mon-tam-giac-phoi-sang-bo-cuc',
    categorySlug: 'nhiep-anh-va-dung-phim',
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0,
    leadSummary: 'Thoát khỏi chế độ chụp tự động Auto: Hiểu rõ cơ chế tam giác phơi sáng (Khẩu độ, Tốc độ màn trập, ISO), làm chủ điểm lấy nét và các quy tắc bố cục thị giác kinh điển.',
    industryContext: 'Máy ảnh tốt nhất là chiếc máy ảnh bạn đang có trong tay; nhưng để biến một bức ảnh chụp lưu niệm thành một tác phẩm nghệ thuật, bạn cần nắm vững nguyên lý quang học và con mắt bố cục.',
    coreTopics: [
      'Cơ chế hoạt động của máy ảnh kỹ thuật số (DSLR / Mirrorless): Cảm biến hình ảnh, Màn trập và Ống kính',
      'Tam giác phơi sáng (Exposure Triangle): Mối quan hệ qua lại giữa Khẩu độ (Aperture), Tốc độ màn trập (Shutter Speed) và Độ nhạy sáng (ISO)',
      'Kiểm soát độ sâu trường ảnh (Depth of Field): Tạo hiệu ứng xóa phông mịt mù cho ảnh chân dung',
      'Bắt trọn chuyển động: Kỹ thuật đóng băng giọt nước siêu tốc vs Kỹ thuật phơi sáng dài mượt mà dòng thác',
      'Các nguyên tắc bố cục thị giác kinh điển: Bố cục một phần ba (Rule of Thirds), Đường dẫn (Leading Lines), Đóng khung tự nhiên (Framing) và Không gian âm'
    ],
    handsOnProject: 'Thực hiện một bộ ảnh 5 bức chụp ngoài trời ứng dụng chế độ chụp Thủ công (Manual Mode) hoàn toàn, bao gồm ảnh xóa phông, ảnh chuyển động và ảnh bố cục đường dẫn.',
    targetAudience: 'Người mới mua máy ảnh, người đam mê nhiếp ảnh muốn chụp ảnh đẹp hơn cho gia đình và bạn bè.',
    careerApplication: 'Làm chủ thiết bị máy ảnh, tạo tiền đề để phát triển lên nhiếp ảnh gia thương mại hoặc dịch vụ sự kiện.',
    requirements: [
      'Máy ảnh có chế độ chụp chỉnh tay Manual (DSLR, Mirrorless hoặc máy ảnh Compact)',
      'Tâm hồn yêu thích quan sát ánh sáng và vẻ đẹp cuộc sống xung quanh'
    ],
    benefits: [
      'Không bao giờ chụp ra những bức ảnh bị mờ nhòe, rung lắc hay thừa/thiếu sáng',
      'Tự tay tạo ra những bức ảnh chân dung xóa phông lung linh làm nổi bật chủ thể',
      'Hiểu rõ khi nào nên tăng ISO và cách kiểm soát hiện tượng nhiễu hạt (Noise)',
      'Nhìn thấy những góc chụp đẹp mắt mà người bình thường dễ dàng bỏ qua'
    ],
    techniques: ['Photography Basics', 'Exposure Triangle', 'Aperture & Shutter', 'Depth of Field', 'Rule of Thirds', 'Manual Mode'],
    documents: [
      'Bảng tra cứu nhanh các thông số chụp khuyến nghị cho từng hoàn cảnh (Trời nắng, Trong nhà, Ban đêm, Thể thao)',
      'Sơ đồ minh họa trực quan tác động của Khẩu độ, Tốc độ và ISO lên bức ảnh'
    ]
  },
  {
    title: 'Quay & Dựng Video Ngắn Triệu View Bằng Điện Thoại Di Động Với CapCut',
    slug: 'quay-dung-video-ngan-bang-dien-thoai-capcut',
    categorySlug: 'nhiep-anh-va-dung-phim',
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0,
    leadSummary: 'Biến chiếc điện thoại thành phim trường bỏ túi: Kỹ thuật quay góc máy chuyển động, làm chủ ánh sáng tự nhiên, cắt ghép nhịp điệu trên CapCut và tạo phụ đề tự động bắt mắt.',
    industryContext: 'Video ngắn (TikTok, Reels, Shorts) là xu hướng truyền thông thống trị hiện nay; bạn hoàn toàn có thể tự sản xuất những thước phim triệu view chỉ với một chiếc smartphone thông thường.',
    coreTopics: [
      'Cài đặt camera điện thoại chuẩn điện ảnh: Khóa nét, Khóa sáng (AE/AF Lock), Tốc độ khung hình (24fps vs 60fps) và Độ phân giải 4K',
      'Các góc máy và chuyển động máy quay cơ bản: Lia máy (Pan), Nghiêng (Tilt), Tiến lùi (Push/Pull) và Xoay vòng (Orbit)',
      'Tận dụng nguồn sáng tự nhiên và bố trí đèn led mini cho góc quay trong nhà',
      'Dựng phim siêu tốc trên ứng dụng CapCut: Cắt tỉa nhịp điệu (Pacing), Chèn nhạc bắt trend, Hiệu ứng chuyển cảnh và Lớp phủ (Overlay)',
      'Tự động tạo phụ đề chạy chữ (Auto Captions) phong cách TikTok và tinh chỉnh màu sắc tươi sáng'
    ],
    handsOnProject: 'Quay và dựng hoàn chỉnh một video ngắn 45 giây giới thiệu một món ăn đường phố hấp dẫn với đầy đủ âm thanh xèo xèo chân thực và phụ đề sinh động.',
    targetAudience: 'Người sáng tạo nội dung mới, Chủ shop bán hàng online, Cá nhân muốn làm vlog du lịch ẩm thực.',
    careerApplication: 'Tự sản xuất toàn bộ nội dung video ngắn cho kênh cá nhân hoặc nhận dự án làm video ngắn cho các nhãn hàng.',
    requirements: [
      'Điện thoại thông minh có camera hoạt động tốt và cài đặt ứng dụng CapCut miễn phí',
      'Sự tự tin và đam mê kể chuyện qua hình ảnh chuyển động'
    ],
    benefits: [
      'Tự quay được những thước phim mượt mà, không bị rung lắc ngay cả khi cầm tay di chuyển',
      'Cắt ghép video đúng nhịp điệu bài hát tạo cảm giác cuốn hút người xem từ đầu đến cuối',
      'Tạo phụ đề tiếng Việt tự động chỉ sau 5 giây mà không cần ngồi gõ tay từng chữ',
      'Tăng lượng người theo dõi và tương tác đột phá trên TikTok, Instagram Reels và YouTube Shorts'
    ],
    techniques: ['Smartphone Videography', 'CapCut Editing', 'Camera Movements', 'Auto Captions', 'Mobile Lighting', 'Short-form Video'],
    documents: [
      'Checklist 10 bước chuẩn bị trước khi bấm máy quay video bằng điện thoại',
      'Bộ sưu tập 30 bài nhạc nền bản quyền miễn phí thịnh hành nhất trên mạng xã hội'
    ]
  },
  {
    title: 'Hậu Kỳ Ảnh Chuyên Nghiệp Với Adobe Lightroom: Quản Lý Thư Viện & Làm Màu Điện Ảnh',
    slug: 'hau-ky-anh-chuyen-nghiep-adobe-lightroom-mau-dien-anh',
    categorySlug: 'nhiep-anh-va-dung-phim',
    level: CourseLevel.BEGINNER,
    price: 399000,
    oldPrice: 650000,
    leadSummary: 'Thổi hồn vào bức ảnh RAW của bạn: Làm chủ Adobe Lightroom Classic, cân chỉnh ánh sáng, phối màu HSL/Color Grading, xóa khuyết điểm và tự tạo bộ Preset màu độc quyền.',
    industryContext: 'Chụp ảnh mới chỉ là một nửa chặng đường; giai đoạn hậu kỳ màu sắc chính là nơi định hình phong cách nghệ thuật độc bản và cảm xúc cho toàn bộ bộ ảnh của bạn.',
    coreTopics: [
      'Tổ chức và quản lý hàng chục nghìn bức ảnh khoa học với Lightroom Catalog, Collections và Từ khóa (Keywords)',
      'Ưu thế vượt trội của tệp ảnh thô RAW so với ảnh nén JPEG trong việc cứu lại chi tiết vùng sáng (Highlights) và vùng tối (Shadows)',
      'Làm chủ bảng điều khiển màu sắc HSL / Color Mixer: Tùy biến Sắc độ (Hue), Độ bão hòa (Saturation) và Độ sáng (Luminance) của từng kênh màu riêng biệt',
      'Tạo màu điện ảnh với Color Grading: Phối màu tương phản giữa vùng sáng (Highlights) và vùng bóng đổ (Shadows)',
      'Sử dụng mặt nạ thông minh (Masking AI): Tự động chọn người, chọn bầu trời và làm nổi bật chủ thể'
    ],
    handsOnProject: 'Thực hiện hậu kỳ hoàn chỉnh một bộ ảnh du lịch 15 bức ảnh RAW theo phong cách màu điện ảnh ấm áp và đóng gói thành 1 Preset màu Lightroom xuất ra file .xmp.',
    targetAudience: 'Người chụp ảnh du lịch, Nhiếp ảnh gia tự do, Người đam mê chỉnh sửa hình ảnh trên máy tính.',
    careerApplication: 'Tự tin nhận dịch vụ hậu kỳ chỉnh màu cho các bộ ảnh cưới, ảnh kỷ yếu và ảnh sự kiện chuyên nghiệp.',
    requirements: [
      'Máy tính cài đặt phần mềm Adobe Lightroom Classic CC',
      'Có sẵn một số tệp ảnh RAW hoặc ảnh chụp bằng máy ảnh để thực hành'
    ],
    benefits: [
      'Cứu lại hoàn hảo những bức ảnh bị cháy sáng hoặc đen thui tưởng chừng phải vứt đi',
      'Định hình phong cách màu sắc mang đậm dấu ấn cá nhân không lẫn với bất kỳ ai',
      'Chỉnh màu hàng loạt hàng trăm bức ảnh cùng lúc chỉ trong một cú nhấp chuột đồng bộ (Sync Settings)',
      'Tạo và bán các bộ Preset màu sắc cho cộng đồng người yêu nhiếp ảnh'
    ],
    techniques: ['Adobe Lightroom', 'RAW Processing', 'Color Grading', 'HSL Panel', 'AI Masking', 'Preset Creation'],
    documents: [
      'Gói 10 Preset màu Lightroom chuyên nghiệp (Tone Hàn Quốc, Vintage, Điện ảnh, Phong cảnh rực rỡ)',
      'Bộ ảnh RAW chụp thực tế tại Đà Lạt để học viên thực hành làm màu'
    ]
  },
  {
    title: 'Dựng Phim Cơ Bản Với Adobe Premiere Pro: Làm Chủ Quy Trình Biên Tập Video Chuẩn Công Nghiệp',
    slug: 'dung-phim-co-ban-adobe-premiere-pro-quy-trinh-bien-tap',
    categorySlug: 'nhiep-anh-va-dung-phim',
    level: CourseLevel.BEGINNER,
    price: 450000,
    oldPrice: 750000,
    leadSummary: 'Bước chân vào thế giới biên tập video chuyên nghiệp: Làm chủ dòng thời gian (Timeline), các công cụ cắt gọt, chèn chữ đồ họa chuyển động, xử lý âm thanh cơ bản và xuất file chuẩn YouTube/TikTok.',
    industryContext: 'Adobe Premiere Pro là phần mềm dựng phim tiêu chuẩn vàng được các đài truyền hình, kênh YouTube lớn và các công ty truyền thông trên toàn cầu tin dùng.',
    coreTopics: [
      'Thiết lập dự án và chuỗi làm việc (Sequence Settings) chuẩn tỷ lệ 16:9 cho ngang và 9:16 cho dọc',
      'Các công cụ cắt gọt trên Timeline: Razor Tool, Ripple Edit, Rolling Edit và phím tắt dựng phim thần tốc (J-K-L)',
      'Thiết kế đồ họa chuyển động cơ bản với Essential Graphics: Tiêu đề mở đầu, Dải chữ tên người (Lower Thirds)',
      'Xử lý âm thanh cơ bản: Lọc tạp âm, Cân bằng âm lượng (Audio Gain/Normalize) và kỹ thuật nối âm L-cut / J-cut mượt mà',
      'Quy chuẩn xuất file (Export Settings): Bộ giải mã H.264/H.265, Bitrate và cài đặt thông số tối ưu cho từng nền tảng'
    ],
    handsOnProject: 'Biên tập hoàn chỉnh một video phỏng vấn kết hợp cảnh chèn (B-roll) dài 3 phút với âm nhạc nền du dương và dải tên người chuyên nghiệp.',
    targetAudience: 'Người muốn theo đuổi nghề dựng phim (Video Editor), YouTuber, Nhân viên truyền thông doanh nghiệp.',
    careerApplication: 'Tự tin ứng tuyển vị trí Junior Video Editor hoặc nhận các hợp đồng dựng phim bán thời gian.',
    requirements: [
      'Máy tính cá nhân có cấu hình khá (khuyến nghị tối thiểu 16GB RAM và có card đồ họa rời)',
      'Cài đặt phần mềm Adobe Premiere Pro CC'
    ],
    benefits: [
      'Làm chủ quy trình biên tập video chuẩn mực từ lúc nhập dữ liệu thô đến khi xuất bản thành phẩm',
      'Tăng gấp đôi tốc độ dựng phim nhờ sử dụng thành thạo hệ thống phím tắt chuyên nghiệp',
      'Tạo ra những đoạn chuyển cảnh âm thanh mượt mà không bị cụt hay giật cục',
      'Xuất ra những video có độ nét cao, màu sắc chuẩn xác mà dung lượng tệp tin vẫn nhẹ nhàng'
    ],
    techniques: ['Adobe Premiere Pro', 'Timeline Editing', 'Ripple Edit', 'Essential Graphics', 'L-cut and J-cut', 'Video Export'],
    documents: [
      'Bảng tổng hợp các phím tắt vàng trong Adobe Premiere Pro dán bàn phím',
      'Gói tài nguyên đồ họa Essential Graphics gồm 20 mẫu Lower Thirds và Transition sẵn dùng'
    ]
  },
  {
    title: 'Nghệ Thuật Chiếu Sáng Điện Ảnh (Cinematic Lighting) Trong Phim & Video Phỏng Vấn',
    slug: 'nghe-thuat-chieu-sang-dien-anh-cinematic-lighting',
    categorySlug: 'nhiep-anh-va-dung-phim',
    level: CourseLevel.INTERMEDIATE,
    price: 650000,
    oldPrice: 990000,
    leadSummary: 'Ánh sáng tạo nên chất điện ảnh: Làm chủ sơ đồ chiếu sáng 3 điểm (Key, Fill, Backlight), kiểm soát chất lượng ánh sáng (Gắt vs Mềm), tỷ lệ tương phản và kỹ thuật đánh sáng thực tế.',
    industryContext: 'Một chiếc máy ảnh giá rẻ được chiếu sáng hoàn hảo sẽ cho ra hình ảnh đẹp hơn một chiếc máy quay đắt tiền đặt trong điều kiện ánh sáng tồi tệ; ánh sáng chính là linh hồn của điện ảnh.',
    coreTopics: [
      'Bản chất vật lý của ánh sáng: Nhiệt độ màu (Kelvin), Chỉ số hoàn màu (CRI/TLCI) và Cân bằng trắng (White Balance)',
      'Sơ đồ chiếu sáng 3 điểm kinh điển: Đèn chính (Key Light), Đèn phụ giảm bóng (Fill Light) và Đèn viền tóc tách nền (Backlight/Hair Light)',
      'Kiểm soát tính chất ánh sáng: Ánh sáng gắt (Hard Light) tạo kịch tính vs Ánh sáng mềm mại (Soft Light) tôn da qua Softbox, Tản sáng',
      'Kỹ thuật chiếu sáng Rembrandt và chiếu sáng chia nửa (Split Lighting) tạo chiều sâu cho gương mặt',
      'Đánh sáng môi trường thực tế (Practical Lights): Sử dụng đèn bàn, đèn neon và dải đèn led tạo không gian có chiều sâu'
    ],
    handsOnProject: 'Thiết lập một góc quay phỏng vấn chuẩn điện ảnh với sơ đồ ánh sáng 3 điểm kết hợp nguồn sáng thực tế trong phòng tối hoàn toàn.',
    targetAudience: 'Quay phim, Đạo diễn hình ảnh (DP), Nhà làm phim độc lập, Chủ kênh YouTube muốn nâng tầm hình ảnh.',
    careerApplication: 'Trở thành chuyên gia ánh sáng (Gaffer) hoặc nâng cấp chất lượng hình ảnh của các sản phẩm video lên chuẩn rạp chiếu.',
    requirements: [
      'Có ít nhất 1 hoặc 2 đèn chiếu sáng studio (đèn LED COB hoặc đèn cầm tay) và tản sáng',
      'Hiểu biết cơ bản về cài đặt máy quay'
    ],
    benefits: [
      'Biến một căn phòng ngủ bình thường thành một phim trường phỏng vấn lung linh và sang trọng',
      'Tạo khối khuôn mặt thanh thoát, làn da mịn màng tự nhiên mà không cần phụ thuộc vào bộ lọc filter',
      'Tách biệt chủ thể rõ ràng ra khỏi hậu cảnh tạo cảm giác không gian 3 chiều có chiều sâu',
      'Kiểm soát hoàn toàn bầu không khí và cảm xúc của cảnh quay thông qua việc điều phối ánh sáng'
    ],
    techniques: ['Cinematic Lighting', '3-Point Lighting', 'Rembrandt Lighting', 'Color Temperature', 'Softbox Diffusion', 'Practical Lighting'],
    documents: [
      'Sơ đồ vị trí đặt đèn cho 10 bối cảnh quay phim thông dụng nhất (Phỏng vấn, Kịch tính, MV ca nhạc)',
      'Bảng tra cứu nhiệt độ màu Kelvin chuẩn cho các nguồn sáng tự nhiên và nhân tạo'
    ]
  },
  {
    title: 'Chỉnh Màu Điện Ảnh Chuyên Nghiệp Với DaVinci Resolve (Color Grading Mastery)',
    slug: 'chinh-mau-dien-anh-davinci-resolve-color-grading',
    categorySlug: 'nhiep-anh-va-dung-phim',
    level: CourseLevel.INTERMEDIATE,
    price: 790000,
    oldPrice: 1250000,
    leadSummary: 'Làm chủ phần mềm chỉnh màu số một Hollywood DaVinci Resolve: Đọc hiểu Scopes đo màu, chỉnh màu sơ cấp (Color Correction), làm màu sáng tạo (Color Grading) theo sơ đồ Nodes.',
    industryContext: 'Hơn 90% các bộ phim bom tấn chiếu rạp trên thế giới đều được hoàn thiện màu sắc trên DaVinci Resolve; nghề chuyên viên chỉnh màu (Colorist) luôn là vị trí kỹ thuật cao quý giá.',
    coreTopics: [
      'Cấu trúc làm việc của trang Color trong DaVinci Resolve: Sơ đồ Nodes (Serial Nodes, Parallel Nodes, Layer Nodes)',
      'Đọc hiểu các công cụ đo lường chuyên dụng: Biểu đồ Waveform, Vectorscope, Parade và Histogram',
      'Quy trình Chỉnh màu sơ cấp (Primary Correction): Cân bằng trắng, Cân bằng phơi sáng và Đồng bộ màu sắc giữa các góc máy khác nhau',
      'Khai thác không gian màu Log và RAW: Chuyển đổi Color Space Transform (CST) từ máy Sony, Canon, Blackmagic sang chuẩn Rec.709',
      'Chỉnh màu thứ cấp (Secondary Grading): Tách riêng màu da người (Skintone line), Đổi màu trang phục và Tạo phong cách màu Teal & Orange kinh điển'
    ],
    handsOnProject: 'Thực hiện chỉnh màu toàn bộ một đoạn phim ngắn 2 phút quay ở định dạng Log, cân chỉnh màu da tự nhiên và tạo phong cách màu điện ảnh cổ điển.',
    targetAudience: 'Colorist, Video Editor, Dựng phim muốn nâng tầm kỹ năng làm màu lên tiêu chuẩn điện ảnh chuyên nghiệp.',
    careerApplication: 'Trở thành chuyên viên chỉnh màu độc lập (Freelance Colorist) nhận các dự án MV ca nhạc, phim ngắn và quảng cáo truyền hình (TVC).',
    requirements: [
      'Máy tính cá nhân có card đồ họa rời mạnh và màn hình có độ chuẩn màu tốt',
      'Cài đặt phần mềm DaVinci Resolve (phiên bản miễn phí hoặc Studio)'
    ],
    benefits: [
      'Làm chủ hệ thống Nodes logic giúp kiểm soát và tinh chỉnh màu sắc linh hoạt mà không bị phá vỡ điểm ảnh',
      'Cân chỉnh màu da người mẫu luôn hồng hào, khỏe khoắn bất kể bối cảnh quay ban đầu ra sao',
      'Đồng bộ hoàn hảo màu sắc giữa 3-4 dòng máy quay khác nhau trong cùng một cảnh quay',
      'Tạo ra những tông màu điện ảnh ấn tượng làm tăng giá trị nghệ thuật của tác phẩm lên nhiều lần'
    ],
    techniques: ['DaVinci Resolve', 'Color Grading', 'Node Tree', 'Waveform & Vectorscope', 'Color Space Transform', 'Teal and Orange Look'],
    documents: [
      'Sơ đồ cấu trúc cây Node chuẩn mực cho quy trình làm màu chuyên nghiệp',
      'Gói tệp phim RAW/Log mẫu chất lượng cao quay từ máy Blackmagic Pocket 6K để thực hành'
    ]
  },
  {
    title: 'Nhiếp Ảnh Chân Dung Nghệ Thuật & Studio: Ánh Sáng Đèn Flash & Chỉ Đạo Tạo Dáng (Posing)',
    slug: 'nhiep-anh-chan-dung-nghe-thuat-studio-den-flash-posing',
    categorySlug: 'nhiep-anh-va-dung-phim',
    level: CourseLevel.INTERMEDIATE,
    price: 690000,
    oldPrice: 1050000,
    leadSummary: 'Chinh phục nhiếp ảnh chân dung thương mại: Làm chủ đèn Flash ngoài máy (Off-Camera Flash), các phụ kiện tản sáng Studio và nghệ thuật chỉ đạo tạo dáng giúp người mẫu tự tin.',
    industryContext: 'Nhiếp ảnh chân dung không chỉ là việc bắt trọn khuôn mặt; đó là sự thấu hiểu tâm lý, khả năng khơi gợi cảm xúc và kiểm soát ánh sáng tuyệt đối trong không gian studio.',
    coreTopics: [
      'Nguyên lý đèn chớp Studio (Strobe/Flash) và bộ kích nổ không dây (Wireless Triggers): Tốc độ đồng bộ Flash (Sync Speed) và High-Speed Sync (HSS)',
      'Các phụ kiện tạo hình ánh sáng (Light Modifiers): Dù xuyên, Bát phản sáng Beauty Dish, Softbox bát giác và Lưới định hướng (Grid)',
      'Các sơ đồ đánh sáng chân dung kinh điển: Ánh sáng bướm (Butterfly), Ánh sáng ven viền (Rim Light) và Ánh sáng nền',
      'Tâm lý học tạo dáng (Posing Psychology): Cách giao tiếp giúp người chụp thả lỏng cơ mặt, bỏ qua sự ngại ngùng',
      'Quy tắc tạo dáng hình thể: Góc nghiêng gương mặt, Đặt vị trí bàn tay, Tạo đường cong chữ S và kiểm soát nếp nhăn trang phục'
    ],
    handsOnProject: 'Thực hiện một buổi chụp chân dung Studio chuyên nghiệp cho một doanh nhân với 3 phong cách ánh sáng khác nhau (Trang trọng, Quyền lực, Thân thiện).',
    targetAudience: 'Nhiếp ảnh gia chân dung, Chủ studio ảnh cưới, Người muốn mở studio dịch vụ chụp ảnh cá nhân.',
    careerApplication: 'Tự tin mở Studio chụp ảnh chân dung doanh nhân, ảnh profile cá nhân và thời trang thương mại.',
    requirements: [
      'Máy ảnh có chân cắm đèn Flash ngoài (Hot shoe)',
      'Có ít nhất 1 đèn Flash rời (Speedlight hoặc đèn Strobe)'
    ],
    benefits: [
      'Tự tin làm chủ hoàn toàn ánh sáng nhân tạo trong Studio mà không sợ bị cháy sáng hay tối đen',
      'Biết cách hướng dẫn người bình thường tạo dáng tự nhiên, thanh thoát như người mẫu chuyên nghiệp',
      'Tạo ra những bức ảnh Profile doanh nhân đẳng cấp, tôn vinh phong thái thành đạt của khách hàng',
      'Mở rộng dịch vụ chụp ảnh cá nhân với mức giá gói chụp cao cấp'
    ],
    techniques: ['Portrait Photography', 'Studio Flash', 'Off-Camera Flash (OCF)', 'Beauty Dish', 'Model Posing', 'High-Speed Sync'],
    documents: [
      'Bộ sưu tập 50 tư thế tạo dáng chân dung nam và nữ chuẩn mực dễ áp dụng',
      'Sơ đồ thiết lập khoảng cách và công suất đèn Flash cho các kiểu chụp Beauty'
    ]
  },
  {
    title: 'Kỹ Thuật Làm Phim Tài Liệu & Phim Quảng Cáo Ngắn (Docu-Style & Commercial Filmmaking)',
    slug: 'ky-thuat-lam-phim-tai-lieu-quang-cao-ngan',
    categorySlug: 'nhiep-anh-va-dung-phim',
    level: CourseLevel.INTERMEDIATE,
    price: 750000,
    oldPrice: 1190000,
    leadSummary: 'Kể những câu chuyện người thật việc thật chạm đến cảm xúc: Lên kịch bản tiền kỳ, kỹ thuật phỏng vấn khai thác chiều sâu, săn tìm cảnh quay đời thực (B-roll) và nhịp điệu dựng phim tài liệu.',
    industryContext: 'Phong cách phim tài liệu chân thực (Docu-style) đang là hình thức quảng cáo thương hiệu được các tập đoàn lớn ưa chuộng nhất nhờ sức lay động cảm xúc và sự tin cậy cao.',
    coreTopics: [
      'Quy trình sản xuất phim ngắn 3 giai đoạn: Tiền kỳ (Pre-production), Sản xuất hiện trường (Production) và Hậu kỳ (Post-production)',
      'Nghệ thuật phỏng vấn nhân vật tài liệu: Cách đặt câu hỏi gợi mở, Kỹ thuật lắng nghe không ngắt lời để nhân vật trải lòng chân thật',
      'Quy tắc quay cảnh bổ trợ B-roll: Quay đa dạng góc rộng (Wide), Trung (Medium), Cận (Close-up) và Siêu cận (Macro)',
      'Kỹ thuật thu âm hiện trường chuẩn sạch: Sử dụng Micro cài áo không dây (Lavalier) và Micro định hướng (Shotgun)',
      'Cấu trúc dựng phim tài liệu: Đan xen giữa lời kể phỏng vấn (A-roll) và hình ảnh minh họa (B-roll) theo nhịp thở cảm xúc'
    ],
    handsOnProject: 'Sản xuất một bộ phim tài liệu ngắn dài 5 phút kể về cuộc đời và niềm đam mê của một nghệ nhân làm gốm truyền thống.',
    targetAudience: 'Nhà làm phim độc lập, Đạo diễn video, Nhân sự truyền thông nội bộ doanh nghiệp, Phóng viên truyền hình.',
    careerApplication: 'Nhận các hợp đồng sản xuất phim giới thiệu doanh nghiệp, phim tài liệu thương hiệu cho các tổ chức phi chính phủ và tập đoàn.',
    requirements: [
      'Máy quay hoặc máy ảnh có khả năng quay video chất lượng tốt',
      'Micro thu âm ngoài để đảm bảo chất lượng âm thanh phỏng vấn rõ ràng'
    ],
    benefits: [
      'Biết cách khai thác những câu chuyện đời thường xúc động từ những con người bình dị nhất',
      'Quay được những thước phim B-roll đắt giá thể hiện chân thực không khí và tâm trạng nhân vật',
      'Làm chủ quy trình thu âm sạch sẽ loại bỏ hoàn toàn tiếng ồn gió rít ngoài trời',
      'Sản xuất ra những tác phẩm video có giá trị nhân văn sâu sắc và sức lan tỏa mạnh mẽ'
    ],
    techniques: ['Documentary Filmmaking', 'B-Roll Shooting', 'Interview Techniques', 'Location Sound Recording', 'Story Pacing', 'Commercial Storytelling'],
    documents: [
      'Bảng mẫu kế hoạch quay phim chi tiết từng phân cảnh (Shot List Template)',
      'Bộ câu hỏi phỏng vấn gợi mở cảm xúc nhân vật chuẩn phim tài liệu'
    ]
  },
  {
    title: 'Nhiếp Ảnh Thương Mại & Chụp Ảnh Sản Phẩm (Commercial & Food Photography)',
    slug: 'nhiep-anh-thuong-mai-chup-anh-san-pham-food-photography',
    categorySlug: 'nhiep-anh-va-dung-phim',
    level: CourseLevel.INTERMEDIATE,
    price: 650000,
    oldPrice: 990000,
    leadSummary: 'Kích thích thị giác và vị giác khách hàng: Bố trí đạo cụ (Food Styling), kiểm soát bề mặt phản chiếu kim loại/thủy tinh, tạo hiệu ứng khói bốc nghi ngút và giọt nước đọng tươi mát.',
    industryContext: 'Một bức ảnh chụp món ăn ngon mắt có thể khiến khách hàng đặt bàn ngay lập tức; chụp ảnh sản phẩm thương mại là phân khúc dịch vụ có nhu cầu cực lớn từ các nhà hàng và nhãn hàng.',
    coreTopics: [
      'Đặc thù của nhiếp ảnh sản phẩm và ẩm thực: Bố cục góc chụp 45 độ (Góc nhìn người ăn), Góc 90 độ (Flatlay từ trên xuống) và Góc 0 độ ngang tầm mắt',
      'Nghệ thuật Food Styling: Kỹ thuật tạo giọt sương đọng trên ly nước bằng hỗn hợp Glycerin, Tạo làn khói bốc nghi ngút từ món ăn nóng',
      'Xử lý bề mặt phản chiếu phức tạp: Kỹ thuật chụp chai rượu vang thủy tinh, Đồng hồ kim loại mà không bị phản chiếu bóng đen của máy ảnh',
      'Sử dụng các tấm hắt sáng mini, Gương và Thước chặn sáng (Black flags) để điêu khắc ánh sáng trên từng chi tiết nhỏ',
      'Hậu kỳ làm sạch bụi bẩn, vết xước sản phẩm và tăng cường độ căng mọng của món ăn trên Photoshop'
    ],
    handsOnProject: 'Thực hiện một bộ ảnh quảng cáo thương mại cho một món bánh ngọt cao cấp kết hợp ly trà đào có hiệu ứng giọt nước đọng lung linh.',
    targetAudience: 'Nhiếp ảnh gia sản phẩm, Chủ nhà hàng quán cà phê, Food Blogger, Marketer ngành thực phẩm đồ uống.',
    careerApplication: 'Cung cấp dịch vụ chụp ảnh menu nhà hàng, ảnh quảng cáo sản phẩm bao bì cho các thương hiệu ẩm thực.',
    requirements: [
      'Máy ảnh có ống kính chụp cận cảnh (Macro hoặc ống tiêu cự 50mm/85mm)',
      'Chân máy ảnh cố định (Tripod) vững chắc'
    ],
    benefits: [
      'Biến những món ăn bình thường trở nên vô cùng hấp dẫn, thơm ngon trên từng khung hình',
      'Làm chủ kỹ thuật kiểm soát bóng đổ và vệt phản chiếu trên các bề mặt chai lọ thủy tinh khó tính',
      'Tự tay chuẩn bị đạo cụ và bài trí bàn chụp món ăn hài hòa theo phong cách rustic hoặc hiện đại',
      'Nâng cao doanh số bán hàng của nhà hàng nhờ những bức ảnh menu chuyên nghiệp'
    ],
    techniques: ['Product Photography', 'Food Styling', 'Macro Lens', 'Glycerin Droplets', 'Reflective Surfaces', 'Flatlay Composition'],
    documents: [
      'Cẩm nang 20 mẹo vặt của các chuyên gia Food Stylist chuyên nghiệp',
      'Danh sách các đạo cụ chụp ảnh ẩm thực cần có cho một studio mini tại nhà'
    ]
  },
  {
    title: 'Kỹ Xảo Hoạt Họa & Kỹ Thuật Motion Graphics Cho Video Trên Adobe After Effects',
    slug: 'ky-xao-hoat-hoa-motion-graphics-after-effects',
    categorySlug: 'nhiep-anh-va-dung-phim',
    level: CourseLevel.INTERMEDIATE,
    price: 790000,
    oldPrice: 1250000,
    leadSummary: 'Thổi bùng sự hấp dẫn cho video: Tạo hiệu ứng chữ chuyển động (Kinetic Typography), gắn nhãn theo dõi chuyển động (Motion Tracking), tách nền xanh (Chroma Key) và kỹ xảo đồ họa thông tin.',
    industryContext: 'Các video có đồ họa chuyển động bắt mắt luôn giữ chân người xem lâu hơn trên YouTube; kỹ năng After Effects giúp người dựng phim bứt phá thu nhập lên tầm cao mới.',
    coreTopics: [
      'Không gian làm việc After Effects: Dòng thời gian đa lớp, Khái niệm Compositions và Kết nối Dynamic Link với Premiere Pro',
      'Làm chủ đồ thị vận tốc Graph Editor: Tinh chỉnh chuyển động từ giật cục thành mượt mà, tự nhiên',
      'Kỹ thuật theo dõi chuyển động (Motion Tracking): Bắt dính chữ hoặc hình ảnh vào một vật thể đang di chuyển trong video',
      'Tách phông xanh chuyên nghiệp (Chroma Keying) với hiệu ứng Keylight: Xử lý viền xanh (Spill suppression) và phục hồi tóc tơ',
      'Thiết kế đồ họa thông tin chuyển động (Animated Infographics): Biểu đồ tròn xoay, Cột mốc tiến trình và Bản đồ chỉ đường sinh động'
    ],
    handsOnProject: 'Tạo một đoạn Intro mở đầu kênh YouTube 10 giây kết hợp kỹ xảo theo dõi chuyển động gắn nhãn giá tiền vào các sản phẩm trong video review công nghệ.',
    targetAudience: 'Video Editor muốn học thêm kỹ xảo đồ họa, YouTuber muốn nâng cấp hình ảnh kênh, Motion Designer mới vào nghề.',
    careerApplication: 'Tự tin đảm nhận các dự án sản xuất video quảng cáo đòi hỏi kỹ xảo chuyển động phức tạp.',
    requirements: [
      'Đã có kiến thức cơ bản về dựng video trên Premiere Pro hoặc phần mềm tương đương',
      'Máy tính có cấu hình phần cứng tốt để kết xuất kỹ xảo mượt mà'
    ],
    benefits: [
      'Tự làm các đoạn hiệu ứng chuyển cảnh độc đáo mà không cần mua các gói mẫu template đắt tiền',
      'Tách nền xanh hoàn hảo không để lại viền lem luốc, hòa trộn nhân vật vào bối cảnh ảo tự nhiên',
      'Biến những con số thống kê khô khan thành các hoạt ảnh chuyển động cuốn hút người xem',
      'Nâng tầm giá trị sản phẩm video của bạn lên đẳng cấp phát sóng truyền hình'
    ],
    techniques: ['After Effects', 'Motion Tracking', 'Chroma Keying', 'Graph Editor', 'Kinetic Typography', 'Dynamic Link'],
    documents: [
      'Gói 50 hiệu ứng âm thanh kỹ xảo Whoosh, Pop, Click bản quyền chất lượng cao',
      'File dự án After Effects mẫu (.aep) chứa các mẫu hoạt họa chữ thông dụng sẵn dùng'
    ]
  },
  {
    title: 'Nghệ Thuật Bay & Ghi Hình Flycam (Drone Cinematography) Đỉnh Cao',
    slug: 'nghe-thuat-bay-ghi-hinh-flycam-drone-cinematography',
    categorySlug: 'nhiep-anh-va-dung-phim',
    level: CourseLevel.ADVANCED,
    price: 890000,
    oldPrice: 1450000,
    leadSummary: 'Làm chủ góc nhìn từ bầu trời: Kỹ thuật điều khiển bay an toàn, tuân thủ pháp lý hàng không, các đường bay điện ảnh mượt mà và làm chủ kính lọc ND Filter khi quay trên không.',
    industryContext: 'Những góc máy toàn cảnh từ trên cao mang lại sự choáng ngợp và tầm vóc hùng vĩ cho mọi bộ phim; kỹ năng bay flycam chuẩn điện ảnh đang là vũ khí cạnh tranh đắt giá.',
    coreTopics: [
      'An toàn bay và pháp lý hàng không tại Việt Nam: Quy định vùng cấm bay, Xin phép bay và xử lý tình huống mất sóng (RTH - Return to Home)',
      'Cấu hình thông số máy bay và camera: Tốc độ màn trập theo quy tắc 180 độ, Sử dụng kính lọc phân cực và kính lọc giảm sáng ND Filters',
      'Các đường bay điện ảnh kinh điển: Bay tiến lùi thẳng (Fly-over), Bay theo quỹ đạo tròn (Orbit), Bay ngửa máy góc nhìn chim bay (Bird’s Eye View)',
      'Phối hợp tay điều khiển kép mượt mà: Kết hợp đồng thời cần ga (Throttle) và cần xoay góc nhìn máy ảnh (Gimbal Pitch)',
      'Bắt trọn khoảnh khắc vàng (Golden Hour): Kỹ thuật bay đón hoàng hôn và bình minh trên các địa hình đồi núi, biển cả'
    ],
    handsOnProject: 'Lập kế hoạch bay và thực hiện trọn vẹn một video phong cảnh 60 giây gồm 5 đường bay điện ảnh mượt mà khám phá một khu nghỉ dưỡng ven biển.',
    targetAudience: 'Người sở hữu flycam (DJI Mini, Air, Mavic), Nhà làm phim phong cảnh, Phóng viên du lịch, Đơn vị quay phim sự kiện.',
    careerApplication: 'Trở thành phi công flycam chuyên nghiệp (Drone Pilot) nhận các dự án quay khảo sát địa hình, bất động sản và du lịch.',
    requirements: [
      'Sở hữu hoặc có quyền sử dụng một thiết bị bay flycam có camera (khuyến nghị dòng DJI)',
      'Tuân thủ tuyệt đối các quy định an toàn bay và pháp luật Việt Nam'
    ],
    benefits: [
      'Điều khiển flycam bay mượt mà, không bao giờ bị giật cục hay đổi hướng đột ngột trong cảnh quay',
      'Không bao giờ làm rơi máy bay hoặc va chạm cây cối nhờ nắm vững các kỹ thuật bay phòng thủ',
      'Sử dụng đúng độ đậm của kính lọc ND để giữ cho hình ảnh chuyển động có độ nhòe chuyển động (Motion Blur) chuẩn mắt người',
      'Tạo ra những thước phim trên không kỳ vĩ làm mãn nhãn người xem'
    ],
    techniques: ['Drone Cinematography', 'Flight Safety', 'ND Filters', 'Orbit Flight', 'Gimbal Smoothness', 'Golden Hour Shooting'],
    documents: [
      'Bản đồ hướng dẫn kiểm tra vùng cấm bay và quy trình xin cấp phép bay tại Việt Nam',
      'Bảng tra cứu lựa chọn kính lọc ND phù hợp theo cường độ ánh nắng mặt trời'
    ]
  },
  {
    title: 'Kỹ Thuật Xử Lý Âm Thanh Hiện Trường & Thiết Kế Âm Thanh Điện Ảnh (Sound Design for Film)',
    slug: 'ky-thuat-xu-ly-am-thanh-thiet-ke-am-thanh-dien-anh-sound-design',
    categorySlug: 'nhiep-anh-va-dung-phim',
    level: CourseLevel.ADVANCED,
    price: 950000,
    oldPrice: 1550000,
    leadSummary: 'Âm thanh chiếm 50% trải nghiệm của một bộ phim: Thu âm tiếng động hậu kỳ (Foley), thiết kế không gian âm thanh đa chiều (Ambience), hòa âm đối thoại và làm chủ chuẩn âm lượng LUFS.',
    industryContext: 'Khán giả có thể chấp nhận xem một video có chất lượng hình ảnh bình thường, nhưng họ sẽ tắt ngay lập tức nếu âm thanh bị rè, chói tai hoặc khó nghe; âm thanh chính là nửa còn lại của nghệ thuật thứ bảy.',
    coreTopics: [
      'Vật lý âm học và tâm lý học thính giác: Tần số (Hz), Biên độ (dB) và Cảm nhận không gian âm thanh của não bộ',
      'Xử lý và làm sạch âm thanh hội thoại với iZotope RX: Khử tiếng quạt gió (De-noise), Khử tiếng dội tường (De-reverb) và Cắt tiếng tặc lưỡi (De-click)',
      'Nghệ thuật tiếng động hậu kỳ Foley: Thu âm tiếng bước chân, Tiếng sột soạt quần áo và Tiếng va chạm đồ vật trong phòng thu',
      'Xây dựng các lớp âm thanh không gian (Soundscapes & Ambience): Tiếng gió xào xạc, Tiếng chim hót xa xa và Tiếng xe cộ nền',
      'Hòa âm đa rãnh (Audio Mixing) và chuẩn hóa âm lượng theo chuẩn quốc tế: Tiêu chuẩn -14 LUFS cho YouTube và -24 LKFS cho truyền hình'
    ],
    handsOnProject: 'Thực hiện thiết kế âm thanh hoàn chỉnh cho một phân cảnh hành động ngắn 1 phút từ con số 0: Tự tạo tiếng động Foley, chọn âm thanh nền và cân bằng âm lượng chuẩn phát sóng.',
    targetAudience: 'Sound Designer, Video Editor, Kỹ sư âm thanh, Nhà làm phim muốn đưa chất lượng tác phẩm lên chuẩn rạp chiếu.',
    careerApplication: 'Đảm nhận vai trò Thiết kế âm thanh (Sound Designer) cho các dự án phim điện ảnh, phim tài liệu và game.',
    requirements: [
      'Tai nghe kiểm âm chất lượng tốt (Monitor Headphones) hoặc loa kiểm âm phòng thu',
      'Phần mềm dựng phim hoặc phần mềm âm thanh chuyên nghiệp (Adobe Audition, DaVinci Fairlight, Pro Tools)'
    ],
    benefits: [
      'Cứu sống những đoạn hội thoại thu âm bị lẫn tạp âm ồn ào trở nên trong trẻo, sắc nét',
      'Biết cách kể chuyện bằng âm thanh để dẫn dắt cảm xúc người xem mà họ không hề nhận ra',
      'Tạo ra không gian âm thanh sống động, chân thực đưa khán giả đắm chìm vào thế giới trong phim',
      'Xuất bản video đạt chuẩn âm lượng quốc tế không bao giờ bị YouTube hay đài truyền hình tự động giảm âm lượng'
    ],
    techniques: ['Sound Design', 'Foley Recording', 'iZotope RX Cleaning', 'LUFS Loudness', 'Ambience Layers', 'Audio Mixing'],
    documents: [
      'Bảng tra cứu dải tần số âm thanh của các nhạc cụ và giọng nói con người',
      'Thư viện 1000 âm thanh Foley và tiếng động nền chất lượng cao bản quyền miễn phí'
    ]
  },
  {
    title: 'Đạo Diễn Hình Ảnh (Director of Photography - DoP): Ngôn Ngữ Ống Kính & Chỉ Đạo Máy Quay',
    slug: 'dao-dien-hinh-anh-dop-ngon-ngu-ong-kinh-chi-dao-may-quay',
    categorySlug: 'nhiep-anh-va-dung-phim',
    level: CourseLevel.ADVANCED,
    price: 1190000,
    oldPrice: 1890000,
    leadSummary: 'Làm chủ vị trí đầu tàu thị giác của đoàn phim: Lựa chọn tiêu cự ống kính, tỷ lệ khung hình (Aspect Ratio), điều phối chuyển động máy quay (Dolly, Steadicam, Gimbal) và phối hợp cùng Đạo diễn.',
    industryContext: 'Director of Photography (DoP) là người chuyển hóa kịch bản chữ của đạo diễn thành những khung hình điện ảnh biết nói; đây là vị trí quyền lực định hình toàn bộ phong cách thị giác của bộ phim.',
    coreTopics: [
      'Ngôn ngữ tâm lý học của tiêu cự ống kính: Ống kính góc rộng (Wide - Cô đơn, bao la) vs Ống kính tele (Telephoto - Nén không gian, cô lập nhân vật)',
      'Lựa chọn ống kính điện ảnh: Sự khác biệt giữa Ống kính Cầu (Spherical) và Ống kính Biến dạng Anamorphic với vệt sáng lóa huyền ảo',
      'Ý nghĩa của các tỷ lệ khung hình điện ảnh: 16:9 truyền hình, 2.39:1 màn ảnh rộng rạp chiếu (Cinemascope) và 4:3 cổ điển',
      'Chỉ đạo chuyển động máy quay phức tạp: Phối hợp giữa thiết bị chống rung (Gimbal/Steadicam), Xe ray (Dolly) và Cần cẩu máy quay (Jib crane)',
      'Vẽ kịch bản phân cảnh chi tiết (Storyboard) và Danh sách góc máy (Shot List) phối hợp nhịp nhàng giữa Đạo diễn và DoP'
    ],
    handsOnProject: 'Xây dựng một bản Hồ sơ thị giác (Visual Lookbook) và Shot List hoàn chỉnh cho một kịch bản phim ngắn 10 phút, giải thích rõ lý do chọn từng tiêu cự ống kính.',
    targetAudience: 'Nhà quay phim có kinh nghiệm muốn bước lên vị trí DoP, Đạo diễn trẻ, Người làm phim quảng cáo chuyên nghiệp.',
    careerApplication: 'Đảm nhận vai trò Đạo diễn hình ảnh (DoP) cầm trịch các dự án phim điện ảnh, MV ca nhạc triệu view và phim quảng cáo TVC lớn.',
    requirements: [
      'Tối thiểu 3 năm kinh nghiệm trong công tác quay phim hoặc sản xuất video',
      'Vốn hiểu biết sâu rộng về ngôn ngữ điện ảnh và nghệ thuật thị giác'
    ],
    benefits: [
      'Biết cách sử dụng ống kính máy quay để kể câu chuyện nội tâm nhân vật mà không cần một lời thoại',
      'Chỉ đạo nhịp nhàng toàn bộ tổ quay phim và tổ ánh sáng trên trường quay với hàng chục nhân sự',
      'Tạo dựng phong cách thị giác đặc trưng được các đạo diễn và nhãn hàng tin tưởng giao phó trọng trách',
      'Khẳng định vị thế người nghệ sĩ thị giác hàng đầu trong nền công nghiệp điện ảnh'
    ],
    techniques: ['Director of Photography (DoP)', 'Lens Psychology', 'Anamorphic Lenses', 'Aspect Ratios', 'Shot List', 'Visual Lookbook'],
    documents: [
      'Mẫu Visual Lookbook chuẩn Hollywood trình bày phong cách ánh sáng và bảng màu cho phim',
      'Mẫu Shot List phân tích kỹ thuật góc máy chi tiết cho từng cảnh quay'
    ]
  },
  {
    title: 'Sản Xuất Video Thương Mại Điện Tử & Phim Quảng Cáo Sản Phẩm Đỉnh Cao (Commercial TVC)',
    slug: 'san-xuat-video-thuong-mai-dien-tu-phim-quang-cao-tvc',
    categorySlug: 'nhiep-anh-va-dung-phim',
    level: CourseLevel.ADVANCED,
    price: 1250000,
    oldPrice: 1990000,
    leadSummary: 'Nghệ thuật làm phim quảng cáo triệu đô trong 30 giây: Kỹ thuật quay bàn xoay 360 độ siêu chậm (High-speed Phantom/Slow-motion), hiệu ứng chất lỏng bắn tung tóe và đóng gói bàn giao chuẩn phát sóng.',
    industryContext: 'Phim quảng cáo thương mại 30 giây (TVC) là đỉnh cao của sự hoàn mỹ kỹ thuật và sáng tạo; mỗi khung hình đều phải đạt độ sắc nét và hấp dẫn tối đa để kích thích hành vi mua sắm.',
    coreTopics: [
      'Đọc hiểu và bóc tách bản tóm tắt yêu cầu sáng tạo (Creative Agency Brief): Từ thông điệp tiếp thị đến ý tưởng thị giác',
      'Kỹ thuật quay chuyển động chậm tốc độ cao (Slow-Motion 120fps - 1000fps): Bắt trọn khoảnh khắc giọt nước bắn tung tóe và thức ăn rơi',
      'Sử dụng bàn xoay cơ học tự động (Motorized Turntable) và cánh tay robot điều khiển chuyển động máy quay (Motion Control Rig)',
      'Nghệ thuật xử lý chất lỏng và khói lửa thương mại: Kỹ thuật tạo bọt bia hoàn hảo, giọt sữa bắn hình vương miện',
      'Quy chuẩn đóng gói và kiểm duyệt phát sóng truyền hình quốc gia (VTV/HTV Compliance): Độ sáng, Cân bằng âm thanh và Vùng an toàn hiển thị (Title Safe)'
    ],
    handsOnProject: 'Sản xuất một video quảng cáo thương mại 30 giây đỉnh cao cho một dòng nước tăng lực mới với cảnh quay giọt nước bắn tung tóe trên nền tối huyền bí.',
    targetAudience: 'Đạo diễn quảng cáo, Chủ xưởng phim Production House, Chuyên viên sản xuất video thương mại cao cấp.',
    careerApplication: 'Nhận các hợp đồng sản xuất phim quảng cáo TVC cho các thương hiệu hàng đầu với ngân sách hàng trăm triệu đồng mỗi dự án.',
    requirements: [
      'Có kinh nghiệm sản xuất video chuyên nghiệp và sử dụng thành thạo các thiết bị quay phim cao cấp',
      'Sự tỉ mỉ đến từng chi tiết nhỏ nhất trong khuôn hình'
    ],
    benefits: [
      'Tạo ra những thước phim quảng cáo sản phẩm lung linh, đẳng cấp khiến khách hàng không thể rời mắt',
      'Làm chủ các thủ thuật hiệu ứng thực tế trên phim trường (Practical Effects) mà CGI khó lòng làm chân thực bằng',
      'Tự tin làm việc với các Creative Agency và các giám đốc tiếp thị của các tập đoàn đa quốc gia',
      'Bàn giao các tệp phim thành phẩm đạt chuẩn kỹ thuật kiểm duyệt khắt khe của các đài truyền hình'
    ],
    techniques: ['Commercial TVC', 'Slow-Motion Shooting', 'Motion Control', 'Liquid Splash Effects', 'Broadcast Compliance', 'Creative Brief'],
    documents: [
      'Checklist tiêu chuẩn kỹ thuật phát sóng quảng cáo truyền hình chuẩn VTV/HTV',
      'Mẫu dự toán ngân sách sản xuất phim quảng cáo (Production Budget Breakdown)'
    ]
  },

  // ==========================================
  // CAT-19: Âm nhạc, Sản xuất âm thanh & Podcast (10 courses)
  // Quota: 3 BEGINNER, 4 INTERMEDIATE, 3 ADVANCED | 1 FREE, 9 PAID
  // ==========================================
  {
    title: 'Nhạc Lý Căn Bản & Cảm Thụ Âm Nhạc Cho Người Mới Bắt Đầu',
    slug: 'nhac-ly-can-ban-cam-thu-am-nhac-nguoi-moi-bat-dau',
    categorySlug: 'am-nhac-va-nghe-thuat-sang-tao',
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0,
    leadSummary: 'Giải mã thế giới âm thanh kỳ diệu: Đọc hiểu khuông nhạc, các nốt nhạc, khóa Sol/khóa Fa, nhịp phách, cao độ, trường độ và cấu tạo các hợp âm cơ bản.',
    industryContext: 'Nhạc lý là ngữ pháp của ngôn ngữ âm nhạc; nắm vững nhạc lý giúp bạn học bất kỳ loại nhạc cụ nào nhanh hơn gấp nhiều lần và tự tin sáng tác giai điệu của riêng mình.',
    coreTopics: [
      'Bảy nốt nhạc cơ bản và hệ thống ký hiệu chữ cái quốc tế: C - D - E - F - G - A - B',
      'Đọc bản nhạc trên khuông nhạc 5 dòng: Khóa Sol, Khóa Fa, Vạch nhịp và Ô nhịp',
      'Trường độ và giá trị các hình nốt: Nốt tròn, Nốt trắng, Nốt đen, Nốt móc đơn và Dấu lặng',
      'Nhịp phách căn bản: Phân biệt nhịp 2/4, 3/4, 4/4 và nhịp 6/8, Phách mạnh và phách nhẹ',
      'Cấu tạo gam trưởng, gam thứ và cách hình thành các hợp âm 3 nốt (Triads) cơ bản'
    ],
    handsOnProject: 'Thực hành gõ đúng nhịp phách và đọc xướng âm chuẩn xác một bản nhạc thiếu nhi quen thuộc trên khuông nhạc.',
    targetAudience: 'Người yêu âm nhạc muốn bắt đầu học nhạc cụ (Piano, Guitar), Người muốn hiểu bản chất của các bài hát mình nghe.',
    careerApplication: 'Đặt nền móng lý thuyết vững chắc để học đàn, hát chuẩn cao độ hoặc bước vào con đường sản xuất âm nhạc.',
    requirements: [
      'Không yêu cầu biết chơi bất kỳ nhạc cụ nào trước đó',
      'Đôi tai yêu thích lắng nghe và cảm nhận âm điệu'
    ],
    benefits: [
      'Tự tin đọc được các bản nhạc giấy mà không cần nhìn người khác bấm phím để bắt chước',
      'Giữ đúng nhịp phách khi hát hoặc vỗ tay theo bài hát, không bao giờ bị lệch nhịp',
      'Hiểu rõ vì sao bài hát này nghe vui tươi (gam trưởng) trong khi bài hát kia lại trầm buồn (gam thứ)',
      'Tự bấm được các hợp âm cơ bản trên đàn phím hoặc đàn dây'
    ],
    techniques: ['Music Theory', 'Sheet Music Reading', 'Time Signatures', 'Major & Minor Scales', 'Triad Chords', 'Solfege'],
    documents: [
      'Bảng tra cứu nhanh các nốt nhạc trên khuông nhạc và phím đàn Piano',
      'Tập bài tập chép nhạc và luyện tập gõ phách cơ bản kèm lời giải'
    ]
  },
  {
    title: 'Đệm Hát Guitar Acoustic Cơ Bản: Tự Đệm Hát Những Bài Hát Yêu Thích Trong 30 Ngày',
    slug: 'dem-hat-guitar-acoustic-co-ban-trong-30-ngay',
    categorySlug: 'am-nhac-va-nghe-thuat-sang-tao',
    level: CourseLevel.BEGINNER,
    price: 399000,
    oldPrice: 650000,
    leadSummary: 'Tự tin ôm đàn hát cùng bạn bè: Tư thế cầm đàn chuẩn, bấm các hợp âm cơ bản không tịt nốt, chuyển hợp âm mượt mà và các điệu đệm phổ biến (Valse, Ballad, Disco).',
    industryContext: 'Guitar là cây đàn mộc mạc, gần gũi và cơ động nhất; biết đệm đàn guitar giúp bạn trở thành linh hồn của mọi buổi liên hoan, dã ngoại và gắn kết tình bạn.',
    coreTopics: [
      'Cấu tạo cây đàn Guitar Acoustic, cách lên dây đàn chuẩn qua ứng dụng điện thoại (GuitarTuna)',
      'Tư thế ngồi ôm đàn, vị trí đặt ngón tay bấm phím vuông góc để âm thanh vang trong trẻo',
      'Làm chủ 8 hợp âm mở cơ bản đầu tiên: C, G, Am, Em, D, Dm, F đơn giản và E',
      'Kỹ thuật chuyển hợp âm mượt mà không bị khựng: Giữ ngón tay neo (Anchor finger) và luyện phản xạ ngón',
      'Các điệu đệm hát kinh điển: Điệu Valse êm đềm, Điệu Ballad tình cảm, Điệu Disco rộn ràng và Kỹ thuật quạt chả (Strumming)'
    ],
    handsOnProject: 'Tự đệm đàn và hát trọn vẹn một bài hát acoustic nổi tiếng từ đầu đến cuối đúng nhịp phách không bị vấp.',
    targetAudience: 'Người mới mua đàn guitar, người từng tự học bấm đàn bị đau tay và nản chí, sinh viên muốn giao lưu kết nối.',
    careerApplication: 'Tự tin biểu diễn văn nghệ trước đám đông, giải tỏa căng thẳng sau giờ làm việc bằng những giai điệu mộc mạc.',
    requirements: [
      'Sở hữu một cây đàn Guitar Acoustic (hoặc Guitar Classic) dây nylon hoặc dây sắt',
      'Kiên nhẫn vượt qua cảm giác rát đầu ngón tay trong 7-10 ngày đầu tiên'
    ],
    benefits: [
      'Bấm các phím đàn kêu tròn tiếng, trong trẻo mà không bị tịt hay rè dây',
      'Chuyển qua lại giữa các hợp âm nhanh chóng theo đúng nhịp điệu của bài hát',
      'Tự dò được hợp âm của các bài hát đơn giản để đệm cho bạn bè cùng hát',
      'Làm chủ đôi bàn tay khéo léo và giải phóng cảm xúc qua từng tiếng đàn'
    ],
    techniques: ['Acoustic Guitar', 'Guitar Chords', 'Chord Progression', 'Strumming Patterns', 'Fingerpicking Ballad', 'Guitar Tuning'],
    documents: [
      'Bảng tra cứu thế tay bấm của 50 hợp âm guitar thông dụng nhất',
      'Tuyển tập 30 bài hát bất hủ chỉ sử dụng 4 hợp âm cơ bản dễ tập nhất'
    ]
  },
  {
    title: 'Xây Dựng Kênh Podcast Chuyên Nghiệp: Từ Lên Kịch Bản, Thu Âm Đến Xuất Bản Đa Nền Tảng',
    slug: 'xay-dung-kenh-podcast-chuyen-nghiep-xuat-ban-da-nen-tang',
    categorySlug: 'am-nhac-va-nghe-thuat-sang-tao',
    level: CourseLevel.BEGINNER,
    price: 350000,
    oldPrice: 590000,
    leadSummary: 'Chia sẻ giọng nói và tri thức của bạn với thế giới: Định vị chủ đề kênh, chọn micro thu âm phù hợp, biên tập giọng nói trên Audacity và phân phối lên Spotify, Apple Podcasts.',
    industryContext: 'Podcast là định dạng âm thanh đang bùng nổ mạnh mẽ, đồng hành cùng người nghe trong lúc lái xe, tập thể dục và nấu ăn; đây là kênh xây dựng thương hiệu cá nhân có độ gắn kết sâu sắc nhất.',
    coreTopics: [
      'Định vị kênh Podcast: Chọn thị trường ngách, Xác định thính giả mục tiêu và Cấu trúc thời lượng tập podcast',
      'Lựa chọn thiết bị thu âm chi phí tối ưu: Micro Dynamic (khử ồn phòng) vs Micro Condenser, Tai nghe kiểm âm và Màng lọc gió',
      'Soạn kịch bản thu âm: Kịch bản chi tiết từng lời vs Kịch bản gạch đầu dòng tự nhiên (Bullet Points)',
      'Thu âm và biên tập âm thanh miễn phí với Audacity: Cắt bỏ tiếng ậm ừ, Lọc tạp âm nền và Chèn nhạc dạo đầu (Intro/Outro)',
      'Xuất bản và phân phối tự động: Sử dụng dịch vụ Podcast Host (Spotify for Podcasters / Podbean) để đẩy tập mới lên Spotify, Apple Podcasts'
    ],
    handsOnProject: 'Sản xuất hoàn chỉnh một tập Podcast đầu tay dài 10 phút về một câu chuyện truyền cảm hứng, có nhạc dạo đầu và xuất bản thành công lên Spotify.',
    targetAudience: 'Người sáng tạo nội dung, Chuyên gia muốn chia sẻ tri thức, Người yêu thích nói chuyện và tâm sự bằng giọng nói.',
    careerApplication: 'Sở hữu kênh Podcast riêng có hàng nghìn lượt nghe định kỳ, mở ra cơ hội hợp tác tài trợ với các nhãn hàng.',
    requirements: [
      'Máy tính cá nhân và một chiếc micro thu âm cơ bản (hoặc tai nghe điện thoại có mic tốt)',
      'Chủ đề hoặc lĩnh vực mà bạn đam mê muốn chia sẻ'
    ],
    benefits: [
      'Sở hữu một kênh Podcast phát sóng chính thức trên các nền tảng âm nhạc lớn nhất toàn cầu',
      'Biết cách thu âm giọng nói trầm ấm, rõ ràng mà không bị lẫn tiếng quạt gió hay tiếng ồn ngoài phố',
      'Xóa sạch các từ đệm ậm ừ, tiếng thở dài giúp bài nói chuyện trở nên cô đọng, cuốn hút',
      'Xây dựng tệp thính giả trung thành lắng nghe bạn tâm sự mỗi tuần'
    ],
    techniques: ['Podcast Production', 'Audacity Editing', 'Spotify for Podcasters', 'Voice Recording', 'RSS Feed Distribution', 'Audio Branding'],
    documents: [
      'Mẫu cấu trúc kịch bản một tập Podcast 15 phút chuẩn thu hút',
      'Hướng dẫn từng bước cấu hình tài khoản phân phối RSS Feed lên Apple Podcasts và Spotify'
    ]
  },
  {
    title: 'Học Đàn Piano Cơ Bản Cho Người Lớn: Nhanh Chóng Chơi Bản Nhạc Cổ Điển & Nhạc Trẻ',
    slug: 'hoc-dan-piano-co-ban-cho-nguoi-lon-nhac-co-dien-nhac-tre',
    categorySlug: 'am-nhac-va-nghe-thuat-sang-tao',
    level: CourseLevel.INTERMEDIATE,
    price: 590000,
    oldPrice: 890000,
    leadSummary: 'Thực hiện ước mơ lướt phím dương cầm: Kỹ thuật phối hợp độc lập hai tay, luyện ngón Hanon mềm mại, đọc bản nhạc hai khóa và chơi những giai điệu kinh điển như Für Elise, Canon in D.',
    industryContext: 'Nhiều người lớn nghĩ rằng qua tuổi nhỏ thì không thể học Piano; phương pháp tiếp cận hiện đại tập trung vào bản chất hòa âm giúp người lớn có thể chơi được bài hát yêu thích chỉ sau vài tuần.',
    coreTopics: [
      'Tư thế ngồi chuẩn bên đàn Piano: Lưng thẳng, Cánh tay buông lỏng và Bàn tay khum tròn như ôm quả táo',
      'Kỹ thuật phối hợp tay độc lập: Tay phải chơi giai điệu chính, Tay trái đệm hợp âm hoặc rải nốt Arpeggio',
      'Các bài tập luyện ngón Hanon kinh điển giúp các ngón tay linh hoạt, đều lực và không bị gãy khớp',
      'Đọc hiểu cùng lúc hai khuông nhạc: Khuông khóa Sol cho tay phải và Khuông khóa Fa cho tay trái',
      'Sử dụng bàn đạp giảm âm và vang âm (Sustain Pedal) đúng thời điểm để tiếng đàn ngân vang lung linh'
    ],
    handsOnProject: 'Luyện tập và biểu diễn hoàn chỉnh tác phẩm kinh điển Für Elise của Beethoven (Đoạn A) hoặc bản nhạc phim Ghibli lãng mạn bằng cả hai tay.',
    targetAudience: 'Người trưởng thành muốn học đàn Piano để giải trí, Người bận rộn muốn tự học đàn tại nhà trên đàn điện tử.',
    careerApplication: 'Tận hưởng niềm vui âm nhạc thanh tao, rèn luyện sự tập trung và giảm bớt căng thẳng sau những giờ làm việc mệt mỏi.',
    requirements: [
      'Có đàn Piano cơ hoặc đàn Piano điện (Digital Piano) có bàn phím đủ 88 phím có độ nặng',
      'Dành ra 20-30 phút luyện ngón tập trung mỗi ngày'
    ],
    benefits: [
      'Làm chủ sự độc lập giữa hai bàn tay mà không bị tình trạng tay nọ dính theo tay kia',
      'Tự tin ngồi vào cây đàn Piano và lướt những bản nhạc du dương làm say đắm người nghe',
      'Hiểu rõ quy luật hòa âm để có thể tự mò giai điệu các bài hát nhạc trẻ yêu thích',
      'Tạo dựng một thói quen giải trí lành mạnh, thanh lọc tâm hồn cùng tiếng đàn dương cầm'
    ],
    techniques: ['Piano Basics', 'Two-hand Independence', 'Hanon Exercises', 'Grand Staff Reading', 'Sustain Pedal', 'Arpeggios'],
    documents: [
      'Tuyển tập 15 bản nhạc kinh điển được chuyển soạn đơn giản hóa dành riêng cho người lớn',
      'Bộ bài tập luyện ngón Hanon số 1 đến số 5 kèm hướng dẫn thế bấm'
    ]
  },
  {
    title: 'Sản Xuất Âm Nhạc & Làm Beat Điện Tử (Music Production) Với FL Studio',
    slug: 'san-xuat-am-nhac-lam-beat-dien-tu-fl-studio',
    categorySlug: 'am-nhac-va-nghe-thuat-sang-tao',
    level: CourseLevel.INTERMEDIATE,
    price: 690000,
    oldPrice: 1050000,
    leadSummary: 'Trở thành Producer chuyên nghiệp: Làm chủ trạm làm việc âm thanh số FL Studio 21, soạn beat trống, lập trình giai điệu trên Piano Roll, sử dụng nhạc cụ ảo VST và hòa âm cơ bản.',
    industryContext: 'FL Studio là phần mềm làm beat được các Producer hàng đầu thế giới (Martin Garrix, Metro Boomin, Avicii) lựa chọn để tạo ra những bản hit tỷ view toàn cầu.',
    coreTopics: [
      'Kiến trúc cốt lõi của FL Studio: Trình tạo mẫu (Channel Rack), Bàn phím soạn nhạc (Piano Roll), Dòng thời gian (Playlist) và Bàn trộn (Mixer)',
      'Lập trình tiết tấu trống (Drum Programming): Kick, Snare, Hi-hat, Clap và tạo hiệu ứng nhịp đảo (Swing/Groove) cho nhạc Hip-hop / Lofi / Pop',
      'Sáng tác vòng hòa âm hấp dẫn (Chord Progressions) và viết giai điệu bắt tai (Catchy Melodies)',
      'Khai thác sức mạnh của các nhạc cụ ảo VST nổi tiếng: Serum, Vital, Kontakt và Nexus',
      'Kỹ thuật phối khí cơ bản: Xây dựng cấu trúc bài hát hoàn chỉnh gồm Đoạn mở đầu (Intro), Đoạn lời (Verse), Điệp khúc bùng nổ (Chorus) và Đoạn nghỉ (Outro)'
    ],
    handsOnProject: 'Tự tay sản xuất hoàn chỉnh một bản Beat nhạc Lofi Chill hoặc Pop Hip-hop dài 3 phút với đầy đủ các tầng âm thanh trống, bass, đàn piano và tiếng mưa rơi thư giãn.',
    targetAudience: 'Người đam mê âm nhạc điện tử, Rapper muốn tự làm beat cho bài hát của mình, Người muốn trở thành Music Producer.',
    careerApplication: 'Tự do sản xuất các bài hát của chính mình, bán bản quyền beat nhạc trực tuyến trên BeatStars hoặc làm việc cho các Studio âm nhạc.',
    requirements: [
      'Máy tính cá nhân cài đặt phần mềm FL Studio (phiên bản dùng thử hoặc Producer Edition)',
      'Tai nghe hoặc loa có chất lượng âm trầm tốt để kiểm tra tiếng Bass'
    ],
    benefits: [
      'Biến những giai điệu ngân nga trong đầu thành một bản beat nhạc điện tử hoàn chỉnh, sống động',
      'Sử dụng thành thạo bàn phím Piano Roll để soạn nhạc nhanh như chớp',
      'Tạo ra những đoạn điệp khúc bùng nổ đầy năng lượng khiến người nghe muốn nhún nhảy theo nhịp điệu',
      'Tự sản xuất âm nhạc độc lập tại phòng ngủ mà không cần đến phòng thu đắt tiền'
    ],
    techniques: ['FL Studio 21', 'Beat Making', 'Piano Roll', 'Drum Programming', 'VST Instruments', 'Song Arrangement'],
    documents: [
      'Gói thư viện âm thanh mẫu Drum Kit độc quyền gồm 500 mẫu tiếng Kick, Snare, Hi-hat chất lượng cao',
      'File dự án mẫu FL Studio (.flp) của một bản hit thịnh hành để học viên mổ xẻ cấu trúc'
    ]
  },
  {
    title: 'Kỹ Thuật Thu Âm & Hòa Âm Giọng Hát Chuyên Nghiệp (Vocal Mixing & Tuning)',
    slug: 'ky-thuat-thu-am-hoa-am-giong-hat-vocal-mixing-tuning',
    categorySlug: 'am-nhac-va-nghe-thuat-sang-tao',
    level: CourseLevel.INTERMEDIATE,
    price: 650000,
    oldPrice: 990000,
    leadSummary: 'Làm cho giọng hát nghe hay như ca sĩ chuyên nghiệp: Kỹ thuật chỉnh phô nốt với Melodyne và Auto-Tune, nén dải động (Compression), cân bằng tần số (EQ) và hiệu ứng không gian Reverb/Delay.',
    industryContext: 'Một bản thu âm giọng hát thô mộc luôn cần qua bàn tay gọt giũa của kỹ sư âm thanh để trở nên mượt mà, hòa quyện hoàn hảo với nhạc nền mà không bị chìm hay chát chúa.',
    coreTopics: [
      'Quy chuẩn thu âm giọng hát chuẩn tại nhà: Khoảng cách tới micro, Góc thu âm, Chống rung và Xử lý tiêu âm phòng',
      'Chỉnh phô và nhịp điệu chuẩn xác từng nốt với Celemony Melodyne: Giữ vững độ tự nhiên không bị méo tiếng như người máy',
      'Làm chủ hiệu ứng Auto-Tune: Sử dụng Auto-Tune nghệ thuật phong cách Trap/RnB hiện đại',
      'Cắt lọc tần số thừa và nâng tầm độ sáng giọng hát với Equalizer (EQ): Cắt dải tần số ồm và làm sáng dải tần số 10kHz',
      'Kiểm soát độ to nhỏ bằng Compressor đa tầng và phủ không gian lung linh bằng Reverb và Ping-pong Delay'
    ],
    handsOnProject: 'Thực hiện quy trình xử lý và hòa âm hoàn chỉnh một đoạn thu âm giọng hát mộc của ca sĩ đè lên bản beat nhạc pop có sẵn, tạo ra âm thanh chuẩn phòng thu.',
    targetAudience: 'Ca sĩ tự do, Rapper, Kỹ thuật viên phòng thu mini, Người làm podcast muốn nâng cấp chất lượng giọng nói.',
    careerApplication: 'Tự thu âm và sản xuất các sản phẩm âm nhạc của bản thân hoặc nhận dịch vụ Mix & Master bài hát cho các nghệ sĩ trẻ.',
    requirements: [
      'Có phần mềm thu âm DAW (FL Studio, Cubase, Studio One hoặc Logic Pro)',
      'Tai nghe kiểm âm chuyên dụng để nghe rõ các chi tiết âm thanh nhỏ'
    ],
    benefits: [
      'Sửa sạch toàn bộ các nốt hát bị chênh phô mà giọng hát vẫn giữ được cảm xúc chân thực 100%',
      'Giúp giọng hát nổi bật rõ ràng phía trước nhạc nền mà không cần phải vặn âm lượng quá to',
      'Loại bỏ hoàn toàn những tiếng xì xì chói gắt ở các phụ âm s, x, tr bằng kỹ thuật De-esser',
      'Tạo ra không gian âm nhạc bay bổng, lãng mạn như nghe các đĩa nhạc phòng thu chuyên nghiệp'
    ],
    techniques: ['Vocal Mixing', 'Melodyne Pitch Correction', 'Auto-Tune', 'Vocal EQ & Compression', 'De-esser', 'Reverb & Delay'],
    documents: [
      'Chuỗi chu trình xử lý hiệu ứng Vocal Chain mẫu chuẩn cho nhạc Pop và RnB',
      'Tệp âm thanh Vocal thô (Dry Vocal Stems) chất lượng cao phục vụ việc thực hành'
    ]
  },
  {
    title: 'Sản Xuất Âm Nhạc Với Ableton Live Cho Biểu Diễn Trực Tiếp & Nhạc Điện Tử (EDM)',
    slug: 'san-xuat-am-nhac-ableton-live-edm-bieu-dien-truc-tiep',
    categorySlug: 'am-nhac-va-nghe-thuat-sang-tao',
    level: CourseLevel.INTERMEDIATE,
    price: 750000,
    oldPrice: 1190000,
    leadSummary: 'Làm chủ công cụ số một của các DJ và nghệ sĩ biểu diễn trực tiếp: Giao diện Session View phóng khoáng, kỹ thuật bẻ cong thời gian (Audio Warping), Rack hiệu ứng và thiết kế âm thanh Synth.',
    industryContext: 'Ableton Live không chỉ là một phần mềm sản xuất âm nhạc mà còn là một nhạc cụ biểu diễn sân khấu đỉnh cao được các DJ hàng đầu thế giới sử dụng trong các đại nhạc hội.',
    coreTopics: [
      'Sự khác biệt mang tính cách mạng của Ableton Live: Khung nhìn Session View (Thử nghiệm ý tưởng theo vòng lặp) vs Arrangement View (Dòng thời gian truyền thống)',
      'Công nghệ bẻ cong thời gian Audio Warping: Đồng bộ nhịp điệu (BPM) của bất kỳ bài hát nào trong tích tắc mà không làm thay đổi cao độ',
      'Khai thác các nhạc cụ và hiệu ứng gốc (Stock Plugins) đỉnh cao: Wavetable Synth, Sampler, Drum Rack và Glue Compressor',
      'Thiết kế chuỗi hiệu ứng âm thanh tùy biến (Audio Effect Racks) và gán nút điều khiển vĩ mô (Macro Controls)',
      'Thiết lập buổi biểu diễn trực tiếp (Live Set): Kích hoạt các vòng lặp Clip bằng bộ điều khiển MIDI (Ableton Push, Novation Launchpad)'
    ],
    handsOnProject: 'Xây dựng một bản phối nhạc House/Techno hoàn chỉnh và thiết lập một Live Set biểu diễn 3 bài hát liên tục không ngừng nghỉ bằng bàn điều khiển MIDI ảo.',
    targetAudience: 'DJ, Nghệ sĩ biểu diễn sân khấu, Producer chuyên dòng nhạc điện tử EDM, House, Techno.',
    careerApplication: 'Tự tin biểu diễn âm nhạc điện tử trực tiếp trên sân khấu và sản xuất những bản phối nhạc sàn bùng nổ.',
    requirements: [
      'Máy tính cài đặt phần mềm Ableton Live (khuyến nghị phiên bản 11 hoặc 12)',
      'Có bàn phím MIDI hoặc bộ điều khiển Pad là một lợi thế (không bắt buộc)'
    ],
    benefits: [
      'Thử nghiệm và ghép nối các ý tưởng âm nhạc ngẫu hứng nhanh gấp 3 lần so với các phần mềm truyền thống',
      'Làm Remix các bài hát nổi tiếng dễ dàng nhờ tính năng tự động dò và khớp nhịp Warping thần thánh',
      'Tự biểu diễn âm nhạc của chính mình trên sân khấu như một nghệ sĩ điện tử thực thụ',
      'Làm chủ công cụ sản xuất âm nhạc được cộng đồng sáng tạo quốc tế tôn sùng nhất'
    ],
    techniques: ['Ableton Live', 'Session View', 'Audio Warping', 'Drum Rack', 'Audio Effect Racks', 'Live MIDI Performance'],
    documents: [
      'Bảng tra cứu phím tắt và kỹ thuật Warping các dòng nhạc khác nhau trong Ableton',
      'Gói dự án Live Set mẫu chứa sẵn các vòng lặp Loops chuẩn bị cho biểu diễn sân khấu'
    ]
  },
  {
    title: 'Hòa Âm & Làm Chủ Bản Thu Đỉnh Cao (Audio Mixing & Mastering) Đạt Chuẩn Phát Hành',
    slug: 'hoa-am-lam-chu-ban-thu-audio-mixing-mastering-phat-hanh',
    categorySlug: 'am-nhac-va-nghe-thuat-sang-tao',
    level: CourseLevel.ADVANCED,
    price: 890000,
    oldPrice: 1450000,
    leadSummary: 'Nấc thang cuối cùng để bài hát sẵn sàng lên sóng Spotify và đĩa CD: Cân bằng âm lượng, mở rộng không gian Stereo, nén đa băng tần (Multiband), bão hòa tương tự (Analog Saturation) và Limiter tối đa.',
    industryContext: 'Mixing biến các nhạc cụ riêng lẻ thành một bản hòa ca thống nhất; Mastering bảo đảm bài hát đó nghe hoàn hảo trên mọi thiết bị từ tai nghe điện thoại giá rẻ đến dàn loa rạp hát cao cấp.',
    coreTopics: [
      'Quy trình Mix bài hát chuyên nghiệp: Dọn dẹp tần số rác, Cân bằng mức âm lượng (Fader Balance) và Đảo góc không gian (Panning)',
      'Giải quyết xung đột tần số trầm giữa Kick Drum và Bassline bằng kỹ thuật nén Sidechain Compression',
      'Tạo độ ấm áp và màu sắc âm thanh cổ điển với Analog Saturation và mô phỏng băng từ (Tape Emulation)',
      'Quy trình Mastering chuẩn mực: Nén đa băng tần (Multiband Compression), Mở rộng trường âm thanh nổi (Stereo Widening) và Tối ưu độ động',
      'Kiểm soát độ ồn theo tiêu chuẩn phát hành số: Đo lường True Peak (-1.0 dBTP) và tích hợp Loudness (-14 LUFS) không bị méo tiếng'
    ],
    handsOnProject: 'Thực hiện Mixing và Mastering hoàn chỉnh một bài hát Pop 24 track nhạc cụ từ tệp đa rãnh thô đến bản Master cuối cùng chuẩn phát hành lên Spotify.',
    targetAudience: 'Music Producer, Kỹ sư âm thanh phòng thu, Người tự sản xuất âm nhạc muốn nâng tầm chất lượng âm thanh lên chuẩn quốc tế.',
    careerApplication: 'Trở thành kỹ sư Mix & Master chuyên nghiệp nhận các hợp đồng xử lý âm thanh cho các hãng đĩa và nghệ sĩ.',
    requirements: [
      'Đã có kiến thức nền tảng về sản xuất âm nhạc trên bất kỳ phần mềm DAW nào',
      'Môi trường nghe kiểm âm tương đối chuẩn xác'
    ],
    benefits: [
      'Bài hát của bạn sẽ có tiếng Bass đập chắc nịch, căng tràn mà không làm đục mờ toàn bộ bài nhạc',
      'Âm thanh mở rộng không gian 3 chiều có chiều rộng, chiều sâu và chiều cao tách bạch rõ ràng',
      'Đạt được độ to âm lượng lớn tương đương các bản hit thương mại quốc tế mà không bị méo tiếng hay nghẹt thở',
      'Tự tin phát hành tác phẩm lên Spotify, Apple Music với chất lượng âm thanh hoàn mỹ nhất'
    ],
    techniques: ['Audio Mixing', 'Audio Mastering', 'Sidechain Compression', 'Stereo Imaging', 'Tape Saturation', 'True Peak Limiting'],
    documents: [
      'Checklist 20 bước kiểm tra bắt buộc trước khi xuất bản bản Master cuối cùng',
      'Tệp đa rãnh nhạc cụ đầy đủ (Multitrack Stems) của một ca khúc Pop chuẩn bị cho bài tập tốt nghiệp'
    ]
  },
  {
    title: 'Thiết Kế Âm Thanh Cho Trò Chơi Điện Tử (Game Audio & Interactive Sound Design) Với Wwise',
    slug: 'thiet-ke-am-thanh-tro-choi-dien-tu-game-audio-wwise',
    categorySlug: 'am-nhac-va-nghe-thuat-sang-tao',
    level: CourseLevel.ADVANCED,
    price: 990000,
    oldPrice: 1590000,
    leadSummary: 'Âm thanh tương tác trong thế giới ảo: Làm chủ phần mềm trung gian hàng đầu thế giới Audiokinetic Wwise, kết nối âm thanh với Unity/Unreal Engine và thiết kế âm thanh thích ứng (Adaptive Audio).',
    industryContext: 'Khác với phim ảnh có dòng thời gian tuyến tính cố định, âm thanh trong game biến đổi liên tục theo từng hành động của người chơi; ngành công nghiệp game đang cực kỳ khao khát các Technical Sound Designer.',
    coreTopics: [
      'Bản chất phi tuyến của âm thanh game: Sự kiện kích hoạt (Event-driven Architecture) và Tham số trò chơi (Game Syncs: RTPCs, Switches, States)',
      'Giao diện và kiến trúc của phần mềm Wwise: Cây phân cấp Actor-Mixer, Quản lý tài nguyên âm thanh và Ngân hàng âm thanh (SoundBanks)',
      'Thiết kế âm nhạc thích ứng (Adaptive & Dynamic Music): Chuyển đổi mượt mà giữa trạng thái khám phá yên bình sang trạng thái chiến đấu căng thẳng',
      'Hệ thống tiếng bước chân đa bề mặt (Footsteps System): Tự động phát âm thanh khác nhau khi nhân vật đi trên cỏ, gỗ, kim loại hoặc nước',
      'Tích hợp Wwise vào công cụ phát triển game Unity qua mã lập trình C# cơ bản'
    ],
    handsOnProject: 'Xây dựng toàn bộ hệ thống âm thanh tương tác hoàn chỉnh cho một tựa game nhập vai 3D trên Unity bằng Wwise bao gồm tiếng bước chân, tiếng vũ khí và nhạc chiến đấu động.',
    targetAudience: 'Sound Designer muốn bước chân vào ngành công nghiệp game, Lập trình viên game muốn nâng cấp hệ thống âm thanh trò chơi.',
    careerApplication: 'Trở thành Game Audio Designer làm việc tại các studio phát triển game trong nước và quốc tế với mức thu nhập hấp dẫn.',
    requirements: [
      'Có kiến thức về thiết kế và chỉnh sửa âm thanh cơ bản',
      'Máy tính cài đặt phần mềm Wwise (miễn phí) và Unity Engine'
    ],
    benefits: [
      'Làm chủ công cụ trung gian âm thanh game tiêu chuẩn vàng được các studio game AAA toàn cầu sử dụng',
      'Tạo ra những bản nhạc game thông minh tự động thay đổi nhịp điệu theo từng pha hành động của người chơi',
      'Tiết kiệm tài nguyên bộ nhớ RAM của máy chơi game thông qua việc quản lý SoundBanks khoa học',
      'Mở ra cánh cửa nghề nghiệp rộng lớn trong ngành công nghiệp game tỷ đô đang bùng nổ'
    ],
    techniques: ['Game Audio', 'Audiokinetic Wwise', 'Adaptive Music', 'Game Syncs (RTPC)', 'Unity Sound Integration', 'Interactive Audio'],
    documents: [
      'Dự án game mẫu Unity tích hợp sẵn Wwise SDK để học viên thực hành kết nối âm thanh',
      'Sách hướng dẫn cấu hình các tham số trạng thái Switches và States trong Wwise'
    ]
  },
  {
    title: 'Nghệ Thuật Soạn Nhạc Phim & Phối Khí Giao Hưởng Điện Tử (Cinematic Orchestration)',
    slug: 'nghe-thuat-soan-nhac-phim-phoi-khi-giao-huong-dien-tu',
    categorySlug: 'am-nhac-va-nghe-thuat-sang-tao',
    level: CourseLevel.ADVANCED,
    price: 1190000,
    oldPrice: 1890000,
    leadSummary: 'Thổi hồn vĩ đại vào tác phẩm điện ảnh: Nghệ thuật phối khí cho dàn nhạc giao hưởng điện tử (Hybrid Orchestra), kỹ thuật xây dựng chủ đề nhân vật (Leitmotif) và làm chủ thư viện đàn dây Hollywood.',
    industryContext: 'Âm nhạc của Hans Zimmer hay John Williams có thể biến một cảnh quay bình thường thành một khoảnh khắc lịch sử kinh điển; soạn nhạc phim là đỉnh cao kết hợp giữa nghệ thuật âm nhạc và điện ảnh.',
    coreTopics: [
      'Bốn bộ nhạc cụ chính trong dàn nhạc giao hưởng cổ điển: Bộ Dây (Strings), Bộ Gỗ (Woodwinds), Bộ Đồng (Brass) và Bộ Gõ (Percussion)',
      'Kỹ thuật xây dựng chủ đề âm nhạc nhân vật (Leitmotif Technique): Gắn liền một giai điệu ngắn với tính cách và số phận của nhân vật',
      'Khai thác các thư viện giao hưởng ảo khổng lồ hàng đầu: Spitfire Audio, Cinematic Studio Strings và EastWest Hollywood Orchestra',
      'Làm chủ các kỹ thuật diễn tấu (Articulations): Đánh nốt ngắn dứt khoát (Spiccato/Staccato), Kéo dài tha thiết (Legato) và Rung ngón (Tremolo)',
      'Phối khí lai ghép hiện đại (Hybrid Orchestral): Kết hợp dàn nhạc giao hưởng truyền thống với tiếng đàn Synth điện tử và trống đại chiến (Taiko Drums)'
    ],
    handsOnProject: 'Soạn thảo và phối khí hoàn chỉnh một bản nhạc phim hành động viễn tưởng dài 2 phút cho một đoạn giới thiệu phim (Trailer) với cao trào bùng nổ.',
    targetAudience: 'Nhà soạn nhạc, Music Producer muốn theo đuổi mảng nhạc phim, nhạc game hoành tráng (Epic Music).',
    careerApplication: 'Trở thành nhà soạn nhạc phim chuyên nghiệp (Film Composer) sáng tác âm nhạc cho các dự án điện ảnh, phim tài liệu và trailer game.',
    requirements: [
      'Kiến thức nhạc lý và hòa âm vững chắc',
      'Máy tính cá nhân có cấu hình mạnh (tối thiểu 32GB RAM và ổ cứng SSD dung lượng lớn để tải thư viện âm thanh)'
    ],
    benefits: [
      'Điều khiển các nhạc cụ ảo cất lên tiếng đàn chân thực và giàu cảm xúc y hệt như một dàn nhạc giao hưởng 80 người đang biểu diễn',
      'Biết cách đẩy cảm xúc của người xem lên tột đỉnh bằng những đợt sóng âm thanh dồn dập của bộ đồng và bộ gõ',
      'Xây dựng các chủ đề âm nhạc độc đáo khắc sâu vào tâm trí khán giả suốt đời',
      'Khẳng định năng lực nghệ thuật đỉnh cao của một nhà soạn nhạc tầm vóc'
    ],
    techniques: ['Film Scoring', 'Cinematic Orchestration', 'Leitmotif', 'Spitfire Audio', 'Hybrid Orchestra', 'MIDI CC Expression'],
    documents: [
      'Bản tổng phổ dàn nhạc mẫu (Orchestral Score Template) chuẩn định dạng DAW',
      'Hướng dẫn gán các nút bánh xe điều biến MIDI CC1 (Modulation) và CC11 (Expression) để thổi hồn vào tiếng đàn'
    ]
  },

  // ==========================================
  // CAT-20: Sức khỏe, Thể chất & Lối sống lành mạnh (10 courses)
  // Quota: 3 BEGINNER, 4 INTERMEDIATE, 3 ADVANCED | 1 FREE, 9 PAID
  // ==========================================
  {
    title: 'Yoga Cho Người Mới Bắt Đầu: Cân Bằng Thân - Tâm - Trí & Giải Tỏa Đau Mỏi Cổ Vai Gáy',
    slug: 'yoga-cho-nguoi-moi-bat-dau-giai-toa-co-vai-gay',
    categorySlug: 'suc-khoe-the-chat-va-loi-song',
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0,
    leadSummary: 'Tìm lại sự dẻo dai và bình an: Kỹ thuật thở bụng Pranayama, chuỗi bài tập Chào mặt trời kinh điển (Surya Namaskar) và các tư thế Asana an toàn giải tỏa áp lực cột sống cho dân văn phòng.',
    industryContext: 'Ngồi làm việc trước máy tính hàng giờ liền khiến hàng triệu người mắc chứng đau mỏi cổ vai gáy và thoái hóa cột sống; Yoga là liều thuốc tự nhiên tuyệt vời nhất để phục hồi cơ thể.',
    coreTopics: [
      'Triết lý cốt lõi của Yoga: Sự hợp nhất giữa Hơi thở, Thân thể và Ý thức chứ không phải là uốn dẻo xiếc',
      'Kỹ thuật thở sâu 3 phần Pranayama: Tăng dung tích phổi, Cung cấp oxy dồi dào cho não bộ và làm dịu hệ thần kinh',
      'Chuỗi chuyển động Chào mặt trời (Surya Namaskar): 12 tư thế liên hoàn đánh thức toàn bộ năng lượng cơ thể vào buổi sáng',
      'Các tư thế Asana căn bản phục hồi cột sống: Tư thế Mèo - Bò (Cat-Cow), Chó cúi mặt (Downward Dog), Cây cầu (Bridge Pose) và Em bé (Child Pose)',
      'Thư giãn sâu toàn thân với tư thế Xác chết (Savasana): Tái tạo năng lượng và buông bỏ mọi căng thẳng tinh thần'
    ],
    handsOnProject: 'Thực hành chuỗi bài tập Yoga phục hồi cổ vai gáy 20 phút mỗi ngày tại nhà và cảm nhận sự thuyên giảm rõ rệt của các cơn đau mỏi sau 14 ngày.',
    targetAudience: 'Người làm việc văn phòng ít vận động, Người bị đau lưng, cổ vai gáy, Người muốn rèn luyện sự dẻo dai và tĩnh tâm.',
    careerApplication: 'Tự chăm sóc sức khỏe xương khớp của bản thân, duy trì tinh thần thư thái và năng lượng làm việc tích cực mỗi ngày.',
    requirements: [
      'Một tấm thảm tập Yoga êm ái chống trơn trượt',
      'Quần áo co giãn thoải mái và một không gian thoáng đãng'
    ],
    benefits: [
      'Đánh tan hoàn toàn cảm giác tê bì, đau nhức cổ vai gáy sau một ngày dài ngồi bàn làm việc',
      'Cải thiện tư thế đứng và ngồi thẳng thắn, phòng ngừa cong vẹo cột sống và gù lưng',
      'Học cách hít thở sâu giúp kiểm soát cảm xúc và giảm bớt căng thẳng tức thì',
      'Mang lại giấc ngủ ngon và sâu, thức dậy với cơ thể tràn đầy sức sống mới'
    ],
    techniques: ['Hatha Yoga', 'Pranayama Breathing', 'Surya Namaskar', 'Spine Rehabilitation', 'Asana Alignment', 'Savasana Relaxation'],
    documents: [
      'Sơ đồ chuỗi 12 tư thế Chào mặt trời minh họa chuẩn định tuyến từng bước',
      'Checklist 5 lỗi sai thường gặp khi tập Yoga tại nhà dễ gây chấn thương cần tránh'
    ]
  },
  {
    title: 'Dinh Dưỡng Khoa Học & Thiết Lập Thực Đơn Lành Mạnh Cho Cuộc Sống Bận Rộn',
    slug: 'dinh-duong-khoa-hoc-thiet-lap-thuc-don-lanh-manh',
    categorySlug: 'suc-khoe-the-chat-va-loi-song',
    level: CourseLevel.BEGINNER,
    price: 350000,
    oldPrice: 590000,
    leadSummary: 'Ăn đúng để sống khỏe: Phân biệt các nhóm chất dinh dưỡng đa lượng (Carb, Protein, Fat), vi chất thiết yếu, đọc nhãn dinh dưỡng thực phẩm và phương pháp chuẩn bị bữa ăn (Meal Prep) nhanh gọn.',
    industryContext: 'Bạn chính là những gì bạn ăn vào (You are what you eat); một chế độ ăn uống khoa học không đòi hỏi phải ăn kiêng kham khổ mà là sự hiểu biết để lựa chọn thực phẩm nuôi dưỡng cơ thể tối ưu.',
    coreTopics: [
      'Ba nhóm chất dinh dưỡng đa lượng (Macronutrients): Phân biệt Carb tốt (chậm) vs Carb xấu (nhanh), Nguồn Protein nạc và Chất béo lành mạnh (Omega-3)',
      'Chỉ số đường huyết của thực phẩm (Glycemic Index - GI) và cơ chế tiết hormone Insulin gây tích mỡ',
      'Đọc hiểu nhãn thành phần dinh dưỡng (Nutrition Facts): Nhận diện các loại đường ẩn, Chất béo chuyển hóa (Trans fat) và Chất bảo quản độc hại',
      'Quy tắc Đĩa thức ăn lành mạnh của Đại học Harvard: 1/2 Rau củ quả, 1/4 Tinh bột nguyên cám và 1/4 Đạm chất lượng',
      'Kỹ thuật chuẩn bị đồ ăn cho cả tuần (Meal Prep) trong 2 giờ: Bảo quản thực phẩm an toàn và tiết kiệm thời gian nấu nướng'
    ],
    handsOnProject: 'Tự tính toán nhu cầu năng lượng hàng ngày (TDEE) của bản thân và lên kế hoạch thực đơn bữa ăn lành mạnh chi tiết cho 7 ngày trong tuần.',
    targetAudience: 'Người bận rộn muốn ăn uống lành mạnh mà không tốn nhiều thời gian, Người muốn cải thiện sức khỏe qua chế độ ăn, Nội trợ gia đình.',
    careerApplication: 'Làm chủ kiến thức dinh dưỡng chuẩn y khoa để tự chăm sóc sức khỏe cho bản thân và toàn bộ gia đình.',
    requirements: [
      'Không đòi hỏi kiến thức y sinh học chuyên sâu',
      'Mong muốn thay đổi thói quen ăn uống đồ ăn nhanh và đồ ngọt'
    ],
    benefits: [
      'Duy trì mức năng lượng ổn định suốt cả ngày, chấm dứt tình trạng buồn ngủ gà gật sau bữa trưa',
      'Biết cách chọn lọc thực phẩm sạch, an toàn khi đi siêu thị mà không bị các chiêu trò quảng cáo đánh lừa',
      'Tự tay nấu được những bữa ăn đủ chất dinh dưỡng chỉ trong vòng 15-20 phút',
      'Cải thiện hệ tiêu hóa khỏe mạnh và làn da sáng mịn từ sâu bên trong'
    ],
    techniques: ['Nutrition Science', 'Macronutrients', 'Glycemic Index (GI)', 'Harvard Healthy Plate', 'Meal Prep', 'Nutrition Label Reading'],
    documents: [
      'Bảng tra cứu chỉ số đường huyết GI của hơn 100 loại thực phẩm phổ biến tại Việt Nam',
      'Kế hoạch thực đơn mẫu 7 ngày Clean Eating thanh lọc cơ thể kèm danh sách mua sắm siêu thị'
    ]
  },
  {
    title: 'Khoa Học Về Giấc Ngủ & Tối Ưu Hóa Nhịp Sinh Học Cơ Thể (Sleep Optimization)',
    slug: 'khoa-hoc-ve-giac-ngu-toi-uu-nhip-sinh-hoc',
    categorySlug: 'suc-khoe-the-chat-va-loi-song',
    level: CourseLevel.BEGINNER,
    price: 299000,
    oldPrice: 490000,
    leadSummary: 'Thức dậy tràn đầy năng lượng mỗi ngày: Hiểu rõ các giai đoạn giấc ngủ (NREM, REM), cơ chế hormone Melatonin, kiểm soát ánh sáng xanh và thiết lập nghi thức đi ngủ chuẩn khoa học.',
    industryContext: 'Giấc ngủ là trụ cột quan trọng nhất của sức khỏe, vượt trên cả dinh dưỡng và tập luyện; tối ưu hóa giấc ngủ là cách nhanh nhất để nâng cao trí nhớ, sự sáng tạo và kéo dài tuổi thọ.',
    coreTopics: [
      'Nhịp sinh học 24 giờ (Circadian Rhythm) và hai cơ chế điều hòa giấc ngủ: Áp lực giấc ngủ (Adenosine) và Tín hiệu ánh sáng mặt trời',
      'Bốn giai đoạn của một chu kỳ giấc ngủ: Ngủ nông, Ngủ sâu (Phục hồi thể chất) và Giấc ngủ chuyển động mắt nhanh REM (Xử lý cảm xúc và củng cố trí nhớ)',
      'Tác hại hủy hoại của ánh sáng xanh từ màn hình điện thoại đối với quá trình sản xuất hormone ngủ Melatonin',
      'Quy tắc 90 phút vàng: Cách tính toán giờ đi ngủ và thức dậy đúng cuối chu kỳ để không bao giờ bị mệt mỏi, uể oải',
      'Thiết kế phòng ngủ lý tưởng (Sleep Sanctuary): Nhiệt độ mát mẻ (18-20 độ C), Độ tối tuyệt đối và Không gian yên tĩnh'
    ],
    handsOnProject: 'Thực hiện nhật ký theo dõi giấc ngủ trong 7 ngày, áp dụng giao thức ngắt ánh sáng xanh 60 phút trước khi ngủ và tính toán giờ thức dậy theo chu kỳ 90 phút.',
    targetAudience: 'Người bị mất ngủ kinh niên, người khó vào giấc, người hay thức dậy mệt mỏi, người làm việc ca kíp đêm.',
    careerApplication: 'Tái tạo năng suất lao động và sự tỉnh táo minh mẫn đỉnh cao cho bộ não mỗi ngày làm việc.',
    requirements: [
      'Điện thoại có chức năng hẹn giờ hoặc đồng hồ báo thức',
      'Quyết tâm từ bỏ thói quen lướt điện thoại trên giường ngủ'
    ],
    benefits: [
      'Dễ dàng chìm vào giấc ngủ sâu chỉ sau 10-15 phút đặt lưng xuống giường',
      'Thức dậy hoàn toàn tỉnh táo, sảng khoái mà không cần phải bấm nút báo lại chuông báo thức',
      'Cải thiện rõ rệt khả năng ghi nhớ kiến thức và sự sáng tạo trong công việc',
      'Tăng cường hệ miễn dịch tự nhiên giúp cơ thể chống lại bệnh tật hiệu quả'
    ],
    techniques: ['Sleep Science', 'Circadian Rhythm', 'REM & Deep Sleep', 'Melatonin Optimization', '90-Minute Sleep Cycle', 'Sleep Hygiene Protocol'],
    documents: [
      'Bảng tính giờ thức dậy lý tưởng theo chu kỳ giấc ngủ 90 phút (Sleep Calculator)',
      'Giao thức chuẩn bị trước khi ngủ 10-3-2-1-0 của các chuyên gia thần kinh học'
    ]
  },
  {
    title: 'Tập Luyện Kháng Lực & Tăng Cơ Giảm Mỡ Tại Nhà Với Trọng Lượng Cơ Thể (Calisthenics & Bodyweight)',
    slug: 'tap-luyen-khang-luc-tang-co-giam-mo-calisthenics',
    categorySlug: 'suc-khoe-the-chat-va-loi-song',
    level: CourseLevel.INTERMEDIATE,
    price: 450000,
    oldPrice: 750000,
    leadSummary: 'Xây dựng thân hình săn chắc, khỏe mạnh không cần tạ: Làm chủ các chuyển động Calisthenics kinh điển (Hít đất, Hít xà, Squat, Dips), nguyên lý quá tải tăng tiến (Progressive Overload).',
    industryContext: 'Bạn không cần phải tốn tiền mua thẻ tập gym đắt đỏ hay máy móc cồng kềnh; chính trọng lượng cơ thể bạn là quả tạ tuyệt vời nhất để rèn luyện sức mạnh và vóc dáng hoàn hảo.',
    coreTopics: [
      'Nguyên lý sinh lý học của sự phát triển cơ bắp (Hypertrophy) và cơ chế Quá tải tăng tiến (Progressive Overload) không cần tạ',
      'Bốn nhóm chuyển động nền tảng: Đẩy thân trên (Push), Kéo thân trên (Pull), Thân dưới (Legs) và Cơ trọng tâm (Core)',
      'Kỹ thuật chuẩn xác và các biến thể từ dễ đến khó của Chống đẩy (Push-up) và Hít xà đơn (Pull-up)',
      'Làm chủ chuyển động thân dưới: Squat, Lunge và Pistol Squat (Ngồi xổm một chân) thăng bằng',
      'Xây dựng khối cơ lõi vững chắc như bàn thạch với Plank, Hollow Body và Hanging Leg Raises'
    ],
    handsOnProject: 'Thiết kế một lịch trình tập luyện Calisthenics 4 buổi/tuần tại nhà và thực hiện bài test nâng dần số lần hít đất chuẩn form từ 15 lên 35 cái.',
    targetAudience: 'Người bận rộn muốn tập luyện tại nhà, Người thích sự tự do không bị gò bó trong phòng gym, Người muốn cải thiện sức mạnh chức năng.',
    careerApplication: 'Sở hữu thân hình săn chắc, giảm mỡ thừa và cải thiện sức bền thể lực để làm việc bền bỉ suốt ngày dài.',
    requirements: [
      'Một thanh xà đơn gắn cửa hoặc xà đơn công viên gần nhà',
      'Không gian sàn nhà đủ rộng để nằm chống đẩy thoải mái'
    ],
    benefits: [
      'Tăng cơ bắp tự nhiên, giảm mỡ thừa và có được vóc dáng săn chắc, gọn gàng',
      'Làm chủ hoàn toàn cơ thể của chính mình với sức mạnh chức năng linh hoạt',
      'Tiết kiệm hàng chục triệu đồng tiền vé phòng tập và chi phí đi lại hàng năm',
      'Tập luyện linh hoạt mọi lúc mọi nơi ngay cả khi đi công tác hay du lịch'
    ],
    techniques: ['Calisthenics', 'Bodyweight Training', 'Progressive Overload', 'Pull-up & Push-up Form', 'Pistol Squat', 'Core Strength'],
    documents: [
      'Cẩm nang lộ trình tiến cấp (Progression Tree) từ chống đẩy vào tường đến chống đẩy 1 tay',
      'Lịch tập luyện mẫu 4 tuần chia theo thân trên / thân dưới kèm video hướng dẫn form'
    ]
  },
  {
    title: 'Chạy Bộ Đường Dài Đúng Cách & Chinh Phục Cự Ly Bán Marathon 21KM (Running Mastery)',
    slug: 'chay-bo-duong-dai-dung-cach-chinh-phuc-21km',
    categorySlug: 'suc-khoe-the-chat-va-loi-song',
    level: CourseLevel.INTERMEDIATE,
    price: 490000,
    oldPrice: 790000,
    leadSummary: 'Chạy bộ không chấn thương: Làm chủ dáng chạy chuẩn (Cadence 180), kỹ thuật tiếp đất an toàn, chiến thuật tập luyện theo vùng nhịp tim (Zone 2) và giáo án 12 tuần chinh phục cự ly 21km.',
    industryContext: 'Phong trào chạy bộ đang bùng nổ mạnh mẽ tại Việt Nam; tuy nhiên hơn 60% người chạy mới bị chấn thương khớp gối do chạy sai kỹ thuật và nôn nóng tăng cự ly quá nhanh.',
    coreTopics: [
      'Giải phẫu dáng chạy chuẩn sinh học: Tư thế ngực mở, Đánh tay nhịp nhàng, Hơi ngả người về phía trước từ mắt cá chân',
      'Kỹ thuật tiếp đất an toàn: Tiếp đất giữa bàn chân (Midfoot strike) ngay dưới trọng tâm cơ thể để giảm chấn động lên khớp gối',
      'Tần số bước chân lý tưởng (Cadence 170-180 bước/phút): Giảm thời gian chạm đất và tiết kiệm năng lượng',
      'Phương pháp tập luyện theo nhịp tim (Heart Rate Training): Tầm quan trọng của các bài chạy chậm Vùng 2 (Zone 2) xây dựng nền tảng hiếu khí',
      'Chiến thuật dinh dưỡng và nạp năng lượng trong ngày đua: Bù điện giải, Uống nước đúng cách và Sử dụng gel năng lượng'
    ],
    handsOnProject: 'Thực hiện bài chạy dài 10km duy trì nhịp tim Zone 2 với nhịp bước chân Cadence 175 và hoàn thành giáo án tuần đầu tiên chuẩn bị cho giải chạy 21km.',
    targetAudience: 'Người mới bắt đầu chạy bộ, Người chạy thường xuyên bị đau ống đồng (Shin splints) hoặc đau khớp gối, Người đặt mục tiêu tham gia giải chạy marathon.',
    careerApplication: 'Rèn luyện ý chí kiên định phi thường, sức khỏe tim mạch dẻo dai và tinh thần vượt qua mọi giới hạn bản thân.',
    requirements: [
      'Một đôi giày chạy bộ vừa vặn và phù hợp với kiểu bàn chân',
      'Đồng hồ thông minh hoặc điện thoại cài đặt ứng dụng theo dõi GPS (Strava/Garmin)'
    ],
    benefits: [
      'Chạy hàng chục cây số một cách nhẹ nhàng, thanh thoát mà không bao giờ bị đau khớp gối',
      'Tăng cường sức mạnh hệ tim mạch, hạ huyết áp và làm chậm nhịp tim khi nghỉ ngơi',
      'Giảm mỡ toàn thân hiệu quả, sở hữu đôi chân săn chắc và sự dẻo dai bền bỉ',
      'Tự hào đeo lên cổ tấm huy chương hoàn thành cự ly Half Marathon 21km đầu tiên trong đời'
    ],
    techniques: ['Running Form', 'Midfoot Strike', 'Cadence 180', 'Zone 2 Heart Rate', 'Aerobic Base Building', 'Half Marathon Plan'],
    documents: [
      'Giáo án luyện tập 12 tuần chinh phục cự ly Half Marathon 21km từ người mới bắt đầu',
      'Bảng tính tốc độ chạy (Pace Calculator) và chiến lược phân bổ sức trong ngày đua'
    ]
  },
  {
    title: 'Quản Trị Cân Nặng Khoa Học: Giảm Mỡ Bền Vững Bằng Thâm Hụt Calo & Nhịn Ăn Gián Đoạn (Intermittent Fasting)',
    slug: 'quan-tri-can-nang-giam-mo-tham-hut-calo-nhin-an-gian-doan',
    categorySlug: 'suc-khoe-the-chat-va-loi-song',
    level: CourseLevel.INTERMEDIATE,
    price: 450000,
    oldPrice: 720000,
    leadSummary: 'Chấm dứt hiệu ứng tăng cân trở lại (Yo-yo): Hiểu đúng định luật nhiệt động lực học trong quản lý cân nặng (CICO), phương pháp nhịn ăn gián đoạn 16/8 và duy trì lối sống lành mạnh suốt đời.',
    industryContext: 'Hầu hết các chế độ ăn kiêng hà khắc ngắn hạn đều thất bại vì chúng đi ngược lại sinh lý học con người; bí quyết giảm mỡ bền vững nằm ở sự thâm hụt calo hợp lý kết hợp lối sống khoa học.',
    coreTopics: [
      'Định luật bảo toàn năng lượng trong cơ thể: Năng lượng nạp vào vs Năng lượng tiêu hao (Calories In, Calories Out - CICO)',
      'Tính toán chính xác chỉ số chuyển hóa cơ bản (BMR) và tổng năng lượng tiêu hao hàng ngày (TDEE)',
      'Thiết lập mức thâm hụt calo an toàn (300-500 kcal/ngày) để giảm mỡ tối đa mà không bị mất cơ bắp',
      'Cơ chế khoa học của Nhịn ăn gián đoạn (Intermittent Fasting - IF 16/8): Tự thực bào tế bào (Autophagy), Ổn định đường huyết và Đốt mỡ thừa',
      'Chiến lược đối phó với cơn thèm ăn tâm lý (Emotional Eating) và các giai đoạn chững cân (Weight Loss Plateau)'
    ],
    handsOnProject: 'Thực hiện lộ trình 21 ngày áp dụng thâm hụt calo kết hợp nhịn ăn gián đoạn 16/8, theo dõi chỉ số vòng eo và giảm từ 1.5 đến 3kg mỡ thừa an toàn.',
    targetAudience: 'Người thừa cân, béo bụng lâu năm, người từng thất bại với nhiều phương pháp ăn kiêng tiêu cực, người muốn có vóc dáng thon gọn.',
    careerApplication: 'Tự tin làm chủ cân nặng và vóc dáng của mình suốt cuộc đời mà không cần phụ thuộc vào các loại thuốc giảm cân nguy hiểm.',
    requirements: [
      'Cân sức khỏe và thước dây đo vòng eo cơ thể',
      'Tải ứng dụng đếm calo thực phẩm miễn phí trên điện thoại (MyFitnessPal hoặc Yazio)'
    ],
    benefits: [
      'Giảm mỡ bụng rõ rệt mà không cần phải nhịn ăn đói lả hay cắt bỏ hoàn toàn cơm tinh bột',
      'Học cách lắng nghe tín hiệu no đói thực sự của cơ thể thay vì ăn uống theo cảm xúc buồn chán',
      'Kích hoạt cơ chế tự dọn dẹp tế bào già cỗi (Autophagy) giúp cơ thể trẻ hóa từ bên trong',
      'Duy trì vóc dáng thon thả vĩnh viễn mà không bao giờ bị tăng cân trở lại'
    ],
    techniques: ['Caloric Deficit', 'TDEE & BMR', 'Intermittent Fasting 16/8', 'CICO Principle', 'Autophagy', 'Emotional Eating Control'],
    documents: [
      'Bảng tính Excel tự động tính TDEE và gợi ý tỷ lệ Macro (Đạm, Đường, Béo) giảm mỡ',
      'Sổ tay hướng dẫn thực đơn nhịn ăn gián đoạn 16/8 cho người đi làm văn phòng'
    ]
  },
  {
    title: 'Phục Hồi Thể Chất & Phòng Ngừa Chấn Thương Xương Khớp (Mobility & Foam Rolling)',
    slug: 'phuc-hoi-the-chat-phong-ngua-chan-thuong-mobility',
    categorySlug: 'suc-khoe-the-chat-va-loi-song',
    level: CourseLevel.INTERMEDIATE,
    price: 399000,
    oldPrice: 650000,
    leadSummary: 'Giải phóng các điểm tắc nghẽn cơ bắp: Kỹ thuật tự giải phóng mạc cơ (Myofascial Release) bằng con lăn bọt (Foam Roller), tăng biên độ vận động khớp (Mobility) và phục hồi năng lượng.',
    industryContext: 'Nhiều người chăm chỉ tập luyện nhưng lại bỏ bê khâu phục hồi dẫn đến các bó cơ bị co rút mãn tính và hạn chế vận động; phục hồi thông minh là nửa phần còn lại của một cơ thể khỏe mạnh.',
    coreTopics: [
      'Hệ thống mạc cơ (Fascia) trong cơ thể: Tại sao các nút thắt cơ (Trigger Points) gây ra những cơn đau lan tỏa khắp người',
      'Kỹ thuật lăn bọt tự giải phóng cơ bắp (Self-Myofascial Release - SMR): Lưng trên, Cơ đùi trước, Đùi sau, Bắp chân và Dải chậu chày (IT Band)',
      'Phân biệt Giãn cơ tĩnh (Static Stretching) sau buổi tập và Khởi động linh hoạt (Dynamic Mobility) trước buổi tập',
      'Bài tập tăng biên độ khớp then chốt: Mở rộng khớp hông (Hip Mobility), Khớp cổ chân (Ankle Dorsiflexion) và Cột sống ngực (Thoracic Spine)',
      'Tối ưu hóa các phương pháp phục hồi tự nhiên: Liệu pháp nhiệt (Xông hơi Sauna / Tắm nước lạnh Cold Plunge) và Bù nước điện giải'
    ],
    handsOnProject: 'Thực hiện một bài kiểm tra đánh giá mức độ linh hoạt của 3 khớp chính (Cổ chân, Hông, Vai) và thực hiện quy trình giải mỏi toàn thân 15 phút với con lăn bọt.',
    targetAudience: 'Người chơi thể thao thường xuyên bị căng cơ, Người làm văn phòng bị cứng khớp hông và lưng, Vận động viên phong trào.',
    careerApplication: 'Duy trì cơ thể dẻo dai, không đau nhức, tăng cường hiệu suất vận động trong mọi môn thể thao và cuộc sống.',
    requirements: [
      'Một con lăn bọt xốp (Foam Roller) và một quả bóng massage (hoặc bóng tennis)',
      'Thảm tập thể dục'
    ],
    benefits: [
      'Xóa tan các điểm co cứng cơ bắp ê ẩm ngay lập tức chỉ sau vài phút lăn bọt',
      'Gia tăng biên độ vận động của các khớp giúp bạn ngồi xổm sâu hơn và với tay cao hơn',
      'Phòng ngừa đến 80% nguy cơ chấn thương rách cơ, viêm gân trong lúc tập luyện thể thao',
      'Cảm nhận cơ thể nhẹ nhõm, thanh thoát và tràn đầy năng lượng vận động'
    ],
    techniques: ['Foam Rolling', 'Myofascial Release (SMR)', 'Joint Mobility', 'Trigger Points', 'Dynamic Stretching', 'Recovery Protocols'],
    documents: [
      'Bản đồ vị trí các điểm nút thắt cơ (Trigger Points) phổ biến và cách giải tỏa bằng bóng massage',
      'Quy trình khởi động linh hoạt khớp 10 phút trước khi chơi thể thao'
    ]
  },
  {
    title: 'Tối Ưu Hóa Năng Lượng Sinh Học & Kéo Dài Tuổi Thọ Khỏe Mạnh (Biohacking & Longevity)',
    slug: 'toi-uu-hoa-nang-luong-sinh-hoc-keo-dai-tuoi-tho-biohacking',
    categorySlug: 'suc-khoe-the-chat-va-loi-song',
    level: CourseLevel.ADVANCED,
    price: 890000,
    oldPrice: 1450000,
    leadSummary: 'Lập trình lại sinh học cơ thể theo khoa học hiện đại: Kéo dài tuổi thọ khỏe mạnh (Healthspan), kích hoạt gen trường thọ (Sirtuins), tối ưu hóa ty thể (Mitochondria) và liệu pháp nhiệt đối nghịch.',
    industryContext: 'Mục tiêu của y học hiện đại không chỉ là sống thọ đến 90 tuổi trên giường bệnh mà là duy trì một cơ thể tráng kiện và trí tuệ minh mẫn cho đến ngày cuối cùng của cuộc đời (Healthspan).',
    coreTopics: [
      'Sự khác biệt giữa Tuổi thọ thời gian (Lifespan) và Tuổi thọ khỏe mạnh (Healthspan)',
      'Khoa học về sự lão hóa của Tiến sĩ David Sinclair: Các dấu ấn lão hóa tế bào (Hallmarks of Aging) và Vai trò của NAD+ cùng Gen Sirtuins',
      'Tối ưu hóa nhà máy năng lượng tế bào (Mitochondria): Tập luyện cường độ cao ngắt quãng (HIIT) và nhịn ăn kích hoạt ty thể mới',
      'Liệu pháp gây căng thẳng tích cực (Hormesis): Tắm nước đá lạnh kích hoạt mỡ nâu (Brown Fat) và Xông hơi hồng ngoại thải độc',
      'Theo dõi các chỉ số sinh học quan trọng (Biomarkers): Độ biến thiên nhịp tim (HRV), Chỉ số đường huyết liên tục (CGM) và Chỉ số viêm (hs-CRP)'
    ],
    handsOnProject: 'Xây dựng một phác đồ Biohacking cá nhân hóa bao gồm tiếp xúc ánh nắng buổi sáng, liệu pháp tắm lạnh 2 phút và tập luyện rèn luyện ty thể trong 14 ngày.',
    targetAudience: 'Doanh nhân, Nhà lãnh đạo, Những người tiên phong quan tâm đến công nghệ sinh học và kéo dài tuổi thọ khỏe mạnh.',
    careerApplication: 'Duy trì phong độ thể chất và trí tuệ đỉnh cao bất chấp tuổi tác, dẫn đầu xu hướng chăm sóc sức khỏe chủ động của tương lai.',
    requirements: [
      'Tư duy cởi mở tìm hiểu các công trình nghiên cứu y sinh học tiên tiến',
      'Sự dũng cảm thử nghiệm các liệu pháp gây căng thẳng tích cực (nước lạnh, nhịn ăn)'
    ],
    benefits: [
      'Làm chậm lại tốc độ lão hóa sinh học của các tế bào và cơ quan nội tạng',
      'Tăng gấp đôi mức năng lượng làm việc bền bỉ suốt cả ngày mà không cần lạm dụng cà phê',
      'Kích hoạt mỡ nâu giúp tăng cường trao đổi chất và đốt mỡ thừa tự nhiên',
      'Duy trì sự sắc bén của trí não và phòng ngừa các bệnh thoái hóa thần kinh khi về già'
    ],
    techniques: ['Biohacking', 'Longevity Science', 'Healthspan Optimization', 'Mitochondrial Health', 'Hormesis', 'Cold Exposure & Sauna'],
    documents: [
      'Bảng danh mục các xét nghiệm máu định kỳ quan trọng nhất để theo dõi tốc độ lão hóa',
      'Giao thức thực hành tiếp xúc lạnh và xông hơi an toàn chuẩn khoa học thần kinh'
    ]
  },
  {
    title: 'Thiền Định Chánh Niệm & Hơi Thở Nâng Cao Cho Người Lãnh Đạo (Mindfulness & Breathwork for Executives)',
    slug: 'thien-dinh-chanh-niem-hoi-tho-nang-cao-lanh-dao-executive',
    categorySlug: 'suc-khoe-the-chat-va-loi-song',
    level: CourseLevel.ADVANCED,
    price: 990000,
    oldPrice: 1590000,
    leadSummary: 'Làm chủ tâm trí giữa cơn bão áp lực: Các kỹ thuật thở thay đổi trạng thái ý thức (Wim Hof, Thở luân phiên Nadi Shodhana), thiền quán Vipassana và thiết lập trạng thái tâm tĩnh lặng như gương.',
    industryContext: 'Các nhà lãnh đạo hàng đầu thế giới (Steve Jobs, Ray Dalio) đều coi thiền định là vũ khí bí mật giúp họ duy trì sự sáng suốt và tầm nhìn chiến lược giữa những thời khắc căng thẳng nhất.',
    coreTopics: [
      'Giải phẫu học thần kinh của trạng thái Chánh niệm: Tăng cường mật độ chất xám ở vỏ não trước trán và thu nhỏ hạch hạnh nhân',
      'Làm chủ hệ thần kinh tự chủ thông qua hơi thở: Kích hoạt dây thần kinh phế vị (Vagus Nerve) để đưa cơ thể về trạng thái Thư giãn và Phục hồi',
      'Phương pháp thở Wim Hof: Siêu thông khí có kiểm soát kết hợp nín thở giúp kiểm soát phản ứng viêm và tăng cường hệ miễn dịch',
      'Kỹ thuật thở luân phiên qua từng lỗ mũi (Nadi Shodhana): Cân bằng bán cầu não trái (logic) và bán cầu não phải (trực giác)',
      'Thiền quán Vipassana: Quan sát các cảm giác trên thân thể một cách khách quan không phản ứng, buông bỏ tâm tham ái và sân hận'
    ],
    handsOnProject: 'Thực hành một phiên thở Wim Hof 3 vòng kết hợp 20 phút thiền định quán sát hơi thở vào lúc bình minh trong 7 ngày liên tục.',
    targetAudience: 'CEO, Nhà sáng lập, Lãnh đạo cấp cao chịu áp lực công việc khổng lồ, Người tìm kiếm sự chuyển hóa nội tâm sâu sắc.',
    careerApplication: 'Xây dựng một tâm trí tĩnh lặng như mặt hồ phẳng lặng, đưa ra những quyết định sáng suốt và nhân ái nhất cho tổ chức.',
    requirements: [
      'Một không gian yên tĩnh tuyệt đối để thực hành',
      'Tâm thế buông bỏ mọi toan tính và mở lòng với trải nghiệm tĩnh lặng bên trong'
    ],
    benefits: [
      'Lập tức làm lắng dịu những cơn sóng giận dữ hay lo âu dữ dội chỉ sau một bài tập thở 5 phút',
      'Khai mở năng lực trực giác nhạy bén giúp nhìn thấu bản chất của các vấn đề phức tạp',
      'Nuôi dưỡng lòng trắc ẩn và sự thấu cảm sâu sắc đối với cộng sự và nhân viên dưới quyền',
      'Tìm thấy sự bình an nội tại vững chắc không bị phụ thuộc vào những biến động bên ngoài'
    ],
    techniques: ['Vipassana Meditation', 'Wim Hof Breathwork', 'Vagus Nerve Activation', 'Nadi Shodhana', 'Neuroplasticity', 'Executive Presence'],
    documents: [
      'File âm thanh hướng dẫn thiền định quán tâm 20 phút dành riêng cho nhà lãnh đạo',
      'Sách hướng dẫn các kỹ thuật thở kích hoạt dây thần kinh phế vị hạ huyết áp khẩn cấp'
    ]
  },
  {
    title: 'Y Học Phong Cách Sống & Phòng Ngừa Các Bệnh Mãn Tính Không Lây (Lifestyle Medicine)',
    slug: 'y-hoc-phong-cach-song-phong-ngua-benh-man-tinh-lifestyle-medicine',
    categorySlug: 'suc-khoe-the-chat-va-loi-song',
    level: CourseLevel.ADVANCED,
    price: 850000,
    oldPrice: 1390000,
    leadSummary: 'Đảo ngược và phòng ngừa bệnh tật bằng lối sống: 6 trụ cột của Y học phong cách sống (Dinh dưỡng thực vật, Vận động, Giấc ngủ, Kiểm soát căng thẳng, Tránh chất độc hại, Kết nối xã hội) đẩy lùi tiểu đường và tim mạch.',
    industryContext: 'Hơn 70% các ca tử vong trên toàn cầu ngày nay xuất phát từ các bệnh mãn tính không lây (Tim mạch, Tiểu đường tuýp 2, Ung thư); lối sống lành mạnh có thể phòng ngừa đến 80% các căn bệnh này.',
    coreTopics: [
      'Khái niệm Y học phong cách sống (Lifestyle Medicine) chuẩn Đại học Y khoa Lối sống Hoa Kỳ (ACLM)',
      'Cơ chế gốc rễ của bệnh mãn tính: Tình trạng viêm mãn tính mức độ thấp (Low-grade Systemic Inflammation) và Đề kháng Insulin',
      'Đảo ngược bệnh tiểu đường tuýp 2 và mỡ máu cao thông qua chế độ ăn thực vật nguyên phần (Whole Food Plant-Based)',
      'Sức khỏe hệ vi sinh vật đường ruột (Gut Microbiome): Bộ não thứ hai của cơ thể và mối liên hệ với hệ miễn dịch',
      'Kê đơn lối sống (Lifestyle Prescription): Thiết kế lộ trình thay đổi hành vi bền vững cho bản thân và người thân'
    ],
    handsOnProject: 'Thực hiện phân tích hồ sơ sức khỏe và xét nghiệm máu của bản thân, xác định 3 nguy cơ bệnh mãn tính tiềm ẩn và lập một Đơn thuốc lối sống (Lifestyle Rx) 90 ngày đảo ngược rủi ro.',
    targetAudience: 'Bác sĩ, Chuyên gia chăm sóc sức khỏe, Người có tiền sử gia đình mắc bệnh tim mạch, tiểu đường, Người quan tâm đến y học dự phòng.',
    careerApplication: 'Trang bị kiến thức y học lối sống chuẩn mực để bảo vệ sức khỏe trọn đời cho bản thân và dẫn dắt cộng đồng sống khỏe mạnh.',
    requirements: [
      'Hiểu biết tổng quan về sinh học cơ thể người',
      'Tâm huyết với việc bảo vệ sức khỏe chủ động từ sớm thay vì đợi có bệnh mới chữa'
    ],
    benefits: [
      'Hạ đường huyết và cải thiện chỉ số mỡ máu tự nhiên mà không cần phải tăng liều thuốc tây y',
      'Xây dựng một hệ vi sinh vật đường ruột khỏe mạnh giúp tiêu hóa êm ái và tăng sức đề kháng',
      'Bảo vệ thành mạch máu khỏi nguy cơ xơ vữa, ngăn ngừa đột quỵ và nhồi máu cơ tim từ xa',
      'Tạo dựng một tấm khiên bảo vệ sức khỏe vững chắc cho cả gia đình'
    ],
    techniques: ['Lifestyle Medicine', 'Whole Food Plant-Based', 'Insulin Resistance Reversal', 'Gut Microbiome Health', 'Chronic Inflammation', 'Preventive Healthcare'],
    documents: [
      'Bảng hướng dẫn kê đơn lối sống (Lifestyle Prescription Template) chuẩn ACLM',
      'Cẩm nang 50 thực phẩm chống viêm và nuôi dưỡng hệ vi sinh đường ruột hàng đầu'
    ]
  }
]
