// https://www.twilio.com/docs/sendgrid/api-reference/single-sends/delete-single-send-schedule
// https://www.twilio.com/docs/sendgrid/api-reference/single-sends/bulk-delete-single-sends

import { NextResponse } from "next/server"

export async function DELETE(request) {
  const client = require("@sendgrid/client")
  client.setApiKey(process.env.SENDGRID_API_KEY)

  const request_data = await request.json()
  const ids = request_data.ids || []
  if (!(ids && Array.isArray(ids) && ids?.length)) {
    return NextResponse.json({ error: "Invalid ids" }, { status: 400 })
  }

  try {
    let req_body
    if (ids.length === 1) {
      req_body = {
        url: `/v3/marketing/singlesends/${ids[0]}`,
        method: "DELETE",
      }
    } else {
      req_body = {
        url: "/v3/marketing/singlesends",
        method: "DELETE",
        qs: {
          ids: [...ids].toString()
        }
      }
    }

    const [response, body] = await client.request(req_body)
    if (response.statusCode >= 400) {
      return NextResponse.json({ error: body }, { status: response.statusCode })
    }

    return NextResponse.json({ data: "success" }, { status: 200 })
  } catch (error) {
    console.error("SendGrid API Error:", error)
    const status = error.code || 500
    const message = error.response?.body || "Internal Server Error"
    return NextResponse.json({ error: message }, { status })
  }
}
