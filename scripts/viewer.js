var $monacoViewer;

chrome.runtime.onMessage.addListener((m, s, r) => {
	//debugger;
	if (s && s.id === chrome.runtime.id && $monacoViewer) {
		if (m.settings)
			$monacoViewer.postMessage({ update: m.settings }, "*");
	}
	return true;
});

//TODO: attach viewer based on contentType or extension, not on all documents having a single pre inside body
//TODO: attach viewer on document start and render progressively
//debugger;
if (document.querySelector("body>pre")) {
	if (!document.querySelectorAll("body>*:not(pre):not(.json-formatter-container), body>*>*").length) {

		var stylesheet = document.createElement("link");
		stylesheet.rel = "stylesheet";
		stylesheet.href = chrome.runtime.getURL("resources/viewer.css")
		document.head.appendChild(stylesheet);

		var frame = document.createElement("iframe");
		frame.title = "Monaco Viewer";
		frame.src = chrome.runtime.getURL("viewer.html");
		document.body.appendChild(frame);
		$monacoViewer = frame.contentWindow;

		var tlb = document.createElement("nav");
		createButton(tlb, 'data_object', "Format document (Alt+Shift+F)", ["$formatDocument()"]);
		createButton(tlb, "unfold_less_double", "Fold all (Ctrl+K, Ctrl+0)", ["editor.foldAll"]);
		createButton(tlb, "collapse_content", "Fold recursively (Ctrl+K, Ctrl+[)", ["editor.foldRecursively"]);
		createButton(tlb, "unfold_less", "Fold (Ctrl+Shift+[)", ["editor.fold"]);
		createButton(tlb, "unfold_more", "Unfold (Ctrl+K,Ctrl+])", ["editor.foldRecursively", "editor.unfold"]);
		createButton(tlb, "expand_content", "Unfold recursively (Ctrl+K, Ctrl+])", ["editor.unfoldRecursively"]);
		createButton(tlb, "unfold_more_double", "Unfold all (Ctrl+K, Ctrl+J)", ["editor.unfoldAll"]);
		createButton(tlb);
		createButton(tlb, "expand_less<sub>0</sub>", "Fold other levels (Ctrl+K, Ctrl+O)", ["$foldOtherLevels()"]);
		createButton(tlb, "expand_less<sub>2</sub>", "Fold level 2 (Ctrl+K, Ctrl+2)", ["$unfold(2)"]);
		createButton(tlb, "expand_less<sub>3</sub>", "Fold level 3 (Ctrl+K, Ctrl+2)", ["$unfold(3)"]);
		createButton(tlb, "expand_less<sub>4</sub>", "Fold level 4 (Ctrl+K, Ctrl+4)", ["$unfold(4)"]);
		createButton(tlb, "expand_less<sub>5</sub>", "Fold level 5 (Ctrl+K, Ctrl+5)", ["$unfold(5)"]);
		createButton(tlb, "expand_less<sub>6</sub>", "Fold level 6 (Ctrl+K, Ctrl+6)", ["$unfold(6)"]);
		createButton(tlb, "expand_less<sub>7</sub>", "Fold level 7 (Ctrl+K, Ctrl+7)", ["$unfold(7)"]);
		//createButton(tlb, "&#xEAE9;", "Fold block comments (Ctrl+K, Ctrl+9)", ["editor.unfoldAllRegions", "editor.foldLevel7"]);
		createButton(tlb);
		createButton(tlb, "code_blocks", "Select to bracket (Ctrl+B, Ctrl+S)", ["editor.action.selectToBracket"]);
		createButton(tlb, "swap_horiz", "Jump to matching bracket (Ctrl+Shift+\\)", ["editor.action.jumpToBracket"]);
		createButton(tlb, "zoom_in_map", "Collapse object (Alt+J)", ["$joinSelection()"]);
		createButton(tlb);
		createButton(tlb, "join", "Join lines (Ctrl+J)", ["$joinLines()"]);
		createButton(tlb, "arrow_downward_alt", "Sort lines ascending", ["editor.action.sortLinesAscending"]);
		createButton(tlb, "arrow_upward_alt", "Sort lines descending", ["editor.action.sortLinesDescending"]);
		createButton(tlb, "wrap_text", "Toggle wrap (Alt+Z)", ["$toggleWrap()"]);
		createButton(tlb);
		createButton(tlb, "U", "Unescape (Ctrl+Alt+;)", ["$unescapeSelection()"]);
		createButton(tlb, "E", "Escape (Ctrl+Alt+\'')", ["$escapeSelection()"]);
		document.body.appendChild(tlb);

		window.addEventListener("message", msg => {
			if (msg && msg.data && msg.data.ready) {
				$monacoViewer.postMessage({
					text: document.querySelector("body>pre").innerText,
					contentType: document.contentType.toLowerCase(),
					extension: "." + document.location.pathname.split('.').pop(),
					settings: localStorage.getItem("settings")
				}, "*");
			}
		}, false);
	}
}

function createButton(tlb, label, title, actions) {
	if (label) {
		const button = document.createElement("button");
		button.innerHTML = label;
		button.title = title;
		button.onclick = function (ev) {
			$monacoViewer.postMessage({ actions: actions }, "*");
			$monacoViewer.focus();
		};
		tlb.appendChild(button);
	} else {
		tlb.appendChild(document.createElement('hr'));
	}
}


