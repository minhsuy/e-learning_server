import {
  toPostgresUuid,
  toSubEntityUuid,
  resolveNotificationRelatedId,
  DEFAULT_PROJECT_NAMESPACE,
  getProjectNamespace
} from '../migration-utils/id-mapper';

export interface AuditRecord {
  sourceCollection: string;
  sourceId: string;
  targetTable: string;
  targetId: string;
  canonicalKey: string;
}

export interface TransformedDataset {
  users: any[];
  categories: any[];
  courses: any[];
  course_faqs: any[];
  chapters: any[];
  lessons: any[];
  quizzes: any[];
  questions: any[];
  question_options: any[];
  quiz_submissions: any[];
  quiz_submission_answers: any[];
  orders: any[];
  coupons: any[];
  coupon_courses: any[];
  enrollments: any[];
  progress: any[];
  certificates: any[];
  ratings: any[];
  favorite_courses: any[];
  comments: any[];
  comment_reactions: any[];
  conversations: any[];
  conversation_participants: any[];
  messages: any[];
  message_reads: any[];
  notifications: any[];
  auditRecords: AuditRecord[];
}

export class MigrationTransformer {
  private auditRecords: AuditRecord[] = [];

  private recordAudit(
    sourceCollection: string,
    sourceId: string,
    targetTable: string,
    targetId: string,
    canonicalKey: string
  ) {
    this.auditRecords.push({
      sourceCollection,
      sourceId,
      targetTable,
      targetId,
      canonicalKey
    });
  }

  public transformAll(rawMongoData: Record<string, any[]>): TransformedDataset {
    this.auditRecords = [];

    // Pre-build set of existing course IDs to accurately detect orphan orders
    const validCourseIds = new Set((rawMongoData.courses || []).map((c) => String(c._id)));

    // Pre-build question answers lookup for quiz submissions grading
    const questionAnswerMap = new Map<string, string>();
    for (const q of rawMongoData.questions || []) {
      questionAnswerMap.set(String(q._id), String(q.answer ?? '').trim());
    }

    // 1. Users
    const users = (rawMongoData.users || []).map((u) => {
      const sourceId = String(u._id);
      const id = toPostgresUuid('users', sourceId);
      this.recordAudit('users', sourceId, 'users', id, `users:${sourceId}`);

      const isVerified = u.isVerified === true || u.isVerified === 'true';

      return {
        id,
        username: u.username,
        email: u.email,
        password: u.password,
        status: (u.status || 'active').toLowerCase(),
        avatar: u.avatar || null,
        phone: u.phone || null,
        bio: u.bio || null,
        role: (u.role || 'user').toLowerCase(),
        isVerified,
        facebook: u.socialLinks?.facebook || null,
        instagram: u.socialLinks?.instagram || null,
        github: u.socialLinks?.github || null,
        otpCode: u.otp_code || null,
        otpExpires: u.otp_expires ? new Date(u.otp_expires) : null,
        refreshToken: u.refresh_token || null,
        resetPasswordToken: u.reset_password_token || null,
        resetPasswordExpires: u.reset_password_expires ? new Date(u.reset_password_expires) : null,
        createdAt: new Date(u.createdAt),
        updatedAt: new Date(u.updatedAt)
      };
    });

    // 2. Categories
    const categories = (rawMongoData.categories || []).map((c) => {
      const sourceId = String(c._id);
      const id = toPostgresUuid('categories', sourceId);
      this.recordAudit('categories', sourceId, 'categories', id, `categories:${sourceId}`);

      return {
        id,
        name: c.name,
        slug: c.slug,
        description: c.description || null,
        createdById: c.created_by ? toPostgresUuid('users', c.created_by) : null,
        isDestroyed: Boolean(c._destroy),
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt)
      };
    });

    // 3. Courses & 4. CourseFaqs
    const course_faqs: any[] = [];
    const courses = (rawMongoData.courses || []).map((c) => {
      const sourceId = String(c._id);
      const id = toPostgresUuid('courses', sourceId);
      this.recordAudit('courses', sourceId, 'courses', id, `courses:${sourceId}`);

      // Transform embedded FAQs
      const qaList = c.info?.qa || [];
      qaList.forEach((qa: any, index: number) => {
        const faqId = qa._id
          ? toPostgresUuid('course_faqs', qa._id)
          : toSubEntityUuid('course_faqs', sourceId, index);
        course_faqs.push({
          id: faqId,
          courseId: id,
          question: qa.question,
          answer: qa.answer,
          order: index,
          createdAt: new Date(c.createdAt)
        });
      });

      return {
        id,
        title: c.title,
        slug: c.slug,
        image: c.image || '',
        introUrl: c.intro_url || '',
        description: c.description || '',
        price: Number(c.price || 0),
        oldPrice: Number(c.old_price || 0),
        type: (c.type || 'paid').toLowerCase(),
        status: (c.status || 'pending').toLowerCase(),
        level: (c.level || 'beginner').toLowerCase(),
        view: Number(c.view || 0),
        sold: Number(c.sold || 0),
        requirements: c.info?.requirements || [],
        benefits: c.info?.benefits || [],
        techniques: c.info?.techniques || [],
        documents: c.info?.documents || [],
        isDestroyed: Boolean(c._destroy),
        authorId: toPostgresUuid('users', c.author),
        categoryId: c.category ? toPostgresUuid('categories', c.category) : null,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt)
      };
    });

    // 5. Chapters
    const chapters = (rawMongoData.chapters || []).map((ch) => {
      const sourceId = String(ch._id);
      const id = toPostgresUuid('chapters', sourceId);
      this.recordAudit('chapters', sourceId, 'chapters', id, `chapters:${sourceId}`);

      return {
        id,
        title: ch.title,
        order: Number(ch.order || 0),
        isDestroyed: Boolean(ch._destroy),
        courseId: toPostgresUuid('courses', ch.course),
        createdAt: new Date(ch.createdAt),
        updatedAt: new Date(ch.updatedAt)
      };
    });

    // 6. Lessons
    const lessons = (rawMongoData.lessons || []).map((l) => {
      const sourceId = String(l._id);
      const id = toPostgresUuid('lessons', sourceId);
      this.recordAudit('lessons', sourceId, 'lessons', id, `lessons:${sourceId}`);

      return {
        id,
        title: l.title,
        slug: l.slug,
        order: Number(l.order || 0),
        duration: Number(l.duration || 0),
        content: l.content || '',
        type: (l.type || 'video').toLowerCase(),
        videoUrl: l.videoUrl || '',
        isDemo: Boolean(l.isDemo),
        chapterId: toPostgresUuid('chapters', l.chapter),
        courseId: toPostgresUuid('courses', l.course),
        authorId: toPostgresUuid('users', l.author),
        createdAt: new Date(l.createdAt),
        updatedAt: new Date(l.updatedAt)
      };
    });

    // 7. Quizzes
    const quizzes = (rawMongoData.quizzes || []).map((q) => {
      const sourceId = String(q._id);
      const id = toPostgresUuid('quizzes', sourceId);
      this.recordAudit('quizzes', sourceId, 'quizzes', id, `quizzes:${sourceId}`);

      return {
        id,
        title: q.title,
        duration: q.duration ? Number(q.duration) : null,
        passingGrade: q.passing_grade ? Number(q.passing_grade) : null,
        description: q.description || null,
        lessonId: toPostgresUuid('lessons', q.lesson),
        courseId: toPostgresUuid('courses', q.courseId),
        createdById: toPostgresUuid('users', q.created_by),
        createdAt: new Date(q.createdAt),
        updatedAt: new Date(q.updatedAt)
      };
    });

    // 8. Questions & 9. QuestionOptions
    const question_options: any[] = [];
    const questions = (rawMongoData.questions || []).map((qs) => {
      const sourceId = String(qs._id);
      const id = toPostgresUuid('questions', sourceId);
      this.recordAudit('questions', sourceId, 'questions', id, `questions:${sourceId}`);

      // Transform embedded options
      const opts = qs.options || [];
      opts.forEach((opt: string, index: number) => {
        const optionId = toSubEntityUuid('question_options', sourceId, index);
        question_options.push({
          id: optionId,
          questionId: id,
          optionText: opt,
          order: index
        });
      });

      return {
        id,
        title: qs.title,
        type: (qs.type || 'multiple_choice').toLowerCase(),
        answer: qs.answer,
        points: Number(qs.points || 1),
        quizId: toPostgresUuid('quizzes', qs.quiz),
        createdAt: new Date(qs.createdAt),
        updatedAt: new Date(qs.updatedAt)
      };
    });

    // 10. QuizSubmissions & 11. QuizSubmissionAnswers
    const quiz_submission_answers: any[] = [];
    const quiz_submissions = (rawMongoData.quizsubmissions || []).map((sub) => {
      const sourceId = String(sub._id);
      const id = toPostgresUuid('quiz_submissions', sourceId);
      this.recordAudit('quizsubmissions', sourceId, 'quiz_submissions', id, `quiz_submissions:${sourceId}`);

      const answers = sub.answers || [];
      answers.forEach((ans: any, index: number) => {
        const answerId = ans._id
          ? toPostgresUuid('quiz_submission_answers', ans._id)
          : toSubEntityUuid('quiz_submission_answers', sourceId, index);

        const correctAns = questionAnswerMap.get(String(ans.question));
        const isCorrect = correctAns !== undefined && correctAns === String(ans.selectedAnswer ?? '').trim();

        quiz_submission_answers.push({
          id: answerId,
          submissionId: id,
          questionId: toPostgresUuid('questions', ans.question),
          selectedAnswer: ans.selectedAnswer,
          isCorrect
        });
      });

      return {
        id,
        score: Number(sub.score || 0),
        totalPoints: Number(sub.totalPoints || 0),
        percentage: Number(sub.percentage || 0),
        completedAt: sub.completedAt ? new Date(sub.completedAt) : new Date(sub.createdAt),
        quizId: toPostgresUuid('quizzes', sub.quiz),
        userId: toPostgresUuid('users', sub.user),
        createdAt: new Date(sub.createdAt),
        updatedAt: new Date(sub.updatedAt)
      };
    });

    // 12. Orders (Handling Orphan Orders via nullable courseId)
    const orders = (rawMongoData.orders || []).map((ord) => {
      const sourceId = String(ord._id);
      const id = toPostgresUuid('orders', sourceId);
      this.recordAudit('orders', sourceId, 'orders', id, `orders:${sourceId}`);

      const courseIdStr = ord.course ? String(ord.course) : '';
      const isCourseValid = courseIdStr && validCourseIds.has(courseIdStr);

      // Orphan order decision: courseId is NULL when course no longer exists in MongoDB
      const courseId = isCourseValid ? toPostgresUuid('courses', courseIdStr) : null;

      return {
        id,
        code: ord.code,
        amount: Number(ord.amount || ord.total || 0),
        discount: Number(ord.discount || 0),
        total: Number(ord.total || 0),
        status: (ord.status || 'pending').toLowerCase(),
        userId: toPostgresUuid('users', ord.user),
        courseId,
        couponId: ord.coupon ? toPostgresUuid('coupons', ord.coupon) : null,
        createdAt: new Date(ord.createdAt),
        updatedAt: new Date(ord.updatedAt)
      };
    });

    // 13. Coupons & 14. CouponCourses (Composite PK)
    const coupon_courses: any[] = [];
    const coupons = (rawMongoData.coupons || []).map((cp) => {
      const sourceId = String(cp._id);
      const id = toPostgresUuid('coupons', sourceId);
      this.recordAudit('coupons', sourceId, 'coupons', id, `coupons:${sourceId}`);

      // Transform coupon.courses
      const cList = cp.courses || [];
      for (const cid of cList) {
        if (validCourseIds.has(String(cid))) {
          coupon_courses.push({
            couponId: id,
            courseId: toPostgresUuid('courses', cid)
          });
        }
      }

      return {
        id,
        title: cp.title,
        code: cp.code,
        type: (cp.type || 'percentage').toLowerCase(),
        value: Number(cp.value || 0),
        limit: cp.limit ? Number(cp.limit) : null,
        used: Number(cp.used || 0),
        active: Boolean(cp.active),
        startDate: cp.startDate ? new Date(cp.startDate) : null,
        endDate: cp.endDate ? new Date(cp.endDate) : null,
        authorId: cp.author ? toPostgresUuid('users', cp.author) : null,
        createdAt: new Date(cp.createdAt),
        updatedAt: new Date(cp.updatedAt)
      };
    });

    // 15. Enrollments
    const enrollments = (rawMongoData.enrollments || []).map((enr) => {
      const sourceId = String(enr._id);
      const id = toPostgresUuid('enrollments', sourceId);
      this.recordAudit('enrollments', sourceId, 'enrollments', id, `enrollments:${sourceId}`);

      return {
        id,
        progress: Number(enr.progress || 0),
        status: (enr.status || 'active').toLowerCase(),
        enrolledAt: enr.enrolledAt ? new Date(enr.enrolledAt) : new Date(enr.createdAt),
        userId: toPostgresUuid('users', enr.user),
        courseId: toPostgresUuid('courses', enr.course),
        createdAt: new Date(enr.createdAt),
        updatedAt: new Date(enr.updatedAt)
      };
    });

    // 16. Progress
    const progress = (rawMongoData.progresses || []).map((p) => {
      const sourceId = String(p._id);
      const id = toPostgresUuid('progress', sourceId);
      this.recordAudit('progresses', sourceId, 'progress', id, `progress:${sourceId}`);

      return {
        id,
        completed: Boolean(p.completed),
        userId: toPostgresUuid('users', p.user),
        lessonId: toPostgresUuid('lessons', p.lesson),
        courseId: toPostgresUuid('courses', p.course),
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt)
      };
    });

    // 17. Certificates
    const certificates = (rawMongoData.certificates || []).map((cert) => {
      const sourceId = String(cert._id);
      const id = toPostgresUuid('certificates', sourceId);
      this.recordAudit('certificates', sourceId, 'certificates', id, `certificates:${sourceId}`);

      return {
        id,
        grade: Number(cert.grade || 0),
        certificateUrl: cert.certificateUrl,
        issuedAt: cert.issuedAt ? new Date(cert.issuedAt) : new Date(cert.createdAt),
        userId: toPostgresUuid('users', cert.user),
        courseId: toPostgresUuid('courses', cert.course),
        createdAt: new Date(cert.createdAt),
        updatedAt: new Date(cert.updatedAt)
      };
    });

    // 18. Ratings
    const ratings = (rawMongoData.ratings || []).map((r) => {
      const sourceId = String(r._id);
      const id = toPostgresUuid('ratings', sourceId);
      this.recordAudit('ratings', sourceId, 'ratings', id, `ratings:${sourceId}`);

      return {
        id,
        rate: Number(r.rate || 5),
        content: r.content || '',
        status: (r.status || 'active').toLowerCase(),
        userId: toPostgresUuid('users', r.user),
        courseId: toPostgresUuid('courses', r.course),
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt)
      };
    });

    // 19. FavoriteCourses
    const favorite_courses = (rawMongoData.favoritecourses || []).map((f) => {
      const sourceId = String(f._id);
      const id = toPostgresUuid('favorite_courses', sourceId);
      this.recordAudit('favoritecourses', sourceId, 'favorite_courses', id, `favorite_courses:${sourceId}`);

      return {
        id,
        userId: toPostgresUuid('users', f.user),
        courseId: toPostgresUuid('courses', f.course),
        createdAt: new Date(f.createdAt)
      };
    });

    // 20. Comments & 21. CommentReactions
    const comment_reactions: any[] = [];
    const comments = (rawMongoData.comments || []).map((cm) => {
      const sourceId = String(cm._id);
      const id = toPostgresUuid('comments', sourceId);
      this.recordAudit('comments', sourceId, 'comments', id, `comments:${sourceId}`);

      // Transform likes & dislikes
      for (const uid of cm.likes || []) {
        comment_reactions.push({
          id: toSubEntityUuid('comment_reactions', sourceId, `like_${uid}`),
          commentId: id,
          userId: toPostgresUuid('users', uid),
          type: 'like',
          createdAt: new Date(cm.createdAt)
        });
      }
      for (const uid of cm.dislikes || []) {
        comment_reactions.push({
          id: toSubEntityUuid('comment_reactions', sourceId, `dislike_${uid}`),
          commentId: id,
          userId: toPostgresUuid('users', uid),
          type: 'dislike',
          createdAt: new Date(cm.createdAt)
        });
      }

      return {
        id,
        content: cm.content,
        level: Number(cm.level || 0),
        status: (cm.status || 'approved').toLowerCase(),
        parentId: cm.parentId ? toPostgresUuid('comments', cm.parentId) : null,
        userId: toPostgresUuid('users', cm.user),
        courseId: toPostgresUuid('courses', cm.course),
        lessonId: toPostgresUuid('lessons', cm.lesson),
        createdAt: new Date(cm.createdAt),
        updatedAt: new Date(cm.updatedAt)
      };
    });

    // 22. Conversations & 23. ConversationParticipants (Composite PK)
    const conversation_participants: any[] = [];
    const conversations = (rawMongoData.conversations || []).map((cv) => {
      const sourceId = String(cv._id);
      const id = toPostgresUuid('conversations', sourceId);
      this.recordAudit('conversations', sourceId, 'conversations', id, `conversations:${sourceId}`);

      // Transform participants
      for (const uid of cv.participants || []) {
        conversation_participants.push({
          conversationId: id,
          userId: toPostgresUuid('users', uid),
          joinedAt: new Date(cv.createdAt)
        });
      }

      return {
        id,
        name: cv.name || null,
        isGroup: Boolean(cv.isGroup),
        courseId: cv.course && validCourseIds.has(String(cv.course)) ? toPostgresUuid('courses', cv.course) : null,
        lastMessageId: cv.lastMessage ? toPostgresUuid('messages', cv.lastMessage) : null,
        createdAt: new Date(cv.createdAt),
        updatedAt: new Date(cv.updatedAt)
      };
    });

    // 24. Messages & 25. MessageReads (Composite PK)
    const message_reads: any[] = [];
    const messages = (rawMongoData.messages || []).map((m) => {
      const sourceId = String(m._id);
      const id = toPostgresUuid('messages', sourceId);
      this.recordAudit('messages', sourceId, 'messages', id, `messages:${sourceId}`);

      // Transform readBy
      for (const uid of m.readBy || []) {
        message_reads.push({
          messageId: id,
          userId: toPostgresUuid('users', uid),
          readAt: new Date(m.createdAt)
        });
      }

      return {
        id,
        content: m.content || '',
        type: (m.type || 'text').toLowerCase(),
        isEdited: Boolean(m.isEdited),
        conversationId: toPostgresUuid('conversations', m.conversation),
        senderId: toPostgresUuid('users', m.sender),
        createdAt: new Date(m.createdAt),
        updatedAt: new Date(m.updatedAt)
      };
    });

    // 26. Notifications
    const notifications = (rawMongoData.notifications || []).map((n) => {
      const sourceId = String(n._id);
      const id = toPostgresUuid('notifications', sourceId);
      this.recordAudit('notifications', sourceId, 'notifications', id, `notifications:${sourceId}`);

      const relatedId = resolveNotificationRelatedId(n.type, n.relatedId);

      return {
        id,
        type: (n.type || 'system').toLowerCase(),
        message: n.message || '',
        relatedId,
        isRead: Boolean(n.read),
        receiverId: toPostgresUuid('users', n.receiver),
        senderId: n.sender ? toPostgresUuid('users', n.sender) : null,
        createdAt: new Date(n.createdAt)
      };
    });

    return {
      users,
      categories,
      courses,
      course_faqs,
      chapters,
      lessons,
      quizzes,
      questions,
      question_options,
      quiz_submissions,
      quiz_submission_answers,
      orders,
      coupons,
      coupon_courses,
      enrollments,
      progress,
      certificates,
      ratings,
      favorite_courses,
      comments,
      comment_reactions,
      conversations,
      conversation_participants,
      messages,
      message_reads,
      notifications,
      auditRecords: this.auditRecords
    };
  }
}
