import PDFDocument from 'pdfkit'
import cloudinary from 'cloudinary'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { generateQRMatrix } from './qrCode'

dotenv.config()

cloudinary.v2.config({
  cloudinary_url: process.env.CLOUDINARY_URL
})

export interface GenerateCertificateOptions {
  userId: string
  courseId: string
  grade: number
  studentName?: string
  courseTitle?: string
  instructorName?: string
  certificateCode?: string
  verificationUrl?: string
  issuedAt?: Date
}

function getCloudName(): string {
  const url = process.env.CLOUDINARY_URL || ''
  const match = url.match(/@([^/?#]+)/)
  return match ? match[1] : 'dxostp23y'
}

export const generateCertificatePDF = async (
  arg1: GenerateCertificateOptions | string,
  arg2?: string,
  arg3?: number
): Promise<string> => {
  const opts: GenerateCertificateOptions =
    typeof arg1 === 'object' ? arg1 : { userId: arg1, courseId: arg2 as string, grade: arg3 as number }

  const {
    userId,
    courseId,
    grade,
    studentName = `User ${userId.slice(0, 8)}`,
    courseTitle = `Khóa học TMdemy #${courseId.slice(0, 8)}`,
    instructorName = 'Ban Giảng Huấn TMdemy',
    certificateCode = `TMDEMY-CERT-${new Date().getFullYear()}-${userId.slice(0, 8).toUpperCase()}`,
    verificationUrl = `${process.env.URL_CLIENT || 'http://localhost:3000'}/certificates/verify/${certificateCode}`,
    issuedAt = new Date()
  } = opts

  return new Promise((resolve, reject) => {
    // Landscape A4 (841.89 x 595.28 pt)
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 30
    })

    // Register Unicode TTF Font
    let fontRegular = 'Helvetica'
    let fontBold = 'Helvetica-Bold'

    const localRegular = path.resolve('src/assets/fonts/Arial.ttf')
    const localBold = path.resolve('src/assets/fonts/Arial-Bold.ttf')
    const sysRegular = 'C:\\Windows\\Fonts\\arial.ttf'
    const sysBold = 'C:\\Windows\\Fonts\\arialbd.ttf'

    if (fs.existsSync(localRegular) && fs.existsSync(localBold)) {
      doc.registerFont('AppFont', localRegular)
      doc.registerFont('AppFont-Bold', localBold)
      fontRegular = 'AppFont'
      fontBold = 'AppFont-Bold'
    } else if (fs.existsSync(sysRegular) && fs.existsSync(sysBold)) {
      doc.registerFont('AppFont', sysRegular)
      doc.registerFont('AppFont-Bold', sysBold)
      fontRegular = 'AppFont'
      fontBold = 'AppFont-Bold'
    }

    const buffers: Buffer[] = []
    doc.on('data', buffers.push.bind(buffers))

    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(buffers)
      const cloudName = getCloudName()
      const publicId = `certificates/certificate_${userId}_${courseId}`

      // Upload options to Cloudinary
      const params = {
        resource_type: 'raw' as const,
        public_id: publicId,
        format: 'pdf',
        overwrite: true
      }

      cloudinary.v2.uploader
        .upload_stream(params, (error, result) => {
          if (error) {
            console.error('Error uploading certificate to Cloudinary:', error)
            // Fallback URL with actual cloud name
            resolve(`https://res.cloudinary.com/${cloudName}/raw/upload/${publicId}.pdf`)
          } else if (result && result.secure_url) {
            resolve(result.secure_url)
          } else {
            resolve(`https://res.cloudinary.com/${cloudName}/raw/upload/${publicId}.pdf`)
          }
        })
        .end(pdfBuffer)
    })

    const width = doc.page.width
    const height = doc.page.height

    // 1. Borders
    // Outer Gold Border
    doc
      .rect(20, 20, width - 40, height - 40)
      .lineWidth(3)
      .strokeColor('#b45309')
      .stroke()
    // Inner Navy Border
    doc
      .rect(26, 26, width - 52, height - 52)
      .lineWidth(1)
      .strokeColor('#1e1b4b')
      .stroke()
    // Corner accent squares
    const cs = 15
    doc.rect(23, 23, cs, cs).lineWidth(0.5).strokeColor('#b45309').stroke()
    doc
      .rect(width - 23 - cs, 23, cs, cs)
      .lineWidth(0.5)
      .strokeColor('#b45309')
      .stroke()
    doc
      .rect(23, height - 23 - cs, cs, cs)
      .lineWidth(0.5)
      .strokeColor('#b45309')
      .stroke()
    doc
      .rect(width - 23 - cs, height - 23 - cs, cs, cs)
      .lineWidth(0.5)
      .strokeColor('#b45309')
      .stroke()

    // 2. Header
    doc
      .font(fontBold)
      .fontSize(14)
      .fillColor('#1e1b4b')
      .text('HỌC VIỆN ĐÀO TẠO TRỰC TUYẾN TMDEMY', 0, 48, { align: 'center' })
    doc
      .font(fontRegular)
      .fontSize(10)
      .fillColor('#6b7280')
      .text('TMDEMY E-LEARNING ACADEMY • EXCELLENCE IN ONLINE EDUCATION', 0, 66, { align: 'center' })

    // Decorative line
    doc
      .moveTo(width / 2 - 120, 81)
      .lineTo(width / 2 + 120, 81)
      .lineWidth(1.5)
      .strokeColor('#b45309')
      .stroke()

    // 3. Certificate Heading
    doc.font(fontBold).fontSize(26).fillColor('#b45309').text('CHỨNG NHẬN TỐT NGHIỆP', 0, 96, { align: 'center' })
    doc
      .font(fontRegular)
      .fontSize(12)
      .fillColor('#374151')
      .text('CERTIFICATE OF COMPLETION', 0, 128, { align: 'center' })

    // 4. Student Name
    doc.font(fontRegular).fontSize(13).fillColor('#4b5563').text('Chứng nhận học viên:', 0, 156, { align: 'center' })
    doc.font(fontBold).fontSize(26).fillColor('#1e1b4b').text(studentName, 0, 180, { align: 'center' })
    doc
      .moveTo(width / 2 - 160, 212)
      .lineTo(width / 2 + 160, 212)
      .lineWidth(0.75)
      .strokeColor('#9ca3af')
      .stroke()

    // 5. Course Completion
    doc
      .font(fontRegular)
      .fontSize(13)
      .fillColor('#4b5563')
      .text('Đã hoàn thành xuất sắc khóa học chuyên sâu:', 0, 224, { align: 'center' })
    doc.font(fontBold).fontSize(20).fillColor('#4338ca').text(courseTitle, 0, 246, { align: 'center' })

    // 6. Metadata Details (Left block)
    const metaLeft = 90
    const metaTop = 310
    const dateStr = new Date(issuedAt).toLocaleDateString('vi-VN')

    doc.font(fontRegular).fontSize(12).fillColor('#1f2937')
    doc
      .text('Điểm tốt nghiệp: ', metaLeft, metaTop, { continued: true })
      .font(fontBold)
      .fillColor('#059669')
      .text(`${grade}%`)

    doc.font(fontRegular).fontSize(12).fillColor('#1f2937')
    doc
      .text('Ngày cấp chứng chỉ: ', metaLeft, metaTop + 28, { continued: true })
      .font(fontBold)
      .fillColor('#1e1b4b')
      .text(dateStr)

    doc.font(fontRegular).fontSize(11).fillColor('#6b7280')
    doc
      .text('Số hiệu chứng chỉ: ', metaLeft, metaTop + 56, { continued: true })
      .font(fontBold)
      .fillColor('#1e1b4b')
      .text(certificateCode)

    // 7. QR Code (Right block)
    const qrX = width - 190
    const qrY = 300
    try {
      const qrMatrix = generateQRMatrix(verificationUrl)
      const moduleSize = 2.2
      for (let r = 0; r < qrMatrix.length; r++) {
        for (let c = 0; c < qrMatrix[r].length; c++) {
          if (qrMatrix[r][c]) {
            doc.rect(qrX + c * moduleSize, qrY + r * moduleSize, moduleSize, moduleSize).fill('#1e1b4b')
          }
        }
      }
      doc
        .font(fontRegular)
        .fontSize(8.5)
        .fillColor('#4b5563')
        .text('Quét mã để xác thực trực tuyến', qrX - 20, qrY + qrMatrix.length * moduleSize + 6, {
          width: 120,
          align: 'center'
        })
    } catch (e) {
      // Fallback text if QR encoding has issue
      doc
        .font(fontRegular)
        .fontSize(9)
        .fillColor('#4b5563')
        .text(`Xác thực: ${verificationUrl}`, qrX - 40, qrY + 30, { width: 160, align: 'center' })
    }

    // 8. Signatures area: HỆ THỐNG TMDEMY - Ký TM
    const sigY = 445
    const sigX = width - 260
    doc.font(fontBold).fontSize(12).fillColor('#1e1b4b')
    doc.text('HỆ THỐNG TMDEMY', sigX, sigY, { width: 180, align: 'center' })

    // Bordered signature box: Ký TM
    doc
      .rect(sigX + 50, sigY + 18, 80, 24)
      .lineWidth(1)
      .dash(3, { space: 2 })
      .strokeColor('#059669')
      .stroke()
    doc.undash()

    doc.font(fontBold).fontSize(11).fillColor('#059669')
    doc.text('Ký TM', sigX, sigY + 24, { width: 180, align: 'center' })

    doc.font(fontRegular).fontSize(9).fillColor('#6b7280')
    doc.text('(Đã xác thực chữ ký điện tử)', sigX, sigY + 48, { width: 180, align: 'center' })

    // 9. Footer Note
    doc
      .font(fontRegular)
      .fontSize(8)
      .fillColor('#9ca3af')
      .text(
        'Chứng chỉ được cấp theo tiêu chuẩn đào tạo TMDEMY E-Learning. Giá trị xác thực có thể tra cứu tại hệ thống trực tuyến.',
        0,
        height - 38,
        { align: 'center' }
      )

    doc.end()
  })
}
