importScripts('defaults.js');

// The browser renders these as plain text by itself, keeping the server's charset.
const nativeTextTypes = /^(text\/(plain|javascript|css)|application\/(json|javascript|[^\/]+\+json))$/;

chrome.runtime.onInstalled.addListener(updateRules);
chrome.storage.onChanged.addListener((changes, area) => {
	if (area === 'sync' && changes.settings && changes.settings.oldValue?.contentTypes !== changes.settings.newValue?.contentTypes)
		updateRules();
});

// Serialized, so overlapping updates cannot conflict on rule ids.
let rulesUpdate = Promise.resolve();
function updateRules() {
	rulesUpdate = rulesUpdate.then(applyRules).catch(e => console.error('Monaco Viewer: updating rules failed', e));
	return rulesUpdate;
}

// Rewrite the response content-type of the listed types the browser would not render as plain text.
async function applyRules() {
	const data = await chrome.storage.sync.get('settings');
	const rules = parseContentTypes(data?.settings?.contentTypes)
		.map((type, index) => ({ type, index }))
		.filter(t => !nativeTextTypes.test(t.type))
		.map(t => ({
			id: t.index + 1,
			priority: 1,
			action: {
				type: 'modifyHeaders',
				responseHeaders: [
					{ header: 'content-type', operation: 'set', value: `${rewrittenTypePrefix}${encodeContentType(t.type)}; charset=utf-8` },
					{ header: 'content-disposition', operation: 'remove' }
				]
			},
			condition: {
				resourceTypes: ['main_frame'],
				responseHeaders: [{ header: 'content-type', values: [t.type, `${t.type};*`] }]
			}
		}));
	const existing = await chrome.declarativeNetRequest.getDynamicRules();
	await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: existing.map(r => r.id), addRules: rules });
}
