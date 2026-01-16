// https://www.twilio.com/docs/sendgrid/api-reference/single-sends/delete-single-send-schedule
// https://www.twilio.com/docs/sendgrid/api-reference/single-sends/bulk-delete-single-sends

import { NextResponse } from "next/server"

export async function DELETE(request) {
  const client = require("@sendgrid/client")
  client.setApiKey(process.env.SENDGRID_API_KEY)

  let request_data
  try {
    request_data = await request.json()
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const ids = request_data.ids
  if (!ids) {
    return NextResponse.json({ error: "Missing required parameter: ids" }, { status: 400 })
  }
  if (!Array.isArray(ids)) {
    return NextResponse.json({ error: "Invalid parameter: ids must be an array" }, { status: 400 })
  }
  if (ids.length === 0) {
    return NextResponse.json({ error: "Invalid parameter: ids array cannot be empty" }, { status: 400 })
  }
  for (let i = 0; i < ids.length; i++) {
    if (typeof ids[i] !== "string" || ids[i].trim() === "") {
      return NextResponse.json({ error: `Invalid parameter: ids[${i}] must be a non-empty string` }, { status: 400 })
    }
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
