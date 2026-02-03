import { NextResponse } from "next/server"

export async function POST(request) {
  let request_data
  try {
    request_data = await request.json()
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const prefix = request_data.prefix || "test_single_send"
  if (typeof prefix !== "string" || prefix.trim() === "") {
    return NextResponse.json({ error: "Invalid parameter: prefix must be a non-empty string" }, { status: 400 })
  }

  const list_id = process.env.crossmap_blogs_clife_prayer_contact_list_id

  const subject = request_data.subject || "Test"
  if (typeof subject !== "string" || subject.trim() === "") {
    return NextResponse.json({ error: "Invalid parameter: subject must be a non-empty string" }, { status: 400 })
  }

  const html_content = request_data.html_content || "<div><span>test content</span></div>"
  if (typeof html_content !== "string" || html_content.trim() === "") {
    return NextResponse.json({ error: "Invalid parameter: html_content must be a non-empty string" }, { status: 400 })
  }

  const send_date = request_data.send_date || ""
  if (typeof send_date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(send_date)) {
    return NextResponse.json({ error: "Invalid parameter: send_date must be in YYYY-MM-DD format" }, { status: 400 })
  }

  const send_time = request_data.send_time || ""
  if (typeof send_time !== "string" || !/^\d{2}:\d{2}:\d{2}$/.test(send_time)) {
    return NextResponse.json({ error: "Invalid parameter: send_time must be in HH:mm:ss format" }, { status: 400 })
  }

  const category = request_data.category || ""
  if (typeof category !== "string") {
    return NextResponse.json({ error: "Invalid parameter: category must be a string" }, { status: 400 })
  }

  const cancel_id = process.env.crossmap_blogs_daily_devotional_sendgrid_unsubscribe_group_id
  const sender_id = process.env.crossmap_blogs_clife_prayer_sendgrid_sender_id

  try {
    const response = await fetch(process.env.PRODUCER_LAMBDA_URL,
      {
        method: "POST",
        body: JSON.stringify({
          sendgrid_api: process.env.SENDGRID_API_KEY,
          queue_url: process.env.SQS_QUEUE_URL,
          prefix, list_id, subject, html_content, send_date, send_time, cancel_id, sender_id
        })
      }
    )
    return NextResponse.json(await response.json(), { status: response.status })
  } catch (error) {
    console.error("SendGrid API Error:", error)
    const status = error.code || 500
    const message = error.response?.body || "Internal Server Error"
    return NextResponse.json({ error: message }, { status })
  }
}
