import { CourseLevel } from '@prisma/client'
import { CourseBlueprint } from './categories-data'

export const COURSES_TECH: readonly CourseBlueprint[] = [
  // ==========================================
  // CAT-05: Phát triển ứng dụng di động (18 courses)
  // Quota: 6 BEGINNER, 8 INTERMEDIATE, 4 ADVANCED | 2 FREE, 16 PAID
  // ==========================================
  {
    title: 'Lập Trình Flutter & Dart Từ Số 0 Đến Xuất Bản Ứng Dụng Đa Nền Tảng',
    slug: 'lap-trinh-flutter-dart-tu-so-0-den-xuat-ban-ung-dung-da-nen-tang',
    categorySlug: 'phat-trien-ung-dung-di-dong',
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0,
    leadSummary: 'Làm chủ nền tảng phát triển ứng dụng di động đa nền tảng Flutter và ngôn ngữ Dart từ con số 0, tự tay xây dựng giao diện hiện đại và triển khai lên Google Play và App Store.',
    industryContext: 'Nhu cầu tuyển dụng kỹ sư Flutter đang tăng trưởng vượt bậc nhờ khả năng viết code một lần chạy mượt mà trên cả iOS lẫn Android với hiệu năng tiệm cận native.',
    coreTopics: [
      'Cú pháp hiện đại Dart 3, Null Safety, lập trình hướng đối tượng OOP và xử lý bất đồng bộ Future/Stream',
      'Cấu trúc cây Widget, Stateless vs Stateful Widget, bố cục linh hoạt với Flex, Row, Column và Stack',
      'Xử lý biểu mẫu dữ liệu, Form Validation, lưu trữ cục bộ Shared Preferences và gọi REST API với Dio',
      'Đóng gói ứng dụng, cấu hình chứng chỉ ký App Bundle cho Android và Archive TestFlight cho iOS'
    ],
    handsOnProject: 'Ứng dụng Tin Tức & Đọc Báo Đa Nguồn (NewsHub) với chế độ Dark/Light mode, lưu tin bài offline và chia sẻ lên mạng xã hội.',
    targetAudience: 'Sinh viên IT, lập trình viên Web chuyển hướng sang Mobile, hoặc người mới bắt đầu muốn tự tay làm app hoàn chỉnh.',
    careerApplication: 'Tự tin ứng tuyển vị trí Junior Flutter Developer hoặc phát triển các sản phẩm ứng dụng độc lập cho thị trường.',
    requirements: [
      'Máy tính cá nhân có khả năng cài đặt Flutter SDK và Android Studio hoặc VS Code',
      'Tư duy logic cơ bản, không bắt buộc kinh nghiệm lập trình di động trước đó'
    ],
    benefits: [
      'Xây dựng thành thạo giao diện người dùng Pixel-Perfect bằng hệ thống Flutter Widgets phong phú',
      'Hiểu rõ cơ chế Render Tree và vòng đời của State trong ứng dụng Flutter',
      'Tích hợp REST API, chuyển đổi JSON sang Model class an toàn với JsonSerializable',
      'Nắm vững quy trình build và phân phối ứng dụng lên kho ứng dụng di động'
    ],
    techniques: ['Flutter', 'Dart', 'Mobile UI', 'Dio', 'Cross-Platform', 'SharedPreferences'],
    documents: [
      'Sổ tay phím tắt và cheatsheet cấu trúc Widget thông dụng trong Flutter',
      'Tài liệu hướng dẫn cấu hình môi trường Flutter SDK trên Windows và macOS chi tiết'
    ]
  },
  {
    title: 'Nhập Môn Lập Trình iOS Với Ngôn Ngữ Swift và Giao Diện SwiftUI',
    slug: 'nhap-mon-lap-trinh-ios-voi-ngon-ngu-swift-va-giao-dien-swiftui',
    categorySlug: 'phat-trien-ung-dung-di-dong',
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0,
    leadSummary: 'Khám phá thế giới phát triển ứng dụng Apple với ngôn ngữ Swift hiện đại và bộ công cụ giao diện khai báo SwiftUI trên môi trường Xcode chuẩn mực.',
    industryContext: 'Hệ sinh thái Apple sở hữu tập người dùng có mức chi trả ứng dụng cao nhất thế giới, tạo ra cơ hội nghề nghiệp giá trị cao cho các kỹ sư iOS.',
    coreTopics: [
      'Ngôn ngữ Swift cơ bản: Optionals, Structs vs Classes, Protocols, Enums và Closures',
      'Tư duy thiết kế giao diện khai báo (Declarative UI) với SwiftUI: View, Modifiers và Layout Containers',
      'Quản lý trạng thái dữ liệu giao diện với @State, @Binding, @Observable và StateObject',
      'Thao tác với điều hướng NavigationStack, danh sách cuộn List và tương tác cử chỉ cơ bản'
    ],
    handsOnProject: 'Ứng dụng Quản Lý Thói Quen Cá Nhân (Habit Tracker) với biểu đồ tiến độ trực quan và lưu trữ cục bộ.',
    targetAudience: 'Những ai sở hữu máy Mac và mong muốn bước chân vào con đường lập trình iOS từ nền tảng vững chắc.',
    careerApplication: 'Làm quen chuẩn tư duy lập trình của Apple, sẵn sàng tham gia các dự án phát triển ứng dụng cho iPhone/iPad.',
    requirements: [
      'Máy tính Mac chạy macOS tương thích với phiên bản Xcode mới nhất',
      'Đam mê trải nghiệm người dùng tinh tế trên các thiết bị Apple'
    ],
    benefits: [
      'Lập trình thành thạo ngôn ngữ Swift với các đặc trưng an toàn bộ nhớ và type-safe',
      'Tạo dựng giao diện ứng dụng chuẩn mực theo Human Interface Guidelines của Apple',
      'Hiểu và áp dụng cơ chế truyền nhận dữ liệu phản ứng trong SwiftUI',
      'Chạy thử nghiệm và debug ứng dụng trên Simulator và thiết bị iPhone thật'
    ],
    techniques: ['Swift', 'SwiftUI', 'iOS', 'Xcode', 'Declarative UI', 'Apple HIG'],
    documents: [
      'Tài liệu tóm tắt ngữ pháp Swift 5+ và Human Interface Guidelines cốt lõi',
      'Bộ khung dự án SwiftUI Starter Kit mẫu cho người mới bắt đầu'
    ]
  },
  {
    title: 'Lập Trình Android Hiện Đại Với Kotlin và Jetpack Compose',
    slug: 'lap-trinh-android-hien-dai-voi-kotlin-va-jetpack-compose',
    categorySlug: 'phat-trien-ung-dung-di-dong',
    level: CourseLevel.BEGINNER,
    price: 349000,
    oldPrice: 499000,
    leadSummary: 'Học lập trình Android chuẩn hiện đại của Google với ngôn ngữ Kotlin súc tích và bộ công cụ thiết kế giao diện khai báo Jetpack Compose.',
    industryContext: 'Google đã chính thức chuyển đổi toàn bộ hệ sinh thái Android sang Kotlin-First và Compose, thay thế hoàn toàn cấu trúc XML truyền thống.',
    coreTopics: [
      'Cú pháp Kotlin: Null Safety, Data Classes, Extension Functions, Coroutines cơ bản',
      'Thiết kế giao diện Compose: Composable Functions, Modifiers, Material Theme 3',
      'Quản lý trạng thái State Hoisting, Remember, MutableState và Recomposition',
      'Kiến trúc ứng dụng chuẩn Android: ViewModel, LiveData/StateFlow và điều hướng Navigation Compose'
    ],
    handsOnProject: 'Ứng dụng Sách Nói & Podcast (AudioBook Pocket) với giao diện chơi âm thanh đẹp mắt và danh mục phân loại.',
    targetAudience: 'Người mới bắt đầu lập trình Android hoặc lập trình viên Java muốn cập nhật công nghệ Compose mới.',
    careerApplication: 'Tự tin ứng tuyển vị trí Fresher Android Developer tại các công ty công nghệ và phần mềm gia công.',
    requirements: [
      'Máy tính cài đặt Android Studio Iguana hoặc phiên bản mới hơn',
      'Kiến thức lập trình hướng đối tượng cơ bản'
    ],
    benefits: [
      'Tạm biệt giao diện XML cồng kềnh, chuyển dịch hoàn toàn sang Jetpack Compose',
      'Viết mã nguồn Kotlin ngắn gọn, an toàn và dễ bảo trì hơn 40% so với Java',
      'Áp dụng kiến trúc MVVM chính thống theo khuyến nghị của Google Android Architecture Guide',
      'Xử lý mượt mà tác vụ bất đồng bộ với Kotlin Coroutines và StateFlow'
    ],
    techniques: ['Kotlin', 'Android Jetpack', 'Jetpack Compose', 'MVVM', 'Coroutines', 'Material 3'],
    documents: [
      'Checklist kiến trúc Android chuẩn Google Architecture Components',
      'Bộ mã nguồn mẫu triển khai Navigation Compose và Dependency Injection Hilt'
    ]
  },
  {
    title: 'React Native & Expo: Phát Triển Ứng Dụng Đa Nền Tảng Cho Lập Trình Viên Web',
    slug: 'react-native-expo-phat-trien-ung-dung-da-nen-tang-cho-web-dev',
    categorySlug: 'phat-trien-ung-dung-di-dong',
    level: CourseLevel.BEGINNER,
    price: 299000,
    oldPrice: 450000,
    leadSummary: 'Tận dụng toàn bộ kiến thức React và JavaScript/TypeScript sẵn có để bước vào thế giới di động với React Native và hệ sinh thái Expo hiện đại.',
    industryContext: 'Expo Router và Expo EAS đã đưa React Native trở thành lựa chọn hàng đầu cho các startup muốn tung sản phẩm di động ra thị trường trong thời gian ngắn nhất.',
    coreTopics: [
      'Chuyển đổi tư duy từ React Web sang React Native: View, Text, ScrollView, FlatList',
      'Hệ thống điều hướng Expo Router dựa trên cấu trúc file tương tự Next.js App Router',
      'Định kiểu giao diện với StyleSheet, Flexbox và NativeWind (Tailwind CSS cho Mobile)',
      'Truy cập phần cứng thiết bị: Camera, Image Picker, GPS Location và Push Notifications qua Expo APIs'
    ],
    handsOnProject: 'Ứng dụng Đặt Bàn Nhà Hàng & Review Ẩm Thực (FoodyGo) với bản đồ quán ăn và tải ảnh món ăn trực tiếp.',
    targetAudience: 'Frontend Developer biết React muốn nhanh chóng làm chủ kỹ năng phát triển ứng dụng di động.',
    careerApplication: 'Mở rộng phạm vi công việc trở thành Fullstack Web & Mobile Developer, tăng gấp đôi cơ hội nhận dự án.',
    requirements: [
      'Đã nắm chắc cú pháp JavaScript ES6+ và các kiến thức cơ bản về React (Hooks, Props, State)',
      'Điện thoại thông minh Android hoặc iOS để test ứng dụng qua Expo Go'
    ],
    benefits: [
      'Tái sử dụng tới 80% tư duy và mã nguồn React sang ứng dụng di động native',
      'Sử dụng Expo Router để xây dựng luồng điều hướng màn hình sâu mượt mà',
      'Tương tác dễ dàng với camera, cảm biến và bộ nhớ máy mà không cần đụng đến code native Java/Obj-C',
      'Triển khai ứng dụng nhanh chóng qua dịch vụ điện toán đám mây Expo Application Services (EAS)'
    ],
    techniques: ['React Native', 'Expo', 'TypeScript', 'Expo Router', 'NativeWind', 'Mobile APIs'],
    documents: [
      'Bảng so sánh chi tiết các thành phần React DOM tương đương trong React Native',
      'Hướng dẫn cấu hình EAS Build và EAS Submit tự động lên chợ ứng dụng'
    ]
  },
  {
    title: 'Flutter Cơ Bản: Xây Dựng 5 Ứng Dụng Di Động Thực Tế',
    slug: 'flutter-co-ban-xay-dung-5-ung-dung-di-dong-thuc-te',
    categorySlug: 'phat-trien-ung-dung-di-dong',
    level: CourseLevel.BEGINNER,
    price: 249000,
    oldPrice: 380000,
    leadSummary: 'Phương pháp học thông qua thực hành dự án: hoàn thiện 5 ứng dụng di động thực tế từ đơn giản đến hoàn chỉnh để xây dựng portfolio ấn tượng.',
    industryContext: 'Nhà tuyển dụng luôn ưu tiên ứng viên có sản phẩm thực tế chạy được hơn là những người chỉ học lý thuyết Widget rời rạc.',
    coreTopics: [
      'Ứng dụng 1: Bảng Tính Chi Tiêu Cá Nhân (Expense Tracker) - Làm quen bố cục và nhập liệu',
      'Ứng dụng 2: Dự Báo Thời Tiết Thời Gian Thực (WeatherNow) - Gọi REST API và hiển thị Lottie animation',
      'Ứng dụng 3: Sổ Tay Ghi Chú & Todo (QuickNotes) - Lưu trữ dữ liệu với SQLite (sqflite)',
      'Ứng dụng 4: Ứng Dụng Thi Trắc Nghiệm Tương Tác (QuizMaster) - Quản lý trạng thái với Provider',
      'Ứng dụng 5: Thư Viện Hình Nền HD (WallPaper Hub) - Tải ảnh mạng, caching và lưu vào thư viện máy'
    ],
    handsOnProject: 'Hoàn thiện trọn bộ 5 ứng dụng độc lập với mã nguồn sạch sẵn sàng đưa vào CV xin việc.',
    targetAudience: 'Người học muốn tiếp cận Flutter qua các bài tập dự án thực chiến sinh động.',
    careerApplication: 'Tự tin sở hữu 5 dự án thực hành chứng minh năng lực lập trình di động với nhà tuyển dụng.',
    requirements: [
      'Đã hoàn thành khóa học nhập môn lập trình cơ bản hoặc có kiến thức về ngôn ngữ Dart',
      'Máy tính cá nhân cài đặt Flutter SDK'
    ],
    benefits: [
      'Rèn luyện phản xạ xây dựng giao diện nhanh chóng từ bản vẽ thiết kế',
      'Làm chủ các thư viện phổ biến nhất hệ sinh thái Flutter: Provider, Http, Sqflite, PathProvider',
      'Xử lý linh hoạt các tình huống ngoại lệ mạng, mất kết nối và màn hình chờ loading',
      'Biết cách cấu trúc thư mục dự án theo chuẩn Feature-First sạch sẽ'
    ],
    techniques: ['Flutter', 'Dart', 'Provider', 'SQLite', 'REST API', 'Portfolio Projects'],
    documents: [
      'Toàn bộ tài nguyên thiết kế UI mockup và tài khoản API thời tiết miễn phí cho học viên',
      'Mẫu Portfolio cá nhân chuẩn cho Mobile Developer trên GitHub'
    ]
  },
  {
    title: 'Thiết Kế Giao Diện Mobile Tương Tác Cao Với Flutter Animation',
    slug: 'thiet-ke-giao-dien-mobile-tuong-tac-cao-voi-flutter-animation',
    categorySlug: 'phat-trien-ung-dung-di-dong',
    level: CourseLevel.BEGINNER,
    price: 199000,
    oldPrice: 299000,
    leadSummary: 'Nâng tầm ứng dụng của bạn từ bình thường thành xuất sắc với hệ thống hiệu ứng chuyển động, chuyển trang Hero và micro-interactions mượt mà 60 FPS trong Flutter.',
    industryContext: 'Hiệu ứng chuyển động tinh tế là yếu tố phân định giữa ứng dụng nghiệp dư và ứng dụng thương mại được hàng triệu người yêu thích trên kho ứng dụng.',
    coreTopics: [
      'Nguyên lý diễn hoạt giao diện: Implicit Animations (AnimatedContainer, AnimatedOpacity, AnimatedAlign)',
      'Explicit Animations chuyên sâu: AnimationController, CurvedAnimation, Tween và AnimatedBuilder',
      'Hiệu ứng biến hình chuyển cảnh mượt mà giữa các màn hình với Hero Widget',
      'Tích hợp vector animations chuyên nghiệp từ Adobe After Effects thông qua thư viện Rive và Lottie'
    ],
    handsOnProject: 'Ứng dụng Thể Thao & Đếm Bước Chân (Fitness Motion) với vòng tròn tiến độ chuyển động và hiệu ứng chúc mừng sinh động.',
    targetAudience: 'Lập trình viên Flutter muốn trau chuốt UI/UX, tạo trải nghiệm người dùng cuốn hút vượt trội.',
    careerApplication: 'Nâng cao giá trị chuyên môn, đáp ứng yêu cầu các dự án cao cấp chú trọng giao diện và trải nghiệm.',
    requirements: [
      'Biết xây dựng giao diện Flutter tĩnh cơ bản (Row, Column, Stack, Container)'
    ],
    benefits: [
      'Làm chủ toàn diện từ diễn hoạt ngầm (Implicit) đến diễn hoạt tường minh (Explicit) trong Flutter',
      'Tối ưu hiệu năng animation đạt chuẩn 60-120 FPS không gây giật lag',
      'Sử dụng Hero Animation để tạo cảm giác ứng dụng liền mạch, cao cấp',
      'Tích hợp các tài nguyên đồ họa động phức tạp với dung lượng tệp siêu nhẹ'
    ],
    techniques: ['Flutter Animation', 'AnimationController', 'Hero Widget', 'Lottie', 'Rive', 'UI/UX Polish'],
    documents: [
      'Bảng tổng hợp công thức toán học nội suy Curves trong Flutter Animation',
      'Kho tài nguyên hơn 50 tệp Lottie và Rive animations chất lượng cao dùng cho bài học'
    ]
  },
  {
    title: 'Quản Lý Trạng Thái Flutter Chuyên Sâu Với BLoC Pattern và Cubit',
    slug: 'quan-ly-trang-thai-flutter-chuyen-sau-voi-bloc-pattern-va-cubit',
    categorySlug: 'phat-trien-ung-dung-di-dong',
    level: CourseLevel.INTERMEDIATE,
    price: 399000,
    oldPrice: 599000,
    leadSummary: 'Làm chủ mẫu kiến trúc quản lý trạng thái BLoC chuẩn công nghiệp của Google cho các ứng dụng Flutter quy mô lớn, tách biệt tuyệt đối UI và Business Logic.',
    industryContext: 'BLoC là giải pháp State Management được yêu cầu nhiều nhất trong hơn 70% tin tuyển dụng Flutter Senior tại các tập đoàn tài chính và ngân hàng.',
    coreTopics: [
      'Bản chất luồng dữ liệu Stream trong Dart và nguyên lý reactive programming với RxDart',
      'Kiến trúc phân tầng: UI Layer -> Bloc/Cubit -> Repository -> Data Provider',
      'So sánh chuyên sâu BLoC (Event-driven) và Cubit (Function-driven), khi nào nên dùng cái nào',
      'Xử lý tình huống thực tế: debounce tìm kiếm, phân trang vô tận (Infinite Scroll), caching offline'
    ],
    handsOnProject: 'Ứng dụng Sàn Giao Dịch Chứng Khoán Ảo (CryptoTrade) với bảng giá biến động realtime, giỏ tài sản và đặt lệnh mua bán.',
    targetAudience: 'Kỹ sư Flutter đã có nền tảng cơ bản muốn nâng cấp kỹ năng kiến trúc để tham gia các dự án doanh nghiệp lớn.',
    careerApplication: 'Sẵn sàng vượt qua các vòng phỏng vấn kỹ thuật chuyên sâu về Clean Architecture và State Management trên Flutter.',
    requirements: [
      'Thành thạo lập trình Flutter cơ bản, hiểu khái niệm Stateless/Stateful Widget và Stream',
      'Đã từng xây dựng ít nhất một ứng dụng kết nối REST API'
    ],
    benefits: [
      'Tổ chức mã nguồn theo chuẩn Enterprise Architecture, dễ kiểm thử tự động (Unit Test)',
      'Kiểm soát luồng trạng thái phức tạp một cách dự đoán được và không bao giờ rò rỉ bộ nhớ',
      'Tối ưu hóa số lần re-render giao diện xuống mức tối thiểu với BlocBuilder và BlocSelector',
      'Tự tin bảo trì và mở rộng các dự án Flutter có quy mô hàng chục lập trình viên cùng làm việc'
    ],
    techniques: ['Flutter BLoC', 'Cubit', 'RxDart', 'Clean Architecture', 'State Management', 'Streams'],
    documents: [
      'Sơ đồ luồng trạng thái chuẩn cho Event-Driven Architecture trên Flutter',
      'Bộ khung Unit Test mẫu cho BLoC và Mocktail test coverage 100%'
    ]
  },
  {
    title: 'Xây Dựng Ứng Dụng E-Commerce Hoàn Chỉnh Với React Native và Redux Toolkit',
    slug: 'xay-dung-ung-dung-e-commerce-hoan-chinh-voi-react-native-va-redux-toolkit',
    categorySlug: 'phat-trien-ung-dung-di-dong',
    level: CourseLevel.INTERMEDIATE,
    price: 499000,
    oldPrice: 750000,
    leadSummary: 'Xây dựng từ đầu đến cuối một ứng dụng mua sắm trực tuyến hoàn chỉnh: giỏ hàng thời gian thực, cổng thanh toán di động, định vị đơn hàng và thông báo đẩy.',
    industryContext: 'Ứng dụng thương mại điện tử đòi hỏi sự kết hợp phức tạp giữa đồng bộ trạng thái, bảo mật thanh toán và hiệu năng xử lý danh sách hàng nghìn sản phẩm.',
    coreTopics: [
      'Kiến trúc quản lý giỏ hàng và danh sách sản phẩm với Redux Toolkit và RTK Query',
      'Tối ưu hiệu năng hiển thị danh sách vô tận với FlashList (thay thế FlatList mượt mà hơn 5 lần)',
      'Tích hợp cổng thanh toán trực tuyến MoMo / VNPay / Stripe trong môi trường di động',
      'Hệ thống thông báo đẩy (Push Notifications) thời gian thực với Firebase Cloud Messaging (FCM)'
    ],
    handsOnProject: 'Ứng dụng Mua Sắm Thời Trang Đa Nền Tảng (ShopVibe) có tích hợp tra cứu vận đơn và lưu voucher giảm giá.',
    targetAudience: 'Lập trình viên React Native muốn nâng cao năng lực thông qua việc xây dựng một sản phẩm thương mại hoàn chỉnh.',
    careerApplication: 'Tự tin đảm nhận vai trò chủ lực trong các dự án phát triển ứng dụng bán hàng, bán lẻ trực tuyến.',
    requirements: [
      'Đã có kiến thức nền tảng về React Native và TypeScript',
      'Hiểu khái niệm Redux cơ bản hoặc các giải pháp State Management tương đương'
    ],
    benefits: [
      'Làm chủ kỹ thuật cache và invalidation dữ liệu API siêu tốc với RTK Query',
      'Giải quyết triệt để vấn đề giật lag khi cuộn trang sản phẩm hình ảnh dung lượng lớn',
      'Xử lý quy trình thanh toán an toàn, xác thực token và quản lý trạng thái đơn hàng',
      'Thiết lập luồng nhận thông báo đẩy cả khi ứng dụng đang chạy nền hoặc bị tắt'
    ],
    techniques: ['React Native', 'Redux Toolkit', 'RTK Query', 'FlashList', 'FCM', 'Payment Gateway'],
    documents: [
      'Tài liệu đặc tả kiến trúc API và schema dữ liệu chuẩn cho ứng dụng E-commerce',
      'Hướng dẫn tích hợp SDK thanh toán và xử lý callback URL trên cả iOS lẫn Android'
    ]
  },
  {
    title: 'Kiến Trúc Ứng Dụng Android Doanh Nghiệp Với Clean Architecture và Dagger Hilt',
    slug: 'kien-truc-ung-dung-android-doanh-nghiep-clean-architecture-hilt',
    categorySlug: 'phat-trien-ung-dung-di-dong',
    level: CourseLevel.INTERMEDIATE,
    price: 450000,
    oldPrice: 680000,
    leadSummary: 'Học cách thiết kế và triển khai kiến trúc Clean Architecture 3 lớp chuẩn mực trên Android với Dagger Hilt, Coroutines Flow và Room Database.',
    industryContext: 'Trong các dự án phần mềm ngân hàng, viễn thông và bảo hiểm, Clean Architecture là chuẩn mực bắt buộc để đảm bảo tính độc lập và khả năng bảo trì nhiều năm.',
    coreTopics: [
      'Triết lý Clean Architecture của Uncle Bob ứng dụng vào hệ sinh thái Android: Domain, Data, Presentation',
      'Dependency Injection chuẩn chỉnh với Dagger Hilt: Scopes, Modules, Constructor Injection',
      'Xây dựng lớp Offline-First bền bỉ với Room Database, DAO, Type Converters và Paging 3',
      'Xử lý phản ứng với Kotlin Flow: StateFlow, SharedFlow, các toán tử map, filter, combine'
    ],
    handsOnProject: 'Ứng dụng Quản Lý Tài Chính & Ngân Hàng Số (SmartBank) hỗ trợ xem giao dịch offline và đồng bộ tự động khi có mạng.',
    targetAudience: 'Android Developer cấp độ Middle muốn bước lên cấp độ Senior Architect.',
    careerApplication: 'Nâng cao năng lực thiết kế hệ thống, sẵn sàng dẫn dắt đội ngũ kỹ thuật trong các dự án lớn.',
    requirements: [
      'Thành thạo lập trình Android với Kotlin và Jetpack Components',
      'Hiểu rõ các nguyên lý thiết kế hướng đối tượng SOLID'
    ],
    benefits: [
      'Phân tách hoàn toàn mã nguồn thành các module độc lập, dễ dàng thay thế database hoặc API',
      'Loại bỏ hoàn toàn boilerplate code khởi tạo phụ thuộc nhờ Dagger Hilt',
      'Xây dựng tính năng Offline-First hoàn hảo, mang lại trải nghiệm mượt mà không phụ thuộc tốc độ mạng',
      'Viết trọn bộ Unit Test cho Use Cases và Repositories một cách dễ dàng với JUnit và Mockk'
    ],
    techniques: ['Android', 'Clean Architecture', 'Dagger Hilt', 'Room Database', 'Kotlin Flow', 'Paging 3'],
    documents: [
      'Sơ đồ thiết kế phân tầng Clean Architecture cho dự án Android Multi-module',
      'Bộ template dự án Android Studio mẫu đã cấu hình sẵn Gradle KTS và Hilt'
    ]
  },
  {
    title: 'Lập Trình iOS Nâng Cao: Làm Chủ Swift Concurrency và Core Data / SwiftData',
    slug: 'lap-trinh-ios-nang-cao-swift-concurrency-swiftdata',
    categorySlug: 'phat-trien-ung-dung-di-dong',
    level: CourseLevel.INTERMEDIATE,
    price: 499000,
    oldPrice: 750000,
    leadSummary: 'Khai thác tối đa sức mạnh của Swift hiện đại: lập trình bất đồng bộ với async/await, Actors ngăn ngừa race conditions và quản lý dữ liệu bền vững với SwiftData.',
    industryContext: 'Apple đang nhanh chóng đào thải các callback closures truyền thống và Core Data phức tạp để chuyển sang mô hình Concurrency và SwiftData an toàn hơn.',
    coreTopics: [
      'Mô hình Swift Concurrency hiện đại: async/await, AsyncSequence, TaskGroups và Structured Concurrency',
      'Trừu tượng hóa Actor và MainActor nhằm triệt tiêu hoàn toàn lỗi Data Races trong môi trường đa luồng',
      'Framework quản lý dữ liệu SwiftData mới nhất: @Model, ModelContext, Predicates và Schema Migration',
      'Tích hợp bảo mật sinh trắc học Face ID / Touch ID với LocalAuthentication và lưu trữ Keychain'
    ],
    handsOnProject: 'Ứng dụng Quản Lý Mật Khẩu & Két Sắt Số (SecureVault) mã hóa dữ liệu cục bộ với bảo vệ sinh trắc học.',
    targetAudience: 'Kỹ sư iOS muốn nâng cấp công nghệ lên chuẩn mới nhất của Apple từ iOS 17 trở lên.',
    careerApplication: 'Trở thành chuyên gia công nghệ đón đầu các xu hướng kiến trúc mới nhất trong cộng đồng lập trình viên Apple.',
    requirements: [
      'Đã có kinh nghiệm lập trình Swift và SwiftUI tối thiểu 6 tháng',
      'Máy Mac cài đặt Xcode 15 trở lên'
    ],
    benefits: [
      'Lập trình bất đồng bộ sạch sẽ, loại bỏ triệt để hiện tượng Callback Hell',
      'Bảo vệ an toàn bộ nhớ tuyệt đối trong môi trường đa lõi vi xử lý Apple Silicon',
      'Sử dụng SwiftData để thao tác cơ sở dữ liệu quan hệ chỉ với vài dòng code khai báo ngắn gọn',
      'Bảo mật dữ liệu nhạy cảm của người dùng theo tiêu chuẩn an ninh thông tin cao nhất của Apple'
    ],
    techniques: ['Swift', 'Swift Concurrency', 'SwiftData', 'Actors', 'Keychain', 'Face ID'],
    documents: [
      'Cẩm nang di chuyển từ Core Data sang SwiftData từng bước an toàn',
      'Checklist tối ưu hiệu năng luồng Main Thread cho ứng dụng SwiftUI'
    ]
  },
  {
    title: 'Offline-First Mobile Architecture: Đồng Bộ Dữ Liệu Hai Chiều Trên Di Động',
    slug: 'offline-first-mobile-architecture-dong-bo-du-lieu-hai-chieu',
    categorySlug: 'phat-trien-ung-dung-di-dong',
    level: CourseLevel.INTERMEDIATE,
    price: 449000,
    oldPrice: 650000,
    leadSummary: 'Thiết kế hệ thống ứng dụng di động hoạt động hoàn hảo khi mất mạng và tự động đồng bộ hai chiều giải quyết xung đột khi có kết nối trở lại.',
    industryContext: 'Các ứng dụng ghi chú, bán hàng thực địa, kho vận logistics bắt buộc phải hoạt động trơn tru ngay cả trong vùng sóng yếu hoặc mất mạng hoàn toàn.',
    coreTopics: [
      'Triết lý thiết kế Offline-First: Local-First Storage, Optimistic UI và Eventual Consistency',
      'Cơ chế hàng đợi đồng bộ (Sync Queue) bền bỉ và quản lý tác vụ nền Background Workers',
      'Các chiến lược giải quyết xung đột dữ liệu (Conflict Resolution): Last-Write-Wins, Version Vectors, CRDTs',
      'Tối ưu băng thông mạng với Delta Sync (chỉ tải phần dữ liệu thay đổi) và nén nạp gzip/brotli'
    ],
    handsOnProject: 'Ứng dụng Ghi Chú Đa Thiết Bị (SyncNote) hỗ trợ chỉnh sửa offline và tự giải quyết xung đột khi mạng phục hồi.',
    targetAudience: 'Mobile Developer (Flutter, React Native hoặc Native) muốn xây dựng ứng dụng có độ bền bỉ cao.',
    careerApplication: 'Tự tin đảm nhận kiến trúc các sản phẩm phần mềm đòi hỏi độ sẵn sàng 99.9% cho doanh nghiệp.',
    requirements: [
      'Nắm chắc kỹ năng phát triển ứng dụng di động trên ít nhất một nền tảng (Flutter, React Native hoặc Native)',
      'Hiểu rõ cơ chế hoạt động của REST API và cơ sở dữ liệu cục bộ (SQLite/Realm)'
    ],
    benefits: [
      'Xây dựng trải nghiệm người dùng tức thì (Instant UI) không bao giờ bị nghẽn bởi loading spinner',
      'Thiết kế thuật toán tự động giải quyết xung đột dữ liệu thông minh và minh bạch',
      'Tiết kiệm chi phí máy chủ và dữ liệu di động của người dùng nhờ cơ chế Delta Sync',
      'Nâng cao độ tin cậy của sản phẩm lên mức enterprise-grade'
    ],
    techniques: ['Offline-First', 'Data Sync', 'Conflict Resolution', 'SQLite', 'Background Work', 'CRDT'],
    documents: [
      'Tài liệu đặc tả các kịch bản xung đột dữ liệu di động và ma trận xử lý chuẩn',
      'Mã nguồn thư viện Sync Engine mẫu hỗ trợ hàng đợi thử lại thông minh (Exponential Backoff)'
    ]
  },
  {
    title: 'CI/CD và Tự Động Hóa Phát Hành Ứng Dụng Di Động Với Fastlane & GitHub Actions',
    slug: 'ci-cd-tu-dong-hoa-phat-hanh-mobile-fastlane-github-actions',
    categorySlug: 'phat-trien-ung-dung-di-dong',
    level: CourseLevel.INTERMEDIATE,
    price: 349000,
    oldPrice: 500000,
    leadSummary: 'Giải phóng thời gian đóng gói thủ công: xây dựng đường ống CI/CD tự động hóa toàn bộ quy trình kiểm thử, build file, ký số và phát hành ứng dụng lên TestFlight và Google Play Console.',
    industryContext: 'Việc xuất file APK/IPA và upload thủ công tiêu tốn hàng chục giờ mỗi tuần của đội ngũ kỹ sư, đồng thời tiềm ẩn nhiều sai sót bảo mật chứng chỉ ký số.',
    coreTopics: [
      'Cài đặt và thiết lập Fastlane cho cả dự án iOS và Android: Match, Gym, Pilot, Supply',
      'Quản lý chứng chỉ ký số tập trung an toàn với Git Repo mã hóa (Fastlane Match)',
      'Cấu hình GitHub Actions Runner tự động chạy Unit Test và Lint khi tạo Pull Request',
      'Thiết lập đường ống tự động tạo bản build phát hành nội bộ (Internal Testing / Firebase App Distribution)'
    ],
    handsOnProject: 'Hệ thống tự động hóa hoàn chỉnh: mỗi khi merge code vào nhánh main, hệ thống tự build và đẩy bản cập nhật lên TestFlight và Google Play Beta.',
    targetAudience: 'Mobile Developer, Tech Lead hoặc DevOps Engineer phụ trách mảng ứng dụng di động.',
    careerApplication: 'Nâng cấp quy trình làm việc chuẩn Agile/DevOps, trở thành nhân tố không thể thiếu trong các công ty phát triển phần mềm chuyên nghiệp.',
    requirements: [
      'Có tài khoản Apple Developer Program và Google Play Console (hoặc tài khoản demo nội bộ)',
      'Hiểu quy trình build ứng dụng di động cơ bản'
    ],
    benefits: [
      'Tiết kiệm 95% thời gian phát hành ứng dụng, biến thao tác phát hành thành một nút bấm',
      'Bảo vệ an toàn tuyệt đối các file chứng chỉ và mật khẩu ký số của công ty',
      'Đảm bảo chất lượng mã nguồn nhờ hệ thống test tự động chạy trước khi phát hành',
      'Thông báo kết quả build tự động về kênh Slack hoặc Telegram của đội dự án'
    ],
    techniques: ['Fastlane', 'GitHub Actions', 'Mobile CI/CD', 'App Store', 'Google Play', 'Code Signing'],
    documents: [
      'File Fastfile và Appfile mẫu cấu hình sẵn cho Flutter, React Native và Native',
      'Kịch bản YAML mẫu cho GitHub Actions hỗ trợ macOS và Linux runners'
    ]
  },
  {
    title: 'Xây Dựng Ứng Dụng Bản Đồ & Định Vị Di Động Thời Gian Thực (Ride-Hailing App)',
    slug: 'xay-dung-ung-dung-ban-do-dinh-vi-di-dong-thoi-gian-thuc',
    categorySlug: 'phat-trien-ung-dung-di-dong',
    level: CourseLevel.INTERMEDIATE,
    price: 499000,
    oldPrice: 750000,
    leadSummary: 'Học cách xây dựng ứng dụng tương tự Grab/Uber: theo dõi tài xế di chuyển thời gian thực trên bản đồ, tính toán lộ trình tối ưu và tính cước phí tự động.',
    industryContext: 'Các ứng dụng định vị, giao hàng, xe ôm công nghệ và du lịch luôn có nhu cầu tuyển dụng rất lớn với mức đãi ngộ hấp dẫn.',
    coreTopics: [
      'Tích hợp Google Maps SDK / Mapbox trên nền tảng di động: Markers, Polylines, Custom Styles',
      'Theo dõi vị trí chính xác của thiết bị nền với Geolocation API và thuật toán làm mịn tọa độ (Kalman Filter)',
      'Tính toán chỉ đường và khoảng cách lộ trình với Google Directions API',
      'Giao tiếp WebSocket thời gian thực hiển thị vị trí tài xế di chuyển mượt mà từng giây'
    ],
    handsOnProject: 'Ứng dụng Gọi Xe & Giao Hàng (GrabMini) có màn hình tài xế và màn hình khách hàng cập nhật vị trí đồng bộ qua Socket.io.',
    targetAudience: 'Lập trình viên di động muốn thử thách bản thân với các bài toán tương tác bản đồ phức tạp.',
    careerApplication: 'Tự tin ứng tuyển vào các công ty công nghệ vận tải, giao vận logistics, thương mại điện tử giao hàng nhanh.',
    requirements: [
      'Đã có kinh nghiệm xây dựng ứng dụng di động kết nối mạng và quản lý trạng thái',
      'Tài khoản Google Cloud Console (được hướng dẫn nhận credit dùng thử miễn phí)'
    ],
    benefits: [
      'Làm chủ toàn bộ kỹ thuật thao tác với bản đồ số và vẽ tuyến đường phức tạp',
      'Giải quyết triệt để bài toán trôi tọa độ GPS và giật lag khi cập nhật vị trí liên tục',
      'Xây dựng hệ thống WebSocket hai chiều thời gian thực giữa hai ứng dụng di động độc lập',
      'Tối ưu hóa chi phí gọi API bản đồ Google Maps tránh phát sinh hóa đơn lớn'
    ],
    techniques: ['Google Maps API', 'Mapbox', 'Geolocation', 'WebSocket', 'Kalman Filter', 'Realtime Sync'],
    documents: [
      'Bộ tài liệu tối ưu chi phí sử dụng API Google Maps cho ứng dụng thương mại',
      'Thuật toán làm mịn tọa độ GPS di chuyển mượt mà trên bản đồ viết bằng Dart/TypeScript'
    ]
  },
  {
    title: 'Lập Trình Game Di Động 2D Với Flutter & Flame Engine',
    slug: 'lap-trinh-game-di-dong-2d-voi-flutter-flame-engine',
    categorySlug: 'phat-trien-ung-dung-di-dong',
    level: CourseLevel.INTERMEDIATE,
    price: 299000,
    oldPrice: 450000,
    leadSummary: 'Bước chân vào lĩnh vực phát triển trò chơi di động 2D nhẹ nhàng, hiệu năng cao bằng việc kết hợp Flutter với Flame Game Engine mã nguồn mở.',
    industryContext: 'Thị trường game mini, hyper-casual và gamification trong ứng dụng doanh nghiệp đang bùng nổ, mở ra cơ hội kinh doanh mới cho lập trình viên.',
    coreTopics: [
      'Vòng lặp trò chơi (Game Loop): update, render, delta time và cơ chế đếm khung hình FPS',
      'Quản lý nhân vật Sprite, hoạt ảnh SpriteSheet và hệ thống hạt (Particle System)',
      'Xử lý va chạm vật lý (Collision Detection) với Flame Component System (FCS)',
      'Tích hợp âm thanh hiệu ứng (SFX), nhạc nền và bảng xếp hạng thành tích người chơi'
    ],
    handsOnProject: 'Trò chơi Bắn Phi Thuyền Không Gian (Space Shooter) với nhiều cấp độ quái vật, nâng cấp vũ khí và lưu điểm cao kỷ lục.',
    targetAudience: 'Lập trình viên Flutter muốn khám phá lĩnh vực làm game hoặc tích hợp mini-game vào app doanh nghiệp.',
    careerApplication: 'Mở rộng kỹ năng sang game development hoặc gia nhập các studio sản xuất game casual di động.',
    requirements: [
      'Biết lập trình Dart và hiểu cấu trúc Widget trong Flutter cơ bản',
      'Tư duy tọa độ không gian 2D (trục X, Y) và toán học cơ bản'
    ],
    benefits: [
      'Hiểu sâu bản chất vòng lặp Game Loop và cơ chế xử lý khung hình thời gian thực',
      'Xây dựng các hoạt ảnh nhân vật mượt mà từ các tệp sprite sheet',
      'Thiết kế thuật toán va chạm vật lý chính xác không làm tụt khung hình',
      'Biết cách tích hợp quảng cáo AdMob để kiếm tiền từ các tựa game tự phát triển'
    ],
    techniques: ['Flutter', 'Flame Engine', '2D Game Dev', 'Sprite Animation', 'Game Loop', 'Collision Detection'],
    documents: [
      'Bộ tài nguyên đồ họa và âm thanh game 2D bản quyền miễn phí dùng cho dự án',
      'Mẫu mã nguồn tích hợp Google AdMob banner và interstitial ads cho game Flutter'
    ]
  },
  {
    title: 'Kiến Trúc Hệ Thống Di Động Quy Mô Lớn (Enterprise Mobile System Design)',
    slug: 'kien-truc-he-thong-di-dong-quy-mo-lon-system-design',
    categorySlug: 'phat-trien-ung-dung-di-dong',
    level: CourseLevel.ADVANCED,
    price: 699000,
    oldPrice: 999000,
    leadSummary: 'Khóa học đỉnh cao về thiết kế kiến trúc ứng dụng di động cho hàng triệu người dùng: Multi-module architecture, Dynamic Feature Delivery, Server-Driven UI và tối ưu hiệu năng bộ nhớ cấp độ hệ điều hành.',
    industryContext: 'Khi ứng dụng vượt mốc 1 triệu người dùng, các vấn đề về thời gian khởi động app, kích thước bản cài và khả năng cộng tác của hàng chục nhóm phát triển độc lập trở thành bài toán sống còn.',
    coreTopics: [
      'Kiến trúc đa module (Modularization): Feature Modules, Core Modules và quy tắc phân chia ranh giới',
      'Server-Driven UI (SDUI): Thay đổi giao diện và luồng nghiệp vụ từ máy chủ mà không cần đẩy bản cập nhật lên App Store',
      'Tối ưu hóa thời gian khởi động ứng dụng (App Startup Optimization): Cold start vs Warm start, Lazy Initialization',
      'Giám sát hiệu năng thực tế (APM): Crashlytics, Sentry, Memory Leak Profiling và đo lường tỷ lệ ANR / OOM'
    ],
    handsOnProject: 'Thiết kế kiến trúc Siêu Ứng Dụng (Super App) hỗ trợ cắm thêm các tính năng độc lập thông qua mô hình Server-Driven UI.',
    targetAudience: 'Lead Mobile Engineers, Mobile Architects và Senior Developers chuẩn bị phỏng vấn tại các tập đoàn công nghệ lớn.',
    careerApplication: 'Tự tin đảm nhận vai trò Principal Mobile Engineer hoặc Solutions Architect tại các công ty công nghệ quy mô lớn.',
    requirements: [
      'Tối thiểu 2 năm kinh nghiệm làm việc thực tế với ứng dụng di động trên quy mô thương mại',
      'Nắm vững các nguyên lý thiết kế phần mềm và cấu trúc dữ liệu nâng cao'
    ],
    benefits: [
      'Thiết kế hệ thống ứng dụng di động chịu tải cao và hỗ trợ hàng chục kỹ sư cùng commit mã nguồn',
      'Làm chủ kiến trúc Server-Driven UI giúp đội ngũ Product kiểm thử A/B testing tức thì',
      'Giảm 60% thời gian khởi động app và triệt tiêu các lỗi rò rỉ bộ nhớ (Memory Leaks)',
      'Trang bị tư duy giải quyết bài toán phỏng vấn System Design chuyên biệt cho nền tảng di động'
    ],
    techniques: ['Mobile System Design', 'Server-Driven UI', 'Multi-Module', 'APM', 'Memory Profiling', 'Performance Tuning'],
    documents: [
      'Tài liệu kiến trúc hệ thống mẫu của các siêu ứng dụng hàng đầu (Grab, Shopee, Uber)',
      'Bộ câu hỏi và khung trả lời mẫu cho vòng phỏng vấn Mobile System Design'
    ]
  },
  {
    title: 'Bảo Mật Ứng Dụng Di Động Chuyên Sâu (Mobile App Security & Pentesting)',
    slug: 'bao-mat-ung-dung-di-dong-chuyen-sau-pentesting',
    categorySlug: 'phat-trien-ung-dung-di-dong',
    level: CourseLevel.ADVANCED,
    price: 649000,
    oldPrice: 899000,
    leadSummary: 'Bảo vệ ứng dụng di động trước các cuộc tấn công dịch ngược, can thiệp bộ nhớ và giả mạo dữ liệu theo tiêu chuẩn bảo mật quốc tế OWASP Mobile Top 10.',
    industryContext: 'Các ứng dụng tài chính, ví điện tử và y tế bắt buộc phải vượt qua các đợt kiểm thử an ninh nghiêm ngặt trước khi được phép cung cấp dịch vụ cho người dùng.',
    coreTopics: [
      'Tiêu chuẩn bảo mật OWASP Mobile Application Security Verification Standard (MASVS)',
      'Phát hiện thiết bị can thiệp: Kỹ thuật kiểm tra Root (Android) và Jailbreak (iOS) đa lớp',
      'Kỹ thuật ghim chứng chỉ số (SSL/TLS Pinning) chống nghe lén dữ liệu qua proxy Burp Suite',
      'Chống dịch ngược và giả mạo mã nguồn: Xáo trộn code (Obfuscation), chống debug thời gian thực và chữ ký số nguyên vẹn'
    ],
    handsOnProject: 'Thực hành tấn công bẻ khóa và sau đó vá bảo mật toàn diện cho một ứng dụng ngân hàng mẫu giả lập lỗ hổng.',
    targetAudience: 'Kỹ sư di động cao cấp, chuyên gia kiểm thử bảo mật (Pentester) và kỹ sư an toàn thông tin.',
    careerApplication: 'Đảm nhận các vị trí chuyên gia bảo mật di động với mức thu nhập hàng đầu trong ngành công nghệ.',
    requirements: [
      'Đã nắm vững cách thức hoạt động nội bộ của hệ điều hành Android hoặc iOS',
      'Kiến thức mạng máy tính, giao thức HTTP/HTTPS và mã hóa cơ bản'
    ],
    benefits: [
      'Bảo vệ tài sản trí tuệ và mã nguồn ứng dụng trước các công cụ dịch ngược (JADX, Ghidra)',
      'Ngăn chặn hoàn toàn hành vi can thiệp tráo đổi dữ liệu trên đường truyền mạng',
      'Tuân thủ tuyệt đối các quy định an toàn bảo mật của ngành ngân hàng và thanh toán trực tuyến',
      'Chủ động phát hiện và khắc phục các lỗ hổng bảo mật trước khi tin tặc khai thác'
    ],
    techniques: ['Mobile Security', 'OWASP MASVS', 'SSL Pinning', 'Anti-Root', 'Anti-Jailbreak', 'Code Obfuscation'],
    documents: [
      'Bảng kiểm định an toàn bảo mật ứng dụng di động chuẩn OWASP MASVS Checklist',
      'Mẫu mã nguồn triển khai SSL Pinning và phát hiện can thiệp hệ thống đa lớp cho iOS và Android'
    ]
  },
  {
    title: 'Kỹ Thuật Reverse Engineering và Dịch Ngược Ứng Dụng Android Thực Chiến',
    slug: 'ky-thuat-reverse-engineering-dich-nguoc-ung-dung-android',
    categorySlug: 'phat-trien-ung-dung-di-dong',
    level: CourseLevel.ADVANCED,
    price: 599000,
    oldPrice: 850000,
    leadSummary: 'Khám phá cấu trúc bên trong của các tệp APK/AAB bằng công cụ dịch ngược chuyên nghiệp Frida, JADX và APKTool nhằm phục vụ nghiên cứu bảo mật và vá lỗ hổng.',
    industryContext: 'Năng lực phân tích dịch ngược mã nguồn là vũ khí tối thượng của các chuyên gia điều tra số và kỹ sư bảo mật ứng dụng cấp cao.',
    coreTopics: [
      'Cấu trúc tệp APK: Bytecode Dalvik/ART, tệp DEX, tài nguyên và thư viện nhị phân native (.so)',
      'Sử dụng JADX-GUI và APKTool để giải mã, xem mã nguồn Java/Smali và chỉnh sửa tài nguyên',
      'Can thiệp hành vi ứng dụng thời gian thực với Frida Framework: Hook hàm, bypass kiểm tra root và SSL Pinning',
      'Phân tích mã nguồn native C/C++ với trình dịch ngược Ghidra'
    ],
    handsOnProject: 'Giải mã và vượt qua 5 bài thi Capture The Flag (CTF) thử thách bảo mật ứng dụng di động cấp độ chuyên gia.',
    targetAudience: 'Chuyên gia an ninh mạng, kỹ sư bảo mật phần mềm và lập trình viên Android muốn hiểu sâu bản chất thực thi mã nguồn.',
    careerApplication: 'Làm việc tại các trung tâm giám sát an ninh mạng (SOC), công ty bảo mật hoặc phòng lab nghiên cứu lỗ hổng.',
    requirements: [
      'Hiểu rõ cấu trúc hệ điều hành Linux và Android',
      'Biết đọc hiểu mã nguồn Java hoặc Kotlin, có kiến thức cơ bản về ngôn ngữ C/C++'
    ],
    benefits: [
      'Hiểu sâu cơ chế thực thi của máy ảo ART trên các thiết bị Android',
      'Sử dụng thành thạo Frida để phân tích và kiểm tra các hàm mã hóa nội bộ trong app',
      'Nhận diện các dấu hiệu mã độc hoặc thư viện gián điệp ẩn giấu trong ứng dụng',
      'Xây dựng các giải pháp phòng thủ vững chắc dựa trên tư duy của kẻ tấn công'
    ],
    techniques: ['Reverse Engineering', 'Frida Hooking', 'JADX', 'Smali', 'APKTool', 'Ghidra'],
    documents: [
      'Bộ sưu tập hơn 20 script Frida thông dụng dùng để bypass bảo mật phục vụ kiểm thử',
      'Kho tài liệu hướng dẫn đọc hiểu mã hợp ngữ Smali cơ bản'
    ]
  },
  {
    title: 'Lập Trình Native Modules: Cầu Nối C/C++ Hiệu Năng Cao Cho Di Động',
    slug: 'lap-trinh-native-modules-cau-noi-c-cpp-hieu-nang-cao-cho-mobile',
    categorySlug: 'phat-trien-ung-dung-di-dong',
    level: CourseLevel.ADVANCED,
    price: 599000,
    oldPrice: 850000,
    leadSummary: 'Tận dụng sức mạnh xử lý phần cứng tối đa bằng cách nhúng mã nguồn C/C++ hiệu năng cao vào ứng dụng di động thông qua Android NDK, JNI và Swift C-Interoperability.',
    industryContext: 'Xử lý hình ảnh, xử lý âm thanh, mã hóa dữ liệu quân sự và trí tuệ nhân tạo biên (Edge AI) bắt buộc phải sử dụng mã nguồn C/C++ native để đạt tốc độ tối đa.',
    coreTopics: [
      'Tổng quan về kiến trúc Native: CPU Architectures (arm64-v8a, armeabi-v7a, x86_64)',
      'Android NDK và Java Native Interface (JNI): Gọi hàm C++ từ Kotlin và ngược lại với chi phí chuyển đổi tối thiểu',
      'Tích hợp thư viện xử lý ảnh OpenCV vào ứng dụng di động để nhận diện hình ảnh thời gian thực',
      'Cơ chế FFI (Foreign Function Interface) trong Flutter và JSI trong React Native thế hệ mới'
    ],
    handsOnProject: 'Bộ lọc chỉnh sửa hiệu ứng ảnh và nhận diện khuôn mặt tốc độ cao chạy trực tiếp trên luồng vi xử lý C++ native.',
    targetAudience: 'Kỹ sư di động muốn làm việc với các dự án đồ họa, xử lý tín hiệu số hoặc AI chạy trực tiếp trên thiết bị (On-device AI).',
    careerApplication: 'Gia nhập các công ty công nghệ phát triển lõi công nghệ hình ảnh, video streaming hoặc thiết bị IoT.',
    requirements: [
      'Nắm chắc ngôn ngữ C++ cơ bản (con trỏ, quản lý bộ nhớ thủ công)',
      'Đã có kinh nghiệm phát triển ứng dụng di động trên Android hoặc iOS'
    ],
    benefits: [
      'Tăng tốc độ tính toán của ứng dụng lên gấp 10-50 lần cho các tác vụ nặng',
      'Tái sử dụng các thư viện C/C++ mã nguồn mở đồ sộ trên cả hai nền tảng iOS và Android',
      'Làm chủ kiến trúc JSI (JavaScript Interface) mới của React Native và FFI của Flutter',
      'Kiểm soát tuyệt đối việc cấp phát và giải phóng vùng nhớ máy tính'
    ],
    techniques: ['Android NDK', 'JNI', 'C++', 'OpenCV', 'Flutter FFI', 'High Performance Mobile'],
    documents: [
      'Mẫu cấu hình CMakeLists.txt chuẩn cho dự án di động đa nền tảng',
      'Tài liệu hướng dẫn tối ưu hóa tập lệnh vi xử lý ARM Neon cho thiết bị di động'
    ]
  }
]

