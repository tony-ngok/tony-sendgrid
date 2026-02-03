// https://www.twilio.com/docs/sendgrid/api-reference/single-sends/get-single-sends-search

import { NextResponse } from "next/server"

export async function GET(request) {
  const searchParams = request.nextUrl.searchParams

  const category = searchParams.get("category")
  if (!category) {
    return NextResponse.json({ error: "Missing required parameter: category" }, { status: 400 })
  }
  if (typeof category !== "string" || category.trim() === "") {
    return NextResponse.json({ error: "Invalid parameter: category must be a non-empty string" }, { status: 400 })
  }

  const client = require("@sendgrid/client")
  client.setApiKey(process.env.SENDGRID_API_KEY)

  try {
    let allResults = []
    let pageToken = null
    let totalCount = 0

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
        allResults = allResults.concat(body.result)
      }

      // 获取下一页的 token
      if (body._metadata && body._metadata.next) {
        const nextUrl = new URL(body._metadata.next)
        pageToken = nextUrl.searchParams.get("page_token")
      } else {
        pageToken = null
      }
      // 保存总数
      if (body._metadata && body._metadata.count) {
        totalCount = body._metadata.count
      }
    } while (pageToken)
    return NextResponse.json({
      data: {
        result: allResults,
        _metadata: {
          count: totalCount,
          retrieved: allResults.length
        }
      }
    }, { status: 200 })
  } catch (error) {
    console.error("SendGrid API Error:", error)
    const status = error.code || 500
    const message = error.response?.body || "Internal Server Error"
    return NextResponse.json({ error: message }, { status })
  }
}
