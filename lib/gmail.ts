import nodemailer from "nodemailer"

export interface EmailOptions {
  to: string
  subject: string
  body: string
  attachmentPath?: string
  gmail_user?: string
  gmail_app_password?: string
}

export async function sendEmail({ to, subject, body, attachmentPath, gmail_user, gmail_app_password }: EmailOptions) {
  try {
    // Use provided credentials or fall back to environment variables
    const user = gmail_user || process.env.GMAIL_USER
    const pass = gmail_app_password || process.env.GMAIL_APP_PASSWORD

    if (!user || !pass) {
      throw new Error("Gmail credentials are not configured")
    }

    // Create transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user,
        pass,
      },
    })

    // Prepare email options
    const mailOptions: any = {
      from: user,
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
