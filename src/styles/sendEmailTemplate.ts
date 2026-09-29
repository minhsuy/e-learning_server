import dotenv from 'dotenv'

dotenv.config()
export const welcomeEmail = (username: string, otp: string) => {
  return {
    subject: 'Mã xác thực tài khoản E-Learning của bạn 🔐',
    text: `Xin chào ${username}, mã OTP xác thực tài khoản của bạn là: ${otp}. Mã có hiệu lực trong 10 phút.`,
    html: `
      <div style="font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                  padding: 40px 20px; color: #1f2937;">
        <div style="max-width: 600px; margin: auto; background: #ffffff;
                    border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                    overflow: hidden; border: 1px solid rgba(0,0,0,0.05);">

          <!-- Header -->
          <div style="background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
                      padding: 30px 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">
              Nền tảng E-Learning
            </h1>
            <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9;">
              Học tập thông minh, tương lai rạng ngời
            </p>
          </div>

          <!-- Body -->
          <div style="padding: 40px 30px; text-align: center;">
            <h2 style="margin: 0 0 8px; font-size: 22px; font-weight: 600; color: #111827;">
              Xin chào, ${username} 👋
            </h2>
            <p style="font-size: 16px; color: #4b5563; line-height: 1.7; margin-bottom: 28px;">
              Cảm ơn bạn đã đăng ký <b>E-Learning App</b>.<br/>
              Vui lòng dùng mã OTP dưới đây để xác thực tài khoản:
            </p>

            <!-- OTP Box -->
            <div style="display: inline-block; background: #f3f4f6; border: 2px dashed #6366f1;
                        border-radius: 12px; padding: 20px 40px; margin: 0 auto 28px;">
              <span style="font-size: 40px; font-weight: 800; letter-spacing: 12px;
                           color: #4f46e5; font-family: 'Courier New', monospace;">
                ${otp}
              </span>
            </div>

            <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
              Mã OTP có hiệu lực trong <strong>10 phút</strong>.<br/>
              Nếu bạn không tạo tài khoản, vui lòng bỏ qua email này.
            </p>
          </div>

          <!-- Footer -->
          <div style="background: #f8fafc; padding: 20px; text-align: center;
                      font-size: 13px; color: #6b7280; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0;">
              © ${new Date().getFullYear()} Nền tảng E-Learning. Mọi quyền được bảo lưu.
            </p>
          </div>
        </div>
      </div>
    `
  }
}

export const resetPasswordEmail = (resetLink: string) => {
  return {
    subject: '🔑 Đặt lại mật khẩu tài khoản E-Learning',
    text: `Chúng tôi nhận được yêu cầu đặt lại mật khẩu của bạn. Nhấn vào đường link sau để tiếp tục: ${resetLink}`,
    html: `
      <div style="font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); 
                  padding: 40px 20px; color: #1f2937;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; 
                    border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); 
                    overflow: hidden; border: 1px solid rgba(0,0,0,0.05);">
          
          <!-- Header -->
          <div style="background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%); 
                      padding: 30px 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">
              Nền tảng E-Learning
            </h1>
            <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9;">
              Học tập thông minh, tương lai rạng ngời
            </p>
          </div>

          <!-- Body -->
          <div style="padding: 40px 30px;">
            <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 600; 
                      color: #111827; text-align: center;">
              Đặt lại mật khẩu của bạn
            </h2>
            <p style="font-size: 16px; color: #4b5563; line-height: 1.7; margin-bottom: 24px;">
              Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. 
              Nhấn vào nút bên dưới để tạo mật khẩu mới an toàn hơn.
            </p>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetLink}" 
                 style="display: inline-block; background: linear-gradient(45deg, #3b82f6, #60a5fa); 
                        color: #ffffff; padding: 14px 32px; text-decoration: none; 
                        border-radius: 8px; font-size: 16px; font-weight: 600; 
                        transition: transform 0.2s ease, box-shadow 0.2s ease;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                Đặt lại mật khẩu
              </a>
            </div>

            <p style="font-size: 14px; color: #6b7280; line-height: 1.6; text-align: center;">
              Liên kết này sẽ hết hạn sau <strong>15 phút</strong> để đảm bảo an toàn. 
              Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
            </p>
          </div>

          <!-- Footer -->
          <div style="background: #f8fafc; padding: 20px; text-align: center; 
                      font-size: 13px; color: #6b7280; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0;">
              © ${new Date().getFullYear()} Nền tảng E-Learning. Mọi quyền được bảo lưu.
            </p>
            <p style="margin: 8px 0 0;">
              <a href="https://elearning-platform.com/support" 
                 style="color: #3b82f6; text-decoration: none;">Liên hệ hỗ trợ</a> | 
              <a href="https://elearning-platform.com/privacy" 
                 style="color: #3b82f6; text-decoration: none;">Chính sách bảo mật</a>
            </p>
          </div>
        </div>
      </div>
    `
  }
}

export const newCoursePendingEmail = (teacherName: string, courseTitle: string, courseId: string) => {
  return {
    subject: `📚 Khóa học mới chờ duyệt: ${courseTitle}`,
    text: `Teacher ${teacherName} vừa tạo khóa học "${courseTitle}". Vui lòng vào Admin Dashboard để duyệt.`,
    html: `
      <div style="font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%);
                  padding: 40px 20px; color: #1f2937;">
        <div style="max-width: 600px; margin: auto; background: #ffffff;
                    border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                    overflow: hidden; border: 1px solid #e5e7eb;">
          
          <!-- Header -->
          <div style="background: linear-gradient(90deg, #16a34a 0%, #4ade80 100%);
                      padding: 28px 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 700;">
              Nền tảng E-Learning
            </h1>
            <p style="margin: 6px 0 0; font-size: 14px; opacity: 0.9;">
              Khoá học mới đang chờ bạn duyệt
            </p>
          </div>

          <!-- Body -->
          <div style="padding: 32px 28px;">
            <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 600; color: #111827;">
              ${teacherName} vừa đăng một khóa học mới
            </h2>
            <p style="font-size: 16px; color: #374151; line-height: 1.7; margin-bottom: 24px;">
              Khoá học <b>"${courseTitle}"</b> hiện đang ở trạng thái <span style="color:#f59e0b; font-weight:600;">Pending</span>.
              Vui lòng truy cập dashboard để xem chi tiết và phê duyệt.
            </p>

            <div style="text-align: center; margin: 28px 0;">
              <a href="${process.env.ADMIN_DASHBOARD_URL}/courses/${courseId}"
                 style="display: inline-block; background: linear-gradient(45deg, #16a34a, #22c55e);
                        color: #ffffff; padding: 14px 32px; text-decoration: none;
                        border-radius: 8px; font-size: 15px; font-weight: 600;
                        transition: transform 0.2s ease, box-shadow 0.2s ease;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                🔎 Xem chi tiết khóa học
              </a>
            </div>

            <p style="font-size: 14px; color: #6b7280; line-height: 1.6; text-align: center;">
              Hãy duyệt khóa học sớm để học viên có thể tiếp cận nội dung mới.
            </p>
          </div>

          <!-- Footer -->
          <div style="background: #f9fafb; padding: 18px; text-align: center;
                      font-size: 13px; color: #6b7280; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0;">© ${new Date().getFullYear()} E-Learning App. Mọi quyền được bảo lưu.</p>
            <p style="margin: 8px 0 0;">
              <a href="https://elearning-platform.com/support"
                 style="color: #16a34a; text-decoration: none;">Liên hệ hỗ trợ</a>
            </p>
          </div>
        </div>
      </div>
    `
  }
}
