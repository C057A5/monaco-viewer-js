var instance;
var formatOnLoad = true;

window.addEventListener("message", onmessage, false);
require.config({ paths: { vs: 'node_modules/monaco-editor/min/vs' } });
require(['vs/editor/editor.main'], function () {
	registerXmlFormatter();
	window.frames[0].postMessage({}, "*");
});

// Monaco has no xml formatter: re-indent the markup, keeping text-only elements on one line.
function registerXmlFormatter() {
	const indentOf = options => options.insertSpaces ? ' '.repeat(options.tabSize) : '\t';
	monaco.languages.registerDocumentFormattingEditProvider('xml', {
		provideDocumentFormattingEdits: (model, options) => [{
			range: model.getFullModelRange(),
			text: formatXml(model.getValue(), indentOf(options), model.getEOL())
		}]
	});
	monaco.languages.registerDocumentRangeFormattingEditProvider('xml', {
		provideDocumentRangeFormattingEdits: (model, range, options) => {
			range = new monaco.Range(range.startLineNumber, 1, range.endLineNumber, model.getLineMaxColumn(range.endLineNumber));
			const base = model.getLineContent(range.startLineNumber).match(/^\s*/)[0];
			return [{ range: range, text: formatXml(model.getValueInRange(range), indentOf(options), model.getEOL(), base) }];
		}
	});
}

function formatXml(text, indent, eol, base = '') {
	// The last alternative keeps malformed input (e.g. a stray '<') instead of dropping it.
	const tokens = text.match(/<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<!DOCTYPE(?:[^\[>]|\[[\s\S]*?\])*>|<(?:"[^"]*"|'[^']*'|[^'">])*>|[^<]+|[\s\S]/gi) || [];
	const isOpen = t => /^<[^!?\/]/.test(t) && !t.endsWith('/>');
	const isText = t => !t?.startsWith('<');
	const isClose = t => t?.startsWith('</');
	const lines = [];
	let depth = 0;
	const add = line => lines.push(base + indent.repeat(depth) + line);
	for (let i = 0; i < tokens.length; i++) {
		const t = tokens[i];
		if (isText(t)) {
			if (t.trim()) add(t.trim());
		} else if (isClose(t)) {
			depth = Math.max(depth - 1, 0);
			add(t);
		} else if (isOpen(t) && isClose(tokens[i + 1])) {
			add(t + tokens[++i]);
		} else if (isOpen(t) && isText(tokens[i + 1]) && isClose(tokens[i + 2])) {
			add(t + tokens[i + 1].trim() + tokens[i + 2]);
			i += 2;
		} else {
			add(t);
			if (isOpen(t)) depth++;
		}
	}
	return lines.join(eol);
}


async function onmessage(msg) {
	if (msg && msg.data) {
		if (msg.data.settings) {

			formatOnLoad = msg.data.settings.formatOnLoad;

			await monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
				comments: 'ignore',
				trailingCommas: 'error'
			});
			instance = await monaco.editor.create(
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
					unicodeHighlight: { ambiguousCharacters: false },
				}
			);

			window.addEventListener("resize", () => instance.layout(), false);

			await instance.addCommand(monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, $formatDocument);
			await instance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyJ, $joinLines);
			await instance.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.KeyJ, $joinSelection);
			await instance.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.KeyF, $formatSelection);
			await instance.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.KeyO, $formatObject);
			await instance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, () => instance.getAction('actions.find').run());
			await instance.addCommand(monaco.KeyMod.chord(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS), () => instance.getAction('editor.action.selectToBracket').run());
			await instance.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.KeyZ, $toggleWrap);
			await instance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.Semicolon, $unescapeSelection);
			await instance.addCommand(monaco.KeyMod.chord(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.Quote), $escapeSelection);

			window.parent.postMessage({ ready: true }, "*");
		}

		if (msg.data.update && instance)
			await instance.updateOptions(msg.data.update);

		if (instance && msg.data.text) {
			var languages = monaco.languages.getLanguages();
			var lang =
				languages.find(l => l.mimetypes?.includes(msg.data.contentType)) ||
				// e.g. application/yaml -> yaml, application/rss+xml -> xml
				languages.find(l => l.id === msg.data.contentType?.replace(/^.*[\/+](x-)?/, '')) ||
				languages.find(l => l.extensions?.includes(msg.data.extension)) ||
				undefined;
			var model = await instance.getModel();
			await monaco.editor.setModelLanguage(model, lang?.id);
			window.parent.postMessage({ language: model.getLanguageId() }, "*");
			await model.setValue(msg.data.text)
			if (formatOnLoad) setTimeout(initDoc, 100);
		}

		if (instance) {
			await instance.focus();
			msg.data.actions?.forEach(async a => {
				var fun = a.replace(/^([^\(]+)(\((.*)\))?$/, '$1');
				var arg = a.replace(/^([^\(]+)\((.*)\)$/, '$2');
				if (fun.substring(0, 1) != "$")
					await instance.getAction(fun)?.run();
				else
					await window[fun](arg ? JSON.parse(arg) : undefined);
			});
		}
	}
}

async function initDoc() {
	try {
		await instance.focus();
		var rom = await instance.getOption(monaco.editor.EditorOption.readOnly);
		await instance.updateOptions({ readOnly: false });
		//await instance.getAction('editor.unfoldRecursively').run();
		await instance.getAction('editor.action.formatDocument').run();
		await instance.updateOptions({ readOnly: rom });
		await instance.getAction('editor.foldRecursively').run();
		await instance.getAction('editor.unfold').run();
		await instance.focus();
	} catch (error) {
	}
}

async function $toggleWrap() {
	try {
		await instance.updateOptions({ wordWrap: instance.getOption(monaco.editor.EditorOption.wordWrap) === "on" ? "off" : "on" });
	} catch (error) {
	}
}

async function $unescapeSelection() {
	var rom = await instance.getOption(monaco.editor.EditorOption.readOnly);
	await instance.updateOptions({ readOnly: false });
	try {
		var sel = await instance.getSelection();
		var cnt = await instance.getModel().getValueInRange(sel);
		if (!cnt) {
			var ss = await instance.getModel().findPreviousMatch(/(?<!\\)"/, sel.getStartPosition(), true)?.range;
			var es = await instance.getModel().findNextMatch(/(?<!\\)"/, sel.getStartPosition(), true)?.range;
			if (ss && es) {
				ss.endLineNumber = es.endLineNumber;
				ss.endColumn = es.endColumn;
				cnt = await instance.getModel().getValueInRange(ss);
				await instance.setSelection(ss);
			}
		}
		if (cnt) {
			var esc = null;
			try {
				esc = JSON.parse(cnt);
			} catch (error) {
			}
			if (typeof(esc) === 'string' && instance.getModel().getLanguageId() === 'json') {
				var obj = esc.trim();
				if (obj.substring(0, 1) === '{' && obj.slice(-1) === '}') {
					sel = await instance.getSelection();
					await instance.executeEdits("my-source", [{ identifier: { major: 1, minor: 1 }, range: sel, text: esc, forceMoveMarkers: true }]);
					await instance.getAction('editor.action.selectToBracket').run();
					await instance.getAction('editor.action.formatSelection').run();
					await instance.getAction('editor.action.jumpToBracket').run();
					await instance.getAction('editor.action.jumpToBracket').run();
				}
			}
		}
	} catch (error) {
	}
	await instance.updateOptions({ readOnly: rom });
}

async function $escapeSelection() {
	try {
		var rom = await instance.getOption(monaco.editor.EditorOption.readOnly);
		await instance.updateOptions({ readOnly: false });
		var sel = await instance.getSelection();
		var cnt = await instance.getModel().getValueInRange(sel);
		var esc = '"' + JSON.stringify(cnt).replace(/^"|"$/g, "") + '"';
		await instance.executeEdits("my-source", [{ identifier: { major: 1, minor: 1 }, range: sel, text: esc, forceMoveMarkers: true }]);
		await instance.updateOptions({ readOnly: rom });
	} catch (error) {
	}
}

async function $joinLines() {
	try {
		var rom = await instance.getOption(monaco.editor.EditorOption.readOnly);
		await instance.updateOptions({ readOnly: false });
		await instance.getAction('editor.action.joinLines').run();
		await instance.updateOptions({ readOnly: rom });
	} catch (error) {
	}
}

async function $joinSelection() {
	try {
		await instance.getAction('editor.action.selectToBracket').run();
		var model = await instance.getModel();
		if (model.getLanguageId() === 'json') {
			var sel = await model.getValueInRange(await instance.getSelection());
			if (sel.match(/^\s*\[.*\]\s*$/s)) {

			} else {
				await $joinLines();	
			}
		} else {
			await $joinLines();
		}
	} catch (error) {
	}
}

async function $formatDocument() {
	try {
		var rom = await instance.getOption(monaco.editor.EditorOption.readOnly);
		await instance.updateOptions({ readOnly: false });
		await instance.getAction('editor.action.formatDocument').run();
		await instance.updateOptions({ readOnly: rom });
	} catch (error) {
	}
}

async function $formatObject() {
	try {
		var rom = await instance.getOption(monaco.editor.EditorOption.readOnly);
		await instance.getAction('editor.action.selectToBracket').run();
		await instance.updateOptions({ readOnly: false });
		await instance.getAction('editor.action.formatSelection').run();
		await instance.getAction('editor.foldRecursively').run();
		await instance.getAction('editor.unfold').run();
		await instance.updateOptions({ readOnly: rom });
	} catch (error) {
	}
}

async function $formatSelection() {
	try {
		var rom = await instance.getOption(monaco.editor.EditorOption.readOnly);
		await instance.updateOptions({ readOnly: false });
		await instance.getAction('editor.action.formatSelection').run();
		await instance.getAction('editor.foldRecursively').run();
		await instance.getAction('editor.unfold').run();
		await instance.updateOptions({ readOnly: rom });
	} catch (error) {
	}
}

async function $goToTop() {
	try {
		await instance.setPosition({ column: 0, lineNumber: 0 });
		await instance.getAction('editor.foldRecursively').run();
	} catch (error) {
	}
}

async function $unfold(l) {
	try {
		await $goToTop();
		await instance.getAction('editor.unfoldRecursively').run();
		await instance.getAction(`editor.foldLevel${l}`).run();
	} catch (error) {
	}
}

async function $foldOtherLevels() {
	try {
		var pos = await instance.getPosition();
		await $goToTop();
		await instance.setPosition(pos);
	} catch (error) {
	}
}

