// New helper: normalize and prettify AI email subject/body

function ensureString(v) {
	// ...existing code...
	return v === undefined || v === null ? '' : String(v);
}

function unescapeNewlines(s) {
	if (!s) return s;
	// Convert literal two-character sequences "\\n" into actual newlines ("\n") and normalize CRLF
	return s.replace(/\\n/g, '\n').replace(/\r\n/g, '\n');
}

function fixMissingSpaces(s) {
	if (!s) return s;
	// Add a space after punctuation when glued to the next word
	s = s.replace(/([.,;:!?])([^\s0-9\)\]\}])/g, '$1 $2');
	// Ensure dash bullets have a space ("-Text" -> "- Text")
	s = s.replace(/(^|\n)[ \t]*-[ \t]*([^\s])/g, '$1- $2');
	// Collapse multiple spaces/tabs but preserve newlines
	s = s.replace(/[ \t]+/g, ' ');
	// Normalize spaces around newlines and trim trailing spaces on lines
	s = s.replace(/[ \t]*\n[ \t]*/g, '\n');
	// Collapse excessive blank lines to maximum one empty line
	s = s.replace(/\n{3,}/g, '\n\n');
	return s.trim();
}

function normalizeAiEmail(raw) {
	let obj = {};
	if (typeof raw === 'string') {
		try {
			obj = JSON.parse(raw);
		} catch (e) {
			obj = { subject: '', body: raw };
		}
	} else if (typeof raw === 'object' && raw !== null) {
		obj = raw;
	}

	const subject = ensureString(obj.subject || obj.email_subject || '');
	const body = ensureString(obj.body || obj.email_body || '');

	const preparedSubject = fixMissingSpaces(unescapeNewlines(subject));
	const preparedBody = fixMissingSpaces(unescapeNewlines(body));

	return {
		subject: preparedSubject,
		body: preparedBody
	};
}

module.exports = {
	normalizeAiEmail
};