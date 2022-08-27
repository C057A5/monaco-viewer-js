window.addEventListener("message", onmessage, false);
window.addEventListener("load", loadSettings, false);
window.addEventListener("blur", saveSettings, false);

function onmessage(msg) {
	console.log({ popup_js: msg });
	var settings = getSettings();
	window.parent.postMessage(settings, "*");
}

function loadSettings() {
	document.getElementById("save").addEventListener("click", saveSettings, false);
	chrome.storage.sync.get('settings', function (data) {
		var settings = data && data.settings ? data.settings : {};
		if (!settings.theme) settings.theme = '';
		if (!settings.fontFamily) settings.fontFamily = 'Consolas';
		if (!settings.fontSize) settings.fontSize = 12;
		if (!settings.fontWeight) settings.fontWeight = '400';
		if (!settings.fontLigatures) settings.fontLigatures = true;
		if (!settings.lineNumbers) settings.lineNumbers = true;
		if (!settings.wordWrap) settings.wordWrap = false;
		document.getElementById("theme").value = settings.theme;
		document.getElementById("fontFamily").value = settings.fontFamily;
		document.getElementById("fontSize").value = settings.fontSize;
		document.getElementById("fontWeight").value = settings.fontWeight;
		document.getElementById("fontLigatures").checked = settings.fontLigatures;
		document.getElementById("lineNumbers").checked = settings.lineNumbers;
		document.getElementById("wordWrap").checked = settings.wordWrap;
		chrome.storage.sync.set({ settings: settings });
	});
}

function saveSettings() {
	var settings = getSettings();
	console.log(settings);
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
			fontSize: new Number(document.getElementById("fontSize").value).valueOf(),
			fontWeight: document.getElementById("fontWeight").value,
			fontLigatures: document.getElementById("fontLigatures").checked,
			lineNumbers: document.getElementById("lineNumbers").checked,
			wordWrap: document.getElementById("wordWrap").checked,
		}
	};
}

