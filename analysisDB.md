Dưới đây là bản phân tích toàn diện và chuyên sâu về hiện trạng backend của hệ thống E-learning, bóc tách toàn bộ 19 Mongoose models, quan hệ thực thể, điểm nghẽn kiến trúc và đề xuất thiết kế cơ sở dữ liệu quan hệ cho PostgreSQL.

PHẦN I: PHÂN TÍCH TOÀN BỘ BACKEND HIỆN TẠI
1. Tìm tất cả Mongoose Schema / Model
Qua rà soát toàn bộ thư mục 

src/models
, hệ thống hiện tại có 19 Mongoose Model:

STT	Model Name	File Path	Mục đích chính
1	User	

user.model.ts
Tài khoản người dùng (Admin, Teacher, Student)
2	Category	

category.model.ts
Danh mục khóa học
3	Course	

course.model.ts
Khóa học
4	Chapter	

chapter.model.ts
Chương học trong khóa học
5	Lesson	

lesson.model.ts
Bài học (Video / Text)
6	Quiz	

quiz.model.ts
Bài kiểm tra đính kèm bài học
7	Question	

question.model.ts
Câu hỏi trong bài kiểm tra
8	QuizSubmission	

quizSubmission.model.ts
Lịch sử nộp bài quiz của học viên
9	Order	

order.model.ts
Đơn hàng mua khóa học
10	Coupon	

coupon.model.ts
Mã giảm giá
11	Enrollment	

enrollment.model.ts
Ghi danh học viên vào khóa học
12	Progress	

progress.model.ts
Tiến độ học từng bài học
13	Certificate	

certificate.model.ts
Chứng chỉ hoàn thành khóa học
14	Rating	

rating.model.ts
Đánh giá & nhận xét sao cho khóa học
15	Comment	

comment.model.ts
Bình luận bài học (có phân cấp reply, like/dislike)
16	FavoriteCourse	

favoriteCourse.model.ts
Khóa học yêu thích
17	Conversation	

conversation.model.ts
Cuộc trò chuyện (1-1 hoặc nhóm Q&A khóa học)
18	Message	

message.model.ts
Tin nhắn trong cuộc trò chuyện
19	Notification	

notification.model.ts
Thông báo người dùng
NOTE

Về chức năng "Cart" (Giỏ hàng): Trong codebase hiện tại chưa có CartModel. Luồng thanh toán hiện hành đang là Direct Checkout (POST /api/orders với courseId và couponCode). Người dùng có thể lưu khóa học vào danh sách quan tâm qua FavoriteCourse. Nếu nghiệp vụ yêu cầu bổ sung giỏ hàng nhiều món (Cart & CartItems), sẽ được thiết kế sẵn trong lược đồ quan hệ PostgreSQL ở Phần II.

2. Liệt kê toàn bộ Entity & Thuộc tính chi tiết
User: _id, username, email, password, status, role, avatar, phone, bio, socialLinks, isVerified, otp_code, otp_expires, refresh_token, reset_password_token, reset_password_expires, courses[], favorites[].
Category: _id, name, slug, description, created_by, _destroy.
Course: _id, title, slug, image, intro_url, description, price, old_price, type, status, level, view, sold, category, author, chapters[], rating[], info (requirements, benefits, techniques, documents, qa), _destroy.
Chapter: _id, title, course, order, lessons[], _destroy.
Lesson: _id, title, slug, chapter, course, author, order, duration, type, content, isDemo, videoUrl.
Quiz: _id, title, description, duration, passing_grade, lesson, courseId, created_by, questions[].
Question: _id, quiz, type, title, options[], answer, points.
QuizSubmission: _id, quiz, user, score, totalPoints, percentage, completedAt, answers[] (question, selectedAnswer).
Order: _id, code, amount, discount, total, coupon, course, user, status.
Coupon: _id, title, code, type, value, limit, used, startDate, endDate, active, author, courses[].
Enrollment: _id, user, course, progress, status, enrolledAt, completedAt.
Progress: _id, user, course, lesson, completed.
Certificate: _id, user, course, grade, issuedAt, certificateUrl.
Rating: _id, user, course, rate, content, status.
Comment: _id, content, lesson, course, user, parentId, level, status, likes[], dislikes[].
FavoriteCourse: _id, user, course.
Conversation: _id, participants[], isGroup, name, course, lastMessage.
Message: _id, conversation, sender, content, type, isEdited, readBy[].
Notification: _id, sender, receiver, type, message, relatedId, read.
3 & 4. Phân tích quan hệ giữa các Entity (1-1, 1-N, N-N)
Quan hệ 1 - 1 (hoặc 1 - 0..1)
Lesson - Quiz:
Nghiệp vụ trong 

quiz.service.ts
 kiểm tra: const existingQuiz = await QuizModel.findOne({ lesson: lessonDoc._id }). Mỗi bài học chỉ gắn tối đa 1 bài quiz.
User - Course - Certificate:


certificate.service.ts
: Mỗi học viên chỉ nhận tối đa 1 chứng chỉ cho mỗi khóa học (findOne({ user, course })).
User - Course - Rating:


rating.model.ts
: Index duy nhất { user: 1, course: 1 } (unique). Mỗi học viên chỉ đánh giá 1 lần trên mỗi khóa học.
User - Course - Enrollment:
Mỗi cặp (user, course) là duy nhất đại diện cho trạng thái ghi danh học tập.
User - Course - Favorite:


favoriteCourse.model.ts
: Index duy nhất { user: 1, course: 1 }.
User - Lesson - Progress:


progress.service.ts
: findOneAndUpdate({ user, course, lesson }) duy nhất theo cặp (user, lesson).
Quiz - User - QuizSubmission:


quizSubmission.service.ts
: Mỗi học viên chỉ được nộp bài 1 lần cho mỗi quiz (findOne({ quiz, user })).
Quan hệ 1 - N
Category (1) -> Courses (N): Một danh mục có nhiều khóa học.
User [Teacher] (1) -> Courses (N): Một giảng viên sở hữu nhiều khóa học.
Course (1) -> Chapters (N): Một khóa học có nhiều chương học (sắp xếp theo order).
Chapter (1) -> Lessons (N): Một chương có nhiều bài học (sắp xếp theo order).
Quiz (1) -> Questions (N): Một bài quiz có nhiều câu hỏi.
User (1) -> Orders (N): Một user có thể tạo nhiều đơn hàng.
Course (1) -> Orders (N): Một khóa học phát sinh nhiều đơn hàng mua.
Coupon (1) -> Orders (N): Một coupon có thể áp dụng cho nhiều đơn hàng.
User [Teacher/Admin] (1) -> Coupons (N): Người tạo mã coupon.
Lesson (1) -> Comments (N): Bài học có nhiều bình luận.
User (1) -> Comments (N): Người dùng đăng nhiều bình luận.
Comment (Parent) (1) -> Comments (Children) (N): Quan hệ cây đệ quy (parentId trỏ ngược lại Comment).
Conversation (1) -> Messages (N): Một cuộc trò chuyện có nhiều tin nhắn.
User (1) -> Messages (N): Người gửi tin nhắn.
User (1) -> Notifications (N): Người nhận thông báo (receiver).
Quan hệ N - N
Coupon <-> Course:
MongoDB đang dùng: coupon.courses = [ObjectId] trong 

coupon.model.ts
.
SQL: Cần bảng trung gian coupon_courses (coupon_id, course_id).
Conversation <-> User:
MongoDB đang dùng: conversation.participants = [ObjectId] trong 

conversation.model.ts
.
SQL: Cần bảng trung gian conversation_participants (conversation_id, user_id).
Comment <-> User (Likes & Dislikes):
MongoDB đang dùng: comment.likes = [ObjectId], comment.dislikes = [ObjectId] trong 

comment.model.ts
.
SQL: Cần bảng trung gian comment_reactions (comment_id, user_id, reaction_type).
Message <-> User (Read Receipt):
MongoDB đang dùng: message.readBy = [ObjectId] trong 

message.model.ts
.
SQL: Cần bảng message_reads (message_id, user_id, read_at) hoặc theo dõi last_read_message_id trên conversation_participants.
5. Xác định các trường chứa ObjectId / Reference
Model	Trường chứa ObjectId	Tham chiếu tới Model	Ý nghĩa
Category	created_by	User	Admin tạo danh mục
Course	category	Category	Danh mục khóa học
author	User	Giảng viên tạo khóa học
chapters[]	Chapter	Danh sách ID các chương (Redundant Mongo)
rating[]	Rating	Danh sách ID đánh giá (Redundant Mongo)
Chapter	course	Course	Khóa học cha
lessons[]	Lesson	Danh sách ID các bài học (Redundant Mongo)
Lesson	chapter	Chapter	Chương học cha
course	Course	Khóa học cha
author	User	Giảng viên tạo bài học
Quiz	lesson	Lesson	Bài học gắn kèm
courseId	Course	Khóa học cha
created_by	User	Giảng viên/Admin tạo quiz
questions[]	Question	Danh sách ID câu hỏi (Redundant Mongo)
Question	quiz	Quiz	Quiz cha
QuizSubmission	quiz	Quiz	Quiz được nộp
user	User	Học viên nộp bài
answers[].question	Question	Câu hỏi được trả lời
Order	coupon	Coupon (nullable)	Mã giảm giá áp dụng
course	Course	Khóa học được mua
user	User	Người mua
Coupon	author	User	Người tạo mã
courses[]	Course	Các khóa học được áp mã
Enrollment	user	User	Học viên
course	Course	Khóa học đã tham gia
Progress	user	User	Học viên
course	Course	Khóa học
lesson	Lesson	Bài học
Certificate	user	User	Học viên nhận chứng chỉ
course	Course	Khóa học cấp chứng chỉ
Rating	user	User	Người đánh giá
course	Course	Khóa học được đánh giá
Comment	user	User	Tác giả bình luận
course	Course	Khóa học
lesson	Lesson	Bài học
parentId	Comment (nullable)	Bình luận cha
likes[]	User	Những người like
dislikes[]	User	Những người dislike
Conversation	participants[]	User	Thành viên tham gia
course	Course (nullable)	Khóa học (nếu là nhóm Q&A)
lastMessage	Message (nullable)	Tin nhắn mới nhất
Message	conversation	Conversation	Cuộc trò chuyện
sender	User	Người gửi
readBy[]	User	Danh sách người đã đọc
Notification	sender	User (nullable)	Người gửi (null nếu từ system)
receiver	User	Người nhận
relatedId	Polymorphic (ID)	ID liên quan (Course, Lesson, Quiz,...)
User	courses[]	Course	Cache khóa học đã mua (Redundant Mongo)
favorites[]	Course	Cache khóa học yêu thích (Trùng với FavoriteCourse)
6. Các Array / Object Embedded trong MongoDB cần chuẩn hóa sang SQL
Trong MongoDB, có nhiều cấu trúc phi chuẩn hóa (denormalization) cần loại bỏ hoặc chuyển hóa thành bảng riêng trong cơ sở dữ liệu quan hệ:

Course.info (Embedded Document):
Gồm các mảng requirements: string[], benefits: string[], techniques: string[], documents: string[], và qa: [{ question, answer }].
Giải pháp SQL:
qa (Hỏi đáp FAQ của khóa học): Chuẩn hóa thành bảng course_faqs (id, course_id, question, answer, order).
requirements, benefits, techniques, documents: Có thể lưu dưới dạng cột kiểu TEXT[] của PostgreSQL hoặc kiểu JSONB nếu không cần truy vấn/join độc lập; hoặc chuẩn hóa thành bảng course_highlights (course_id, type, content).
QuizSubmission.answers (Array of Subdocuments):
{ question: ObjectId, selectedAnswer: Mixed }
Giải pháp SQL: Bắt buộc chuẩn hóa thành bảng quiz_submission_answers (id, submission_id, question_id, selected_answer, is_correct).
Question.options (Array of Strings):
options: string[]
Giải pháp SQL: Để hỗ trợ mở rộng, xáo trộn câu trả lời và tính điểm tự động, nên chuẩn hóa thành bảng question_options (id, question_id, option_text, is_correct) hoặc dùng JSONB / TEXT[] trong PostgreSQL.
User.socialLinks (Embedded Object):
{ facebook, instagram, github }
Giải pháp SQL: Trực tiếp flatten thành các cột social_facebook, social_instagram, social_github trên bảng users (hoặc 1 cột JSONB).
Các mảng chứa Foreign Key 2 chiều (Bidirectional arrays):
Course.chapters, Chapter.lessons, Quiz.questions, Course.rating, User.courses, User.favorites.
Giải pháp SQL: Loại bỏ hoàn toàn các mảng này. Mối quan hệ được duy trì duy nhất bằng Foreign Key ở bảng con (ví dụ: chapters.course_id, lessons.chapter_id, questions.quiz_id, ratings.course_id).
Các mảng N-N:
Coupon.courses -> Bảng coupon_courses.
Conversation.participants -> Bảng conversation_participants.
Comment.likes, Comment.dislikes -> Bảng comment_reactions.
Message.readBy -> Bảng message_reads.
7. Phân tích các API phụ thuộc trực tiếp vào Mongoose
Toàn bộ 15 Service Files trong src/services/ đều phụ thuộc trực tiếp vào API của Mongoose:

Truy vấn Mongoose thuần (Query Methods):
Model.find(), findOne(), findById(), create(), countDocuments(), exists(), findByIdAndUpdate(), findOneAndUpdate(), deleteOne(), deleteMany().
Cơ chế nạp quan hệ (.populate()):
Điển hình là lồng ghép đa tầng trong 

course.service.ts
: .populate({ path: 'chapters', populate: { path: 'lessons' } })


comment.service.ts
: .populate('user', 'username avatar').
Toán tử cập nhật nguyên tử của MongoDB (Mongo Operators):
$inc: Tăng view (course.view), số lượng bán (course.sold), coupon used (coupon.used).
$addToSet / $push: Thêm ID vào mảng (user.courses.push, course.chapters.push).
$pull: Xóa ID khỏi mảng ($pull: { lessons: lesson._id }, $pull: { questions: ... }).
$or, $regex: Tìm kiếm chuỗi ký tự theo pattern không phân biệt hoa thường ($options: 'i').
$in, $all: Tìm kiếm trong mảng.
Xác thực ObjectId:
Gọi Types.ObjectId.isValid(id) và new Types.ObjectId(id) ở tất cả các service kiểm tra đầu vào.
Middleware xác thực đầu vào (Express-validator):
Hơn 15 file validator trong 

src/middlewares
 đang dùng .isMongoId().
Cron job:


deleteUnverifiedUsers.ts
 dùng UserModel.deleteMany({ isVerified: { $ne: '' }, createdAt: { $lt: expireTime } }).
8. Phân tích các thành phần có thể giữ nguyên Business Logic
Cấu trúc dự án hiện tại tách lớp (Layered Architecture: Routes -> Middlewares -> Controllers -> Services) tương đối rõ ràng. Nhờ vậy, có nhiều thành phần hoàn toàn có thể tái sử dụng:

Toàn bộ tầng Controller (21 file trong src/controller):
Controllers không chứa bất kỳ câu lệnh Mongoose hay logic DB nào. Chỉ nhận req, trích xuất tham số, gọi Service và trả về res.status().json().
Tầng Định tuyến (Routes):
Toàn bộ URL paths, HTTP Methods, thứ tự middleware pipeline trong 

src/routes
 giữ nguyên 100%.
Logic Xác thực & Phân quyền (Auth & JWT):
verifyAccessToken, verifyRefreshToken, verifyRole trong 

src/middlewares/verifyToken.ts
 và 

src/middlewares/verifyRole.ts
.
Cơ chế băm mật khẩu bcrypt.hash() / bcrypt.compare().
Thuật toán băm SHA256 cho refresh token và reset password token (hashToken trong 

ultis.ts
).
Công thức tính toán nghiệp vụ (Domain Business Rules):
Coupon: Logic kiểm tra hạn sử dụng startDate <= now <= endDate, kiểm tra used < limit, tính tiền giảm giá theo phần trăm (price * value) / 100 hoặc số tiền cố định trong 

coupon.service.ts
.
Quiz & Grading: Thuật toán so khớp câu trả lời, tính tổng điểm đạt được / tổng điểm tối đa, phần trăm hoàn thành trong 

quizSubmission.service.ts
.
Certificate: Điều kiện cấp chứng chỉ (progress >= 70%, quizCompletionPercentage >= 60%, finalScore >= 50%) trong 

certificate.service.ts
.
Course Progress: Công thức round((completedLessons / totalLessons) * 100).
Tiện ích tích hợp bên ngoài (Third-party integrations):
Sinh file PDF chứng chỉ bằng PDFKit và tải lên Cloudinary trong 

pdfGenerator.ts
.
Gửi email kích hoạt / đổi mật khẩu bằng Nodemailer trong 

nodeMailer.ts
.
Hạ tầng realtime WebRTC signaling và Socket.IO room events trong 

initSocket.ts
.
9. Các điểm có nguy cơ rủi ro cao khi Migrate (Gotchas & Risks)
Xung đột kiểu dữ liệu do Dynamic Typing của MongoDB (Điểm nguy hiểm nhất):
Xem trường isVerified trong User:
Lúc đăng ký (

user.service.ts
): isVerified: false (kiểu Boolean).
Lúc admin tạo Teacher (

admin.service.ts
): isVerified: '' (kiểu String rỗng).
Truy vấn lấy danh sách giáo viên (

user.service.ts
): filter = { isVerified: '' }.
Cron job xóa user chưa xác thực (

deleteUnverifiedUsers.ts
): { isVerified: { $ne: '' } }.
Rủi ro: PostgreSQL là hệ quản trị dữ liệu chặt chẽ (Strong Typing). Cột is_verified bắt buộc phải là BOOLEAN (TRUE hoặc FALSE). Không thể lưu chuỗi rỗng ''. Logic của cron job và getListTeachers cần được chuẩn hóa lại đồng bộ.
Thiếu Database Transactions ở MongoDB:
Tại các luồng phức tạp như 

order.service.ts
 (updateOrderStatusService), hệ thống đang gọi đồng thời UserModel.findByIdAndUpdate, CourseModel.findByIdAndUpdate, EnrollmentModel.findOneAndUpdate, CouponModel.findByIdAndUpdate bằng Promise.all.
Nếu 1 tác vụ thất bại giữa chừng, dữ liệu sẽ bị bất đồng bộ nghiêm trọng (Inconsistent State).
Khi sang PostgreSQL/Prisma: Bắt buộc phải gom toàn bộ các luồng này vào khối prisma.$transaction([...]).
Mô hình Khóa chính (Primary Key - PK):
MongoDB dùng chuỗi 24 ký tự hex (ObjectId). Toàn bộ client và middleware hiện tại đang kiểm tra .isMongoId().
Khuyến nghị sử dụng UUID (v4 hoặc v7) hoặc CUID cho PostgreSQL. Cần cập nhật các middleware validator từ .isMongoId() sang .isUUID().
Phân trang lồng nhau bị lỗi trong Mongoose (Bug hiện hữu được khắc phục nhờ SQL):
Trong 

enrollment.service.ts
 (getStudentsByCourseService), code hiện tại tìm kiếm học viên bằng cách populate user với match điều kiện search, sau đó dùng Javascript .filter(e => e.user). Điều này dẫn đến phân trang (page, limit, total) bị sai lệch nếu có bản ghi user không khớp.
Khi chuyển sang PostgreSQL, câu lệnh JOIN users kết hợp WHERE users.username ILIKE ... sẽ giải quyết dứt điểm lỗi này với hiệu năng cao hơn gấp nhiều lần.
Trường đa hình (Polymorphic Reference) ở Notification:
Notification.relatedId hiện có thể trỏ tới bất kỳ Entity nào (Course, Lesson, Comment, Order, Quiz). Trong SQL, khóa ngoại (FK) yêu cầu trỏ đến một bảng cụ thể. Cần quyết định: giữ related_id dạng UUID/String không tạo Foreign Key ràng buộc toàn vẹn, hoặc tách thành các trường FK riêng biệt (course_id, order_id,...).
Lỗi tìm kiếm quan hệ ảo trong Mongoose:
Trong 

order.service.ts
 và 

comment.service.ts
, code đang viết: filter.$or = [{ 'course.title': { $regex: search } }, { 'user.username': { $regex: search } }] Trong MongoDB thuần, query trên field của bảng liên kết khi không aggregate sẽ không hoạt động. Sang PostgreSQL, Prisma quan hệ hỗ trợ where: { course: { title: { contains: search, mode: 'insensitive' } } } tự nhiên và chuẩn xác.
PHẦN II: ĐỀ XUẤT RELATIONAL DATABASE DESIGN (POSTGRESQL)
Thiết kế cơ sở dữ liệu quan hệ được chuẩn hóa theo dạng chuẩn 3NF (Third Normal Form), thiết lập các ràng buộc toàn vẹn khóa ngoại (Foreign Keys), Unique Constraints, và bộ chỉ mục (Indexes) nhằm đảm bảo hiệu năng cao nhất.

1. Sơ đồ Thực thể Quan hệ (Mermaid ERD)
mermaid
erDiagram
    users ||--o{ courses : "authors"
    users ||--o{ categories : "creates"
    users ||--o{ orders : "places"
    users ||--o{ enrollments : "has"
    users ||--o{ progress : "tracks"
    users ||--o{ quiz_submissions : "submits"
    users ||--o{ certificates : "earns"
    users ||--o{ ratings : "gives"
    users ||--o{ comments : "writes"
    users ||--o{ comment_reactions : "reacts"
    users ||--o{ favorite_courses : "favorites"
    users ||--o{ conversation_participants : "joins"
    users ||--o{ messages : "sends"
    users ||--o{ notifications : "receives"
    users ||--o{ coupons : "creates"
    categories ||--o{ courses : "contains"
    
    courses ||--o{ chapters : "has"
    courses ||--o{ orders : "ordered_in"
    courses ||--o{ enrollments : "enrolled_in"
    courses ||--o{ progress : "includes"
    courses ||--o{ certificates : "issues"
    courses ||--o{ ratings : "reviewed_in"
    courses ||--o{ comments : "commented_in"
    courses ||--o{ favorite_courses : "favorited_in"
    courses ||--o{ coupon_courses : "discounted_by"
    courses ||--o{ course_faqs : "has"
    chapters ||--o{ lessons : "contains"
    
    lessons ||--o| quizzes : "has_one"
    lessons ||--o{ progress : "tracked_in"
    lessons ||--o{ comments : "discussed_in"
    quizzes ||--o{ questions : "contains"
    quizzes ||--o{ quiz_submissions : "attempted_in"
    questions ||--o{ question_options : "has"
    questions ||--o{ quiz_submission_answers : "answered_in"
    quiz_submissions ||--o{ quiz_submission_answers : "contains"
    coupons ||--o{ coupon_courses : "applies_to"
    coupons ||--o{ orders : "used_in"
    comments ||--o{ comments : "replies_to"
    comments ||--o{ comment_reactions : "receives"
    conversations ||--o{ conversation_participants : "includes"
    conversations ||--o{ messages : "contains"
2. Chi tiết các bảng dữ liệu (Table Schemas)
Nhóm 1: Người dùng & Xác thực (Auth & Users)
Bảng users
Lưu trữ thông tin người dùng, học viên, giảng viên và admin.

id: UUID (PK, Default: gen_random_uuid())
username: VARCHAR(100) (NOT NULL)
email: VARCHAR(255) (UNIQUE, NOT NULL)
password: VARCHAR(255) (NOT NULL)
role: VARCHAR(20) (NOT NULL, Default: 'user', Enum: 'admin', 'teacher', 'user')
status: VARCHAR(20) (NOT NULL, Default: 'active', Enum: 'active', 'inactive')
avatar: TEXT (Default: '')
phone: VARCHAR(30) (Nullable)
bio: TEXT (Nullable)
social_facebook: TEXT (Default: '')
social_instagram: TEXT (Default: '')
social_github: TEXT (Default: '')
is_verified: BOOLEAN (NOT NULL, Default: false) (Chuẩn hóa từ Mongo dynamic string/boolean)
otp_code: VARCHAR(255) (Nullable)
otp_expires: TIMESTAMPTZ (Nullable)
refresh_token: TEXT (Nullable)
reset_password_token: TEXT (Nullable)
reset_password_expires: TIMESTAMPTZ (Nullable)
created_at: TIMESTAMPTZ (Default: NOW())
updated_at: TIMESTAMPTZ (Default: NOW())
Indexes: idx_users_email (UNIQUE), idx_users_role, idx_users_is_verified
Nhóm 2: Khóa học, Danh mục & Nội dung (Courses, Chapters, Lessons)
Bảng categories
id: UUID (PK)
name: VARCHAR(200) (UNIQUE, NOT NULL)
slug: VARCHAR(250) (UNIQUE, NOT NULL)
description: TEXT (Nullable)
created_by_id: UUID (FK -> users.id, Nullable, ON DELETE SET NULL)
is_destroyed: BOOLEAN (NOT NULL, Default: false)
created_at: TIMESTAMPTZ (Default: NOW())
updated_at: TIMESTAMPTZ (Default: NOW())
Bảng courses
id: UUID (PK)
title: VARCHAR(255) (NOT NULL)
slug: VARCHAR(255) (UNIQUE, NOT NULL)
image: TEXT (Default: '')
intro_url: TEXT (Default: '')
description: TEXT (Default: '')
price: DECIMAL(12, 2) (NOT NULL, Default: 0)
old_price: DECIMAL(12, 2) (NOT NULL, Default: 0)
type: VARCHAR(20) (NOT NULL, Default: 'paid', Enum: 'paid', 'free')
status: VARCHAR(20) (NOT NULL, Default: 'pending', Enum: 'approved', 'pending', 'rejected')
level: VARCHAR(20) (NOT NULL, Default: 'beginner', Enum: 'beginner', 'intermediate', 'advanced')
view: INT (NOT NULL, Default: 0)
sold: INT (NOT NULL, Default: 0)
requirements: TEXT[] (Mảng điều kiện tiên quyết, Default: '{}')
benefits: TEXT[] (Mảng lợi ích khóa học, Default: '{}')
techniques: TEXT[] (Mảng công nghệ tiếp cận, Default: '{}')
documents: TEXT[] (Tài liệu đi kèm, Default: '{}')
category_id: UUID (FK -> categories.id, Nullable, ON DELETE SET NULL)
author_id: UUID (FK -> users.id, NOT NULL, ON DELETE RESTRICT)
is_destroyed: BOOLEAN (NOT NULL, Default: false)
created_at: TIMESTAMPTZ (Default: NOW())
updated_at: TIMESTAMPTZ (Default: NOW())
Indexes: idx_courses_slug (UNIQUE), idx_courses_status_is_destroyed, idx_courses_author_id, idx_courses_category_id
Bảng course_faqs (Chuẩn hóa từ course.info.qa)
id: UUID (PK)
course_id: UUID (FK -> courses.id, NOT NULL, ON DELETE CASCADE)
question: TEXT (NOT NULL)
answer: TEXT (NOT NULL)
order: INT (NOT NULL, Default: 0)
created_at: TIMESTAMPTZ (Default: NOW())
Bảng chapters
id: UUID (PK)
title: VARCHAR(255) (NOT NULL)
course_id: UUID (FK -> courses.id, NOT NULL, ON DELETE CASCADE)
order: INT (NOT NULL, Default: 0)
is_destroyed: BOOLEAN (NOT NULL, Default: false)
created_at: TIMESTAMPTZ (Default: NOW())
updated_at: TIMESTAMPTZ (Default: NOW())
Indexes: idx_chapters_course_order (course_id, order)
Bảng lessons
id: UUID (PK)
title: VARCHAR(255) (NOT NULL)
slug: VARCHAR(255) (NOT NULL)
chapter_id: UUID (FK -> chapters.id, NOT NULL, ON DELETE CASCADE)
course_id: UUID (FK -> courses.id, NOT NULL, ON DELETE CASCADE)
author_id: UUID (FK -> users.id, NOT NULL, ON DELETE RESTRICT)
order: INT (NOT NULL, Default: 0)
duration: INT (NOT NULL, Default: 0) (thời lượng tính bằng giây hoặc phút)
type: VARCHAR(20) (NOT NULL, Default: 'video', Enum: 'video', 'text')
content: TEXT (Default: '')
is_demo: BOOLEAN (NOT NULL, Default: false)
video_url: TEXT (Default: '')
created_at: TIMESTAMPTZ (Default: NOW())
updated_at: TIMESTAMPTZ (Default: NOW())
Indexes: idx_lessons_chapter_order (chapter_id, order), idx_lessons_slug_course (slug, course_id, UNIQUE)
Nhóm 3: Đánh giá, Bình luận & Yêu thích (Social & Engagement)
Bảng ratings
id: UUID (PK)
rate: SMALLINT (NOT NULL, CHECK: rate >= 1 AND rate <= 5)
content: VARCHAR(255) (NOT NULL)
user_id: UUID (FK -> users.id, NOT NULL, ON DELETE CASCADE)
course_id: UUID (FK -> courses.id, NOT NULL, ON DELETE CASCADE)
status: VARCHAR(20) (NOT NULL, Default: 'active', Enum: 'active', 'inactive')
created_at: TIMESTAMPTZ (Default: NOW())
updated_at: TIMESTAMPTZ (Default: NOW())
Constraints: UNIQUE(user_id, course_id) (1 học viên chỉ đánh giá 1 lần)
Bảng comments
id: UUID (PK)
content: TEXT (NOT NULL)
lesson_id: UUID (FK -> lessons.id, NOT NULL, ON DELETE CASCADE)
course_id: UUID (FK -> courses.id, NOT NULL, ON DELETE CASCADE)
user_id: UUID (FK -> users.id, NOT NULL, ON DELETE CASCADE)
parent_id: UUID (FK -> comments.id, Nullable, ON DELETE CASCADE) (Self-referencing tree)
level: INT (NOT NULL, Default: 0)
status: VARCHAR(20) (NOT NULL, Default: 'approved', Enum: 'approved', 'pending', 'rejected')
created_at: TIMESTAMPTZ (Default: NOW())
updated_at: TIMESTAMPTZ (Default: NOW())
Indexes: idx_comments_lesson_status (lesson_id, status), idx_comments_parent_id
Bảng comment_reactions (Chuẩn hóa từ comment.likes và comment.dislikes)
id: UUID (PK)
comment_id: UUID (FK -> comments.id, NOT NULL, ON DELETE CASCADE)
user_id: UUID (FK -> users.id, NOT NULL, ON DELETE CASCADE)
type: VARCHAR(10) (NOT NULL, Enum: 'like', 'dislike')
created_at: TIMESTAMPTZ (Default: NOW())
Constraints: UNIQUE(comment_id, user_id) (1 người chỉ được react 1 trạng thái cho 1 comment)
Bảng favorite_courses
id: UUID (PK)
user_id: UUID (FK -> users.id, NOT NULL, ON DELETE CASCADE)
course_id: UUID (FK -> courses.id, NOT NULL, ON DELETE CASCADE)
created_at: TIMESTAMPTZ (Default: NOW())
Constraints: UNIQUE(user_id, course_id)
Nhóm 4: Bài kiểm tra & Chấm điểm (Quiz Engine)
Bảng quizzes
id: UUID (PK)
title: VARCHAR(255) (NOT NULL)
description: TEXT (Default: '')
duration: INT (Default: 0) (thời lượng làm bài tính bằng phút)
passing_grade: INT (Default: 0)
lesson_id: UUID (UNIQUE, FK -> lessons.id, NOT NULL, ON DELETE CASCADE) (Quan hệ 1-1 chặt chẽ)
course_id: UUID (FK -> courses.id, NOT NULL, ON DELETE CASCADE)
created_by_id: UUID (FK -> users.id, NOT NULL, ON DELETE RESTRICT)
created_at: TIMESTAMPTZ (Default: NOW())
updated_at: TIMESTAMPTZ (Default: NOW())
Bảng questions
id: UUID (PK)
quiz_id: UUID (FK -> quizzes.id, NOT NULL, ON DELETE CASCADE)
type: VARCHAR(30) (NOT NULL, Default: 'multiple_choice', Enum: 'multiple_choice', 'fill_in_blank')
title: TEXT (NOT NULL)
answer: TEXT (NOT NULL) (Đáp án chính xác)
points: INT (NOT NULL, Default: 1)
created_at: TIMESTAMPTZ (Default: NOW())
updated_at: TIMESTAMPTZ (Default: NOW())
Bảng question_options (Chuẩn hóa từ question.options: string[])
id: UUID (PK)
question_id: UUID (FK -> questions.id, NOT NULL, ON DELETE CASCADE)
option_text: TEXT (NOT NULL)
order: INT (NOT NULL, Default: 0)
Bảng quiz_submissions
id: UUID (PK)
quiz_id: UUID (FK -> quizzes.id, NOT NULL, ON DELETE CASCADE)
user_id: UUID (FK -> users.id, NOT NULL, ON DELETE CASCADE)
score: INT (NOT NULL, Default: 0)
total_points: INT (NOT NULL, Default: 0)
percentage: INT (NOT NULL, Default: 0)
completed_at: TIMESTAMPTZ (Default: NOW())
created_at: TIMESTAMPTZ (Default: NOW())
updated_at: TIMESTAMPTZ (Default: NOW())
Constraints: UNIQUE(quiz_id, user_id) (Mỗi học viên nộp 1 lần theo logic hiện tại)
Bảng quiz_submission_answers (Chuẩn hóa từ quizSubmission.answers[])
id: UUID (PK)
submission_id: UUID (FK -> quiz_submissions.id, NOT NULL, ON DELETE CASCADE)
question_id: UUID (FK -> questions.id, NOT NULL, ON DELETE CASCADE)
selected_answer: TEXT (NOT NULL)
is_correct: BOOLEAN (NOT NULL, Default: false)
Nhóm 5: Đơn hàng, Coupon & Ghi danh (Commerce & Enrollment)
Bảng coupons
id: UUID (PK)
title: VARCHAR(255) (NOT NULL)
code: VARCHAR(100) (UNIQUE, NOT NULL)
type: VARCHAR(20) (NOT NULL, Default: 'percentage', Enum: 'percentage', 'number')
value: DECIMAL(12, 2) (NOT NULL)
limit: INT (Nullable)
used: INT (NOT NULL, Default: 0)
start_date: TIMESTAMPTZ (Nullable)
end_date: TIMESTAMPTZ (Nullable)
active: BOOLEAN (NOT NULL, Default: false)
author_id: UUID (FK -> users.id, Nullable, ON DELETE SET NULL)
created_at: TIMESTAMPTZ (Default: NOW())
updated_at: TIMESTAMPTZ (Default: NOW())
Bảng coupon_courses (Chuẩn hóa từ coupon.courses: ObjectId[] - N:N)
coupon_id: UUID (FK -> coupons.id, NOT NULL, ON DELETE CASCADE)
course_id: UUID (FK -> courses.id, NOT NULL, ON DELETE CASCADE)
PK: (coupon_id, course_id)
Bảng orders
id: UUID (PK)
code: VARCHAR(50) (UNIQUE, NOT NULL)
amount: DECIMAL(12, 2) (NOT NULL) (Giá gốc)
discount: DECIMAL(12, 2) (NOT NULL, Default: 0) (Số tiền giảm)
total: DECIMAL(12, 2) (NOT NULL) (Tổng thanh toán thực tế)
coupon_id: UUID (FK -> coupons.id, Nullable, ON DELETE SET NULL)
course_id: UUID (FK -> courses.id, NOT NULL, ON DELETE RESTRICT)
user_id: UUID (FK -> users.id, NOT NULL, ON DELETE RESTRICT)
status: VARCHAR(20) (NOT NULL, Default: 'pending', Enum: 'pending', 'completed', 'rejected')
created_at: TIMESTAMPTZ (Default: NOW())
updated_at: TIMESTAMPTZ (Default: NOW())
Indexes: idx_orders_user_course_status (user_id, course_id, status), idx_orders_code
Bảng enrollments
id: UUID (PK)
user_id: UUID (FK -> users.id, NOT NULL, ON DELETE CASCADE)
course_id: UUID (FK -> courses.id, NOT NULL, ON DELETE CASCADE)
progress: INT (NOT NULL, Default: 0) (Phần trăm từ 0-100)
status: VARCHAR(20) (NOT NULL, Default: 'active', Enum: 'active', 'completed', 'canceled')
enrolled_at: TIMESTAMPTZ (Default: NOW())
completed_at: TIMESTAMPTZ (Nullable)
created_at: TIMESTAMPTZ (Default: NOW())
updated_at: TIMESTAMPTZ (Default: NOW())
Constraints: UNIQUE(user_id, course_id)
Bảng progress
id: UUID (PK)
user_id: UUID (FK -> users.id, NOT NULL, ON DELETE CASCADE)
course_id: UUID (FK -> courses.id, NOT NULL, ON DELETE CASCADE)
lesson_id: UUID (FK -> lessons.id, NOT NULL, ON DELETE CASCADE)
completed: BOOLEAN (NOT NULL, Default: false)
created_at: TIMESTAMPTZ (Default: NOW())
updated_at: TIMESTAMPTZ (Default: NOW())
Constraints: UNIQUE(user_id, lesson_id)
Bảng certificates
id: UUID (PK)
user_id: UUID (FK -> users.id, NOT NULL, ON DELETE CASCADE)
course_id: UUID (FK -> courses.id, NOT NULL, ON DELETE CASCADE)
grade: DECIMAL(5, 2) (NOT NULL)
certificate_url: TEXT (NOT NULL)
issued_at: TIMESTAMPTZ (Default: NOW())
created_at: TIMESTAMPTZ (Default: NOW())
updated_at: TIMESTAMPTZ (Default: NOW())
Constraints: UNIQUE(user_id, course_id)
Nhóm 6: Tin nhắn & Thông báo (Chat & Realtime Notifications)
Bảng conversations
id: UUID (PK)
is_group: BOOLEAN (NOT NULL, Default: false)
name: VARCHAR(255) (Nullable)
course_id: UUID (FK -> courses.id, Nullable, ON DELETE CASCADE) (Nếu là nhóm Q&A của khóa)
last_message_id: UUID (Nullable) (Trỏ tới message mới nhất, cập nhật sau)
created_at: TIMESTAMPTZ (Default: NOW())
updated_at: TIMESTAMPTZ (Default: NOW())
Bảng conversation_participants (Chuẩn hóa từ conversation.participants: ObjectId[] - N:N)
conversation_id: UUID (FK -> conversations.id, NOT NULL, ON DELETE CASCADE)
user_id: UUID (FK -> users.id, NOT NULL, ON DELETE CASCADE)
joined_at: TIMESTAMPTZ (Default: NOW())
PK: (conversation_id, user_id)
Bảng messages
id: UUID (PK)
conversation_id: UUID (FK -> conversations.id, NOT NULL, ON DELETE CASCADE)
sender_id: UUID (FK -> users.id, NOT NULL, ON DELETE RESTRICT)
content: TEXT (NOT NULL)
type: VARCHAR(20) (NOT NULL, Default: 'text', Enum: 'text', 'image', 'file')
is_edited: BOOLEAN (NOT NULL, Default: false)
created_at: TIMESTAMPTZ (Default: NOW())
updated_at: TIMESTAMPTZ (Default: NOW())
Indexes: idx_messages_conversation_created (conversation_id, created_at)
Bảng message_reads (Chuẩn hóa từ message.readBy: ObjectId[])
message_id: UUID (FK -> messages.id, NOT NULL, ON DELETE CASCADE)
user_id: UUID (FK -> users.id, NOT NULL, ON DELETE CASCADE)
read_at: TIMESTAMPTZ (Default: NOW())
PK: (message_id, user_id)
Bảng notifications
id: UUID (PK)
sender_id: UUID (FK -> users.id, Nullable, ON DELETE SET NULL)
receiver_id: UUID (FK -> users.id, NOT NULL, ON DELETE CASCADE)
type: VARCHAR(30) (NOT NULL, Enum: 'comment', 'rating', 'order', 'message', 'system', 'course', 'lesson', 'comment_reply', 'quiz')
message: TEXT (NOT NULL)
related_id: VARCHAR(255) (Nullable) (ID thực thể liên quan)
is_read: BOOLEAN (NOT NULL, Default: false)
created_at: TIMESTAMPTZ (Default: NOW())
updated_at: TIMESTAMPTZ (Default: NOW())
Indexes: idx_notifications_receiver_read (receiver_id, is_read, created_at)
3. Tổng kết Chiến lược Chuyển đổi (Migration Roadmap)
Chuẩn hóa Khóa chính: Dùng UUID đồng bộ trên toàn bộ bảng.
Cập nhật Middleware Validation: Đổi các rule .isMongoId() sang .isUUID() trong express-validator.
Refactor Service Layer: Thay các truy vấn Mongoose bằng Prisma Client (prisma.course.findUnique(), prisma.order.findMany(),...), khai thác triệt để mệnh đề include, select và quan hệ quan hệ trực tiếp (Relation Queries).
Đảm bảo ACID Transactions: Bọc các tác vụ cập nhật nhiều thực thể trong prisma.$transaction() (nhất là trong luồng đặt hàng, duyệt đơn, và ghi danh).
Dọn dẹp Data Type: Quy chuẩn is_verified về chuẩn Boolean true/false, loại bỏ hoàn toàn string rỗng ''.
Thiết kế trên đã bao quát toàn vẹn mọi tính năng hiện tại, giải quyết triệt để các hạn chế của cấu trúc Document phi quan hệ cũ, và sẵn sàng làm nền tảng cho việc sinh Prisma Schema ở bước tiếp theo.