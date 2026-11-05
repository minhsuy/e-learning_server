import { CourseLevel } from '@prisma/client'
import { CourseBlueprint } from './categories-data'

export const COURSES_FINANCE_PROJECT: readonly CourseBlueprint[] = [
  // ==========================================
  // CAT-13: Tài chính, Kế toán & Đầu tư cá nhân (18 courses)
  // Quota: 6 BEGINNER, 8 INTERMEDIATE, 4 ADVANCED | 2 FREE, 16 PAID
  // ==========================================
  {
    title: 'Quản Lý Tài Chính Cá Nhân & Kế Hoạch Tự Do Tài Chính (FIRE) Từ Con Số 0',
    slug: 'quan-ly-tai-chinh-ca-nhan-ke-hoach-tu-do-tai-chinh-fire',
    categorySlug: 'tai-chinh-ke-toan-va-dau-tu',
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0,
    leadSummary: 'Làm chủ đồng tiền của bạn: Thiết lập quỹ khẩn cấp, loại bỏ nợ xấu, quản lý chi tiêu theo phương pháp 6 chiếc hũ và xây dựng lộ trình nghỉ hưu sớm tự do tài chính.',
    industryContext: 'Kiếm được tiền chỉ là một nửa của phương trình làm giàu; năng lực quản lý và giữ tiền mới là yếu tố quyết định bạn có được an tâm về mặt tài chính suốt cuộc đời hay không.',
    coreTopics: [
      'Tư duy đúng đắn về tiền bạc: Phân biệt Tài sản (Assets) và Tiêu sản (Liabilities) theo Robert Kiyosaki',
      'Kiểm soát dòng tiền cá nhân: Quy tắc 50/30/20 và Phương pháp 6 chiếc hũ tài chính (JARS System)',
      'Chiến lược xử lý nợ thông minh: Phương pháp Hòn tuyết lăn (Debt Snowball) vs Phương pháp Đổ tuyết (Debt Avalanche)',
      'Xây dựng Quỹ khẩn cấp (Emergency Fund) tương đương 3-6 tháng chi phí sinh hoạt thiết yếu',
      'Phong trào Tự do tài chính & Nghỉ hưu sớm (FIRE): Tính toán con số FIRE Number và Quy tắc rút tiền an toàn 4%'
    ],
    handsOnProject: 'Lập bảng tính quản lý thu chi cá nhân hoàn chỉnh trên Google Sheets và tính toán chính xác số tiền cần tích lũy để đạt tự do tài chính ở tuổi 45.',
    targetAudience: 'Người trẻ mới đi làm, người gặp khó khăn trong việc tiết kiệm tiền, bất kỳ ai muốn làm chủ tài chính cá nhân.',
    careerApplication: 'Xây dựng sự an tâm vững chắc về tài chính, giúp bạn tự tin theo đuổi những cơ hội nghề nghiệp mà mình thực sự đam mê.',
    requirements: [
      'Không đòi hỏi kiến thức tài chính phức tạp',
      'Có mong muốn chân thành thay đổi thói quen chi tiêu bốc đồng'
    ],
    benefits: [
      'Chấm dứt hoàn toàn tình trạng vừa nhận lương đã hết tiền vào giữa tháng',
      'Xóa sạch các khoản nợ tín dụng lãi cao với lộ trình trả nợ khoa học, rõ ràng',
      'Bảo vệ bản thân và gia đình trước các rủi ro bất ngờ nhờ quỹ khẩn cấp an toàn',
      'Biết chính xác số tiền mình cần có để có thể nghỉ hưu sớm và sống cuộc đời tự do'
    ],
    techniques: ['Personal Finance', 'FIRE Movement', 'Budgeting', 'JARS System', 'Emergency Fund', 'Debt Snowball'],
    documents: [
      'File Google Sheets tự động phân bổ thu nhập theo phương pháp 6 chiếc hũ',
      'Bảng tính kế hoạch nghỉ hưu sớm FIRE Calculator với công thức lãi kép tự động'
    ]
  },
  {
    title: 'Nhập Môn Kế Toán Doanh Nghiệp: Định Khoản & Lập Chứng Từ Cho Người Mới Bắt Đầu',
    slug: 'nhap-mon-ke-toan-doanh-nghiep-dinh-khoan-lap-chung-tu',
    categorySlug: 'tai-chinh-ke-toan-va-dau-tu',
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0,
    leadSummary: 'Làm quen với ngôn ngữ kế toán chuẩn Việt Nam (VAS / Thông tư 200/133): Hệ thống tài khoản, nguyên tắc ghi Nợ - Có, lập phiếu thu, phiếu chi và hóa đơn chứng từ.',
    industryContext: 'Mọi giao dịch kinh tế trong xã hội đều phải được ghi nhận và phản ánh qua sổ sách kế toán; nghề kế toán luôn là vị trí then chốt không thể thiếu trong mọi doanh nghiệp.',
    coreTopics: [
      'Khái niệm cơ bản về Kế toán: Đối tượng kế toán, Tài sản, Nguồn vốn và Mối quan hệ cân đối',
      'Hệ thống tài khoản kế toán doanh nghiệp theo Thông tư 200 và Thông tư 133',
      'Nguyên tắc vàng định khoản kế toán kép: Có Nợ ắt có Có, Tổng Nợ luôn bằng Tổng Có',
      'Quy trình luân chuyển và kiểm tra tính hợp pháp của hóa đơn, chứng từ kế toán gốc',
      'Kế toán các nghiệp vụ cơ bản: Mua hàng, Bán hàng, Tiền mặt, Tiền gửi ngân hàng và Tạm ứng'
    ],
    handsOnProject: 'Thực hành định khoản và vào sổ nhật ký chung cho 30 nghiệp vụ kinh tế phát sinh trong một tháng của một công ty thương mại nhỏ.',
    targetAudience: 'Sinh viên mới học kế toán, người chuyển ngành muốn làm kế toán viên, chủ doanh nghiệp muốn kiểm tra sổ sách nhân viên.',
    careerApplication: 'Tự tin bắt đầu công việc tại vị trí nhân viên kế toán nội bộ hoặc kế toán viên sơ cấp.',
    requirements: [
      'Biết sử dụng máy tính và các phép tính cộng trừ nhân chia cơ bản',
      'Tính cẩn thận, tỉ mỉ và trung thực'
    ],
    benefits: [
      'Hiểu rõ bản chất logic của các tài khoản kế toán từ loại 1 đến loại 9',
      'Định khoản chính xác các nghiệp vụ kinh tế phát sinh hàng ngày mà không bị nhầm lẫn Nợ - Có',
      'Phát hiện các sai sót và bất hợp pháp trên hóa đơn chứng từ mua vào bán ra',
      'Tự tin đọc hiểu sổ cái và các báo cáo tổng hợp kế toán cơ bản'
    ],
    techniques: ['Accounting Basics', 'Double-entry Bookkeeping', 'Chart of Accounts', 'Circular 200/133', 'Source Documents', 'Journal Entry'],
    documents: [
      'Sơ đồ chữ T tổng hợp nguyên tắc định khoản cho toàn bộ hệ thống tài khoản',
      'Bộ hóa đơn, phiếu thu, phiếu chi mẫu thực hành định khoản thực tế'
    ]
  },
  {
    title: 'Đầu Tư Chứng Khoán Cơ Bản: Phân Tích Cơ Bản (FA) & Định Giá Cổ Phiếu',
    slug: 'dau-tu-chung-khoan-co-ban-phan-tich-co-ban-fa-dinh-gia-co-phieu',
    categorySlug: 'tai-chinh-ke-toan-va-dau-tu',
    level: CourseLevel.BEGINNER,
    price: 499000,
    oldPrice: 799000,
    leadSummary: 'Đầu tư cổ phiếu bài bản theo trường phái đầu tư giá trị của Warren Buffett: Lựa chọn doanh nghiệp có lợi thế cạnh tranh (Moat), đọc hiểu báo cáo thường niên và định giá P/E, P/B.',
    industryContext: 'Thị trường chứng khoán là kênh tích lũy tài sản dài hạn có mức sinh lời cao nhất trong lịch sử kinh tế; nhưng nếu không có kiến thức cơ bản, bạn sẽ biến kênh đầu tư thành sới bạc may rủi.',
    coreTopics: [
      'Bản chất của Cổ phiếu: Bạn là người đồng sở hữu một phần doanh nghiệp thực sự',
      'Mô hình kinh doanh và Hào kinh tế (Economic Moat): Thương hiệu mạnh, Chi phí chuyển đổi cao, Hiệu ứng mạng lưới',
      'Đọc hiểu Báo cáo tài chính và Báo cáo thường niên của doanh nghiệp niêm yết',
      'Các chỉ số định giá cốt lõi: P/E (Giá trên lợi nhuận), P/B (Giá trên giá trị sổ sách), ROE (Tỷ suất sinh lời trên vốn chủ sở hữu)',
      'Tâm lý học hành vi trong đầu tư chứng khoán: Vượt qua lòng tham và nỗi sợ hãi (FOMO & Panic Selling)'
    ],
    handsOnProject: 'Thực hiện định giá và viết báo cáo phân tích khuyến nghị đầu tư cho một cổ phiếu thuộc nhóm ngành tiêu dùng thiết yếu niêm yết trên sàn HOSE.',
    targetAudience: 'Nhà đầu tư cá nhân mới tham gia thị trường chứng khoán, nhân viên văn phòng muốn tìm kênh tích lũy sinh lời an toàn.',
    careerApplication: 'Tự tin xây dựng danh mục cổ phiếu đầu tư dài hạn an toàn, bền vững cho bản thân và gia đình.',
    requirements: [
      'Có tài khoản giao dịch chứng khoán tại bất kỳ công ty chứng khoán nào (hoặc mở tài khoản miễn phí)',
      'Tư duy đầu tư dài hạn nghiêm túc, không tìm kiếm phương pháp làm giàu nhanh sau 1 đêm'
    ],
    benefits: [
      'Biết cách phân biệt một doanh nghiệp làm ăn chân chính với các cổ phiếu đầu cơ bị thao túng giá (Cổ phiếu rác/Penny)',
      'Tự tính toán được vùng giá hợp lý của cổ phiếu để không mua đuổi ở vùng đỉnh',
      'Hiểu rõ câu chuyện kinh doanh và triển vọng tăng trưởng thực sự của doanh nghiệp',
      'Giữ được tâm lý an nhiên, ngủ ngon ngay cả khi thị trường chứng khoán biến động dữ dội'
    ],
    techniques: ['Stock Investing', 'Fundamental Analysis', 'Warren Buffett Strategy', 'Economic Moat', 'P/E Valuation', 'Value Investing'],
    documents: [
      'Bảng kiểm tra 15 tiêu chí lựa chọn cổ phiếu giá trị của Warren Buffett và Philip Fisher',
      'File Excel mẫu định giá cổ phiếu theo phương pháp P/E mục tiêu và Chiết khấu dòng tiền DCF'
    ]
  },
  {
    title: 'Phân Tích Kỹ Thuật (TA) Thực Chiến: Nến Nhật, Đường Xu Hướng & Các Chỉ Báo (RSI, MACD)',
    slug: 'phan-tich-ky-thuat-ta-thuc-chien-nen-nhat-rsi-macd',
    categorySlug: 'tai-chinh-ke-toan-va-dau-tu',
    level: CourseLevel.BEGINNER,
    price: 450000,
    oldPrice: 750000,
    leadSummary: 'Làm chủ biểu đồ nến và xác định điểm vào lệnh tối ưu: Cấu trúc xu hướng, Hỗ trợ - Kháng cự, các mô hình nến đảo chiều kinh điển và bộ chỉ báo động lượng RSI, MACD.',
    industryContext: 'Phân tích cơ bản cho bạn biết NÊN MUA CỔ PHIẾU NÀO, nhưng Phân tích kỹ thuật sẽ cho bạn biết CHÍNH XÁC KHI NÀO NÊN MUA VÀ BÁN để tối ưu lợi nhuận.',
    coreTopics: [
      'Lý thuyết Dow kinh điển: Xu hướng thị trường có 3 giai đoạn (Tích lũy, Tăng trưởng, Phân phối)',
      'Đọc hiểu biểu đồ nến Nhật: Nến Doji, Búa (Hammer), Nhấn chìm (Engulfing) và Sao mai (Morning Star)',
      'Xác định các vùng cản quan trọng: Đường xu hướng (Trendline), Kênh giá, Ngưỡng Hỗ trợ và Kháng cự',
      'Các chỉ báo động lượng và xu hướng thông dụng: Đường trung bình động MA/EMA, Chỉ số sức mạnh tương đối RSI, Đường cong MACD',
      'Quy tắc cắt lỗ (Stop-loss) kỷ luật và quản trị rủi ro trên từng giao dịch (Tỷ lệ Risk/Reward)'
    ],
    handsOnProject: 'Thực hành phân tích đồ thị giá trên nền tảng TradingView, xác định điểm mua và đặt mức cắt lỗ/chốt lời cho 5 mã cổ phiếu thực tế.',
    targetAudience: 'Nhà đầu tư chứng khoán, tiền số hoặc ngoại hối muốn tìm kiếm điểm mua bán có xác suất thành công cao.',
    careerApplication: 'Trở thành nhà giao dịch (Trader) có kỷ luật thép và phương pháp giao dịch bài bản.',
    requirements: [
      'Có tài khoản miễn phí trên nền tảng TradingView hoặc bảng giá chứng khoán trực tuyến',
      'Cam kết tuân thủ nghiêm ngặt kỷ luật cắt lỗ'
    ],
    benefits: [
      'Nhìn thấu tâm lý tranh chấp giữa phe mua và phe bán qua từng cây nến và thanh khối lượng',
      'Xác định chính xác thời điểm xu hướng giá bắt đầu đảo chiều để kịp thời hành động',
      'Không bao giờ bị kẹt hàng hoặc gánh chịu những khoản lỗ khổng lồ nhờ nguyên tắc cắt lỗ chủ động',
      'Tối ưu hóa tỷ lệ lợi nhuận trên rủi ro (Risk/Reward) luôn đạt từ 1:2 trở lên'
    ],
    techniques: ['Technical Analysis', 'Candlestick Patterns', 'RSI', 'MACD', 'Support & Resistance', 'Risk Reward Ratio'],
    documents: [
      'Cẩm nang tra cứu 24 mô hình nến Nhật đảo chiều và tiếp diễn xu hướng kinh điển',
      'Checklist 5 điều kiện bắt buộc trước khi bấm lệnh giao dịch trên TradingView'
    ]
  },
  {
    title: 'Thành Thạo Microsoft Excel & Bảng Tính Tài Chính Từ Cơ Bản Đến Nâng Cao',
    slug: 'thanh-thao-microsoft-excel-bang-tinh-tai-chinh',
    categorySlug: 'tai-chinh-ke-toan-va-dau-tu',
    level: CourseLevel.BEGINNER,
    price: 399000,
    oldPrice: 650000,
    leadSummary: 'Làm chủ công cụ số một của dân tài chính kế toán: Các hàm tra cứu VLOOKUP/XLOOKUP, hàm điều kiện lồng nhau, bảng tổng hợp Pivot Table và biểu đồ phân tích chuyên nghiệp.',
    industryContext: 'Hơn 90% các mô hình tài chính và quyết định kinh doanh trên thế giới vẫn được tính toán trên Microsoft Excel; thành thạo Excel là kỹ năng văn phòng tạo ra sự khác biệt lớn nhất.',
    coreTopics: [
      'Thao tác phím tắt siêu tốc trên Excel, định dạng dữ liệu có điều kiện (Conditional Formatting)',
      'Bộ hàm logic và tra cứu nâng cao: IF, AND, OR, SUMIFS, COUNTIFS, VLOOKUP, INDEX/MATCH và XLOOKUP thần thánh',
      'Bộ hàm tài chính ứng dụng: PMT (Tính tiền trả góp), FV, PV, NPV (Giá trị hiện tại thuần) và IRR (Tỷ suất sinh lời nội bộ)',
      'Phân tích và tổng hợp dữ liệu khổng lồ với Pivot Table và Pivot Chart chỉ trong 30 giây',
      'Bảo vệ dữ liệu bảng tính: Khóa ô công thức, Data Validation ngăn chặn nhập sai thông tin'
    ],
    handsOnProject: 'Xây dựng một bảng tính tính lịch trả nợ vay mua nhà trả góp hàng tháng tự động phân tách giữa nợ gốc và tiền lãi phát sinh theo dư nợ giảm dần.',
    targetAudience: 'Nhân viên kế toán, Chuyên viên phân tích tài chính, Nhân viên ngân hàng, Sinh viên khối ngành kinh tế.',
    careerApplication: 'Tăng tốc độ xử lý số liệu văn phòng lên gấp 3 lần, ghi điểm tuyệt đối trong mắt cấp trên và đồng nghiệp.',
    requirements: [
      'Máy tính cài đặt phần mềm Microsoft Excel (khuyến nghị phiên bản từ 2019/365)',
      'Sự kiên nhẫn luyện tập gõ công thức và phím tắt'
    ],
    benefits: [
      'Không còn cần dùng chuột khi thao tác trên Excel nhờ làm chủ hệ thống phím tắt chuyên nghiệp',
      'Xử lý và làm sạch hàng chục nghìn dòng dữ liệu tài chính trong nháy mắt',
      'Tính toán chính xác các bài toán vay vốn, đầu tư sinh lời và kế hoạch tài chính phức tạp',
      'Trình bày các bảng báo cáo tài chính đẹp mắt, chuyên nghiệp và tự động cập nhật số liệu'
    ],
    techniques: ['Excel for Finance', 'XLOOKUP', 'Pivot Table', 'NPV & IRR', 'Financial Modeling', 'Data Validation'],
    documents: [
      'Bảng tổng hợp 100 phím tắt Excel quyền năng nhất cho dân kế toán và tài chính',
      'File thực hành Excel mẫu gồm 50 bài tập hàm tài chính từ cơ bản đến phức tạp'
    ]
  },
  {
    title: 'Bảo Hiểm Nhân Thọ & An Sinh Xã Hội: Hiểu Đúng, Mua Trúng & Tối Ưu Quyền Lợi',
    slug: 'bao-hiem-nhan-tho-an-sinh-xa-hoi-hieu-dung-mua-trung',
    categorySlug: 'tai-chinh-ke-toan-va-dau-tu',
    level: CourseLevel.BEGINNER,
    price: 350000,
    oldPrice: 550000,
    leadSummary: 'Xóa bỏ những hoài nghi về bảo hiểm: Hiểu rõ bản chất chuyển giao rủi ro, đọc hiểu hợp đồng bảo hiểm nhân thọ, tránh bẫy tư vấn sai và tối ưu chế độ bảo hiểm xã hội (BHXH).',
    industryContext: 'Bảo hiểm là trụ cột bảo vệ nền tảng tài chính trước những biến cố sức khỏe; nhưng việc thiếu hiểu biết khiến nhiều người mua sai sản phẩm dẫn đến tranh chấp đáng tiếc.',
    coreTopics: [
      'Bản chất thực sự của bảo hiểm: Chuyển giao rủi ro chứ không phải kênh làm giàu hay đầu tư sinh lời cao',
      'Giải phẫu hợp đồng bảo hiểm nhân thọ: Phí cơ bản, Giá trị hoàn lại, Sản phẩm bổ trợ sức khỏe, Các điều khoản loại trừ',
      'Nguyên tắc kê khai y tế trung thực tuyệt đối (Utmost Good Faith) để không bị từ chối bồi thường',
      'Tính toán số tiền bảo hiểm phù hợp: Phương pháp DIME (Nợ nần, Thu nhập, Thế chấp, Giáo dục con cái)',
      'Quyền lợi chế độ Bảo hiểm Xã hội (BHXH) và Bảo hiểm Y tế (BHYT) của Nhà nước: Ốm đau, Thai sản, Hưu trí và Tử tuất'
    ],
    handsOnProject: 'Thực hành đọc và bóc tách các điều khoản quyền lợi và điều khoản loại trừ của một hợp đồng bảo hiểm nhân thọ thực tế trên thị trường.',
    targetAudience: 'Người trụ cột gia đình đang cân nhắc mua bảo hiểm, khách hàng đã có hợp đồng bảo hiểm muốn kiểm tra lại quyền lợi.',
    careerApplication: 'Tự tin ra quyết định tài chính bảo vệ gia đình mà không bị các đại lý tư vấn thao túng tâm lý.',
    requirements: [
      'Không đòi hỏi kiến thức chuyên môn về luật hay tài chính',
      'Mong muốn bảo vệ sự an toàn tài chính cho những người thân yêu'
    ],
    benefits: [
      'Biết cách đọc hợp đồng bảo hiểm để tự bảo vệ quyền lợi chính đáng của mình khi có sự kiện bảo hiểm xảy ra',
      'Không bị lãng phí tiền bạc vào các gói bảo hiểm liên kết đầu tư rườm rà không đúng nhu cầu thực tế',
      'Tính toán chính xác số tiền bảo vệ cần thiết cho người trụ cột kinh tế trong gia đình',
      'Khai thác tối đa các quyền lợi thai sản, ốm đau từ chính sách Bảo hiểm Xã hội bắt buộc'
    ],
    techniques: ['Life Insurance', 'Risk Transfer', 'DIME Method', 'Social Security', 'Health Insurance', 'Insurance Claims'],
    documents: [
      'Checklist 15 câu hỏi bẫy cần chất vấn đại lý bảo hiểm trước khi đặt bút ký hợp đồng',
      'Bảng so sánh chi tiết các quyền lợi bảo hiểm y tế công và bảo hiểm sức khỏe tư nhân'
    ]
  },
  {
    title: 'Kế Toán Thuế Thực Chiến: Kê Khai Thuế GTGT, TNCN & TNDN Chuẩn Pháp Luật',
    slug: 'ke-toan-thue-thuc-chien-ke-khai-gtgt-tncn-tndn',
    categorySlug: 'tai-chinh-ke-toan-va-dau-tu',
    level: CourseLevel.INTERMEDIATE,
    price: 690000,
    oldPrice: 1050000,
    leadSummary: 'Làm chủ các sắc thuế doanh nghiệp quan trọng nhất: Hướng dẫn kê khai thuế GTGT hàng quý, quyết toán thuế Thu nhập cá nhân (TNCN) và xác định chi phí được trừ khi tính thuế TNDN.',
    industryContext: 'Sai phạm về thuế có thể khiến doanh nghiệp bị truy thu và phạt chậm nộp hàng trăm triệu đến hàng tỷ đồng; một kế toán thuế giỏi là lá chắn bảo vệ an toàn pháp lý cho công ty.',
    coreTopics: [
      'Tổng quan hệ thống thuế Việt Nam và phần mềm hỗ trợ kê khai HTKK mới nhất',
      'Kế toán thuế Giá trị gia tăng (GTGT): Phân biệt thuế suất 0%, 5%, 8%, 10%, Khấu trừ thuế GTGT đầu vào và xử lý hóa đơn điều chỉnh',
      'Kế toán thuế Thu nhập cá nhân (TNCN): Giảm trừ gia cảnh, Biểu thuế lũy tiến từng phần và Quyết toán thuế cuối năm',
      'Thuế Thu nhập doanh nghiệp (TNDN): Xác định doanh thu tính thuế, 30 khoản chi phí không được trừ theo quy định pháp luật',
      'Lập Tờ khai quyết toán thuế TNDN mẫu 03/TNDN và kỹ năng giải trình số liệu khi cơ quan thuế thanh tra'
    ],
    handsOnProject: 'Thực hành lập tờ khai thuế GTGT quý, tính bảng lương khấu trừ thuế TNCN và lập tờ khai quyết toán thuế TNDN năm cho một doanh nghiệp thương mại dịch vụ.',
    targetAudience: 'Kế toán viên muốn nâng cao nghiệp vụ thuế, Kế toán tổng hợp, Chủ doanh nghiệp muốn kiểm soát rủi ro thuế.',
    careerApplication: 'Tự tin đảm nhận vị trí Chuyên viên kế toán thuế hoặc nhận dịch vụ làm báo cáo thuế cho các công ty khởi nghiệp.',
    requirements: [
      'Đã có kiến thức nền tảng về kế toán doanh nghiệp và định khoản',
      'Có máy tính cài đặt phần mềm HTKK và ứng dụng văn phòng Excel'
    ],
    benefits: [
      'Sử dụng thành thạo phần mềm HTKK để nộp tờ khai thuế điện tử đúng hạn',
      'Phân biệt rành mạch giữa chi phí kế toán và chi phí hợp lý hợp lệ được trừ khi tính thuế TNDN',
      'Tối ưu hóa số thuế phải nộp cho doanh nghiệp một cách hợp pháp, an toàn (Tax Planning)',
      'Tự tin tiếp đón và giải trình số liệu rõ ràng với đoàn kiểm tra thuế'
    ],
    techniques: ['Tax Accounting', 'VAT Declaration', 'Corporate Income Tax', 'Personal Income Tax', 'HTKK Software', 'Tax Compliance'],
    documents: [
      'Cẩm nang 30 khoản chi phí không được trừ khi tính thuế TNDN kèm căn cứ pháp lý Thông tư 96/2015',
      'Bộ hồ sơ khai thuế mẫu trọn gói cho một quý hoạt động của doanh nghiệp'
    ]
  },
  {
    title: 'Kế Toán Quản Trị & Phân Tích Giá Thành Sản Phẩm (Cost & Managerial Accounting)',
    slug: 'ke-toan-quan-tri-phan-tich-gia-thanh-san-pham',
    categorySlug: 'tai-chinh-ke-toan-va-dau-tu',
    level: CourseLevel.INTERMEDIATE,
    price: 650000,
    oldPrice: 990000,
    leadSummary: 'Cung cấp thông tin tài chính phục vụ nội bộ lãnh đạo ra quyết định: Phân loại chi phí biến đổi/cố định, tính giá thành sản phẩm và phân tích mối quan hệ Chi phí - Khối lượng - Lợi nhuận (CVP).',
    industryContext: 'Khác với kế toán tài chính phục vụ cơ quan nhà nước và ngân hàng, Kế toán quản trị hướng vào tương lai, giúp người điều hành biết rõ từng sản phẩm đang lãi hay lỗ thực sự.',
    coreTopics: [
      'Bản chất Kế toán quản trị: Phân biệt với Kế toán tài chính, phục vụ ra quyết định của ban giám đốc',
      'Phân loại chi phí: Chi phí định phí (Fixed Costs), Biến phí (Variable Costs), Chi phí trực tiếp và Gián tiếp',
      'Các phương pháp tính giá thành sản phẩm: Phương pháp giản đơn, Phương pháp hệ số, Phương pháp tỷ lệ và Tính giá thành theo đơn đặt hàng',
      'Phân tích mối quan hệ Chi phí - Khối lượng - Lợi nhuận (CVP Analysis): Biên an toàn (Margin of Safety) và Đòn bẩy kinh doanh',
      'Quyết định quản trị đặc biệt: Chấp nhận hay từ chối đơn hàng đặc biệt, Tự sản xuất hay Mua ngoài (Make or Buy)'
    ],
    handsOnProject: 'Xây dựng bảng tính giá thành chi tiết cho một xưởng sản xuất bánh kẹo và đưa ra phân tích khuyến nghị ban giám đốc nên tự đóng gói hay thuê gia công ngoài.',
    targetAudience: 'Kế toán trưởng, Kế toán quản trị, Giám đốc sản xuất, Quản lý tài chính tại các công ty sản xuất và dịch vụ.',
    careerApplication: 'Trở thành cánh tay phải của ban điều hành với khả năng tham mưu chiến lược định giá và cắt giảm chi phí.',
    requirements: [
      'Nắm vững nguyên lý kế toán tài chính và luân chuyển tài khoản chi phí (621, 622, 627, 154)',
      'Thành thạo kỹ năng tính toán trên Excel'
    ],
    benefits: [
      'Tính toán chính xác giá thành thực tế của từng đơn vị sản phẩm không bị sai lệch chi phí chung',
      'Chỉ ra chính xác sản phẩm nào đang là gà đẻ trứng vàng và sản phẩm nào đang âm thầm ăn mòn lợi nhuận',
      'Đưa ra các quyết định định giá bán tối ưu dựa trên biến phí trong giai đoạn thị trường khó khăn',
      'Giúp doanh nghiệp cắt giảm lãng phí chi phí sản xuất mà không làm suy giảm chất lượng sản phẩm'
    ],
    techniques: ['Managerial Accounting', 'Cost Accounting', 'CVP Analysis', 'Make or Buy Decision', 'Break-even Analysis', 'Pricing Strategy'],
    documents: [
      'Mẫu bảng tính phân bổ chi phí chung và tập hợp giá thành sản phẩm theo phương pháp hệ số',
      'Bảng mẫu phân tích quyết định Chấp nhận đơn hàng giá thấp trong ngắn hạn'
    ]
  },
  {
    title: 'Xây Dựng Mô Hình Tài Chính (Financial Modeling) Trên Excel Chuẩn Phố Wall',
    slug: 'xay-dung-mo-hinh-tai-chinh-financial-modeling-excel-pho-wall',
    categorySlug: 'tai-chinh-ke-toan-va-dau-tu',
    level: CourseLevel.INTERMEDIATE,
    price: 790000,
    oldPrice: 1250000,
    leadSummary: 'Làm chủ kỹ năng dựng mô hình tài chính 3 báo cáo liên kết (Three-Statement Model): Dự phóng doanh thu, lập bảng khấu hao, bảng vay nợ và kiểm tra cân bằng tự động.',
    industryContext: 'Mô hình tài chính là kỹ năng bắt buộc tại các ngân hàng đầu tư, quỹ đầu tư tư nhân (Private Equity) và phòng kế hoạch tài chính (FP&A) của các tập đoàn lớn.',
    coreTopics: [
      'Quy chuẩn thiết kế mô hình tài chính chuẩn quốc tế (FAST Standard): Định dạng màu sắc, Cấu trúc tách biệt giữa Giả định (Assumptions) và Tính toán',
      'Dự phóng Doanh thu và Chi phí: Phân tích các động lực tăng trưởng cốt lõi (Revenue Drivers & Cost Drivers)',
      'Xây dựng các bảng biểu hỗ trợ: Lịch trình khấu hao tài sản cố định (Depreciation Schedule) và Lịch trình trả nợ vay (Debt Schedule)',
      'Liên kết động giữa 3 báo cáo: Báo cáo kết quả kinh doanh (P&L), Bảng cân đối kế toán (Balance Sheet) và Báo cáo lưu chuyển tiền tệ (Cash Flow)',
      'Xử lý tham chiếu vòng (Circular Reference) khi tính toán chi phí lãi vay và số dư tiền mặt'
    ],
    handsOnProject: 'Xây dựng một mô hình tài chính 3 báo cáo liên kết hoàn chỉnh dự phóng 5 năm cho một công ty bán lẻ công nghệ niêm yết.',
    targetAudience: 'Chuyên viên phân tích tài chính (Financial Analyst), Nhân viên phân tích chứng khoán, Quản lý tài chính FP&A.',
    careerApplication: 'Đáp ứng toàn bộ bài test kỹ năng dựng mô hình tài chính khi ứng tuyển vào các quỹ đầu tư và tập đoàn tài chính đa quốc gia.',
    requirements: [
      'Thành thạo kỹ năng sử dụng Microsoft Excel không cần dùng chuột',
      'Hiểu sâu mối quan hệ hữu cơ giữa 3 báo cáo tài chính kế toán'
    ],
    benefits: [
      'Dựng mô hình tài chính chuyên nghiệp, mạch lạc, không bao giờ bị lỗi mất cân đối Bảng cân đối kế toán',
      'Thay đổi một giả định doanh thu có thể tự động cập nhật toàn bộ dòng tiền và lợi nhuận 5 năm tới',
      'Trình bày mô hình đẹp mắt theo đúng chuẩn mực thị giác của các chuyên gia phân tích phố Wall',
      'Tự tin kiểm tra và phản biện các mô hình tài chính do đối tác hoặc ngân hàng cung cấp'
    ],
    techniques: ['Financial Modeling', 'Three-Statement Model', 'FAST Standard', 'Debt Schedule', 'Depreciation Schedule', 'FP&A'],
    documents: [
      'Template mô hình tài chính 3 báo cáo liên kết chuẩn quốc tế được xây dựng sẵn cấu trúc',
      'Bảng quy chuẩn màu sắc và định dạng số trong mô hình tài chính chuyên nghiệp'
    ]
  },
  {
    title: 'Định Giá Doanh Nghiệp Chuyên Sâu: Phương Pháp Chiết Khấu Dòng Tiền (DCF) & Bội Số Thị Trường',
    slug: 'dinh-gia-doanh-nghiep-chuyen-sau-chiet-khau-dong-tien-dcf-boi-so',
    categorySlug: 'tai-chinh-ke-toan-va-dau-tu',
    level: CourseLevel.INTERMEDIATE,
    price: 850000,
    oldPrice: 1390000,
    leadSummary: 'Xác định giá trị nội tại thực sự của doanh nghiệp: Tính toán chi phí vốn bình quân WACC, dự phóng dòng tiền tự do FCFF/FCFE, giá trị kết thúc (Terminal Value) và định giá so sánh.',
    industryContext: 'Thị trường có thể định giá sai một cổ phiếu trong ngắn hạn vì tâm lý bầy đàn, nhưng trong dài hạn, giá cổ phiếu sẽ luôn hội tụ về giá trị nội tại thực sự của doanh nghiệp.',
    coreTopics: [
      'Khái niệm cốt lõi: Giá trị doanh nghiệp (Enterprise Value - EV) và Giá trị vốn chủ sở hữu (Equity Value)',
      'Tính toán Chi phí sử dụng vốn bình quân (WACC): Mô hình định giá tài sản vốn CAPM, Chi phí nợ sau thuế và Tỷ trọng vốn',
      'Dự phóng dòng tiền tự do: Dòng tiền tự do cho doanh nghiệp (FCFF) vs Dòng tiền tự do cho vốn chủ sở hữu (FCFE)',
      'Xác định Giá trị kết thúc (Terminal Value): Phương pháp tăng trưởng vĩnh viễn Gordon Growth Model và Phương pháp bội số thoát (Exit Multiple)',
      'Định giá so sánh thị trường (Relative Valuation): Bội số EV/EBITDA, EV/Sales, P/E và cách lựa chọn nhóm công ty tương đồng (Peer Group)'
    ],
    handsOnProject: 'Thực hiện định giá độc lập một doanh nghiệp logistics hàng đầu tại Việt Nam bằng phương pháp DCF kết hợp EV/EBITDA và viết báo cáo định giá 15 trang.',
    targetAudience: 'Chuyên viên phân tích đầu tư, Chuyên viên M&A, Giám đốc đầu tư, Nhà đầu tư giá trị chuyên nghiệp.',
    careerApplication: 'Đảm nhận trọng trách định giá tài sản trong các thương vụ mua bán sáp nhập và phát hành cổ phiếu ra công chúng.',
    requirements: [
      'Đã làm chủ kỹ năng lập mô hình tài chính trên Excel',
      'Kiến thức vững chắc về tài chính doanh nghiệp và thị trường chứng khoán'
    ],
    benefits: [
      'Tự tay xây dựng mô hình định giá DCF chuẩn mực được các ngân hàng đầu tư quốc tế công nhận',
      'Hiểu rõ sự nhạy cảm của giá trị định giá đối với các biến số chi phí vốn và tốc độ tăng trưởng dài hạn',
      'Không bị dao động trước những tin đồn và biến động ngắn hạn của bảng điện tử',
      'Đưa ra các mức giá chào mua hoặc chào bán hợp lý nhất trong các thương vụ đàm phán đầu tư'
    ],
    techniques: ['DCF Valuation', 'WACC', 'FCFF & FCFE', 'Gordon Growth Model', 'EV/EBITDA', 'Relative Valuation'],
    documents: [
      'File Excel mô hình định giá DCF hoàn chỉnh tích hợp phân tích độ nhạy (Sensitivity Table)',
      'Bảng tính chi phí vốn WACC chi tiết cho các ngành nghề trên thị trường chứng khoán Việt Nam'
    ]
  },
  {
    title: 'Đầu Tư Bất Động Sản Cá Nhân: Pháp Lý, Định Giá & Chiến Lược Tạo Dòng Tiền Thuê',
    slug: 'dau-tu-bat-dong-san-ca-nhan-phap-ly-dinh-gia-dong-tien',
    categorySlug: 'tai-chinh-ke-toan-va-dau-tu',
    level: CourseLevel.INTERMEDIATE,
    price: 690000,
    oldPrice: 1050000,
    leadSummary: 'Đầu tư bất động sản an toàn và sinh lời bền vững: Kiểm tra quy hoạch, thẩm định pháp lý sổ đỏ/hợp đồng mua bán, định giá so sánh và chiến lược xây căn hộ dịch vụ cho thuê.',
    industryContext: 'Bất động sản là kênh tích lũy tài sản truyền thống ưa thích của người Việt Nam; nhưng việc mua phải đất dính quy hoạch hoặc tranh chấp pháp lý có thể làm bạn mất trắng cơ nghiệp.',
    coreTopics: [
      'Các phân khúc bất động sản phổ biến: Đất nền vùng ven, Căn hộ chung cư, Nhà phố và Bất động sản dòng tiền (Căn hộ dịch vụ/Cho thuê)',
      'Kiểm tra pháp lý và quy hoạch bất động sản: Đọc thông tin trên Giấy chứng nhận quyền sử dụng đất (Sổ hồng), Tra cứu quy hoạch 1/500 và 1/2000',
      'Các phương pháp định giá bất động sản thực tế: Phương pháp so sánh giá thị trường, Phương pháp chi phí thay thế và Phương pháp dòng tiền vốn hóa',
      'Sử dụng đòn bẩy tài chính ngân hàng an toàn: Tỷ lệ vay nợ tối đa (DTI), Tính toán khả năng trả nợ gốc lãi hàng tháng',
      'Chiến lược cải tạo và khai thác dòng tiền cho thuê: Tăng tỷ suất sinh lời từ tiền thuê nhà (Rental Yield) đạt trên 6%/năm'
    ],
    handsOnProject: 'Thực hiện khảo sát thực tế, kiểm tra quy hoạch và lập bài toán tài chính đầu tư cho một căn nhà phố cũ chuyển đổi thành căn hộ dịch vụ 8 phòng cho thuê.',
    targetAudience: 'Nhà đầu tư cá nhân có số vốn tích lũy từ vài trăm triệu đến vài tỷ đồng muốn tìm kênh trú ẩn tài sản an toàn.',
    careerApplication: 'Tự tin ra quyết định mua bán bất động sản cho bản thân hoặc trở thành nhà đầu tư bất động sản chuyên nghiệp.',
    requirements: [
      'Quan tâm đến thị trường bất động sản và có định hướng tích lũy tài sản dài hạn',
      'Sẵn sàng dành thời gian đi khảo sát thực địa'
    ],
    benefits: [
      'Nhìn thấu mọi cạm bẫy pháp lý và quy hoạch treo trước khi quyết định đặt cọc mua bất động sản',
      'Không bao giờ bị mua đắt nhờ nắm vững các kỹ thuật thẩm định giá thị trường khu vực',
      'Tạo ra nguồn thu nhập thụ động đều đặn hàng tháng từ việc khai thác cho thuê',
      'Kiểm soát đòn bẩy vay nợ an toàn, không lo bị siết nợ khi ngân hàng tăng lãi suất'
    ],
    techniques: ['Real Estate Investing', 'Property Legal Check', 'Zoning Map 1/500', 'Rental Yield', 'Debt-to-Income (DTI)', 'Property Valuation'],
    documents: [
      'Checklist 20 bước kiểm tra pháp lý bắt buộc trước khi đặt cọc bất động sản',
      'Bảng tính Excel phân tích bài toán tài chính đầu tư bất động sản cho thuê (Dòng tiền và Lãi vốn)'
    ]
  },
  {
    title: 'Giao Dịch Thị Trường Phái Sinh (Derivatives & Hedging Strategies) Tại Việt Nam',
    slug: 'giao-dich-thi-truong-phai-sinh-derivatives-hedging-strategies',
    categorySlug: 'tai-chinh-ke-toan-va-dau-tu',
    level: CourseLevel.INTERMEDIATE,
    price: 650000,
    oldPrice: 990000,
    leadSummary: 'Làm chủ công cụ bảo hiểm rủi ro danh mục và kiếm lời hai chiều: Hợp đồng tương lai chỉ số VN30, cơ chế ký quỹ (Margin), giao dịch trong ngày (Day Trading) và quản trị tâm lý.',
    industryContext: 'Thị trường chứng khoán phái sinh cho phép nhà đầu tư kiếm được lợi nhuận ngay cả khi thị trường cơ sở lao dốc mạnh thông qua vị thế Bán khống (Short).',
    coreTopics: [
      'Khái niệm Hợp đồng tương lai (Futures Contract) và đặc thù của Hợp đồng tương lai chỉ số VN30 tại Việt Nam',
      'Cơ chế ký quỹ và đòn bẩy tài chính: Tỷ lệ ký quỹ ban đầu (IM), Ký quỹ duy trì (MM) và Hiện tượng giải chấp (Call Margin)',
      'Chiến lược phòng hộ rủi ro (Hedging Strategy): Sử dụng vị thế Short để bảo vệ danh mục cổ phiếu cơ sở khi thị trường sụt giảm',
      'Chiến lược giao dịch đầu cơ ngắn hạn (Day Trading / Scalping): Đọc biểu đồ khung thời gian nhỏ 1M, 5M, 15M và theo dõi dòng tiền lớn',
      'Kỷ luật thép trong giao dịch phái sinh: Đặt lệnh dừng lỗ (Stop Order) ngay khi mở vị thế để tránh cháy tài khoản'
    ],
    handsOnProject: 'Xây dựng một chiến lược Hedging bảo hiểm cho danh mục cổ phiếu cơ sở trị giá 1 tỷ đồng vượt qua đợt điều chỉnh giảm 15% của thị trường.',
    targetAudience: 'Nhà đầu tư chứng khoán có kinh nghiệm muốn tìm hiểu công cụ phái sinh để phòng hộ rủi ro hoặc kiếm lợi nhuận ngắn hạn.',
    careerApplication: 'Làm chủ công cụ tài chính bậc cao phục vụ giao dịch chuyên nghiệp và bảo toàn tài sản trong thị trường giá xuống (Bear Market).',
    requirements: [
      'Đã có kinh nghiệm đầu tư chứng khoán cơ sở tối thiểu 1 năm',
      'Có khả năng theo dõi bảng điện tử thường xuyên và chịu đựng được áp lực biến động mạnh'
    ],
    benefits: [
      'Không còn sợ hãi những đợt sụp đổ bất ngờ của thị trường nhờ công cụ phòng hộ phái sinh',
      'Kiếm được lợi nhuận trong cả xu hướng tăng (Long) và xu hướng giảm (Short)',
      'Hiểu rõ cơ chế tính lãi lỗ hàng ngày (Mark-to-Market) của Trung tâm lưu ký chứng khoán',
      'Rèn luyện kỷ luật quản trị rủi ro nghiêm ngặt, sống sót qua mọi cơn bão thị trường'
    ],
    techniques: ['Derivatives', 'VN30 Futures', 'Hedging', 'Day Trading', 'Margin Call', 'Mark-to-Market'],
    documents: [
      'Quy chế giao dịch và công thức tính tỷ lệ ký quỹ của thị trường phái sinh Việt Nam',
      'Nhật ký giao dịch phái sinh (Trading Journal) theo dõi hiệu suất và cảm xúc giao dịch'
    ]
  },
  {
    title: 'Quản Lý Danh Mục Đầu Tư Đa Tài Sản (Asset Allocation & Modern Portfolio Theory)',
    slug: 'quan-ly-danh-muc-dau-tu-da-tai-san-asset-allocation',
    categorySlug: 'tai-chinh-ke-toan-va-dau-tu',
    level: CourseLevel.INTERMEDIATE,
    price: 750000,
    oldPrice: 1190000,
    leadSummary: 'Ứng dụng Lý thuyết danh mục hiện đại của Harry Markowitz: Phân bổ vốn đa tài sản (Cổ phiếu, Trái phiếu, Vàng, Bất động sản, Tiền mặt) để tối đa hóa lợi nhuận với rủi ro thấp nhất.',
    industryContext: 'Hơn 90% biến động lợi nhuận của một danh mục đầu tư dài hạn đến từ quyết định phân bổ tài sản (Asset Allocation), chứ không phải do việc chọn từng cổ phiếu riêng lẻ.',
    coreTopics: [
      'Lý thuyết danh mục hiện đại (Modern Portfolio Theory - MPT) và Khái niệm Biên giới hiệu quả (Efficient Frontier)',
      'Mối tương quan giữa các lớp tài sản (Correlation): Kết hợp các tài sản có hệ số tương quan âm hoặc thấp để triệt tiêu rủi ro phi hệ thống',
      'Các mô hình phân bổ tài sản kinh điển: Danh mục All Weather của Ray Dalio, Danh mục Thường trực (Permanent Portfolio) của Harry Browne',
      'Chiến lược tái cân bằng danh mục định kỳ (Portfolio Rebalancing): Bán bớt tài sản tăng mạnh và mua thêm tài sản đang giảm giá để duy trì tỷ trọng',
      'Xác định khẩu vị rủi ro và xây dựng danh mục phù hợp theo từng độ tuổi và giai đoạn cuộc đời'
    ],
    handsOnProject: 'Thiết kế một danh mục đầu tư đa tài sản All Weather tối ưu cho một gia đình trẻ tại Việt Nam với mức lợi nhuận kỳ vọng 12%/năm và mức sụt giảm tối đa (Max Drawdown) dưới 8%.',
    targetAudience: 'Nhà đầu tư cá nhân có tài sản tích lũy muốn bảo toàn vốn và tăng trưởng ổn định, Chuyên viên tư vấn tài chính gia đình.',
    careerApplication: 'Tự tin quản lý khối tài sản lớn của bản thân và gia đình mà không cần phụ thuộc vào may rủi thị trường.',
    requirements: [
      'Hiểu biết tổng quan về các kênh đầu tư: Cổ phiếu, Trái phiếu, Tiết kiệm, Vàng',
      'Tư duy đầu tư dài hạn từ 5 đến 10 năm trở lên'
    ],
    benefits: [
      'Tạo ra danh mục đầu tư có khả năng chống chịu mọi điều kiện kinh tế: Lạm phát cao, Giảm phát, Tăng trưởng hay Suy thoái',
      'Giảm thiểu tối đa mức sụt giảm tài sản trong những năm khủng hoảng kinh tế toàn cầu',
      'Loại bỏ hoàn toàn cảm xúc lo lắng, hoang mang khi một kênh đầu tư đơn lẻ bị giảm giá',
      'Đạt được sự tăng trưởng tài sản bền vững theo cấp số nhân nhờ sức mạnh của lãi kép và sự ổn định'
    ],
    techniques: ['Asset Allocation', 'Modern Portfolio Theory', 'All Weather Portfolio', 'Portfolio Rebalancing', 'Efficient Frontier', 'Correlation Matrix'],
    documents: [
      'Bảng ma trận hệ số tương quan giữa các lớp tài sản tại thị trường Việt Nam trong 10 năm qua',
      'Bảng tính Excel tự động tính toán tỷ trọng tái cân bằng danh mục định kỳ'
    ]
  },
  {
    title: 'Tự Động Hóa Kế Toán & Phân Tích Tài Chính Với Python & Thư Viện Pandas',
    slug: 'tu-dong-hoa-ke-toan-phan-tich-tai-chinh-python-pandas',
    categorySlug: 'tai-chinh-ke-toan-va-dau-tu',
    level: CourseLevel.INTERMEDIATE,
    price: 790000,
    oldPrice: 1250000,
    leadSummary: 'Nâng cấp kỹ năng tài chính với sức mạnh lập trình Python: Tự động hóa đối chiếu sổ phụ ngân hàng, trích xuất dữ liệu báo cáo tài chính hàng loạt và vẽ biểu đồ phân tích chuyên sâu.',
    industryContext: 'Thời đại của những kế toán viên chỉ biết gõ phím thủ công đã qua; sự kết hợp giữa kiến thức tài chính sâu rộng và kỹ năng lập trình Python tạo nên những chuyên gia tài chính thế hệ mới không thể thay thế.',
    coreTopics: [
      'Cú pháp Python cơ bản dành riêng cho dân tài chính kế toán: Biến, Danh sách, Từ điển và Vòng lặp',
      'Làm việc với bảng tính Excel và CSV bằng thư viện Pandas: Đọc, Lọc, Gộp dữ liệu và Xử lý giá trị trống',
      'Tự động hóa đối chiếu số liệu (Bank Reconciliation): So khớp tự động giữa Sổ cái tiền gửi và Sổ phụ ngân hàng',
      'Thu thập dữ liệu chứng khoán tự động qua API và cào dữ liệu (Web Scraping) báo cáo tài chính từ Cafef/Vietstock',
      'Trực quan hóa chỉ số tài chính chuyên nghiệp với thư viện Matplotlib và Seaborn'
    ],
    handsOnProject: 'Viết một kịch bản Python tự động tải báo cáo tài chính của 30 công ty ngành thép trong 5 năm, tính toán các chỉ số biên lợi nhuận và xuất ra file Excel so sánh tự động.',
    targetAudience: 'Kế toán viên, Chuyên viên phân tích tài chính muốn bứt phá khỏi các tác vụ thủ công lặp đi lặp lại hàng ngày.',
    careerApplication: 'Trở thành Financial Data Analyst tiên phong với mức đãi ngộ vượt trội trong ngành tài chính.',
    requirements: [
      'Đã nắm vững các khái niệm tài chính kế toán cơ bản',
      'Không yêu cầu kinh nghiệm lập trình trước đó (khóa học hướng dẫn từ con số 0)'
    ],
    benefits: [
      'Tiết kiệm hàng tuần làm việc thủ công mỗi mùa lập báo cáo tài chính nhờ các kịch bản chạy tự động trong 30 giây',
      'Đối chiếu hàng chục nghìn giao dịch ngân hàng mà không lo bỏ sót hay sai lệch số liệu',
      'Tự động thu thập và cập nhật giá cổ phiếu, tỷ giá ngoại tệ theo thời gian thực vào bảng phân tích',
      'Mở rộng cơ hội nghề nghiệp sang các mảng công nghệ tài chính (Fintech) đầy tiềm năng'
    ],
    techniques: ['Python for Finance', 'Pandas', 'Bank Reconciliation', 'Financial Data Scraping', 'Matplotlib', 'Process Automation'],
    documents: [
      'Bộ mã nguồn mẫu Python hoàn chỉnh cho các bài toán đối chiếu kế toán thông dụng',
      'Hướng dẫn cài đặt môi trường Anaconda và Jupyter Notebook phục vụ phân tích tài chính'
    ]
  },
  {
    title: 'Quản Trị Vốn Lưu Động & Dòng Tiền Doanh Nghiệp (Working Capital & Treasury Management)',
    slug: 'quan-tri-von-luu-dong-dong-tien-doanh-nghiep-treasury',
    categorySlug: 'tai-chinh-ke-toan-va-dau-tu',
    level: CourseLevel.ADVANCED,
    price: 890000,
    oldPrice: 1450000,
    leadSummary: 'Tối ưu hóa huyết mạch của doanh nghiệp: Rút ngắn chu kỳ chuyển đổi tiền mặt (Cash Conversion Cycle), quản lý khoản phải thu, hàng tồn kho và chiến lược tài trợ vốn lưu động.',
    industryContext: 'Lợi nhuận là quan điểm, còn tiền mặt là sự thật; nhiều doanh nghiệp phá sản ngay trên đỉnh cao lợi nhuận chỉ vì cạn kiệt vốn lưu động trong chu kỳ thanh toán.',
    coreTopics: [
      'Chu kỳ chuyển đổi tiền mặt (Cash Conversion Cycle - CCC): Số ngày thu tiền bình quân (DSO), Số ngày tồn kho (DIO) và Số ngày trả tiền người bán (DPO)',
      'Chiến lược tối ưu hóa vốn lưu động: Giảm thiểu tiền mặt bị chôn chân trong kho hàng và công nợ khách hàng',
      'Quản trị khoản phải thu khách hàng: Xây dựng chính sách tín dụng thương mại, Hạn mức công nợ và Phòng ngừa nợ xấu',
      'Quản trị kho vận dưới góc độ tài chính: Mô hình đặt hàng kinh tế (EOQ - Economic Order Quantity) và Hàng tồn kho an toàn',
      'Kỹ thuật dự báo dòng tiền ngắn hạn và trung hạn phục vụ điều phối thanh toán nội bộ công ty'
    ],
    handsOnProject: 'Thực hiện tái cấu trúc vốn lưu động cho một công ty phân phối hàng tiêu dùng giúp rút ngắn chu kỳ chuyển đổi tiền từ 75 ngày xuống 45 ngày, giải phóng 20 tỷ đồng tiền mặt.',
    targetAudience: 'Giám đốc tài chính (CFO), Kế toán trưởng, Quản lý nguồn vốn (Treasury Manager), Chủ doanh nghiệp.',
    careerApplication: 'Đảm nhận vai trò giám đốc tài chính chuyên nghiệp có khả năng kiểm soát tuyệt đối huyết mạch tiền mặt của tập đoàn.',
    requirements: [
      'Tối thiểu 3 năm kinh nghiệm trong công tác kế toán hoặc quản lý tài chính doanh nghiệp',
      'Hiểu rõ hoạt động luân chuyển vốn trong chuỗi cung ứng'
    ],
    benefits: [
      'Giải phóng hàng chục tỷ đồng tiền mặt đang bị mắc kẹt vô ích trong hàng tồn kho và công nợ',
      'Giảm bớt sự phụ thuộc vào các khoản vay thấu chi lãi suất cao từ ngân hàng thương mại',
      'Thiết lập hệ thống dự báo dòng tiền chính xác giúp ban giám đốc chủ động kế hoạch chi trả',
      'Xây dựng các chính sách bán hàng linh hoạt vừa khuyến khích mua hàng vừa bảo đảm thu hồi nợ an toàn'
    ],
    techniques: ['Working Capital Management', 'Cash Conversion Cycle (CCC)', 'Treasury Management', 'DSO & DPO', 'EOQ Model', 'Cash Forecasting'],
    documents: [
      'Bảng tính Excel tự động tính toán các chỉ số CCC, DSO, DPO, DIO từ báo cáo tài chính',
      'Mẫu quy chế quản lý công nợ và quy trình xử lý nợ quá hạn chuyên nghiệp'
    ]
  },
  {
    title: 'Kiểm Toán Báo Cáo Tài Chính & Soát Xét Rủi Ro Sai Sót Trọng Yếu Chuẩn Quốc Tế',
    slug: 'kiem-toan-bao-cao-tai-chinh-soat-xet-rui-ro-chuan-quoc-te',
    categorySlug: 'tai-chinh-ke-toan-va-dau-tu',
    level: CourseLevel.ADVANCED,
    price: 990000,
    oldPrice: 1590000,
    leadSummary: 'Làm chủ quy trình kiểm toán độc lập chuẩn mực quốc tế ISA / VSA: Đánh giá hệ thống kiểm soát nội bộ, xác định mức trọng yếu (Materiality) và các thử nghiệm cơ bản phát hiện gian lận.',
    industryContext: 'Báo cáo kiểm toán là chứng thư bảo đảm độ tin cậy của thông tin tài chính trước các nhà đầu tư và xã hội; nghề kiểm toán là cái nôi tôi luyện những chuyên gia tài chính xuất sắc nhất.',
    coreTopics: [
      'Khuôn khổ chuẩn mực kiểm toán quốc tế (ISA) và Chuẩn mực kiểm toán Việt Nam (VSA)',
      'Quy trình kiểm toán 3 giai đoạn: Lập kế hoạch kiểm toán, Thực hiện kiểm toán tại hiện trường và Hoàn thành phát hành báo cáo',
      'Xác định mức trọng yếu tổng thể (Overall Materiality) và mức trọng yếu thực hiện (Performance Materiality)',
      'Thử nghiệm kiểm soát (Tests of Controls) và Thử nghiệm cơ bản (Substantive Procedures): Thủ tục phân tích và Kiểm tra chi tiết',
      'Nhận diện các dấu hiệu gian lận báo cáo tài chính (Financial Statement Fraud) theo Tam giác gian lận (Fraud Triangle)'
    ],
    handsOnProject: 'Thực hiện cuộc kiểm toán giả định cho phân hệ Chu trình Bán hàng - Thu tiền của một doanh nghiệp niêm yết, phát hiện 3 sai sót trọng yếu và phát hành thư quản lý.',
    targetAudience: 'Trợ lý kiểm toán tại các công ty kiểm toán độc lập, Kiểm toán viên nội bộ, Kế toán trưởng muốn chuẩn bị tốt cho mùa kiểm toán.',
    careerApplication: 'Thăng tiến lên các vị trí Trưởng nhóm kiểm toán (Audit Senior) hoặc Kiểm toán trưởng (Audit Manager).',
    requirements: [
      'Nắm vững toàn diện hệ thống chuẩn mực kế toán doanh nghiệp',
      'Tư duy hoài nghi nghề nghiệp (Professional Skepticism) và tính bảo mật cao'
    ],
    benefits: [
      'Làm chủ phương pháp chọn mẫu kiểm toán khoa học bảo đảm tính đại diện của tổng thể',
      'Phát hiện nhanh chóng các thủ thuật làm đẹp số liệu tài chính hoặc che giấu chi phí của doanh nghiệp',
      'Soạn thảo hồ sơ kiểm toán (Audit Working Papers) chuẩn mực đáp ứng yêu cầu soát xét chất lượng',
      'Đưa ra các khuyến nghị cải thiện kiểm soát nội bộ có giá trị thiết thực cho ban điều hành'
    ],
    techniques: ['Financial Audit', 'ISA/VSA Standards', 'Audit Materiality', 'Substantive Testing', 'Fraud Detection', 'Internal Controls'],
    documents: [
      'Bộ hồ sơ mẫu giấy làm việc kiểm toán (Audit Working Papers) cho các chu trình nghiệp vụ chính',
      'Bảng câu hỏi đánh giá hệ thống kiểm soát nội bộ doanh nghiệp chuẩn COSO'
    ]
  },
  {
    title: 'Giao Dịch Thuật Toán (Algorithmic Trading) & Backtest Chiến Lược Với Python',
    slug: 'giao-dich-thuat-toan-algorithmic-trading-backtest-python',
    categorySlug: 'tai-chinh-ke-toan-va-dau-tu',
    level: CourseLevel.ADVANCED,
    price: 1150000,
    oldPrice: 1790000,
    leadSummary: 'Loại bỏ hoàn toàn yếu tố cảm xúc bằng giao dịch tự động: Lập trình bot giao dịch, xây dựng các chiến lược định lượng (Mean Reversion, Trend Following) và kiểm thử dữ liệu quá khứ (Backtesting).',
    industryContext: 'Hơn 70% khối lượng giao dịch trên các thị trường tài chính phát triển ngày nay được thực hiện tự động bởi các thuật toán máy tính (Algo-trading).',
    coreTopics: [
      'Kiến trúc một hệ thống giao dịch thuật toán hoàn chỉnh: Thu thập dữ liệu thời gian thực, Xử lý tín hiệu, Quản lý vị thế và Khớp lệnh tự động',
      'Lập trình chiến lược giao dịch định lượng: Giao dịch theo xu hướng (Trend Following), Giao dịch đảo chiều trung bình (Mean Reversion) và Chênh lệch giá (Arbitrage)',
      'Khung kiểm thử chiến lược (Backtesting Framework) với Backtrader và VectorBT: Tránh bẫy nhìn thấy trước tương lai (Lookahead Bias) và Quá khớp dữ liệu (Overfitting)',
      'Đánh giá hiệu suất chiến lược giao dịch: Hệ số Sharpe, Hệ số Sortino, Tỷ lệ sụt giảm tối đa (Maximum Drawdown) và Tỷ lệ thắng (Win Rate)',
      'Kết nối API trực tiếp với sàn giao dịch để tự động hóa việc đặt lệnh mua bán 24/7'
    ],
    handsOnProject: 'Xây dựng một con bot giao dịch thuật toán hoàn chỉnh bằng Python thực thi chiến lược giao thoa đường MA đa khung thời gian kết hợp quản trị vốn tự động.',
    targetAudience: 'Nhà giao dịch định lượng (Quant Trader), Kỹ sư phần mềm đam mê thị trường tài chính, Nhà đầu tư muốn tự động hóa chiến lược.',
    careerApplication: 'Mở ra cơ hội ứng tuyển vào các quỹ đầu tư định lượng (Quantitative Hedge Funds) hoặc vận hành quỹ giao dịch cá nhân độc lập.',
    requirements: [
      'Thành thạo lập trình Python và xử lý dữ liệu với Pandas/NumPy',
      'Hiểu biết sâu sắc về các công cụ phân tích kỹ thuật và thị trường tài chính'
    ],
    benefits: [
      'Kiểm thử khách quan tính hiệu quả thực sự của một ý tưởng giao dịch trên dữ liệu lịch sử 10 năm chỉ trong 10 giây',
      'Loại bỏ hoàn toàn các lỗi tâm lý chí mạng như tiếc nuối, chần chừ hay tham lam khi ra quyết định',
      'Tự động hóa hoàn toàn việc giám sát thị trường và khớp lệnh ngay cả khi bạn đang ngủ',
      'Xây dựng các tiêu chuẩn bảo vệ vốn nghiêm ngặt được thực thi tự động bằng mã code'
    ],
    techniques: ['Algorithmic Trading', 'Backtesting', 'Quantitative Finance', 'Backtrader', 'Sharpe Ratio', 'API Trading'],
    documents: [
      'Mã nguồn hoàn chỉnh khung Backtesting chuyên nghiệp bằng thư viện Python VectorBT',
      'Bộ dữ liệu lịch sử giá nến 5 phút chuẩn xác phục vụ việc kiểm thử chiến lược'
    ]
  },
  {
    title: 'Chiến Lược Tài Chính Doanh Nghiệp Cấp Cao (Advanced Corporate Finance) Cho CFO',
    slug: 'chien-luoc-tai-chinh-doanh-nghiep-cap-cao-cfo',
    categorySlug: 'tai-chinh-ke-toan-va-dau-tu',
    level: CourseLevel.ADVANCED,
    price: 1250000,
    oldPrice: 1990000,
    leadSummary: 'Đồng hành cùng Tổng giám đốc định hình tương lai công ty: Cấu trúc vốn tối ưu (Optimal Capital Structure), chính sách cổ tức, quản trị quan hệ ngân hàng và chiến lược phòng ngừa rủi ro tỷ giá.',
    industryContext: 'Vai trò của Giám đốc tài chính (CFO) ngày nay đã vượt xa việc quản lý sổ sách kế toán để trở thành một nhà kiến trúc tài chính kiến tạo giá trị thặng dư cho cổ đông.',
    coreTopics: [
      'Lý thuyết cấu trúc vốn tối ưu của Modigliani-Miller và Trade-off Theory: Cân bằng giữa Lá chắn thuế từ nợ vay và Chi phí khốn cùng tài chính',
      'Hoạch định ngân sách vốn đầu tư dài hạn (Capital Budgeting): Lựa chọn dự án tối ưu bằng phương pháp NPV, IRR và Chỉ số sinh lời PI',
      'Chiến lược chính sách cổ tức: Trả cổ tức bằng tiền mặt, Cổ tức bằng cổ phiếu hay Mua lại cổ phiếu quỹ (Share Buyback)',
      'Quản trị rủi ro tài chính vĩ mô: Phòng hộ rủi ro biến động tỷ giá hối đoái và rủi ro lãi suất bằng các hợp đồng kỳ hạn (Forwards) và quyền chọn (Options)',
      'Nghệ thuật đàm phán hạn mức tín dụng dự án lớn với các ngân hàng thương mại và tổ chức tín dụng quốc tế'
    ],
    handsOnProject: 'Xây dựng một bản Đề án cấu trúc vốn và phương án tài trợ vốn 500 tỷ đồng cho dự án xây dựng nhà máy sản xuất mới của tập đoàn.',
    targetAudience: 'Giám đốc tài chính (CFO), Giám đốc kế hoạch đầu tư, Kế toán trưởng chuẩn bị thăng tiến lên CFO, Thành viên HĐQT.',
    careerApplication: 'Khẳng định vị thế lãnh đạo tài chính cấp cao dẫn dắt các quyết định phân bổ nguồn vốn hàng trăm tỷ đồng của doanh nghiệp.',
    requirements: [
      'Tối thiểu 5 năm kinh nghiệm quản trị tài chính doanh nghiệp',
      'Tư duy tài chính chiến lược và tầm nhìn vĩ mô sâu rộng'
    ],
    benefits: [
      'Thiết lập tỷ lệ nợ trên vốn chủ sở hữu hoàn hảo giúp tối đa hóa giá trị doanh nghiệp với chi phí vốn thấp nhất',
      'Lựa chọn đúng các dự án đầu tư chiến lược mang lại giá trị gia tăng thực sự cho các cổ đông',
      'Bảo vệ lợi nhuận công ty an toàn trước những biến động khó lường của tỷ giá ngoại tệ và lãi suất',
      'Tạo dựng vị thế đối tác uy tín cao trong mắt các ngân hàng thương mại lớn'
    ],
    techniques: ['Corporate Finance', 'Capital Structure', 'Capital Budgeting', 'Dividend Policy', 'FX Hedging', 'WACC Optimization'],
    documents: [
      'Mẫu tờ trình phê duyệt chủ trương đầu tư dự án và phương án thu xếp vốn ngân hàng',
      'Bảng tính mô phỏng tác động của đòn bẩy nợ lên thu nhập trên mỗi cổ phần (EPS) và rủi ro tài chính'
    ]
  },

  // ==========================================
  // CAT-14: Quản lý dự án & Phương pháp Agile (16 courses)
  // Quota: 5 BEGINNER, 7 INTERMEDIATE, 4 ADVANCED | 2 FREE, 14 PAID
  // ==========================================
  {
    title: 'Nhập Môn Quản Lý Dự Án: Bộ Khung Kinh Điển PMBOK & Vòng Đời Dự Án',
    slug: 'nhap-mon-quan-ly-du-an-pmbok-vong-doi-du-an',
    categorySlug: 'quan-ly-du-an-va-van-hanh',
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0,
    leadSummary: 'Khám phá thế giới quản lý dự án chuyên nghiệp: Nắm vững tam giác ràng buộc (Phạm vi, Thời gian, Chi phí), 5 nhóm quy trình và 10 lĩnh vực kiến thức theo chuẩn PMI.',
    industryContext: 'Hơn 70% các sáng kiến chiến lược trong doanh nghiệp được triển khai dưới dạng các dự án; năng lực quản lý dự án giúp bạn biến ý tưởng trên giấy thành hiện thực đúng hẹn.',
    coreTopics: [
      'Dự án là gì: Phân biệt giữa Hoạt động dự án (Tạm thời, Tạo ra kết quả độc nhất) và Hoạt động vận hành (Lặp đi lặp lại)',
      'Tam giác sắt quản lý dự án (Triple Constraints): Cân bằng giữa Phạm vi (Scope), Thời gian (Time) và Chi phí (Cost)',
      'Năm nhóm quy trình dự án: Khởi tạo (Initiating), Lập kế hoạch (Planning), Thực thi (Executing), Giám sát & Kiểm soát (Monitoring & Controlling) và Đóng dự án (Closing)',
      'Soạn thảo Hiến chương dự án (Project Charter): Xác lập mục tiêu, Quyền hạn của Quản lý dự án và Phê duyệt của Nhà tài trợ',
      'Xác định và phân tích các bên liên quan trọng yếu (Stakeholder Analysis)'
    ],
    handsOnProject: 'Soạn thảo bản Hiến chương dự án (Project Charter) hoàn chỉnh cho một dự án triển khai hệ thống phần mềm chấm công mới cho công ty 200 nhân sự.',
    targetAudience: 'Người mới bắt đầu làm quen với quản lý dự án, Thành viên nhóm dự án, Kỹ sư muốn chuyển hướng sang vị trí Project Manager.',
    careerApplication: 'Đặt nền móng kiến thức chuẩn quốc tế để bắt đầu lộ trình trở thành Chuyên viên quản lý dự án chuyên nghiệp.',
    requirements: [
      'Không yêu cầu kinh nghiệm quản lý dự án trước đó',
      'Có mong muốn rèn luyện kỹ năng làm việc khoa học và có kế hoạch'
    ],
    benefits: [
      'Hiểu rõ bức tranh toàn cảnh về cách thức khởi động và vận hành một dự án từ đầu đến cuối',
      'Biết cách cân bằng các áp lực về tiến độ, chất lượng và ngân sách được giao',
      'Soạn thảo văn bản Hiến chương dự án rõ ràng giúp xác lập sự đồng thuận ngay từ ngày đầu',
      'Giao tiếp hiệu quả và quản lý kỳ vọng của các bên liên quan trong dự án'
    ],
    techniques: ['Project Management', 'PMBOK', 'Project Charter', 'Triple Constraints', 'Stakeholder Management', 'Project Lifecycle'],
    documents: [
      'Mẫu Hiến chương dự án (Project Charter Template) chuẩn mực quốc tế',
      'Bảng ma trận phân tích quyền lực và mức độ quan tâm của các bên liên quan (Power/Interest Grid)'
    ]
  },
  {
    title: 'Quản Lý Công Việc & Dự Án Tinh Gọn Với Phương Pháp Kanban & Trello/Jira',
    slug: 'quan-ly-cong-viec-du-an-tinh-gon-kanban-trello-jira',
    categorySlug: 'quan-ly-du-an-va-van-hanh',
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0,
    leadSummary: 'Trực quan hóa luồng công việc để tối ưu năng suất: Áp dụng phương pháp Kanban của Toyota, giới hạn công việc đang xử lý (WIP Limits) và quản lý bảng công việc trên Trello và Jira.',
    industryContext: 'Kanban là phương pháp quản lý trực quan đơn giản nhưng cực kỳ mạnh mẽ giúp các nhóm làm việc phát hiện điểm nghẽn tức thì và duy trì nhịp độ làm việc bền bỉ.',
    coreTopics: [
      'Bản chất của phương pháp Kanban: Trực quan hóa dòng chảy công việc (Workflow) và nguyên tắc kéo (Pull System)',
      'Thiết lập cấu trúc bảng Kanban cơ bản: Việc cần làm (To Do), Đang làm (In Progress) và Hoàn thành (Done)',
      'Tầm quan trọng sống còn của Giới hạn công việc đang thực hiện (WIP - Work In Progress Limits)',
      'Đo lường hiệu suất Kanban: Thời gian hoàn tất (Lead Time), Thời gian chu kỳ (Cycle Time) và Biểu đồ dòng chảy tích lũy (CFD)',
      'Thực hành thiết lập và cấu hình bảng công việc chuyên nghiệp trên công cụ Trello và Atlassian Jira'
    ],
    handsOnProject: 'Thiết kế và cấu hình một bảng Kanban chuẩn hóa trên Jira/Trello cho một nhóm tiếp thị 6 người kèm theo quy tắc WIP Limits nghiêm ngặt.',
    targetAudience: 'Nhân viên văn phòng, Trưởng nhóm nhỏ, Freelancer hoặc bất kỳ ai muốn tổ chức công việc cá nhân và tập thể khoa học.',
    careerApplication: 'Nâng cao năng suất làm việc nhóm, loại bỏ sự chồng chéo và chậm trễ công việc thường nhật.',
    requirements: [
      'Có máy tính kết nối Internet để đăng ký tài khoản miễn phí trên Trello hoặc Jira Cloud',
      'Mong muốn cải thiện trật tự và hiệu suất làm việc hàng ngày'
    ],
    benefits: [
      'Nhìn thấu trạng thái công việc của từng thành viên trong nhóm chỉ qua một cái nhìn lên màn hình',
      'Chấm dứt tình trạng quá tải và đa nhiệm kém hiệu quả nhờ quy định giới hạn số việc làm cùng lúc',
      'Phát hiện ngay lập tức các khâu đang bị ùn tắc để kịp thời hỗ trợ đồng đội giải tỏa',
      'Rút ngắn thời gian từ lúc nhận yêu cầu đến khi bàn giao kết quả cho khách hàng'
    ],
    techniques: ['Kanban', 'Trello', 'Jira Work Management', 'WIP Limits', 'Cycle Time', 'Workflow Visualization'],
    documents: [
      'Bản đồ quy chuẩn các trạng thái thẻ công việc trên bảng Kanban',
      'Checklist các nguyên tắc vận hành buổi họp đứng Kanban hàng ngày (Daily Standup)'
    ]
  },
  {
    title: 'Lập Kế Hoạch & Kiểm Soát Tiến Độ Dự Án Với Sơ Đồ Gantt & Microsoft Project',
    slug: 'lap-ke-hoach-kiem-soat-tien-do-du-an-gantt-microsoft-project',
    categorySlug: 'quan-ly-du-an-va-van-hanh',
    level: CourseLevel.BEGINNER,
    price: 399000,
    oldPrice: 650000,
    leadSummary: 'Làm chủ công cụ lập kế hoạch kinh điển: Bóc tách cấu trúc công việc (WBS), xác định mối quan hệ phụ thuộc, tìm đường găng (Critical Path) và vẽ sơ đồ Gantt trên Microsoft Project.',
    industryContext: 'Dự án chậm tiến độ là cơn ác mộng phổ biến nhất; việc làm chủ kỹ thuật lập đường găng và sơ đồ tiến độ Gantt giúp bạn kiểm soát từng ngày từng giờ của dự án.',
    coreTopics: [
      'Phân rã cấu trúc công việc WBS (Work Breakdown Structure): Nguyên tắc 100% và gói công việc (Work Packages)',
      'Xác định mối quan hệ phụ thuộc giữa các đầu việc: Finish-to-Start (FS), Start-to-Start (SS), Độ trễ (Lag) và Độ dồn (Lead)',
      'Kỹ thuật phân tích Đường găng (Critical Path Method - CPM): Nhận diện các chuỗi công việc quyết định ngày kết thúc dự án',
      'Lập sơ đồ tiến độ Gantt Chart chuyên nghiệp trên phần mềm Microsoft Project',
      'Đóng băng đường cơ sở (Baseline) và theo dõi độ lệch tiến độ thực tế so với kế hoạch ban đầu'
    ],
    handsOnProject: 'Xây dựng WBS và lập sơ đồ Gantt tiến độ chi tiết 6 tháng cho một dự án thi công nội thất văn phòng làm việc 500m2 trên Microsoft Project.',
    targetAudience: 'Kỹ sư xây dựng, Quản lý dự án nội thất, IT Project Coordinator, Nhân viên kế hoạch tiến độ.',
    careerApplication: 'Tự tin lập kế hoạch và báo cáo tiến độ trực quan, chuyên nghiệp trước ban lãnh đạo và đối tác khách hàng.',
    requirements: [
      'Máy tính cài đặt phần mềm Microsoft Project hoặc các công cụ Gantt tương đương (GanttProject, Smartsheet)',
      'Tư duy logic về trình tự trước sau của các công việc'
    ],
    benefits: [
      'Bóc tách khối lượng công việc khổng lồ thành các gói việc nhỏ dễ dàng phân công và kiểm soát',
      'Xác định chính xác những công việc nào tuyệt đối không được phép chậm trễ để bảo vệ ngày khánh thành dự án',
      'Nhìn thấy trước các xung đột về tài nguyên máy móc và con người trước khi bắt tay thi công',
      'Báo cáo tiến độ cho khách hàng bằng sơ đồ Gantt trực quan, dễ hiểu và thuyết phục'
    ],
    techniques: ['Gantt Chart', 'Microsoft Project', 'Work Breakdown Structure (WBS)', 'Critical Path Method (CPM)', 'Project Baseline'],
    documents: [
      'Bộ WBS mẫu chuẩn cho các loại hình dự án phổ biến (Công nghệ thông tin, Xây dựng, Sự kiện)',
      'File Microsoft Project mẫu (.mpp) chứa đầy đủ công thức và cấu trúc tiến độ chuẩn mực'
    ]
  },
  {
    title: 'Quản Lý Rủi Ro & Quản Lý Chi Phí Ngân Sách Dự Án Thực Chiến',
    slug: 'quan-ly-rui-ro-quan-ly-chi-phi-ngan-sach-du-an',
    categorySlug: 'quan-ly-du-an-va-van-hanh',
    level: CourseLevel.BEGINNER,
    price: 420000,
    oldPrice: 690000,
    leadSummary: 'Kiểm soát chặt chẽ từng đồng ngân sách dự án: Lập dự toán chi phí từ dưới lên, phân bổ quỹ dự phòng rủi ro và quản lý biến động phát sinh theo phương pháp Earned Value Management (EVM).',
    industryContext: 'Hơn một nửa số dự án trên thế giới bị đội vốn nghiêm trọng; kỹ năng quản trị chi phí và lường trước rủi ro là thước đo sự trưởng thành của người quản lý dự án.',
    coreTopics: [
      'Các phương pháp ước tính chi phí dự án: Ước tính tương tự (Analogous), Ước tính tham số (Parametric) và Ước tính từ dưới lên (Bottom-up)',
      'Thiết lập Đường cơ sở chi phí (Cost Baseline) và Quỹ dự phòng: Dự phòng bất trắc (Contingency Reserve) và Dự phòng quản lý (Management Reserve)',
      'Phương pháp quản lý giá trị thu được Earned Value Management (EVM): Chỉ số PV, EV, AC, CV và SV',
      'Đánh giá hiệu suất chi phí qua chỉ số CPI và hiệu suất tiến độ SPI: Dự báo tổng chi phí khi hoàn thành dự án (EAC)',
      'Quy trình quản lý rủi ro dự án: Lập sổ theo dõi rủi ro (Risk Register) và kế hoạch ứng phó chủ động'
    ],
    handsOnProject: 'Thực hiện tính toán các chỉ số EVM (CPI, SPI, EAC) cho một dự án đang bị chậm 2 tuần và vượt 10% chi phí, đưa ra phương án điều chỉnh ngân sách.',
    targetAudience: 'Project Manager, Quản lý tài chính dự án, Kỹ sư giám sát chi phí (QS), Trưởng nhóm kỹ thuật.',
    careerApplication: 'Làm chủ kỹ thuật đo lường tiến độ và chi phí chuẩn mực quốc tế, loại bỏ hoàn toàn tình trạng dự án bị âm vốn bất ngờ.',
    requirements: [
      'Biết sử dụng các phép tính số học cơ bản và bảng tính Excel',
      'Có hiểu biết tổng quan về cấu trúc các khoản chi tiêu trong dự án'
    ],
    benefits: [
      'Tính toán chính xác dự án đang tiết kiệm hay đang lãng phí tiền bạc thông qua chỉ số CPI',
      'Dự báo sớm số tiền tổng kết cuối cùng của dự án trước khi mọi việc quá muộn để cứu vãn',
      'Lập ngân sách dự phòng rủi ro có căn cứ khoa học thay vì ước lượng mò mẫm',
      'Bảo vệ quyền lợi của tổ chức trước các yêu cầu phát sinh chi phí vô lý từ đối tác'
    ],
    techniques: ['Cost Management', 'Earned Value Management (EVM)', 'Cost Baseline', 'CPI & SPI', 'Contingency Reserve', 'Risk Register'],
    documents: [
      'Bảng tính Excel tự động tính toán các chỉ số EVM và vẽ biểu đồ đường cong chữ S (S-Curve)',
      'Mẫu sổ theo dõi rủi ro dự án (Project Risk Register Template)'
    ]
  },
  {
    title: 'Kỹ Năng Giao Tiếp & Quản Lý Kỳ Vọng Các Bên Liên Quan (Stakeholder Management)',
    slug: 'ky-nang-giao-tiep-quan-ly-ky-vong-cac-ben-lien-quan',
    categorySlug: 'quan-ly-du-an-va-van-hanh',
    level: CourseLevel.BEGINNER,
    price: 390000,
    oldPrice: 620000,
    leadSummary: 'Dự án thành công không chỉ ở mặt kỹ thuật mà ở sự hài lòng của con người: Lập kế hoạch truyền thông, quản trị kỳ vọng khách hàng, điều hành cuộc họp hiệu quả và giải quyết xung đột.',
    industryContext: 'Hơn 90% thời gian của một người quản lý dự án là dành cho việc giao tiếp; khả năng kết nối con người và dung hòa các lợi ích đối nghịch quyết định sự sống còn của dự án.',
    coreTopics: [
      'Lập ma trận phân tích các bên liên quan: Xác định quyền lực, Mức độ ảnh hưởng và Kỳ vọng thầm kín',
      'Xây dựng Kế hoạch quản lý truyền thông dự án (Communications Management Plan): Ai cần thông tin gì, Khi nào cần, Qua kênh nào',
      'Nghệ thuật quản trị kỳ vọng: Kỹ thuật Nói Không khéo léo khi khách hàng yêu cầu thêm tính năng nằm ngoài phạm vi (Scope Creep)',
      'Nâng cao hiệu quả họp dự án: Cuộc họp khởi động (Kick-off Meeting), Họp báo cáo trạng thái và Họp rút kinh nghiệm (Post-mortem)',
      'Năm chiến lược giải quyết xung đột trong nhóm dự án theo mô hình Thomas-Kilmann'
    ],
    handsOnProject: 'Soạn thảo kế hoạch truyền thông chi tiết cho một dự án chuyển đổi số nhạy cảm và đóng vai giải quyết xung đột phạm vi công việc với khách hàng khó tính.',
    targetAudience: 'Project Manager, Scrum Master, Trưởng nhóm kỹ thuật, Chuyên viên phân tích nghiệp vụ (BA).',
    careerApplication: 'Xây dựng mối quan hệ tin cậy vững chắc với khách hàng và tạo dựng một môi trường làm việc nhóm hài hòa, gắn kết.',
    requirements: [
      'Thường xuyên phải làm việc nhóm hoặc tiếp xúc với khách hàng',
      'Mong muốn cải thiện sự tự tin trong giao tiếp và đàm phán nội bộ'
    ],
    benefits: [
      'Chấm dứt tình trạng dự án bị phình to phạm vi (Scope Creep) làm đội chi phí và chậm hạn bàn giao',
      'Biến các cuộc họp dự án buồn ngủ thành các buổi làm việc ngắn gọn, tập trung và ra quyết định dứt khoát',
      'Hóa giải các mâu thuẫn cá nhân giữa các thành viên trong nhóm một cách êm thấm, chuyên nghiệp',
      'Tạo dựng sự hài lòng tối đa cho khách hàng và ban lãnh đạo ngay cả khi dự án gặp khó khăn khách quan'
    ],
    techniques: ['Stakeholder Engagement', 'Communications Plan', 'Scope Creep Management', 'Thomas-Kilmann Model', 'Kick-off Meeting', 'Conflict Resolution'],
    documents: [
      'Mẫu kế hoạch truyền thông dự án (Project Communications Matrix)',
      'Biên bản họp chuẩn (Meeting Minutes) và mẫu thỏa thuận thay đổi phạm vi (Change Request Form)'
    ]
  },
  {
    title: 'Thành Thạo Khung Làm Việc Scrum Chuyên Nghiệp (Professional Scrum Master - PSM I)',
    slug: 'thanh-thao-khung-lam-viec-scrum-chuyen-nghiep-psm-1',
    categorySlug: 'quan-ly-du-an-va-van-hanh',
    level: CourseLevel.INTERMEDIATE,
    price: 699000,
    oldPrice: 1050000,
    leadSummary: 'Làm chủ khung làm việc Agile phổ biến nhất thế giới theo Scrum Guide mới nhất: 3 Vai trò (Roles), 5 Sự kiện (Events), 3 Hiện vật (Artifacts) và tự tin thi đỗ chứng chỉ quốc tế PSM I.',
    industryContext: 'Hầu hết các công ty công nghệ và tổ chức hiện đại ngày nay đều vận hành theo khung làm việc Scrum; vị trí Scrum Master đang có nhu cầu tuyển dụng cực lớn với mức thu nhập hấp dẫn.',
    coreTopics: [
      'Bản chất lý thuyết thực nghiệm của Scrum: Tính Minh bạch (Transparency), Kiểm tra (Inspection) và Thích nghi (Adaptation)',
      'Ba vai trò cốt lõi trong Scrum Team: Scrum Master (Người lãnh đạo phục vụ), Product Owner (Người tối đa hóa giá trị) và Developers',
      'Năm sự kiện chính thức trong một Sprint: Sprint Planning, Daily Scrum, Sprint Review, Sprint Retrospective và chính Sprint',
      'Ba hiện vật và cam kết tương ứng: Product Backlog (Mục tiêu sản phẩm), Sprint Backlog (Mục tiêu Sprint) và Phần tăng trưởng Increment (Định nghĩa hoàn thành DoD)',
      'Luyện bộ câu hỏi tình huống thi thử chứng chỉ quốc tế Professional Scrum Master (PSM I) từ Scrum.org'
    ],
    handsOnProject: 'Điều phối toàn bộ chu trình một Sprint giả định kéo dài 2 tuần cho một nhóm phát triển phần mềm và tổ chức buổi Sprint Retrospective giải quyết trở ngại.',
    targetAudience: 'Scrum Master, Project Manager muốn chuyển dịch sang Agile, Lập trình viên, Tester, Giảng viên muốn lấy chứng chỉ quốc tế.',
    careerApplication: 'Tự tin ứng tuyển vị trí Scrum Master và sẵn sàng vượt qua kỳ thi lấy chứng chỉ quốc tế PSM I danh giá.',
    requirements: [
      'Hiểu biết cơ bản về quy trình phát triển sản phẩm hoặc phần mềm',
      'Đọc hiểu tài liệu Scrum Guide chính thức bằng tiếng Việt hoặc tiếng Anh'
    ],
    benefits: [
      'Hiểu chuẩn xác bản chất của Scrum theo đúng định nghĩa của hai nhà đồng sáng lập Ken Schwaber và Jeff Sutherland',
      'Xóa bỏ những hiểu lầm phổ biến biến Scrum thành một hình thức quản lý vi mô ngột ngạt',
      'Tổ chức các buổi họp Sprint Retrospective đầy cảm hứng giúp nhóm liên tục cải tiến sau mỗi chu kỳ',
      'Đạt được chứng chỉ quốc tế có giá trị vĩnh viễn trên toàn cầu mở ra bước ngoặt sự nghiệp'
    ],
    techniques: ['Scrum Framework', 'Agile Principles', 'PSM I Exam Prep', 'Sprint Retrospective', 'Definition of Done', 'Servant Leadership'],
    documents: [
      'Bản tóm tắt Scrum Guide song ngữ chuẩn hóa kèm ghi chú trọng tâm thi chứng chỉ',
      'Bộ đề thi thử 160 câu hỏi tình huống PSM I sát với đề thi thực tế kèm giải thích chi tiết'
    ]
  },
  {
    title: 'Quản Lý Sản Phẩm Nhanh Nhạy (Agile Product Ownership - PSPO I)',
    slug: 'quan-ly-san-pham-nhanh-nhay-agile-product-ownership-pspo-1',
    categorySlug: 'quan-ly-du-an-va-van-hanh',
    level: CourseLevel.INTERMEDIATE,
    price: 750000,
    oldPrice: 1190000,
    leadSummary: 'Tối đa hóa giá trị sản phẩm được tạo ra: Định hình tầm nhìn sản phẩm, kỹ thuật viết User Story sắc bén, sắp xếp thứ tự ưu tiên Backlog và chuẩn bị chứng chỉ quốc tế PSPO I.',
    industryContext: 'Product Owner là người nắm giữ linh hồn của sản phẩm và quyết định sự thành bại về mặt thương mại; họ là cầu nối then chốt giữa khách hàng, kinh doanh và đội ngũ phát triển.',
    coreTopics: [
      'Vai trò của Product Owner trong tổ chức: Doanh nhân thu nhỏ chứ không phải người ghi chép đơn thuần',
      'Định hình tầm nhìn sản phẩm với Product Vision Board và Lộ trình phát triển sản phẩm (Product Roadmap)',
      'Kỹ thuật viết Câu chuyện người dùng (User Story) theo chuẩn INVEST và tiêu chí chấp nhận Acceptance Criteria',
      'Các phương pháp sắp xếp độ ưu tiên của Product Backlog: MoSCoW, Mô hình Kano, WSJF (Weighted Shortest Job First) và Phân tích giá trị',
      'Quản lý việc phát hành sản phẩm (Release Management) và đo lường giá trị thực tế dựa trên số liệu kinh doanh'
    ],
    handsOnProject: 'Xây dựng một Product Backlog hoàn chỉnh gồm 20 User Stories chuẩn INVEST kèm tiêu chí nghiệm thu cho tính năng giỏ hàng thương mại điện tử.',
    targetAudience: 'Product Owner, Business Analyst (BA), Product Manager, Chuyên viên phát triển kinh doanh muốn chuẩn hóa năng lực PO.',
    careerApplication: 'Trở thành Product Owner chuyên nghiệp có khả năng dẫn dắt đội ngũ kỹ thuật xây dựng đúng những gì thị trường cần.',
    requirements: [
      'Hiểu biết cơ bản về khung làm việc Scrum',
      'Tư duy phân tích yêu cầu nghiệp vụ và sự nhạy bén với trải nghiệm người dùng'
    ],
    benefits: [
      'Biết cách nói Không với những yêu cầu tính năng vụn vặt làm phân tán nguồn lực của đội ngũ',
      'Viết các User Story rõ ràng, súc tích giúp lập trình viên hiểu ngay yêu cầu mà không cần hỏi lại nhiều lần',
      'Sắp xếp thứ tự công việc khoa học giúp sản phẩm luôn tạo ra giá trị kinh tế cao nhất qua từng Sprint',
      'Tự tin vượt qua kỳ thi chứng chỉ Professional Scrum Product Owner (PSPO I)'
    ],
    techniques: ['Product Ownership', 'PSPO I', 'User Story Writing', 'INVEST Criteria', 'Backlog Prioritization', 'Product Roadmap'],
    documents: [
      'Khung mẫu viết User Story và bộ quy tắc Acceptance Criteria chuẩn mực',
      'Bộ câu hỏi ôn tập thi thử chứng chỉ quốc tế PSPO I từ Scrum.org'
    ]
  },
  {
    title: 'Thành Thạo Quản Trị Dự Án Với Atlassian Jira & Confluence Toàn Diện',
    slug: 'thanh-thao-quan-tri-du-an-atlassian-jira-confluence-toan-dien',
    categorySlug: 'quan-ly-du-an-va-van-hanh',
    level: CourseLevel.INTERMEDIATE,
    price: 590000,
    oldPrice: 890000,
    leadSummary: 'Làm chủ bộ đôi công cụ số một ngành công nghệ: Cấu hình quy trình làm việc (Workflows), bảng Scrum/Kanban, bộ lọc JQL nâng cao trên Jira và tài liệu hóa tri thức trên Confluence.',
    industryContext: 'Hơn 80% các công ty công nghệ và phần mềm trên thế giới sử dụng Jira để theo dõi dự án; thành thạo Jira là một điểm cộng khổng lồ trong hồ sơ tuyển dụng.',
    coreTopics: [
      'Cấu trúc dữ liệu trong Jira Software: Projects, Issues, Epics, Stories, Tasks và Sub-tasks',
      'Thiết kế và cấu hình Luồng công việc tùy biến (Custom Workflows): Trạng thái, Chuyển đổi và Điều kiện ràng buộc',
      'Làm chủ ngôn ngữ tìm kiếm Jira Query Language (JQL): Viết các bộ lọc phức tạp để quản lý và cảnh báo công việc',
      'Xây dựng bảng điều khiển Jira Dashboard tự động với các biểu đồ Burndown Chart, Velocity Chart và Sprint Health',
      'Kết nối Jira với Confluence: Viết tài liệu yêu cầu sản phẩm (PRD), Biên bản họp và Chia sẻ tri thức nội bộ'
    ],
    handsOnProject: 'Cấu hình hoàn chỉnh một không gian dự án phần mềm trên Jira Cloud từ khâu phân quyền, tạo Custom Workflow đến Dashboard báo cáo tiến độ tự động.',
    targetAudience: 'Project Manager, Scrum Master, QA Lead, Quản trị viên hệ thống Jira (Jira Admin), Thành viên nhóm phần mềm.',
    careerApplication: 'Tự tin tiếp quản và tối ưu hóa hệ thống quản lý công việc Jira của bất kỳ doanh nghiệp công nghệ nào.',
    requirements: [
      'Có máy tính cá nhân để thực hành trực tiếp trên phiên bản Jira Cloud miễn phí',
      'Tư duy logic về luồng trạng thái công việc'
    ],
    benefits: [
      'Tùy biến luồng công việc trên Jira chuẩn xác theo đúng quy trình thực tế của công ty bạn',
      'Tìm kiếm và trích xuất bất kỳ đầu việc nào bị chậm trễ trong tích tắc bằng câu lệnh JQL',
      'Tạo ra các Dashboard báo cáo tiến độ tự động giúp bạn không bao giờ phải làm báo cáo PowerPoint thủ công',
      'Xây dựng kho tàng tri thức dự án có cấu trúc rõ ràng trên Confluence'
    ],
    techniques: ['Jira Software', 'Atlassian Confluence', 'JQL Filters', 'Custom Workflows', 'Burndown Chart', 'Jira Dashboard'],
    documents: [
      'Sổ tay tổng hợp 50 câu lệnh JQL quyền năng nhất để lọc dữ liệu dự án trên Jira',
      'Template tài liệu yêu cầu sản phẩm (PRD Template) chuẩn mực trên Confluence'
    ]
  },
  {
    title: 'Luyện Thi Chứng Chỉ Quản Lý Dự Án Quốc Tế PMP (Project Management Professional)',
    slug: 'luyen-thi-chung-chi-quan-ly-du-an-quoc-te-pmp',
    categorySlug: 'quan-ly-du-an-va-van-hanh',
    level: CourseLevel.INTERMEDIATE,
    price: 890000,
    oldPrice: 1450000,
    leadSummary: 'Chinh phục tiêu chuẩn vàng của ngành quản lý dự án thế giới: Nắm vững bộ đề thi PMP theo đề cương ECO mới nhất, bao gồm 50% phương pháp truyền thống và 50% phương pháp Agile/Hybrid.',
    industryContext: 'Chứng chỉ PMP của Viện Quản lý Dự án Hoa Kỳ (PMI) là bảo chứng uy tín cao nhất trên toàn cầu, giúp nâng mức lương của người sở hữu lên trung bình 20-30%.',
    coreTopics: [
      'Cấu trúc đề cương thi PMP mới nhất (Exam Content Outline - ECO): 3 miền kiến thức Con người (People 42%), Quy trình (Process 50%) và Môi trường kinh doanh (Business Environment 8%)',
      'Tư duy xử lý tình huống theo Mindset chuẩn mực của PMI: Đề cao sự chủ động, Lắng nghe thấu cảm và Tuân thủ đạo đức nghề nghiệp',
      'Tích hợp các phương pháp luận: Dự đoán (Waterfall), Nhanh nhạy (Agile) và Lai ghép (Hybrid)',
      'Kỹ thuật phân tích các câu hỏi tình huống dài và bẫy đề thi: Cách loại trừ phương án sai và nhận diện câu trả lời tốt nhất',
      'Hướng dẫn hoàn thiện hồ sơ kinh nghiệm dự án (PMP Application) và quy trình chuẩn bị trước ngày thi'
    ],
    handsOnProject: 'Thực hành giải và phân tích chi tiết 100 câu hỏi tình huống mẫu chuẩn đề thi PMP quốc tế và soạn thảo hồ sơ kinh nghiệm ứng tuyển PMI.',
    targetAudience: 'Project Manager có từ 3 năm kinh nghiệm trở lên, Trưởng phòng kỹ thuật, Kỹ sư muốn sở hữu chứng chỉ nghề nghiệp đẳng cấp quốc tế.',
    careerApplication: 'Đạt được chứng chỉ PMP mở ra cơ hội làm việc tại các tập đoàn đa quốc gia và các dự án có vốn đầu tư nước ngoài (FDI).',
    requirements: [
      'Có tối thiểu 3 năm kinh nghiệm làm việc trong các dự án thực tế',
      'Sự quyết tâm và kỷ luật cao dành thời gian tự học nghiêm túc'
    ],
    benefits: [
      'Nắm vững toàn diện bộ quy chuẩn quản lý dự án hàng đầu thế giới được công nhận tại hơn 200 quốc gia',
      'Rèn luyện tư duy xử lý tình huống lãnh đạo chuẩn mực giúp bạn giải quyết các xung đột dự án thực tế một cách chuyên nghiệp',
      'Tự tin hoàn thiện hồ sơ dự thi PMP vượt qua mọi vòng kiểm toán ngẫu nhiên của PMI',
      'Tối ưu hóa thời gian ôn luyện để đạt kết quả Above Target trong kỳ thi chính thức'
    ],
    techniques: ['PMP Exam Prep', 'PMI Standards', 'PMI ECO', 'Hybrid Project Management', 'PMP Mindset', 'Situational Analysis'],
    documents: [
      'Bản tóm tắt Mindmap toàn bộ các miền kiến thức thi PMP theo chuẩn ECO',
      'Bộ tài liệu giải thích tư duy xử lý tình huống (PMP Mindset Cheat Sheet)'
    ]
  },
  {
    title: 'Quản Lý Dự Án Theo Phương Pháp Lai Ghép (Hybrid Project Management)',
    slug: 'quan-ly-du-an-theo-phuong-phap-lai-ghep-hybrid',
    categorySlug: 'quan-ly-du-an-va-van-hanh',
    level: CourseLevel.INTERMEDIATE,
    price: 650000,
    oldPrice: 990000,
    leadSummary: 'Kết hợp hoàn hảo giữa tính chắc chắn của Waterfall và sự linh hoạt của Agile: Lập kế hoạch kiến trúc tổng thể theo giai đoạn nhưng thực thi lặp theo từng Sprint ngắn hạn.',
    industryContext: 'Trong thực tế doanh nghiệp, hiếm có dự án nào có thể áp dụng 100% Agile thuần túy hoặc 100% Waterfall cứng nhắc; mô hình Hybrid chính là giải pháp thực tế được ưa chuộng nhất.',
    coreTopics: [
      'Tại sao các dự án hiện đại cần mô hình Lai ghép (Hybrid): Đáp ứng sự kiểm soát ngân sách của ban điều hành mà vẫn giữ được tính linh hoạt kỹ thuật',
      'Mô hình Water-Scrum-Fall: Lập kế hoạch và thiết kế kiến trúc theo Waterfall, Lập trình thực thi theo Scrum và Kiểm thử đóng gói theo Waterfall',
      'Quản lý phạm vi công việc trong mô hình Hybrid: Cố định các mốc bàn giao lớn (Milestones) nhưng linh hoạt các chi tiết tính năng bên trong',
      'Quản lý hợp đồng thương mại Hybrid: Hợp đồng giá cố định (Fixed-price) kết hợp với các điều khoản thay đổi phạm vi linh hoạt',
      'Báo cáo tiến độ cho các bên liên quan truyền thống: Chuyển đổi dữ liệu từ Sprint Burndown sang Báo cáo tiến độ Gantt chuẩn mực'
    ],
    handsOnProject: 'Thiết kế khung quản lý dự án lai ghép hoàn chỉnh cho một dự án triển khai hệ thống phần cứng IoT kết hợp ứng dụng phần mềm di động.',
    targetAudience: 'Senior Project Manager, Giám đốc kỹ thuật, Delivery Manager tại các công ty gia công phần mềm hoặc sản xuất thiết bị.',
    careerApplication: 'Tự tin dẫn dắt các dự án phức tạp đòi hỏi phải đáp ứng đồng thời cả yêu cầu kiểm soát chặt chẽ của khách hàng và tính biến động kỹ thuật.',
    requirements: [
      'Đã hiểu rõ cả hai phương pháp luận Waterfall (PMBOK) và Agile (Scrum)',
      'Có trải nghiệm thực tế trong việc quản lý dự án'
    ],
    benefits: [
      'Dung hòa mâu thuẫn giữa ban lãnh đạo đòi hỏi kế hoạch ngân sách cố định và đội ngũ lập trình đòi hỏi sự linh hoạt',
      'Lựa chọn chính xác phần việc nào nên làm theo Waterfall và phần việc nào nên làm theo Agile trong cùng một dự án',
      'Giảm thiểu tối đa rủi ro chậm hạn bàn giao của các dự án công nghệ có sự tham gia của nhiều bên',
      'Tạo ra một quy trình làm việc cân bằng, thực tế và dễ áp dụng cho toàn bộ tổ chức'
    ],
    techniques: ['Hybrid Project Management', 'Water-Scrum-Fall', 'Milestone Planning', 'Hybrid Contracts', 'Agile Governance', 'Predictive-Adaptive'],
    documents: [
      'Khung hướng dẫn lựa chọn mô hình dự án (Agile Suitability Filter) của PMI',
      'Mẫu báo cáo trạng thái dự án lai ghép kết hợp giữa biểu đồ Gantt và chỉ số Sprint Velocity'
    ]
  },
  {
    title: 'Kỹ Thuật Ước Tính Độ Phức Tạp & Định Cỡ Dự Án Nhanh Nhạy (Agile Estimation & Sizing)',
    slug: 'ky-thuat-uoc-tinh-do-phuc-tap-dinh-co-du-an-agile',
    categorySlug: 'quan-ly-du-an-va-van-hanh',
    level: CourseLevel.INTERMEDIATE,
    price: 490000,
    oldPrice: 750000,
    leadSummary: 'Chấm dứt việc ước tính thời gian theo cảm tính: Làm chủ kỹ thuật Story Points, dãy số Fibonacci, bài toán chơi bài Planning Poker và đo lường vận tốc đội ngũ (Velocity).',
    industryContext: 'Con người vốn dĩ rất tồi trong việc ước tính thời gian tuyệt đối bằng số giờ; việc chuyển sang ước tính độ phức tạp tương đối bằng Story Points giúp việc lập kế hoạch chính xác hơn gấp nhiều lần.',
    coreTopics: [
      'Ảo tưởng về việc ước tính theo giờ làm việc (Man-hours) và sự phân tán năng suất thực tế',
      'Khái niệm Điểm câu chuyện (Story Points): Ước tính độ phức tạp tương đối kết hợp rủi ro và nỗ lực',
      'Dãy số Fibonacci cải tiến (1, 2, 3, 5, 8, 13, 20, 40, 100) và quy tắc định cỡ kích thước áo thun (T-shirt Sizing)',
      'Quy trình tổ chức buổi chơi bài Planning Poker dân chủ: Loại bỏ hiện tượng thiên kiến mỏ neo và sự lấn át của nhân sự cấp cao',
      'Đo lường Vận tốc đội ngũ (Team Velocity) qua các Sprint và sử dụng vận tốc để dự báo ngày hoàn thành sản phẩm'
    ],
    handsOnProject: 'Tổ chức một phiên Planning Poker thực hành định cỡ cho 15 tính năng phần mềm thực tế và tính toán vận tốc trung bình để lập kế hoạch cho 3 Sprint tiếp theo.',
    targetAudience: 'Scrum Master, Product Owner, Tech Lead, Developers và Tester trong các nhóm làm việc theo mô hình Agile.',
    careerApplication: 'Giúp nhóm phát triển lập kế hoạch Sprint có độ chính xác cao, loại bỏ tình trạng cam kết quá mức dẫn đến kiệt sức.',
    requirements: [
      'Đã tham gia vào các nhóm làm việc theo chu kỳ Sprint',
      'Hiểu biết cơ bản về các tính năng của một phần mềm ứng dụng'
    ],
    benefits: [
      'Rút ngắn thời gian các buổi họp ước lượng công việc từ nhiều giờ xuống còn vài chục phút',
      'Tạo sự đồng thuận tuyệt đối giữa các lập trình viên về mức độ khó dễ của từng đầu việc',
      'Lập kế hoạch phát hành sản phẩm dựa trên số liệu vận tốc thực tế chứ không dựa trên sự lạc quan hão huyền',
      'Bảo vệ đội ngũ phát triển không bị ban giám đốc ép tiến độ vô lý'
    ],
    techniques: ['Agile Estimation', 'Story Points', 'Planning Poker', 'Fibonacci Sequence', 'Team Velocity', 'T-shirt Sizing'],
    documents: [
      'Bộ thẻ bài Planning Poker điện tử có thể in ấn hoặc sử dụng trực tiếp trên điện thoại',
      'Bảng tính Excel dự phóng biểu đồ giải phóng sản phẩm (Release Burnup Chart) dựa trên Story Points'
    ]
  },
  {
    title: 'Quản Trị Văn Phòng Dự Án Doanh Nghiệp (Project Management Office - PMO)',
    slug: 'quan-tri-van-phong-du-an-doanh-nghiep-pmo',
    categorySlug: 'quan-ly-du-an-va-van-hanh',
    level: CourseLevel.INTERMEDIATE,
    price: 790000,
    oldPrice: 1250000,
    leadSummary: 'Nâng tầm quản trị dự án lên quy mô tổ chức: Thành lập và vận hành Văn phòng Quản lý Dự án (PMO), chuẩn hóa phương pháp luận, quản lý danh mục và đào tạo năng lực dự án.',
    industryContext: 'Khi doanh nghiệp triển khai đồng thời hàng chục dự án lớn nhỏ, một văn phòng PMO vững mạnh là chìa khóa để bảo đảm các dự án luôn đi đúng định hướng chiến lược và tối ưu nguồn lực.',
    coreTopics: [
      'Các mô hình văn phòng PMO: PMO Hỗ trợ (Supportive), PMO Kiểm soát (Controlling) và PMO Định hướng (Directive)',
      'Quy trình thiết lập văn phòng PMO từ con số 0 trong doanh nghiệp: Đánh giá hiện trạng, Xây dựng điều lệ PMO Charter',
      'Chuẩn hóa bộ công cụ và phương pháp luận quản lý dự án (Project Methodology & Governance Framework) cho toàn công ty',
      'Quản lý danh mục dự án (Project Portfolio Management - PPM): Lựa chọn, Chấm điểm và Ưu tiên các dự án mang lại giá trị chiến lược cao nhất',
      'Đo lường giá trị và ROI của văn phòng PMO đối với sự tăng trưởng của doanh nghiệp'
    ],
    handsOnProject: 'Soạn thảo bản Đề án thành lập văn phòng PMO cho một tập đoàn bán lẻ đa ngành đang triển khai 15 dự án số hóa đồng thời.',
    targetAudience: 'Trưởng văn phòng PMO, Quản lý danh mục dự án, Senior Project Manager chuẩn bị lên lãnh đạo, Giám đốc vận hành.',
    careerApplication: 'Đảm nhận vai trò Giám đốc Văn phòng Dự án (Head of PMO) lãnh đạo toàn bộ hoạt động quản trị dự án của doanh nghiệp.',
    requirements: [
      'Tối thiểu 3 năm kinh nghiệm làm việc trong các ban quản lý dự án',
      'Hiểu biết sâu rộng về quy trình vận hành và cơ cấu tổ chức doanh nghiệp'
    ],
    benefits: [
      'Chấm dứt tình trạng các dự án trong công ty làm việc manh mún, thiếu quy chuẩn và giẫm chân lên nhau',
      'Cung cấp bức tranh toàn cảnh minh bạch về tiến độ và rủi ro của toàn bộ các dự án cho ban tổng giám đốc',
      'Phân bổ tối ưu nguồn lực nhân sự chất lượng cao vào các dự án trọng yếu nhất',
      'Khẳng định giá trị đóng góp bằng tiền mặt và hiệu quả kinh doanh thực tế của bộ phận PMO'
    ],
    techniques: ['PMO Management', 'Project Portfolio Management (PPM)', 'Governance Framework', 'Project Prioritization', 'PMO Charter', 'Resource Optimization'],
    documents: [
      'Mẫu Điều lệ thành lập văn phòng dự án (PMO Charter Template)',
      'Mô hình ma trận chấm điểm và xếp hạng ưu tiên danh mục dự án (Project Scoring Model)'
    ]
  },
  {
    title: 'Mở Rộng Quy Mô Agile Doanh Nghiệp Lớn Với Khung SAFe (Scaled Agile Framework)',
    slug: 'mo-rong-quy-mo-agile-doanh-nghiep-lon-safe',
    categorySlug: 'quan-ly-du-an-va-van-hanh',
    level: CourseLevel.ADVANCED,
    price: 1190000,
    oldPrice: 1890000,
    leadSummary: 'Vận hành Agile cho hàng trăm nhân sự cùng lúc: Làm chủ khung Scaled Agile Framework (SAFe), vận hành đoàn tàu phát hành Agile Release Train (ART) và sự kiện lập kế hoạch PI Planning.',
    industryContext: 'Scrum hoạt động rất tốt cho nhóm nhỏ từ 5-9 người; nhưng khi cần phối hợp hàng chục nhóm làm việc cùng một sản phẩm phức tạp, SAFe là giải pháp số một được các tập đoàn lớn toàn cầu áp dụng.',
    coreTopics: [
      'Bảy năng lực cốt lõi của Doanh nghiệp Nhanh nhạy (Business Agility) theo chuẩn SAFe',
      'Đoàn tàu phát hành Agile (Agile Release Train - ART): Cấu trúc đội ngũ của các đội ngũ (Team of Teams) gồm 50-125 nhân sự',
      'Sự kiện lập kế hoạch gia số chương trình (PI Planning - Program Increment Planning): Nhịp đập trái tim điều phối toàn bộ đoàn tàu ART',
      'Quản lý luồng giá trị (Value Stream Management) và loại bỏ các nút thắt cổ chai phụ thuộc giữa các nhóm',
      'Vai trò của các vị trí cấp cao trong SAFe: Release Train Engineer (RTE), Solution Architect và Product Management'
    ],
    handsOnProject: 'Mô phỏng tổ chức một sự kiện PI Planning 2 ngày cho một đoàn tàu ART gồm 5 nhóm Scrum để giải quyết các điểm nghẽn phụ thuộc kỹ thuật.',
    targetAudience: 'Agile Coach, Enterprise Scrum Master, Release Train Engineer (RTE), Giám đốc chuyển đổi Agile tại các tập đoàn lớn.',
    careerApplication: 'Dẫn dắt các chiến dịch chuyển đổi Agile quy mô lớn tại các ngân hàng, tập đoàn viễn thông và bảo hiểm hàng đầu.',
    requirements: [
      'Đã làm chủ kiến thức vững chắc về Scrum và Kanban',
      'Có kinh nghiệm điều phối công việc liên nhóm trong các tổ chức quy mô lớn'
    ],
    benefits: [
      'Đồng bộ hóa nhịp độ làm việc của hàng trăm kỹ sư công nghệ cùng hướng về một mục tiêu chiến lược duy nhất',
      'Giải quyết dứt điểm các xung đột và sự phụ thuộc chéo giữa các hệ thống phần mềm phức tạp',
      'Rút ngắn thời gian đưa tính năng sản phẩm ra thị trường (Time-to-Market) ở quy mô toàn doanh nghiệp',
      'Nâng cao khả năng ứng phó linh hoạt của cả một tập đoàn lớn trước những thay đổi nhanh chóng của thị trường'
    ],
    techniques: ['Scaled Agile Framework (SAFe)', 'Agile Release Train (ART)', 'PI Planning', 'Value Stream Management', 'RTE', 'Enterprise Agility'],
    documents: [
      'Bộ tài liệu cẩm nang tổ chức sự kiện PI Planning 2 ngày chi tiết từng giờ',
      'Bảng mẫu quản lý các mối phụ thuộc liên nhóm (Program Board Template)'
    ]
  },
  {
    title: 'Chuyên Gia Huấn Luyện Agile Doanh Nghiệp (Enterprise Agile Coaching)',
    slug: 'chuyen-gia-huan-luyen-agile-doanh-nghiep-agile-coach',
    categorySlug: 'quan-ly-du-an-va-van-hanh',
    level: CourseLevel.ADVANCED,
    price: 990000,
    oldPrice: 1590000,
    leadSummary: 'Thúc đẩy sự chuyển hóa văn hóa và tư duy nhanh nhạy trong tổ chức: Kỹ năng điều phối cấp cao (Facilitation), cố vấn lãnh đạo (Executive Mentoring) và dẫn dắt thay đổi bền vững.',
    industryContext: 'Agile không phải là một tập hợp các quy tắc cần tuân thủ một cách máy móc; Agile là một trạng thái tâm thế (Mindset) đòi hỏi sự dẫn dắt kiên nhẫn của những chuyên gia huấn luyện tài ba.',
    coreTopics: [
      'Khung năng lực chuyên gia Agile Coach của Lyssa Adkins: Giảng dạy, Cố vấn, Khai vấn chuyên nghiệp (Professional Coaching) và Điều phối',
      'Nghệ thuật điều phối cấp cao (Advanced Facilitation): Kỹ thuật Liberating Structures giúp khơi mở trí tuệ tập thể',
      'Khai vấn lãnh đạo cấp cao (Executive Coaching): Giúp ban giám đốc từ bỏ thói quen ra lệnh kiểm soát để chuyển sang trao quyền',
      'Đo lường mức độ trưởng thành Agile (Agile Maturity Assessment) của tổ chức một cách khách quan',
      'Vượt qua các kháng cự văn hóa và xử lý hiện tượng mệt mỏi vì thay đổi (Change Fatigue) trong doanh nghiệp'
    ],
    handsOnProject: 'Thực hiện đánh giá mức độ trưởng thành Agile cho 3 phòng ban và xây dựng một kế hoạch huấn luyện chuyển đổi văn hóa 6 tháng cho đội ngũ lãnh đạo.',
    targetAudience: 'Senior Scrum Master muốn nâng tầm lên Agile Coach, Chuyên gia tư vấn chuyển đổi tổ chức, Giám đốc nhân sự và đào tạo.',
    careerApplication: 'Đảm nhận vị trí chuyên gia huấn luyện Agile Coach nội bộ hoặc chuyên gia tư vấn độc lập với mức thu nhập chuyên gia hàng đầu.',
    requirements: [
      'Tối thiểu 3 năm kinh nghiệm thực chiến trong vai trò Scrum Master hoặc Agile Practitioner',
      'Kỹ năng lắng nghe thấu cảm và năng lực giao tiếp sư phạm xuất sắc'
    ],
    benefits: [
      'Làm chủ nghệ thuật đặt câu hỏi khai vấn mạnh mẽ giúp các cá nhân tự tìm ra giải pháp tối ưu cho vấn đề của họ',
      'Điều hành các hội thảo lớn lên đến hàng trăm người mà vẫn duy trì được sự tập trung và tương tác sôi nổi',
      'Xây dựng niềm tin sâu sắc với các lãnh đạo cấp cao để dẫn dắt họ thay đổi phong cách quản trị',
      'Tạo ra sự chuyển biến văn hóa tự giác, chủ động và có trách nhiệm ăn sâu vào từng nhân viên'
    ],
    techniques: ['Agile Coaching', 'Professional Coaching', 'Facilitation', 'Liberating Structures', 'Agile Maturity Model', 'Culture Transformation'],
    documents: [
      'Bảng kiểm tra đánh giá mức độ trưởng thành Agile của tổ chức (Agile Maturity Checklist)',
      'Tuyển tập 10 kỹ thuật điều phối Liberating Structures thông dụng nhất cho các buổi Retrospective lớn'
    ]
  },
  {
    title: 'Quản Lý Danh Mục Dự Án Chiến Lược (Strategic Project Portfolio Management - PfMP)',
    slug: 'quan-ly-danh-muc-du-an-chien-luoc-pfmp',
    categorySlug: 'quan-ly-du-an-va-van-hanh',
    level: CourseLevel.ADVANCED,
    price: 1250000,
    oldPrice: 1990000,
    leadSummary: 'Làm những dự án đúng đắn thay vì chỉ làm đúng quy trình: Cân đối danh mục đầu tư dự án, tối ưu hóa nguồn lực tài chính hữu hạn và căn chỉnh hoàn hảo với tầm nhìn dài hạn của công ty.',
    industryContext: 'Quản lý dự án là LÀM ĐÚNG VIỆC (Doing things right), nhưng Quản trị danh mục là CHỌN ĐÚNG VIỆC ĐỂ LÀM (Doing the right things); đây là cấp độ cao nhất trong hệ thống quản trị dự án.',
    coreTopics: [
      'Sự phân biệt cấp bậc giữa Dự án (Project), Chương trình (Program) và Danh mục đầu tư (Portfolio)',
      'Quy trình căn chỉnh chiến lược danh mục: Xác lập tiêu chí lựa chọn dự án dựa trên các mục tiêu chiến lược cốt lõi của công ty',
      'Tối ưu hóa và cân đối danh mục dự án: Cân bằng giữa dự án duy trì ngắn hạn, dự án tăng trưởng trung hạn và dự án đột phá dài hạn',
      'Quản lý nguồn lực tập trung ở cấp danh mục (Portfolio Resource Capacity Planning): Tránh tình trạng thắt cổ chai nhân sự chủ chốt',
      'Giám sát hiệu quả đầu tư danh mục và dũng cảm ra quyết định đóng cửa các dự án không còn giá trị chiến lược'
    ],
    handsOnProject: 'Thực hiện đánh giá, sàng lọc và tái phân bổ ngân sách 100 tỷ đồng cho một danh mục gồm 25 dự án đầu tư để tối đa hóa tỷ suất sinh lời chiến lược.',
    targetAudience: 'Giám đốc chiến lược (CSO), Thành viên Hội đồng đầu tư, Giám đốc văn phòng PMO, Quản lý danh mục dự án cấp cao.',
    careerApplication: 'Tham gia trực tiếp vào việc định hình các quyết định đầu tư chiến lược tối quan trọng của ban lãnh đạo tập đoàn.',
    requirements: [
      'Tối thiểu 5 năm kinh nghiệm quản lý dự án hoặc quản trị kinh doanh cấp cao',
      'Hiểu biết sâu rộng về tài chính doanh nghiệp và hoạch định chiến lược'
    ],
    benefits: [
      'Đảm bảo 100% ngân sách đầu tư dự án của công ty đều phục vụ trực tiếp cho các mục tiêu chiến lược cốt lõi',
      'Dũng cảm dừng lại các dự án không còn hiệu quả để tránh lãng phí thêm tiền của vào bẫy chi phí chìm (Sunk Cost Fallacy)',
      'Phân bổ nguồn nhân lực tinh hoa một cách thông minh, không để các dự án quan trọng bị thiếu thốn tài nguyên',
      'Nâng cao tỷ lệ hoàn vốn đầu tư tổng thể của toàn bộ danh mục dự án của tập đoàn'
    ],
    techniques: ['Portfolio Management', 'PfMP Standard', 'Strategic Alignment', 'Capacity Planning', 'Sunk Cost Management', 'Capital Allocation'],
    documents: [
      'Khung quy chuẩn quản trị danh mục dự án theo tiêu chuẩn PMI PfMP Standard',
      'Mô hình bảng tính phân tích dung lượng nguồn lực và cân đối danh mục dự án trên Excel'
    ]
  },
  {
    title: 'Quản Trị Dự Án Phần Mềm Chuyên Nghiệp Dành Cho Technical Program Manager (TPM)',
    slug: 'quan-tri-du-an-phan-mem-chuyen-nghiep-technical-program-manager-tpm',
    categorySlug: 'quan-ly-du-an-va-van-hanh',
    level: CourseLevel.ADVANCED,
    price: 990000,
    oldPrice: 1650000,
    leadSummary: 'Cầu nối quyền lực giữa Công nghệ và Kinh doanh: Quản lý kiến trúc hệ thống quy mô lớn, thỏa hiệp kỹ thuật (Technical Trade-offs), quản lý rủi ro phát hành và nợ kỹ thuật (Technical Debt).',
    industryContext: 'Vị trí Technical Program Manager (TPM) tại các tập đoàn công nghệ lớn như Google, Meta, Amazon đòi hỏi vừa phải có chiều sâu kỹ thuật phần mềm sắc sảo vừa có kỹ năng lãnh đạo dự án xuất chúng.',
    coreTopics: [
      'Vai trò của TPM: Điểm khác biệt so với Software Engineering Manager (EM) và Product Manager (PM)',
      'Đọc hiểu và đánh giá tài liệu thiết kế kỹ thuật (Technical Design Documents - TDD) và kiến trúc hệ thống phân tán',
      'Quản lý nợ kỹ thuật (Technical Debt) và thuyết phục các bên liên quan kinh doanh dành thời gian tái cấu trúc mã nguồn (Refactoring)',
      'Lập kế hoạch phát hành phần mềm quy mô lớn (Release Management): Triển khai theo giai đoạn (Canary/Blue-Green Deployments) và Rollback khẩn cấp',
      'Điều phối giải quyết sự cố nghiêm trọng (Incident Management) và chủ trì các buổi phân tích nguyên nhân gốc rễ không đổ lỗi (Blameless Post-mortem)'
    ],
    handsOnProject: 'Xây dựng bản kế hoạch chương trình kỹ thuật (Technical Program Plan) chi tiết cho việc di chuyển một hệ thống Microservices khổng lồ sang hạ tầng đám mây mới mà không gây gián đoạn dịch vụ.',
    targetAudience: 'Senior Software Engineer, Tech Lead, Engineering Manager muốn chuyển hướng sang vai trò TPM tại các công ty công nghệ lớn.',
    careerApplication: 'Chinh phục vị trí Technical Program Manager (TPM) với mức đãi ngộ đỉnh cao trong ngành công nghệ thông tin.',
    requirements: [
      'Nền tảng kỹ thuật phần mềm vững chắc (đã từng là lập trình viên hoặc kỹ sư hệ thống)',
      'Khả năng bao quát các bài toán kiến trúc phần mềm quy mô lớn'
    ],
    benefits: [
      'Nói chuyện bình đẳng và phản biện sắc bén các quyết định kiến trúc với các kỹ sư phần mềm kỳ cựu nhất',
      'Dự báo chính xác các rủi ro kỹ thuật ngầm mà những người quản lý dự án phi công nghệ không thể nhìn thấy',
      'Dẫn dắt các chiến dịch phát hành hệ thống phức tạp với độ an toàn cao tuyệt đối không xảy ra sự cố ngừng trệ',
      'Xây dựng văn hóa học hỏi và cải tiến liên tục từ các sự cố kỹ thuật thông qua báo cáo Post-mortem chuyên nghiệp'
    ],
    techniques: ['Technical Program Management (TPM)', 'Technical Debt', 'Blue-Green Deployment', 'System Architecture', 'Blameless Post-mortem', 'Incident Management'],
    documents: [
      'Mẫu tài liệu thiết kế chương trình kỹ thuật (Technical Design Document - TDD Template)',
      'Bộ khung quy trình ứng phó và báo cáo phân tích sự cố kỹ thuật chuẩn quốc tế'
    ]
  }
]
