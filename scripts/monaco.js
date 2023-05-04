var instance;
var init = false;

window.addEventListener("message", onmessage, false);
require.config({ paths: { vs: 'node_modules/monaco-editor/min/vs' } });
require(['vs/editor/editor.main'], function () {
	window.frames[0].postMessage({}, "*");
});


async function onmessage(msg) {
	if (msg && msg.data) {
		if (msg.data.settings) {

			monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
				comments: 'ignore',
				trailingCommas: 'error'
			});
			instance = monaco.editor.create(
				document.querySelector("main"),
				{
					automaticLayout: true,
					foldingMaximumRegions: 20000,
					fontFamily: msg.data.settings.fontFamily,
					fontSize: msg.data.settings.fontSize,
					fontWeight: msg.data.settings.fontWeight,
					fontLigatures: /^\s*(true)?\s*$/ig.test(msg.data.settings.fontLigatures) ? true : msg.data.settings.fontLigatures,
					lineNumbers: msg.data.settings.lineNumbers,
					wordWrap: msg.data.settings.wordWrap,
					readOnly: false,
					scrollBeyondLastLine: false,
					mouseWheelZoom: true,
					showFoldingControls: "always",
					theme: msg.data.settings.theme,
					//value: msg.data.text,
				}
			);

			window.addEventListener("resize", () => instance.layout(), false);

			instance.addCommand(
				monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyJ, 
				() => instance.getAction('editor.action.joinLines').run()
			);

			instance.addCommand(
				monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, 
				() => instance.getAction('actions.find').run()
			);

			instance.addCommand(
				monaco.KeyMod.chord(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS),
				() => instance.getAction('editor.action.selectToBracket').run()
			);

			instance.addCommand(
				monaco.KeyMod.chord(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.Semicolon),
				() => {
					var sel = instance.getSelection();
					var cnt = instance.getModel().getValueInRange(sel);
					var esc = JSON.parse(cnt);
					instance.executeEdits("my-source", [{ identifier: { major: 1, minor: 1 }, range: sel, text: esc, forceMoveMarkers: true }]);
				}
			);

			instance.addCommand(
				monaco.KeyMod.chord(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.Quote),
				() => {
					var sel = instance.getSelection();
					var cnt = instance.getModel().getValueInRange(sel);
					var esc = JSON.parse(cnt);
					instance.executeEdits("my-source", [{ identifier: { major: 1, minor: 1 }, range: sel, text: JSON.stringify(JSON.stringify(esc)), forceMoveMarkers: true }]);
				}
			);

			window.parent.postMessage({ ready: true }, "*");
		}

		if (msg.data.update && instance) {
			instance.updateOptions(msg.data.update);
		}

		if (instance && msg.data.text) {
			var languages = monaco.languages.getLanguages();
			var lang =
				languages.find(l => l.mimetypes?.includes(msg.data.contentType)) ||
				languages.find(l => l.extensions.includes(msg.data.extension)) ||
				undefined;
			var model = instance.getModel();
			model.onDidChangeContent(() => {
				if (!init)
					setTimeout(async function () {
						await instance.focus();
						await instance.getAction('editor.action.formatDocument').run();
						await instance.getAction('editor.foldRecursively').run();
						await instance.getAction('editor.unfold').run();
						await instance.focus();
						init = true;
						}, 100);
			});
			monaco.editor.setModelLanguage(model, lang?.id);
			model.setValue(msg.data.text);
		}

		if (instance) {
			instance.focus();
			msg.data.actions?.forEach(a => instance.getAction(a)?.run());
			if (msg.data.options)
				instance.updateOptions(msg.data.options);
		}
	}
}

