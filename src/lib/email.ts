import nodemailer from 'nodemailer'

interface EmailConfig {
  host: string
  port: number
  user: string
  pass: string
  from: string
}

export function createTransporter(config: EmailConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  })
}

export async function sendOverdueNotification(
  transporter: nodemailer.Transporter,
  to: string,
  itemName: string,
  memberName: string,
  dueDate: string
) {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to,
    subject: `Overdue Item: ${itemName}`,
    html: `
      <h2>Overdue Equipment Notification</h2>
      <p>Dear ${memberName},</p>
      <p>This is a reminder that the following item was due for return on <strong>${dueDate}</strong>:</p>
      <ul>
        <li><strong>Item:</strong> ${itemName}</li>
        <li><strong>Due Date:</strong> ${dueDate}</li>
      </ul>
      <p>Please return the item as soon as possible or contact the scout group if you need an extension.</p>
      <p>Thank you,<br>1st Fairfield Scout Group</p>
    `,
  }

  await transporter.sendMail(mailOptions)
}
