const fs = require('fs');
const path = require('path');
const { normalizeAiEmail } = require('../utils/formatResponse');

function normalizeFile(dataPath) {
	const raw = fs.readFileSync(dataPath, 'utf8');
	const records = JSON.parse(raw);

	console.log(dataPath)

	for (const rec of records) {
		const normalized = normalizeAiEmail({ subject: rec.email_subject, body: rec.email_body });
		if (normalized.subject) rec.email_subject = normalized.subject;
		if (normalized.body) rec.email_body = normalized.body;
	}

	fs.writeFileSync(dataPath, JSON.stringify(records, null, 2), 'utf8');
	return records;
}

// CLI invocation when run directly
if (require.main === module) {
	const dataPath = path.join('c:', 'Users', 'sai60', 'Desktop', 'Vendor Email Automate', 'data', '2025-11-07.json');
	try {
		const updated = normalizeFile(dataPath);
		console.log('Normalization complete:', dataPath);
	} catch (err) {
		console.error('Normalization failed:', err);
		process.exit(1);
	}
}

module.exports = { normalizeFile };