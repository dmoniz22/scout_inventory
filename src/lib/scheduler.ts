import { prisma } from "@/lib/db";
import { createTransporter, sendOverdueNotification } from "@/lib/email";

export async function checkAndSendOverdueNotifications() {
  // Only run if email is configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log("Email not configured, skipping overdue notifications");
    return;
  }

  const transporter = createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
  });

  // Find all overdue checkouts where email hasn't been sent
  const overdueCheckouts = await prisma.checkout.findMany({
    where: {
      checkedInAt: null,
      expectedReturn: { lt: new Date() },
      emailSent: false,
      member: {
        email: { not: null },
      },
    },
    include: {
      item: true,
      member: true,
    },
  });

  for (const checkout of overdueCheckouts) {
    if (checkout.member.email) {
      try {
        await sendOverdueNotification(
          transporter,
          checkout.member.email,
          checkout.item.name,
          checkout.member.name,
          new Date(checkout.expectedReturn).toLocaleDateString()
        );

        // Mark email as sent
        await prisma.checkout.update({
          where: { id: checkout.id },
          data: { emailSent: true },
        });

        console.log(`Sent overdue notification to ${checkout.member.email} for ${checkout.item.name}`);
      } catch (error) {
        console.error(`Failed to send notification to ${checkout.member.email}:`, error);
      }
    }
  }
}
