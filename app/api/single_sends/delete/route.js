// https://www.twilio.com/docs/sendgrid/api-reference/single-sends/delete-single-send-schedule

export async function DELETE() {
  const client = require("@sendgrid/client")
  client.setApiKey(process.env.SENDGRID_API_KEY)


}
