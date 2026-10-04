// Content types are configured in the settings page (see defaults.js).
// Only attach to documents the browser rendered as plain text (body>pre), never to html or xml documents;
// other listed types are rewritten to plain text by background.js.

let $monacoViewer;
const viewerOrigin = new URL(chrome.runtime.getURL("")).origin;
const bracketlessLanguages = ['xml', 'yaml'];

//TODO: attach viewer on document start and render progressively

chrome.storage.sync.get('settings', data => {
	const contentTypes = parseContentTypes(data?.settings?.contentTypes);
	let contentType = document.contentType?.toLowerCase();
	const rewritten = contentType?.startsWith(rewrittenTypePrefix);
	if (rewritten)
		contentType = decodeContentType(contentType.substring(rewrittenTypePrefix.length));
	if (contentTypes.includes(contentType) && document.querySelector("body>pre"))
		attachViewer(contentType, rewritten);
});

// Rewritten documents are decoded as rewrittenCharset (unless the browser found a BOM): rebuild the original
// bytes and decode them with the encoding of the xml declaration, or utf-8 (the default of xml, yaml and json).
function redecode(text) {
	const decoder = new TextDecoder(rewrittenCharset);
	const byteOf = new Uint8Array(0x10000).fill(0x3f); // '?' for characters no byte decodes to (e.g. a NUL turned into U+FFFD)
	for (let b = 0; b < 256; b++)
		byteOf[decoder.decode(new Uint8Array([b])).charCodeAt(0)] = b;
	const bytes = new Uint8Array(text.length);
	for (let i = 0; i < text.length; i++)
		bytes[i] = byteOf[text.charCodeAt(i)];
	const declared = /^\s*<\?xml[^>]*?\sencoding\s*=\s*["']([^"']+)["']/.exec(decoder.decode(bytes.subarray(0, 256)))?.[1];
	try {
		return new TextDecoder(declared || 'utf-8').decode(bytes);
	} catch {
		return new TextDecoder('utf-8').decode(bytes); // unknown encoding label
	}
}

function attachViewer(contentType, rewritten) {
	const pre = document.querySelector("body>pre");
	const text = rewritten && document.characterSet.toLowerCase() === rewrittenCharset ? redecode(pre.textContent) : pre.textContent;

	var stylesheet = document.createElement("link");
	stylesheet.rel = "stylesheet";
	stylesheet.href = chrome.runtime.getURL("resources/viewer.css");
	document.head.appendChild(stylesheet);

	var frame = document.createElement("iframe");
	frame.title = "Monaco Viewer";
	frame.src = chrome.runtime.getURL("viewer.html");
	document.body.appendChild(frame);
	$monacoViewer = frame.contentWindow;

	var tlb = document.createElement("nav");
	createButton(tlb, 'data_object', "Format document (Alt+Shift+F)", ["$formatDocument()"]);
	createButton(tlb, "unfold_less_double", "Fold all (Ctrl+K, Ctrl+0)", ["editor.foldAll", "editor.unfold"]);
	createButton(tlb, "collapse_all", "Fold recursively (Ctrl+K, Ctrl+[)", ["editor.foldRecursively"]);
	createButton(tlb, "unfold_less", "Fold (Ctrl+Shift+[)", ["editor.fold"]);
	createButton(tlb, "unfold_more", "Unfold (Ctrl+Shift+])", ["editor.foldRecursively", "editor.unfold"]);
	createButton(tlb, "expand_all", "Unfold recursively (Ctrl+K, Ctrl+])", ["editor.unfoldRecursively"]);
	createButton(tlb, "unfold_more_double", "Unfold all (Ctrl+K, Ctrl+J)", ["editor.unfoldAll"]);
	createButton(tlb);
	createButton(tlb, "expand_less<sub>0</sub>", "Fold other levels", ["$foldOtherLevels()"]);
	createButton(tlb, "expand_less<sub>2</sub>", "Fold level 2 (Ctrl+K, Ctrl+2)", ["$unfold(2)"]);
	createButton(tlb, "expand_less<sub>3</sub>", "Fold level 3 (Ctrl+K, Ctrl+3)", ["$unfold(3)"]);
	createButton(tlb, "expand_less<sub>4</sub>", "Fold level 4 (Ctrl+K, Ctrl+4)", ["$unfold(4)"]);
	createButton(tlb, "expand_less<sub>5</sub>", "Fold level 5 (Ctrl+K, Ctrl+5)", ["$unfold(5)"]);
	createButton(tlb, "expand_less<sub>6</sub>", "Fold level 6 (Ctrl+K, Ctrl+6)", ["$unfold(6)"]);
	createButton(tlb, "expand_less<sub>7</sub>", "Fold level 7 (Ctrl+K, Ctrl+7)", ["$unfold(7)"]);
	//createButton(tlb, "&#xEAE9;", "Fold block comments (Ctrl+K, Ctrl+9)", ["editor.unfoldAllRegions", "editor.foldLevel7"]);
	// Bracket/object commands, hidden for languages without bracketed objects (see bracketlessLanguages).
	const bracketCommands = [
		createButton(tlb),
		createButton(tlb, "code_blocks", "Select to bracket (Ctrl+B, Ctrl+S)", ["editor.action.selectToBracket"]),
		createButton(tlb, "swap_horiz", "Jump to matching bracket (Ctrl+Shift+\\)", ["editor.action.jumpToBracket"]),
		createButton(tlb, "zoom_in_map", "Collapse object (Alt+J)", ["$joinSelection()"]),
		createButton(tlb, "collapse_content", "Shrink selection (Alt + Shift + ⬅️)", ["editor.action.smartSelect.shrink"]),
		createButton(tlb, "expand_content", "Expand selection (Alt + Shift + ➡️)", ["editor.action.smartSelect.expand"]),
		createButton(tlb, "data_object<span class=\"sel\">select</span>", "Format object (Alt+O)", ["$formatObject()"]),
	];
	createButton(tlb);
	createButton(tlb, "join", "Join lines (Ctrl+J)", ["$joinLines()"]);
	createButton(tlb, "arrow_downward_alt", "Sort lines ascending", ["editor.action.sortLinesAscending"]);
	createButton(tlb, "arrow_upward_alt", "Sort lines descending", ["editor.action.sortLinesDescending"]);
	createButton(tlb, "wrap_text", "Toggle wrap (Alt+Z)", ["$toggleWrap()"]);
	// String escape commands, hidden like the bracket commands.
	bracketCommands.push(
		createButton(tlb),
		createButton(tlb, "U", "Unescape (Ctrl+Alt+;)", ["$unescapeSelection()"]),
		createButton(tlb, "E", "Escape (Ctrl+Alt+')", ["$escapeSelection()"]),
	);
	document.body.appendChild(tlb);

	// Messages from the viewer frame only, not from the page's scripts.
	window.addEventListener("message", msg => {
		if (!msg || !msg.data || msg.source !== $monacoViewer)
			return;
		if (msg.data.ready) {
			const fileName = document.location.pathname.split('/').pop();
			$monacoViewer.postMessage({
				text: text,
				contentType: contentType,
				extension: fileName.includes('.') ? "." + fileName.split('.').pop() : undefined,
			}, viewerOrigin);
		}
		if (msg.data.language !== undefined)
			bracketCommands.forEach(b => b.hidden = bracketlessLanguages.includes(msg.data.language));
	}, false);

}

function createButton(tlb, label, title, actions) {
	if (label) {
		const button = document.createElement("button");
		button.innerHTML = label;
		button.title = title;
		button.onclick = function (ev) {
			$monacoViewer.postMessage({ actions: actions }, viewerOrigin);
			$monacoViewer.focus();
		};
		return tlb.appendChild(button);
	} else {
		return tlb.appendChild(document.createElement('hr'));
	}
}


