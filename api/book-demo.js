const nodemailer = require('nodemailer');

const normalizeAddressList = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const body = req.body || {};
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  const company = String(body.company || '').trim();
  const designation = String(body.designation || '').trim();
  const subject = String(body.subject || 'Book a demo').trim();
  const intent = String(body.intent || 'book-demo').trim();

  if (!name || !email || !company || !designation) {
    return res.status(400).json({ message: 'Name, email, company, and designation are required.' });
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 465);
  const smtpSecure = String(process.env.SMTP_SECURE || 'true').toLowerCase() === 'true';
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const toEmail = process.env.BOOK_DEMO_TO_EMAIL;
  const ccEmails = normalizeAddressList(process.env.BOOK_DEMO_CC_EMAIL);
  const fromEmail = process.env.BOOK_DEMO_FROM_EMAIL || smtpUser;

  if (!smtpHost || !smtpUser || !smtpPass || !toEmail || !fromEmail) {
    return res.status(500).json({ message: 'SMTP environment variables are not fully configured.' });
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const message = [
    'New CTA lead from the OpsMx vs Wiz page',
    '',
    `Intent: ${intent}`,
    `Name: ${name}`,
    `Email: ${email}`,
    `Company: ${company}`,
    `Designation: ${designation}`,
    '',
    '---',
    '',
    'This request was submitted from the website CTA form.',
  ].join('\n');

  try {
    await transporter.sendMail({
      from: fromEmail,
      to: toEmail,
      cc: ccEmails,
      replyTo: email,
      subject: `${subject} — ${name}`,
      text: message,
      html: `<p><strong>Intent:</strong> ${intent}</p><p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Company:</strong> ${company}</p><p><strong>Designation:</strong> ${designation}</p>`,
    });

    return res.status(200).json({ ok: true, message: 'Email sent successfully.' });
  } catch (error) {
    console.error('SMTP send error:', error);
    return res.status(500).json({ message: 'Failed to send email. Please verify SMTP configuration.' });
  }
};
