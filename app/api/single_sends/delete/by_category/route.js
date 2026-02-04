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

  const category = request_data.category
  if (!category) {
    return NextResponse.json({ error: "Missing required parameter: category" }, { status: 400 })
  }
  if (typeof category !== "string" || category.trim() === "") {
    return NextResponse.json({ error: "Invalid parameter: category must be a non-empty string" }, { status: 400 })
  }

  try {
    const response = await fetch(process.env.DELETER_LAMBDA_URL,
      {
        method: "POST",
        body: JSON.stringify({
          sendgrid_api: process.env.SENDGRID_API_KEY,
          queue_url: process.env.SQS_QUEUE_URL,
          category
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
