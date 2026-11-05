import { CourseLevel } from '@prisma/client'
import { CourseBlueprint } from './categories-data'

export const COURSES_LANGUAGES: readonly CourseBlueprint[] = [
  // ==========================================
  // CAT-17: Ngoại ngữ ứng dụng & Luyện thi chứng chỉ (20 courses)
  // Quota: 6 BEGINNER, 9 INTERMEDIATE, 5 ADVANCED | 2 FREE, 18 PAID
  // ==========================================
  {
    title: 'Phát Âm Tiếng Anh Chuẩn Quốc Tế & Bảng Phiên Âm Quốc Tế IPA Cho Người Mới Bắt Đầu',
    slug: 'phat-am-tieng-anh-chuan-quoc-te-bang-ipa',
    categorySlug: 'ngoai-ngu-ung-dung',
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0,
    leadSummary: 'Nền tảng vững chắc để nói tiếng Anh tự nhiên: Làm chủ 44 âm trong bảng IPA, khẩu hình miệng, vị trí đặt lưỡi, quy tắc nối âm, nuốt âm và trọng âm từ/câu.',
    industryContext: 'Hơn 80% người Việt học tiếng Anh nhiều năm vẫn không thể giao tiếp vì phát âm sai cơ bản; chuẩn hóa phát âm là bước đi đầu tiên bắt buộc để nghe hiểu và nói lưu loát.',
    coreTopics: [
      'Giải phẫu khoang miệng và bảng ký hiệu phiên âm quốc tế IPA: 20 nguyên âm và 24 phụ âm',
      'Phân biệt các cặp âm dễ gây nhầm lẫn kinh điển: /iː/ vs /ɪ/, /e/ vs /æ/, /θ/ vs /ð/, /s/ vs /ʃ/',
      'Nguyên tắc bật âm đuôi (Ending Sounds) bắt buộc: /s/, /z/, /t/, /d/, /ed/ và âm /k/',
      'Quy tắc nhấn trọng âm từ (Word Stress) và sự biến đổi nguyên âm yếu thành âm Schwa /ə/',
      'Ngữ điệu tự nhiên (Intonation), Quy tắc luyến nối âm (Linking sounds) và nuốt âm (Elision) trong giao tiếp hàng ngày'
    ],
    handsOnProject: 'Thực hành đọc và ghi âm một đoạn hội thoại giao tiếp 2 phút chuẩn ngữ điệu, được chỉnh sửa khẩu hình chi tiết qua từng âm vị.',
    targetAudience: 'Người mất gốc tiếng Anh, người phát âm còn nặng âm tiếng Việt (Viet-glish), người chuẩn bị ôn thi IELTS/TOEIC.',
    careerApplication: 'Tự tin phát âm chuẩn xác, không còn cảm giác e ngại khi giao tiếp với người bản xứ và đối tác nước ngoài.',
    requirements: [
      'Gương nhỏ cầm tay để quan sát khẩu hình miệng và răng môi',
      'Điện thoại có chức năng ghi âm để nghe lại giọng đọc của bản thân'
    ],
    benefits: [
      'Tự tin đọc đúng phiên âm của bất kỳ từ mới nào khi tra từ điển Oxford/Cambridge',
      'Sửa dứt điểm thói quen nuốt âm đuôi và nói đều đều không trọng âm của người Việt',
      'Nghe hiểu người bản xứ dễ dàng hơn vì nắm rõ quy luật nối âm và nuốt âm khi họ nói nhanh',
      'Tạo dựng phong thái nói tiếng Anh tự nhiên, chuẩn xác và sang trọng'
    ],
    techniques: ['English Pronunciation', 'IPA Chart', 'Word Stress', 'Linking Sounds', 'Intonation', 'Mouth Positioning'],
    documents: [
      'Bảng phiên âm quốc tế IPA minh họa khẩu hình miệng chuẩn 3D',
      'Bộ thẻ bài luyện tập các cặp âm tương phản tối thiểu (Minimal Pairs)'
    ]
  },
  {
    title: 'Tiếng Anh Giao Tiếp Hàng Ngày Cho Người Mất Gốc: Tự Tin Trò Chuyện Sau 30 Ngày',
    slug: 'tieng-anh-giao-tiep-hang-ngay-cho-nguoi-mat-goc',
    categorySlug: 'ngoai-ngu-ung-dung',
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0,
    leadSummary: 'Phá vỡ rào cản sợ nói tiếng Anh: 30 chủ đề sinh hoạt quen thuộc, phản xạ đối thoại tức thì không cần dịch ngầm trong đầu và phương pháp Shadowing lặp lại.',
    industryContext: 'Học tiếng Anh không phải để làm bài tập ngữ pháp trên giấy mà để sử dụng như một công cụ kết nối cuộc sống; giao tiếp thực tế là thước đo năng lực ngôn ngữ chân thực nhất.',
    coreTopics: [
      '30 chủ đề giao tiếp đời thường: Chào hỏi, Giới thiệu bản thân, Đi cà phê, Mua sắm, Hỏi đường và Đặt phòng du lịch',
      'Phương pháp Shadowing (Nói nhại theo người bản xứ): Luyện phản xạ cơ miệng và bắt chước ngữ điệu cảm xúc',
      'Loại bỏ thói quen dịch từng từ từ tiếng Việt sang tiếng Anh trong đầu (Thinking in English)',
      '100 cấu trúc câu giao tiếp cửa miệng thông dụng nhất của người bản xứ',
      'Kỹ thuật xử lý khi không hiểu: Nhờ người khác nói chậm lại, Diễn đạt lại theo cách khác (Paraphrasing)'
    ],
    handsOnProject: 'Mô phỏng đóng vai thực hành 5 tình huống giao tiếp thực tế: Gọi món tại nhà hàng phương Tây, Mua sắm tại sân bay và Giới thiệu về quê hương với du khách.',
    targetAudience: 'Người bị mất gốc hoàn toàn, người sợ hãi khi phải mở miệng nói tiếng Anh, người chuẩn bị đi du lịch nước ngoài.',
    careerApplication: 'Tự tin du lịch khắp năm châu và giao lưu kết bạn quốc tế mà không cần người phiên dịch đi cùng.',
    requirements: [
      'Không yêu cầu biết ngữ pháp hay từ vựng trước đó',
      'Sự kiên nhẫn mở miệng nói to thành tiếng mỗi ngày'
    ],
    benefits: [
      'Tự tin chào hỏi và duy trì cuộc trò chuyện ngắn với người nước ngoài mà không bị ấp úng',
      'Xử lý trôi chảy mọi tình huống cơ bản khi đi du lịch nước ngoài (nhập cảnh, hỏi đường, khách sạn)',
      'Hình thành phản xạ bật ra câu nói ngay lập tức mà không cần mất thời gian ghép ngữ pháp trong đầu',
      'Tìm lại niềm say mê và sự tự tin đối với việc học ngoại ngữ'
    ],
    techniques: ['Conversational English', 'Shadowing Technique', 'Thinking in English', 'Survival English', 'Role-playing'],
    documents: [
      'Sổ tay bỏ túi 300 câu giao tiếp tiếng Anh thông dụng nhất cho người du lịch',
      'File âm thanh các đoạn hội thoại mẫu giọng đọc người bản xứ chuẩn Mỹ'
    ]
  },
  {
    title: 'Luyện Thi TOEIC 650+ Toàn Diện: Chiến Lược Nghe Đọc & Bẫy Đề Thi Thực Chiến',
    slug: 'luyen-thi-toeic-650-chien-luoc-nghe-doc-bay-de-thi',
    categorySlug: 'ngoai-ngu-ung-dung',
    level: CourseLevel.BEGINNER,
    price: 450000,
    oldPrice: 750000,
    leadSummary: 'Đạt chuẩn đầu ra đại học và mở rộng cơ hội việc làm: Làm chủ 7 phần thi TOEIC Listening & Reading, chiến thuật bắt từ khóa, kỹ năng quản lý thời gian và giải quyết bẫy đề ETS.',
    industryContext: 'Chứng chỉ TOEIC là yêu cầu chuẩn đầu ra bắt buộc của hầu hết các trường đại học và là tiêu chuẩn sàng lọc hồ sơ tuyển dụng hàng đầu của các doanh nghiệp tại Việt Nam.',
    coreTopics: [
      'Cấu trúc bài thi TOEIC 2 kỹ năng: 100 câu Nghe (Part 1-4) và 100 câu Đọc (Part 5-7) trong 120 phút',
      'Chiến lược Part 1 & 2: Bắt bẫy âm thanh tương tự (Similar sounds), Câu hỏi Wh-questions và câu hỏi bẫy gián tiếp',
      'Kỹ thuật đọc trước câu hỏi Part 3 & 4 (Đoạn đối thoại và Bài độc thoại) để định hướng vùng thông tin nghe',
      'Ngữ pháp trọng tâm Part 5 & 6: Từ loại, Thì động từ, Đại từ, Mệnh đề quan hệ và Liên từ',
      'Tăng tốc độ đọc hiểu Part 7 (Đoạn đơn & Đoạn kép): Kỹ thuật Skimming, Scanning và giải các câu hỏi suy luận (Inference Questions)'
    ],
    handsOnProject: 'Thực hành giải và phân tích chi tiết toàn bộ 200 câu của một đề thi thử TOEIC chuẩn format ETS mới nhất dưới áp lực thời gian thực tế.',
    targetAudience: 'Sinh viên cần chứng chỉ tốt nghiệp ra trường, Người đi làm cần nộp chứng chỉ tiếng Anh để xét tăng lương, thăng chức.',
    careerApplication: 'Đạt chứng chỉ TOEIC từ 650 đến 800 điểm, vượt qua vòng lọc hồ sơ tiếng Anh tại các ngân hàng, tập đoàn viễn thông và công ty đa quốc gia.',
    requirements: [
      'Nắm được ngữ pháp tiếng Anh cơ bản (các thì căn bản, danh từ, động từ)',
      'Quyết tâm giải đề và ôn tập từ vựng đều đặn hàng tuần'
    ],
    benefits: [
      'Nhận diện tức thì các bẫy đề thi kinh điển của viện khảo thí ETS để không bị mất điểm oan',
      'Phân bổ thời gian làm bài khoa học, không bao giờ bị thiếu giờ đánh lụi ở phần đọc Part 7',
      'Nắm chắc 600 từ vựng kinh doanh và thương mại xuất hiện với tần suất cao nhất trong bài thi',
      'Tăng từ 150 đến 250 điểm chỉ sau một lộ trình ôn luyện có phương pháp'
    ],
    techniques: ['TOEIC Prep', 'Listening Strategies', 'Reading Comprehension', 'ETS Trap Detection', 'Time Management', 'Business Vocabulary'],
    documents: [
      'Tuyển tập 600 từ vựng TOEIC cốt lõi chia theo 50 chủ đề kinh tế thương mại',
      'Bảng tổng hợp mẹo làm bài và công thức ngữ pháp Part 5 thần tốc'
    ]
  },
  {
    title: 'Tiếng Trung Nhập Môn Giao Tiếp & Luyện Thi HSK 1-2 Cho Người Mới Bắt Đầu',
    slug: 'tieng-trung-nhap-mon-giao-tiep-luyen-thi-hsk-1-2',
    categorySlug: 'ngoai-ngu-ung-dung',
    level: CourseLevel.BEGINNER,
    price: 399000,
    oldPrice: 650000,
    leadSummary: 'Chinh phục ngôn ngữ phổ biến nhất hành tinh: Làm chủ hệ thống phiên âm Pinyin, 4 thanh điệu, các nét chữ Hán cơ bản và giao tiếp tự tin ở trình độ HSK 1-2.',
    industryContext: 'Trung Quốc là đối tác thương mại lớn nhất của Việt Nam; biết tiếng Trung mở ra cơ hội kinh doanh buôn bán, nhập hàng tận gốc và làm việc tại các tập đoàn sản xuất lớn.',
    coreTopics: [
      'Hệ thống ngữ âm tiếng Trung (Pinyin): 21 thanh mẫu, 36 vận mẫu và quy tắc biến điệu thanh điệu',
      'Làm chủ 4 thanh điệu và thanh nhẹ (Khinh thanh): Luyện phát âm chuẩn không bị ngọng âm bật hơi',
      'Quy tắc bút thuận viết chữ Hán: 8 nét cơ bản và 7 quy tắc thứ tự nét viết chữ vuông',
      'Học chữ Hán qua 214 Bộ thủ: Hiểu ý nghĩa tượng hình và cách nhớ mặt chữ nhanh gấp 3 lần',
      'Giao tiếp theo chủ đề HSK 1-2: Mua bán mặc cả hàng hóa, Đi lại, Ăn uống và Hỏi thăm gia đình'
    ],
    handsOnProject: 'Tự tay viết 20 chữ Hán chuẩn bút thuận và thực hành quay video giới thiệu bản thân bằng tiếng Trung trôi chảy trong 2 phút.',
    targetAudience: 'Người mới bắt đầu học tiếng Trung từ con số 0, Dân buôn bán hàng Taobao/1688 muốn tự giao dịch, Người yêu thích văn hóa Trung Hoa.',
    careerApplication: 'Tự tin đàm phán mua hàng trực tiếp với các xưởng sản xuất Trung Quốc và đặt nền móng thi chứng chỉ HSK.',
    requirements: [
      'Vở ô ly chuyên dụng để luyện viết chữ Hán và bút ngòi mềm',
      'Không đòi hỏi năng khiếu ngoại ngữ trước đó'
    ],
    benefits: [
      'Phát âm chuẩn Pinyin ngay từ đầu giúp người bản xứ hiểu bạn ngay lập tức',
      'Nhớ mặt chữ Hán dễ dàng qua phương pháp chiết tự các bộ thủ tượng hình sinh động',
      'Giao tiếp mua bán cơ bản và chat hỏi giá sản phẩm với các shop Trung Quốc trên Taobao',
      'Tự tin đăng ký dự thi và đỗ chứng chỉ HSK 1 và HSK 2 với điểm số cao'
    ],
    techniques: ['Pinyin', 'Chinese Tones', 'Hanzi Writing', 'Radicals (Bộ thủ)', 'HSK 1-2', 'Taobao Chatting'],
    documents: [
      'Bảng tra cứu 214 bộ thủ chữ Hán kèm giải nghĩa hình ảnh sinh động',
      'Tập file PDF giấy kẻ ô Mễ tự (米) để in ra luyện viết chữ Hán chuẩn nét'
    ]
  },
  {
    title: 'Tiếng Nhật Nhập Môn Cấp Tốc: Bảng Chữ Cái Kana & Giao Tiếp Cơ Bản JLPT N5',
    slug: 'tieng-nhat-nhap-mon-cap-toc-bang-chu-cai-kana-jlpt-n5',
    categorySlug: 'ngoai-ngu-ung-dung',
    level: CourseLevel.BEGINNER,
    price: 399000,
    oldPrice: 650000,
    leadSummary: 'Bắt đầu hành trình chinh phục tiếng Nhật: Thuộc làu 2 bảng chữ cái Hiragana và Katakana trong 7 ngày, quy tắc phát âm, biến âm, âm ngắt và mẫu câu giao tiếp cơ bản N5.',
    industryContext: 'Nhật Bản là một trong những nhà đầu tư trực tiếp lớn nhất tại Việt Nam; nhân sự biết tiếng Nhật luôn được săn đón với mức lương cao hơn từ 30-50% so với mặt bằng chung.',
    coreTopics: [
      'Bảng chữ cái mềm Hiragana: 46 chữ cái cơ bản, Âm đục (Dakuon), Âm bán đục và Âm ghép (Yoon)',
      'Bảng chữ cái cứng Katakana: Quy tắc phiên âm từ mượn tiếng nước ngoài vào tiếng Nhật',
      'Quy tắc trường âm (Âm kéo dài), Âm ngắt (Sokuon) và Trợ từ đặc biệt (Wa, E, O)',
      'Ngữ pháp căn bản Giáo trình Minna no Nihongo (Bài 1-10): Mẫu câu khẳng định, Phủ định, Nghi vấn và Sở hữu',
      'Văn hóa chào hỏi cúi đầu (Ojigi) và các mẫu câu giao tiếp ứng xử lịch sự chuẩn mực của người Nhật'
    ],
    handsOnProject: 'Viết một bức thư ngắn bằng tiếng Nhật tự giới thiệu về sở thích và gia đình bằng bảng chữ cái Hiragana và Katakana chuẩn xác.',
    targetAudience: 'Người chuẩn bị đi du học hoặc xuất khẩu lao động sang Nhật Bản, Kỹ sư IT muốn làm việc với khách hàng Nhật (Bridge SE), Người yêu thích Anime/Manga.',
    careerApplication: 'Đặt viên gạch đầu tiên trên con đường trở thành Kỹ sư cầu nối IT hoặc nhân sự cho các tập đoàn Nhật Bản.',
    requirements: [
      'Vở kẻ ô vuông để luyện viết chữ Kana và bút chì hoặc bút bi đen',
      'Sự chăm chỉ luyện tập viết chữ mỗi ngày 30 phút'
    ],
    benefits: [
      'Thuộc làu và phân biệt chuẩn xác 2 bảng chữ cái tiếng Nhật chỉ sau 1 tuần học tập',
      'Đọc vanh vách các từ vựng tiếng Nhật có phiên âm và các biển hiệu chữ cứng Katakana',
      'Nắm bắt được ngữ pháp đảo ngược vị trí động từ ở cuối câu đặc trưng của tiếng Nhật',
      'Tự tin chào hỏi và giao tiếp lễ phép đúng chuẩn tác phong doanh nghiệp Nhật'
    ],
    techniques: ['Hiragana', 'Katakana', 'Japanese Pronunciation', 'Minna no Nihongo', 'JLPT N5 Basics', 'Japanese Etiquette'],
    documents: [
      'Bảng tập viết 2 bảng chữ cái Hiragana & Katakana theo chuẩn nét bút của Bộ Giáo dục Nhật Bản',
      'Bộ Flashcard điện tử học chữ Kana nhanh chóng trên ứng dụng Anki'
    ]
  },
  {
    title: 'Tiếng Hàn Sơ Cấp: Bảng Chữ Cái Hangul & Giao Tiếp Thực Dụng Hàng Ngày',
    slug: 'tieng-han-so-cap-bang-chu-cai-hangul-giao-tiep',
    categorySlug: 'ngoai-ngu-ung-dung',
    level: CourseLevel.BEGINNER,
    price: 399000,
    oldPrice: 650000,
    leadSummary: 'Làm chủ chữ viết khoa học nhất thế giới Hangul: Nguyên âm, phụ âm, cách ghép vần, quy tắc nối âm (Patchim) và các mẫu câu giao tiếp đời sống như trong phim Hàn.',
    industryContext: 'Hàn Quốc là đối tác kinh tế chiến lược hàng đầu của Việt Nam với sự hiện diện khổng lồ của Samsung, LG, Hyundai; biết tiếng Hàn mang lại lợi thế nghề nghiệp rất lớn.',
    coreTopics: [
      'Lịch sử và nguyên lý khoa học của bảng chữ cái Hangul do Vua Sejong sáng tạo',
      'Hệ thống 21 nguyên âm (Đơn, Kép) và 19 phụ âm (Đơn, Đôi, Bật hơi) chuẩn khẩu hình',
      'Quy tắc ghép chữ khối vuông và làm chủ các loại phụ âm cuối (Patchim - Đơn và Đôi)',
      'Các quy tắc biến âm phức tạp trong tiếng Hàn: Quy tắc nối âm, Đồng hóa âm, Biến âm mũi',
      'Mẫu câu giao tiếp cơ bản: Đuôi câu lịch sự trang trọng (-mnida) và đuôi câu thân mật đời thường (-yo)'
    ],
    handsOnProject: 'Thực hành đọc trôi chảy lời một bài hát K-Pop nổi tiếng và diễn một đoạn hội thoại gọi đồ ăn tại quán nướng Hàn Quốc.',
    targetAudience: 'Người hâm mộ làn sóng Hallyu (K-pop, K-drama), Người chuẩn bị du học Hàn Quốc, Nhân viên làm việc tại các công ty Hàn Quốc.',
    careerApplication: 'Tự tin giao tiếp với sếp và đồng nghiệp người Hàn Quốc, mở rộng cơ hội việc làm tại các doanh nghiệp FDI Hàn Quốc.',
    requirements: [
      'Sổ tay ghi chép và niềm yêu thích với văn hóa ẩm thực, âm nhạc xứ sở kim chi',
      'Không yêu cầu bất kỳ kiến thức nền tảng nào'
    ],
    benefits: [
      'Đọc được tất cả các bảng hiệu, thực đơn và lời bài hát tiếng Hàn chỉ sau 5 buổi học',
      'Phát âm chuẩn xác các âm bật hơi và âm căng không bị nhầm lẫn',
      'Hiểu rõ sự khác biệt về các cấp độ kính ngữ trong văn hóa ứng xử Hàn Quốc',
      'Đặt nền tảng vững chắc để tiếp tục học lên cấp độ luyện thi chứng chỉ Topik I'
    ],
    techniques: ['Hangul', 'Korean Pronunciation', 'Patchim Rules', 'Honorifics (Kính ngữ)', 'Conversational Korean', 'K-Culture'],
    documents: [
      'Sơ đồ tóm tắt quy tắc ghép vần và bảng biến âm Patchim tiếng Hàn đầy đủ nhất',
      'Tuyển tập 100 câu thoại giao tiếp đời sống thông dụng nhất trong phim truyền hình Hàn'
    ]
  },
  {
    title: 'Tiếng Anh Doanh Nghiệp (Business English): Viết Email Chuyên Nghiệp & Thuyết Trình Hội Thảo',
    slug: 'tieng-anh-doanh-nghiep-business-english-viet-email-thuyet-trinh',
    categorySlug: 'ngoai-ngu-ung-dung',
    level: CourseLevel.INTERMEDIATE,
    price: 650000,
    oldPrice: 990000,
    leadSummary: 'Nâng tầm phong thái chuyên nghiệp trong môi trường đa quốc gia: Soạn thảo email công việc chuẩn mực, điều hành cuộc họp bằng tiếng Anh và đàm phán hợp đồng thương mại.',
    industryContext: 'Trong môi trường công sở quốc tế, việc sử dụng sai từ ngữ hoặc hành văn cộc lốc trong email có thể làm hỏng thương vụ làm ăn và làm xấu hình ảnh chuyên nghiệp của bạn.',
    coreTopics: [
      'Cấu trúc chuẩn mực của một Email công sở quốc tế: Tiêu đề rõ ràng, Lời chào mở đầu, Trình bày mục đích và Lời kết lịch thiệp',
      'Nghệ thuật sử dụng ngôn ngữ giảm nhẹ (Polite & Diplomatic Language): Tránh dùng từ ra lệnh trực tiếp, sử dụng trợ động từ khiếm khuyết (Could, Would, Should)',
      'Soạn thảo các dạng email công việc phổ biến: Báo cáo tiến độ, Yêu cầu thông tin, Khiếu nại đối tác và Thư xin lỗi khách hàng',
      'Từ vựng và cấu trúc điều hành cuộc họp trực tuyến quốc tế: Bắt đầu cuộc họp, Ngắt lời lịch sự, Xin ý kiến và Tóm tắt quyết định',
      'Thuyết trình số liệu kinh doanh bằng tiếng Anh: Mô tả xu hướng biểu đồ (Tăng vọt, Giảm sút, Dao động, Ổn định)'
    ],
    handsOnProject: 'Soạn thảo một chuỗi 3 email trao đổi đàm phán lại thời hạn giao hàng với đối tác Mỹ kèm theo thư giải trình khó khăn khách quan mang tính thuyết phục cao.',
    targetAudience: 'Nhân viên văn phòng, Quản lý dự án, Chuyên viên xuất nhập khẩu, Bất kỳ ai phải làm việc với sếp hoặc khách hàng nước ngoài.',
    careerApplication: 'Tự tin làm việc trong môi trường đa quốc gia, nâng cao uy tín chuyên môn và xóa bỏ rào cản ngôn ngữ nơi công sở.',
    requirements: [
      'Trình độ tiếng Anh tương đương tiền trung cấp (B1 / TOEIC 500+ trở lên)',
      'Đang làm việc hoặc chuẩn bị làm việc trong môi trường văn phòng'
    ],
    benefits: [
      'Viết các email công việc bằng tiếng Anh sang trọng, lịch thiệp và mạch lạc trong vòng 5 phút',
      'Không bao giờ bị hiểu lầm là thô lỗ hay gay gắt nhờ làm chủ ngôn ngữ ngoại giao giảm nhẹ',
      'Tự tin dẫn dắt và đóng góp ý kiến trong các cuộc họp trực tuyến với các đồng nghiệp quốc tế',
      'Thuyết trình các báo cáo số liệu kinh doanh một cách lưu loát và chuyên nghiệp'
    ],
    techniques: ['Business English', 'Email Writing', 'Diplomatic Language', 'Meeting Moderation', 'Data Description', 'Cross-cultural Business'],
    documents: [
      'Bộ sưu tập 50 mẫu Email công sở chuẩn quốc tế cho mọi tình huống công việc',
      'Từ điển các cụm từ vựng mô tả biểu đồ kinh doanh và xu hướng thị trường'
    ]
  },
  {
    title: 'Luyện Thi IELTS Writing 6.5+ Toàn Diện: Task 1 (Biểu Đồ) & Task 2 (Nghị Luận Xã Hội)',
    slug: 'luyen-thi-ielts-writing-65-task-1-task-2',
    categorySlug: 'ngoai-ngu-ung-dung',
    level: CourseLevel.INTERMEDIATE,
    price: 790000,
    oldPrice: 1250000,
    leadSummary: 'Chinh phục kỹ năng khó nhằn nhất trong bài thi IELTS: Phân tích 4 tiêu chí chấm điểm (TR, CC, LR, GRA), bóc tách số liệu Task 1 và phát triển luận điểm logic cho Task 2.',
    industryContext: 'IELTS Writing là kỹ năng có điểm trung bình thấp nhất của thí sinh Việt Nam; việc hiểu rõ ma trận chấm điểm và tư duy lập luận mạch lạc là chìa khóa bứt phá lên Band 6.5 - 7.5.',
    coreTopics: [
      'Bốn tiêu chí chấm điểm IELTS Writing chính thức: Task Achievement/Response, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy',
      'Làm chủ Task 1: Phân loại biểu đồ có xu hướng thay đổi theo thời gian (Line/Bar) vs Biểu đồ so sánh tĩnh (Pie/Table) và Dạng Bản đồ (Map) / Quy trình (Process)',
      'Cấu trúc Task 1 chuẩn mực 4 đoạn: Mở bài (Paraphrase) -> Tổng quan (Overview) -> Hai đoạn chi tiết số liệu',
      'Làm chủ Task 2: Các dạng bài nghị luận kinh điển (Agree/Disagree, Discuss Both Views, Problem-Solution, Two-part Questions)',
      'Phát triển luận điểm Task 2 chặt chẽ theo mô hình PEEL (Point, Explanation, Example, Link) và tránh tư duy dịch thô'
    ],
    handsOnProject: 'Viết hoàn chỉnh 1 bài Task 1 phân tích biểu đồ đường kết hợp và 1 bài luận Task 2 về chủ đề Trí tuệ nhân tạo và việc làm đạt chuẩn Band 7.0.',
    targetAudience: 'Học viên đang ôn thi IELTS với mục tiêu du học hoặc định cư, người đang bị mắc kẹt ở Band điểm Writing 5.5 - 6.0.',
    careerApplication: 'Đạt điều kiện nhập học tại các trường đại học hàng đầu thế giới hoặc hoàn thiện hồ sơ định cư diện tay nghề cao.',
    requirements: [
      'Trình độ tiếng Anh tương đương IELTS 5.0 trở lên',
      'Khả năng tư duy logic và vốn hiểu biết xã hội tổng quan'
    ],
    benefits: [
      'Nắm bắt công thức viết đoạn Overview thần thánh giúp bài Task 1 luôn được chấm từ Band 7 trở lên ở tiêu chí Task Achievement',
      'Không bao giờ bị cạn kiệt ý tưởng làm bài Task 2 nhờ hệ thống phát triển luận điểm PEEL đa chiều',
      'Làm chủ hệ thống từ nối (Cohesive Devices) tự nhiên, không bị máy móc gượng gạo',
      'Kiểm soát lỗi sai ngữ pháp và tăng cường các cấu trúc câu phức đắt giá'
    ],
    techniques: ['IELTS Writing', 'Task 1 Overview', 'Task 2 Essay', 'PEEL Structure', 'Cohesion and Coherence', 'Band Descriptors'],
    documents: [
      'Bảng tiêu chí chấm điểm chi tiết IELTS Writing Band Descriptors phân tích chuyên sâu',
      'Tuyển tập 30 bài mẫu Writing Task 1 và Task 2 đạt Band 8.0 kèm phân tích từ vựng'
    ]
  },
  {
    title: 'Luyện Thi IELTS Speaking 7.0+: Phản Xạ Trôi Chảy & Phát Triển Ý Tưởng Đa Chiều',
    slug: 'luyen-thi-ielts-speaking-70-phan-xa-troi-chay-y-tuong',
    categorySlug: 'ngoai-ngu-ung-dung',
    level: CourseLevel.INTERMEDIATE,
    price: 750000,
    oldPrice: 1190000,
    leadSummary: 'Tự tin đối thoại trực tiếp với giám khảo bản xứ: Chiến thuật mở rộng câu trả lời Part 1, lập dàn ý thần tốc 1 phút cho Part 2 và lập luận tư duy trừu tượng sắc sảo trong Part 3.',
    industryContext: 'Nhiều thí sinh học thuộc lòng các bài mẫu và bị giám khảo trừ điểm nặng vì nói như người máy; khóa học tập trung rèn luyện tư duy ngôn ngữ tự nhiên và phản xạ ngôn ngữ thực tế.',
    coreTopics: [
      'Bốn tiêu chí chấm điểm IELTS Speaking: Fluency & Coherence, Lexical Resource, Grammatical Range & Accuracy, Pronunciation',
      'Chiến lược trả lời Part 1: Công thức mở rộng câu trả lời A.R.E.A (Answer, Reason, Example, Alternative) để tránh trả lời cộc lốc Yes/No',
      'Làm chủ Part 2: Tận dụng 1 phút chuẩn bị với kỹ thuật vẽ Mindmap và kỹ thuật Kể chuyện (Storytelling) duy trì bài nói trọn vẹn 2 phút',
      'Chinh phục Part 3 hóc búa: Kỹ thuật câu giờ tự nhiên (Filler Phrases), Đưa ra quan điểm đa chiều và Nhìn nhận vấn đề ở tầm vĩ mô',
      'Sử dụng thành ngữ (Idiomatic Expressions) và Cụm từ cố định (Collocations) tự nhiên đúng ngữ cảnh'
    ],
    handsOnProject: 'Thực hành một bài thi thử IELTS Speaking đầy đủ 3 phần kéo dài 14 phút với giảng viên và nhận bản phân tích lỗi phát âm, từ vựng chi tiết.',
    targetAudience: 'Thí sinh chuẩn bị thi IELTS muốn đạt điểm Speaking từ 6.5 đến 7.5+, người bị thiếu ý tưởng khi nói tiếng Anh.',
    careerApplication: 'Tạo ấn tượng xuất sắc với giám khảo IELTS và tự tin tranh luận, phỏng vấn xin học bổng quốc tế.',
    requirements: [
      'Có khả năng giao tiếp tiếng Anh cơ bản (tương đương Band 5.0+)',
      'Tinh thần cởi mở, không ngại chia sẻ quan điểm và trải nghiệm cá nhân'
    ],
    benefits: [
      'Nói tiếng Anh tự nhiên, mượt mà mà không có những khoảng dừng ậm ừ ngắt quãng kéo dài',
      'Tự tin nói đủ 2 phút trong Part 2 mà không bị bí từ hay hết ý giữa chừng',
      'Trả lời các câu hỏi trừu tượng khó nhằn của Part 3 một cách sâu sắc, đĩnh đạc',
      'Sử dụng các từ vựng Collocations ăn điểm tự nhiên như người bản ngữ'
    ],
    techniques: ['IELTS Speaking', 'Part 2 Mindmap', 'AREA Technique', 'Fillers & Hesitation', 'Collocations & Idioms', 'Fluency Training'],
    documents: [
      'Bộ đề dự đoán IELTS Speaking quý mới nhất kèm dàn ý gợi ý câu trả lời',
      'Tuyển tập 100 Collocations và Idioms tự nhiên nhất cho bài thi Speaking'
    ]
  },
  {
    title: 'Tiếng Trung Thương Mại: Đàm Phán Hợp Đồng, Đặt Hàng Nhà Xưởng & Đánh Hàng Quảng Châu',
    slug: 'tieng-trung-thuong-mai-dam-phan-hop-dong-danh-hang-quang-chau',
    categorySlug: 'ngoai-ngu-ung-dung',
    level: CourseLevel.INTERMEDIATE,
    price: 690000,
    oldPrice: 1050000,
    leadSummary: 'Làm chủ ngôn ngữ buôn bán thực chiến với người Trung Quốc: Khảo sát chợ đầu mối Quảng Châu, hỏi giá sỉ, ép giá xưởng, thỏa thuận điều khoản hợp đồng và kiểm soát chất lượng.',
    industryContext: 'Kinh doanh buôn bán với đối tác Trung Quốc đòi hỏi bạn phải hiểu rõ văn hóa giao thương và các thuật ngữ buôn bán đặc thù; biết tiếng Trung thương mại giúp bạn tiết kiệm hàng tỷ đồng tiền hàng.',
    coreTopics: [
      'Từ vựng chuyên ngành buôn bán thương mại: Giá xuất xưởng, Số lượng đặt hàng tối thiểu (MOQ), Đóng gói, Chiết khấu và Vận chuyển',
      'Giao tiếp tại các chợ đầu mối Quảng Châu, Nghĩa Ô (Yiwu): Kỹ thuật mặc cả, Đòi mẫu thử miễn phí và Kiểm tra chất lượng vải vóc, linh kiện',
      'Đàm phán trực tuyến qua WeChat và 1688: Mẫu câu chat ép giá xưởng và thỏa thuận làm thương hiệu riêng (OEM/ODM)',
      'Đọc hiểu và soạn thảo Hợp đồng ngoại thương Trung - Việt cơ bản: Phương thức thanh toán, Thời hạn giao hàng và Bồi thường hàng lỗi',
      'Văn hóa kinh doanh Trung Hoa: Nghệ thuật Quan hệ (Guanxi), Quy tắc mời rượu và giữ thể diện (Mianzi) trên bàn tiệc'
    ],
    handsOnProject: 'Mô phỏng đàm phán một hợp đồng đặt gia công 1000 sản phẩm thời trang thiết kế riêng với một xưởng may Quảng Châu qua ứng dụng WeChat.',
    targetAudience: 'Chủ shop kinh doanh thời trang, gia dụng, Dân buôn hàng Trung Quốc, Nhân viên xuất nhập khẩu, Chuyên viên tìm nguồn hàng (Sourcing).',
    careerApplication: 'Tự tin đi sang Trung Quốc đánh hàng trực tiếp không cần thuê phiên dịch viên, tối ưu hóa tối đa giá vốn kinh doanh.',
    requirements: [
      'Đã có kiến thức tiếng Trung căn bản (tương đương HSK 2-3 trở lên)',
      'Có quan tâm đến hoạt động kinh doanh buôn bán thực tế'
    ],
    benefits: [
      'Tự tin đi chợ Quảng Châu khảo sát nguồn hàng và nói chuyện sòng phẳng với các chủ xưởng Trung Quốc',
      'Nhập hàng tận gốc với mức giá sỉ rẻ nhất mà không bị các đầu nậu trung gian ăn chênh lệch',
      'Hiểu rõ các điều khoản hợp đồng kinh tế bằng tiếng Trung để tránh rủi ro lừa đảo thanh toán',
      'Thiết lập mối quan hệ hợp tác làm ăn thân thiết dài hạn với các đối tác cung ứng'
    ],
    techniques: ['Business Chinese', 'WeChat Sourcing', '1688 Negotiation', 'Guangzhou Wholesale', 'Contract Terms', 'Guanxi Culture'],
    documents: [
      'Sổ tay bỏ túi bản đồ các chợ đầu mối lớn nhất Quảng Châu và Nghĩa Ô kèm mẫu câu giao tiếp',
      'Mẫu Hợp đồng mua bán ngoại thương song ngữ Trung - Việt chuẩn mực'
    ]
  },
  {
    title: 'Luyện Thi Tiếng Trung HSK 4-5 Toàn Diện: Bứt Phá Từ Vựng, Ngữ Pháp & Kỹ Năng Đọc Viết',
    slug: 'luyen-thi-tieng-trung-hsk-4-5-toan-dien',
    categorySlug: 'ngoai-ngu-ung-dung',
    level: CourseLevel.INTERMEDIATE,
    price: 790000,
    oldPrice: 1250000,
    leadSummary: 'Chinh phục cột mốc HSK trung - cao cấp: Nắm vững 2500 từ vựng cốt lõi HSK 5, làm chủ các cấu trúc ngữ pháp nâng cao, chiến thuật nghe hiểu tốc độ nhanh và kỹ thuật viết bài luận 80 chữ.',
    industryContext: 'Chứng chỉ HSK 4-5 là điều kiện bắt buộc để xin học bổng toàn phần du học Trung Quốc (Học bổng Khổng Tử, CSC) và là tấm vé vàng ứng tuyển vào các tập đoàn viễn thông, công nghệ Trung Quốc.',
    coreTopics: [
      'Cấu trúc đề thi HSK 4 và HSK 5 theo chuẩn mới nhất: 3 phần Nghe, Đọc, Viết',
      'Làm chủ 2500 từ vựng HSK 5: Phân biệt các cặp từ gần nghĩa khó nhằn và các thành ngữ 4 chữ (Thành ngữ Thành ngữ Thành ngữ Thành ngữ Thành ngữ)',
      'Ngữ pháp trung cao cấp: Câu chữ Ba (把), Câu chữ Bị (被), Bổ ngữ kết quả, Bổ ngữ xu hướng phức tạp và Liên từ biểu thị logic',
      'Chiến lược làm bài Đọc hiểu: Kỹ thuật chọn từ điền vào chỗ trống và đọc nhanh nắm ý bài văn dài',
      'Chiến thuật phần Viết: Sắp xếp trật tự từ trong câu và kỹ thuật viết bài văn 80 chữ dựa trên tranh vẽ hoặc từ khóa'
    ],
    handsOnProject: 'Thực hành giải trọn vẹn một đề thi HSK 5 chính thức dưới áp lực thời gian và viết bài luận 80 chữ đạt chuẩn chấm điểm của Hanban.',
    targetAudience: 'Sinh viên chuyên ngành tiếng Trung, Người muốn xin học bổng du học Trung Quốc, Người cần chứng chỉ HSK 5 để làm việc.',
    careerApplication: 'Tự tin ứng tuyển học bổng thạc sĩ/đại học tại các trường đại học danh tiếng Trung Quốc hoặc làm biên phiên dịch viên.',
    requirements: [
      'Đã hoàn thành trình độ tiếng Trung HSK 3 hoặc có vốn từ vựng khoảng 600 từ',
      'Quyết tâm cao độ học thuộc từ vựng hàng ngày qua Flashcard'
    ],
    benefits: [
      'Mở rộng vốn từ vựng lên 2500 từ giúp bạn tự tin đọc hiểu báo chí và tiểu thuyết tiếng Trung',
      'Không còn sợ hãi phần thi Viết nhờ nắm vững các cấu trúc câu văn mẫu đạt điểm cao',
      'Nắm bắt được các bẫy đảo trật tự từ và bẫy phát âm tương tự trong phần thi Nghe',
      'Đạt chứng chỉ HSK 5 với điểm số từ 220 trở lên mở toang cánh cửa du học và học bổng'
    ],
    techniques: ['HSK 4-5', 'Chengyu (Thành ngữ)', 'Chinese Grammar Ba & Bei', 'Writing Essays', 'Listening Traps', 'Hanban Standards'],
    documents: [
      'Bảng danh sách 2500 từ vựng HSK 5 phân loại theo từ loại kèm ví dụ mẫu',
      'Bộ đề thi thử HSK 5 có file nghe MP3 chuẩn phòng thi và đáp án chi tiết'
    ]
  },
  {
    title: 'Luyện Thi Tiếng Nhật JLPT N3 Cấp Tốc: Nắm Chắc 650 Kanji & Ngữ Pháp Trung Cấp',
    slug: 'luyen-thi-tieng-nhat-jlpt-n3-cap-toc-kanji-ngu-phap',
    categorySlug: 'ngoai-ngu-ung-dung',
    level: CourseLevel.INTERMEDIATE,
    price: 750000,
    oldPrice: 1190000,
    leadSummary: 'Vượt qua bức tường N3 - Cột mốc quan trọng nhất của người học tiếng Nhật: Nắm vững 650 chữ Hán (Kanji), 150 mẫu ngữ pháp trung cấp, chiến thuật đọc hiểu đoạn văn dài và kỹ năng nghe hiểu bắt từ khóa.',
    industryContext: 'JLPT N3 là yêu cầu tối thiểu của hầu hết các công ty Nhật Bản tại Việt Nam khi tuyển dụng nhân sự văn phòng và kỹ sư công nghệ thông tin.',
    coreTopics: [
      'Chiến lược học và nhớ 650 chữ Hán N3: Âm On (Onyomi), Âm Kun (Kunyomi) và mẹo nhớ mặt chữ theo bộ thủ',
      'Tổng hợp 150 mẫu ngữ pháp N3 thông dụng nhất theo các nhóm ý nghĩa: Nguyên nhân - kết quả, So sánh, Giả định và Nhượng bộ',
      'Chiến thuật phần Đọc hiểu (Dokkai): Kỹ thuật đọc đoạn văn ngắn, Trung văn, Trường văn và tìm kiếm thông tin trên biểu mẫu thông báo',
      'Chiến lược phần Nghe hiểu (Choukai): Nghe hiểu nhiệm vụ (Mondai 1), Nghe hiểu điểm cốt lõi (Mondai 2) và Phản xạ đối đáp nhanh (Mondai 5)',
      'Luyện đề thi thử chuẩn cấu trúc và chiến thuật phân bổ thời gian làm bài thi JLPT'
    ],
    handsOnProject: 'Thực hành giải và phân tích cặn kẽ toàn bộ đề thi JLPT N3 chính thức các năm gần đây, giải thích rõ nguyên nhân chọn đáp án đúng.',
    targetAudience: 'Học viên đã hoàn thành trình độ N4 muốn bứt phá lên N3, Kỹ sư IT chuẩn bị phỏng vấn với khách hàng Nhật Bản.',
    careerApplication: 'Đạt chứng chỉ JLPT N3 giúp bạn đủ điều kiện làm việc trực tiếp với người Nhật và nhận trợ cấp tiếng Nhật hàng tháng.',
    requirements: [
      'Đã nắm chắc kiến thức sơ cấp N4 và 300 chữ Kanji cơ bản',
      'Sự kiên trì học chữ Hán Kanji đều đặn mỗi ngày'
    ],
    benefits: [
      'Không còn cảm giác sợ hãi trước những trang văn bản dày đặc chữ Hán Kanji của tiếng Nhật',
      'Phân biệt rõ ràng các mẫu ngữ pháp N3 có ý nghĩa tương tự nhau nhưng khác nhau về sắc thái biểu cảm',
      'Nâng cao tốc độ đọc hiểu Dokkai để không bao giờ bị cháy giờ làm bài thi',
      'Tự tin nghe bắt kịp tốc độ nói tự nhiên của người Nhật trong các tình huống công sở'
    ],
    techniques: ['JLPT N3', 'Kanji Onyomi & Kunyomi', 'Dokkai Strategies', 'Choukai Listening', 'Grammar Nuances', 'Time Allocation'],
    documents: [
      'Sổ tay 650 chữ Kanji N3 tổng hợp đầy đủ âm On, âm Kun và các từ ghép thông dụng',
      'Bảng tổng hợp so sánh 150 mẫu ngữ pháp N3 dễ gây nhầm lẫn nhất'
    ]
  },
  {
    title: 'Tiếng Nhật Thương Mại & Kính Ngữ (Keigo) Chuyên Nghiệp Trong Doanh Nghiệp Nhật',
    slug: 'tieng-nhat-thuong-mai-kinh-ngu-keigo-chuyen-nghiep',
    categorySlug: 'ngoai-ngu-ung-dung',
    level: CourseLevel.INTERMEDIATE,
    price: 690000,
    oldPrice: 1050000,
    leadSummary: 'Làm chủ đỉnh cao giao tiếp tiếng Nhật: Phân biệt chính xác Tôn kính ngữ (Sonkeigo), Khiêm nhường ngữ (Kenjougo), Lịch sự ngữ (Teineigo) và quy tắc ứng xử Hourensou trong công sở Nhật.',
    industryContext: 'Người Nhật rất coi trọng sự tôn ti trật tự và phép tắc lịch thiệp; sử dụng sai kính ngữ có thể bị coi là bất lịch sự và làm tổn hại nghiêm trọng đến mối quan hệ hợp tác làm ăn.',
    coreTopics: [
      'Bản chất và cấu trúc của Kính ngữ (Keigo): Khái niệm Người trong (Uchi) và Người ngoài (Soto) trong văn hóa Nhật',
      'Tôn kính ngữ (Sonkeigo): Nâng cao hành động của cấp trên và khách hàng đối tác',
      'Khiêm nhường ngữ (Kenjougo): Hạ thấp hành động của bản thân và người cùng phe để bày tỏ sự khiêm nhường',
      'Kỹ năng nghe và nhận cuộc gọi điện thoại văn phòng chuẩn mực bằng tiếng Nhật: Lời chào, Xin lỗi khi làm phiền, Chuyển máy và Ghi chép tin nhắn',
      'Văn hóa làm việc chuẩn Nhật Bản: Triết lý Hou-Ren-Sou (Báo cáo - Liên lạc - Thảo luận) và văn hóa xin lỗi (Meiwaku)'
    ],
    handsOnProject: 'Thực hành đóng vai xử lý một tình huống nhận cuộc gọi phàn nàn của khách hàng Nhật Bản, xin lỗi lịch thiệp bằng Khiêm nhường ngữ và thực hiện báo cáo Hourensou cho sếp.',
    targetAudience: 'Nhân viên đang làm việc tại các công ty Nhật Bản, Thông dịch viên tiếng Nhật mới vào nghề, Kỹ sư IT làm việc với khách hàng Nhật.',
    careerApplication: 'Tạo dựng tác phong làm việc chuẩn mực của một doanh nhân Nhật Bản thực thụ, ghi điểm tuyệt đối trong mắt ban lãnh đạo người Nhật.',
    requirements: [
      'Trình độ tiếng Nhật tương đương JLPT N3 trở lên',
      'Có mong muốn tìm hiểu sâu về văn hóa và tâm lý ứng xử của người Nhật'
    ],
    benefits: [
      'Sử dụng kính ngữ Keigo một cách tự nhiên, phản xạ mượt mà không bị ngập ngừng lắp bắp',
      'Không bao giờ bị mắc lỗi nhầm lẫn tai hại giữa việc nâng mình lên và hạ đối tác xuống',
      'Viết các email công việc và nghe điện thoại đối tác Nhật Bản với sự tự tin tuyệt đối',
      'Nắm bắt được tâm lý và cách làm việc tinh tế của các đối tác kinh doanh Nhật Bản'
    ],
    techniques: ['Keigo', 'Sonkeigo', 'Kenjougo', 'Hourensou', 'Japanese Phone Etiquette', 'Uchi and Soto'],
    documents: [
      'Bảng tra cứu đối chiếu chuyển đổi động từ thông thường sang Tôn kính ngữ và Khiêm nhường ngữ',
      'Bộ mẫu kịch bản hội thoại nghe và gọi điện thoại văn phòng chuẩn công ty Nhật'
    ]
  },
  {
    title: 'Luyện Thi Tiếng Hàn TOPIK II (Cấp 3-4): Làm Chủ Đọc Hiểu & Kỹ Thuật Viết Câu 51-54',
    slug: 'luyen-thi-tieng-han-topik-2-cap-3-4-ky-thuat-viet',
    categorySlug: 'ngoai-ngu-ung-dung',
    level: CourseLevel.INTERMEDIATE,
    price: 750000,
    oldPrice: 1190000,
    leadSummary: 'Đột phá chứng chỉ TOPIK trung cấp: Nắm chắc chiến lược làm bài Đọc hiểu 50 câu, kỹ năng nghe bắt bẫy và bí quyết viết trọn vẹn 4 câu phần thi Viết (Câu 51, 52 điền từ và Câu 53, 54 viết luận).',
    industryContext: 'Chứng chỉ TOPIK 3-4 là điều kiện tiên quyết để chuyển đổi visa lao động chuyên môn (E-7) tại Hàn Quốc và xin việc tại các tập đoàn lớn của Hàn Quốc tại Việt Nam.',
    coreTopics: [
      'Cấu trúc đề thi TOPIK II: Phân bổ điểm số giữa Nghe (100 điểm), Đọc (100 điểm) và Viết (100 điểm)',
      'Chiến lược phần thi Viết (Sseugi): Kỹ thuật điền từ chuẩn văn phong viết cho Câu 51 (Thư tín) và Câu 52 (Giải thích khoa học)',
      'Làm chủ Câu 53 (Viết biểu đồ 200-300 chữ): Các mẫu câu miêu tả xu hướng tăng giảm, Nguyên nhân và Triển vọng tương lai đạt điểm tối đa',
      'Chinh phục Câu 54 (Bài luận nghị luận 600-700 chữ): Dàn ý 3 phần, Từ vựng cao cấp và Triển khai luận điểm logic',
      'Kỹ thuật phân bổ thời gian 180 phút làm bài thi TOPIK II áp lực cao'
    ],
    handsOnProject: 'Viết hoàn chỉnh 1 bài mô tả biểu đồ Câu 53 và 1 bài nghị luận xã hội Câu 54 theo đề thi TOPIK chính thức và nhận nhận xét chấm điểm chi tiết.',
    targetAudience: 'Người học tiếng Hàn muốn thi đỗ TOPIK cấp 3 hoặc cấp 4, Du học sinh chuẩn bị sang Hàn Quốc học chuyên ngành.',
    careerApplication: 'Đủ điều kiện tốt nghiệp chuyên ngành ngôn ngữ Hàn và mở rộng cơ hội việc làm với mức thu nhập hấp dẫn tại các công ty Hàn Quốc.',
    requirements: [
      'Đã hoàn thành trình độ tiếng Hàn sơ cấp TOPIK I (Cấp 2)',
      'Có thói quen luyện viết tiếng Hàn đúng quy cách giấy kẻ ô Won-go-ji'
    ],
    benefits: [
      'Xóa bỏ nỗi sợ hãi phần thi Viết Sseugi - phần thi thường khiến nhiều thí sinh trượt TOPIK II nhất',
      'Nắm vững bộ khung mẫu câu viết biểu đồ Câu 53 giúp lấy trọn vẹn 30 điểm một cách dễ dàng',
      'Nâng cao tốc độ đọc hiểu văn bản tiếng Hàn dài và phức tạp',
      'Đạt chứng chỉ TOPIK 4 vững vàng để đủ điều kiện xét tuyển học bổng du học'
    ],
    techniques: ['TOPIK II', 'Writing Question 53 & 54', 'Wongoji Rules', 'Reading Comprehension', 'Korean Grammar Intermediary'],
    documents: [
      'Quy tắc viết giấy kẻ ô Won-go-ji chuẩn của Viện Giáo dục Quốc tế Hàn Quốc NIIED',
      'Bộ khung mẫu câu và từ nối chuyên dụng dành riêng cho phần thi viết biểu đồ Câu 53'
    ]
  },
  {
    title: 'Tiếng Anh Y Khoa & Chăm Sóc Sức Khỏe Cho Bác Sĩ & Điều Dưỡng (Medical English)',
    slug: 'tieng-anh-y-khoa-bac-si-dieu-duong-medical-english',
    categorySlug: 'ngoai-ngu-ung-dung',
    level: CourseLevel.INTERMEDIATE,
    price: 690000,
    oldPrice: 1050000,
    leadSummary: 'Làm chủ ngôn ngữ y tế chuyên nghiệp: Giải mã thuật ngữ y khoa qua gốc từ Hy Lạp/Latin, hỏi bệnh sử (History Taking), đọc hiểu bệnh án và nghiên cứu y văn quốc tế.',
    industryContext: 'Hầu hết các nghiên cứu y học tiên tiến và phác đồ điều trị mới nhất trên thế giới đều được xuất bản bằng tiếng Anh; tiếng Anh y khoa là cầu nối để các y bác sĩ hội nhập quốc tế.',
    coreTopics: [
      'Nguyên tắc cấu tạo thuật ngữ Y khoa: Gốc từ (Word Roots), Tiền tố (Prefixes) và Hậu tố (Suffixes) gốc Hy Lạp và Latinh',
      'Thuật ngữ giải phẫu học các hệ cơ quan chính: Hệ tim mạch, Hệ hô hấp, Hệ tiêu hóa, Hệ thần kinh và Hệ xương khớp',
      'Kỹ năng hỏi bệnh sử lâm sàng bằng tiếng Anh (History Taking): Giao tiếp thấu cảm và khai thác triệu chứng chính xác',
      'Đọc hiểu tài liệu bệnh án y khoa (Medical Records): Chẩn đoán, Kết quả xét nghiệm, Đơn thuốc và Hướng điều trị',
      'Đọc hiểu và trích xuất thông tin từ các bài báo nghiên cứu khoa học trên các tạp chí y khoa uy tín (PubMed, The Lancet)'
    ],
    handsOnProject: 'Thực hành đóng vai một buổi khám bệnh hoàn chỉnh bằng tiếng Anh cho một bệnh nhân người nước ngoài bị đau ngực cấp và viết tóm tắt bệnh án lâm sàng.',
    targetAudience: 'Bác sĩ, Dược sĩ, Điều dưỡng viên, Sinh viên đại học y dược muốn nâng cao năng lực chuyên môn quốc tế.',
    careerApplication: 'Tự tin làm việc tại các bệnh viện quốc tế tại Việt Nam hoặc tham gia các chương trình tu nghiệp bác sĩ nội trú ở nước ngoài.',
    requirements: [
      'Có kiến thức y khoa chuyên môn căn bản',
      'Trình độ tiếng Anh tổng quát từ B1 trở lên'
    ],
    benefits: [
      'Hiểu và nhớ hàng ngàn thuật ngữ y học phức tạp một cách logic nhờ phương pháp bóc tách gốc từ',
      'Tự tin giao tiếp và giải thích tình trạng bệnh cho các bệnh nhân người nước ngoài',
      'Cập nhật trực tiếp các phác đồ điều trị và hướng dẫn y học quốc tế mới nhất mà không cần đợi bản dịch',
      'Mở ra cơ hội tham gia các hội nghị khoa học y tế toàn cầu'
    ],
    techniques: ['Medical English', 'Medical Terminology', 'History Taking', 'Anatomical Terms', 'Clinical Records', 'Medical Literature'],
    documents: [
      'Bảng tổng hợp 100 tiền tố và hậu tố y khoa thông dụng nhất kèm ý nghĩa',
      'Mẫu kịch bản hỏi bệnh sử lâm sàng chuẩn quốc tế cho các chuyên khoa'
    ]
  },
  {
    title: 'Nghệ Thuật Biên Dịch & Phiên Dịch Hội Nghị Chuyên Nghiệp (Conference Interpreting)',
    slug: 'nghe-thuat-bien-dich-phien-dich-hoi-nghi-chuyen-nghiep',
    categorySlug: 'ngoai-ngu-ung-dung',
    level: CourseLevel.ADVANCED,
    price: 1150000,
    oldPrice: 1790000,
    leadSummary: 'Bước vào đỉnh cao của nghề ngôn ngữ: Làm chủ kỹ thuật ghi chú phiên dịch đuổi (Consecutive Note-taking), kỹ năng dịch song song trong cabin (Simultaneous) và đạo đức nghề phiên dịch.',
    industryContext: 'Phiên dịch viên cabin tại các hội nghị thượng đỉnh quốc tế là những chuyên gia ngôn ngữ tinh hoa với mức thù lao lên tới hàng ngàn USD cho mỗi ngày làm việc.',
    coreTopics: [
      'Phân biệt các hình thức dịch thuật: Biên dịch văn bản (Translation), Dịch đuổi (Consecutive Interpreting) và Dịch song song trong cabin (Simultaneous Interpreting)',
      'Hệ thống ký hiệu ghi chú tốc ký phiên dịch (Note-taking System) của Rozan: Biểu tượng ý niệm, Mũi tên liên kết và Phân tầng thông tin',
      'Kỹ thuật dịch song song (Simultaneous): Kỹ thuật Shadowing, Xử lý độ trễ thời gian (Décalage / Ear-Voice Span) và Đối phó với tốc độ nói nhanh',
      'Kỹ năng chuẩn bị thuật ngữ (Glossary Preparation) cấp tốc trước thềm hội thảo cho các chủ đề chuyên sâu',
      'Đạo đức nghề nghiệp phiên dịch viên: Tính bảo mật tuyệt đối, Sự trung thực với thông điệp gốc và Giữ vững sự trung lập'
    ],
    handsOnProject: 'Thực hành một phiên dịch đuổi 5 phút có sử dụng hệ thống ghi chú tốc ký cho một bài phát biểu ngoại giao chính thức và nhận phản hồi chi tiết.',
    targetAudience: 'Sinh viên năm cuối ngành ngôn ngữ Anh/Trung/Nhật, Biên phiên dịch viên muốn nâng cấp lên dịch hội nghị cabin chuyên nghiệp.',
    careerApplication: 'Đảm nhận vai trò phiên dịch viên cho các hội nghị quốc tế, các cơ quan ngoại giao và các tập đoàn đa quốc gia.',
    requirements: [
      'Trình độ ngoại ngữ xuất sắc (C1/C2 hoặc IELTS 7.5+ trở lên)',
      'Khả năng tập trung cao độ và trí nhớ ngắn hạn xuất sắc'
    ],
    benefits: [
      'Xây dựng hệ thống ký hiệu ghi chú cá nhân giúp tái hiện chính xác 95% nội dung bài nói dài 5 phút',
      'Rèn luyện thần kinh thép để dịch song song trôi chảy trong cabin mà không bị hoảng loạn',
      'Soạn thảo bảng thuật ngữ chuyên ngành thần tốc chỉ trong 24 giờ trước sự kiện',
      'Gia nhập hàng ngũ những phiên dịch viên cao cấp có mức thu nhập hàng đầu trong ngành ngôn ngữ'
    ],
    techniques: ['Conference Interpreting', 'Simultaneous Interpreting', 'Consecutive Interpreting', 'Rozan Note-taking', 'Decalage (EVS)', 'Glossary Prep'],
    documents: [
      'Hệ thống 50 ký hiệu tốc ký phiên dịch chuẩn quốc tế của Jean-François Rozan',
      'Mẫu bảng thuật ngữ đa ngữ chuyên ngành (Multilingual Glossary Template) trên Excel'
    ]
  },
  {
    title: 'Luyện Thi IELTS Chuyên Sâu 8.0+: Làm Chủ Cấu Trúc Đỉnh Cao & Từ Vựng C2 Khó',
    slug: 'luyen-thi-ielts-chuyen-sau-80-tu-vung-c2',
    categorySlug: 'ngoai-ngu-ung-dung',
    level: CourseLevel.ADVANCED,
    price: 1250000,
    oldPrice: 1990000,
    leadSummary: 'Vươn tới đỉnh cao Band 8.0 - 8.5 IELTS: Tinh chỉnh phong cách học thuật đỉnh cao, làm chủ các cấu trúc ngữ pháp phức hợp hiếm gặp, tư duy phản biện sắc sảo và diễn đạt tinh tế.',
    industryContext: 'Điểm số IELTS 8.0+ không đơn thuần là một chứng chỉ tiếng Anh; đó là minh chứng cho một tư duy học thuật sắc bén ngang ngửa người bản xứ có học thức cao.',
    coreTopics: [
      'Chân dung một bài thi IELTS Band 8.5: Sự khác biệt tinh tế giữa Band 7 và Band 8+ nằm ở tính tự nhiên và độ sâu tư duy',
      'Từ vựng trình độ C2 và sắc thái nghĩa (Nuances of Meaning): Tránh bẫy nhồi nhét từ vựng đao to búa lớn không đúng ngữ cảnh',
      'Ngữ pháp đỉnh cao: Đảo ngữ (Inversion), Câu chẻ (Cleft sentences), Rút gọn mệnh đề phân từ và Danh từ hóa (Nominalization)',
      'Tư duy phản biện và chiều sâu lập luận trong Writing Task 2: Đào sâu gốc rễ triết học và kinh tế xã hội của vấn đề',
      'Speaking Part 3 đỉnh cao: Sử dụng ngôn ngữ biểu đạt cảm xúc tinh tế và sự linh hoạt trong đối đáp với giám khảo khó tính'
    ],
    handsOnProject: 'Soạn thảo một bài luận Writing Task 2 đạt chuẩn chấm điểm thực tế Band 8.5 và thực hiện buổi phỏng vấn Speaking giả định đạt điểm 8.0+.',
    targetAudience: 'Giáo viên dạy tiếng Anh, Người muốn trở thành giảng viên IELTS chuyên nghiệp, Thí sinh săn học bổng toàn phần các trường Ivy League.',
    careerApplication: 'Khẳng định vị thế chuyên gia ngôn ngữ hàng đầu, mở ra cơ hội giảng dạy IELTS với mức thu nhập cao hoặc làm việc tại các tổ chức quốc tế lớn.',
    requirements: [
      'Trình độ hiện tại tối thiểu đạt IELTS 7.0 hoặc tương đương C1',
      'Đam mê sâu sắc với vẻ đẹp ngôn từ và tư duy phản biện học thuật'
    ],
    benefits: [
      'Làm chủ phong cách viết học thuật chuẩn xác (Academic Tone) không bị lai tạp phong cách nói thân mật',
      'Sử dụng các cấu trúc đảo ngữ và danh từ hóa biến câu văn trở nên cô đọng, sắc bén và quyền lực',
      'Nói tiếng Anh với phong thái uyên bác, tự tin và giàu nhạc điệu tự nhiên của người bản ngữ',
      'Chinh phục điểm số IELTS mơ ước 8.0+ để mở ra những cơ hội học bổng danh giá nhất hành tinh'
    ],
    techniques: ['IELTS 8.0+ Prep', 'C2 Vocabulary', 'Nominalization', 'Inversion & Cleft Sentences', 'Academic Tone', 'Critical Thinking in IELTS'],
    documents: [
      'Bộ sưu tập 20 bài luận Writing Band 8.5 - 9.0 chính thức kèm phân tích ngôn ngữ học chuyên sâu',
      'Danh mục từ vựng học thuật cấp độ C2 Oxford Academic Vocabulary List'
    ]
  },
  {
    title: 'Tiếng Anh Pháp Lý & Soạn Thảo Hợp Đồng Thương Mại Quốc Tế (Legal English)',
    slug: 'tieng-anh-phap-ly-soan-thao-hop-dong-thuong-mai-quoc-te',
    categorySlug: 'ngoai-ngu-ung-dung',
    level: CourseLevel.ADVANCED,
    price: 990000,
    oldPrice: 1590000,
    leadSummary: 'Làm chủ ngôn ngữ luật chuẩn mực: Giải mã từ vựng cổ và biệt ngữ pháp lý (Legalese), soạn thảo các điều khoản hợp đồng thương mại quốc tế chặt chẽ và phòng ngừa tranh chấp.',
    industryContext: 'Trong các giao dịch quốc tế, một dấu phẩy đặt sai vị trí hoặc một từ ngữ mơ hồ trong hợp đồng tiếng Anh có thể dẫn đến thiệt hại hàng triệu USD cho doanh nghiệp.',
    coreTopics: [
      'Đặc thù của ngôn ngữ pháp lý tiếng Anh (Legalese): Từ ngữ cổ (Herein, Thereof, Whereby), Cặp từ trùng nghĩa (Doublets & Triplets) và Phong cách viết hiện đại Plain English',
      'Cấu trúc giải phẫu của một Hợp đồng thương mại quốc tế: Tiêu đề, Phần mở đầu (Recitals), Định nghĩa (Definitions) và Các điều khoản cốt lõi',
      'Soạn thảo các điều khoản pháp lý trọng yếu: Bồi thường thiệt hại (Indemnity), Giới hạn trách nhiệm (Limitation of Liability), Bất khả kháng (Force Majeure)',
      'Điều khoản luật áp dụng (Governing Law) và Giải quyết tranh chấp qua Trọng tài quốc tế (Arbitration Clauses)',
      'Kỹ thuật rà soát và phát hiện các rủi ro pháp lý tiềm ẩn (Red-flagging) trong hợp đồng do đối tác nước ngoài soạn thảo'
    ],
    handsOnProject: 'Thực hành rà soát, chỉ ra 5 cạm bẫy pháp lý và viết lại các điều khoản phòng ngừa rủi ro cho một Hợp đồng phân phối độc quyền quốc tế bằng tiếng Anh.',
    targetAudience: 'Luật sư doanh nghiệp, Chuyên viên pháp chế (In-house Counsel), Giám đốc xuất nhập khẩu, Chuyên viên đàm phán hợp đồng thương mại.',
    careerApplication: 'Trở thành chuyên gia pháp lý thương mại quốc tế có năng lực bảo vệ tối đa lợi ích của doanh nghiệp trong các hợp đồng xuyên quốc gia.',
    requirements: [
      'Có kiến thức nền tảng về pháp luật thương mại hoặc dân sự',
      'Trình độ tiếng Anh từ mức khá giỏi trở lên'
    ],
    benefits: [
      'Đọc hiểu và bóc tách các hợp đồng pháp lý tiếng Anh phức tạp một cách chuẩn xác',
      'Tự tay soạn thảo các điều khoản hợp đồng bằng ngôn ngữ tiếng Anh pháp lý chuẩn mực, chặt chẽ',
      'Bảo vệ doanh nghiệp không bị rơi vào các cái bẫy kiện tụng và đền bù thiệt hại bất lợi',
      'Tự tin làm việc bình đẳng với các luật sư quốc tế hàng đầu'
    ],
    techniques: ['Legal English', 'Contract Drafting', 'Legalese vs Plain English', 'Indemnity Clauses', 'Arbitration', 'Risk Review'],
    documents: [
      'Mẫu Hợp đồng phân phối quốc tế chuẩn Phòng Thương mại Quốc tế (ICC Standard Contract)',
      'Bảng tra cứu và chuyển đổi các từ ngữ pháp lý cổ sang tiếng Anh hiện đại rõ ràng'
    ]
  },
  {
    title: 'Luyện Thi Tiếng Nhật Cao Cấp JLPT N1: Đọc Hiểu Luận Điểm Báo Chí & Triết Học',
    slug: 'luyen-thi-tieng-nhat-cao-cap-jlpt-n1',
    categorySlug: 'ngoai-ngu-ung-dung',
    level: CourseLevel.ADVANCED,
    price: 1190000,
    oldPrice: 1890000,
    leadSummary: 'Chinh phục đỉnh cao cao nhất của tiếng Nhật: Nắm vững 2000 chữ Hán Kanji, 100 cấu trúc ngữ pháp N1 cổ kính và giải quyết các bài đọc hiểu trừu tượng về triết học, xã hội học.',
    industryContext: 'Sở hữu chứng chỉ JLPT N1 là bảo chứng cho năng lực tiếng Nhật đỉnh cao, đưa bạn vào nhóm nhân sự tinh hoa hiếm hoi có mức thu nhập cao nhất trong giới Nhật ngữ.',
    coreTopics: [
      'Chiến lược học và phân biệt 2000 chữ Hán N1: Các chữ Hán hiếm gặp và các từ ghép 4 chữ Hán uyên bác (Yojijukugo)',
      'Ngữ pháp cao cấp N1: Các mẫu ngữ pháp mang sắc thái cổ xưa, trang trọng thường dùng trong nghị luận và phát biểu chính thức',
      'Đọc hiểu luận điểm trừu tượng (Dokkai N1): Nắm bắt tư tưởng và thế giới quan của tác giả qua các bài tiểu luận triết học, phê bình văn học',
      'Kỹ thuật so sánh hai bài viết (Hikaku Dokkai) để tìm ra điểm tương đồng và dị biệt trong quan điểm của hai tác giả',
      'Nghe hiểu hội thoại tự nhiên tốc độ cao (Choukai N1): Nghe hiểu các buổi thảo luận bàn tròn và các bản tin thời sự chuyên sâu'
    ],
    handsOnProject: 'Thực hành giải và phân tích chi tiết một đề thi JLPT N1 chính thức, viết bài phân tích luận điểm của bài đọc hiểu dài về văn hóa ứng xử hiện đại.',
    targetAudience: 'Giáo viên tiếng Nhật, Biên phiên dịch viên chuyên nghiệp, Du học sinh thạc sĩ/tiến sĩ tại Nhật Bản, Kỹ sư muốn chinh phục đỉnh cao N1.',
    careerApplication: 'Khẳng định vị thế chuyên gia tiếng Nhật hàng đầu, đủ điều kiện làm việc trong các cơ quan chính phủ, viện nghiên cứu và tòa soạn báo chí Nhật Bản.',
    requirements: [
      'Đã đạt chứng chỉ JLPT N2 với điểm số vững vàng',
      'Tư duy trừu tượng sâu sắc và vốn sống phong phú'
    ],
    benefits: [
      'Đọc hiểu trọn vẹn các bài xã luận trên báo Asahi, Nikkei và các tài liệu chuyên ngành phức tạp',
      'Làm chủ các mẫu ngữ pháp trang trọng nhất của tiếng Nhật phục vụ các bài phát biểu ngoại giao',
      'Sở hữu chứng chỉ JLPT N1 danh giá vĩnh viễn trên toàn cầu',
      'Được cộng 15 điểm ưu tiên trực tiếp trong thang điểm xét cấp Visa nhân tài tay nghề cao của chính phủ Nhật Bản'
    ],
    techniques: ['JLPT N1', 'Advanced Kanji', 'Yojijukugo', 'Philosophical Reading', 'Hikaku Dokkai', 'Advanced Choukai'],
    documents: [
      'Sách tổng hợp 100 cấu trúc ngữ pháp N1 kèm phân tích sắc thái cổ kính',
      'Bộ đề thi thử JLPT N1 có file âm thanh chất lượng cao và giải thích chi tiết đáp án'
    ]
  },
  {
    title: 'Luyện Thi Tiếng Trung Cao Cấp HSK 6 & Biên Phiên Dịch Báo Chí Thời Sự',
    slug: 'luyen-thi-tieng-trung-cao-cap-hsk-6-bien-phien-dich-bao-chi',
    categorySlug: 'ngoai-ngu-ung-dung',
    level: CourseLevel.ADVANCED,
    price: 1190000,
    oldPrice: 1890000,
    leadSummary: 'Chinh phục chứng chỉ tiếng Trung cao nhất: Nắm vững 5000 từ vựng HSK 6, kỹ thuật rút gọn bài văn 1000 chữ thành 400 chữ trong 10 phút và dịch thuật thời sự kinh tế chính trị.',
    industryContext: 'Đạt được HSK 6 là giấc mơ của mọi người học tiếng Trung; chứng chỉ này khẳng định bạn có khả năng biểu đạt tư tưởng một cách hoàn hảo và tự do như tiếng mẹ đẻ.',
    coreTopics: [
      'Làm chủ 5000 từ vựng HSK 6: Phân biệt các cặp từ đồng nghĩa tinh vi và thành ngữ lịch sử kinh điển',
      'Chiến lược phần thi Đọc hiểu: Kỹ thuật nhận diện câu sai ngữ pháp (Bệnh cú - 病句) nhanh chóng và chính xác',
      'Phần thi Viết sinh tử HSK 6: Đọc bài văn 1000 chữ trong 10 phút, không được ghi chép, bị thu lại đề và phải tự tóm tắt lại thành 400 chữ đúng cốt truyện',
      'Nghe hiểu các bản tin thời sự thời lượng dài của đài truyền hình trung ương Trung Quốc CCTV',
      'Thực hành biên dịch các bài phân tích kinh tế, quan hệ quốc tế từ báo chí Trung Quốc sang tiếng Việt'
    ],
    handsOnProject: 'Thực hành đọc ghi nhớ một câu chuyện ngụ ngôn 1000 chữ trong 10 phút và viết lại bài văn tóm tắt 400 chữ đạt tiêu chuẩn chấm điểm HSK 6 của Hanban.',
    targetAudience: 'Giảng viên tiếng Trung, Biên phiên dịch viên cao cấp, Người chuẩn bị học tiến sĩ tại Trung Quốc, Nhà ngoại giao.',
    careerApplication: 'Đảm nhận các vị trí dịch thuật cấp cao cho các tập đoàn lớn, các đài truyền hình quốc gia và cơ quan ngoại giao.',
    requirements: [
      'Đã đạt chứng chỉ HSK 5 với điểm số từ 230 trở lên',
      'Trí nhớ ngắn hạn tốt và kỹ năng tóm tắt cốt truyện súc tích'
    ],
    benefits: [
      'Xem và hiểu 100% các bản tin thời sự chính trị và phim ảnh tiếng Trung mà không cần phụ đề',
      'Làm chủ bí quyết viết tóm tắt bài văn 400 chữ đạt điểm tuyệt đối ở phần thi Viết HSK 6',
      'Nắm bắt các cấu trúc ngữ pháp cổ và văn phong viết báo chí trang trọng của Trung Quốc',
      'Sở hữu chứng chỉ HSK 6 đẳng cấp mở ra cơ hội sự nghiệp không giới hạn'
    ],
    techniques: ['HSK 6 Mastery', 'Summary Writing 400 words', 'Error Detection (Bệnh cú)', 'CCTV News Listening', 'Journalistic Translation', 'Advanced Hanzi'],
    documents: [
      'Bảng phân tích 10 dạng câu sai ngữ pháp (Bệnh cú) thường gặp nhất trong đề thi HSK 6',
      'Bộ sưu tập 20 bài tóm tắt mẫu 400 chữ đạt điểm tối đa của kỳ thi HSK 6'
    ]
  }
]
