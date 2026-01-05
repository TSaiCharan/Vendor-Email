// New helper: normalize AI response so "\n" is preserved as real newlines.

function ensureString(v) {
	// ...existing code...
	return typeof v === 'string' ? v : (v === undefined || v === null ? '' : String(v));
}

function unescapeNewlines(s) {
	// Convert double-escaped newlines ("\\n") into actual newlines ("\n")
	// Also normalize CRLF to LF
	if (!s) return s;
	return s.replace(/\\n/g, '\n').replace(/\r\n/g, '\n');
}

function parseIfPossible(raw) {
	// raw may be a JSON string or an object already
	if (typeof raw === 'string') {
		try {
			return JSON.parse(raw);
		} catch (e) {
			// not JSON; keep as text
			return { subject: '', body: raw };
		}
	}
	return raw || {};
}

function normalizeAiEmail(raw) {
	// raw: API response (string or object)
	const obj = parseIfPossible(raw);
	const out = {};
	out.subject = ensureString(obj.subject || obj.email_subject || '');
	out.body = ensureString(obj.body || obj.email_body || '');
	// unescape any double-escaped newline sequences
	out.subject = unescapeNewlines(out.subject);
	out.body = unescapeNewlines(out.body);
	return out;
}

module.exports = {
	normalizeAiEmail,
	// ...existing exports...
};