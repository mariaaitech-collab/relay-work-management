const nodemailer = require('nodemailer');
const { Lead } = require('../models/leadModel');

// Public lead capture (Book a Demo / Start Free Trial forms).
// Persists the lead and emails it to the company inbox.
const captureLead = async (req, res) => {
  try {
    const { name, email, company, message, source } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and work email are required.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim();
    const cleanCompany = company ? String(company).trim() : '';
    const cleanSource = source ? String(source).trim() : 'website';

    // Always persist the lead so a submission is never lost, even if email delivery fails.
    const lead = new Lead({
      name: cleanName,
      email: cleanEmail,
      company: cleanCompany,
      message: message ? String(message).trim() : '',
      source: cleanSource
    });
    await lead.save();

    const receivingEmail = process.env.RECEIVING_EMAIL || 'meveryx@gmail.com';
    const submittedAt = new Date();
    const submittedAtPkt = submittedAt.toLocaleString('en-US', { timeZone: 'Asia/Karachi' });
    const subject = `New Demo Request - ${cleanCompany || 'Unknown Company'}`;

    const text = [
      'New Demo Request',
      '',
      `Lead Name: ${cleanName}`,
      `Contact Email: ${cleanEmail}`,
      `Company: ${cleanCompany || '—'}`,
      message ? `Message: ${message}` : '',
      `Source: ${cleanSource}`,
      `Timestamp: ${submittedAtPkt} (PKT)`
    ].filter(Boolean).join('\n');

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;line-height:1.5;">
        <h2 style="margin:0 0 12px;">New Demo Request</h2>
        <p style="margin:4px 0;"><strong>Lead Name:</strong> ${cleanName}</p>
        <p style="margin:4px 0;"><strong>Contact Email:</strong> <a href="mailto:${cleanEmail}">${cleanEmail}</a></p>
        <p style="margin:4px 0;"><strong>Company:</strong> ${cleanCompany || '—'}</p>
        ${message ? `<p style="margin:4px 0;"><strong>Message:</strong> ${message}</p>` : ''}
        <p style="margin:4px 0;"><strong>Source:</strong> ${cleanSource}</p>
        <p style="margin:4px 0;color:#6b7280;"><strong>Timestamp:</strong> ${submittedAtPkt} (PKT)</p>
      </div>`;

    const hasMailCreds = process.env.EMAIL_USER && process.env.EMAIL_PASS;

    if (!hasMailCreds) {
      // No SMTP credentials configured (e.g. local dev). Log the would-be email
      // instead of silently failing so the flow can still be exercised.
      console.warn('[leadController] EMAIL_USER/EMAIL_PASS not set — email not sent (dev fallback). Destination:', receivingEmail);
      console.warn(text);
    } else {
      // Explicit Gmail SMTP transport (avoids host/port mismatch issues).
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: receivingEmail,
          replyTo: cleanEmail,
          subject,
          text,
          html,
        });
      } catch (mailErr) {
        console.log('Nodemailer Error:', mailErr);
        return res.status(500).json({ message: 'We couldn’t send your request. Please try again later.' });
      }
    }

    res.status(201).json({ message: 'Thanks! Our team will reach out shortly to book your demo.' });
  } catch (err) {
    console.error('captureLead error:', err.message);
    res.status(500).json({ message: 'We couldn\'t submit your request. Please try again later.' });
  }
};

module.exports = { captureLead };
