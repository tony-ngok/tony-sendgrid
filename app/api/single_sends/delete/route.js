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

  let ids = request_data.ids
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

  const ids_set = new Set(ids)
  ids = [...ids_set]

  try {
    if (ids.length === 1) {
      const req_body = {
        url: `/v3/marketing/singlesends/${ids[0]}`,
        method: "DELETE",
      }
      const [response, body] = await client.request(req_body)
      if (response.statusCode >= 400) {
        return NextResponse.json({ error: body }, { status: response.statusCode })
      }
      return NextResponse.json({
        data: "success",
        message: "Successfully deleted 1 single send"
      }, { status: 200 })
    }

    const BATCH_SIZE = 50
    const batches = []

    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      batches.push(ids.slice(i, i + BATCH_SIZE))
    }

    const results = []
    for (const batch of batches) {
      const req_body = {
        url: "/v3/marketing/singlesends",
        method: "DELETE",
        qs: {
          ids: batch.toString()
        }
      }

      const [response, body] = await client.request(req_body)
      results.push({ statusCode: response.statusCode, body })

      // If any batch fails, return error immediately
      if (response.statusCode >= 400) {
        return NextResponse.json({
          error: body,
          message: `Failed to delete batch. Processed ${results.length - 1} of ${batches.length} batches successfully before error.`
        }, { status: response.statusCode })
      }
    }

    return NextResponse.json({
      data: "success",
      message: `Successfully deleted ${ids.length} single sends in ${batches.length} batch(es)`
    }, { status: 200 })
  } catch (error) {
    console.error("SendGrid API Error:", error)
    const status = error.code || 500
    const message = error.response?.body || "Internal Server Error"
    return NextResponse.json({ error: message }, { status })
  }
}
