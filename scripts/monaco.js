var instance;

window.addEventListener("message", onmessage, false);
require.config({ paths: { vs: 'node_modules/monaco-editor/min/vs' } });
require(['vs/editor/editor.main'], function () {
	window.frames[0].postMessage({} , "*");
});


async function onmessage(msg) {
	if (msg && msg.data) {

		if (msg.data.settings) {
			console.log(msg);
			instance = monaco.editor.create(
				document.querySelector("main"),
				{
					automaticLayout: true,
					fontFamily: msg.data.settings.fontFamily,
					fontSize: msg.data.settings.fontSize,
					fontWeight: msg.data.settings.fontWeight,
					fontLigatures: msg.data.settings.fontLigatures,
					lineNumbers: msg.data.settings.lineNumbers,
					wordWrap: msg.data.settings.wordWrap,
					readOnly: false,
					scrollBeyondLastLine: false,
					mouseWheelZoom: true,
					showFoldingControls: "always",
					theme: msg.data.settings.theme
				}
			);

			window.addEventListener("resize", () => instance.layout(), false);

			instance.addCommand(
				monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyJ,
				async () => await instance.getAction('editor.action.joinLines').run()
			);

			instance.addCommand(
				monaco.KeyMod.chord(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS),
				async () => await instance.getAction('editor.action.selectToBracket').run()
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
			monaco.editor.setModelLanguage(model, lang?.id);
			await model.setValue(msg.data.text);
			setTimeout(async function () {
				instance.focus();
				await instance.getAction('editor.action.formatDocument').run();
				await instance.getAction('editor.foldRecursively').run();
				await instance.getAction('editor.unfold').run();
				instance.focus();
			}, 10);
		}

		if (instance) {
			instance.focus();
			msg.data.actions?.forEach(a => instance.getAction(a)?.run());
			if (msg.data.options)
				instance.updateOptions(msg.data.options);
		}
	}
}

