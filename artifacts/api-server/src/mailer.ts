import nodemailer from "nodemailer";

const hasSmtp =
  process.env["EMAIL_HOST"] &&
  process.env["EMAIL_USER"] &&
  process.env["EMAIL_PASS"];

const transporter = hasSmtp
  ? nodemailer.createTransport({
      host: process.env["EMAIL_HOST"],
      port: Number(process.env["EMAIL_PORT"] ?? 587),
      secure: Number(process.env["EMAIL_PORT"] ?? 587) === 465,
      auth: {
        user: process.env["EMAIL_USER"],
        pass: process.env["EMAIL_PASS"],
      },
    })
  : nodemailer.createTransport({ jsonTransport: true });

export async function sendMail(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<void> {
  const from = process.env["EMAIL_FROM"] ?? "noreply@impacctbrooklyn.org";
  try {
    const info = await transporter.sendMail({ from, ...options });
    if (!hasSmtp) {
      console.log("[mailer] SMTP not configured — email logged:", JSON.stringify(info));
    }
  } catch (err) {
    console.error("[mailer] Failed to send email:", err);
  }
}

export async function notifySubmissionStatus(
  submitterEmail: string,
  status: string,
  headline: string,
  adminNotes?: string | null
): Promise<void> {
  if (status === "published") {
    await sendMail({
      to: submitterEmail,
      subject: "Your submission has been published",
      text: `Your submission "${headline}" has been published.\n\n${adminNotes ? `Admin notes: ${adminNotes}` : ""}`,
    });
  } else if (status === "needs_revision") {
    await sendMail({
      to: submitterEmail,
      subject: "Your submission needs revision",
      text: `Your submission "${headline}" needs revision.\n\n${adminNotes ? `Admin notes: ${adminNotes}` : "Please check the portal for details."}`,
    });
  }
}

export async function notifyNewSubmission(
  adminEmail: string,
  headline: string,
  departmentName: string
): Promise<void> {
  await sendMail({
    to: adminEmail,
    subject: "New submission received",
    text: `A new submission "${headline}" has been submitted by the ${departmentName} department. Please review it in the portal.`,
  });
}
