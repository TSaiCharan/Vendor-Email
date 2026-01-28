import { sendEmail } from "@/lib/gmail"

export async function POST(req: Request) {
  try {
    const { to, subject, body, attachmentPath, gmail_user, gmail_app_password } = await req.json()

    const result = await sendEmail({
      to,
      subject,
      body,
      attachmentPath,
      gmail_user,
      gmail_app_password,
    })

    return Response.json({
      success: true,
      messageId: result.messageId,
    })
  } catch (error) {
    console.error("[v0] Error in send-email route:", error)
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send email",
      },
      { status: 500 },
    )
  }
}
