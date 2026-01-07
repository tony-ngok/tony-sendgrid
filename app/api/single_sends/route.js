import { NextResponse } from "next/server"

export async function POST(request) {
  const client = require("@sendgrid/client")
  client.setApiKey(process.env.SENDGRID_API_KEY)

  const request_data = await request.json()

  const send_at = request_data.send_at || "1970-01-01T00:00:00Z"
  const subject = request_data.subject || "Test"
  const plain_content = request_data.plain_content || "test content"
  const list_id = process.env.crossmap_blogs_clife_prayer_contact_list_id

  const data = {
    name: "test_single_send",
    send_at: send_at,
    send_to: {
      "list_ids": [list_id]
    },
    email_config: {
      subject: subject,
      plain_content: plain_content
    }
  }

  const req_body = {
    url: "/v3/marketing/singlesends",
    method: "POST",
    body: data
  }

  try {
    const [response, body] = await client.request(req_body)

    if (response.statusCode >= 400) {
      return NextResponse.json({ error: body }, { status: response.statusCode })
    }

    return NextResponse.json({ data: body }, { status: 200 })
  } catch (error) {
    console.error("SendGrid API Error:", error)
    const status = error.code || 500
    const message = error.response?.body || "Internal Server Error"
    return NextResponse.json({ error: message }, { status })
  }
}
