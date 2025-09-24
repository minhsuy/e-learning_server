import nodemailer, { Transporter } from 'nodemailer'
import dotenv from 'dotenv'
import { SendEmailOptions } from '~/types/type'

dotenv.config()

const transporter: Transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_NAME,
    pass: process.env.EMAIL_APP_PASSWORD
  }
})

export const sendEmail = async ({ to, subject, html, text }: SendEmailOptions) => {
  const info = await transporter.sendMail({
    from: `"E-Learning App" <${process.env.EMAIL_NAME}>`,
    to,
    subject,
    text,
    html
  })
}
