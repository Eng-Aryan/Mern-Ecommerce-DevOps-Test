import nodemailer from 'nodemailer';

export const mailEnabled = () => Boolean(process.env.SMTP_HOST);

let transport;

// Sends through SMTP when SMTP_HOST is set; otherwise prints the email to the
// server console so development works without any mail account.
export const sendMail = async ({ to, subject, html, text }) => {
  if (!to) return false;
  if (!mailEnabled()) {
    console.log(`\n[mail not configured] To: ${to}\nSubject: ${subject}\n${text || ''}\n`);
    return false;
  }
  try {
    const port = Number(process.env.SMTP_PORT) || 587;
    transport ||= nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
    await transport.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@localhost', to, subject, html, text });
    return true;
  } catch (err) {
    console.error('Email failed:', err.message);
    return false;
  }
};
