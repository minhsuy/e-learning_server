import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import { generateQRMatrix } from '../src/utils/qrCode'

async function testPdf() {
  const outputPath = path.resolve('scratch_certificate.pdf')
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margin: 30
  })

  const writeStream = fs.createWriteStream(outputPath)
  doc.pipe(writeStream)

  // Register font
  const regularFont = path.resolve('src/assets/fonts/Arial.ttf')
  const boldFont = path.resolve('src/assets/fonts/Arial-Bold.ttf')
  if (fs.existsSync(regularFont)) doc.registerFont('AppFont', regularFont)
  if (fs.existsSync(boldFont)) doc.registerFont('AppFont-Bold', boldFont)

  const width = doc.page.width
  const height = doc.page.height

  // Outer Gold Border
  doc.rect(20, 20, width - 40, height - 40).lineWidth(3).strokeColor('#b45309').stroke()
  // Inner Navy Border
  doc.rect(26, 26, width - 52, height - 52).lineWidth(1).strokeColor('#1e1b4b').stroke()
  // Corner accents
  const cs = 15
  doc.rect(23, 23, cs, cs).lineWidth(0.5).strokeColor('#b45309').stroke()
  doc.rect(width - 23 - cs, 23, cs, cs).lineWidth(0.5).strokeColor('#b45309').stroke()
  doc.rect(23, height - 23 - cs, cs, cs).lineWidth(0.5).strokeColor('#b45309').stroke()
  doc.rect(width - 23 - cs, height - 23 - cs, cs, cs).lineWidth(0.5).strokeColor('#b45309').stroke()

  // Header Title
  doc.font('AppFont-Bold').fontSize(14).fillColor('#1e1b4b').text('HỌC VIỆN ĐÀO TẠO TRỰC TUYẾN TMDEMY', 0, 50, { align: 'center' })
  doc.font('AppFont').fontSize(10).fillColor('#6b7280').text('TMDEMY E-LEARNING ACADEMY • EXCELLENCE IN ONLINE EDUCATION', 0, 68, { align: 'center' })

  // Decorative line
  doc.moveTo(width / 2 - 120, 83).lineTo(width / 2 + 120, 83).lineWidth(1.5).strokeColor('#b45309').stroke()

  // Certificate Heading
  doc.font('AppFont-Bold').fontSize(26).fillColor('#b45309').text('CHỨNG NHẬN TỐT NGHIỆP', 0, 100, { align: 'center' })
  doc.font('AppFont').fontSize(12).fillColor('#374151').text('CERTIFICATE OF COMPLETION', 0, 132, { align: 'center' })

  // Certifies that
  doc.font('AppFont').fontSize(13).fillColor('#4b5563').text('Chứng nhận học viên:', 0, 160, { align: 'center' })

  // Student Name
  doc.font('AppFont-Bold').fontSize(26).fillColor('#1e1b4b').text('Thái Quang Minh', 0, 185, { align: 'center' })
  doc.moveTo(width / 2 - 150, 218).lineTo(width / 2 + 150, 218).lineWidth(0.75).strokeColor('#9ca3af').stroke()

  // Has completed
  doc.font('AppFont').fontSize(13).fillColor('#4b5563').text('Đã hoàn thành xuất sắc khóa học chuyên sâu:', 0, 230, { align: 'center' })

  // Course Title
  doc.font('AppFont-Bold').fontSize(20).fillColor('#4338ca').text('ReactJS Advanced - Update 2025', 0, 252, { align: 'center' })

  // Metadata block (Left-Center)
  const metaLeft = 90
  const metaTop = 320
  doc.font('AppFont').fontSize(12).fillColor('#1f2937')
  doc.text('Điểm tốt nghiệp: ', metaLeft, metaTop, { continued: true })
    .font('AppFont-Bold').fillColor('#059669').text('83.33%')
  
  doc.font('AppFont').fontSize(12).fillColor('#1f2937')
  doc.text('Giảng viên hướng dẫn: ', metaLeft, metaTop + 24, { continued: true })
    .font('AppFont-Bold').fillColor('#1e1b4b').text('ThS. Hoàng Quốc Bảo')

  doc.font('AppFont').fontSize(12).fillColor('#1f2937')
  doc.text('Ngày cấp chứng chỉ: ', metaLeft, metaTop + 48, { continued: true })
    .font('AppFont-Bold').fillColor('#1e1b4b').text('14/10/2026')

  doc.font('AppFont').fontSize(11).fillColor('#6b7280')
  doc.text('Số hiệu chứng chỉ: ', metaLeft, metaTop + 72, { continued: true })
    .font('AppFont-Bold').fillColor('#1e1b4b').text('TMDEMY-CERT-2026-X8K9M2P4')

  // QR Code on right side
  const qrX = width - 200
  const qrY = 310
  const verifyUrl = 'http://localhost:3000/certificates/verify/TMDEMY-CERT-2026-X8K9M2P4'
  const qrMatrix = generateQRMatrix(verifyUrl)
  const moduleSize = 2.4

  for (let r = 0; r < qrMatrix.length; r++) {
    for (let c = 0; c < qrMatrix[r].length; c++) {
      if (qrMatrix[r][c]) {
        doc.rect(qrX + c * moduleSize, qrY + r * moduleSize, moduleSize, moduleSize).fill('#1e1b4b')
      }
    }
  }

  doc.font('AppFont').fontSize(9).fillColor('#4b5563')
    .text('Quét mã để xác thực trực tuyến', qrX - 15, qrY + qrMatrix.length * moduleSize + 8, { width: 120, align: 'center' })

  // Signatures
  const sigY = 460
  doc.font('AppFont-Bold').fontSize(12).fillColor('#1e1b4b')
  doc.text('GIẢNG VIÊN HƯỚNG DẪN', 90, sigY, { width: 200, align: 'center' })
  doc.font('AppFont').fontSize(10).fillColor('#9ca3af')
  doc.text('(Ký và ghi rõ họ tên)', 90, sigY + 16, { width: 200, align: 'center' })

  doc.font('AppFont-Bold').fontSize(12).fillColor('#1e1b4b')
  doc.text('BAN GIÁM ĐỐC TMDEMY', width / 2 - 100, sigY, { width: 200, align: 'center' })
  doc.font('AppFont').fontSize(10).fillColor('#9ca3af')
  doc.text('(Đã xác thực chữ ký số)', width / 2 - 100, sigY + 16, { width: 200, align: 'center' })

  // Footer note
  doc.font('AppFont').fontSize(8).fillColor('#9ca3af')
    .text('Chứng chỉ được cấp theo tiêu chuẩn đào tạo TMDEMY E-Learning. Giá trị xác thực có thể tra cứu tại hệ thống trực tuyến.', 0, height - 42, { align: 'center' })

  doc.end()

  await new Promise((resolve) => writeStream.on('finish', resolve))
  console.log('PDF generated successfully at:', outputPath)
  console.log('File size:', fs.statSync(outputPath).size, 'bytes')
}

testPdf().catch(console.error)
