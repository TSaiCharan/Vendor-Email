const fs = require('fs');
const path = require('path');
const { normalizeAiEmail } = require('../utils/normalizeResponse');

// Example: read the log file and normalize each record
const filePath = path.join('c:', 'Users', 'sai60', 'Desktop', 'Vendor Email Automate', 'data', '2025-11-07.json');
const raw = fs.readFileSync(filePath, 'utf8');
const records = JSON.parse(raw);

records.forEach(rec => {
	// Normalize using helper (handles cases where fields might be already present)
	const normalized = normalizeAiEmail(rec); // will pick up rec.email_subject/email_body
	// Prepare mail payload
	const textBody = normalized.body; // contains real newlines -> suitable for text email
	const htmlBody = textBody.replace(/\n/g, '<br>'); // if you prefer HTML email
	
	// Example with nodemailer (pseudo-code)
	const mailOptions = {
		from: 'you@example.com',
		to: rec.recruiter_email,
		subject: normalized.subject || rec.email_subject || 'Application',
		text: textBody,
		html: htmlBody
	};
	// transporter.sendMail(mailOptions)...
});