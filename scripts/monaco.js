var instance;
var formatOnLoad = true;

window.addEventListener("message", onmessage, false);
require.config({ paths: { vs: 'node_modules/monaco-editor/min/vs' } });
require(['vs/editor/editor.main'], function () {
	window.frames[0].postMessage({}, "*");
});


async function onmessage(msg) {
	if (msg && msg.data) {
		if (msg.data.settings) {

			formatOnLoad = msg.data.settings.formatOnLoad;

			monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
				comments: 'ignore',
				trailingCommas: 'error'
			});
			instance = monaco.editor.create(
				document.querySelector("main"),
				{
					automaticLayout: true,
					foldingMaximumRegions: msg.data.settings.foldingMaximumRegions,
					fontFamily: msg.data.settings.fontFamily,
					fontSize: msg.data.settings.fontSize,
					fontWeight: msg.data.settings.fontWeight,
					fontLigatures: /^\s*(true)?\s*$/ig.test(msg.data.settings.fontLigatures) ? true : msg.data.settings.fontLigatures,
					lineNumbers: msg.data.settings.lineNumbers,
					wordWrap: "off",
					readOnly: msg.data.settings.readOnly,
					scrollBeyondLastLine: false,
					mouseWheelZoom: true,
					showFoldingControls: "always",
					theme: msg.data.settings.theme,
				}
			);

			window.addEventListener("resize", () => instance.layout(), false);

			instance.addCommand(monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, $formatDocument);
			instance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyJ, $joinLines);
			instance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, () => instance.getAction('actions.find').run());
			instance.addCommand(monaco.KeyMod.chord(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS), () => instance.getAction('editor.action.selectToBracket').run());
			instance.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.KeyZ, $toggleWrap);
			instance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.Semicolon, $unescape);
			instance.addCommand(monaco.KeyMod.chord(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.Quote), $escape);

			window.parent.postMessage({ ready: true }, "*");
		}

		if (msg.data.update && instance) instance.updateOptions(msg.data.update);

		if (instance && msg.data.text) {
			var languages = monaco.languages.getLanguages();
			var lang =
				languages.find(l => l.mimetypes?.includes(msg.data.contentType)) ||
				languages.find(l => l.extensions.includes(msg.data.extension)) ||
				undefined;
			var model = instance.getModel();
			monaco.editor.setModelLanguage(model, lang?.id);
			model.setValue(msg.data.text)
			if (formatOnLoad) setTimeout(initDoc, 100);
		}

		if (instance) {
			instance.focus();
			msg.data.actions?.forEach(a => {
				if (a.substring(0, 1) != "$")
					instance.getAction(a)?.run();
				else
					window[a]();
			});
		}
	}
}

function initDoc() {
	instance.focus();
	var rom = instance.getOption(monaco.editor.EditorOption.readOnly);
	instance.updateOptions({ readOnly: false });
	instance.getAction('editor.action.formatDocument').run()
		.then(() => {
			instance.updateOptions({ readOnly: rom });
			instance.getAction('editor.foldRecursively').run().then(() => instance.getAction('editor.unfold').run());
		});
}

function $toggleWrap() {
	instance.updateOptions({ wordWrap: instance.getOption(monaco.editor.EditorOption.wordWrap) === "on" ? "off" : "on" });
}

function $unescape() {
	var rom = instance.getOption(monaco.editor.EditorOption.readOnly);
	instance.updateOptions({ readOnly: false });
	var sel = instance.getSelection();
	var cnt = instance.getModel().getValueInRange(sel);
	var esc = JSON.parse(cnt);
	instance.executeEdits("my-source", [{ identifier: { major: 1, minor: 1 }, range: sel, text: esc, forceMoveMarkers: true }]);
	instance.updateOptions({ readOnly: rom });
}

function $escape() {
	var rom = instance.getOption(monaco.editor.EditorOption.readOnly);
	instance.updateOptions({ readOnly: false });
	var sel = instance.getSelection();
	var cnt = instance.getModel().getValueInRange(sel);
	var esc = JSON.parse(cnt);
	instance.executeEdits("my-source", [{ identifier: { major: 1, minor: 1 }, range: sel, text: JSON.stringify(JSON.stringify(esc)), forceMoveMarkers: true }]);
	instance.updateOptions({ readOnly: rom });
}

function $joinLines() {
	var rom = instance.getOption(monaco.editor.EditorOption.readOnly);
	instance.updateOptions({ readOnly: false });
	instance.getAction('editor.action.joinLines').run()
		.then(() => instance.updateOptions({ readOnly: rom }));
}

function $formatDocument() {
	var rom = instance.getOption(monaco.editor.EditorOption.readOnly);
	instance.updateOptions({ readOnly: false });
	instance.getAction('editor.action.formatDocument').run()
		.then(() => instance.updateOptions({ readOnly: rom }));
}

