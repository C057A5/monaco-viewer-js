var instance;
window.addEventListener("message", onmessage, false);
require.config({ paths: { vs: 'node_modules/monaco-editor/min/vs' } });
require(['vs/editor/editor.main'], function () {

	instance = monaco.editor.create(
		document.querySelector("div"),
		{
			automaticLayout: true,
			fontFamily: "Fira Code",
			lineNumbers: "on",
			fontLigatures: true,
			fontSize: 10,
			fontWeight: "500",
			readOnly: false,
			scrollBeyondLastLine: false,
			mouseWheelZoom: true,
			wordWrap: "off",
			showFoldingControls: "always"
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
});


async function onmessage(msg) {
	console.log(msg);
	if (msg && msg.data) {
		if (msg.data.text) {
			
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
			}, 50);
		}
		instance.focus();
		msg.data.actions?.forEach(a => instance.getAction(a)?.run());
	}
}