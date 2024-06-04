window.addEventListener("message", onmessage, false);
window.addEventListener("load", loadSettings, false);
window.addEventListener("blur", saveSettings, false);

function onmessage(msg) {
	var settings = getSettings();
	window.parent.postMessage(settings, "*");
}

function loadSettings() {
	document.getElementById("save").addEventListener("click", saveSettings, false);
	chrome.storage.sync.get('settings', function (data) {
		var settings = data && data.settings ? data.settings : {};
		if (!settings.theme) settings.theme = '';
		if (!settings.fontFamily) settings.fontFamily = 'monospace';
		if (!settings.fontSize) settings.fontSize = 12;
		if (!settings.fontWeight) settings.fontWeight = '400';
		if (!settings.fontLigatures) settings.fontLigatures = '';
		if (settings.lineNumbers === undefined) settings.lineNumbers = true;
		if (settings.readOnly === undefined) settings.readOnly = true;
		if (settings.formatOnLoad === undefined) settings.formatOnLoad = true;
		if (!settings.foldingMaximumRegions) settings.foldingMaximumRegions = 10000;
		document.getElementById("theme").value = settings.theme;
		document.getElementById("fontFamily").value = settings.fontFamily;
		document.getElementById("fontSize").value = settings.fontSize;
		document.getElementById("fontWeight").value = settings.fontWeight;
		document.getElementById("fontLigatures").value = settings.fontLigatures;
		document.getElementById("lineNumbers").checked = settings.lineNumbers;
		document.getElementById("foldingMaximumRegions").value = settings.foldingMaximumRegions;
		document.getElementById("readOnly").checked = settings.readOnly;
		document.getElementById("formatOnLoad").checked = settings.formatOnLoad;
		chrome.storage.sync.set({ settings: settings });
	});
}

function saveSettings() {
	var settings = getSettings();
	chrome.storage.sync.set(settings);
	chrome.tabs.query(
		{ discarded: false, status: 'complete' },
		tabs => tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, settings, null, r => chrome.runtime.lastError)));
}

function getSettings() {
	return {
		settings:
		{
			theme: document.getElementById("theme").value,
			fontFamily: document.getElementById("fontFamily").value,
			fontLigatures: document.getElementById("fontLigatures").value,
			fontSize: new Number(document.getElementById("fontSize").value).valueOf(),
			fontWeight: document.getElementById("fontWeight").value,
			lineNumbers: document.getElementById("lineNumbers").checked,
			readOnly: document.getElementById("readOnly").checked,
			formatOnLoad: document.getElementById("formatOnLoad").checked,
			foldingMaximumRegions: document.getElementById("foldingMaximumRegions").value,
		}
	};
}

