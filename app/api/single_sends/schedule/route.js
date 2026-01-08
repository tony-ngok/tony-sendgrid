// https://www.twilio.com/docs/sendgrid/api-reference/single-sends/create-single-send
// https://www.twilio.com/docs/sendgrid/api-reference/single-sends/schedule-single-send

import { NextResponse } from "next/server"

export async function POST(request) {
  const client = require("@sendgrid/client")
  client.setApiKey(process.env.SENDGRID_API_KEY)

  const request_data = await request.json()
  const segment_id = request_data.segment_id || "74247496-2992-4822-abde-f9b246847d10"
  const subject = request_data.subject || "Test"
  const html_content = request_data.html_content || "<div><div><span>test content</span></div></div>"
  const send_at = request_data.send_at || "1970-01-01T00:00:00Z"

  const cancel_id = process.env.crossmap_blogs_daily_devotional_sendgrid_unsubscribe_group_id
  const sender_id = process.env.crossmap_blogs_clife_prayer_sendgrid_sender_id

  const data = {
    name: "test_single_send",
    send_to: {
      segment_ids: [segment_id]
    },
    email_config: {
      subject: subject,
      html_content: html_content,
      suppression_group_id: parseInt(cancel_id),
      sender_id: parseInt(sender_id)
    }
  }

  try {
    const req_body = {
      url: "/v3/marketing/singlesends",
      method: "POST",
      body: data
    }
    console.log(data)

    const [response, body] = await client.request(req_body)
    if (response.statusCode >= 400) {
      return NextResponse.json({ error: body }, { status: response.statusCode })
    }

    const ssid = body.id
    const req_body1 = {
      url: `/v3/marketing/singlesends/${ssid}/schedule`,
      method: "PUT",
      body: {
        send_at: send_at
      }
    }

    const [response1, body1] = await client.request(req_body1)
    if (response1.statusCode >= 400) {
      return NextResponse.json({ error: body1 }, { status: response1.statusCode })
    }

    return NextResponse.json({ data: body1 }, { status: 200 })
  } catch (error) {
    console.error("SendGrid API Error:", error)
    const status = error.code || 500
    const message = error.response?.body || "Internal Server Error"
    return NextResponse.json({ error: message }, { status })
  }
}
