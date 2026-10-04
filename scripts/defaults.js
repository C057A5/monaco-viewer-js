// Shared by the content script (viewer.js), the settings page (popup.js) and the service worker (background.js).
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

// Listed types the browser would not render as plain text (downloads, xml/html documents) are rewritten by
// background.js to `${rewrittenTypePrefix}${index in list}`, which viewer.js maps back to the listed type.
const rewrittenTypePrefix = 'text/x-monaco-viewer-';

function parseContentTypes(value) {
	return (value ?? defaultContentTypes).toLowerCase().split(/[;,\s]+/).filter(t => t);
}
