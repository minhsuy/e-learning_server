import PDFDocument from 'pdfkit'
import cloudinary from 'cloudinary'
import dotenv from 'dotenv'

// Nạp các biến môi trường từ tệp .env
dotenv.config()

// Cấu hình Cloudinary từ CLOUDINARY_URL
cloudinary.v2.config({
  cloudinary_url: process.env.CLOUDINARY_URL // Đọc từ .env
})

export const generateCertificatePDF = async (
  arg1: { userId: string; courseId: string; grade: number } | string,
  arg2?: string,
  arg3?: number
): Promise<string> => {
  const { userId, courseId, grade } =
    typeof arg1 === 'object'
      ? arg1
      : { userId: arg1, courseId: arg2 as string, grade: arg3 as number }

  return new Promise((resolve, reject) => {
    // Tạo tài liệu PDF
    const doc = new PDFDocument()

    // Tạo buffer cho file PDF thay vì lưu vào file hệ thống
    const buffers: Buffer[] = []
    doc.on('data', buffers.push.bind(buffers))
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(buffers)

      // Upload lên Cloudinary
      const params = {
        resource_type: 'raw' as const, // Để upload file không phải hình ảnh (ví dụ: PDF)
        public_id: `certificates/certificate_${userId}_${courseId}`, // Tên file trên Cloudinary
        folder: 'certificates', // Lưu trong thư mục certificates
        format: 'pdf', // Định dạng là PDF
        body: pdfBuffer, // Dữ liệu file PDF
        content_type: 'application/pdf' // Đảm bảo content type là PDF
      }

      // Upload file lên Cloudinary
      cloudinary.v2.uploader
        .upload_stream(params, (error, result) => {
          if (error) {
            console.error('Error uploading file to Cloudinary', error)
            reject(new Error('Failed to upload PDF to Cloudinary'))
          } else if (result && result.secure_url) {
            console.log('File uploaded to Cloudinary', result.secure_url)
            resolve(result.secure_url) // Trả về URL cho người dùng
          } else {
            resolve(`https://res.cloudinary.com/tmdemy/raw/upload/certificates/certificate_${userId}_${courseId}.pdf`)
          }
        })
        .end(pdfBuffer)
    })

    // Thêm nội dung vào chứng chỉ PDF
    doc.fontSize(20).text('Certificate of Completion', { align: 'center' })
    doc.fontSize(14).text(`This certifies that`, { align: 'center' })
    doc.fontSize(16).text(`User ID: ${userId} has completed the course ${courseId}`, { align: 'center' })
    doc.fontSize(12).text(`Grade: ${grade}%`, { align: 'center' })
    doc.text('Date of Issue: ' + new Date().toLocaleDateString(), { align: 'center' })

    // Kết thúc PDF
    doc.end()
  })
}
