// https://www.twilio.com/docs/sendgrid/api-reference/single-sends/create-single-send
// https://www.twilio.com/docs/sendgrid/api-reference/single-sends/schedule-single-send

import { NextResponse } from "next/server"
import moment from "moment"
import "moment-timezone"

function getSendAt(timezone, newsletterSendTime, newsletterSendDate) {
  let localNow = moment.tz(timezone)
  let localDate = localNow.format("YYYY-MM-DD")
  if (localDate < newsletterSendDate) {
    localDate = newsletterSendDate
  }
  let localTime = localNow.format("HH:mm:ss")
  let localDatetime = localDate + " " + localTime
  let localSendAt = localDate + " " + newsletterSendTime

  if (localSendAt < localDatetime) {
    localNow.add(1, "days")
    localDate = localNow.format("YYYY-MM-DD")
    localSendAt = localDate + " " + newsletterSendTime
  }
  console.log(localSendAt, timezone)

  let utcSendAt = moment.tz(localSendAt, timezone)
  return utcSendAt.toISOString()
}

export async function POST(request) {
  const client = require("@sendgrid/client")
  client.setApiKey(process.env.SENDGRID_API_KEY)

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

  const html_content = request_data.html_content || "<div><div><span>test content</span></div></div>"
  if (typeof html_content !== "string" || html_content.trim() === "") {
    return NextResponse.json({ error: "Invalid parameter: html_content must be a non-empty string" }, { status: 400 })
  }

  const send_date = request_data.send_date || "1970-01-01"
  if (typeof send_date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(send_date)) {
    return NextResponse.json({ error: "Invalid parameter: send_date must be in YYYY-MM-DD format" }, { status: 400 })
  }

  const send_time = request_data.send_time || "00:00:00"
  if (typeof send_time !== "string" || !/^\d{2}:\d{2}:\d{2}$/.test(send_time)) {
    return NextResponse.json({ error: "Invalid parameter: send_time must be in HH:mm:ss format" }, { status: 400 })
  }

  const cancel_id = process.env.crossmap_blogs_daily_devotional_sendgrid_unsubscribe_group_id
  const sender_id = process.env.crossmap_blogs_clife_prayer_sendgrid_sender_id

  try {
    const req_body = {
      url: "/v3/marketing/segments",
      method: "GET",
      qs: {
        parent_list_ids: list_id
      }
    }

    const [response, body] = await client.request(req_body)
    if (response.statusCode >= 400) {
      return NextResponse.json({ error: body }, { status: response.statusCode })
    }

    const segments = body.results.filter(item => item.name.startsWith("DEV-"))
    if (!segments?.length) {
      return NextResponse.json({ error: "No segments" }, { status: 404 })
    }

    let return_data = []
    for (const seg of segments) {
      const timezone = seg.name.split("-")[2]
      const send_at = getSendAt(timezone, send_time, send_date)

      const data = {
        name: `${prefix}-${timezone}-${send_at}`,
        send_to: {
          segment_ids: [seg.id]
        },
        email_config: {
          subject: subject,
          html_content: html_content,
          suppression_group_id: parseInt(cancel_id),
          sender_id: parseInt(sender_id)
        }
      }

      const req_body1 = {
        url: "/v3/marketing/singlesends",
        method: "POST",
        body: data
      }

      const [response1, body1] = await client.request(req_body1)
      if (response1.statusCode >= 400) {
        return NextResponse.json({ error: body1 }, { status: response1.statusCode })
      }

      const ssid = body1.id
      const req_body2 = {
        url: `/v3/marketing/singlesends/${ssid}/schedule`,
        method: "PUT",
        body: {
          send_at: send_at
        }
      }

      const [response2, body2] = await client.request(req_body2)
      if (response2.statusCode >= 400) {
        return NextResponse.json({ error: body2 }, { status: response2.statusCode })
      }

      return_data.push(body2)
    }

    return NextResponse.json({ data: return_data }, { status: 200 })
  } catch (error) {
    console.error("SendGrid API Error:", error)
    const status = error.code || 500
    const message = error.response?.body || "Internal Server Error"
    return NextResponse.json({ error: message }, { status })
  }
}
