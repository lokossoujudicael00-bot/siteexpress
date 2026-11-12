import nodemailer from "nodemailer";
export async function sendMail(to: string, subject: string, text: string) {
  const t = nodemailer.createTransport({ service: "gmail", auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD } });
  await t.sendMail({ from: `SiteExpress <${process.env.GMAIL_USER}>`, to, subject, text });
}
