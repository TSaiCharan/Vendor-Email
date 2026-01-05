const fs = require('fs');
const path = require('path');
const { normalizeFile } = require('./examples/applyNormalization');
const { normalizeAiEmail } = require('./utils/formatResponse');

// Example: normalize the stored data file and overwrite it (safe to back up first)
const dataPath = path.join('c:', 'Users', 'sai60', 'Desktop', 'Vendor Email Automate', 'data', '2025-11-07.json');
const raw = fs.readFileSync(dataPath, 'utf8');
const records = JSON.parse(raw);

for (const rec of records) {
	// Normalize fields coming from AI (handles both email_subject/email_body or subject/body)
	const normalized = normalizeAiEmail({ subject: rec.email_subject, body: rec.email_body });
	// Only overwrite if normalized produced something
	if (normalized.subject) rec.email_subject = normalized.subject;
	if (normalized.body) rec.email_body = normalized.body;

	// If you directly send emails after AI response, call normalizeAiEmail(response) and use normalized.body/text
}

// Write back prettified JSON
fs.writeFileSync(dataPath, JSON.stringify(records, null, 2), 'utf8');
console.log('Normalization complete:', dataPath);

async function main() {
	// 1) Run normalization on stored data file
	const dataPath = path.join('c:', 'Users', 'sai60', 'Desktop', 'Vendor Email Automate', 'data', '2025-11-07.json');
	try {
		await normalizeFile(dataPath);
		console.log('Stored records normalized.');
	} catch (err) {
		console.error('Error normalizing stored file:', err);
	}

	// 2) Example: normalize a live AI response before sending email
	const sampleApiResponse = {
		subject: 'Application for Front End Developer (Atlanta GA)',
		body: 'Hello,\\nI am writing to express my interest...\\n-Experience:Java,React'
	};
	const normalized = normalizeAiEmail(sampleApiResponse);
	console.log('Normalized subject:', normalized.subject);
	console.log('Normalized body:\n', normalized.body);

	// Integrate normalized.subject and normalized.body into your mailer (text preserves newlines; for HTML convert \n -> <br>)
}

if (require.main === module) {
	main().catch(err => {
		console.error(err);
		process.exit(1);
	});
}

module.exports = { main };