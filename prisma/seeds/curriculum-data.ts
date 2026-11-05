import { LessonType, QuestionType } from '@prisma/client'
import { generateDeterministicUuid } from './course-data'

export interface SeedCourseTarget {
  id: string
  authorId: string
  title: string
  category: 'WEB' | 'PROGRAMMING' | 'DATA' | 'AI'
  slug: string
}

export const TARGET_COURSES: SeedCourseTarget[] = [
  // Web Dev
  {
    id: '00d7b29c-a915-5905-9592-b282bd2194dc',
    authorId: '13608f92-8acf-53e3-adcb-0d832e9cb1d4',
    title: 'Thiết Kế Design System Cho React Với Storybook và Tailwind CSS',
    category: 'WEB',
    slug: 'thiet-ke-design-system-cho-react-voi-storybook-va-tailwind-css'
  },
  {
    id: '00e2616f-b60f-523f-9ec1-fa31c266f1b9',
    authorId: '13608f92-8acf-53e3-adcb-0d832e9cb1d4',
    title: 'React Native Toàn Tập: Lập Trình Ứng Dụng Đa Nền Tảng iOS và Android',
    category: 'WEB',
    slug: 'react-native-toan-tap-lap-trinh-ung-dung-da-nen-tang-ios-va-android'
  },
  {
    id: '07daa67a-13e5-5a27-a14f-28d78e018274',
    authorId: 'c79ee551-3b2e-48ca-9105-c0669f04e6bb',
    title: 'Xây Dựng Trình Nghe Nhạc Trực Tuyến (Music Streaming App) Tuyệt Đẹp',
    category: 'WEB',
    slug: 'xay-dung-trinh-nghe-nhac-truc-tuyen-music-streaming-app'
  },
  {
    id: '096eb6cc-d9e2-59c3-af67-755da47b314e',
    authorId: 'c79ee551-3b2e-48ca-9105-c0669f04e6bb',
    title: 'Xây Dựng CLI Tool Hỗ Trợ Đội Ngũ Phát Triển Web Bằng Node.js',
    category: 'WEB',
    slug: 'xay-dung-cli-tool-ho-tro-doi-ngu-web-bang-node-js'
  },
  {
    id: '097daf24-bf34-5785-bf08-8a0a1dbe5e64',
    authorId: 'c79ee551-3b2e-48ca-9105-c0669f04e6bb',
    title: 'Triển Khai và Vận Hành Web Server NGINX Chuyên Nghiệp',
    category: 'WEB',
    slug: 'trien-khai-va-van-hanh-web-server-nginx-chuyen-nghiep'
  },
  {
    id: '122f1466-dd34-595f-bd5b-9e8b25bd36ea',
    authorId: '6dd1ccd9-420b-5c6d-8322-75223e67e549',
    title: 'Remix Framework Thực Chiến: Xây Dựng Ứng Dụng Dựa Trên Nền Tảng Web Chuẩn',
    category: 'WEB',
    slug: 'remix-framework-thuc-chien-xay-dung-ung-dung-nen-tang-web'
  },
  {
    id: '12bee1d8-7bf7-56dc-b960-16bd865e7942',
    authorId: '13608f92-8acf-53e3-adcb-0d832e9cb1d4',
    title: 'Làm Chủ Next.js 15: Kiến Trúc App Router và Server Actions Chuyên Sâu',
    category: 'WEB',
    slug: 'lam-chu-next-js-15-app-router-server-actions'
  },
  {
    id: '1679be20-96a1-51cc-bc75-0948c6b15954',
    authorId: '6dd1ccd9-420b-5c6d-8322-75223e67e549',
    title: 'HTML5 và CSS3 Chuyên Sâu: Nền Tảng Lập Trình Web Bất Biến',
    category: 'WEB',
    slug: 'html5-va-css3-chuyen-sau-nen-tang-lap-trinh-web'
  },

  // Programming
  {
    id: '025fbcd5-9d09-51d8-9aa3-3e028ab15618',
    authorId: '6dd1ccd9-420b-5c6d-8322-75223e67e549',
    title: 'Thực Hành Giải 50 Bài Toán Phỏng Vấn Kỹ Thuật Với Python',
    category: 'PROGRAMMING',
    slug: 'thuc-hanh-giai-50-bai-toan-phong-van-ky-thuat-python'
  },
  {
    id: '049f7591-7236-5744-a5f7-6ff0ea59a0d6',
    authorId: '13608f92-8acf-53e3-adcb-0d832e9cb1d4',
    title: 'Swift và SwiftUI: Lập Trình Ứng Dụng iOS Cho iPhone và iPad',
    category: 'PROGRAMMING',
    slug: 'swift-va-swiftui-lap-trinh-ung-dung-ios-cho-iphone-va-ipad'
  },
  {
    id: '08b7e32b-7ff0-5228-a3e2-dab2f25c75c7',
    authorId: '6dd1ccd9-420b-5c6d-8322-75223e67e549',
    title: 'Giao Dịch Cơ Sở Dữ Liệu (Database Transactions) và Các Cấp Độ Isolation',
    category: 'PROGRAMMING',
    slug: 'giao-dich-co-so-du-lieu-database-transactions-isolation-levels'
  },
  {
    id: '09b56eae-b89a-55c2-be49-729f3bdd70cc',
    authorId: '8eb5b1cb-9b46-5ce8-b7c2-9d0d86c893e8',
    title: 'Kiến Trúc Hướng Sự Kiện (Event-Driven Architecture) Với Apache Kafka',
    category: 'PROGRAMMING',
    slug: 'kien-truc-huong-su-kien-event-driven-architecture-kafka'
  },
  {
    id: '0b066450-7f74-5e4d-81fe-d5ce486903b2',
    authorId: '8eb5b1cb-9b46-5ce8-b7c2-9d0d86c893e8',
    title: 'Quản Trị Mạng Máy Tính (Computer Networking) Cho Kỹ Sư DevOps và Backend',
    category: 'PROGRAMMING',
    slug: 'quan-tri-mang-may-tinh-networking-devops-backend'
  },
  {
    id: '0c763b16-e0cb-5045-be29-424dd160f115',
    authorId: 'c79ee551-3b2e-48ca-9105-c0669f04e6bb',
    title: 'Kỹ Thuật Code Review Chuyên Nghiệp: Nâng Cao Chất Lượng Mã Nguồn Toàn Team',
    category: 'PROGRAMMING',
    slug: 'ky-thuat-code-review-chuyen-nghiep-chat-luong-ma-nguon'
  },
  {
    id: '0c930cf8-b223-55da-8761-7826270c807c',
    authorId: '13608f92-8acf-53e3-adcb-0d832e9cb1d4',
    title: 'Lập Trình Python Từ Số 0 Đến Chuyên Gia: Tư Duy Lập Trình Hiện Đại',
    category: 'PROGRAMMING',
    slug: 'lap-trinh-python-tu-so-0-den-chuyen-gia-tu-duy-hien-dai'
  },
  {
    id: '0d632fa5-5c23-501b-8ba0-a9c6845a3597',
    authorId: 'c79ee551-3b2e-48ca-9105-c0669f04e6bb',
    title: 'Lập Trình Game 3D Với Godot Engine 4 Mã Nguồn Mở',
    category: 'PROGRAMMING',
    slug: 'lap-trinh-game-3d-voi-godot-engine-4-ma-nguon-mo'
  },

  // Data Science
  {
    id: '0143931b-78f0-552d-95a0-4219a6cbc215',
    authorId: '8eb5b1cb-9b46-5ce8-b7c2-9d0d86c893e8',
    title: 'Xác Suất Thống Kê Ứng Dụng Trong Khoa Học Dữ Liệu và AI',
    category: 'DATA',
    slug: 'xac-suat-thong-ke-ung-dung-trong-khoa-hoc-du-lieu-ai'
  },
  {
    id: '070183bb-4c03-594c-9a32-0cf8241189a2',
    authorId: '6dd1ccd9-420b-5c6d-8322-75223e67e549',
    title: 'Phân Tích Hành Vi Người Dùng Ứng Dụng Di Động Bằng Mixpanel và Amplitude',
    category: 'DATA',
    slug: 'phan-tich-hanh-vi-nguoi-dung-mixpanel-amplitude'
  },
  {
    id: '0b77496b-859b-5013-b30f-ab9ee348d055',
    authorId: '6dd1ccd9-420b-5c6d-8322-75223e67e549',
    title: 'Quản Trị Metadata và Danh Mục Dữ Liệu (Data Catalog) Với DataHub',
    category: 'DATA',
    slug: 'quan-tri-metadata-danh-muc-du-lieu-datahub'
  },
  {
    id: '16597ef1-cb7b-56eb-ad70-5e579166686f',
    authorId: '13608f92-8acf-53e3-adcb-0d832e9cb1d4',
    title: 'Tableau Desktop Chuyên Nghiệp: Trực Quan Hóa Dữ Liệu Doanh Nghiệp',
    category: 'DATA',
    slug: 'tableau-desktop-chuyen-nghiep-truc-quan-hoa-du-lieu'
  },
  {
    id: '19748c69-ed30-562d-8af7-dcc7c21cb209',
    authorId: '6dd1ccd9-420b-5c6d-8322-75223e67e549',
    title: 'Google BigQuery Toàn Tập: Xử Lý Truy Vấn Petabyte Dữ Liệu Trong Vài Giây',
    category: 'DATA',
    slug: 'google-bigquery-toan-tap-xu-ly-truy-van-petabyte'
  },
  {
    id: '1cd0883a-4ef5-5437-b362-f79cf574296a',
    authorId: '13608f92-8acf-53e3-adcb-0d832e9cb1d4',
    title: 'Jupyter Lab và Môi Trường Làm Việc Chuẩn Khoa Học Dữ Liệu',
    category: 'DATA',
    slug: 'jupyter-lab-va-moi-truong-lam-viec-chuan-data-science'
  },
  {
    id: '1d832da2-75a0-5006-9256-4d25e41dd220',
    authorId: '8eb5b1cb-9b46-5ce8-b7c2-9d0d86c893e8',
    title: 'Phát Hiện Gian Lận Thẻ Tín Dụng và Rửa Tiền Bằng Khoa Học Dữ Liệu',
    category: 'DATA',
    slug: 'phat-hien-gian-lan-the-tin-dung-bang-khoa-hoc-du-lieu'
  },
  {
    id: '211ecff1-f030-5eaa-bc3e-ef8704ca0334',
    authorId: '8eb5b1cb-9b46-5ce8-b7c2-9d0d86c893e8',
    title: 'Toán Học Cho Khoa Học Dữ Liệu: Khóa Học Tổng Quan Dễ Hiểu Không Đau Đầu',
    category: 'DATA',
    slug: 'toan-hoc-cho-khoa-hoc-du-lieu-tong-quan-de-hieu'
  },

  // AI
  {
    id: '0259cf42-8b74-537b-aa0d-4b544d9964af',
    authorId: '6dd1ccd9-420b-5c6d-8322-75223e67e549',
    title: 'Tạo Ứng Dụng Tóm Tắt Văn Bản và Biên Dịch Tự Động Bằng Mô Hình Ngôn Ngữ',
    category: 'AI',
    slug: 'tao-ung-dung-tom-tat-van-ban-bien-dich-tu-dong'
  },
  {
    id: '04d15cd3-9495-5539-b2b1-c564d06525f9',
    authorId: '8eb5b1cb-9b46-5ce8-b7c2-9d0d86c893e8',
    title: 'Phân Tích Cảm Xúc Đa Cấp Độ (Aspect-Based Sentiment Analysis - ABSA)',
    category: 'AI',
    slug: 'phan-tich-cam-xuc-da-cap-do-absa'
  },
  {
    id: '053fd285-7f47-57fc-bf59-665048532fed',
    authorId: '6dd1ccd9-420b-5c6d-8322-75223e67e549',
    title: 'Mạng Nơ-ron Đồ Thị (Graph Neural Networks - GNNs) Với PyTorch Geometric',
    category: 'AI',
    slug: 'mang-no-ron-do-thi-gnn-pytorch-geometric'
  },
  {
    id: '09f33259-f309-5c18-8ec3-b7f65625e60b',
    authorId: '6dd1ccd9-420b-5c6d-8322-75223e67e549',
    title: 'Tìm Kiếm Ngữ Nghĩa (Semantic Search) Đỉnh Cao Với Vector Database và Embeddings',
    category: 'AI',
    slug: 'tim-kiem-ngu-nghia-semantic-search-vector-database'
  },
  {
    id: '0a4985ed-424f-5b96-a5bd-da018f200050',
    authorId: '8eb5b1cb-9b46-5ce8-b7c2-9d0d86c893e8',
    title: 'Mô Hình Hóa Chủ Đề Văn Bản (Topic Modeling) Với BERTopic và LDA',
    category: 'AI',
    slug: 'mo-hinh-hoa-chu-de-van-ban-bertopic-lda'
  },
  {
    id: '0ab58f3e-326d-5b7d-a217-ad0d3b393604',
    authorId: '8eb5b1cb-9b46-5ce8-b7c2-9d0d86c893e8',
    title: 'Mô Hình BERT và Biến Thể (RoBERTa, DeBERTa): Làm Chủ Trích Xuất Ngữ Nghĩa',
    category: 'AI',
    slug: 'mo-hinh-bert-va-bien-the-roberta-deberta'
  },
  {
    id: '0bd7aab1-39e0-5119-b20d-f7f952e1d950',
    authorId: '6dd1ccd9-420b-5c6d-8322-75223e67e549',
    title: 'Tự Động Hóa Soạn Thảo và Sáng Tạo Nội Dung Tiếp Thị Bằng AI',
    category: 'AI',
    slug: 'tu-dong-hoa-soan-thao-noi-dung-tiep-thi-ai'
  },
  {
    id: '0ea219f1-7b37-5a8d-a194-dd0aabf24eac',
    authorId: 'c79ee551-3b2e-48ca-9105-c0669f04e6bb',
    title: 'Triển Khai Mô Hình AI Tốc Độ Cực Hạn Với NVIDIA Triton Inference Server',
    category: 'AI',
    slug: 'trien-khai-ai-nvidia-triton-inference-server'
  }
]

export interface GeneratedCurriculum {
  chapters: {
    id: string
    title: string
    courseId: string
    order: number
    lessons: {
      id: string
      title: string
      slug: string
      chapterId: string
      courseId: string
      authorId: string
      order: number
      duration: number
      type: LessonType
      content: string
      isDemo: boolean
      videoUrl: string
      quiz?: {
        id: string
        title: string
        description: string
        duration: number
        passingGrade: number
        lessonId: string
        courseId: string
        createdById: string
        questions: {
          id: string
          quizId: string
          type: QuestionType
          title: string
          answer: string
          points: number
          options: {
            id: string
            questionId: string
            optionText: string
            order: number
          }[]
        }[]
      }
    }[]
  }[]
}

/**
 * Generates deterministic chapters, lessons, quizzes for the 32 target courses.
 * Each course gets 2 chapters, with 4-5 lessons per chapter (8-10 lessons total),
 * and 2 quizzes with multiple-choice questions.
 */
export function generateCurriculumForCourse(course: SeedCourseTarget): GeneratedCurriculum {
  const result: GeneratedCurriculum = { chapters: [] }

  const chapterConfigs = [
    {
      title: `Chương 1: Nền tảng & Khái niệm cốt lõi`,
      lessonCount: 4,
      quizLessonIdx: 3 // Quiz attached to 4th lesson
    },
    {
      title: `Chương 2: Kỹ thuật nâng cao & Thực hành dự án`,
      lessonCount: 5,
      quizLessonIdx: 4 // Quiz attached to 5th lesson
    }
  ]

  let globalLessonOrder = 1

  chapterConfigs.forEach((chCfg, chIdx) => {
    const chapterId = generateDeterministicUuid(`curriculum:chapter:${course.id}:${chIdx + 1}`)
    const lessons: GeneratedCurriculum['chapters'][0]['lessons'] = []

    for (let lIdx = 0; lIdx < chCfg.lessonCount; lIdx++) {
      const lessonOrder = globalLessonOrder++
      const lessonId = generateDeterministicUuid(`curriculum:lesson:${course.id}:${lessonOrder}`)
      const lessonSlug = `bai-${lessonOrder}-chu-de-chuyen-sau-${course.category.toLowerCase()}`

      let quizData: GeneratedCurriculum['chapters'][0]['lessons'][0]['quiz'] = undefined

      if (lIdx === chCfg.quizLessonIdx) {
        const quizId = generateDeterministicUuid(`curriculum:quiz:${lessonId}`)
        const q1Id = generateDeterministicUuid(`curriculum:question:${quizId}:1`)
        const q2Id = generateDeterministicUuid(`curriculum:question:${quizId}:2`)

        quizData = {
          id: quizId,
          title: `Quiz kiểm tra kiến thức: ${course.title.slice(0, 40)}... (Phần ${chIdx + 1})`,
          description: `Đánh giá mức độ nắm vững lý thuyết và thực hành của phần ${chIdx + 1}.`,
          duration: 15,
          passingGrade: 80,
          lessonId,
          courseId: course.id,
          createdById: course.authorId,
          questions: [
            {
              id: q1Id,
              quizId,
              type: QuestionType.MULTIPLE_CHOICE,
              title: `Khái niệm cốt lõi nào quan trọng nhất trong ${course.title.slice(0, 30)}?`,
              answer: 'Đáp án A: Cấu trúc kiến trúc và nguyên lý tối ưu hóa',
              points: 5,
              options: [
                {
                  id: generateDeterministicUuid(`curriculum:opt:${q1Id}:1`),
                  questionId: q1Id,
                  optionText: 'Đáp án A: Cấu trúc kiến trúc và nguyên lý tối ưu hóa',
                  order: 1
                },
                {
                  id: generateDeterministicUuid(`curriculum:opt:${q1Id}:2`),
                  questionId: q1Id,
                  optionText: 'Đáp án B: Không cần tuân thủ quy chuẩn thiết kế',
                  order: 2
                },
                {
                  id: generateDeterministicUuid(`curriculum:opt:${q1Id}:3`),
                  questionId: q1Id,
                  optionText: 'Đáp án C: Chỉ phụ thuộc vào cấu hình mặc định',
                  order: 3
                },
                {
                  id: generateDeterministicUuid(`curriculum:opt:${q1Id}:4`),
                  questionId: q1Id,
                  optionText: 'Đáp án D: Không có phương án nào đúng',
                  order: 4
                }
              ]
            },
            {
              id: q2Id,
              quizId,
              type: QuestionType.MULTIPLE_CHOICE,
              title: `Best practice khi triển khai ứng dụng thực tế là gì?`,
              answer: 'Đáp án A: Kiểm thử tự động và giám sát tài nguyên định kỳ',
              points: 5,
              options: [
                {
                  id: generateDeterministicUuid(`curriculum:opt:${q2Id}:1`),
                  questionId: q2Id,
                  optionText: 'Đáp án A: Kiểm thử tự động và giám sát tài nguyên định kỳ',
                  order: 1
                },
                {
                  id: generateDeterministicUuid(`curriculum:opt:${q2Id}:2`),
                  questionId: q2Id,
                  optionText: 'Đáp án B: Bỏ qua bước kiểm tra kiểu dữ liệu',
                  order: 2
                },
                {
                  id: generateDeterministicUuid(`curriculum:opt:${q2Id}:3`),
                  questionId: q2Id,
                  optionText: 'Đáp án C: Không cần lưu vết lịch sử lỗi',
                  order: 3
                },
                {
                  id: generateDeterministicUuid(`curriculum:opt:${q2Id}:4`),
                  questionId: q2Id,
                  optionText: 'Đáp án D: Lưu trữ thông tin nhạy cảm ở phía client',
                  order: 4
                }
              ]
            }
          ]
        }
      }

      lessons.push({
        id: lessonId,
        title: `Bài ${lessonOrder}: Khái niệm & Ứng dụng thực tiễn trong ${course.category} #${lessonOrder}`,
        slug: lessonSlug,
        chapterId,
        courseId: course.id,
        authorId: course.authorId,
        order: lessonOrder,
        duration: 600 + lessonOrder * 120,
        type: LessonType.VIDEO,
        content: `Nội dung chi tiết bài học ${lessonOrder} của khóa học "${course.title}". Hướng dẫn thực hành từng bước từ cơ bản đến nâng cao.`,
        isDemo: lessonOrder === 1,
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        quiz: quizData
      })
    }

    result.chapters.push({
      id: chapterId,
      title: chCfg.title,
      courseId: course.id,
      order: chIdx + 1,
      lessons
    })
  })

  return result
}
