# tony-sendgrid

这是一个 Sendgrid（Email 订阅与传送系统）的练习专案。

本专案为纯 API，无前端界面，需配合 [Postman](https://www.postman.com/downloads/) 等 API 请求发送平台使用。

## 如何在本地执行
1. 确保已经安装 Node.js 22+
2. 新增一个 `.env`（环境变量），按照 `.env.example` 的格式填写所需环境变量
3. 执行 `npm install`，完成后执行 `npm run build`
4. 执行 `npm run dev` 启动

## 请求示例
- 列举所有发送段（segment）：`GET localhost:3002/api/segments`
- 排程发送：`POST localhost:3002/api/single_sends/schedule`
    - 请求承载（粗体为必填）：
        - `prefix`：单次发送名称前缀
        - `subject`：电子邮件题目
        - `html_content`：电子邮件 HTML 内容
        - **`send_date`：排程日期（YYYY-MM-DD 格式；以发送段对应本地时区为准）**
        - **`send_time`：排程时间（HH:mm:SS 格式；以发送段对应本地时区为准，若小于当前本地时间，则排程日期加一天）**
    - 请求承载示例：
        ```json
        {
            "prefix": "test_single_send",
            "subject": "Test",
            "html_content": "<div><span>test content</span></div>",
            "send_date": "2026-01-16",
            "send_time": "14:50:00"
        }
        ```
    - 若请求成功，则会于每个发送段排程发送，会返回一个阵列，包含每个发送段的单次发送 `ssid` 及排程日期时间；请记住这些 `ssid` 以便日后查询或删除
- 删除单次发送：`DELETE localhost:3002/api/single_sends/delete`
    - 请求承载（必填）：
        - **`ids`：包含要删除单次发送 `ssid` 的阵列（每个 `ssid` 仅能对应一个发送段）**
- 若在本地执行，则 API 请求 URL 根部改为 `localhost:3002`