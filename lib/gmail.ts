import nodemailer from "nodemailer"

export interface EmailOptions {
  to: string
  subject: string
  body: string
  attachmentPath?: string
}

export async function sendEmail({ to, subject, body, attachmentPath }: EmailOptions) {
  try {
    // Create transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })

    // Prepare email options
    const mailOptions: any = {
      from: process.env.GMAIL_USER,
      to,
      subject,
      text: body,
      html: body.replace(/\n/g, "<br>"),
    }

    // Add attachment if provided
    if (attachmentPath) {
      mailOptions.attachments = [
        {
          filename: attachmentPath.split("/").pop() || "resume.pdf",
          path: attachmentPath,
        },
      ]
    }

    // Send email
    const info = await transporter.sendMail(mailOptions)

    console.log("[v0] Email sent successfully:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("[v0] Error sending email:", error)
    throw error
  }
}
