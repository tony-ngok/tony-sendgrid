import { NextResponse } from "next/server"

export async function GET(request) {
  const client = require("@sendgrid/client")
  client.setApiKey(process.env.SENDGRID_API_KEY)

  const list_id = process.env.crossmap_blogs_clife_prayer_contact_list_id

  const req_body = {
    url: `/v3/marketing/contacts/search`,
    method: "POST",

    body: {
      query: `CONTAINS(list_ids, '${list_id}')`
    }
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
