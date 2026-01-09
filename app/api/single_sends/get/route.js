// https://www.twilio.com/docs/sendgrid/api-reference/single-sends/get-single-send-by-id

import { NextResponse } from "next/server"

export async function GET(request) {
  const searchParams = request.nextUrl.searchParams

  const id = searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "Invalid single send id" }, { status: 400 })
  }

  const client = require("@sendgrid/client")
  client.setApiKey(process.env.SENDGRID_API_KEY)

  const req_body = {
    url: `/v3/marketing/singlesends/${id}`,
    method: "GET"
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
