import { z } from "zod"

const emailSchema = z.object({
  subject: z.string().describe("A concise, professional email subject line"),
  body: z.string().describe("A personalized, professional email body"),
})

async function callOpenAI(prompt: string, apiKey?: string) {
  const key = apiKey || process.env.OPENAI_API_KEY
  if (!key) {
    throw new Error('OPENAI_API_KEY is not set in the environment')
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant that outputs valid JSON with two fields: subject and body." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  })

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`OpenAI API error: ${res.status} ${txt}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('No content from OpenAI')
  return content
}

export async function POST(req: Request) {
  try {
    const { jobDescription, aiPrompt, resumeContent, openai_api_key } = await req.json()

    // Build a clear user prompt asking for JSON output
    const prompt = `${aiPrompt}

Job Description:
${jobDescription}

Resume Content:
${resumeContent}

Please respond ONLY with a JSON object with two fields: "subject" and "body". The "subject" should be a concise professional subject line. The "body" should be a personalized professional email body.`

    const raw = await callOpenAI(prompt, openai_api_key)

    // Try to parse JSON from the model output. Models sometimes include surrounding text,
    // so extract the first JSON object block if direct parse fails.
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch (e) {
      const match = raw.match(/\{[\s\S]*\}/)
      if (match) {
        parsed = JSON.parse(match[0])
      } else {
        throw new Error('Failed to parse JSON from AI response')
      }
    }

    const result = emailSchema.parse(parsed)

    return Response.json({
      success: true,
      subject: result.subject,
      body: result.body,
    })
  } catch (error) {
    console.error("[v0] Error generating email:", error)
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate email",
      },
      { status: 500 },
    )
  }
}
