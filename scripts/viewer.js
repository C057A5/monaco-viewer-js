var $monacoViewer;

chrome.runtime.onMessage.addListener((m, s, r) => {
	if (s && s.id === chrome.runtime.id && $monacoViewer) {
		if (m.settings)
			$monacoViewer.postMessage({ update: m.settings }, "*");
	}
	return true;
});

//TODO: attach viewer based on contentType or extension, not on all documents having a single pre inside body
//TODO: attach viewer on document start and render progressively

if (document.querySelector("body>pre")) {
	if (!document.querySelectorAll("body>*:not(pre), body>*>*").length) {

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
		createButton(tlb, "&#xEA8B;", "Format document (Alt+Shift+F)", ["$formatDocument()"]);
		createButton(tlb, "&#xEAF4;", "Fold all (Ctrl+K, Ctrl+0)", ["editor.foldAll"]);
		createButton(tlb, "&#xEAB7;", "Fold recursively (Ctrl+K, Ctrl+[)", ["editor.foldRecursively"]);
		createButton(tlb, "&#xEAB5;", "Fold (Ctrl+Shift+[)", ["editor.fold"]);
		createButton(tlb, "&#xEAB6;", "Unfold (Ctrl+K,Ctrl+])", ["editor.foldRecursively", "editor.unfold"]);
		createButton(tlb, "&#xEAB4;", "Unfold recursively (Ctrl+K, Ctrl+])", ["editor.unfoldRecursively"]);
		createButton(tlb, "&#xEAF3;", "Unfold all (Ctrl+K, Ctrl+J)", ["editor.unfoldAll"]);
		createButton(tlb);
		createButton(tlb, "&#xEAB5<span>O</span>", "Fold other levels (Ctrl+K, Ctrl+O)", ["$foldOtherLevels()"]);
		createButton(tlb, "&#xEAB5<span>2</span>", "Fold level 2 (Ctrl+K, Ctrl+2)", ["$unfold(2)"]);
		createButton(tlb, "&#xEAB5<span>3</span>", "Fold level 3 (Ctrl+K, Ctrl+2)", ["$unfold(3)"]);
		createButton(tlb, "&#xEAB5<span>4</span>", "Fold level 4 (Ctrl+K, Ctrl+4)", ["$unfold(4)"]);
		createButton(tlb, "&#xEAB5<span>5</span>", "Fold level 5 (Ctrl+K, Ctrl+5)", ["$unfold(5)"]);
		createButton(tlb, "&#xEAB5<span>6</span>", "Fold level 6 (Ctrl+K, Ctrl+6)", ["$unfold(6)"]);
		createButton(tlb, "&#xEAB5<span>7</span>", "Fold level 7 (Ctrl+K, Ctrl+7)", ["$unfold(7)"]);
		//createButton(tlb, "&#xEAE9;", "Fold block comments (Ctrl+K, Ctrl+9)", ["editor.unfoldAllRegions", "editor.foldLevel7"]);
		createButton(tlb);
		createButton(tlb, "&#xEA92;", "Select to bracket (Ctrl+B, Ctrl+S)", ["editor.action.selectToBracket"]);
		createButton(tlb, "&#xEBCB;", "Jump to matching bracket (Ctrl+Shift+\\)", ["editor.action.jumpToBracket"]);
		createButton(tlb, "⟫⟪", "Collapse object (Alt+J)", ["$joinSelection()"]);
		createButton(tlb);
		createButton(tlb, "&#xEAF5;", "Join lines (Ctrl+J)", ["$joinLines()"]);
		createButton(tlb, "&#xEAA1;", "Sort lines ascending", ["editor.action.sortLinesAscending"]);
		createButton(tlb, "&#xEA9A;", "Sort lines descending", ["editor.action.sortLinesDescending"]);
		createButton(tlb, "&#xEB80;", "Toggle wrap (Alt+Z)", ["$toggleWrap()"]);
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


