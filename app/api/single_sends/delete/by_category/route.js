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

  const category = request_data.category
  if (!category) {
    return NextResponse.json({ error: "Missing required parameter: category" }, { status: 400 })
  }
  if (typeof category !== "string" || category.trim() === "") {
    return NextResponse.json({ error: "Invalid parameter: category must be a non-empty string" }, { status: 400 })
  }

  try {
    let allSSOIds = []
    let pageToken = null

    // 循环获取所有分页结果
    do {
      let req_body = {
        url: "/v3/marketing/singlesends/search",
        method: "POST",
        body: {
          categories: [category],
        }
      }
      if (pageToken) {
        req_body = {
          ...req_body,
          qs: { page_token: pageToken }
        }
      }

      const [response, body] = await client.request(req_body)
      if (response.statusCode >= 400) {
        return NextResponse.json({ error: body }, { status: response.statusCode })
      }

      // 合并结果
      if (body.result && Array.isArray(body.result)) {
        allSSOIds = allSSOIds.concat(body.result.map((r) => r.id))
      }

      // 获取下一页的 token
      if (body._metadata && body._metadata.next) {
        const nextUrl = new URL(body._metadata.next)
        pageToken = nextUrl.searchParams.get("page_token")
      } else {
        pageToken = null
      }
    } while (pageToken)

    if (allSSOIds.length === 1) {
      const req_body1 = {
        url: `/v3/marketing/singlesends/${allSSOIds[0]}`,
        method: "DELETE",
      }
      const [response1, body1] = await client.request(req_body1)
      if (response1.statusCode >= 400) {
        return NextResponse.json({ error: body1 }, { status: response1.statusCode })
      }
      return NextResponse.json({
        data: "success",
        message: "Successfully deleted 1 single send"
      }, { status: 200 })
    }

    const BATCH_SIZE = 50
    const batches = []
    for (let i = 0; i < allSSOIds.length; i += BATCH_SIZE) {
      batches.push(allSSOIds.slice(i, i + BATCH_SIZE))
    }

    const results = []
    for (const batch of batches) {
      const req_body1 = {
        url: "/v3/marketing/singlesends",
        method: "DELETE",
        qs: {
          ids: batch.toString()
        }
      }

      const [response1, body1] = await client.request(req_body1)
      results.push({ statusCode: response1.statusCode, body: body1 })

      // If any batch fails, return error immediately
      if (response1.statusCode >= 400) {
        return NextResponse.json({
          error: body1,
          message: `Failed to delete batch. Processed ${results.length - 1} of ${batches.length} batches successfully before error.`
        }, { status: response1.statusCode })
      }
    }

    return NextResponse.json({
      data: "success",
      message: `Successfully deleted ${allSSOIds.length} single sends in ${batches.length} batch(es)`
    }, { status: 200 })
  } catch (error) {
    console.error("SendGrid API Error:", error)
    const status = error.code || 500
    const message = error.response?.body || "Internal Server Error"
    return NextResponse.json({ error: message }, { status })
  }
}
