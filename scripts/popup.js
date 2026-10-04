window.addEventListener("load", loadSettings, false);
window.addEventListener("blur", saveSettings, false);

function loadSettings() {
	document.getElementById("save").addEventListener("click", saveSettings, false);
	chrome.storage.sync.get('settings', function (data) {
		var settings = settingsWithDefaults(data?.settings);
		document.getElementById("theme").value = settings.theme;
		document.getElementById("fontFamily").value = settings.fontFamily;
		document.getElementById("fontSize").value = settings.fontSize;
		document.getElementById("fontWeight").value = settings.fontWeight;
		document.getElementById("fontLigatures").value = settings.fontLigatures;
		document.getElementById("lineNumbers").checked = settings.lineNumbers;
		document.getElementById("foldingMaximumRegions").value = settings.foldingMaximumRegions;
		document.getElementById("readOnly").checked = settings.readOnly;
		document.getElementById("formatOnLoad").checked = settings.formatOnLoad;
		document.getElementById("contentTypes").value = settings.contentTypes;
		savedSettings = JSON.stringify(getSettings());
	});
}

// Form contents as last loaded or saved; undefined until loaded, so an early blur cannot save an empty form.
var savedSettings;

function saveSettings() {
	var settings = getSettings();
	if (savedSettings === undefined || JSON.stringify(settings) === savedSettings)
		return;
	savedSettings = JSON.stringify(settings);
	// Open viewers pick up the change through chrome.storage.onChanged (monaco.js).
	chrome.storage.sync.set(settings);
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
			contentTypes: parseContentTypes(document.getElementById("contentTypes").value).join('\n'),
		}
	};
}

