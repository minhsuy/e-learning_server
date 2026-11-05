import { CourseLevel } from '@prisma/client'

export interface CourseRawDef {
  title: string
  slug: string
  desc: string
  techs: string[]
  level: CourseLevel
  price: number
  oldPrice: number
}

export const WEB_COURSES: CourseRawDef[] = [
  // 1-15: React & State Management
  {
    title: 'Xây Dựng Ứng Dụng Web Hiện Đại Với React 19 và Server Components',
    slug: 'xay-dung-ung-dung-web-hien-dai-voi-react-19-va-server-components',
    desc: 'Khóa học chuyên sâu về React 19, khám phá các tính năng mới như Server Actions, useOptimistic, useActionState và kiến trúc component hiện đại.',
    techs: ['React 19', 'Next.js', 'TypeScript', 'Server Actions'],
    level: CourseLevel.INTERMEDIATE,
    price: 399000,
    oldPrice: 599000
  },
  {
    title: 'React và TypeScript: Kiến Trúc Ứng Dụng Doanh Nghiệp Toàn Diện',
    slug: 'react-va-typescript-kien-truc-ung-dung-doanh-nghiep-toan-dien',
    desc: 'Học cách thiết kế hệ thống frontend quy mô lớn, kết hợp chặt chẽ giữa React, TypeScript, clean architecture và modular pattern.',
    techs: ['React', 'TypeScript', 'Design Systems', 'Clean Architecture'],
    level: CourseLevel.ADVANCED,
    price: 499000,
    oldPrice: 799000
  },
  {
    title: 'Lập Trình React Cơ Bản Dành Cho Người Mới Bắt Đầu',
    slug: 'lap-trinh-react-co-ban-danh-cho-nguoi-moi-bat-dau',
    desc: 'Nền tảng vững chắc cho người mới bắt đầu lập trình giao diện: JSX, component lifecycle, props, state và các hooks cốt lõi.',
    techs: ['React', 'JavaScript', 'HTML5', 'CSS3'],
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0
  },
  {
    title: 'Tối Ưu Hiệu Năng Ứng Dụng React Nâng Cao (React Performance Tuning)',
    slug: 'toi-uu-hieu-nang-ung-dung-react-nang-cao',
    desc: 'Làm chủ kỹ thuật profiling, memoization, virtualization, code-splitting và giải quyết triệt để các vấn đề re-render dư thừa.',
    techs: ['React Profiler', 'Web Vitals', 'Webpack', 'Lighthouse'],
    level: CourseLevel.ADVANCED,
    price: 349000,
    oldPrice: 499000
  },
  {
    title: 'Quản Lý Trạng Thái Ứng Dụng Với Redux Toolkit và RTK Query',
    slug: 'quan-ly-trang-thai-ung-dung-voi-redux-toolkit-va-rtk-query',
    desc: 'Làm chủ Redux hiện đại: slice reducer, thunks, cache invalidation, polling và optimistic updates với RTK Query.',
    techs: ['Redux Toolkit', 'RTK Query', 'TypeScript', 'React'],
    level: CourseLevel.INTERMEDIATE,
    price: 249000,
    oldPrice: 399000
  },
  {
    title: 'Quản Lý Trạng Thái Tinh Gọn Với Zustand và TanStack Query',
    slug: 'quan-ly-trang-thai-tinh-gon-voi-zustand-va-tanstack-query',
    desc: 'Phương pháp quản lý state tinh gọn phổ biến nhất hiện nay: tách biệt server state và client state hiệu quả cao.',
    techs: ['Zustand', 'TanStack Query', 'React', 'Axios'],
    level: CourseLevel.INTERMEDIATE,
    price: 199000,
    oldPrice: 299000
  },
  {
    title: 'React Custom Hooks: Xây Dựng Thư Viện Reusable Hooks Chuẩn Chuyên Nghiệp',
    slug: 'react-custom-hooks-xay-dung-thu-vien-reusable-hooks-chuan-chuyen-nghiep',
    desc: 'Học cách trừu tượng hóa logic phức tạp thành các Custom Hooks tái sử dụng và đóng gói thành thư viện npm.',
    techs: ['React Hooks', 'TypeScript', 'Jest', 'NPM Package'],
    level: CourseLevel.INTERMEDIATE,
    price: 149000,
    oldPrice: 199000
  },
  {
    title: 'Xây Dựng Giao Diện Kéo Thả Trực Quan Với React và dnd-kit',
    slug: 'xay-dung-giao-dien-keo-tha-truc-quan-voi-react-va-dnd-kit',
    desc: 'Học cách tạo bảng Kanban, sơ đồ tương tác và trình soạn thảo kéo thả mượt mà với dnd-kit trên React.',
    techs: ['dnd-kit', 'React', 'Tailwind CSS', 'Kanban Board'],
    level: CourseLevel.INTERMEDIATE,
    price: 299000,
    oldPrice: 450000
  },
  {
    title: 'Thực Hành Kiểm Thử Ứng Dụng React Với Vitest và Testing Library',
    slug: 'thuc-hanh-kiem-thu-ung-dung-react-voi-vitest-va-testing-library',
    desc: 'Xây dựng bộ test tự động toàn diện: Unit Test, Component Integration Test, Mocking API với MSW theo chuẩn công nghiệp.',
    techs: ['Vitest', 'Testing Library', 'MSW', 'TDD'],
    level: CourseLevel.INTERMEDIATE,
    price: 299000,
    oldPrice: 399000
  },
  {
    title: 'React Native Toàn Tập: Lập Trình Ứng Dụng Đa Nền Tảng iOS và Android',
    slug: 'react-native-toan-tap-lap-trinh-ung-dung-da-nen-tang-ios-va-android',
    desc: 'Chuyển hóa kỹ năng React sang di động với React Native và Expo, xây dựng ứng dụng thực tế từ thiết kế đến phát hành.',
    techs: ['React Native', 'Expo', 'Mobile Navigation', 'Redux'],
    level: CourseLevel.INTERMEDIATE,
    price: 599000,
    oldPrice: 899000
  },
  {
    title: 'Xây Dựng Ứng Dụng Chat Realtime Với React và Socket.IO',
    slug: 'xay-dung-ung-dung-chat-realtime-voi-react-va-socket-io',
    desc: 'Thiết kế hệ thống tin nhắn tức thời: phòng chat, thông báo trạng thái online/offline, gửi tệp và tin nhắn thoại.',
    techs: ['Socket.IO', 'React', 'Node.js', 'Express'],
    level: CourseLevel.INTERMEDIATE,
    price: 349000,
    oldPrice: 499000
  },
  {
    title: 'Xây Dựng Sàn Thương Mại Điện Tử Fullstack Với React và Node.js',
    slug: 'xay-dung-san-thuong-mai-dien-tu-fullstack-voi-react-va-node-js',
    desc: 'Khóa học thực chiến dự án lớn: giỏ hàng, thanh toán VNPAY/MoMo, phân quyền quản trị, xử lý đơn hàng và thống kê doanh thu.',
    techs: ['React', 'Node.js', 'PostgreSQL', 'Payment Gateway'],
    level: CourseLevel.ADVANCED,
    price: 799000,
    oldPrice: 1199000
  },
  {
    title: 'React Animation Chuyên Nghiệp Với Framer Motion',
    slug: 'react-animation-chuyen-nghiep-voi-framer-motion',
    desc: 'Tạo các hiệu ứng chuyển cảnh mềm mại, micro-interactions và giao diện sống động thu hút người dùng.',
    techs: ['Framer Motion', 'React', 'CSS Animations', 'UI/UX'],
    level: CourseLevel.BEGINNER,
    price: 199000,
    oldPrice: 299000
  },
  {
    title: 'Thiết Kế Design System Cho React Với Storybook và Tailwind CSS',
    slug: 'thiet-ke-design-system-cho-react-voi-storybook-va-tailwind-css',
    desc: 'Chuẩn hóa kho component giao diện cho công ty: tokens, accessibility (a11y), visual regression testing với Storybook.',
    techs: ['Storybook', 'Tailwind CSS', 'Radix UI', 'Accessibility'],
    level: CourseLevel.ADVANCED,
    price: 449000,
    oldPrice: 650000
  },
  {
    title: 'Lập Trình Web 3D Tương Tác Với Three.js và React Three Fiber',
    slug: 'lap-trinh-web-3d-tuong-tac-voi-three-js-va-react-three-fiber',
    desc: 'Khám phá thế giới 3D trên trình duyệt: camera, shaders, vật liệu, hiệu ứng ánh sáng và mô hình tương tác 3D.',
    techs: ['Three.js', 'React Three Fiber', 'GLTF', 'WebGL'],
    level: CourseLevel.ADVANCED,
    price: 549000,
    oldPrice: 799000
  },

  // 16-30: Next.js & Modern SSR Frameworks
  {
    title: 'Làm Chủ Next.js 15: Kiến Trúc App Router và Server Actions Chuyên Sâu',
    slug: 'lam-chu-next-js-15-kien-truc-app-router-va-server-actions-chuyen-sau',
    desc: 'Khóa học toàn diện về Next.js mới nhất: nested layouts, streaming SSR, parallel routes, intercepting routes và caching strategies.',
    techs: ['Next.js 15', 'React Server Components', 'TypeScript', 'Prisma'],
    level: CourseLevel.ADVANCED,
    price: 599000,
    oldPrice: 899000
  },
  {
    title: 'Next.js Cơ Bản Cho Người Bắt Đầu: Xây Dựng Blog Cá Nhân Chuẩn SEO',
    slug: 'next-js-co-ban-cho-nguoi-bat-dau-xay-dung-blog-ca-nhan-chuan-seo',
    desc: 'Bước đầu làm quen với Next.js: Static Site Generation (SSG), dynamic routes, tối ưu hình ảnh và triển khai miễn phí lên Vercel.',
    techs: ['Next.js', 'Markdown', 'Tailwind CSS', 'Vercel'],
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0
  },
  {
    title: 'Xây Dựng Nền Tảng SaaS Đa Khách Hàng (Multi-Tenant) Với Next.js và Prisma',
    slug: 'xay-dung-nen-tang-saas-da-khach-hang-voi-next-js-va-prisma',
    desc: 'Thực chiến xây dựng ứng dụng phần mềm dịch vụ: custom subdomains, Stripe subscription billing, tổ chức dữ liệu riêng biệt.',
    techs: ['Next.js', 'Prisma', 'PostgreSQL', 'Stripe API'],
    level: CourseLevel.ADVANCED,
    price: 999000,
    oldPrice: 1499000
  },
  {
    title: 'Xác Thực và Phân Quyền Bảo Mật Trong Next.js Với Auth.js (NextAuth v5)',
    slug: 'xac-thuc-va-phan-quyen-bao-mat-trong-next-js-voi-auth-js',
    desc: 'Triển khai hệ thống xác thực an toàn: OAuth (Google, GitHub), Credentials login, 2FA, session management trên Edge runtime.',
    techs: ['Auth.js', 'Next.js', 'JWT', 'Security'],
    level: CourseLevel.INTERMEDIATE,
    price: 299000,
    oldPrice: 450000
  },
  {
    title: 'Tối Ưu Hóa SEO Toàn Diện và Core Web Vitals Cho Website Next.js',
    slug: 'toi-uu-hoa-seo-toan-dien-va-core-web-vitals-cho-website-next-js',
    desc: 'Làm chủ Metadata API, Open Graph dynamic generation, sitemap tự động, robots.txt và đạt điểm 100/100 Google PageSpeed.',
    techs: ['Next.js SEO', 'Lighthouse', 'Core Web Vitals', 'Metadata API'],
    level: CourseLevel.INTERMEDIATE,
    price: 249000,
    oldPrice: 350000
  },
  {
    title: 'Fullstack Next.js và Tailwind CSS: Xây Dựng Ứng Dụng Quản Lý Công Việc',
    slug: 'fullstack-next-js-va-tailwind-css-xay-dung-ung-dung-quan-ly-cong-viec',
    desc: 'Tự tay làm một sản phẩm hoàn chỉnh từ giao diện đến cơ sở dữ liệu: CRUD, lọc nhiệm vụ, tìm kiếm nhanh và giao diện dark mode.',
    techs: ['Next.js', 'Tailwind CSS', 'PostgreSQL', 'Zod'],
    level: CourseLevel.BEGINNER,
    price: 149000,
    oldPrice: 249000
  },
  {
    title: 'Nuxt 3 Toàn Tập: Phát Triển Web SSR và SSG Mạnh Mẽ Với Vue 3',
    slug: 'nuxt-3-toan-tap-phat-trien-web-ssr-va-ssg-manh-me-voi-vue-3',
    desc: 'Trải nghiệm framework hàng đầu cho Vue: auto-imports, file-based routing, server engine Nitro và tối ưu hóa SEO đỉnh cao.',
    techs: ['Nuxt 3', 'Vue 3', 'Nitro', 'Pinia'],
    level: CourseLevel.INTERMEDIATE,
    price: 399000,
    oldPrice: 599000
  },
  {
    title: 'Lập Trình Vue 3 Nâng Cao: Composition API, Script Setup và TypeScript',
    slug: 'lap-trinh-vue-3-nang-cao-composition-api-script-setup-va-typescript',
    desc: 'Nâng cấp kỹ năng Vue hiện đại: reactivity in-depth, provide/inject, composables pattern và tích hợp TypeScript liền mạch.',
    techs: ['Vue 3', 'Composition API', 'TypeScript', 'Vite'],
    level: CourseLevel.INTERMEDIATE,
    price: 299000,
    oldPrice: 450000
  },
  {
    title: 'Svelte và SvelteKit: Tiếp Cận Lập Trình Web Thế Hệ Mới Không Virtual DOM',
    slug: 'svelte-va-sveltekit-tiep-can-lap-trinh-web-the-he-moi-khong-virtual-dom',
    desc: 'Khám phá sự đơn giản và tốc độ vượt trội của SvelteKit: compiler architecture, reactivity nguyên bản và bundle siêu nhẹ.',
    techs: ['Svelte', 'SvelteKit', 'JavaScript', 'CSS'],
    level: CourseLevel.BEGINNER,
    price: 199000,
    oldPrice: 299000
  },
  {
    title: 'Angular 18: Lập Trình Ứng Dụng Doanh Nghiệp Với Standalone Components',
    slug: 'angular-18-lap-trinh-ung-dung-doanh-nghiep-voi-standalone-components',
    desc: 'Học phiên bản Angular mới nhất: loại bỏ NgModule, cơ chế Signals mới, RxJS reactive patterns và kiến trúc module enterprise.',
    techs: ['Angular 18', 'Signals', 'RxJS', 'TypeScript'],
    level: CourseLevel.ADVANCED,
    price: 549000,
    oldPrice: 799000
  },
  {
    title: 'Astro Framework: Xây Dựng Website Tĩnh Tốc Độ Ánh Sáng Với Islands Architecture',
    slug: 'astro-framework-xay-dung-website-tinh-toc-do-anh-sang-voi-islands-architecture',
    desc: 'Kiến trúc Content-driven hiện đại: Zero-JS theo mặc định, tích hợp linh hoạt React, Vue hoặc Svelte khi cần tương tác.',
    techs: ['Astro', 'Islands Architecture', 'Markdown', 'Tailwind'],
    level: CourseLevel.BEGINNER,
    price: 149000,
    oldPrice: 249000
  },
  {
    title: 'Remix Framework Thực Chiến: Xây Dựng Ứng Dụng Dựa Trên Nền Tảng Web Chuẩn',
    slug: 'remix-framework-thuc-chien-xay-dung-ung-dung-dua-tren-nen-tang-web-chuan',
    desc: 'Làm chủ framework tập trung vào Web Standards: data loaders, form actions, optimistic UI và error boundaries linh hoạt.',
    techs: ['Remix', 'React', 'HTTP Caching', 'TypeScript'],
    level: CourseLevel.INTERMEDIATE,
    price: 349000,
    oldPrice: 499000
  },
  {
    title: 'Xây Dựng Headless E-Commerce Với Next.js và Shopify Storefront API',
    slug: 'xay-dung-headless-e-commerce-voi-next-js-va-shopify-storefront-api',
    desc: 'Tách biệt hoàn toàn frontend và backend thương mại điện tử, tùy biến giao diện mua sắm siêu mượt và tối ưu chuyển đổi.',
    techs: ['Next.js', 'Shopify GraphQL API', 'Tailwind', 'E-commerce'],
    level: CourseLevel.ADVANCED,
    price: 749000,
    oldPrice: 1099000
  },
  {
    title: 'Xây Dựng Ứng Dụng Trực Quan Hóa Dữ Liệu Thời Gian Thực Trên Next.js',
    slug: 'xay-dung-ung-dung-truc-quan-hoa-du-lieu-thoi-gian-thuc-tren-next-js',
    desc: 'Thiết kế dashboard giám sát: tích hợp biểu đồ Chart.js, Recharts, kết nối WebSocket và cập nhật chỉ số tức thì.',
    techs: ['Next.js', 'Recharts', 'WebSockets', 'Dashboard UI'],
    level: CourseLevel.INTERMEDIATE,
    price: 299000,
    oldPrice: 420000
  },
  {
    title: 'Edge Computing và Serverless Với Next.js và Cloudflare Workers',
    slug: 'edge-computing-va-serverless-voi-next-js-va-cloudflare-workers',
    desc: 'Đưa ứng dụng chạy gần người dùng nhất có thể: triển khai Edge Middleware, geo-routing và phân tán dữ liệu toàn cầu.',
    techs: ['Cloudflare Workers', 'Next.js Edge', 'Serverless', 'CDN'],
    level: CourseLevel.ADVANCED,
    price: 499000,
    oldPrice: 699000
  },

  // 31-45: CSS, Modern Styling & Design Systems
  {
    title: 'Làm Chủ Tailwind CSS 4: Từ Nền Tảng Đến Thiết Kế Giao Diện Tinh Tế',
    slug: 'lam-chu-tailwind-css-4-tu-nen-tang-den-thiet-ke-giao-dien-tinh-te',
    desc: 'Khám phá động cơ CSS mới của Tailwind 4, cấu hình không file cấu hình, container queries và phong cách utility-first chuẩn.',
    techs: ['Tailwind CSS 4', 'CSS Grid', 'Flexbox', 'Responsive Design'],
    level: CourseLevel.BEGINNER,
    price: 199000,
    oldPrice: 299000
  },
  {
    title: 'HTML5 và CSS3 Chuyên Sâu: Nền Tảng Lập Trình Web Bất Biến',
    slug: 'html5-va-css3-chuyen-sau-nen-tang-lap-trinh-web-bat-bien',
    desc: 'Xây dựng tư duy layout vững chắc: Flexbox, CSS Grid, Semantic HTML, Media Queries và cấu trúc thẻ chuẩn SEO tiếp cận cao.',
    techs: ['HTML5', 'CSS3', 'Responsive Layout', 'Semantic Web'],
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0
  },
  {
    title: 'CSS Modern Layouts: Làm Chủ Flexbox, Grid và Subgrid Trong Thực Tế',
    slug: 'css-modern-layouts-lam-chu-flexbox-grid-va-subgrid-trong-thuc-te',
    desc: 'Giải quyết mọi bài toán dàn trang phức tạp nhất trên giao diện người dùng mà không cần dùng đến các framework cồng kềnh.',
    techs: ['CSS Grid', 'Subgrid', 'Flexbox', 'Modern CSS'],
    level: CourseLevel.INTERMEDIATE,
    price: 149000,
    oldPrice: 220000
  },
  {
    title: 'Nghệ Thuật Hiệu Ứng Web: CSS Animation, Transition và SVG Morphing',
    slug: 'nghe-thuat-hieu-ung-web-css-animation-transition-va-svg-morphing',
    desc: 'Tự tay sáng tạo các hiệu ứng loading độc đáo, nút bấm tương tác cao cấp và biểu tượng vector động đẹp mắt.',
    techs: ['CSS Animations', 'SVG', 'Web Animations API', 'Keyframes'],
    level: CourseLevel.INTERMEDIATE,
    price: 199000,
    oldPrice: 299000
  },
  {
    title: 'Chuyển Đổi Thiết Kế Figma Sang Code HTML/CSS/Tailwind Chuẩn Từng Pixel',
    slug: 'chuyen-doi-thiet-ke-figma-sang-code-chuan-tung-pixel',
    desc: 'Quy trình chuẩn hóa giữa Designer và Frontend Dev: trích xuất assets, đo đạc khoảng cách, auto-layout và responsive design.',
    techs: ['Figma', 'Tailwind CSS', 'Pixel Perfect', 'Frontend Workflow'],
    level: CourseLevel.BEGINNER,
    price: 249000,
    oldPrice: 350000
  },
  {
    title: 'Xây Dựng Giao Diện Dark Mode Hoàn Hảo và Hệ Thống Theme Động',
    slug: 'xay-dung-giao-dien-dark-mode-hoan-hao-va-he-thong-theme-dong',
    desc: 'Phương pháp triển khai Theme chuyên nghiệp: CSS custom properties (variables), tránh hiện tượng nháy màu (FOUC), đồng bộ hệ điều hành.',
    techs: ['CSS Variables', 'Tailwind Dark Mode', 'Theme Switching', 'UI Design'],
    level: CourseLevel.BEGINNER,
    price: 99000,
    oldPrice: 150000
  },
  {
    title: 'Khả Năng Tiếp Cận Web (Web Accessibility a11y) Cho Frontend Developers',
    slug: 'kha-nang-tiep-can-web-a11y-cho-frontend-developers',
    desc: 'Làm quen chuẩn WCAG 2.2: hỗ trợ người khiếm thị đọc màn hình, điều hướng bằng bàn phím và đạt chứng chỉ chuẩn quốc tế.',
    techs: ['ARIA', 'WCAG', 'Screen Readers', 'Keyboard Navigation'],
    level: CourseLevel.INTERMEDIATE,
    price: 199000,
    oldPrice: 299000
  },
  {
    title: 'SASS / SCSS Chuyên Sâu: Cấu Trúc CSS Cho Dự Án Doanh Nghiệp',
    slug: 'sass-scss-chuyen-sau-cau-truc-css-cho-du-an-doanh-nghiep',
    desc: 'Phương pháp 7-1 architecture: mixins, functions, nesting thông minh và bảo trì mã nguồn CSS quy mô lớn.',
    techs: ['SASS', 'SCSS', 'BEM Methodology', 'CSS Architecture'],
    level: CourseLevel.INTERMEDIATE,
    price: 149000,
    oldPrice: 199000
  },
  {
    title: 'CSS Houdini và Tương Lai Của Công Nghệ Tạo Giao Diện Web',
    slug: 'css-houdini-va-tuong-lai-cua-cong-nghe-tao-giao-dien-web',
    desc: 'Can thiệp trực tiếp vào quy trình render của trình duyệt: Paint Worklet, Typed OM và tạo các hiệu ứng đồ họa độc quyền.',
    techs: ['CSS Houdini', 'Paint API', 'Browser Internals', 'JavaScript'],
    level: CourseLevel.ADVANCED,
    price: 299000,
    oldPrice: 399000
  },
  {
    title: 'Tối Ưu Typography và Phông Chữ Trên Website: Hiệu Năng và Thẩm Mỹ',
    slug: 'toi-uu-typography-va-phong-chu-tren-website',
    desc: 'Kỹ thuật font-display, variable fonts, tự host phông chữ, chống layout shift (CLS) và nâng tầm vẻ đẹp chữ viết trên web.',
    techs: ['Web Fonts', 'Typography', 'Core Web Vitals', 'CLS Optimization'],
    level: CourseLevel.BEGINNER,
    price: 99000,
    oldPrice: 149000
  },
  {
    title: 'Xây Dựng Giao Diện Mobile-First Tương Thích Hoàn Hảo Mọi Kích Thước',
    slug: 'xay-dung-giao-dien-mobile-first-tuong-thich-hoan-hao-moi-kich-thuoc',
    desc: 'Tư duy thiết kế ưu tiên thiết bị di động: breakpoints hợp lý, touch interactions, tối ưu băng thông cho mạng di động.',
    techs: ['Mobile First', 'Responsive CSS', 'Media Queries', 'Touch Events'],
    level: CourseLevel.BEGINNER,
    price: 149000,
    oldPrice: 199000
  },
  {
    title: 'shadcn/ui và Radix UI: Bộ Component Không Định Dạng Cho Ứng Dụng Đỉnh Cao',
    slug: 'shadcn-ui-va-radix-ui-bo-component-khong-dinh-dang',
    desc: 'Sở hữu toàn bộ mã nguồn component trong dự án: tùy biến vô hạn, tương thích a11y hoàn hảo và phong cách tối giản sang trọng.',
    techs: ['shadcn/ui', 'Radix UI', 'Tailwind CSS', 'TypeScript'],
    level: CourseLevel.INTERMEDIATE,
    price: 249000,
    oldPrice: 349000
  },
  {
    title: 'Thực Hành Tối Ưu Hóa Giao Diện Web Cho Tốc Độ Tải Dưới 1 Giây',
    slug: 'thuc-hanh-toi-uu-hoa-giao-dien-web-cho-toc-do-tai-duoi-1-giay',
    desc: 'Bí quyết tăng tốc độ: nén tài nguyên, critical CSS, lazy loading ảnh hiện đại (AVIF, WebP), service workers và HTTP/3.',
    techs: ['Critical CSS', 'Web Performance', 'Brotli', 'Image Optimization'],
    level: CourseLevel.ADVANCED,
    price: 399000,
    oldPrice: 550000
  },
  {
    title: 'Micro-Interactions Trong Thiết Kế Web: Nâng Tầm Trải Nghiệm Người Dùng',
    slug: 'micro-interactions-trong-thiet-ke-web-nang-tam-trai-nghiem',
    desc: 'Tập trung vào từng chi tiết nhỏ: phản hồi tương tác nút, thanh tiến trình trực quan, hiệu ứng gõ phím và cảm giác chạm.',
    techs: ['UI/UX', 'Framer Motion', 'Micro-interactions', 'Frontend Design'],
    level: CourseLevel.BEGINNER,
    price: 199000,
    oldPrice: 280000
  },
  {
    title: 'Xây Dựng Website Đa Ngôn Ngữ (i18n) Chuẩn Quốc Tế Cho Doanh Nghiệp',
    slug: 'xay-dung-website-da-ngon-ngu-i18n-chuan-quoc-te',
    desc: 'Triển khai đa ngôn ngữ mượt mà: routing theo locale, định dạng tiền tệ và ngày tháng theo vùng, hỗ trợ ngôn ngữ viết từ phải sang trái (RTL).',
    techs: ['i18n', 'Next-Intl', 'Localization', 'RTL Support'],
    level: CourseLevel.INTERMEDIATE,
    price: 249000,
    oldPrice: 350000
  },

  // 46-60: Backend Node.js, Express & Prisma
  {
    title: 'Xây Dựng RESTful API Chuyên Nghiệp Với Node.js, Express và TypeScript',
    slug: 'xay-dung-restful-api-chuyen-nghiep-voi-node-js-express-va-typescript',
    desc: 'Khóa học nền tảng không thể thiếu cho Backend Developer: kiến trúc phân tầng, validation middleware, xử lý lỗi tập trung và JWT auth.',
    techs: ['Node.js', 'Express.js', 'TypeScript', 'JWT Authentication'],
    level: CourseLevel.BEGINNER,
    price: 299000,
    oldPrice: 450000
  },
  {
    title: 'NestJS Chuyên Sâu: Kiến Trúc Doanh Nghiệp Với Dependency Injection',
    slug: 'nestjs-chuyen-sau-kien-truc-doanh-nghiep-voi-dependency-injection',
    desc: 'Xây dựng backend vững chắc theo chuẩn Angular-like: modules, controllers, providers, guards, interceptors và Swagger documentation.',
    techs: ['NestJS', 'TypeScript', 'Swagger', 'PostgreSQL'],
    level: CourseLevel.ADVANCED,
    price: 499000,
    oldPrice: 750000
  },
  {
    title: 'Làm Chủ Prisma ORM: Thao Tác Cơ Sở Dữ Liệu Type-Safe Trên Node.js',
    slug: 'lam-chu-prisma-orm-thao-tac-co-so-du-lieu-type-safe-tren-node-js',
    desc: 'Mô hình hóa dữ liệu chính xác, migrations tự động, quan hệ 1-nhiều, nhiều-nhiều, transactions và tối ưu query hiệu quả.',
    techs: ['Prisma ORM', 'PostgreSQL', 'TypeScript', 'Database Migrations'],
    level: CourseLevel.INTERMEDIATE,
    price: 299000,
    oldPrice: 399000
  },
  {
    title: 'Lập Trình Backend Không Đồng Bộ Với Node.js: Event Loop và Streams',
    slug: 'lap-trinh-backend-khong-dong-bo-voi-node-js-event-loop-va-streams',
    desc: 'Hiểu cội nguồn sức mạnh của Node.js: cơ chế Event Loop, worker threads, xử lý file gigabyte bằng Streams và Buffer.',
    techs: ['Node.js Core', 'Event Loop', 'Node Streams', 'Worker Threads'],
    level: CourseLevel.ADVANCED,
    price: 349000,
    oldPrice: 499000
  },
  {
    title: 'GraphQL Toàn Tập: Xây Dựng API Linh Hoạt Với Apollo Server và Client',
    slug: 'graphql-toan-tap-xay-dung-api-linh-hoat-voi-apollo-server-va-client',
    desc: 'Thay thế REST bằng GraphQL: Schema definition, Resolvers, Mutations, Subscriptions thời gian thực và giải quyết triệt để lỗi N+1.',
    techs: ['GraphQL', 'Apollo Server', 'DataLoader', 'React Apollo'],
    level: CourseLevel.INTERMEDIATE,
    price: 399000,
    oldPrice: 599000
  },
  {
    title: 'Bảo Mật Ứng Dụng Web Chuyên Sâu: Phòng Chống OWASP Top 10 Trên Node.js',
    slug: 'bao-mat-ung-dung-web-chuyen-sau-phong-chong-owasp-top-10',
    desc: 'Bảo vệ hệ thống khỏi tin tặc: phòng ngừa SQL Injection, XSS, CSRF, Rate Limiting, Helmet headers và mã hóa mật khẩu an toàn.',
    techs: ['Web Security', 'OWASP', 'Penetration Testing', 'Node.js Security'],
    level: CourseLevel.ADVANCED,
    price: 449000,
    oldPrice: 650000
  },
  {
    title: 'Xây Dựng Hệ Thống Hàng Đợi (Job Queue) Nền Tảng Với BullMQ và Redis',
    slug: 'xay-dung-he-thong-hang-doi-nen-tang-voi-bullmq-va-redis',
    desc: 'Xử lý các tác vụ nền tốn thời gian: gửi email hàng loạt, xử lý video, cron jobs lặp lại và cơ chế retry thông minh.',
    techs: ['BullMQ', 'Redis', 'Node.js', 'Background Workers'],
    level: CourseLevel.INTERMEDIATE,
    price: 349000,
    oldPrice: 499000
  },
  {
    title: 'Fastify: Framework Backend Node.js Tốc Độ Cao Cho Ứng Dụng Lớn',
    slug: 'fastify-framework-backend-node-js-toc-do-cao-cho-ung-dung-lon',
    desc: 'Lựa chọn thay thế Express với tốc độ gấp 2 lần: JSON schema validation tự động, plugin architecture và async handling.',
    techs: ['Fastify', 'TypeScript', 'Ajv', 'High Performance Node'],
    level: CourseLevel.INTERMEDIATE,
    price: 249000,
    oldPrice: 350000
  },
  {
    title: 'Xây Dựng Cổng Thanh Toán Trực Tuyến: Tích Hợp Stripe, PayPal và VNPAY',
    slug: 'xay-dung-cong-thanh-toan-truc-tuyen-tich-hop-stripe-paypal-vnpay',
    desc: 'Xử lý dòng tiền an toàn tuyệt đối: Webhooks xác thực, giao dịch idempotent, hoàn tiền và xuất hóa đơn tự động.',
    techs: ['Payment Gateways', 'Stripe API', 'Webhooks', 'Transaction Safety'],
    level: CourseLevel.ADVANCED,
    price: 599000,
    oldPrice: 899000
  },
  {
    title: 'Kiến Trúc Microservices Với Node.js, RabbitMQ và Docker',
    slug: 'kien-truc-microservices-voi-node-js-rabbitmq-va-docker',
    desc: 'Tách ứng dụng nguyên khối thành các dịch vụ độc lập: giao tiếp bất đồng bộ qua Message Broker, Event-Driven Architecture.',
    techs: ['Microservices', 'RabbitMQ', 'Docker Compose', 'Event Driven'],
    level: CourseLevel.ADVANCED,
    price: 699000,
    oldPrice: 999000
  },
  {
    title: 'Lập Trình Webhook và Tích Hợp Dịch Vụ Bên Thứ Ba Trong Node.js',
    slug: 'lap-trinh-webhook-va-tich-hop-dich-vu-ben-thu-ba-trong-node-js',
    desc: 'Lắng nghe và phát tán sự kiện giữa các hệ thống: kiểm tra chữ ký HMAC, đảm bảo giao nhận ít nhất một lần (at-least-once).',
    techs: ['Webhooks', 'HMAC Signatures', 'API Integration', 'Security'],
    level: CourseLevel.INTERMEDIATE,
    price: 199000,
    oldPrice: 299000
  },
  {
    title: 'Tự Động Hóa Kiểm Thử API Backend Với Supertest, Vitest và Postman',
    slug: 'tu-dong-hoa-kiem-thu-api-backend-voi-supertest-vitest-va-postman',
    desc: 'Quy trình kiểm thử hồi quy khép kín: integration testing cho toàn bộ endpoints, mock database và CI automation.',
    techs: ['Supertest', 'Vitest', 'Postman API Testing', 'CI/CD'],
    level: CourseLevel.BEGINNER,
    price: 149000,
    oldPrice: 220000
  },
  {
    title: 'Xây Dựng Ứng Dụng Web Tiến Bộ (Progressive Web Apps - PWA) Hoàn Chỉnh',
    slug: 'xay-dung-ung-dung-web-tien-bo-pwa-hoan-chinh',
    desc: 'Biến website thành app di động có thể cài đặt: Service Workers offline cache, push notifications và background sync.',
    techs: ['PWA', 'Service Workers', 'Web Push', 'Cache API'],
    level: CourseLevel.INTERMEDIATE,
    price: 249000,
    oldPrice: 350000
  },
  {
    title: 'Hệ Thống Phân Tán và Cache Toàn Cầu Với Redis và Memcached',
    slug: 'he-thong-phan-tan-va-cache-toan-cau-voi-redis-va-memcached',
    desc: 'Chiến lược caching: Cache-Aside, Write-Through, chống Cache Breakdown/Stampede và phân tán session người dùng.',
    techs: ['Redis', 'Caching Patterns', 'Distributed Systems', 'Performance'],
    level: CourseLevel.ADVANCED,
    price: 499000,
    oldPrice: 699000
  },
  {
    title: 'Xây Dựng API Gateway và Quản Lý Lưu Lượng Với Kong và NGINX',
    slug: 'xay-dung-api-gateway-va-quan-ly-luu-luong-voi-kong-va-nginx',
    desc: 'Điểm chạm trung tâm bảo vệ backend: load balancing, SSL termination, reverse proxy, định tuyến và giới hạn truy cập.',
    techs: ['API Gateway', 'NGINX', 'Kong', 'Reverse Proxy'],
    level: CourseLevel.ADVANCED,
    price: 549000,
    oldPrice: 799000
  },

  // 61-75: Fullstack Projects & Real-World Use Cases
  {
    title: 'Xây Dựng Mạng Xã Hội Mini Fullstack: Feed, Tương Tác và Bình Luận',
    slug: 'xay-dung-mang-xa-hoi-mini-fullstack-feed-tuong-tac-va-binh-luan',
    desc: 'Thực hành toàn diện: đăng bài, thích/thả tim, bình luận phân cấp, theo dõi bạn bè và thông báo đẩy theo thời gian thực.',
    techs: ['React', 'Node.js', 'PostgreSQL', 'Socket.IO'],
    level: CourseLevel.INTERMEDIATE,
    price: 499000,
    oldPrice: 699000
  },
  {
    title: 'Phát Triển Nền Tảng Học Trực Tuyến LMS Tương Tự Udemy Từ A Đến Z',
    slug: 'phat-trien-nen-tang-hoc-truc-tuyen-lms-tuong-tu-udemy',
    desc: 'Hệ thống đầy đủ tính năng: phát video an toàn, theo dõi tiến độ học tập, bài thi trắc nghiệm, cấp chứng chỉ PDF tự động.',
    techs: ['Next.js', 'Express', 'Prisma', 'Video Streaming'],
    level: CourseLevel.ADVANCED,
    price: 899000,
    oldPrice: 1299000
  },
  {
    title: 'Xây Dựng Công Cụ Quản Trị Admin Dashboard Đa Năng Với React và Refine',
    slug: 'xay-dung-cong-cu-quan-tri-admin-dashboard-da-nang',
    desc: 'Tăng tốc phát triển trang quản trị nội bộ gấp 5 lần: CRUD tự động, xuất báo cáo Excel, lọc dữ liệu nâng cao và phân quyền.',
    techs: ['Refine.dev', 'React', 'Ant Design', 'Admin Template'],
    level: CourseLevel.INTERMEDIATE,
    price: 299000,
    oldPrice: 420000
  },
  {
    title: 'Xây Dựng Ứng Dụng Đặt Lịch Hẹn Khám Bệnh Trực Tuyến Toàn Diện',
    slug: 'xay-dung-ung-dung-dat-lich-hen-kham-benh-truc-tuyen',
    desc: 'Giải quyết bài toán xung đột lịch trình: quản lý khung giờ bác sĩ, gửi email/SMS nhắc nhở và quản lý hồ sơ bệnh án số.',
    techs: ['Fullstack Web', 'TypeScript', 'Calendar Sync', 'Nodemailer'],
    level: CourseLevel.INTERMEDIATE,
    price: 399000,
    oldPrice: 550000
  },
  {
    title: 'Tạo Nền Tảng Chia Sẻ Video Tương Tự YouTube Với Transcoding Đám Mây',
    slug: 'tao-nen-tang-chia-se-video-tuong-tu-youtube-voi-transcoding',
    desc: 'Xử lý video chuyên nghiệp: nén và cắt nhỏ video thành chuẩn HLS m3u8 nhiều độ phân giải (360p, 720p, 1080p) bằng FFmpeg.',
    techs: ['FFmpeg', 'HLS Streaming', 'AWS S3', 'Node.js'],
    level: CourseLevel.ADVANCED,
    price: 799000,
    oldPrice: 1150000
  },
  {
    title: 'Xây Dựng Sàn Đấu Giá Trực Tuyến Thời Gian Thực Với WebSocket',
    slug: 'xay-dung-san-dau-gia-truc-tuyen-thoi-gian-thuc',
    desc: 'Xử lý đồng thời cao điểm: trả giá theo giây, đồng hồ đếm ngược đồng bộ hoàn hảo giữa hàng nghìn người tham gia cùng lúc.',
    techs: ['WebSocket', 'Redis Pub/Sub', 'React', 'Node.js'],
    level: CourseLevel.ADVANCED,
    price: 649000,
    oldPrice: 899000
  },
  {
    title: 'Xây Dựng Ứng Dụng Ghi Chú và Soạn Thảo Văn Bản Markdown Trực Quan',
    slug: 'xay-dung-ung-dung-ghi-chu-va-soan-thao-van-ban-markdown',
    desc: 'Tạo trình soạn thảo WYSIWYG mượt mà: hỗ trợ Markdown, chèn hình ảnh kéo thả, lưu tự động và xuất tệp PDF/HTML.',
    techs: ['TipTap Editor', 'React', 'Markdown', 'Local Storage'],
    level: CourseLevel.BEGINNER,
    price: 149000,
    oldPrice: 220000
  },
  {
    title: 'Hệ Thống Quản Lý Thư Viện Sách và Mượn Trả Sách Trực Tuyến',
    slug: 'he-thong-quan-ly-thu-vien-sach-va-muon-tra-sach-truc-tuyen',
    desc: 'Dự án thực tế cho người mới: quét mã vạch ISBN, tính phí phạt quá hạn, cảnh báo sách sắp hết và gợi ý sách tương tự.',
    techs: ['JavaScript', 'Express', 'PostgreSQL', 'CRUD'],
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0
  },
  {
    title: 'Xây Dựng Trình Nghe Nhạc Trực Tuyến (Music Streaming App) Tuyệt Đẹp',
    slug: 'xay-dung-trinh-nghe-nhac-truc-tuyen-music-streaming-app',
    desc: 'Làm chủ HTML5 Audio API: danh sách phát cá nhân, hiển thị lời bài hát đồng bộ theo thời gian và chạy nền mượt mà.',
    techs: ['Web Audio API', 'React', 'Tailwind CSS', 'State Management'],
    level: CourseLevel.INTERMEDIATE,
    price: 249000,
    oldPrice: 350000
  },
  {
    title: 'Xây Dựng Nền Tảng Tìm Kiếm Việc Làm IT Với Lọc Đa Tiêu Chí',
    slug: 'xay-dung-nen-tang-tim-kiem-viec-lam-it-voi-loc-da-tieu-chi',
    desc: 'Tính năng thiết thực: ứng tuyển CV trực tuyến, lọc theo mức lương, vị trí địa lý, kỹ năng và gửi thông báo việc làm mới.',
    techs: ['Next.js', 'PostgreSQL Search', 'Prisma', 'Tailwind CSS'],
    level: CourseLevel.INTERMEDIATE,
    price: 349000,
    oldPrice: 499000
  },
  {
    title: 'Xây Dựng Bảng Điều Khiển Tài Chính Cá Nhân và Theo Dõi Chi Tiêu',
    slug: 'xay-dung-bang-dieu-khien-tai-chinh-ca-nhan-va-theo-doi-chi-tieu',
    desc: 'Giúp người dùng kiểm soát dòng tiền: phân loại chi phí, biểu đồ thu chi hàng tháng, dự báo ngân sách và sao lưu dữ liệu.',
    techs: ['React', 'Recharts', 'Prisma', 'Financial Analytics'],
    level: CourseLevel.BEGINNER,
    price: 199000,
    oldPrice: 299000
  },
  {
    title: 'Xây Dựng Ứng Dụng Khảo Sát và Trắc Nghiệm Tương Tác Cao Cấp',
    slug: 'xay-dung-ung-dung-khao-sat-va-trac-nghiem-tuong-tac-cao-cap',
    desc: 'Tự động chấm điểm, phân tích ma trận đáp án, xuất biểu đồ báo cáo và chống gian lận thời gian làm bài thi trực tuyến.',
    techs: ['Next.js', 'TypeScript', 'Zod', 'PostgreSQL'],
    level: CourseLevel.INTERMEDIATE,
    price: 249000,
    oldPrice: 350000
  },
  {
    title: 'Xây Dựng Nền Tảng Đăng Tin Bất Động Sản Với Bản Đồ Tương Tác Mapbox',
    slug: 'xay-dung-nen-tang-dang-tin-bat-dong-san-voi-mapbox',
    desc: 'Tích hợp bản đồ số: tìm kiếm nhà đất theo bán kính, ghim vị trí, hiển thị tiện ích xung quanh và album ảnh 360 độ.',
    techs: ['Mapbox GL', 'React', 'Geocoding API', 'PostGIS'],
    level: CourseLevel.ADVANCED,
    price: 599000,
    oldPrice: 850000
  },
  {
    title: 'Xây Dựng Hệ Thống Bán Vé Sự Kiện Trực Tuyến và Quét Vé Mã QR',
    slug: 'xay-dung-he-thong-ban-ve-su-kien-truc-tuyen-va-quet-ve-ma-qr',
    desc: 'Khóa học trọn gói: chọn chỗ ngồi sơ đồ rạp, sinh vé mã QR độc nhất, ứng dụng di động quét vé check-in tại cổng sự kiện.',
    techs: ['QR Code Generator', 'React', 'Mobile Camera Check-in', 'PostgreSQL'],
    level: CourseLevel.INTERMEDIATE,
    price: 449000,
    oldPrice: 620000
  },
  {
    title: 'Xây Dựng Hệ Thống Helpdesk và Quản Lý Yêu Cầu Hỗ Trợ Khách Hàng',
    slug: 'xay-dung-he-thong-helpdesk-va-quan-ly-yeu-cau-ho-tro',
    desc: 'Tổ chức dịch vụ khách hàng chuyên nghiệp: phân luồng ticket theo mức độ khẩn cấp, SLA tự động và gửi phản hồi đa kênh.',
    techs: ['Fullstack App', 'Ticket Workflow', 'Email Ingestion', 'PostgreSQL'],
    level: CourseLevel.INTERMEDIATE,
    price: 349000,
    oldPrice: 480000
  },

  // 76-90: Tooling, Architecture & Advanced Web
  {
    title: 'Làm Chủ Git và GitHub Chuyên Sâu Cho Lập Trình Viên Web',
    slug: 'lam-chu-git-va-github-chuyen-sau-cho-lap-trinh-vien-web',
    desc: 'Không bao giờ sợ mất mã nguồn hay xung đột code: rebase, cherry-pick, bisect, squash commits và quy trình Git Flow chuẩn.',
    techs: ['Git', 'GitHub', 'Git Flow', 'Merge Conflict Resolution'],
    level: CourseLevel.BEGINNER,
    price: 0,
    oldPrice: 0
  },
  {
    title: 'Xây Dựng Pipeline CI/CD Tự Động Với GitHub Actions Cho Ứng Dụng Web',
    slug: 'xay-dung-pipeline-ci-cd-tu-dong-voi-github-actions',
    desc: 'Tự động hóa mọi bước: chạy linter, kiểm thử tự động, build dự án và deploy an toàn lên môi trường production chỉ với 1 lệnh git push.',
    techs: ['GitHub Actions', 'CI/CD', 'Automated Testing', 'Deployment'],
    level: CourseLevel.INTERMEDIATE,
    price: 299000,
    oldPrice: 420000
  },
  {
    title: 'Docker Từ Số 0 Đến Thực Chiến Dành Riêng Cho Web Developers',
    slug: 'docker-tu-so-0-den-thuc-chien-danh-cho-web-developers',
    desc: 'Đóng gói môi trường hoàn hảo: Dockerfile đa tầng (multi-stage builds), Docker Compose thiết lập Fullstack gồm Node, DB và Redis.',
    techs: ['Docker', 'Docker Compose', 'Containerization', 'DevOps Basics'],
    level: CourseLevel.BEGINNER,
    price: 249000,
    oldPrice: 350000
  },
  {
    title: 'Làm Chủ Vite và Hệ Thống Build Công Cụ Frontend Hiện Đại',
    slug: 'lam-chu-vite-va-he-thong-build-cong-cu-frontend-hien-dai',
    desc: 'Hiểu rõ rollup plugins, esbuild, hot module replacement (HMR) và tự tay cấu hình build dự án frontend nhanh như chớp.',
    techs: ['Vite', 'Rollup', 'Esbuild', 'Build Optimization'],
    level: CourseLevel.INTERMEDIATE,
    price: 199000,
    oldPrice: 280000
  },
  {
    title: 'Kiểm Thử Toàn Diện (End-to-End E2E) Ứng Dụng Web Với Playwright',
    slug: 'kiem-thu-toan-dien-ung-dung-web-voi-playwright',
    desc: 'Công cụ test hiện đại nhất: tự động hóa trình duyệt Chromium, Firefox, WebKit, ghi hình màn hình lỗi và báo cáo test trực quan.',
    techs: ['Playwright', 'E2E Testing', 'Browser Automation', 'CI Test'],
    level: CourseLevel.INTERMEDIATE,
    price: 349000,
    oldPrice: 499000
  },
  {
    title: 'Kiểm Thử Tự Động Giao Diện Web Với Cypress Toàn Tập',
    slug: 'kiem-thu-tu-dong-giao-dien-web-voi-cypress-toan-tap',
    desc: 'Viết test nhanh và trực quan: time-travel debugging, chụp ảnh màn hình tự động, test network API request và component test.',
    techs: ['Cypress', 'Integration Testing', 'JavaScript', 'QA Automation'],
    level: CourseLevel.BEGINNER,
    price: 249000,
    oldPrice: 350000
  },
  {
    title: 'Triển Khai và Vận Hành Web Server NGINX Chuyên Nghiệp',
    slug: 'trien-khai-va-van-hanh-web-server-nginx-chuyen-nghiep',
    desc: 'Cấu hình tối ưu từ A-Z: chứng chỉ SSL miễn phí Let’s Encrypt, nén gzip/brotli, bảo vệ DDoS cơ bản và cân bằng tải.',
    techs: ['NGINX', 'SSL/TLS', 'Linux Ubuntu', 'Web Hosting'],
    level: CourseLevel.INTERMEDIATE,
    price: 299000,
    oldPrice: 420000
  },
  {
    title: 'Giám Sát Lỗi Ứng Dụng Web Theo Thời Gian Thực Với Sentry và Datadog',
    slug: 'giam-sat-loi-ung-dung-web-voi-sentry-va-datadog',
    desc: 'Phát hiện lỗi trước cả khi khách hàng báo cáo: source maps production, distributed tracing, đo lường độ trễ API và cảnh báo Slack.',
    techs: ['Sentry', 'Datadog', 'Monitoring', 'Error Tracking'],
    level: CourseLevel.INTERMEDIATE,
    price: 349000,
    oldPrice: 499000
  },
  {
    title: 'Xây Dựng Chrome Extension Chuyên Nghiệp Với React và Manifest V3',
    slug: 'xay-dung-chrome-extension-chuyen-nghiep-voi-react',
    desc: 'Biến trình duyệt thành trợ thủ đắc lực: can thiệp DOM trang web, background service worker, lưu trữ dữ liệu và phát hành lên Chrome Web Store.',
    techs: ['Chrome Extension API', 'Manifest V3', 'React', 'Browser Tooling'],
    level: CourseLevel.INTERMEDIATE,
    price: 249000,
    oldPrice: 350000
  },
  {
    title: 'Monorepo Kiến Trúc Cho Dự Án Lớn Với Turborepo và pnpm',
    slug: 'monorepo-kien-truc-cho-du-an-lon-voi-turborepo-va-pnpm',
    desc: 'Chia sẻ code tối ưu giữa Web, Mobile và Backend: quản lý gói phụ thuộc siêu tốc với pnpm workspaces và cache build với Turborepo.',
    techs: ['Turborepo', 'pnpm', 'Monorepo', 'Code Sharing'],
    level: CourseLevel.ADVANCED,
    price: 499000,
    oldPrice: 699000
  },
  {
    title: 'Lập Trình Web Assembly (Wasm): Đưa Hiệu Năng C/C++ và Rust Lên Trình Duyệt',
    slug: 'lap-trinh-web-assembly-wasm-hieu-nang-cao',
    desc: 'Bứt phá giới hạn tốc độ của JavaScript: xử lý hình ảnh, video và tính toán khoa học nặng trực tiếp trên trình duyệt ở tốc độ gần như bản xứ.',
    techs: ['WebAssembly', 'Rust', 'Wasm-pack', 'Browser Performance'],
    level: CourseLevel.ADVANCED,
    price: 549000,
    oldPrice: 799000
  },
  {
    title: 'Quản Lý Cấu Hình và Biến Môi Trường Bảo Mật Trong Ứng Dụng Web',
    slug: 'quan-ly-cau-hinh-va-bien-moi-truong-bao-mat',
    desc: 'Tránh lộ lọt bí mật bảo mật: dotenv vault, HashiCorp Vault, AWS Secrets Manager và chuẩn hóa biến môi trường bằng Zod.',
    techs: ['Secrets Management', 'Zod', 'Environment Config', 'Security'],
    level: CourseLevel.BEGINNER,
    price: 99000,
    oldPrice: 150000
  },
  {
    title: 'Thực Hành Tái Cấu Trúc Mã Nguồn Frontend (Refactoring Clean Code)',
    slug: 'thuc-hanh-tai-cau-truc-ma-nguon-frontend-clean-code',
    desc: 'Chuyển hóa mã nguồn rối rắm thành kiệt tác dễ bảo trì: nhận diện code smells, áp dụng SOLID principles và test an toàn khi sửa code.',
    techs: ['Clean Code', 'Refactoring', 'SOLID Principles', 'Maintainability'],
    level: CourseLevel.INTERMEDIATE,
    price: 299000,
    oldPrice: 420000
  },
  {
    title: 'Xây Dựng CLI Tool Hỗ Trợ Đội Ngũ Phát Triển Web Bằng Node.js',
    slug: 'xay-dung-cli-tool-ho-tro-doi-ngu-web-bang-node-js',
    desc: 'Tự động hóa các tác vụ lặp đi lặp lại: sinh template mã nguồn, kiểm tra chuẩn commit, tương tác dòng lệnh đẹp mắt với Commander và Inquirer.',
    techs: ['CLI Development', 'Node.js', 'Commander.js', 'Developer Productivity'],
    level: CourseLevel.BEGINNER,
    price: 149000,
    oldPrice: 220000
  },
  {
    title: 'Bí Quyết Phỏng Vấn Frontend Chuyên Nghiệp: 100 Câu Hỏi Thường Gặp',
    slug: 'bi-quyet-phong-van-frontend-chuyen-nghiep-100-cau-hoi',
    desc: 'Chuẩn bị hành trang chinh phục vị trí Middle/Senior: giải mã cơ chế JavaScript nội tại, Event Loop, prototype, closure và live coding thực tế.',
    techs: ['JavaScript Internals', 'Interview Prep', 'System Design UI', 'Career'],
    level: CourseLevel.INTERMEDIATE,
    price: 199000,
    oldPrice: 350000
  }
]
