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
		createButton(tlb, "", "Format document (Alt+Shift+F)", ["editor.action.formatDocument"]);
		createButton(tlb, "", "Fold all (Ctrl+K, Ctrl+0)", ["editor.foldAll"]);
		createButton(tlb, "", "Fold recursively (Ctrl+K, Ctrl+[)", ["editor.foldRecursively"]);
		createButton(tlb, "", "Fold (Ctrl+Shift+[)", ["editor.fold"]);
		createButton(tlb, "", "Unfold (Ctrl+K,Ctrl+])", ["editor.foldRecursively", "editor.unfold"]);
		createButton(tlb, "", "Unfold recursively (Ctrl+K, Ctrl+])", ["editor.unfoldRecursively"]);
		createButton(tlb, "", "Unfold all (Ctrl+K, Ctrl+J)", ["editor.unfoldAll"]);
		createButton(tlb);
		createButton(tlb, "<span>2</span>", "Fold level 2 (Ctrl+K, Ctrl+2)", ["editor.unfoldRecursively", "editor.foldLevel2"]);
		createButton(tlb, "<span>3</span>", "Fold level 3 (Ctrl+K, Ctrl+3)", ["editor.unfoldRecursively", "editor.foldLevel3"]);
		createButton(tlb, "<span>4</span>", "Fold level 4 (Ctrl+K, Ctrl+4)", ["editor.unfoldRecursively", "editor.foldLevel4"]);
		createButton(tlb, "<span>5</span>", "Fold level 5 (Ctrl+K, Ctrl+5)", ["editor.unfoldRecursively", "editor.foldLevel5"]);
		createButton(tlb, "<span>6</span>", "Fold level 6 (Ctrl+K, Ctrl+6)", ["editor.unfoldRecursively", "editor.foldLevel6"]);
		createButton(tlb, "<span>7</span>", "Fold level 7 (Ctrl+K, Ctrl+7)", ["editor.unfoldRecursively", "editor.foldLevel7"]);
		createButton(tlb, "", "Fold block comments (Ctrl+K, Ctrl+9)", ["editor.unfoldAllRegions", "editor.foldLevel7"]);
		createButton(tlb);
		createButton(tlb, "", "Select to bracket (Ctrl+B, Ctrl+S)", ["editor.action.selectToBracket"]);
		createButton(tlb, "", "Jump to matching bracket (Ctrl+Shift+\\)", ["editor.action.jumpToBracket"]);
		createButton(tlb);
		createButton(tlb, "", "Join lines (Ctrl+J)", ["editor.action.joinLines"]);
		createButton(tlb, "", "Sort lines ascending", ["editor.action.sortLinesAscending"]);
		createButton(tlb, "", "Sort lines descending", ["editor.action.sortLinesDescending"]);
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

function createButton(tlb, label, title, actions, options) {
	if (label) {
		const button = document.createElement("button");
		button.innerHTML = label;
		button.title = title;
		button.onclick = function (ev) {
			$monacoViewer.postMessage({ actions: actions, options: options }, "*");
			$monacoViewer.focus();
		};
		tlb.appendChild(button);
	} else {
		tlb.appendChild(document.createElement('hr'));
	}
}


