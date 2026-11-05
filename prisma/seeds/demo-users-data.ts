import { generateDeterministicUuid } from './course-data'

export interface DemoUserProfile {
  index: number
  id: string
  username: string
  email: string
  fullName: string
  bio: string
  avatar: string
  group: 'INACTIVE' | 'BEGINNER' | 'ACTIVE' | 'HARDCORE' | 'TOP'
  courseEnrollmentCount: number
  targetLessonCompletions: number
  targetQuizCompletions: number
  currentStreak: number
  longestStreak: number
  daysActiveCount: number
  brokenStreak: boolean
  accountAgeDays: number
}

// 70 realistic Vietnamese IT profiles
const REALISTIC_NAMES: { fullName: string; username: string; bio: string; avatar: string }[] = [
  // 1-12: Group A (Inactive)
  {
    fullName: 'Trần Văn An',
    username: 'tran_an_dev',
    bio: 'Học viên mới tham gia nền tảng TMdemy.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80'
  },
  {
    fullName: 'Lê Thị Bích',
    username: 'lebich_tech',
    bio: 'Sinh viên năm 1 ngành Công nghệ thông tin.',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80'
  },
  {
    fullName: 'Nguyễn Quốc Cường',
    username: 'cuong_quoc99',
    bio: 'Đang tìm hiểu về lập trình web.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80'
  },
  {
    fullName: 'Phạm Hồng Dung',
    username: 'hongdung_it',
    bio: 'Tự học lập trình tại nhà.',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80'
  },
  {
    fullName: 'Hoàng Hải Đăng',
    username: 'haidang_coder',
    bio: 'Đam mê công nghệ và phần mềm.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80'
  },
  {
    fullName: 'Vũ Thùy Dương',
    username: 'thuyduong_vu',
    bio: 'Quan tâm đến Khoa học Dữ liệu.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80'
  },
  {
    fullName: 'Đỗ Tuấn Em',
    username: 'tuan_em_do',
    bio: 'Học lập trình cơ bản.',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&q=80'
  },
  {
    fullName: 'Bùi Lan Giao',
    username: 'langiao_bui',
    bio: 'Sinh viên kinh tế học thêm công nghệ.',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&q=80'
  },
  {
    fullName: 'Đặng Minh Hưng',
    username: 'minhhung_dang',
    bio: 'Tìm hiểu về thuật toán.',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80'
  },
  {
    fullName: 'Dương Kim Huệ',
    username: 'kimhue_duong',
    bio: 'Học viên trực tuyến.',
    avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&q=80'
  },
  {
    fullName: 'Trịnh Khánh Khang',
    username: 'khanhkhang_it',
    bio: 'Tân sinh viên ngành phần mềm.',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80'
  },
  {
    fullName: 'Mai Thanh Lâm',
    username: 'thanhlam_mai',
    bio: 'Khám phá thế giới AI.',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&q=80'
  },

  // 13-30: Group B (Beginners)
  {
    fullName: 'Võ Hoàng Long',
    username: 'hoanglong_vo',
    bio: 'Đang theo học HTML/CSS và Javascript.',
    avatar: 'https://images.unsplash.com/photo-1480429370139-e0132c086e2a?w=400&q=80'
  },
  {
    fullName: 'Châu Ngọc Mai',
    username: 'ngocmai_chau',
    bio: 'Frontend Developer tập sự.',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80'
  },
  {
    fullName: 'Lý Quốc Nam',
    username: 'quocnam_ly',
    bio: 'Thực tập sinh Python.',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80'
  },
  {
    fullName: 'Hồ Tuyết Nga',
    username: 'tuyetnga_ho',
    bio: 'Đam mê phân tích số liệu.',
    avatar: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=400&q=80'
  },
  {
    fullName: 'Tô Thái Phong',
    username: 'thaiphong_to',
    bio: 'Lập trình viên backend tương lai.',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&q=80'
  },
  {
    fullName: 'Phan Minh Quân',
    username: 'minhquan_phan',
    bio: 'Thích học các công nghệ mới.',
    avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&q=80'
  },
  {
    fullName: 'Tạ Thảo Quyên',
    username: 'thaoquyen_ta',
    bio: 'Học lập trình để phục vụ nghiên cứu.',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80'
  },
  {
    fullName: 'Lương Đình Sang',
    username: 'dinhsang_luong',
    bio: 'Học React và Tailwind CSS.',
    avatar: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=400&q=80'
  },
  {
    fullName: 'Đinh Hồng Sơn',
    username: 'hongson_dinh',
    bio: 'Luyện tập coding mỗi ngày.',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80'
  },
  {
    fullName: 'Cao Phương Thảo',
    username: 'phuongthao_cao',
    bio: 'Khám phá thế giới khoa học dữ liệu.',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80'
  },
  {
    fullName: 'Chu Vĩnh Thuận',
    username: 'vinhthuan_chu',
    bio: 'Đam mê React Native di động.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80'
  },
  {
    fullName: 'Đoàn Cẩm Tiên',
    username: 'camtien_doan',
    bio: 'Thực hành dự án web cá nhân.',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80'
  },
  {
    fullName: 'Nghiêm Đức Toàn',
    username: 'ductoan_nghiem',
    bio: 'Học thuật toán căn bản.',
    avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&q=80'
  },
  {
    fullName: 'Lâm Bích Trâm',
    username: 'bichtram_lam',
    bio: 'Yêu thích học tập trực tuyến.',
    avatar: 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=400&q=80'
  },
  {
    fullName: 'Vương Gia Trí',
    username: 'giatri_vuong',
    bio: 'Sinh viên KHTN đam mê thuật toán.',
    avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=400&q=80'
  },
  {
    fullName: 'Bạch Thanh Trúc',
    username: 'thanhtruc_bach',
    bio: 'Tìm hiểu về Big Data và SQL.',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&q=80'
  },
  {
    fullName: 'Kiều Anh Tuấn',
    username: 'anhtuan_kieu',
    bio: 'Đam mê Node.js và kiến trúc microservices.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80'
  },
  {
    fullName: 'Ân Khắc Tùng',
    username: 'khactung_an',
    bio: 'Học viên tích cực tại TMdemy.',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&q=80'
  },

  // 31-50: Group C (Active Learners)
  {
    fullName: 'Trần Bảo Uyên',
    username: 'baouyen_tran',
    bio: 'Frontend Dev với 1 năm kinh nghiệm React.',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80'
  },
  {
    fullName: 'Nguyễn Tấn Vĩnh',
    username: 'tanvinh_nguyen',
    bio: 'Lập trình viên backend Node.js & Go.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80'
  },
  {
    fullName: 'Phạm Thu Vũ',
    username: 'thuvu_pham',
    bio: 'Data Analyst chuyên về Tableau & BigQuery.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80'
  },
  {
    fullName: 'Lê Hoàng Xuân',
    username: 'hoangxuan_le',
    bio: 'Mobile Developer (iOS Swift & SwiftUI).',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80'
  },
  {
    fullName: 'Hoàng Hải Yến',
    username: 'haiyen_hoang',
    bio: 'Kỹ sư AI và Natural Language Processing.',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80'
  },
  {
    fullName: 'Vũ Quốc Bảo',
    username: 'quocbao_vu',
    bio: 'DevOps Engineer quan tâm NGINX & Linux.',
    avatar: 'https://images.unsplash.com/photo-1480429370139-e0132c086e2a?w=400&q=80'
  },
  {
    fullName: 'Đỗ Thùy Chi',
    username: 'thuychi_do',
    bio: 'Fullstack JavaScript Developer.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80'
  },
  {
    fullName: 'Bùi Thế Dân',
    username: 'thedan_bui',
    bio: 'Học viên tích cực duy trì streak mỗi ngày.',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80'
  },
  {
    fullName: 'Đặng Mai Giang',
    username: 'maigiang_dang',
    bio: 'Nghiên cứu sinh ngành Khoa học máy tính.',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&q=80'
  },
  {
    fullName: 'Dương Tấn Hậu',
    username: 'tanhau_duong',
    bio: 'Lập trình viên Web3 & Backend.',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80'
  },
  {
    fullName: 'Trịnh Nhật Huy',
    username: 'nhathuy_trinh',
    bio: 'Kỹ sư phần mềm tại CMC Global.',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80'
  },
  {
    fullName: 'Mai Tuấn Khải',
    username: 'tuankhai_mai',
    bio: 'Chuyên gia xử lý dữ liệu và Kafka.',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&q=80'
  },
  {
    fullName: 'Võ Đình Lực',
    username: 'dinhluc_vo',
    bio: 'Đam mê học sâu và Computer Vision.',
    avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&q=80'
  },
  {
    fullName: 'Châu Minh Nghĩa',
    username: 'minhnghia_chau',
    bio: 'Senior Frontend Developer tại VNG.',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80'
  },
  {
    fullName: 'Lý Trọng Nhân',
    username: 'trongnhan_ly',
    bio: 'Kỹ sư hạ tầng đám mây AWS.',
    avatar: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=400&q=80'
  },
  {
    fullName: 'Hồ Cát Phượng',
    username: 'catphuong_ho',
    bio: 'Tech Lead đội ngũ Frontend.',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80'
  },
  {
    fullName: 'Tô Bá Sang',
    username: 'basang_to',
    bio: 'Nghiên cứu mô hình ngôn ngữ lớn (LLM).',
    avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&q=80'
  },
  {
    fullName: 'Phan Diệu Thảo',
    username: 'dieuthao_phan',
    bio: 'Chuyên gia trực quan hóa dữ liệu.',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80'
  },
  {
    fullName: 'Tạ Minh Triết',
    username: 'minhtriet_ta',
    bio: 'Lập trình viên game 3D Godot Engine.',
    avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=400&q=80'
  },
  {
    fullName: 'Lương Kiều Vang',
    username: 'kieu_vang_luong',
    bio: 'Kỹ sư kiểm thử tự động (Automation QA).',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80'
  },

  // 51-64: Group D (Hardcore Learners)
  {
    fullName: 'Đinh Quốc An',
    username: 'quoc_an_elite',
    bio: 'Chuyên gia bảo mật và tối ưu database.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80'
  },
  {
    fullName: 'Cao Thanh Bình',
    username: 'thanh_binh_pro',
    bio: 'Data Scientist tại Viettel Telecom.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80'
  },
  {
    fullName: 'Chu Hữu Cảnh',
    username: 'huu_canh_architect',
    bio: 'Solution Architect hệ thống phân tán.',
    avatar: 'https://images.unsplash.com/photo-1480429370139-e0132c086e2a?w=400&q=80'
  },
  {
    fullName: 'Đoàn Nhật Đăng',
    username: 'nhat_dang_mastery',
    bio: 'MLOps Engineer triển khai Triton Server.',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80'
  },
  {
    fullName: 'Nghiêm Gia Hào',
    username: 'gia_hao_backend',
    bio: 'Chuyên gia tối ưu hiệu năng cơ sở dữ liệu.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80'
  },
  {
    fullName: 'Lâm Hải Khang',
    username: 'hai_khang_fullstack',
    bio: 'Học tập không ngừng, đam mê giải thuật.',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80'
  },
  {
    fullName: 'Vương Thế Lập',
    username: 'the_lap_dev',
    bio: 'Học viên chăm chỉ nhất quý 3 tại TMdemy.',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&q=80'
  },
  {
    fullName: 'Bạch Quang Minh',
    username: 'quang_minh_nlp',
    bio: 'Nghiên cứu sinh AI & Deep Learning.',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80'
  },
  {
    fullName: 'Kiều Minh Nhật',
    username: 'minh_nhat_expert',
    bio: 'Hoàn thành hơn 10 chứng chỉ công nghệ.',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80'
  },
  {
    fullName: 'Ân Thành Phát',
    username: 'thanh_phat_data',
    bio: 'Lead Data Engineer tại FPT Software.',
    avatar: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=400&q=80'
  },
  {
    fullName: 'Trần Vĩnh Phúc',
    username: 'vinh_phuc_ai',
    bio: 'Chuyên gia xử lý tín hiệu và thị giác máy.',
    avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&q=80'
  },
  {
    fullName: 'Nguyễn Tường Quân',
    username: 'tuong_quan_code',
    bio: 'Đạt top 1% trong các kỳ thi lập trình.',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&q=80'
  },
  {
    fullName: 'Phạm Thái Sơn',
    username: 'thai_son_cloud',
    bio: 'Kiến trúc sư giải pháp đa đám mây.',
    avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=400&q=80'
  },
  {
    fullName: 'Lê Duy Tân',
    username: 'duy_tan_senior',
    bio: 'Principal Engineer đam mê truyền cảm hứng.',
    avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&q=80'
  },

  // 65-70: Group E (Top Gamification Champions)
  {
    fullName: 'Hoàng Minh Tuấn',
    username: 'tuan_champion',
    bio: 'Huyền thoại học tập TMdemy, streak liên tục 45 ngày.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80'
  },
  {
    fullName: 'Vũ Đức Thịnh',
    username: 'thinh_legend_ai',
    bio: 'Chuyên gia AI hàng đầu, hoàn thành 95% khóa học.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80'
  },
  {
    fullName: 'Đỗ Hoàng Long',
    username: 'long_master_coder',
    bio: 'Kỷ lục gia làm quiz điểm tuyệt đối tại TMdemy.',
    avatar: 'https://images.unsplash.com/photo-1480429370139-e0132c086e2a?w=400&q=80'
  },
  {
    fullName: 'Bùi Anh Khoa',
    username: 'khoa_grandmaster',
    bio: 'Đại kiện tướng Gamification, top 3 bảng xếp hạng.',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80'
  },
  {
    fullName: 'Đặng Tuấn Kiệt',
    username: 'kiet_apex_learner',
    bio: 'Cạnh tranh vị trí số 1 All-Time Leaderboard.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80'
  },
  {
    fullName: 'Dương Minh Khang',
    username: 'khang_leaderboard_no1',
    bio: 'Quán quân bảng xếp hạng học tập TMdemy All-Time!',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80'
  }
]

export function generateDemoUsersList(): DemoUserProfile[] {
  const users: DemoUserProfile[] = []

  // Precomputed realistic learning profiles
  // Group A (1-12): Inactive (0-1 courses, 0 lessons, 0 XP, streak 0)
  for (let i = 1; i <= 12; i++) {
    const raw = REALISTIC_NAMES[i - 1]
    users.push({
      index: i,
      id: generateDeterministicUuid(`tmdemy:demouser:${i}`),
      username: raw.username,
      email: `${raw.username}@example.com`,
      fullName: raw.fullName,
      bio: raw.bio,
      avatar: raw.avatar,
      group: 'INACTIVE',
      courseEnrollmentCount: i % 2 === 0 ? 1 : 0,
      targetLessonCompletions: 0,
      targetQuizCompletions: 0,
      currentStreak: 0,
      longestStreak: 0,
      daysActiveCount: 0,
      brokenStreak: true,
      accountAgeDays: 40 + i * 5
    })
  }

  // Group B (13-30): Beginners (18 users)
  // 13-22: Beginner Rank (70 - 450 XP)
  // 23-30: Explorer Rank (500 - 1,450 XP)
  const groupBTargets = [
    // Beginners (Lv 1): 70 - 450 XP
    { lessons: 1, quizzes: 0, streak: 1, longest: 1, days: 1 }, // 1*70 + 1*20 = 90 XP
    { lessons: 2, quizzes: 0, streak: 0, longest: 2, days: 2 }, // 2*70 + 2*20 = 180 XP (broken streak)
    { lessons: 2, quizzes: 1, streak: 1, longest: 1, days: 1 }, // 2*70 + 1*100 + 1*20 = 260 XP
    { lessons: 3, quizzes: 0, streak: 2, longest: 2, days: 2 }, // 3*70 + 2*20 = 250 XP
    { lessons: 3, quizzes: 1, streak: 1, longest: 2, days: 2 }, // 3*70 + 1*100 + 2*20 = 350 XP
    { lessons: 4, quizzes: 0, streak: 0, longest: 3, days: 3 }, // 4*70 + 3*20 = 340 XP
    { lessons: 4, quizzes: 1, streak: 2, longest: 2, days: 2 }, // 4*70 + 1*100 + 2*20 = 420 XP
    { lessons: 4, quizzes: 1, streak: 3, longest: 3, days: 3 }, // 4*70 + 1*100 + 3*20 = 440 XP
    { lessons: 5, quizzes: 0, streak: 0, longest: 2, days: 2 }, // 5*70 + 2*20 = 390 XP
    { lessons: 5, quizzes: 1, streak: 1, longest: 1, days: 1 }, // 5*70 + 1*100 + 1*20 = 470 XP
    // Explorers (Lv 2): 500 - 1,450 XP
    { lessons: 6, quizzes: 1, streak: 2, longest: 3, days: 3 }, // 6*70 + 1*100 + 3*20 = 580 XP
    { lessons: 7, quizzes: 1, streak: 3, longest: 4, days: 4 }, // 7*70 + 1*100 + 4*20 = 670 XP
    { lessons: 8, quizzes: 2, streak: 2, longest: 3, days: 4 }, // 8*70 + 2*100 + 4*20 = 840 XP
    { lessons: 10, quizzes: 2, streak: 3, longest: 5, days: 5 }, // 10*70 + 2*100 + 5*20 = 1,000 XP
    { lessons: 11, quizzes: 2, streak: 4, longest: 4, days: 4 }, // 11*70 + 2*100 + 4*20 = 1,050 XP
    { lessons: 12, quizzes: 2, streak: 0, longest: 6, days: 6 }, // 12*70 + 2*100 + 6*20 = 1,160 XP
    { lessons: 13, quizzes: 3, streak: 3, longest: 5, days: 5 }, // 13*70 + 3*100 + 5*20 = 1,310 XP
    { lessons: 14, quizzes: 3, streak: 4, longest: 5, days: 6 } // 14*70 + 3*100 + 6*20 = 1,400 XP
  ]

  for (let i = 13; i <= 30; i++) {
    const raw = REALISTIC_NAMES[i - 1]
    const cfg = groupBTargets[i - 13]
    users.push({
      index: i,
      id: generateDeterministicUuid(`tmdemy:demouser:${i}`),
      username: raw.username,
      email: `${raw.username}@example.com`,
      fullName: raw.fullName,
      bio: raw.bio,
      avatar: raw.avatar,
      group: 'BEGINNER',
      courseEnrollmentCount: i < 23 ? 2 : 3,
      targetLessonCompletions: cfg.lessons,
      targetQuizCompletions: cfg.quizzes,
      currentStreak: cfg.streak,
      longestStreak: cfg.longest,
      daysActiveCount: cfg.days,
      brokenStreak: cfg.streak === 0,
      accountAgeDays: 60 + (i - 12) * 3
    })
  }

  // Group C (31-50): Active Learners (20 users)
  // 31-40: Learner Rank (1,500 - 2,999 XP)
  // 41-50: Skilled Rank (3,000 - 5,999 XP)
  const groupCTargets = [
    // Learners (Lv 3)
    { lessons: 16, quizzes: 3, streak: 5, longest: 6, days: 7 }, // 16*70 + 300 + 140 = 1,560 XP
    { lessons: 18, quizzes: 3, streak: 4, longest: 7, days: 8 }, // 18*70 + 300 + 160 = 1,720 XP
    { lessons: 20, quizzes: 3, streak: 6, longest: 6, days: 8 }, // 20*70 + 300 + 160 = 1,860 XP
    { lessons: 22, quizzes: 4, streak: 5, longest: 8, days: 9 }, // 22*70 + 400 + 180 = 2,120 XP
    { lessons: 24, quizzes: 4, streak: 6, longest: 7, days: 9 }, // 24*70 + 400 + 180 = 2,260 XP
    { lessons: 26, quizzes: 4, streak: 7, longest: 7, days: 10 }, // 26*70 + 400 + 200 = 2,420 XP
    { lessons: 28, quizzes: 4, streak: 0, longest: 9, days: 11 }, // 28*70 + 400 + 220 = 2,580 XP
    { lessons: 29, quizzes: 5, streak: 6, longest: 8, days: 11 }, // 29*70 + 500 + 220 = 2,750 XP
    { lessons: 30, quizzes: 5, streak: 8, longest: 8, days: 12 }, // 30*70 + 500 + 240 = 2,840 XP
    { lessons: 31, quizzes: 5, streak: 7, longest: 9, days: 13 }, // 31*70 + 500 + 260 = 2,930 XP
    // Skilled (Lv 4)
    { lessons: 33, quizzes: 6, streak: 8, longest: 10, days: 14 }, // 33*70 + 600 + 280 = 3,190 XP
    { lessons: 36, quizzes: 6, streak: 7, longest: 11, days: 15 }, // 36*70 + 600 + 300 = 3,420 XP
    { lessons: 39, quizzes: 7, streak: 9, longest: 12, days: 16 }, // 39*70 + 700 + 320 = 3,750 XP
    { lessons: 42, quizzes: 7, streak: 10, longest: 10, days: 17 }, // 42*70 + 700 + 340 = 3,980 XP
    { lessons: 46, quizzes: 8, streak: 8, longest: 12, days: 18 }, // 46*70 + 800 + 360 = 4,380 XP
    { lessons: 50, quizzes: 8, streak: 11, longest: 14, days: 20 }, // 50*70 + 800 + 400 = 4,700 XP
    { lessons: 53, quizzes: 9, streak: 0, longest: 15, days: 21 }, // 53*70 + 900 + 420 = 5,030 XP
    { lessons: 55, quizzes: 9, streak: 10, longest: 13, days: 22 }, // 55*70 + 900 + 440 = 5,190 XP
    { lessons: 58, quizzes: 10, streak: 12, longest: 15, days: 23 }, // 58*70 + 1000 + 460 = 5,520 XP
    { lessons: 61, quizzes: 10, streak: 13, longest: 16, days: 25 } // 61*70 + 1000 + 500 = 5,770 XP
  ]

  for (let i = 31; i <= 50; i++) {
    const raw = REALISTIC_NAMES[i - 1]
    const cfg = groupCTargets[i - 31]
    users.push({
      index: i,
      id: generateDeterministicUuid(`tmdemy:demouser:${i}`),
      username: raw.username,
      email: `${raw.username}@example.com`,
      fullName: raw.fullName,
      bio: raw.bio,
      avatar: raw.avatar,
      group: 'ACTIVE',
      courseEnrollmentCount: i < 41 ? 4 : 5,
      targetLessonCompletions: cfg.lessons,
      targetQuizCompletions: cfg.quizzes,
      currentStreak: cfg.streak,
      longestStreak: cfg.longest,
      daysActiveCount: cfg.days,
      brokenStreak: cfg.streak === 0,
      accountAgeDays: 90 + (i - 30) * 3
    })
  }

  // Group D (51-64): Hardcore Learners (14 users)
  // 51-58: Advanced Rank (6,000 - 9,999 XP)
  // 59-64: Expert Rank (10,000 - 15,500 XP)
  const groupDTargets = [
    // Advanced (Lv 5)
    { lessons: 66, quizzes: 11, streak: 14, longest: 18, days: 27 }, // 66*70 + 1100 + 540 = 6,260 XP
    { lessons: 71, quizzes: 12, streak: 15, longest: 19, days: 29 }, // 71*70 + 1200 + 580 = 6,750 XP
    { lessons: 76, quizzes: 13, streak: 16, longest: 20, days: 31 }, // 76*70 + 1300 + 620 = 7,240 XP
    { lessons: 81, quizzes: 14, streak: 18, longest: 22, days: 33 }, // 81*70 + 1400 + 660 = 7,730 XP
    { lessons: 87, quizzes: 15, streak: 19, longest: 23, days: 35 }, // 87*70 + 1500 + 700 = 8,290 XP
    { lessons: 92, quizzes: 16, streak: 20, longest: 25, days: 37 }, // 92*70 + 1600 + 740 = 8,780 XP
    { lessons: 97, quizzes: 17, streak: 0, longest: 26, days: 39 }, // 97*70 + 1700 + 780 = 9,270 XP
    { lessons: 102, quizzes: 18, streak: 22, longest: 25, days: 41 }, // 102*70 + 1800 + 820 = 9,760 XP
    // Expert (Lv 6)
    { lessons: 110, quizzes: 19, streak: 23, longest: 28, days: 45 }, // 110*70 + 1900 + 900 = 10,500 XP
    { lessons: 120, quizzes: 21, streak: 25, longest: 30, days: 48 }, // 120*70 + 2100 + 960 = 11,460 XP
    { lessons: 130, quizzes: 23, streak: 26, longest: 32, days: 52 }, // 130*70 + 2300 + 1040 = 12,440 XP
    { lessons: 140, quizzes: 25, streak: 28, longest: 34, days: 56 }, // 140*70 + 2500 + 1120 = 13,420 XP
    { lessons: 150, quizzes: 26, streak: 29, longest: 35, days: 60 }, // 150*70 + 2600 + 1200 = 14,300 XP
    { lessons: 160, quizzes: 28, streak: 30, longest: 38, days: 64 } // 160*70 + 2800 + 1280 = 15,280 XP
  ]

  for (let i = 51; i <= 64; i++) {
    const raw = REALISTIC_NAMES[i - 1]
    const cfg = groupDTargets[i - 51]
    users.push({
      index: i,
      id: generateDeterministicUuid(`tmdemy:demouser:${i}`),
      username: raw.username,
      email: `${raw.username}@example.com`,
      fullName: raw.fullName,
      bio: raw.bio,
      avatar: raw.avatar,
      group: 'HARDCORE',
      courseEnrollmentCount: 12 + Math.floor((i - 50) * 0.8),
      targetLessonCompletions: cfg.lessons,
      targetQuizCompletions: cfg.quizzes,
      currentStreak: cfg.streak,
      longestStreak: cfg.longest,
      daysActiveCount: cfg.days,
      brokenStreak: cfg.streak === 0,
      accountAgeDays: 130 + (i - 50) * 2
    })
  }

  // Group E (65-70): Top Gamification Users (6 users)
  // 65-67: Expert Rank (16,500 - 19,800 XP)
  // 68-70: Master Rank (20,500 - 25,200 XP)
  const groupETargets = [
    // Top Experts
    { lessons: 175, quizzes: 30, streak: 32, longest: 40, days: 70 }, // 175*70(12250) + 3000 + 1400 = 16,650 XP
    { lessons: 190, quizzes: 32, streak: 35, longest: 42, days: 75 }, // 190*70(13300) + 3200 + 1500 = 18,000 XP
    { lessons: 205, quizzes: 35, streak: 38, longest: 45, days: 80 }, // 205*70(14350) + 3500 + 1600 = 19,450 XP
    // Top Masters (20k+)
    { lessons: 220, quizzes: 37, streak: 40, longest: 48, days: 85 }, // 220*70(15400) + 3700 + 1700 = 20,800 XP (Master)
    { lessons: 240, quizzes: 41, streak: 43, longest: 50, days: 92 }, // 240*70(16800) + 4100 + 1840 = 22,740 XP (Master)
    { lessons: 260, quizzes: 45, streak: 45, longest: 52, days: 100 } // 260*70(18200) + 4500 + 2000 = 24,700 XP (Master #1)
  ]

  for (let i = 65; i <= 70; i++) {
    const raw = REALISTIC_NAMES[i - 1]
    const cfg = groupETargets[i - 65]
    users.push({
      index: i,
      id: generateDeterministicUuid(`tmdemy:demouser:${i}`),
      username: raw.username,
      email: `${raw.username}@example.com`,
      fullName: raw.fullName,
      bio: raw.bio,
      avatar: raw.avatar,
      group: 'TOP',
      courseEnrollmentCount: 26 + (i - 65),
      targetLessonCompletions: cfg.lessons,
      targetQuizCompletions: cfg.quizzes,
      currentStreak: cfg.streak,
      longestStreak: cfg.longest,
      daysActiveCount: cfg.days,
      brokenStreak: false,
      accountAgeDays: 160 + (i - 64) * 3
    })
  }

  return users
}
