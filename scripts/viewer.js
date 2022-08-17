var toolbar, viewer;

if (document.querySelector("body>pre")) {
	if (!document.querySelectorAll("body>*:not(pre), body>*>*").length) {
		createStylesheet();
		createViewer();
		createToolbar();
		window.addEventListener("message", onmessage, false);
	}
}

function onmessage(msg) {
	console.log(msg);
	if (msg && msg.data && msg.data.ready) {
		viewer.postMessage({
			text: document.querySelector("body>pre").innerText,
			contentType: document.contentType.toLowerCase(),
			extension: "." + document.location.pathname.split('.').pop()
		}, "*");
	}
}

function createStylesheet() {
	var stylesheet = document.createElement("link");
	stylesheet.rel = "stylesheet";
	stylesheet.href = chrome.runtime.getURL("resources/viewer.css")
	document.head.appendChild(stylesheet);
}

function createToolbar() {
	toolbar = document.createElement("nav");
	createButton("", "Format document (Alt+Shift+F)", ["editor.action.formatDocument"]);
	createButton("", "Fold all (Ctrl+K, Ctrl+0)", ["editor.foldAll"]);
	createButton("", "Fold recursively (Ctrl+K, Ctrl+[)", ["editor.foldRecursively"]);
	createButton("", "Fold (Ctrl+Shift+[)", ["editor.fold"]);
	createButton("", "Unfold (Ctrl+K,Ctrl+])", ["editor.foldRecursively", "editor.unfold"]);
	createButton("", "Unfold recursively (Ctrl+K, Ctrl+])", ["editor.unfoldRecursively"]);
	createButton("", "Unfold all (Ctrl+K, Ctrl+J)", ["editor.unfoldAll"]);
	createButton();
	createButton("<span>2</span>", "Fold level 2 (Ctrl+K, Ctrl+2)", ["editor.unfoldRecursively", "editor.foldLevel2"]);
	createButton("<span>3</span>", "Fold level 3 (Ctrl+K, Ctrl+3)", ["editor.unfoldRecursively", "editor.foldLevel3"]);
	createButton("<span>4</span>", "Fold level 4 (Ctrl+K, Ctrl+4)", ["editor.unfoldRecursively", "editor.foldLevel4"]);
	createButton("<span>5</span>", "Fold level 5 (Ctrl+K, Ctrl+5)", ["editor.unfoldRecursively", "editor.foldLevel5"]);
	createButton("<span>6</span>", "Fold level 6 (Ctrl+K, Ctrl+6)", ["editor.unfoldRecursively", "editor.foldLevel6"]);
	createButton("<span>7</span>", "Fold level 7 (Ctrl+K, Ctrl+7)", ["editor.unfoldRecursively", "editor.foldLevel7"]);
	// createButton("", "Fold block comments (Ctrl+K, Ctrl+9)", ["editor.unfoldAllRegions", "editor.foldLevel7"]);
	// createButton();
	// createButton("", "Select to bracket (Ctrl+B, Ctrl+S)", ["editor.action.selectToBracket"]);
	// createButton("", "Jump to matching bracket (Ctrl+Shift+\\)", ["editor.action.jumpToBracket"]);
	createButton();
	createButton("", "Join lines (Ctrl+J)", ["editor.action.joinLines"]);
	createButton("", "Sort lines ascending", ["editor.action.sortLinesAscending"]);
	createButton("", "Sort lines descending", ["editor.action.sortLinesDescending"]);
	document.body.appendChild(toolbar);
}

function createButton(label, title, actions) {
	if (label) {
		const button = document.createElement("button");
		button.innerHTML = label;
		button.title = title;
		button.onclick = function (ev) {
			viewer.postMessage({ actions: actions }, "*");
			viewer.focus();
		};
		toolbar.appendChild(button);
	} else {
		toolbar.appendChild(document.createElement('hr'));
	}
}

function createViewer() {
	var frame = document.createElement("iframe");
	frame.title = "viewer";
	frame.src = chrome.runtime.getURL("viewer.html");
	document.body.appendChild(frame);
	viewer = frame.contentWindow;
}
