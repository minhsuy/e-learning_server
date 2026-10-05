/**
 * Validation rules and integrity checks for MongoDB source data against PostgreSQL schema.
 * All operations here are strictly READ-ONLY and in-memory.
 */

export interface ValidationIssue {
  severity: 'CRITICAL_ERROR' | 'WARNING' | 'INFO';
  category:
    | 'COUNT_MISMATCH'
    | 'FOREIGN_KEY_MISSING'
    | 'ORPHAN_RECORD'
    | 'UNIQUE_CONFLICT'
    | 'ENUM_MISMATCH'
    | 'NULLABILITY_VIOLATION'
    | 'FIELD_TYPE_MISMATCH'
    | 'COMMENT_TREE_ISSUE'
    | 'SUB_ENTITY_WARNING';
  entity: string;
  documentId?: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ValidationResult {
  timestamp: string;
  totalDocuments: number;
  collectionCounts: Record<string, number>;
  issues: ValidationIssue[];
  criticalErrorCount: number;
  warningCount: number;
  infoCount: number;
  commentTreeStats: {
    total: number;
    rootCount: number;
    replyCount: number;
    maxDepth: number;
    orphanParents: number;
  };
  orphanOrders: Array<{
    orderId: string;
    code: string;
    missingCourseId: string;
    status: string;
    total: number;
  }>;
}

// PostgreSQL Enum Allowed Values Whitelist
export const POSTGRES_ENUMS = {
  UserRole: ['admin', 'user', 'teacher'],
  UserStatus: ['active', 'inactive'],
  CourseStatus: ['approved', 'pending', 'rejected'],
  CourseLevel: ['beginner', 'intermediate', 'advanced'],
  CourseType: ['paid', 'free'],
  LessonType: ['video', 'text'],
  ECouponType: ['percentage', 'number'],
  EOrderStatus: ['pending', 'completed', 'rejected'],
  EEnrollmentStatus: ['active', 'completed', 'canceled'],
  CommentStatus: ['approved', 'pending', 'rejected'],
  ERatingStatus: ['active', 'inactive'],
  ENotificationType: [
    'comment',
    'rating',
    'order',
    'message',
    'system',
    'course',
    'lesson',
    'comment_reply',
    'quiz'
  ],
  QuestionType: ['multiple_choice', 'fill_in_blank'],
  EMessageType: ['text', 'image', 'file'],
  CommentReactionType: ['like', 'dislike']
};

export const EXPECTED_BASELINE_COUNTS: Record<string, number> = {
  users: 7,
  categories: 3,
  courses: 8,
  chapters: 12,
  lessons: 7,
  quizzes: 3,
  questions: 5,
  quizsubmissions: 2,
  orders: 8,
  coupons: 2,
  enrollments: 5,
  progresses: 4,
  certificates: 1,
  ratings: 1,
  favoritecourses: 2,
  comments: 8,
  conversations: 2,
  messages: 12,
  notifications: 28
};

export class MigrationValidator {
  private issues: ValidationIssue[] = [];

  public validateAll(rawMongoData: Record<string, any[]>): ValidationResult {
    this.issues = [];

    // 1. Validate Collection Counts against Baseline
    this.validateCollectionCounts(rawMongoData);

    // 2. Validate Root Entity IDs
    this.validateRootEntityIds(rawMongoData);

    // 3. Build ID Sets for Foreign Key & Unique Validation
    const idSets = this.buildIdSets(rawMongoData);

    // 4. Validate Foreign Key References & Detect Orphans
    const orphanOrders = this.validateForeignKeysAndOrphans(rawMongoData, idSets);

    // 5. Validate Unique Constraints
    this.validateUniqueConstraints(rawMongoData);

    // 6. Validate Enums
    this.validateEnums(rawMongoData);

    // 7. Validate Nullability
    this.validateNullability(rawMongoData);

    // 8. Validate Special Types (e.g. isVerified)
    this.validateSpecialTypes(rawMongoData);

    // 9. Validate Comment Tree Structure
    const commentTreeStats = this.validateCommentTree(rawMongoData.comments || []);

    // 10. Validate Sub-entities (Index-based warnings)
    this.validateSubEntities(rawMongoData);

    // Compute Summaries
    let totalDocuments = 0;
    const collectionCounts: Record<string, number> = {};
    for (const [colName, docs] of Object.entries(rawMongoData)) {
      collectionCounts[colName] = docs.length;
      totalDocuments += docs.length;
    }

    const criticalErrorCount = this.issues.filter((i) => i.severity === 'CRITICAL_ERROR').length;
    const warningCount = this.issues.filter((i) => i.severity === 'WARNING').length;
    const infoCount = this.issues.filter((i) => i.severity === 'INFO').length;

    return {
      timestamp: new Date().toISOString(),
      totalDocuments,
      collectionCounts,
      issues: this.issues,
      criticalErrorCount,
      warningCount,
      infoCount,
      commentTreeStats,
      orphanOrders
    };
  }

  private validateCollectionCounts(data: Record<string, any[]>) {
    for (const [col, expected] of Object.entries(EXPECTED_BASELINE_COUNTS)) {
      const actual = data[col]?.length ?? 0;
      if (actual !== expected) {
        this.issues.push({
          severity: 'WARNING',
          category: 'COUNT_MISMATCH',
          entity: col,
          message: `Source count differs from expected baseline. Expected ${expected}, found ${actual}.`
        });
      }
    }
  }

  private validateRootEntityIds(data: Record<string, any[]>) {
    const hex24Regex = /^[0-9a-fA-F]{24}$/;
    for (const [col, docs] of Object.entries(data)) {
      for (const doc of docs) {
        const idStr = doc._id ? String(doc._id) : '';
        if (!idStr || !hex24Regex.test(idStr)) {
          this.issues.push({
            severity: 'CRITICAL_ERROR',
            category: 'FIELD_TYPE_MISMATCH',
            entity: col,
            documentId: idStr,
            message: `Document has missing or invalid _id: "${idStr}".`
          });
        }
      }
    }
  }

  private buildIdSets(data: Record<string, any[]>): Record<string, Set<string>> {
    const idSets: Record<string, Set<string>> = {};
    for (const [col, docs] of Object.entries(data)) {
      idSets[col] = new Set(docs.map((d) => String(d._id)));
    }
    return idSets;
  }

  private validateForeignKeysAndOrphans(
    data: Record<string, any[]>,
    idSets: Record<string, Set<string>>
  ): Array<{ orderId: string; code: string; missingCourseId: string; status: string; total: number }> {
    const orphanOrders: Array<{
      orderId: string;
      code: string;
      missingCourseId: string;
      status: string;
      total: number;
    }> = [];

    // Course references
    for (const course of data.courses || []) {
      const cid = String(course._id);
      if (course.author && !idSets.users.has(String(course.author))) {
        this.issues.push({
          severity: 'CRITICAL_ERROR',
          category: 'FOREIGN_KEY_MISSING',
          entity: 'courses',
          documentId: cid,
          message: `Course author "${course.author}" does not exist in users.`
        });
      }
      if (course.category && !idSets.categories.has(String(course.category))) {
        this.issues.push({
          severity: 'WARNING',
          category: 'FOREIGN_KEY_MISSING',
          entity: 'courses',
          documentId: cid,
          message: `Course category "${course.category}" does not exist in categories (Will be SET NULL).`
        });
      }
    }

    // Chapter references
    for (const ch of data.chapters || []) {
      const chid = String(ch._id);
      if (!ch.course || !idSets.courses.has(String(ch.course))) {
        this.issues.push({
          severity: 'CRITICAL_ERROR',
          category: 'FOREIGN_KEY_MISSING',
          entity: 'chapters',
          documentId: chid,
          message: `Chapter course "${ch.course}" does not exist in courses.`
        });
      }
    }

    // Lesson references
    for (const l of data.lessons || []) {
      const lid = String(l._id);
      if (!l.chapter || !idSets.chapters.has(String(l.chapter))) {
        this.issues.push({
          severity: 'CRITICAL_ERROR',
          category: 'FOREIGN_KEY_MISSING',
          entity: 'lessons',
          documentId: lid,
          message: `Lesson chapter "${l.chapter}" does not exist in chapters.`
        });
      }
      if (!l.course || !idSets.courses.has(String(l.course))) {
        this.issues.push({
          severity: 'CRITICAL_ERROR',
          category: 'FOREIGN_KEY_MISSING',
          entity: 'lessons',
          documentId: lid,
          message: `Lesson course "${l.course}" does not exist in courses.`
        });
      }
      if (!l.author || !idSets.users.has(String(l.author))) {
        this.issues.push({
          severity: 'CRITICAL_ERROR',
          category: 'FOREIGN_KEY_MISSING',
          entity: 'lessons',
          documentId: lid,
          message: `Lesson author "${l.author}" does not exist in users.`
        });
      }
    }

    // Quiz references
    for (const q of data.quizzes || []) {
      const qid = String(q._id);
      if (!q.lesson || !idSets.lessons.has(String(q.lesson))) {
        this.issues.push({
          severity: 'CRITICAL_ERROR',
          category: 'FOREIGN_KEY_MISSING',
          entity: 'quizzes',
          documentId: qid,
          message: `Quiz lesson "${q.lesson}" does not exist in lessons.`
        });
      }
      if (!q.courseId || !idSets.courses.has(String(q.courseId))) {
        this.issues.push({
          severity: 'CRITICAL_ERROR',
          category: 'FOREIGN_KEY_MISSING',
          entity: 'quizzes',
          documentId: qid,
          message: `Quiz courseId "${q.courseId}" does not exist in courses.`
        });
      }
      if (!q.created_by || !idSets.users.has(String(q.created_by))) {
        this.issues.push({
          severity: 'CRITICAL_ERROR',
          category: 'FOREIGN_KEY_MISSING',
          entity: 'quizzes',
          documentId: qid,
          message: `Quiz created_by "${q.created_by}" does not exist in users.`
        });
      }
    }

    // Question references
    for (const qs of data.questions || []) {
      const qsid = String(qs._id);
      if (!qs.quiz || !idSets.quizzes.has(String(qs.quiz))) {
        this.issues.push({
          severity: 'CRITICAL_ERROR',
          category: 'FOREIGN_KEY_MISSING',
          entity: 'questions',
          documentId: qsid,
          message: `Question quiz "${qs.quiz}" does not exist in quizzes.`
        });
      }
    }

    // QuizSubmission references
    for (const sub of data.quizsubmissions || []) {
      const subId = String(sub._id);
      if (!sub.quiz || !idSets.quizzes.has(String(sub.quiz))) {
        this.issues.push({
          severity: 'CRITICAL_ERROR',
          category: 'FOREIGN_KEY_MISSING',
          entity: 'quizsubmissions',
          documentId: subId,
          message: `QuizSubmission quiz "${sub.quiz}" does not exist in quizzes.`
        });
      }
      if (!sub.user || !idSets.users.has(String(sub.user))) {
        this.issues.push({
          severity: 'CRITICAL_ERROR',
          category: 'FOREIGN_KEY_MISSING',
          entity: 'quizsubmissions',
          documentId: subId,
          message: `QuizSubmission user "${sub.user}" does not exist in users.`
        });
      }
      // Validate each answer references a valid question
      for (const ans of sub.answers || []) {
        if (!ans.question || !idSets.questions.has(String(ans.question))) {
          this.issues.push({
            severity: 'CRITICAL_ERROR',
            category: 'FOREIGN_KEY_MISSING',
            entity: 'quizsubmissions.answers',
            documentId: subId,
            message: `Submission answer question "${ans.question}" does not exist in questions.`
          });
        }
      }
    }

    // Order references & Orphan Order Detection
    for (const ord of data.orders || []) {
      const oid = String(ord._id);
      if (!ord.user || !idSets.users.has(String(ord.user))) {
        this.issues.push({
          severity: 'CRITICAL_ERROR',
          category: 'FOREIGN_KEY_MISSING',
          entity: 'orders',
          documentId: oid,
          message: `Order user "${ord.user}" does not exist in users.`
        });
      }
      if (ord.coupon && !idSets.coupons.has(String(ord.coupon))) {
        this.issues.push({
          severity: 'WARNING',
          category: 'FOREIGN_KEY_MISSING',
          entity: 'orders',
          documentId: oid,
          message: `Order coupon "${ord.coupon}" does not exist in coupons (Will be SET NULL).`
        });
      }
      // Check course reference
      const courseIdStr = ord.course ? String(ord.course) : '';
      if (!courseIdStr || !idSets.courses.has(courseIdStr)) {
        // Recognized orphan order
        orphanOrders.push({
          orderId: oid,
          code: ord.code,
          missingCourseId: courseIdStr,
          status: ord.status,
          total: ord.total
        });
        this.issues.push({
          severity: 'WARNING',
          category: 'ORPHAN_RECORD',
          entity: 'orders',
          documentId: oid,
          message: `Orphan order detected: code "${ord.code}" references deleted course "${courseIdStr}". Handled via nullable course_id = NULL.`
        });
      }
    }

    // Enrollment references
    for (const enr of data.enrollments || []) {
      const eid = String(enr._id);
      if (!enr.user || !idSets.users.has(String(enr.user))) {
        this.issues.push({
          severity: 'CRITICAL_ERROR',
          category: 'FOREIGN_KEY_MISSING',
          entity: 'enrollments',
          documentId: eid,
          message: `Enrollment user "${enr.user}" does not exist in users.`
        });
      }
      if (!enr.course || !idSets.courses.has(String(enr.course))) {
        this.issues.push({
          severity: 'CRITICAL_ERROR',
          category: 'FOREIGN_KEY_MISSING',
          entity: 'enrollments',
          documentId: eid,
          message: `Enrollment course "${enr.course}" does not exist in courses.`
        });
      }
    }

    // Progress references
    for (const prog of data.progresses || []) {
      const pid = String(prog._id);
      if (!prog.user || !idSets.users.has(String(prog.user))) {
        this.issues.push({
          severity: 'CRITICAL_ERROR',
          category: 'FOREIGN_KEY_MISSING',
          entity: 'progresses',
          documentId: pid,
          message: `Progress user "${prog.user}" does not exist in users.`
        });
      }
      if (!prog.lesson || !idSets.lessons.has(String(prog.lesson))) {
        this.issues.push({
          severity: 'CRITICAL_ERROR',
          category: 'FOREIGN_KEY_MISSING',
          entity: 'progresses',
          documentId: pid,
          message: `Progress lesson "${prog.lesson}" does not exist in lessons.`
        });
      }
    }

    // Certificate references
    for (const cert of data.certificates || []) {
      const cid = String(cert._id);
      if (!cert.user || !idSets.users.has(String(cert.user))) {
        this.issues.push({
          severity: 'CRITICAL_ERROR',
          category: 'FOREIGN_KEY_MISSING',
          entity: 'certificates',
          documentId: cid,
          message: `Certificate user "${cert.user}" does not exist in users.`
        });
      }
      if (!cert.course || !idSets.courses.has(String(cert.course))) {
        this.issues.push({
          severity: 'CRITICAL_ERROR',
          category: 'FOREIGN_KEY_MISSING',
          entity: 'certificates',
          documentId: cid,
          message: `Certificate course "${cert.course}" does not exist in courses.`
        });
      }
    }

    // Rating references
    for (const r of data.ratings || []) {
      const rid = String(r._id);
      if (!r.user || !idSets.users.has(String(r.user))) {
        this.issues.push({
          severity: 'CRITICAL_ERROR',
          category: 'FOREIGN_KEY_MISSING',
          entity: 'ratings',
          documentId: rid,
          message: `Rating user "${r.user}" does not exist in users.`
        });
      }
      if (!r.course || !idSets.courses.has(String(r.course))) {
        this.issues.push({
          severity: 'CRITICAL_ERROR',
          category: 'FOREIGN_KEY_MISSING',
          entity: 'ratings',
          documentId: rid,
          message: `Rating course "${r.course}" does not exist in courses.`
        });
      }
    }

    // FavoriteCourse references
    for (const fav of data.favoritecourses || []) {
      const fid = String(fav._id);
      if (!fav.user || !idSets.users.has(String(fav.user))) {
        this.issues.push({
          severity: 'CRITICAL_ERROR',
          category: 'FOREIGN_KEY_MISSING',
          entity: 'favoritecourses',
          documentId: fid,
          message: `FavoriteCourse user "${fav.user}" does not exist in users.`
        });
      }
      if (!fav.course || !idSets.courses.has(String(fav.course))) {
        this.issues.push({
          severity: 'CRITICAL_ERROR',
          category: 'FOREIGN_KEY_MISSING',
          entity: 'favoritecourses',
          documentId: fid,
          message: `FavoriteCourse course "${fav.course}" does not exist in courses.`
        });
      }
    }

    // Conversation references
    for (const conv of data.conversations || []) {
      const cid = String(conv._id);
      if (conv.course && !idSets.courses.has(String(conv.course))) {
        this.issues.push({
          severity: 'WARNING',
          category: 'FOREIGN_KEY_MISSING',
          entity: 'conversations',
          documentId: cid,
          message: `Conversation course "${conv.course}" does not exist in courses.`
        });
      }
      for (const p of conv.participants || []) {
        if (!idSets.users.has(String(p))) {
          this.issues.push({
            severity: 'CRITICAL_ERROR',
            category: 'FOREIGN_KEY_MISSING',
            entity: 'conversations.participants',
            documentId: cid,
            message: `Conversation participant "${p}" does not exist in users.`
          });
        }
      }
    }

    // Message references
    for (const msg of data.messages || []) {
      const mid = String(msg._id);
      if (!msg.conversation || !idSets.conversations.has(String(msg.conversation))) {
        this.issues.push({
          severity: 'CRITICAL_ERROR',
          category: 'FOREIGN_KEY_MISSING',
          entity: 'messages',
          documentId: mid,
          message: `Message conversation "${msg.conversation}" does not exist in conversations.`
        });
      }
      if (!msg.sender || !idSets.users.has(String(msg.sender))) {
        this.issues.push({
          severity: 'CRITICAL_ERROR',
          category: 'FOREIGN_KEY_MISSING',
          entity: 'messages',
          documentId: mid,
          message: `Message sender "${msg.sender}" does not exist in users.`
        });
      }
      for (const r of msg.readBy || []) {
        if (!idSets.users.has(String(r))) {
          this.issues.push({
            severity: 'CRITICAL_ERROR',
            category: 'FOREIGN_KEY_MISSING',
            entity: 'messages.readBy',
            documentId: mid,
            message: `Message readBy user "${r}" does not exist in users.`
          });
        }
      }
    }

    // Notification references
    for (const notif of data.notifications || []) {
      const nid = String(notif._id);
      if (!notif.receiver || !idSets.users.has(String(notif.receiver))) {
        this.issues.push({
          severity: 'CRITICAL_ERROR',
          category: 'FOREIGN_KEY_MISSING',
          entity: 'notifications',
          documentId: nid,
          message: `Notification receiver "${notif.receiver}" does not exist in users.`
        });
      }
      if (notif.sender && !idSets.users.has(String(notif.sender))) {
        this.issues.push({
          severity: 'WARNING',
          category: 'FOREIGN_KEY_MISSING',
          entity: 'notifications',
          documentId: nid,
          message: `Notification sender "${notif.sender}" does not exist in users (Will be SET NULL).`
        });
      }
    }

    return orphanOrders;
  }

  private validateUniqueConstraints(data: Record<string, any[]>) {
    // 1. users.email
    this.checkDuplicateProperty(data.users || [], 'email', 'users', 'users(email)');

    // 2. categories.slug
    this.checkDuplicateProperty(data.categories || [], 'slug', 'categories', 'categories(slug)');

    // 3. courses.slug
    this.checkDuplicateProperty(data.courses || [], 'slug', 'courses', 'courses(slug)');

    // 4. orders.code
    this.checkDuplicateProperty(data.orders || [], 'code', 'orders', 'orders(code)');

    // 5. coupons.code
    this.checkDuplicateProperty(data.coupons || [], 'code', 'coupons', 'coupons(code)');

    // 6. quizzes.lesson (1-1 relation)
    this.checkDuplicateProperty(data.quizzes || [], 'lesson', 'quizzes', 'quizzes(lesson_id)');

    // 7. Composite unique: enrollments(user, course)
    this.checkCompositeDuplicate(
      data.enrollments || [],
      ['user', 'course'],
      'enrollments',
      'enrollments(user_id, course_id)'
    );

    // 8. Composite unique: progresses(user, lesson)
    this.checkCompositeDuplicate(
      data.progresses || [],
      ['user', 'lesson'],
      'progresses',
      'progress(user_id, lesson_id)'
    );

    // 9. Composite unique: certificates(user, course)
    this.checkCompositeDuplicate(
      data.certificates || [],
      ['user', 'course'],
      'certificates',
      'certificates(user_id, course_id)'
    );

    // 10. Composite unique: ratings(user, course)
    this.checkCompositeDuplicate(
      data.ratings || [],
      ['user', 'course'],
      'ratings',
      'ratings(user_id, course_id)'
    );

    // 11. Composite unique: favoritecourses(user, course)
    this.checkCompositeDuplicate(
      data.favoritecourses || [],
      ['user', 'course'],
      'favoritecourses',
      'favorite_courses(user_id, course_id)'
    );

    // 12. Composite unique: quizsubmissions(quiz, user)
    this.checkCompositeDuplicate(
      data.quizsubmissions || [],
      ['quiz', 'user'],
      'quizsubmissions',
      'quiz_submissions(quiz_id, user_id)'
    );
  }

  private checkDuplicateProperty(docs: any[], prop: string, entity: string, constraintName: string) {
    const seen = new Set<string>();
    for (const d of docs) {
      const val = d[prop] ? String(d[prop]).trim().toLowerCase() : null;
      if (val) {
        if (seen.has(val)) {
          this.issues.push({
            severity: 'CRITICAL_ERROR',
            category: 'UNIQUE_CONFLICT',
            entity,
            documentId: String(d._id),
            message: `Unique constraint conflict on ${constraintName}: duplicate value "${val}".`
          });
        }
        seen.add(val);
      }
    }
  }

  private checkCompositeDuplicate(
    docs: any[],
    props: string[],
    entity: string,
    constraintName: string
  ) {
    const seen = new Set<string>();
    for (const d of docs) {
      const key = props.map((p) => String(d[p] ?? '')).join('::');
      if (seen.has(key)) {
        this.issues.push({
          severity: 'CRITICAL_ERROR',
          category: 'UNIQUE_CONFLICT',
          entity,
          documentId: String(d._id),
          message: `Composite unique conflict on ${constraintName}: duplicate key combination "${key}".`
        });
      }
      seen.add(key);
    }
  }

  private validateEnums(data: Record<string, any[]>) {
    // Users
    for (const u of data.users || []) {
      if (u.role && !POSTGRES_ENUMS.UserRole.includes(String(u.role).toLowerCase())) {
        this.issues.push({
          severity: 'CRITICAL_ERROR',
          category: 'ENUM_MISMATCH',
          entity: 'users',
          documentId: String(u._id),
          message: `Invalid role enum "${u.role}". Allowed: ${POSTGRES_ENUMS.UserRole.join(', ')}.`
        });
      }
      if (u.status && !POSTGRES_ENUMS.UserStatus.includes(String(u.status).toLowerCase())) {
        this.issues.push({
          severity: 'CRITICAL_ERROR',
          category: 'ENUM_MISMATCH',
          entity: 'users',
          documentId: String(u._id),
          message: `Invalid user status enum "${u.status}". Allowed: ${POSTGRES_ENUMS.UserStatus.join(', ')}.`
        });
      }
    }

    // Courses
    for (const c of data.courses || []) {
      if (c.status && !POSTGRES_ENUMS.CourseStatus.includes(String(c.status).toLowerCase())) {
        this.issues.push({
          severity: 'CRITICAL_ERROR',
          category: 'ENUM_MISMATCH',
          entity: 'courses',
          documentId: String(c._id),
          message: `Invalid course status enum "${c.status}". Allowed: ${POSTGRES_ENUMS.CourseStatus.join(', ')}.`
        });
      }
      if (c.level && !POSTGRES_ENUMS.CourseLevel.includes(String(c.level).toLowerCase())) {
        this.issues.push({
          severity: 'CRITICAL_ERROR',
          category: 'ENUM_MISMATCH',
          entity: 'courses',
          documentId: String(c._id),
          message: `Invalid course level enum "${c.level}". Allowed: ${POSTGRES_ENUMS.CourseLevel.join(', ')}.`
        });
      }
      if (c.type && !POSTGRES_ENUMS.CourseType.includes(String(c.type).toLowerCase())) {
        this.issues.push({
          severity: 'CRITICAL_ERROR',
          category: 'ENUM_MISMATCH',
          entity: 'courses',
          documentId: String(c._id),
          message: `Invalid course type enum "${c.type}". Allowed: ${POSTGRES_ENUMS.CourseType.join(', ')}.`
        });
      }
    }

    // Lessons
    for (const l of data.lessons || []) {
      if (l.type && !POSTGRES_ENUMS.LessonType.includes(String(l.type).toLowerCase())) {
        this.issues.push({
          severity: 'CRITICAL_ERROR',
          category: 'ENUM_MISMATCH',
          entity: 'lessons',
          documentId: String(l._id),
          message: `Invalid lesson type enum "${l.type}". Allowed: ${POSTGRES_ENUMS.LessonType.join(', ')}.`
        });
      }
    }

    // Orders
    for (const o of data.orders || []) {
      if (o.status && !POSTGRES_ENUMS.EOrderStatus.includes(String(o.status).toLowerCase())) {
        this.issues.push({
          severity: 'CRITICAL_ERROR',
          category: 'ENUM_MISMATCH',
          entity: 'orders',
          documentId: String(o._id),
          message: `Invalid order status enum "${o.status}". Allowed: ${POSTGRES_ENUMS.EOrderStatus.join(', ')}.`
        });
      }
    }

    // Coupons
    for (const cp of data.coupons || []) {
      if (cp.type && !POSTGRES_ENUMS.ECouponType.includes(String(cp.type).toLowerCase())) {
        this.issues.push({
          severity: 'CRITICAL_ERROR',
          category: 'ENUM_MISMATCH',
          entity: 'coupons',
          documentId: String(cp._id),
          message: `Invalid coupon type enum "${cp.type}". Allowed: ${POSTGRES_ENUMS.ECouponType.join(', ')}.`
        });
      }
    }

    // Notifications
    for (const n of data.notifications || []) {
      if (n.type && !POSTGRES_ENUMS.ENotificationType.includes(String(n.type).toLowerCase())) {
        this.issues.push({
          severity: 'CRITICAL_ERROR',
          category: 'ENUM_MISMATCH',
          entity: 'notifications',
          documentId: String(n._id),
          message: `Invalid notification type enum "${n.type}". Allowed: ${POSTGRES_ENUMS.ENotificationType.join(', ')}.`
        });
      }
    }
  }

  private validateNullability(data: Record<string, any[]>) {
    // Users required fields: username, email, password
    for (const u of data.users || []) {
      if (!u.username || !String(u.username).trim()) {
        this.issues.push({
          severity: 'CRITICAL_ERROR',
          category: 'NULLABILITY_VIOLATION',
          entity: 'users',
          documentId: String(u._id),
          message: 'User missing required NOT NULL field: username.'
        });
      }
      if (!u.email || !String(u.email).trim()) {
        this.issues.push({
          severity: 'CRITICAL_ERROR',
          category: 'NULLABILITY_VIOLATION',
          entity: 'users',
          documentId: String(u._id),
          message: 'User missing required NOT NULL field: email.'
        });
      }
      if (!u.password || !String(u.password).trim()) {
        this.issues.push({
          severity: 'CRITICAL_ERROR',
          category: 'NULLABILITY_VIOLATION',
          entity: 'users',
          documentId: String(u._id),
          message: 'User missing required NOT NULL field: password.'
        });
      }
    }

    // Courses required fields: title, slug, author
    for (const c of data.courses || []) {
      if (!c.title || !String(c.title).trim()) {
        this.issues.push({
          severity: 'CRITICAL_ERROR',
          category: 'NULLABILITY_VIOLATION',
          entity: 'courses',
          documentId: String(c._id),
          message: 'Course missing required NOT NULL field: title.'
        });
      }
      if (!c.slug || !String(c.slug).trim()) {
        this.issues.push({
          severity: 'CRITICAL_ERROR',
          category: 'NULLABILITY_VIOLATION',
          entity: 'courses',
          documentId: String(c._id),
          message: 'Course missing required NOT NULL field: slug.'
        });
      }
      if (!c.author) {
        this.issues.push({
          severity: 'CRITICAL_ERROR',
          category: 'NULLABILITY_VIOLATION',
          entity: 'courses',
          documentId: String(c._id),
          message: 'Course missing required NOT NULL field: author.'
        });
      }
    }

    // Lessons required fields: title, slug, order, chapter, course, author
    for (const l of data.lessons || []) {
      if (!l.title) {
        this.issues.push({
          severity: 'CRITICAL_ERROR',
          category: 'NULLABILITY_VIOLATION',
          entity: 'lessons',
          documentId: String(l._id),
          message: 'Lesson missing required NOT NULL field: title.'
        });
      }
      if (!l.chapter) {
        this.issues.push({
          severity: 'CRITICAL_ERROR',
          category: 'NULLABILITY_VIOLATION',
          entity: 'lessons',
          documentId: String(l._id),
          message: 'Lesson missing required NOT NULL field: chapter.'
        });
      }
    }
  }

  private validateSpecialTypes(data: Record<string, any[]>) {
    // Check isVerified in Users
    for (const u of data.users || []) {
      const val = u.isVerified;
      if (typeof val !== 'boolean') {
        this.issues.push({
          severity: 'WARNING',
          category: 'FIELD_TYPE_MISMATCH',
          entity: 'users',
          documentId: String(u._id),
          message: `User isVerified has non-boolean value "${val}" (type: ${typeof val}). Normalized to boolean false.`,
          details: { actualValue: val, targetType: 'BOOLEAN', normalizedValue: false }
        });
      }
    }
  }

  private validateCommentTree(comments: any[]): {
    total: number;
    rootCount: number;
    replyCount: number;
    maxDepth: number;
    orphanParents: number;
  } {
    const commentIdSet = new Set(comments.map((c) => String(c._id)));
    let rootCount = 0;
    let replyCount = 0;
    let orphanParents = 0;
    let maxDepth = 0;

    for (const c of comments) {
      const cid = String(c._id);
      const level = c.level ?? 0;
      if (level > maxDepth) maxDepth = level;

      if (!c.parentId) {
        rootCount++;
      } else {
        replyCount++;
        const parentIdStr = String(c.parentId);
        if (!commentIdSet.has(parentIdStr)) {
          orphanParents++;
          this.issues.push({
            severity: 'CRITICAL_ERROR',
            category: 'COMMENT_TREE_ISSUE',
            entity: 'comments',
            documentId: cid,
            message: `Comment parentId "${parentIdStr}" does not exist in comments.`
          });
        }
      }
    }

    return {
      total: comments.length,
      rootCount,
      replyCount,
      maxDepth,
      orphanParents
    };
  }

  private validateSubEntities(data: Record<string, any[]>) {
    let totalFaqs = 0;
    for (const c of data.courses || []) {
      const qaList = c.info?.qa || [];
      totalFaqs += qaList.length;
    }

    let totalOptions = 0;
    for (const q of data.questions || []) {
      const opts = q.options || [];
      totalOptions += opts.length;
    }

    let totalAnswers = 0;
    for (const sub of data.quizsubmissions || []) {
      const answers = sub.answers || [];
      totalAnswers += answers.length;
    }

    this.issues.push({
      severity: 'INFO',
      category: 'SUB_ENTITY_WARNING',
      entity: 'sub_entities',
      message: `SUB-ENTITY ID STRATEGY: INDEX-BASED. Verified count: course_faqs (${totalFaqs}), question_options (${totalOptions}), quiz_submission_answers (${totalAnswers}).`,
      details: { totalFaqs, totalOptions, totalAnswers }
    });
  }
}
