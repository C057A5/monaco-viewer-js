// Shared by the content script (viewer.js), the settings page (popup.js), the editor (monaco.js)
// and the service worker (background.js).
// One content type per line.
const defaultContentTypes = [
	'text/plain',
	'application/json',
	'application/ld+json',
	'application/yaml',
	'application/x-yaml',
	'text/yaml',
	'text/javascript',
	'text/css',
].join('\n');

const defaultSettings = {
	theme: '',
	fontFamily: 'monospace',
	fontSize: 12,
	fontWeight: '400',
	fontLigatures: '',
	lineNumbers: true,
	readOnly: true,
	formatOnLoad: true,
	foldingMaximumRegions: 10000,
	contentTypes: defaultContentTypes,
};

// Booleans and the content types are replaced only when missing, other settings also when empty.
function settingsWithDefaults(settings) {
	const result = { ...settings };
	for (const [key, value] of Object.entries(defaultSettings))
		if (typeof value === 'boolean' || key === 'contentTypes' ? result[key] === undefined : !result[key])
			result[key] = value;
	return result;
}

function parseContentTypes(value) {
	return (value ?? defaultContentTypes).toLowerCase().split(/[;,\s]+/).filter(t => t);
}

// Listed types the browser would not render as plain text (downloads, xml/html documents) are rewritten by
// background.js to rewrittenTypePrefix + the type in hex, which viewer.js decodes. Hex, because '/' is not
// allowed in a subtype and a readable '+xml' suffix would make the browser render the document as xml again.
const rewrittenTypePrefix = 'text/x-monaco-viewer-';

// Rewritten documents are decoded with this charset, which maps every byte to a distinct character,
// so viewer.js can rebuild the original bytes and decode them with the document's actual encoding.
const rewrittenCharset = 'windows-1252';

function encodeContentType(type) {
	return [...type].map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
}

function decodeContentType(hex) {
	return hex.replace(/[0-9a-f]{2}/g, h => String.fromCharCode(parseInt(h, 16)));
}
